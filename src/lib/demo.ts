import { prisma } from '@/lib/db'

/**
 * At 2% with a 100-point floor a customer needs 5,000 rupees of spend before
 * redeeming anything, so redemption is unreachable in a walkthrough. This grants
 * points directly via a single ADJUST ledger row - it never fabricates Order
 * rows, so order history stays honest and the ledger shows plainly that the
 * points were granted rather than earned.
 */
export async function simulatePastOrders(
  phone: string,
  points: number,
): Promise<{ pointsBalance: number }> {
  return prisma.$transaction(async (tx) => {
    const existing = await tx.customer.findUnique({ where: { phone } })
    const balanceAfter = (existing?.pointsBalance ?? 0) + points

    const customer = existing
      ? await tx.customer.update({
          where: { id: existing.id },
          data: { pointsBalance: balanceAfter },
        })
      : await tx.customer.create({ data: { phone, pointsBalance: balanceAfter } })

    await tx.pointsLedger.create({
      data: {
        customerId: customer.id,
        kind: 'ADJUST',
        delta: points,
        balanceAfter,
        note: 'Demo adjustment',
      },
    })

    return { pointsBalance: balanceAfter }
  })
}

export function demoToolsEnabled(): boolean {
  return process.env.ENABLE_DEMO_TOOLS === 'true'
}
