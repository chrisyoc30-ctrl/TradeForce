# Railway: fix API connectivity (lead submission)

**Status:** Blocking if `API_URL` is missing on the Next.js service.

**Root cause:** Server-side tRPC calls Flask using `getApiBaseUrl()` in `web/src/lib/api-url.ts`. Without `API_URL`, the server falls back to `http://127.0.0.1:5000`, which is wrong inside Railway’s Next container—requests never reach Flask and submission fails (often as HTTP 500 on the tRPC request).

**Fix time:** ~5–10 minutes (mostly copy URL + redeploy).

---

## 1. Get the Flask public URL

1. Railway → your project → **Flask (Python) service**
2. **Settings → Networking** (or the service overview) and copy the **public URL**  
   Example shape: `https://something.up.railway.app`  
3. **No trailing slash** (the app strips it, but use the clean URL).

---

## 2. Set variables on the Next.js service (required)

1. Railway → **Next.js service** → **Variables** (or Settings → Environment)
2. Add:

| Variable | Value |
|----------|--------|
| `API_URL` | `https://your-flask-service.up.railway.app` |
| `NEXT_PUBLIC_API_URL` | Same as `API_URL` (keeps any client usage aligned; set before build if the browser must call Flask). |

3. **Redeploy** the Next.js service so the server sees `API_URL` (runtime) and, if you rely on public env at build time, trigger a new build as needed.

---

## 3. Verify Flask (optional but useful)

- **Start command** (typical):  
  `gunicorn app:app --bind 0.0.0.0:$PORT`  
  Railway provides `$PORT`.
- **Optional env:** `PYTHONUNBUFFERED=1`, `FLASK_ENV=production`, `MONGO_URI` (optional for MVP; in-memory leads work in `app.py` without Mongo).

---

## 4. Smoke tests

**Flask health (either path is fine):**

```text
GET https://<flask-url>/api/health
GET https://<flask-url>/health
```

Expect **200** and JSON including `"status": "ok"` and `"service": "TradeScore Backend"`.

**End-to-end:** open your app’s `/lead-capture`, submit a test lead, confirm success and that the lead shows under available jobs (same Flask instance / in-memory or Mongo, depending on config).

---

## 5. If submission still fails

- Confirm both services are **Running**.
- Confirm `API_URL` on **Next** exactly matches the **Flask public** origin (https, no typo, no extra `/`).
- Confirm you **redeployed** after changing env.
- Check **Next** and **Flask** logs at submit time; share the message (no secrets).

---

## Checklist

- [ ] Flask public URL copied (no trailing slash)
- [ ] `API_URL` set on **Next.js** service
- [ ] `NEXT_PUBLIC_API_URL` set to the same (recommended)
- [ ] Next.js redeployed after variable changes
- [ ] `GET /api/health` (or `/health`) returns 200
- [ ] Lead submit works (201) and job appears in the UI

For more context (Vercel split, Mongo, Stripe), see `DEPLOYMENT_GUIDE.md`.
