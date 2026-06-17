# MISE.OPS

Opinionated restaurant operations intelligence dashboard. Five mission-named
surfaces — **The Service**, **The Floor**, **The Office**, **The Architect**,
**The Pipeline** — plus an admin-only **User Config**, all sharing a single
filter bar and period-over-period comparison.

**The Service** is the operator-facing order-entry terminal (cashiers and
waiters). Every ticket submitted there writes directly into the same Supabase
tables the four analytics dashboards read from, so KPIs move in real time.

> Full product spec: [`PRD.md`](./PRD.md) · Engineering handoff: [`HANDOFF.md`](./HANDOFF.md)

---

## App flow

```
┌────────────┐   not authenticated   ┌────────────────────┐
│   /auth    │ ────────────────────▶ │  Sign in / Sign up │
│ (AuthPage) │                       │   Demo seed card   │
└─────┬──────┘                       └─────────┬──────────┘
      │ session                                │ seed → admin/staff
      ▼                                        ▼
┌──────────────────────────────────────────────────────────┐
│              /_authenticated  (route gate)               │
│  - checks Supabase session, redirects to /auth if missing│
│  - mounts DashboardShell (header, tabs, filter bar)      │
└──────────────────────────────────────────────────────────┘
      │ URL-driven filters: range, center, compare
      ▼
┌──────────┬────────┬─────────┬────────────┬───────────┬────────┐
│ /service │ /floor │ /office │ /architect │ /pipeline │ /users │
│ The      │ The    │ The     │ The        │ The       │ User   │
│ Service  │ Floor  │ Office  │ Architect  │ Pipeline  │ Config │
│ (write)  │ (read) │ (read)  │ (read)     │ (read)    │ (admin)│
└──────────┴────────┴─────────┴────────────┴───────────┴────────┘
```

The filter bar lives in `DashboardShell` and is the single source of truth
for the four analytics tabs. Each feature reads `range` / `center` from the
route's search params and recomputes locally — no global state. The Service
tab has its own per-ticket context (date · hour · revenue center · party ·
table · server) and ignores the dashboard filter bar.

---

## Project structure

```
src/
├── routes/                        # Thin route wrappers — wiring only
│   ├── __root.tsx
│   ├── index.tsx                  # / → redirects into the app
│   ├── auth.tsx                   # → features/auth/AuthPage
│   ├── _authenticated.tsx         # session gate + DashboardShell
│   ├── _authenticated.service.tsx
│   ├── _authenticated.floor.tsx
│   ├── _authenticated.office.tsx
│   ├── _authenticated.architect.tsx
│   ├── _authenticated.pipeline.tsx
│   └── _authenticated.users.tsx
│
├── features/                      # One folder per product surface
│   ├── auth/
│   ├── service/                   # The Service — order entry terminal
│   │   └── ServicePage.tsx
│   ├── floor/                     # The Floor — daily service pulse
│   ├── office/                    # The Office — weekly P&L
│   ├── architect/                 # The Architect — menu engineering
│   ├── pipeline/                  # The Pipeline — events / catering CRM
│   └── users/                     # User Config — admin only
│
├── components/
│   ├── dashboard/                 # Cross-feature shell primitives
│   │   ├── DashboardShell.tsx
│   │   ├── KpiTile.tsx
│   │   └── Heatmap.tsx
│   ├── OfflineBanner.tsx          # Network outage banner
│   ├── ui/                        # shadcn/ui primitives
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── lib/
│   ├── demo-data.ts               # Deterministic mock data generator
│   ├── format.ts
│   ├── dashboard-search.ts
│   ├── service.functions.ts       # Server fns: catalog, submit, void, recent
│   ├── service-schema.ts          # Zod schema + totals math for an order
│   ├── dashboard.functions.ts     # Server-side dashboard rollups
│   ├── seed.functions.ts          # Demo data seeder (admin-only)
│   ├── users.functions.ts         # Server fns: list/invite/role/delete
│   ├── demo-user.functions.ts     # First-run admin/staff seed
│   └── kpis.functions.ts
│
├── integrations/supabase/         # Auto-generated — do not edit
├── hooks/
└── styles.css                     # Tailwind v4 + design tokens
```

### Data ↔ display separation

Every feature folder follows the same rule:

- **`data.ts`** — all data fetching, mutation, derivation, and types.
  Hooks here (`useFloorData`, `useUsersList`, …) are the only place
  Supabase, server functions, or `demo-data.ts` are imported.
- **`*Page.tsx` and sub-components** — pure presentation.

The Service feature is a slight exception: `ServicePage.tsx` consumes the
server functions in `src/lib/service.functions.ts` directly because the
page is the only consumer and the form is local-state-heavy.

### Route ↔ feature contract

Route files are deliberately tiny. They register the route with TanStack
Router and import the feature page component. All product logic lives in
`src/features/<name>/`.

---

## Conventions

- **Naming.** Pages are `FeaturePage.tsx` (e.g. `ServicePage`, `FloorPage`,
  `UserConfigPage`). Sub-components are named after what they render
  (`SalesTrendChart`, `InviteUserForm`).
- **Search params.** The filter bar writes to URL search; analytics features
  read via `getRouteApi("/_authenticated").useSearch()`.
- **Server functions.** Defined in `src/lib/*.functions.ts`, consumed via
  TanStack Query hooks in a feature's `data.ts` (or, for The Service,
  directly inside the page component).
- **Styling.** Tailwind v4 with semantic tokens — never hardcode colors.

## Mocked vs real

| Layer                                | Status  |
|--------------------------------------|---------|
| Auth, roles, profiles                | **Real** (Supabase) |
| User Config CRUD                     | **Real** (server functions) |
| **The Service — order entry → DB**   | **Real** (atomic RPC `apply_order_deltas`) |
| Dashboard KPIs/charts (Floor/Office/Architect) | **Hybrid** — reads live tables; seed data still mocked. Service writes populate real rows on top. |
| Events pipeline                      | **Mocked** (seed data) |
| Email invites                        | **Stubbed** |

See [`PRD.md`](./PRD.md) for the full breakdown and [`HANDOFF.md`](./HANDOFF.md)
for the engineering walkthrough.
