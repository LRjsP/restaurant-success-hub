# Integration Plan — MISE.OPS

Restaurant operations dashboard. Four operator personas (Floor, Office, Architect, Pipeline) plus User Config and Auth.

---

## Section 1: M4 Status Check

| Check | Status | Notes |
|---|---|---|
| Screen count | **7 screens** | `/auth`, `/floor`, `/office`, `/architect`, `/pipeline`, `/users`, `/` (redirect to `/floor`) |
| Living PRD exists | ✅ Yes | `PRD.md`, `MISE-OPS-PRD.md`, `HANDOFF.md`, `README.md` at project root |
| Clean naming | ✅ Yes | Descriptive: `useFloorData`, `computeOfficePnl`, `getFloorKpis`, `DashboardShell`, `KpiTile`. Files organized under `src/features/<persona>/` |
| GitHub connected | ✅ Yes | Bidirectional sync active; `main` in sync with `origin/main` |
| Supabase backend connected | ✅ Yes (Lovable Cloud) | 9 tables, RLS enabled, auth wired, `handle_new_user` trigger seeds profile + role |

---

## Section 2: Data Audit — What's Still Hardcoded?

The big finding: the **DB schema and server functions exist** (`src/lib/kpis.functions.ts` queries `daily_metrics`, `alerts`, etc.), but every feature page actually reads from **`src/lib/demo-data.ts`** — a deterministic client-side generator. The Supabase queries are wired but unused by the UI.

| Screen / Component | Hardcoded Value | What It Should Query |
|---|---|---|
| `features/floor/data.ts` → `useFloorData` | `generateDemoDays()`, `demoAlerts` (synthetic covers, net sales, PPA, table turns) | `daily_metrics` aggregated by `date`/`revenue_center` + `alerts` where `resolved=false` (already implemented in `getFloorKpis`) |
| `features/floor/SalesTrendChart` | Demo daily net-sales series | `daily_metrics.net_sales` grouped by `date` for selected range/center |
| `features/floor/AlertsPanel` | `demoAlerts` array from `demo-data.ts` | `alerts` table where `resolved=false` order by `occurred_at` desc |
| `features/office/data.ts` → `useOfficeData` | `computeOfficePnl()` from demo days (labor %, COGS %, prime cost, operating margin) | `daily_metrics` sum of `labor_cost`, `food_cost`, `beverage_cost`, `net_sales` |
| `features/office/RevenueVsCostChart` | Synthetic per-day revenue vs cost | `daily_metrics` per-day `net_sales` minus `labor_cost + food_cost + beverage_cost` |
| `features/architect/data.ts` → `useArchitectData` | `computeMenuMatrix(totalCovers)` — synthetic stars/dogs/puzzles | `menu_items` joined with sales mix; classification computed from `popularity` × `margin` medians |
| `features/architect/MenuItemsTable` | Synthetic item rows | `menu_items` (name, category, price, cost, sold count) |
| `features/pipeline/data.ts` → `usePipelineData` | `generatePipeline()` — synthetic leads, stages, values | `events_pipeline` table (already exists) |
| `features/pipeline/UpcomingEventsTable` | Synthetic events | `events_pipeline` where `event_date >= now()` order by `event_date` |
| `features/pipeline/FunnelPanel` | Synthetic stage counts | `events_pipeline` group by `stage` |
| `DashboardShell` "Live Service" status pill | Always-on green dot | Derived from latest `hourly_metrics` row freshness (e.g., < 15 min old) |
| `DashboardShell` brand mark "MISE.OPS" / "M" badge | Hardcoded — keep | Brand chrome, not data |
| Floor heatmap (`Heatmap.tsx`) | Demo day×hour matrix | `hourly_metrics` pivoted by day-of-week × hour |
| `features/floor/OnboardingHint` | Static copy | Keep static (UI copy) |

**No guest/CRM page consumes `guests` yet** — table exists but unused.

---

## Section 3: Schema Design

### Existing tables (from M4)

**`profiles`** — user-facing identity
- `id` uuid PK (= auth.users.id)
- `full_name` text
- `email` text
- `created_at`, `updated_at` timestamptz

**`user_roles`** — role assignments (separated from profiles for security)
- `id` uuid PK
- `user_id` uuid FK → auth.users
- `role` app_role enum (`admin` | `staff`)
- `created_at` timestamptz

**`daily_metrics`** — primary ops fact table (drives Floor + Office)
- `id` uuid PK, `date` date, `revenue_center` text
- `net_sales`, `gross_sales`, `discounts`, `comps` numeric
- `covers`, `tables_served`, `total_reservations`, `no_shows` int
- `food_sales`, `beverage_sales`, `liquor_sales`, `beer_sales`, `wine_sales` numeric
- `food_cost`, `beverage_cost`, `liquor_cost`, `beer_cost`, `wine_cost` numeric
- `labor_cost` numeric, `labor_hours` numeric
- `available_seats` int, `hours_open` numeric
- `created_at`, `updated_at` timestamptz

**`hourly_metrics`** — drives Floor heatmap
- `id` uuid PK, `date` date, `hour` int, `revenue_center` text
- `covers` int, `net_sales` numeric, `labor_cost` numeric, `wait_time_min` numeric
- timestamps

**`menu_items`** — drives Architect
- `id` uuid PK, `name` text, `category` text
- `price`, `food_cost` numeric, `sold_count` int, `is_active` boolean
- timestamps

**`events_pipeline`** — drives Pipeline CRM
- `id` uuid PK, `event_name` text, `stage` text (Inquiry | Proposal | Confirmed | Deposit Paid | Lost)
- `event_date` date, `guests` int, `value` numeric, `owner_id` uuid
- timestamps

**`guests`** — guest CRM (unused in UI today)
- `id` uuid PK, `full_name`, `email`, `phone` text
- `visits` int, `lifetime_spend` numeric, `last_visit` date
- timestamps

**`digital_activity`** — online ordering/delivery channel
- `id` uuid PK, `date` date, `channel` text, `orders` int, `revenue` numeric, `avg_prep_min` numeric
- timestamps

**`alerts`** — Floor alerts feed
- `id` uuid PK, `severity` text, `title` text, `body` text
- `occurred_at` timestamptz, `resolved` boolean, `revenue_center` text

### Proposed new tables / fields

**NEW `menu_item_daily_sales`** — per-day item sales (powers honest Architect classification)
- `id` uuid PK
- `menu_item_id` uuid FK → menu_items
- `date` date, `revenue_center` text
- `units_sold` int, `revenue` numeric, `cost` numeric
- timestamps

**NEW `restaurant_settings`** — single-row site config (replaces hardcoded `CENTER_MIX` seat counts)
- `id` uuid PK
- `name` text, `seats_total` int, `service_hours_per_day` numeric
- `revenue_centers` jsonb (label, share, seats per center)
- timestamps

**NEW `audit_log`** — for admin actions on `/users` and CRM edits
- `id` uuid PK, `actor_id` uuid, `action` text, `entity` text, `entity_id` uuid, `meta` jsonb, `created_at` timestamptz

**Add to `events_pipeline`**: `guest_id` uuid FK → guests (so CRM page can list events per guest)

**Add to `profiles`**: `avatar_url` text (header user chip)

---

## Section 4: Auth Model & Permissions

### Roles (already defined as `app_role` enum)

| Role | Sees | Can do |
|---|---|---|
| **admin** | All four tabs + `/users` | Invite users, change roles, delete users; full CRUD on metrics, menu, pipeline, alerts |
| **staff** | All four tabs (Floor, Office, Architect, Pipeline) | Read all metrics; create + edit pipeline events; resolve alerts; cannot touch user management |

First signup auto-promotes to `admin` (`handle_new_user` trigger); subsequent users default to `staff`.

### Row-Level Security policies (current + proposed)

Authenticated staff/admin operate on **shared restaurant data** — there is no per-user isolation for ops metrics (an entire restaurant team must see the same numbers). Isolation lives at the *role* level, not the *user* level.

| Table | SELECT | INSERT/UPDATE/DELETE |
|---|---|---|
| `daily_metrics`, `hourly_metrics`, `digital_activity` | any authenticated user | admin only |
| `menu_items`, `menu_item_daily_sales` | any authenticated user | admin only |
| `events_pipeline` | any authenticated user | any authenticated user (staff can manage their CRM) |
| `guests` | any authenticated user | any authenticated user |
| `alerts` | any authenticated user | UPDATE (resolve) for any authenticated; INSERT/DELETE admin only |
| `restaurant_settings` | any authenticated user | admin only |
| `profiles` | self can read own + admin can read all | self can update own non-role fields; admin can update any |
| `user_roles` | self can read own row; admin can read all | admin only via `has_role(auth.uid(),'admin')` |
| `audit_log` | admin only | system / server functions only |

All role checks must use the `public.has_role(uuid, app_role)` security-definer function (already established) — never inline subqueries against `user_roles` from a policy on `user_roles`.

---

## Section 5: Prompts

### Prompt 1 — Schema Expansion

```
Extend the MISE.OPS database and replace the client-side demo data generator with real queries.

1. Create these new tables with RLS:
   - menu_item_daily_sales (menu_item_id FK, date, revenue_center, units_sold, revenue, cost)
   - restaurant_settings (single-row config: name, seats_total, service_hours_per_day, revenue_centers jsonb)
   - audit_log (actor_id, action, entity, entity_id, meta jsonb)
2. Add columns: events_pipeline.guest_id (FK guests), profiles.avatar_url.
3. RLS: shared read for authenticated; writes admin-only for metrics/menu/settings; events_pipeline + guests writable by any authenticated; alerts UPDATE (resolve) by any authenticated. Use public.has_role() for admin checks.
4. Seed restaurant_settings with one row matching the current CENTER_MIX in src/lib/demo-data.ts.
5. Rewrite the feature data hooks to call server functions backed by Supabase instead of demo-data.ts:
   - src/features/floor/data.ts → useQuery(getFloorKpis) — wire SalesTrendChart, AlertsPanel, Heatmap to daily_metrics + hourly_metrics + alerts.
   - src/features/office/data.ts → new getOfficePnl server fn aggregating daily_metrics.
   - src/features/architect/data.ts → new getMenuMatrix server fn joining menu_items + menu_item_daily_sales.
   - src/features/pipeline/data.ts → new getPipeline server fn reading events_pipeline.
6. Keep the date range + revenue_center filters in DashboardSearch driving every query.
7. Delete src/lib/demo-data.ts only after every consumer is migrated. Add skeleton loading states wherever useQuery is added.
```

### Prompt 2 — Auth UI + Row-Level Security

```
Harden auth and surface identity in MISE.OPS.

1. /auth already exists — polish it: email+password sign-in, sign-up with full_name, Google OAuth via the Lovable broker, password reset link.
2. In src/components/dashboard/DashboardShell.tsx header (next to the LogOut button):
   - Show the signed-in user's full_name and role (admin/staff) read from getMyRole.
   - Show an avatar circle (profiles.avatar_url, fallback to initials).
   - Keep the existing LogOut button; on click call supabase.auth.signOut() and redirect to /auth.
3. Confirm and apply the RLS matrix from the Integration Plan Section 4 across daily_metrics, hourly_metrics, digital_activity, menu_items, menu_item_daily_sales, events_pipeline, guests, alerts, restaurant_settings, profiles, user_roles, audit_log. All admin checks must use public.has_role(auth.uid(),'admin').
4. Add a per-test verification: sign in as a staff user and confirm the /users link in the header is hidden and a direct visit to /users redirects or shows "Admins only".
5. On the /users page, every role change and delete must write a row to audit_log via a server function (never from the client).
```

### Prompt 3 — Edge Cases

```
Add resilient failure handling across every screen in MISE.OPS (/floor, /office, /architect, /pipeline, /users, /auth).

1. Database connection failure → wrap every page in an errorComponent that shows an inline error card with a "Retry" button calling router.invalidate() + queryClient.invalidateQueries(). Never show a blank screen.
2. Empty data states → in AlertsPanel, UpcomingEventsTable, MenuItemsTable, UsersTable: when the query returns an empty array, render an EmptyState component with an icon, a one-line message, and a primary CTA ("Seed demo data" for ops tables, "Invite teammate" for users, "Add event" for pipeline).
3. Form submission failure → AuthForm, InviteUserForm, and any future event/guest forms must keep field values on error, show the error inline beneath the submit button, and re-enable the submit button. Use react-hook-form's setError, not toast-only.
4. Loading states → replace every "..." or null-render with skeleton screens: KpiTile skeletons on Floor/Office/Architect, table-row skeletons in MenuItemsTable / UpcomingEventsTable / UsersTable, chart-area skeleton in SalesTrendChart / RevenueVsCostChart / MenuMatrixChart / Heatmap.
5. Session expiry → in src/routes/_authenticated.tsx onAuthStateChange, on SIGNED_OUT or TOKEN_REFRESHED returning null, redirect to /auth?reason=expired and show a banner "Your session expired — please sign in again."
6. Add a tiny <ConnectionStatus /> indicator in DashboardShell header that turns red when supabase health check fails twice in a row.
```

---

## Section 6: Edge Case Checklist

- [ ] **DB connection failure** — every route has `errorComponent` with a Retry button that re-runs the loader and invalidates queries.
- [ ] **Empty data states** — AlertsPanel, UpcomingEventsTable, MenuItemsTable, UsersTable, FunnelPanel all render an `<EmptyState>` with CTA, never an empty box.
- [ ] **Form submission failure** — AuthForm + InviteUserForm preserve input on error and show inline errors beneath the relevant field.
- [ ] **Loading states** — every `useQuery` consumer renders a skeleton matching its final shape (KPI tiles, table rows, chart canvas).
- [ ] **Session expiry** — `SIGNED_OUT` redirects to `/auth?reason=expired` with a banner.
- [ ] **Unauthorized role access** — staff visiting `/users` is redirected to `/floor` with a toast "Admins only".
- [ ] **First-signup race** — only one user can become the first admin; subsequent concurrent signups default to staff (already enforced in `handle_new_user`).
- [ ] **Stale "Live Service" pill** — when latest `hourly_metrics` row is older than 15 min, pill turns amber.
- [ ] **Compare-to-previous with insufficient history** — if `prevFrom..prevTo` range has zero rows, hide delta chips instead of showing "+Infinity%" / "NaN%".
- [ ] **Revenue center with no data** — selecting a center with no rows in range shows zero-state, not crash.
- [ ] **Date range edge** — selecting "Today" before the first `hourly_metrics` ingestion shows "No data yet — check back after first service."
- [ ] **Alert resolution race** — resolving the same alert from two tabs is idempotent (`UPDATE … WHERE resolved = false`).
- [ ] **Menu item with zero sold_count** — Architect matrix plots at axis origin without distorting medians.
- [ ] **Pipeline event in the past with stage Inquiry** — flagged in UpcomingEventsTable as overdue.
- [ ] **Delete self protection** — admin cannot delete their own user_roles row from `/users`.
- [ ] **Email already registered on sign-up** — clear inline error, not a toast.
- [ ] **OAuth redirect mismatch** — graceful error on `/auth` instead of generic Supabase failure.

---

## Section 7: Stress Test Plan

### Test 1 — Connection Failure: "Yank the Cable Mid-Service"
**Steps:** Sign in. Navigate to `/floor` with range=7d. Open DevTools → Network → set to Offline. Switch range to 30d (forces refetch). Switch revenue center to `bar`. Click an alert "Resolve" button.
**Expected:** Each affected component shows the error card with Retry — KPI tiles, SalesTrendChart, AlertsPanel. The "Live Service" pill turns red. Header chrome and navigation remain interactive. Set Network back online → click Retry on any one card → all queries refetch and the dashboard recovers without a full reload.

### Test 2 — Brand-New User: "Empty Restaurant"
**Steps:** Open `/auth` in an incognito window. Sign up as `newgm@example.com` / `Test1234!`. (Because user_roles is non-empty, this account becomes `staff`.) Land on `/floor`.
**Expected:** Header shows "newgm@example.com — staff", no User Config icon. Every KPI tile renders zero values or "No data yet" copy, not NaN. AlertsPanel shows EmptyState with a "Seed demo data" CTA (admin-only — hidden for staff with a "Ask an admin to seed data" message). Switching tabs to `/office`, `/architect`, `/pipeline` each show graceful empty states. Sign out → redirect to `/auth`.

### Test 3 — Rapid Repeated Actions: "Spam the Resolve Button"
**Steps:** As admin, on `/floor` with at least one alert: click the alert's "Resolve" button 10 times in under a second. Then on `/users`: click "Invite" with the same email 5 times rapidly. Then on `/pipeline` (once Prompt 1 ships): change one event's stage from Inquiry→Proposal→Confirmed→Inquiry in under a second.
**Expected:** Alert resolves exactly once (button disables on first click and stays disabled until the mutation settles; subsequent clicks are no-ops). Invite shows "Already invited" inline error after the first success; no duplicate rows in `user_roles`. Stage changes serialize and the final UI state matches the last committed value (use mutation `mutationKey` or optimistic updates with rollback). No console errors, no duplicated audit_log rows.

---

## Section 8: Handoff Note

### What's Real vs. What's Mocked

| Feature | Status | Source |
|---|---|---|
| Auth (sign in / sign up / sign out) | ✅ Real | Supabase Auth |
| User management (`/users`) | ✅ Real | `users.functions.ts` + `profiles` + `user_roles` |
| Role assignment + first-admin bootstrap | ✅ Real | `handle_new_user` trigger |
| Floor KPIs, trend, alerts, heatmap | ⚠️ Mocked | `src/lib/demo-data.ts` (server fn `getFloorKpis` exists but unused) |
| Office P&L summary + revenue-vs-cost chart | ⚠️ Mocked | `src/lib/demo-data.ts` |
| Architect menu matrix + items table | ⚠️ Mocked | `src/lib/demo-data.ts` |
| Pipeline funnel + upcoming events | ⚠️ Mocked | `src/lib/demo-data.ts` |
| Guests CRM | ⛔ Not built | `guests` table exists, no UI |
| Date range + revenue center filters | ✅ Real (URL state) | `dashboardSearchSchema` |
| Theme toggle, responsive shell | ✅ Real | UI only |

### Database Schema Summary

- **profiles** — user identity (id, full_name, email)
- **user_roles** — role per user (admin | staff) via `app_role` enum
- **daily_metrics** — per-day per-revenue-center sales, covers, costs, labor
- **hourly_metrics** — per-hour service granularity for heatmap
- **digital_activity** — online/delivery channel performance
- **menu_items** — menu catalog with price + cost
- **events_pipeline** — CRM stages (Inquiry → Deposit Paid / Lost)
- **guests** — guest CRM (lifetime spend, visits)
- **alerts** — ops alerts feed with severity + resolved flag

### Auth & RLS Model

- Two roles via `app_role` enum: `admin`, `staff`. First signup → admin, all others → staff.
- Role checks use `public.has_role(uuid, app_role)` security-definer function.
- All ops tables: any authenticated user can SELECT; writes restricted to admin (or to any-authenticated for CRM-style tables — events_pipeline, guests, alert resolution).
- `profiles`: self-read + admin-read; self-update of non-role fields.
- `user_roles`: self-read own row; admin-only writes.
- No per-user data isolation on ops metrics — a restaurant team shares one dataset.

### Edge Cases Handled
_To be filled after the lab._

### Known Gaps
_To be filled after stress testing._

### Live URL
_To be filled after deployment._
