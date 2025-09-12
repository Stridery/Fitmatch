import { useEffect, useMemo, useState } from 'react'
import { supabase } from '@/lib/supabase'

export type TrainingMode = '1v1' | '1v2' | 'Group' | 'Online'

export type CourseVM = {
  modes: TrainingMode[]
  goals: string[]
  prefer: string[]
  notPrefer: string[]
  style: string[]
  packages: { id: string; lessons_count: number; lesson_duration_minutes: number; price: number }[]
  mediaUrl?: string | null
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
  available_time_slots: string[]
  preferred_frequency?: string | null
  training_goals: string[]
}

type CourseAttribute = {
  type: 'style' | 'prefer_student' | 'not_prefer_student'
  value: string
}

type Package = { id: string; lessons_count: number; lesson_duration_minutes: number; price: number }

export function useSportDetail(id: string | undefined) {
  const [loading, setLoading] = useState<boolean>(true)
  const [error, setError] = useState<string | null>(null)
  const [coachSport, setCoachSport] = useState<CoachSport | null>(null)
  const [course, setCourse] = useState<CourseDetail | null>(null)
  const [attributes, setAttributes] = useState<CourseAttribute[]>([])
  const [packages, setPackages] = useState<Package[]>([])
  const [mediaUrl, setMediaUrl] = useState<string | null>(null)

  useEffect(() => {
    if (!id) {
      setLoading(false)
      setError('Invalid sport id')
      return
    }
    let isCancelled = false
    async function fetchAll() {
      setLoading(true)
      setError(null)
      try {
        // coach_sports：主键查询，maybeSingle 防 406
        const { data: coach, error: coachErr } = await supabase
          .from('coach_sports')
          .select('*')
          .eq('id', id)
          .limit(1)
          .maybeSingle()
        if (coachErr) throw coachErr
        if (isCancelled) return
        setCoachSport((coach ?? null) as CoachSport | null)

        // course_detail：可能多条 → 按更新时间/创建时间倒序取第一条
        const { data: courseRow, error: courseErr } = await supabase
          .from('course_detail')
          .select('*')
          .eq('coach_sport_id', id)
          .order('updated_at', { ascending: false, nullsFirst: false })
          .order('created_at', { ascending: false, nullsFirst: true })
          .limit(1)
          .maybeSingle()
        if (courseErr) throw courseErr
        setCourse((courseRow ?? null) as CourseDetail | null)

        // attributes：有 course.id 再查
        let attrs: CourseAttribute[] = []
        if (courseRow?.id) {
          const { data: attrData, error: attrErr } = await supabase
            .from('course_attributes')
            .select('type,value')
            .eq('course_id', courseRow.id)
          if (attrErr) throw attrErr
          attrs = (attrData ?? []) as CourseAttribute[]
        }
        setAttributes(attrs)

        // packages
        const { data: pkgData, error: pkgErr } = await supabase
          .from('coach_package_prices')
          .select('id,lessons_count,lesson_duration_minutes,price')
          .eq('coach_sport_id', id)
        if (pkgErr) throw pkgErr
        setPackages((pkgData ?? []) as Package[])

        // media：取最新一条（若存在），生成签名 URL
        const { data: mediaData, error: mediaErr } = await supabase
          .from('coach_media')
          .select('type,url,description,created_at')
          .eq('coach_sport_id', id)
          .order('created_at', { ascending: false })
          .limit(1)
          .maybeSingle()
        if (mediaErr) throw mediaErr

        if (mediaData?.url) {
          const { data: signed } = await supabase.storage
            .from('coach-media')
            .createSignedUrl(mediaData.url, 60 * 60)
          setMediaUrl(signed?.signedUrl ?? null)
        } else {
          setMediaUrl(null)
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

  const courseVM: CourseVM | null = useMemo(() => {
    if (!course) return null
    const modes = (course.training_modes ?? []).filter(Boolean) as TrainingMode[]
    const goals = course.training_goals ?? []
    const prefer = attributes.filter(a => a.type === 'prefer_student').map(a => a.value)
    const notPrefer = attributes.filter(a => a.type === 'not_prefer_student').map(a => a.value)
    const style = attributes.filter(a => a.type === 'style').map(a => a.value)
    return { modes, goals, prefer, notPrefer, style, packages, mediaUrl }
  }, [course, attributes, packages, mediaUrl])

  const canSchedule = coachSport?.status === 'approved'

  return { loading, error, coachSport, course, attributes, packages, mediaUrl, courseVM, canSchedule }
}
