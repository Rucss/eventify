import { createFileRoute } from "@tanstack/react-router";
import { EventsGrid } from "@/components/EventsGrid";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated/registered")({
  head: () => ({
    meta: [
      { title: "My registered events — Eventify" },
      { name: "description", content: "Events you've signed up for." },
    ],
  }),
  component: Registered,
});

function Registered() {
  const { user, loading, error } = useAuth();
  if (import.meta.env.PROD) {
    return (
      <div className="mx-auto max-w-6xl">
        <h1 className="text-3xl font-bold">My registered events</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          This list shows events with registrations recorded in <code>data/events.json</code>.
          Registrations are not tied to individual visitors or saved on the live site.
        </p>
        <EventsGrid
          title=""
          queryKey="registered"
          filter={{ hasRegistrations: true }}
          empty="No registrations have been recorded in data/events.json."
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
      title="My registered events"
      queryKey="registered"
      filter={{ registeredBy: user.id }}
      empty="You haven't registered for any events yet."
    />
  );
}
