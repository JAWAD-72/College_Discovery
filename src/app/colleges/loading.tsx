import { ListingSkeleton } from "@/components/skeletons";

export default function CollegesLoading() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6">
      <ListingSkeleton />
    </div>
  );
}
