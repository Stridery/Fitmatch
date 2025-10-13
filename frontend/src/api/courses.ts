import api from './client';
import { supabase } from '@/lib/supabase';
import type { CourseSearchItem, SearchFilters, Sport } from '@/pages/match/types';

export interface CourseSearchResponse {
  items: CourseSearchItem[];
  page: number;
  size: number;
  total: number;
}

export interface CourseSearchParams extends Partial<SearchFilters> {
  page?: number;
  size?: number;
  sort?: 'match_desc' | 'price_asc' | 'price_desc' | 'updated_desc';
}

// 将驼峰命名转换为下划线命名的辅助函数
function mapResponseItem(item: any): CourseSearchItem {
  return {
    course_id: item.courseId?.toString(),
    course_title: item.courseTitle,
    course_desc: item.courseDesc,
    sport_name: item.sportName,
    coach_name: item.coachName,
    coach_nickname: item.coachNickname,
    city: item.city,
    certificates: item.certificates || [],
    price_per_lesson: item.pricePerLessonMin ? Number(item.pricePerLessonMin) : undefined,
    styles: item.styles || [],
    comm_styles: item.commStyles || [],
    pace_intensities: item.paceIntensities || [],
    prefer_students: item.preferStudents || [],
    match_score: item.matchScore ? Number(item.matchScore) : 0,
    // 详情所需的额外字段
    training_modes: item.trainingModes || [],
    available_time_slots: item.availableTimeSlots || [],
    preferred_frequency: item.preferredFrequency,
    training_goals: item.trainingGoals || [],
    skill_levels: item.skillLevels || [],
    age_groups: item.ageGroups || [],
    gender: item.coachGender,
    experience_years_int: item.experienceYearsInt,
    certificate_type: item.certificateType,
    coach_sport_id: item.coachSportId?.toString(),
    lesson_options: item.lessonOptions,
    duration_options: item.durationOptions
  };
}

export async function searchCourses(params: CourseSearchParams): Promise<CourseSearchResponse> {
  const { data } = await api.get<any>('/courses/search', {
    params: {
      ...params,
      // 转换一些特殊的参数名称以匹配后端
      hasCertificate: params.has_certificate,
      certType: params.cert_type,
      trainingModes: params.training_modes,
      availableTimeSlots: params.available_time_slots,
      skillLevels: params.skill_levels,
      ageGroups: params.age_groups,
      preferredFrequency: params.preferred_frequency,
      skillLevel: params.skill_level,
      minExp: params.min_exp,
      sort: params.sort || 'match_desc',  // 确保 sort 参数传递到后端
      // 移除前端特有的参数
      has_certificate: undefined,
      cert_type: undefined,
      training_modes: undefined,
      available_time_slots: undefined,
      skill_levels: undefined,
      age_groups: undefined,
      preferred_frequency: undefined,
      skill_level: undefined,
      min_exp: undefined,
    }
  });

  return {
    items: (data.items || []).map(mapResponseItem),
    page: data.page || 0,
    size: data.size || 0,
    total: data.total || 0
  };
}

// 从 Supabase 获取运动项目列表
export async function getSports(): Promise<Sport[]> {
  const { data, error } = await supabase
    .from('sports')
    .select('id, name')
    .order('name');

  if (error) {
    console.error('Error fetching sports:', error);
    return [];
  }

  return data.map(sport => ({
    id: sport.id.toString(),
    name: sport.name
  }));
}

// 包价格相关类型定义
export interface CoursePackagePrice {
  id: string;
  courseId: string;  // 后端返回的是 courseId
  lessonsCount: number;  // 后端返回的是 lessonsCount
  lessonDurationMinutes: number;  // 后端返回的是 lessonDurationMinutes
  price: number;
  trainingMode?: string;  // 后端返回的是 trainingMode，可能为空（旧数据）
  createdAt: string;  // 后端返回的是 createdAt
  updatedAt: string;  // 后端返回的是 updatedAt
}

export interface PackageItem {
  lessons_count: number;
  lesson_duration_minutes: number;
  price: number;
  training_mode?: string;
}

// 根据课程ID获取包价格列表
export async function getPackagesByCourseId(courseId: string): Promise<CoursePackagePrice[]> {
  const { data } = await api.get<CoursePackagePrice[]>(`/courses/packages/course/${courseId}`);
  return data;
}

// 批量获取多个课程的包价格
export async function getPackagesByCourseIds(courseIds: string[]): Promise<CoursePackagePrice[]> {
  const { data } = await api.post<CoursePackagePrice[]>('/courses/packages/batch', courseIds);
  return data;
}

// 保存课程的包价格（替换策略）
export async function saveCoursePackages(courseId: string, packages: PackageItem[]): Promise<string> {
  const { data } = await api.post<string>('/courses/packages/save', {
    courseId,
    packages
  });
  return data;
}

// 删除课程的所有包价格
export async function deleteCoursePackages(courseId: string): Promise<string> {
  const { data } = await api.delete<string>(`/courses/packages/course/${courseId}`);
  return data;
}