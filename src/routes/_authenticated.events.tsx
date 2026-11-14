import { createFileRoute } from "@tanstack/react-router";
import { EventsGrid } from "@/components/EventsGrid";

export const Route = createFileRoute("/_authenticated/events")({
  head: () => ({
    meta: [
      { title: "Events — Eventify" },
      { name: "description", content: "Browse upcoming events." },
    ],
  }),
  component: () => (
    <EventsGrid
      title="Events"
      queryKey="all"
      filter={{}}
      empty={
        import.meta.env.PROD
          ? "No events have been added to data/events.json yet."
          : "No events have been published yet."
      }
    />
  ),
});
