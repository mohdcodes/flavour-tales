import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { placeOrder } from '@/lib/orders'
import { lookupCustomer } from '@/lib/customers'

const PHONE = '9876543210'

beforeEach(async () => {
  await prisma.pointsLedger.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()
})

describe('placeOrder', () => {
  it('creates the customer on a first order and earns two percent', async () => {
    const result = await placeOrder({
      phone: PHONE,
      name: 'Anushi',
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'steam-veg-momos', variantKey: 'steam', quantity: 1 }],
      redeemRequested: 0,
    })

    expect(result.subtotal).toBe(70)
    expect(result.amountPaid).toBe(70)
    expect(result.pointsEarned).toBe(1)
    expect(result.balanceBefore).toBe(0)
    expect(result.balanceAfter).toBe(1)
    expect(result.orderCode).toMatch(/^FT-\d{4}$/)

    const customer = await lookupCustomer(PHONE)
    expect(customer?.name).toBe('Anushi')
    expect(customer?.pointsBalance).toBe(1)
  })

  it('prices a variant from the database, not from the client', async () => {
    const result = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'steam-veg-momos', variantKey: 'fry', quantity: 2 }],
      redeemRequested: 0,
    })

    expect(result.subtotal).toBe(160)
    expect(result.items[0]).toMatchObject({
      name: 'Veg Momos',
      variantLabel: 'Fry',
      unitPrice: 80,
      quantity: 2,
    })
  })

  it('writes an EARN ledger row whose balanceAfter matches the customer cache', async () => {
    await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'ragi-paneer-momos', variantKey: 'pantoss', quantity: 1 }],
      redeemRequested: 0,
    })

    const ledger = await prisma.pointsLedger.findMany()
    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({ kind: 'EARN', delta: 4, balanceAfter: 4 })

    const customer = await prisma.customer.findUniqueOrThrow({ where: { phone: PHONE } })
    expect(customer.pointsBalance).toBe(ledger[0].balanceAfter)
  })

  it('writes both a REDEEM and an EARN row when points are spent', async () => {
    await prisma.customer.create({ data: { phone: PHONE, pointsBalance: 120 } })

    const result = await placeOrder({
      phone: PHONE,
      mode: 'DINE_IN',
      tableLabel: '5',
      lines: [
        { menuItemSlug: 'steam-veg-momos', variantKey: 'steam', quantity: 1 },
        { menuItemSlug: 'crispy-veg-momos', variantKey: null, quantity: 1 },
        { menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 },
      ],
      redeemRequested: 120,
    })

    expect(result.subtotal).toBe(230)
    expect(result.pointsRedeemed).toBe(120)
    expect(result.amountPaid).toBe(110)
    expect(result.pointsEarned).toBe(2)
    expect(result.balanceAfter).toBe(2)

    const ledger = await prisma.pointsLedger.findMany({ orderBy: { createdAt: 'asc' } })
    expect(ledger.map((row) => [row.kind, row.delta, row.balanceAfter])).toEqual([
      ['REDEEM', -120, 0],
      ['EARN', 2, 2],
    ])
  })

  it('ignores a redemption request when the balance is below the floor', async () => {
    await prisma.customer.create({ data: { phone: PHONE, pointsBalance: 99 } })

    const result = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 }],
      redeemRequested: 99,
    })

    expect(result.pointsRedeemed).toBe(0)
    expect(result.amountPaid).toBe(50)
  })

  it('rejects an unknown menu item without writing anything', async () => {
    await expect(
      placeOrder({
        phone: PHONE,
        mode: 'TAKEAWAY',
        lines: [{ menuItemSlug: 'not-on-the-menu', variantKey: null, quantity: 1 }],
        redeemRequested: 0,
      }),
    ).rejects.toThrow(/unknown menu item/i)

    expect(await prisma.order.count()).toBe(0)
    expect(await prisma.customer.count()).toBe(0)
  })

  it('rejects an empty cart', async () => {
    await expect(
      placeOrder({ phone: PHONE, mode: 'TAKEAWAY', lines: [], redeemRequested: 0 }),
    ).rejects.toThrow(/empty/i)
  })

  it('rejects a non-positive quantity', async () => {
    await expect(
      placeOrder({
        phone: PHONE,
        mode: 'TAKEAWAY',
        lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 0 }],
        redeemRequested: 0,
      }),
    ).rejects.toThrow(/quantity/i)
  })

  it('numbers orders sequentially within a day', async () => {
    const first = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 }],
      redeemRequested: 0,
    })
    const second = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 }],
      redeemRequested: 0,
    })

    expect(first.orderCode).toBe('FT-0001')
    expect(second.orderCode).toBe('FT-0002')
  })
})
