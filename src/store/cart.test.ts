import { describe, it, expect, beforeEach } from 'vitest'
import { useCart, selectSubtotal, selectItemCount } from '@/store/cart'

const vegSteam = {
  menuItemSlug: 'steam-veg-momos',
  name: 'Veg Momos',
  variantKey: 'steam',
  variantLabel: 'Steam',
  unitPrice: 70,
}
const vegFry = { ...vegSteam, variantKey: 'fry', variantLabel: 'Fry', unitPrice: 80 }

beforeEach(() => useCart.getState().clear())

describe('cart store', () => {
  it('adds an item with quantity one', () => {
    useCart.getState().add(vegSteam)
    expect(useCart.getState().items).toHaveLength(1)
    expect(useCart.getState().items[0].quantity).toBe(1)
  })

  it('increments rather than duplicating when the same variant is added again', () => {
    useCart.getState().add(vegSteam)
    useCart.getState().add(vegSteam)
    expect(useCart.getState().items).toHaveLength(1)
    expect(useCart.getState().items[0].quantity).toBe(2)
  })

  it('keeps two variants of one dish as separate lines', () => {
    useCart.getState().add(vegSteam)
    useCart.getState().add(vegFry)
    expect(useCart.getState().items).toHaveLength(2)
    expect(selectSubtotal(useCart.getState())).toBe(150)
  })

  it('removes a line when its quantity drops to zero', () => {
    useCart.getState().add(vegSteam)
    useCart.getState().setQuantity('steam-veg-momos:steam', 0)
    expect(useCart.getState().items).toHaveLength(0)
  })

  it('counts units rather than lines', () => {
    useCart.getState().add(vegSteam)
    useCart.getState().add(vegSteam)
    useCart.getState().add(vegFry)
    expect(selectItemCount(useCart.getState())).toBe(3)
  })

  it('remembers the phone number across a clear, because clear empties the cart, not the customer', () => {
    useCart.getState().setPhone('9876543210')
    useCart.getState().add(vegSteam)
    useCart.getState().clear()
    expect(useCart.getState().items).toHaveLength(0)
    expect(useCart.getState().phone).toBe('9876543210')
  })
})
