import { useParams } from 'react-router-dom'

export default function CourseEditor() {
  const { id } = useParams()
  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold">Course Editor</h1>
      <p className="text-sm text-muted-foreground">TODO: Keep existing CourseEditor; this is a placeholder for routing. Coach sport id: {id}</p>
    </div>
  )
}

