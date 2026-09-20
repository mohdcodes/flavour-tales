import type { ButtonHTMLAttributes } from 'react'

type Variant = 'primary' | 'gold' | 'ghost'
type Size = 'md' | 'lg'

const VARIANTS: Record<Variant, string> = {
  primary: 'bg-violet-600 text-white hover:bg-violet-700',
  // Gold is reserved for loyalty actions only.
  gold: 'bg-gold-500 text-violet-900 hover:brightness-[1.04]',
  ghost: 'border border-line bg-transparent text-ink hover:bg-violet-100/60',
}

const SIZES: Record<Size, string> = {
  md: 'h-11 px-5 text-[0.95rem]',
  lg: 'h-14 w-full px-6 text-base',
}

export function Button({
  variant = 'primary',
  size = 'md',
  className,
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; size?: Size }) {
  return (
    <button
      className={[
        'inline-flex items-center justify-center gap-2 rounded-pill font-display font-semibold',
        'transition-[transform,background-color,filter] duration-150 active:scale-[0.98]',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600',
        'disabled:pointer-events-none disabled:opacity-40',
        VARIANTS[variant],
        SIZES[size],
        className ?? '',
      ].join(' ')}
      {...props}
    />
  )
}
