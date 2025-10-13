export interface CourseSearchItem {
  course_id: string;
  course_title?: string;
  course_desc?: string;
  sport_name: string;
  coach_name: string;
  coach_nickname?: string;
  city: string;
  certificates: string[];
  price_per_lesson?: number;
  styles?: string[];
  comm_styles?: string[];
  pace_intensities?: string[];
  prefer_students?: string[];
  match_score: number;
  // 详情所需的额外字段
  training_modes?: string[];
  available_time_slots?: string[];
  preferred_frequency?: string;
  training_goals?: string[];
  skill_levels?: string[];
  age_groups?: string[];
  gender?: string;
  experience_years_int?: number;
  certificate_type?: string;
  coach_sport_id?: string;
  lesson_options?: number[];
  duration_options?: number[];
}

export interface SearchFilters {
  sport?: string;
  city?: string;
  coachGender: 'any' | 'male' | 'female';
  maxPrice: number;
  sort?: 'match_desc' | 'price_asc' | 'price_desc' | 'updated_desc';
  
  // Advanced filters
  has_certificate?: boolean;
  cert_type?: string[];
  lessons?: string[];
  duration?: string[];
  styles?: string[];
  comm_styles?: string[];
  pace_intensities?: string[];
  prefer_students?: string[];
  training_modes?: string[];
  available_time_slots?: string[];
  goals?: string[];
  skill_levels?: string[];
  age_groups?: string[];
  preferred_frequency?: 'daily' | 'weekly' | 'monthly';
  skill_level?: 'beginner' | 'intermediate' | 'advanced';
  min_exp?: number;
}

export interface Sport {
  id: string;
  name: string;
}

export interface City {
  id: string;
  name: string;
}

// Mock data for advanced filters
export const MOCK_OPTIONS = {
  cert_type: ['RYT-200', 'RYT-500', 'ACE', 'NASM-CPT', 'NSCA-CSCS'],
  lessons: ['1-on-1', 'Small Group', 'Workshop', 'Online'],
  duration: ['30min', '45min', '60min', '90min', '120min'],
  styles: ['Traditional', 'Modern', 'Fusion', 'Power', 'Gentle'],
  comm_styles: ['Encouraging', 'Direct', 'Motivational', 'Technical', 'Friendly'],
  pace_intensities: ['Low', 'Moderate', 'High', 'Variable'],
  prefer_students: ['Beginners', 'Intermediate', 'Advanced', 'All Levels'],
  training_modes: ['In Person', 'Online', 'Hybrid'],
  available_time_slots: ['Morning', 'Afternoon', 'Evening', 'Weekend'],
  goals: ['Weight Loss', 'Muscle Gain', 'Flexibility', 'Endurance', 'Technique'],
  skill_levels: ['Beginner', 'Intermediate', 'Advanced'],
  age_groups: ['Kids', 'Teens', 'Adults', 'Seniors'],
} as const;