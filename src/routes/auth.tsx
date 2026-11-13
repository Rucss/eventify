import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState, type FormEvent } from "react";
import { useServerFn } from "@tanstack/react-start";
import { toast } from "sonner";
import { signIn, signUp } from "@/lib/auth.functions";
import { Starfield } from "@/components/Starfield";
import { useAuth } from "@/lib/auth";

type Mode = "login" | "signup";

export const Route = createFileRoute("/auth")({
  validateSearch: (s: Record<string, unknown>): { mode?: Mode | undefined } => ({
    mode: s["mode"] === "signup" ? "signup" : s["mode"] === "login" ? "login" : undefined,
  }),
  head: () => ({
    meta: [
      { title: "Sign in — Eventify" },
      { name: "description", content: "Create your Eventify account or log in to manage events." },
      { property: "og:title", content: "Sign in — Eventify" },
      {
        property: "og:description",
        content: "Create your Eventify account or log in to manage events.",
      },
    ],
  }),
  component: HiddenAuthRoute,
});

const inputCls =
  "w-full rounded-lg border border-space-foreground/40 bg-space-foreground/10 px-3 py-3 text-sm text-space-foreground placeholder:text-space-foreground/70 outline-none focus:border-space-foreground";

function HiddenAuthRoute() {
  const navigate = useNavigate();

  useEffect(() => {
    void navigate({ to: "/events", replace: true });
  }, [navigate]);

  return null;
}

function AuthPage() {
  const { mode: initial } = Route.useSearch();
  const [mode, setMode] = useState<Mode>(initial ?? "login");
  const [busy, setBusy] = useState(false);
  const { user, refresh } = useAuth();
  const navigate = useNavigate();
  const createAccount = useServerFn(signUp);
  const login = useServerFn(signIn);

  useEffect(() => {
    if (user) navigate({ to: "/events" });
  }, [user, navigate]);

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    const email = String(f.get("email"));
    const password = String(f.get("password"));
    setBusy(true);
    try {
      const result =
        mode === "signup"
          ? await createAccount({
              data: {
                fullName: String(f.get("name") ?? ""),
                email,
                password,
                phone: String(f.get("phone") ?? "").trim() || null,
                address: String(f.get("address") ?? "").trim() || null,
              },
            })
          : await login({ data: { email, password } });
      if (result.error) {
        toast.error(result.error);
        return;
      }
      await refresh();
      await navigate({ to: "/events" });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Could not sign in.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="grid min-h-screen lg:grid-cols-2">
      <section className="flex items-center justify-center bg-auth px-6 py-12">
        <div className="glass w-full max-w-md rounded-3xl p-8 text-space-foreground">
          <h1 className="text-center text-3xl font-bold">
            {mode === "signup" ? "Create account" : "Welcome back"}
          </h1>
          <p className="mt-2 text-center text-sm opacity-80">
            {mode === "signup" ? "Already have an account?" : "New to Eventify?"}{" "}
            <button
              className="font-semibold underline-offset-4 hover:underline"
              onClick={() => setMode(mode === "signup" ? "login" : "signup")}
            >
              {mode === "signup" ? "Log in" : "Sign up"}
            </button>
          </p>
          <form onSubmit={onSubmit} className="mt-6 space-y-4">
            {mode === "signup" && (
              <>
                <input name="name" required placeholder="Name" className={inputCls} />
                <input name="phone" placeholder="Phone number" className={inputCls} />
                <input name="address" placeholder="Address" className={inputCls} />
              </>
            )}
            <input
              name="email"
              type="email"
              required
              placeholder="Email address"
              className={inputCls}
            />
            <input
              name="password"
              type="password"
              required
              minLength={6}
              placeholder="Password"
              className={inputCls}
            />
            <button
              disabled={busy}
              className="bg-cta w-full rounded-xl py-3 font-semibold text-space-foreground shadow-card disabled:opacity-60"
            >
              {busy ? "Please wait…" : mode === "signup" ? "Register" : "Log in"}
            </button>
          </form>
          <p className="mt-6 text-center text-xs opacity-70">
            <Link to="/">← Back home</Link>
          </p>
        </div>
      </section>
      <section className="relative hidden items-center justify-center overflow-hidden bg-sidebar lg:flex">
        <Starfield count={140} />
        <h2 className="glow-text relative text-6xl font-bold text-sidebar-foreground">Eventify</h2>
      </section>
    </main>
  );
}
