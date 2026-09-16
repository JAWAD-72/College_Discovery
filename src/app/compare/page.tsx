import type { Metadata } from "next";
import { Suspense } from "react";
import { CompareClient } from "./compare-client";
import { Skeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Compare Colleges — CollegeCompass",
  description: "Side-by-side comparison of Indian colleges: fees, placements, ratings, facilities.",
};

export default function ComparePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-64 w-full" />
        </div>
      }
    >
      <CompareClient />
    </Suspense>
  );
}
