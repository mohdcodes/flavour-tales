import { create } from 'zustand'
import { persist, createJSONStorage, type StateStorage } from 'zustand/middleware'
import { cartSubtotal, type CartLine } from '@/lib/loyalty'

export interface CartItem {
  /** Derived, never supplied: `${menuItemSlug}:${variantKey ?? ''}` */
  key: string
  menuItemSlug: string
  name: string
  variantKey: string | null
  variantLabel: string | null
  unitPrice: number
  quantity: number
}

export interface CartState {
  items: CartItem[]
  phone: string | null
  /** Only set for a first-time customer; returning customers already have one server-side. */
  name: string | null
  tableLabel: string | null
  add: (item: Omit<CartItem, 'key' | 'quantity'>) => void
  setQuantity: (key: string, quantity: number) => void
  remove: (key: string) => void
  clear: () => void
  setPhone: (phone: string | null) => void
  setName: (name: string | null) => void
  setTableLabel: (label: string | null) => void
}

export function cartKey(menuItemSlug: string, variantKey: string | null): string {
  return `${menuItemSlug}:${variantKey ?? ''}`
}

// Vitest runs in a node environment and the server render has no localStorage.
const memoryStorage: StateStorage = {
  getItem: () => null,
  setItem: () => undefined,
  removeItem: () => undefined,
}

export const useCart = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      phone: null,
      name: null,
      tableLabel: null,

      add: (item) =>
        set((state) => {
          const key = cartKey(item.menuItemSlug, item.variantKey)
          const existing = state.items.find((line) => line.key === key)
          if (existing) {
            return {
              items: state.items.map((line) =>
                line.key === key ? { ...line, quantity: line.quantity + 1 } : line,
              ),
            }
          }
          return { items: [...state.items, { ...item, key, quantity: 1 }] }
        }),

      setQuantity: (key, quantity) =>
        set((state) => ({
          items:
            quantity < 1
              ? state.items.filter((line) => line.key !== key)
              : state.items.map((line) => (line.key === key ? { ...line, quantity } : line)),
        })),

      remove: (key) =>
        set((state) => ({ items: state.items.filter((line) => line.key !== key) })),

      // Empties the cart, not the customer: the phone number survives.
      clear: () => set({ items: [] }),

      setPhone: (phone) => set({ phone }),
      setName: (name) => set({ name }),
      setTableLabel: (tableLabel) => set({ tableLabel }),
    }),
    {
      name: 'ft-cart',
      storage: createJSONStorage(() =>
        typeof window === 'undefined' ? memoryStorage : window.localStorage,
      ),
      partialize: (state) => ({
        items: state.items,
        phone: state.phone,
        name: state.name,
        tableLabel: state.tableLabel,
      }),
    },
  ),
)

/**
 * Takes items rather than state, and is NOT a zustand selector: it builds a new
 * array each call, so passing it to `useCart()` would give an unstable snapshot
 * and loop forever. Call it inside a `useMemo` keyed on `items`.
 */
export function toCartLines(items: CartItem[]): CartLine[] {
  return items.map((item) => ({
    menuItemId: item.menuItemSlug,
    variantKey: item.variantKey,
    unitPrice: item.unitPrice,
    quantity: item.quantity,
  }))
}

/** Delegates to the tested loyalty engine; the arithmetic lives in one place. */
export function selectSubtotal(state: CartState): number {
  return cartSubtotal(toCartLines(state.items))
}

export function selectItemCount(state: CartState): number {
  return state.items.reduce((count, item) => count + item.quantity, 0)
}
