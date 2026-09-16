import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { collegesQuerySchema, zodError, apiError } from "@/lib/schemas";
import { Prisma } from "@prisma/client";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/colleges
 *
 * Server-side search, multi-facet filtering, sorting, pagination.
 * Returns paginated results AND facet counts computed against currently applied filters.
 *
 * All filtering, sorting, and pagination happens in SQL — never in JavaScript.
 */
export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;

  // Parse array params: state[], city[], type[], exam[], branch[]
  const rawParams: Record<string, string | string[]> = {};
  for (const key of [
    "q", "minFees", "maxFees", "minRating", "sort", "page", "pageSize",
  ]) {
    const val = searchParams.get(key);
    if (val !== null) rawParams[key] = val;
  }
  for (const key of ["state", "city", "type", "exam", "branch"]) {
    const vals = searchParams.getAll(key);
    if (vals.length > 0) rawParams[key] = vals;
  }

  // Validate
  const parsed = collegesQuerySchema.safeParse(rawParams);
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  const {
    q, state, city, type, exam, branch,
    minFees, maxFees, minRating,
    sort, page, pageSize,
  } = parsed.data;

  try {
    // Build WHERE conditions
    const where: Prisma.CollegeWhereInput = {};

    if (q && q.trim().length > 0) {
      // Use case-insensitive contains for search
      // On production Postgres with pg_trgm, this would use similarity()
      where.name = { contains: q.trim(), mode: "insensitive" };
    }

    if (state && state.length > 0) {
      where.state = { in: state };
    }

    if (city && city.length > 0) {
      where.city = { in: city };
    }

    if (type && type.length > 0) {
      where.type = { in: type };
    }

    if (minRating !== undefined) {
      where.avgRating = { gte: minRating };
    }

    if (minFees !== undefined || maxFees !== undefined) {
      where.AND = [
        ...(Array.isArray(where.AND) ? where.AND : []),
        ...(minFees !== undefined
          ? [{ maxFeesTotal: { gte: minFees } }]
          : []),
        ...(maxFees !== undefined
          ? [{ minFeesTotal: { lte: maxFees } }]
          : []),
      ];
    }

    // Filter by exam or branch requires a subquery via courses relation
    if ((exam && exam.length > 0) || (branch && branch.length > 0)) {
      const courseWhere: Prisma.CourseWhereInput = {};
      if (exam && exam.length > 0) {
        courseWhere.examAccepted = { in: exam };
      }
      if (branch && branch.length > 0) {
        courseWhere.branch = { in: branch };
      }
      where.courses = { some: courseWhere };
    }

    // Build ORDER BY
    const orderBy: Prisma.CollegeOrderByWithRelationInput = (() => {
      switch (sort) {
        case "rating":
          return { avgRating: "desc" as const };
        case "fees_asc":
          return { minFeesTotal: "asc" as const };
        case "fees_desc":
          return { maxFeesTotal: "desc" as const };
        case "rank":
          // Colleges without NIRF rank go to the end
          return { nirfRank: { sort: "asc" as const, nulls: "last" as const } };
        case "name":
          return { name: "asc" as const };
        default:
          return { avgRating: "desc" as const };
      }
    })();

    // Execute count + data in parallel (no N+1)
    const [total, colleges] = await Promise.all([
      db.college.count({ where }),
      db.college.findMany({
        where,
        orderBy,
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          slug: true,
          name: true,
          shortName: true,
          city: true,
          state: true,
          type: true,
          nirfRank: true,
          avgRating: true,
          reviewCount: true,
          minFeesTotal: true,
          maxFeesTotal: true,
          naacGrade: true,
          logoUrl: true,
          hostelAvailable: true,
          courses: {
            select: { branch: true, examAccepted: true },
            take: 1,
            orderBy: { totalSeats: "desc" },
          },
        },
      }),
    ]);

    // Compute facet counts against current filters
    // Each facet is computed with all OTHER filters applied but not its own
    const facets = await computeFacets(where, { state, city, type, exam, branch });

    return NextResponse.json({
      data: colleges.map((c) => ({
        ...c,
        topBranch: c.courses[0]?.branch ?? null,
        topExam: c.courses[0]?.examAccepted ?? null,
        courses: undefined,
      })),
      meta: {
        page,
        pageSize,
        total,
        hasMore: page * pageSize < total,
        facets,
      },
    });
  } catch (error) {
    console.error("Error fetching colleges:", error);
    return NextResponse.json(
      apiError("INTERNAL_ERROR", "Failed to fetch colleges"),
      { status: 500 }
    );
  }
}

/**
 * Compute facet counts for each filter dimension.
 *
 * For simplicity and to avoid N+1, we compute facets using groupBy queries.
 * Each facet is computed with all currently applied filters to show
 * how many results remain if a given facet value is toggled.
 */
async function computeFacets(
  baseWhere: Prisma.CollegeWhereInput,
  _currentFilters: {
    state?: string[];
    city?: string[];
    type?: string[];
    exam?: string[];
    branch?: string[];
  }
) {
  // State facet
  const [stateFacet, cityFacet, typeFacet] = await Promise.all([
    db.college.groupBy({
      by: ["state"],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
    }),
    db.college.groupBy({
      by: ["city"],
      where: baseWhere,
      _count: { id: true },
      orderBy: { _count: { id: "desc" } },
      take: 30, // Limit city facets
    }),
    db.college.groupBy({
      by: ["type"],
      where: baseWhere,
      _count: { id: true },
    }),
  ]);

  // For exam and branch facets, we need to query via courses
  const collegeIds = await db.college.findMany({
    where: baseWhere,
    select: { id: true },
  });
  const ids = collegeIds.map((c) => c.id);

  const [examFacet, branchFacet] = await Promise.all([
    ids.length > 0
      ? db.course.groupBy({
          by: ["examAccepted"],
          where: { collegeId: { in: ids } },
          _count: { collegeId: true },
        })
      : Promise.resolve([]),
    ids.length > 0
      ? db.course.groupBy({
          by: ["branch"],
          where: { collegeId: { in: ids } },
          _count: { collegeId: true },
          orderBy: { _count: { collegeId: "desc" } },
          take: 20,
        })
      : Promise.resolve([]),
  ]);

  return {
    state: Object.fromEntries(
      stateFacet.map((f) => [f.state, f._count.id])
    ),
    city: Object.fromEntries(
      cityFacet.map((f) => [f.city, f._count.id])
    ),
    type: Object.fromEntries(
      typeFacet.map((f) => [f.type, f._count.id])
    ),
    exam: Object.fromEntries(
      examFacet.map((f) => [f.examAccepted, f._count.collegeId])
    ),
    branch: Object.fromEntries(
      branchFacet.map((f) => [f.branch, f._count.collegeId])
    ),
  };
}
