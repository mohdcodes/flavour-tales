export const POINTS_EARN_RATE = 0.02
export const REDEMPTION_FLOOR = 100

export interface CartLine {
  menuItemId: string
  variantKey: string | null
  unitPrice: number
  quantity: number
}

export interface OrderTotals {
  subtotal: number
  pointsRedeemed: number
  amountPaid: number
  pointsEarned: number
  balanceAfter: number
  crossedRedemptionThreshold: boolean
}

export function lineTotal(line: CartLine): number {
  return line.unitPrice * line.quantity
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0)
}

export function canRedeem(balance: number): boolean {
  return balance >= REDEMPTION_FLOOR
}

/** Points never buy change, so redemption is capped by the cart as well as the balance. */
export function maxRedeemable(balance: number, subtotal: number): number {
  if (!canRedeem(balance)) return 0
  return Math.min(balance, subtotal)
}

export function pointsEarnedFor(amountPaid: number): number {
  return Math.round(amountPaid * POINTS_EARN_RATE)
}

/**
 * Earn is computed on cash actually paid, never on the subtotal. Earning on the
 * subtotal would pay points back on points, so a balance would never drain.
 */
export function computeOrderTotals(input: {
  lines: CartLine[]
  balance: number
  redeemRequested: number
}): OrderTotals {
  const subtotal = cartSubtotal(input.lines)
  const allowance = maxRedeemable(input.balance, subtotal)
  const requested = Math.max(0, Math.floor(input.redeemRequested))
  const pointsRedeemed = Math.min(requested, allowance)
  const amountPaid = subtotal - pointsRedeemed
  const pointsEarned = pointsEarnedFor(amountPaid)
  const balanceAfter = input.balance - pointsRedeemed + pointsEarned

  return {
    subtotal,
    pointsRedeemed,
    amountPaid,
    pointsEarned,
    balanceAfter,
    crossedRedemptionThreshold: !canRedeem(input.balance) && canRedeem(balanceAfter),
  }
}
