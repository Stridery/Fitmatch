import { useParams, useSearchParams } from 'react-router-dom'

export default function SessionsPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const mode = params.get('mode')
  return (
    <div className="p-6 space-y-2">
      <h1 className="text-xl font-semibold">Sessions</h1>
      <div className="text-sm text-muted-foreground">TODO: Implement sessions editor. Preselected mode: {mode ?? '—'} for sport {id}</div>
    </div>
  )
}

