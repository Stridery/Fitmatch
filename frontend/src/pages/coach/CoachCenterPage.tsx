import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCoachBookedSessions, CoachBookedSession } from '@/api/booking'
import UserScheduleWeekView from '@/components/user/UserScheduleWeekView'
import { startOfWeekMonday, endOfWeekSunday, formatRangeLabel, addDays } from '@/lib/timeGrid'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'

type CoachSport = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  sports: { id: string; name: string } | null
}

export default function CoachCenterPage() {
  const [items, setItems] = useState<CoachSport[]>([])
  const [loading, setLoading] = useState(true)
  const [coachId, setCoachId] = useState<string>('')
  const [isCoach, setIsCoach] = useState<boolean>(false)
  const [bookedSessions, setBookedSessions] = useState<CoachBookedSession[]>([])
  const [weekStart, setWeekStart] = useState(() => startOfWeekMonday(new Date()))
  const [loadingSessions, setLoadingSessions] = useState(false)

  const weekEnd = endOfWeekSunday(weekStart)
  const weekRangeLabel = formatRangeLabel(weekStart, weekEnd)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const currentCoachId = session?.user?.id
        if (!currentCoachId) {
          setItems([])
          return
        }
        setCoachId(currentCoachId)
        
        // 检查用户是否为教练
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('is_coach')
          .eq('user_id', currentCoachId)
          .single()
        
        if (profileError) throw profileError
        if (mounted) setIsCoach(profileData?.is_coach === true)
        
        const { data, error } = await supabase
          .from('coach_sports')
          .select(`
            id,
            status,
            sports ( id, name )
          `)
          .eq('coach_id', currentCoachId)

        if (error) throw error
        if (mounted) setItems((data ?? []) as any)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [])

  // 加载有学生的课程
  useEffect(() => {
    if (!coachId) return
    
    const loadBookedSessions = async () => {
      setLoadingSessions(true)
      try {
        const sessions = await getCoachBookedSessions(coachId)
        setBookedSessions(sessions)
      } catch (error) {
        console.error('Error loading booked sessions:', error)
      } finally {
        setLoadingSessions(false)
      }
    }
    
    loadBookedSessions()
  }, [coachId])

  // 转换有学生的课程为日历事件格式 - 统一显示为session格式
  const calendarEvents = bookedSessions.map(session => ({
    id: session.id,
    kind: 'session', // 统一显示为session
    title: session.courseName || session.title, // 优先显示课程名称
    course: session.courseName || session.title, // 课程名称
    location: session.location || '',
    startTime: session.startTime,
    endTime: session.endTime,
    capacity: session.maxCapacity?.toString() || '1'
  }))

  const handlePrevWeek = () => {
    setWeekStart(addDays(weekStart, -7))
  }

  const handleNextWeek = () => {
    setWeekStart(addDays(weekStart, 7))
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-2xl font-semibold">Coach Center</h1>
      
      {/* 项目卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link
            key={it.id}
            to={`/dashboard/coach/sports/${it.id}`}
            state={{ sportName: it.sports?.name }} 
            className="border rounded-lg p-4 hover:shadow"
          >
            <div className="font-medium">
              {it.sports?.name ?? 'Unknown sport'}
            </div>
            <div className="text-xs text-muted-foreground">{it.status}</div>
          </Link>
        ))}
      </div>

      {/* 有学生的课程时间表 - 只有教练才显示 */}
      {isCoach && coachId && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold">我的课程安排</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevWeek}
                className="flex items-center space-x-1"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>上一周</span>
              </Button>
              <span className="text-sm font-medium">{weekRangeLabel}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="flex items-center space-x-1"
              >
                <span>下一周</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {loadingSessions ? (
            <div className="text-center py-8 text-gray-500">加载课程中...</div>
          ) : calendarEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>暂无有学生的课程</p>
              <p className="text-sm mt-2">去创建课程或availability吧！</p>
            </div>
          ) : (
            <div className="h-96">
              <UserScheduleWeekView weekStart={weekStart} events={calendarEvents} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
