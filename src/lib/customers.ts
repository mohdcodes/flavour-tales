import { prisma } from '@/lib/db'
import { canRedeem } from '@/lib/loyalty'

export interface CustomerSummary {
  phone: string
  name: string | null
  pointsBalance: number
  canRedeem: boolean
}

export async function lookupCustomer(phone: string): Promise<CustomerSummary | null> {
  const customer = await prisma.customer.findUnique({ where: { phone } })
  if (!customer) return null

  return {
    phone: customer.phone,
    name: customer.name,
    pointsBalance: customer.pointsBalance,
    canRedeem: canRedeem(customer.pointsBalance),
  }
}

export async function getCustomerActivity(phone: string) {
  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      orders: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 25 },
      ledger: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  })
  if (!customer) return null

  return {
    summary: {
      phone: customer.phone,
      name: customer.name,
      pointsBalance: customer.pointsBalance,
      canRedeem: canRedeem(customer.pointsBalance),
    } satisfies CustomerSummary,
    orders: customer.orders,
    ledger: customer.ledger,
  }
}
