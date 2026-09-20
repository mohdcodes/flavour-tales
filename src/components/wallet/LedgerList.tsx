'use client'

import { formatDateTime } from '@/lib/format'

export interface WalletLedgerRow {
  id: string
  kind: 'EARN' | 'REDEEM' | 'ADJUST'
  delta: number
  note: string | null
  createdAt: string
}

export function LedgerList({ rows }: { rows: WalletLedgerRow[] }) {
  if (rows.length === 0) return null

  return (
    <section>
      <h2 className="mb-2 font-display text-base font-semibold">Points activity</h2>
      <ul className="divide-y divide-line rounded-card bg-paper-raised px-4 shadow-card">
        {rows.map((row) => (
          <li key={row.id} className="flex items-center justify-between gap-3 py-3">
            <div className="min-w-0">
              <p className="text-[0.85rem]">{row.note ?? row.kind}</p>
              <p className="text-[0.72rem] text-ink-muted">
                {formatDateTime(row.createdAt)}
              </p>
            </div>
            <span
              className={[
                'tabular shrink-0 font-display text-[0.95rem] font-semibold',
                row.delta >= 0 ? 'text-gold-700' : 'text-ink-muted',
              ].join(' ')}
            >
              {row.delta >= 0 ? '+' : '−'}
              {Math.abs(row.delta)}
            </span>
          </li>
        ))}
      </ul>
    </section>
  )
}
