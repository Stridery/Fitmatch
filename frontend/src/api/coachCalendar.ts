import { supabase } from '@/lib/supabase';

export interface CoachCourse {
  id: string;
  title: string;
  description?: string;
  sport_name?: string;
}

export interface CoachCalendarEvent {
  id: string;
  coach_id: string;
  kind: 'session' | 'availability';
  course_id?: string;
  title?: string;
  location?: string;
  start_ts: string;
  end_ts: string;
  capacity?: number;
  booked_count: number;
  created_at: string;
  updated_at: string;
}

export interface CreateEventData {
  kind: 'session' | 'availability';
  course_id?: string;
  title?: string;
  location?: string;
  start_ts: string;
  end_ts: string;
  capacity?: number | null;
}

export interface UpdateEventData {
  course_id?: string;
  title?: string;
  location?: string;
  start_ts: string;
  end_ts: string;
  capacity?: number | null;
}

// Get current user's coach calendar events
export async function getCoachCalendarEvents(coachId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('coach_calendar_event')
    .select('*')
    .eq('coach_id', coachId)
    .order('start_ts', { ascending: true });

  if (startDate && endDate) {
    query = query
      .gte('start_ts', startDate)
      .lte('end_ts', endDate);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching coach calendar events:', error);
    throw error;
  }

  return data as CoachCalendarEvent[];
}

// Create a new calendar event
export async function createCoachCalendarEvent(eventData: CreateEventData) {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('coach_calendar_event')
    .insert({
      coach_id: user.id,
      ...eventData
    })
    .select()
    .single();

  if (error) {
    console.error('Error creating coach calendar event:', error);
    throw error;
  }

  return data as CoachCalendarEvent;
}

// Update a calendar event
export async function updateCoachCalendarEvent(eventId: string, eventData: UpdateEventData) {
  const { data, error } = await supabase
    .from('coach_calendar_event')
    .update({
      ...eventData,
      updated_at: new Date().toISOString()
    })
    .eq('id', eventId)
    .select()
    .single();

  if (error) {
    console.error('Error updating coach calendar event:', error);
    throw error;
  }

  return data as CoachCalendarEvent;
}

// Delete a calendar event
export async function deleteCoachCalendarEvent(eventId: string) {
  const { error } = await supabase
    .from('coach_calendar_event')
    .delete()
    .eq('id', eventId);

  if (error) {
    console.error('Error deleting coach calendar event:', error);
    throw error;
  }

  return true;
}

// Get events for a specific week
export async function getCoachCalendarEventsForWeek(coachId: string, weekStart: Date) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  return getCoachCalendarEvents(
    coachId,
    weekStart.toISOString(),
    weekEnd.toISOString()
  );
}

// Get coach's courses
export async function getCoachCourses(coachId: string): Promise<CoachCourse[]> {
  const { data, error } = await supabase
    .from('course_detail')
    .select(`
      id,
      summary,
      about,
      coach_sports!inner(
        coach_id,
        sports(name)
      )
    `)
    .eq('coach_sports.coach_id', coachId)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching coach courses:', error);
    throw error;
  }

  return data.map(course => ({
    id: course.id,
    title: course.summary || 'Untitled Course',
    description: course.about || '',
    sport_name: course.coach_sports?.[0]?.sports?.[0]?.name || ''
  }));
}
