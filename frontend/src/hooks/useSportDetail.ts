import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'
import { getPackagesByCourseIds } from '@/api/courses'

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
  course_id: string
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
  course_id: string
  lessons_count: number
  lesson_duration_minutes: number
  price: number
}

export function useSportDetail(id: string | undefined) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [coachSport, setCoachSport] = useState<CoachSport | null>(null)
  const [courses, setCourses] = useState<CourseDetail[]>([])
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

        // course_detail：多条（按 updated_at/created_at 倒序）
        const { data: courseRows, error: courseErr } = await supabase
          .from('course_detail')
          .select('*')
          .eq('coach_sport_id', id)
          .order('updated_at', { ascending: false })
          .order('created_at', { ascending: false })
        if (courseErr) throw courseErr
        const allCourses = (courseRows ?? []) as CourseDetail[]
        setCourses(allCourses)

        // attributes：批量按课程查询
        let attrs: CourseAttribute[] = []
        const courseIds = allCourses.map((c) => c.id)
        if (courseIds.length > 0) {
          const { data: attrData, error: attrErr } = await supabase
            .from('course_attributes')
            .select('course_id,type,value')
            .in('course_id', courseIds)
          if (attrErr) throw attrErr
          attrs = (attrData ?? []) as CourseAttribute[]
        }
        setAttributes(attrs)

        // packages：通过 course service 获取
        if (courseIds.length > 0) {
          console.log('Fetching packages for courseIds:', courseIds)
          const pkgData = await getPackagesByCourseIds(courseIds)
          console.log('Received package data:', pkgData)
          const mappedPackages = pkgData.map(pkg => ({
            id: pkg.id,
            course_id: pkg.courseId,
            lessons_count: pkg.lessonsCount,
            lesson_duration_minutes: pkg.lessonDurationMinutes,
            price: pkg.price
          }))
          console.log('Mapped packages:', mappedPackages)
          setPackages(mappedPackages)
        } else {
          console.log('No courseIds, setting empty packages')
          setPackages([])
        }
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

  const courseVMs: Array<{ courseId: string; vm: CourseVM }> = useMemo(() => {
    if (!courses || courses.length === 0) return []

    const attributesByCourseId = attributes.reduce<Record<string, CourseAttribute[]>>(
      (
        acc: Record<string, CourseAttribute[]>,
        attr: CourseAttribute
      ): Record<string, CourseAttribute[]> => {
        const list: CourseAttribute[] = acc[attr.course_id] ?? []
        list.push(attr)
        acc[attr.course_id] = list
        return acc
      },
      {}
    )

    return courses.map((course: CourseDetail) => {
      const attrs: CourseAttribute[] = attributesByCourseId[course.id] ?? []

      const modes = (course.training_modes ?? []).filter(Boolean) as TrainingMode[]
      const goals = course.training_goals ?? []
      const prefer = attrs
        .filter((a: CourseAttribute) => a.type === 'prefer_student')
        .map((a: CourseAttribute) => a.value)
      const style = attrs
        .filter((a: CourseAttribute) => a.type === 'style')
        .map((a: CourseAttribute) => a.value)
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

      // 获取当前课程的包
      console.log(`Filtering packages for course ${course.id}`)
      console.log('All packages:', packages)
      const coursePackages = packages.filter(pkg => pkg.course_id === course.id)
      console.log(`Course ${course.id} packages:`, coursePackages)
      // 转换为 CourseVM 期望的格式（移除 course_id 字段）
      const vmPackages = coursePackages.map(pkg => ({
        id: pkg.id,
        lessons_count: pkg.lessons_count,
        lesson_duration_minutes: pkg.lesson_duration_minutes,
        price: pkg.price
      }))
      console.log(`VM packages for course ${course.id}:`, vmPackages)

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
        packages: vmPackages,
        mediaUrl: null,
      }

      return { courseId: course.id, vm }
    })
  }, [courses, attributes, packages])

  const canSchedule = coachSport?.status === 'approved'

  return {
    loading,
    error,
    coachSport,
    courses,
    courseVMs,
    packages,
    canSchedule,
  }
}
