'use client'

import { useEffect, useState } from 'react'
import { REDEMPTION_FLOOR, canRedeem } from '@/lib/loyalty'
import { Doodle } from '@/components/brand/Doodles'

const SIZE = 112
const STROKE = 9
const RADIUS = (SIZE - STROKE) / 2
const CIRCUMFERENCE = 2 * Math.PI * RADIUS

export function PointsRing({ balance }: { balance: number }) {
  const target = Math.min(balance, REDEMPTION_FLOOR) / REDEMPTION_FLOOR
  const [progress, setProgress] = useState(0)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setProgress(target)
      return
    }
    const frame = requestAnimationFrame(() => setProgress(target))
    return () => cancelAnimationFrame(frame)
  }, [target])

  return (
    <div className="relative" style={{ width: SIZE, height: SIZE }}>
      <svg width={SIZE} height={SIZE} className="-rotate-90" aria-hidden="true">
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          className="stroke-violet-100"
        />
        <circle
          cx={SIZE / 2}
          cy={SIZE / 2}
          r={RADIUS}
          fill="none"
          strokeWidth={STROKE}
          strokeLinecap="round"
          className="stroke-gold-500 transition-[stroke-dashoffset] duration-700 ease-out"
          strokeDasharray={CIRCUMFERENCE}
          strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
        />
      </svg>

      <div className="absolute inset-0 flex flex-col items-center justify-center">
        {/* Explicit colour: this ring also sits on the violet balance card,
            where an inherited text-white would be invisible on its white disc. */}
        <span className="tabular font-display text-3xl leading-none font-bold text-ink">
          {balance}
        </span>
        <span className="text-[0.65rem] text-ink-muted">points</span>
      </div>

      {canRedeem(balance) ? (
        <Doodle
          name="star"
          className="absolute -top-1 -right-1 h-7 w-7 text-gold-500"
        />
      ) : null}
    </div>
  )
}
