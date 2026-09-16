"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { initialsOf, monogramGradient } from "@/components/college-card";

/**
 * Saved page — shows saved colleges and comparisons.
 * Auth-gated in production; until then it surfaces the current session's
 * shortlist so the page is never a dead end.
 */
export function SavedClient() {
  // In production, check auth and fetch saved items.
  const isAuthenticated = false;
  const { colleges, remove } = useCompare();

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-10">
      <div className="animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">Saved</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Your shortlist and saved comparisons live here.
        </p>
      </div>

      {/* This session's shortlist */}
      <section className="mt-7 animate-fade-up stagger" style={{ "--i": 1 } as React.CSSProperties}>
        <h2 className="font-display text-base font-semibold mb-3">
          This session&apos;s shortlist
          {colleges.length > 0 && (
            <span className="ml-2 text-xs font-medium text-muted-foreground tabular-nums">
              {colleges.length} of 3
            </span>
          )}
        </h2>

        {colleges.length === 0 ? (
          <div className="surface border-dashed p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Nothing shortlisted yet. Add colleges as you browse and they appear here.
            </p>
            <Link
              href="/colleges"
              className="btn-brand inline-flex mt-4 text-sm font-semibold px-5 py-2.5 rounded-xl"
            >
              Browse colleges
            </Link>
          </div>
        ) : (
          <div className="space-y-2.5">
            {colleges.map((c, i) => (
              <div
                key={c.id}
                className="surface lift animate-fade-up stagger flex items-center gap-3 p-3.5"
                style={{ "--i": i } as React.CSSProperties}
              >
                <span
                  className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-white font-display font-bold text-xs"
                  style={{ backgroundImage: monogramGradient(c.slug) }}
                  aria-hidden="true"
                >
                  {initialsOf(c.name)}
                </span>
                <Link
                  href={`/colleges/${c.slug}`}
                  className="flex-1 min-w-0 font-medium text-sm hover:text-[var(--brand-ink)] transition-colors truncate"
                >
                  {c.name}
                </Link>
                <button
                  onClick={() => remove(c.id)}
                  className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors"
                  aria-label={`Remove ${c.name} from shortlist`}
                >
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            ))}

            {colleges.length >= 2 && (
              <Link
                href={`/compare?ids=${colleges.map((c) => c.id).join(",")}`}
                className="btn-brand inline-flex items-center gap-2 mt-2 text-sm font-semibold px-5 py-2.5 rounded-xl"
              >
                Compare these {colleges.length}
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </Link>
            )}
          </div>
        )}
      </section>

      {/* Sign-in prompt */}
      {!isAuthenticated && (
        <section
          className="surface relative overflow-hidden p-6 mt-8 animate-fade-up stagger"
          style={{ "--i": 2 } as React.CSSProperties}
        >
          <div className="hero-mesh opacity-60" aria-hidden="true" />
          <div className="relative z-10 flex flex-col sm:flex-row sm:items-center gap-4">
            <span
              className="flex items-center justify-center w-12 h-12 rounded-2xl shrink-0"
              style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
              aria-hidden="true"
            >
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.9" strokeLinecap="round" strokeLinejoin="round">
                <path d="M19 21l-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2z" />
              </svg>
            </span>
            <div className="flex-1">
              <h2 className="font-display font-semibold">Keep your shortlist forever</h2>
              <p className="text-sm text-muted-foreground mt-1 leading-relaxed">
                Sign in to save colleges and comparisons across devices, and get
                notified when cutoffs for your shortlist are published.
              </p>
            </div>
            <span className="shrink-0 text-xs font-medium px-3 py-1.5 rounded-full border border-dashed border-border text-muted-foreground">
              Coming soon
            </span>
          </div>
        </section>
      )}
    </div>
  );
}
