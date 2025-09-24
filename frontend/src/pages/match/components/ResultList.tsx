import { CourseSearchItem } from "../types";
import { ResultCard } from "./ResultCard";
import { ResultListSkeleton } from "./Skeleton";
import { Empty } from "./Empty";
import { Button } from "@/components/ui/button";

interface ResultListProps {
  items: CourseSearchItem[];
  loading?: boolean;
  hasMore?: boolean;
  onLoadMore?: () => void;
  onSelectCourse?: (item: CourseSearchItem) => void;
  className?: string;
}

export function ResultList({
  items,
  loading = false,
  hasMore = false,
  onLoadMore,
  onSelectCourse,
  className = "",
}: ResultListProps) {
  if (loading && !items.length) {
    return <ResultListSkeleton />;
  }

  if (!items.length) {
    return <Empty />;
  }

  return (
    <div className={`space-y-4 ${className}`}>
      {items.map((item) => (
        <ResultCard
          key={item.course_id}
          item={item}
          onClick={onSelectCourse}
        />
      ))}
      
      {/* Load More */}
      {hasMore && (
        <div className="mt-4 text-center">
          <Button
            variant="outline"
            onClick={onLoadMore}
            disabled={loading}
            className="text-gray-900 bg-white hover:bg-gray-100"
          >
            {loading ? "Loading..." : "Load More"}
          </Button>
        </div>
      )}
    </div>
  );
}