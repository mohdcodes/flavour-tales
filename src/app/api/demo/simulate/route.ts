import { NextResponse } from 'next/server'
import { simulatePointsSchema } from '@/lib/validation'
import { simulatePastOrders, demoToolsEnabled } from '@/lib/demo'

export async function POST(request: Request) {
  // A 404 rather than a 403, so the route's existence is not advertised.
  if (!demoToolsEnabled()) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 })
  }

  const body = await request.json().catch(() => null)
  const parsed = simulatePointsSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const result = await simulatePastOrders(parsed.data.phone, parsed.data.points)
  return NextResponse.json(result)
}
