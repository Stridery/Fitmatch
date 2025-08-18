import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm, useFieldArray } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { useUser } from '@/contexts/UserContext'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'

const modes = ['1v1','1v2','Group','Online'] as const
const timeSlots = ['Weekdays Morning','Weekdays Afternoon','Weekdays Evening','Weekend Morning','Weekend Afternoon','Weekend Evening'] as const
const goals = ['Skill Improvement','Competition','Build Interest','Well-being'] as const
const frequencies = ['1–2 per week','3+ per week','Flexible'] as const

const schema = z.object({
  training_modes: z.array(z.string()).default([]),
  available_time_slots: z.array(z.string()).default([]),
  preferred_frequency: z.string().nullable().optional(),
  training_goals: z.array(z.string()).default([]),
  attributes_style: z.array(z.string()).default([]),
  attributes_prefer: z.array(z.string()).default([]),
  attributes_not_prefer: z.array(z.string()).default([]),
  packages: z.array(
    z.object({
      id: z.string().optional(),
      lessons_count: z.coerce.number().int().positive(),
      lesson_duration_minutes: z.coerce.number().int().positive(),
      price: z.coerce.number().positive(),
    })
  ),
  media_file: z.any().optional(),
  media_type: z.enum(['image','video','other']).default('image'),
  media_description: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function CourseEditor() {
  const { id: coachSportId } = useParams()
  const { user } = useUser()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [existingCourseId, setExistingCourseId] = useState<string | null>(null)
  const [signedMediaUrl, setSignedMediaUrl] = useState<string | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      training_modes: [],
      available_time_slots: [],
      preferred_frequency: undefined,
      training_goals: [],
      attributes_style: [],
      attributes_prefer: [],
      attributes_not_prefer: [],
      packages: [],
      media_type: 'image',
    },
  })

  const packagesField = useFieldArray({ control: form.control, name: 'packages' })

  useEffect(() => {
    if (!coachSportId) return
    const run = async () => {
      setLoading(true)
      try {
        const { data: course, error: cErr } = await supabase
          .from('course_detail')
          .select('*')
          .eq('coach_sport_id', coachSportId)
          .maybeSingle()
        if (cErr) throw cErr
        if (course) {
          setExistingCourseId(course.id)
          form.reset({
            training_modes: course.training_modes || [],
            available_time_slots: course.available_time_slots || [],
            preferred_frequency: course.preferred_frequency || undefined,
            training_goals: course.training_goals || [],
            attributes_style: [],
            attributes_prefer: [],
            attributes_not_prefer: [],
            packages: [],
            media_type: 'image',
          })
        }

        const { data: attrs } = await supabase
          .from('course_attributes')
          .select('*')
          .eq('course_id', course?.id || '')

        if (attrs && attrs.length) {
          form.setValue('attributes_style', attrs.filter(a => a.type === 'style').map(a => a.value))
          form.setValue('attributes_prefer', attrs.filter(a => a.type === 'prefer_student').map(a => a.value))
          form.setValue('attributes_not_prefer', attrs.filter(a => a.type === 'not_prefer_student').map(a => a.value))
        }

        const { data: pkgs } = await supabase
          .from('coach_package_prices')
          .select('*')
          .eq('coach_sport_id', coachSportId)
          .order('lessons_count')
        if (pkgs) {
          packagesField.replace(
            pkgs.map((p: any) => ({
              id: p.id,
              lessons_count: p.lessons_count,
              lesson_duration_minutes: p.lesson_duration_minutes,
              price: Number(p.price),
            }))
          )
        }

        const { data: media } = await supabase
          .from('coach_media')
          .select('*')
          .eq('coach_sport_id', coachSportId)
          .maybeSingle()
        if (media?.url) {
          const { data: signed } = await supabase.storage
            .from('coach-media')
            .createSignedUrl(media.url, 3600)
          if (signed?.signedUrl) setSignedMediaUrl(signed.signedUrl)
        }
      } finally {
        setLoading(false)
      }
    }
    run()
  }, [coachSportId])

  const saveAll = async (values: FormValues) => {
    if (!coachSportId || !user) return
    setSaving(true)
    try {
      // upsert course_detail
      let courseId = existingCourseId
      if (!courseId) {
        const { data, error } = await supabase
          .from('course_detail')
          .insert({
            coach_sport_id: coachSportId,
            training_modes: values.training_modes,
            available_time_slots: values.available_time_slots,
            preferred_frequency: values.preferred_frequency || null,
            training_goals: values.training_goals,
          })
          .select('id')
          .single()
        if (error) throw error
        courseId = data.id
        setExistingCourseId(courseId)
      } else {
        const { error } = await supabase
          .from('course_detail')
          .update({
            training_modes: values.training_modes,
            available_time_slots: values.available_time_slots,
            preferred_frequency: values.preferred_frequency || null,
            training_goals: values.training_goals,
          })
          .eq('id', courseId)
        if (error) throw error
      }

      // replace attributes
      if (courseId) {
        await supabase.from('course_attributes').delete().eq('course_id', courseId)
        const rows: any[] = []
        values.attributes_style.forEach(v => rows.push({ course_id: courseId, type: 'style', value: v }))
        values.attributes_prefer.forEach(v => rows.push({ course_id: courseId, type: 'prefer_student', value: v }))
        values.attributes_not_prefer.forEach(v => rows.push({ course_id: courseId, type: 'not_prefer_student', value: v }))
        if (rows.length) await supabase.from('course_attributes').insert(rows)
      }

      // upsert packages
      const { data: existingPkgs } = await supabase
        .from('coach_package_prices')
        .select('id')
        .eq('coach_sport_id', coachSportId)
      const existingIds = new Set((existingPkgs || []).map((p: any) => p.id))
      const newRows = values.packages.filter(p => !p.id).map(p => ({
        coach_sport_id: coachSportId,
        lessons_count: p.lessons_count,
        lesson_duration_minutes: p.lesson_duration_minutes,
        price: p.price,
      }))
      if (newRows.length) await supabase.from('coach_package_prices').insert(newRows)
      const updateRows = values.packages.filter(p => p.id)
      for (const p of updateRows) {
        await supabase
          .from('coach_package_prices')
          .update({ lessons_count: p.lessons_count, lesson_duration_minutes: p.lesson_duration_minutes, price: p.price })
          .eq('id', p.id)
      }
      // delete removed
      const keepIds = new Set(values.packages.filter(p => p.id).map(p => p.id as string))
      for (const id of existingIds) {
        if (!keepIds.has(id)) {
          await supabase.from('coach_package_prices').delete().eq('id', id)
        }
      }

      // handle media upload (single row due to PK constraint)
      const file: File | undefined = (values as any).media_file?.[0]
      if (file) {
        const path = `${user.id}/${coachSportId}/${crypto.randomUUID()}-${file.name}`
        const up = await supabase.storage.from('coach-media').upload(path, file, { upsert: false })
        if (up.error) throw up.error
        await supabase
          .from('coach_media')
          .upsert({
            coach_sport_id: coachSportId,
            coach_id: user.profile?.id || user.id,
            type: values.media_type,
            url: up.data.path,
            description: values.media_description || null,
          })
        const { data: signed } = await supabase.storage.from('coach-media').createSignedUrl(path, 3600)
        if (signed?.signedUrl) setSignedMediaUrl(signed.signedUrl)
      }

      navigate('/coach')
    } finally {
      setSaving(false)
    }
  }

  const deleteMedia = async () => {
    if (!coachSportId) return
    const { data: media } = await supabase.from('coach_media').select('*').eq('coach_sport_id', coachSportId).maybeSingle()
    if (media?.url) {
      await supabase.storage.from('coach-media').remove([media.url])
    }
    await supabase.from('coach_media').delete().eq('coach_sport_id', coachSportId)
    setSignedMediaUrl(null)
  }

  if (loading) return <div className="p-6">Loading…</div>

  return (
    <div className="max-w-3xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">Course, Attributes, Prices & Media</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(saveAll)} className="space-y-8">
          <section className="space-y-3">
            <h3 className="font-medium">Training modes</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {modes.map((m) => (
                <label key={m} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch('training_modes').includes(m)}
                    onCheckedChange={(checked) => {
                      const cur = new Set(form.getValues('training_modes'))
                      if (checked) cur.add(m)
                      else cur.delete(m)
                      form.setValue('training_modes', Array.from(cur))
                    }}
                  />
                  {m}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Available time slots</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {timeSlots.map((t) => (
                <label key={t} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch('available_time_slots').includes(t)}
                    onCheckedChange={(checked) => {
                      const cur = new Set(form.getValues('available_time_slots'))
                      if (checked) cur.add(t)
                      else cur.delete(t)
                      form.setValue('available_time_slots', Array.from(cur))
                    }}
                  />
                  {t}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Preferred frequency</h3>
            <div className="flex flex-wrap gap-2 text-sm">
              {frequencies.map((f) => {
                const selected = form.watch('preferred_frequency') === f
                return (
                  <button
                    type="button"
                    key={f}
                    className={`px-3 py-1 rounded border ${selected ? 'bg-black text-white' : ''}`}
                    onClick={() => form.setValue('preferred_frequency', selected ? undefined : f)}
                  >
                    {f}
                  </button>
                )
              })}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Training goals</h3>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
              {goals.map((g) => (
                <label key={g} className="flex items-center gap-2 text-sm">
                  <Checkbox
                    checked={form.watch('training_goals').includes(g)}
                    onCheckedChange={(checked) => {
                      const cur = new Set(form.getValues('training_goals'))
                      if (checked) cur.add(g)
                      else cur.delete(g)
                      form.setValue('training_goals', Array.from(cur))
                    }}
                  />
                  {g}
                </label>
              ))}
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Attributes</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <div className="text-sm mb-1">Style</div>
                <Textarea value={form.watch('attributes_style').join('\n')} onChange={(e) => form.setValue('attributes_style', e.target.value.split('\n').filter(Boolean))} placeholder="One per line" />
              </div>
              <div>
                <div className="text-sm mb-1">Prefer student</div>
                <Textarea value={form.watch('attributes_prefer').join('\n')} onChange={(e) => form.setValue('attributes_prefer', e.target.value.split('\n').filter(Boolean))} placeholder="One per line" />
              </div>
              <div>
                <div className="text-sm mb-1">Not prefer student</div>
                <Textarea value={form.watch('attributes_not_prefer').join('\n')} onChange={(e) => form.setValue('attributes_not_prefer', e.target.value.split('\n').filter(Boolean))} placeholder="One per line" />
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Packages</h3>
            <div className="space-y-3">
              {packagesField.fields.map((field, idx) => (
                <div key={field.id} className="grid grid-cols-4 gap-3 items-end">
                  <FormField
                    control={form.control}
                    name={`packages.${idx}.lessons_count` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Lessons</FormLabel>
                        <Input type="number" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`packages.${idx}.lesson_duration_minutes` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (min)</FormLabel>
                        <Input type="number" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name={`packages.${idx}.price` as const}
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Price</FormLabel>
                        <Input type="number" step="0.01" {...field} />
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <div className="flex gap-2">
                    <Button type="button" variant="outline" onClick={() => packagesField.remove(idx)}>Remove</Button>
                  </div>
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => packagesField.append({ lessons_count: 1, lesson_duration_minutes: 60, price: 0 })}>Add package</Button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="font-medium">Media</h3>
            {signedMediaUrl ? (
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">Current</div>
                <img src={signedMediaUrl} className="max-h-48 rounded border" />
                <div>
                  <Button type="button" variant="destructive" onClick={deleteMedia}>Delete media</Button>
                </div>
              </div>
            ) : (
              <div className="grid grid-cols-3 gap-3 items-end">
                <FormField
                  control={form.control}
                  name="media_type"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Type</FormLabel>
                      <select className="border rounded px-3 py-2" value={field.value} onChange={(e) => field.onChange(e.target.value)}>
                        <option value="image">image</option>
                        <option value="video">video</option>
                        <option value="other">other</option>
                      </select>
                    </FormItem>
                  )}
                />
                <FormItem>
                  <FormLabel>File</FormLabel>
                  <Input type="file" onChange={(e) => form.setValue('media_file', e.target.files as any)} />
                </FormItem>
                <FormField
                  control={form.control}
                  name="media_description"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Description</FormLabel>
                      <Input {...field} placeholder="optional" />
                    </FormItem>
                  )}
                />
              </div>
            )}
          </section>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>Cancel</Button>
            <Button type="submit" disabled={saving}>{saving ? 'Saving…' : 'Save all'}</Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

