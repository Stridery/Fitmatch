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
    <Card className="overflow-hidden w-full">
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
        {/* ✅ 移除媒体展示框 */}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InfoList title="Goals" items={vm.goals} />
          <InfoList title="Prefer students" items={vm.prefer} />
          {/* ❌ 移除 Not prefer students */}
          <InfoList title="Coaching style" items={vm.style} />

          {vm.communicationStyle?.length ? (
            <InfoList title="Communication" items={vm.communicationStyle} />
          ) : null}

          {vm.paceIntensity?.length ? (
            <InfoList title="Pace & intensity" items={vm.paceIntensity} />
          ) : null}

          {vm.timeSlots?.length ? (
            <InfoList title="Time slots" items={vm.timeSlots} />
          ) : null}

          {vm.frequency ? <InfoList title="Preferred frequency" items={[vm.frequency]} /> : null}
          {vm.skillLevel ? <InfoList title="Skill level" items={[vm.skillLevel]} /> : null}
          {vm.experienceYears ? <InfoList title="Experience years" items={[vm.experienceYears]} /> : null}
          {vm.ageGroups?.length ? <InfoList title="Age groups" items={vm.ageGroups} /> : null}
        </div>

        <div className="space-y-2">
          <div className="text-sm font-medium text-muted-foreground">Packages</div>
          <PackageList items={vm.packages} />
        </div>
      </CardContent>
    </Card>
  )
}
