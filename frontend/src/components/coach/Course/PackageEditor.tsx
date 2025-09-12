import { useMemo, useState, type ChangeEvent } from 'react'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export type PackageItem = {
  id?: string
  lessons_count: number
  lesson_duration_minutes: number
  price: number
}

const rowSchema = z.object({
  lessons_count: z
    .number({ required_error: 'Required' })
    .int('Must be an integer')
    .positive('Must be greater than 0'),
  lesson_duration_minutes: z
    .number({ required_error: 'Required' })
    .int('Must be an integer')
    .positive('Must be greater than 0'),
  price: z
    .number({ required_error: 'Required' })
    .min(0, 'Must be ≥ 0'),
})

type FieldErrors = Partial<Record<keyof PackageItem, string | undefined>>

export function PackageEditor({
  items,
  onChange,
  disabled,
}: {
  items: PackageItem[]
  onChange: (items: PackageItem[]) => void
  disabled?: boolean
}) {
  const [errorsByIndex, setErrorsByIndex] = useState<Record<number, FieldErrors>>({})

  const commonDurations = useMemo(() => [30, 45, 60, 90], [])

  function validateRow(idx: number, row: PackageItem) {
    const parsed = rowSchema.safeParse(row)
    const fieldErrors: FieldErrors = parsed.success
      ? {}
      : {
          lessons_count: parsed.error.formErrors.fieldErrors.lessons_count?.[0],
          lesson_duration_minutes:
            parsed.error.formErrors.fieldErrors.lesson_duration_minutes?.[0],
          price: parsed.error.formErrors.fieldErrors.price?.[0],
        }
    setErrorsByIndex((prev: Record<number, FieldErrors>) => ({
      ...prev,
      [idx]: fieldErrors,
    }))
    return parsed.success
  }

  function handleAdd() {
    const next: PackageItem[] = [
      ...items,
      { lessons_count: 3, lesson_duration_minutes: 60, price: 120 },
    ]
    onChange(next)
  }

  function handleDelete(index: number) {
    const next = items.filter((_, i) => i !== index)
    onChange(next)
    setErrorsByIndex((prev: Record<number, FieldErrors>) => {
      const copy = { ...prev }
      delete copy[index]
      return copy
    })
  }

  function updateRow<K extends keyof PackageItem>(
    index: number,
    key: K,
    value: string
  ) {
    const current = items[index]
    const numeric = Number(value)
    const nextRow: PackageItem = {
      ...current,
      [key]: key === 'price' || key === 'lessons_count' || key === 'lesson_duration_minutes' ? (isNaN(numeric) ? ('' as any) : numeric) : (value as any),
    }
    const next = [...items]
    next[index] = nextRow
    onChange(next)
    validateRow(index, nextRow)
  }

  return (
    <div className="space-y-3">
      <div>
        <Button type="button" size="sm" onClick={handleAdd} disabled={disabled}>
          Add package
        </Button>
      </div>
      <div className="space-y-3">
        {items.map((row, idx) => {
          const errs = errorsByIndex[idx] || {}
          return (
            <div key={row.id ?? idx} className="border rounded-lg p-3 space-y-2">
              <div className="grid grid-cols-1 sm:grid-cols-12 gap-3 items-end">
                <div className="sm:col-span-3">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Lessons</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={1}
                    value={Number.isFinite(row.lessons_count as any) ? row.lessons_count : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(idx, 'lessons_count', e.target.value)}
                    disabled={disabled}
                  />
                  {errs.lessons_count ? (
                    <div className="text-[0.8rem] text-destructive mt-1">{errs.lessons_count}</div>
                  ) : null}
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Duration (minutes)</label>
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={1}
                    step={15}
                    list={`durations-${idx}`}
                    value={Number.isFinite(row.lesson_duration_minutes as any) ? row.lesson_duration_minutes : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(idx, 'lesson_duration_minutes', e.target.value)}
                    disabled={disabled}
                  />
                  <datalist id={`durations-${idx}`}>
                    {commonDurations.map((d: number) => (
                      <option key={d} value={d} />
                    ))}
                  </datalist>
                  {errs.lesson_duration_minutes ? (
                    <div className="text-[0.8rem] text-destructive mt-1">{errs.lesson_duration_minutes}</div>
                  ) : null}
                </div>
                <div className="sm:col-span-4">
                  <label className="block text-xs font-medium text-muted-foreground mb-1">Price</label>
                  <Input
                    type="number"
                    inputMode="decimal"
                    min={0}
                    step={1}
                    value={Number.isFinite(row.price as any) ? row.price : ''}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => updateRow(idx, 'price', e.target.value)}
                    disabled={disabled}
                  />
                  {errs.price ? (
                    <div className="text-[0.8rem] text-destructive mt-1">{errs.price}</div>
                  ) : null}
                </div>
                <div className="sm:col-span-1 flex sm:justify-end">
                  <Button type="button" variant="outline" onClick={() => handleDelete(idx)} disabled={disabled}>
                    Delete
                  </Button>
                </div>
              </div>
            </div>
          )
        })}
        {items.length === 0 ? (
          <div className="text-sm text-muted-foreground border rounded-lg p-4">No packages yet. Click “Add package”.</div>
        ) : null}
      </div>
    </div>
  )
}

export default PackageEditor

