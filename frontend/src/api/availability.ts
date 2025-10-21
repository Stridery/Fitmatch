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

// Get coach's availabilities using backend API
export async function getCoachAvailabilities(coachId: string): Promise<CoachCalendarEvent[]> {
  try {
    const response = await api.get(`/courses/coach/calendar/availability/coach/${coachId}`);
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
