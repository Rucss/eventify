import { useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventCard } from "./EventCard";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { fetchEvents } from "@/lib/events";

export function EventsGrid({
  title,
  queryKey,
  filter,
  actions,
  empty,
}: {
  title: string;
  queryKey: string;
  filter: Parameters<typeof fetchEvents>[0];
  actions?: ReactNode;
  empty: string;
}) {
  const [search, setSearch] = useState("");
  const [openId, setOpenId] = useState<string | null>(null);
  const { data = [], isLoading, refetch } = useQuery({
    queryKey: ["events", queryKey, filter],
    queryFn: () => fetchEvents(filter),
  });
  const shown = data.filter((e) =>
    `${e.name} ${e.event_type} ${e.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const open = data.find((e) => e.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <h1 className="text-3xl font-bold">{title}</h1>
        <div className="flex items-center gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search events" className="w-56 pl-9" />
          </div>
          {actions}
        </div>
      </div>
      {isLoading ? (
        <p className="mt-10 text-muted-foreground">Loading events…</p>
      ) : shown.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">{empty}</p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <EventCard key={e.id} event={e} onView={() => setOpenId(e.id)} />
          ))}
        </div>
      )}
      <EventDetailsDialog event={open} onClose={() => setOpenId(null)} onChanged={() => refetch()} />
    </div>
  );
}
