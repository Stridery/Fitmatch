interface PriceTagProps {
  pricePerLesson?: number;
  className?: string;
}

export function PriceTag({ pricePerLesson, className = "" }: PriceTagProps) {
  if (!pricePerLesson) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      <div className="text-sm">
        <span className="font-medium text-primary">¥{pricePerLesson.toFixed(2)}</span>
        <span className="text-gray-500 ml-1">/ lesson</span>
      </div>
    </div>
  );
}


