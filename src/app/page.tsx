"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import Link from "next/link";

/**
 * Homepage — still exactly three things (headline, one search, starting points),
 * but staged so the search is unmistakably the main event.
 */

const POPULAR = [
  { label: "IITs", href: "/colleges?q=Indian+Institute+of+Technology" },
  { label: "NITs", href: "/colleges?q=National+Institute+of+Technology" },
  { label: "Delhi", href: "/colleges?state=Delhi" },
  { label: "Bangalore", href: "/colleges?city=Bangalore" },
  { label: "Under ₹2L", href: "/colleges?maxFees=200000&sort=rating" },
];

const PATHS = [
  {
    href: "/predict",
    title: "Predict my colleges",
    body: "Enter your rank. Get Safe, Target and Reach lists built from real cutoffs.",
    accent: "var(--brand)",
    icon: (
      <>
        <path d="M3 17l5-5 4 3 6-7" />
        <path d="M14 8h4v4" />
      </>
    ),
  },
  {
    href: "/colleges?sort=rank",
    title: "Browse by ranking",
    body: "Filter 300+ institutions by state, branch, fees and NIRF rank.",
    accent: "var(--chart-2)",
    icon: (
      <>
        <path d="M4 6h16M4 12h11M4 18h7" />
      </>
    ),
  },
  {
    href: "/colleges?sort=fees_asc",
    title: "Compare side by side",
    body: "Put up to three colleges head-to-head on fees, placements and ratings.",
    accent: "var(--chart-3)",
    icon: (
      <>
        <rect x="3.5" y="5" width="7" height="14" rx="1.5" />
        <rect x="13.5" y="5" width="7" height="14" rx="1.5" />
      </>
    ),
  },
];

const STATS = [
  { value: "300+", label: "Colleges" },
  { value: "1,200+", label: "Courses" },
  { value: "8", label: "Entrance exams" },
  { value: "5 yrs", label: "Cutoff history" },
];

export default function HomePage() {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [focused, setFocused] = useState(false);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    router.push(trimmed ? `/colleges?q=${encodeURIComponent(trimmed)}` : "/colleges");
  };

  return (
    <div className="relative overflow-hidden">
      <div className="hero-mesh" aria-hidden="true" />
      <div className="absolute inset-0 dot-grid pointer-events-none" aria-hidden="true" />

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-14 pb-20 sm:pt-20 sm:pb-24">
        {/* Headline */}
        <h1
          className="animate-fade-up stagger text-center mt-6 text-[2.5rem] leading-[1.06] sm:text-6xl font-display font-extrabold tracking-tight text-balance"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          Find your <span className="brand-text">right</span> college
        </h1>

        <p
          className="animate-fade-up stagger text-center mt-4 text-base sm:text-lg text-muted-foreground max-w-xl mx-auto text-pretty"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          Two questions decide everything. Can you get in? Is it worth the money?
          We answer both with real cutoffs, fees and placement data.
        </p>

        {/* Search */}
        <form
          onSubmit={handleSearch}
          className="animate-fade-up stagger relative mt-9 max-w-2xl mx-auto"
          style={{ "--i": 3 } as React.CSSProperties}
        >
          <div
            className="relative rounded-2xl transition-all duration-300"
            style={{
              boxShadow: focused
                ? "0 0 0 3px color-mix(in oklch, var(--brand), transparent 78%), var(--shadow-lg)"
                : "var(--shadow-md)",
            }}
          >
            <svg
              className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              width="20" height="20" viewBox="0 0 20 20" fill="none"
              stroke="currentColor" strokeWidth="2" strokeLinecap="round"
              aria-hidden="true"
            >
              <circle cx="8.5" cy="8.5" r="6" />
              <path d="M13 13l4.5 4.5" />
            </svg>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder="Search any college, city or branch…"
              className="w-full h-16 pl-14 pr-32 text-base sm:text-[1.0625rem] rounded-2xl bg-card border border-border focus:outline-none focus:border-[color-mix(in_oklch,var(--brand),transparent_55%)] placeholder:text-muted-foreground/70"
              id="home-search"
              aria-label="Search colleges"
              autoFocus
            />
            <button
              type="submit"
              className="btn-brand absolute right-2.5 top-1/2 -translate-y-1/2 h-11 px-5 rounded-xl text-sm font-semibold"
            >
              Search
            </button>
          </div>
        </form>

        {/* Popular searches */}
        <div
          className="animate-fade-up stagger flex flex-wrap items-center justify-center gap-2 mt-5"
          style={{ "--i": 4 } as React.CSSProperties}
        >
          <span className="text-xs text-muted-foreground mr-1">Popular:</span>
          {POPULAR.map((p) => (
            <Link
              key={p.label}
              href={p.href}
              className="text-[0.8125rem] px-3.5 py-1.5 rounded-full bg-card border border-border text-muted-foreground hover:text-foreground hover:border-[color-mix(in_oklch,var(--brand),transparent_60%)] hover:shadow-sm-t transition-all duration-200"
            >
              {p.label}
            </Link>
          ))}
        </div>

        {/* Three ways in */}
        <div className="grid sm:grid-cols-3 gap-4 mt-16">
          {PATHS.map((p, i) => (
            <Link
              key={p.href}
              href={p.href}
              className="surface lift stagger animate-fade-up group p-5 flex flex-col"
              style={{ "--i": 5 + i } as React.CSSProperties}
            >
              <span
                className="flex items-center justify-center w-11 h-11 rounded-xl mb-4"
                style={{
                  background: `color-mix(in oklch, ${p.accent}, transparent 88%)`,
                  color: p.accent,
                }}
              >
                <svg
                  width="21" height="21" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="1.9"
                  strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
                >
                  {p.icon}
                </svg>
              </span>
              <h2 className="font-display font-semibold text-[0.975rem] flex items-center gap-1.5">
                {p.title}
                <svg
                  width="15" height="15" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                  className="opacity-0 -translate-x-1 group-hover:opacity-60 group-hover:translate-x-0 transition-all duration-200"
                  aria-hidden="true"
                >
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </h2>
              <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                {p.body}
              </p>
            </Link>
          ))}
        </div>

        {/* Trust strip */}
        <div
          className="animate-fade-up stagger grid grid-cols-2 sm:grid-cols-4 gap-px mt-14 rounded-2xl overflow-hidden border border-border bg-border"
          style={{ "--i": 8 } as React.CSSProperties}
        >
          {STATS.map((s) => (
            <div key={s.label} className="bg-card px-4 py-5 text-center">
              <p className="font-display text-2xl font-bold tabular-nums">{s.value}</p>
              <p className="text-xs text-muted-foreground mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
