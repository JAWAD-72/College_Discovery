# Architecture Decisions

This file records decisions made during development where the spec was ambiguous
or the environment imposed a constraint. Each entry names the decision, the
alternative rejected, and the rationale.

---

## D-001: Project subdirectory naming

**Decision:** Project lives in `track-a-college-discovery/` within the workspace
because `create-next-app` rejects directory names with spaces and capitals.

**Alternative rejected:** Renaming the workspace directory (outside our control).

**Rationale:** npm package naming rules require URL-safe lowercase names. The
workspace directory `Track-A College Discovery Form` violates this constraint.

---

## D-002: Prisma over Drizzle ORM

**Decision:** Using Prisma as the ORM.

**Alternative rejected:** Drizzle ORM (spec listed both as options).

**Rationale:** Prisma has stronger TypeScript type generation, a more mature
migration system, and better documentation for Supabase integration. The spec
allowed either Prisma or Drizzle.

---

## D-003: `nuqs` for URL search-param state management

**Decision:** Using the `nuqs` library for type-safe URL search param management
in Next.js App Router.

**Alternative rejected:** Custom `useQueryParams` hook wrapping `useSearchParams`.

**Rationale:** `nuqs` is purpose-built for Next.js App Router, handles
serialization/deserialization, supports shallow routing, and eliminates a class
of bugs around URL ↔ state synchronization. The spec's highest-signal
requirement is URL state fidelity — using a battle-tested library reduces risk.

---

## D-004: Rank predictor bucket thresholds

**Decision:** Bucket boundaries for rank prediction:
- **SAFE:** student's rank ≤ closing_rank × 0.7 (rank is 30%+ better than cutoff)
- **TARGET:** student's rank between closing_rank × 0.7 and closing_rank × 1.0
- **REACH:** student's rank between closing_rank × 1.0 and closing_rank × 1.5

**Alternative rejected:** Fixed offset ranges (e.g., ± 5000 ranks).

**Rationale:** Percentage-based thresholds scale naturally across exams with
different rank ranges (JEE Advanced top 10k vs COMEDK top 100k). A lower rank
number is better, so "SAFE" means the student's rank is comfortably below the
historical closing rank.

---

## D-005: Facet counts computed against filtered results

**Decision:** Facet counts in the listing API reflect the current filter state
(post-filter facets), not the global unfiltered counts.

**Alternative rejected:** Global facet counts (pre-filter).

**Rationale:** Post-filter facets show the user how many results remain if they
add another filter, which is more useful for narrowing searches. This matches
the behavior of Amazon, Flipkart, and other faceted search UIs that the target
users are familiar with.

---

## D-006: pg_trgm extension for fuzzy search

**Decision:** Using PostgreSQL's `pg_trgm` extension with a GIN index on
`colleges.name` for fuzzy/partial text search via trigram similarity.

**Alternative rejected:** Full-text search with `tsvector`/`tsquery`, or
application-level fuzzy matching.

**Rationale:** Trigram matching handles partial words, typos, and abbreviations
(e.g., "IIT" matching "Indian Institute of Technology") better than full-text
search for college name queries. It runs entirely in SQL, satisfying the
query-discipline requirement. The `pg_trgm` extension is available by default
on Supabase and Neon.
