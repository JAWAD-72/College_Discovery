# CollegeCompass — College Discovery Platform

A college discovery platform for Indian students: search and filter 300+ colleges,
compare them side by side, and find out which ones are realistically reachable with
a given exam rank.

Built as a submission for the Track-A College Discovery assignment.

---

## Features

| Route | What it does |
|---|---|
| `/` | Landing page with entry points into search and the rank predictor |
| `/colleges` | Server-side search + multi-facet filtering, sorting, pagination, live facet counts. All filter state lives in the URL |
| `/colleges/[slug]` | College detail — courses, placements by year, student reviews, cutoff history |
| `/compare` | Side-by-side comparison of 2–3 colleges, driven by a persistent compare tray |
| `/predict` | Rank predictor — bucket colleges into SAFE / TARGET / REACH for a given exam, rank and category |
| `/saved` | Saved colleges and saved comparisons |

Also included: light/dark theme, loading skeletons, empty/error states, and a
404 / global error boundary.

---

## Tech stack

- **Next.js 16** (App Router, Turbopack) + **React 19**
- **TypeScript** throughout
- **PostgreSQL** via **Prisma 6**
- **Zod** for request validation on every API route
- **TanStack Query** for client-side data fetching and caching
- **nuqs** for type-safe URL search-param state
- **Tailwind CSS v4** + shadcn/ui primitives
- **Supabase** for auth and hosted Postgres

---

## Getting started

### Prerequisites

- Node.js 20+
- A PostgreSQL database (Supabase, Neon, or local)

### Setup

```bash
# 1. Install dependencies
npm install

# 2. Configure environment
cp .env.example .env
#    then fill in your own DATABASE_URL / DIRECT_URL

# 3. Create the schema and load seed data
npm run db:push
npm run db:seed

# 4. Run
npm run dev
```

Open http://localhost:3000.

### Environment variables

| Variable | Purpose |
|---|---|
| `DATABASE_URL` | Postgres connection string (pooled) |
| `DIRECT_URL` | Direct connection, used for migrations — bypasses the pooler |
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase project URL (auth) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Supabase anon key (auth) |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase service role key (server-side only) |

### Scripts

| Script | Purpose |
|---|---|
| `npm run dev` | Start the dev server |
| `npm run build` | Production build |
| `npm run db:push` | Push the Prisma schema to the database |
| `npm run db:seed` | Load seed data (300+ colleges with courses, placements, reviews, cutoffs) |
| `npm run db:reset` | Force-reset the schema and re-seed |
| `npm run db:studio` | Open Prisma Studio |

---

## API

All endpoints are versioned under `/api/v1` and validate their input with Zod.
Invalid input returns a structured `400` rather than throwing.

### `GET /api/v1/colleges`

Search, filter, sort and paginate colleges. Returns results **and** facet counts
computed against the currently applied filters.

| Param | Type | Notes |
|---|---|---|
| `q` | string | Name search (case-insensitive) |
| `state` | string[] | Repeatable |
| `city` | string[] | Repeatable |
| `type` | string[] | `Govt` \| `Private` \| `Deemed` |
| `exam` | string[] | Repeatable |
| `branch` | string[] | Repeatable |
| `minFees` / `maxFees` | number | Total fees range |
| `minRating` | number | 0–5 |
| `sort` | enum | `rating` (default), `fees_asc`, `fees_desc`, `rank`, `name` |
| `page` | number | Default `1` |
| `pageSize` | number | Default `20`, max `50` |

```
GET /api/v1/colleges?state=Karnataka&type=Govt&minRating=4&sort=rating&page=1
```

Response shape:

```jsonc
{
  "data": [ /* college summaries */ ],
  "meta": {
    "page": 1,
    "pageSize": 20,
    "total": 310,
    "hasMore": true,
    "facets": { "state": { "Maharashtra": 39, "…": 0 }, "type": {}, "exam": {}, "branch": {} }
  }
}
```

### `GET /api/v1/colleges/:slug`

Full detail for one college — courses, placements, reviews and cutoffs.

### `GET /api/v1/colleges/compare?ids=1,2,3`

Comparison payload for 2–3 colleges.

### `POST /api/v1/predict`

```jsonc
// Request
{ "exam": "JEE Main", "rank": 15000, "category": "General", "preferredStates": ["Karnataka"] }
```

Returns colleges bucketed as `SAFE` / `TARGET` / `REACH`, each accompanied by the
specific cutoff row that justified the bucket.

### `GET | POST | DELETE /api/v1/saved/colleges`
### `GET | POST | DELETE /api/v1/saved/comparisons`

Saved colleges and comparisons for the current user. Require an `Authorization`
header (see *Known limitations* below).

---

## Architecture notes

**Normalized schema, not a wide table.** `colleges`, `courses`, `placements`,
`reviews` and `cutoffs` are separate related tables, with `saved_colleges` and
`saved_comparisons` for per-user data. See [`prisma/schema.prisma`](prisma/schema.prisma).

**Every index is deliberate.** Each index in the schema carries a comment naming
the query it serves — for example the compound index
`(exam, category, closing_rank)` on `cutoffs` is what keeps the rank predictor fast.

**Query discipline.** Filtering, sorting and pagination all happen in SQL. The API
never loads the full result set into JavaScript to filter it in memory.

**Facet counts reflect current filters.** Counts show how many results would remain
if you added that filter, matching the behaviour of the faceted search UIs users
already know.

**URL is the source of truth.** Every filter, sort and page value is serialized into
the URL via `nuqs`, so a search is shareable, refreshable, and works with the browser
back button.

Design decisions — and the alternatives rejected — are recorded in
[`DECISIONS.md`](DECISIONS.md).

---

## Known limitations

Recorded honestly rather than papered over:

- **Auth is stubbed.** The `/api/v1/saved/*` routes read a user ID directly from the
  `Authorization: Bearer <id>` header. Verifying a real Supabase JWT is the next step;
  the header contract is already in place for it.
- **Search uses `contains`, not trigram matching.** The plan documented in `DECISIONS.md`
  (D-006) is a `pg_trgm` GIN index on `colleges.name` for typo-tolerant matching. The
  index migration is described but not yet wired into the query path, which currently
  uses case-insensitive `contains`.
- **No automated test suite.** Routes were verified manually against the seeded dataset.

---

## Next steps

- Wire real Supabase JWT verification into the saved-colleges endpoints
- Apply the `pg_trgm` trigram index and switch search over to `similarity()`
- Integration tests for the listing, compare and predict endpoints
- Deploy to Vercel with a hosted Supabase database
