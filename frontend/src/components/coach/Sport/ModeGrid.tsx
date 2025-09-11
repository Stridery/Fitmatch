import type { CourseVM, TrainingMode } from '@/hooks/useSportDetail'
import { ModeCard } from './ModeCard'

export function ModeGrid({ vm, sportId, canSchedule }: { vm: CourseVM, sportId: string, canSchedule: boolean }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
      {vm.modes.map((mode) => (
        <ModeCard key={mode} mode={mode as TrainingMode} vm={vm} sportId={sportId} canSchedule={canSchedule} />
      ))}
    </div>
  )
}

