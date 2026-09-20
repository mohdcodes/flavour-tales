import { MomoLoading } from '@/components/brand/MomoLoading'

export default function Loading() {
  return (
    <div className="app-column mx-auto flex min-h-dvh max-w-app items-center justify-center">
      <MomoLoading lines={['Folding the pleats…', 'Waking the steamer…', 'Laying out the menu…']} />
    </div>
  )
}
