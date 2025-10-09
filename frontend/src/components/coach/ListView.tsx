import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import { formatRangeLabel, getWeekDays, formatTimeLabel } from '@/lib/timeGrid';

interface EventData {
  id: string;
  kind: 'session' | 'availability';
  title: string;
  course?: string;
  location?: string;
  startTime: string;
  endTime: string;
  capacity?: string;
}

interface ListViewProps {
  weekStart: Date;
  events: EventData[];
  onEditEvent: (event: EventData) => void;
}

export default function ListView({ weekStart, events, onEditEvent }: ListViewProps) {
  const weekDays = getWeekDays(weekStart);
  const weekRangeLabel = formatRangeLabel(weekStart, weekDays[6]);

  // Filter sessions and availability for this week
  const weekEvents = events.filter(event => {
    if (event.kind !== 'session' && event.kind !== 'availability') return false;
    
    const eventDate = new Date(event.startTime);
    const weekStartDate = new Date(weekStart);
    const weekEndDate = new Date(weekDays[6]);
    
    return eventDate >= weekStartDate && eventDate <= weekEndDate;
  });

  const getEventColor = (kind: string) => {
    switch (kind) {
      case 'session':
        return 'bg-green-500';
      case 'availability':
        return 'bg-blue-500';
      default:
        return 'bg-gray-500';
    }
  };

  return (
    <div className="flex-1 overflow-auto bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Week Header */}
        <div className="flex items-center space-x-2 text-sm text-gray-600 dark:text-gray-400">
          <Calendar className="h-4 w-4" />
          <span>{weekRangeLabel}</span>
        </div>

        {/* Events List */}
        {weekEvents.length > 0 ? (
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Events This Week
                </h3>
                <div className="flex items-center space-x-1 text-sm text-gray-500 dark:text-gray-400">
                  <Clock className="h-4 w-4" />
                  <span>{weekEvents.length} events</span>
                </div>
              </div>
              
              <div className="space-y-3">
                {weekEvents.map((event) => (
                  <div
                    key={event.id}
                    className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
                    onClick={() => onEditEvent(event)}
                  >
                    <div className="flex items-center space-x-3">
                      <div className={`w-3 h-3 rounded-full ${getEventColor(event.kind)}`}></div>
                      <div>
                        <div className="flex items-center space-x-2">
                          <h4 className="font-medium text-gray-900 dark:text-white">{event.title}</h4>
                          <Badge variant="secondary" className="text-xs">
                            {event.kind === 'session' ? (event.course || 'No course') : event.kind}
                          </Badge>
                        </div>
                        <div className="flex items-center space-x-4 mt-1 text-sm text-gray-600 dark:text-gray-400">
                          <div className="flex items-center space-x-1">
                            <Clock className="h-3 w-3" />
                            <span>
                              {new Date(event.startTime).toLocaleDateString('en-US', { 
                                weekday: 'short',
                                month: 'short',
                                day: 'numeric'
                              })} • {formatTimeLabel(new Date(event.startTime))} - {formatTimeLabel(new Date(event.endTime))}
                            </span>
                          </div>
                          {event.location && (
                            <div className="flex items-center space-x-1">
                              <MapPin className="h-3 w-3" />
                              <span>{event.location}</span>
                            </div>
                          )}
                          {event.capacity && (
                            <div className="flex items-center space-x-1">
                              <Users className="h-3 w-3" />
                              <span>{event.capacity} max</span>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        ) : (
          /* Empty State */
          <Card className="rounded-2xl shadow-sm border-gray-200 dark:border-gray-700">
            <CardContent className="p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                <Calendar className="h-8 w-8 text-gray-400 dark:text-gray-500" />
              </div>
              <h4 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
                No events this week
              </h4>
              <p className="text-gray-500 dark:text-gray-400">
                Create your first session or availability by clicking on the week view or using the "New" button
              </p>
            </CardContent>
          </Card>
        )}

      </div>
    </div>
  );
}
