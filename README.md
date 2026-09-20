# flavor&tales — loyalty ordering POC

A mobile-first ordering web app for [flavor&tales](https://flavortales.grexa.site)
in Indore. Customers arrive by scanning a table QR code or by opening the URL
directly, order, earn 2% of what they pay back as loyalty points, and spend those
points on a future order once they hold 100.

- **Design spec:** [`docs/specs/2026-09-20-cafe-loyalty-design.md`](docs/specs/2026-09-20-cafe-loyalty-design.md)
- **Implementation plan:** [`docs/plans/2026-09-20-cafe-loyalty-implementation.md`](docs/plans/2026-09-20-cafe-loyalty-implementation.md)

Next.js 15 (App Router) · React 19 · Tailwind v4 · Prisma · PostgreSQL · Vitest.

## Running it locally

Start a database:

```bash
podman run -d --name flavour-tales-db \
  -e POSTGRES_USER=cafe -e POSTGRES_PASSWORD=cafe -e POSTGRES_DB=cafe_loyalty \
  -p 5433:5432 postgres:16-alpine
```

Then:

```bash
cp .env.example .env
pnpm install
pnpm prisma migrate deploy
pnpm db:seed
pnpm dev
```

Open **http://localhost:3001**.

| Command | What it does |
|---|---|
| `pnpm dev` | Dev server on 3001 |
| `pnpm test` | Vitest — loyalty engine, order transaction, cart store, formatters |
| `pnpm typecheck` | `tsc --noEmit` |
| `pnpm db:seed` | Reseeds the menu (idempotent) |
| `pnpm db:studio` | Prisma Studio |

The order-transaction tests run against the database in `DATABASE_URL` and
truncate the customer, order and ledger tables between tests. They leave the
seeded menu alone. Do not point `DATABASE_URL` at anything you care about while
running them.

## Screens

| Route | What it is |
|---|---|
| `/` | Menu. `?t=5` pins a table and preselects dine-in. |
| `/checkout` | Phone identification, redemption, order placement |
| `/success/[code]` | Receipt, confetti, points ring |
| `/wallet` | Balance, order history, points ledger |
| `/qr` | Printable branded table codes |

## The loyalty rules

- Earn is `round(0.02 × amount actually paid)`, **not** of the subtotal. Earning
  on the subtotal would pay points back on points and a balance would never drain.
- Redemption unlocks at 100 points. One point is one rupee.
- Redemption is capped at `min(balance, subtotal)`, so points never buy change.
- `PointsLedger` is the source of truth; `Customer.pointsBalance` is a cache
  written in the same transaction. Nothing changes a balance outside the ledger.
- The server recomputes every price from the database when an order is placed.
  The client's totals are a preview and are never trusted.

All of this lives in `src/lib/loyalty.ts` and is covered by tests.

### Demo tools

At 2% with a 100-point floor, a customer must spend ₹5,000 before they can
redeem anything, so redemption is unreachable in a live walkthrough. Setting
`ENABLE_DEMO_TOOLS=true` exposes a panel at `/wallet?demo=1` that grants points
directly via a single `ADJUST` ledger row — it never fabricates orders, so order
history stays honest.

**`ENABLE_DEMO_TOOLS` must stay unset in any deploy that is not a demo.** With it
unset, `POST /api/demo/simulate` returns 404.

## Deploying to Render

1. Create a **Neon** Postgres project and copy its pooled connection string.
   Neon rather than Render's own Postgres: Render's free database expires after
   30 days, Neon's free tier does not.
2. In Render, create a **Blueprint** from this repo. It reads `render.yaml`.
3. Set `DATABASE_URL` to the Neon string.
4. Set `NEXT_PUBLIC_APP_URL` to the assigned `onrender.com` URL and redeploy, so
   the QR codes point at the right host.
5. Leave `ENABLE_DEMO_TOOLS` unset unless the deploy is a demo.

The build command runs `prisma migrate deploy` and the seed before `next build`,
so a fresh database comes up with the menu already in it.

Render's free web service cold-starts after roughly fifteen minutes idle, costing
about fifty seconds on the first request.

## Design notes

The palette and the hand-drawn line art are taken from the cafe's own violet menu
board. Type is Bricolage Grotesque (display) and Instrument Sans (body). Gold is
reserved exclusively for points, so the loyalty currency reads as currency
wherever it appears. Loading states draw a momo that steams. There is no food
photography — none exists for this menu, and mismatched stock imagery is the
loudest possible tell that nobody looked at the brand.
