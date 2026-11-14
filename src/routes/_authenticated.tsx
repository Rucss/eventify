import { createFileRoute, Link, Outlet } from "@tanstack/react-router";
import { CalendarHeart, Ticket, UserRound } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppLayout,
});

const navLinkClassName =
  "flex shrink-0 items-center gap-3 rounded-lg px-3 py-2.5 text-sm text-white/85 transition hover:bg-white/10";

function AppLayout() {
  const { user } = useAuth();
  const avatarLabel = user?.email.slice(0, 1).toUpperCase() || "E";

  return (
    <div className="flex min-h-screen flex-col md:flex-row">
      <aside className="z-10 flex w-full shrink-0 flex-col bg-[#17699f] text-white md:sticky md:top-0 md:h-screen md:w-56">
        <Link
          to="/events"
          className="border-b border-white/15 px-5 py-5 font-display text-xl font-bold"
        >
          Eventify
        </Link>
        <div className="border-b border-white/15 p-4">
          <div className="rounded-xl bg-white/10 px-4 py-3">
            <p className="text-sm font-semibold">Welcome</p>
            <p className="truncate text-xs text-white/75">{user?.email || "Your account"}</p>
          </div>
        </div>
        <nav aria-label="Main navigation" className="flex gap-1 overflow-x-auto p-3 md:flex-col">
          <Link
            to="/profile"
            className={navLinkClassName}
            activeProps={{ className: `${navLinkClassName} bg-white/15 font-semibold` }}
          >
            <UserRound className="h-4 w-4" /> Profile
          </Link>
          <Link
            to="/events"
            className={navLinkClassName}
            activeProps={{ className: `${navLinkClassName} bg-white/15 font-semibold` }}
          >
            <CalendarHeart className="h-4 w-4" /> Events
          </Link>
          <Link
            to="/my-events"
            className={navLinkClassName}
            activeProps={{ className: `${navLinkClassName} bg-white/15 font-semibold` }}
          >
            <CalendarHeart className="h-4 w-4" /> My Created Events
          </Link>
          <Link
            to="/registered"
            className={navLinkClassName}
            activeProps={{ className: `${navLinkClassName} bg-white/15 font-semibold` }}
          >
            <Ticket className="h-4 w-4" /> My Registered Events
          </Link>
        </nav>
      </aside>
      <div className="min-w-0 flex-1">
        <header className="flex h-16 items-center justify-end border-b bg-card px-5 sm:px-8">
          <Link
            to="/profile"
            aria-label="Open profile"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary transition hover:bg-primary/20"
          >
            {avatarLabel}
          </Link>
        </header>
        <main className="min-w-0 px-4 py-8 sm:px-8 lg:px-10 lg:py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
