'use client'

import { formatRupees } from '@/lib/format'
import type { CartItem } from '@/store/cart'
import type { OrderTotals } from '@/lib/loyalty'

export function OrderSummary({
  items,
  totals,
}: {
  items: CartItem[]
  totals: OrderTotals
}) {
  return (
    <div className="rounded-card bg-paper-raised p-4 shadow-card">
      <ul className="flex flex-col gap-2.5">
        {items.map((item) => (
          <li key={item.key} className="flex items-start justify-between gap-3">
            <span className="min-w-0 text-[0.9rem]">
              <span className="tabular text-ink-muted">{item.quantity}&times;</span>{' '}
              {item.name}
              {item.variantLabel ? (
                <span className="text-ink-muted"> · {item.variantLabel}</span>
              ) : null}
            </span>
            <span className="tabular shrink-0 text-[0.9rem]">
              {formatRupees(item.unitPrice * item.quantity)}
            </span>
          </li>
        ))}
      </ul>

      <dl className="mt-4 flex flex-col gap-2 border-t border-line pt-3">
        <div className="flex items-center justify-between text-[0.9rem]">
          <dt className="text-ink-muted">Subtotal</dt>
          <dd className="tabular">{formatRupees(totals.subtotal)}</dd>
        </div>

        {totals.pointsRedeemed > 0 ? (
          <div className="flex items-center justify-between text-[0.9rem] text-gold-700">
            <dt>Points used</dt>
            <dd className="tabular">&minus; {formatRupees(totals.pointsRedeemed)}</dd>
          </div>
        ) : null}

        <div className="flex items-center justify-between border-t border-line pt-2">
          <dt className="font-display text-base font-semibold">To pay</dt>
          <dd className="tabular font-display text-lg font-semibold">
            {formatRupees(totals.amountPaid)}
          </dd>
        </div>
      </dl>
    </div>
  )
}
