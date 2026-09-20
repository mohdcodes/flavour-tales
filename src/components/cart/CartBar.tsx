'use client'

import { useCart, selectSubtotal, selectItemCount } from '@/store/cart'
import { pointsEarnedFor } from '@/lib/loyalty'
import { formatRupees } from '@/lib/format'

export function CartBar({ onOpen }: { onOpen: () => void }) {
  const subtotal = useCart(selectSubtotal)
  const count = useCart(selectItemCount)

  if (count === 0) return null

  return (
    <div className="fixed inset-x-0 bottom-0 z-30 px-3 pb-[max(0.75rem,env(safe-area-inset-bottom))]">
      <div className="mx-auto max-w-app rounded-card bg-violet-700 text-white shadow-bar">
        <p className="px-4 pt-2.5 text-center text-[0.78rem] font-medium text-gold-500">
          You&rsquo;ll earn {pointsEarnedFor(subtotal)} pts on this order
        </p>
        <div className="flex items-center justify-between gap-3 px-4 pt-1 pb-3.5">
          <div className="leading-tight">
            <p className="text-[0.78rem] text-white/70">
              {count} {count === 1 ? 'item' : 'items'}
            </p>
            <p className="tabular font-display text-lg font-semibold">
              {formatRupees(subtotal)}
            </p>
          </div>
          <button
            type="button"
            onClick={onOpen}
            className="h-11 rounded-pill bg-gold-500 px-5 font-display text-sm font-semibold text-violet-900 transition-transform active:scale-[0.98] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            View bag
          </button>
        </div>
      </div>
    </div>
  )
}
