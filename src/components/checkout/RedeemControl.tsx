'use client'

import { REDEMPTION_FLOOR, canRedeem } from '@/lib/loyalty'
import { formatRupees } from '@/lib/format'

export function RedeemControl({
  balance,
  maxRedeem,
  enabled,
  onToggle,
}: {
  balance: number
  maxRedeem: number
  enabled: boolean
  onToggle: (next: boolean) => void
}) {
  if (!canRedeem(balance)) {
    if (balance <= 0) return null
    return (
      <p className="text-[0.8rem] text-ink-muted">
        {REDEMPTION_FLOOR - balance} points to your next free bite.
      </p>
    )
  }

  return (
    <div className="rounded-card bg-violet-100 p-4">
      <label className="flex cursor-pointer items-center justify-between gap-3">
        <span className="font-display text-[0.95rem] font-semibold text-violet-900">
          Use {maxRedeem} points
        </span>
        <span className="relative inline-flex">
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onToggle(event.target.checked)}
            className="peer sr-only"
          />
          <span className="block h-7 w-12 rounded-pill bg-violet-900/20 transition-colors peer-checked:bg-gold-500 peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-violet-600" />
          <span className="pointer-events-none absolute top-1 left-1 h-5 w-5 rounded-full bg-white transition-transform peer-checked:translate-x-5" />
        </span>
      </label>
      <p className="mt-1 text-[0.8rem] text-gold-700">
        Saves you {formatRupees(maxRedeem)} on this order
      </p>
    </div>
  )
}
