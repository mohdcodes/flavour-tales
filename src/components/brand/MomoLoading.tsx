'use client'

import { useEffect, useState } from 'react'
import { MomoLoader } from '@/components/brand/MomoLoader'

const DEFAULT_LINES = ['Folding the pleats…', 'Waking the steamer…', 'Warming the plate…']

function useRotatingLine(lines: string[], intervalMs = 1600) {
  const [index, setIndex] = useState(0)

  useEffect(() => {
    if (lines.length < 2) return
    const id = setInterval(() => setIndex((i) => (i + 1) % lines.length), intervalMs)
    return () => clearInterval(id)
  }, [lines, intervalMs])

  return lines[index] ?? ''
}

/** Centred loader for a whole screen or a panel sitting on paper. */
export function MomoLoading({
  lines = DEFAULT_LINES,
  className,
}: {
  lines?: string[]
  className?: string
}) {
  const line = useRotatingLine(lines)

  return (
    <div
      role="status"
      aria-live="polite"
      className={`flex flex-col items-center justify-center gap-4 py-20 ${className ?? ''}`}
    >
      <MomoLoader className="h-20 w-20 text-violet-600" />
      <p className="text-[0.85rem] text-ink-muted transition-opacity duration-300">{line}</p>
    </div>
  )
}

/** Blocking overlay, for a commit the customer must not interrupt. */
export function MomoLoadingOverlay({
  lines = DEFAULT_LINES,
  open,
}: {
  lines?: string[]
  open: boolean
}) {
  const line = useRotatingLine(lines)

  if (!open) return null

  return (
    <div
      role="status"
      aria-live="assertive"
      className="fixed inset-0 z-50 flex flex-col items-center justify-center gap-5 bg-violet-700/95 backdrop-blur-sm"
    >
      <MomoLoader className="h-28 w-28 text-white" />
      <p className="font-display text-base font-semibold text-white">{line}</p>
    </div>
  )
}
