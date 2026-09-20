'use client'

import { useEffect, useState } from 'react'

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3)

export function CountUp({
  to,
  durationMs = 900,
  className,
}: {
  to: number
  durationMs?: number
  className?: string
}) {
  const [value, setValue] = useState(to)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setValue(to)
      return
    }

    let frame = 0
    const start = performance.now()
    setValue(0)

    function tick(now: number) {
      const progress = Math.min(1, (now - start) / durationMs)
      setValue(Math.round(easeOutCubic(progress) * to))
      if (progress < 1) frame = requestAnimationFrame(tick)
    }

    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [to, durationMs])

  return <span className={`tabular ${className ?? ''}`}>{value}</span>
}
