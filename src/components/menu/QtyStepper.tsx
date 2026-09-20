'use client'

export function QtyStepper({
  quantity,
  itemName,
  onDecrease,
  onIncrease,
}: {
  quantity: number
  itemName: string
  onDecrease: () => void
  onIncrease: () => void
}) {
  return (
    <div className="flex h-11 items-center gap-1 rounded-pill border border-violet-600 bg-paper-raised px-1">
      <button
        type="button"
        onClick={onDecrease}
        aria-label={`Remove one ${itemName}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-violet-600 transition-colors hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-600"
      >
        &minus;
      </button>
      <span className="tabular min-w-5 text-center font-display text-sm font-semibold text-violet-700">
        {quantity}
      </span>
      <button
        type="button"
        onClick={onIncrease}
        aria-label={`Add one ${itemName}`}
        className="flex h-9 w-9 items-center justify-center rounded-full text-lg leading-none text-violet-600 transition-colors hover:bg-violet-100 focus-visible:outline-2 focus-visible:outline-offset-1 focus-visible:outline-violet-600"
      >
        +
      </button>
    </div>
  )
}
