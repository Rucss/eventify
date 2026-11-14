import { createFileRoute, Link } from "@tanstack/react-router";
import { EventsGrid } from "@/components/EventsGrid";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/my-events")({
  head: () => ({
    meta: [
      { title: "My created events — Eventify" },
      { name: "description", content: "Events you've created." },
    ],
  }),
  component: MyEvents,
});

function MyEvents() {
  const { user, loading, error } = useAuth();
  if (import.meta.env.PROD) {
    return (
      <div className="mx-auto max-w-6xl">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold">My created events</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Only events created in this browser are shown here. Keep this browser’s site data to
              retain access.
            </p>
          </div>
          <Button asChild>
            <Link to="/add-event">Add event</Link>
          </Button>
        </div>
        <EventsGrid
          title=""
          queryKey="all"
          filter={{}}
          empty="No events have been created yet."
        />
      </div>
    );
  }
  if (loading) return <p className="text-muted-foreground">Preparing your guest profile…</p>;
  if (!user) {
    return <p className="text-destructive">{error || "Your guest profile could not be loaded."}</p>;
  }
  return (
    <EventsGrid
      title="My created events"
      queryKey="mine"
      filter={{ createdBy: user.id }}
      empty="You haven't created any events yet."
      actions={
        <Button asChild>
          <Link to="/add-event">Add event</Link>
        </Button>
      }
    />
  );
}
