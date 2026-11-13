import { randomUUID } from "node:crypto";
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
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

const filterSchema = z.object({
  createdBy: z.string().uuid().optional(),
  registeredBy: z.string().uuid().optional(),
});

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
  .inputValidator((data) => eventSchema.parse(data))
  .handler(async ({ data }) => {
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
    const user = await requireCurrentUser();
    const result = await getDatabase()
      .prepare("DELETE FROM events WHERE id = ? AND created_by = ?")
      .run(data.eventId, user.id);
    if (result.changes === 0)
      throw new Error("Event not found or you do not have permission to delete it.");
    return { success: true };
  });
