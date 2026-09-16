import type { Metadata } from "next";
import { Suspense } from "react";
import { CollegesListing } from "./listing-client";
import { ListingSkeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Browse Colleges — CollegeCompass",
  description: "Search and filter 300+ Indian colleges by state, fees, rating, exam, and more.",
};

export default function CollegesPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
          <ListingSkeleton />
        </div>
      }
    >
      <CollegesListing />
    </Suspense>
  );
}
