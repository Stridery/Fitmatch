export function ResultCardSkeleton() {
  return (
    <div className="w-full p-4 border rounded-lg animate-pulse">
      <div className="space-y-3">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="flex gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-6 bg-gray-200 rounded w-16" />
          ))}
        </div>
        <div className="h-2 bg-gray-200 rounded w-full" />
        <div className="h-4 bg-gray-200 rounded w-1/4" />
      </div>
    </div>
  );
}

export function ResultListSkeleton() {
  return (
    <div className="space-y-4">
      {[1, 2, 3].map((i) => (
        <ResultCardSkeleton key={i} />
      ))}
    </div>
  );
}


