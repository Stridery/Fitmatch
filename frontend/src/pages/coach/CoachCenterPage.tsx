import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

type CoachSport = { id: string; sport_id: string; status: 'pending'|'approved'|'rejected' }

export default function CoachCenterPage() {
  const [items, setItems] = useState<CoachSport[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let mounted = true
    ;(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        const coachId = session?.user?.id
        if (!coachId) { setItems([]); return }
        const { data } = await supabase.from('coach_sports').select('id,sport_id,status').eq('coach_id', coachId)
        if (mounted) setItems((data ?? []) as any)
      } finally {
        if (mounted) setLoading(false)
      }
    })()
    return () => { mounted = false }
  }, [])

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="p-6 space-y-4">
      <h1 className="text-2xl font-semibold">Coach Center</h1>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {items.map((it) => (
          <Link key={it.id} to={`/coach/sports/${it.id}`} className="border rounded-lg p-4 hover:shadow">
            <div className="font-medium">{it.sport_id}</div>
            <div className="text-xs text-muted-foreground">{it.status}</div>
          </Link>
        ))}
      </div>
    </div>
  )
}

