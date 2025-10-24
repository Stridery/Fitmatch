import { supabase } from '@/lib/supabase';

export interface CoachCourse {
  id: string;
  title: string;
  description?: string;
  sport_name?: string;
  training_modes?: string[];
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

// Get current user's coach calendar events (only sessions)
export async function getCoachCalendarEvents(coachId: string, startDate?: string, endDate?: string) {
  let query = supabase
    .from('coach_calendar_event')
    .select('*')
    .eq('coach_id', coachId)
    .eq('kind', 'session') // 只加载session，不加载availability
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
  console.log('getCoachCourses: fetching courses for coachId', coachId);
  
  const { data, error } = await supabase
    .from('course_detail')
    .select(`
      id,
      summary,
      about,
      training_modes,
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

  console.log('getCoachCourses: raw data from supabase', data);
  
  const result = data.map(course => ({
    id: course.id,
    title: course.summary || 'Untitled Course',
    description: course.about || '',
    sport_name: course.coach_sports?.[0]?.sports?.[0]?.name || '',
    training_modes: course.training_modes || []
  }));
  
  console.log('getCoachCourses: processed result', result);
  return result;
}

// Get user's calendar events for a specific week (both as coach and as participant)
export async function getUserCalendarEventsForWeek(userId: string, weekStart: Date, isCoach: boolean) {
  const weekEnd = new Date(weekStart);
  weekEnd.setDate(weekStart.getDate() + 6);
  weekEnd.setHours(23, 59, 59, 999);

  const startISO = weekStart.toISOString();
  const endISO = weekEnd.toISOString();

  // If user is a coach, get their coach calendar events
  if (isCoach) {
    return getCoachCalendarEvents(userId, startISO, endISO);
  }

  // If user is not a coach, return empty array (no events to show)
  // TODO: In the future, add logic to fetch booked sessions for regular users
  return [];
}

// Get coach's sessions and availabilities for a specific course
export async function getCoachSessionsByCourse(courseId: string, startDate?: Date) {
  const now = startDate || new Date();
  
  console.log('[getCoachSessionsByCourse] Fetching events for course:', courseId);
  
  // 1. 获取该课程的sessions（course_id = courseId）
  const { data: sessions, error: sessionsError } = await supabase
    .from('coach_calendar_event')
    .select(`
      id,
      coach_id,
      kind,
      course_id,
      title,
      location,
      start_ts,
      end_ts,
      capacity,
      booked_count,
      created_at
    `)
    .eq('course_id', courseId)
    .eq('kind', 'session')
    .gte('start_ts', now.toISOString())
    .order('start_ts', { ascending: true });

  if (sessionsError) {
    console.error('Error fetching coach sessions:', sessionsError);
    throw sessionsError;
  }

  // 2. 获取包含该课程的availability（通过availability_courses关联表）
  const { data: availabilities, error: availabilitiesError } = await supabase
    .from('coach_calendar_event')
    .select(`
      id,
      coach_id,
      kind,
      course_id,
      title,
      location,
      start_ts,
      end_ts,
      capacity,
      booked_count,
      created_at,
      availability_courses!inner(course_id)
    `)
    .eq('kind', 'availability')
    .eq('availability_courses.course_id', courseId)
    .gte('start_ts', now.toISOString())
    .order('start_ts', { ascending: true });

  if (availabilitiesError) {
    console.error('Error fetching coach availabilities:', availabilitiesError);
    throw availabilitiesError;
  }

  // 3. 合并结果
  const allEvents = [
    ...(sessions || []),
    ...(availabilities || [])
  ].sort((a, b) => new Date(a.start_ts).getTime() - new Date(b.start_ts).getTime());

  console.log('[getCoachSessionsByCourse] Found events:', allEvents.length);
  return allEvents as CoachCalendarEvent[];
}

// Get all upcoming sessions and availabilities for a coach (for students to view)
export async function getCoachUpcomingEvents(coachId: string, courseId?: string) {
  const now = new Date();
  
  let query = supabase
    .from('coach_calendar_event')
    .select(`
      id,
      coach_id,
      kind,
      course_id,
      title,
      location,
      start_ts,
      end_ts,
      capacity,
      booked_count,
      created_at
    `)
    .eq('coach_id', coachId)
    .gte('start_ts', now.toISOString())
    .order('start_ts', { ascending: true });

  // If courseId is provided, filter by course
  if (courseId) {
    query = query.eq('course_id', courseId);
  }

  const { data, error } = await query;

  if (error) {
    console.error('Error fetching coach upcoming events:', error);
    throw error;
  }

  return data as CoachCalendarEvent[];
}
