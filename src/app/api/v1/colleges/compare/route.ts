import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/schemas";

/**
 * GET /api/v1/colleges/compare?ids=1,2,3
 *
 * Returns 2-3 colleges with full relations for side-by-side comparison.
 * Validates that exactly 2-3 valid IDs are provided.
 */
export async function GET(request: NextRequest) {
  const idsParam = request.nextUrl.searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "ids parameter is required"),
      { status: 400 }
    );
  }

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n) && n > 0);

  if (ids.length < 2 || ids.length > 3) {
    return NextResponse.json(
      apiError(
        "VALIDATION_ERROR",
        "Provide 2 or 3 college IDs for comparison"
      ),
      { status: 422 }
    );
  }

  try {
    const colleges = await db.college.findMany({
      where: { id: { in: ids } },
      include: {
        courses: {
          orderBy: { totalSeats: "desc" },
        },
        placements: {
          orderBy: { year: "desc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
          take: 5,
        },
      },
    });

    if (colleges.length < 2) {
      return NextResponse.json(
        apiError("NOT_FOUND", "One or more colleges not found"),
        { status: 404 }
      );
    }

    // Compute aggregate review stats per college
    const collegesWithStats = colleges.map((college) => {
      const reviews = college.reviews;
      const avgAcademics =
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.ratingAcademics, 0) / reviews.length
          : 0;
      const avgInfra =
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.ratingInfrastructure, 0) /
            reviews.length
          : 0;
      const avgPlacements =
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.ratingPlacements, 0) / reviews.length
          : 0;
      const avgFaculty =
        reviews.length > 0
          ? reviews.reduce((s, r) => s + r.ratingFaculty, 0) / reviews.length
          : 0;

      return {
        ...college,
        ratingBreakdown: {
          academics: parseFloat(avgAcademics.toFixed(1)),
          infrastructure: parseFloat(avgInfra.toFixed(1)),
          placements: parseFloat(avgPlacements.toFixed(1)),
          faculty: parseFloat(avgFaculty.toFixed(1)),
        },
      };
    });

    // Re-order to match the requested ID order
    const ordered = ids
      .map((id) => collegesWithStats.find((c) => c.id === id))
      .filter(Boolean);

    return NextResponse.json({ data: { colleges: ordered } });
  } catch (error) {
    console.error("Error comparing colleges:", error);
    return NextResponse.json(
      apiError("INTERNAL_ERROR", "Failed to compare colleges"),
      { status: 500 }
    );
  }
}
