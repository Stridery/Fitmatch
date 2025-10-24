import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { getCoachBookedSessions, CoachBookedSession } from '@/api/booking'
import UserScheduleWeekView from '@/components/user/UserScheduleWeekView'
import { startOfWeekMonday, endOfWeekSunday, formatRangeLabel, addDays } from '@/lib/timeGrid'
import { Button } from '@/components/ui/button'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useUser } from '@/contexts/UserContext'

type CoachSport = {
  id: string
  status: 'pending' | 'approved' | 'rejected'
  sports: { id: string; name: string } | null
}

export default function CoachCenterPage() {
  const { user } = useUser(); // 使用UserContext获取用户信息
  const [items, setItems] = useState<CoachSport[]>([])
  const [loading, setLoading] = useState(true)
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
        if (!user?.id) {
          setItems([])
          return
        }
        
        // 检查用户是否为教练
        const { data: profileData, error: profileError } = await supabase
          .from('user_profile')
          .select('is_coach')
          .eq('user_id', user.id)
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
          .eq('coach_id', user.id)

        if (error) throw error
        if (mounted) setItems((data ?? []) as any)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => {
      mounted = false
    }
  }, [user?.id])

  // 加载有学生的课程
  useEffect(() => {
    if (!user?.id) return
    
    const loadBookedSessions = async () => {
      setLoadingSessions(true)
      try {
        const sessions = await getCoachBookedSessions(user.id)
        setBookedSessions(sessions)
      } catch (error) {
        console.error('Error loading booked sessions:', error)
      } finally {
        setLoadingSessions(false)
      }
    }
    
    loadBookedSessions()
  }, [user?.id])

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
    <div className="p-6 space-y-6 bg-gray-900 min-h-screen">
      <h1 className="text-2xl font-semibold text-white">Coach Center</h1>
      
      {/* 项目卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link
            key={it.id}
            to={`/dashboard/coach/sports/${it.id}`}
            state={{ sportName: it.sports?.name }} 
            className="border border-gray-700 rounded-lg p-4 hover:shadow-lg bg-gray-800 hover:bg-gray-700 transition-all duration-200"
          >
            <div className="font-medium text-white">
              {it.sports?.name ?? 'Unknown sport'}
            </div>
            <div className="text-xs text-gray-400">{it.status}</div>
          </Link>
        ))}
      </div>

      {/* 有学生的课程时间表 - 只有教练才显示 */}
      {isCoach && user?.id && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-white">My Course Schedule</h2>
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handlePrevWeek}
                className="flex items-center space-x-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
              >
                <ChevronLeft className="h-4 w-4" />
                <span>Previous Week</span>
              </Button>
              <span className="text-sm font-medium text-gray-300">{weekRangeLabel}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={handleNextWeek}
                className="flex items-center space-x-1 bg-gray-700 border-gray-600 text-white hover:bg-gray-600 hover:border-gray-500"
              >
                <span>Next Week</span>
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          {loadingSessions ? (
            <div className="text-center py-8 text-gray-400">Loading courses...</div>
          ) : calendarEvents.length === 0 ? (
            <div className="text-center py-8 text-gray-400">
              <p>No courses with students yet</p>
              <p className="text-sm mt-2">Go create courses or availability!</p>
            </div>
          ) : (
            <div className="h-96 bg-gray-800 rounded-lg border border-gray-700">
              <UserScheduleWeekView weekStart={weekStart} events={calendarEvents} />
            </div>
          )}
        </div>
      )}
    </div>
  )
}
