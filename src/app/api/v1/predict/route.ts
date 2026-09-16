import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { predictSchema, zodError, apiError } from "@/lib/schemas";
import { LATEST_CUTOFF_YEAR } from "@/lib/constants";

/**
 * POST /api/v1/predict
 *
 * Rank Predictor: given exam + rank + category, returns colleges bucketed as
 * SAFE / TARGET / REACH with the specific cutoff row that justified each bucket.
 *
 * Bucket logic (lower rank number = better):
 *   SAFE   — student's rank <= closing_rank * 0.7 (30%+ margin)
 *   TARGET — student's rank between closing_rank * 0.7 and closing_rank * 1.0
 *   REACH  — student's rank between closing_rank * 1.0 and closing_rank * 1.5
 */
export async function POST(request: NextRequest) {
  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json(
      apiError("VALIDATION_ERROR", "Invalid JSON body"),
      { status: 400 }
    );
  }

  const parsed = predictSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(zodError(parsed.error), { status: 400 });
  }

  const { exam, rank, category, preferredStates } = parsed.data;

  try {
    // Fetch cutoffs matching exam + category, with a reasonable upper bound
    // to limit result set. We look for closing ranks where the student might
    // fit (up to 1.5x their rank for REACH colleges).
    const maxClosingRank = Math.ceil(rank * 1.5);

    const cutoffWhere = {
      exam,
      category,
      closingRank: { gte: Math.max(1, Math.floor(rank * 0.5)) },
      // Get the most recent year
      year: LATEST_CUTOFF_YEAR,
    };

    const cutoffs = await db.cutoff.findMany({
      where: cutoffWhere,
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
            minFeesTotal: true,
            maxFeesTotal: true,
          },
        },
        course: {
          select: {
            id: true,
            name: true,
            branch: true,
            totalFees: true,
          },
        },
      },
      orderBy: { closingRank: "asc" },
    });

    // Apply preferred states filter if provided
    const filtered = preferredStates?.length
      ? cutoffs.filter((c) => preferredStates.includes(c.college.state))
      : cutoffs;

    // Bucket the results
    type PredictionResult = {
      college: (typeof cutoffs)[0]["college"];
      course: (typeof cutoffs)[0]["course"];
      cutoff: {
        exam: string;
        category: string;
        year: number;
        openingRank: number;
        closingRank: number;
      };
      margin: number;
    };

    const safe: PredictionResult[] = [];
    const target: PredictionResult[] = [];
    const reach: PredictionResult[] = [];

    // Deduplicate by college (keep best cutoff match per college)
    const seenColleges = new Set<number>();

    for (const cutoff of filtered) {
      if (seenColleges.has(cutoff.college.id)) continue;
      seenColleges.add(cutoff.college.id);

      const result: PredictionResult = {
        college: cutoff.college,
        course: cutoff.course,
        cutoff: {
          exam: cutoff.exam,
          category: cutoff.category,
          year: cutoff.year,
          openingRank: cutoff.openingRank,
          closingRank: cutoff.closingRank,
        },
        margin: parseFloat(
          (((cutoff.closingRank - rank) / cutoff.closingRank) * 100).toFixed(1)
        ),
      };

      const ratio = rank / cutoff.closingRank;

      if (ratio <= 0.7) {
        // Student's rank is 30%+ better than closing — SAFE
        safe.push(result);
      } else if (ratio <= 1.0) {
        // Student's rank is near closing — TARGET
        target.push(result);
      } else if (ratio <= 1.5) {
        // Student's rank is worse than closing but within 50% — REACH
        reach.push(result);
      }
    }

    return NextResponse.json({
      data: {
        safe: safe.slice(0, 15),
        target: target.slice(0, 15),
        reach: reach.slice(0, 10),
        meta: {
          exam,
          rank,
          category,
          totalMatches: safe.length + target.length + reach.length,
        },
      },
    });
  } catch (error) {
    console.error("Error predicting colleges:", error);
    return NextResponse.json(
      apiError("INTERNAL_ERROR", "Failed to predict colleges"),
      { status: 500 }
    );
  }
}
