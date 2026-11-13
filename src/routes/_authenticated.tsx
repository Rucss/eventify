import { createFileRoute, Link, Outlet, useLocation, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { CalendarHeart, House } from "lucide-react";
import { useAuth } from "@/lib/auth";

export const Route = createFileRoute("/_authenticated")({
  ssr: false,
  component: AppLayout,
});

function AppLayout() {
  const { loading } = useAuth();
  const navigate = useNavigate();
  const { pathname } = useLocation();

  useEffect(() => {
    if (pathname !== "/events") void navigate({ to: "/events", replace: true });
  }, [pathname, navigate]);

  if (pathname !== "/events") {
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Redirecting to public events…
      </div>
    );
  }
  if (loading)
    return (
      <div className="flex min-h-screen items-center justify-center text-muted-foreground">
        Loading…
      </div>
    );

  return (
    <div className="flex min-h-screen">
      <div className="flex-1">
        <header className="flex items-center justify-between border-b bg-card px-6 py-4">
          <Link to="/" className="font-display text-xl font-bold text-primary">
            Eventify
          </Link>
          <nav className="flex items-center gap-5 text-sm">
            <Link to="/" className="inline-flex items-center gap-2 hover:text-primary">
              <House className="h-4 w-4" /> Home
            </Link>
            <Link to="/events" className="inline-flex items-center gap-2 hover:text-primary">
              <CalendarHeart className="h-4 w-4" /> Events
            </Link>
          </nav>
        </header>
        <main className="px-6 py-10">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
