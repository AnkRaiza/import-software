// Form field primitives that forward refs so they plug directly into
// react-hook-form's register(). Each renders a label, the control, and an
// optional error message.

import {
  forwardRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from 'react'
import clsx from 'clsx'

const controlBase =
  'w-full rounded-lg border bg-surface px-3 py-2 text-sm text-text outline-none transition placeholder:text-muted focus:border-primary'

function FieldShell({
  label,
  error,
  required,
  children,
}: {
  label: string
  error?: string
  required?: boolean
  children: ReactNode
}) {
  return (
    <label className="block">
      <span className="mb-1 block text-sm font-medium">
        {label}
        {required && <span className="text-negative"> *</span>}
      </span>
      {children}
      {error && <span className="mt-1 block text-xs text-negative">{error}</span>}
    </label>
  )
}

export const TextField = forwardRef<
  HTMLInputElement,
  InputHTMLAttributes<HTMLInputElement> & { label: string; error?: string }
>(function TextField({ label, error, required, className, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} required={required}>
      <input
        ref={ref}
        className={clsx(controlBase, error ? 'border-negative' : 'border-border', className)}
        {...props}
      />
    </FieldShell>
  )
})

export const SelectField = forwardRef<
  HTMLSelectElement,
  SelectHTMLAttributes<HTMLSelectElement> & {
    label: string
    error?: string
    children: ReactNode
  }
>(function SelectField({ label, error, required, className, children, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} required={required}>
      <select
        ref={ref}
        className={clsx(controlBase, error ? 'border-negative' : 'border-border', className)}
        {...props}
      >
        {children}
      </select>
    </FieldShell>
  )
})

export const TextAreaField = forwardRef<
  HTMLTextAreaElement,
  TextareaHTMLAttributes<HTMLTextAreaElement> & { label: string; error?: string }
>(function TextAreaField({ label, error, required, className, ...props }, ref) {
  return (
    <FieldShell label={label} error={error} required={required}>
      <textarea
        ref={ref}
        className={clsx(controlBase, 'min-h-20 resize-y', error ? 'border-negative' : 'border-border', className)}
        {...props}
      />
    </FieldShell>
  )
})
