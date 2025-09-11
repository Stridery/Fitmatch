import { useParams, Link } from 'react-router-dom'
import { useSportDetail } from '@/hooks/useSportDetail'
import { SportHeader } from '@/components/coach/Sport/SportHeader'
import { ModeGrid } from '@/components/coach/Sport/ModeGrid'

export default function SportDetailPage() {
  const { id } = useParams()
  const { loading, error, coachSport, courseVM, canSchedule } = useSportDetail(id)

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

  const sportName = coachSport.sport_id // Ideally join to sports table; placeholder

  return (
    <div className="p-6 space-y-6">
      <SportHeader sportName={sportName} status={coachSport.status} sportId={coachSport.id} />

      {!courseVM ? (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          <div>You haven’t set up your course profile yet.</div>
          <Link to={`/coach/sports/${coachSport.id}/course`} className="text-blue-600">Edit course</Link>
        </div>
      ) : courseVM.modes.length === 0 ? (
        <div className="border rounded-lg p-4 text-sm text-muted-foreground">
          <div>No training modes selected.</div>
          <Link to={`/coach/sports/${coachSport.id}/course`} className="text-blue-600">Choose modes</Link>
        </div>
      ) : (
        <ModeGrid vm={courseVM} sportId={coachSport.id} canSchedule={canSchedule} />
      )}
    </div>
  )
}

