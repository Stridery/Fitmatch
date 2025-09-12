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
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [attributes, setAttributes] = useState<CourseAttribute[]>([])
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

        // course_detail：可能 0/1/多条 → 列表 + 取第一条（updated_at/created_at 倒序）
        const { data: courseRows, error: courseErr } = await supabase
          .from('course_detail')
          .select('*')
          .eq('coach_sport_id', id)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false, nullsFirst: true })
          .limit(1)
        if (courseErr) throw courseErr
        const firstCourse = (courseRows?.[0] ?? null) as CourseDetail | null
        setCourse(firstCourse)

        // attributes：有 course.id 再查
        let attrs: CourseAttribute[] = []
        if (firstCourse?.id) {
          const { data: attrData, error: attrErr } = await supabase
            .from('course_attributes')
            .select('type,value')
            .eq('course_id', firstCourse.id)
          if (attrErr) throw attrErr
          attrs = (attrData ?? []) as CourseAttribute[]
        }
        setAttributes(attrs)

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

  const courseVM: CourseVM | null = useMemo(() => {
    if (!course) return null

    const modes = (course.training_modes ?? []).filter(Boolean) as TrainingMode[]
    const goals = course.training_goals ?? []
    const prefer = attributes
      .filter((a) => a.type === 'prefer_student')
      .map((a) => a.value)
    const style = attributes.filter((a) => a.type === 'style').map((a) => a.value)
    const communicationStyle = attributes
      .filter((a) => a.type === 'communication_style')
      .map((a) => a.value)
    const paceIntensity = attributes
      .filter((a) => a.type === 'pace_intensity')
      .map((a) => a.value)

    const timeSlots = course.available_time_slots ?? []
    const frequency = course.preferred_frequency ?? null
    const skillLevel = course.skill_level ?? null
    const experienceYears = course.experience_years ?? null
    const ageGroups = course.age_groups ?? []

    return {
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
      mediaUrl: null, // 本迭代不展示 media
    }
  }, [course, attributes, packages])

  const canSchedule = coachSport?.status === 'approved'

  return {
    loading,
    error,
    coachSport,
    course,
    attributes,
    packages,
    courseVM,
    canSchedule,
  }
}
