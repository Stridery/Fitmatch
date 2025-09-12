import { useEffect, useMemo, useState } from 'react'
import { useParams } from 'react-router-dom'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import PackageEditor, { type PackageItem } from '@/components/coach/Course/PackageEditor'
import { supabase } from '@/lib/supabase'

export default function CourseEditor() {
  const { id } = useParams()
  const coachSportId = id as string | undefined
  const [saving, setSaving] = useState(false)
  const [packages, setPackages] = useState<PackageItem[]>([])
  const [statusMsg, setStatusMsg] = useState<string | null>(null)

  useEffect(() => {
    let mounted = true
    async function load() {
      if (!coachSportId) return
      const { data, error } = await supabase
        .from('coach_package_prices')
        .select('id,lessons_count,lesson_duration_minutes,price')
        .eq('coach_sport_id', coachSportId)
      if (!mounted) return
      if (error) {
        console.error(error)
        setStatusMsg(error.message ?? 'Failed to load packages')
        return
      }
      setPackages((data ?? []) as unknown as PackageItem[])
    }
    load()
    return () => {
      mounted = false
    }
  }, [coachSportId])

  async function handleSave() {
    if (!coachSportId) return
    setSaving(true)
    setStatusMsg(null)
    try {
      // replace strategy
      const { error: delErr } = await supabase
        .from('coach_package_prices')
        .delete()
        .eq('coach_sport_id', coachSportId)
      if (delErr) throw delErr

      const rows = packages
        .filter((p: PackageItem) => Number.isFinite(p.lessons_count) && Number.isFinite(p.lesson_duration_minutes) && Number.isFinite(p.price))
        .map((p: PackageItem) => ({
          id: crypto.randomUUID(),
          coach_sport_id: coachSportId,
          lessons_count: p.lessons_count,
          lesson_duration_minutes: p.lesson_duration_minutes,
          price: p.price,
        }))
      if (rows.length > 0) {
        const { error: insErr } = await supabase
          .from('coach_package_prices')
          .insert(rows)
        if (insErr) throw insErr
      }
      setStatusMsg('Saved')
    } catch (e: any) {
      console.error(e)
      setStatusMsg(e?.message ?? 'Save failed')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="p-6 space-y-6">
      <h1 className="text-xl font-semibold">Course Editor</h1>
      <div className="text-sm text-muted-foreground">Coach sport id: {coachSportId}</div>

      <Card>
        <CardHeader>
          <CardTitle>Packages</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <PackageEditor items={packages} onChange={setPackages} disabled={saving} />
          <div className="flex items-center gap-3">
            <Button onClick={handleSave} disabled={saving || !coachSportId}>
              {saving ? 'Saving…' : 'Save'}
            </Button>
            {statusMsg ? (
              <div className="text-sm text-muted-foreground">{statusMsg}</div>
            ) : null}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

