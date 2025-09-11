import { useCallback, useEffect, useMemo, useState } from 'react'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { useForm } from 'react-hook-form'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Form, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Textarea } from '@/components/ui/textarea'

// Schemas
const detailSchema = z.object({
  training_modes: z.array(z.enum(['1v1','1v2','Group','Online'] as const)).min(1, 'Pick at least one'),
  available_time_slots: z.array(z.enum([
    'Weekdays Morning','Weekdays Afternoon','Weekdays Evening',
    'Weekend Morning','Weekend Afternoon','Weekend Evening'
  ] as const)).default([]),
  preferred_frequency: z.enum(['1–2 per week','3+ per week','Flexible'] as const).nullable().optional(),
  training_goals: z.array(z.enum([
    'hobby','skill_progression','varsity_prep','pro_team_prep','career_dev'
  ] as const)).min(1, 'Pick at least one'),
  summary: z.string().min(1, 'Required'),
  about: z.string().max(5000).optional().default(''),
  skill_level: z.enum(['beginner','intermediate','jv','varsity','amateur','semi_pro','pro'] as const).nullable().optional(),
  experience_years: z.enum(['lt1','1_2','3_4','5_plus'] as const).nullable().optional(),
  age_groups: z.array(z.enum(['Kids','Teens','Adults','Seniors'] as const)).default([]),
})

const attrsSchema = z.object({
  style: z.array(z.enum([
    'patient_encouraging','high_intensity','structured','game_based',
    'data_driven','tactics_focus','clear_feedback','supportive_motivating'
  ] as const)).default([]),
  communication_style: z.array(z.enum([
    'direct_concise','supportive','visual_analysis','data_review'
  ] as const)).default([]),
  pace_intensity: z.array(z.enum([
    'intense','balanced','light_beginner_friendly'
  ] as const)).default([]),
  prefer_student: z.array(z.enum([
    'beginner','intermediate','advanced','competitive',
    'kids','teens','adults','seniors',
    'motivated','consistent_attendance','open_to_feedback'
  ] as const)).default([]),
})

const schema = z.object({
  detail: detailSchema,
  attributes: attrsSchema,
})

type FormInput = z.input<typeof schema>
type FormValues = z.infer<typeof schema>

const trainingModes = ['1v1','1v2','Group','Online'] as const
const timeSlots = [
  'Weekdays Morning','Weekdays Afternoon','Weekdays Evening',
  'Weekend Morning','Weekend Afternoon','Weekend Evening',
] as const
const frequency = ['1–2 per week','3+ per week','Flexible'] as const
const goals = ['hobby','skill_progression','varsity_prep','pro_team_prep','career_dev'] as const
const skillLevels = ['beginner','intermediate','jv','varsity','amateur','semi_pro','pro'] as const
const expYears = ['lt1','1_2','3_4','5_plus'] as const
const ageGroups = ['Kids','Teens','Adults','Seniors'] as const

const styleTags = ['patient_encouraging','high_intensity','structured','game_based','data_driven','tactics_focus','clear_feedback','supportive_motivating'] as const
const commTags = ['direct_concise','supportive','visual_analysis','data_review'] as const
const paceTags = ['intense','balanced','light_beginner_friendly'] as const
const preferTags = ['beginner','intermediate','advanced','competitive','kids','teens','adults','seniors','motivated','consistent_attendance','open_to_feedback'] as const

function Chip({ active, label, onClick }: { active: boolean; label: string; onClick: () => void }) {
  return (
    <Button type="button" variant={active ? 'default' : 'outline'} className="text-black" onClick={onClick}>
      {label}
    </Button>
  )
}

function ChipGroupMulti({
  value,
  onChange,
  options,
}: { value: string[]; onChange: (next: string[]) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value.includes(opt)
        return (
          <Chip key={opt} active={active} label={opt} onClick={() => {
            const next = active ? value.filter(v => v !== opt) : [...value, opt]
            onChange(next)
          }} />
        )
      })}
    </div>
  )
}

function ChipGroupSingleNullable({
  value,
  onChange,
  options,
}: { value: string | null | undefined; onChange: (next: string | null) => void; options: readonly string[] }) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => {
        const active = value === opt
        return (
          <Chip key={opt} active={!!active} label={opt} onClick={() => {
            onChange(active ? null : opt)
          }} />
        )
      })}
      {value ? (
        <Button type="button" variant="outline" className="text-black" onClick={() => onChange(null)}>Clear</Button>
      ) : null}
    </div>
  )}

export default function CourseEditorPage() {
  const { coachSportId, courseId } = useParams()
  const location = useLocation() as { state?: { sportName?: string } }
  const navigate = useNavigate()
  const sportName = location.state?.sportName

  const form = useForm<FormInput, any, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      detail: {
        training_modes: [],
        available_time_slots: [],
        preferred_frequency: null,
        training_goals: [],
        summary: '',
        about: '',
        skill_level: null,
        experience_years: null,
        age_groups: [],
      },
      attributes: {
        style: [],
        communication_style: [],
        pace_intensity: [],
        prefer_student: [],
      },
    },
    mode: 'onSubmit',
  })

  const [initialLoading, setInitialLoading] = useState<boolean>(!!courseId)
  const [saving, setSaving] = useState<boolean>(false)

  // Load for edit
  useEffect(() => {
    let isCancelled = false
    async function load() {
      if (!courseId) return setInitialLoading(false)
      try {
        const { data: detail, error: dErr } = await supabase
          .from('course_detail')
          .select('*')
          .eq('id', courseId)
          .maybeSingle()
        if (dErr) throw dErr
        if (!detail) throw new Error('Course not found')

        const { data: attrs, error: aErr } = await supabase
          .from('course_attributes')
          .select('type,value')
          .eq('course_id', courseId)
        if (aErr) throw aErr

        const grouped = {
          style: [] as string[],
          communication_style: [] as string[],
          pace_intensity: [] as string[],
          prefer_student: [] as string[],
        }
        for (const row of (attrs ?? []) as { type: keyof typeof grouped; value: string }[]) {
          if (grouped[row.type]) {
            grouped[row.type].push(row.value)
          }
        }

        form.reset({
          detail: {
            training_modes: detail.training_modes ?? [],
            available_time_slots: detail.available_time_slots ?? [],
            preferred_frequency: (detail.preferred_frequency ?? null) as any,
            training_goals: detail.training_goals ?? [],
            summary: detail.summary ?? '',
            about: detail.about ?? '',
            skill_level: (detail.skill_level ?? null) as any,
            experience_years: (detail.experience_years ?? null) as any,
            age_groups: detail.age_groups ?? [],
          },
          attributes: grouped,
        })
      } catch (e) {
        console.error(e)
        window.alert('Failed to load course')
      } finally {
        if (!isCancelled) setInitialLoading(false)
      }
    }
    load()
    return () => { isCancelled = true }
  }, [courseId])

  // confirm on unload if dirty
  useEffect(() => {
    const handler = (e: BeforeUnloadEvent) => {
      if (form.formState.isDirty) {
        e.preventDefault()
        e.returnValue = ''
      }
    }
    window.addEventListener('beforeunload', handler)
    return () => window.removeEventListener('beforeunload', handler)
  }, [form.formState.isDirty])

  const handleBack = useCallback(() => {
    if (form.formState.isDirty) {
      const ok = window.confirm('You have unsaved changes, leave anyway?')
      if (!ok) return
    }
    navigate(`/coach/sports/${coachSportId}`, { state: { sportName } })
  }, [form.formState.isDirty, coachSportId, navigate, sportName])

  const onSubmit = form.handleSubmit(async (values) => {
    if (!coachSportId) return
    try {
      setSaving(true)
      let targetCourseId = courseId ?? null
      const detail = values.detail
      if (!targetCourseId) {
        const { data, error } = await supabase
          .from('course_detail')
          .insert([{ ...detail, coach_sport_id: coachSportId }])
          .select('id')
          .single()
        if (error) throw error
        targetCourseId = data.id
      } else {
        const { error } = await supabase
          .from('course_detail')
          .update({ ...detail })
          .eq('id', targetCourseId)
        if (error) throw error
      }

      // Attributes replace strategy
      if (targetCourseId) {
        if (courseId) {
          const { error: delErr } = await supabase
            .from('course_attributes')
            .delete()
            .eq('course_id', targetCourseId)
          if (delErr) throw delErr
        }

        const rows: { course_id: string; type: string; value: string }[] = []
        const { attributes } = values
        const pushRows = (type: keyof typeof attributes) => {
          for (const v of attributes[type] ?? []) {
            rows.push({ course_id: targetCourseId as string, type, value: v })
          }
        }
        pushRows('style')
        pushRows('communication_style')
        pushRows('pace_intensity')
        pushRows('prefer_student')
        if (rows.length > 0) {
          const { error: insErr } = await supabase.from('course_attributes').insert(rows)
          if (insErr) throw insErr
        }
      }

      window.alert('Saved')
      navigate(`/coach/sports/${coachSportId}`, { state: { sportName } })
    } catch (e: any) {
      console.error(e)
      window.alert(e?.message ?? 'Failed to save')
    } finally {
      setSaving(false)
    }
  })

  const detail = form.watch('detail')
  const attributes = form.watch('attributes')

  return (
    <div className="p-6">
      <div className="mb-4">
        <Button type="button" variant="outline" className="text-black" onClick={handleBack}>{'←'} Back</Button>
      </div>

      <h1 className="text-xl font-semibold mb-4">{courseId ? 'Edit Course' : 'Create Course'}</h1>
      {initialLoading ? (
        <div className="space-y-2">
          <div className="h-6 w-40 bg-gray-100 rounded" />
          <div className="h-5 w-72 bg-gray-100 rounded" />
          <div className="h-64 bg-gray-100 rounded" />
        </div>
      ) : (
        <Form {...form}>
          <form onSubmit={onSubmit} className="space-y-6 pb-24">
            <Card>
              <CardHeader>
                <CardTitle>Basics</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={"detail.training_modes"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Training modes</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={trainingModes} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"detail.training_goals"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Goals</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={goals} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"detail.summary"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Summary</FormLabel>
                      <Textarea value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} rows={3} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Availability</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={"detail.available_time_slots"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Time slots</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={timeSlots} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"detail.preferred_frequency"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred frequency</FormLabel>
                      <ChipGroupSingleNullable value={(field.value ?? null) as string | null} onChange={(v) => field.onChange(v)} options={frequency} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Audience</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={"detail.skill_level"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Skill level</FormLabel>
                      <ChipGroupSingleNullable value={(field.value ?? null) as string | null} onChange={(v) => field.onChange(v)} options={skillLevels} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"detail.experience_years"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Experience years</FormLabel>
                      <ChipGroupSingleNullable value={(field.value ?? null) as string | null} onChange={(v) => field.onChange(v)} options={expYears} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"detail.age_groups"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Age groups</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={ageGroups} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Coach Profile</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={"detail.about"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>About</FormLabel>
                      <Textarea value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} rows={6} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Styles & Preferences</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <FormField
                  control={form.control}
                  name={"attributes.style"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Style</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={styleTags} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"attributes.communication_style"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Communication style</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={commTags} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"attributes.pace_intensity"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Pace & intensity</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={paceTags} />
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name={"attributes.prefer_student"}
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Preferred students</FormLabel>
                      <ChipGroupMulti value={(field.value ?? []) as string[]} onChange={field.onChange} options={preferTags} />
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
            </Card>

            <div className="fixed bottom-0 left-0 right-0 bg-white border-t shadow-sm p-3">
              <div className="max-w-5xl mx-auto flex items-center justify-between">
                <Button type="button" variant="outline" className="text-black" onClick={handleBack}>Cancel</Button>
                <Button type="submit" className="text-black" disabled={saving}>{saving ? 'Saving...' : 'Save'}</Button>
              </div>
            </div>
          </form>
        </Form>
      )}
    </div>
  )
}

