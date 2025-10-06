export const FILTER_LABELS = {
  has_certificate: "Certified",
  preferred_frequency: {
    daily: "Daily",
    weekly: "Weekly",
    monthly: "Monthly",
  },
  skill_level: {
    beginner: "Beginner",
    intermediate: "Intermediate",
    advanced: "Advanced",
  },
} as const;

// Field labels for aria-label and display
export const FIELD_LABELS = {
  sport: "Sport",
  city: "City",
  coachGender: "Coach Gender",
  maxPrice: "Max Price",
  has_certificate: "Certification",
  cert_type: "Certificate Type",
  lessons: "Lesson Type",
  duration: "Duration",
  styles: "Teaching Style",
  comm_styles: "Communication Style",
  pace_intensities: "Pace & Intensity",
  prefer_students: "Student Level",
  training_modes: "Training Mode",
  available_time_slots: "Available Time",
  goals: "Goals",
  skill_levels: "Skill Level",
  age_groups: "Age Group",
  min_exp: "Min Experience",
} as const;