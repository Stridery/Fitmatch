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
    price_per_lesson,
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
      className={`bg-gray-800/80 backdrop-blur-sm border-gray-700/50 hover:shadow-xl hover:shadow-gray-900/20 transition-all duration-300 cursor-pointer hover:scale-105 transform hover:border-gray-600 ${className}`}
      onClick={() => onClick?.(item)}
    >
      <div className="p-6 space-y-4">
        {/* Header with Title and Match Score */}
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-white mb-2 leading-tight">{title}</h3>
            <div className="flex items-center gap-2 text-sm text-gray-400">
              <span className="bg-gray-700/50 px-2 py-1 rounded-md">{city}</span>
              <span>•</span>
              <span className="text-gray-300">{coach_nickname || coach_name}</span>
            </div>
          </div>
          <div className="ml-4">
            <ScoreBar score={match_score} />
          </div>
        </div>

        {/* Certificates */}
        {certificates?.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {certificates.map((cert, i) => (
              <Badge key={i} variant="outline" className="text-xs bg-gray-700/50 text-gray-300 border-gray-600">
                {cert}
              </Badge>
            ))}
          </div>
        )}

        {/* Attributes */}
        {attributes.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {attributes.map((attr, i) => (
              <Badge key={i} variant="secondary" className="text-xs bg-gray-700/50 text-gray-300 hover:bg-gray-600/50">
                {attr}
              </Badge>
            ))}
          </div>
        )}

        {/* Price */}
        <div className="flex items-center justify-between pt-2 border-t border-gray-700/50">
          <PriceTag
            pricePerLesson={price_per_lesson}
            className="text-lg font-semibold"
          />
          <div className="text-sm text-gray-400">
            View Details →
          </div>
        </div>
      </div>
    </Card>
  );
}


