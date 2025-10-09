import { useParams, useSearchParams } from 'react-router-dom'
import ManageSessionsPage from '@/components/coach/ManageSessionsPage'

export default function SessionsPage() {
  const { id } = useParams()
  const [params] = useSearchParams()
  const mode = params.get('mode')
  
  return <ManageSessionsPage />
}

