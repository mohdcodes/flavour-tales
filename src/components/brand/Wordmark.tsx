export function Wordmark({ className }: { className?: string }) {
  return (
    <span
      className={`font-display font-extrabold tracking-[-0.03em] lowercase ${className ?? ''}`}
    >
      flavor<span className="text-gold-500">&amp;</span>tales
    </span>
  )
}
