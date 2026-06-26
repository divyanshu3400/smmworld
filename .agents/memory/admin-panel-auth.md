---
name: Admin panel auth
description: How to grant admin access; two methods supported
---

# Admin Access

**Why:** API key in browser was the original security flaw; all privileged ops moved server-side with a dual admin check.

**How to apply:** When user asks "how do I access admin panel" or admin features don't show, point to one of these two methods:

## Method 1 — ADMIN_EMAILS env var (easiest)
Add secret `ADMIN_EMAILS` = comma-separated email list, e.g. `admin@example.com,other@example.com`
Backend checks this in `src/lib/adminAuth.ts` → `checkIsAdmin()`.

## Method 2 — Supabase Dashboard
Supabase Dashboard → Authentication → Users → click user → Edit → App Metadata → set:
```json
{"role": "admin"}
```

The `requireAdmin` middleware checks `user.app_metadata?.role === 'admin'` from Supabase auth admin API.

## Frontend
`useAdmin()` hook calls `GET /api/admin/check` which returns `{ isAdmin: boolean }` (never 401 — always 200).
Sidebar shows amber "Admin" section only when `isAdmin === true`.
Admin routes (/admin, /admin/orders, /admin/users) are under ProtectedRoute — page-level access guard via the hook.
