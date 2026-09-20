import { describe, it, expect } from 'vitest'
import { formatRupees, formatPoints } from '@/lib/format'

describe('formatRupees', () => {
  it('prefixes a rupee sign and uses no decimals', () => {
    expect(formatRupees(190)).toBe('₹190')
  })

  it('groups thousands in the Indian system', () => {
    expect(formatRupees(125000)).toBe('₹1,25,000')
  })

  it('renders zero without a minus sign', () => {
    expect(formatRupees(0)).toBe('₹0')
  })
})

describe('formatPoints', () => {
  it('uses the singular for one point', () => {
    expect(formatPoints(1)).toBe('1 point')
  })

  it('uses the plural everywhere else', () => {
    expect(formatPoints(0)).toBe('0 points')
    expect(formatPoints(34)).toBe('34 points')
  })
})
