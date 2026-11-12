import { useMemo } from "react";

// Deterministic pseudo-random so SSR and client markup match.
function rand(seed: number) {
  const x = Math.sin(seed * 9301 + 49297) * 233280;
  return x - Math.floor(x);
}

export function Starfield({ count = 90, tone = "mixed" }: { count?: number; tone?: "white" | "mixed" }) {
  const stars = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        left: rand(i + 1) * 100,
        top: rand(i + 101) * 100,
        size: rand(i + 201) > 0.92 ? 8 : rand(i + 301) * 3 + 1,
        delay: rand(i + 401) * 4,
        color: tone === "white" ? "bg-space-foreground" : rand(i + 501) > 0.5 ? "bg-glow" : "bg-tag",
      })),
    [count, tone],
  );
  return (
    <div aria-hidden className="pointer-events-none absolute inset-0 overflow-hidden">
      {stars.map((s, i) => (
        <span
          key={i}
          className={`absolute animate-twinkle ${s.color}`}
          style={{ left: `${s.left}%`, top: `${s.top}%`, width: s.size, height: s.size, animationDelay: `${s.delay}s` }}
        />
      ))}
    </div>
  );
}
