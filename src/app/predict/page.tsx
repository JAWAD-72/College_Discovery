import type { Metadata } from "next";
import { Suspense } from "react";
import { PredictClient } from "./predict-client";
import { Skeleton } from "@/components/skeletons";

export const metadata: Metadata = {
  title: "Rank Predictor — CollegeCompass",
  description: "Predict which colleges you can get into based on your exam rank. See SAFE, TARGET, and REACH colleges.",
};

export default function PredictPage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-4xl mx-auto px-4 py-8 space-y-4">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-48 w-full" />
        </div>
      }
    >
      <PredictClient />
    </Suspense>
  );
}
