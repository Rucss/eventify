import {
  CalendarClock,
  MapPin,
  Palette,
  Wallet,
  Users,
  Hourglass,
  User,
  Tag,
  Utensils,
} from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { formatDateTime, type EventRow } from "@/lib/events";

function Field({ icon: Icon, label, value }: { icon: typeof Tag; label: string; value: string }) {
  return (
    <div className="rounded-xl border bg-muted/40 p-4">
      <div className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
        <Icon className="h-4 w-4 text-primary" /> {label}
      </div>
      <p className="mt-2 text-sm">{value}</p>
    </div>
  );
}

export function EventDetailsDialog({
  event,
  onClose,
}: {
  event: EventRow | null;
  onClose: () => void;
}) {
  if (!event) return null;
  const plan = event.ai_plan;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="max-h-[90vh] max-w-3xl overflow-y-auto p-0">
        <div className="bg-primary px-6 py-4 text-primary-foreground">
          <DialogTitle className="text-lg font-bold">Event details</DialogTitle>
        </div>
        {event.image_url && (
          <img src={event.image_url} alt={event.name} className="max-h-64 w-full object-cover" />
        )}
        <div className="space-y-6 p-6">
          <h2 className="border-b pb-4 text-center text-3xl font-bold uppercase text-primary">
            {event.name}
          </h2>
          <div className="grid gap-4 sm:grid-cols-2">
            <Field icon={Tag} label="Event type" value={event.event_type || "—"} />
            <Field
              icon={CalendarClock}
              label="Event time"
              value={formatDateTime(event.event_time)}
            />
            <Field icon={MapPin} label="Venue" value={plan?.venue || event.location || "—"} />
            <Field icon={Palette} label="Theme" value={plan?.theme || "—"} />
            <Field
              icon={Wallet}
              label="Budget"
              value={plan ? `₹${event.budget} total · ${plan.budget} plan` : `₹${event.budget}`}
            />
            <Field
              icon={Users}
              label="Attendees"
              value={plan ? `${event.attendees} · ${plan.people}` : String(event.attendees)}
            />
            <Field icon={Hourglass} label="Duration" value={`${event.duration_hours} hours`} />
            <Field icon={User} label="Created by" value={event.creator?.full_name || "—"} />
            {plan && <Field icon={Utensils} label="Activities" value={plan.activities} />}
            {plan && <Field icon={Palette} label="Decoration" value={plan.decoration} />}
          </div>
          <div className="rounded-xl border bg-muted/40 p-4">
            <p className="font-semibold">Description</p>
            <p className="mt-1 text-sm text-muted-foreground">{event.description || "—"}</p>
          </div>
          <div className="flex flex-wrap justify-end gap-2">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
