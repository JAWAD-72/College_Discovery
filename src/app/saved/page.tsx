import type { Metadata } from "next";
import { SavedClient } from "./saved-client";

export const metadata: Metadata = {
  title: "Saved — CollegeCompass",
  description: "Your saved colleges and comparisons.",
};

export default function SavedPage() {
  return <SavedClient />;
}
