'use client'

import { useEffect, useState } from 'react'
import Link from 'next/link'
import { Wordmark } from '@/components/brand/Wordmark'
import { DoodleField } from '@/components/brand/Doodles'
import { CategoryNav } from '@/components/menu/CategoryNav'
import { ItemCard } from '@/components/menu/ItemCard'
import { CartBar } from '@/components/cart/CartBar'
import { CartSheet } from '@/components/cart/CartSheet'
import { useCart } from '@/store/cart'
import { useHydrated } from '@/lib/useHydrated'
import { useCustomer } from '@/lib/useCustomer'
import type { MenuCategoryView } from '@/lib/menu-view'

export function MenuScreen({
  categories,
  tableParam,
}: {
  categories: MenuCategoryView[]
  tableParam: string | null
}) {
  const hydrated = useHydrated()
  const [cartOpen, setCartOpen] = useState(false)

  const phone = useCart((state) => state.phone)
  const tableLabel = useCart((state) => state.tableLabel)
  const setTableLabel = useCart((state) => state.setTableLabel)
  const { customer } = useCustomer(hydrated ? phone : null)

  // A QR scan carries ?t=5; a plain visit does not. Both land here.
  useEffect(() => {
    if (tableParam) setTableLabel(tableParam)
  }, [tableParam, setTableLabel])

  const activeTable = tableParam ?? (hydrated ? tableLabel : null)

  return (
    <div className="app-column mx-auto min-h-dvh max-w-app pb-36">
      <header className="relative overflow-hidden rounded-b-[1.75rem] bg-violet-700 px-5 pt-7 pb-6 text-white">
        <DoodleField className="text-white" />
        <div className="relative flex items-start justify-between gap-3">
          <div>
            <Wordmark className="text-2xl" />
            <p className="mt-1 text-[0.8rem] text-white/70">
              every dish begins with a story
            </p>
            {activeTable ? (
              <span className="mt-3 inline-block rounded-pill bg-white/15 px-3 py-1 text-[0.72rem] font-semibold">
                Table {activeTable}
              </span>
            ) : null}
          </div>

          <Link
            href="/wallet"
            className="shrink-0 rounded-pill bg-white/15 px-3 py-1.5 text-center transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
          >
            {customer ? (
              <>
                <span className="tabular block font-display text-base leading-none font-semibold text-gold-500">
                  {customer.pointsBalance}
                </span>
                <span className="block text-[0.65rem] text-white/70">points</span>
              </>
            ) : (
              <span className="block text-[0.72rem] font-semibold">Your points</span>
            )}
          </Link>
        </div>
      </header>

      <div className="px-5">
        <CategoryNav categories={categories} />

        {categories.map((category) => (
          <section key={category.slug} id={category.slug} className="scroll-mt-16 pt-5">
            <h2 className="font-display text-xl font-bold">{category.name}</h2>
            {category.subtitle ? (
              <p className="text-[0.8rem] text-ink-muted">{category.subtitle}</p>
            ) : null}

            <ul className="mt-3 flex flex-col gap-2.5">
              {category.items.map((item) => (
                <ItemCard key={item.id} item={item} hydrated={hydrated} />
              ))}
            </ul>
          </section>
        ))}
      </div>

      {hydrated ? (
        <>
          <CartBar onOpen={() => setCartOpen(true)} />
          <CartSheet open={cartOpen} onClose={() => setCartOpen(false)} />
        </>
      ) : null}
    </div>
  )
}
