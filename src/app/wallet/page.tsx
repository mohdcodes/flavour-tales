'use client'

import { Suspense, useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { ScreenHeader } from '@/components/ui/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { Doodle } from '@/components/brand/Doodles'
import { MomoLoading } from '@/components/brand/MomoLoading'
import { PhoneForm } from '@/components/checkout/PhoneForm'
import { BalanceCard } from '@/components/wallet/BalanceCard'
import { OrderHistory, type WalletOrder } from '@/components/wallet/OrderHistory'
import { LedgerList, type WalletLedgerRow } from '@/components/wallet/LedgerList'
import { DemoPanel } from '@/components/demo/DemoPanel'
import { useCart } from '@/store/cart'
import { useHydrated } from '@/lib/useHydrated'

interface Activity {
  summary: { phone: string; name: string | null; pointsBalance: number; canRedeem: boolean }
  orders: WalletOrder[]
  ledger: WalletLedgerRow[]
}

function WalletContent() {
  const hydrated = useHydrated()
  const searchParams = useSearchParams()
  const showDemo = searchParams.get('demo') === '1'

  const phone = useCart((state) => state.phone)
  const setPhone = useCart((state) => state.setPhone)

  const [activity, setActivity] = useState<Activity | null>(null)
  const [loaded, setLoaded] = useState(false)

  const load = useCallback(async () => {
    if (!phone) return
    const response = await fetch(`/api/customer/${phone}/orders`)
    // A 404 means a number with no orders, which is an empty state, not a failure.
    setActivity(response.ok ? await response.json() : null)
    setLoaded(true)
  }, [phone])

  useEffect(() => {
    if (!hydrated) return
    if (!phone) {
      setLoaded(true)
      return
    }
    void load()
  }, [hydrated, phone, load])

  if (!hydrated) {
    return (
      <>
        <ScreenHeader title="Your points" backHref="/" backLabel="Menu" />
        <MomoLoading lines={['Counting your points…']} />
      </>
    )
  }

  if (!phone) {
    return (
      <>
        <ScreenHeader title="Find your points" backHref="/" backLabel="Menu" />
        <div className="px-5 pt-6">
          <p className="mb-4 text-[0.85rem] text-ink-muted">
            Enter the number you ordered with.
          </p>
          <PhoneForm
            onIdentified={(value) => setPhone(value)}
            cta="Show my points"
            askName={false}
          />
        </div>
      </>
    )
  }

  if (!loaded) {
    return (
      <>
        <ScreenHeader title="Your points" backHref="/" backLabel="Menu" />
        <MomoLoading lines={['Counting your points…', 'Checking the ledger…']} />
      </>
    )
  }

  const balance = activity?.summary.pointsBalance ?? 0

  return (
    <>
      <ScreenHeader title="Your points" backHref="/" backLabel="Menu" />

      <div className="flex flex-col gap-5 px-5 pt-5">
        <BalanceCard balance={balance} name={activity?.summary.name ?? null} />

        {showDemo ? <DemoPanel phone={phone} onGranted={load} /> : null}

        {loaded && (!activity || activity.orders.length === 0) ? (
          <div className="flex flex-col items-center gap-3 py-10 text-center">
            <Doodle name="dumpling" className="h-14 w-14 text-violet-600/40" />
            <p className="text-[0.9rem] text-ink-muted">
              No orders yet. Start with the momos.
            </p>
            <Link href="/" className="mt-1">
              <Button>See the menu</Button>
            </Link>
          </div>
        ) : null}

        {activity && activity.orders.length > 0 ? (
          <OrderHistory orders={activity.orders} />
        ) : null}

        {activity ? <LedgerList rows={activity.ledger} /> : null}

        <button
          type="button"
          onClick={() => setPhone(null)}
          className="self-center text-[0.78rem] text-ink-muted underline underline-offset-2"
        >
          Use a different number
        </button>
      </div>
    </>
  )
}

export default function WalletPage() {
  return (
    <div className="app-column mx-auto min-h-dvh max-w-app pb-10">
      <Suspense
        fallback={
          <>
            <ScreenHeader title="Your points" backHref="/" backLabel="Menu" />
            <MomoLoading lines={['Counting your points…']} />
          </>
        }
      >
        <WalletContent />
      </Suspense>
    </div>
  )
}
