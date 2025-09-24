interface ScoreBarProps {
  score: number;
  className?: string;
}

export function ScoreBar({ score, className = "" }: ScoreBarProps) {
  // Ensure score is between 0 and 100
  const normalizedScore = Math.max(0, Math.min(100, score));
  
  return (
    <div className={`flex items-center gap-2 ${className}`}>
      <div className="h-2 flex-1 bg-gray-200 rounded-full overflow-hidden">
        <div 
          className="h-full bg-primary rounded-full transition-all duration-300 ease-out"
          style={{ width: `${normalizedScore}%` }}
        />
      </div>
      <span className="text-sm font-medium text-gray-600">
        {normalizedScore}%
      </span>
    </div>
  );
}


