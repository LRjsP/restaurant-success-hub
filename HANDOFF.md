# MISE.OPS — Engineering Handoff

This document is the engineering counterpart to [`PRD.md`](./PRD.md) and
[`README.md`](./README.md). It tells a new engineer **what exists, what's
real, what's mocked, and where to start**.

---

## Start Here

If this is your first day on the codebase, follow this order. Each step is
small and self-contained.

1. **Read the product spec.** Open [`PRD.md`](./PRD.md). The five surfaces
   (Auth, The Floor, The Office, The Architect, The Pipeline, User Config)
   are the only mental model you need.
2. **Run it.** `bun install`, then the Lovable preview is already live. Sign
   in flow: visit `/auth` → click **Set up demo account** in
   `DemoSetupCard` → you're seeded as `admin` and redirected to `/floor`.
3. **Read the route shell.** Open `src/routes/__root.tsx`,
   `src/routes/_authenticated.tsx`, and `src/components/dashboard/DashboardShell.tsx`
   in that order. This is the entire chrome: providers → session gate →
   header + tabs + filter bar.
4. **Read one feature end-to-end.** Pick `src/features/floor/`. It is the
   simplest and demonstrates the pattern every other feature follows:
   - `data.ts` — the only file that touches data sources.
   - `FloorPage.tsx` — pure composition.
   - `SalesTrendChart.tsx`, `AlertsPanel.tsx`, `OnboardingHint.tsx` —
     pure presentational pieces.
5. **Trace one real backend call.** Open `src/features/users/data.ts` →
   follow `inviteUser` into `src/lib/users.functions.ts`. That is the
   canonical server function pattern (`createServerFn` +
   `requireSupabaseAuth` + admin role check + `supabaseAdmin`).
6. **Understand the mock layer.** Open `src/lib/demo-data.ts`. Every chart
   and KPI on The Floor, The Office, The Architect, and The Pipeline is
   produced by this deterministic generator. Replacing it with real
   queries is the main path to "production".

After step 6 you know the entire codebase.

---

## Project structure (at a glance)

```
src/
├── routes/             # Thin route wrappers. File-based routing.
├── features/           # One folder per product surface (see README).
│   └── <name>/
│       ├── data.ts     # ONLY file allowed to fetch / derive data
│       └── *.tsx       # Pure presentation
├── components/
│   ├── dashboard/      # Cross-feature shell (header, KPI, heatmap)
│   └── ui/             # shadcn primitives
├── lib/
│   ├── demo-data.ts        # Deterministic mock generator (MOCK source)
│   ├── *.functions.ts      # createServerFn modules (REAL backend)
│   ├── dashboard-search.ts # Zod schema for URL filter state
│   └── format.ts           # Currency / number formatters
└── integrations/supabase/  # Auto-generated client + auth glue
```

The **golden rule**: data lives in `data.ts`, JSX lives everywhere else.
A component never imports `@/lib/demo-data` or `@/integrations/supabase`
directly.

---

## Component inventory

### Route wrappers (`src/routes/`)
Thin files; each one just re-exports a feature page under the right URL.

| File                                | URL              | Purpose                                                    |
|-------------------------------------|------------------|------------------------------------------------------------|
| `__root.tsx`                        | —                | HTML shell, theme + query providers, head metadata         |
| `index.tsx`                         | `/`              | Redirects authed users to `/floor`, others to `/auth`      |
| `auth.tsx`                          | `/auth`          | Sign in / sign up + demo seed                              |
| `_authenticated.tsx`                | (layout)         | Session gate; mounts `DashboardShell` + `<Outlet />`       |
| `_authenticated.floor.tsx`          | `/floor`         | → `FloorPage`                                              |
| `_authenticated.office.tsx`         | `/office`        | → `OfficePage`                                             |
| `_authenticated.architect.tsx`      | `/architect`     | → `ArchitectPage`                                          |
| `_authenticated.pipeline.tsx`       | `/pipeline`      | → `PipelinePage`                                           |
| `_authenticated.users.tsx`          | `/users`         | → `UserConfigPage` (admin-only render guard inside)        |

### Shared dashboard chrome (`src/components/dashboard/`)

| Component         | Purpose                                                                        |
|-------------------|--------------------------------------------------------------------------------|
| `DashboardShell`  | App header, tab navigation, range/center/compare filter bar. Writes to URL.   |
| `KpiTile` + `Panel` | Standardized KPI card and section panel used by every feature.              |
| `Heatmap`         | Day × hour heatmap; consumed by The Floor and The Office.                     |

### Feature: Auth (`src/features/auth/`)

| File                | Purpose                                                                       |
|---------------------|-------------------------------------------------------------------------------|
| `AuthPage.tsx`      | Two-column layout, composes `AuthForm` + `DemoSetupCard`.                     |
| `AuthForm.tsx`      | Email/password sign-in & sign-up form (presentational).                       |
| `DemoSetupCard.tsx` | "One-click demo seed" — calls the demo seed server function.                  |
| `data.ts`           | `signIn`, `signUp`, `signOut`, `useSession`, `useSeedDemo` hooks.             |

### Feature: The Floor (`src/features/floor/`) — daily service pulse

| File                  | Purpose                                                                   |
|-----------------------|---------------------------------------------------------------------------|
| `FloorPage.tsx`       | KPI grid + sales-trend chart + alerts + onboarding hint.                  |
| `SalesTrendChart.tsx` | Recharts line: revenue today vs. previous period.                         |
| `AlertsPanel.tsx`     | List of operational anomalies (no-show spike, low covers, etc.).          |
| `OnboardingHint.tsx`  | First-run dismissible hint banner.                                        |
| `data.ts`             | `useFloorData(search)` — KPIs + alerts derived from demo generator.       |

### Feature: The Office (`src/features/office/`) — weekly P&L

| File                       | Purpose                                                              |
|----------------------------|----------------------------------------------------------------------|
| `OfficePage.tsx`           | P&L summary + revenue-vs-cost chart + cost heatmap.                  |
| `RevenueVsCostChart.tsx`   | Stacked recharts area: revenue, food cost, labor cost.               |
| `PnlSummaryPanel.tsx`      | Operating margin %, prime cost %, period delta.                      |
| `data.ts`                  | `useOfficeData(search)` — P&L rollups vs. previous period.           |

### Feature: The Architect (`src/features/architect/`) — menu engineering

| File                       | Purpose                                                              |
|----------------------------|----------------------------------------------------------------------|
| `ArchitectPage.tsx`        | Composition: rollup KPIs + matrix + top performers + items table.    |
| `MenuMatrixChart.tsx`      | Popularity × margin scatter, quadrant-colored (Star/Plow/Puzzle/Dog).|
| `MenuItemsTable.tsx`       | Sortable table of every menu item with classification.               |
| `TopPerformersPanel.tsx`   | Stars / Dogs counts + top items by margin.                           |
| `data.ts`                  | `useArchitectData(search)` — matrix + rollups.                       |
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
| `UsersTable.tsx`      | List users with role select + delete; admin actions only.                 |
| `data.ts`             | TanStack Query wrappers over `users.functions.ts` (list/invite/role/del). |

### Shared `src/lib/`

| File                          | Purpose                                                          | Real or Mock |
|-------------------------------|------------------------------------------------------------------|--------------|
| `demo-data.ts`                | Deterministic generator: days, KPIs, P&L, menu matrix, alerts.   | Mock         |
| `dashboard-search.ts`         | Zod schema for `range`/`center`/`compare` URL search params.     | —            |
| `format.ts`                   | `fmtCurrency`, `fmtNumber`, percentage formatters.               | —            |
| `users.functions.ts`          | `listUsers`, `inviteUser`, `updateRole`, `deleteUser`.           | **Real**     |
| `demo-user.functions.ts`      | First-time demo account + role seed.                             | **Real**     |
| `seed.functions.ts`           | Seeds Supabase tables with demo rows (admin-gated).              | Real (unused at runtime) |
| `kpis.functions.ts`           | Server-side KPI roll-up (scaffold; currently unused by UI).      | Real (scaffold) |
| `config.server.ts`            | Server-only env access.                                          | —            |
| `error-capture.ts`, `error-page.ts`, `lovable-error-reporting.ts` | Error boundary + reporting. | — |
| `api/example.functions.ts`    | Reference example for `createServerFn`.                          | —            |

---

## Data model

Backed by Supabase (Lovable Cloud). All tables live in the `public` schema
with RLS enabled.

### Identity & access — **REAL**

| Table        | Columns (notable)                              | Notes                                                        |
|--------------|------------------------------------------------|--------------------------------------------------------------|
| `profiles`   | `id` (=auth.users.id), `email`, `full_name`    | Auto-populated on sign-up.                                   |
| `user_roles` | `user_id`, `role enum('admin','staff')`        | Role storage (never on `profiles`). Read via `has_role()` security-definer RPC. |

`app_role` enum: `admin | staff`. Admin gates User Config and all
mutating server functions.

### Operational data — **MOCKED at the UI layer**

These tables exist in Supabase (seeded by `seed.functions.ts`) but the
dashboard pages currently read from the in-memory generator
(`src/lib/demo-data.ts`), not the database. They are the target schema
for a future "wire it up" pass.

| Table              | Purpose                                                              |
|--------------------|----------------------------------------------------------------------|
| `daily_metrics`    | Daily covers, gross/net sales, food/labor/beverage cost, comps, etc. (26 cols) |
| `hourly_metrics`   | Per-hour covers + revenue per revenue center (drives the Heatmap).   |
| `digital_activity` | Online orders, cart starts/completed, MAU.                           |
| `menu_items`       | Menu catalog with price, plate cost, units sold (Architect source).  |
| `events_pipeline`  | Catering / private events CRM rows (Pipeline source).                |
| `guests`           | Guest CRM with tier, LTV, visit history.                             |
| `alerts`           | Operational alerts surfaced on The Floor.                            |

### Mock generator surface (`src/lib/demo-data.ts`)

The functions the feature `data.ts` files call:

- `generateDemoDays(span, center, offset?)` → array of seeded daily rows.
- `daysForPreset(rangePreset)` → span length for the filter bar preset.
- `computeFloorKpis(days, prev)` → KPI deltas for The Floor.
- `computeOfficePnl(days, prev)` → P&L rollups for The Office.
- `computeMenuMatrix(totalCovers)` → menu items with classification.
- `demoAlerts` → static alert fixtures.

Same seed + same `center` date → same output. This makes screenshots
and tests stable.

---

## Mocked vs Real

| Layer                                | Status     | Source of truth                                 |
|--------------------------------------|------------|-------------------------------------------------|
| Sign in / sign up / session          | **Real**   | Supabase Auth                                   |
| Profiles + roles                     | **Real**   | `profiles`, `user_roles`                        |
| Demo account provisioning            | **Real**   | `demo-user.functions.ts`                        |
| User Config CRUD (list/invite/role/delete) | **Real**   | `users.functions.ts` + Auth Admin API     |
| The Floor KPIs, trend, heatmap       | **Mocked** | `demo-data.ts`                                  |
| The Floor alerts panel               | **Mocked** | `demoAlerts` fixture                            |
| The Office P&L, charts               | **Mocked** | `demo-data.ts`                                  |
| The Architect menu matrix            | **Mocked** | `demo-data.ts`                                  |
| The Pipeline funnel + events table   | **Mocked** | `demo-data.ts`                                  |
| Email invitations (`inviteUser`)     | **Stubbed**| Creates auth user + role row; no email sent     |
| Filter bar (range / center / compare)| **Real**   | URL search params via Zod schema                |

### What "going live" looks like

For each mocked feature, the work is contained to **one file**:

1. Replace the body of `src/features/<name>/data.ts` with a Supabase query
   (or call a `*.functions.ts` server fn that does the rollup server-side).
2. Keep the return shape identical — the components do not change.
3. Optionally move heavy aggregation into `src/lib/kpis.functions.ts`
   (already scaffolded) to avoid shipping raw rows to the browser.

---

## Server-side architecture

- **App-internal logic** → `createServerFn` in `src/lib/*.functions.ts`,
  called via TanStack Query hooks in each feature's `data.ts`.
- **Auth-gated server fns** chain `.middleware([requireSupabaseAuth])` and
  read `context.userId` / `context.supabase` inside `.handler()`.
- **Admin-only server fns** additionally check
  `has_role(userId, 'admin')` before touching `supabaseAdmin`.
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
state:

```ts
{
  range:   "today" | "7d" | "28d" | "90d",
  center:  ISO date string,        // anchor day, defaults to "today"
  compare: "prev_period" | "yoy",
}
```

`DashboardShell` writes it; each feature reads it via
`getRouteApi("/_authenticated").useSearch()` and passes the value into
its `useXxxData(search)` hook. There is no global store, no Redux, no
Zustand.

---

## Conventions checklist (for PR review)

- [ ] No `@/lib/demo-data` import outside a feature's `data.ts`.
- [ ] No `@/integrations/supabase/*` import outside `data.ts` or a
      `*.functions.ts` module.
- [ ] No hardcoded color utilities (`text-white`, `bg-[#...]`) — use
      semantic Tailwind tokens defined in `src/styles.css`.
- [ ] New tables: `CREATE TABLE` + `GRANT` + `ENABLE RLS` + `CREATE POLICY`
      in the same migration.
- [ ] New protected server fn: `.middleware([requireSupabaseAuth])` and,
      if it mutates, an explicit `has_role` admin check.
- [ ] Route files stay thin — page logic belongs in `src/features/<name>/`.
