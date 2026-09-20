'use client'

import { useEffect, useState } from 'react'

/**
 * The cart is restored from localStorage after the first paint, so anything that
 * renders cart state must wait or the server and client markup disagree.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false)
  useEffect(() => setHydrated(true), [])
  return hydrated
}
