import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
//import { logEvent } from "./match/utils/analytics";
import type { CourseSearchItem, SearchFilters, Sport, City } from "./match/types";
import { getSports } from "@/api/courses";
import { Filters } from "./match/components/Filters";
import { FilterChips } from "./match/components/FilterChips";
import { ResultList } from "./match/components/ResultList";
import { CourseDetailSheet } from "./match/components/CourseDetailSheet";
import { ResultSkeleton, LoadMoreSkeleton, ResultError, ResultEmpty } from "./match/components/ResultStates";
import { decodeSearchParams, encodeSearchParams } from "@/lib/url";
import { useSearchCourses } from "./match/hooks/useSearchCourses";

const mockCities: City[] = [
  { id: "atlanta", name: "Atlanta" },
  { id: "buckhead", name: "Buckhead" },
  { id: "midtown", name: "Midtown" },
  { id: "decatur", name: "Decatur" },
];

const LIMIT = 20;

export default function MatchPage() {
  const [sports, setSports] = useState<Sport[]>([]);
  const [searchParams, setSearchParams] = useSearchParams();
  const { searchCourses, cancelSearch } = useSearchCourses();

  // States
  const [appliedFilters, setAppliedFilters] = useState<Partial<SearchFilters>>(() => {
    // Initialize from URL
    const params = decodeSearchParams(searchParams) as Partial<SearchFilters>;
    return params;
  });
  const [results, setResults] = useState<CourseSearchItem[]>([]);
  const [total, setTotal] = useState<number>(0);
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<CourseSearchItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  // 加载运动项目列表
  useEffect(() => {
    getSports().then(setSports).catch(console.error);
  }, []);

  // 加载初始课程数据
  useEffect(() => {
    fetchCourses(0);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch courses with pagination
  const fetchCourses = useCallback(async (offset = 0) => {
    const isLoadMore = offset > 0;
    try {
      setError(null);
      if (isLoadMore) {
        setIsLoadingMore(true);
      } else {
        setIsLoading(true);
      }
      cancelSearch();

      // 记录搜索或加载更多埋点
      /*
      if (isLoadMore) {
        logEvent("load_more", {
          offset,
          limit: LIMIT,
          total_known: total
        });
      } else {
        logEvent("search_submit", {
          filters: appliedFilters,
          timestamp: Date.now()
        });
      }
      */

      const res = await searchCourses({
        filters: appliedFilters,
        limit: LIMIT,
        offset,
      });

      // 使用统一的函数式更新，避免三元表达式导致的类型问题
      setResults((prev) => {
        const newResults = offset === 0 ? res.items : [...prev, ...res.items];
        // 记录结果卡片曝光埋点
        /*
        newResults.forEach((item, idx) => {
          logEvent("view_result_card", {
            course_id: item.course_id,
            position: offset + idx
          });
        });
        */
        return newResults;
      });
      setTotal(res.total);
    } catch (e) {
      if ((e as any).name !== "CanceledError") {
        const errorMessage = "Failed to load courses";
        setError(errorMessage);
        // 记录错误埋点
        /*
        logEvent("search_error", {
          filters: appliedFilters,
          error_message: errorMessage,
          isLoadMore
        });
        */
      }
    } finally {
      if (isLoadMore) {
        setIsLoadingMore(false);
      } else {
        setIsLoading(false);
      }
    }
  }, [appliedFilters, cancelSearch, searchCourses, total]);

  // Apply new filters and search
  function applySearch(next: Partial<SearchFilters>) {
    // Update URL (only on submit)
    // Remove pagination params and any undefined/null values before encoding
    const cleanFilters = Object.entries(next).reduce((acc, [key, value]) => {
      if (value != null && key !== 'limit' && key !== 'offset') {
        acc[key] = value;
      }
      return acc;
    }, {} as Record<string, any>);
    
    const sp = encodeSearchParams(cleanFilters);
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
  // 修复点：避免 "Type 'string[]' is not assignable to type 'undefined'" 的联合类型写入问题
  const handleRemoveFilter = <K extends keyof SearchFilters>(key: K, value?: string) => {
    const next: Partial<SearchFilters> = { ...appliedFilters };

    if (value && Array.isArray(next[key])) {
      // 明确地以 string[] 处理，再决定是写回还是删除
      const filtered = (next[key] as unknown as string[]).filter((v) => v !== value);
      if (filtered.length > 0) {
        (next as any)[key] = filtered; // 在写回时进行宽松写入
      } else {
        delete (next as any)[key];
      }
    } else {
      delete (next as any)[key];
    }

    applySearch(next);
  };

  return (
    <div className="min-h-screen flex flex-col bg-white text-gray-900 w-full">
      <main className="px-6 pt-10">
        {/* Filters */}
        <div className="mb-8">
          <Filters
            initial={decodeSearchParams(searchParams) as Partial<SearchFilters>}
            sports={sports}
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
            sportNames={sports.reduce((acc, sport) => {
              acc[sport.name.toLowerCase()] = sport.name;
              return acc;
            }, {} as Record<string, string>)}
          />
        </div>

        {/* Error Message */}
        {error && <div className="text-red-500 mb-4 text-center">{error}</div>}

        {/* Results */}
        <div className="max-w-3xl mx-auto">
          {isLoading ? (
            <ResultSkeleton />
          ) : error ? (
            <ResultError onRetry={() => fetchCourses(results.length)} />
          ) : results.length === 0 ? (
            <ResultEmpty />
          ) : (
            <>
              <ResultList
                items={results}
                loading={isLoadingMore}
                hasMore={total ? results.length < total : false}
                onLoadMore={() => fetchCourses(results.length)}
                onSelectCourse={(course) => {
                  setSelectedCourse(course);
                  setDetailOpen(true);
                  // 记录打开详情埋点
                  /*
                  logEvent("open_course_detail", {
                    course_id: course.course_id,
                    coach_name: course.coach_name
                  });
                  */
                }}
              />
              {isLoadingMore && <LoadMoreSkeleton />}
            </>
          )}
        </div>

        {/* Course Detail Sheet */}
        <CourseDetailSheet
          open={detailOpen}
          onOpenChange={setDetailOpen}
          course={selectedCourse}
        />
      </main>
    </div>
  );
}