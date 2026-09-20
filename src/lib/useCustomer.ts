'use client'

import { useEffect, useState } from 'react'
import type { CustomerSummary } from '@/lib/customers'

export function useCustomer(phone: string | null) {
  const [customer, setCustomer] = useState<CustomerSummary | null>(null)
  const [isReturning, setIsReturning] = useState(false)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!phone) {
      setCustomer(null)
      setIsReturning(false)
      return
    }

    let cancelled = false
    setLoading(true)

    fetch('/api/customer/lookup', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ phone }),
    })
      .then((response) => (response.ok ? response.json() : null))
      .then((data) => {
        if (cancelled || !data) return
        setCustomer(data.customer as CustomerSummary)
        setIsReturning(Boolean(data.isReturning))
      })
      .catch(() => undefined)
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [phone])

  return { customer, isReturning, loading }
}
