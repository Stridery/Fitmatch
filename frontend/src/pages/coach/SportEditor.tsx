import { useForm } from 'react-hook-form'
import { z } from 'zod'
import { zodResolver } from '@hookform/resolvers/zod'
import { Form } from '@/components/ui/form'
import { RHFStringInput, RHFTextarea } from '@/components/form/inputs'
import { Button } from '@/components/ui/button'
import { useParams } from 'react-router-dom'
import { supabase } from '@/lib/supabase'

const schema = z.object({
  self_intro: z.string().min(1).optional(),
  experience_years: z.string().optional(),
  certificate_type: z.string().optional(),
})

type FormInput = z.input<typeof schema>
type FormValues = z.output<typeof schema>

export default function SportEditor() {
  const { id } = useParams()
  const form = useForm<FormInput, any, FormValues>({
    resolver: zodResolver(schema),
    defaultValues: { self_intro: '', experience_years: '', certificate_type: '' }
  })

  const onSubmit = async (values: FormValues) => {
    if (!id) return
    await supabase.from('coach_sports').update(values).eq('id', id)
    alert('Saved')
  }

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold mb-4">Edit Sport</h1>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4 max-w-xl">
          <RHFTextarea control={form.control} name={'self_intro'} label="Self introduction" placeholder="Introduce yourself" />
          <RHFStringInput control={form.control} name={'experience_years'} label="Experience years" placeholder="e.g. 3–5 years" />
          <RHFStringInput control={form.control} name={'certificate_type'} label="Certificate type" placeholder="e.g. NASM CPT" />
          <Button type="submit">Save</Button>
        </form>
      </Form>
    </div>
  )
}

