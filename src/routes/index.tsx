import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, CalendarHeart, Sparkles, Users } from "lucide-react";
import { Starfield } from "@/components/Starfield";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Eventify — Event planning" },
      { name: "description", content: "Explore upcoming events and find your next experience." },
      { property: "og:title", content: "Eventify — Event planning" },
      {
        property: "og:description",
        content: "Explore upcoming events and find your next experience.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Landing,
});

const features = [
  {
    icon: Brain,
    title: "Event inspiration",
    text: "Explore a variety of plans for celebrations, festivals, and gatherings.",
  },
  {
    icon: Sparkles,
    title: "Plans for every occasion",
    text: "Find themes, activities, venue ideas, and budget breakdowns.",
  },
  {
    icon: Users,
    title: "Discover events",
    text: "Browse upcoming events and open one to see its details.",
  },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-space text-space-foreground">
      <Starfield count={110} tone="white" />
      <section className="relative flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
        <span className="glass mb-6 inline-flex items-center gap-2 rounded-full px-4 py-1 text-xs font-medium">
          <Sparkles className="h-3 w-3" /> Event ideas and local plans
        </span>
        <h1 className="glow-text text-5xl font-bold sm:text-7xl">
          Welcome to <span className="text-glow">Eventify</span>
        </h1>
        <p className="mt-4 text-lg opacity-80 sm:text-xl">
          Discover events and ideas for your next gathering
        </p>
        <div className="mt-8 flex gap-3">
          <Button asChild size="lg">
            <Link to="/events">
              <CalendarHeart className="mr-2 h-4 w-4" /> Get started
            </Link>
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
