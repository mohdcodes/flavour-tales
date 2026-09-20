import { prisma } from '@/lib/db'
import { computeOrderTotals, canRedeem, type CartLine } from '@/lib/loyalty'
import type { MenuVariant } from '@/data/menu'

export interface PlaceOrderInput {
  phone: string
  name?: string
  tableLabel?: string | null
  mode: 'DINE_IN' | 'TAKEAWAY'
  lines: { menuItemSlug: string; variantKey: string | null; quantity: number }[]
  redeemRequested: number
}

export interface PlaceOrderResult {
  orderCode: string
  subtotal: number
  pointsRedeemed: number
  amountPaid: number
  pointsEarned: number
  balanceBefore: number
  balanceAfter: number
  crossedRedemptionThreshold: boolean
  items: {
    name: string
    variantLabel: string | null
    unitPrice: number
    quantity: number
  }[]
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.lines.length === 0) throw new Error('Cart is empty')
  for (const line of input.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error('Line quantity must be a positive whole number')
    }
  }

  return prisma.$transaction(async (tx) => {
    const menuItems = await tx.menuItem.findMany({
      where: { slug: { in: input.lines.map((line) => line.menuItemSlug) } },
    })
    const bySlug = new Map(menuItems.map((item) => [item.slug, item]))

    // Prices come from the database. Anything the client sent is a preview only.
    const priced = input.lines.map((line) => {
      const item = bySlug.get(line.menuItemSlug)
      if (!item) throw new Error(`Unknown menu item: ${line.menuItemSlug}`)
      if (!item.available) throw new Error(`${item.name} is not available right now`)

      const variants = (item.variants ?? null) as MenuVariant[] | null
      const variant = line.variantKey
        ? variants?.find((candidate) => candidate.key === line.variantKey)
        : undefined
      if (line.variantKey && !variant) {
        throw new Error(`Unknown variant ${line.variantKey} for ${item.name}`)
      }

      return {
        menuItemId: item.id,
        name: item.name,
        variantKey: variant?.key ?? null,
        variantLabel: variant?.label ?? null,
        unitPrice: variant?.price ?? item.basePrice,
        quantity: line.quantity,
      }
    })

    const existing = await tx.customer.findUnique({ where: { phone: input.phone } })
    const balanceBefore = existing?.pointsBalance ?? 0

    const cartLines: CartLine[] = priced.map((line) => ({
      menuItemId: line.menuItemId,
      variantKey: line.variantKey,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
    }))
    const totals = computeOrderTotals({
      lines: cartLines,
      balance: balanceBefore,
      redeemRequested: input.redeemRequested,
    })

    const customer = existing
      ? await tx.customer.update({
          where: { id: existing.id },
          data: {
            name: input.name ?? existing.name,
            pointsBalance: totals.balanceAfter,
          },
        })
      : await tx.customer.create({
          data: {
            phone: input.phone,
            name: input.name,
            pointsBalance: totals.balanceAfter,
          },
        })

    // Daily counter. Two orders in the same millisecond could collide; acceptable for a POC.
    const todayCount = await tx.order.count({
      where: { createdAt: { gte: startOfToday() } },
    })
    const orderCode = `FT-${String(todayCount + 1).padStart(4, '0')}`

    const order = await tx.order.create({
      data: {
        code: orderCode,
        customerId: customer.id,
        tableLabel: input.tableLabel ?? null,
        mode: input.mode,
        subtotal: totals.subtotal,
        pointsRedeemed: totals.pointsRedeemed,
        amountPaid: totals.amountPaid,
        pointsEarned: totals.pointsEarned,
        items: {
          create: priced.map((line) => ({
            menuItemId: line.menuItemId,
            name: line.name,
            variantKey: line.variantKey,
            variantLabel: line.variantLabel,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
          })),
        },
      },
    })

    if (totals.pointsRedeemed > 0) {
      await tx.pointsLedger.create({
        data: {
          customerId: customer.id,
          orderId: order.id,
          kind: 'REDEEM',
          delta: -totals.pointsRedeemed,
          balanceAfter: balanceBefore - totals.pointsRedeemed,
          note: `Redeemed against ${orderCode}`,
        },
      })
    }

    if (totals.pointsEarned > 0) {
      await tx.pointsLedger.create({
        data: {
          customerId: customer.id,
          orderId: order.id,
          kind: 'EARN',
          delta: totals.pointsEarned,
          balanceAfter: totals.balanceAfter,
          note: `Earned on ${orderCode}`,
        },
      })
    }

    return {
      orderCode,
      subtotal: totals.subtotal,
      pointsRedeemed: totals.pointsRedeemed,
      amountPaid: totals.amountPaid,
      pointsEarned: totals.pointsEarned,
      balanceBefore,
      balanceAfter: totals.balanceAfter,
      crossedRedemptionThreshold: totals.crossedRedemptionThreshold,
      items: priced.map((line) => ({
        name: line.name,
        variantLabel: line.variantLabel,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      })),
    }
  })
}

export async function getOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: { code },
    include: { items: true, customer: true },
  })
}

export interface OrderReceipt {
  code: string
  createdAt: Date
  tableLabel: string | null
  mode: 'DINE_IN' | 'TAKEAWAY'
  subtotal: number
  pointsRedeemed: number
  amountPaid: number
  pointsEarned: number
  balanceBefore: number
  balanceAfter: number
  crossedRedemptionThreshold: boolean
  customerName: string | null
  items: {
    id: string
    name: string
    variantLabel: string | null
    unitPrice: number
    quantity: number
  }[]
}

/**
 * Reads the receipt back from the ledger rather than trusting a query
 * parameter, so the success page survives a refresh and can be shared.
 */
export async function getOrderReceipt(code: string): Promise<OrderReceipt | null> {
  const order = await prisma.order.findUnique({
    where: { code },
    include: {
      items: true,
      customer: true,
      ledger: { orderBy: { createdAt: 'asc' } },
    },
  })
  if (!order) return null

  const earnRow = order.ledger.find((row) => row.kind === 'EARN')
  const redeemRow = order.ledger.find((row) => row.kind === 'REDEEM')

  const balanceAfter =
    earnRow?.balanceAfter ?? redeemRow?.balanceAfter ?? order.customer.pointsBalance
  const balanceBefore = balanceAfter - order.pointsEarned + order.pointsRedeemed

  return {
    code: order.code,
    createdAt: order.createdAt,
    tableLabel: order.tableLabel,
    mode: order.mode,
    subtotal: order.subtotal,
    pointsRedeemed: order.pointsRedeemed,
    amountPaid: order.amountPaid,
    pointsEarned: order.pointsEarned,
    balanceBefore,
    balanceAfter,
    crossedRedemptionThreshold: !canRedeem(balanceBefore) && canRedeem(balanceAfter),
    customerName: order.customer.name,
    items: order.items.map((item) => ({
      id: item.id,
      name: item.name,
      variantLabel: item.variantLabel,
      unitPrice: item.unitPrice,
      quantity: item.quantity,
    })),
  }
}
