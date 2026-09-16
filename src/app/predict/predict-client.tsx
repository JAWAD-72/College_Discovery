"use client";

import { useState } from "react";
import { useQueryState, parseAsString, parseAsInteger } from "nuqs";
import Link from "next/link";
import { useCompare } from "@/lib/compare-context";
import { Skeleton } from "@/components/skeletons";
import { EmptyState } from "@/components/states";
import { initialsOf, monogramGradient } from "@/components/college-card";
import { formatINR } from "@/components/stat-blocks";

interface PredictionCollege {
  id: number; slug: string; name: string; shortName: string | null;
  city: string; state: string; type: string; nirfRank: number | null;
  avgRating: number; minFeesTotal: number; maxFeesTotal: number;
}

interface PredictionResult {
  college: PredictionCollege;
  course: { id: number; name: string; branch: string; totalFees: number };
  cutoff: { exam: string; category: string; year: number; openingRank: number; closingRank: number };
  margin: number;
}

interface PredictResponse {
  data: {
    safe: PredictionResult[];
    target: PredictionResult[];
    reach: PredictionResult[];
    meta: { exam: string; rank: number; category: string; totalMatches: number };
  };
}

const EXAMS = ["JEE Main", "JEE Advanced", "GATE", "NEET", "CAT", "XAT", "CLAT", "CUET"];
const CATEGORIES = ["General", "OBC", "SC", "ST", "EWS"];

const BUCKETS = {
  Safe: {
    color: "var(--safe)",
    soft: "var(--safe-soft)",
    description: "Your rank clears the cutoff comfortably",
    icon: <path d="M9 12.5l2.5 2.5L16 9.5M12 3l7.5 3v6c0 4.2-3 8-7.5 9-4.5-1-7.5-4.8-7.5-9V6z" />,
  },
  Target: {
    color: "var(--target)",
    soft: "var(--target-soft)",
    description: "Your rank sits right around the cutoff",
    icon: (
      <>
        <circle cx="12" cy="12" r="8.5" />
        <circle cx="12" cy="12" r="4" />
        <circle cx="12" cy="12" r="0.8" fill="currentColor" />
      </>
    ),
  },
  Reach: {
    color: "var(--reach)",
    soft: "var(--reach-soft)",
    description: "A stretch, but within striking distance",
    icon: (
      <>
        <path d="M5 19l5.5-5.5M8 16l-2.5.8L6.5 14" />
        <path d="M13.5 11a10 10 0 0 0 5.5-8 10 10 0 0 0-8 5.5l-2 4.5 4.5-2Z" />
      </>
    ),
  },
} as const;

export function PredictClient() {
  const [exam, setExam] = useQueryState("exam", parseAsString.withDefault(""));
  const [rank, setRank] = useQueryState("rank", parseAsInteger);
  const [category, setCategory] = useQueryState("category", parseAsString.withDefault(""));

  const [results, setResults] = useState<PredictResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Inline form validation
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const errors: Record<string, string> = {};
  if (touched.exam && !exam) errors.exam = "Select an exam";
  if (touched.rank && (!rank || rank < 1)) errors.rank = "Enter a valid rank";
  if (touched.category && !category) errors.category = "Select a category";

  const canSubmit = !!exam && !!rank && rank > 0 && !!category;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setTouched({ exam: true, rank: true, category: true });
    if (!canSubmit) return;

    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/v1/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ exam, rank, category }),
      });
      if (!res.ok) throw new Error("Prediction failed");
      const data: PredictResponse = await res.json();
      setResults(data);
    } catch {
      setError("Failed to predict colleges. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const fieldClass = (hasError: boolean) =>
    `w-full h-12 px-3.5 text-sm rounded-xl bg-card border shadow-xs-t focus:outline-none transition-colors ${
      hasError
        ? "border-destructive focus:border-destructive"
        : "border-border focus:border-[color-mix(in_oklch,var(--brand),transparent_55%)]"
    }`;

  const counts = results
    ? {
        Safe: results.data.safe.length,
        Target: results.data.target.length,
        Reach: results.data.reach.length,
      }
    : null;

  return (
    <div className="relative overflow-hidden">
      <div className="hero-mesh" aria-hidden="true" />

      <div className="relative z-10 max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        {/* Header */}
        <div className="animate-fade-up">
          <span
            className="inline-flex items-center justify-center w-12 h-12 rounded-2xl mb-4"
            style={{ background: "var(--brand-soft)", color: "var(--brand)" }}
            aria-hidden="true"
          >
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 17l5-5 4 3 6-7" />
              <path d="M14 8h4v4" />
            </svg>
          </span>
          <h1 className="font-display text-2xl sm:text-4xl font-extrabold tracking-tight">
            Rank predictor
          </h1>
          <p className="text-muted-foreground mt-2 text-[0.9375rem] leading-relaxed max-w-xl">
            Tell us your exam rank. We match it against five years of real closing
            cutoffs and sort every option into <strong className="text-foreground font-semibold">Safe</strong>,{" "}
            <strong className="text-foreground font-semibold">Target</strong> and{" "}
            <strong className="text-foreground font-semibold">Reach</strong>.
          </p>
        </div>

        {/* Form */}
        <form
          onSubmit={handleSubmit}
          className="surface p-5 sm:p-6 mt-7 animate-fade-up stagger"
          style={{ "--i": 1 } as React.CSSProperties}
        >
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label htmlFor="predict-exam" className="text-sm font-medium block mb-1.5">
                Exam
              </label>
              <div className="relative">
                <select
                  id="predict-exam"
                  value={exam}
                  onChange={(e) => { setExam(e.target.value || null); setTouched((t) => ({ ...t, exam: true })); }}
                  className={`${fieldClass(!!errors.exam)} appearance-none pr-9 cursor-pointer`}
                  aria-invalid={!!errors.exam}
                >
                  <option value="">Select exam</option>
                  {EXAMS.map((e) => <option key={e} value={e}>{e}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 9l7 7 7-7" />
                </svg>
              </div>
              {errors.exam && <p className="text-xs text-destructive mt-1.5">{errors.exam}</p>}
            </div>

            <div>
              <label htmlFor="predict-rank" className="text-sm font-medium block mb-1.5">
                Your rank
              </label>
              <input
                id="predict-rank"
                type="number"
                inputMode="numeric"
                value={rank ?? ""}
                onChange={(e) => { setRank(e.target.value ? parseInt(e.target.value) : null); setTouched((t) => ({ ...t, rank: true })); }}
                placeholder="e.g. 5000"
                className={`${fieldClass(!!errors.rank)} tabular-nums`}
                aria-invalid={!!errors.rank}
                min={1}
              />
              {errors.rank && <p className="text-xs text-destructive mt-1.5">{errors.rank}</p>}
            </div>

            <div>
              <label htmlFor="predict-category" className="text-sm font-medium block mb-1.5">
                Category
              </label>
              <div className="relative">
                <select
                  id="predict-category"
                  value={category}
                  onChange={(e) => { setCategory(e.target.value || null); setTouched((t) => ({ ...t, category: true })); }}
                  className={`${fieldClass(!!errors.category)} appearance-none pr-9 cursor-pointer`}
                  aria-invalid={!!errors.category}
                >
                  <option value="">Select category</option>
                  {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                </select>
                <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 9l7 7 7-7" />
                </svg>
              </div>
              {errors.category && <p className="text-xs text-destructive mt-1.5">{errors.category}</p>}
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="btn-brand w-full sm:w-auto mt-5 px-6 py-3 text-sm font-semibold rounded-xl inline-flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <span className="w-4 h-4 rounded-full border-2 border-white/40 border-t-white animate-spin" aria-hidden="true" />
                Matching cutoffs…
              </>
            ) : (
              <>
                Predict my colleges
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <path d="M5 12h13M12 5l7 7-7 7" />
                </svg>
              </>
            )}
          </button>

          {/* Disclaimer */}
          <p className="flex gap-2.5 mt-5 pt-4 border-t border-border text-xs text-muted-foreground leading-relaxed">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="shrink-0 mt-0.5 text-[var(--warm)]" aria-hidden="true">
              <circle cx="12" cy="12" r="9" />
              <path d="M12 16v-4.5M12 8h.01" />
            </svg>
            <span>
              Predictions are indicative and based on historical cutoff data. Actual
              cutoffs shift every year with seat matrix and applicant pool. Use this
              as a directional guide, not an admission guarantee.
            </span>
          </p>
        </form>

        {/* Loading */}
        {loading && (
          <div className="space-y-3 mt-8">
            <Skeleton className="h-6 w-40" />
            {Array.from({ length: 4 }).map((_, i) => (
              <Skeleton key={i} className="h-28 w-full rounded-xl" />
            ))}
          </div>
        )}

        {error && (
          <div className="surface border-destructive/40 p-4 mt-8 text-sm text-destructive" role="alert">
            {error}
          </div>
        )}

        {/* Results */}
        {results && !loading && (
          <div className="mt-8 space-y-8">
            {/* Summary */}
            <div className="surface p-4 animate-fade-up">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">
                  {results.data.meta.totalMatches}
                </span>{" "}
                match{results.data.meta.totalMatches !== 1 ? "es" : ""} for{" "}
                <span className="font-medium text-foreground">{results.data.meta.exam}</span>{" "}
                rank{" "}
                <span className="font-medium text-foreground tabular-nums">
                  {results.data.meta.rank.toLocaleString()}
                </span>{" "}
                ({results.data.meta.category})
              </p>
              {counts && (
                <div className="flex flex-wrap gap-2 mt-3">
                  {(Object.keys(BUCKETS) as (keyof typeof BUCKETS)[]).map((b) => (
                    <span
                      key={b}
                      className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-lg"
                      style={{ background: BUCKETS[b].soft, color: BUCKETS[b].color }}
                    >
                      <span className="w-1.5 h-1.5 rounded-full" style={{ background: BUCKETS[b].color }} />
                      {counts[b]} {b}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {results.data.safe.length === 0 &&
              results.data.target.length === 0 &&
              results.data.reach.length === 0 && (
                <EmptyState
                  title="No matches at that rank"
                  description="Try a different exam or category — cutoff coverage varies by stream."
                />
              )}

            {(["Safe", "Target", "Reach"] as const).map((bucket) => {
              const key = bucket.toLowerCase() as "safe" | "target" | "reach";
              const items = results.data[key];
              if (items.length === 0) return null;
              return (
                <BucketSection
                  key={bucket}
                  title={bucket}
                  results={items}
                  studentRank={results.data.meta.rank}
                />
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

function BucketSection({
  title,
  results,
  studentRank,
}: {
  title: keyof typeof BUCKETS;
  results: PredictionResult[];
  studentRank: number;
}) {
  const { add, isSelected } = useCompare();
  const bucket = BUCKETS[title];

  return (
    <section className="animate-fade-up">
      {/* Bucket header */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-xl mb-3"
        style={{ background: bucket.soft }}
      >
        <span
          className="flex items-center justify-center w-9 h-9 rounded-xl shrink-0"
          style={{ background: bucket.color, color: "white" }}
          aria-hidden="true"
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            {bucket.icon}
          </svg>
        </span>
        <div className="min-w-0">
          <h2 className="font-display font-bold text-base" style={{ color: bucket.color }}>
            {title}
            <span className="ml-2 text-xs font-semibold tabular-nums opacity-70">
              {results.length}
            </span>
          </h2>
          <p className="text-xs text-muted-foreground">{bucket.description}</p>
        </div>
      </div>

      <div className="space-y-2.5">
        {results.map((r, i) => {
          const added = isSelected(r.college.id);
          // Where the student sits between opening and closing rank
          const span = Math.max(1, r.cutoff.closingRank - r.cutoff.openingRank);
          const position = Math.max(
            0,
            Math.min(100, ((studentRank - r.cutoff.openingRank) / span) * 100)
          );

          return (
            <div
              key={`${r.college.id}-${r.course.id}`}
              className="surface lift animate-fade-up stagger p-4"
              style={{ "--i": Math.min(i, 6) } as React.CSSProperties}
            >
              <div className="flex items-start gap-3">
                <span
                  className="shrink-0 flex items-center justify-center w-11 h-11 rounded-xl text-white font-display font-bold text-xs"
                  style={{ backgroundImage: monogramGradient(r.college.slug) }}
                  aria-hidden="true"
                >
                  {initialsOf(r.college.name)}
                </span>

                <div className="min-w-0 flex-1">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <Link
                        href={`/colleges/${r.college.slug}`}
                        className="font-display font-semibold text-[0.9375rem] leading-snug hover:text-[var(--brand-ink)] transition-colors"
                      >
                        {r.college.name}
                      </Link>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {r.college.city}, {r.college.state} · {r.course.name}
                      </p>
                    </div>

                    <button
                      onClick={() => add({ id: r.college.id, name: r.college.name, slug: r.college.slug })}
                      disabled={added}
                      className={`shrink-0 text-xs font-medium px-3 py-2 rounded-lg border transition-all duration-200 ${
                        added
                          ? "border-transparent bg-secondary text-muted-foreground cursor-default"
                          : "border-border hover:bg-[var(--brand-soft)] hover:text-[var(--brand-ink)] hover:border-[color-mix(in_oklch,var(--brand),transparent_60%)]"
                      }`}
                      aria-label={`Add ${r.college.name} to compare`}
                    >
                      {added ? "Added" : "+ Compare"}
                    </button>
                  </div>

                  {/* Where your rank lands in the cutoff band */}
                  <div className="mt-3">
                    <div className="relative h-1.5 rounded-full bg-secondary">
                      <span
                        className="absolute inset-y-0 left-0 rounded-full bar-grow"
                        style={{ width: `${position}%`, background: bucket.color }}
                        aria-hidden="true"
                      />
                      <span
                        className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-3 h-3 rounded-full ring-2 ring-[var(--card)]"
                        style={{ left: `${position}%`, background: bucket.color }}
                        aria-hidden="true"
                      />
                    </div>
                    <div className="flex justify-between mt-1.5 text-[0.7rem] text-muted-foreground tabular-nums">
                      <span>Opens {r.cutoff.openingRank.toLocaleString()}</span>
                      <span className="font-semibold" style={{ color: bucket.color }}>
                        You: {studentRank.toLocaleString()}
                        {" · "}
                        {r.margin > 0 ? "+" : ""}{r.margin}%
                      </span>
                      <span>Closes {r.cutoff.closingRank.toLocaleString()}</span>
                    </div>
                  </div>

                  <p className="mt-2.5 pt-2.5 border-t border-border text-[0.7rem] text-muted-foreground tabular-nums">
                    Source: {r.cutoff.exam} · {r.cutoff.category} · {r.cutoff.year} cutoff
                    {r.course.totalFees ? ` · ₹${formatINR(r.course.totalFees)} total fees` : ""}
                  </p>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
