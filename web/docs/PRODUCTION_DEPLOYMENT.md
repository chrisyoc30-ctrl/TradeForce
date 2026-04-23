# Production deployment — TradeScore (TradeForce repo)

This document describes how to deploy **what exists in this repository** today. It does **not** claim features that are not implemented (see [Platform scope](#platform-scope)).

## Architecture

| Layer | Location | Role |
|--------|----------|------|
| Web app | `web/` (Next.js 15, App Router) | Marketing pages, lead capture, lead scoring board, tRPC (`chat`, `leads`, `payments`) |
| API | `app.py` (Flask) at repo root | REST under `/api/*` — leads CRUD, scoring response fields consumed by Next |
| Data | MongoDB | Leads and related documents (see Flask + `web/src/server/db/mongo.ts` for chat) |
| Payments | Stripe | `payments.createLeadAcceptanceIntent` + webhook route in Next |

**tRPC routers** (only these are exposed): `chat`, `leads`, `payments` — see `web/src/server/api/root.ts`.

There is **no** monolithic `server/routers.ts`, **no** Drizzle schema in-repo, and **no** `client/src/pages/` tree as in some external checklists.

## Platform scope

### Implemented and deployable

- Lead submission (`/lead-capture`) → `trpc.leads.create` → Flask `POST /api/leads` → AI grade/score in success dialog
- Browse unmatched leads (`/lead-scoring`) → `trpc.leads.getUnmatched`
- Stripe PaymentIntent for lead acceptance (`trpc.payments.createLeadAcceptanceIntent`) when keys are set
- AI chat widget (when `OPENAI_API_KEY` and Mongo are configured) — see `web/docs/CHATBOT.md`
- Static/marketing routes as present under `web/src/app/`

### Not implemented as described in full-platform checklists

End-to-end **auth**, **tradesman approval workflows**, **bidding** (`bids.*` tRPC), **admin analytics** (`admin.getMetrics`), **Twilio SMS**, **Socket.io realtime to production**, **referral engine**, and **Drizzle-backed** multi-table schemas would require **new backend and UI work**. Shell pages (e.g. homeowner dashboard, submit quote) are placeholders until wired to real data and procedures.

## Environment variables

### Next.js (`web/` — Vercel or similar)

| Variable | Required | Purpose |
|----------|----------|---------|
| `NEXT_PUBLIC_API_URL` | **Yes** (production) | Public URL of Flask API (e.g. `https://api.yourdomain.com`) — browser calls this |
| `API_URL` | Recommended on server | Same base URL for server-side tRPC when it proxies to Flask |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | Stripe publishable key |
| `STRIPE_SECRET_KEY` | For payments | Stripe secret key |
| `STRIPE_WEBHOOK_SECRET` | For webhook verification | Signing secret from Stripe dashboard |
| `OPENAI_API_KEY` | For chat | Chat completions |
| `MONGODB_URI` | For chat persistence | Mongo connection string |

Optional: analytics or other keys referenced in `web/src/lib/analytics.ts` if you enable them.

### Flask (`app.py`)

Configure whatever the Flask app expects for MongoDB, CORS, and security (see `app.py` and any `.env` loading there). **CORS** must allow your Next.js origin to call `/api/*`.

Optional: set **`ADMIN_SECRET`** so `GET /api/admin/metrics` requires header `X-Admin-Secret`. The Next admin page (`/admin/analytics`) sends the secret you type in the form. If unset, metrics are open (suitable only for local dev).

## Deployment steps

1. **MongoDB** — Create a cluster (e.g. MongoDB Atlas). Allow network access from Flask and Next (if Next connects directly for chat).

2. **Flask API** — Deploy `app.py` + dependencies (e.g. `requirements.txt` if present) to a host with a public HTTPS URL. Set production env vars. Confirm `GET /api/health` or equivalent and `POST /api/leads` from a tool like curl.

3. **Next.js** — In `web/`, set env vars on the host. Build: `npm ci && npm run build`. Start: `npm start` (or use the platform’s Next preset).

4. **Stripe** — In Stripe Dashboard, add webhook endpoint pointing to your Next app:  
   `https://<your-domain>/api/stripe/webhook`  
   Subscribe to events your handler processes (e.g. `payment_intent.succeeded`). Paste the webhook signing secret into `STRIPE_WEBHOOK_SECRET`.

5. **Smoke test**
   - Homepage loads
   - Submit a lead; success dialog shows grade/score
   - Lead scoring page lists data when Flask returns leads
   - Payment flow only after Stripe keys and webhook are correct

## CI

GitHub Actions (if enabled) may run lint, unit tests, and build — see `web/docs/TEST_AUTOMATION.md`.

## “Publish” in external UIs

If you use another product’s **Publish** button, map it to: deploy **`web/`** and **`app.py`** with the env vars above and correct `NEXT_PUBLIC_API_URL`. There is no in-repo Manus-specific publish step.
