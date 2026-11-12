import { createFileRoute } from "@tanstack/react-router";
import { EventsGrid } from "@/components/EventsGrid";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/registered")({
  head: () => ({ meta: [{ title: "My registered events — Eventify" }, { name: "description", content: "Events you've signed up for." }] }),
  component: Registered,
});

function Registered() {
  const { user } = useAuth();
  return (
    <EventsGrid
      title="My registered events"
      queryKey="registered"
      filter={{ registeredBy: user!.id }}
      empty="You haven't registered for any events yet."
    />
  );
}
