'use client'

import { useState } from 'react'
import { VegMark } from '@/components/ui/VegMark'
import { VariantPicker } from '@/components/menu/VariantPicker'
import { QtyStepper } from '@/components/menu/QtyStepper'
import { formatRupees } from '@/lib/format'
import { useCart, cartKey } from '@/store/cart'
import type { MenuItemView } from '@/lib/menu-view'

export function ItemCard({ item, hydrated }: { item: MenuItemView; hydrated: boolean }) {
  const variants = item.variants
  const [selectedKey, setSelectedKey] = useState(variants?.[0]?.key ?? null)

  const add = useCart((state) => state.add)
  const setQuantity = useCart((state) => state.setQuantity)
  const key = cartKey(item.slug, selectedKey)
  const inCart = useCart((state) => state.items.find((line) => line.key === key))

  const variant = variants?.find((candidate) => candidate.key === selectedKey) ?? null
  const price = variant?.price ?? item.basePrice

  return (
    <li className="flex items-start gap-3 rounded-card bg-paper-raised p-4 shadow-card">
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2">
          <VegMark />
          <h3 className="font-display text-[0.98rem] leading-snug font-semibold">{item.name}</h3>
        </div>

        {item.description ? (
          <p className="mt-0.5 text-[0.8rem] text-ink-muted">{item.description}</p>
        ) : null}

        <p className="tabular mt-1.5 font-display text-[0.95rem] font-semibold text-violet-700">
          {formatRupees(price)}
        </p>

        {variants && selectedKey ? (
          <div className="mt-2.5">
            <VariantPicker
              variants={variants}
              selected={selectedKey}
              onSelect={setSelectedKey}
              itemName={item.name}
            />
          </div>
        ) : null}
      </div>

      <div className="shrink-0 pt-0.5">
        {hydrated && inCart ? (
          <QtyStepper
            quantity={inCart.quantity}
            itemName={item.name}
            onDecrease={() => setQuantity(key, inCart.quantity - 1)}
            onIncrease={() => setQuantity(key, inCart.quantity + 1)}
          />
        ) : (
          <button
            type="button"
            onClick={() =>
              add({
                menuItemSlug: item.slug,
                name: item.name,
                variantKey: selectedKey,
                variantLabel: variant?.label ?? null,
                unitPrice: price,
              })
            }
            className="h-11 rounded-pill border border-violet-600 px-5 font-display text-sm font-semibold text-violet-600 transition-colors hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600"
          >
            Add
          </button>
        )}
      </div>
    </li>
  )
}
