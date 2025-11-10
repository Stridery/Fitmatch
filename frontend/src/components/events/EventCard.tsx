import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, MapPin, Users, Building2, ExternalLink } from 'lucide-react';
import type { EventDTO } from '@/types/events';
import { formatZonedNY } from '@/utils/datetime';
import { getEventCounters, getUserRegistration } from '@/api/events';

interface EventCardProps {
  event: EventDTO;
}

export function EventCard({ event }: EventCardProps) {
  const navigate = useNavigate();
  const [counters, setCounters] = useState({ enrolled_count: 0, waitlist_count: 0 });
  const [userRegistration, setUserRegistration] = useState<{ status: string; waitlist_pos?: number | null } | null>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [countersData, registrationData] = await Promise.all([
          getEventCounters(event.id),
          getUserRegistration(event.id).catch(() => null),
        ]);
        setCounters(countersData);
        setUserRegistration(registrationData);
      } catch (err) {
        console.error('Error loading data:', err);
      }
    };
    loadData();
  }, [event.id]);

  const remaining = Math.max(0, event.capacity_unit - counters.enrolled_count);
  
  // Determine border color based on user registration status
  const getBorderColor = () => {
    if (userRegistration?.status === 'ENROLLED') {
      return 'border-green-500'; // Green border for enrolled
    } else if (userRegistration?.status === 'WAITLIST') {
      return 'border-blue-500'; // Blue border for waitlist
    }
    return 'border-gray-700'; // Default gray border
  };

  return (
    <Card
      className={`cursor-pointer hover:shadow-lg transition-shadow bg-gray-800 ${getBorderColor()} text-white border-2`}
      onClick={() => navigate(`/home/community/events/${event.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <CardTitle className="text-lg font-semibold text-white pr-4">
            {event.title}
          </CardTitle>
          {userRegistration?.status === 'ENROLLED' && (
            <Badge className="bg-green-500/20 text-green-400 border-green-500/50">
              Enrolled
            </Badge>
          )}
          {userRegistration?.status === 'WAITLIST' && (
            <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50">
              Waitlist #{userRegistration.waitlist_pos}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center text-sm text-gray-300">
          <Clock className="h-4 w-4 mr-2 text-gray-400" />
          <span>{formatZonedNY(event.start_at)}</span>
        </div>
        
        {event.city_text && (
          <div className="flex items-center text-sm text-gray-300">
            <Building2 className="h-4 w-4 mr-2 text-gray-400" />
            <span>{event.city_text}</span>
          </div>
        )}
        
        <div className="flex items-center text-sm text-gray-300">
          <MapPin className="h-4 w-4 mr-2 text-gray-400" />
          <span>{event.location_text}</span>
        </div>
        
        <div className="flex items-center justify-between text-sm">
          <div className="flex items-center text-gray-300">
            <Users className="h-4 w-4 mr-2 text-gray-400" />
            <span>
              {counters.enrolled_count} / {event.capacity_unit}
            </span>
          </div>
          <span className="text-gray-400">
            {remaining > 0 ? `${remaining} spots remaining` : 'Full'}
          </span>
        </div>

        {(event.skill_level || event.age_bracket || event.gender_policy) && (
          <div className="flex flex-wrap gap-2 mt-2 pt-2 border-t border-gray-700">
            {event.skill_level && (
              <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
                {event.skill_level}
              </Badge>
            )}
            {event.age_bracket && (
              <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
                {event.age_bracket}
              </Badge>
            )}
            {event.gender_policy && (
              <Badge variant="outline" className="text-xs bg-gray-700 border-gray-600 text-gray-300">
                {event.gender_policy}
              </Badge>
            )}
          </div>
        )}

        {event.group_id && (
          <div className="flex justify-end mt-3 pt-2 border-t border-gray-700">
            <Button
              size="sm"
              variant="outline"
              onClick={(e) => {
                e.stopPropagation();
                navigate(`/home/community/series/${event.group_id}`);
              }}
              className="bg-gray-700 border-gray-600 text-gray-300 hover:bg-gray-600 hover:text-white text-xs"
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              View Series
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}


