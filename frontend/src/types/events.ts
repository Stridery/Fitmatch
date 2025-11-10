export type GroupType = 'SINGLE' | 'SERIES' | 'COMPETITION';
export type JoinPolicy = 'PUBLIC_OPEN' | 'PUBLIC_CLOSED' | 'ROSTER_LOCKED';
export type RegistrationStatus = 'ENROLLED' | 'WAITLIST' | 'CANCELLED';

export interface EventDTO {
  id: string;
  host_id: string;
  title: string;
  sport_id: string;
  sport?: { id: string; name: string } | null; // Joined from sports table
  start_at: string;   // ISO UTC
  end_at: string;     // ISO UTC
  city_text?: string | null; // City name
  location_text: string;
  capacity_unit: number;
  group_id?: string | null;
  group_type: GroupType;
  is_listed: boolean;
  join_policy: JoinPolicy;
  rsvp_deadline?: string | null; // ISO UTC
  skill_level?: string | null; // BEGINNER / INTERMEDIATE / ADVANCED
  age_bracket?: string | null; // ALL_AGES / CHILDREN / FORTY_PLUS
  gender_policy?: string | null; // MALE / FEMALE / COED
  created_at: string;
}

export interface RegistrationDTO {
  id: string;
  event_id: string;
  user_id: string;
  status: RegistrationStatus;
  waitlist_pos?: number | null;
  created_at: string;
}

