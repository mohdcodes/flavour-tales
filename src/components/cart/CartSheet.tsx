'use client'

import { useRouter } from 'next/navigation'
import { Sheet } from '@/components/ui/Sheet'
import { Button } from '@/components/ui/Button'
import { QtyStepper } from '@/components/menu/QtyStepper'
import { Doodle } from '@/components/brand/Doodles'
import { useCart, selectSubtotal } from '@/store/cart'
import { pointsEarnedFor } from '@/lib/loyalty'
import { formatRupees } from '@/lib/format'

export function CartSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter()
  const items = useCart((state) => state.items)
  const setQuantity = useCart((state) => state.setQuantity)
  const subtotal = useCart(selectSubtotal)

  return (
    <Sheet open={open} onClose={onClose} title="Your bag">
      {items.length === 0 ? (
        <div className="flex flex-col items-center gap-3 py-10 text-center">
          <Doodle name="dumpling" className="h-12 w-12 text-violet-600/40" />
          <p className="text-[0.9rem] text-ink-muted">
            Nothing in the bag yet. The momos are waiting.
          </p>
        </div>
      ) : (
        <>
          <ul className="divide-y divide-line">
            {items.map((item) => (
              <li key={item.key} className="flex items-center gap-3 py-3.5">
                <div className="min-w-0 flex-1">
                  <p className="font-display text-[0.92rem] font-semibold">{item.name}</p>
                  <p className="tabular text-[0.78rem] text-ink-muted">
                    {item.variantLabel ? `${item.variantLabel} · ` : ''}
                    {formatRupees(item.unitPrice)} each
                  </p>
                </div>
                <QtyStepper
                  quantity={item.quantity}
                  itemName={item.name}
                  onDecrease={() => setQuantity(item.key, item.quantity - 1)}
                  onIncrease={() => setQuantity(item.key, item.quantity + 1)}
                />
                <p className="tabular w-16 text-right font-display text-[0.92rem] font-semibold">
                  {formatRupees(item.unitPrice * item.quantity)}
                </p>
              </li>
            ))}
          </ul>

          <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
            <span className="font-display text-base font-semibold">Subtotal</span>
            <span className="tabular font-display text-lg font-semibold">
              {formatRupees(subtotal)}
            </span>
          </div>

          <p className="mt-1 text-[0.8rem] text-gold-700">
            You&rsquo;ll earn {pointsEarnedFor(subtotal)} pts on this order
          </p>

          <div className="mt-5">
            <Button
              size="lg"
              onClick={() => {
                onClose()
                router.push('/checkout')
              }}
            >
              Checkout
            </Button>
          </div>
        </>
      )}
    </Sheet>
  )
}
