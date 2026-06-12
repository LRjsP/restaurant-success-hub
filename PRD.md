# MISE.OPS — Product Requirements Document

*Extracted from working prototype · June 2026*

---

## 1. What it is

MISE.OPS is an **opinionated restaurant operations intelligence dashboard** that consolidates the four lenses that actually drive a restaurant — **service, profit, menu, and pipeline** — into a single tool with consistent filters, period-over-period comparison, and plain-language metric framing.

It is optimised for one recurring scenario:

> *Monday morning, 15 minutes, one coffee. Understand last week, decide this week, confirm the pipeline is healthy.*

---

## 2. Target user

- **Primary:** Owner-operators and General Managers of independent, single-unit or small-group restaurants ($1M–$10M revenue).
- **Secondary:** Executive Chefs and Beverage Directors who need menu-engineering and yield data.
- **Tertiary:** Catering / Events managers tracking a private-events pipeline.

Persona excludes large chains (they have BI teams) and pure QSR (different ops model).

---

## 3. Problem & Hypothesis

**Problem.** Independent operators don't lack data — they lack a *single, opinionated view* of it. Decisions get stitched together from POS reports, a bookkeeper's spreadsheet, a Google Calendar of events, and gut feel. The result is slow reactions, missed margin, and a catering pipeline managed in someone's inbox.

**Hypothesis.** *If* operators can see service, P&L, menu, and pipeline in one tool with shared filters and period comparison, *then* they will answer questions like "Are we losing money on Tuesdays?", "Which items deserve a price bump?", or "How healthy is Q3 catering?" in **under 30 seconds** — and act on them weekly instead of monthly.

**Falsifiable in beta by:** measuring time-to-answer on a fixed task list and weekly active sessions per operator.

---

## 4. Screens

| # | Screen | Route | Purpose | Core widgets |
|---|---|---|---|---|
| 1 | **Auth** | `/auth` | Sign-in / sign-up. First-run seeding of demo admin + staff accounts when the user table is empty. | Email+password form, first-time setup panel |
| 2 | **The Floor** — *Daily Pulse* | `/floor` | "How is service performing?" Yesterday/last-week at a glance. | KPIs: covers, net sales, PPA, avg check, discount %. Day×time demand heatmap. |
| 3 | **The Office** — *Weekly P&L* | `/office` | "Are we making money?" | Labor %, COGS %, prime cost, operating profit, weekly revenue vs cost chart. |
| 4 | **The Architect** — *Menu Engineering* | `/architect` | "Which menu items earn their place?" | Popularity × margin scatter with Stars / Plowhorses / Puzzles / Dogs quadrants. |
| 5 | **The Pipeline** — *Events CRM* | `/pipeline` | "What's coming?" Catering and private events. | Open pipeline value, win rate, upcoming events list, stage funnel. |
| 6 | **User Config** *(admin only)* | `/users` | Manage staff accounts and roles. | User list, role assignment, invite flow. |

All four dashboard screens share a single `DashboardShell`: header with live-service indicator, tab nav with atmospheric per-tab backgrounds, and a persistent **filter bar** (date range · revenue center · compare-to-prior toggle). Filters are **URL-driven** so any view is shareable.

---

## 5. User flow

```text
   /  ──► (auth?) ──no──► /auth ──sign in──┐
        └──yes──► /floor                   │
                                           ▼
                ┌──── DashboardShell (header · tabs · filter bar) ────┐
                │  /floor → /office → /architect → /pipeline           │
                │  Filters (range, center, compare) persist via URL    │
                └──────────────────────────────────────────────────────┘
                            │ admin only
                            ▼
                          /users
```

**Typical 15-minute Monday session**
1. Land on **Floor** → scan yesterday's covers + heatmap for soft dayparts.
2. Switch to **Office** → confirm labor % and COGS % within target.
3. Open **Architect** → flag one Plowhorse for a price test.
4. Finish on **Pipeline** → confirm next week's events, chase at-risk leads.
5. Forward a filtered URL to chef / partner.

---

## 6. Key metrics

**Product success (north stars)**
- Time-to-answer on the 4 canonical questions < 30 s.
- ≥ 1 session per operator per week (the "Monday review" habit).
- ≥ 3 of 4 tabs viewed per session (proves the integrated view is the value).

**In-product metrics surfaced to the user**
- *Floor:* Covers, Net Sales, PPA (per-person average), Avg Check, Discount %, Comp $, day×time demand.
- *Office:* Net Sales, Labor %, COGS %, Prime Cost %, Operating Profit, Food vs Beverage mix.
- *Architect:* Item popularity (mix %), contribution margin $, classification (Star/Plowhorse/Puzzle/Dog).
- *Pipeline:* Open pipeline $, Win rate %, Booked revenue, Upcoming events count, Stage funnel.

All metrics support **period-over-period delta** via the Compare toggle.

---

## 7. Roles & access

| Role | Access |
|---|---|
| **Owner / Admin** | All 4 dashboards + `/users` config. Can invite, change roles, remove. |
| **Staff** | All 4 dashboards. Read-only on user config. |

Roles are stored in a dedicated `user_roles` table (never on profiles) and checked via a `SECURITY DEFINER` `has_role()` function used in RLS policies.

---

## 8. What is mocked vs real

| Layer | Status | Notes |
|---|---|---|
| **Auth (email + password, Google OAuth)** | **Real** | Supabase Auth. First-run flow seeds `admin@miseops.dev` / `staff@miseops.dev` (password `MiseDemo!2026`) when the user table is empty. |
| **Roles, profiles, user management** | **Real** | `profiles` + `user_roles` tables with RLS; admin-only mutations. |
| **Route shell, filter bar, URL state, theming, navigation** | **Real** | TanStack Start + Router, Zod-validated search params, design tokens. |
| **Dashboard data — Floor / Office / Architect / Pipeline KPIs, charts, heatmap, events list** | **Mocked** | All numbers generated by `src/lib/demo-data.ts` — deterministic, seeded by date range + revenue center. No POS, accounting, or CRM is connected. |
| **Period comparison** | **Mocked** | Computed against the same generator with a shifted range. |
| **Revenue-center filter** | **Mocked** | Generator applies share + PPA modifiers per center (dining room / bar / patio / takeout / delivery / catering). |
| **Events pipeline records** | **Mocked** | Stored in `events_pipeline` table for RLS demo; not connected to a real CRM. |
| **Email invites for new users** | **Stubbed** | UI exists; transactional email not wired. |

---

## 9. Non-goals (current scope)

- No POS / accounting / CRM integrations (Square, Toast, QuickBooks, etc.) — the generator defines the contract a real integration must satisfy later.
- No multi-location consolidation.
- No mobile-native app — responsive web only.
- No forecasting / prescriptive AI — descriptive analytics first; recommendations are a v2 bet.
- No payroll, scheduling, or inventory management — adjacent products, not core.

---

## 10. Tech stack (for reference)

TanStack Start (React 19, file-based routing, SSR) · Vite 7 · Tailwind v4 with semantic CSS tokens · shadcn/ui (Radix) · Recharts · TanStack Query · Supabase (Postgres + RLS, email + Google OAuth) · Zod.
