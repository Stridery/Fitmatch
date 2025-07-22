import { useEffect, useState } from 'react';
import { useNavigate } from "react-router-dom"
import { useFieldArray, useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';

import { supabase } from '@/lib/supabase';

import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Switch } from '@/components/ui/switch';
import { Button } from '@/components/ui/button';
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from '@/components/ui/form';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Combobox } from '@/components/ui/combobox';

const formSchema = z.object({
  sport_id: z.string().min(1, 'Please select a sport'),
  self_intro: z.string().min(10, 'Please enter at least 10 characters'),
  experience_years: z.string(),
  education_and_experience: z.array(
    z.object({
      year: z.string(),
      description: z.string()
    })
  ),
  has_certificate: z.boolean(),
  certificate_type: z.string().optional(),
}).refine(
  (data) => {
    if (!data.has_certificate) return true
    return !!data.certificate_type?.trim()
  },
  {
    path: ["certificate_type"],
    message: "Certificate type is required when you have a certificate"
  }
)

type FormData = z.infer<typeof formSchema>;

export default function CoachApplicationForm() {
  const navigate = useNavigate()
  const [sports, setSports] = useState<{ id: string; name: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      has_certificate: false,
    },
  });

  const { fields, append, remove } = useFieldArray({
    control: form.control,
    name: "education_and_experience",
  });

  const onSubmit = async (data: FormData) => {
  const { data: { session }, error } = await supabase.auth.getSession();

  if (!session || error) {
    alert("Session incorrect, please log in again.");
    navigate("/login");
    return;
  }

  const coach_id = session.user.id;

    // 1️⃣ 先插入申请记录
    const { data: inserted, error: insertError } = await supabase
      .from("coach_sports")
      .insert({
        coach_id,
        sport_id: data.sport_id,
        self_intro: data.self_intro,
        experience_years: data.experience_years,
        education_and_experience: data.education_and_experience,
        has_certificate: data.has_certificate,
        certificate_type: data.certificate_type ?? null,
        status: "pending",
      })
      .select("id")
      .single();

    if (insertError || !inserted) {
      console.error("Error creating application:", insertError);
      alert("Failed to submit application. Please try again later.");
      return;
    }

    const coach_sports_id = inserted.id;

    // 2️⃣ 上传文件
    let certificate_url = null;
    console.log("file", certificateFile)
    if (certificateFile) {
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("certificate")
        .upload(
          `${coach_id}/${coach_sports_id}.pdf`,
          certificateFile
        );

      if (uploadError) {
        console.error("Upload failed", uploadError);

        // ⚠️ 手动回滚数据库记录
        await supabase
          .from("coach_sports")
          .delete()
          .eq("id", coach_sports_id);

        alert("Failed to upload certificate. Please try again.");
        return;
      }

      certificate_url = uploadData.path;

      // 更新记录 certificate_url
      const { error: updateError } = await supabase
        .from("coach_sports")
        .update({ certificate_url })
        .eq("id", coach_sports_id);

      if (updateError) {
        console.error("Error updating certificate_url:", updateError);

        // ⚠️ 手动回滚数据库记录
        await supabase
          .from("coach_sports")
          .delete()
          .eq("id", coach_sports_id);

        // ⚠️ 手动删除刚刚上传的文件
        await supabase
          .storage
          .from("certificate")
          .remove([certificate_url]);

        alert("Failed to update certificate. Please try again.");
        return;
      }
    }

    alert("Application submitted successfully!");
    navigate("/dashboard");
  };

  const trainingModes = ['1v1', '1v2', 'Group', 'Online'];
  const timeSlots = [
    'Weekdays Morning',
    'Weekdays Afternoon',
    'Weekdays Evening',
    'Weekend Morning',
    'Weekend Afternoon',
    'Weekend Evening',
  ];
  const frequencies = ['1–2 per week', '3+ per week', 'Flexible'];
  const goals = ['Skill Improvement', 'Competition', 'Build Interest', 'Well-being'];
  const experienceYears = ['1 year or less', '1–3 years', '3–5 years', '5+ years'];
  const [certificateFile, setCertificateFile] = useState<File | null>(null)

  useEffect(() => {
    supabase
      .from('sports')
      .select('id, name')
      .then(({ data, error }) => {
        if (error) console.error(error);
        else if (data) setSports(data);
      });
  }, []);

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 max-w-2xl mx-auto">
        <FormField
          control={form.control}
          name="sport_id"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Sport</FormLabel>
              <Combobox
                options={sports.map(s => ({ label: s.name, value: s.id }))}
                placeholder="Select a sport"
                value={field.value}
                onChange={field.onChange}
                
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
              <FormLabel>Self Introduction</FormLabel>
              <Textarea placeholder="Introduce yourself" {...field} />
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="experience_years"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Experience Years</FormLabel>
              <RadioGroup
                onValueChange={field.onChange}
                defaultValue={field.value}
                className="space-y-2"
              >
                {experienceYears.map(v => (
                  <FormItem key={v} className="flex items-center gap-2">
                    <FormControl>
                      <RadioGroupItem
                        value={v}
                        className="data-[state=checked]:border-primary data-[state=checked]:bg-primary"
                      />
                    </FormControl>
                    <FormLabel>{v}</FormLabel>
                  </FormItem>
                ))}
              </RadioGroup>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Education & Experience</FormLabel>

          <div className="space-y-4">
            {fields.map((item, index) => (
              <div key={item.id} className="flex flex-col gap-2">
                <div className="flex gap-2 items-start">
                  <FormControl className="w-32">
                    <Input
                      placeholder="Year"
                      {...form.register(`education_and_experience.${index}.year` as const)}
                    />
                  </FormControl>
                  <FormControl className="flex-1">
                    <Textarea
                      placeholder="Description"
                      className="h-24"
                      {...form.register(`education_and_experience.${index}.description` as const)}
                    />
                  </FormControl>
                  <Button type="button" variant="destructive" onClick={() => remove(index)}>Remove</Button>
                </div>
              </div>
            ))}
          </div>

          <Button
            type="button"
            variant="outline"
            onClick={() => append({ year: "", description: "" })}
            className="mt-2 text-black"
          >
            Add Experience
          </Button>
        </FormItem>

        

        <FormField
          control={form.control}
          name="has_certificate"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Has Certificate?</FormLabel>
              <Switch checked={field.value} onCheckedChange={field.onChange} />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="certificate_type"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Certificate Type</FormLabel>
              <Input placeholder="Certificate name" {...field} />
            </FormItem>
          )}
        />

        <FormItem>
          <FormLabel>Upload Certificate</FormLabel>
          <Input
            type="file"
            accept="image/*,.pdf"
            onChange={(e) => {
              if (e.target.files?.[0]) {
                setCertificateFile(e.target.files[0])
              }
            }}
          />
          <p className="text-sm text-muted-foreground mt-1">
            Please upload <strong>one most representative certificate</strong>.
          </p>
          <FormMessage />
        </FormItem>

        <Button type="submit" className="w-full">Submit Application</Button>
      </form>
    </Form>
  );
}