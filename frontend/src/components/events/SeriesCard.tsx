import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { MapPin, Building2 } from 'lucide-react';
import type { EventGroupDTO } from '@/api/events';

interface SeriesCardProps {
  series: EventGroupDTO;
}

export function SeriesCard({ series }: SeriesCardProps) {
  const navigate = useNavigate();

  const getGroupTypeBadge = () => {
    if (series.group_type === 'SERIES') {
      return (
        <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
          SERIES
        </Badge>
      );
    } else {
      return (
        <Badge className="bg-purple-500/20 text-purple-400 border-purple-500/50">
          COMPETITION
        </Badge>
      );
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-800 border-gray-700 text-white"
      onClick={() => navigate(`/home/community/series/${series.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-white pr-4">
            {series.title}
          </CardTitle>
          {getGroupTypeBadge()}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {series.sport && (
          <div className="flex items-center text-sm text-gray-300">
            <span className="font-medium">{series.sport.name}</span>
          </div>
        )}

        <div className="flex flex-wrap gap-2 mt-2">
          {series.skill_level && (
            <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
              {series.skill_level}
            </Badge>
          )}
          {series.age_bracket && (
            <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
              {series.age_bracket}
            </Badge>
          )}
          {series.gender_policy && (
            <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
              {series.gender_policy}
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

