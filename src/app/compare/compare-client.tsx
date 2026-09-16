"use client";

import { useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Fragment, useState } from "react";
import Link from "next/link";
import { Skeleton } from "@/components/skeletons";
import { ErrorState, EmptyState } from "@/components/states";
import { initialsOf, monogramGradient } from "@/components/college-card";
import { formatINR } from "@/components/stat-blocks";

interface CompareCollege {
  id: number; slug: string; name: string; shortName: string | null;
  city: string; state: string; type: string; establishedYear: number;
  campusAcres: number | null; hostelAvailable: boolean; naacGrade: string | null;
  nirfRank: number | null; avgRating: number; reviewCount: number;
  minFeesTotal: number; maxFeesTotal: number;
  courses: { id: number; name: string; branch: string; degreeLevel: string; totalFees: number; examAccepted: string }[];
  placements: { year: number; highestPackageLpa: number; averagePackageLpa: number; medianPackageLpa: number; placementPercentage: number }[];
  ratingBreakdown: { academics: number; infrastructure: number; placements: number; faculty: number };
}

interface CompareRow {
  label: string;
  group: string;
  values: (string | number | null)[];
  format?: "fee" | "lpa" | "percent" | "rank" | "rating";
  higherIsBetter?: boolean;
}

const GROUP_ICONS: Record<string, React.ReactNode> = {
  Basics: <><rect x="4" y="4" width="16" height="16" rx="3" /><path d="M9 9h6M9 13h6M9 17h3" /></>,
  Fees: <><path d="M6 4h9M6 9h9M15 4c2.5 0 3.5 5-1 5H8l7 10" /></>,
  Placements: <><path d="M3 17l5-5 4 3 6-7" /><path d="M14 8h4v4" /></>,
  Ratings: <><path d="M12 3.5l2.6 5.3 5.9.9-4.3 4.1 1 5.8-5.2-2.7-5.2 2.7 1-5.8L3.5 9.7l5.9-.9z" /></>,
};

async function fetchCompare(ids: string): Promise<{ data: { colleges: CompareCollege[] } }> {
  const res = await fetch(`/api/v1/colleges/compare?ids=${ids}`);
  if (!res.ok) throw new Error("Failed to fetch comparison data");
  return res.json();
}

export function CompareClient() {
  const searchParams = useSearchParams();
  const ids = searchParams.get("ids") || "";
  const [diffOnly, setDiffOnly] = useState(false);

  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["compare", ids],
    queryFn: () => fetchCompare(ids),
    enabled: ids.length > 0,
  });

  if (!ids) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="No colleges selected"
          description="Add 2-3 colleges from the listing page to compare them side by side."
          action={{ label: "Browse colleges", href: "/colleges" }}
        />
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-4">
        <Skeleton className="h-9 w-56" />
        <Skeleton className="h-[28rem] w-full rounded-2xl" />
      </div>
    );
  }

  if (isError) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <ErrorState message="Failed to load comparison" onRetry={() => refetch()} />
      </div>
    );
  }

  const colleges = data?.data?.colleges || [];
  if (colleges.length < 2) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16">
        <EmptyState
          title="Not enough colleges found"
          description="One or more of the selected colleges could not be found."
          action={{ label: "Browse colleges", href: "/colleges" }}
        />
      </div>
    );
  }

  // Build comparison rows
  const latestPlacement = (c: CompareCollege) => c.placements[0];

  const rows: CompareRow[] = [
    // Basics
    { label: "Type", group: "Basics", values: colleges.map((c) => c.type) },
    { label: "Established", group: "Basics", values: colleges.map((c) => c.establishedYear) },
    { label: "Location", group: "Basics", values: colleges.map((c) => `${c.city}, ${c.state}`) },
    { label: "NIRF Rank", group: "Basics", values: colleges.map((c) => c.nirfRank ?? "—"), format: "rank", higherIsBetter: false },
    { label: "NAAC Grade", group: "Basics", values: colleges.map((c) => c.naacGrade ?? "—") },
    { label: "Campus (acres)", group: "Basics", values: colleges.map((c) => c.campusAcres ?? "—") },
    { label: "Hostel", group: "Basics", values: colleges.map((c) => c.hostelAvailable ? "Yes" : "No") },
    // Fees
    { label: "Min Total Fees", group: "Fees", values: colleges.map((c) => c.minFeesTotal), format: "fee", higherIsBetter: false },
    { label: "Max Total Fees", group: "Fees", values: colleges.map((c) => c.maxFeesTotal), format: "fee", higherIsBetter: false },
    { label: "Courses Offered", group: "Fees", values: colleges.map((c) => c.courses.length), higherIsBetter: true },
    // Placements
    { label: "Highest Package", group: "Placements", values: colleges.map((c) => latestPlacement(c)?.highestPackageLpa ?? "—"), format: "lpa", higherIsBetter: true },
    { label: "Average Package", group: "Placements", values: colleges.map((c) => latestPlacement(c)?.averagePackageLpa ?? "—"), format: "lpa", higherIsBetter: true },
    { label: "Median Package", group: "Placements", values: colleges.map((c) => latestPlacement(c)?.medianPackageLpa ?? "—"), format: "lpa", higherIsBetter: true },
    { label: "Placement %", group: "Placements", values: colleges.map((c) => latestPlacement(c)?.placementPercentage ?? "—"), format: "percent", higherIsBetter: true },
    // Ratings
    { label: "Overall Rating", group: "Ratings", values: colleges.map((c) => c.avgRating), format: "rating", higherIsBetter: true },
    { label: "Reviews", group: "Ratings", values: colleges.map((c) => c.reviewCount), higherIsBetter: true },
    { label: "Academics", group: "Ratings", values: colleges.map((c) => c.ratingBreakdown?.academics ?? "—"), format: "rating", higherIsBetter: true },
    { label: "Placements (Rating)", group: "Ratings", values: colleges.map((c) => c.ratingBreakdown?.placements ?? "—"), format: "rating", higherIsBetter: true },
    { label: "Faculty", group: "Ratings", values: colleges.map((c) => c.ratingBreakdown?.faculty ?? "—"), format: "rating", higherIsBetter: true },
    { label: "Infrastructure", group: "Ratings", values: colleges.map((c) => c.ratingBreakdown?.infrastructure ?? "—"), format: "rating", higherIsBetter: true },
  ];

  const isDifferent = (row: CompareRow) => {
    const vals = row.values.map((v) => String(v));
    return new Set(vals).size > 1;
  };

  const getBestIndex = (row: CompareRow): number | null => {
    if (row.higherIsBetter === undefined) return null;
    if (!isDifferent(row)) return null;
    const numVals = row.values.map((v) => (typeof v === "number" ? v : null));
    if (numVals.every((v) => v === null)) return null;

    let bestIdx = 0;
    let bestVal = numVals[0] ?? (row.higherIsBetter ? -Infinity : Infinity);
    for (let i = 1; i < numVals.length; i++) {
      const val = numVals[i];
      if (val === null) continue;
      const isBetter = row.higherIsBetter ? val > bestVal : val < bestVal;
      if (isBetter) { bestIdx = i; bestVal = val; }
    }
    return bestIdx;
  };

  const formatValue = (val: string | number | null, format?: string) => {
    if (val === null || val === "—") return "—";
    const n = Number(val);
    switch (format) {
      case "fee": return `₹${formatINR(n)}`;
      case "lpa": return `₹${n}L`;
      case "percent": return `${n}%`;
      case "rank": return typeof val === "number" ? `#${val}` : val;
      case "rating": return typeof val === "number" ? val.toFixed(1) : val;
      default: return String(val);
    }
  };

  const groups = [...new Set(rows.map((r) => r.group))];
  const filteredRows = diffOnly ? rows.filter(isDifferent) : rows;
  const filteredGroups = groups.filter((g) => filteredRows.some((r) => r.group === g));

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-5 animate-fade-up">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
            Head to head
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Best value in each row is highlighted in green.
          </p>
        </div>

        {/* Differences-only switch */}
        <button
          type="button"
          role="switch"
          aria-checked={diffOnly}
          onClick={() => setDiffOnly(!diffOnly)}
          className="flex items-center gap-2.5 text-sm font-medium px-3.5 py-2.5 rounded-xl bg-card border border-border shadow-xs-t hover:bg-secondary transition-colors"
        >
          <span
            className={`relative w-9 h-5 rounded-full transition-colors duration-200 ${
              diffOnly ? "brand-gradient" : "bg-border"
            }`}
            aria-hidden="true"
          >
            <span
              className="absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white shadow-sm transition-transform duration-200"
              style={{ transform: diffOnly ? "translateX(1rem)" : "none" }}
            />
          </span>
          Differences only
        </button>
      </div>

      <div className="surface overflow-hidden animate-fade-up stagger" style={{ "--i": 1 } as React.CSSProperties}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr className="bg-secondary/60">
                <th className="sticky-col text-left px-4 py-4 min-w-[150px] border-r border-border bg-secondary/60">
                  <span className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground">
                    Metric
                  </span>
                </th>
                {colleges.map((c) => (
                  <th key={c.id} className="text-left px-4 py-4 min-w-[190px] align-top">
                    <div className="flex items-start gap-2.5">
                      <span
                        className="shrink-0 flex items-center justify-center w-9 h-9 rounded-lg text-white font-display font-bold text-[0.65rem]"
                        style={{ backgroundImage: monogramGradient(c.slug) }}
                        aria-hidden="true"
                      >
                        {initialsOf(c.name)}
                      </span>
                      <span className="min-w-0">
                        <Link
                          href={`/colleges/${c.slug}`}
                          className="block font-display font-semibold leading-snug hover:text-[var(--brand-ink)] transition-colors"
                        >
                          {c.shortName || c.name}
                        </Link>
                        <span className="block text-xs text-muted-foreground font-normal mt-0.5">
                          {c.city}, {c.state}
                        </span>
                      </span>
                    </div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filteredGroups.map((group) => (
                <Fragment key={group}>
                  <tr>
                    <td
                      colSpan={colleges.length + 1}
                      className="px-4 py-2.5 border-t border-border bg-[color-mix(in_oklch,var(--brand-soft),transparent_40%)]"
                    >
                      <span className="flex items-center gap-2 text-[0.7rem] font-semibold uppercase tracking-wider text-[var(--brand-ink)]">
                        <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                          {GROUP_ICONS[group]}
                        </svg>
                        {group}
                      </span>
                    </td>
                  </tr>
                  {filteredRows
                    .filter((r) => r.group === group)
                    .map((row) => {
                      const diff = isDifferent(row);
                      const bestIdx = getBestIndex(row);
                      return (
                        <tr
                          key={row.label}
                          className={`border-t border-border ${diff ? "row-different" : "row-identical"}`}
                        >
                          <td className="sticky-col px-4 py-3 text-muted-foreground border-r border-border whitespace-nowrap">
                            {row.label}
                          </td>
                          {row.values.map((val, i) => (
                            <td key={i} className="px-4 py-3 tabular-nums">
                              <span className={`inline-flex items-center gap-1.5 ${bestIdx === i ? "best-value" : ""}`}>
                                {formatValue(val, row.format)}
                                {bestIdx === i && (
                                  <svg
                                    width="13" height="13" viewBox="0 0 24 24" fill="none"
                                    stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
                                    aria-label="Best in row"
                                  >
                                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                                  </svg>
                                )}
                              </span>
                            </td>
                          ))}
                        </tr>
                      );
                    })}
                </Fragment>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Scroll affordance hint on mobile */}
      <p className="sm:hidden text-xs text-muted-foreground text-center mt-3">
        Swipe the table sideways to see every column
      </p>
    </div>
  );
}
