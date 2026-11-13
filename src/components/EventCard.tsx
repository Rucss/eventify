import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { formatDate, type EventRow } from "@/lib/events";

export function EventCard({ event, onView }: { event: EventRow; onView: () => void }) {
  return (
    <article className="flex flex-col overflow-hidden rounded-2xl bg-card shadow-card transition-transform hover:-translate-y-1">
      <div className="relative h-48 bg-space">
        {event.image_url ? (
          <img src={event.image_url} alt={event.name} className="h-full w-full object-cover" />
        ) : (
          <div className="flex h-full items-center justify-center font-display text-3xl text-space-foreground">
            {event.name}
          </div>
        )}
        {event.ai_plan && (
          <span className="absolute right-3 top-3 inline-flex items-center gap-1 rounded-full bg-highlight px-2 py-1 text-xs font-semibold text-highlight-foreground">
            <Sparkles className="h-3 w-3" /> Plan selected
          </span>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h3 className="text-xl font-bold">{event.name}</h3>
        <p className="mt-1 line-clamp-1 text-sm text-muted-foreground">
          {event.description || "No description"}
        </p>
        <div className="mt-3 flex flex-wrap gap-2 text-xs font-medium">
          {event.event_type && (
            <span className="rounded-full bg-primary px-2 py-1 text-primary-foreground">
              {event.event_type}
            </span>
          )}
          <span className="rounded-full bg-tag px-2 py-1 text-tag-foreground">
            {formatDate(event.event_time)}
          </span>
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Capacity: {event.attendees}
          {event.location ? ` · ${event.location}` : ""}
        </p>
        <Button className="mt-4 w-full" onClick={onView}>
          View details
        </Button>
      </div>
    </article>
  );
}
