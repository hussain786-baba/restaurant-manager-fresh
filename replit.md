# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.

## Artifact: DineFlow

**Path:** `/` (the dineflow web artifact is mounted at root)
**Purpose:** Restaurant operating system — QR-driven customer ordering + manager dashboard.

### Demo credentials

- Owner / super admin: `owner@dineflow.test` / `dineflow123`
- Floor manager: `manager@dineflow.test` / `dineflow123`

### Customer flow

1. Land on `/` → enter table code or pick a demo table (T01–T12)
2. `/menu?t=T01` → browse categories, add items to cart
3. `/cart` → review, place order
4. `/order/:id` → live order tracking (polls every 5s)
5. `/bill/:id` → tip + pay (cash / card / UPI mock)
6. `/paid/:id` → receipt & session reset
7. `/history` → past orders for this session

### Admin flow

1. `/admin/login` → split-screen sign-in
2. `/admin` → dashboard (revenue, tables, alerts, top items)
3. `/admin/orders` → live order queue + status advance
4. `/admin/orders/:id` → order detail + state machine
5. `/admin/menu` → categories + menu items CRUD
6. `/admin/tables` → tables CRUD + QR codes (api.qrserver.com)
7. `/admin/earnings` → revenue chart + breakdown
8. `/admin/staff` → staff CRUD (super_admin only)
9. `/admin/settings` → restaurant settings

### Brand

- Display: Cormorant Garamond
- Sans: Outfit
- Mono: JetBrains Mono
- Paper: `#FEFCF8` cream / Ink `#0D0B0A` / Gold `#C8922A`
- Currency: INR (₹), 5% GST, no emojis in UI text (server-side emoji glyphs OK in styled menu thumbnails)

### Backend specifics

- Public customer endpoints: `GET /api/customer/tables`, `/customer/menu`, `/customer/tables/:code`, `/customer/orders/by-session/:sessionId`, etc.
- Admin endpoints behind `requireAuth` cookie session.
- DB schema: `users`, `restaurant_tables`, `categories`, `menu_items`, `orders`, `order_items`, `alerts`, `sessions`.
- Seeder runs on first boot if DB is empty.
