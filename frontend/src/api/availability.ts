import api from './client';

export interface CreateAvailabilityRequest {
  coachId: string;
  title: string;
  location?: string;
  startTs: string;
  endTs: string;
  courseIds?: string[];
}

export interface UpdateAvailabilityRequest {
  availabilityId: string;
  coachId: string;
  title: string;
  location?: string;
  startTs: string;
  endTs: string;
  courseIds?: string[];
}

export interface CoachCalendarEvent {
  id: string;
  coachId: string;
  kind: 'session' | 'availability';
  courseId?: string;
  title: string;
  location?: string;
  startTs: string;
  endTs: string;
  capacity?: number;
  bookedCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AvailabilityCourse {
  id: string;
  availabilityId: string;
  courseId: string;
  createdAt: string;
}

export interface AvailabilityBookingRequest {
  availabilityId: string;
  studentId: string;
  userCoursePackageId: string;
  startTime: string;
  endTime: string;
}

export interface AvailabilityBookingResponse {
  bookingId?: string;
  availabilityId: string;
  studentId: string;
  userCoursePackageId?: string;
  status: string;
  startTime?: string;
  endTime?: string;
  bookedAt?: string;
  message: string;
}

export interface AvailableSlot {
  slotStart: string;
  slotEnd: string;
  durationMinutes: number;
}

// Create availability event using backend API
export async function createAvailability(request: CreateAvailabilityRequest): Promise<CoachCalendarEvent> {
  try {
    const response = await api.post('/courses/coach/calendar/availability', request);
    return response.data;
  } catch (error) {
    console.error('Error creating availability:', error);
    throw error;
  }
}

// Update availability event using backend API
export async function updateAvailability(request: UpdateAvailabilityRequest): Promise<CoachCalendarEvent> {
  try {
    const response = await api.put('/courses/coach/calendar/availability', request);
    return response.data;
  } catch (error) {
    console.error('Error updating availability:', error);
    throw error;
  }
}

// Delete availability event using backend API
export async function deleteAvailability(availabilityId: string, coachId: string): Promise<void> {
  try {
    await api.delete(`/courses/coach/calendar/availability/${availabilityId}?coachId=${coachId}`);
  } catch (error) {
    console.error('Error deleting availability:', error);
    throw error;
  }
}

// Get coach's availabilities using backend API with optional date range filtering
export async function getCoachAvailabilities(coachId: string, startDate?: string, endDate?: string): Promise<CoachCalendarEvent[]> {
  try {
    let url = `/courses/coach/calendar/availability/coach/${coachId}`;
    
    // Add date range parameters if provided
    if (startDate && endDate) {
      url += `?startDate=${encodeURIComponent(startDate)}&endDate=${encodeURIComponent(endDate)}`;
    }
    
    const response = await api.get(url);
    return response.data;
  } catch (error) {
    console.error('Error getting coach availabilities:', error);
    throw error;
  }
}

// Get availability's associated courses using backend API
export async function getAvailabilityCourses(availabilityId: string): Promise<AvailabilityCourse[]> {
  try {
    const response = await api.get(`/courses/coach/calendar/availability/${availabilityId}/courses`);
    return response.data;
  } catch (error) {
    console.error('Error getting availability courses:', error);
    throw error;
  }
}

// ============================================
// Availability Booking API Functions
// ============================================

// Book availability slot using booking service API
export async function bookAvailability(request: AvailabilityBookingRequest): Promise<AvailabilityBookingResponse> {
  try {
    const response = await api.post('/bookings/availability/book', request);
    return response.data;
  } catch (error) {
    console.error('Error booking availability:', error);
    throw error;
  }
}

// Cancel availability booking using booking service API
export async function cancelAvailabilityBooking(availabilityId: string, studentId: string): Promise<AvailabilityBookingResponse> {
  try {
    const response = await api.delete(`/bookings/availability/${availabilityId}/cancel/${studentId}`);
    return response.data;
  } catch (error) {
    console.error('Error cancelling availability booking:', error);
    throw error;
  }
}

// Get available slots for availability using booking service API
export async function getAvailableSlots(availabilityId: string): Promise<AvailableSlot[]> {
  try {
    const response = await api.get(`/bookings/availability/${availabilityId}/available-slots`);
    return response.data;
  } catch (error) {
    console.error('Error getting available slots:', error);
    throw error;
  }
}
