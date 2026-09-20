'use client'

import { PointsRing } from '@/components/success/PointsRing'
import { DoodleField } from '@/components/brand/Doodles'
import { REDEMPTION_FLOOR, canRedeem } from '@/lib/loyalty'
import { formatPoints } from '@/lib/format'

export function BalanceCard({ balance, name }: { balance: number; name: string | null }) {
  const unlocked = canRedeem(balance)

  return (
    <div className="relative overflow-hidden rounded-card bg-violet-700 p-5 text-white">
      <DoodleField className="text-white" />
      <div className="relative flex items-center gap-5">
        <div className="rounded-full bg-paper-raised p-1">
          <PointsRing balance={balance} />
        </div>
        <div className="min-w-0">
          {name ? (
            <p className="font-display text-lg font-bold">{name}</p>
          ) : (
            <p className="font-display text-lg font-bold">Your points</p>
          )}
          <p className="mt-1 text-[0.85rem] text-white/80">
            {unlocked
              ? `${formatPoints(balance)} ready to spend.`
              : `${REDEMPTION_FLOOR - balance} points to your next free bite.`}
          </p>
          {unlocked ? (
            <span className="mt-2 inline-block rounded-pill bg-gold-500 px-3 py-1 text-[0.7rem] font-semibold text-violet-900">
              Ready to spend
            </span>
          ) : null}
        </div>
      </div>
    </div>
  )
}
