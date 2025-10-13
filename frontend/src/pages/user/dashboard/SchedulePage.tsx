import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon, ChevronLeft, ChevronRight } from 'lucide-react';
import { 
  startOfWeekMonday, 
  endOfWeekSunday, 
  formatRangeLabel, 
  addDays,
  getBrowserTimezoneLabel 
} from '@/lib/timeGrid';
import { getUserCalendarEventsForWeek } from '@/api/coachCalendar';
import type { CoachCalendarEvent } from '@/api/coachCalendar';
import { supabase } from '@/lib/supabase';
import UserScheduleWeekView from '@/components/user/UserScheduleWeekView';

// Helper function to format date for datetime-local input (keeps local timezone)
function formatDateTimeLocal(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  return `${year}-${month}-${day}T${hours}:${minutes}`;
}

// Convert database event to UI event format
function convertDbEventToUI(dbEvent: CoachCalendarEvent) {
  const startDate = new Date(dbEvent.start_ts);
  const endDate = new Date(dbEvent.end_ts);
  
  return {
    id: dbEvent.id,
    kind: dbEvent.kind,
    title: dbEvent.title || '',
    course: dbEvent.course_id || '',
    location: dbEvent.location || '',
    startTime: formatDateTimeLocal(startDate),
    endTime: formatDateTimeLocal(endDate),
    capacity: dbEvent.capacity?.toString() || ''
  };
}

export default function SchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');
  const [isCoach, setIsCoach] = useState<boolean>(false);

  const weekEnd = endOfWeekSunday(weekStart);
  const weekRangeLabel = formatRangeLabel(weekStart, weekEnd);
  const timezoneLabel = getBrowserTimezoneLabel();

  // Load user profile and events
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
        
        // Get user profile to check if they're a coach
        const { data: profile } = await supabase
          .from('user_profile')
          .select('is_coach')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          setIsCoach(profile.is_coach || false);
        }
      }
    };
    loadUserData();
  }, []);

  // Load events when user or week changes
  useEffect(() => {
    const loadEvents = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const dbEvents = await getUserCalendarEventsForWeek(userId, weekStart, isCoach);
        const uiEvents = dbEvents.map(convertDbEventToUI);
        setEvents(uiEvents);
      } catch (error) {
        console.error('Error loading events:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadEvents();
  }, [userId, weekStart, isCoach]);

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleJumpToWeek = (date: Date) => {
    setWeekStart(startOfWeekMonday(date));
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-gray-900">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              My Schedule
            </h1>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {isCoach ? 'Your coaching sessions and availability' : 'Your schedule'}
            </p>
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            All times in <span className="font-medium">{timezoneLabel}</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">
              {weekRangeLabel}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              className="flex items-center space-x-1"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Prev Week</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex items-center space-x-1"
            >
              <span>Next Week</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Jump to Week</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={weekStart}
                  onSelect={(date) => date && handleJumpToWeek(date)}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden">
        {loading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-gray-500 dark:text-gray-400">Loading schedule...</div>
          </div>
        ) : !isCoach ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-gray-500 dark:text-gray-400">
              <p className="text-lg">Your schedule is empty</p>
              <p className="text-sm mt-2">Book sessions with coaches to see them here</p>
            </div>
          </div>
        ) : (
          <UserScheduleWeekView weekStart={weekStart} events={events} />
        )}
      </div>
    </div>
  );
}

