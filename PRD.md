# MISE.OPS — Product Requirements Document

*Extracted from working prototype · June 2026 (rev. The Service)*

---

## 1. What it is

MISE.OPS is an **opinionated restaurant operations intelligence dashboard** that consolidates the four lenses that actually drive a restaurant — **service, profit, menu, and pipeline** — into a single tool with consistent filters, period-over-period comparison, and plain-language metric framing. It is paired with a built-in **order-entry terminal** so the same tool that surfaces the numbers is also the tool that produces them.

It is optimised for two recurring scenarios:

> *Monday morning, 15 minutes, one coffee. Understand last week, decide this week, confirm the pipeline is healthy.*

> *Friday service, 7:42pm. A waiter rings in a 4-top, the GM watches covers and PPA move on the Floor dashboard from the host stand.*

---

## 2. Target user

- **Primary:** Owner-operators and General Managers of independent, single-unit or small-group restaurants ($1M–$10M revenue).
- **Secondary:** Executive Chefs and Beverage Directors who need menu-engineering and yield data.
- **Tertiary:** Catering / Events managers tracking a private-events pipeline.
- **Operational:** Cashiers and waiters using **The Service** tab as the in-shift ticketing surface.

Persona excludes large chains (they have BI teams) and pure QSR (different ops model).

---

## 3. Problem & Hypothesis

**Problem.** Independent operators don't lack data — they lack a *single, opinionated view* of it, AND they lack a tight loop between the floor (where data is created) and the office (where it is read). Decisions get stitched together from POS reports, a bookkeeper's spreadsheet, a Google Calendar of events, and gut feel.

**Hypothesis.** *If* operators can see service, P&L, menu, and pipeline in one tool with shared filters and period comparison — *and* if every ticket entered on the floor lands instantly in those views — *then* they will answer questions like "Are we losing money on Tuesdays?", "Which items deserve a price bump?", or "How healthy is Q3 catering?" in **under 30 seconds**, and act on them weekly instead of monthly.

**Falsifiable in beta by:** measuring time-to-answer on a fixed task list, weekly active sessions per operator, and the share of service revenue captured through The Service vs. external POS exports.

---

## 4. Screens

| # | Screen | Route | Purpose | Core widgets |
|---|---|---|---|---|
| 1 | **Auth** | `/auth` | Sign-in / sign-up. First-run seeding of demo admin + staff accounts. | Email+password form, first-time setup panel |
| 2 | **The Service** — *Order Entry* | `/service` | "Ring in a ticket." Cashier & waiter terminal that writes directly into the operational tables. | Service context (date · hour · revenue center · party · table · server), live menu grid by category, ticket panel with qty / comp / discount, guest picker, recent-tickets feed with Void. |
| 3 | **The Floor** — *Daily Pulse* | `/floor` | "How is service performing?" | KPIs: covers, net sales, PPA, avg check, discount %. Day×time demand heatmap. |
| 4 | **The Office** — *Weekly P&L* | `/office` | "Are we making money?" | Labor %, COGS %, prime cost, operating profit, weekly revenue vs cost chart. |
| 5 | **The Architect** — *Menu Engineering* | `/architect` | "Which menu items earn their place?" | Popularity × margin scatter with Stars / Plowhorses / Puzzles / Dogs. |
| 6 | **The Pipeline** — *Events CRM* | `/pipeline` | "What's coming?" | Open pipeline value, win rate, upcoming events list, stage funnel. |
| 7 | **User Config** *(admin only)* | `/users` | Manage staff accounts and roles. | User list, role assignment, invite flow. |

The four analytics dashboards share a single `DashboardShell` with a persistent **filter bar** (date range · revenue center · compare-to-prior). Filters are **URL-driven** so any view is shareable. The Service tab lives inside the same shell but uses its own per-ticket context controls.

---

## 5. User flow

```text
   /  ──► (auth?) ──no──► /auth ──sign in──┐
        └──yes──► /floor                   │
                                           ▼
                ┌──── DashboardShell ──────────────────────────────────┐
                │  /service                                            │
                │     │ submit ticket                                  │
                │     ▼                                                │
                │  apply_order_deltas RPC (atomic)                     │
                │     ↳ daily_metrics, hourly_metrics,                 │
                │       menu_item_daily_sales, guests, audit_log       │
                │     │                                                │
                │     ▼                                                │
                │  /floor → /office → /architect → /pipeline           │
                │  Filters (range, center, compare) via URL            │
                └──────────────────────────────────────────────────────┘
                            │ admin only
                            ▼
                          /users
```

**Typical 15-minute Monday session**
1. Land on **Floor** → scan yesterday's covers + heatmap for soft dayparts.
2. Switch to **Office** → confirm labor % and COGS % within target.
3. Open **Architect** → flag one Plowhorse for a price test.
4. Finish on **Pipeline** → confirm next week's events.
5. Forward a filtered URL to chef / partner.

**Typical in-service ticket flow**
1. Open **The Service** → pick *Patio*, party of 4, table 12.
2. Tap items from the *Mains* / *Cocktails* tabs; quantities increment on repeat tap.
3. Apply a 10% loyalty discount; mark a comped dessert.
4. (Optional) attach a **Guest** for lifetime-value tracking.
5. Submit → KPIs on Floor and item rows on Architect update on next visit; Void from "Today's Tickets" if needed.

---

## 6. Key metrics

**Product success (north stars)**
- Time-to-answer on the 4 canonical questions < 30 s.
- ≥ 1 dashboard session per operator per week.
- ≥ 3 of 4 analytics tabs viewed per session.
- Share of service revenue captured through The Service ≥ 80% during pilots.

**In-product metrics surfaced to the user**
- *Service:* Net total per ticket, channel, party size, comps, discounts, food-cost estimate. "Today's Tickets" feed with per-row Void.
- *Floor:* Covers, Net Sales, PPA, Avg Check, Discount %, Comp $, day×time demand.
- *Office:* Net Sales, Labor %, COGS %, Prime Cost %, Operating Profit, Food vs Beverage mix.
- *Architect:* Item popularity (mix %), contribution margin $, classification (Star/Plowhorse/Puzzle/Dog).
- *Pipeline:* Open pipeline $, Win rate %, Booked revenue, Upcoming events, Stage funnel.

All analytics metrics support **period-over-period delta** via the Compare toggle.

---

## 7. Roles & access

| Role | Access |
|---|---|
| **Owner / Admin** | All 4 analytics dashboards + The Service + `/users`. Can invite, change roles, remove. |
| **Staff** | All 4 analytics dashboards + The Service (submit / void). Read-only on user config. |

Roles are stored in `user_roles` (never on profiles) and checked via the `SECURITY DEFINER` `has_role()` function used in RLS policies. Every Service ticket records the `actor_id` in `audit_log` for attribution.

---

## 8. What is mocked vs real

| Layer | Status | Notes |
|---|---|---|
| **Auth (email + password, Google OAuth)** | **Real** | Supabase Auth. First-run seeds `admin@miseops.dev` / `staff@miseops.dev` (`MiseDemo!2026`). |
| **Roles, profiles, user management** | **Real** | `profiles` + `user_roles` with RLS; admin-only mutations. |
| **Route shell, filter bar, URL state, theming** | **Real** | TanStack Start + Router, Zod search params, design tokens. |
| **The Service — order entry → DB** | **Real** | `submitOrder` server fn → `apply_order_deltas` Postgres function performs all upserts atomically across `daily_metrics`, `hourly_metrics`, `menu_item_daily_sales`, `guests`, `audit_log`. Void replays with negated deltas. |
| **Menu catalog + revenue centers** | **Real** | Service reads `menu_items` and `restaurant_settings.revenue_centers` live. |
| **Dashboard data — Floor / Office / Architect / Pipeline** | **Hybrid** | Dashboard queries hit the real tables. Historical demo rows seeded by `seed.functions.ts`; new rows produced live by The Service. The Architect falls back to `menu_items.units_sold_30d` when no per-item sales exist in the range. |
| **Period comparison** | **Real** | Same tables with a shifted range. |
| **Revenue-center filter** | **Real** | `WHERE revenue_center = ?` against `daily_metrics`. |
| **Events pipeline records** | **Mocked** | Seeded into `events_pipeline`; no CRM connector yet. |
| **Email invites for new users** | **Stubbed** | UI exists; transactional email not wired. |

---

## 9. Non-goals (current scope)

- No POS / accounting / CRM integrations (Square, Toast, QuickBooks). The Service IS the POS for the prototype; the schema defines the contract a real connector must satisfy later.
- No payment capture (cash / card split, tips, settlement) on The Service — net sales are recorded, payment instruments are not.
- No printed-receipt or kitchen-display routing.
- No item modifiers, multi-seat ticket splitting, or course timing.
- No multi-location consolidation.
- No mobile-native app — responsive web only.
- No forecasting / prescriptive AI.
- No payroll, scheduling, or inventory management.

---

## 10. Tech stack (for reference)

TanStack Start (React 19, file-based routing, SSR) · Vite 7 · Tailwind v4 with semantic CSS tokens · shadcn/ui (Radix) · Recharts · TanStack Query · Supabase (Postgres + RLS, email + Google OAuth) · Zod.
