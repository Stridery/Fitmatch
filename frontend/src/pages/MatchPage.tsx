import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import type { CourseSearchItem, SearchFilters, Sport, City } from "./match/types";
import { Filters } from "./match/components/Filters";
import { FilterChips } from "./match/components/FilterChips";
import { ResultList } from "./match/components/ResultList";
import { decodeSearchParams, encodeSearchParams } from "@/lib/url";
import { useSearchCourses } from "./match/hooks/useSearchCourses";

// Mock data for sports and cities
const mockSports: Sport[] = [
  { id: "yoga", name: "Yoga" },
  { id: "boxing", name: "Boxing" },
  { id: "hiit", name: "HIIT" },
  { id: "swimming", name: "Swimming" },
  { id: "tennis", name: "Tennis" },
];

const mockCities: City[] = [
  { id: "atlanta", name: "Atlanta" },
  { id: "buckhead", name: "Buckhead" },
  { id: "midtown", name: "Midtown" },
  { id: "decatur", name: "Decatur" },
];

// Create sport names mapping
const sportNames = mockSports.reduce((acc, sport) => {
  acc[sport.id] = sport.name;
  return acc;
}, {} as Record<string, string>);

const LIMIT = 20;

export default function MatchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchCourses, cancelSearch } = useSearchCourses();

  // States
  const [appliedFilters, setAppliedFilters] = useState<Partial<SearchFilters>>(() => {
    // Initialize from URL
    const params = decodeSearchParams(searchParams);
    return params;
  });
  const [results, setResults] = useState<CourseSearchItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchItem | null>(null);

  // Fetch courses with pagination
  async function fetchCourses(offset = 0) {
    try {
      setError(null);
      setIsLoading(true);
      cancelSearch();
      
      const res = await searchCourses({ 
        filters: appliedFilters, 
        limit: LIMIT, 
        offset 
      });

      setResults(offset === 0 ? res.items : prev => [...prev, ...res.items]);
      setTotal(res.total);
    } catch (e) {
      if ((e as any).name !== 'CanceledError') {
        setError('Failed to load courses');
      }
    } finally {
      setIsLoading(false);
    }
  }

  // Apply new filters and search
  function applySearch(next: Partial<SearchFilters>) {
    // Update URL (only on submit)
    const sp = encodeSearchParams({ 
      ...next, 
      limit: undefined, 
      offset: undefined 
    });
    setSearchParams(sp);
    setAppliedFilters(next);
    fetchCourses(0);
  }

  // Reset all filters and results
  function resetAll() {
    setSearchParams(new URLSearchParams());
    setAppliedFilters({});
    fetchCourses(0);
  }

  // Handle removing a single filter or filter value
  const handleRemoveFilter = (key: keyof SearchFilters, value?: string) => {
    const newFilters = { ...appliedFilters };
    
    if (value && Array.isArray(newFilters[key])) {
      // Remove single value from array
      newFilters[key] = (newFilters[key] as string[]).filter(v => v !== value);
      // Remove key if array is empty
      if ((newFilters[key] as string[]).length === 0) {
        delete newFilters[key];
      }
    } else {
      // Remove entire key
      delete newFilters[key];
    }

    applySearch(newFilters);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      <main className="px-6 pt-10">
        {/* Filters */}
        <div className="mb-8">
          <Filters
            initial={decodeSearchParams(searchParams) as Partial<SearchFilters>}
            sports={mockSports}
            cities={mockCities}
            onSubmit={applySearch}
            onReset={resetAll}
          />
        </div>

        {/* Applied Filters */}
        <div className="mb-6">
          <FilterChips
            filters={appliedFilters}
            onRemove={handleRemoveFilter}
            onReset={resetAll}
            sportNames={sportNames}
          />
        </div>

        {/* Error Message */}
        {error && (
          <div className="text-red-500 mb-4 text-center">{error}</div>
        )}

        {/* Results */}
        <div className="max-w-3xl mx-auto">
          <ResultList
            items={results}
            loading={isLoading}
            hasMore={total ? results.length < total : false}
            onLoadMore={() => fetchCourses(results.length)}
            onSelectCourse={setSelectedCourse}
          />
        </div>
      </main>
    </div>
  );
}