import type { ComponentProps, ReactNode } from 'react'
import { AlertCircle, ChevronDown } from 'lucide-react'
import { cn } from '@/utils/cn'
import { controlBase, controlStyles, type ControlSize } from './form-styles'

interface FieldProps {
  label?: ReactNode
  htmlFor?: string
  error?: string | null
  hint?: ReactNode
  required?: boolean
  className?: string
  children: ReactNode
}

/** Label + control + hint/error, wired for aria-describedby via `${htmlFor}-error` / `${htmlFor}-hint`. */
export function Field({ label, htmlFor, error, hint, required, className, children }: FieldProps) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      {label && (
        <label htmlFor={htmlFor} className="text-[13px] font-medium text-fg-2">
          {label}
          {required && (
            <span className="ml-0.5 text-red-300" aria-hidden>
              *
            </span>
          )}
        </label>
      )}
      {children}
      {error ? (
        <p id={htmlFor ? `${htmlFor}-error` : undefined} className="flex items-center gap-1 text-xs text-red-300">
          <AlertCircle className="size-3.5 shrink-0" aria-hidden />
          {error}
        </p>
      ) : hint ? (
        <p id={htmlFor ? `${htmlFor}-hint` : undefined} className="text-xs text-fg-3">
          {hint}
        </p>
      ) : null}
    </div>
  )
}

type InputProps = Omit<ComponentProps<'input'>, 'size'> & { controlSize?: ControlSize }

export function Input({ className, controlSize = 'md', ...props }: InputProps) {
  return <input className={controlStyles(controlSize, className)} {...props} />
}

type SelectProps = Omit<ComponentProps<'select'>, 'size'> & {
  controlSize?: ControlSize
  wrapperClassName?: string
}

export function Select({ className, wrapperClassName, controlSize = 'md', children, ...props }: SelectProps) {
  return (
    <div className={cn('relative min-w-0', wrapperClassName)}>
      <select className={controlStyles(controlSize, cn('appearance-none pr-9', className))} {...props}>
        {children}
      </select>
      <ChevronDown
        className="pointer-events-none absolute top-1/2 right-3 size-4 -translate-y-1/2 text-fg-3"
        aria-hidden
      />
    </div>
  )
}

export function Textarea({ className, ...props }: ComponentProps<'textarea'>) {
  return <textarea className={cn(controlBase, 'min-h-[110px] resize-y px-3 py-2.5 text-sm', className)} {...props} />
}

type CheckboxProps = Omit<ComponentProps<'input'>, 'type'> & { label: ReactNode }

export function Checkbox({ label, className, id, ...props }: CheckboxProps) {
  return (
    <label htmlFor={id} className={cn('inline-flex cursor-pointer items-center gap-2 text-sm text-fg-2', className)}>
      <input
        id={id}
        type="checkbox"
        className="size-4 cursor-pointer rounded border-line-strong bg-raised accent-brand"
        {...props}
      />
      {label}
    </label>
  )
}
