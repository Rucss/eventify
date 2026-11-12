import { createFileRoute, Link } from "@tanstack/react-router";
import { EventsGrid } from "@/components/EventsGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/my-events")({
  head: () => ({ meta: [{ title: "My created events — Eventify" }, { name: "description", content: "Events you've created." }] }),
  component: MyEvents,
});

function MyEvents() {
  const { user } = useAuth();
  return (
    <EventsGrid
      title="My created events"
      queryKey="mine"
      filter={{ createdBy: user!.id }}
      empty="You haven't created any events yet."
      actions={
        <Button asChild>
          <Link to="/add-event">Add event</Link>
        </Button>
      }
    />
  );
}
