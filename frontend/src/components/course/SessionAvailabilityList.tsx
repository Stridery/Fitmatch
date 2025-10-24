import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Calendar, Clock, MapPin, Users, X, Clock3 } from 'lucide-react';
import type { CoachCalendarEvent } from '@/api/coachCalendar';
import { getUserSchedule, cancelBooking, getUserWaitlist, exitWaitlist, type BookingRecord, type WaitlistRecord } from '@/api/booking';
import { getAvailableSlots, type AvailableSlot } from '@/api/availability';
import { getPackagesByCourseId } from '@/api/courses';
import type { CoursePackagePrice } from '@/api/courses';

interface SessionAvailabilityListProps {
  events: CoachCalendarEvent[];
  onSelectAvailability: (event: CoachCalendarEvent) => void;
  onBookSession?: (event: CoachCalendarEvent) => void;
  onCancelBooking?: (eventId: string) => void;
  onBookingSuccess?: () => void;
  courseId?: string; // 添加courseId用于获取套餐信息
}

function formatDateTime(dateStr: string): string {
  // 确保时间字符串格式正确，处理不同的时间格式
  let timeStr = dateStr;
  
  // 如果时间字符串没有Z后缀，添加Z表示UTC时间
  if (timeStr && !timeStr.endsWith('Z') && !timeStr.includes('+')) {
    timeStr = timeStr + 'Z';
  }
  
  const date = new Date(timeStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    weekday: 'short',
    hour: '2-digit',
    minute: '2-digit'
  });
}

function formatTime(dateStr: string): string {
  // 确保时间字符串格式正确，处理不同的时间格式
  let timeStr = dateStr;
  
  // 如果时间字符串没有Z后缀，添加Z表示UTC时间
  if (timeStr && !timeStr.endsWith('Z') && !timeStr.includes('+')) {
    timeStr = timeStr + 'Z';
  }
  
  const date = new Date(timeStr);
  return date.toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit'
  });
}

function calculateDuration(startTs: string, endTs: string): string {
  // 确保时间字符串格式正确，处理不同的时间格式
  let startTimeStr = startTs;
  let endTimeStr = endTs;
  
  // 如果时间字符串没有Z后缀，添加Z表示UTC时间
  if (startTimeStr && !startTimeStr.endsWith('Z') && !startTimeStr.includes('+')) {
    startTimeStr = startTimeStr + 'Z';
  }
  if (endTimeStr && !endTimeStr.endsWith('Z') && !endTimeStr.includes('+')) {
    endTimeStr = endTimeStr + 'Z';
  }
  
  const start = new Date(startTimeStr);
  const end = new Date(endTimeStr);
  const durationMinutes = Math.round((end.getTime() - start.getTime()) / 60000);
  
  if (durationMinutes < 60) {
    return `${durationMinutes} minutes`;
  }
  
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  return minutes > 0 ? `${hours}h ${minutes}m` : `${hours}h`;
}

export default function SessionAvailabilityList({ events, onSelectAvailability, onBookSession, onCancelBooking, onBookingSuccess, courseId }: SessionAvailabilityListProps) {
  const [userBookings, setUserBookings] = useState<BookingRecord[]>([]);
  const [userWaitlist, setUserWaitlist] = useState<WaitlistRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [availabilitySlots, setAvailabilitySlots] = useState<Map<string, AvailableSlot[]>>(new Map());
  const [loadingSlots, setLoadingSlots] = useState<Set<string>>(new Set());
  const [packages, setPackages] = useState<CoursePackagePrice[]>([]);
  const onBookingSuccessRef = useRef(onBookingSuccess);

  const sessions = events.filter(e => e.kind === 'session');
  const availabilities = useMemo(() => events.filter(e => e.kind === 'availability'), [events]);

  // 更新ref
  onBookingSuccessRef.current = onBookingSuccess;

  // 获取套餐信息
  useEffect(() => {
    if (courseId) {
      const loadPackages = async () => {
        try {
          const coursePackages = await getPackagesByCourseId(courseId);
          setPackages(coursePackages);
        } catch (error) {
          console.error('Failed to load packages:', error);
        }
      };
      loadPackages();
    }
  }, [courseId]);

  // 过滤可用时段，移除时长不足的时段
  const filterSlotsByMinDuration = (slots: AvailableSlot[], minDurationMinutes: number = 30): AvailableSlot[] => {
    return slots.filter(slot => slot.durationMinutes >= minDurationMinutes);
  };

  // 获取套餐的最小时长
  const getMinPackageDuration = (): number => {
    if (packages.length === 0) return 30; // 默认30分钟
    return Math.min(...packages.map(pkg => pkg.lessonDurationMinutes));
  };

  // 获取availability的可用时段
  const loadAvailabilitySlots = async (availabilityId: string) => {
    // 如果已经在加载中或已经加载过，跳过
    if (loadingSlots.has(availabilityId) || availabilitySlots.has(availabilityId)) {
      return;
    }
    
    setLoadingSlots(prev => new Set(prev).add(availabilityId));
    try {
      const slots = await getAvailableSlots(availabilityId);
      // 根据套餐的最小时长过滤时段
      const minDuration = getMinPackageDuration();
      const filteredSlots = slots.filter(slot => slot.durationMinutes >= minDuration);
      setAvailabilitySlots(prev => new Map(prev).set(availabilityId, filteredSlots));
    } catch (error) {
      console.error(`Failed to load slots for availability ${availabilityId}:`, error);
      setAvailabilitySlots(prev => new Map(prev).set(availabilityId, []));
    } finally {
      setLoadingSlots(prev => {
        const newSet = new Set(prev);
        newSet.delete(availabilityId);
        return newSet;
      });
    }
  };

  // 获取用户已预订的Session和waitlist记录
  useEffect(() => {
    const loadUserData = async () => {
      try {
        setLoading(true);
        console.log('Loading user bookings and waitlist...');
        
        const [bookings, waitlist] = await Promise.all([
          getUserSchedule(),
          getUserWaitlist()
        ]);
        
        console.log('User bookings loaded:', bookings);
        console.log('User waitlist loaded:', waitlist);
        
        setUserBookings(bookings);
        setUserWaitlist(waitlist);
      } catch (error) {
        console.error('Failed to load user data:', error);
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, []);

  // 加载所有availability的可用时段
  useEffect(() => {
    const availabilityIds = availabilities.map(a => a.id);
    availabilityIds.forEach(availabilityId => {
      loadAvailabilitySlots(availabilityId);
    });
  }, [availabilities.map(a => a.id).join(',')]); // 使用ID字符串作为依赖

  // 检查Session是否已被用户预订
  const isUserBooked = (sessionId: string): boolean => {
    const isBooked = userBookings.some(booking => 
      booking.sessionEventId === sessionId && 
      booking.bookingStatus === 'CONFIRMED'
    );
    console.log(`Session ${sessionId} is booked: ${isBooked}`);
    return isBooked;
  };

  // 检查Session是否在waitlist中
  const getUserWaitlistPosition = (sessionId: string): number | null => {
    const waitlistItem = userWaitlist.find(item => item.sessionEventId === sessionId);
    return waitlistItem ? waitlistItem.waitlistPosition : null;
  };

  // 刷新所有availability的可用时段
  const refreshAvailabilitySlots = useCallback(() => {
    availabilities.forEach(availability => {
      // 清除缓存，强制重新加载
      setAvailabilitySlots(prev => {
        const newMap = new Map(prev);
        newMap.delete(availability.id);
        return newMap;
      });
      loadAvailabilitySlots(availability.id);
    });
  }, [availabilities]);

  // 监听预约成功事件，刷新可用时段
  useEffect(() => {
    if (onBookingSuccessRef.current) {
      refreshAvailabilitySlots();
    }
  }, [refreshAvailabilitySlots]);

  // 处理取消预订
  const handleCancelBooking = async (sessionId: string) => {
    try {
      await cancelBooking(sessionId);
      // 从用户预订列表中移除
      setUserBookings(prev => prev.filter(booking => booking.sessionEventId !== sessionId));
      // 通知父组件刷新
      onCancelBooking?.(sessionId);
      alert('Booking cancelled successfully!');
    } catch (error) {
      console.error('Cancel booking error:', error);
      alert(`Cancel booking failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  // 处理退出waitlist
  const handleExitWaitlist = async (sessionId: string) => {
    try {
      await exitWaitlist(sessionId);
      // 从用户waitlist列表中移除
      setUserWaitlist(prev => prev.filter(item => item.sessionEventId !== sessionId));
      // 通知父组件刷新
      onCancelBooking?.(sessionId);
      alert('Successfully exited waitlist!');
    } catch (error) {
      console.error('Exit waitlist error:', error);
      alert(`Exit waitlist failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  };

  if (events.length === 0) {
    return (
      <div className="text-center py-12 text-gray-500">
        <Calendar className="mx-auto h-12 w-12 mb-4 text-gray-400" />
        <p>No bookable course sessions available</p>
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
            Fixed Sessions
          </h3>
          <div className="space-y-3">
            {sessions.map((session) => {
              const isBooked = isUserBooked(session.id);
              const waitlistPosition = getUserWaitlistPosition(session.id);
              const isInWaitlist = waitlistPosition !== null;
              const isFull = session.capacity && (session.capacity - (session.booked_count || 0) === 0);
              
              return (
                <Card 
                  key={session.id} 
                  className={`border-l-4 ${
                    isBooked 
                      ? 'border-l-gray-400 bg-gray-50' 
                      : isInWaitlist
                      ? 'border-l-blue-500 bg-blue-50'
                      : 'border-l-green-500'
                  }`}
                >
                  <CardContent className="pt-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h4 className={`font-medium text-lg mb-2 ${
                          isBooked ? 'text-gray-600' : isInWaitlist ? 'text-blue-700' : ''
                        }`}>
                          {session.title}
                          {isBooked && (
                            <Badge variant="secondary" className="ml-2 bg-gray-200 text-gray-700">
                              Booked
                            </Badge>
                          )}
                          {isInWaitlist && (
                            <Badge variant="secondary" className="ml-2 bg-blue-200 text-blue-700">
                              Waiting
                            </Badge>
                          )}
                        </h4>
                        
                        <div className={`space-y-2 text-sm ${
                          isBooked ? 'text-gray-500' : isInWaitlist ? 'text-blue-600' : 'text-gray-600'
                        }`}>
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
                                Booked: {session.booked_count || 0} / {session.capacity}
                                {isFull && !isBooked && !isInWaitlist && (
                                  <Badge variant="destructive" className="ml-2">Full</Badge>
                                )}
                              </span>
                            </div>
                          )}

                          {isInWaitlist && (
                            <div className="flex items-center">
                              <Clock3 className="h-4 w-4 mr-2" />
                              <span className="text-blue-600 font-medium">
                                Waitlist position: #{waitlistPosition}
                              </span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex flex-col items-end space-y-2">
                        <Badge className={
                          isBooked 
                            ? 'bg-gray-200 text-gray-700 hover:bg-gray-200' 
                            : isInWaitlist
                            ? 'bg-blue-100 text-blue-800 hover:bg-blue-100'
                            : 'bg-green-100 text-green-800 hover:bg-green-100'
                        }>
                          {isBooked ? 'Booked' : isInWaitlist ? 'Waiting' : 'Fixed Session'}
                        </Badge>
                        
                        {isBooked ? (
                          <Button 
                            size="sm"
                            onClick={() => handleCancelBooking(session.id)}
                            className="bg-red-600 hover:bg-red-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel Booking
                          </Button>
                        ) : isInWaitlist ? (
                          <Button 
                            size="sm"
                            onClick={() => handleExitWaitlist(session.id)}
                            className="bg-orange-600 hover:bg-orange-700"
                          >
                            <X className="h-4 w-4 mr-1" />
                            Cancel Waitlist
                          </Button>
                        ) : (
                          <Button 
                            size="sm"
                            onClick={() => onBookSession?.(session)}
                            className="bg-green-600 hover:bg-green-700"
                          >
                            {isFull ? 'Join Waitlist' : 'Book Now'}
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      )}

      {/* Availabilities Section */}
      {availabilities.length > 0 && (
        <div>
          <h3 className="text-lg font-semibold mb-4 flex items-center">
            <Clock className="h-5 w-5 mr-2" />
            Available Time Slots
          </h3>
          <p className="text-sm text-gray-600 mb-4">
            The coach is available during the following time slots, you can choose a suitable time to book a course
          </p>
          <div className="space-y-4">
            {availabilities.map((availability) => {
              const slots = availabilitySlots.get(availability.id) || [];
              const isLoading = loadingSlots.has(availability.id);
              
              return (
                <div key={availability.id} className="space-y-3">
                  {/* Availability标题 */}
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-lg">{availability.title || 'Available Time Slots'}</h4>
                    {availability.location && (
                      <div className="flex items-center text-sm text-gray-600">
                        <MapPin className="h-4 w-4 mr-1" />
                        <span>{availability.location}</span>
                      </div>
                    )}
                  </div>
                  
                  {/* 可用时段列表 */}
                  {isLoading ? (
                    <div className="text-center py-4 text-gray-500">
                      Loading available slots...
                    </div>
                  ) : slots.length === 0 ? (
                    <div className="text-center py-4 text-gray-500 bg-gray-50 border border-gray-200 rounded-lg">
                      No available time slots
                    </div>
                  ) : (
                    <div className="grid gap-3">
                      {slots.map((slot, index) => (
                        <Card key={`${availability.id}-${index}`} className="border-l-4 border-l-blue-500 hover:shadow-md transition-shadow">
                          <CardContent className="pt-4">
                            <div className="flex justify-between items-start">
                              <div className="flex-1">
                                <div className="space-y-2 text-sm text-gray-600">
                                  <div className="flex items-center">
                                    <Clock className="h-4 w-4 mr-2" />
                                    <span>{formatDateTime(slot.slotStart)} - {formatTime(slot.slotEnd)}</span>
                                    <Badge variant="outline" className="ml-2">
                                      {Math.round(slot.durationMinutes / 60)}h {slot.durationMinutes % 60}m
                                    </Badge>
                                  </div>
                                </div>
                              </div>
                              
                              <div className="flex flex-col items-end space-y-2">
                                <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">
                                  Available
                                </Badge>
                                <Button 
                                  size="sm"
                                  onClick={() => onSelectAvailability({
                                    ...availability,
                                    start_ts: slot.slotStart,
                                    end_ts: slot.slotEnd
                                  })}
                                >
                                  Select Time
                                </Button>
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

