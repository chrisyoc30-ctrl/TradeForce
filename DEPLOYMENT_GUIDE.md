# TradeScore deployment guide — Vercel (Next.js) + Railway (Flask)

This repo is a **split deployment**:

| Service | Platform | Code | Public URL (example) |
|---------|----------|------|----------------------|
| **Web** | **Vercel** | `web/` — Next.js 15 | `https://tradescore.vercel.app` |
| **API** | **Railway** | Repo root — `app.py` (Flask + Gunicorn) | `https://tradescore-api.up.railway.app` |
| **Database** | **MongoDB Atlas** (recommended) | — | Private connection string |

The browser talks to **Flask** via `NEXT_PUBLIC_API_URL`. The Next.js server (tRPC, Stripe webhook) talks to Flask via `API_URL` (and the same base URL as the public API in most setups).

---

## Prerequisites

1. **GitHub** — Repo pushed (e.g. `TradeForce`).
2. **MongoDB Atlas** — Free cluster; database user + **Network Access** allow `0.0.0.0/0` (or Railway/Vercel egress IPs if you restrict).
3. **Stripe** — Account in **test** mode first; later switch to live keys.
4. **Vercel + Railway** accounts (GitHub login is easiest).

Optional: **OpenAI** API key if you want the chat widget in production.

---

## Environment variables

### Railway (Flask)

| Variable | Required | Description |
|----------|----------|-------------|
| `MONGO_URI` | **Yes** | MongoDB connection string (same DB the app expects; default DB name used in code is `tradeforce`). |
| `PORT` | No | Railway sets this automatically; local default `5000`. |
| `INTERNAL_WEBHOOK_SECRET` | **Yes** (for payments) | Long random string; **must match** the same value on Vercel. Used to authenticate `POST /api/internal/leads/:id/payment` from the Next.js Stripe webhook. |
| `ADMIN_SECRET` | No | If set, `GET /api/admin/metrics` requires header `X-Admin-Secret`. |

**CORS:** `app.py` allows browser calls from your Vercel origin via Flask-CORS on `/api/*`. If you lock CORS to specific origins later, add your Vercel URL.

### Railway (Next.js) — if the web app is deployed on Railway (not Vercel)

| Variable | Required | Description |
|----------|----------|-------------|
| `API_URL` | **Yes** | Public **https** base URL of the Flask service (**no trailing slash**). Server-side tRPC uses this; without it, the app falls back to `http://127.0.0.1:5000` and lead submission fails. The app also errors early when `RAILWAY_ENVIRONMENT` is set and `API_URL` is missing. |
| `NEXT_PUBLIC_API_URL` | **Recommended** | Use the same value as `API_URL` if the browser should call Flask directly. |

### Vercel (Next.js — project root = `web/`)

| Variable | Required | Description |
|----------|----------|-------------|
| `NEXT_PUBLIC_API_URL` | **Yes** | Public **https** base URL of Railway Flask **with no trailing slash**, e.g. `https://tradescore-api.up.railway.app`. |
| `API_URL` | **Recommended** | Same value as `NEXT_PUBLIC_API_URL` so **server** tRPC and the Stripe webhook can reach Flask. |
| `INTERNAL_WEBHOOK_SECRET` | **Yes** (for payments) | **Same string** as on Railway. |
| `STRIPE_SECRET_KEY` | For payments | `sk_test_...` or `sk_live_...` |
| `NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY` | For payments | `pk_test_...` or `pk_live_...` |
| `STRIPE_WEBHOOK_SECRET` | For webhooks | From Stripe Dashboard → webhook endpoint → signing secret (`whsec_...`). |
| `MONGODB_URI` | For chat | Mongo connection string (Next chat code may use DB name `tradescore` unless `MONGODB_DB_NAME` is set). |
| `MONGODB_DB_NAME` | No | Defaults to `tradescore`. |
| `OPENAI_API_KEY` | For chat | If omitted, chat features may degrade or error. |
| `OPENAI_CHAT_MODEL` | No | Defaults to `gpt-4o-mini`. |
| `OPENAI_BASE_URL` | No | Defaults to OpenAI’s API. |

Vercel automatically sets `VERCEL_URL` / `VERCEL_GIT_COMMIT_SHA` (used by `/api/health`).

---

## Example env files (placeholders only)

**Do not commit real secrets.** Use `.env` / `.env.local` locally (already gitignored in `web/`).

### `web/.env.local` (local dev — Vercel mirrors these in the dashboard)

```env
# Flask API (local or Railway)
NEXT_PUBLIC_API_URL=http://127.0.0.1:5000
API_URL=http://127.0.0.1:5000

# Shared secret: Flask internal payment route + Next webhook caller
INTERNAL_WEBHOOK_SECRET=change-me-to-a-long-random-string

# Stripe (test keys)
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_test_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_SECRET_KEY=sk_test_XXXXXXXXXXXXXXXXXXXXXXXX
STRIPE_WEBHOOK_SECRET=whsec_XXXXXXXXXXXXXXXXXXXXXXXX

# Chat (optional locally)
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
OPENAI_API_KEY=sk-xxxxxxxx
```

### Railway variables (Flask — set in Railway UI, not a file)

```env
MONGO_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/?retryWrites=true&w=majority
INTERNAL_WEBHOOK_SECRET=change-me-to-a-long-random-string
ADMIN_SECRET=optional-admin-metrics-secret
```

### Production Vercel (example values)

```env
NEXT_PUBLIC_API_URL=https://your-service.up.railway.app
API_URL=https://your-service.up.railway.app
INTERNAL_WEBHOOK_SECRET=same-as-railway
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=pk_live_XXX
STRIPE_SECRET_KEY=sk_live_XXX
STRIPE_WEBHOOK_SECRET=whsec_XXX
MONGODB_URI=mongodb+srv://...
OPENAI_API_KEY=sk-...
```

---

## Step-by-step: Railway (Flask)

1. In **Railway**: **New Project** → **Deploy from GitHub repo** → select this repository.
2. Railway will detect the repo; set the **root directory** to the **repository root** (where `app.py` and `Procfile` live).
3. **Procfile** should contain: `web: gunicorn app:app` (already in repo).
4. Under **Variables**, add at least `MONGO_URI` and `INTERNAL_WEBHOOK_SECRET` (and optional `ADMIN_SECRET`).
5. **Generate Domain** (Settings → Networking) so you get a stable `https://....up.railway.app` URL.
6. **Deploy** and wait for a successful build. Open **Deployments → Logs** and confirm Gunicorn is listening (Railway sets `PORT`).

**Smoke test (API):**

```bash
curl -sS https://YOUR-RAILWAY-URL/health
curl -sS https://YOUR-RAILWAY-URL/api/health
curl -sS https://YOUR-RAILWAY-URL/api/leads/unmatched
```

Expect JSON, not HTML errors. (`/health` and `/api/health` are equivalent on Flask.)

---

## Step-by-step: Vercel (Next.js)

1. In **Vercel**: **Add New…** → **Project** → import the same GitHub repo.
2. **Root Directory**: set to **`web`** (critical — not the monorepo root).
3. **Framework Preset**: Next.js (auto).
4. **Environment Variables**: add all Vercel variables from the table above.  
   - `NEXT_PUBLIC_API_URL` and `API_URL` must be your **Railway HTTPS URL** (no trailing slash).
5. **Deploy**.

**Smoke test (web):**

```bash
curl -sS https://YOUR-VERCEL-URL/api/health
```

Open the site in a browser: homepage, `/lead-capture`, `/faq`.

---

## Stripe webhook (on Vercel)

1. **Stripe Dashboard** → **Developers** → **Webhooks** → **Add endpoint**.
2. **URL:** `https://YOUR-VERCEL-URL/api/stripe/webhook`
3. Select event: **`payment_intent.succeeded`** (add others only if your code handles them).
4. Copy the **Signing secret** → Vercel env `STRIPE_WEBHOOK_SECRET` → redeploy.

When a payment succeeds, Next verifies the signature, then calls Flask:

`POST /api/internal/leads/{leadId}/payment` with header `X-Internal-Secret: INTERNAL_WEBHOOK_SECRET`.

If `INTERNAL_WEBHOOK_SECRET` is missing or mismatched, the lead will not update in Mongo.

---

## How to verify deployment succeeded

| Check | What “good” looks like |
|-------|-------------------------|
| Railway logs | No crash loop; Gunicorn worker booted. |
| `GET /health` or `GET /api/health` on Railway | `200` JSON with service status. |
| Vercel build | Success; no missing env errors at runtime. |
| `GET /api/health` on Vercel | `200` JSON (`tradescore-web`, Stripe mode hint). |
| **Lead flow** | Submit job on `/lead-capture` → success dialog with grade/score. |
| **Lead board** | `/lead-scoring` shows leads (Mongo must be reachable from Railway). |
| **Stripe (test)** | Lead acceptance payment uses test card `4242 4242 4242 4242`; webhook logs in Stripe; lead gets payment fields in DB after webhook. |

---

## Troubleshooting

### Browser: “Failed to fetch” / leads never load

- **`NEXT_PUBLIC_API_URL`** wrong or still `http://127.0.0.1:5000` in production.
- Railway URL must be **https** and reachable from the **browser** (CORS). Check DevTools → Network for blocked requests.

### tRPC errors / 500 on mutations

- **Flask down** or Mongo unreachable → Railway logs will show errors.
- **`API_URL` unset on Vercel** → server-side tRPC may default to localhost; set `API_URL` to Railway URL.

### Stripe webhook returns 400 / 502

- **400**: Wrong `STRIPE_WEBHOOK_SECRET` or body altered (use raw body — Next route already does).
- **502**: Next could not update Flask — check `INTERNAL_WEBHOOK_SECRET` matches on **both** platforms, and Railway has the internal route (`/api/internal/leads/.../payment`) enabled (it is in `app.py`).

### Mongo “not connected” on lead create

- **`MONGO_URI`** wrong on Railway, IP not allowlisted, or user/password typo.
- Atlas: user must have read/write on the DB; network access must include Railway egress.

### Chat does not work in production

- Set **`MONGODB_URI`** (and optionally **`OPENAI_API_KEY`**) on **Vercel**. Chat runs in Next.js, not Flask.

### Admin analytics 401

- Railway has **`ADMIN_SECRET`** set; enter the same value on `/admin/analytics` in the UI, or remove `ADMIN_SECRET` only for trusted dev environments.

---

## Related docs

- `web/docs/PRODUCTION_DEPLOYMENT.md` — platform scope and feature notes.
- `web/docs/CHATBOT.md` — chat / Mongo details.
- `web/docs/LAUNCH_TASKS_INDEX.md` — CI and testing entry points.

---

## Quick reference — deploy order

1. Create **MongoDB Atlas** cluster + `MONGO_URI`.
2. Deploy **Railway** (Flask) + env vars + public URL.
3. Deploy **Vercel** (`web/`) with `NEXT_PUBLIC_API_URL` / `API_URL` pointing at Railway.
4. Configure **Stripe webhook** on Vercel URL.
5. Run smoke tests (health, lead submit, optional payment).

When this passes, TradeScore is **live** for the features described in `PRODUCTION_DEPLOYMENT.md`.
