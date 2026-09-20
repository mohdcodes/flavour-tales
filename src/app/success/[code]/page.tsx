import { notFound } from 'next/navigation'
import { getOrderReceipt } from '@/lib/orders'
import { SuccessCard } from '@/components/success/SuccessCard'

export const dynamic = 'force-dynamic'

export default async function SuccessPage({
  params,
}: {
  params: Promise<{ code: string }>
}) {
  const { code } = await params
  const receipt = await getOrderReceipt(decodeURIComponent(code))
  if (!receipt) notFound()

  return <SuccessCard receipt={receipt} />
}
