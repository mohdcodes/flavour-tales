# flavor&tales — Loyalty Ordering POC

**Date:** 2026-09-20
**Status:** Approved design, pre-implementation

A mobile-first ordering web app for flavor&tales (Indore). Customers reach it by
scanning a table QR code or by visiting the URL directly. They order, earn 2% of
what they pay back as loyalty points, and once they hold 100 points they can
spend those points on any future order.

---

## 1. Goals and non-goals

### Goals

- One URL that works identically from a QR scan and from a normal browser visit.
- A complete order flow: browse menu, build cart, identify, check out, confirm.
- A loyalty ledger that survives device changes, because points follow a phone
  number rather than a browser.
- A redemption moment worth demonstrating: confetti, a points counter that ticks
  up, and a visible threshold the customer crosses.
- Visual quality high enough to show a cafe owner without apology.
- Deployable to Render from a checked-in blueprint.

### Non-goals

Real payment processing, OTP or password authentication, an admin or kitchen
dashboard, delivery tracking, push notifications, localisation, and multiple
outlets. None of these are needed to prove the loyalty mechanic.

---

## 2. The loyalty rules

Points are integers. One point is worth one rupee.

| Rule | Definition |
|------|-----------|
| Earn | `Math.round(0.02 * amountActuallyPaid)` |
| Redemption floor | Redemption unlocks at a balance of 100 points |
| Redemption cap | `min(balance, subtotal)`, in whole rupees |
| Source of truth | `PointsLedger` rows; `Customer.pointsBalance` is a cache |

Earn is calculated on cash actually paid, not on the cart subtotal. Earning on
the subtotal would pay points back on points, so a balance would never drain.

Worked example — cart 190, balance 120:

```
redeem 120  ->  pay 70  ->  earn round(0.02 * 70) = 1  ->  new balance 1
```

### The demo problem, and how it is handled

At 2% with a 100-point floor, a customer must spend 5,000 rupees (roughly 25
orders at this menu's average ticket) before redeeming anything. Nobody reaches
redemption during a live demo, which hides half of the mechanic.

The 2% rate stays as specified. The demo problem is solved separately: when
`ENABLE_DEMO_TOOLS=true`, a `?demo=1` query parameter reveals a control that
simulates past orders for the current phone number, so a walkthrough can reach
340 points in one tap and show redemption and the threshold-crossing confetti.
The flag is off in any deploy that is not a demo.

---

## 3. Architecture

A single Next.js 15 application (App Router), deployed as one Render Web
Service. A separate SPA and API would mean two Render services and a CORS
surface for no benefit at this size; server components also let the menu render
with no client-side fetch.

```
cafe-loyalty/
  prisma/
    schema.prisma
    seed.ts                  menu seeded from the scraped flavor&tales data
  src/
    app/
      page.tsx               menu (the landing screen)
      cart/ checkout/ success/ wallet/ qr/
      api/
        menu/                GET
        customer/lookup/     POST
        orders/              POST
    lib/
      loyalty.ts             pure functions; the tested core
      db.ts
    components/              presentational
  render.yaml
```

The folder is deliberately independent of the surrounding pnpm workspace and
Turborepo graph, so it can be lifted into its own repository without untangling.

### Persistence

PostgreSQL through Prisma. SQLite is rejected: Render's free tier has no
persistent disk, so a SQLite file is destroyed on every deploy and the demo
loses its points.

`DATABASE_URL` points at Neon rather than Render's managed Postgres, because
Render's free database expires after 30 days and Neon's free tier does not. The
application code is provider-agnostic; only the connection string differs.

Render's free web service cold-starts after roughly 15 minutes idle, costing
about 50 seconds on the first request. Acceptable for a POC.

### Data model

| Model | Purpose |
|-------|---------|
| `MenuCategory` | Name, sort order |
| `MenuItem` | Name, base price, `variants` JSON (Steam/Fry, Steam/Pantoss), availability |
| `Customer` | Phone (unique), optional name, cached `pointsBalance` |
| `Order` | Code, customer, table label, mode, subtotal, pointsRedeemed, amountPaid, pointsEarned |
| `OrderItem` | Name and price snapshotted at order time |
| `PointsLedger` | `delta`, `kind` (EARN/REDEEM/ADJUST), `balanceAfter`, optional order link |

Order placement runs as a single Prisma transaction that writes the order, its
items, and the ledger rows, and updates the cached balance. Nothing mutates a
balance outside the ledger.

### Trust boundary

The server recomputes every price from the database when an order is placed. The
client's totals are a preview and are never trusted. A submitted order carries
only item IDs, variants, quantities, and a redemption intent.

### API

| Endpoint | Purpose |
|----------|---------|
| `GET /api/menu` | Categories and items |
| `POST /api/customer/lookup` | Phone to name, balance, redemption eligibility |
| `POST /api/orders` | Place an order; returns totals, points earned, new balance |
| `GET /api/customer/[phone]/orders` | Order history and ledger |

---

## 4. Flows

A QR scan and a direct visit hit the same application. The QR carries `?t=5`,
which pins a table chip in the header and skips the dine-in/takeaway question.
A `/qr` page generates printable branded codes per table.

1. **Menu** is the landing screen. No splash — a person who just scanned a code
   at a table wants food, immediately. Sticky header, scroll-spy category chips,
   variant pickers, quantity steppers.
2. **Cart bar** persists at the bottom: `190 · you'll earn 4 pts`. Showing the
   earn preview before commitment is what makes the mechanic register.
3. **Phone** is asked at checkout, never upfront. A returning number is greeted
   by name with its balance already loaded.
4. **Checkout** shows the summary, a redemption control (only when the balance
   is at least 100), and mock payment.
5. **Success** fires confetti, ticks the points counter up, and fills a ring
   toward 100. Crossing 100 produces a larger burst and flips the state to
   "you can redeem now".
6. **Wallet** shows balance, progress, order history, and the full ledger.

---

## 5. Visual direction

The brief is zero compromise on UI, which in practice means avoiding the four
things that make an app read as machine-generated: default framework typefaces,
a generic component-library look, mismatched stock photography, and copy written
in an exclamation-mark register.

### Palette

Taken from the cafe's own violet menu board.

| Token | Value | Use |
|-------|-------|-----|
| `--violet-900` | `#241542` | Ink on violet, deep shadows |
| `--violet-700` | `#3C2470` | Header fill |
| `--violet-600` | `#5A3BA8` | Brand primary |
| `--violet-100` | `#EDE7FA` | Tints, selected chips |
| `--ink` | `#1B1226` | Body text |
| `--paper` | `#FBF8F3` | Surface — warm, not pure white |
| `--gold-500` | `#F2A93B` | Points, the loyalty CTA |
| `--gold-700` | `#B9741A` | Points text on light surfaces |
| `--veg` | `#2E7D32` | The standard Indian vegetarian mark |

Gold is reserved exclusively for points, so the loyalty currency reads as
currency wherever it appears.

### Typography

- **Display:** Bricolage Grotesque (variable, Google Fonts). Slightly drawn and
  wide-set, echoing the hand-lettered board. Used for headings, prices, and the
  points figure.
- **Body and UI:** Instrument Sans (Google Fonts).
- Tabular numerals wherever money or points align in a column.
- Explicitly not Inter, Poppins, Montserrat, or Roboto.

### Signature device

The board's white hand-drawn line art — dumplings, steam curls, four-point
stars, sparkles — is the brand's actual visual signature. A small set is
authored as inline SVG and reused as a low-opacity header backdrop, category
tile icons, empty-state art, confetti particle shapes, and the points-card
watermark. This is the single decision that makes the app read as flavor&tales
rather than as a template.

No food photography. None exists for this menu, and mismatched stock imagery is
the loudest possible tell. Category tiles use the line-art icons on tinted
violet instead.

### Components

Tailwind v4 with CSS-first configuration. Radix primitives only where
accessibility genuinely requires them (the cart sheet and dialogs). No
component-library preset, because a default shadcn surface is recognisable on
sight.

### Copy

The cafe's own line — "every dish begins with a story" — sets the register.
Second person, short, Indore-casual.

- Empty cart: "Nothing in the bag yet. The momos are waiting."
- Points at 66: "34 points to your next free bite."
- Order placed: "Order in. +4 points to your name."

Not: "Congratulations! You have successfully earned reward points!"

### Motion

One confetti burst of roughly 1.2 seconds, in violet, gold, and white, using the
line-art star and dumpling shapes as particles. The points counter ticks; the
progress ring fills. `prefers-reduced-motion` suppresses all of it and renders
the end state directly.

### Layout

Mobile-first, single column, `max-width: 26rem`, centred. On desktop the
line-art pattern bleeds into the gutters so the page does not look like a
stretched phone.

---

## 6. Testing

`src/lib/loyalty.ts` holds every calculation as a pure function and is written
test-first with Vitest: earn rounding, the redemption floor, the redemption cap,
cart totals, and the paid-amount basis for earning.

The order-placement transaction is tested against a test database for correct
ledger writes, a correct cached balance, and server-side price recomputation
that ignores client-supplied totals.

The UI is verified by hand at a mobile viewport in the browser pane. A POC does
not earn component tests.

---

## 7. Configuration

| Variable | Purpose |
|----------|---------|
| `DATABASE_URL` | Neon Postgres connection string |
| `NEXT_PUBLIC_APP_URL` | Base URL used to generate QR codes |
| `ENABLE_DEMO_TOOLS` | Reveals the `?demo=1` points simulator |

`render.yaml` defines the web service, its build command
(`pnpm install && pnpm prisma migrate deploy && pnpm build`), and its start
command.

---

## Appendix — seeded menu

Source: flavor&tales Google Business menu plus a photograph of the in-store
board (January 2026). The board carries variant price columns that the Google
listing drops.

**Steam Momos** (Steam / Fry): Veg 70/80 · Cheese Corn 90/110 · Paneer 90/110 ·
Veg Cheese 100/110

**Pantoss Momos**: Veg 80 · Paneer 115 · Veg Cheese 115 · Cheese Corn 115

**Crispy Momos**: Veg 110 · Cheese Corn 130 · Paneer 130 · Cheese 130

**Chef's Special — Millet Momos** (Steam / Pantoss): Ragi Veg 150/165 ·
Ragi Paneer 180/195

**Cheese Corner**: Corn Cheese Samosa 3pc 55 · 6pc 105

**Maggie**: Classic 50 · Double Masala 60 · Veg Butter 70 · Cheese 90

**Desert**: Classic Brownie 100 · Lotus Biscoff 120 · Cookie Dough 130 ·
Brownie with Ice-Cream 140

**Combos**: Maggie + Veg Steam Momos 90 · Double Masala Maggie + Veg Fried Momos
100 · Cheese Maggie + Cheese Corn Samosa 110 · Chef's Special Cheese Platter 140

Open questions on the menu, none blocking: the bottom of the board is cut off in
the photograph and may carry a further combo block; Jhol Momos appear in
customer reviews but not on the board.
