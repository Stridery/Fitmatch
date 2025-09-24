import { z } from "zod";

export const MULTI_KEYS = [
  'styles',
  'comm',
  'pace',
  'prefer',
  'lessons',
  'duration',
  'training_modes',
  'time_slots',
  'goals',
  'skill_levels',
  'age_groups',
] as const;

type MultiKey = typeof MULTI_KEYS[number];

/**
 * Encode search params object to URLSearchParams
 * Handles multi-value keys by creating multiple entries
 */
export function encodeSearchParams(params: Record<string, any>): URLSearchParams {
  const searchParams = new URLSearchParams();

  Object.entries(params).forEach(([key, value]) => {
    if (value == null || value === '') return;
    if (Array.isArray(value) && value.length === 0) return;

    if (MULTI_KEYS.includes(key as MultiKey) && Array.isArray(value)) {
      // Handle multi-value keys
      value.forEach((v) => {
        if (v != null && v !== '') {
          searchParams.append(key, v.toString());
        }
      });
    } else {
      // Handle single value
      searchParams.set(key, value.toString());
    }
  });

  return searchParams;
}

/**
 * Decode URLSearchParams to object
 * Handles multi-value keys by creating arrays
 */
export function decodeSearchParams(searchParams: URLSearchParams): Record<string, any> {
  const params: Record<string, any> = {};

  // First collect all keys
  const keys = new Set(Array.from(searchParams.keys()));

  keys.forEach((key) => {
    if (MULTI_KEYS.includes(key as MultiKey)) {
      // Handle multi-value keys
      const values = searchParams.getAll(key);
      if (values.length > 0) {
        params[key] = values;
      }
    } else {
      // Handle single value
      const value = searchParams.get(key);
      if (value != null && value !== '') {
        // Try to parse numbers
        const num = Number(value);
        params[key] = Number.isNaN(num) ? value : num;
      }
    }
  });

  // Add default limit if not present
  if (!params.limit) {
    params.limit = 20;
  } else {
    // Ensure limit doesn't exceed max
    params.limit = Math.min(Number(params.limit), 50);
  }

  return params;
}

// Zod schema for search filters
export const searchFiltersSchema = z.object({
  sport: z.string().optional(),
  city: z.string().optional(),
  coachGender: z.enum(['any', 'male', 'female']).default('any'),
  maxPrice: z.number().min(0).max(500).default(200),
  limit: z.number().min(1).max(50).default(20),
});