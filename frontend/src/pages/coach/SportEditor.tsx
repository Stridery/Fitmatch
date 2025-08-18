import { useEffect, useMemo, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { supabase } from '@/lib/supabase'
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Switch } from '@/components/ui/switch'
import { Button } from '@/components/ui/button'
import { Combobox } from '@/components/ui/combobox'
import { useUser } from '@/contexts/UserContext'

const schema = z.object({
  sport_id: z.string().min(1, 'Select a sport'),
  self_intro: z.string().min(1, 'Required'),
  experience_years: z.string().min(1, 'Required'),
  has_certificate: z.boolean().default(false),
  certificate_type: z.string().optional(),
})

type FormValues = z.infer<typeof schema>

export default function SportEditor() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useUser()
  const [sports, setSports] = useState<{ id: string; name: string }[]>([])
  const [loading, setLoading] = useState(false)
  const [file, setFile] = useState<File | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      sport_id: '',
      self_intro: '',
      experience_years: '',
      has_certificate: false,
      certificate_type: '',
    },
  })

  useEffect(() => {
    supabase.from('sports').select('id,name').then(({ data }) => setSports((data as any) || []))
  }, [])

  useEffect(() => {
    if (!id) return
    const run = async () => {
      const { data, error } = await supabase.from('coach_sports').select('*').eq('id', id).single()
      if (!error && data) {
        form.reset({
          sport_id: data.sport_id,
          self_intro: data.self_intro ?? '',
          experience_years: data.experience_years ?? '',
          has_certificate: Boolean(data.has_certificate),
          certificate_type: data.certificate_type ?? '',
        })
      }
    }
    run()
  }, [id])

  const onSubmit = async (values: FormValues) => {
    if (!user) return
    setLoading(true)
    try {
      if (id) {
        const { error } = await supabase
          .from('coach_sports')
          .update({
            sport_id: values.sport_id,
            self_intro: values.self_intro,
            experience_years: values.experience_years,
            has_certificate: values.has_certificate,
            certificate_type: values.certificate_type ?? null,
          })
          .eq('id', id)
        if (error) throw error
      } else {
        const { data, error } = await supabase
          .from('coach_sports')
          .insert({
            coach_id: user.id,
            sport_id: values.sport_id,
            self_intro: values.self_intro,
            experience_years: values.experience_years,
            has_certificate: values.has_certificate,
            certificate_type: values.certificate_type ?? null,
            status: 'pending',
          })
          .select('id')
          .single()
        if (error) throw error
        if (file) {
          const path = `${user.id}/${data.id}.pdf`
          const up = await supabase.storage.from('certificate').upload(path, file, { upsert: true })
          if (up.error) throw up.error
          await supabase.from('coach_sports').update({ certificate_url: up.data?.path || path }).eq('id', data.id)
        }
      }
      navigate('/coach')
    } catch (e) {
      // noop: toast could be added
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-2xl mx-auto p-6">
      <h2 className="text-xl font-semibold mb-4">{id ? 'Edit Sport Profile' : 'Create Sport Profile'}</h2>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={form.control}
            name="sport_id"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Sport</FormLabel>
                <Combobox
                  options={sports.map((s) => ({ value: s.id, label: s.name }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select sport"
                />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="self_intro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Self introduction</FormLabel>
                <Textarea {...field} placeholder="Introduce yourself" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="experience_years"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Experience years</FormLabel>
                <Input {...field} placeholder="e.g. 3–5 years" />
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="has_certificate"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Has certificate</FormLabel>
                <div className="flex items-center gap-3">
                  <Switch checked={field.value} onCheckedChange={field.onChange} />
                </div>
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="certificate_type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Certificate type</FormLabel>
                <Input {...field} placeholder="e.g. NSCA CSCS" />
                <FormMessage />
              </FormItem>
            )}
          />

          <div>
            <FormLabel>Upload certificate (image/pdf)</FormLabel>
            <Input
              type="file"
              accept="image/*,.pdf"
              onChange={(e) => {
                const f = e.target.files?.[0]
                if (f) setFile(f)
              }}
            />
          </div>

          <div className="flex gap-3">
            <Button type="button" variant="outline" onClick={() => navigate(-1)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving…' : 'Save'}
            </Button>
          </div>
        </form>
      </Form>
    </div>
  )
}

