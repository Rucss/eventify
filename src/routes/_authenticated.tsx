import { createFileRoute, Link, Outlet, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { CalendarHeart, LogOut, PlusCircle, Ticket, UserRound, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { fetchProfile } from "@/lib/profile.functions";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppLayout,
});

const nav = [
  { to: "/profile", label: "Profile", icon: UserRound },
  { to: "/events", label: "Events", icon: CalendarHeart },
  { to: "/my-events", label: "My created events", icon: Sparkles },
  { to: "/registered", label: "My registered events", icon: Ticket },
] as const;

function AppLayout() {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const loadProfile = useServerFn(fetchProfile);
  useEffect(() => {
    if (!loading && !user) navigate({ to: "/auth", search: { mode: "login" } });
  }, [loading, user, navigate]);

  const { data: profile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: () => loadProfile({ data: {} }),
  });

  if (loading || !user)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <div className="flex min-h-screen">
      <aside className="sticky top-0 hidden h-screen w-64 shrink-0 flex-col bg-sidebar text-sidebar-foreground md:flex">
        <div className="px-5 py-5 font-display text-2xl font-bold">Eventify</div>
        <div className="mx-4 rounded-xl bg-sidebar-accent p-4">
          <p className="font-semibold">Welcome</p>
          <p className="truncate text-sm opacity-80">{profile?.full_name || user.email}</p>
        </div>
        <div className="my-4 border-t border-sidebar-border" />
        <nav className="flex-1 space-y-1 px-3">
          {nav.map((n) => (
            <Link
              key={n.to}
              to={n.to}
              className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium opacity-85 hover:bg-sidebar-accent"
              activeProps={{ className: "bg-sidebar-accent opacity-100" }}
            >
              <n.icon className="h-4 w-4 text-sidebar-primary" /> {n.label}
            </Link>
          ))}
          <Link
            to="/add-event"
            className="mt-4 flex items-center gap-3 rounded-lg bg-sidebar-primary px-3 py-2 text-sm font-semibold text-sidebar-primary-foreground"
          >
            <PlusCircle className="h-4 w-4" /> Add event with AI
          </Link>
        </nav>
        <button
          onClick={async () => {
            try {
              await signOut();
              await navigate({ to: "/auth", search: { mode: "login" } });
            } catch (error) {
              console.error("Could not sign out.", error);
              toast.error(error instanceof Error ? error.message : "Could not sign out.");
            }
          }}
          className="m-3 flex items-center gap-3 rounded-lg px-3 py-2 text-sm opacity-80 hover:bg-sidebar-accent"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </aside>
      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-card px-6 py-3 md:justify-end">
          <span className="font-display text-xl font-bold text-primary md:hidden">Eventify</span>
          <nav className="flex gap-3 text-sm md:hidden">
            {nav.map((n) => (
              <Link key={n.to} to={n.to} aria-label={n.label}>
                <n.icon className="h-5 w-5" />
              </Link>
            ))}
            <Link to="/add-event" aria-label="Add event">
              <PlusCircle className="h-5 w-5 text-primary" />
            </Link>
          </nav>
          <Link
            to="/profile"
            className="hidden h-10 w-10 overflow-hidden rounded-full bg-accent md:block"
          >
            {profile?.avatar_url ? (
              <img src={profile.avatar_url} alt="" className="h-full w-full object-cover" />
            ) : (
              <span className="flex h-full items-center justify-center font-semibold text-accent-foreground">
                {(profile?.full_name || user.email || "?")[0]?.toUpperCase()}
              </span>
            )}
          </Link>
        </header>
        <main className="px-6 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
