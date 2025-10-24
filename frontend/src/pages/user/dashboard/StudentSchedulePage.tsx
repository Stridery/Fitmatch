import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { CalendarIcon, ChevronLeft, ChevronRight, Clock, MapPin, Users, X, Clock3 } from 'lucide-react';
import { 
  startOfWeekMonday, 
  endOfWeekSunday, 
  formatRangeLabel, 
  addDays,
  getBrowserTimezoneLabel 
} from '@/lib/timeGrid';
import { getUserSchedule, getUserWaitlist, cancelBooking, exitWaitlist, getUserAvailabilityBookings } from '@/api/booking';
import { cancelAvailabilityBooking } from '@/api/availability';
import type { BookingRecord, WaitlistRecord, AvailabilityBookingRecord } from '@/api/booking';
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

// Convert booking record to UI event format for calendar
function convertBookingToUIEvent(booking: BookingRecord) {
  const startDate = new Date(booking.startTs);
  const endDate = new Date(booking.endTs);
  
  return {
    id: booking.sessionEventId,
    kind: 'session' as const,
    title: booking.title,
    course: booking.courseId,
    location: '', // BookingRecord doesn't have location
    startTime: formatDateTimeLocal(startDate),
    endTime: formatDateTimeLocal(endDate),
    capacity: booking.capacity?.toString() || '',
    status: 'CONFIRMED' as const
  };
}

// Convert waitlist record to UI event format for calendar
function convertWaitlistToUIEvent(waitlist: WaitlistRecord) {
  const startDate = new Date(waitlist.startTs);
  const endDate = new Date(waitlist.endTs);
  
  return {
    id: waitlist.sessionEventId,
    kind: 'session' as const,
    title: waitlist.title,
    course: waitlist.courseId,
    location: '', // WaitlistRecord doesn't have location
    startTime: formatDateTimeLocal(startDate),
    endTime: formatDateTimeLocal(endDate),
    capacity: waitlist.capacity?.toString() || '',
    status: 'WAITLISTED' as const
  };
}

// Convert availability booking record to UI event format for calendar
function convertAvailabilityBookingToUIEvent(booking: AvailabilityBookingRecord) {
  const startDate = new Date(booking.bookedStartTime);
  const endDate = new Date(booking.bookedEndTime);
  
  return {
    id: booking.availabilityEventId,
    kind: 'availability' as const,
    title: booking.title,
    course: 'Availability', // Availability预约没有具体课程
    location: booking.location || '',
    startTime: formatDateTimeLocal(startDate), // 使用本地时间格式
    endTime: formatDateTimeLocal(endDate),
    capacity: '1', // Availability预约通常是1对1
    status: 'CONFIRMED' as const
  };
}

function formatDateTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateDuration(startTs: string, endTs: string): string {
  const start = new Date(startTs);
  const end = new Date(endTs);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  
  if (durationMinutes < 60) {
    return `${durationMinutes} min`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function StudentSchedulePage() {
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()));
  const [bookings, setBookings] = useState<BookingRecord[]>([]);
  const [waitlist, setWaitlist] = useState<WaitlistRecord[]>([]);
  const [availabilityBookings, setAvailabilityBookings] = useState<AvailabilityBookingRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [userId, setUserId] = useState<string>('');

  const weekEnd = endOfWeekSunday(weekStart);
  const weekRangeLabel = formatRangeLabel(weekStart, weekEnd);
  const timezoneLabel = getBrowserTimezoneLabel();

  // Load user data
  useEffect(() => {
    const loadUserData = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        setUserId(user.id);
      }
    };
    loadUserData();
  }, []);

  // Load bookings and waitlist
  useEffect(() => {
    const loadScheduleData = async () => {
      if (!userId) return;
      
      setLoading(true);
      try {
        const [bookingsData, waitlistData, availabilityBookingsData] = await Promise.all([
          getUserSchedule(),
          getUserWaitlist(),
          getUserAvailabilityBookings()
        ]);
        
        setBookings(bookingsData);
        setWaitlist(waitlistData);
        setAvailabilityBookings(availabilityBookingsData);
      } catch (error) {
        console.error('Error loading schedule data:', error);
      } finally {
        setLoading(false);
      }
    };
    
    loadScheduleData();
  }, [userId]);

  // Convert bookings and waitlist to calendar events (filter out cancelled bookings)
  const calendarEvents = [
    ...bookings
      .filter(booking => booking.bookingStatus === 'CONFIRMED') // Only show confirmed bookings in calendar
      .map(convertBookingToUIEvent),
    ...waitlist.map(convertWaitlistToUIEvent),
    ...availabilityBookings
      .filter(booking => booking.bookingStatus === 'CONFIRMED') // Only show confirmed availability bookings
      .map(convertAvailabilityBookingToUIEvent)
  ];

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7));
  };

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7));
  };

  const handleJumpToWeek = (date: Date) => {
    setWeekStart(startOfWeekMonday(date));
  };

  // Handle cancel booking
  const handleCancelBooking = async (sessionId: string) => {
    try {
      await cancelBooking(sessionId);
      // Refresh data
      const [bookingsData, waitlistData] = await Promise.all([
        getUserSchedule(),
        getUserWaitlist()
      ]);
      setBookings(bookingsData);
      setWaitlist(waitlistData);
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Cancel booking error:', error);
      alert(`Booking cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle exit waitlist
  const handleExitWaitlist = async (sessionId: string) => {
    try {
      await exitWaitlist(sessionId);
      // Refresh data
      const [bookingsData, waitlistData] = await Promise.all([
        getUserSchedule(),
        getUserWaitlist()
      ]);
      setBookings(bookingsData);
      setWaitlist(waitlistData);
      alert('Successfully exited waitlist!');
    } catch (error) {
      console.error('Exit waitlist error:', error);
      alert(`Failed to exit waitlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Handle cancel availability booking
  const handleCancelAvailabilityBooking = async (availabilityId: string) => {
    try {
      await cancelAvailabilityBooking(availabilityId, userId);
      // Refresh data
      const [bookingsData, waitlistData, availabilityBookingsData] = await Promise.all([
        getUserSchedule(),
        getUserWaitlist(),
        getUserAvailabilityBookings()
      ]);
      setBookings(bookingsData);
      setWaitlist(waitlistData);
      setAvailabilityBookings(availabilityBookingsData);
      alert('Availability booking cancelled successfully!');
    } catch (error) {
      console.error('Cancel availability booking error:', error);
      alert(`Failed to cancel availability booking: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // Combine and sort all sessions by time (filter out cancelled bookings)
  const allSessions = [
    ...bookings
      .filter(booking => booking.bookingStatus === 'CONFIRMED') // Only show confirmed bookings
      .map(booking => ({ ...booking, type: 'booking' as const })),
    ...waitlist.map(item => ({ ...item, type: 'waitlist' as const })),
    ...availabilityBookings
      .filter(booking => booking.bookingStatus === 'CONFIRMED') // Only show confirmed availability bookings
      .map(booking => ({ 
        ...booking, 
        type: 'availability' as const,
        sessionEventId: booking.availabilityEventId, // Map availabilityEventId to sessionEventId for consistency
        startTs: booking.bookedStartTime,
        endTs: booking.bookedEndTime
      }))
  ].sort((a, b) => new Date(a.startTs).getTime() - new Date(b.startTs).getTime());

  return (
    <div className="flex flex-col h-full bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 border-b border-gray-700 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-white">
              My Course Schedule
            </h1>
            <p className="text-sm text-gray-400 mt-1">
              View your booked courses and waitlist
            </p>
          </div>
          <div className="text-sm text-gray-400">
            Timezone: <span className="font-medium">{timezoneLabel}</span>
          </div>
        </div>

        {/* Week Navigation */}
        <div className="flex items-center justify-between mt-6">
          <div className="flex items-center space-x-4">
            <h2 className="text-lg font-semibold text-white">
              {weekRangeLabel}
            </h2>
          </div>

          <div className="flex items-center space-x-2">
            <Button
              variant="outline"
              size="sm"
              onClick={handlePrevWeek}
              className="flex items-center space-x-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
            >
              <ChevronLeft className="h-4 w-4" />
              <span>Previous Week</span>
            </Button>

            <Button
              variant="outline"
              size="sm"
              onClick={handleNextWeek}
              className="flex items-center space-x-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
            >
              <span>Next Week</span>
              <ChevronRight className="h-4 w-4" />
            </Button>

            <Popover>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm" className="flex items-center space-x-2 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500">
                  <CalendarIcon className="h-4 w-4" />
                  <span>Jump to Week</span>
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0 bg-gray-800 border-gray-700" align="end">
                <Calendar
                  mode="single"
                  selected={weekStart}
                  onSelect={(date) => date && handleJumpToWeek(date)}
                  initialFocus
                  className="[&_button]:text-white [&_button]:hover:bg-gray-700"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex">
        {/* Left: Calendar View */}
        <div className="flex-1 p-6">
          {loading ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-gray-400">Loading...</div>
            </div>
          ) : (
            <UserScheduleWeekView weekStart={weekStart} events={calendarEvents} />
          )}
        </div>

        {/* Right: Session List */}
        <div className="w-96 border-l border-gray-700 bg-gray-800 p-6 overflow-y-auto">
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-2">
              My Courses
            </h3>
            <p className="text-sm text-gray-400">
              Booked: {bookings.filter(b => b.bookingStatus === 'CONFIRMED').length} | 
              Waitlist: {waitlist.length} | 
              Availability: {availabilityBookings.filter(b => b.bookingStatus === 'CONFIRMED').length}
            </p>
          </div>

          {loading ? (
            <div className="text-center py-8 text-gray-400">
              Loading...
            </div>
          ) : allSessions.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              <p>No course schedule</p>
              <p className="text-sm mt-2">Go book some courses!</p>
            </div>
          ) : (
            <div className="space-y-4">
              {allSessions.map((session) => (
                <Card 
                  key={`${session.type}-${session.sessionEventId}`}
                  className={`border-l-4 ${
                    session.type === 'booking' 
                      ? 'border-l-green-500' 
                      : session.type === 'waitlist'
                      ? 'border-l-blue-500'
                      : 'border-l-purple-500' // availability
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-medium text-lg mb-2 ${
                          session.type === 'waitlist' ? 'text-blue-700' : 
                          session.type === 'availability' ? 'text-purple-700' : ''
                        }`}>
                          {session.title}
                          {session.type === 'booking' && (
                            <Badge variant="secondary" className="ml-2 bg-green-200 text-green-700">
                              Booked
                            </Badge>
                          )}
                          {session.type === 'waitlist' && (
                            <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-700">
                              Waitlist
                            </Badge>
                          )}
                          {session.type === 'availability' && (
                            <Badge variant="secondary" className="ml-2 bg-purple-200 text-purple-700">
                              Availability
                            </Badge>
                          )}
                        </h4>
                        
                        <div className={`space-y-2 text-sm ${
                          session.type === 'waitlist' ? 'text-blue-600' : 
                          session.type === 'availability' ? 'text-purple-600' : 
                          'text-gray-600'
                        }`}>
                          <div className="flex items-center">
                            <Clock className="h-4 w-4 mr-2" />
                            <span>{formatDateTime(session.startTs)} - {formatTime(session.endTs)}</span>
                            <Badge variant="outline" className="ml-2">
                              {calculateDuration(session.startTs, session.endTs)}
                            </Badge>
                          </div>
                          
                          {session.type !== 'availability' && (
                            <div className="flex items-center">
                              <Users className="h-4 w-4 mr-2" />
                              <span>
                                Booked: {session.bookedCount || 0} / {session.capacity}
                              </span>
                            </div>
                          )}

                          {session.type === 'waitlist' && (
                            <div className="flex items-center">
                              <Clock3 className="h-4 w-4 mr-2" />
                              <span className="text-blue-600 font-medium">
                                Waitlist Position: #{(session as WaitlistRecord).waitlistPosition}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={
                          session.type === 'booking' 
                            ? 'bg-green-100 text-green-800' 
                            : session.type === 'waitlist'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-purple-100 text-purple-800'
                        }>
                          {session.type === 'booking' ? 'Booked' : 
                           session.type === 'waitlist' ? 'Waitlist' : 'Availability'}
                        </Badge>
                        
                        <Button 
                          size="sm"
                          onClick={() => 
                            session.type === 'booking' 
                              ? handleCancelBooking(session.sessionEventId)
                              : session.type === 'waitlist'
                              ? handleExitWaitlist(session.sessionEventId)
                              : handleCancelAvailabilityBooking(session.sessionEventId)
                          }
                          className={
                            session.type === 'booking' 
                              ? 'bg-red-600 hover:bg-red-700'
                              : session.type === 'waitlist'
                              ? 'bg-orange-600 hover:bg-orange-700'
                              : 'bg-red-600 hover:bg-red-700'
                          }
                        >
                          <X className="h-4 w-4 mr-1" />
                          {session.type === 'booking' ? 'Cancel Booking' : 
                           session.type === 'waitlist' ? 'Exit Waitlist' : 'Cancel Booking'}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
