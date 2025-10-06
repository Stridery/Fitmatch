import { Button } from "@/components/ui/button";
import { Loader2, RefreshCw, Search } from "lucide-react";

interface ResultStateProps {
  onRetry?: () => void;
}

// 骨架加载
export function ResultSkeleton() {
  return (
    <div
      className="space-y-4"
      role="status"
      aria-label="Loading search results"
    >
      {Array.from({ length: 3 }).map((_, i) => (
        <div
          key={i}
          className="bg-gray-100 rounded-lg p-4 animate-pulse"
        >
          <div className="h-6 bg-gray-200 rounded w-3/4 mb-2"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  );
}

// 加载更多骨架
export function LoadMoreSkeleton() {
  return (
    <div
      className="flex justify-center py-4"
      role="status"
      aria-label="Loading more results"
    >
      <Loader2 className="h-6 w-6 animate-spin text-gray-400" />
    </div>
  );
}

// 错误态
export function ResultError({ onRetry }: ResultStateProps) {
  return (
    <div
      className="text-center py-8"
      role="alert"
      aria-label="Error loading results"
    >
      <div className="text-red-500 mb-4">加载失败，请重试</div>
      <Button
        variant="outline"
        onClick={onRetry}
        className="gap-2"
      >
        <RefreshCw className="h-4 w-4" />
        重试
      </Button>
    </div>
  );
}

// 空态
export function ResultEmpty() {
  return (
    <div
      className="text-center py-8 text-gray-500"
      role="status"
      aria-label="No results found"
    >
      <Search className="h-12 w-12 mx-auto mb-4 text-gray-400" />
      <div className="text-lg mb-2">未找到符合条件的课程</div>
      <div className="text-sm">
        试试调整筛选条件，可能会有不同的发现
      </div>
    </div>
  );
}


