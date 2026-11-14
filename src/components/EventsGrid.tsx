import { useEffect, useState, type ReactNode } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { EventCard } from "./EventCard";
import { EventDetailsDialog } from "./EventDetailsDialog";
import { fetchEvents } from "@/lib/events";
import { getOrCreateEventOwnerKey } from "@/lib/event-owner";

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
  const [ownerKey, setOwnerKey] = useState<string | null>(null);
  const [ownerKeyError, setOwnerKeyError] = useState<string | null>(null);
  useEffect(() => {
    if (!import.meta.env.PROD) return;
    try {
      setOwnerKey(getOrCreateEventOwnerKey());
    } catch (error) {
      setOwnerKeyError(error instanceof Error ? error.message : "Could not access browser storage.");
    }
  }, []);
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
  } = useQuery({
    queryKey: ["events", queryKey, filter, ownerKey],
    enabled: !import.meta.env.PROD || Boolean(ownerKey),
    queryFn: async () => {
      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        return await Promise.race([
          fetchEvents({ ...filter, ...(import.meta.env.PROD ? { ownerKey: ownerKey! } : {}) }),
          new Promise<never>((_, reject) => {
            timeoutId = setTimeout(
              () => reject(new Error("Loading events timed out. Check the database connection.")),
              12_000,
            );
          }),
        ]);
      } finally {
        if (timeoutId) clearTimeout(timeoutId);
      }
    },
    retry: false,
  });
  const shown = data.filter((e) =>
    `${e.name} ${e.event_type} ${e.description}`.toLowerCase().includes(search.toLowerCase()),
  );
  const open = data.find((e) => e.id === openId) ?? null;

  return (
    <div className="mx-auto max-w-6xl">
      {title && (
        <div className="flex flex-wrap items-center justify-between gap-4">
          <h1 className="text-3xl font-bold">{title}</h1>
          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search events"
                className="w-56 pl-9"
              />
            </div>
            {actions}
          </div>
        </div>
      )}
      {!title && (
        <div className="mb-2 flex justify-end">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search events"
              className="w-56 pl-9"
            />
          </div>
        </div>
      )}
      {ownerKeyError ? (
        <p className="mt-10 rounded-2xl border border-destructive/30 p-10 text-center text-destructive">
          Could not access this browser’s private event key: {ownerKeyError}
        </p>
      ) : isLoading || (import.meta.env.PROD && !ownerKey) ? (
        <p className="mt-10 text-muted-foreground">Loading events…</p>
      ) : isError ? (
        <div className="mt-10 rounded-2xl border border-destructive/30 p-10 text-center">
          <p className="text-destructive">
            {error instanceof Error && /BLOB_READ_WRITE_TOKEN|BLOB_STORE_ID/i.test(error.message)
              ? "Shared event storage isn’t configured. Connect a Vercel Blob store to this project, then redeploy."
              : error instanceof Error && /timed out|database connection/i.test(error.message)
                ? "Shared event storage didn’t respond. Check the Blob store connection and deployment logs, then try again."
                : error instanceof Error
                  ? error.message
                  : "Could not load events."}
          </p>
          <button
            type="button"
            className="mt-3 text-sm font-medium text-primary underline"
            onClick={() => void refetch()}
          >
            Try again
          </button>
        </div>
      ) : shown.length === 0 ? (
        <p className="mt-10 rounded-2xl border border-dashed p-10 text-center text-muted-foreground">
          {empty}
        </p>
      ) : (
        <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {shown.map((e) => (
            <EventCard key={e.id} event={e} onView={() => setOpenId(e.id)} />
          ))}
        </div>
      )}
      <EventDetailsDialog
        event={open}
        onClose={() => setOpenId(null)}
        onChanged={() => void refetch()}
      />
    </div>
  );
}
