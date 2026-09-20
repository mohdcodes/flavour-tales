'use client'

import Link from 'next/link'
import { Confetti } from '@/components/success/Confetti'
import { CountUp } from '@/components/success/CountUp'
import { PointsRing } from '@/components/success/PointsRing'
import { Button } from '@/components/ui/Button'
import { Wordmark } from '@/components/brand/Wordmark'
import { DoodleField } from '@/components/brand/Doodles'
import { REDEMPTION_FLOOR, canRedeem } from '@/lib/loyalty'
import { formatRupees, formatPoints } from '@/lib/format'
import type { OrderReceipt } from '@/lib/orders'

function statusLine(receipt: OrderReceipt): string {
  if (receipt.crossedRedemptionThreshold) {
    return `You've hit ${REDEMPTION_FLOOR}. Your next order can be on us.`
  }
  if (canRedeem(receipt.balanceAfter)) {
    return `${formatPoints(receipt.balanceAfter)} ready to spend.`
  }
  return `${REDEMPTION_FLOOR - receipt.balanceAfter} points to your next free bite.`
}

export function SuccessCard({ receipt }: { receipt: OrderReceipt }) {
  return (
    <div className="app-column mx-auto min-h-dvh max-w-app pb-10">
      <Confetti intensity={receipt.crossedRedemptionThreshold ? 'milestone' : 'normal'} />

      <header className="relative overflow-hidden rounded-b-[1.75rem] bg-violet-700 px-5 pt-6 pb-8 text-white">
        <DoodleField className="text-white" />
        <div className="relative">
          <div className="flex items-center justify-between">
            <Wordmark className="text-base opacity-80" />
            <span className="tabular rounded-pill bg-white/15 px-3 py-1 text-[0.72rem] font-semibold">
              Order {receipt.code}
            </span>
          </div>
          <h1 className="mt-5 font-display text-3xl font-bold">Order in.</h1>
          <p className="mt-1 text-[0.85rem] text-white/70">
            {receipt.mode === 'DINE_IN' && receipt.tableLabel
              ? `We'll bring it to table ${receipt.tableLabel}.`
              : 'We’ll call your number when it’s ready.'}
          </p>
        </div>
      </header>

      <div className="flex flex-col gap-5 px-5 pt-6">
        <div className="flex items-center gap-5 rounded-card bg-paper-raised p-5 shadow-card">
          <PointsRing balance={receipt.balanceAfter} />
          <div className="min-w-0">
            {/* Paying entirely in points earns nothing back, so celebrate the
                redemption rather than announcing "+0 points". */}
            {receipt.pointsEarned === 0 && receipt.pointsRedeemed > 0 ? (
              <>
                <p className="font-display text-2xl font-bold text-gold-700">
                  {formatRupees(receipt.pointsRedeemed)} on us
                </p>
                <p className="text-[0.8rem] text-ink-muted">paid with your points</p>
              </>
            ) : (
              <>
                <p className="font-display text-2xl font-bold text-gold-700">
                  +<CountUp to={receipt.pointsEarned} /> points
                </p>
                <p className="text-[0.8rem] text-ink-muted">to your name</p>
              </>
            )}
            <p className="mt-2 text-[0.85rem]">{statusLine(receipt)}</p>
          </div>
        </div>

        <div className="rounded-card bg-paper-raised p-4 shadow-card">
          <ul className="flex flex-col gap-2.5">
            {receipt.items.map((item) => (
              <li key={item.id} className="flex items-start justify-between gap-3">
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
              <dd className="tabular">{formatRupees(receipt.subtotal)}</dd>
            </div>
            {receipt.pointsRedeemed > 0 ? (
              <div className="flex items-center justify-between text-[0.9rem] text-gold-700">
                <dt>Points used</dt>
                <dd className="tabular">&minus; {formatRupees(receipt.pointsRedeemed)}</dd>
              </div>
            ) : null}
            <div className="flex items-center justify-between border-t border-line pt-2">
              <dt className="font-display text-base font-semibold">To pay</dt>
              <dd className="tabular font-display text-lg font-semibold">
                {formatRupees(receipt.amountPaid)}
              </dd>
            </div>
          </dl>

          <p className="mt-3 text-center text-[0.78rem] text-ink-muted">
            Pay at the counter when you collect.
          </p>
        </div>

        <div className="flex flex-col gap-2.5">
          <Link href="/">
            <Button size="lg">Order something else</Button>
          </Link>
          <Link href="/wallet">
            <Button size="lg" variant="ghost">
              See your points
            </Button>
          </Link>
        </div>
      </div>
    </div>
  )
}
