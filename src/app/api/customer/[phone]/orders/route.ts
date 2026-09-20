import { NextResponse } from 'next/server'
import { phoneSchema } from '@/lib/validation'
import { getCustomerActivity } from '@/lib/customers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { phone } = await params
  const parsed = phoneSchema.safeParse(phone)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const activity = await getCustomerActivity(parsed.data)
  if (!activity) return NextResponse.json({ error: 'No orders yet' }, { status: 404 })

  return NextResponse.json(activity)
}
