import type { FieldError } from 'react-hook-form'
import { Label } from '@/components/ui/label'
import { cn } from '@/lib/utils'

/** 라벨 + 입력 + 오류 문구. */
export function Field({
  label,
  htmlFor,
  error,
  hint,
  className,
  children,
}: {
  label: string
  htmlFor?: string
  error?: FieldError | { message?: string }
  hint?: string
  className?: string
  children: React.ReactNode
}) {
  return (
    <div className={cn('space-y-2', className)}>
      <Label htmlFor={htmlFor}>{label}</Label>
      {children}
      {hint && !error?.message && <p className="text-xs text-muted-foreground">{hint}</p>}
      {error?.message && <p className="text-sm text-destructive">{error.message}</p>}
    </div>
  )
}

export function FormSection({ title, children, actions }: { title: string; children: React.ReactNode; actions?: React.ReactNode }) {
  return (
    <fieldset className="space-y-4 rounded-lg border p-5">
      <div className="flex items-center justify-between gap-2">
        <legend className="text-base font-semibold">{title}</legend>
        {actions}
      </div>
      {children}
    </fieldset>
  )
}

export function Checkbox({ label, ...props }: React.ComponentProps<'input'> & { label: string }) {
  return (
    <label className="flex h-9 items-center gap-2 text-sm">
      <input type="checkbox" className="size-4" {...props} />
      {label}
    </label>
  )
}
