# flavor&tales Loyalty Ordering POC — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build a mobile-first ordering web app for flavor&tales where customers order via QR code or direct link, earn 2% of what they pay as loyalty points, and spend those points on future orders once they hold 100.

**Architecture:** One Next.js 15 App Router application deployed as a single Render Web Service, backed by PostgreSQL through Prisma. All loyalty arithmetic lives in pure, test-first functions in `src/lib/loyalty.ts`; order placement runs as one Prisma transaction that writes the order, its items, and the points ledger together. The client never supplies trusted totals — the server recomputes every price from the database.

**Tech Stack:** Next.js 15 (App Router), React 19, TypeScript strict, Tailwind CSS v4 (CSS-first config), Prisma 6 + PostgreSQL, Zod 4, Zustand 5 (cart state, localStorage-persisted), Vitest 3, canvas-confetti, qrcode.

**Spec:** [`cafe-loyalty/docs/specs/2026-09-20-cafe-loyalty-design.md`](../specs/2026-09-20-cafe-loyalty-design.md)

## Global Constraints

- **Never run `git commit` or `git push`.** The repository owner controls history. Each task ends with a **Checkpoint** step that states the suggested commit message; hand it over, do not execute it.
- Package manager is **pnpm**. All commands run from `cafe-loyalty/`.
- `cafe-loyalty/` is **independent of the surrounding pnpm workspace and Turborepo graph**. Do not add it to `pnpm-workspace.yaml`, do not add it to `turbo.json`, do not import anything from `@cosmohq/*`.
- TypeScript **strict mode**, no `any` in committed code.
- Money and points are **integers in whole rupees**. No floats in the database.
- Earn rate is exactly `0.02`. Redemption floor is exactly `100` points. One point equals one rupee.
- Earn is computed on **amount actually paid**, never on subtotal.
- **Typefaces:** Bricolage Grotesque (display) and Instrument Sans (body) only. Inter, Poppins, Montserrat and Roboto are forbidden, including as fallbacks before the system stack.
- **Palette tokens** (exact values, defined once in `globals.css`): `--violet-900 #241542`, `--violet-700 #3C2470`, `--violet-600 #5A3BA8`, `--violet-100 #EDE7FA`, `--ink #1B1226`, `--paper #FBF8F3`, `--gold-500 #F2A93B`, `--gold-700 #B9741A`, `--veg #2E7D32`.
- **Gold is reserved for points.** No gold on any control that is not about loyalty.
- **No food photography and no stock imagery.** Illustration is the hand-drawn line-art set only.
- **Copy register:** second person, short, no exclamation marks, no "Congratulations". Exact strings are given per task and must be used verbatim.
- Every animation must be suppressed under `prefers-reduced-motion: reduce`, rendering the end state directly.
- All API responses are JSON. Errors return `{ error: string }` with a 4xx/5xx status.

---

## File Structure

```
cafe-loyalty/
  package.json                       deps + scripts
  tsconfig.json                      strict TS, @/* path alias
  next.config.ts                     output: 'standalone' for Render
  postcss.config.mjs                 @tailwindcss/postcss
  vitest.config.ts                   node env, @/* alias
  .env.example                       documented env vars
  .gitignore
  render.yaml                        Render blueprint
  README.md                          local setup + deploy
  prisma/
    schema.prisma                    all models
    seed.ts                          seeds categories + items from src/data/menu.ts
  src/
    data/menu.ts                     the flavor&tales menu, single source of truth
    lib/
      loyalty.ts                     pure loyalty arithmetic  (TESTED)
      loyalty.test.ts
      orders.ts                      placeOrder transaction   (TESTED)
      orders.test.ts
      customers.ts                   lookupCustomer, history
      demo.ts                        simulatePastOrders (demo tools only)
      db.ts                          Prisma client singleton
      validation.ts                  Zod request schemas
      format.ts                      formatRupees, formatPoints
    store/cart.ts                    Zustand cart + phone, localStorage-persisted
    app/
      layout.tsx                     fonts, <body>, paper background
      globals.css                    Tailwind v4 import + design tokens
      page.tsx                       menu screen (server component shell)
      checkout/page.tsx
      success/[code]/page.tsx
      wallet/page.tsx
      qr/page.tsx
      api/menu/route.ts
      api/customer/lookup/route.ts
      api/customer/[phone]/orders/route.ts
      api/orders/route.ts
      api/demo/simulate/route.ts
    components/
      brand/Doodles.tsx              inline SVG line-art set
      brand/Wordmark.tsx
      ui/Button.tsx  Sheet.tsx  Field.tsx  VegMark.tsx
      menu/MenuScreen.tsx  CategoryNav.tsx  ItemCard.tsx
           VariantPicker.tsx  QtyStepper.tsx
      cart/CartBar.tsx  CartSheet.tsx
      checkout/PhoneForm.tsx  RedeemControl.tsx  OrderSummary.tsx
      success/SuccessCard.tsx  Confetti.tsx  PointsRing.tsx  CountUp.tsx
      wallet/BalanceCard.tsx  LedgerList.tsx  OrderHistory.tsx
      demo/DemoPanel.tsx
```

**Why this split:** `lib/` holds everything with a decision in it and is the only place with tests. `components/` is grouped by screen rather than by technical layer, because the files that change together are the files that belong to one screen. `data/menu.ts` is plain TypeScript rather than JSON so the seed script and the type system share one definition.

---

## Task 1: Project scaffold

**Files:**
- Create: `cafe-loyalty/package.json`, `tsconfig.json`, `next.config.ts`, `postcss.config.mjs`, `vitest.config.ts`, `.gitignore`, `.env.example`
- Create: `cafe-loyalty/src/app/layout.tsx`, `src/app/globals.css`, `src/app/page.tsx`
- Test: `cafe-loyalty/src/lib/format.test.ts`, `src/lib/format.ts`

**Interfaces:**
- Consumes: nothing.
- Produces: a working `pnpm dev` / `pnpm test` / `pnpm build`; `formatRupees(n: number): string` and `formatPoints(n: number): string` from `@/lib/format`.

- [ ] **Step 1: Create the package manifest**

`cafe-loyalty/package.json`:

```json
{
  "name": "cafe-loyalty",
  "version": "0.1.0",
  "private": true,
  "scripts": {
    "dev": "next dev",
    "build": "prisma generate && next build",
    "start": "next start",
    "test": "vitest run",
    "test:watch": "vitest",
    "db:push": "prisma db push",
    "db:migrate": "prisma migrate dev",
    "db:deploy": "prisma migrate deploy",
    "db:seed": "tsx prisma/seed.ts",
    "db:studio": "prisma studio"
  },
  "prisma": { "seed": "tsx prisma/seed.ts" },
  "dependencies": {
    "@prisma/client": "^6.1.0",
    "canvas-confetti": "^1.9.3",
    "next": "^15.1.0",
    "qrcode": "^1.5.4",
    "react": "^19.0.0",
    "react-dom": "^19.0.0",
    "zod": "^4.0.0",
    "zustand": "^5.0.2"
  },
  "devDependencies": {
    "@tailwindcss/postcss": "^4.0.0",
    "@types/canvas-confetti": "^1.6.4",
    "@types/node": "^22.10.0",
    "@types/qrcode": "^1.5.5",
    "@types/react": "^19.0.0",
    "@types/react-dom": "^19.0.0",
    "prisma": "^6.1.0",
    "tailwindcss": "^4.0.0",
    "tsx": "^4.19.0",
    "typescript": "^5.7.0",
    "vitest": "^3.0.0"
  }
}
```

- [ ] **Step 2: Create the TypeScript and build config**

`tsconfig.json`:

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["dom", "dom.iterable", "esnext"],
    "allowJs": false,
    "skipLibCheck": true,
    "strict": true,
    "noEmit": true,
    "esModuleInterop": true,
    "module": "esnext",
    "moduleResolution": "bundler",
    "resolveJsonModule": true,
    "isolatedModules": true,
    "jsx": "preserve",
    "incremental": true,
    "plugins": [{ "name": "next" }],
    "paths": { "@/*": ["./src/*"] }
  },
  "include": ["next-env.d.ts", "**/*.ts", "**/*.tsx", ".next/types/**/*.ts"],
  "exclude": ["node_modules"]
}
```

`next.config.ts`:

```ts
import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  output: 'standalone',
}

export default nextConfig
```

`postcss.config.mjs`:

```js
export default { plugins: { '@tailwindcss/postcss': {} } }
```

`vitest.config.ts`:

```ts
import { defineConfig } from 'vitest/config'
import { fileURLToPath } from 'node:url'

export default defineConfig({
  test: { environment: 'node', include: ['src/**/*.test.ts'] },
  resolve: {
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
})
```

`.gitignore`:

```
node_modules
.next
.env
.env*.local
next-env.d.ts
*.tsbuildinfo
```

`.env.example`:

```
# Postgres connection string (Neon in production, local Podman container in dev)
DATABASE_URL="postgresql://cafe:cafe@localhost:5433/cafe_loyalty"
# Base URL used to generate QR codes
NEXT_PUBLIC_APP_URL="http://localhost:3000"
# Set to "true" to reveal the ?demo=1 points simulator. Never true in a real deploy.
ENABLE_DEMO_TOOLS="true"
```

- [ ] **Step 3: Write the failing test for the formatters**

`src/lib/format.test.ts`:

```ts
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
```

- [ ] **Step 4: Run the test and confirm it fails**

Run: `cd cafe-loyalty && pnpm install && pnpm test`
Expected: FAIL — `Failed to resolve import "@/lib/format"`.

- [ ] **Step 5: Implement the formatters**

`src/lib/format.ts`:

```ts
const rupeeFormatter = new Intl.NumberFormat('en-IN', {
  maximumFractionDigits: 0,
})

export function formatRupees(amount: number): string {
  return `₹${rupeeFormatter.format(amount)}`
}

export function formatPoints(points: number): string {
  return `${points} ${points === 1 ? 'point' : 'points'}`
}
```

- [ ] **Step 6: Run the test and confirm it passes**

Run: `pnpm test`
Expected: PASS — 5 tests.

- [ ] **Step 7: Create a minimal layout and page so `pnpm build` succeeds**

`src/app/globals.css` (tokens only for now; the full design system arrives in Task 6):

```css
@import 'tailwindcss';

@theme {
  --color-violet-900: #241542;
  --color-violet-700: #3c2470;
  --color-violet-600: #5a3ba8;
  --color-violet-100: #ede7fa;
  --color-ink: #1b1226;
  --color-paper: #fbf8f3;
  --color-gold-500: #f2a93b;
  --color-gold-700: #b9741a;
  --color-veg: #2e7d32;
}

html,
body {
  background: var(--color-paper);
  color: var(--color-ink);
}
```

`src/app/layout.tsx`:

```tsx
import type { Metadata } from 'next'
import './globals.css'

export const metadata: Metadata = {
  title: 'flavor&tales',
  description: 'Order momos, earn points, eat again.',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  )
}
```

`src/app/page.tsx`:

```tsx
export default function Page() {
  return <main>flavor&amp;tales</main>
}
```

- [ ] **Step 8: Verify the app builds and serves**

Run: `pnpm build`
Expected: build succeeds, no type errors.

Run: `pnpm dev` and open `http://localhost:3000`
Expected: the text `flavor&tales` renders on the warm paper background.

- [ ] **Step 9: Checkpoint**

Do not commit. Report the suggested message to the user:

```
chore(cafe-loyalty): scaffold Next.js 15 app with Tailwind v4 and Vitest
```

---

## Task 2: Menu data and the loyalty engine

This is the tested core of the product. Written test-first; nothing else in the plan may reimplement this arithmetic.

**Files:**
- Create: `src/data/menu.ts`
- Create: `src/lib/loyalty.ts`
- Test: `src/lib/loyalty.test.ts`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `MENU: MenuCategorySeed[]`, and the types `MenuVariant { key: string; label: string; price: number }`, `MenuItemSeed { slug: string; name: string; description?: string; basePrice: number; variants?: MenuVariant[] }`, `MenuCategorySeed { slug: string; name: string; subtitle?: string; items: MenuItemSeed[] }` from `@/data/menu`.
  - From `@/lib/loyalty`: `POINTS_EARN_RATE`, `REDEMPTION_FLOOR`, `CartLine { menuItemId: string; variantKey: string | null; unitPrice: number; quantity: number }`, `OrderTotals { subtotal: number; pointsRedeemed: number; amountPaid: number; pointsEarned: number; balanceAfter: number; crossedRedemptionThreshold: boolean }`, and the functions `lineTotal`, `cartSubtotal`, `canRedeem`, `maxRedeemable`, `pointsEarnedFor`, `computeOrderTotals`.

- [ ] **Step 1: Create the menu data**

Item slugs are category-qualified because three different categories each contain an item named "Cheese Corn Momos" at three different prices. An unqualified slug would collide.

`src/data/menu.ts`:

```ts
export interface MenuVariant {
  key: string
  label: string
  price: number
}

export interface MenuItemSeed {
  slug: string
  name: string
  description?: string
  /** Price when no variant is chosen. When variants exist this equals variants[0].price. */
  basePrice: number
  variants?: MenuVariant[]
}

export interface MenuCategorySeed {
  slug: string
  name: string
  subtitle?: string
  items: MenuItemSeed[]
}

const steamOrFry = (steam: number, fry: number): MenuVariant[] => [
  { key: 'steam', label: 'Steam', price: steam },
  { key: 'fry', label: 'Fry', price: fry },
]

const steamOrPantoss = (steam: number, pantoss: number): MenuVariant[] => [
  { key: 'steam', label: 'Steam', price: steam },
  { key: 'pantoss', label: 'Pantoss', price: pantoss },
]

export const MENU: MenuCategorySeed[] = [
  {
    slug: 'steam-momos',
    name: 'Steam Momos',
    items: [
      { slug: 'steam-veg-momos', name: 'Veg Momos', basePrice: 70, variants: steamOrFry(70, 80) },
      { slug: 'steam-cheese-corn-momos', name: 'Cheese Corn Momos', basePrice: 90, variants: steamOrFry(90, 110) },
      { slug: 'steam-paneer-momos', name: 'Paneer Momos', basePrice: 90, variants: steamOrFry(90, 110) },
      { slug: 'steam-veg-cheese-momos', name: 'Veg Cheese Momos', basePrice: 100, variants: steamOrFry(100, 110) },
    ],
  },
  {
    slug: 'pantoss-momos',
    name: 'Pantoss Momos',
    items: [
      { slug: 'pantoss-veg-momos', name: 'Veg Pantoss Momos', basePrice: 80 },
      { slug: 'pantoss-paneer-momos', name: 'Paneer Pantoss Momos', basePrice: 115 },
      { slug: 'pantoss-veg-cheese-momos', name: 'Veg Cheese Pantoss Momos', basePrice: 115 },
      { slug: 'pantoss-cheese-corn-momos', name: 'Cheese Corn Momos', basePrice: 115 },
    ],
  },
  {
    slug: 'crispy-momos',
    name: 'Crispy Momos',
    items: [
      { slug: 'crispy-veg-momos', name: 'Veg Crispy Momos', basePrice: 110 },
      { slug: 'crispy-cheese-corn-momos', name: 'Cheese Corn Momos', basePrice: 130 },
      { slug: 'crispy-paneer-momos', name: 'Paneer Crispy Momos', basePrice: 130 },
      { slug: 'crispy-cheese-momos', name: 'Cheese Crispy Momos', basePrice: 130 },
    ],
  },
  {
    slug: 'chefs-special',
    name: "Chef's Special",
    subtitle: 'Millet Momos',
    items: [
      { slug: 'ragi-veg-momos', name: 'Ragi Veg Momos', basePrice: 150, variants: steamOrPantoss(150, 165) },
      { slug: 'ragi-paneer-momos', name: 'Ragi Paneer Momos', basePrice: 180, variants: steamOrPantoss(180, 195) },
    ],
  },
  {
    slug: 'cheese-corner',
    name: 'Cheese Corner',
    items: [
      { slug: 'corn-cheese-samosa-3', name: 'Corn Cheese Samosa', description: '3 pieces', basePrice: 55 },
      { slug: 'corn-cheese-samosa-6', name: 'Corn Cheese Samosa', description: '6 pieces', basePrice: 105 },
    ],
  },
  {
    slug: 'maggie',
    name: 'Maggie',
    items: [
      { slug: 'classic-maggie', name: 'Classic Maggie', basePrice: 50 },
      { slug: 'double-masala-maggie', name: 'Double Masala Maggie', basePrice: 60 },
      { slug: 'veg-butter-maggie', name: 'Veg Butter Maggie', basePrice: 70 },
      { slug: 'cheese-maggie', name: 'Cheese Maggie', basePrice: 90 },
    ],
  },
  {
    slug: 'desert',
    name: 'Desert',
    items: [
      { slug: 'classic-brownie', name: 'Classic Brownie', basePrice: 100 },
      { slug: 'lotus-biscoff', name: 'Lotus Biscoff', basePrice: 120 },
      { slug: 'cookie-dough', name: 'Cookie Dough', basePrice: 130 },
      { slug: 'brownie-ice-cream', name: 'Brownie with Ice-Cream', description: 'Vanilla or choco chip', basePrice: 140 },
    ],
  },
  {
    slug: 'combos',
    name: "Combo's",
    items: [
      { slug: 'combo-maggie-veg-steam', name: 'Maggie + Veg Steam Momos', basePrice: 90 },
      { slug: 'combo-masala-maggie-veg-fried', name: 'Double Masala Maggie + Veg Fried Momos', basePrice: 100 },
      { slug: 'combo-cheese-maggie-samosa', name: 'Cheese Maggie + Cheese Corn Samosa', basePrice: 110 },
      {
        slug: 'combo-chefs-cheese-platter',
        name: "Chef's Special Cheese Platter",
        description: 'Corn cheese samosa (2) + cheese fry momos (3) + cheese maggie (1)',
        basePrice: 140,
      },
    ],
  },
]
```

- [ ] **Step 2: Write the failing loyalty tests**

`src/lib/loyalty.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import {
  POINTS_EARN_RATE,
  REDEMPTION_FLOOR,
  lineTotal,
  cartSubtotal,
  canRedeem,
  maxRedeemable,
  pointsEarnedFor,
  computeOrderTotals,
  type CartLine,
} from '@/lib/loyalty'

const line = (unitPrice: number, quantity: number): CartLine => ({
  menuItemId: 'x',
  variantKey: null,
  unitPrice,
  quantity,
})

describe('constants', () => {
  it('earns two percent and unlocks redemption at a hundred points', () => {
    expect(POINTS_EARN_RATE).toBe(0.02)
    expect(REDEMPTION_FLOOR).toBe(100)
  })
})

describe('lineTotal', () => {
  it('multiplies unit price by quantity', () => {
    expect(lineTotal(line(90, 2))).toBe(180)
  })
})

describe('cartSubtotal', () => {
  it('is zero for an empty cart', () => {
    expect(cartSubtotal([])).toBe(0)
  })

  it('sums every line', () => {
    expect(cartSubtotal([line(70, 1), line(50, 1), line(90, 1)])).toBe(210)
  })
})

describe('canRedeem', () => {
  it('is false below the floor', () => {
    expect(canRedeem(0)).toBe(false)
    expect(canRedeem(99)).toBe(false)
  })

  it('is true at and above the floor', () => {
    expect(canRedeem(100)).toBe(true)
    expect(canRedeem(340)).toBe(true)
  })
})

describe('maxRedeemable', () => {
  it('is zero when the balance is below the floor, however large the cart', () => {
    expect(maxRedeemable(99, 5000)).toBe(0)
  })

  it('is capped by the balance', () => {
    expect(maxRedeemable(120, 190)).toBe(120)
  })

  it('is capped by the cart subtotal, so points never buy change', () => {
    expect(maxRedeemable(300, 190)).toBe(190)
  })
})

describe('pointsEarnedFor', () => {
  it('earns nothing on nothing', () => {
    expect(pointsEarnedFor(0)).toBe(0)
  })

  it('rounds to the nearest whole point', () => {
    expect(pointsEarnedFor(70)).toBe(1)
    expect(pointsEarnedFor(90)).toBe(2)
    expect(pointsEarnedFor(140)).toBe(3)
  })

  it('rounds a half point up and rounds a smaller fraction away', () => {
    expect(pointsEarnedFor(25)).toBe(1)
    expect(pointsEarnedFor(24)).toBe(0)
  })
})

describe('computeOrderTotals', () => {
  it('earns on the full subtotal when nothing is redeemed', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 0,
      redeemRequested: 0,
    })
    expect(totals).toEqual({
      subtotal: 190,
      pointsRedeemed: 0,
      amountPaid: 190,
      pointsEarned: 4,
      balanceAfter: 4,
      crossedRedemptionThreshold: false,
    })
  })

  it('earns on cash paid, not on subtotal, so points do not regenerate themselves', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 120,
      redeemRequested: 120,
    })
    expect(totals.amountPaid).toBe(70)
    expect(totals.pointsEarned).toBe(1)
    expect(totals.balanceAfter).toBe(1)
  })

  it('redeems nothing when the balance is below the floor', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 99,
      redeemRequested: 99,
    })
    expect(totals.pointsRedeemed).toBe(0)
    expect(totals.amountPaid).toBe(190)
    expect(totals.balanceAfter).toBe(99 + 4)
  })

  it('clamps a request larger than the allowance', () => {
    const totals = computeOrderTotals({
      lines: [line(190, 1)],
      balance: 500,
      redeemRequested: 400,
    })
    expect(totals.pointsRedeemed).toBe(190)
    expect(totals.amountPaid).toBe(0)
    expect(totals.pointsEarned).toBe(0)
    expect(totals.balanceAfter).toBe(310)
  })

  it('treats a negative or fractional request as a floor-clamped whole number', () => {
    expect(
      computeOrderTotals({ lines: [line(190, 1)], balance: 500, redeemRequested: -50 })
        .pointsRedeemed,
    ).toBe(0)
    expect(
      computeOrderTotals({ lines: [line(190, 1)], balance: 500, redeemRequested: 40.9 })
        .pointsRedeemed,
    ).toBe(40)
  })

  it('reports crossing the redemption threshold so the UI can celebrate it', () => {
    const totals = computeOrderTotals({
      lines: [line(2000, 1)],
      balance: 62,
      redeemRequested: 0,
    })
    expect(totals.balanceAfter).toBe(102)
    expect(totals.crossedRedemptionThreshold).toBe(true)
  })

  it('does not report a crossing when the balance was already above the floor', () => {
    const totals = computeOrderTotals({
      lines: [line(200, 1)],
      balance: 150,
      redeemRequested: 0,
    })
    expect(totals.crossedRedemptionThreshold).toBe(false)
  })

  it('handles an empty cart without dividing by anything', () => {
    const totals = computeOrderTotals({ lines: [], balance: 0, redeemRequested: 0 })
    expect(totals).toEqual({
      subtotal: 0,
      pointsRedeemed: 0,
      amountPaid: 0,
      pointsEarned: 0,
      balanceAfter: 0,
      crossedRedemptionThreshold: false,
    })
  })
})
```

- [ ] **Step 3: Run the tests and confirm they fail**

Run: `pnpm test src/lib/loyalty.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/loyalty"`.

- [ ] **Step 4: Implement the loyalty engine**

`src/lib/loyalty.ts`:

```ts
export const POINTS_EARN_RATE = 0.02
export const REDEMPTION_FLOOR = 100

export interface CartLine {
  menuItemId: string
  variantKey: string | null
  unitPrice: number
  quantity: number
}

export interface OrderTotals {
  subtotal: number
  pointsRedeemed: number
  amountPaid: number
  pointsEarned: number
  balanceAfter: number
  crossedRedemptionThreshold: boolean
}

export function lineTotal(line: CartLine): number {
  return line.unitPrice * line.quantity
}

export function cartSubtotal(lines: CartLine[]): number {
  return lines.reduce((sum, line) => sum + lineTotal(line), 0)
}

export function canRedeem(balance: number): boolean {
  return balance >= REDEMPTION_FLOOR
}

/** Points never buy change, so redemption is capped by the cart as well as the balance. */
export function maxRedeemable(balance: number, subtotal: number): number {
  if (!canRedeem(balance)) return 0
  return Math.min(balance, subtotal)
}

export function pointsEarnedFor(amountPaid: number): number {
  return Math.round(amountPaid * POINTS_EARN_RATE)
}

export function computeOrderTotals(input: {
  lines: CartLine[]
  balance: number
  redeemRequested: number
}): OrderTotals {
  const subtotal = cartSubtotal(input.lines)
  const allowance = maxRedeemable(input.balance, subtotal)
  const requested = Math.max(0, Math.floor(input.redeemRequested))
  const pointsRedeemed = Math.min(requested, allowance)
  const amountPaid = subtotal - pointsRedeemed
  const pointsEarned = pointsEarnedFor(amountPaid)
  const balanceAfter = input.balance - pointsRedeemed + pointsEarned

  return {
    subtotal,
    pointsRedeemed,
    amountPaid,
    pointsEarned,
    balanceAfter,
    crossedRedemptionThreshold:
      !canRedeem(input.balance) && canRedeem(balanceAfter),
  }
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `pnpm test`
Expected: PASS — all loyalty and format tests green.

- [ ] **Step 6: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add menu data and tested loyalty engine
```

---

## Task 3: Database schema, client and seed

**Files:**
- Create: `prisma/schema.prisma`, `prisma/seed.ts`
- Create: `src/lib/db.ts`
- Modify: `README.md` (create it) with the local database instructions

**Interfaces:**
- Consumes: `MENU` from `@/data/menu`.
- Produces: `prisma` (a `PrismaClient` singleton) from `@/lib/db`; the models `MenuCategory`, `MenuItem`, `Customer`, `Order`, `OrderItem`, `PointsLedger` and the enums `OrderMode` (`DINE_IN` | `TAKEAWAY`) and `LedgerKind` (`EARN` | `REDEEM` | `ADJUST`).

- [ ] **Step 1: Start a local Postgres**

The project uses Podman, never Docker.

```bash
podman run -d --name cafe-loyalty-db \
  -e POSTGRES_USER=cafe -e POSTGRES_PASSWORD=cafe -e POSTGRES_DB=cafe_loyalty \
  -p 5433:5432 postgres:16-alpine
```

Then `cp .env.example .env`. Port 5433 avoids colliding with any Postgres the Cosmo stack is already running on 5432.

- [ ] **Step 2: Write the Prisma schema**

`prisma/schema.prisma`:

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model MenuCategory {
  id       String     @id @default(cuid())
  slug     String     @unique
  name     String
  subtitle String?
  sort     Int
  items    MenuItem[]
}

model MenuItem {
  id          String       @id @default(cuid())
  slug        String       @unique
  name        String
  description String?
  basePrice   Int
  /// MenuVariant[] as defined in src/data/menu.ts; null when the item has no variants.
  variants    Json?
  available   Boolean      @default(true)
  sort        Int
  categoryId  String
  category    MenuCategory @relation(fields: [categoryId], references: [id], onDelete: Cascade)
  orderItems  OrderItem[]

  @@index([categoryId])
}

model Customer {
  id            String         @id @default(cuid())
  phone         String         @unique
  name          String?
  pointsBalance Int            @default(0)
  createdAt     DateTime       @default(now())
  orders        Order[]
  ledger        PointsLedger[]
}

enum OrderMode {
  DINE_IN
  TAKEAWAY
}

model Order {
  id             String         @id @default(cuid())
  code           String         @unique
  customerId     String
  customer       Customer       @relation(fields: [customerId], references: [id], onDelete: Cascade)
  tableLabel     String?
  mode           OrderMode      @default(TAKEAWAY)
  subtotal       Int
  pointsRedeemed Int
  amountPaid     Int
  pointsEarned   Int
  createdAt      DateTime       @default(now())
  items          OrderItem[]
  ledger         PointsLedger[]

  @@index([customerId, createdAt])
}

model OrderItem {
  id           String   @id @default(cuid())
  orderId      String
  order        Order    @relation(fields: [orderId], references: [id], onDelete: Cascade)
  menuItemId   String
  menuItem     MenuItem @relation(fields: [menuItemId], references: [id])
  /// Name, variant and price are snapshotted so a later menu edit cannot rewrite history.
  name         String
  variantKey   String?
  variantLabel String?
  unitPrice    Int
  quantity     Int

  @@index([orderId])
}

enum LedgerKind {
  EARN
  REDEEM
  ADJUST
}

model PointsLedger {
  id           String     @id @default(cuid())
  customerId   String
  customer     Customer   @relation(fields: [customerId], references: [id], onDelete: Cascade)
  orderId      String?
  order        Order?     @relation(fields: [orderId], references: [id], onDelete: SetNull)
  delta        Int
  kind         LedgerKind
  balanceAfter Int
  note         String?
  createdAt    DateTime   @default(now())

  @@index([customerId, createdAt])
}
```

- [ ] **Step 3: Create the Prisma client singleton**

Next.js hot-reloads modules in development, which would otherwise open a new pool on every edit.

`src/lib/db.ts`:

```ts
import { PrismaClient } from '@prisma/client'

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClient }

export const prisma = globalForPrisma.prisma ?? new PrismaClient()

if (process.env.NODE_ENV !== 'production') globalForPrisma.prisma = prisma
```

- [ ] **Step 4: Write the seed script**

The seed is idempotent so it can run on every deploy.

`prisma/seed.ts`:

```ts
import { PrismaClient } from '@prisma/client'
import { MENU } from '../src/data/menu'

const prisma = new PrismaClient()

async function main() {
  for (const [categoryIndex, category] of MENU.entries()) {
    const saved = await prisma.menuCategory.upsert({
      where: { slug: category.slug },
      create: {
        slug: category.slug,
        name: category.name,
        subtitle: category.subtitle,
        sort: categoryIndex,
      },
      update: { name: category.name, subtitle: category.subtitle, sort: categoryIndex },
    })

    for (const [itemIndex, item] of category.items.entries()) {
      await prisma.menuItem.upsert({
        where: { slug: item.slug },
        create: {
          slug: item.slug,
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          variants: item.variants ?? undefined,
          sort: itemIndex,
          categoryId: saved.id,
        },
        update: {
          name: item.name,
          description: item.description,
          basePrice: item.basePrice,
          variants: item.variants ?? undefined,
          sort: itemIndex,
          categoryId: saved.id,
        },
      })
    }
  }

  const categories = await prisma.menuCategory.count()
  const items = await prisma.menuItem.count()
  console.log(`Seeded ${categories} categories and ${items} items.`)
}

main()
  .catch((error) => {
    console.error(error)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
```

- [ ] **Step 5: Push the schema and seed it**

Run: `pnpm db:push && pnpm db:seed`
Expected: `Seeded 8 categories and 28 items.`

- [ ] **Step 6: Verify the data landed correctly**

Run: `pnpm db:studio`, open the `MenuItem` table.
Expected: `steam-cheese-corn-momos`, `pantoss-cheese-corn-momos` and `crispy-cheese-corn-momos` all exist as separate rows with base prices 90, 115 and 130. `steam-veg-momos` has a `variants` JSON array of two entries.

- [ ] **Step 7: Write the README**

`README.md` must document: the Podman command from Step 1, `cp .env.example .env`, `pnpm install`, `pnpm db:push && pnpm db:seed`, `pnpm dev`, and a line stating that `ENABLE_DEMO_TOOLS` must be unset in any non-demo deploy.

- [ ] **Step 8: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add Prisma schema, client singleton and idempotent menu seed
```

---

## Task 4: Order placement transaction

**Files:**
- Create: `src/lib/orders.ts`
- Create: `src/lib/customers.ts`
- Test: `src/lib/orders.test.ts`

**Interfaces:**
- Consumes: `prisma` from `@/lib/db`; `computeOrderTotals`, `CartLine` from `@/lib/loyalty`.
- Produces, from `@/lib/orders`:
  - `PlaceOrderInput { phone: string; name?: string; tableLabel?: string | null; mode: 'DINE_IN' | 'TAKEAWAY'; lines: { menuItemSlug: string; variantKey: string | null; quantity: number }[]; redeemRequested: number }`
  - `PlaceOrderResult { orderCode: string; subtotal: number; pointsRedeemed: number; amountPaid: number; pointsEarned: number; balanceBefore: number; balanceAfter: number; crossedRedemptionThreshold: boolean; items: { name: string; variantLabel: string | null; unitPrice: number; quantity: number }[] }`
  - `placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult>`
  - `getOrderByCode(code: string)` returning the order with its items, or `null`.
- Produces, from `@/lib/customers`: `CustomerSummary { phone: string; name: string | null; pointsBalance: number; canRedeem: boolean }`, `lookupCustomer(phone: string): Promise<CustomerSummary | null>`, `getCustomerActivity(phone: string)` returning `{ orders, ledger }`.

- [ ] **Step 1: Write the failing transaction tests**

These run against the local Postgres from Task 3. The suite truncates customer-side tables between tests and leaves the seeded menu alone.

`src/lib/orders.test.ts`:

```ts
import { describe, it, expect, beforeEach } from 'vitest'
import { prisma } from '@/lib/db'
import { placeOrder } from '@/lib/orders'
import { lookupCustomer } from '@/lib/customers'

const PHONE = '9876543210'

beforeEach(async () => {
  await prisma.pointsLedger.deleteMany()
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.customer.deleteMany()
})

describe('placeOrder', () => {
  it('creates the customer on a first order and earns two percent', async () => {
    const result = await placeOrder({
      phone: PHONE,
      name: 'Anushi',
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'steam-veg-momos', variantKey: 'steam', quantity: 1 }],
      redeemRequested: 0,
    })

    expect(result.subtotal).toBe(70)
    expect(result.amountPaid).toBe(70)
    expect(result.pointsEarned).toBe(1)
    expect(result.balanceBefore).toBe(0)
    expect(result.balanceAfter).toBe(1)
    expect(result.orderCode).toMatch(/^FT-\d{4}$/)

    const customer = await lookupCustomer(PHONE)
    expect(customer?.name).toBe('Anushi')
    expect(customer?.pointsBalance).toBe(1)
  })

  it('prices a variant from the database, not from the client', async () => {
    const result = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'steam-veg-momos', variantKey: 'fry', quantity: 2 }],
      redeemRequested: 0,
    })

    expect(result.subtotal).toBe(160)
    expect(result.items[0]).toMatchObject({
      name: 'Veg Momos',
      variantLabel: 'Fry',
      unitPrice: 80,
      quantity: 2,
    })
  })

  it('writes an EARN ledger row whose balanceAfter matches the customer cache', async () => {
    await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'ragi-paneer-momos', variantKey: 'pantoss', quantity: 1 }],
      redeemRequested: 0,
    })

    const ledger = await prisma.pointsLedger.findMany()
    expect(ledger).toHaveLength(1)
    expect(ledger[0]).toMatchObject({ kind: 'EARN', delta: 4, balanceAfter: 4 })

    const customer = await prisma.customer.findUniqueOrThrow({ where: { phone: PHONE } })
    expect(customer.pointsBalance).toBe(ledger[0].balanceAfter)
  })

  it('writes both a REDEEM and an EARN row when points are spent', async () => {
    await prisma.customer.create({ data: { phone: PHONE, pointsBalance: 120 } })

    const result = await placeOrder({
      phone: PHONE,
      mode: 'DINE_IN',
      tableLabel: '5',
      lines: [
        { menuItemSlug: 'steam-veg-momos', variantKey: 'steam', quantity: 1 },
        { menuItemSlug: 'crispy-veg-momos', variantKey: null, quantity: 1 },
        { menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 },
      ],
      redeemRequested: 120,
    })

    expect(result.subtotal).toBe(230)
    expect(result.pointsRedeemed).toBe(120)
    expect(result.amountPaid).toBe(110)
    expect(result.pointsEarned).toBe(2)
    expect(result.balanceAfter).toBe(2)

    const ledger = await prisma.pointsLedger.findMany({ orderBy: { createdAt: 'asc' } })
    expect(ledger.map((row) => [row.kind, row.delta, row.balanceAfter])).toEqual([
      ['REDEEM', -120, 0],
      ['EARN', 2, 2],
    ])
  })

  it('ignores a redemption request when the balance is below the floor', async () => {
    await prisma.customer.create({ data: { phone: PHONE, pointsBalance: 99 } })

    const result = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 }],
      redeemRequested: 99,
    })

    expect(result.pointsRedeemed).toBe(0)
    expect(result.amountPaid).toBe(50)
  })

  it('rejects an unknown menu item without writing anything', async () => {
    await expect(
      placeOrder({
        phone: PHONE,
        mode: 'TAKEAWAY',
        lines: [{ menuItemSlug: 'not-on-the-menu', variantKey: null, quantity: 1 }],
        redeemRequested: 0,
      }),
    ).rejects.toThrow(/unknown menu item/i)

    expect(await prisma.order.count()).toBe(0)
    expect(await prisma.customer.count()).toBe(0)
  })

  it('rejects an empty cart', async () => {
    await expect(
      placeOrder({ phone: PHONE, mode: 'TAKEAWAY', lines: [], redeemRequested: 0 }),
    ).rejects.toThrow(/empty/i)
  })

  it('rejects a non-positive quantity', async () => {
    await expect(
      placeOrder({
        phone: PHONE,
        mode: 'TAKEAWAY',
        lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 0 }],
        redeemRequested: 0,
      }),
    ).rejects.toThrow(/quantity/i)
  })

  it('numbers orders sequentially within a day', async () => {
    const first = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 }],
      redeemRequested: 0,
    })
    const second = await placeOrder({
      phone: PHONE,
      mode: 'TAKEAWAY',
      lines: [{ menuItemSlug: 'classic-maggie', variantKey: null, quantity: 1 }],
      redeemRequested: 0,
    })

    expect(first.orderCode).toBe('FT-0001')
    expect(second.orderCode).toBe('FT-0002')
  })
})
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm test src/lib/orders.test.ts`
Expected: FAIL — `Failed to resolve import "@/lib/orders"`.

- [ ] **Step 3: Implement the customer helpers**

`src/lib/customers.ts`:

```ts
import { prisma } from '@/lib/db'
import { canRedeem } from '@/lib/loyalty'

export interface CustomerSummary {
  phone: string
  name: string | null
  pointsBalance: number
  canRedeem: boolean
}

export async function lookupCustomer(phone: string): Promise<CustomerSummary | null> {
  const customer = await prisma.customer.findUnique({ where: { phone } })
  if (!customer) return null

  return {
    phone: customer.phone,
    name: customer.name,
    pointsBalance: customer.pointsBalance,
    canRedeem: canRedeem(customer.pointsBalance),
  }
}

export async function getCustomerActivity(phone: string) {
  const customer = await prisma.customer.findUnique({
    where: { phone },
    include: {
      orders: { include: { items: true }, orderBy: { createdAt: 'desc' }, take: 25 },
      ledger: { orderBy: { createdAt: 'desc' }, take: 50 },
    },
  })
  if (!customer) return null

  return {
    summary: {
      phone: customer.phone,
      name: customer.name,
      pointsBalance: customer.pointsBalance,
      canRedeem: canRedeem(customer.pointsBalance),
    } satisfies CustomerSummary,
    orders: customer.orders,
    ledger: customer.ledger,
  }
}
```

- [ ] **Step 4: Implement order placement**

Everything happens inside one `prisma.$transaction`, so a failure at any point leaves no partial order and no orphaned ledger row. The order code is a daily counter; a genuine race would need two orders in the same millisecond, which a POC does not need to defend against — note it in a comment rather than adding a sequence table.

`src/lib/orders.ts`:

```ts
import { prisma } from '@/lib/db'
import { computeOrderTotals, type CartLine } from '@/lib/loyalty'
import type { MenuVariant } from '@/data/menu'

export interface PlaceOrderInput {
  phone: string
  name?: string
  tableLabel?: string | null
  mode: 'DINE_IN' | 'TAKEAWAY'
  lines: { menuItemSlug: string; variantKey: string | null; quantity: number }[]
  redeemRequested: number
}

export interface PlaceOrderResult {
  orderCode: string
  subtotal: number
  pointsRedeemed: number
  amountPaid: number
  pointsEarned: number
  balanceBefore: number
  balanceAfter: number
  crossedRedemptionThreshold: boolean
  items: {
    name: string
    variantLabel: string | null
    unitPrice: number
    quantity: number
  }[]
}

function startOfToday(): Date {
  const now = new Date()
  return new Date(now.getFullYear(), now.getMonth(), now.getDate())
}

export async function placeOrder(input: PlaceOrderInput): Promise<PlaceOrderResult> {
  if (input.lines.length === 0) throw new Error('Cart is empty')
  for (const line of input.lines) {
    if (!Number.isInteger(line.quantity) || line.quantity < 1) {
      throw new Error('Line quantity must be a positive whole number')
    }
  }

  return prisma.$transaction(async (tx) => {
    const menuItems = await tx.menuItem.findMany({
      where: { slug: { in: input.lines.map((line) => line.menuItemSlug) } },
    })
    const bySlug = new Map(menuItems.map((item) => [item.slug, item]))

    // Prices come from the database. Anything the client sent is a preview only.
    const priced = input.lines.map((line) => {
      const item = bySlug.get(line.menuItemSlug)
      if (!item) throw new Error(`Unknown menu item: ${line.menuItemSlug}`)
      if (!item.available) throw new Error(`${item.name} is not available right now`)

      const variants = (item.variants ?? null) as MenuVariant[] | null
      const variant = line.variantKey
        ? variants?.find((candidate) => candidate.key === line.variantKey)
        : undefined
      if (line.variantKey && !variant) {
        throw new Error(`Unknown variant ${line.variantKey} for ${item.name}`)
      }

      return {
        menuItemId: item.id,
        name: item.name,
        variantKey: variant?.key ?? null,
        variantLabel: variant?.label ?? null,
        unitPrice: variant?.price ?? item.basePrice,
        quantity: line.quantity,
      }
    })

    const existing = await tx.customer.findUnique({ where: { phone: input.phone } })
    const balanceBefore = existing?.pointsBalance ?? 0

    const cartLines: CartLine[] = priced.map((line) => ({
      menuItemId: line.menuItemId,
      variantKey: line.variantKey,
      unitPrice: line.unitPrice,
      quantity: line.quantity,
    }))
    const totals = computeOrderTotals({
      lines: cartLines,
      balance: balanceBefore,
      redeemRequested: input.redeemRequested,
    })

    const customer = existing
      ? await tx.customer.update({
          where: { id: existing.id },
          data: {
            name: input.name ?? existing.name,
            pointsBalance: totals.balanceAfter,
          },
        })
      : await tx.customer.create({
          data: {
            phone: input.phone,
            name: input.name,
            pointsBalance: totals.balanceAfter,
          },
        })

    // Daily counter. Two orders in the same millisecond could collide; acceptable for a POC.
    const todayCount = await tx.order.count({ where: { createdAt: { gte: startOfToday() } } })
    const orderCode = `FT-${String(todayCount + 1).padStart(4, '0')}`

    const order = await tx.order.create({
      data: {
        code: orderCode,
        customerId: customer.id,
        tableLabel: input.tableLabel ?? null,
        mode: input.mode,
        subtotal: totals.subtotal,
        pointsRedeemed: totals.pointsRedeemed,
        amountPaid: totals.amountPaid,
        pointsEarned: totals.pointsEarned,
        items: {
          create: priced.map((line) => ({
            menuItemId: line.menuItemId,
            name: line.name,
            variantKey: line.variantKey,
            variantLabel: line.variantLabel,
            unitPrice: line.unitPrice,
            quantity: line.quantity,
          })),
        },
      },
    })

    if (totals.pointsRedeemed > 0) {
      await tx.pointsLedger.create({
        data: {
          customerId: customer.id,
          orderId: order.id,
          kind: 'REDEEM',
          delta: -totals.pointsRedeemed,
          balanceAfter: balanceBefore - totals.pointsRedeemed,
          note: `Redeemed against ${orderCode}`,
        },
      })
    }

    if (totals.pointsEarned > 0) {
      await tx.pointsLedger.create({
        data: {
          customerId: customer.id,
          orderId: order.id,
          kind: 'EARN',
          delta: totals.pointsEarned,
          balanceAfter: totals.balanceAfter,
          note: `Earned on ${orderCode}`,
        },
      })
    }

    return {
      orderCode,
      subtotal: totals.subtotal,
      pointsRedeemed: totals.pointsRedeemed,
      amountPaid: totals.amountPaid,
      pointsEarned: totals.pointsEarned,
      balanceBefore,
      balanceAfter: totals.balanceAfter,
      crossedRedemptionThreshold: totals.crossedRedemptionThreshold,
      items: priced.map((line) => ({
        name: line.name,
        variantLabel: line.variantLabel,
        unitPrice: line.unitPrice,
        quantity: line.quantity,
      })),
    }
  })
}

export async function getOrderByCode(code: string) {
  return prisma.order.findUnique({
    where: { code },
    include: { items: true, customer: true },
  })
}
```

- [ ] **Step 5: Run the tests and confirm they pass**

Run: `pnpm test`
Expected: PASS — format, loyalty and orders suites all green.

- [ ] **Step 6: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add transactional order placement with points ledger
```

---

## Task 5: API routes

**Files:**
- Create: `src/lib/validation.ts`
- Create: `src/app/api/menu/route.ts`, `src/app/api/customer/lookup/route.ts`, `src/app/api/customer/[phone]/orders/route.ts`, `src/app/api/orders/route.ts`

**Interfaces:**
- Consumes: `placeOrder`, `PlaceOrderResult` from `@/lib/orders`; `lookupCustomer`, `getCustomerActivity` from `@/lib/customers`; `prisma` from `@/lib/db`.
- Produces, from `@/lib/validation`: `phoneSchema`, `placeOrderSchema`. Produces the four HTTP endpoints below.

- [ ] **Step 1: Write the request schemas**

Indian mobile numbers are ten digits beginning 6–9.

`src/lib/validation.ts`:

```ts
import { z } from 'zod'

export const phoneSchema = z
  .string()
  .trim()
  .regex(/^[6-9]\d{9}$/, 'Enter a 10-digit Indian mobile number')

export const placeOrderSchema = z.object({
  phone: phoneSchema,
  name: z.string().trim().min(1).max(60).optional(),
  tableLabel: z.string().trim().max(12).nullish(),
  mode: z.enum(['DINE_IN', 'TAKEAWAY']),
  lines: z
    .array(
      z.object({
        menuItemSlug: z.string().min(1),
        variantKey: z.string().min(1).nullable(),
        quantity: z.number().int().min(1).max(20),
      }),
    )
    .min(1, 'Cart is empty'),
  redeemRequested: z.number().int().min(0).default(0),
})

export type PlaceOrderBody = z.infer<typeof placeOrderSchema>
```

- [ ] **Step 2: Implement `GET /api/menu`**

`src/app/api/menu/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { prisma } from '@/lib/db'

export const dynamic = 'force-dynamic'

export async function GET() {
  const categories = await prisma.menuCategory.findMany({
    orderBy: { sort: 'asc' },
    include: {
      items: { where: { available: true }, orderBy: { sort: 'asc' } },
    },
  })

  return NextResponse.json({ categories })
}
```

- [ ] **Step 3: Implement `POST /api/customer/lookup`**

A phone number that has never ordered is not an error — it is a new customer, and the client needs a zero balance rather than a 404.

`src/app/api/customer/lookup/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { phoneSchema } from '@/lib/validation'
import { lookupCustomer } from '@/lib/customers'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = phoneSchema.safeParse(body?.phone)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const customer = await lookupCustomer(parsed.data)

  return NextResponse.json({
    customer: customer ?? {
      phone: parsed.data,
      name: null,
      pointsBalance: 0,
      canRedeem: false,
    },
    isReturning: customer !== null,
  })
}
```

- [ ] **Step 4: Implement `POST /api/orders`**

`src/app/api/orders/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { placeOrderSchema } from '@/lib/validation'
import { placeOrder } from '@/lib/orders'

export async function POST(request: Request) {
  const body = await request.json().catch(() => null)
  const parsed = placeOrderSchema.safeParse(body)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  try {
    const result = await placeOrder(parsed.data)
    return NextResponse.json(result, { status: 201 })
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not place the order'
    return NextResponse.json({ error: message }, { status: 422 })
  }
}
```

- [ ] **Step 5: Implement `GET /api/customer/[phone]/orders`**

`src/app/api/customer/[phone]/orders/route.ts`:

```ts
import { NextResponse } from 'next/server'
import { phoneSchema } from '@/lib/validation'
import { getCustomerActivity } from '@/lib/customers'

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ phone: string }> },
) {
  const { phone } = await params
  const parsed = phoneSchema.safeParse(phone)
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0].message }, { status: 400 })
  }

  const activity = await getCustomerActivity(parsed.data)
  if (!activity) return NextResponse.json({ error: 'No orders yet' }, { status: 404 })

  return NextResponse.json(activity)
}
```

- [ ] **Step 6: Verify every endpoint by hand**

With `pnpm dev` running:

```bash
curl -s localhost:3000/api/menu | head -c 400
curl -s -X POST localhost:3000/api/customer/lookup -H 'content-type: application/json' -d '{"phone":"9876543210"}'
curl -s -X POST localhost:3000/api/orders -H 'content-type: application/json' \
  -d '{"phone":"9876543210","name":"Anushi","mode":"TAKEAWAY","lines":[{"menuItemSlug":"steam-veg-momos","variantKey":"fry","quantity":2}],"redeemRequested":0}'
curl -s localhost:3000/api/customer/9876543210/orders | head -c 400
curl -s -X POST localhost:3000/api/customer/lookup -H 'content-type: application/json' -d '{"phone":"12345"}'
```

Expected: eight categories; a zero balance for an unknown number; a 201 with `subtotal: 160` and `pointsEarned: 3`; the order in the activity feed; and a 400 reading `Enter a 10-digit Indian mobile number`.

- [ ] **Step 7: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add menu, customer and order API routes with Zod validation
```

---

## Task 6: Design system foundation

Nothing here is decorative filler — this task is what stops the app looking generated. Do not substitute other typefaces, other colours, or a component library.

**Files:**
- Modify: `src/app/globals.css`, `src/app/layout.tsx`
- Create: `src/components/brand/Doodles.tsx`, `src/components/brand/Wordmark.tsx`
- Create: `src/components/ui/Button.tsx`, `src/components/ui/Field.tsx`, `src/components/ui/VegMark.tsx`, `src/components/ui/Sheet.tsx`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `<Doodle name={DoodleName} className?: string />` where `type DoodleName = 'dumpling' | 'steam' | 'star' | 'sparkle' | 'bowl' | 'brownie' | 'noodles' | 'samosa'`, plus `<DoodleField className?: string />` which tiles doodles as a low-opacity backdrop.
  - `<Wordmark className?: string />`.
  - `<Button variant="primary" | "gold" | "ghost" size="md" | "lg" ...buttonProps />`.
  - `<Field label={string} error?: string ...inputProps />`.
  - `<VegMark />` — the square green vegetarian symbol.
  - `<Sheet open={boolean} onClose={() => void} title={string}>{children}</Sheet>` — bottom sheet, focus-trapped, closes on Escape and backdrop click.

- [ ] **Step 1: Load the typefaces**

`next/font/google` self-hosts them, so there is no render-blocking request to Google.

Modify `src/app/layout.tsx`:

```tsx
import type { Metadata, Viewport } from 'next'
import { Bricolage_Grotesque, Instrument_Sans } from 'next/font/google'
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
  maximumScale: 1,
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${display.variable} ${body.variable}`}>
      <body className="min-h-dvh bg-paper text-ink antialiased">{children}</body>
    </html>
  )
}
```

`maximumScale: 1` is deliberate: it stops iOS Safari zooming when the phone-number input is focused.

- [ ] **Step 2: Extend the design tokens**

Replace `src/app/globals.css` with the full token set. Tailwind v4 is configured in CSS; there is no `tailwind.config.js`.

```css
@import 'tailwindcss';

@theme {
  --color-violet-900: #241542;
  --color-violet-700: #3c2470;
  --color-violet-600: #5a3ba8;
  --color-violet-100: #ede7fa;
  --color-ink: #1b1226;
  --color-ink-muted: #6b5f78;
  --color-paper: #fbf8f3;
  --color-paper-raised: #ffffff;
  --color-gold-500: #f2a93b;
  --color-gold-700: #b9741a;
  --color-veg: #2e7d32;
  --color-line: #e7e0d6;

  --font-display: var(--font-display), ui-sans-serif, system-ui, sans-serif;
  --font-sans: var(--font-body), ui-sans-serif, system-ui, sans-serif;

  --radius-card: 1.125rem;
  --radius-pill: 999px;

  --shadow-card: 0 1px 2px rgb(36 21 66 / 0.04), 0 8px 24px -12px rgb(36 21 66 / 0.18);
  --shadow-bar: 0 -8px 32px -16px rgb(36 21 66 / 0.35);

  --container-app: 26rem;
}

html {
  -webkit-text-size-adjust: 100%;
}

body {
  font-family: var(--font-sans);
}

/* Money and point columns must align. */
.tabular {
  font-variant-numeric: tabular-nums;
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
  }
}
```

- [ ] **Step 3: Author the line-art doodle set**

These are traced from the cafe's own menu board: white single-weight strokes, rounded caps, no fills. Every path uses `stroke="currentColor"`, `fill="none"`, `strokeWidth={1.6}`, `strokeLinecap="round"`, `strokeLinejoin="round"` and a `0 0 48 48` viewBox, so a doodle inherits colour from its container and can be tinted wherever it is used.

`src/components/brand/Doodles.tsx` exports:

```tsx
export type DoodleName =
  | 'dumpling'   // a pleated momo in profile: a curved base with 4 pleat strokes over it
  | 'steam'      // three rising wavy curls of steam
  | 'star'       // the four-point sparkle star from the board
  | 'sparkle'    // a smaller four-point star, used as punctuation
  | 'bowl'       // a noodle bowl with a rim ellipse and chopsticks
  | 'brownie'    // a stacked square slice seen at three-quarter angle
  | 'noodles'    // two wavy strands over a fork
  | 'samosa'     // a triangle with a folded seam line

export function Doodle(props: { name: DoodleName; className?: string }): JSX.Element
export function DoodleField(props: { className?: string }): JSX.Element
```

`DoodleField` renders an absolutely positioned, `aria-hidden`, `pointer-events-none` layer that scatters six doodles at fixed percentage offsets with rotations between -18° and 22° at `opacity-[0.14]`. It is used behind the header and behind the balance card. Fixed offsets, not random — the layout must be identical between server and client render.

- [ ] **Step 4: Build the primitives**

`Button` variants:
- `primary` — `bg-violet-600 text-white` with `active:scale-[0.98]`, `rounded-pill`, `font-display font-semibold`.
- `gold` — `bg-gold-500 text-violet-900`. Used only for loyalty actions.
- `ghost` — transparent with a `border-line` outline and `text-ink`.

Sizes: `md` is `h-11 px-5 text-[0.95rem]`; `lg` is `h-14 px-6 text-base w-full`. Every button has `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-violet-600` and `disabled:opacity-40 disabled:pointer-events-none`. Minimum touch target is 44px.

`Field` renders a label above a `h-14 rounded-card border border-line bg-paper-raised px-4 text-lg` input, and an error line in `text-[0.8rem] text-red-700` below when `error` is set. The input must carry `aria-invalid` when `error` is set.

`VegMark` is the standard Indian symbol: a `12px` square with a `1.5px` `--color-veg` border and a filled `5px` circle centred inside. Give it `role="img"` and `aria-label="Vegetarian"`.

`Sheet` is a bottom sheet: a `fixed inset-0 bg-violet-900/40 backdrop-blur-[2px]` backdrop plus a `rounded-t-[1.75rem] bg-paper-raised` panel pinned to the bottom, `max-w-app mx-auto`, with a 36×4px grab handle. It traps focus, restores focus to the trigger on close, closes on Escape and on backdrop click, and sets `overflow:hidden` on `document.body` while open. Animate with a translateY transition that the reduced-motion rule in `globals.css` already neutralises.

- [ ] **Step 5: Verify the foundation renders**

Temporarily render `<Wordmark />`, one `<Button>` of each variant, a `<Field>`, a `<VegMark>` and a `<DoodleField>` on `src/app/page.tsx`.

Run: `pnpm dev`, then inspect at a 375×812 viewport in the browser pane.
Expected: headings render in Bricolage Grotesque and body text in Instrument Sans (confirm in devtools that neither resolves to a system fallback); the background is warm `#FBF8F3` rather than white; the gold button is visibly distinct from the violet one; doodles sit behind content without intercepting clicks.

- [ ] **Step 6: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add design tokens, typefaces, line-art doodles and UI primitives
```

---

## Task 7: Menu screen and cart state

**Files:**
- Create: `src/store/cart.ts`
- Test: `src/store/cart.test.ts`
- Create: `src/components/menu/MenuScreen.tsx`, `CategoryNav.tsx`, `ItemCard.tsx`, `VariantPicker.tsx`, `QtyStepper.tsx`
- Create: `src/components/cart/CartBar.tsx`
- Modify: `src/app/page.tsx`

**Interfaces:**
- Consumes: `prisma` from `@/lib/db`; `cartSubtotal`, `pointsEarnedFor` from `@/lib/loyalty`; `formatRupees` from `@/lib/format`; the Task 6 primitives.
- Produces, from `@/store/cart`:
  - `CartItem { key: string; menuItemSlug: string; name: string; variantKey: string | null; variantLabel: string | null; unitPrice: number; quantity: number }` where `key` is `` `${menuItemSlug}:${variantKey ?? ''}` ``.
  - `useCart()` exposing `items`, `phone`, `tableLabel`, `add(item: Omit<CartItem, 'key' | 'quantity'>)`, `setQuantity(key: string, quantity: number)`, `remove(key: string)`, `clear()`, `setPhone(phone: string | null)`, `setTableLabel(label: string | null)`.
  - `selectSubtotal(state)`, `selectItemCount(state)`.

- [ ] **Step 1: Write the failing cart store tests**

`src/store/cart.test.ts`:

```ts
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
```

- [ ] **Step 2: Run the tests and confirm they fail**

Run: `pnpm test src/store/cart.test.ts`
Expected: FAIL — module not found.

- [ ] **Step 3: Implement the store**

Use `zustand` with the `persist` middleware writing to `localStorage` under the key `ft-cart`. Persist `items`, `phone` and `tableLabel`. `clear()` empties `items` only.

`key` is derived, never supplied by the caller: `` `${menuItemSlug}:${variantKey ?? ''}` ``. `setQuantity` with a value below 1 removes the line. `selectSubtotal` delegates to `cartSubtotal` from `@/lib/loyalty` — do not re-add the arithmetic here.

- [ ] **Step 4: Run the tests and confirm they pass**

Run: `pnpm test`
Expected: PASS.

- [ ] **Step 5: Build the menu screen**

`src/app/page.tsx` is a server component that reads categories and items directly through `prisma` (no fetch to its own API) and passes them to `<MenuScreen>`, a client component. It reads `searchParams.t` and passes it as `tableLabel`.

Layout, top to bottom:

- **Header** — `bg-violet-700 text-white` with a `<DoodleField>` behind it, `rounded-b-[1.75rem]`. Contains `<Wordmark>`, the line `every dish begins with a story` in `text-white/70 text-[0.8rem]`, and — when `tableLabel` is set — a pill reading `Table {n}` in `bg-white/15`. On the right, a points pill showing the stored balance when a phone is known, otherwise a link to `/wallet` reading `Your points`.
- **CategoryNav** — a horizontally scrolling, `sticky top-0 z-20` chip row on a `bg-paper/90 backdrop-blur` strip. Chips use `IntersectionObserver` with `rootMargin: '-45% 0px -50% 0px'` to highlight the section currently in view, and `scrollIntoView({ behavior: 'smooth', block: 'start' })` on tap. The active chip is `bg-violet-600 text-white`; the rest are `bg-violet-100 text-violet-700`.
- **Sections** — one per category, each with an `id={category.slug}`, a `font-display text-xl` heading, and the subtitle in `text-ink-muted text-[0.8rem]` when present (`Chef's Special` carries `Millet Momos`).
- **ItemCard** — a `rounded-card bg-paper-raised shadow-card` row. Left: `<VegMark>`, name in `font-display font-semibold`, description in `text-ink-muted text-[0.8rem]`, price in `font-display tabular`. Right: either `<QtyStepper>` when the line is in the cart, or an `Add` button. Items with variants show `<VariantPicker>` beneath the name as a two-chip segmented control; the displayed price follows the selected variant. Default selection is the first variant.
- **QtyStepper** — a 44px-tall `rounded-pill border-violet-600` control with `−`, a tabular count, and `+`. Both buttons need `aria-label`s (`Remove one Veg Momos`, `Add one Veg Momos`).
- **CartBar** — `fixed bottom-0 z-30`, `max-w-app mx-auto`, `bg-violet-700 text-white shadow-bar`, hidden when the cart is empty. Left column: `{n} items` over `{formatRupees(subtotal)}`. Right: a gold `View cart` button. Above the row, in `text-gold-500 text-[0.78rem]`, the earn preview: `You'll earn {pointsEarnedFor(subtotal)} pts`. Add `pb-[env(safe-area-inset-bottom)]`, and give the page `pb-32` so the bar never covers the last item.

Empty-cart copy, used verbatim: `Nothing in the bag yet. The momos are waiting.`

- [ ] **Step 6: Verify the screen by hand**

Run `pnpm dev` and inspect at 375×812 in the browser pane.
Expected: all eight categories render; switching Veg Momos from Steam to Fry changes the price from ₹70 to ₹80; adding it twice shows a stepper reading 2; the cart bar appears with `₹160` and `You'll earn 3 pts`; scrolling moves the active category chip; nothing overlaps the cart bar; there is no horizontal scroll.

- [ ] **Step 7: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add menu screen, variant pricing and persisted cart
```

---

## Task 8: Cart sheet and checkout

**Files:**
- Create: `src/components/cart/CartSheet.tsx`
- Create: `src/components/checkout/PhoneForm.tsx`, `RedeemControl.tsx`, `OrderSummary.tsx`
- Create: `src/app/checkout/page.tsx`
- Modify: `src/components/cart/CartBar.tsx` (open the sheet)

**Interfaces:**
- Consumes: `useCart`, `selectSubtotal` from `@/store/cart`; `maxRedeemable`, `canRedeem`, `computeOrderTotals`, `REDEMPTION_FLOOR` from `@/lib/loyalty`; `formatRupees`, `formatPoints` from `@/lib/format`; `POST /api/customer/lookup` and `POST /api/orders`; the Task 6 primitives.
- Produces: a checkout flow that ends by navigating to `/success/{orderCode}`.

- [ ] **Step 1: Build the cart sheet**

`<CartSheet>` wraps `<Sheet title="Your bag">`. It lists each line with name, variant label, a `<QtyStepper>`, and the line total; below that a subtotal row; below that the gold earn line; and a full-width primary `Checkout` button that routes to `/checkout`. When the last line is removed the sheet closes and the empty-cart copy replaces it.

- [ ] **Step 2: Build the phone step**

`<PhoneForm>` is the first thing on `/checkout` when `useCart().phone` is null. One `<Field type="tel" inputMode="numeric" autoComplete="tel" maxLength={10}>` labelled `Your mobile number`, with the helper line `Your points live here. No password, no app.` It validates against the same ten-digit rule as `phoneSchema` before enabling submit, then POSTs to `/api/customer/lookup`.

On a returning customer, replace the form with a greeting: `Welcome back, {name}.` when a name is stored, otherwise `Welcome back.`, followed by `{formatPoints(balance)} in your account`. Store the phone with `setPhone`. Offer a small ghost `Not you?` action that clears the phone and returns to the form.

- [ ] **Step 3: Build the redemption control**

`<RedeemControl>` renders only when `canRedeem(balance)`. It is a `bg-violet-100 rounded-card` block containing a toggle switch labelled `Use {max} points` and, beneath it, `Saves you {formatRupees(max)} on this order` in `text-gold-700`. `max` comes from `maxRedeemable(balance, subtotal)`. Toggling sets `redeemRequested` to `max` or `0` — no partial-amount slider, because it adds a control for a choice nobody makes.

When `balance > 0` but below the floor, render instead, in `text-ink-muted text-[0.8rem]`: `{REDEMPTION_FLOOR - balance} points to your next free bite.`

- [ ] **Step 4: Build the summary and submit**

`<OrderSummary>` shows every line, then the rows `Subtotal`, `Points used` (only when non-zero, in `text-gold-700`, rendered as `− {formatRupees(pointsRedeemed)}`), and `To pay` in `font-display text-lg`. All figures come from `computeOrderTotals` on the client — presented as a preview only; the server recomputes.

Beneath it, a `mode` choice: two chips, `Dine-in` and `Takeaway`. When the URL carried `?t=`, `Dine-in` is preselected and the table pill is shown.

The submit button is `<Button variant="primary" size="lg">` reading `Place order · {formatRupees(amountPaid)}`. On tap it disables itself, POSTs to `/api/orders`, and on success calls `clear()` and `router.push('/success/' + orderCode)`. On failure it re-enables and shows the server's `error` string above the button in `text-red-700`.

Mock payment is a single line of copy under the button: `Pay at the counter when you collect.` There is no payment integration.

- [ ] **Step 5: Verify the flow by hand**

At 375×812: add three items, open the bag, adjust a quantity, checkout, enter `9876543210`, place the order.
Expected: the phone step accepts only ten digits starting 6–9; a second order with the same number greets you by name; no redemption control appears at a balance under 100; the order lands and the app navigates to `/success/FT-000n`; the cart is empty on return to `/`.

- [ ] **Step 6: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add cart sheet, phone identification and checkout with redemption
```

---

## Task 9: Success screen, confetti and the points ring

**Files:**
- Create: `src/components/success/SuccessCard.tsx`, `Confetti.tsx`, `PointsRing.tsx`, `CountUp.tsx`
- Create: `src/app/success/[code]/page.tsx`

**Interfaces:**
- Consumes: `getOrderByCode` from `@/lib/orders`; `REDEMPTION_FLOOR`, `canRedeem` from `@/lib/loyalty`; `formatRupees`, `formatPoints` from `@/lib/format`; `canvas-confetti`.
- Produces: `<Confetti intensity="normal" | "milestone" />`, `<PointsRing balance={number} />`, `<CountUp to={number} durationMs?={number} />`.

- [ ] **Step 1: Build the success page**

`src/app/success/[code]/page.tsx` is a server component. It awaits `params`, calls `getOrderByCode`, and calls `notFound()` when the code is unknown. Reading the order from the database rather than from navigation state means the page survives a refresh and can be shared.

- [ ] **Step 2: Build the confetti**

`src/components/success/Confetti.tsx` is a client component that fires once inside a `useEffect` with an empty dependency array and a `hasFired` ref guard, so React 19 Strict Mode's double-invoke does not double-fire it.

```tsx
'use client'

import { useEffect, useRef } from 'react'
import confetti from 'canvas-confetti'

const VIOLET = '#5A3BA8'
const GOLD = '#F2A93B'
const CREAM = '#FBF8F3'

export function Confetti({ intensity = 'normal' }: { intensity?: 'normal' | 'milestone' }) {
  const hasFired = useRef(false)

  useEffect(() => {
    if (hasFired.current) return
    hasFired.current = true

    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const star = confetti.shapeFromPath({
      // Four-point sparkle, matching the doodle set.
      path: 'M12 0 L14.2 9.8 L24 12 L14.2 14.2 L12 24 L9.8 14.2 L0 12 L9.8 9.8 Z',
    })

    const base = {
      origin: { y: 0.42 },
      colors: [VIOLET, GOLD, CREAM],
      shapes: [star, 'circle' as const],
      scalar: 1.1,
      disableForReducedMotion: true,
    }

    confetti({ ...base, particleCount: intensity === 'milestone' ? 160 : 70, spread: intensity === 'milestone' ? 100 : 62 })

    if (intensity === 'milestone') {
      setTimeout(() => confetti({ ...base, particleCount: 80, spread: 120, startVelocity: 38 }), 220)
    }
  }, [intensity])

  return null
}
```

- [ ] **Step 3: Build the counter and the ring**

`<CountUp>` animates from 0 to `to` over `durationMs` (default 900) using `requestAnimationFrame` with an ease-out cubic, rendering whole numbers in a `tabular` span. Under reduced motion it renders `to` immediately.

`<PointsRing>` is an SVG ring, 112px, `stroke-width` 9. The track is `--color-violet-100`; the progress arc is `--color-gold-500`, filling `Math.min(balance, REDEMPTION_FLOOR) / REDEMPTION_FLOOR` via `strokeDasharray`/`strokeDashoffset` with a 700ms transition. Once `canRedeem(balance)` the ring is complete and a `<Doodle name="star" />` sits at its top-right. The centre holds the balance in `font-display text-3xl tabular`.

- [ ] **Step 4: Assemble the card**

`<SuccessCard>` renders, in order: a violet header block carrying `<DoodleField>`, the order code as `Order {code}`, and the heading `Order in.`; then `+{pointsEarned} points to your name` in `text-gold-700 font-display text-2xl` with `<CountUp>` on the number; then `<PointsRing balance={balanceAfter} />`; then one status line:

- crossed the threshold this order: `You've hit 100. Your next order can be on us.`
- can already redeem: `{formatPoints(balance)} ready to spend.`
- otherwise: `{REDEMPTION_FLOOR - balance} points to your next free bite.`

Then the itemised order with the `To pay` total, then two buttons: primary `Order something else` to `/`, and ghost `See your points` to `/wallet`.

`<Confetti intensity={crossedThreshold ? 'milestone' : 'normal'} />` mounts at the top. Recompute `crossedThreshold` on the server from the order's `pointsEarned` and the customer's balance rather than trusting a query parameter.

- [ ] **Step 5: Verify by hand**

Place an order at 375×812.
Expected: confetti fires exactly once in violet, gold and cream; the points number counts up; the ring fills proportionally; refreshing the page still shows the order and fires the confetti again without error; an unknown code shows the 404 page. Then enable "Reduce motion" in the OS and reload: no confetti, no count-up, the ring shows its final state immediately.

- [ ] **Step 6: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add success screen with confetti, points ring and count-up
```

---

## Task 10: Wallet screen

**Files:**
- Create: `src/components/wallet/BalanceCard.tsx`, `LedgerList.tsx`, `OrderHistory.tsx`
- Create: `src/app/wallet/page.tsx`

**Interfaces:**
- Consumes: `GET /api/customer/[phone]/orders`; `useCart` (for the stored phone); `<PointsRing>` from Task 9; `<PhoneForm>` from Task 8.
- Produces: the `/wallet` route.

- [ ] **Step 1: Build the page**

`/wallet` is a client component because the phone number lives in `localStorage`. With no stored phone it renders `<PhoneForm>` under the heading `Find your points` and the line `Enter the number you ordered with.` With a phone it fetches the activity endpoint.

- [ ] **Step 2: Build the balance card**

A `bg-violet-700 text-white rounded-card` block with `<DoodleField>` behind it, holding `<PointsRing>`, the balance, and the same three-way status line as the success screen. When redemption is unlocked, add a gold pill reading `Ready to spend`.

- [ ] **Step 3: Build the history and ledger**

`<OrderHistory>` lists orders newest first: code, date (`d MMM, h:mm a`), item names joined by `·` truncated to one line, and the amount paid. `<LedgerList>` lists ledger rows with a `+`/`−` sign, `EARN` rows in `text-gold-700` and `REDEEM` rows in `text-ink-muted`, the note, and the date. Both use `tabular` for figures.

The empty state, verbatim: `No orders yet. Start with the momos.`

A 404 from the endpoint is not an error state — it means a number with no orders. Render the empty state, not a failure message.

- [ ] **Step 4: Verify by hand**

Expected: after two orders the wallet shows both, the ledger shows an `EARN` row per order, and the balance matches the sum of the ledger deltas. An unused phone number shows the empty state.

- [ ] **Step 5: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add wallet screen with balance, history and points ledger
```

---

## Task 11: QR codes

**Files:**
- Create: `src/app/qr/page.tsx`

**Interfaces:**
- Consumes: `qrcode`; `NEXT_PUBLIC_APP_URL`.
- Produces: the `/qr` route — a printable sheet of branded table codes.

- [ ] **Step 1: Generate the codes**

A server component. For tables 1 to 8, build `${process.env.NEXT_PUBLIC_APP_URL}/?t=${n}` and render it with `QRCode.toString(url, { type: 'svg', errorCorrectionLevel: 'M', margin: 1, color: { dark: '#241542', light: '#FBF8F3' } })`, injecting the SVG with `dangerouslySetInnerHTML`. The input is a server-constructed URL, never user input.

A ninth card carries the bare URL with no `?t=`, labelled `Takeaway / anywhere`, which is the "works as a normal website" entry point.

- [ ] **Step 2: Make it printable**

Each card is a `rounded-card border border-line bg-paper-raised` tile holding `<Wordmark>`, the QR, `Table {n}` in `font-display text-lg`, and `Scan to order · earn 2% back` in `text-ink-muted text-[0.75rem]`. Lay them out `grid-cols-2 print:grid-cols-3`, with `@media print` hiding the page chrome and forcing a white background.

- [ ] **Step 3: Verify**

Expected: `/qr` renders nine cards; scanning a table card with a phone opens the menu with the `Table n` pill showing and `Dine-in` preselected; scanning the takeaway card opens the plain menu. Print preview shows three columns and no navigation chrome.

- [ ] **Step 4: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add printable branded QR codes per table
```

---

## Task 12: Demo tools

Without this, redemption is unreachable in a walkthrough — ₹5,000 of spend is needed to clear the 100-point floor.

**Files:**
- Create: `src/lib/demo.ts`
- Create: `src/app/api/demo/simulate/route.ts`
- Create: `src/components/demo/DemoPanel.tsx`
- Modify: `src/app/wallet/page.tsx` (mount the panel)

**Interfaces:**
- Consumes: `prisma` from `@/lib/db`; `phoneSchema` from `@/lib/validation`.
- Produces: `simulatePastOrders(phone: string, points: number): Promise<{ pointsBalance: number }>` from `@/lib/demo`; `POST /api/demo/simulate`.

- [ ] **Step 1: Implement the simulator**

`simulatePastOrders` creates or finds the customer, writes one `ADJUST` ledger row with `delta: points`, `note: 'Demo adjustment'`, and a correct `balanceAfter`, and updates the cached balance — all in one transaction. It never fabricates `Order` rows, so order history stays honest and the ledger shows plainly that the points were granted rather than earned.

- [ ] **Step 2: Gate the endpoint**

`POST /api/demo/simulate` returns `404` with `{ error: 'Not found' }` unless `process.env.ENABLE_DEMO_TOOLS === 'true'`. A 404 rather than a 403 so the route's existence is not advertised. Body: `{ phone, points }` with `points` an integer between 1 and 5000.

- [ ] **Step 3: Build the panel**

`<DemoPanel>` renders on `/wallet` only when the URL carries `?demo=1` **and** `NEXT_PUBLIC_APP_URL`-side the endpoint responds — simplest check is to render the panel on `?demo=1` and let a 404 from the endpoint surface as a short inline message. Style it deliberately apart from the product: a dashed `border-line` block labelled `Demo tools` in `text-ink-muted uppercase tracking-wide text-[0.7rem]`, with a `+340 points` button and a `+120 points` button. On success it refetches the wallet.

- [ ] **Step 4: Verify**

Expected: `/wallet?demo=1` with `ENABLE_DEMO_TOOLS=true` grants points and the balance updates; the redemption control then appears at checkout and an order can be paid partly in points; with the flag unset the panel reports that demo tools are off and `curl -X POST localhost:3000/api/demo/simulate` returns 404.

- [ ] **Step 5: Checkpoint**

Suggested message:

```
feat(cafe-loyalty): add env-gated demo points simulator
```

---

## Task 13: Render deployment

**Files:**
- Create: `render.yaml`
- Modify: `README.md`

**Interfaces:**
- Consumes: the whole application.
- Produces: a deployable blueprint.

- [ ] **Step 1: Write the blueprint**

`render.yaml`:

```yaml
services:
  - type: web
    name: cafe-loyalty
    runtime: node
    plan: free
    region: singapore
    rootDir: cafe-loyalty
    buildCommand: pnpm install --frozen-lockfile && pnpm prisma generate && pnpm prisma migrate deploy && pnpm prisma db seed && pnpm build
    startCommand: pnpm start
    envVars:
      - key: DATABASE_URL
        sync: false
      - key: NEXT_PUBLIC_APP_URL
        sync: false
      - key: NODE_VERSION
        value: '22'
```

`ENABLE_DEMO_TOOLS` is deliberately absent — it is added by hand in the Render dashboard only when a deploy is meant to be a demo.

`region: singapore` is the closest Render region to Indore.

- [ ] **Step 2: Create the migration**

`migrate deploy` needs committed migration files; `db push` from Task 3 does not produce them.

Run: `pnpm prisma migrate dev --name init`
Expected: `prisma/migrations/<timestamp>_init/migration.sql` exists and applies cleanly.

- [ ] **Step 3: Document the deployment**

Add to `README.md`: create a Neon project and copy its pooled connection string into `DATABASE_URL`; create the Render service from the blueprint; set `NEXT_PUBLIC_APP_URL` to the assigned `onrender.com` URL and redeploy so the QR codes point at the right host; note that the free web service cold-starts after about fifteen minutes idle; note that `ENABLE_DEMO_TOOLS` must stay unset outside a demo.

- [ ] **Step 4: Verify the production build locally**

Run: `pnpm build && pnpm start`
Expected: the standalone build boots and every route responds.

- [ ] **Step 5: Checkpoint**

Suggested message:

```
chore(cafe-loyalty): add Render blueprint, initial migration and deployment docs
```

---

## Self-review

**Spec coverage.** Every spec section maps to a task: goals and the QR/direct-link requirement to Tasks 7 and 11; the loyalty rules to Task 2, enforced server-side in Task 4; the demo problem to Task 12; architecture and persistence to Tasks 1, 3 and 13; the data model and trust boundary to Tasks 3 and 4; the API table to Task 5; the six flows to Tasks 7 through 10; the visual direction to Task 6 with per-screen application in Tasks 7 through 11; testing to Tasks 1, 2, 4 and 7; configuration to Tasks 1, 12 and 13.

**Placeholder scan.** No TBDs. The only intentionally prose-level tasks are the UI ones (6 through 12), which specify exact tokens, component signatures, verbatim copy and acceptance checks instead of full component source — a plan that transcribed every JSX file would be the implementation, not a plan.

**Type consistency.** `CartLine` in `@/lib/loyalty` (`menuItemId`, `variantKey`, `unitPrice`, `quantity`) is distinct from `CartItem` in `@/store/cart` (which adds `key`, `menuItemSlug`, `name`, `variantLabel`); the store converts at the API boundary in Task 8. `computeOrderTotals` returns `crossedRedemptionThreshold`, which `placeOrder` passes through into `PlaceOrderResult` and Task 9 consumes. `phoneSchema` is defined once in Task 5 and reused in Tasks 8, 10 and 12. `pointsEarnedFor` is the single earn implementation, used by the cart bar preview and by `computeOrderTotals`.

**Known limitation, accepted:** the daily order counter in Task 4 could collide under simultaneous writes. A POC does not need a sequence table; the comment in the code records the trade-off.
