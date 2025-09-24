interface PriceTagProps {
  pricePerSession?: number;
  pricePerHour?: number;
  className?: string;
}

export function PriceTag({ pricePerSession, pricePerHour, className = "" }: PriceTagProps) {
  if (!pricePerSession && !pricePerHour) return null;

  return (
    <div className={`flex flex-col gap-1 ${className}`}>
      {pricePerSession && (
        <div className="text-sm">
          <span className="font-medium text-primary">${pricePerSession}</span>
          <span className="text-gray-500 ml-1">/ session</span>
        </div>
      )}
      {pricePerHour && (
        <div className="text-sm">
          <span className="font-medium text-primary">${pricePerHour}</span>
          <span className="text-gray-500 ml-1">/ hour</span>
        </div>
      )}
    </div>
  );
}


