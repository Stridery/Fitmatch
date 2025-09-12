import type { CourseVM, TrainingMode } from '@/hooks/useSportDetail'
import { ModeCard } from './ModeCard'

export function ModeGrid({ vm, sportId, canSchedule, courseId, onDelete, deleting }: { vm: CourseVM, sportId: string, canSchedule: boolean, courseId?: string, onDelete?: () => void, deleting?: boolean }) {
  return (
    <div className="flex flex-col gap-4 w-full min-w-0">
      {vm.modes.map((mode) => (
        <ModeCard key={mode} mode={mode as TrainingMode} vm={vm} sportId={sportId} canSchedule={canSchedule} courseId={courseId} onDelete={onDelete} deleting={deleting} />
      ))}
    </div>
  )
}

