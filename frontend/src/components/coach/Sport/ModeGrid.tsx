import type { CourseVM, TrainingMode } from '@/hooks/useSportDetail'
import { ModeCard } from './ModeCard'

export function ModeGrid({ vm, sportId, canSchedule, courseId, onDelete, deleting }: { vm: CourseVM, sportId: string, canSchedule: boolean, courseId?: string, onDelete?: () => void, deleting?: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {vm.modes.map((mode) => (
        <ModeCard key={mode} mode={mode as TrainingMode} vm={vm} sportId={sportId} canSchedule={canSchedule} courseId={courseId} onDelete={onDelete} deleting={deleting} />
      ))}
    </div>
  )
}

