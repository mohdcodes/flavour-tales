import { MomoLoading } from '@/components/brand/MomoLoading'

export default function Loading() {
  return (
    <div className="mx-auto flex min-h-dvh max-w-5xl items-center justify-center">
      <MomoLoading lines={['Printing the codes…', 'Squaring the corners…']} />
    </div>
  )
}
