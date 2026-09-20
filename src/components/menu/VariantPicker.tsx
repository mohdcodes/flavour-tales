'use client'

import type { MenuVariant } from '@/data/menu'

export function VariantPicker({
  variants,
  selected,
  onSelect,
  itemName,
}: {
  variants: MenuVariant[]
  selected: string
  onSelect: (key: string) => void
  itemName: string
}) {
  return (
    <div
      role="radiogroup"
      aria-label={`${itemName} style`}
      className="inline-flex rounded-pill bg-violet-100 p-0.5"
    >
      {variants.map((variant) => {
        const isSelected = variant.key === selected
        return (
          <button
            key={variant.key}
            type="button"
            role="radio"
            aria-checked={isSelected}
            onClick={() => onSelect(variant.key)}
            className={[
              'rounded-pill px-3 py-1 text-[0.72rem] font-semibold transition-colors',
              'focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-600',
              isSelected ? 'bg-violet-600 text-white' : 'text-violet-700',
            ].join(' ')}
          >
            {variant.label}
          </button>
        )
      })}
    </div>
  )
}
