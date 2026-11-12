import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Sparkles, Users } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eventify — Your AI event management platform" },
      { name: "description", content: "Create events, let AI generate themes, venues and budgets, and track registrations." },
      { property: "og:title", content: "Eventify — Your AI event management platform" },
      { property: "og:description", content: "Create events, let AI generate themes, venues and budgets, and track registrations." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: Brain, title: "AI event planner", text: "Enter budget, crowd and venue — get three ready-to-run themes in seconds." },
  { icon: Sparkles, title: "Regenerate & choose", text: "Not feeling it? Regenerate until an option clicks, then save it." },
  { icon: Users, title: "Registrations", text: "Publish events and see who's coming, all in one dashboard." },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-space text-space-foreground">
      <Starfield count={110} tone="white" />
      <section className="relative flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
        <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" /> Powered by AI / ML
        </span>
        <h1 className="glow-text text-5xl font-bold sm:text-7xl">
          Welcome to <span className="text-glow">Eventify</span>
        </h1>
        <p className="mt-4 text-lg opacity-80 sm:text-xl">Your ultimate AI event management platform</p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link to="/auth" search={{ mode: "signup" }}>Get started</Link>
          </Button>
          <Button asChild size="lg" variant="ghost" className="text-space-foreground hover:bg-space-foreground/10 hover:text-space-foreground">
            <Link to="/auth" search={{ mode: "login" }}>Log in</Link>
          </Button>
        </div>
      </section>
      <section className="relative mx-auto grid max-w-5xl gap-4 px-6 pb-20 sm:grid-cols-3">
        {features.map((f) => (
          <div key={f.title} className="glass rounded-2xl p-6">
            <f.icon className="h-6 w-6 text-glow" />
            <h3 className="mt-3 font-semibold">{f.title}</h3>
            <p className="mt-1 text-sm opacity-75">{f.text}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
