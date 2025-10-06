import { useCallback, useRef } from 'react';
import { searchCourses as apiSearchCourses } from '@/api/courses';
import type { CourseSearchParams, CourseSearchResponse } from '@/api/courses';
import type { CourseSearchItem, SearchFilters } from '../types';

interface SearchParams {
  filters: Partial<SearchFilters>;
  limit: number;
  offset: number;
}

interface SearchResult {
  items: CourseSearchItem[];
  total: number;
}

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
      const response = await apiSearchCourses({
        ...params.filters,
        page: Math.floor(params.offset / params.limit),
        size: params.limit,
        sort: 'match_desc'
      });

      // Check if request was cancelled
      if (abortController.signal.aborted) {
        throw new Error('CanceledError');
      }

      return {
        items: response.items,
        total: response.total
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