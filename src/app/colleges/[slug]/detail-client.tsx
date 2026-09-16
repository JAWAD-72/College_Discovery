"use client";

import { useEffect, useRef, useState } from "react";
import { RatingStars } from "@/components/rating-stars";
import { FeeRange, StatBlock, formatINR } from "@/components/stat-blocks";
import { initialsOf, monogramGradient } from "@/components/college-card";
import { useCompare } from "@/lib/compare-context";

interface CollegeData {
  id: number;
  slug: string;
  name: string;
  shortName: string | null;
  city: string;
  state: string;
  type: string;
  establishedYear: number;
  campusAcres: number | null;
  hostelAvailable: boolean;
  naacGrade: string | null;
  nirfRank: number | null;
  avgRating: number;
  reviewCount: number;
  minFeesTotal: number;
  maxFeesTotal: number;
  aboutMd: string | null;
  ratingBreakdown: { academics: number; infrastructure: number; placements: number; faculty: number } | null;
  ratingDistribution: number[];
  courses: {
    id: number; name: string; degreeLevel: string; branch: string;
    durationYears: number; totalSeats: number | null; totalFees: number; examAccepted: string;
  }[];
  placements: {
    id: number; year: number; highestPackageLpa: number; averagePackageLpa: number;
    medianPackageLpa: number; placementPercentage: number; topRecruiters: string[];
  }[];
  reviews: {
    id: number; authorName: string; batchYear: number; ratingOverall: number;
    ratingAcademics: number; ratingInfrastructure: number; ratingPlacements: number;
    ratingFaculty: number; title: string; body: string; createdAt: string;
  }[];
  cutoffs: {
    id: number; exam: string; category: string; year: number;
    openingRank: number; closingRank: number;
    course: { name: string; branch: string };
  }[];
}

const SECTIONS = ["Overview", "Courses & Fees", "Placements", "Reviews", "Cutoffs"] as const;

const sectionId = (s: string) => `section-${s.toLowerCase().replace(/\s+/g, "-")}`;

/** Sort indicator for a table header: hidden until hover, flips when active. */
function SortArrow({ active, dir }: { active: boolean; dir: "asc" | "desc" }) {
  return (
    <svg
      width="12" height="12" viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" strokeLinejoin="round"
      className={`transition-all duration-200 ${
        active
          ? dir === "asc" ? "opacity-100" : "opacity-100 rotate-180"
          : "opacity-0 group-hover:opacity-40"
      }`}
      aria-hidden="true"
    >
      <path d="M12 19V5M5 12l7-7 7 7" />
    </svg>
  );
}

/** Deterministic tint for a reviewer avatar. */
function avatarTint(name: string) {
  const hues = [276, 215, 175, 72, 20, 300];
  let h = 0;
  for (let i = 0; i < name.length; i++) h = (h * 31 + name.charCodeAt(i)) >>> 0;
  return hues[h % hues.length];
}

export function CollegeDetail({ college }: { college: CollegeData }) {
  const [activeSection, setActiveSection] = useState<string>(SECTIONS[0]);
  const [courseSortKey, setCourseSortKey] = useState<"name" | "totalFees" | "totalSeats">("name");
  const [courseSortDir, setCourseSortDir] = useState<"asc" | "desc">("asc");
  const [cutoffExam, setCutoffExam] = useState<string>("all");
  const [cutoffCategory, setCutoffCategory] = useState<string>("all");
  const { add, remove, isSelected } = useCompare();
  const compared = isSelected(college.id);
  const clickScrolling = useRef(false);

  const handleCompare = () => {
    if (compared) {
      remove(college.id);
    } else {
      add({ id: college.id, name: college.name, slug: college.slug });
    }
  };

  const scrollToSection = (section: string) => {
    setActiveSection(section);
    // Suppress the observer briefly so the tab doesn't flicker mid-scroll
    clickScrolling.current = true;
    setTimeout(() => { clickScrolling.current = false; }, 700);
    document.getElementById(sectionId(section))?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  // Scroll-spy: highlight the tab for whatever section is in view
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        if (clickScrolling.current) return;
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (!visible) return;
        const match = SECTIONS.find((s) => sectionId(s) === visible.target.id);
        if (match) setActiveSection(match);
      },
      { rootMargin: "-120px 0px -65% 0px", threshold: 0 }
    );
    SECTIONS.forEach((s) => {
      const el = document.getElementById(sectionId(s));
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, []);

  // Sort courses
  const sortedCourses = [...college.courses].sort((a, b) => {
    const aVal = a[courseSortKey] ?? 0;
    const bVal = b[courseSortKey] ?? 0;
    if (typeof aVal === "string" && typeof bVal === "string") {
      return courseSortDir === "asc" ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return courseSortDir === "asc" ? Number(aVal) - Number(bVal) : Number(bVal) - Number(aVal);
  });

  const handleCourseSort = (key: typeof courseSortKey) => {
    if (courseSortKey === key) {
      setCourseSortDir(courseSortDir === "asc" ? "desc" : "asc");
    } else {
      setCourseSortKey(key);
      setCourseSortDir("asc");
    }
  };

  // Unique exams and categories for cutoff filters
  const uniqueExams = [...new Set(college.cutoffs.map((c) => c.exam))];
  const uniqueCategories = [...new Set(college.cutoffs.map((c) => c.category))];

  const filteredCutoffs = college.cutoffs.filter((c) => {
    if (cutoffExam !== "all" && c.exam !== cutoffExam) return false;
    if (cutoffCategory !== "all" && c.category !== cutoffCategory) return false;
    return true;
  });

  const selectClass =
    "appearance-none h-11 pl-3.5 pr-9 text-sm font-medium rounded-xl bg-card border border-border shadow-xs-t focus:outline-none focus:border-[color-mix(in_oklch,var(--brand),transparent_55%)] cursor-pointer transition-colors";

  const latestPlacement = college.placements[0];
  const peakPackage = Math.max(1, ...college.placements.map((x) => x.highestPackageLpa));

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* ── Hero ─────────────────────────────────────────────────────────── */}
      <div className="surface overflow-hidden animate-fade-up">
        {/* Gradient banner */}
        <div className="relative h-20 sm:h-24 brand-gradient">
          <div className="absolute inset-0 dot-grid opacity-40" aria-hidden="true" />
        </div>

        <div className="px-4 sm:px-6 pb-5">
          <div className="flex flex-col sm:flex-row sm:items-center gap-4 pt-4">
            {/* Only the monogram overlaps the banner */}
            <span
              className="relative z-10 -mt-14 sm:-mt-16 flex items-center justify-center w-20 h-20 rounded-2xl text-white font-display font-extrabold text-xl tracking-tight shadow-lg-t ring-4 ring-[var(--card)] shrink-0"
              style={{ backgroundImage: monogramGradient(college.slug) }}
              aria-hidden="true"
            >
              {initialsOf(college.name)}
            </span>

            <div className="flex-1 min-w-0 sm:-mt-6">
              <h1 className="font-display text-xl sm:text-2xl font-bold tracking-tight text-balance">
                {college.name}
              </h1>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5 text-sm text-muted-foreground">
                <span className="inline-flex items-center gap-1.5">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="opacity-70" aria-hidden="true">
                    <path d="M12 21s7-5.5 7-11a7 7 0 1 0-14 0c0 5.5 7 11 7 11Z" />
                    <circle cx="12" cy="10" r="2.5" />
                  </svg>
                  {college.city}, {college.state}
                </span>
                <span className="w-1 h-1 rounded-full bg-border" aria-hidden="true" />
                <span>{college.type}</span>
                <span className="w-1 h-1 rounded-full bg-border" aria-hidden="true" />
                <span className="tabular-nums">Est. {college.establishedYear}</span>
              </div>
            </div>

            <button
              onClick={handleCompare}
              aria-pressed={compared}
              className={`shrink-0 self-start sm:self-center inline-flex items-center justify-center gap-2 text-sm font-semibold px-4 py-2.5 rounded-xl transition-all duration-200 ${
                compared
                  ? "bg-secondary text-foreground border border-border hover:bg-[color-mix(in_oklch,var(--destructive),transparent_92%)] hover:text-destructive"
                  : "btn-brand"
              }`}
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                {compared ? <path d="M5 12.5l4.5 4.5L19 7.5" /> : <><path d="M12 5v14M5 12h14" /></>}
              </svg>
              {compared ? "In comparison" : "Add to compare"}
            </button>
          </div>

          {/* Stat tiles */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5">
            {college.nirfRank && (
              <StatBlock
                label="NIRF Rank"
                value={`#${college.nirfRank}`}
                tone="var(--brand)"
              />
            )}
            <StatBlock
              label="Rating"
              value={college.avgRating.toFixed(1)}
              sublabel={`${college.reviewCount} reviews`}
              tone="var(--warm)"
            />
            <StatBlock
              label="Total fees"
              value={<FeeRange min={college.minFeesTotal} max={college.maxFeesTotal} />}
              tone="var(--chart-3)"
            />
            {latestPlacement ? (
              <StatBlock
                label="Avg package"
                value={`₹${latestPlacement.averagePackageLpa}L`}
                sublabel={`${latestPlacement.placementPercentage}% placed`}
                tone="var(--chart-2)"
              />
            ) : college.naacGrade ? (
              <StatBlock label="NAAC" value={college.naacGrade} tone="var(--chart-2)" />
            ) : null}
          </div>
        </div>
      </div>

      {/* ── Sticky section nav ───────────────────────────────────────────── */}
      <nav
        className="sticky top-16 z-20 -mx-4 sm:mx-0 px-4 sm:px-0 py-2.5 mb-8 mt-6 glass border-b border-border sm:border-0"
        aria-label="Page sections"
      >
        <div className="flex gap-1 overflow-x-auto no-scrollbar sm:p-1 sm:rounded-full sm:bg-secondary/70 sm:border sm:border-border/60">
          {SECTIONS.map((s) => {
            const active = activeSection === s;
            return (
              <button
                key={s}
                onClick={() => scrollToSection(s)}
                aria-current={active ? "true" : undefined}
                className={`px-3.5 py-2 text-[0.8125rem] font-medium whitespace-nowrap rounded-full transition-all duration-200 ${
                  active
                    ? "bg-card text-foreground shadow-sm-t"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s}
              </button>
            );
          })}
        </div>
      </nav>

      {/* ── Overview ─────────────────────────────────────────────────────── */}
      <section id="section-overview" className="mb-12 scroll-mt-32">
        <h2 className="font-display text-xl font-bold mb-4">Overview</h2>
        {college.aboutMd && (
          <div className="surface p-5 text-[0.9375rem] leading-relaxed text-muted-foreground whitespace-pre-line">
            {college.aboutMd}
          </div>
        )}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 mt-4">
          {college.campusAcres && (
            <StatBlock label="Campus" value={`${college.campusAcres}`} sublabel="acres" />
          )}
          <StatBlock label="Hostel" value={college.hostelAvailable ? "Yes" : "No"} />
          <StatBlock label="Courses" value={college.courses.length} />
          {college.naacGrade && <StatBlock label="NAAC" value={college.naacGrade} />}
        </div>
      </section>

      {/* ── Courses & Fees ───────────────────────────────────────────────── */}
      <section id="section-courses-&-fees" className="mb-12 scroll-mt-32">
        <h2 className="font-display text-xl font-bold mb-4">Courses &amp; Fees</h2>
        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <button onClick={() => handleCourseSort("name")} className="group flex items-center gap-1.5 hover:text-foreground transition-colors">
                      Course <SortArrow active={courseSortKey === "name"} dir={courseSortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Level</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Duration</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <button onClick={() => handleCourseSort("totalSeats")} className="group flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors">
                      Seats <SortArrow active={courseSortKey === "totalSeats"} dir={courseSortDir} />
                    </button>
                  </th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">
                    <button onClick={() => handleCourseSort("totalFees")} className="group flex items-center gap-1.5 ml-auto hover:text-foreground transition-colors">
                      Total fees <SortArrow active={courseSortKey === "totalFees"} dir={courseSortDir} />
                    </button>
                  </th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Exam</th>
                </tr>
              </thead>
              <tbody>
                {sortedCourses.map((course) => (
                  <tr key={course.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-3 font-medium">{course.name}</td>
                    <td className="px-4 py-3">
                      <span className="text-[0.7rem] font-medium px-2 py-0.5 rounded-md bg-[var(--brand-soft)] text-[var(--brand-ink)]">
                        {course.degreeLevel}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground tabular-nums">{course.durationYears} yr</td>
                    <td className="px-4 py-3 text-right tabular-nums text-muted-foreground">{course.totalSeats ?? "—"}</td>
                    <td className="px-4 py-3 text-right tabular-nums font-semibold">
                      ₹{formatINR(course.totalFees)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{course.examAccepted}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ── Placements ───────────────────────────────────────────────────── */}
      <section id="section-placements" className="mb-12 scroll-mt-32">
        <h2 className="font-display text-xl font-bold mb-4">Placements</h2>
        {college.placements.length > 0 ? (
          <>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {college.placements.map((p, idx) => (
                <div
                  key={p.year}
                  className="surface p-5 animate-fade-up stagger"
                  style={{ "--i": idx } as React.CSSProperties}
                >
                  <div className="flex items-baseline justify-between mb-4">
                    <p className="font-display text-base font-bold tabular-nums">{p.year}</p>
                    <span className="text-xs font-medium px-2 py-1 rounded-lg bg-[var(--safe-soft)] text-[var(--safe)] tabular-nums">
                      {p.placementPercentage}% placed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {[
                      { label: "Highest", value: p.highestPackageLpa, color: "var(--chart-1)" },
                      { label: "Average", value: p.averagePackageLpa, color: "var(--chart-2)" },
                      { label: "Median", value: p.medianPackageLpa, color: "var(--chart-3)" },
                    ].map((bar, i) => (
                      <div key={bar.label}>
                        <div className="flex justify-between text-xs mb-1">
                          <span className="text-muted-foreground">{bar.label}</span>
                          <span className="tabular-nums font-semibold">₹{bar.value}L</span>
                        </div>
                        <div className="h-2 rounded-full bg-secondary overflow-hidden">
                          <div
                            className="h-full rounded-full bar-grow stagger"
                            style={{
                              width: `${Math.max(2, (bar.value / peakPackage) * 100)}%`,
                              background: bar.color,
                              "--i": i + 1,
                            } as React.CSSProperties}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            {college.placements[0]?.topRecruiters?.length > 0 && (
              <div className="surface p-5 mt-3">
                <h3 className="text-sm font-semibold mb-3">
                  Top recruiters{" "}
                  <span className="text-muted-foreground font-normal tabular-nums">
                    ({college.placements[0].year})
                  </span>
                </h3>
                <div className="flex flex-wrap gap-1.5">
                  {college.placements[0].topRecruiters.map((r, i) => (
                    <span
                      key={r}
                      className="animate-pop-in stagger text-xs font-medium px-3 py-1.5 rounded-lg border border-border bg-secondary/50"
                      style={{ "--i": i } as React.CSSProperties}
                    >
                      {r}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </>
        ) : (
          <p className="surface p-5 text-sm text-muted-foreground">
            No placement data published for this college yet.
          </p>
        )}
      </section>

      {/* ── Reviews ──────────────────────────────────────────────────────── */}
      <section id="section-reviews" className="mb-12 scroll-mt-32">
        <h2 className="font-display text-xl font-bold mb-4">Reviews</h2>

        {college.ratingBreakdown && (
          <div className="surface p-5 sm:p-6 mb-4">
            <div className="grid sm:grid-cols-[auto_1fr_auto] gap-6 sm:gap-8">
              {/* Overall */}
              <div className="text-center sm:text-left shrink-0">
                <p className="font-display text-5xl font-extrabold tabular-nums leading-none">
                  {college.avgRating.toFixed(1)}
                </p>
                <div className="flex justify-center sm:justify-start mt-2">
                  <RatingStars rating={college.avgRating} size="md" />
                </div>
                <p className="text-xs text-muted-foreground mt-1.5 tabular-nums">
                  {college.reviewCount} reviews
                </p>
              </div>

              {/* Breakdown bars */}
              <div className="space-y-2.5 self-center">
                {Object.entries(college.ratingBreakdown).map(([key, val], i) => (
                  <div key={key} className="flex items-center gap-3">
                    <span className="text-xs text-muted-foreground capitalize w-24 shrink-0">{key}</span>
                    <div className="flex-1 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bar-grow stagger"
                        style={{
                          width: `${(Number(val) / 5) * 100}%`,
                          background: "var(--brand)",
                          "--i": i,
                        } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-xs tabular-nums font-semibold w-7 text-right">{val}</span>
                  </div>
                ))}
              </div>

              {/* Distribution histogram */}
              <div className="space-y-1.5 self-center">
                {[5, 4, 3, 2, 1].map((star, i) => (
                  <div key={star} className="flex items-center gap-2">
                    <span className="text-xs w-3 text-right tabular-nums text-muted-foreground">{star}</span>
                    <RatingStars rating={5} size="xs" count={1} />
                    <div className="w-20 h-2 bg-secondary rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bar-grow stagger"
                        style={{
                          width: college.reviewCount > 0
                            ? `${(college.ratingDistribution[star - 1] / college.reviewCount) * 100}%`
                            : "0%",
                          background: "var(--warm)",
                          "--i": i,
                        } as React.CSSProperties}
                      />
                    </div>
                    <span className="text-xs tabular-nums w-5 text-muted-foreground">
                      {college.ratingDistribution[star - 1]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Review list */}
        <div className="space-y-3">
          {college.reviews.slice(0, 10).map((review, i) => {
            const hue = avatarTint(review.authorName);
            return (
              <article
                key={review.id}
                className="surface p-5 animate-fade-up stagger"
                style={{ "--i": Math.min(i, 6) } as React.CSSProperties}
              >
                <div className="flex items-start gap-3">
                  <span
                    className="shrink-0 flex items-center justify-center w-10 h-10 rounded-full font-display font-bold text-xs text-white"
                    style={{ background: `oklch(0.6 0.15 ${hue})` }}
                    aria-hidden="true"
                  >
                    {review.authorName.slice(0, 2).toUpperCase()}
                  </span>

                  <div className="min-w-0 flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <h3 className="font-semibold text-[0.9375rem] leading-snug">{review.title}</h3>
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {review.authorName} · Batch {review.batchYear}
                        </p>
                      </div>
                      <span className="shrink-0 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-[var(--warm-soft)] text-sm font-bold tabular-nums">
                        <RatingStars rating={5} size="xs" count={1} />
                        {review.ratingOverall}
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2.5 leading-relaxed">
                      {review.body}
                    </p>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>

      {/* ── Cutoffs ──────────────────────────────────────────────────────── */}
      <section id="section-cutoffs" className="mb-12 scroll-mt-32">
        <h2 className="font-display text-xl font-bold mb-4">Cutoffs</h2>

        <div className="flex flex-wrap gap-2 mb-3">
          <div className="relative">
            <select
              value={cutoffExam}
              onChange={(e) => setCutoffExam(e.target.value)}
              className={selectClass}
              aria-label="Filter by exam"
            >
              <option value="all">All exams</option>
              {uniqueExams.map((e) => <option key={e} value={e}>{e}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 9l7 7 7-7" />
            </svg>
          </div>
          <div className="relative">
            <select
              value={cutoffCategory}
              onChange={(e) => setCutoffCategory(e.target.value)}
              className={selectClass}
              aria-label="Filter by category"
            >
              <option value="all">All categories</option>
              {uniqueCategories.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
            <svg className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 9l7 7 7-7" />
            </svg>
          </div>
        </div>

        <div className="surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-secondary/60">
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Course</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Exam</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Category</th>
                  <th className="text-left px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Year</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Opening</th>
                  <th className="text-right px-4 py-3 font-semibold text-xs uppercase tracking-wider text-muted-foreground">Closing</th>
                </tr>
              </thead>
              <tbody>
                {filteredCutoffs.slice(0, 50).map((c) => (
                  <tr key={c.id} className="border-t border-border hover:bg-secondary/40 transition-colors">
                    <td className="px-4 py-2.5 text-xs font-medium">{c.course.name}</td>
                    <td className="px-4 py-2.5 text-muted-foreground">{c.exam}</td>
                    <td className="px-4 py-2.5">
                      <span className="text-[0.7rem] font-medium px-2 py-0.5 rounded-md bg-secondary">
                        {c.category}
                      </span>
                    </td>
                    <td className="px-4 py-2.5 tabular-nums text-muted-foreground">{c.year}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums text-muted-foreground">{c.openingRank.toLocaleString()}</td>
                    <td className="px-4 py-2.5 text-right tabular-nums font-semibold">{c.closingRank.toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
        {filteredCutoffs.length > 50 && (
          <p className="text-xs text-muted-foreground mt-2 text-center">
            Showing first 50 of {filteredCutoffs.length} cutoffs
          </p>
        )}
      </section>
    </div>
  );
}
