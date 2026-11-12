import { createFileRoute } from "@tanstack/react-router";
import { EventsGrid } from "@/components/EventsGrid";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({ meta: [{ title: "Events — Eventify" }, { name: "description", content: "Browse all upcoming events." }] }),
  component: () => <EventsGrid title="Events" queryKey="all" filter={{}} empty="No events yet. Be the first to create one!" />,
});
