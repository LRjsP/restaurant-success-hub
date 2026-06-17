# MISE.OPS — Engineering Handoff

This document is the engineering counterpart to [`PRD.md`](./PRD.md) and
[`README.md`](./README.md). It tells a new engineer **what exists, what's
real, what's mocked, and where to start**.

---

## Start Here

If this is your first day on the codebase, follow this order.

1. **Read the product spec.** Open [`PRD.md`](./PRD.md). The seven surfaces
   (Auth, The Service, The Floor, The Office, The Architect, The Pipeline,
   User Config) are the entire mental model.
2. **Run it.** `bun install`, then the Lovable preview is live. Sign-in
   flow: visit `/auth` → click **Set up demo account** → you're seeded as
   `admin` and redirected to `/floor`.
3. **Read the route shell.** Open `src/routes/__root.tsx`,
   `src/routes/_authenticated.tsx`, and
   `src/components/dashboard/DashboardShell.tsx` in that order.
4. **Read one analytics feature end-to-end.** Pick `src/features/floor/`. It is the
   simplest and demonstrates the `data.ts` ↔ presentational components pattern.
5. **Read the write path.** Open `src/features/service/ServicePage.tsx` →
   `src/lib/service.functions.ts` → the `apply_order_deltas` RPC in the
   latest migration. That is the only place in the app that mutates ops
   tables.
6. **Trace one real admin backend call.** Open `src/features/users/data.ts` →
   follow `inviteUser` into `src/lib/users.functions.ts`. Canonical server-
   function pattern (`createServerFn` + `requireSupabaseAuth` + admin role
   check + `supabaseAdmin`).
7. **Understand the mock layer.** Open `src/lib/demo-data.ts` and
   `src/lib/seed.functions.ts`. The seeder inserts historical rows so the
   dashboards have something to display before The Service has been used.

After step 7 you know the entire codebase.

---

## Project structure (at a glance)

```
src/
├── routes/             # Thin route wrappers. File-based routing.
├── features/           # One folder per product surface (see README).
│   ├── service/        # ServicePage — writes to the DB
│   └── <name>/
│       ├── data.ts     # ONLY file allowed to fetch / derive data
│       └── *.tsx       # Pure presentation
├── components/
│   ├── dashboard/      # Cross-feature shell (header, KPI, heatmap)
│   ├── OfflineBanner.tsx
│   └── ui/             # shadcn primitives
├── lib/
│   ├── demo-data.ts            # Deterministic mock generator (MOCK source)
│   ├── service.functions.ts    # Service write path server fns (REAL)
│   ├── service-schema.ts       # Zod + totals math for an order
│   ├── dashboard.functions.ts  # Dashboard read rollups (REAL)
│   ├── *.functions.ts          # Other createServerFn modules (REAL)
│   ├── dashboard-search.ts     # Zod schema for URL filter state
│   └── format.ts               # Currency / number formatters
└── integrations/supabase/      # Auto-generated client + auth glue
```

The **golden rule** for analytics features: data lives in `data.ts`, JSX
lives everywhere else. A component never imports `@/lib/demo-data` or
`@/integrations/supabase` directly.

The Service feature breaks this convention deliberately because the page is
both the only consumer and a heavy local-state form; `ServicePage.tsx`
imports `src/lib/service.functions.ts` directly.

---

## Component inventory

### Route wrappers (`src/routes/`)
Thin files; each one re-exports a feature page under the right URL.

| File                                | URL              | Purpose                                                    |
|-------------------------------------|------------------|------------------------------------------------------------|
| `__root.tsx`                        | —                | HTML shell, theme + query providers, head metadata, OfflineBanner |
| `index.tsx`                         | `/`              | Redirects authed users to `/floor`, others to `/auth`      |
| `auth.tsx`                          | `/auth`          | Sign in / sign up + demo seed                              |
| `_authenticated.tsx`                | (layout)         | Session gate; mounts `DashboardShell` + `<Outlet />`       |
| `_authenticated.service.tsx`        | `/service`       | → `ServicePage`                                            |
| `_authenticated.floor.tsx`          | `/floor`         | → `FloorPage`                                              |
| `_authenticated.office.tsx`         | `/office`        | → `OfficePage`                                             |
| `_authenticated.architect.tsx`      | `/architect`     | → `ArchitectPage`                                          |
| `_authenticated.pipeline.tsx`       | `/pipeline`      | → `PipelinePage`                                           |
| `_authenticated.users.tsx`          | `/users`         | → `UserConfigPage` (admin-only render guard inside)        |

### Shared dashboard chrome (`src/components/dashboard/`)

| Component         | Purpose                                                                        |
|-------------------|--------------------------------------------------------------------------------|
| `DashboardShell`  | App header, tab navigation (5 tabs + admin Users), range/center/compare filter bar. Writes to URL. |
| `KpiTile` + `Panel` | Standardized KPI card and section panel used by every feature.              |
| `Heatmap`         | Day × hour heatmap; consumed by The Floor and The Office.                     |

### Feature: The Service (`src/features/service/`) — order entry — **REAL**

| File                | Purpose                                                                       |
|---------------------|-------------------------------------------------------------------------------|
| `ServicePage.tsx`   | Single-file page. Three blocks: Service Context (date / hour / center / party / table / server), Menu grid (category tabs + search → tap to add), Ticket panel (qty +/- / comp / line total / discount $ or % / submit). Includes Guest picker (search + create) and "Today's Tickets" feed with Void per row. |

The page consumes server functions in `src/lib/service.functions.ts`
directly (no `data.ts` — see the convention note above).

### Feature: Auth (`src/features/auth/`)

| File                | Purpose                                                                       |
|---------------------|-------------------------------------------------------------------------------|
| `AuthPage.tsx`      | Two-column layout, composes `AuthForm` + `DemoSetupCard`.                     |
| `AuthForm.tsx`      | Email/password sign-in & sign-up form.                                        |
| `DemoSetupCard.tsx` | "One-click demo seed" — calls the demo seed server function.                  |
| `data.ts`           | `signIn`, `signUp`, `signOut`, `useSession`, `useSeedDemo` hooks.             |

### Feature: The Floor (`src/features/floor/`) — daily service pulse

| File                  | Purpose                                                                   |
|-----------------------|---------------------------------------------------------------------------|
| `FloorPage.tsx`       | KPI grid + sales-trend chart + alerts + onboarding hint.                  |
| `SalesTrendChart.tsx` | Recharts line: revenue today vs. previous period.                         |
| `AlertsPanel.tsx`     | List of operational anomalies.                                            |
| `OnboardingHint.tsx`  | First-run dismissible hint banner.                                        |
| `data.ts`             | `useFloorData(search)` — calls `getFloorData` server fn.                  |

### Feature: The Office (`src/features/office/`) — weekly P&L

| File                       | Purpose                                                              |
|----------------------------|----------------------------------------------------------------------|
| `OfficePage.tsx`           | P&L summary + revenue-vs-cost chart + cost heatmap.                  |
| `RevenueVsCostChart.tsx`   | Stacked recharts area: revenue, food cost, labor cost.               |
| `PnlSummaryPanel.tsx`      | Operating margin %, prime cost %, period delta.                      |
| `data.ts`                  | `useOfficeData(search)` — P&L rollups via server fn.                 |

### Feature: The Architect (`src/features/architect/`) — menu engineering

| File                       | Purpose                                                              |
|----------------------------|----------------------------------------------------------------------|
| `ArchitectPage.tsx`        | Composition: rollup KPIs + matrix + top performers + items table.    |
| `MenuMatrixChart.tsx`      | Popularity × margin scatter, quadrant-colored.                       |
| `MenuItemsTable.tsx`       | Sortable table of every menu item with classification.               |
| `TopPerformersPanel.tsx`   | Stars / Dogs counts + top items by margin.                           |
| `data.ts`                  | `useArchitectData(search)` — joins `menu_items` + `menu_item_daily_sales`. |
| `utils.ts`                 | `median`, classification color map, sort-key types.                  |

### Feature: The Pipeline (`src/features/pipeline/`) — events / catering CRM

| File                       | Purpose                                                              |
|----------------------------|----------------------------------------------------------------------|
| `PipelinePage.tsx`         | Funnel + upcoming events table.                                      |
| `FunnelPanel.tsx`          | Stage-by-stage funnel chart with value + conversion rates.           |
| `UpcomingEventsTable.tsx`  | Sorted upcoming events grouped by stage.                             |
| `data.ts`                  | `usePipelineData(search)` + `STAGE_COLORS`.                          |

### Feature: User Config (`src/features/users/`) — admin only

| File                  | Purpose                                                                   |
|-----------------------|---------------------------------------------------------------------------|
| `UserConfigPage.tsx`  | Composes `InviteUserForm` + `UsersTable`. Renders only for `admin`.       |
| `InviteUserForm.tsx`  | Email + role form → `useInviteUser`.                                      |
| `UsersTable.tsx`      | List users with role select + delete.                                     |
| `data.ts`             | TanStack Query wrappers over `users.functions.ts`.                        |

### Shared `src/lib/`

| File                          | Purpose                                                          | Real or Mock |
|-------------------------------|------------------------------------------------------------------|--------------|
| `demo-data.ts`                | Deterministic generator (kept for fallbacks and seeding helpers).| Mock         |
| `service.functions.ts`        | `getServiceCatalog`, `searchGuests`, `createGuest`, `submitOrder`, `voidOrder`, `recentOrders`. | **Real** |
| `service-schema.ts`           | Zod input schema, line/order types, `bucketForCategory`, `computeOrderTotals`. | — |
| `dashboard.functions.ts`      | Server-side rollups for the four analytics dashboards.           | **Real**     |
| `dashboard-search.ts`         | Zod schema for `range`/`center`/`compare` URL search params.     | —            |
| `format.ts`                   | `fmtCurrency`, `fmtNumber`, percentage formatters.               | —            |
| `users.functions.ts`          | `listUsers`, `inviteUser`, `updateRole`, `deleteUser`.           | **Real**     |
| `demo-user.functions.ts`      | First-time demo account + role seed.                             | **Real**     |
| `seed.functions.ts`           | Seeds historical demo rows (admin-gated, idempotent).            | **Real** (demo) |
| `kpis.functions.ts`           | Floor KPI scaffold.                                              | **Real**     |
| `config.server.ts`            | Server-only env access.                                          | —            |
| `error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` | Error boundary + reporting. | — |

---

## Data model

Backed by Supabase (Lovable Cloud). All tables live in the `public` schema
with RLS enabled.

### Identity & access — **REAL**

| Table        | Columns (notable)                              | Notes                                                        |
|--------------|------------------------------------------------|--------------------------------------------------------------|
| `profiles`   | `id` (=auth.users.id), `email`, `full_name`    | Auto-populated on sign-up.                                   |
| `user_roles` | `user_id`, `role enum('admin','staff')`        | Role storage (never on `profiles`). Read via `has_role()` security-definer RPC. |

`app_role` enum: `admin | staff`. Admin gates User Config and all admin-
specific mutations. Any authenticated user can use The Service.

### Operational data — **REAL** (writeable by The Service)

The dashboards read these tables directly. Historical rows come from
`seed.functions.ts`; live rows come from the Service write path.

| Table              | Purpose                                                              |
|--------------------|----------------------------------------------------------------------|
| `daily_metrics`    | Per-day per-revenue-center sales, covers, costs (26 cols). Unique `(date, revenue_center)`. |
| `hourly_metrics`   | Per-hour covers + revenue per revenue center. Unique `(date, hour, revenue_center)`. Drives the Heatmap. |
| `menu_item_daily_sales` | Per-day per-item units / revenue / cost. Unique `(menu_item_id, date, revenue_center)`. |
| `digital_activity` | Online orders, cart starts/completed, MAU.                           |
| `menu_items`       | Menu catalog with price, plate_cost, `units_sold_30d` fallback.      |
| `events_pipeline`  | Catering / private events CRM rows.                                  |
| `guests`           | Guest CRM with tier, LTV, visit history.                             |
| `alerts`           | Operational alerts surfaced on The Floor.                            |
| `restaurant_settings` | Single-row site config including the canonical `revenue_centers` jsonb. |
| `audit_log`        | Append-only log. The Service writes `order.submit` / `order.void` rows here. |

### The write path: `apply_order_deltas(payload jsonb)` — **REAL**

`SECURITY DEFINER` Postgres function, `EXECUTE` granted to `authenticated`
only. Called from `submitOrder` / `voidOrder` server functions in
`src/lib/service.functions.ts`.

In a single transaction it:

1. Upserts `daily_metrics` on `(date, revenue_center)`, incrementing all
   sales / cost / cover / discount / comp columns by signed deltas.
2. Upserts `hourly_metrics` on `(date, hour, revenue_center)`, incrementing
   revenue and covers.
3. Upserts one `menu_item_daily_sales` row per ticket line on
   `(menu_item_id, date, revenue_center)`.
4. Updates the attached `guests` row: increments `visit_count`,
   `lifetime_value`, refreshes `last_visit_at`, recomputes `tier`
   (vip ≥ $2k · regular ≥ $500 · new). Clamps to ≥ 0.
5. Inserts an `audit_log` row tagged `service_order`.

Void replays the same payload with `void: true`, which negates every
delta. Double-voids cannot drive guest counters below zero.

`computeOrderTotals` in `src/lib/service-schema.ts` is the single source
of truth for splitting line items into `food_sales` / `beverage_sales` /
`liquor_sales` / `beer_sales` / `wine_sales` and the matching cost
buckets. The split is keyed by `bucketForCategory(category)` so adding a
new menu category requires updating only that function.

---

## Mocked vs Real

| Layer                                | Status     | Source of truth                                 |
|--------------------------------------|------------|-------------------------------------------------|
| Sign in / sign up / session          | **Real**   | Supabase Auth                                   |
| Profiles + roles                     | **Real**   | `profiles`, `user_roles`                        |
| Demo account provisioning            | **Real**   | `demo-user.functions.ts`                        |
| User Config CRUD                     | **Real**   | `users.functions.ts` + Auth Admin API           |
| **The Service — submit / void order**| **Real**   | `service.functions.ts` → `apply_order_deltas`   |
| Menu catalog + revenue centers       | **Real**   | `menu_items`, `restaurant_settings`             |
| The Floor KPIs, trend, heatmap       | **Hybrid** | `daily_metrics` + `hourly_metrics` (seeded + live) |
| The Floor alerts panel               | **Real (seeded)** | `alerts`                                  |
| The Office P&L, charts               | **Hybrid** | `daily_metrics`                                 |
| The Architect menu matrix            | **Hybrid** | `menu_items` + `menu_item_daily_sales` (live for new orders, `units_sold_30d` fallback otherwise) |
| The Pipeline funnel + events table   | **Mocked** | Seeded into `events_pipeline`; no CRM connector |
| Email invitations (`inviteUser`)     | **Stubbed**| Creates auth user + role row; no email sent     |
| Filter bar (range / center / compare)| **Real**   | URL search params via Zod schema                |

### What "going live for real" looks like

The schema and write path are complete. To replace the seeded historical
demo rows with a real POS feed, swap `seed.functions.ts` for an ingestion
job (or external webhook under `src/routes/api/public/`) that writes to
the same `daily_metrics`, `hourly_metrics`, and `menu_item_daily_sales`
tables — no UI or dashboard query needs to change.

---

## Server-side architecture

- **App-internal logic** → `createServerFn` in `src/lib/*.functions.ts`,
  called via TanStack Query hooks in each feature's `data.ts` (or, for
  The Service, directly from the page).
- **Auth-gated server fns** chain `.middleware([requireSupabaseAuth])` and
  read `context.userId` / `context.supabase` inside `.handler()`.
- **Admin-only server fns** additionally check
  `has_role(userId, 'admin')` before touching `supabaseAdmin`.
- **The Service** server fns require auth (any authenticated user) and
  perform the mutation via `supabase.rpc("apply_order_deltas", { payload })`
  so RLS is bypassed only inside the database function — not in app code.
- **Public HTTP endpoints / webhooks** would live under
  `src/routes/api/public/*` (none exist yet).
- The `attachSupabaseAuth` global middleware is wired in `src/start.ts` —
  do not remove it or every protected server fn 401s.

### Supabase clients (do not improvise)

| Import                                                       | When to use                                  |
|--------------------------------------------------------------|----------------------------------------------|
| `@/integrations/supabase/client` (`supabase`)                | Browser only. Auth flows, session listeners. |
| `@/integrations/supabase/auth-middleware` (`requireSupabaseAuth`) | In a server fn `.middleware([...])`.    |
| `@/integrations/supabase/client.server` (`supabaseAdmin`)    | Server-only, BYPASSES RLS. Dynamic-import inside the handler. |

---

## URL state contract

`src/lib/dashboard-search.ts` defines the only piece of cross-feature
state for the analytics tabs:

```ts
{
  range:   "today" | "7d" | "28d" | "90d",
  center:  string,                  // "all" or a revenue_center value
  compare: boolean,                 // period-over-period delta on/off
}
```

`DashboardShell` writes it; each analytics feature reads it via
`getRouteApi("/_authenticated").useSearch()` and passes the value into
its `useXxxData(search)` hook. The Service tab ignores this — it owns
its own per-ticket local state.

---

## Conventions checklist (for PR review)

- [ ] No `@/lib/demo-data` import outside a feature's `data.ts` or
      `seed.functions.ts`.
- [ ] No `@/integrations/supabase/*` import outside `data.ts`, a
      `*.functions.ts` module, or `ServicePage.tsx`.
- [ ] No hardcoded color utilities (`text-white`, `bg-[#...]`) — use
      semantic Tailwind tokens defined in `src/styles.css`.
- [ ] New tables: `CREATE TABLE` + `GRANT` + `ENABLE RLS` + `CREATE POLICY`
      in the same migration.
- [ ] New protected server fn: `.middleware([requireSupabaseAuth])` and,
      if it touches admin tables, an explicit `has_role` admin check.
- [ ] Mutations against operational tables go through the
      `apply_order_deltas` RPC, not raw inserts — keeps invariants and
      audit trails consistent.
- [ ] New menu categories: update `bucketForCategory` in
      `src/lib/service-schema.ts` so the Office cost buckets stay right.
- [ ] Route files stay thin — page logic belongs in `src/features/<name>/`.

---

## Known Gaps

### Offline banner (`OfflineBanner.tsx`)
**What failed:** The banner rendered on every page load instead of only when the connection was lost.
**Root cause:** `navigator.onLine` returns `false` in preview/iframe environments (including the Lovable preview) even with a working connection.
**How it should behave:** Stay hidden by default; appear **only** when the browser fires an actual `offline` event. The component now defaults to `online = true` and flips to `false` exclusively via the `window` `offline` event listener.

### The Service — out of scope for v1
The following are intentionally not built; document the gap so a future
engineer doesn't assume they're regressions.

- **Payment capture.** Net sales are recorded, payment instruments (cash / card / split / tip / settlement) are not.
- **Printed receipts / KDS routing.** No printer or kitchen-display integration.
- **Item modifiers.** Lines are item × qty × comp only — no "no onions", course timing, or multi-seat splits.
- **Channel auto-derivation is display-only.** The "Dine-in / Takeout / Delivery / Catering" badge is derived from `revenue_center` for the user; it is not stored on the order.
- **Server name is free text.** Not linked to `profiles` — operational tagging only, no per-server analytics.

### Events pipeline data
`events_pipeline` rows are still seeded by `seed.functions.ts`; there is
no UI path to create / edit / delete events. The Pipeline tab reads
faithfully from the table — wiring up CRUD is a future task.

### Email invites
`inviteUser` creates the auth user + role row but does not send a
transactional email. Plug in a provider (Resend, Postmark, etc.) via a
new edge function or server route when ready.
