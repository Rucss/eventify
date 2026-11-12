import { fetchEvents as fetchEventsRequest } from "./events.functions";
export type { EventRow, PlanOption } from "./local-types";

export async function fetchEvents(filter: { createdBy?: string; registeredBy?: string } = {}) {
  return fetchEventsRequest({ data: filter });
}

export const formatDate = (iso: string) =>
  new Date(iso).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" });

export const formatDateTime = (iso: string) =>
  new Date(iso).toLocaleString("en-IN", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
