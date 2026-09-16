"use client";

import Link from "next/link";
import { RatingStars } from "./rating-stars";
import { FeeRange } from "./stat-blocks";
import { useCompare } from "@/lib/compare-context";
import { useState } from "react";

interface CollegeCardProps {
  id: number;
  slug: string;
  name: string;
  city: string;
  state: string;
  type: string;
  nirfRank: number | null;
  avgRating: number;
  reviewCount: number;
  minFeesTotal: number;
  maxFeesTotal: number;
  naacGrade: string | null;
  topBranch: string | null;
  /** Stagger index for the entrance animation */
  index?: number;
}

/** Initials for the monogram: "Indian Institute of Technology" -> "IIT" */
export function initialsOf(name: string) {
  const skip = new Set(["of", "and", "the", "for", "in", "at"]);
  const letters = name
    .split(/[\s-]+/)
    .filter((w) => w.length > 0 && !skip.has(w.toLowerCase()))
    .map((w) => w[0].toUpperCase())
    .join("");
  return letters.slice(0, 3) || name.slice(0, 2).toUpperCase();
}

/** Stable per-college gradient, drawn from the chart ramp so the grid stays coherent. */
export function monogramGradient(seed: string) {
  const hues = [276, 215, 175, 72, 20, 300];
  let h = 0;
  for (let i = 0; i < seed.length; i++) h = (h * 31 + seed.charCodeAt(i)) >>> 0;
  const hue = hues[h % hues.length];
  return `linear-gradient(135deg, oklch(0.62 0.17 ${hue}), oklch(0.5 0.19 ${hue + 18}))`;
}

export function CollegeCard({
  id, slug, name, city, state, type, nirfRank,
  avgRating, reviewCount, minFeesTotal, maxFeesTotal,
  naacGrade, topBranch, index = 0,
}: CollegeCardProps) {
  const { add, remove, isSelected } = useCompare();
  const selected = isSelected(id);
  const [error, setError] = useState<string | null>(null);

  const handleCompareToggle = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (selected) {
      remove(id);
      setError(null);
    } else {
      const result = add({ id, name, slug });
      if (!result.success) {
        setError(result.error || "Cannot add");
        setTimeout(() => setError(null), 2200);
      }
    }
  };

  return (
    <Link
      href={`/colleges/${slug}`}
      className="surface lift animate-fade-up stagger group relative block p-4 sm:p-5 overflow-hidden"
      style={{ "--i": Math.min(index, 8) } as React.CSSProperties}
      id={`college-card-${id}`}
    >
      {/* Brand wash that warms up on hover */}
      <span
        className="absolute inset-x-0 top-0 h-px opacity-0 group-hover:opacity-100 transition-opacity duration-300 brand-gradient"
        aria-hidden="true"
      />

      <div className="flex items-start gap-3.5">
        {/* Monogram */}
        <span
          className="shrink-0 flex items-center justify-center w-12 h-12 sm:w-14 sm:h-14 rounded-xl text-white font-display font-bold text-sm sm:text-base tracking-tight shadow-sm-t"
          style={{ backgroundImage: monogramGradient(slug) }}
          aria-hidden="true"
        >
          {initialsOf(name)}
        </span>

        <div className="min-w-0 flex-1">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <h3 className="font-display font-semibold text-[0.975rem] sm:text-base leading-snug line-clamp-2 group-hover:text-[var(--brand-ink)] transition-colors duration-200">
                {name}
              </h3>
              <p className="text-[0.8125rem] text-muted-foreground mt-1 flex items-center gap-1.5">
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  className="shrink-0 opacity-70" aria-hidden="true"
                >
                  <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                  <circle cx="12" cy="10" r="2.5" />
                </svg>
                {city}, {state}
              </p>
            </div>

            <button
              onClick={handleCompareToggle}
              className={`shrink-0 flex items-center justify-center w-10 h-10 rounded-xl border transition-all duration-200 ${
                selected
                  ? "brand-gradient text-white border-transparent shadow-sm-t"
                  : "border-border text-muted-foreground hover:text-[var(--brand-ink)] hover:border-[color-mix(in_oklch,var(--brand),transparent_60%)] hover:bg-[var(--brand-soft)]"
              }`}
              aria-label={selected ? `Remove ${name} from comparison` : `Add ${name} to comparison`}
              aria-pressed={selected}
              title={selected ? "In comparison" : "Add to compare"}
            >
              <svg
                width="17" height="17" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                {selected ? (
                  <path d="M5 12.5l4.5 4.5L19 7.5" />
                ) : (
                  <>
                    <rect x="3.5" y="5" width="7" height="14" rx="1.5" />
                    <rect x="13.5" y="5" width="7" height="14" rx="1.5" />
                  </>
                )}
              </svg>
            </button>
          </div>

          {/* Metrics */}
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--warm-soft)] text-[0.8125rem]">
              <RatingStars rating={avgRating} count={1} />
              <span className="font-semibold tabular-nums">{avgRating.toFixed(1)}</span>
              <span className="text-muted-foreground tabular-nums">({reviewCount})</span>
            </span>

            <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-secondary text-[0.8125rem]">
              <svg
                width="13" height="13" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2" strokeLinecap="round"
                className="opacity-60" aria-hidden="true"
              >
                <path d="M6 4h9M6 9h9M15 4c2.5 0 3.5 5-1 5H8l7 10" />
              </svg>
              <span className="font-medium">
                <FeeRange min={minFeesTotal} max={maxFeesTotal} />
              </span>
            </span>

            {nirfRank && (
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--brand-soft)] text-[var(--brand-ink)] text-[0.8125rem] font-medium">
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  aria-hidden="true"
                >
                  <path d="M8 4h8v5a4 4 0 1 1-8 0z" />
                  <path d="M12 13v4M9 21h6M8 6H5v1a3 3 0 0 0 3 3M16 6h3v1a3 3 0 0 1-3 3" />
                </svg>
                NIRF <span className="tabular-nums font-semibold">#{nirfRank}</span>
              </span>
            )}
          </div>

          {/* Tags */}
          <div className="flex flex-wrap gap-1.5 mt-2.5">
            <span className="text-[0.7rem] px-2 py-0.5 rounded-md border border-border text-muted-foreground">
              {type}
            </span>
            {naacGrade && (
              <span className="text-[0.7rem] px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                NAAC {naacGrade}
              </span>
            )}
            {topBranch && (
              <span className="text-[0.7rem] px-2 py-0.5 rounded-md border border-border text-muted-foreground">
                {topBranch}
              </span>
            )}
          </div>
        </div>
      </div>

      {error && (
        <p className="text-xs text-destructive mt-2.5 animate-fade-in" role="status">
          {error}
        </p>
      )}
    </Link>
  );
}
