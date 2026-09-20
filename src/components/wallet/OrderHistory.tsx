'use client'

import { formatRupees, formatDateTime } from '@/lib/format'

export interface WalletOrder {
  id: string
  code: string
  createdAt: string
  amountPaid: number
  pointsEarned: number
  items: { id: string; name: string; quantity: number }[]
}

export function OrderHistory({ orders }: { orders: WalletOrder[] }) {
  return (
    <section>
      <h2 className="mb-2 font-display text-base font-semibold">Your orders</h2>
      <ul className="flex flex-col gap-2">
        {orders.map((order) => (
          <li key={order.id} className="rounded-card bg-paper-raised p-4 shadow-card">
            <div className="flex items-baseline justify-between gap-3">
              <span className="tabular font-display text-[0.9rem] font-semibold">
                {order.code}
              </span>
              <span className="tabular font-display text-[0.95rem] font-semibold">
                {formatRupees(order.amountPaid)}
              </span>
            </div>
            <p className="truncate text-[0.8rem] text-ink-muted">
              {order.items.map((item) => item.name).join(' · ')}
            </p>
            <p className="mt-1 text-[0.72rem] text-ink-muted">
              {formatDateTime(order.createdAt)}
            </p>
          </li>
        ))}
      </ul>
    </section>
  )
}
