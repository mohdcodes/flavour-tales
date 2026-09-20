'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

const VIOLET = '#5A3BA8'
const GOLD = '#F2A93B'
const CREAM = '#FBF8F3'

export function Confetti({ intensity = 'normal' }: { intensity?: 'normal' | 'milestone' }) {
  // React Strict Mode double-invokes effects in development; without this guard
  // the burst fires twice.
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    // The four-point sparkle from the doodle set, reused as a particle.
    const star = confetti.shapeFromPath({
      path: 'M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z',
    })

    const base = {
      origin: { y: 0.42 },
      colors: [VIOLET, GOLD, CREAM],
      shapes: [star, 'circle' as const],
      scalar: 1.1,
      disableForReducedMotion: true,
    }

    confetti({
      ...base,
      particleCount: intensity === 'milestone' ? 160 : 70,
      spread: intensity === 'milestone' ? 100 : 62,
    })

    if (intensity === 'milestone') {
      setTimeout(
        () => confetti({ ...base, particleCount: 80, spread: 120, startVelocity: 38 }),
        220,
      )
    }
  }, [intensity])

  return null
}
