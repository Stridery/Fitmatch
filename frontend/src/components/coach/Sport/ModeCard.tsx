import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { InfoList } from './InfoList'
import { PackageList } from './PackageList'
import type { CourseVM, TrainingMode } from '@/hooks/useSportDetail'

export type ModeCardProps = {
  mode: TrainingMode
  vm: CourseVM
  sportId: string
  canSchedule: boolean
  courseId?: string
  onDelete?: () => void
  deleting?: boolean
}

export function ModeCard({ mode, vm, sportId, canSchedule, courseId, onDelete, deleting }: ModeCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle className="text-lg">{mode}</CardTitle>
        <div className="flex gap-2">
          {courseId ? (
            <Link to={`/coach/sports/${sportId}/course/${courseId}/edit`}>
              <Button size="sm" variant="outline" className="text-black">Edit</Button>
            </Link>
          ) : null}
          {courseId ? (
            <Button size="sm" variant="outline" className="text-black" onClick={onDelete} disabled={deleting}>Delete</Button>
          ) : null}
          <Link to={`/coach/sports/${sportId}/sessions?mode=${encodeURIComponent(mode)}`}>
            <Button size="sm" disabled={!canSchedule} title={!canSchedule ? 'Available after approval' : undefined}>Schedule</Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="w-full h-40 bg-gray-100 rounded-lg overflow-hidden">
          {vm.mediaUrl ? (
            <img src={vm.mediaUrl} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-sm text-muted-foreground">No media yet</div>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoList title="Goals" items={vm.goals} />
          <InfoList title="Prefer students" items={vm.prefer} />
          <InfoList title="Not prefer students" items={vm.notPrefer} />
          <InfoList title="Coaching style" items={vm.style} />
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Packages</div>
          <PackageList items={vm.packages} />
        </div>
      </CardContent>
    </Card>
  )
}

