import * as React from 'react'
import type { RefCallback } from 'react'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'

/** ================== Shared Types ================== */
/** 把 RHF 的 field 形状抽象出来，避免强绑定 RHF 版本 */
export type RHFFieldBase<T extends HTMLElement = HTMLInputElement> = {
  value: unknown
  onChange: (v: unknown) => void
  onBlur: () => void
  name: string
  ref: RefCallback<T>
}

/** 工具：收敛成 DOM 可接受的 string 值 */
function toStringValue(v: unknown): string {
  if (v == null) return ''
  return typeof v === 'string' ? v : String(v)
}

/** ================== Text / String Input ================== */
export type RHFStringInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'name' | 'ref' | 'onBlur'
> & {
  field: RHFFieldBase<HTMLInputElement>
}

/** 安全的文本输入适配器（解决 field.value 是联合类型时的 DOM value 类型报错） */
export function RHFStringInput({ field, ...rest }: RHFStringInputProps) {
  return (
    <Input
      {...rest}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      value={toStringValue(field.value)}
      onChange={(e) => field.onChange(e.target.value)}
    />
  )
}

/** ================== Textarea ================== */
export type RHFTextareaProps = Omit<
  React.ComponentProps<typeof Textarea>,
  'value' | 'onChange' | 'name' | 'ref' | 'onBlur'
> & {
  field: RHFFieldBase<HTMLTextAreaElement>
}

/** 安全的多行文本输入适配器 */
export function RHFTextarea({ field, ...rest }: RHFTextareaProps) {
  return (
    <Textarea
      {...rest}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      value={toStringValue(field.value)}
      onChange={(e) => field.onChange(e.target.value)}
    />
  )
}

/** ================== Number Input ================== */
/**
 * 一个安全的数字输入适配器：
 * - 将 field.value: unknown 缩到 DOM 可接受的类型（string | number | undefined）
 * - onChange：'' → ''（受控空）；否则 Number(raw)
 * - 可选 preParse：比如去掉千分位、货币符号等
 * - 完全沿用项目的 <Input> 外观
 */
export type RHFNumberInputProps = Omit<
  React.ComponentProps<typeof Input>,
  'value' | 'onChange' | 'type' | 'defaultValue' | 'name' | 'ref' | 'onBlur'
> & {
  /** RHF render={({ field }) => ...} 里传进来的 field */
  field: RHFFieldBase<HTMLInputElement>
  /**
   * 允许输入为空（空串）。默认 true：
   * - true：空串保持为 ''，不转数字
   * - false：空串当作 0
   */
  allowEmpty?: boolean
  /** 将输入映射为 number 前的自定义清洗（可选） */
  preParse?: (raw: string) => string
}

export function RHFNumberInput({
  field,
  allowEmpty = true,
  preParse,
  step,
  ...rest
}: RHFNumberInputProps) {
  const domValue =
    field.value === undefined || field.value === null
      ? ''
      : typeof field.value === 'number'
        ? (Number.isFinite(field.value) ? field.value : '')
        : String(field.value)

  return (
    <Input
      {...rest}
      type="number"
      step={step}
      name={field.name}
      ref={field.ref}
      onBlur={field.onBlur}
      value={domValue}
      onChange={(e) => {
        let raw = e.target.value
        if (preParse) raw = preParse(raw)
        if (raw === '') {
          field.onChange(allowEmpty ? '' : 0)
          return
        }
        // 不用 valueAsNumber，避免 NaN 干扰
        const n = Number(raw)
        field.onChange(Number.isNaN(n) ? '' : n)
      }}
    />
  )
}


export function RHFSelectString({
  field,
  options,
  onChange, // 可选地透传外部回调
  getValue, // 当 Combobox onChange 返回对象时如何取值
  ...rest
}: {
  field: RHFFieldBase<HTMLInputElement>
  options: Array<{ value: string; label: string }>
  onChange?: (v: string) => void
  getValue?: (arg: unknown) => string | undefined
} & Omit<React.ComponentProps<any>, 'value' | 'onChange'>) {
  const value = typeof field.value === 'string' ? field.value : ''
  const handleChange = (arg: unknown) => {
    const v = (typeof arg === 'string'
      ? arg
      : (rest as any).value !== undefined
      ? String((rest as any).value)
      : undefined) ?? (getValue ? getValue(arg) : (arg as any)?.value)
    const next = v ?? ''
    field.onChange(next)
    onChange?.(next)
  }
  const Cmb = (rest as any).as || (rest as any).component || (rest as any).Combobox || (rest as any)
  return (
    <Cmb
      {...rest}
      options={options}
      value={value}
      onChange={handleChange}
    />
  )
}