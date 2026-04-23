# TradeScore — Monitoring checklist

Use this for **go-live**, **quarterly audits**, and **after major releases**. Copy into a ticket and assign owners.

---

## A. Accounts & access

- [ ] Uptime monitoring account created (e.g. UptimeRobot) — [https://uptimerobot.com](https://uptimerobot.com)
- [ ] Sentry org + project(s) — [https://sentry.io](https://sentry.io)
- [ ] MongoDB Atlas project access for on-call — [https://cloud.mongodb.com](https://cloud.mongodb.com)
- [ ] Stripe Dashboard access (restricted roles) — [https://dashboard.stripe.com](https://dashboard.stripe.com)
- [ ] Analytics (Plausible or GA4) property created
- [ ] Shared **Slack / email** destination for alerts documented in runbook
- [ ] On-call rotation defined (who gets paged when)

---

## B. Uptime & health endpoints

- [ ] Production URL confirmed (`https://tradescore.uk` or actual domain)
- [ ] Monitor: **homepage** (HTTPS, 200)
- [ ] **`GET /api/health`** implemented and returns JSON `ok` / dependency status
- [ ] Monitor: **`/api/health`** from **2+ regions** if tool supports it
- [ ] Optional: keyword or content check on homepage (document fragility)
- [ ] Public **status page** enabled (optional)
- [ ] Alert: **2 consecutive failures** → on-call
- [ ] **99.9%** SLO documented; uptime report exported monthly

---

## C. Errors (Sentry)

- [ ] Next.js SDK installed per [Sentry Next.js docs](https://docs.sentry.io/platforms/javascript/guides/nextjs/)
- [ ] DSN in env vars only (`NEXT_PUBLIC_SENTRY_DSN` / server DSN)
- [ ] `environment` tag set (`production`, `staging`)
- [ ] **Release** = Git SHA from CI
- [ ] Sample rates set (`tracesSampleRate`, replay if used)
- [ ] PII scrubbing / `beforeSend` reviewed against Privacy Policy
- [ ] Alert: **new issue** or **spike** in errors → Slack
- [ ] Flask/Python Sentry (if `app.py` in production) configured
- [ ] Source maps uploaded for readable stack traces (production)

---

## D. Performance

- [ ] PageSpeed Insights baseline saved for `/`, `/lead-capture`, `/pricing` — [https://pagespeed.web.dev](https://pagespeed.web.dev)
- [ ] **LCP / INP / CLS** targets noted (&lt; 2s LCP goal on key pages)
- [ ] Real user monitoring enabled (Vercel Analytics, Sentry Performance, or RUM)
- [ ] Alert or manual review: **LCP p75 &gt; 5 s** (warning)
- [ ] Images / fonts / third-party scripts audited for regressions

---

## E. Database (MongoDB Atlas)

- [ ] **Metrics** dashboard bookmarked (CPU, connections, opcounters)
- [ ] **Alerts** enabled: high CPU, disk, connection spike, replica issues
- [ ] **Slow query** / Profiler reviewed after launch week
- [ ] Backups / PITR verified for cluster tier
- [ ] IP access list / VPC peering matches production hosts only
- [ ] Application logs Mongo **connection errors** with tag for search

---

## F. Payments (Stripe)

- [ ] Webhook endpoint **live** URL correct; signing secret in env
- [ ] Webhook **events** minimal necessary set (e.g. `payment_intent.succeeded`, `payment_intent.payment_failed`)
- [ ] Dashboard: failed payments reviewed weekly
- [ ] Alert: webhook failure rate or **&gt; N** failures in 10 minutes
- [ ] **Success rate** metric defined (funnel) and tracked toward **&gt; 90%**
- [ ] Test mode vs live mode keys never mixed in prod

---

## G. Analytics & product metrics

- [ ] Plausible or GA4 snippet on production only (or env-gated)
- [ ] Events: `lead_submitted`, `checkout_started`, `checkout_succeeded` (names aligned with code)
- [ ] **Lead acceptance rate** definition written down (numerator/denominator)
- [ ] Dashboard or spreadsheet: weekly **acceptance %** toward **&gt; 80%** goal
- [ ] Cookie banner / consent aligned with `privacy-policy.md` if using GA

---

## H. Support & business SLAs

- [ ] Support inbox monitored (`hello@tradescore.uk`)
- [ ] **First response &lt; 24h** tracked in helpdesk or manual log
- [ ] Support dashboard: open tickets, SLA risk, categories

---

## I. Infrastructure (host-specific)

**If Vercel:**

- [ ] Deployment protection / preview vs production clear
- [ ] Function logs and duration errors reviewed after spikes
- [ ] Usage / bandwidth alerts if available

**If VMs / Docker:**

- [ ] CPU / memory alerts (**&gt; 80%** sustained)
- [ ] Disk usage alert
- [ ] Log aggregation (optional: Loki, CloudWatch)

---

## J. Dashboards & reporting

- [ ] **Executive** dashboard: uptime, errors, payments, signups
- [ ] **Technical** dashboard: latency, 5xx, DB, webhooks
- [ ] **Business** dashboard: funnel, acceptance rate, revenue
- [ ] **Support** dashboard: tickets, response times
- [ ] **Daily** automated summary agreed (even if minimal)
- [ ] **Weekly** review calendar invite
- [ ] **Monthly** SLO review scheduled

---

## K. Documentation & drills

- [ ] `MONITORING_SETUP.md` URLs and thresholds match production
- [ ] `INCIDENT_RESPONSE.md` contacts and severities current
- [ ] **Fire drill:** simulate down site (maintenance window) — alert received?
- [ ] **Fire drill:** trigger test Sentry error — alert received?
- [ ] Post-incident template stored (Notion / Google Doc)

---

## Sign-off

| Role | Name | Date |
|------|------|------|
| Engineering | | |
| Product | | |
| On-call lead | | |

---

*Update this checklist when you add regions, services, or compliance requirements.*
