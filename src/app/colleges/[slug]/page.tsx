import type { Metadata } from "next";
import { db } from "@/lib/db";
import { notFound } from "next/navigation";
import { CollegeDetail } from "./detail-client";

interface PageProps {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params;
  const college = await db.college.findUnique({
    where: { slug },
    select: { name: true, city: true, state: true },
  });

  if (!college) return { title: "College Not Found" };

  return {
    title: `${college.name} — CollegeCompass`,
    description: `Explore courses, fees, placements, reviews and cutoffs for ${college.name} in ${college.city}, ${college.state}.`,
  };
}

export default async function CollegeDetailPage({ params }: PageProps) {
  const { slug } = await params;

  // Server-side fetch for fast first paint
  const college = await db.college.findUnique({
    where: { slug },
    include: {
      courses: { orderBy: { totalSeats: "desc" } },
      placements: { orderBy: { year: "desc" } },
      reviews: { orderBy: { createdAt: "desc" } },
      cutoffs: {
        orderBy: [{ year: "desc" }, { exam: "asc" }, { category: "asc" }],
        include: { course: { select: { name: true, branch: true } } },
      },
    },
  });

  if (!college) notFound();

  // Compute review breakdown server-side
  const reviews = college.reviews;
  const ratingBreakdown = reviews.length > 0 ? {
    academics: parseFloat((reviews.reduce((s, r) => s + r.ratingAcademics, 0) / reviews.length).toFixed(1)),
    infrastructure: parseFloat((reviews.reduce((s, r) => s + r.ratingInfrastructure, 0) / reviews.length).toFixed(1)),
    placements: parseFloat((reviews.reduce((s, r) => s + r.ratingPlacements, 0) / reviews.length).toFixed(1)),
    faculty: parseFloat((reviews.reduce((s, r) => s + r.ratingFaculty, 0) / reviews.length).toFixed(1)),
  } : null;

  const distribution = [0, 0, 0, 0, 0];
  reviews.forEach((r) => {
    const bucket = Math.min(4, Math.max(0, Math.floor(r.ratingOverall) - 1));
    distribution[bucket]++;
  });

  // Serialize dates for client component
  const serialized = {
    ...college,
    ratingBreakdown,
    ratingDistribution: distribution,
    reviews: reviews.map((r) => ({ ...r, createdAt: r.createdAt.toISOString() })),
    cutoffs: college.cutoffs.map((c) => ({
      ...c,
      course: c.course,
    })),
  };

  return <CollegeDetail college={serialized} />;
}
