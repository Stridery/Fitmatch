type Props = {
  title: string
  items: string[]
  max?: number
}

export function InfoList({ title, items, max = 6 }: Props) {
  const visible = items.slice(0, max)
  const overflow = Math.max(0, items.length - visible.length)
  return (
    <div className="space-y-2">
      <div className="text-sm font-medium text-muted-foreground">{title}</div>
      <div className="flex flex-wrap gap-2">
        {visible.map((v, idx) => (
          <span key={idx} className="px-2 py-1 rounded-full text-xs bg-gray-100 text-gray-700">{v}</span>
        ))}
        {overflow > 0 && (
          <span className="px-2 py-1 rounded-full text-xs bg-gray-50 text-gray-500">+{overflow}</span>
        )}
      </div>
    </div>
  )
}

