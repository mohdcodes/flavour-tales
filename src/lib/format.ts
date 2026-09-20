const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
})

export function formatRupees(amount: number): string {
  return `₹${rupeeFormatter.format(amount)}`
}

export function formatPoints(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}

const dateTimeFormatter = new Intl.DateTimeFormat('en-IN', {
  day: 'numeric',
  month: 'short',
  hour: 'numeric',
  minute: '2-digit',
  hour12: true,
})

export function formatDateTime(value: string | Date): string {
  const date = typeof value === 'string' ? new Date(value) : value
  return dateTimeFormatter.format(date)
}
