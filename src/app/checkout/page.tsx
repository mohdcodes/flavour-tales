'use client'

import { useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { Doodle } from '@/components/brand/Doodles'
import { MomoLoading, MomoLoadingOverlay } from '@/components/brand/MomoLoading'
import { PhoneForm } from '@/components/checkout/PhoneForm'
import { RedeemControl } from '@/components/checkout/RedeemControl'
import { OrderSummary } from '@/components/checkout/OrderSummary'
import { useCart, selectSubtotal, toCartLines } from '@/store/cart'
import { useHydrated } from '@/lib/useHydrated'
import { useCustomer } from '@/lib/useCustomer'
import { computeOrderTotals, maxRedeemable } from '@/lib/loyalty'
import { formatRupees, formatPoints } from '@/lib/format'

type Mode = 'DINE_IN' | 'TAKEAWAY'

export default function CheckoutPage() {
  const router = useRouter()
  const hydrated = useHydrated()

  const items = useCart((state) => state.items)
  const subtotal = useCart(selectSubtotal)
  const lines = useMemo(() => toCartLines(items), [items])
  const phone = useCart((state) => state.phone)
  const setPhone = useCart((state) => state.setPhone)
  const pendingName = useCart((state) => state.name)
  const setName = useCart((state) => state.setName)
  const tableLabel = useCart((state) => state.tableLabel)
  const clear = useCart((state) => state.clear)

  const { customer, isReturning } = useCustomer(hydrated ? phone : null)

  const [useRedeem, setUseRedeem] = useState(false)
  const [mode, setMode] = useState<Mode>('TAKEAWAY')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // A table came from a QR scan, so dine-in is the obvious default.
  useEffect(() => {
    if (tableLabel) setMode('DINE_IN')
  }, [tableLabel])

  const balance = customer?.pointsBalance ?? 0
  const maxRedeem = maxRedeemable(balance, subtotal)
  const totals = computeOrderTotals({
    lines,
    balance,
    redeemRequested: useRedeem ? maxRedeem : 0,
  })

  if (!hydrated) {
    return (
      <div className="app-column mx-auto min-h-dvh max-w-app">
        <ScreenHeader title="Checkout" backHref="/" backLabel="Menu" />
        <MomoLoading lines={['Checking your bag…']} />
      </div>
    )
  }

  if (items.length === 0) {
    return (
      <div className="app-column mx-auto min-h-dvh max-w-app">
        <ScreenHeader title="Checkout" backHref="/" backLabel="Menu" />
        <div className="flex flex-col items-center gap-3 px-5 py-16 text-center">
          <Doodle name="dumpling" className="h-14 w-14 text-violet-600/40" />
          <p className="text-[0.9rem] text-ink-muted">
            Nothing in the bag yet. The momos are waiting.
          </p>
          <Link href="/" className="mt-2">
            <Button>See the menu</Button>
          </Link>
        </div>
      </div>
    )
  }

  async function placeOrder() {
    setSubmitting(true)
    setError(null)
    try {
      const response = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          phone,
          name: pendingName ?? undefined,
          mode,
          tableLabel: mode === 'DINE_IN' ? tableLabel : null,
          lines: items.map((item) => ({
            menuItemSlug: item.menuItemSlug,
            variantKey: item.variantKey,
            quantity: item.quantity,
          })),
          redeemRequested: useRedeem ? maxRedeem : 0,
        }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Could not place the order')
        return
      }
      clear()
      router.push(`/success/${data.orderCode}`)
    } catch {
      setError('Could not reach the kitchen. Try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="app-column mx-auto min-h-dvh max-w-app pb-10">
      <MomoLoadingOverlay
        open={submitting}
        lines={['Sending it to the kitchen…', 'Folding the pleats…', 'Counting your points…']}
      />

      <ScreenHeader title="Checkout" backHref="/" backLabel="Menu" />

      <div className="flex flex-col gap-5 px-5 pt-5">
        {!phone ? (
          <PhoneForm
            onIdentified={(value, newName) => {
              setPhone(value)
              setName(newName)
            }}
          />
        ) : (
          <>
            <div className="rounded-card bg-paper-raised p-4 shadow-card">
              <p className="font-display text-base font-semibold">
                {isReturning
                  ? customer?.name
                    ? `Welcome back, ${customer.name}.`
                    : 'Welcome back.'
                  : pendingName
                    ? `Good to meet you, ${pendingName}.`
                    : 'Good to meet you.'}
              </p>
              <p className="tabular mt-0.5 text-[0.85rem] text-gold-700">
                {isReturning
                  ? `${formatPoints(balance)} in your account`
                  : 'This order starts your points.'}
              </p>
              <button
                type="button"
                onClick={() => {
                  setPhone(null)
                  setName(null)
                }}
                className="mt-2 text-[0.78rem] text-ink-muted underline underline-offset-2"
              >
                Not you?
              </button>
            </div>

            <RedeemControl
              balance={balance}
              maxRedeem={maxRedeem}
              enabled={useRedeem}
              onToggle={setUseRedeem}
            />

            <OrderSummary items={items} totals={totals} />

            <div>
              <p className="mb-2 font-display text-[0.85rem] font-semibold">
                How are you eating?
              </p>
              <div className="flex gap-2">
                {(['DINE_IN', 'TAKEAWAY'] as const).map((option) => (
                  <button
                    key={option}
                    type="button"
                    onClick={() => setMode(option)}
                    className={[
                      'rounded-pill px-4 py-2 font-display text-[0.8rem] font-semibold transition-colors',
                      'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600',
                      mode === option
                        ? 'bg-violet-600 text-white'
                        : 'bg-violet-100 text-violet-700',
                    ].join(' ')}
                  >
                    {option === 'DINE_IN' ? 'Dine-in' : 'Takeaway'}
                  </button>
                ))}
                {mode === 'DINE_IN' && tableLabel ? (
                  <span className="self-center rounded-pill bg-paper-raised px-3 py-1.5 text-[0.75rem] text-ink-muted shadow-card">
                    Table {tableLabel}
                  </span>
                ) : null}
              </div>
            </div>

            {error ? <p className="text-[0.85rem] text-red-700">{error}</p> : null}

            <div>
              <Button size="lg" onClick={placeOrder} disabled={submitting}>
                {submitting
                  ? 'Sending to the kitchen…'
                  : `Place order · ${formatRupees(totals.amountPaid)}`}
              </Button>
              <p className="mt-2 text-center text-[0.78rem] text-ink-muted">
                Pay at the counter when you collect.
              </p>
            </div>
          </>
        )}
      </div>
    </div>
  )
}
