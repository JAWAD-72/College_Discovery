"use client";

import { useId } from "react";

const STAR_PATH =
  "M10 1.4l2.52 5.1 5.63.82-4.07 3.97.96 5.61L10 14.25l-5.04 2.65.96-5.61L1.85 7.32l5.63-.82z";

interface RatingStarsProps {
  rating: number;
  size?: "xs" | "sm" | "md" | "lg";
  /** How many stars to draw. 1 renders a single filled star as a compact icon. */
  count?: number;
}

const SIZES = { xs: 12, sm: 14, md: 18, lg: 22 } as const;

export function RatingStars({ rating, size = "sm", count = 5 }: RatingStarsProps) {
  // useId keeps each clip path unique — duplicate SVG ids across cards mis-render.
  const uid = useId().replace(/[:]/g, "");
  const starSize = SIZES[size];

  // Compact mode: one solid star used as a label icon next to the number.
  if (count === 1) {
    return (
      <svg
        width={starSize} height={starSize} viewBox="0 0 20 20"
        fill="var(--warm)" aria-hidden="true" className="shrink-0"
      >
        <path d={STAR_PATH} />
      </svg>
    );
  }

  const clamped = Math.max(0, Math.min(5, rating));
  const full = Math.floor(clamped);
  const partial = clamped - full;
  const empty = 5 - full - (partial > 0 ? 1 : 0);

  return (
    <div
      className="flex items-center gap-0.5"
      role="img"
      aria-label={`${clamped.toFixed(1)} out of 5 stars`}
    >
      {Array.from({ length: full }).map((_, i) => (
        <svg
          key={`f${i}`} width={starSize} height={starSize} viewBox="0 0 20 20"
          fill="var(--warm)" aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}

      {partial > 0 && (
        <svg width={starSize} height={starSize} viewBox="0 0 20 20" aria-hidden="true">
          <defs>
            <clipPath id={`half-${uid}`}>
              <rect x="0" y="0" width={partial * 20} height="20" />
            </clipPath>
          </defs>
          <path d={STAR_PATH} fill="color-mix(in oklch, var(--warm), transparent 78%)" />
          <path d={STAR_PATH} fill="var(--warm)" clipPath={`url(#half-${uid})`} />
        </svg>
      )}

      {Array.from({ length: empty }).map((_, i) => (
        <svg
          key={`e${i}`} width={starSize} height={starSize} viewBox="0 0 20 20"
          fill="color-mix(in oklch, var(--warm), transparent 78%)" aria-hidden="true"
        >
          <path d={STAR_PATH} />
        </svg>
      ))}
    </div>
  );
}
