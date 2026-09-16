import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedCollegeSchema, zodError, apiError } from "@/lib/schemas";

/**
 * Helper to extract user ID from Authorization header.
 * In production, this would validate the Supabase JWT.
 * For development, we accept a user ID directly.
 */
function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;

  // In production: verify Supabase JWT and extract user ID
  // For now: extract from Bearer token (which is the user ID in dev)
  const token = authHeader.replace("Bearer ", "").trim();
  return token || null;
}

/**
 * GET /api/v1/saved/colleges
 */
export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json(
      apiError("UNAUTHORIZED", "Authentication required"),
      { status: 401 }
    );
  }

  try {
    const saved = await db.savedCollege.findMany({
      where: { userId },
      include: {
        college: {
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
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json({ data: saved });
  } catch (error) {
    console.error("Error fetching saved colleges:", error);
    return NextResponse.json(
      apiError("INTERNAL_ERROR", "Failed to fetch saved colleges"),
      { status: 500 }
    );
  }
}

/**
 * POST /api/v1/saved/colleges
 */
export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json(
      apiError("UNAUTHORIZED", "Authentication required"),
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Invalid JSON body"),
      { status: 400 }
    );
  }

  const parsed = savedCollegeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  try {
    // Check college exists
    const college = await db.college.findUnique({
      where: { id: parsed.data.collegeId },
    });
    if (!college) {
      return NextResponse.json(
        apiError("NOT_FOUND", "College not found"),
        { status: 404 }
      );
    }

    const saved = await db.savedCollege.upsert({
      where: {
        userId_collegeId: {
          userId,
          collegeId: parsed.data.collegeId,
        },
      },
      create: {
        userId,
        collegeId: parsed.data.collegeId,
      },
      update: {},
    });

    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error) {
    console.error("Error saving college:", error);
    return NextResponse.json(
      apiError("INTERNAL_ERROR", "Failed to save college"),
      { status: 500 }
    );
  }
}

/**
 * DELETE /api/v1/saved/colleges
 */
export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json(
      apiError("UNAUTHORIZED", "Authentication required"),
      { status: 401 }
    );
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Invalid JSON body"),
      { status: 400 }
    );
  }

  const parsed = savedCollegeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  try {
    await db.savedCollege.delete({
      where: {
        userId_collegeId: {
          userId,
          collegeId: parsed.data.collegeId,
        },
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error removing saved college:", error);
    return NextResponse.json(
      apiError("NOT_FOUND", "Saved college not found"),
      { status: 404 }
    );
  }
}
