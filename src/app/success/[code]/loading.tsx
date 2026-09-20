import { MomoLoading } from '@/components/brand/MomoLoading'

export default function Loading() {
  return (
    <div className="app-column mx-auto flex min-h-dvh max-w-app items-center justify-center">
      <MomoLoading
        lines={['Writing up your order…', 'Counting your points…', 'Almost there…']}
      />
    </div>
  )
}
