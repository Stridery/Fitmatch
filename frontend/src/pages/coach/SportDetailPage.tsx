import { useEffect, useState } from 'react'
import { useParams, Link, useLocation } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import { useSportDetail } from '@/hooks/useSportDetail'
import { SportHeader } from '@/components/coach/Sport/SportHeader'
import { ModeGrid } from '@/components/coach/Sport/ModeGrid'

export default function SportDetailPage() {
  const { id } = useParams()
  const location = useLocation() as { state?: { sportName?: string } }
  const { loading, error, coachSport, courseVM, canSchedule } = useSportDetail(id)

  // 先用 Link.state 里的名字
  const [resolvedSportName, setResolvedSportName] = useState<string | null>(
    location.state?.sportName ?? null
  )

  // 如果没有名字但有 sport_id，就兜底查 sports 表
  useEffect(() => {
    let mounted = true
    if (!resolvedSportName && coachSport?.sport_id) {
      supabase
        .from('sports')
        .select('name')
        .eq('id', coachSport.sport_id)
        .maybeSingle()
        .then(({ data }) => {
          if (mounted) {
            setResolvedSportName(data?.name ?? null)
          }
        })
    }
    return () => {
      mounted = false
    }
  }, [resolvedSportName, coachSport?.sport_id])

  if (loading) {
    return (
      <div className="p-6 space-y-4">
        <div className="h-6 w-40 bg-gray-100 rounded" />
        <div className="h-5 w-72 bg-gray-100 rounded" />
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className="h-72 bg-gray-100 rounded" />
          ))}
        </div>
      </div>
    )
  }

  if (error) {
    return <div className="p-6 text-red-600">{error}</div>
  }

  if (!coachSport) {
    return <div className="p-6">Not found.</div>
  }

  // 最终展示名：优先 state，其次兜底查询，最后才退回 id
  const sportName = resolvedSportName ?? coachSport.sport_id

  return (
    <div className="p-6 space-y-6">
      <SportHeader
        sportName={sportName}
        status={coachSport.status}
        sportId={coachSport.id}
      />

      {!courseVM ? (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          <div>You haven’t set up your course profile yet.</div>
          <Link
            to={`/coach/sports/${coachSport.id}/course`}
            className="text-blue-600"
          >
            Edit course
          </Link>
        </div>
      ) : courseVM.modes.length === 0 ? (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          <div>No training modes selected.</div>
          <Link
            to={`/coach/sports/${coachSport.id}/course`}
            className="text-blue-600"
          >
            Choose modes
          </Link>
        </div>
      ) : (
        <ModeGrid
          vm={courseVM}
          sportId={coachSport.id}
          canSchedule={canSchedule}
        />
      )}
    </div>
  )
}
