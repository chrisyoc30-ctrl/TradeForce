# TradeScore — Monitoring & alerting setup guide

This guide covers **uptime**, **errors**, **performance**, **database**, **payments**, **product analytics**, and **support SLAs** for the TradeScore stack (typically **Next.js** in `web/`, **tRPC/API routes**, **Stripe**, **MongoDB**, and optional **Flask** in `app.py`).

**Targets (stakeholder defaults — tune to reality):**

| Metric | Target |
|--------|--------|
| Website uptime | **99.9%** (~43 minutes downtime/month) |
| Page load (LCP / field p75) | **&lt; 2 s** on key URLs |
| Error rate (HTTP 5xx + unhandled app errors) | **&lt; 1%** of requests |
| Payment success (lead acceptance checkout) | **&gt; 90%** completed after intent |
| Lead acceptance rate (business) | **&gt; 80%** of offered accepts (define numerator/denominator in your BI) |
| Support first response | **&lt; 24 hours** |

---

## 1. Tool recommendations & links

| Area | Recommended tool | Free tier | Link |
|------|-------------------|-----------|------|
| Uptime | **UptimeRobot** (or Better Stack Uptime, Pingdom, StatusCake) | Yes (limits) | [https://uptimerobot.com](https://uptimerobot.com) |
| Errors / APM | **Sentry** (Next.js + Node + optional Python SDK) | Yes (limited events) | [https://sentry.io](https://sentry.io) |
| Synthetic / lab performance | **Google PageSpeed Insights** | Free | [https://pagespeed.web.dev](https://pagespeed.web.dev) |
| Real user performance | **Vercel Analytics**, **Cloudflare Web Analytics**, or Sentry Performance | Varies | [https://vercel.com/analytics](https://vercel.com/analytics) |
| Database | **MongoDB Atlas** built-in monitoring & alerts | Included in cluster | [https://cloud.mongodb.com](https://cloud.mongodb.com) |
| Payments | **Stripe Dashboard** + **Stripe Sigma** / exports | Dashboard free | [https://dashboard.stripe.com](https://dashboard.stripe.com) |
| Product analytics | **Plausible** (privacy-friendly) or **Google Analytics 4** | Plausible trial / GA free | [https://plausible.io](https://plausible.io) · [https://analytics.google.com](https://analytics.google.com) |

**Screenshot descriptions (for internal runbooks):**

- **UptimeRobot — Add monitor:** Capture the “Create monitor” dialog showing URL, monitor type HTTP(s), interval, and alert contacts.  
- **Sentry — Project settings DSN:** Capture **Settings → Client Keys (DSN)** with secrets redacted.  
- **Atlas — Metrics tab:** Capture cluster **Metrics** with connections, opcounters, and replication lag visible.  
- **Stripe — Developers → Webhooks:** Capture endpoint URL, events subscribed, and recent delivery attempts.  
- **GA4 — DebugView:** Capture **Configure → DebugView** with events firing from a test device.

---

## 2. Architecture: what to monitor

```
[Users] → CDN / Edge (optional) → Next.js (web)
              ↓
       tRPC /api/trpc, /api/stripe/webhook
              ↓
       MongoDB Atlas  ←→  Flask (optional) internal APIs
              ↓
            Stripe
```

Create **separate monitors** for:

1. **Public site** — `https://tradescore.uk/` (or your production domain).  
2. **API health** — e.g. lightweight `GET /api/health` (add if missing) or a tRPC `health.ping` that does not require auth.  
3. **Stripe webhook** — availability of the route (not full payment flow); use authenticated synthetic checks sparingly.  
4. **Backend (Flask)** — if exposed, monitor `/health` or equivalent; if internal only, monitor from VPC or log-based alerts.

---

## 3. Uptime monitoring (99.9% target)

### 3.1 UptimeRobot (example)

1. Sign up at [https://uptimerobot.com](https://uptimerobot.com).  
2. **Add monitor → Website**  
   - **URL:** `https://tradescore.uk/`  
   - **Type:** HTTP(s)  
   - **Interval:** 5 minutes (paid tiers allow 1 minute — use shorter interval if 99.9% is contractual).  
   - **Alert contacts:** email + SMS/Slack (via webhook — [https://uptimerobot.com/integrations](https://uptimerobot.com/integrations)).  
3. Add **second monitor** for API health (see §7.1).  
4. Optional: **keyword monitor** — expect HTTP 200 and body contains `TradeScore` (fragile if marketing copy changes).

**Status page:** UptimeRobot public status page for user-facing incidents (optional).

**SLO idea:** 99.9% monthly = allow ~43m downtime. Track rolling 30-day uptime from UptimeRobot reports and export to your executive dashboard.

### 3.2 Alert — website down

- **Condition:** Any check fails **2 consecutive times** (reduce false positives).  
- **Action:** Page on-call; open incident (see `INCIDENT_RESPONSE.md`).

---

## 4. Error tracking (Sentry)

### 4.1 Next.js (App Router) — outline

1. Create a Sentry project: **Settings → Projects → Create Project** → platform **Next.js**.  
2. Install SDK (follow Sentry wizard — versions change; use docs):  
   - [https://docs.sentry.io/platforms/javascript/guides/nextjs/](https://docs.sentry.io/platforms/javascript/guides/nextjs/)  
3. Configure **environment** tags: `production`, `staging`, `development`.  
4. Set **sample rates:** start with `tracesSampleRate: 0.1` in production; raise after tuning cost.  
5. Add **release** tracking (Git SHA from CI) for regressions.

**Example — `sentry.client.config.ts` pattern (illustrative only):**

```typescript
import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  environment: process.env.NEXT_PUBLIC_VERCEL_ENV ?? process.env.NODE_ENV,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.05,
  replaysOnErrorSampleRate: 1.0,
});
```

Use the **official Sentry wizard** (`npx @sentry/wizard@latest -i nextjs`) so instrumentation matches your Next.js version.

### 4.2 Flask (`app.py`) — optional

- [https://docs.sentry.io/platforms/python/guides/flask/](https://docs.sentry.io/platforms/python/guides/flask/)  
- Use same Sentry org; separate **project** or **environment** for Python.

### 4.3 Alert — high error rate

- **Sentry Alert rule:** Issue frequency **&gt; N events in 5 minutes** or **new issue** with level error.  
- **Stakeholder threshold (doc):** investigate if **&gt; 5%** of requests error (approximate via Sentry / infra metrics — calibrate with your traffic).

---

## 5. Performance monitoring

### 5.1 Lab tests — PageSpeed Insights

- Run: [https://pagespeed.web.dev](https://pagespeed.web.dev) for:  
  - `/`  
  - `/lead-capture`  
  - `/pricing`  
  - `/submit-quote/[sample]` (use a test lead ID in staging)  
- Track **LCP**, **INP**, **CLS**. Your **&lt; 2 s** target maps best to **LCP** on key URLs (lab mobile is stricter than desktop).

**Cadence:** weekly manual run + save PDF/screenshot to drive (see **Weekly report**).

### 5.2 Field (real user) data

- **Vercel Analytics** (if hosted on Vercel) or **Sentry Performance** for transaction traces.  
- **Threshold alert:** p75 LCP **&gt; 5 s** on `/` for 15 minutes → warning (tune per product).

### 5.3 Synthetic slow page

- Use **Checkly**, **Better Stack**, or UptimeRobot **transaction** monitors to alert if HTML TTFB or full load **&gt; 5 s** from multiple regions.

---

## 6. Database monitoring (MongoDB Atlas)

1. Log in: [https://cloud.mongodb.com](https://cloud.mongodb.com).  
2. Select cluster → **Metrics**: CPU, memory, **connections**, **opcounters**, **replication lag** (if replica set).  
3. **Alerts** (left nav **Alerts**):  
   - **Connection count** high (approaching limits).  
   - **CPU / disk** sustained high.  
   - **Replication lag** (if applicable).  
4. **Database access logs** — enable if compliance requires (Atlas tier dependent).

### 6.1 Alert — database connection lost

- Atlas alert: **Host is down** or **Replica set member unhealthy**.  
- Application side: log **Mongo connection errors** to Sentry with a distinct tag `db.connection`.

**TradeScore Next.js health endpoint (implemented in `web/src/app/api/health/route.ts`):**

```http
GET /api/health
200 {
  "ok": true,
  "service": "tradescore-web",
  "timestamp": "2026-04-23T12:00:00.000Z",
  "commit": "abc123…" | null,
  "checks": {
    "stripe": { "configured": true, "mode": "live" | "test" | "missing" },
    "mongo": "not_configured"
  }
}
```

The web tier does not connect to MongoDB today (`mongo` stays `not_configured` until you add a driver and ping). For **full stack** health, add a Flask `GET /health` with `db.runCommand({ ping: 1 })` (short timeout, e.g. 2s) and monitor that URL separately.

---

## 7. Payment monitoring (Stripe)

1. Dashboard: [https://dashboard.stripe.com](https://dashboard.stripe.com).  
2. **Developers → Webhooks:** monitor **failed deliveries**; alert if failure rate spikes.  
3. **Payments → All payments:** filter **failed**; categorize `card_declined`, `insufficient_funds`, etc.  
4. **Sigma** or **Data pipeline** (paid): SQL on payments for dashboards.

### 7.1 Metrics

- **Success rate:** `successful_charges / (successful + failed)` for **lead acceptance** PaymentIntents (define event in your code).  
- **Target:** **&gt; 90%** success — exclude user abandons (optional: funnel from “clicked Pay” to `succeeded`).

### 7.2 Alert — payment failures

- **Stripe webhook monitoring:** if **&gt; 10%** of attempts fail in a 1-hour window (or N failures in 10 minutes), page payments owner.  
- **Sentry:** capture unhandled exceptions in `/api/stripe/webhook`.

---

## 8. User activity & business metrics

### 8.1 Analytics (Plausible or GA4)

- **Plausible:** [https://plausible.io/docs/plausible-script](https://plausible.io/docs/plausible-script) — lightweight, no cookies by default (still align with Privacy Policy).  
- **GA4:** [https://developers.google.com/analytics/devguides/collection/ga4](https://developers.google.com/analytics/devguides/collection/ga4) — use **events** for `lead_submitted`, `lead_accepted`, `checkout_started`, `checkout_succeeded`.

### 8.2 Lead acceptance rate

- **Definition (example):**  
  - Numerator: leads **accepted** (paid) in period.  
  - Denominator: leads **eligible** or **shown** to trades (pick one and document).  
- **Target:** **&gt; 80%** — may be aspirational; track trend, not single-day spikes.

### 8.3 Support response time

- Track in **Help Scout**, **Zendesk**, or shared inbox; metric = **first response &lt; 24h** (see `SUPPORT_PROCEDURES.md`).

---

## 9. Infrastructure: CPU / memory

Depends on host:

| Host | Where to look |
|------|----------------|
| **Vercel** | Project → Observability / usage; function duration errors. |
| **Docker / VM** | `docker stats`, Prometheus + Grafana, or cloud provider metrics (AWS CloudWatch, etc.). |

**Alert:** sustained **CPU &gt; 80%** or **memory &gt; 85%** for **15 minutes** → scale or investigate leak.

---

## 10. Alert matrix (summary)

| Alert | Condition | Channel | Severity |
|-------|-----------|---------|----------|
| Website down | 2 failed checks | Pager / Slack | Critical |
| High error rate | Sentry spike or **&gt; 5%** 5xx (via LB logs) | Slack | High |
| Payment failures | **&gt; 10%** failed or N failures / 10 min | Slack + email | High |
| DB unhealthy | Atlas alert or health check fail | Pager | Critical |
| Slow page | p75 LCP **&gt; 5 s** sustained | Slack | Medium |
| High CPU/memory | **&gt; 80%** CPU 15 min | Slack | Medium |

Tune numeric thresholds after **2 weeks** of baseline data.

---

## 11. Dashboards

### 11.1 Executive dashboard (high-level)

- Uptime % (30-day).  
- p75 LCP (field).  
- Error count / week (Sentry).  
- Payment success % (Stripe).  
- New signups / accepted leads (analytics + DB).  
- Open critical incidents.

**Tools:** Notion, Google Looker Studio (Stripe export + CSV), or Metabase on a read replica.

### 11.2 Technical dashboard (system health)

- Request rate, 5xx rate, p95 latency (edge + origin).  
- Sentry: issues by release.  
- Atlas: connections, CPU, slow queries (Profiler).  
- Webhook delivery success (Stripe).

**Tools:** Vercel Observability, Cloudflare, Grafana + Prometheus, or Datadog (paid).

### 11.3 Business dashboard (leads, payments, users)

- Funnel: visit → signup → lead created → checkout started → payment succeeded.  
- Lead acceptance rate.  
- MRR / lead fees (Stripe).  
- Cohort retention (weekly).

### 11.4 Support dashboard

- Open tickets, age, SLA breach risk.  
- First response time distribution.  
- Top categories (billing, bugs, disputes).

---

## 12. Reporting schedule

| Report | Owner | Content | Delivery |
|--------|-------|---------|----------|
| **Daily** | On-call / ops | Uptime summary, error count, failed payments, open incidents | Automated email (UptimeRobot + Stripe digest + Sentry daily) |
| **Weekly** | Engineering lead | PageSpeed runs, trend charts, top errors, deploy summary | Manual Slack post + link to doc |
| **Monthly** | Product + eng | SLO review, incident count, roadmap for reliability | Meeting + written memo |
| **Incident** | Incident lead | Timeline, impact, root cause, action items | Per `INCIDENT_RESPONSE.md` |

**Automated daily email (example flow):** Zapier / Make / cron job querying UptimeRobot API + Sentry API + Stripe balance/transactions summary — keep secrets in env.

---

## 13. Troubleshooting

| Symptom | Checks |
|---------|--------|
| Site up but “blank” errors | Sentry for hydration / chunk load errors; CDN cache; deployment rollback. |
| 503 on API | Vercel function logs; DB connection string; cold start timeouts. |
| Stripe webhooks failing | Stripe dashboard delivery logs; signature secret mismatch; route timeout. |
| High Mongo latency | Atlas metrics; missing indexes; long transactions; connection pool size. |
| False uptime “up” | Static edge OK but API broken — add **/api/health** monitor. |
| PageSpeed good, users slow | Field data geography; third-party scripts; images; check RUM. |

---

## 14. Security & compliance notes

- Do **not** log full card numbers or secrets.  
- Restrict Sentry **PII** scrubbing; use `beforeSend` to strip emails if required.  
- Atlas **IP allowlist** for prod; rotate DB passwords via secrets manager.  
- Document subprocessors (Sentry, Stripe, MongoDB) in Privacy Policy.

---

## 15. Next steps (implementation order)

1. **`GET /api/health`** is available on the Next.js app (Stripe mode only; extend when Mongo is in-process).  
2. Configure **UptimeRobot** for `/` and `/api/health`.  
3. Add **Sentry** to Next.js (and Flask if used).  
4. Turn on **Atlas alerts** + Stripe **webhook** monitoring.  
5. Choose **Plausible or GA4**; define core events.  
6. Build **executive** view (even a simple weekly Notion table).  
7. Run through **`MONITORING_CHECKLIST.md`** before launch.

---

*Living document — adjust URLs, thresholds, and tools to your production environment.*
