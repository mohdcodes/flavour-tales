/** The standard Indian vegetarian symbol: a green square with a filled dot. */
export function VegMark({ className }: { className?: string }) {
  return (
    <span
      role="img"
      aria-label="Vegetarian"
      className={`inline-flex h-3 w-3 shrink-0 items-center justify-center rounded-[2px] border-[1.5px] border-veg ${className ?? ''}`}
    >
      <span className="h-[5px] w-[5px] rounded-full bg-veg" />
    </span>
  )
}
