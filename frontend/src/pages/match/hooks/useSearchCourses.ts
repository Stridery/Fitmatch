import { useCallback, useRef } from 'react';
import type { CourseSearchItem, SearchFilters } from '../types';

// Mock data generator
function generateMockCourses(count: number, offset: number): CourseSearchItem[] {
  return Array.from({ length: count }, (_, i) => ({
    course_id: `course-${offset + i}`,
    course_title: `Course ${offset + i + 1}`,
    sport_name: ['Yoga', 'Boxing', 'HIIT', 'Swimming'][Math.floor(Math.random() * 4)],
    coach_name: `Coach ${offset + i + 1}`,
    coach_nickname: `Coach ${String.fromCharCode(65 + (offset + i) % 26)}`,
    city: ['Atlanta', 'Buckhead', 'Midtown', 'Decatur'][Math.floor(Math.random() * 4)],
    certificates: ['RYT-200', 'ACE', 'NASM-CPT'].slice(0, Math.floor(Math.random() * 3) + 1),
    price_per_session: Math.floor(Math.random() * 50) + 30,
    price_per_hour: Math.floor(Math.random() * 70) + 50,
    styles: ['Vinyasa', 'Hatha', 'Power', 'Gentle'].slice(0, Math.floor(Math.random() * 3) + 1),
    comm_styles: ['Encouraging', 'Direct', 'Motivational'].slice(0, Math.floor(Math.random() * 2) + 1),
    pace_intensities: ['Low', 'Moderate', 'High'][Math.floor(Math.random() * 3)],
    prefer_students: ['Beginners', 'Intermediate', 'Advanced'].slice(0, Math.floor(Math.random() * 2) + 1),
    match_score: Math.floor(Math.random() * 30) + 70, // 70-100
  }));
}

interface SearchParams {
  filters: Partial<SearchFilters>;
  limit: number;
  offset: number;
}

interface SearchResult {
  items: CourseSearchItem[];
  total: number;
}

const TOTAL_MOCK_ITEMS = 50; // Total available mock items

export function useSearchCourses() {
  const abortControllerRef = useRef<AbortController | null>(null);

  const cancelSearch = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
  }, []);

  const searchCourses = useCallback(async (params: SearchParams): Promise<SearchResult> => {
    // Cancel any ongoing request
    cancelSearch();

    // Create new abort controller
    const abortController = new AbortController();
    abortControllerRef.current = abortController;

    try {
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        throw new Error('CanceledError');
      }

      // Generate mock results based on filters
      const { limit, offset } = params;
      const remainingItems = Math.max(0, TOTAL_MOCK_ITEMS - offset);
      const itemsToReturn = Math.min(limit, remainingItems);

      return {
        items: generateMockCourses(itemsToReturn, offset),
        total: TOTAL_MOCK_ITEMS,
      };
    } catch (error) {
      if (abortController.signal.aborted) {
        const cancelError = new Error('Request cancelled');
        cancelError.name = 'CanceledError';
        throw cancelError;
      }
      throw error;
    } finally {
      if (abortControllerRef.current === abortController) {
        abortControllerRef.current = null;
      }
    }
  }, [cancelSearch]);

  return {
    searchCourses,
    cancelSearch,
  };
}