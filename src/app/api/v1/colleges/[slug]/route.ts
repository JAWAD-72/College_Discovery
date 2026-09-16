import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { apiError } from "@/lib/schemas";

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * GET /api/v1/colleges/:slug
 *
 * Returns full college detail with courses, placements, reviews, and cutoffs.
 * Single efficient query using Prisma includes (no N+1).
 * Server-rendered for fast first paint.
 */
export async function GET(_request: NextRequest, { params }: RouteParams) {
  const { slug } = await params;

  if (!slug || slug.trim().length === 0) {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Slug is required"),
      { status: 400 }
    );
  }

  try {
    const college = await db.college.findUnique({
      where: { slug },
      include: {
        courses: {
          orderBy: { totalSeats: "desc" },
        },
        placements: {
          orderBy: { year: "desc" },
        },
        reviews: {
          orderBy: { createdAt: "desc" },
        },
        cutoffs: {
          orderBy: [{ year: "desc" }, { exam: "asc" }, { category: "asc" }],
          include: {
            course: {
              select: { name: true, branch: true },
            },
          },
        },
      },
    });

    if (!college) {
      return NextResponse.json(
        apiError("NOT_FOUND", `College with slug "${slug}" not found`),
        { status: 404 }
      );
    }

    // Compute review aggregates
    const reviews = college.reviews;
    const ratingBreakdown =
      reviews.length > 0
        ? {
            academics:
              parseFloat(
                (
                  reviews.reduce((s, r) => s + r.ratingAcademics, 0) /
                  reviews.length
                ).toFixed(1)
              ),
            infrastructure:
              parseFloat(
                (
                  reviews.reduce((s, r) => s + r.ratingInfrastructure, 0) /
                  reviews.length
                ).toFixed(1)
              ),
            placements:
              parseFloat(
                (
                  reviews.reduce((s, r) => s + r.ratingPlacements, 0) /
                  reviews.length
                ).toFixed(1)
              ),
            faculty:
              parseFloat(
                (
                  reviews.reduce((s, r) => s + r.ratingFaculty, 0) /
                  reviews.length
                ).toFixed(1)
              ),
          }
        : null;

    // Rating distribution
    const distribution = [0, 0, 0, 0, 0]; // 1-5 stars
    reviews.forEach((r) => {
      const bucket = Math.min(4, Math.max(0, Math.floor(r.ratingOverall) - 1));
      distribution[bucket]++;
    });

    return NextResponse.json({
      data: {
        ...college,
        ratingBreakdown,
        ratingDistribution: distribution,
      },
    });
  } catch (error) {
    console.error("Error fetching college detail:", error);
    return NextResponse.json(
      apiError("INTERNAL_ERROR", "Failed to fetch college"),
      { status: 500 }
    );
  }
}
