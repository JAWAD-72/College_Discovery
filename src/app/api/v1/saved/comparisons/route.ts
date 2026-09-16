import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { savedComparisonSchema, deleteSavedComparisonSchema, zodError, apiError } from "@/lib/schemas";

function getUserId(request: NextRequest): string | null {
  const authHeader = request.headers.get("authorization");
  if (!authHeader) return null;
  const token = authHeader.replace("Bearer ", "").trim();
  return token || null;
}

export async function GET(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required"), { status: 401 });
  }

  try {
    const saved = await db.savedComparison.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
    });
    return NextResponse.json({ data: saved });
  } catch (error) {
    console.error("Error fetching saved comparisons:", error);
    return NextResponse.json(apiError("INTERNAL_ERROR", "Failed to fetch saved comparisons"), { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required"), { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Invalid JSON body"), { status: 400 });
  }

  const parsed = savedComparisonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  try {
    const saved = await db.savedComparison.create({
      data: { userId, collegeIds: parsed.data.collegeIds, title: parsed.data.title },
    });
    return NextResponse.json({ data: saved }, { status: 201 });
  } catch (error) {
    console.error("Error saving comparison:", error);
    return NextResponse.json(apiError("INTERNAL_ERROR", "Failed to save comparison"), { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const userId = getUserId(request);
  if (!userId) {
    return NextResponse.json(apiError("UNAUTHORIZED", "Authentication required"), { status: 401 });
  }

  let body: unknown;
  try { body = await request.json(); } catch {
    return NextResponse.json(apiError("VALIDATION_ERROR", "Invalid JSON body"), { status: 400 });
  }

  const parsed = deleteSavedComparisonSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  try {
    await db.savedComparison.deleteMany({
      where: { id: parsed.data.comparisonId, userId },
    });
    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error("Error deleting comparison:", error);
    return NextResponse.json(apiError("INTERNAL_ERROR", "Failed to delete comparison"), { status: 500 });
  }
}
