import { NextResponse } from 'next/server'
import { phoneSchema } from '@/lib/validation'
import { lookupCustomer } from '@/lib/customers'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = phoneSchema.safeParse(body?.phone)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const customer = await lookupCustomer(parsed.data)

  // A number that has never ordered is not an error - it is a new customer, and
  // the client needs a zero balance rather than a 404.
  return NextResponse.json({
    customer: customer ?? {
      phone: parsed.data,
      name: null,
      pointsBalance: 0,
      canRedeem: false,
    },
    isReturning: customer !== null,
  })
}
