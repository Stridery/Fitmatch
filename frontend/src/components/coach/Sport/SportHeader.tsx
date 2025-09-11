import { Button } from '@/components/ui/button'
import { Link } from 'react-router-dom'

type Props = {
  sportName: string
  status: 'pending'|'approved'|'rejected'
  sportId: string
}

export function SportHeader({ sportName, status, sportId }: Props) {
  const statusColor = status === 'approved' ? 'bg-emerald-100 text-emerald-700' : status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
  return (
    <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div className="flex items-center gap-3">
        <h1 className="text-2xl font-semibold">{sportName}</h1>
        <span className={`px-2.5 py-1 rounded-full text-xs ${statusColor}`}>{status}</span>
      </div>
      <div className="flex gap-2">
        <Link to={`/coach/sports/${sportId}/edit`}>
          <Button variant="outline">Edit sport</Button>
        </Link>
        <Link to={`/coach/sports/${sportId}/course`}>
          <Button variant="outline">Edit course</Button>
        </Link>
        <Link to={`/coach/sports/${sportId}/sessions`}>
          <Button disabled={status !== 'approved'} title={status !== 'approved' ? 'Available after approval' : undefined}>Schedule sessions</Button>
        </Link>
      </div>
    </div>
  )
}

