import { Card } from '@/components/ui/card'

type Package = { id:string; lessons_count:number; lesson_duration_minutes:number; price:number }

function formatPrice(value: number) {
  try {
    return new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD', minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(value)
  } catch {
    return `$${value}`
  }
}

export function PackageList({ items }: { items: Package[] }) {
  if (!items.length) {
    return (
      <div className="text-sm text-muted-foreground border rounded-lg p-4">No packages yet. Edit course to add.</div>
    )
  }
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {items.map((p) => (
        <div key={p.id} className="border rounded-lg p-4">
          <div className="font-medium text-sm">{p.lessons_count} lessons × {p.lesson_duration_minutes} min</div>
          <div className="mt-2 font-semibold">{formatPrice(p.price)}</div>
        </div>
      ))}
    </div>
  )
}

