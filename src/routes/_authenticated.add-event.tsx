import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { ImagePlus, Loader2, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { generatePlan } from "@/lib/plan.functions";
import { createEvent as createEventRequest } from "@/lib/events.functions";
import { fileToResizedDataUrl } from "@/lib/image";
import { useAuth } from "@/lib/auth";
import type { PlanOption } from "@/lib/events";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";

export const Route = createFileRoute("/_authenticated/add-event")({
  head: () => ({
    meta: [
      { title: "Add event — Eventify" },
      { name: "description", content: "Create an event and explore tailored event plans." },
    ],
  }),
  component: AddEvent,
});

function AddEvent() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const gen = useServerFn(generatePlan);
  const saveEvent = useServerFn(createEventRequest);
  const [f, setF] = useState({
    name: "",
    budget: "",
    eventType: "",
    description: "",
    attendees: "100",
    location: "",
    eventTime: "",
    durationHours: "4",
    catering: false,
  });
  const [image, setImage] = useState<string | null>(null);
  const [options, setOptions] = useState<PlanOption[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof f) => (e: { target: { value: string } }) =>
    setF({ ...f, [k]: e.target.value });

  async function onGenerate() {
    const attendees = Number(f.attendees);
    if (
      !f.name.trim() ||
      !f.budget.trim() ||
      !f.location.trim() ||
      !f.eventTime ||
      !Number.isFinite(attendees) ||
      attendees < 1
    ) {
      return void toast.error(
        "Add the event name, budget, attendee count, location, and event time first.",
      );
    }
    setLoading(true);
    setSelected(null);
    setOptions([]);
    try {
      const result = await gen({
        data: {
          ...f,
          attendees,
          durationHours: Number(f.durationHours) || 0,
        },
      });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      if (result.options.length !== 3) {
        toast.error("The event planner did not return three options. Please try again.");
        return;
      }
      setOptions(result.options);
    } catch (error) {
      if (error instanceof TypeError && error.message === "Failed to fetch") {
        toast.error("Can't reach the app server. Restart the dev server and try again.");
      } else {
        toast.error(error instanceof Error ? error.message : "Could not generate event plans.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function onSave() {
    if (!user) return;
    if (!f.name || !f.eventTime) return void toast.error("Event name and time are required.");
    setSaving(true);
    try {
      await saveEvent({
        data: {
          name: f.name,
          description: f.description,
          event_type: f.eventType,
          budget: f.budget,
          attendees: Number(f.attendees) || 0,
          location: f.location,
          event_time: new Date(f.eventTime).toISOString(),
          duration_hours: Number(f.durationHours) || 0,
          catering: f.catering,
          image_url: image,
          ai_plan: selected !== null ? options[selected] : null,
        },
      });
      toast.success("Event saved!");
      await navigate({ to: "/my-events" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not save event.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mx-auto max-w-6xl overflow-hidden rounded-2xl bg-card shadow-card">
      <div className="flex items-center justify-between bg-primary px-6 py-4 text-primary-foreground">
        <h1 className="text-xl font-bold">Add event</h1>
        <div className="flex gap-2">
          <Button
            variant="ghost"
            className="text-primary-foreground hover:bg-primary-foreground/10 hover:text-primary-foreground"
            onClick={() => navigate({ to: "/my-events" })}
          >
            Close
          </Button>
          <Button variant="secondary" onClick={onSave} disabled={saving || loading}>
            {saving ? "Saving…" : "Save"}
          </Button>
        </div>
      </div>
      <div className="space-y-5 p-6">
        <label className="flex h-52 cursor-pointer items-center justify-center rounded-xl border-2 border-dashed bg-muted/40">
          {image ? (
            <img src={image} alt="Event poster" className="h-full object-contain p-2" />
          ) : (
            <span className="flex flex-col items-center gap-2 text-sm text-muted-foreground">
              <ImagePlus className="h-8 w-8" /> Upload event poster
            </span>
          )}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const file = e.target.files?.[0];
              if (file) setImage(await fileToResizedDataUrl(file));
            }}
          />
        </label>
        <div className="grid gap-4 md:grid-cols-3">
          <div>
            <Label>Event name</Label>
            <Input value={f.name} onChange={set("name")} />
          </div>
          <div>
            <Label>Budget (₹)</Label>
            <Input value={f.budget} onChange={set("budget")} placeholder="Enter your budget" />
          </div>
          <div>
            <Label>Event type</Label>
            <Input value={f.eventType} onChange={set("eventType")} placeholder="Enter your event" />
          </div>
        </div>
        <div>
          <Label>Description</Label>
          <Textarea rows={4} value={f.description} onChange={set("description")} />
        </div>
        <div className="grid gap-4 md:grid-cols-2">
          <div>
            <Label>Number of people</Label>
            <Input type="number" value={f.attendees} onChange={set("attendees")} />
          </div>
          <div>
            <Label>Location</Label>
            <Input value={f.location} onChange={set("location")} />
          </div>
          <div>
            <Label>Event time</Label>
            <Input type="datetime-local" value={f.eventTime} onChange={set("eventTime")} />
          </div>
          <div>
            <Label>Event duration (hours)</Label>
            <Input type="number" value={f.durationHours} onChange={set("durationHours")} />
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <label className="flex items-center gap-2 text-sm">
            <Checkbox
              checked={f.catering}
              onCheckedChange={(v) => setF({ ...f, catering: v === true })}
            />{" "}
            Catering required
          </label>
          <Button size="lg" onClick={onGenerate} disabled={loading || saving} className="min-w-64">
            {loading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            {loading ? "Generating options…" : options.length ? "Re-generate" : "Generate options"}
          </Button>
        </div>
        {options.length > 0 && (
          <fieldset className="min-w-0">
            <legend className="mb-4 text-xl font-semibold">Choose an event plan</legend>
            <div className="grid gap-4 md:grid-cols-3">
              {options.map((o, i) => {
                const [themeTitle, ...concept] = o.theme.split(" — ");
                return (
                  <label key={i} className="block cursor-pointer">
                    <input
                      type="radio"
                      name="event-plan"
                      value={i}
                      checked={selected === i}
                      onChange={() => setSelected(i)}
                      aria-label={`Select option ${i + 1}: ${o.theme}`}
                      className="peer sr-only"
                    />
                    <div
                      className={`h-full rounded-2xl border p-5 text-left text-sm shadow-card transition peer-focus-visible:ring-2 peer-focus-visible:ring-primary ${selected === i ? "border-primary bg-highlight text-highlight-foreground ring-2 ring-primary" : "border-transparent bg-muted hover:bg-accent"}`}
                    >
                      <p className="text-xs font-semibold uppercase tracking-wide text-primary">
                        Option {i + 1}
                      </p>
                      <h3 className="mt-1 text-xl font-bold text-primary">{themeTitle}</h3>
                      <p className="mt-1 text-muted-foreground">{concept.join(" — ") || o.theme}</p>
                      <dl className="mt-4 space-y-3">
                        <div>
                          <dt className="font-semibold">People & capacity</dt>
                          <dd className="text-muted-foreground">{o.people}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Venue</dt>
                          <dd className="text-muted-foreground">{o.venue}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Activities</dt>
                          <dd>
                            <ul className="mt-1 list-disc space-y-1 pl-5 text-muted-foreground">
                              {o.activities
                                .split(/[;\n]/)
                                .map((activity) => activity.trim())
                                .filter(Boolean)
                                .map((activity, activityIndex) => (
                                  <li key={`${i}-${activityIndex}`}>{activity}</li>
                                ))}
                            </ul>
                          </dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Decoration</dt>
                          <dd className="text-muted-foreground">{o.decoration}</dd>
                        </div>
                        <div>
                          <dt className="font-semibold">Budget</dt>
                          <dd className="text-muted-foreground">{o.budget}</dd>
                        </div>
                      </dl>
                    </div>
                  </label>
                );
              })}
            </div>
            <p className="mt-3 text-sm text-muted-foreground">
              Select a plan to save it with your event.
            </p>
          </fieldset>
        )}
        {selected !== null && (
          <p className="text-center text-sm text-muted-foreground">
            Option {selected + 1} selected — click Save to publish.
          </p>
        )}
      </div>
    </div>
  );
}
