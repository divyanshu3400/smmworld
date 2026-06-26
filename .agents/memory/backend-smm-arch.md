---
name: Backend SMM architecture
description: How WorldOfSMM API calls are routed through the Express backend securely
---

# Backend SMM Architecture

**Why:** WorldOfSMM API key was hardcoded in the frontend (`smm-api.service.ts`). Now fully server-side.

**How to apply:** Any new WorldOfSMM feature must be added to the backend `smmService.ts` and exposed via an Express route in `routes/smm.ts`. Never call WorldOfSMM directly from the frontend.

## Key files
- `artifacts/api-server/src/services/smmService.ts` — all WorldOfSMM API calls, retry logic, in-memory services cache
- `artifacts/api-server/src/routes/smm.ts` — public `GET /api/smm/services` + auth-protected order/cancel/status routes
- `artifacts/api-server/src/routes/admin.ts` — admin-only routes: overview, all orders, all users, wallet adjust
- `artifacts/api-server/src/lib/auth.ts` — `requireAuth` middleware (Supabase JWT)
- `artifacts/api-server/src/lib/adminAuth.ts` — `requireAdmin` middleware (auth + admin check)

## Order flow (server-side, atomic)
1. Verify JWT → get userId
2. Get wallet, check balance >= priceUsd
3. Deduct balance with optimistic concurrency check (.eq('balance', currentBalance))
4. Insert order record (status: pending)
5. Insert debit wallet_transaction
6. Call WorldOfSMM submitOrder
7. Update order status → processing
8. On failure: refund balance + insert refund transaction + update order → cancelled

## Frontend
`smm-api.service.ts` calls `/api/smm/...` with Supabase JWT in Authorization header.
`orders.service.ts` delegates createOrder/cancelOrder/syncStatus to backend (no direct Supabase wallet writes from frontend for orders).
