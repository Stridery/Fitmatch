// 预订相关API
import api from './client';

export interface BookingRecord {
  studentId: string;
  coachId: string;
  courseId: string;
  userCoursePackageId: string;
  sessionEventId: string;
  title: string;
  startTs: string; // ISO 8601格式的时间字符串
  endTs: string;   // ISO 8601格式的时间字符串
  capacity: number;
  bookedCount: number;
  bookingStatus: 'CONFIRMED' | 'CANCELLED' | 'NO_SHOW';
  bookedAt: string; // ISO 8601格式的时间字符串
  cancelledAt?: string; // ISO 8601格式的时间字符串
}

export interface WaitlistRecord {
  studentId: string;
  coachId: string;
  courseId: string;
  userCoursePackageId: string;
  sessionEventId: string;
  title: string;
  startTs: string; // ISO 8601格式的时间字符串
  endTs: string;   // ISO 8601格式的时间字符串
  capacity: number;
  bookedCount: number;
  waitlistPosition: number;
  waitlistCreatedAt: string; // ISO 8601格式的时间字符串
}

// 获取用户个人日程（已预订的Session）
export async function getUserSchedule(): Promise<BookingRecord[]> {
  try {
    const { data } = await api.get<BookingRecord[]>('/bookings/schedule');
    return data;
  } catch (error) {
    console.error('Get user schedule error:', error);
    throw error;
  }
}

// 取消预订
export async function cancelBooking(eventId: string): Promise<{ status: string; message?: string }> {
  try {
    const { data } = await api.post<{ status: string; message?: string }>('/bookings/cancel', {
      eventId: eventId
    });
    return data;
  } catch (error) {
    console.error('Cancel booking error:', error);
    throw error;
  }
}

// 获取用户waitlist记录
export async function getUserWaitlist(): Promise<WaitlistRecord[]> {
  try {
    const { data } = await api.get<WaitlistRecord[]>('/bookings/waitlist');
    return data;
  } catch (error) {
    console.error('Get user waitlist error:', error);
    throw error;
  }
}

// 退出waitlist
export async function exitWaitlist(eventId: string): Promise<void> {
  try {
    await api.post('/bookings/waitlist/exit', { eventId });
    console.log('Exited waitlist successfully');
  } catch (error) {
    console.error('Exit waitlist error:', error);
    throw error;
  }
}
