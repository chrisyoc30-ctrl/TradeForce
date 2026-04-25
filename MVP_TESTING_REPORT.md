# TradeScore MVP — testing report

**Date:** 2026-04-25  
**Platform:** Railway (Next.js + Flask)  
**Status:** Mostly working — one deployment configuration item blocks end-to-end lead flow

---

## Executive summary

The MVP is largely complete for UI, navigation, and client-side AI quote scoring. The remaining issue for full flow testing is **server-side API configuration**: the Next.js service must know the Flask **public base URL** via environment variables (see below).

**Blocker:** Lead submission can return HTTP 500 when `API_URL` is not set on the Next.js Railway service, because server-side tRPC otherwise targets `http://127.0.0.1:5000`, which does not reach Flask in production.

**After fix:** Retest submit → browse → bid → pay.

---

## What’s working

| Area | Notes |
|------|--------|
| Frontend pages | Landing, pricing, FAQ, terms, privacy, available jobs, lead capture render and route correctly |
| Navigation | Links and routing work |
| AI quote range | Client-side estimator (e.g. £40–£55) updates with form input |
| Form validation / UI | Fields, layout, responsive behavior |
| Deployment | Next and Flask on Railway; Nixpacks build succeeds |
| Backend without Mongo | In-memory lead path in Flask when DB is unavailable (MVP) |

---

## What’s blocked

| Issue | Cause | Symptom |
|-------|--------|---------|
| Lead submission may return 500 | `API_URL` / `NEXT_PUBLIC_API_URL` not set on **Next.js** service | tRPC cannot reach Flask; console may show 500 on the API/tRPC request |

“Available jobs” empty is **expected** until leads submit successfully.

---

## Test results (summary)

| # | Test | Result |
|---|------|--------|
| 1 | Landing load | Pass |
| 2 | Navigation | Pass |
| 3 | Lead form render | Pass |
| 4 | AI scoring (client) | Pass |
| 5 | **Lead submission** | **Fail until env fix** |
| 6 | Browse leads page | Pass (empty state) |
| 7 | Pricing | Pass |
| 8 | FAQ | Pass |

---

## How to fix (Railway)

Use the repo guide (not agent-only paths):

| Document | Purpose |
|----------|---------|
| [`RAILWAY_CONFIGURATION.md`](./RAILWAY_CONFIGURATION.md) | Short checklist: Flask URL, `API_URL`, `NEXT_PUBLIC_API_URL`, redeploy, smoke tests |
| [`DEPLOYMENT_GUIDE.md`](./DEPLOYMENT_GUIDE.md) | Broader deployment (Vercel/Railway, Mongo, Stripe, etc.) |

**Summary:** Copy the Flask service **public HTTPS URL** (no trailing slash). On the **Next.js** service set `API_URL` and `NEXT_PUBLIC_API_URL` to that value. **Redeploy** Next.js. Verify `GET https://<flask-url>/api/health` returns 200, then retest `/lead-capture`.

**Estimated time:** ~5–10 minutes after you have the Flask URL.

---

## Suggested next steps after the env fix

1. End-to-end: submit lead → appears on available jobs → bid flow (as implemented).
2. Stripe and webhooks (per `DEPLOYMENT_GUIDE.md`).
3. Email notifications (if wired in the app).
4. Optional: MongoDB for durable leads in production.

---

## Readiness (indicative)

| Category | Note |
|----------|------|
| Frontend / UX | Strong |
| API integration | Depends on Railway env; code path is `web/src/lib/api-url.ts` + tRPC routers |
| Deployment | Both services; Next must have `API_URL` for server fetches |

---

**Last updated:** 2026-04-25  
**Next review:** After `API_URL` / `NEXT_PUBLIC_API_URL` are set and Next.js is redeployed.
