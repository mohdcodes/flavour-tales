'use client'

import { useId, type InputHTMLAttributes } from 'react'

export function Field({
  label,
  error,
  hint,
  className,
  ...props
}: InputHTMLAttributes<HTMLInputElement> & {
  label: string
  error?: string
  hint?: string
}) {
  const id = useId()
  const describedBy = error ? `${id}-error` : hint ? `${id}-hint` : undefined

  return (
    <div className="w-full">
      <label
        htmlFor={id}
        className="mb-2 block font-display text-[0.85rem] font-semibold text-ink"
      >
        {label}
      </label>
      <input
        id={id}
        aria-invalid={error ? true : undefined}
        aria-describedby={describedBy}
        className={[
          'h-14 w-full rounded-card border bg-paper-raised px-4 text-lg tabular',
          'placeholder:text-ink-muted/60',
          'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600',
          error ? 'border-red-700' : 'border-line',
          className ?? '',
        ].join(' ')}
        {...props}
      />
      {error ? (
        <p id={`${id}-error`} className="mt-2 text-[0.8rem] text-red-700">
          {error}
        </p>
      ) : hint ? (
        <p id={`${id}-hint`} className="mt-2 text-[0.8rem] text-ink-muted">
          {hint}
        </p>
      ) : null}
    </div>
  )
}
