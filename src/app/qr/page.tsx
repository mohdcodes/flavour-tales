import QRCode from 'qrcode'
import { Wordmark } from '@/components/brand/Wordmark'

export const dynamic = 'force-dynamic'

const TABLES = [1, 2, 3, 4, 5, 6, 7, 8]

async function renderCode(url: string): Promise<string> {
  return QRCode.toString(url, {
    type: 'svg',
    errorCorrectionLevel: 'M',
    margin: 1,
    color: { dark: '#241542', light: '#FBF8F3' },
  })
}

export default async function QrPage() {
  const base = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3001'

  // The input is a server-constructed URL, never user input.
  const cards = await Promise.all([
    ...TABLES.map(async (table) => ({
      key: `table-${table}`,
      title: `Table ${table}`,
      svg: await renderCode(`${base}/?t=${table}`),
    })),
    {
      key: 'anywhere',
      title: 'Takeaway / anywhere',
      svg: await renderCode(base),
    },
  ])

  return (
    <div className="mx-auto max-w-5xl px-5 py-8">
      <header className="mb-6 print:hidden">
        <Wordmark className="text-2xl" />
        <h1 className="mt-2 font-display text-xl font-bold">Table codes</h1>
        <p className="text-[0.85rem] text-ink-muted">
          Print this page and stand one on each table. The last card has no table
          attached &mdash; use it for takeaway or anywhere else.
        </p>
      </header>

      <div className="grid grid-cols-2 gap-4 print:grid-cols-3">
        {cards.map((card) => (
          <div
            key={card.key}
            className="flex flex-col items-center gap-2 rounded-card border border-line bg-paper-raised p-4 text-center print:break-inside-avoid"
          >
            <Wordmark className="text-sm" />
            <div
              className="w-full max-w-[160px] [&>svg]:h-auto [&>svg]:w-full"
              dangerouslySetInnerHTML={{ __html: card.svg }}
            />
            <p className="font-display text-lg font-bold">{card.title}</p>
            <p className="text-[0.75rem] text-ink-muted">Scan to order &middot; earn 2% back</p>
          </div>
        ))}
      </div>
    </div>
  )
}
