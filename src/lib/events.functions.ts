import { randomUUID } from "node:crypto";
import {
  BlobError,
  BlobPreconditionFailedError,
  get as getBlob,
  put as putBlob,
} from "@vercel/blob";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import catalog from "../../data/events.json";
import { currentUser, getDatabase, requireCurrentUser } from "./local-db.server";
import type { EventRow } from "./local-types";

const planSchema = z.object({
  theme: z.string(),
  people: z.string(),
  venue: z.string(),
  activities: z.string(),
  decoration: z.string(),
  budget: z.string(),
});

const eventSchema = z.object({
  name: z.string().trim().min(1).max(200),
  description: z.string().max(2000),
  event_type: z.string().max(200),
  budget: z.string().max(100),
  attendees: z.number().int().min(0).max(1_000_000),
  location: z.string().max(300),
  event_time: z.string().datetime(),
  duration_hours: z.number().min(0).max(1000),
  catering: z.boolean(),
  image_url: z.string().max(2_000_000).nullable(),
  ai_plan: planSchema.nullable(),
});

const createEventSchema = eventSchema.extend({
  ownerKey: z.string().uuid().optional(),
});

const filterSchema = z.object({
  createdBy: z.string().uuid().optional(),
  registeredBy: z.string().uuid().optional(),
  hasRegistrations: z.boolean().optional(),
  ownerKey: z.string().uuid().optional(),
});

const catalogEventSchema = eventSchema.extend({
  id: z.string().uuid(),
  created_by: z.string().uuid(),
  creator: z.object({ full_name: z.string() }).nullable(),
  registrations: z.array(z.object({ user_id: z.string().uuid() })),
});

const BLOB_CATALOG_PATH = "eventify/events.json";
const MAX_CATALOG_EVENTS = 500;

function isLiveMode() {
  return process.env["NODE_ENV"] === "production" || !!process.env["VERCEL"];
}

function parseCatalog(value: unknown): EventRow[] {
  return z.array(catalogEventSchema).parse(value);
}

async function readLiveCatalog(): Promise<EventRow[]> {
  const blob = await getBlob(BLOB_CATALOG_PATH, { access: "private", useCache: false });
  if (!blob) return parseCatalog(catalog);
  return parseBlobCatalog(blob);
}

async function parseBlobCatalog(
  blob: NonNullable<Awaited<ReturnType<typeof getBlob>>>,
): Promise<EventRow[]> {
  if (blob.statusCode !== 200 || !blob.stream) {
    throw new Error("The shared event catalog could not be read.");
  }
  return parseCatalog(await new Response(blob.stream).json());
}

async function writeLiveEvent(
  data: z.infer<typeof eventSchema>,
  ownerKey: string,
): Promise<string> {
  const id = randomUUID();
  const event: EventRow = {
    ...data,
    id,
    created_by: ownerKey,
    creator: null,
    registrations: [],
  };

  for (let attempt = 0; attempt < 3; attempt += 1) {
    const blob = await getBlob(BLOB_CATALOG_PATH, { access: "private", useCache: false });
    const currentEvents = blob ? await parseBlobCatalog(blob) : parseCatalog(catalog);
    if (currentEvents.length >= MAX_CATALOG_EVENTS) {
      throw new Error(`The event catalog is full (maximum ${MAX_CATALOG_EVENTS} events).`);
    }

    try {
      await putBlob(BLOB_CATALOG_PATH, JSON.stringify([...currentEvents, event]), {
        access: "private",
        addRandomSuffix: false,
        contentType: "application/json",
        ...(blob ? { ifMatch: blob.blob.etag } : {}),
      });
      return id;
    } catch (error) {
      if (error instanceof BlobPreconditionFailedError) continue;
      if (!blob && error instanceof BlobError) {
        const createdByAnotherRequest = await getBlob(BLOB_CATALOG_PATH, {
          access: "private",
          useCache: false,
        });
        if (createdByAnotherRequest) continue;
      }
      throw error;
    }
  }

  throw new Error("The event catalog changed during your save. Please try again.");
}

function text(row: Record<string, unknown>, key: string): string {
  const value = row[key];
  if (typeof value !== "string") throw new Error(`Invalid local database value for ${key}`);
  return value;
}

function nullableText(row: Record<string, unknown>, key: string): string | null {
  const value = row[key];
  if (value === null) return null;
  if (typeof value !== "string") throw new Error(`Invalid local database value for ${key}`);
  return value;
}

function number(row: Record<string, unknown>, key: string): number {
  const value = row[key];
  if (typeof value !== "number") throw new Error(`Invalid local database value for ${key}`);
  return value;
}

function toEvent(row: Record<string, unknown>, userId: string | null): EventRow {
  const storedPlan = nullableText(row, "ai_plan");
  const parsedPlan = storedPlan === null ? null : planSchema.parse(JSON.parse(storedPlan));
  const creatorName = nullableText(row, "creator_name");

  return {
    id: text(row, "id"),
    created_by: text(row, "created_by"),
    name: text(row, "name"),
    description: text(row, "description"),
    event_type: text(row, "event_type"),
    budget: text(row, "budget"),
    attendees: number(row, "attendees"),
    location: text(row, "location"),
    event_time: text(row, "event_time"),
    duration_hours: number(row, "duration_hours"),
    catering: number(row, "catering") === 1,
    image_url: nullableText(row, "image_url"),
    ai_plan: parsedPlan,
    creator: creatorName === null ? null : { full_name: creatorName },
    registrations: userId && number(row, "is_registered") === 1 ? [{ user_id: userId }] : [],
  };
}

export const fetchEvents = createServerFn({ method: "GET" })
  .inputValidator((data) => filterSchema.parse(data))
  .handler(async ({ data }) => {
    if (isLiveMode()) {
      if (!data.ownerKey) return [];
      return (await readLiveCatalog())
        .filter((event) => event.created_by === data.ownerKey)
        .filter((event) => !data.createdBy || event.created_by === data.createdBy)
        .filter(
          (event) =>
            !data.registeredBy ||
            event.registrations.some((registration) => registration.user_id === data.registeredBy),
        )
        .filter((event) => !data.hasRegistrations || event.registrations.length > 0)
        .sort(
          (first, second) =>
            new Date(first.event_time).getTime() - new Date(second.event_time).getTime(),
        ) satisfies EventRow[];
    }

    const user = await currentUser();
    if (data.registeredBy && data.registeredBy !== user?.id) {
      throw new Error("You can only view your own registrations.");
    }

    const conditions: string[] = [];
    const parameters: (string | number)[] = [user?.id ?? ""];
    if (data.createdBy) {
      conditions.push("e.created_by = ?");
      parameters.push(data.createdBy);
    }
    if (data.registeredBy) {
      conditions.push(
        "EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?)",
      );
      parameters.push(data.registeredBy);
    }
    if (data.hasRegistrations) {
      conditions.push("EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id)");
    }

    const where = conditions.length ? `WHERE ${conditions.join(" AND ")}` : "";
    const rows = await getDatabase()
      .prepare(
        `SELECT e.*, p.full_name AS creator_name,
                EXISTS (SELECT 1 FROM registrations r WHERE r.event_id = e.id AND r.user_id = ?) AS is_registered
         FROM events e
         LEFT JOIN profiles p ON p.id = e.created_by
         ${where}
         ORDER BY e.event_time ASC`,
      )
      .all(...parameters);
    return rows.map((row) => toEvent(row, user?.id ?? null));
  });

export const createEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => createEventSchema.parse(data))
  .handler(async ({ data }) => {
    if (isLiveMode()) {
      if (!data.ownerKey) throw new Error("Your browser event key is missing. Refresh and try again.");
      const { ownerKey, ...eventData } = data;
      return { id: await writeLiveEvent(eventData, ownerKey) };
    }
    const user = await requireCurrentUser();
    const id = randomUUID();
    await getDatabase()
      .prepare(
        `INSERT INTO events (
          id, created_by, name, description, event_type, budget, attendees, location,
          event_time, duration_hours, catering, image_url, ai_plan
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      )
      .run(
        id,
        user.id,
        data.name,
        data.description,
        data.event_type,
        data.budget,
        data.attendees,
        data.location,
        data.event_time,
        data.duration_hours,
        data.catering ? 1 : 0,
        data.image_url,
        data.ai_plan ? JSON.stringify(data.ai_plan) : null,
      );
    return { id };
  });

export const toggleRegistration = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ eventId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    if (isLiveMode()) {
      throw new Error("Event registrations are disabled on the live site.");
    }
    const user = await requireCurrentUser();
    const db = getDatabase();
    const event = await db.prepare("SELECT created_by FROM events WHERE id = ?").get(data.eventId);
    if (!event) throw new Error("Event not found.");
    if (event["created_by"] === user.id) throw new Error("You cannot register for your own event.");

    const existing = await db
      .prepare("SELECT id FROM registrations WHERE event_id = ? AND user_id = ?")
      .get(data.eventId, user.id);
    if (existing) {
      await db
        .prepare("DELETE FROM registrations WHERE event_id = ? AND user_id = ?")
        .run(data.eventId, user.id);
      return { registered: false };
    }

    await db
      .prepare("INSERT INTO registrations (id, event_id, user_id) VALUES (?, ?, ?)")
      .run(randomUUID(), data.eventId, user.id);
    return { registered: true };
  });

export const deleteEvent = createServerFn({ method: "POST" })
  .inputValidator((data) => z.object({ eventId: z.string().uuid() }).parse(data))
  .handler(async ({ data }) => {
    if (isLiveMode()) {
      throw new Error("Event deletion is disabled on the live site.");
    }
    const user = await requireCurrentUser();
    const result = await getDatabase()
      .prepare("DELETE FROM events WHERE id = ? AND created_by = ?")
      .run(data.eventId, user.id);
    if (result.changes === 0)
      throw new Error("Event not found or you do not have permission to delete it.");
    return { success: true };
  });
