import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type TrainingMode = '1v1' | '1v2' | 'Group' | 'Online'

export type CourseVM = {
  modes: TrainingMode[]
  goals: string[]
  prefer: string[]
  style: string[]
  communicationStyle?: string[]
  paceIntensity?: string[]

  timeSlots?: string[]
  frequency?: string | null
  skillLevel?: string | null
  experienceYears?: string | null
  ageGroups?: string[]

  packages: { id: string; lessons_count: number; lesson_duration_minutes: number; price: number }[]
  mediaUrl?: string | null // 本迭代固定为 null，占位保留
}

type CoachSport = {
  id: string
  coach_id: string
  sport_id: string
  status: 'pending' | 'approved' | 'rejected'
  self_intro: string | null
  experience_years: string | null
  has_certificate: boolean | null
  certificate_type: string | null
  certificate_url: string | null
}

type CourseDetail = {
  id: string
  coach_sport_id: string
  training_modes: string[]
  training_goals: string[]

  // 这些列在库里可能为可选/为空，类型上都做了可选处理
  available_time_slots?: string[] | null
  preferred_frequency?: string | null
  skill_level?: string | null
  experience_years?: string | null
  age_groups?: string[] | null
}

type CourseAttribute = {
  // 保留 not_prefer_student 以兼容旧数据；本 VM 不再展示
  type:
    | 'style'
    | 'prefer_student'
    | 'not_prefer_student'
    | 'communication_style'
    | 'pace_intensity'
  value: string
}

type Package = {
  id: string
  coach_sport_id: string
  lessons_count: number
  lesson_duration_minutes: number
  price: number
}

export function useSportDetail(id: string | undefined) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [coachSport, setCoachSport] = useState<CoachSport | null>(null)
  const [courses, setCourses] = useState<CourseDetail[]>([])
  const [attributesByCourseId, setAttributesByCourseId] = useState<Record<string, CourseAttribute[]>>({})
  const [packages, setPackages] = useState<Package[]>([])

  useEffect(() => {
    if (!id) {
      setLoading(false)
      return
    }
    let isCancelled = false

    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        // coach_sports：主键查询，用 maybeSingle 防 406
        const { data: coach, error: coachErr } = await supabase
          .from('coach_sports')
          .select('*')
          .eq('id', id)
          .maybeSingle()
        if (coachErr) throw coachErr
        if (isCancelled) return
        setCoachSport((coach ?? null) as CoachSport | null)

        // course_detail：0/1/多条 → 全量列表，按更新时间倒序
        const { data: courseRows, error: courseErr } = await supabase
          .from('course_detail')
          .select('*')
          .eq('coach_sport_id', id)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false, nullsFirst: true })
        if (courseErr) throw courseErr
        const allCourses = (courseRows ?? []) as CourseDetail[]
        setCourses(allCourses)

        // attributes：按所有 course.id 聚合
        let attributesMap: Record<string, CourseAttribute[]> = {}
        if (allCourses.length > 0) {
          type CourseAttributeRow = { course_id: string } & CourseAttribute
          const courseIds = allCourses.map((c) => c.id)
          const { data: attrData, error: attrErr } = await supabase
            .from('course_attributes')
            .select('course_id,type,value')
            .in('course_id', courseIds)
          if (attrErr) throw attrErr
          const rows = (attrData ?? []) as CourseAttributeRow[]
          for (const row of rows) {
            if (!attributesMap[row.course_id]) attributesMap[row.course_id] = []
            attributesMap[row.course_id].push({ type: row.type, value: row.value })
          }
        }
        setAttributesByCourseId(attributesMap)

        // packages：列表
        const { data: pkgData, error: pkgErr } = await supabase
          .from('coach_package_prices')
          .select('id,coach_sport_id,lessons_count,lesson_duration_minutes,price')
          .eq('coach_sport_id', id)
        if (pkgErr) throw pkgErr
        setPackages((pkgData ?? []) as Package[])
      } catch (e: unknown) {
        console.error(e)
        const msg =
          e instanceof Error ? e.message : typeof e === 'string' ? e : 'Failed to load'
        setError(msg)
      } finally {
        if (!isCancelled) setLoading(false)
      }
    }

    fetchAll()
    return () => {
      isCancelled = true
    }
  }, [id])

  const courseVMs: { course: CourseDetail; vm: CourseVM }[] = useMemo(() => {
    return courses.map((course: CourseDetail) => {
      const attrs: CourseAttribute[] = attributesByCourseId[course.id] ?? []

      const modes = (course.training_modes ?? []).filter(Boolean) as TrainingMode[]
      const goals = course.training_goals ?? []
      const prefer = attrs
        .filter((a: CourseAttribute) => a.type === 'prefer_student')
        .map((a: CourseAttribute) => a.value)
      const style = attrs.filter((a: CourseAttribute) => a.type === 'style').map((a: CourseAttribute) => a.value)
      const communicationStyle = attrs
        .filter((a: CourseAttribute) => a.type === 'communication_style')
        .map((a: CourseAttribute) => a.value)
      const paceIntensity = attrs
        .filter((a: CourseAttribute) => a.type === 'pace_intensity')
        .map((a: CourseAttribute) => a.value)

      const timeSlots = course.available_time_slots ?? []
      const frequency = course.preferred_frequency ?? null
      const skillLevel = course.skill_level ?? null
      const experienceYears = course.experience_years ?? null
      const ageGroups = course.age_groups ?? []

      const vm: CourseVM = {
        modes,
        goals,
        prefer,
        style,
        communicationStyle,
        paceIntensity,
        timeSlots,
        frequency,
        skillLevel,
        experienceYears,
        ageGroups,
        packages,
        mediaUrl: null,
      }

      return { course, vm }
    })
  }, [courses, attributesByCourseId, packages])

  const canSchedule = coachSport?.status === 'approved'

  // 对外暴露刷新函数，供删除/新增后调用
  async function reload() {
    if (!id) return
    setLoading(true)
    setError(null)
    try {
      const { data: coach } = await supabase
        .from('coach_sports')
        .select('*')
        .eq('id', id)
        .maybeSingle()
      setCoachSport((coach ?? null) as CoachSport | null)

      const { data: courseRows } = await supabase
        .from('course_detail')
        .select('*')
        .eq('coach_sport_id', id)
        .order('updated_at', { ascending: false, nullsFirst: false })
        .order('created_at', { ascending: false, nullsFirst: true })
      const allCourses = (courseRows ?? []) as CourseDetail[]
      setCourses(allCourses)

      let attributesMap: Record<string, CourseAttribute[]> = {}
      if (allCourses.length > 0) {
        type CourseAttributeRow = { course_id: string } & CourseAttribute
        const courseIds = allCourses.map((c) => c.id)
        const { data: attrData } = await supabase
          .from('course_attributes')
          .select('course_id,type,value')
          .in('course_id', courseIds)
        const rows = (attrData ?? []) as CourseAttributeRow[]
        for (const row of rows) {
          if (!attributesMap[row.course_id]) attributesMap[row.course_id] = []
          attributesMap[row.course_id].push({ type: row.type, value: row.value })
        }
      }
      setAttributesByCourseId(attributesMap)

      const { data: pkgData } = await supabase
        .from('coach_package_prices')
        .select('id,coach_sport_id,lessons_count,lesson_duration_minutes,price')
        .eq('coach_sport_id', id)
      setPackages((pkgData ?? []) as Package[])
    } catch (e) {
      // 静默错误，维持现有错误处理模型
    } finally {
      setLoading(false)
    }
  }

  return {
    loading,
    error,
    coachSport,
    courses,
    attributesByCourseId,
    packages,
    courseVMs,
    canSchedule,
    reload,
  }
}
