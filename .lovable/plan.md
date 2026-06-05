## Goal

Give you a one-click demo login with credentials `demo@mise.ops` / `DemoPass!2026`, and make signup errors readable so the HIBP rejection doesn't look like a generic failure.

## Changes

**1. New file: `src/lib/demo-user.functions.ts`**
- Exports `DEMO_EMAIL = "demo@mise.ops"` and `DEMO_PASSWORD = "DemoPass!2026"`.
- Exports `ensureDemoUser` server fn that uses `supabaseAdmin` (imported inside the handler) to:
  - List users; if `demo@mise.ops` exists, return early.
  - Otherwise call `supabaseAdmin.auth.admin.createUser({ email, password, email_confirm: true })`.
- Admin-created users bypass the HIBP weak-password check, so the strong demo password works without disabling HIBP for everyone.

**2. Edit `src/routes/auth.tsx`**
- Import `useServerFn`, `ensureDemoUser`, `DEMO_EMAIL`, `DEMO_PASSWORD`.
- Add a `useDemo()` handler that calls `ensureDemoUser()` then `signInWithPassword(...)` with the demo credentials and navigates to `/floor`.
- Add a dashed "Use demo account (demo@mise.ops / DemoPass!2026)" button below the form so the credentials are visible on screen — no more forgetting them.
- Add `friendlyError()` that rewrites `weak_password` / "known to be weak" into a readable message pointing at the demo button.

## Notes

- No DB migration, no schema change, no new dependencies.
- HIBP stays enabled for regular signups (good security default); only the seeded demo user skips it via the admin API.
- Credentials are intentionally visible in the UI since this is a demo button.

Switch to build mode and I'll apply it.
