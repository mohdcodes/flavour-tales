import { describe, it, expect } from 'vitest'
import {
  POINTS_EARN_RATE,
  REDEMPTION_FLOOR,
  lineTotal,
  cartSubtotal,
  canRedeem,
  maxRedeemable,
  pointsEarnedFor,
  computeOrderTotals,
  type CartLine,
} from '@/lib/loyalty'

const line = (unitPrice: number, quantity: number): CartLine => ({
  menuItemId: 'x',
  variantKey: null,
  unitPrice,
  quantity,
})

describe('constants', () => {
  it('earns two percent and unlocks redemption at a hundred points', () => {
    expect(POINTS_EARN_RATE).toBe(0.02)
    expect(REDEMPTION_FLOOR).toBe(100)
  })
})

describe('lineTotal', () => {
  it('multiplies unit price by quantity', () => {
    expect(lineTotal(line(90, 2))).toBe(180)
  })
})

describe('cartSubtotal', () => {
  it('is zero for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0)
  })

  it('sums every line', () => {
    expect(cartSubtotal([line(70, 1), line(50, 1), line(90, 1)])).toBe(210)
  })
})

describe('canRedeem', () => {
  it('is false below the floor', () => {
    expect(canRedeem(0)).toBe(false)
    expect(canRedeem(99)).toBe(false)
  })

  it('is true at and above the floor', () => {
    expect(canRedeem(100)).toBe(true)
    expect(canRedeem(340)).toBe(true)
  })
})

describe('maxRedeemable', () => {
  it('is zero when the balance is below the floor, however large the cart', () => {
    expect(maxRedeemable(99, 5000)).toBe(0)
  })

  it('is capped by the balance', () => {
    expect(maxRedeemable(120, 190)).toBe(120)
  })

  it('is capped by the cart subtotal, so points never buy change', () => {
    expect(maxRedeemable(300, 190)).toBe(190)
  })
})

describe('pointsEarnedFor', () => {
  it('earns nothing on nothing', () => {
    expect(pointsEarnedFor(0)).toBe(0)
  })

  it('rounds to the nearest whole point', () => {
    expect(pointsEarnedFor(70)).toBe(1)
    expect(pointsEarnedFor(90)).toBe(2)
    expect(pointsEarnedFor(140)).toBe(3)
  })

  it('rounds a half point up and rounds a smaller fraction away', () => {
    expect(pointsEarnedFor(25)).toBe(1)
    expect(pointsEarnedFor(24)).toBe(0)
  })
})

describe('computeOrderTotals', () => {
  it('earns on the full subtotal when nothing is redeemed', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 0,
      redeemRequested: 0,
    })
    expect(totals).toEqual({
      subtotal: 190,
      pointsRedeemed: 0,
      amountPaid: 190,
      pointsEarned: 4,
      balanceAfter: 4,
      crossedRedemptionThreshold: false,
    })
  })

  it('earns on cash paid, not on subtotal, so points do not regenerate themselves', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 120,
      redeemRequested: 120,
    })
    expect(totals.amountPaid).toBe(70)
    expect(totals.pointsEarned).toBe(1)
    expect(totals.balanceAfter).toBe(1)
  })

  it('redeems nothing when the balance is below the floor', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 99,
      redeemRequested: 99,
    })
    expect(totals.pointsRedeemed).toBe(0)
    expect(totals.amountPaid).toBe(190)
    expect(totals.balanceAfter).toBe(99 + 4)
  })

  it('clamps a request larger than the allowance', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 500,
      redeemRequested: 400,
    })
    expect(totals.pointsRedeemed).toBe(190)
    expect(totals.amountPaid).toBe(0)
    expect(totals.pointsEarned).toBe(0)
    expect(totals.balanceAfter).toBe(310)
  })

  it('treats a negative or fractional request as a floor-clamped whole number', () => {
    expect(
      computeOrderTotals({ lines: [line(190, 1)], balance: 500, redeemRequested: -50 })
        .pointsRedeemed,
    ).toBe(0)
    expect(
      computeOrderTotals({ lines: [line(190, 1)], balance: 500, redeemRequested: 40.9 })
        .pointsRedeemed,
    ).toBe(40)
  })

  it('reports crossing the redemption threshold so the UI can celebrate it', () => {
    const totals = computeOrderTotals({
      lines: [line(2000, 1)],
      balance: 62,
      redeemRequested: 0,
    })
    expect(totals.balanceAfter).toBe(102)
    expect(totals.crossedRedemptionThreshold).toBe(true)
  })

  it('does not report a crossing when the balance was already above the floor', () => {
    const totals = computeOrderTotals({
      lines: [line(200, 1)],
      balance: 150,
      redeemRequested: 0,
    })
    expect(totals.crossedRedemptionThreshold).toBe(false)
  })

  it('handles an empty cart without dividing by anything', () => {
    const totals = computeOrderTotals({ lines: [], balance: 0, redeemRequested: 0 })
    expect(totals).toEqual({
      subtotal: 0,
      pointsRedeemed: 0,
      amountPaid: 0,
      pointsEarned: 0,
      balanceAfter: 0,
      crossedRedemptionThreshold: false,
    })
  })
})
