import Link from 'next/link'
import { Wordmark } from '@/components/brand/Wordmark'
import { DoodleField } from '@/components/brand/Doodles'

export function ScreenHeader({
  title,
  backHref,
  backLabel = 'Back',
}: {
  title: string
  backHref?: string
  backLabel?: string
}) {
  return (
    <header className="relative overflow-hidden rounded-b-[1.75rem] bg-violet-700 px-5 pt-6 pb-6 text-white">
      <DoodleField className="text-white" />
      <div className="relative">
        <div className="flex items-center justify-between gap-3">
          {backHref ? (
            <Link
              href={backHref}
              className="rounded-pill bg-white/15 px-3 py-1 text-[0.72rem] font-semibold transition-colors hover:bg-white/25 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white"
            >
              &larr; {backLabel}
            </Link>
          ) : (
            <span />
          )}
          <Wordmark className="text-base opacity-80" />
        </div>
        <h1 className="mt-4 font-display text-2xl font-bold">{title}</h1>
      </div>
    </header>
  )
}
