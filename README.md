# MISE.OPS

Opinionated restaurant operations intelligence dashboard. Four mission-named
surfaces — **The Floor**, **The Office**, **The Architect**, **The Pipeline** —
plus an admin-only **User Config**, all sharing a single filter bar and
period-over-period comparison.

> Full product spec: [`PRD.md`](./PRD.md)

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
┌──────────┬──────────┬────────────┬───────────┬──────────┐
│ /floor   │ /office  │ /architect │ /pipeline │ /users   │
│ The      │ The      │ The        │ The       │ User     │
│ Floor    │ Office   │ Architect  │ Pipeline  │ Config   │
│          │          │            │           │ (admin)  │
└──────────┴──────────┴────────────┴───────────┴──────────┘
```

The filter bar lives in `DashboardShell` and is the single source of truth.
Each feature reads `range` / `center` from the route's search params and
recomputes locally — no global state.

---

## Project structure

```
src/
├── routes/                        # Thin route wrappers — wiring only
│   ├── __root.tsx                 # HTML shell, providers
│   ├── index.tsx                  # / → redirects into the app
│   ├── auth.tsx                   # → features/auth/AuthPage
│   ├── _authenticated.tsx         # session gate + DashboardShell
│   ├── _authenticated.floor.tsx
│   ├── _authenticated.office.tsx
│   ├── _authenticated.architect.tsx
│   ├── _authenticated.pipeline.tsx
│   └── _authenticated.users.tsx
│
├── features/                      # One folder per product surface
│   ├── auth/                      # Auth (sign in / sign up / demo seed)
│   │   ├── data.ts                # Supabase calls + react-query hooks
│   │   ├── AuthPage.tsx           # Page composition
│   │   ├── AuthForm.tsx           # Presentational form
│   │   └── DemoSetupCard.tsx
│   ├── floor/                     # The Floor — daily service pulse
│   │   ├── data.ts                # useFloorData (KPIs + alerts)
│   │   ├── FloorPage.tsx
│   │   ├── OnboardingHint.tsx
│   │   ├── SalesTrendChart.tsx
│   │   └── AlertsPanel.tsx
│   ├── office/                    # The Office — weekly P&L
│   │   ├── data.ts                # useOfficeData
│   │   ├── OfficePage.tsx
│   │   ├── RevenueVsCostChart.tsx
│   │   └── PnlSummaryPanel.tsx
│   ├── architect/                 # The Architect — menu engineering
│   │   ├── data.ts                # useArchitectData
│   │   ├── utils.ts               # median, color map, sort key types
│   │   ├── ArchitectPage.tsx
│   │   ├── MenuMatrixChart.tsx
│   │   ├── MenuItemsTable.tsx
│   │   └── TopPerformersPanel.tsx
│   ├── pipeline/                  # The Pipeline — events / catering CRM
│   │   ├── data.ts                # usePipelineData + stage colors
│   │   ├── PipelinePage.tsx
│   │   ├── FunnelPanel.tsx
│   │   └── UpcomingEventsTable.tsx
│   └── users/                     # User Config — admin only
│       ├── data.ts                # query/mutation hooks over server fns
│       ├── UserConfigPage.tsx
│       ├── InviteUserForm.tsx
│       └── UsersTable.tsx
│
├── components/
│   ├── dashboard/                 # Cross-feature shell primitives
│   │   ├── DashboardShell.tsx     # Header, tab nav, filter bar
│   │   ├── KpiTile.tsx            # KpiTile + Panel wrapper
│   │   └── Heatmap.tsx            # Day × time heatmap (Floor + Office)
│   ├── ui/                        # shadcn/ui primitives
│   ├── theme-provider.tsx
│   └── theme-toggle.tsx
│
├── lib/
│   ├── demo-data.ts               # Deterministic mock data generator
│   ├── format.ts                  # fmtCurrency, fmtNumber, presets
│   ├── dashboard-search.ts        # Zod schema for URL search params
│   ├── users.functions.ts         # Server fns: list/invite/role/delete
│   ├── demo-user.functions.ts     # Server fns: first-time demo seed
│   └── ...                        # Other shared utilities
│
├── integrations/supabase/         # Auto-generated — do not edit
├── hooks/                         # Cross-cutting hooks (e.g. use-mobile)
└── styles.css                     # Tailwind v4 + design tokens
```

### Data ↔ display separation

Every feature folder follows the same rule:

- **`data.ts`** — all data fetching, mutation, derivation, and types.
  Hooks here (`useFloorData`, `useUsersList`, …) are the only place
  Supabase, server functions, or `demo-data.ts` are imported.
- **`*Page.tsx` and sub-components** — pure presentation. They receive
  data via hooks or props and render JSX. No fetches, no business math.

This makes it trivial to swap mocked data for real APIs later: replace
the body of `data.ts` in a feature, leave every component untouched.

### Route ↔ feature contract

Route files are deliberately tiny. They register the route with TanStack
Router and import the feature page component. All product logic lives in
`src/features/<name>/`.

---

## Conventions

- **Naming.** Pages are `FeaturePage.tsx` (e.g. `FloorPage`, `OfficePage`,
  `UserConfigPage`). Sub-components are named after what they render
  (`SalesTrendChart`, `InviteUserForm`).
- **Search params.** The filter bar writes to URL search; features read
  via `getRouteApi("/_authenticated").useSearch()`.
- **Server functions.** Defined in `src/lib/*.functions.ts`, consumed via
  TanStack Query hooks in a feature's `data.ts`.
- **Styling.** Tailwind v4 with semantic tokens — never hardcode colors.

## Mocked vs real

| Layer                 | Status   |
|-----------------------|----------|
| Auth, roles, profiles | **Real** (Supabase) |
| User Config CRUD      | **Real** (server functions) |
| Dashboard KPIs/charts | **Mocked** via `src/lib/demo-data.ts` |
| Events pipeline       | **Mocked** |
| Email invites         | **Stubbed** |

See [`PRD.md`](./PRD.md) for the full breakdown.
