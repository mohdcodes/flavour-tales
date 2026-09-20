import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
import { AppBackdrop } from '@/components/brand/AppBackdrop'
import './globals.css'

const display = Bricolage_Grotesque({
  subsets: ['latin'],
  variable: '--font-display',
  display: 'swap',
})

const body = Instrument_Sans({
  subsets: ['latin'],
  variable: '--font-body',
  display: 'swap',
})

export const metadata: Metadata = {
  title: 'flavor&tales',
  description: 'Order momos, earn points, eat again.',
}

export const viewport: Viewport = {
  themeColor: '#3C2470',
  width: 'device-width',
  initialScale: 1,
  // Deliberate: stops iOS Safari zooming when the phone-number input is focused.
  maximumScale: 1,
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">
        <AppBackdrop />
        {children}
      </body>
    </html>
  )
}
