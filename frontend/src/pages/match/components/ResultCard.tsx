import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { CourseSearchItem } from "../types";
import { ScoreBar } from "./ScoreBar";
import { PriceTag } from "./PriceTag";

interface ResultCardProps {
  item: CourseSearchItem;
  onClick?: (item: CourseSearchItem) => void;
  className?: string;
}

export function ResultCard({ item, onClick, className = "" }: ResultCardProps) {
  const {
    course_id,
    course_title,
    sport_name,
    coach_name,
    coach_nickname,
    city,
    certificates,
    price_per_session,
    price_per_hour,
    styles = [],
    comm_styles = [],
    pace_intensities = [],
    prefer_students = [],
    match_score,
  } = item;

  // Get display title
  const title = course_title || `${sport_name} · ${coach_name}`;

  // Get up to 4 attribute chips
  const attributes = [...styles, ...comm_styles, ...pace_intensities, ...prefer_students].slice(0, 4);

  return (
    <Card
      className={`p-4 hover:shadow-md transition-shadow cursor-pointer ${className}`}
      onClick={() => onClick?.(item)}
    >
      <div className="space-y-3">
        {/* Title */}
        <h3 className="text-lg font-semibold text-gray-900">{title}</h3>

        {/* Location & Coach Info */}
        <div className="flex items-center gap-2 text-sm text-gray-600">
          <span>{city}</span>
          <span>·</span>
          <span>{coach_nickname || coach_name}</span>
          {certificates?.length > 0 && (
            <>
              <span>·</span>
              <div className="flex gap-1">
                {certificates.map((cert, i) => (
                  <Badge key={i} variant="outline" className="text-xs">
                    {cert}
                  </Badge>
                ))}
              </div>
            </>
          )}
        </div>

        {/* Attributes */}
        {attributes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attributes.map((attr, i) => (
              <Badge key={i} variant="secondary" className="text-xs">
                {attr}
              </Badge>
            ))}
          </div>
        )}

        {/* Match Score */}
        <ScoreBar score={match_score} />

        {/* Price */}
        <PriceTag
          pricePerSession={price_per_session}
          pricePerHour={price_per_hour}
          className="mt-2"
        />
      </div>
    </Card>
  );
}


