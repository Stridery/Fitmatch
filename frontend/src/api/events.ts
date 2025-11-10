import { supabase } from '@/lib/supabase';
import type { EventDTO, RegistrationDTO } from '@/types/events';

export interface Sport {
  id: string;
  name: string;
}

/**
 * Get sports list with optional fuzzy search
 */
export async function getSports(searchQuery?: string): Promise<Sport[]> {
  let query = supabase
    .from('sports')
    .select('id, name')
    .order('name', { ascending: true });

  // If search query provided, use trigram similarity search
  if (searchQuery && searchQuery.trim()) {
    // Use ilike for fuzzy search (works with gin_trgm index)
    query = query.ilike('name', `%${searchQuery.trim()}%`);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  return (data || []) as Sport[];
}

/**
 * Get event groups created by the current user
 */
export async function getUserEventGroups(): Promise<EventGroupDTO[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('event_groups')
    .select('*')
    .eq('created_by', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  let groups = (data || []) as EventGroupDTO[];

  // Manually join sports data
  if (groups.length > 0) {
    const sportIds = [...new Set(groups.map(g => g.sport_id))];
    const { data: sportsData } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);

    const sportsMap = new Map(
      (sportsData || []).map(s => [s.id, { id: s.id, name: s.name }])
    );

    groups = groups.map(group => ({
      ...group,
      sport: sportsMap.get(group.sport_id) || null,
    }));
  }

  return groups;
}

/**
 * Get events that the current user has registered for (ENROLLED status)
 */
export async function getUserRegisteredEvents(): Promise<EventDTO[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Get user's registrations with ENROLLED status
  const { data: registrations, error: regError } = await supabase
    .from('event_registrations')
    .select('event_id, status, waitlist_pos')
    .eq('user_id', user.id)
    .eq('status', 'ENROLLED');

  if (regError) {
    throw regError;
  }

  if (!registrations || registrations.length === 0) {
    return [];
  }

  const eventIds = registrations.map(r => r.event_id);
  
  if (eventIds.length === 0) {
    return [];
  }
  
  const { data: eventsData, error: eventsError } = await supabase
    .from('events')
    .select('*')
    .in('id', eventIds)
    .order('start_at', { ascending: true });

  if (eventsError) {
    throw eventsError;
  }

  if (!eventsData || eventsData.length === 0) {
    return [];
  }

  let events = (eventsData || []) as EventDTO[];

  if (events.length > 0) {
    const sportIds = [...new Set(events.map(e => e.sport_id))];
    
    const { data: sportsData, error: sportsError } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);

    if (sportsError) {
      // Silently fail - sports data is optional
    }

    const sportsMap = new Map(
      (sportsData || []).map(s => [s.id, { id: s.id, name: s.name }])
    );

    events = events.map(event => ({
      ...event,
      sport: sportsMap.get(event.sport_id) || null,
    }));
  }

  return events;
}

/**
 * Get events created by the current user
 */
export async function getUserEvents(): Promise<EventDTO[]> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('host_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  let events = (data || []) as EventDTO[];

  // Manually join sports data
  if (events.length > 0) {
    const sportIds = [...new Set(events.map(e => e.sport_id))];
    const { data: sportsData } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);

    const sportsMap = new Map(
      (sportsData || []).map(s => [s.id, { id: s.id, name: s.name }])
    );

    events = events.map(event => ({
      ...event,
      sport: sportsMap.get(event.sport_id) || null,
    }));
  }

  return events;
}

/**
 * Create a new event
 */
export async function createEvent(data: {
  title: string;
  sport_id: string;
  start_at: string;
  end_at: string;
  city_text?: string | null;
  location_text: string;
  capacity_unit: number;
  is_listed: boolean;
  rsvp_deadline?: string | null;
  group_id?: string | null;
  skill_level?: string | null;
  age_bracket?: string | null;
  gender_policy?: string | null;
}): Promise<{ id: string }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Determine group_type based on group_id
  let group_type: 'SINGLE' | 'SERIES' | 'COMPETITION' = 'SINGLE';
  if (data.group_id) {
    const { data: groupData } = await supabase
      .from('event_groups')
      .select('group_type')
      .eq('id', data.group_id)
      .single();
    
    if (groupData) {
      group_type = groupData.group_type as 'SERIES' | 'COMPETITION';
    }
  }

  const { data: result, error } = await supabase
    .from('events')
    .insert({
      title: data.title,
      sport_id: data.sport_id,
      start_at: data.start_at,
      end_at: data.end_at,
      city_text: data.city_text || null,
      location_text: data.location_text,
      capacity_unit: data.capacity_unit,
      is_listed: data.is_listed,
      rsvp_deadline: data.rsvp_deadline || null,
      host_id: user.id,
      group_id: data.group_id || null,
      group_type: group_type,
      skill_level: data.skill_level || null,
      age_bracket: data.age_bracket || null,
      gender_policy: data.gender_policy || null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('Failed to create event');
  }

  return { id: result.id };
}

/**
 * Update an existing event
 */
export async function updateEvent(
  eventId: string,
  data: {
    title: string;
    sport_id: string;
    start_at: string;
    end_at: string;
    city_text?: string | null;
    location_text: string;
    capacity_unit: number;
    is_listed: boolean;
    rsvp_deadline?: string | null;
    group_id?: string | null;
    skill_level?: string | null;
    age_bracket?: string | null;
    gender_policy?: string | null;
  }
): Promise<{ id: string }> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  // Determine group_type based on group_id
  let group_type: 'SINGLE' | 'SERIES' | 'COMPETITION' = 'SINGLE';
  if (data.group_id) {
    const { data: groupData } = await supabase
      .from('event_groups')
      .select('group_type')
      .eq('id', data.group_id)
      .single();
    
    if (groupData) {
      group_type = groupData.group_type as 'SERIES' | 'COMPETITION';
    }
  }

  const { data: result, error } = await supabase
    .from('events')
    .update({
      title: data.title,
      sport_id: data.sport_id,
      start_at: data.start_at,
      end_at: data.end_at,
      city_text: data.city_text || null,
      location_text: data.location_text,
      capacity_unit: data.capacity_unit,
      is_listed: data.is_listed,
      rsvp_deadline: data.rsvp_deadline || null,
      group_id: data.group_id || null,
      group_type: group_type,
      skill_level: data.skill_level || null,
      age_bracket: data.age_bracket || null,
      gender_policy: data.gender_policy || null,
    })
    .eq('id', eventId)
    .eq('host_id', user.id) // Ensure user can only update their own events
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('Failed to update event or event not found');
  }

  return { id: result.id };
}

/**
 * Delete an event
 */
export async function deleteEvent(eventId: string): Promise<void> {
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('events')
    .delete()
    .eq('id', eventId)
    .eq('host_id', user.id); // Ensure user can only delete their own events

  if (error) {
    throw error;
  }
}

/**
 * Create a new event group (series or competition)
 */
export async function createEventGroup(data: {
  title: string;
  sport_id: string;
  group_type: 'SERIES' | 'COMPETITION';
  description?: string | null;
  city?: string | null;
  location?: string | null;
  skill_level?: string | null;
  age_bracket?: string | null;
  gender_policy?: string | null;
}): Promise<{ id: string }> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: result, error } = await supabase
    .from('event_groups')
    .insert({
      title: data.title,
      sport_id: data.sport_id,
      group_type: data.group_type,
      created_by: user.id,
      description: data.description || null,
      city: data.city || null,
      location: data.location || null,
      skill_level: data.skill_level || null,
      age_bracket: data.age_bracket || null,
      gender_policy: data.gender_policy || null,
    })
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('Failed to create event group');
  }

  return { id: result.id };
}

/**
 * Update an existing event group (series or competition)
 */
export async function updateEventGroup(
  groupId: string,
  data: {
    title: string;
    sport_id: string;
    group_type: 'SERIES' | 'COMPETITION';
    description?: string | null;
    city?: string | null;
    location?: string | null;
    skill_level?: string | null;
    age_bracket?: string | null;
    gender_policy?: string | null;
  }
): Promise<{ id: string }> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { data: result, error } = await supabase
    .from('event_groups')
    .update({
      title: data.title,
      sport_id: data.sport_id,
      group_type: data.group_type,
      description: data.description || null,
      city: data.city || null,
      location: data.location || null,
      skill_level: data.skill_level || null,
      age_bracket: data.age_bracket || null,
      gender_policy: data.gender_policy || null,
    })
    .eq('id', groupId)
    .eq('created_by', user.id) // Ensure user can only update their own groups
    .select('id')
    .single();

  if (error) {
    throw error;
  }

  if (!result) {
    throw new Error('Failed to update event group or group not found');
  }

  return { id: result.id };
}

/**
 * Delete an event group (series or competition)
 */
export async function deleteEventGroup(groupId: string): Promise<void> {
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  
  if (userError) {
    throw new Error('Failed to get current user');
  }

  if (!user) {
    throw new Error('User not authenticated');
  }

  const { error } = await supabase
    .from('event_groups')
    .delete()
    .eq('id', groupId)
    .eq('created_by', user.id); // Ensure user can only delete their own groups

  if (error) {
    throw error;
  }
}

/**
 * Join an event (enroll or waitlist)
 */
export async function rpcJoinEvent(eventId: string): Promise<{
  status: 'ENROLLED' | 'WAITLIST';
  enrolled_count: number;
  waitlist_count: number;
}> {
  const { data, error } = await supabase.rpc('join_event', {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  // data is an array with one row
  const result = data?.[0];
  if (!result) {
    throw new Error('No data returned from join_event');
  }

  return {
    status: result.status as 'ENROLLED' | 'WAITLIST',
    enrolled_count: result.enrolled_count,
    waitlist_count: result.waitlist_count,
  };
}

/**
 * Cancel event registration
 */
export async function rpcCancelEvent(eventId: string): Promise<{
  status: 'CANCELLED' | 'NONE';
  promoted_user: string | null;
  enrolled_count: number;
  waitlist_count: number;
}> {
  const { data, error } = await supabase.rpc('cancel_event', {
    p_event_id: eventId,
  });

  if (error) {
    throw error;
  }

  // data is an array with one row
  const result = data?.[0];
  if (!result) {
    throw new Error('No data returned from cancel_event');
  }

  return {
    status: result.status as 'CANCELLED' | 'NONE',
    promoted_user: result.promoted_user || null,
    enrolled_count: result.enrolled_count,
    waitlist_count: result.waitlist_count,
  };
}

/**
 * Map RPC error to user-friendly message
 */
export function mapRpcErrorToMessage(e: any): string {
  const msg = String(e?.message || e || '');
  
  if (msg.includes('EVENT_NOT_FOUND')) {
    return '活动不存在';
  }
  if (msg.includes('EVENT_NOT_OPEN')) {
    return '本活动当前不可报名';
  }
  if (msg.includes('new row violates') || msg.includes('duplicate key')) {
    return '你已报名该活动';
  }
  if (msg.includes('permission denied') || msg.includes('row-level security')) {
    return '权限不足，请先登录';
  }
  
  return '操作失败，请稍后再试';
}

/**
 * Get user's registration status for an event
 */
export async function getUserRegistration(
  eventId: string
): Promise<RegistrationDTO | null> {
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  // Query event_registrations with proper filters
  const { data, error } = await supabase
    .from('event_registrations')
    .select('id, event_id, user_id, status, waitlist_pos, created_at')
    .eq('event_id', eventId)
    .eq('user_id', user.id)
    .maybeSingle();

  if (error) {
    // PGRST116 means no rows found, which is fine
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  return data as RegistrationDTO;
}

/**
 * Get event counters (enrolled, waitlist counts)
 * Calculate directly from event_registrations table
 */
export async function getEventCounters(eventId: string): Promise<{
  enrolled_count: number;
  waitlist_count: number;
}> {
  // Query enrolled count
  const { count: enrolledCount, error: enrolledError } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'ENROLLED');

  if (enrolledError) {
    throw enrolledError;
  }

  // Query waitlist count
  const { count: waitlistCount, error: waitlistError } = await supabase
    .from('event_registrations')
    .select('*', { count: 'exact', head: true })
    .eq('event_id', eventId)
    .eq('status', 'WAITLIST');

  if (waitlistError) {
    throw waitlistError;
  }

  return {
    enrolled_count: enrolledCount || 0,
    waitlist_count: waitlistCount || 0,
  };
}

/**
 * Get enrolled users for an event with their profile information
 */
export interface EnrolledUser {
  user_id: string;
  nickname: string | null;
  avatarUrl: string | null;
  created_at: string;
}

export async function getEnrolledUsers(eventId: string): Promise<EnrolledUser[]> {
  // Get enrolled registrations
  const { data: registrations, error: regError } = await supabase
    .from('event_registrations')
    .select('user_id, created_at')
    .eq('event_id', eventId)
    .eq('status', 'ENROLLED')
    .order('created_at', { ascending: true });

  if (regError) {
    throw regError;
  }

  if (!registrations || registrations.length === 0) {
    return [];
  }

  const userIds = registrations.map(r => r.user_id);
  
  const { data: profiles, error: profileError } = await supabase
    .from('user_profile')
    .select('user_id, nickname, avatar_url')
    .in('user_id', userIds);

  if (profileError) {
    throw profileError;
  }

  const profileMap = new Map(
    (profiles || []).map(p => [p.user_id, { nickname: p.nickname, avatarUrl: p.avatar_url }])
  );

  const result = registrations.map(reg => {
    const profile = profileMap.get(reg.user_id);
    return {
      user_id: reg.user_id,
      nickname: profile?.nickname || null,
      avatarUrl: profile?.avatarUrl || null,
      created_at: reg.created_at,
    };
  });

  return result;
}

/**
 * Get all events (with optional filters)
 * Automatically filters out events that have already started (start_at < now)
 */
export async function getEvents(filters?: {
  sport_id?: string;
  from?: string;
  city?: string;
  location?: string;
  onlyOpen?: boolean;
  skill_level?: string | null;
  age_bracket?: string | null;
  gender_policy?: string | null;
}): Promise<EventDTO[]> {
  const nowUTC = new Date().toISOString();
  
  let query = supabase
    .from('events')
    .select('*')
    .eq('is_listed', true)
    .order('start_at', { ascending: true });

  // Filter out past events: use the later of (nowUTC, filters.from)
  if (filters?.from) {
    const fromTime = filters.from > nowUTC ? filters.from : nowUTC;
    query = query.gte('start_at', fromTime);
  } else {
    // If no from filter, only show future events
    query = query.gte('start_at', nowUTC);
  }

  if (filters?.sport_id) {
    query = query.eq('sport_id', filters.sport_id);
  }

  if (filters?.city) {
    query = query.ilike('city_text', `%${filters.city}%`);
  }

  if (filters?.location) {
    query = query.ilike('location_text', `%${filters.location}%`);
  }

  // Advanced filters - enum fields
  // If value is null or undefined, don't filter (search all)
  if (filters?.skill_level !== undefined && filters?.skill_level !== null) {
    query = query.eq('skill_level', filters.skill_level);
  }
  if (filters?.age_bracket !== undefined && filters?.age_bracket !== null) {
    query = query.eq('age_bracket', filters.age_bracket);
  }
  if (filters?.gender_policy !== undefined && filters?.gender_policy !== null) {
    query = query.eq('gender_policy', filters.gender_policy);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  let events = (data || []) as EventDTO[];

  // Manually join sports data
  if (events.length > 0) {
    const sportIds = [...new Set(events.map(e => e.sport_id))];
    const { data: sportsData } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);

    const sportsMap = new Map(
      (sportsData || []).map(s => [s.id, { id: s.id, name: s.name }])
    );

    events = events.map(event => ({
      ...event,
      sport: sportsMap.get(event.sport_id) || null,
    }));
  }

  // Filter by onlyOpen (client-side, as it requires counters)
  if (filters?.onlyOpen) {
    const nowUTC = new Date().toISOString();
    const eventsWithCounters = await Promise.all(
      events.map(async (event) => {
        const counters = await getEventCounters(event.id);
        return { event, counters };
      })
    );

    events = eventsWithCounters
      .filter(({ event, counters }) => {
        if (event.rsvp_deadline && event.rsvp_deadline <= nowUTC) return false;
        if (counters.enrolled_count >= event.capacity_unit) return false;
        return true;
      })
      .map(({ event }) => event);
  }

  return events;
}

/**
 * Get a single event by ID
 */
export async function getEvent(eventId: string): Promise<EventDTO | null> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('id', eventId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  // Manually join sport data
  const { data: sportData } = await supabase
    .from('sports')
    .select('id, name')
    .eq('id', data.sport_id)
    .single();

  return {
    ...data,
    sport: sportData ? { id: sportData.id, name: sportData.name } : null,
  } as EventDTO;
}

/**
 * Event Group (Series/Competition) interface
 */
export interface EventGroupDTO {
  id: string;
  title: string;
  group_type: 'SERIES' | 'COMPETITION';
  created_by: string | null;
  created_at: string;
  sport_id: string;
  sport?: { id: string; name: string } | null;
  skill_level?: string | null;
  age_bracket?: string | null;
  gender_policy?: string | null;
  description?: string | null;
  city?: string | null;
  location?: string | null;
}

/**
 * Get a single event group by ID
 */
export async function getEventGroup(groupId: string): Promise<EventGroupDTO | null> {
  const { data, error } = await supabase
    .from('event_groups')
    .select('*')
    .eq('id', groupId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null;
    }
    throw error;
  }

  if (!data) {
    return null;
  }

  // Manually join sport data
  const { data: sportData } = await supabase
    .from('sports')
    .select('id, name')
    .eq('id', data.sport_id)
    .single();

  return {
    ...data,
    sport: sportData ? { id: sportData.id, name: sportData.name } : null,
  } as EventGroupDTO;
}

/**
 * Get all events for a specific event group (by group_id)
 */
export async function getEventsByGroupId(groupId: string): Promise<EventDTO[]> {
  const { data, error } = await supabase
    .from('events')
    .select('*')
    .eq('group_id', groupId)
    .order('start_at', { ascending: true });

  if (error) {
    throw error;
  }

  let events = (data || []) as EventDTO[];

  // Manually join sports data
  if (events.length > 0) {
    const sportIds = [...new Set(events.map(e => e.sport_id))];
    const { data: sportsData } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);

    const sportsMap = new Map(
      (sportsData || []).map(s => [s.id, { id: s.id, name: s.name }])
    );

    events = events.map(event => ({
      ...event,
      sport: sportsMap.get(event.sport_id) || null,
    }));
  }

  return events;
}

/**
 * Get all event groups (series/competitions) with optional filters
 */
export async function getEventGroups(filters?: {
  sport_id?: string;
  city?: string;
  location?: string;
  skill_level?: string | null;
  age_bracket?: string | null;
  gender_policy?: string | null;
  onlyOpen?: boolean;
}): Promise<EventGroupDTO[]> {
  let query = supabase
    .from('event_groups')
    .select('*')
    .order('created_at', { ascending: false });

  // Basic filters
  if (filters?.sport_id) {
    query = query.eq('sport_id', filters.sport_id);
  }

  // Advanced filters - enum fields
  if (filters?.skill_level !== undefined && filters?.skill_level !== null) {
    query = query.eq('skill_level', filters.skill_level);
  }
  if (filters?.age_bracket !== undefined && filters?.age_bracket !== null) {
    query = query.eq('age_bracket', filters.age_bracket);
  }
  if (filters?.gender_policy !== undefined && filters?.gender_policy !== null) {
    query = query.eq('gender_policy', filters.gender_policy);
  }

  const { data, error } = await query;

  if (error) {
    throw error;
  }

  let groups = (data || []) as EventGroupDTO[];

  // Manually join sports data
  if (groups.length > 0) {
    const sportIds = [...new Set(groups.map(g => g.sport_id))];
    const { data: sportsData } = await supabase
      .from('sports')
      .select('id, name')
      .in('id', sportIds);

    const sportsMap = new Map(
      (sportsData || []).map(s => [s.id, { id: s.id, name: s.name }])
    );

    groups = groups.map(group => ({
      ...group,
      sport: sportsMap.get(group.sport_id) || null,
    }));
  }

  // Filter by city/location - these fields are in events, not event_groups
  // So we need to check if any event in the group matches
  if (filters?.city || filters?.location) {
    const filteredGroups: EventGroupDTO[] = [];
    
    for (const group of groups) {
      // Get events for this group
      const events = await getEventsByGroupId(group.id).catch(() => []);
      
      let matches = true;
      
      if (filters?.city) {
        const hasMatchingCity = events.some(e => 
          e.city_text?.toLowerCase().includes(filters.city!.toLowerCase())
        );
        if (!hasMatchingCity) {
          matches = false;
        }
      }
      
      if (filters?.location && matches) {
        const hasMatchingLocation = events.some(e => 
          e.location_text?.toLowerCase().includes(filters.location!.toLowerCase())
        );
        if (!hasMatchingLocation) {
          matches = false;
        }
      }
      
      if (matches) {
        filteredGroups.push(group);
      }
    }
    
    groups = filteredGroups;
  }

  // Filter by onlyOpen - check if any event in the group is open
  if (filters?.onlyOpen) {
    const nowUTC = new Date().toISOString();
    const filteredGroups: EventGroupDTO[] = [];
    
    for (const group of groups) {
      const events = await getEventsByGroupId(group.id).catch(() => []);
      
      // Check if any event is open
      const hasOpenEvent = await Promise.all(
        events.map(async (event) => {
          if (event.rsvp_deadline && event.rsvp_deadline <= nowUTC) return false;
          if (event.start_at <= nowUTC) return false; // Past events are not open
          
          const counters = await getEventCounters(event.id).catch(() => ({ enrolled_count: 0, waitlist_count: 0 }));
          if (counters.enrolled_count >= event.capacity_unit) return false;
          
          return true;
        })
      ).then(results => results.some(r => r));
      
      if (hasOpenEvent) {
        filteredGroups.push(group);
      }
    }
    
    groups = filteredGroups;
  }

  return groups;
}

