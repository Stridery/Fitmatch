import React from 'react';
import { 
  halfHourSlotsInRange, 
  formatTimeLabel, 
  formatDayHeader, 
  getWeekDays 
} from '@/lib/timeGrid';

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

interface WeekViewProps {
  weekStart: Date;
  events: EventData[];
  onNewEvent: (kind: 'session' | 'availability', startTs: string, endTs: string) => void;
  onEditEvent: (event: EventData) => void;
}

export default function WeekView({ weekStart, events, onNewEvent, onEditEvent }: WeekViewProps) {
  const weekDays = getWeekDays(weekStart);
  const timeSlots = halfHourSlotsInRange(weekStart, weekStart);

  const handleGridClick = (dayIndex: number, timeSlot: Date) => {
    const clickedDate = new Date(weekDays[dayIndex]);
    clickedDate.setHours(timeSlot.getHours(), timeSlot.getMinutes(), 0, 0);
    
    const endTime = new Date(clickedDate);
    endTime.setMinutes(endTime.getMinutes() + 30);
    
    const startTs = clickedDate.toISOString();
    const endTs = endTime.toISOString();
    
    // Default to session type for now
    onNewEvent('session', startTs, endTs);
  };

  const getEventPosition = (event: EventData) => {
    const startDate = new Date(event.startTime);
    const endDate = new Date(event.endTime);
    
    // Find which day this event belongs to
    const dayIndex = weekDays.findIndex(day => 
      day.getDate() === startDate.getDate() && 
      day.getMonth() === startDate.getMonth() && 
      day.getFullYear() === startDate.getFullYear()
    );
    
    if (dayIndex === -1) return null;
    
    // Calculate time position (each slot is 30 minutes, starting from 6:00)
    const startMinutes = startDate.getHours() * 60 + startDate.getMinutes();
    const endMinutes = endDate.getHours() * 60 + endDate.getMinutes();
    const startSlot = (startMinutes - 360) / 30; // 360 = 6:00 in minutes
    const endSlot = (endMinutes - 360) / 30;
    const duration = endSlot - startSlot;
    
    return {
      dayIndex,
      startSlot,
      duration: Math.max(1, duration)
    };
  };

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
    <div className="flex-1 overflow-auto bg-white dark:bg-gray-800">
      {/* Grid Container */}
      <div className="min-h-full">
        {/* Header Row */}
        <div className="sticky top-0 z-10 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <div className="grid grid-cols-8 gap-px">
            {/* Time column header */}
            <div className="bg-gray-50 dark:bg-gray-700 p-3 text-sm font-medium text-gray-500 dark:text-gray-400">
              Time
            </div>
            {/* Day headers */}
            {weekDays.map((day, index) => (
              <div
                key={index}
                className="bg-gray-50 dark:bg-gray-700 p-3 text-center text-sm font-medium text-gray-900 dark:text-white"
              >
                {formatDayHeader(day)}
              </div>
            ))}
          </div>
        </div>

        {/* Time Grid */}
        <div className="grid grid-cols-8 gap-px">
          {/* Time Column */}
          <div className="bg-gray-50 dark:bg-gray-700">
            {timeSlots.map((timeSlot, index) => (
              <div
                key={index}
                className="h-6 border-b border-gray-200 dark:border-gray-600 flex items-center justify-end pr-2 text-xs text-gray-500 dark:text-gray-400 font-mono tabular-nums"
              >
                {formatTimeLabel(timeSlot)}
              </div>
            ))}
          </div>

          {/* Day Columns */}
          {weekDays.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-white dark:bg-gray-800 relative">
              {timeSlots.map((timeSlot, timeIndex) => (
                <div
                  key={timeIndex}
                  className="h-6 border-b border-r border-gray-200 dark:border-gray-600 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                  onClick={() => handleGridClick(dayIndex, timeSlot)}
                  title={`Click to create new event at ${formatTimeLabel(timeSlot)}`}
                />
              ))}
              
              {/* Render events for this day */}
              {events.map((event) => {
                const position = getEventPosition(event);
                if (!position || position.dayIndex !== dayIndex) return null;
                
                return (
                  <div
                    key={event.id}
                    className={`absolute left-1 right-1 ${getEventColor(event.kind)} text-white text-xs p-1 rounded shadow-sm cursor-pointer hover:opacity-80 transition-opacity`}
                    style={{
                      top: `${position.startSlot * 24}px`, // 24px per 30-min slot
                      height: `${position.duration * 24}px`
                    }}
                    title={`${event.title} - ${formatTimeLabel(new Date(event.startTime))} to ${formatTimeLabel(new Date(event.endTime))}`}
                    onClick={(e) => {
                      e.stopPropagation();
                      onEditEvent(event);
                    }}
                  >
                    <div className="font-medium truncate">{event.title}</div>
                    <div className="text-xs opacity-90 truncate">
                      {formatTimeLabel(new Date(event.startTime))} - {formatTimeLabel(new Date(event.endTime))}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
