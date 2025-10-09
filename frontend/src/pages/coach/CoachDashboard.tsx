import { useEffect, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { getPackagesByCourseIds } from '@/api/courses'

type CoachSport = {
  id: string
  coach_id: string
  sport_id: string
  self_intro: string | null
  experience_years: string | null
  has_certificate: boolean | null
  certificate_type: string | null
  certificate_url: string | null
  status: 'pending' | 'approved' | 'rejected'
  created_at: string
  updated_at: string
}

type Sport = { id: string; name: string }
type CourseDetail = {
  id: string
  coach_sport_id: string
  training_modes: string[] | null
  available_time_slots: string[] | null
  preferred_frequency: string | null
  training_goals: string[] | null
}

type CoachPackagePrice = {
  id: string
  coach_sport_id: string
  lessons_count: number
  lesson_duration_minutes: number
  price: number
}

export default function CoachDashboard() {
  const { user, loading: loadingUser } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [coachSports, setCoachSports] = useState<CoachSport[]>([])
  const [sportsMap, setSportsMap] = useState<Record<string, Sport>>({})
  const [courseByCoachSport, setCourseByCoachSport] = useState<Record<string, CourseDetail | undefined>>({})
  const [packagesByCoachSport, setPackagesByCoachSport] = useState<Record<string, CoachPackagePrice[]>>({})

  useEffect(() => {
    if (loadingUser) return
    if (!user) {
      navigate('/login')
      return
    }
    const run = async () => {
      setLoading(true)
      setError(null)
      try {
        const { data: coachSportsData, error: csErr } = await supabase
          .from('coach_sports')
          .select('*')
          .eq('coach_id', user.id)
          .order('created_at', { ascending: false })
        if (csErr) throw csErr

        const sportsIds = Array.from(new Set((coachSportsData ?? []).map(s => s.sport_id)))
        const coachSportIds = Array.from(new Set((coachSportsData ?? []).map(s => s.id)))

        const [sportsRes, courseRes] = await Promise.all([
          sportsIds.length
            ? supabase.from('sports').select('id,name').in('id', sportsIds)
            : Promise.resolve({ data: [] as Sport[], error: null } as any),
          coachSportIds.length
            ? supabase.from('course_detail').select('*').in('coach_sport_id', coachSportIds)
            : Promise.resolve({ data: [] as CourseDetail[], error: null } as any),
        ])

        if (sportsRes.error) throw sportsRes.error
        if (courseRes.error) throw courseRes.error
        
        // 获取包信息通过 course service
        const courseIds = (courseRes.data ?? []).map((c: CourseDetail) => c.id)
        const pkgData = courseIds.length > 0 ? await getPackagesByCourseIds(courseIds) : []

        const sportsMapNext: Record<string, Sport> = {}
        for (const s of (sportsRes.data ?? []) as Sport[]) sportsMapNext[s.id] = s

        const courseMapNext: Record<string, CourseDetail> = {}
        for (const c of (courseRes.data ?? []) as CourseDetail[]) {
          // 如果同一个 coach_sport_id 有多条，这里会以最后一条覆盖前面一条
          // 如需按时间取最新，可在查询中加 order + limit per id（需要 RPC 或分组处理）
          courseMapNext[c.coach_sport_id] = c
        }

        const packagesMapNext: Record<string, CoachPackagePrice[]> = {}
        for (const p of pkgData) {
          const key = p.courseId
          if (!packagesMapNext[key]) packagesMapNext[key] = []
          packagesMapNext[key].push({
            id: p.id,
            coach_sport_id: p.courseId, // 保持兼容性，因为 CoachPackagePrice 类型仍使用 coach_sport_id
            lessons_count: p.lessonsCount,
            lesson_duration_minutes: p.lessonDurationMinutes,
            price: p.price
          })
        }

        setCoachSports((coachSportsData ?? []) as CoachSport[])
        setSportsMap(sportsMapNext)
        setCourseByCoachSport(courseMapNext)
        setPackagesByCoachSport(packagesMapNext)
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : 'Failed to load coach data'
        setError(msg)
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [user, loadingUser, navigate])

  if (loadingUser || loading) return <div className="p-6">Loading…</div>
  if (error) {
    return (
      <div className="p-6 text-red-600">
        {error}
        <div className="mt-4">
          <Button onClick={() => window.location.reload()}>Reload</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold">Coach Center</h2>
        <div className="flex gap-3">
          <Link to="/dashboard/coach/sports/new">
            <Button>Create profile</Button>
          </Link>
        </div>
      </div>

      {coachSports.length === 0 ? (
        <div className="text-muted-foreground">No coach profiles yet. Create one to get started.</div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {coachSports.map((cs) => {
            const sport = sportsMap[cs.sport_id]
            const course = courseByCoachSport[cs.id]
            // 包现在按 course_id 分组，需要根据课程ID统计
            const pkgCount = course ? (packagesByCoachSport[course.id] || []).length : 0
            return (
              <Card key={cs.id} className="border">
                <CardHeader>
                  <CardTitle className="flex items-center justify-between">
                    <span>{sport?.name || 'Unknown sport'}</span>
                    <span className="text-sm px-2 py-0.5 rounded bg-gray-100 text-gray-700 capitalize">{cs.status}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div>
                    <div className="text-sm text-muted-foreground">Experience</div>
                    <div className="text-sm">{cs.experience_years || '-'}</div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <div className="text-muted-foreground">Course</div>
                      <div>{course ? 'Configured' : 'Missing'}</div>
                    </div>
                    <div>
                      <div className="text-muted-foreground">Packages</div>
                      <div>{pkgCount}</div>
                    </div>
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" onClick={() => navigate(`/dashboard/coach/sports/${cs.id}/edit`)}>Edit</Button>
                    <Button onClick={() => navigate(`/dashboard/coach/sports/${cs.id}/course`)}>Course & Packages</Button>
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      )}
    </div>
  )
}
