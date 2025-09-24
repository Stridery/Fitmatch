import type { Controller, FieldPath, FieldValues, UseControllerProps } from 'react-hook-form'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

type BaseProps<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>> = {
  name: TName
  label?: string
  placeholder?: string
  disabled?: boolean
} & Pick<UseControllerProps<TFieldValues, TName>, 'control' >

export function RHFStringInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: BaseProps<TFieldValues, TName>
) {
  const { control, name, label, placeholder, disabled } = props
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            <Input {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function RHFTextarea<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: BaseProps<TFieldValues, TName>
) {
  const { control, name, label, placeholder, disabled } = props
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            <Textarea {...field} value={field.value ?? ''} onChange={(e) => field.onChange(e.target.value)} placeholder={placeholder} disabled={disabled} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

export function RHFNumberInput<TFieldValues extends FieldValues, TName extends FieldPath<TFieldValues>>(
  props: BaseProps<TFieldValues, TName>
) {
  const { control, name, label, placeholder, disabled } = props
  return (
    <FormField
      control={control}
      name={name}
      render={({ field }) => (
        <FormItem>
          {label ? <FormLabel>{label}</FormLabel> : null}
          <FormControl>
            <Input
              type="number"
              value={field.value ?? ''}
              onChange={(e) => {
                const value = e.target.value
                const parsed = value === '' ? undefined : Number(value)
                field.onChange(parsed)
              }}
              placeholder={placeholder}
              disabled={disabled}
              inputMode="numeric"
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />
  )
}

