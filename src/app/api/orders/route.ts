import { NextResponse } from 'next/server'
import { placeOrderSchema } from '@/lib/validation'
import { placeOrder } from '@/lib/orders'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = placeOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const result = await placeOrder(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not place the order'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
