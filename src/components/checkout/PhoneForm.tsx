'use client'

import { useState } from 'react'
import { Field } from '@/components/ui/Field'
import { Button } from '@/components/ui/Button'

const TEN_DIGIT_INDIAN_MOBILE = /^[6-9]\d{9}$/

export function PhoneForm({
  onIdentified,
  label = 'Your mobile number',
  hint = 'Your points live here. No password, no app.',
  cta = 'Continue',
  askName = true,
}: {
  onIdentified: (phone: string, name: string | null) => void
  label?: string
  hint?: string
  cta?: string
  /** The wallet only needs to look someone up, so it skips the name step. */
  askName?: boolean
}) {
  const [phone, setPhoneValue] = useState('')
  const [name, setName] = useState('')
  const [needsName, setNeedsName] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [checking, setChecking] = useState(false)

  const isValidPhone = TEN_DIGIT_INDIAN_MOBILE.test(phone)

  async function submit(event: React.FormEvent) {
    event.preventDefault()

    if (needsName) {
      onIdentified(phone, name.trim() || null)
      return
    }

    if (!isValidPhone) {
      setError('Enter a 10-digit Indian mobile number')
      return
    }

    setChecking(true)
    setError(null)
    try {
      const response = await fetch('/api/customer/lookup', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone }),
      })
      const data = await response.json()
      if (!response.ok) {
        setError(data.error ?? 'Could not check that number')
        return
      }

      // A number we have never seen gets one extra question; a returning
      // customer is waved straight through.
      if (askName && !data.isReturning) {
        setNeedsName(true)
        return
      }
      onIdentified(phone, null)
    } catch {
      setError('Could not reach the kitchen. Try again.')
    } finally {
      setChecking(false)
    }
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-4">
      <Field
        label={label}
        hint={error ? undefined : hint}
        error={error ?? undefined}
        type="tel"
        inputMode="numeric"
        autoComplete="tel"
        maxLength={10}
        placeholder="98765 43210"
        value={phone}
        readOnly={needsName}
        onChange={(event) => {
          setPhoneValue(event.target.value.replace(/\D/g, '').slice(0, 10))
          setError(null)
        }}
      />

      {needsName ? (
        <Field
          label="First time here. What should we call you?"
          hint="Just a first name is fine."
          type="text"
          autoComplete="given-name"
          maxLength={60}
          placeholder="Anushi"
          value={name}
          autoFocus
          onChange={(event) => setName(event.target.value)}
        />
      ) : null}

      <Button type="submit" size="lg" disabled={!isValidPhone || checking}>
        {checking ? 'Checking…' : needsName ? 'Start earning' : cta}
      </Button>

      {needsName ? (
        <button
          type="button"
          onClick={() => onIdentified(phone, null)}
          className="self-center text-[0.78rem] text-ink-muted underline underline-offset-2"
        >
          Skip
        </button>
      ) : null}
    </form>
  )
}
