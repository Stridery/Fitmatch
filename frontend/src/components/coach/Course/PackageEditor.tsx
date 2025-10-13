import { useMemo } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'

export type PackageItem = {
  id?: string
  lessons_count?: number
  lesson_duration_minutes?: number
  price?: number
  training_mode?: string
}

const numberRequiredOrTypeError = (issue: any) =>
  issue.input === undefined ? 'Required' : 'Must be a number';

export const rowSchema = z.object({
  lessons_count: z.number({ error: numberRequiredOrTypeError })
    .int({ error: 'Must be an integer' })
    .gt(0, { error: 'Must be > 0' }),

  lesson_duration_minutes: z.number({ error: numberRequiredOrTypeError })
    .int({ error: 'Must be an integer' })
    .gt(0, { error: 'Must be > 0' }),

  price: z.number({ error: numberRequiredOrTypeError })
    .min(0, { error: 'Must be ≥ 0' }),

  training_mode: z.string().min(1, { error: 'Mode is required' }).default('1v1'),
});

function getRowErrors(row: PackageItem) {
  const result = rowSchema.safeParse({
    lessons_count: row.lessons_count,
    lesson_duration_minutes: row.lesson_duration_minutes,
    price: row.price,
    training_mode: row.training_mode,
  })
  if (result.success) return {}
  const issues: Record<string, string> = {}
  for (const issue of result.error.issues) {
    const key = issue.path[0] as string
    if (!issues[key]) issues[key] = issue.message
  }
  return issues as Partial<Record<keyof PackageItem, string>>
}

export function PackageEditor({ items, onChange, disabled }: { items: PackageItem[]; onChange: (items: PackageItem[]) => void; disabled?: boolean }) {
  const errors = useMemo(() => items.map(getRowErrors), [items])

  const handleChange = (idx: number, field: keyof PackageItem, raw: string) => {
    const next = [...items]
    if (field === 'training_mode') {
      ;(next[idx] as any)[field] = raw
    } else if (raw === '') {
      ;(next[idx] as any)[field] = undefined
    } else {
      const n = field === 'price' ? Number(raw) : Math.trunc(Number(raw))
      ;(next[idx] as any)[field] = Number.isFinite(n) ? n : undefined
    }
    onChange(next)
  }

  const addRow = () => {
    onChange([
      ...items,
      { lessons_count: 1, lesson_duration_minutes: 60, price: 0, training_mode: '1v1' },
    ])
  }

  const removeRow = (idx: number) => {
    const next = items.slice(0, idx).concat(items.slice(idx + 1))
    onChange(next)
  }

  return (
    <div className="space-y-3">
      <div>
        <Button type="button" variant="outline" className="text-black" onClick={addRow} disabled={disabled}>Add package</Button>
      </div>

      {items.length === 0 ? (
        <div className="text-sm text-muted-foreground border rounded-lg p-4">No packages yet.</div>
      ) : null}

      <div className="space-y-3">
        {items.map((row, idx) => {
          const e = errors[idx] || {}
          const key = row.id ?? `row-${idx}`
          return (
            <div key={key} className="border rounded-lg p-3">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-start">
                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Mode</div>
                  <Select 
                    value={row.training_mode || '1v1'} 
                    onValueChange={(value) => handleChange(idx, 'training_mode', value)}
                    disabled={disabled}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Mode" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1v1">1v1</SelectItem>
                      <SelectItem value="1v2">1v2</SelectItem>
                      <SelectItem value="group">Group</SelectItem>
                      <SelectItem value="online">Online</SelectItem>
                    </SelectContent>
                  </Select>
                  {e.training_mode ? (
                    <div className="text-xs text-red-600 mt-1">{e.training_mode}</div>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Lessons</div>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    value={row.lessons_count ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'lessons_count', e.target.value)}
                    disabled={disabled}
                  />
                  {e.lessons_count ? (
                    <div className="text-xs text-red-600 mt-1">{e.lessons_count}</div>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Duration (min)</div>
                  <Input
                    type="number"
                    min={1}
                    step={1}
                    inputMode="numeric"
                    list={`durations-${key}`}
                    value={row.lesson_duration_minutes ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'lesson_duration_minutes', e.target.value)}
                    disabled={disabled}
                  />
                  <datalist id={`durations-${key}`}>
                    <option value="30" />
                    <option value="45" />
                    <option value="60" />
                    <option value="90" />
                  </datalist>
                  {e.lesson_duration_minutes ? (
                    <div className="text-xs text-red-600 mt-1">{e.lesson_duration_minutes}</div>
                  ) : null}
                </div>

                <div className="sm:col-span-2">
                  <div className="text-xs text-muted-foreground mb-1">Price</div>
                  <Input
                    type="number"
                    min={0}
                    step={0.01}
                    inputMode="decimal"
                    value={row.price ?? ''}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => handleChange(idx, 'price', e.target.value)}
                    disabled={disabled}
                  />
                  {e.price ? (
                    <div className="text-xs text-red-600 mt-1">{e.price}</div>
                  ) : null}
                </div>

                <div className="sm:col-span-4 flex sm:justify-end items-end">
                  <Button type="button" variant="destructive" onClick={() => removeRow(idx)} disabled={disabled}>Delete</Button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export default PackageEditor

