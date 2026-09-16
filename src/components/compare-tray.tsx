"use client";

import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { initialsOf, monogramGradient } from "./college-card";

const MAX = 3;

export function CompareTray() {
  const { colleges, remove, clear } = useCompare();

  if (colleges.length === 0) return null;

  const ready = colleges.length >= 2;

  return (
    <>
      {/* Reserves flow space so the fixed tray never covers page content */}
      <div className="h-[4.75rem] shrink-0" aria-hidden="true" />
      <div className="compare-tray px-3 py-3 sm:px-4" role="region" aria-label="Compare tray">
      <div className="max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
        {/* Slot counter */}
        <div className="hidden sm:flex flex-col shrink-0">
          <span className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
            Comparing
          </span>
          <div className="flex items-center gap-1 mt-1" aria-hidden="true">
            {Array.from({ length: MAX }).map((_, i) => (
              <span
                key={i}
                className={`h-1.5 rounded-full transition-all duration-300 ${
                  i < colleges.length ? "w-6 brand-gradient" : "w-3 bg-border"
                }`}
              />
            ))}
          </div>
        </div>

        {/* Selected chips */}
        <div className="flex items-center gap-2 flex-1 min-w-0 overflow-x-auto no-scrollbar">
          {colleges.map((c) => (
            <div
              key={c.id}
              className="animate-pop-in flex items-center gap-2 pl-1.5 pr-1 py-1.5 rounded-xl border border-border bg-card text-sm shrink-0 shadow-xs-t"
            >
              <span
                className="flex items-center justify-center w-7 h-7 rounded-lg text-white text-[0.65rem] font-display font-bold shrink-0"
                style={{ backgroundImage: monogramGradient(c.slug) }}
                aria-hidden="true"
              >
                {initialsOf(c.name)}
              </span>
              <span className="truncate max-w-[110px] sm:max-w-[180px] font-medium">
                {c.name}
              </span>
              <button
                onClick={() => remove(c.id)}
                className="flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10 transition-colors shrink-0"
                aria-label={`Remove ${c.name} from comparison`}
              >
                <svg
                  width="13" height="13" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2.4" strokeLinecap="round"
                  aria-hidden="true"
                >
                  <path d="M6 6l12 12M18 6L6 18" />
                </svg>
              </button>
            </div>
          ))}

          {colleges.length < MAX && (
            <span className="hidden sm:flex items-center px-3 py-2 rounded-xl border border-dashed border-border text-xs text-muted-foreground shrink-0">
              {ready ? "Add one more" : "Pick one more to compare"}
            </span>
          )}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-2 shrink-0">
          <button
            onClick={clear}
            className="text-sm text-muted-foreground hover:text-foreground px-2.5 py-2 rounded-lg hover:bg-secondary transition-colors"
            aria-label="Clear all compared colleges"
          >
            Clear
          </button>
          {ready ? (
            <Link
              href={`/compare?ids=${colleges.map((c) => c.id).join(",")}`}
              className="btn-brand text-sm font-semibold px-4 sm:px-5 py-2.5 rounded-xl inline-flex items-center gap-1.5"
            >
              Compare
              <svg
                width="15" height="15" viewBox="0 0 24 24" fill="none"
                stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M5 12h13M12 5l7 7-7 7" />
              </svg>
            </Link>
          ) : (
            <span className="text-sm font-medium px-4 py-2.5 rounded-xl border border-dashed border-border text-muted-foreground cursor-default">
              Compare
            </span>
          )}
        </div>
      </div>
      </div>
    </>
  );
}
