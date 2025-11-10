import { useNavigate } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Clock, MapPin, Users } from 'lucide-react';
import type { EventDTO } from '@/types/events';
import { formatZonedNY } from '@/utils/datetime';
import { getEventCounters } from '@/api/events';
import { useState, useEffect } from 'react';

interface EventMiniCardProps {
  event: EventDTO;
}

export function EventMiniCard({ event }: EventMiniCardProps) {
  const navigate = useNavigate();
  const [counters, setCounters] = useState({ enrolled_count: 0, waitlist_count: 0 });

  useEffect(() => {
    const loadCounters = async () => {
      try {
        const data = await getEventCounters(event.id);
        setCounters(data);
      } catch (err) {
        console.error('Error loading counters:', err);
      }
    };
    loadCounters();
  }, [event.id]);

  const remaining = Math.max(0, event.capacity_unit - counters.enrolled_count);

  const getJoinPolicyBadge = () => {
    switch (event.join_policy) {
      case 'PUBLIC_OPEN':
        return (
          <Badge className="bg-green-500/20 text-green-400 border-green-500/50 text-xs">
            OPEN
          </Badge>
        );
      case 'PUBLIC_CLOSED':
        return (
          <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/50 text-xs">
            CLOSED
          </Badge>
        );
      case 'ROSTER_LOCKED':
        return (
          <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/50 text-xs">
            LOCKED
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <Card
      className="cursor-pointer hover:shadow-lg transition-shadow bg-gray-800 border-gray-700 text-white"
      onClick={() => navigate(`/home/community/events/${event.id}`)}
    >
      <CardContent className="p-4 space-y-2">
        <div className="flex items-start justify-between">
          <h3 className="text-sm font-semibold text-white pr-2 flex-1">
            {event.title}
          </h3>
          {getJoinPolicyBadge()}
        </div>
        
        <div className="flex items-center text-xs text-gray-300">
          <Clock className="h-3 w-3 mr-1 text-gray-400" />
          <span>{formatZonedNY(event.start_at)}</span>
        </div>
        
        <div className="flex items-center text-xs text-gray-300">
          <MapPin className="h-3 w-3 mr-1 text-gray-400" />
          <span className="truncate">{event.location_text}</span>
        </div>
        
        <div className="flex items-center justify-between text-xs">
          <div className="flex items-center text-gray-300">
            <Users className="h-3 w-3 mr-1 text-gray-400" />
            <span>
              {counters.enrolled_count} / {event.capacity_unit}
            </span>
          </div>
          {event.join_policy !== 'ROSTER_LOCKED' && (
            <span className="text-gray-400">
              {remaining > 0 ? `${remaining} spots` : 'Full'}
            </span>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

