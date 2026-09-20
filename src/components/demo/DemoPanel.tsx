'use client'

import { useState } from 'react'

export function DemoPanel({
  phone,
  onGranted,
}: {
  phone: string
  onGranted: () => void
}) {
  const [message, setMessage] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function grant(points: number) {
    setBusy(true)
    setMessage(null)
    try {
      const response = await fetch('/api/demo/simulate', {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({ phone, points }),
      })
      if (response.status === 404) {
        setMessage('Demo tools are off. Set ENABLE_DEMO_TOOLS=true to use them.')
        return
      }
      if (!response.ok) {
        const data = await response.json().catch(() => ({}))
        setMessage(data.error ?? 'Could not grant points')
        return
      }
      onGranted()
    } catch {
      setMessage('Could not reach the server')
    } finally {
      setBusy(false)
    }
  }

  return (
    <section className="rounded-card border border-dashed border-line p-4">
      <p className="text-[0.7rem] font-semibold tracking-wide text-ink-muted uppercase">
        Demo tools
      </p>
      <p className="mt-1 text-[0.78rem] text-ink-muted">
        Simulate past spend so redemption is reachable in a walkthrough.
      </p>
      <div className="mt-3 flex gap-2">
        {[120, 340].map((points) => (
          <button
            key={points}
            type="button"
            disabled={busy}
            onClick={() => grant(points)}
            className="rounded-pill border border-line px-3.5 py-1.5 font-display text-[0.78rem] font-semibold disabled:opacity-40"
          >
            +{points} points
          </button>
        ))}
      </div>
      {message ? <p className="mt-2 text-[0.75rem] text-ink-muted">{message}</p> : null}
    </section>
  )
}
