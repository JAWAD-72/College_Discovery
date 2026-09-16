"use client";

import { useQueryState, parseAsString, parseAsInteger, parseAsFloat, parseAsArrayOf } from "nuqs";
import { useQuery } from "@tanstack/react-query";
import { useRef, useEffect, useState, useCallback } from "react";
import { CollegeCard } from "@/components/college-card";
import { Pagination } from "@/components/pagination";
import { ListingSkeleton } from "@/components/skeletons";
import { EmptyState, ErrorState } from "@/components/states";

// ─── URL state management with nuqs ──────────────────────────────────────────

function useCollegeFilters() {
  const [q, setQ] = useQueryState("q", parseAsString.withDefault(""));
  const [state, setState] = useQueryState("state", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [city, setCity] = useQueryState("city", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [type, setType] = useQueryState("type", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [exam, setExam] = useQueryState("exam", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [branch, setBranch] = useQueryState("branch", parseAsArrayOf(parseAsString, ",").withDefault([]));
  const [minFees, setMinFees] = useQueryState("minFees", parseAsInteger);
  const [maxFees, setMaxFees] = useQueryState("maxFees", parseAsInteger);
  // Float, not integer — the rating filter offers 3.5 and 4.5.
  const [minRating, setMinRating] = useQueryState("minRating", parseAsFloat);
  const [sort, setSort] = useQueryState("sort", parseAsString.withDefault("rating"));
  const [page, setPage] = useQueryState("page", parseAsInteger.withDefault(1));

  return {
    q, setQ, state, setState, city, setCity, type, setType,
    exam, setExam, branch, setBranch, minFees, setMinFees,
    maxFees, setMaxFees, minRating, setMinRating, sort, setSort,
    page, setPage,
  };
}

// ─── API fetcher ─────────────────────────────────────────────────────────────

interface CollegeListItem {
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
}

interface CollegesResponse {
  data: CollegeListItem[];
  meta: {
    page: number;
    pageSize: number;
    total: number;
    hasMore: boolean;
    facets: Record<string, Record<string, number>>;
  };
}

async function fetchColleges(params: Record<string, string | string[]>, signal?: AbortSignal): Promise<CollegesResponse> {
  const url = new URL("/api/v1/colleges", window.location.origin);
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    if (Array.isArray(value)) {
      value.forEach((v) => url.searchParams.append(key, v));
    } else {
      url.searchParams.set(key, String(value));
    }
  }
  const res = await fetch(url.toString(), { signal });
  if (!res.ok) throw new Error("Failed to fetch colleges");
  return res.json();
}

function formatFee(fee: number) {
  return fee >= 100000 ? `${fee / 100000}L` : `${fee / 1000}K`;
}

// ─── Filter sidebar / bottom sheet ───────────────────────────────────────────

function FilterGroup({
  title,
  options,
  selected,
  onToggle,
}: {
  title: string;
  options: Record<string, number>;
  selected: string[];
  onToggle: (value: string) => void;
}) {
  const sorted = Object.entries(options).sort((a, b) => b[1] - a[1]);
  const [showAll, setShowAll] = useState(false);
  const displayed = showAll ? sorted : sorted.slice(0, 6);

  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <h4 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
        {title}
      </h4>
      <div className="space-y-0.5">
        {displayed.map(([value, count]) => {
          const active = selected.includes(value);
          return (
            <button
              key={value}
              onClick={() => onToggle(value)}
              aria-pressed={active}
              className={`flex items-center gap-2.5 w-full px-2 py-1.5 text-sm rounded-lg transition-colors text-left group ${
                active ? "bg-[var(--brand-soft)] text-[var(--brand-ink)] font-medium" : "hover:bg-secondary"
              }`}
            >
              {/* Checkbox */}
              <span
                className={`shrink-0 flex items-center justify-center w-4 h-4 rounded-[5px] border transition-all duration-150 ${
                  active
                    ? "brand-gradient border-transparent"
                    : "border-border group-hover:border-muted-foreground"
                }`}
                aria-hidden="true"
              >
                {active && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M5 12.5l4.5 4.5L19 7.5" />
                  </svg>
                )}
              </span>
              <span className="truncate flex-1">{value}</span>
              <span className="text-[0.7rem] tabular-nums shrink-0 px-1.5 py-0.5 rounded-md bg-secondary text-muted-foreground">
                {count}
              </span>
            </button>
          );
        })}
      </div>
      {sorted.length > 6 && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-xs font-medium text-[var(--brand-ink)] hover:underline mt-2 px-2"
        >
          {showAll ? "Show less" : `Show all ${sorted.length}`}
        </button>
      )}
    </div>
  );
}

function PillRow({
  title,
  items,
  isActive,
  onToggle,
}: {
  title: string;
  items: { key: string | number; label: string }[];
  isActive: (key: string | number) => boolean;
  onToggle: (key: string | number) => void;
}) {
  return (
    <div className="py-4 border-b border-border last:border-b-0">
      <h4 className="text-[0.7rem] font-semibold uppercase tracking-wider text-muted-foreground mb-2.5">
        {title}
      </h4>
      <div className="flex flex-wrap gap-1.5">
        {items.map((item) => {
          const active = isActive(item.key);
          return (
            <button
              key={item.key}
              onClick={() => onToggle(item.key)}
              aria-pressed={active}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-all duration-200 ${
                active
                  ? "brand-gradient text-white border-transparent shadow-sm-t"
                  : "border-border hover:border-[color-mix(in_oklch,var(--brand),transparent_55%)] hover:bg-[var(--brand-soft)]"
              }`}
            >
              {item.label}
            </button>
          );
        })}
      </div>
    </div>
  );
}

function FilterSidebar({
  facets,
  filters,
  onToggle,
}: {
  facets: Record<string, Record<string, number>>;
  filters: ReturnType<typeof useCollegeFilters>;
  onToggle: (dimension: string, value: string) => void;
}) {
  return (
    <div>
      {facets.type && Object.keys(facets.type).length > 0 && (
        <FilterGroup
          title="Type"
          options={facets.type}
          selected={filters.type}
          onToggle={(v) => onToggle("type", v)}
        />
      )}
      {facets.state && Object.keys(facets.state).length > 0 && (
        <FilterGroup
          title="State"
          options={facets.state}
          selected={filters.state}
          onToggle={(v) => onToggle("state", v)}
        />
      )}
      {facets.exam && Object.keys(facets.exam).length > 0 && (
        <FilterGroup
          title="Exam"
          options={facets.exam}
          selected={filters.exam}
          onToggle={(v) => onToggle("exam", v)}
        />
      )}
      {facets.branch && Object.keys(facets.branch).length > 0 && (
        <FilterGroup
          title="Branch"
          options={facets.branch}
          selected={filters.branch}
          onToggle={(v) => onToggle("branch", v)}
        />
      )}

      <PillRow
        title="Max total fees"
        items={[200000, 500000, 1000000, 1500000, 2500000].map((fee) => ({
          key: fee,
          label: `Under ${formatFee(fee)}`,
        }))}
        isActive={(k) => filters.maxFees === k}
        onToggle={(k) => filters.setMaxFees(filters.maxFees === k ? null : Number(k))}
      />

      <PillRow
        title="Min rating"
        items={[3, 3.5, 4, 4.5].map((r) => ({ key: r, label: `${r}★ & up` }))}
        isActive={(k) => filters.minRating === k}
        onToggle={(k) => filters.setMinRating(filters.minRating === k ? null : Number(k))}
      />
    </div>
  );
}

// ─── Active filter chips ─────────────────────────────────────────────────────

function ActiveFilters({
  filters,
  onRemove,
  onClearAll,
}: {
  filters: ReturnType<typeof useCollegeFilters>;
  onRemove: (dimension: string, value?: string) => void;
  onClearAll: () => void;
}) {
  const chips: { label: string; dimension: string; value?: string }[] = [];

  filters.state.forEach((v) => chips.push({ label: v, dimension: "state", value: v }));
  filters.city.forEach((v) => chips.push({ label: v, dimension: "city", value: v }));
  filters.type.forEach((v) => chips.push({ label: v, dimension: "type", value: v }));
  filters.exam.forEach((v) => chips.push({ label: v, dimension: "exam", value: v }));
  filters.branch.forEach((v) => chips.push({ label: v, dimension: "branch", value: v }));
  if (filters.maxFees) chips.push({ label: `Under ${formatFee(filters.maxFees)}`, dimension: "maxFees" });
  if (filters.minRating) chips.push({ label: `${filters.minRating}★ & up`, dimension: "minRating" });

  if (chips.length === 0) return null;

  return (
    <div className="flex flex-wrap items-center gap-1.5 mb-4">
      {chips.map((chip, i) => (
        <button
          key={`${chip.dimension}-${chip.value ?? i}`}
          onClick={() => onRemove(chip.dimension, chip.value)}
          className="animate-pop-in flex items-center gap-1.5 text-xs font-medium pl-3 pr-2 py-1.5 rounded-full bg-[var(--brand-soft)] text-[var(--brand-ink)] border border-[color-mix(in_oklch,var(--brand),transparent_75%)] hover:bg-[color-mix(in_oklch,var(--brand),transparent_85%)] transition-colors"
          aria-label={`Remove ${chip.label} filter`}
        >
          {chip.label}
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6L6 18" />
          </svg>
        </button>
      ))}
      <button
        onClick={onClearAll}
        className="text-xs font-medium text-muted-foreground hover:text-destructive px-2 py-1.5 transition-colors"
      >
        Clear all
      </button>
    </div>
  );
}

// ─── Main listing component ──────────────────────────────────────────────────

export function CollegesListing() {
  const filters = useCollegeFilters();
  const [searchInput, setSearchInput] = useState(filters.q);
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const debounceTimer = useRef<ReturnType<typeof setTimeout>>(null);
  const abortRef = useRef<AbortController>(null);

  // Debounced search
  const handleSearchChange = useCallback(
    (value: string) => {
      setSearchInput(value);
      if (debounceTimer.current) clearTimeout(debounceTimer.current);
      debounceTimer.current = setTimeout(() => {
        filters.setQ(value || null);
        filters.setPage(1);
      }, 300);
    },
    [filters]
  );

  // Sync the input when the URL changes underneath us (back/forward, chip
  // removal). Adjusting state during render is React's sanctioned pattern here
  // — an effect would render the stale value first, then correct it.
  const [lastQ, setLastQ] = useState(filters.q);
  if (lastQ !== filters.q) {
    setLastQ(filters.q);
    setSearchInput(filters.q);
  }

  // Lock body scroll while the mobile sheet is open
  useEffect(() => {
    if (!mobileFiltersOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [mobileFiltersOpen]);

  // Build query params
  const queryParams: Record<string, string | string[]> = {};
  if (filters.q) queryParams.q = filters.q;
  if (filters.state.length) queryParams.state = filters.state;
  if (filters.city.length) queryParams.city = filters.city;
  if (filters.type.length) queryParams.type = filters.type;
  if (filters.exam.length) queryParams.exam = filters.exam;
  if (filters.branch.length) queryParams.branch = filters.branch;
  if (filters.maxFees) queryParams.maxFees = String(filters.maxFees);
  if (filters.minFees) queryParams.minFees = String(filters.minFees);
  if (filters.minRating) queryParams.minRating = String(filters.minRating);
  queryParams.sort = filters.sort;
  queryParams.page = String(filters.page);

  // Fetch with TanStack Query + request cancellation
  const { data, isLoading, isFetching, isError, refetch } = useQuery({
    queryKey: ["colleges", queryParams],
    queryFn: ({ signal }) => {
      // Cancel previous request
      if (abortRef.current) abortRef.current.abort();
      abortRef.current = new AbortController();
      return fetchColleges(queryParams, signal);
    },
    placeholderData: (prev) => prev,
  });

  // Toggle filter value
  const handleToggleFilter = useCallback(
    (dimension: string, value: string) => {
      const setters: Record<string, (v: string[]) => void> = {
        state: (v) => filters.setState(v.length ? v : null),
        city: (v) => filters.setCity(v.length ? v : null),
        type: (v) => filters.setType(v.length ? v : null),
        exam: (v) => filters.setExam(v.length ? v : null),
        branch: (v) => filters.setBranch(v.length ? v : null),
      };

      const getters: Record<string, string[]> = {
        state: filters.state,
        city: filters.city,
        type: filters.type,
        exam: filters.exam,
        branch: filters.branch,
      };

      const current = getters[dimension] || [];
      const setter = setters[dimension];
      if (!setter) return;

      if (current.includes(value)) {
        setter(current.filter((v) => v !== value));
      } else {
        setter([...current, value]);
      }
      filters.setPage(1);
    },
    [filters]
  );

  // Remove a filter chip
  const handleRemoveFilter = useCallback(
    (dimension: string, value?: string) => {
      switch (dimension) {
        case "state": filters.setState(filters.state.filter((v) => v !== value)); break;
        case "city": filters.setCity(filters.city.filter((v) => v !== value)); break;
        case "type": filters.setType(filters.type.filter((v) => v !== value)); break;
        case "exam": filters.setExam(filters.exam.filter((v) => v !== value)); break;
        case "branch": filters.setBranch(filters.branch.filter((v) => v !== value)); break;
        case "maxFees": filters.setMaxFees(null); break;
        case "minFees": filters.setMinFees(null); break;
        case "minRating": filters.setMinRating(null); break;
      }
      filters.setPage(1);
    },
    [filters]
  );

  const handleClearAll = useCallback(() => {
    filters.setQ(null);
    filters.setState(null);
    filters.setCity(null);
    filters.setType(null);
    filters.setExam(null);
    filters.setBranch(null);
    filters.setMaxFees(null);
    filters.setMinFees(null);
    filters.setMinRating(null);
    filters.setPage(1);
    setSearchInput("");
  }, [filters]);

  // Find most restrictive filter for empty state
  const getMostRestrictiveFilter = (): { label: string; onRemove: () => void } | undefined => {
    if (filters.q) return { label: `"${filters.q}"`, onRemove: () => { filters.setQ(null); setSearchInput(""); } };
    if (filters.maxFees) return { label: `Under ${formatFee(filters.maxFees)}`, onRemove: () => filters.setMaxFees(null) };
    if (filters.minRating) return { label: `${filters.minRating}★ & up`, onRemove: () => filters.setMinRating(null) };
    if (filters.state.length) return { label: filters.state[filters.state.length - 1], onRemove: () => filters.setState(filters.state.slice(0, -1)) };
    if (filters.type.length) return { label: filters.type[filters.type.length - 1], onRemove: () => filters.setType(filters.type.slice(0, -1)) };
    return undefined;
  };

  const facets = data?.meta?.facets || {};
  const activeFilterCount =
    filters.state.length + filters.city.length + filters.type.length +
    filters.exam.length + filters.branch.length +
    (filters.maxFees ? 1 : 0) + (filters.minRating ? 1 : 0);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
      {/* Page header */}
      <div className="mb-5 animate-fade-up">
        <h1 className="font-display text-2xl sm:text-3xl font-bold tracking-tight">
          Browse colleges
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          Filter by rank, fees, branch and location to shortlist what actually fits.
        </p>
      </div>

      {/* Search + sort */}
      <div
        className="flex flex-col sm:flex-row gap-2.5 mb-4 animate-fade-up stagger"
        style={{ "--i": 1 } as React.CSSProperties}
      >
        <div className="relative flex-1">
          <svg
            className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
            width="17" height="17" viewBox="0 0 20 20" fill="none"
            stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true"
          >
            <circle cx="8.5" cy="8.5" r="6" />
            <path d="M13 13l4.5 4.5" />
          </svg>
          <input
            type="text"
            value={searchInput}
            onChange={(e) => handleSearchChange(e.target.value)}
            placeholder="Search colleges…"
            className="w-full h-12 pl-11 pr-10 text-sm rounded-xl bg-card border border-border shadow-xs-t focus:outline-none focus:border-[color-mix(in_oklch,var(--brand),transparent_55%)] transition-colors"
            id="listing-search"
            aria-label="Search colleges"
          />
          {searchInput && (
            <button
              onClick={() => handleSearchChange("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center w-6 h-6 rounded-lg text-muted-foreground hover:text-foreground hover:bg-secondary transition-colors"
              aria-label="Clear search"
            >
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round" aria-hidden="true">
                <path d="M6 6l12 12M18 6L6 18" />
              </svg>
            </button>
          )}
        </div>

        <div className="flex gap-2">
          {/* Mobile filter trigger */}
          <button
            onClick={() => setMobileFiltersOpen(true)}
            className="sm:hidden flex items-center gap-2 px-4 h-12 rounded-xl bg-card border border-border shadow-xs-t text-sm font-medium hover:bg-secondary transition-colors"
            aria-label="Open filters"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" aria-hidden="true">
              <path d="M3 6h18M6 12h12M10 18h4" />
            </svg>
            Filters
            {activeFilterCount > 0 && (
              <span className="brand-gradient text-white text-[0.65rem] font-bold w-5 h-5 rounded-full flex items-center justify-center tabular-nums">
                {activeFilterCount}
              </span>
            )}
          </button>

          <div className="relative flex-1 sm:flex-initial">
            <select
              value={filters.sort}
              onChange={(e) => { filters.setSort(e.target.value); filters.setPage(1); }}
              className="appearance-none w-full h-12 pl-4 pr-10 text-sm font-medium rounded-xl bg-card border border-border shadow-xs-t focus:outline-none focus:border-[color-mix(in_oklch,var(--brand),transparent_55%)] cursor-pointer transition-colors"
              id="listing-sort"
              aria-label="Sort by"
            >
              <option value="rating">Top rated</option>
              <option value="rank">NIRF rank</option>
              <option value="fees_asc">Fees: low to high</option>
              <option value="fees_desc">Fees: high to low</option>
              <option value="name">Name A–Z</option>
            </select>
            <svg
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              width="14" height="14" viewBox="0 0 24 24" fill="none"
              stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true"
            >
              <path d="M5 9l7 7 7-7" />
            </svg>
          </div>
        </div>
      </div>

      {/* Active filter chips */}
      <ActiveFilters
        filters={filters}
        onRemove={handleRemoveFilter}
        onClearAll={handleClearAll}
      />

      <div className="flex gap-6 lg:gap-8">
        {/* Desktop sidebar */}
        <aside
          className="hidden sm:block w-60 lg:w-64 shrink-0 animate-fade-up stagger"
          style={{ "--i": 2 } as React.CSSProperties}
          aria-label="Filters"
        >
          <div className="surface sticky top-20 px-4 pb-2 max-h-[calc(100vh-6.5rem)] overflow-y-auto">
            <div className="flex items-center justify-between pt-4 pb-1">
              <h2 className="font-display text-sm font-semibold">Filters</h2>
              {activeFilterCount > 0 && (
                <button
                  onClick={handleClearAll}
                  className="text-xs font-medium text-muted-foreground hover:text-destructive transition-colors"
                >
                  Reset
                </button>
              )}
            </div>
            <FilterSidebar
              facets={facets}
              filters={filters}
              onToggle={handleToggleFilter}
            />
          </div>
        </aside>

        {/* Results */}
        <div className="flex-1 min-w-0">
          {/* Result count */}
          {data && (
            <div className="flex items-center gap-2 mb-3 h-5" aria-live="polite">
              <p className="text-sm text-muted-foreground">
                <span className="font-semibold text-foreground tabular-nums">
                  {data.meta.total.toLocaleString()}
                </span>{" "}
                college{data.meta.total !== 1 ? "s" : ""} found
              </p>
              {isFetching && (
                <span className="flex items-center gap-1.5 text-xs text-muted-foreground animate-fade-in">
                  <span
                    className="w-3 h-3 rounded-full border-2 border-current border-t-transparent animate-spin"
                    aria-hidden="true"
                  />
                  updating
                </span>
              )}
            </div>
          )}

          {isLoading && <ListingSkeleton />}

          {isError && <ErrorState message="Failed to load colleges" onRetry={() => refetch()} />}

          {data && data.data.length === 0 && (
            <EmptyState
              title="No colleges match those filters"
              description="Loosen one constraint and more options should appear."
              restrictiveFilter={getMostRestrictiveFilter()}
            />
          )}

          {data && data.data.length > 0 && (
            <>
              <div className="space-y-3">
                {data.data.map((college, i) => (
                  <CollegeCard key={college.id} {...college} index={i} />
                ))}
              </div>

              <Pagination
                page={filters.page}
                pageSize={data.meta.pageSize}
                total={data.meta.total}
                onPageChange={(p) => {
                  filters.setPage(p);
                  window.scrollTo({ top: 0, behavior: "smooth" });
                }}
              />
            </>
          )}
        </div>
      </div>

      {/* Mobile bottom sheet */}
      {mobileFiltersOpen && (
        <>
          <div
            className="bottom-sheet-overlay"
            onClick={() => setMobileFiltersOpen(false)}
            aria-hidden="true"
          />
          <div className="bottom-sheet px-4 pb-4" role="dialog" aria-modal="true" aria-label="Filters">
            <div className="sticky top-0 bg-card flex items-center justify-between py-3 -mx-4 px-4 border-b border-border z-10">
              <h3 className="font-display text-base font-semibold">Filters</h3>
              <div className="flex items-center gap-1">
                {activeFilterCount > 0 && (
                  <button
                    onClick={handleClearAll}
                    className="text-xs font-medium text-muted-foreground hover:text-destructive px-2 py-2"
                  >
                    Reset
                  </button>
                )}
                <button
                  onClick={() => setMobileFiltersOpen(false)}
                  className="flex items-center justify-center w-10 h-10 rounded-xl hover:bg-secondary transition-colors"
                  aria-label="Close filters"
                >
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                    <path d="M6 6l12 12M18 6L6 18" />
                  </svg>
                </button>
              </div>
            </div>

            <FilterSidebar
              facets={facets}
              filters={filters}
              onToggle={handleToggleFilter}
            />

            <button
              onClick={() => setMobileFiltersOpen(false)}
              className="btn-brand sticky bottom-0 w-full mt-4 py-3.5 text-sm font-semibold rounded-xl"
            >
              Show {data?.meta.total ?? 0} results
            </button>
          </div>
        </>
      )}
    </div>
  );
}
