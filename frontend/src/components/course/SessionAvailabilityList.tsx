import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users } from 'lucide-react';
import type { CoachCalendarEvent } from '@/api/coachCalendar';

interface SessionAvailabilityListProps {
  events: CoachCalendarEvent[];
  onSelectAvailability: (event: CoachCalendarEvent) => void;
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('zh-CN', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateDuration(startTs: string, endTs: string): string {
  const start = new Date(startTs);
  const end = new Date(endTs);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  
  if (durationMinutes < 60) {
    return `${durationMinutes}分钟`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes > 0 ? `${hours}小时${minutes}分钟` : `${hours}小时`;
}

export default function SessionAvailabilityList({ events, onSelectAvailability }: SessionAvailabilityListProps) {
  const sessions = events.filter(e => e.kind === 'session');
  const availabilities = events.filter(e => e.kind === 'availability');

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-400" />
        <p>暂无可预约的课程时段</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Sessions Section */}
      {sessions.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Calendar className="h-5 w-5 mr-2" />
            固定课程（Session）
          </h3>
          <div className="space-y-3">
            {sessions.map((session) => (
              <Card key={session.id} className="border-l-4 border-l-green-500">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-2">{session.title}</h4>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatDateTime(session.start_ts)} - {formatTime(session.end_ts)}</span>
                          <Badge variant="outline" className="ml-2">
                            {calculateDuration(session.start_ts, session.end_ts)}
                          </Badge>
                        </div>
                        
                        {session.location && (
                          <div className="flex items-center">
                            <MapPin className="h-4 w-4 mr-2" />
                            <span>{session.location}</span>
                          </div>
                        )}
                        
                        {session.capacity && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>
                              已预约: {session.booked_count || 0} / {session.capacity}
                              {session.capacity - (session.booked_count || 0) === 0 && (
                                <Badge variant="destructive" className="ml-2">已满</Badge>
                              )}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
                      固定课程
                    </Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Availabilities Section */}
      {availabilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            可预约时段（Availability）
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            教练在以下时段有空，您可以选择合适的时间预约课程
          </p>
          <div className="space-y-3">
            {availabilities.map((availability) => (
              <Card key={availability.id} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                <CardContent className="pt-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h4 className="font-medium text-lg mb-2">{availability.title || '可预约时段'}</h4>
                      
                      <div className="space-y-2 text-sm text-gray-600">
                        <div className="flex items-center">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>{formatDateTime(availability.start_ts)} - {formatTime(availability.end_ts)}</span>
                          <Badge variant="outline" className="ml-2">
                            {calculateDuration(availability.start_ts, availability.end_ts)}
                          </Badge>
                        </div>
                        
                        {availability.capacity && (
                          <div className="flex items-center">
                            <Users className="h-4 w-4 mr-2" />
                            <span>
                              剩余名额: {availability.capacity - (availability.booked_count || 0)}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div className="flex flex-col items-end space-y-2">
                      <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                        可预约
                      </Badge>
                      <Button 
                        size="sm"
                        onClick={() => onSelectAvailability(availability)}
                        disabled={availability.capacity && (availability.capacity - (availability.booked_count || 0) === 0)}
                      >
                        选择时间
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

