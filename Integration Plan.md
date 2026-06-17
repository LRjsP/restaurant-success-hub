# Integration Plan — MISE.OPS

Restaurant operations dashboard. Five operator personas (**The Service**, Floor, Office, Architect, Pipeline) plus User Config and Auth.

---

## Section 1: M4 Status Check

| Check | Status | Notes |
|---|---|---|
| Screen count | **8 screens** | `/auth`, `/service`, `/floor`, `/office`, `/architect`, `/pipeline`, `/users`, `/` (redirect) |
| Living PRD exists | ✅ Yes | `PRD.md`, `MISE-OPS-PRD.md`, `HANDOFF.md`, `README.md` at project root |
| Clean naming | ✅ Yes | Descriptive: `useFloorData`, `computeOfficePnl`, `getServiceCatalog`, `submitOrder`, `DashboardShell`, `KpiTile`. Files organized under `src/features/<persona>/`. |
| GitHub connected | ✅ Yes | Bidirectional sync active; `main` in sync with `origin/main` |
| Supabase backend connected | ✅ Yes (Lovable Cloud) | 12 tables, RLS enabled, auth wired, `handle_new_user` trigger seeds profile + role |
| Write path live | ✅ Yes | The Service → `apply_order_deltas(payload jsonb)` Postgres function |

---

## Section 2: Data Audit — What's Real, What's Still Mocked

The headline change since the original audit: dashboards now read from the
real Supabase tables, and **The Service tab writes to those same tables**
via an atomic RPC. The deterministic generator (`src/lib/demo-data.ts`) is
still used by `seed.functions.ts` to populate historical rows so a fresh
install isn't empty.

| Screen / Component | Source today | Status |
|---|---|---|
| `features/service/ServicePage` | `service.functions.ts` (real) | ✅ Live write path |
| `features/floor/data.ts` → `useFloorData` | `dashboard.functions.ts` aggregating `daily_metrics` + `alerts` | ✅ Real |
| `features/floor/SalesTrendChart` | `daily_metrics.net_sales` grouped by date | ✅ Real |
| `features/floor/AlertsPanel` | `alerts` table | ✅ Real (seeded rows) |
| `features/office/data.ts` → `useOfficeData` | `daily_metrics` rollup (labor / COGS / prime / margin) | ✅ Real |
| `features/office/RevenueVsCostChart` | `daily_metrics` per-day net_sales vs costs | ✅ Real |
| `features/architect/data.ts` → `useArchitectData` | `menu_items` + `menu_item_daily_sales`; falls back to `units_sold_30d` if no period sales | ✅ Hybrid (live for Service tickets) |
| `features/architect/MenuItemsTable` | `menu_items` joined with sales aggregate | ✅ Real |
| `features/pipeline/data.ts` → `usePipelineData` | `events_pipeline` table | ✅ Real (seeded rows) |
| `features/pipeline/UpcomingEventsTable` | `events_pipeline` where `event_date >= now()` | ✅ Real |
| `features/pipeline/FunnelPanel` | `events_pipeline` grouped by stage | ✅ Real |
| `DashboardShell` "Live Service" status pill | Always-on green dot | ⚠️ Still cosmetic; should reflect `hourly_metrics` freshness |
| Floor heatmap (`Heatmap.tsx`) | `hourly_metrics` pivoted day-of-week × hour | ✅ Real |
| Guests CRM page | — | ⛔ No UI yet (guests are attachable from The Service; no dedicated browse page) |

The Service is now the only sanctioned write path for ops data. Any future
ingestion (real POS, batch import) should target the same tables (or call
the same RPC) so dashboards stay correct without UI changes.

---

## Section 3: Schema Design

### Live tables

**`profiles`** — user identity (`id` ↔ `auth.users.id`, `full_name`, `email`).

**`user_roles`** — role assignments (`user_id`, `role app_role`). Read via `has_role(uuid, app_role)` security-definer function.

**`daily_metrics`** — primary ops fact table (drives Floor + Office, written by The Service).
Unique `(date, revenue_center)`.
- `net_sales`, `gross_sales`, `discounts`, `comps`
- `covers`, `tables_served`, `total_reservations`, `no_shows`
- `food_sales` / `beverage_sales` / `liquor_sales` / `beer_sales` / `wine_sales`
- `food_cost` / `beverage_cost` / `liquor_cost` / `beer_cost` / `wine_cost`
- `labor_cost`, `labor_hours`, `available_seats`, `hours_open`

**`hourly_metrics`** — heatmap source. Unique `(date, hour, revenue_center)`. `covers`, `revenue`, `available_seats`.

**`menu_items`** — menu catalog. `name`, `category`, `price`, `plate_cost`, `units_sold_30d`, `is_active`. The Service reads `is_active = true`.

**`menu_item_daily_sales`** — per-day per-item per-revenue-center sales. Unique `(menu_item_id, date, revenue_center)`. `units_sold`, `revenue`, `cost`. Written one row per ticket line by The Service.

**`restaurant_settings`** — single-row config: `name`, `seats_total`, `service_hours_per_day`, `revenue_centers` jsonb (label / value / share / seats / ppa_mul per center). The Service reads `revenue_centers` to populate the center select.

**`events_pipeline`** — CRM stages (`inquiry` | `proposal` | `contract` | `deposit` | `won` | `lost`). `contact_name`, `company`, `stage`, `value`, `event_date`, `notes`, `guest_id`.

**`guests`** — guest CRM. `name`, `email`, `tier`, `visit_count`, `lifetime_value`, `last_visit_at`. Updated atomically by The Service when a guest is attached to a ticket.

**`digital_activity`** — online/delivery channel performance. `date`, `mau`, `online_orders`, `cart_starts`, `cart_completed`.

**`alerts`** — ops alerts feed. `severity`, `message`, `occurred_at`, `resolved`.

**`audit_log`** — append-only. `actor_id`, `action`, `entity`, `entity_id`, `meta jsonb`. The Service writes `action ∈ {order.submit, order.void}` with `entity = 'service_order'`.

### Postgres functions

**`apply_order_deltas(payload jsonb) → uuid`** — `SECURITY DEFINER`. Called by `submitOrder` and `voidOrder`. Performs all upserts and the guest update in a single transaction. Void mode (`payload.void = true`) negates every delta. `GREATEST(0, …)` clamps prevent guest counters from going negative on a double-void.

**`has_role(uuid, app_role) → boolean`** — `SECURITY DEFINER`. The only sanctioned way to check admin status from RLS or server code.

**`handle_new_user()`** — trigger on `auth.users` INSERT. Creates `profiles` row and assigns first user `admin`, subsequent users `staff`.

---

## Section 4: Auth Model & Permissions

### Roles

| Role | Sees | Can do |
|---|---|---|
| **admin** | All five tabs + `/users` | Invite users, change roles, delete users; full CRUD on metrics, menu, pipeline, alerts; submit/void Service orders |
| **staff** | All five tabs | Read all metrics; submit/void Service orders; create/edit pipeline events; resolve alerts; **cannot** touch user management |

First signup auto-promotes to `admin` (`handle_new_user`); subsequent users default to `staff`.

### RLS matrix

Authenticated staff/admin operate on **shared restaurant data** — there is no per-user isolation for ops metrics. Isolation lives at the *role* level.

| Table | SELECT | INSERT / UPDATE / DELETE |
|---|---|---|
| `daily_metrics`, `hourly_metrics`, `digital_activity` | any authenticated | admin only via direct SQL; any authenticated via `apply_order_deltas` RPC |
| `menu_items` | any authenticated | admin only |
| `menu_item_daily_sales` | any authenticated | any authenticated via `apply_order_deltas` RPC |
| `events_pipeline` | any authenticated | any authenticated |
| `guests` | any authenticated | any authenticated (Service create) + RPC updates |
| `alerts` | any authenticated | UPDATE (resolve) for any authenticated; INSERT/DELETE admin only |
| `restaurant_settings` | any authenticated | admin only |
| `profiles` | self can read own + admin can read all | self can update own non-role fields; admin can update any |
| `user_roles` | self can read own row; admin can read all | admin only via `has_role(auth.uid(),'admin')` |
| `audit_log` | admin only | system / server functions only (RPC inserts) |

All role checks must use `public.has_role(uuid, app_role)` — never inline subqueries on `user_roles`.

---

## Section 5: Prompts (historical)

The original schema-expansion and auth-hardening prompts are retained
below for reference. They are now fully applied; The Service write path
extends them.

### Prompt 1 — Schema Expansion *(applied)*

```
Extend the MISE.OPS database and replace the client-side demo data generator
with real queries.

1. Create these new tables with RLS:
   - menu_item_daily_sales (menu_item_id FK, date, revenue_center, units_sold, revenue, cost)
   - restaurant_settings (single-row config)
   - audit_log (actor_id, action, entity, entity_id, meta jsonb)
2. Add columns: events_pipeline.guest_id, profiles.avatar_url.
3. RLS: shared read for authenticated; writes admin-only for metrics/menu/settings;
   events_pipeline + guests writable by any authenticated; alerts UPDATE by any
   authenticated. Use public.has_role() for admin checks.
4. Seed restaurant_settings with one row matching CENTER_MIX.
5. Rewrite the feature data hooks to call server functions backed by Supabase.
6. Keep date range + revenue_center filters in DashboardSearch driving every query.
```

### Prompt 2 — Auth UI + RLS *(applied)*

```
Harden auth and surface identity in MISE.OPS. Sign-in / sign-up / Google OAuth,
header user chip with name + role + avatar, RLS matrix per Section 4, audit_log
on every admin action.
```

### Prompt 3 — Edge Cases *(applied)*

```
Add resilient failure handling across every screen. Error boundaries with Retry,
empty states, form-error preservation, skeleton loading, session expiry redirect,
ConnectionStatus + OfflineBanner.
```

### Prompt 4 — The Service write path *(applied)*

```
Add a cashier/waiter Order Entry tab at /service. Pull menu items from menu_items
(is_active=true) and revenue centers from restaurant_settings. Submit a ticket via
a single SECURITY DEFINER Postgres function apply_order_deltas(jsonb) that upserts
daily_metrics, hourly_metrics, menu_item_daily_sales, updates the attached guest,
and writes an audit_log row in one transaction. Provide Void by replaying the
payload with negated deltas. Validate inputs with Zod on both ends. Map menu
category → sales bucket (food / beverage / liquor / beer / wine) in
service-schema.ts so the Office cost split stays correct.
```

---

## Section 6: Edge Case Checklist

- [x] **DB connection failure** — every route has `errorComponent` with a Retry button that re-runs the loader and invalidates queries.
- [x] **Empty data states** — AlertsPanel, UpcomingEventsTable, MenuItemsTable, UsersTable render an `<EmptyState>` with CTA, never an empty box. The Service "Today's Tickets" shows a friendly empty message.
- [x] **Form submission failure** — AuthForm + InviteUserForm preserve input on error and show inline errors.
- [x] **Loading states** — every `useQuery` consumer renders a skeleton matching its final shape.
- [x] **Session expiry** — `SIGNED_OUT` redirects to `/auth?reason=expired` with a banner.
- [x] **Unauthorized role access** — staff visiting `/users` is redirected/blocked.
- [x] **First-signup race** — only one user can become the first admin (enforced in `handle_new_user`).
- [x] **Offline detection** — `OfflineBanner` listens to `window` `offline` event; defaults to online to avoid preview/iframe false positives.
- [ ] **Stale "Live Service" pill** — should turn amber when latest `hourly_metrics` row > 15 min old. *Cosmetic-only today.*
- [x] **Compare-to-previous with insufficient history** — hides delta chips on missing data instead of showing `Infinity%` / `NaN%`.
- [x] **Revenue center with no data** — shows zero-state, not a crash.
- [x] **Alert resolution race** — idempotent `UPDATE … WHERE resolved = false`.
- [x] **Menu item with zero sold_count** — plots at origin without distorting medians.
- [x] **Pipeline event in the past with stage Inquiry** — flagged in UpcomingEventsTable as overdue.
- [x] **Delete-self protection** — admin cannot delete their own `user_roles` row.
- [x] **Email already registered on sign-up** — inline error.
- [x] **OAuth redirect mismatch** — graceful error on `/auth`.

### The Service edge cases — handled

- [x] **Empty ticket submit** blocked by Zod (`lines.min(1)`) on both client and server.
- [x] **Discount > subtotal** clamped server-side to `gross − comps` so `net_sales` never goes negative.
- [x] **Concurrent cashiers on the same `(date, revenue_center)`** — handled by SQL `+ EXCLUDED.*` upserts, no read-modify-write race.
- [x] **Double-void** — `GREATEST(0, …)` clamps on `guests.visit_count` and `lifetime_value`.
- [x] **Voided order shown grayed-out** with "VOIDED" badge in "Today's Tickets"; Void button hidden after first void.
- [x] **Future date in service context** — blocked by Zod (`date <= today`).
- [x] **Unknown revenue center** — Zod check against the loaded settings list.
- [x] **Guest created mid-ticket** — `createGuest` returns the inserted row and attaches it inline.

---

## Section 7: Stress Test Plan

### Test 1 — Connection Failure: "Yank the Cable Mid-Service"
**Steps:** Sign in. Navigate to `/floor` with range=7d. Open DevTools → Network → set to Offline. Switch range to 30d. Switch revenue center to `bar`. Click an alert "Resolve" button. Then switch to `/service` and try to submit a ticket.
**Expected:** Each affected dashboard component shows the error card with Retry; The Service surfaces a toast "Failed to submit" and keeps the ticket in local state so the cashier can re-submit when connectivity returns. `OfflineBanner` appears. Set Network back online → Retry / re-submit recovers without a full reload.

### Test 2 — Brand-New User: "Empty Restaurant"
**Steps:** Open `/auth` in incognito. Sign up as `newgm@example.com`. (Because `user_roles` is non-empty, this account becomes `staff`.) Land on `/floor`.
**Expected:** Header shows the user identity and "staff" role, no `/users` link. Every KPI tile renders zero values or "No data yet" copy. The Service tab is fully usable; submitting one ticket populates `/floor` immediately on next refetch.

### Test 3 — Rapid Repeated Actions: "Spam the Buttons"
**Steps:** On `/floor`: click an alert's "Resolve" button 10 times in <1s. On `/users`: click "Invite" with the same email 5 times rapidly. On `/service`: tap "Submit Order" 5 times in <1s on the same ticket.
**Expected:** Alert resolves exactly once (button disables on first click). Invite shows "Already invited" inline error. The Service submit button is disabled while `submitMut.isPending`, so only one ticket is recorded; subsequent clicks no-op. No duplicate rows in `daily_metrics` or `audit_log`.

### Test 4 — Service ↔ Reports Loop
**Steps:** As any authenticated user: open `/service`, submit one ticket for `patio`, party of 3, with a Cocktail and a Main. Switch to `/floor` with center=`patio`, range=today.
**Expected:** Covers ↑ by 3, Net sales ↑ by the ticket net, food/beverage split correct, daily heatmap cell for the current hour brightens. Switch to `/architect` — the two items appear with non-zero sold count for today's date. Void the ticket from `/service` → all deltas reverse.

---

## Section 8: Handoff Note

### What's Real vs. What's Mocked

| Feature | Status | Source |
|---|---|---|
| Auth (sign in / sign up / sign out) | ✅ Real | Supabase Auth |
| User management (`/users`) | ✅ Real | `users.functions.ts` + `profiles` + `user_roles` |
| Role assignment + first-admin bootstrap | ✅ Real | `handle_new_user` trigger |
| **The Service — order entry, void, recent feed** | ✅ Real | `service.functions.ts` + `apply_order_deltas` RPC |
| Menu catalog + revenue centers | ✅ Real | `menu_items`, `restaurant_settings` |
| Floor KPIs, trend, alerts, heatmap | ✅ Real (seeded + live) | `daily_metrics`, `hourly_metrics`, `alerts` |
| Office P&L summary + revenue-vs-cost chart | ✅ Real | `daily_metrics` |
| Architect menu matrix + items table | ✅ Real | `menu_items` + `menu_item_daily_sales` (with `units_sold_30d` fallback) |
| Pipeline funnel + upcoming events | ✅ Real (seeded) | `events_pipeline` |
| Guests CRM page | ⛔ Not built | `guests` table exists, attachable from Service; no browse UI |
| Date range + revenue center filters | ✅ Real (URL state) | `dashboardSearchSchema` |
| Theme toggle, responsive shell, OfflineBanner | ✅ Real | UI only |
| Email invitations | ⚠️ Stubbed | Creates user + role; no email sent |

### Database Schema Summary

- **profiles** — user identity
- **user_roles** — role per user (admin | staff)
- **daily_metrics** — per-day per-revenue-center sales, covers, costs, labor
- **hourly_metrics** — per-hour granularity for heatmap
- **menu_items** — menu catalog with price + plate_cost
- **menu_item_daily_sales** — per-day per-item sales (written by The Service)
- **digital_activity** — online/delivery channel performance
- **events_pipeline** — CRM stages
- **guests** — guest CRM (lifetime spend, visits, tier)
- **alerts** — ops alerts feed
- **restaurant_settings** — single-row site config (seats, hours, revenue_centers)
- **audit_log** — append-only log of order submissions and voids

### Auth & RLS Model

- Two roles via `app_role` enum: `admin`, `staff`. First signup → admin, all others → staff.
- Role checks use `public.has_role(uuid, app_role)` security-definer function.
- All ops tables: any authenticated user can SELECT; direct writes restricted to admin (or any authenticated for CRM-style tables).
- Service writes go through `apply_order_deltas` so even staff can mutate ops tables without granting raw write access.
- `profiles`: self-read + admin-read; self-update of non-role fields.
- `user_roles`: self-read own row; admin-only writes.
- No per-user data isolation on ops metrics — a restaurant team shares one dataset.

### Edge Cases Handled
See Section 6 — every checklist item is covered except the "Live Service" pill freshness indicator (cosmetic).

### Known Gaps
- No payment capture, receipt printing, or KDS routing on The Service.
- No item modifiers / multi-seat splits on a ticket.
- "Live Service" pill is cosmetic; should reflect `hourly_metrics` freshness.
- Guests have no dedicated browse / detail page yet.
- Email invitations are stubbed.

### Live URL
_To be filled after deployment._
