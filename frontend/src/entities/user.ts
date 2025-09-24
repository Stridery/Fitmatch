export interface UserProfile {
  id: string;        // UUID
  userId: string;    // UUID

  avatarUrl: string | null;
  nickname: string | null;
  phone: string | null;
  isFor: string | null;
  gender: string | null;
  birthday: string | null;
  country: string | null;
  city: string | null;
  mbtiType: string | null;
  behavioralAnswers: null;
  heightCm: number | null;
  weightKg: number | null;
  currentTrainingFrequency: string | null;
  updatedAt: string | null;
  isCoach: boolean;
  isVenue: boolean;
}

export interface User {
  id: string;    // Supabase auth id
  email: string;
  profile: UserProfile | null;
}

export interface Injury {
  id?: string
  injuryType: string
  customInjuryType?: string
  injuryTag: string[]
  isVisibleToCoach: boolean
}