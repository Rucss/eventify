import { createFileRoute, Link } from "@tanstack/react-router";
import { Brain, Sparkles, Users } from "lucide-react";
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
    title: "AI-Powered Planning",
    text: "Create thoughtful event plans with ideas tailored to your needs.",
  },
  {
    icon: Sparkles,
    title: "Easy Event Collaboration",
    text: "Keep event details and plans organized in one convenient place.",
  },
  {
    icon: Users,
    title: "Smart Recommendations",
    text: "Explore themes, activities, venues, and budgets for your next event.",
  },
];

const testimonials = [
  {
    name: "Event organizer",
    text: "Eventify made planning our event simple. Everything we needed was easy to find.",
  },
  {
    name: "Community host",
    text: "The event ideas helped us get started and bring our plans together.",
  },
];

function Landing() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-space text-space-foreground">
      <Starfield count={110} tone="white" />
      <section className="relative flex min-h-[78vh] flex-col items-center justify-center px-6 text-center">
        <h1 className="glow-text text-4xl font-bold sm:text-6xl">
          Welcome to <span className="text-glow">Eventify</span>
        </h1>
        <p className="mt-3 text-base opacity-80 sm:text-lg">
          Your Ultimate Event Management Platform
        </p>
        <Button asChild className="mt-6" size="lg">
          <Link to="/events">Get Started</Link>
        </Button>
      </section>
      <section className="relative mx-auto max-w-5xl px-6 pb-14 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">Features That Make Us Stand Out</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-3">
          {features.map((feature) => (
            <article key={feature.title} className="glass rounded-2xl p-6">
              <feature.icon className="mx-auto h-6 w-6 text-glow" />
              <h3 className="mt-3 font-semibold">{feature.title}</h3>
              <p className="mt-2 text-sm opacity-75">{feature.text}</p>
            </article>
          ))}
        </div>
      </section>
      <section className="relative mx-auto max-w-5xl px-6 pb-20 text-center">
        <h2 className="text-2xl font-bold sm:text-3xl">What Our Users Say</h2>
        <div className="mt-7 grid gap-4 sm:grid-cols-2">
          {testimonials.map((testimonial) => (
            <figure key={testimonial.name} className="glass rounded-2xl p-6 text-left">
              <blockquote className="text-sm opacity-85">“{testimonial.text}”</blockquote>
              <figcaption className="mt-4 text-sm font-semibold">{testimonial.name}</figcaption>
            </figure>
          ))}
        </div>
      </section>
    </main>
  );
}
