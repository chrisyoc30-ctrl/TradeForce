# TradeScore — Pre-launch testing checklist & guide

**Purpose:** Repeatable, documented verification before production launch.  
**Stack reference:** Next.js (`web/`), tRPC, Stripe (PaymentIntents + webhooks), optional Flask (`app.py`), MongoDB (Atlas or self-hosted), AI chat (`chat.sendMessage`).

**How to use this doc**

1. Copy rows into `TEST_RESULTS.md` per cycle (alpha, RC, prod).  
2. Mark **Pass / Fail / Blocked / N/A** with tester initials and date.  
3. Attach evidence: screenshot description, Stripe event id, Mongo document id, HAR (if allowed).  
4. **Sign-off** only when critical path is 100% Pass and no open SEV-1/2 bugs.

---

## Roles & responsibilities

| Role | Responsibility |
|------|----------------|
| **QA lead** | Owns checklist execution, records `TEST_RESULTS.md`, triages failures |
| **Engineer** | Fixes defects, verifies webhook/DB integrations, runs load tests |
| **Product** | Confirms copy, pricing (£25, first lead free), flows match Terms/FAQ |
| **Stakeholder** | Final go/no-go after sign-off section |

**Who tests what (minimum):**

- **QA lead:** Full functional, accessibility, cross-browser matrix (spot + full on critical path).  
- **Engineer:** Integration (Stripe, Flask, Mongo), webhooks, security review, performance/Lighthouse.  
- **Anyone:** Smoke test on one mobile device before each release tag.

---

## Testing schedule (suggested)

| Phase | When | Focus |
|-------|------|--------|
| **Sprint QA** | Each merge to `main` / release branch | Smoke + changed areas |
| **RC-1** | 1 week before launch | Full functional + integration |
| **RC-2** | 3–4 days before | Regression + cross-browser + a11y |
| **Launch freeze** | 48h before | Smoke only; no risky merges |
| **Post-launch** | Day 0–7 | Monitoring (`MONITORING_SETUP.md`) + hotfix playbook |

---

## Pass / fail criteria (global)

| Result | Meaning |
|--------|---------|
| **Pass** | Behaviour matches expected; no blocking defects |
| **Fail** | Does not meet expected; log in `TEST_RESULTS.md` + file bug (`BUG_REPORT_TEMPLATE.md`) |
| **Blocked** | Cannot test (env, data, third-party outage); note dependency |
| **N/A** | Not applicable to current build (e.g. feature flagged off) |

**Critical path (must be Pass for launch):** homeowner lead submit → scoring/confirmation → tradesman views lead → accept → Stripe test payment succeeds → webhook processed → DB reflects payment → user sees confirmation (and no PII leaked in logs).

---

## 1. Functional testing

### 1.1 Lead submission (homeowner)

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-1.1 | Open `/lead-capture` (or homepage CTA). Fill all required fields with valid data. Submit. | Success state or redirect; no unhandled error boundary. Lead visible in ops UI or API. | |
| F-1.2 | Submit with empty required fields. | Inline validation; submit blocked; accessible error text. | |
| F-1.3 | Enter invalid email / phone formats (if validated). | Validation messages; no server 500. | |
| F-1.4 | Paste very long description (boundary, e.g. 5k chars if allowed). | Truncation or validation message; no crash. | |
| F-1.5 | Submit, then refresh — duplicate behaviour documented (allow or idempotent). | No duplicate leads unless product intends; otherwise clear UX. | |

**Screenshot description:** Lead form filled; success dialog or confirmation screen showing reference/score if applicable.

### 1.2 Lead scoring / confirmation

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-2.1 | Complete flow until score/grade shown (A–F or product equivalent). | Grade displays consistently with server logic. | |
| F-2.2 | Open lead detail from dashboard/board if present. | Data matches submission. | |

### 1.3 Tradesman: view & accept lead

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-3.1 | Sign up or log in as tradesman path; open leads list (`/leads`, `/lead-scoring`, etc.). | List loads; filters work if present. | |
| F-3.2 | Open lead detail; review fields. | No missing PII exposure to wrong role. | |
| F-3.3 | Accept lead (or “pay to accept”). | Redirected to payment UI when fee applies. | |

### 1.4 Payment flow (Stripe test mode)

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-4.1 | Use Stripe test card `4242 4242 4242 4242`, future expiry, any CVC. | Payment succeeds; confirmation UI. | |
| F-4.2 | Use decline test card (e.g. `4000 0000 0000 0002`). | Clear failure message; can retry. | |
| F-4.3 | Complete payment; open Stripe Dashboard → Payments. | PaymentIntent succeeded; metadata sensible. | |

**Screenshot description:** Stripe payment element with success confirmation; Stripe Dashboard showing matching PaymentIntent.

### 1.5 Webhook delivery

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-5.1 | From Stripe Dashboard → Developers → Webhooks, confirm endpoint URL (prod/staging). | 2xx on test delivery or real event. | |
| F-5.2 | Complete test payment; inspect webhook logs within 5 minutes. | `payment_intent.succeeded` (or your subscribed events) delivered; no permanent failure. | |
| F-5.3 | Temporarily wrong signing secret in env; send test webhook. | Signature failure logged; fix secret and retest. | |

### 1.6 Database (MongoDB)

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-6.1 | After lead create, query collection(s) (Atlas or mongo shell). | Document exists; fields complete. | |
| F-6.2 | After payment webhook, verify lead/payment fields updated per product rules. | State matches “paid/accepted”. | |
| F-6.3 | No duplicate payment application for same intent (idempotency). | Single logical update. | |

### 1.7 Email notifications

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-7.1 | Trigger flows wired to email (signup, lead, payment — if implemented). | Message received in test inbox; links HTTPS. | |
| F-7.2 | Verify plain-text + HTML if using React Email. | Renders; unsubscribe/preference links where required. | |

*If email not yet automated, mark N/A and track as post-launch.*

### 1.8 Links & navigation

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-8.1 | Crawl or manually hit: `/`, `/pricing`, `/faq`, `/terms`, `/privacy`, `/lead-capture`, `/tradesman-signup`. | All return 200; no broken anchors. | |
| F-8.2 | Footer/header links on 3 random pages. | Consistent; no 404. | |
| F-8.3 | External links (Stripe, social) open safely (`rel` where appropriate). | Correct destination. | |

### 1.9 AI chat widget

| ID | Step-by-step | Expected result | Pass/Fail |
|----|----------------|-----------------|-----------|
| F-9.1 | Open chat; ask pricing question. | Accurate vs FAQ; no crash without `OPENAI_API_KEY` shows friendly error. | |
| F-9.2 | Type “I want a refund”. | Escalation path; ticket reference in reply. | |

---

## 2. Browser testing

Run **critical path** (§1.1–1.4) on each:

| Browser | Version | Tester | Pass/Fail | Notes |
|---------|---------|--------|-----------|--------|
| Chrome | Latest stable | | | |
| Firefox | Latest stable | | | |
| Safari | Latest (macOS) | | | |
| Edge | Latest stable | | | |
| Mobile Safari | iOS latest | | | |
| Chrome | Android latest | | | |

**Screenshot description:** Same step (e.g. payment confirmation) visible in Safari and Chrome mobile; note any layout shift.

---

## 3. Device / viewport testing

Resize or use device lab; verify touch targets ≥ 44px where applicable.

| Device / viewport | Width | Critical screens | Pass/Fail |
|-------------------|-------|------------------|-----------|
| iPhone 12 | 390px | Home, lead form, chat, payment | |
| iPhone 14 Pro Max | 430px | Same | |
| iPad | 768px | Dashboard, tables | |
| Tablet landscape | 1024px | Navigation, lead board | |
| Desktop | 1920px | Full layout, no overflow | |

---

## 4. Performance testing

| ID | Test | Target | Pass/Fail |
|----|------|--------|-----------|
| P-4.1 | Lighthouse (mobile) on `/`, `/lead-capture` | Performance **> 80** (stretch goal; document if 70–80 with reason) | |
| P-4.2 | LCP (lab PageSpeed) | **< 2 s** on key URLs (see `MONITORING_SETUP.md`) | |
| P-4.3 | Manual: open DevTools console on full critical path | **No uncaught errors** | |
| P-4.4 | Record Performance tab: 5 min navigation | No runaway memory (heuristic: heap not monotonic without bound) | |
| P-4.5 | Images | Next/Image or optimized assets; no multi-MB unoptimized hero | |

**Screenshot description:** Lighthouse summary showing scores + list of diagnostics.

---

## 5. Security testing

| ID | Test | Expected | Pass/Fail |
|----|------|----------|-----------|
| S-5.1 | Repo scan / manual: no API keys in client bundle | Only `NEXT_PUBLIC_*` where intended | |
| S-5.2 | Production served over **HTTPS** | Valid cert; HSTS if policy requires | |
| S-5.3 | tRPC + API routes: no wildcard CORS in prod | Locked to app origin | |
| S-5.4 | Malformed JSON / oversized body to `/api/trpc` | 4xx; no stack trace to client | |
| S-5.5 | **NoSQL injection** hygiene: user input not passed raw to `$where` | Use parameterized queries / ODM patterns | |
| S-5.6 | Stored XSS: submit `<script>` in text fields | Escaped or stripped in UI | |
| S-5.7 | Stripe webhook: invalid signature rejected | 400/401 as designed | |
| S-5.8 | Rate limit sanity (optional): burst chat or lead API | Throttle or 429 (if implemented) | |

*SQL injection: **N/A** if no SQL database; keep NoSQL + driver injection in scope.*

---

## 6. Accessibility testing

| ID | Test | Expected | Pass/Fail |
|----|------|----------|-----------|
| A-6.1 | Tab through lead form | Logical order; visible focus | |
| A-6.2 | Submit with keyboard only | Possible | |
| A-6.3 | VoiceOver / NVDA: lead form labels | Fields announced | |
| A-6.4 | Chat widget: dialog role, Escape minimizes | Documented behaviour works | |
| A-6.5 | Contrast: body text vs background | WCAG AA heuristic (tools: axe, Lighthouse a11y) | |
| A-6.6 | Lighthouse Accessibility score | **> 90** target (adjust if known debt) | |

---

## 7. User flow testing (E2E narratives)

### 7.1 Homeowner

1. Land on `/` → CTA to post job.  
2. Submit lead → see score/confirmation.  
3. **Expected:** End state matches product; email/dashboard if applicable.

### 7.2 Tradesman

1. Signup / access trades area.  
2. View leads → open detail.  
3. Accept → pay (test card) → confirmation.  
4. **Expected:** Lead status and payment recorded.

### 7.3 Payment

1. From lead detail, start checkout.  
2. Complete 4242 card.  
3. **Expected:** Success; webhook; DB.

### 7.4 Error / retry

1. Force validation error → fix → submit.  
2. Decline card → retry with 4242.  
3. **Expected:** Recoverable UX; no dead ends.

---

## 8. Data testing

| ID | Test | Expected | Pass/Fail |
|----|------|----------|-----------|
| D-8.1 | Lead documents: required fields present | Non-null per schema | |
| D-8.2 | Payment fields: amount, currency, intent id | Consistent with Stripe | |
| D-8.3 | User/account records (if any) | No accidental overwrite | |
| D-8.4 | Duplicate submit stress | Idempotency or single lead | |
| D-8.5 | Chat messages (`chat_messages`) if Mongo enabled | conversationId grouping correct | |

---

## 9. Integration testing

| ID | System | Test | Pass/Fail |
|----|--------|------|-----------|
| I-9.1 | Stripe | Test + live mode keys isolated | |
| I-9.2 | Flask `API_URL` | Health or sample authenticated call from Next server | |
| I-9.3 | MongoDB | Connection string from prod secret; ping from app or `/api/health` | |
| I-9.4 | Webhooks | End-to-end payment event | |
| I-9.5 | Email provider | SMTP/API send from staging | |

---

## 10. Load testing (staging)

| ID | Test | Target | Pass/Fail |
|----|------|--------|-----------|
| L-10.1 | 100 concurrent **synthetic** users (k6, Artillery, Locust) on read-heavy routes | **Error rate < 1%**; document baseline | |
| L-10.2 | p95 API latency (tRPC batch) | **< 1 s** under test profile | |
| L-10.3 | DB query timing (Atlas profiler or logs) | **< 500 ms** for hot queries | |

**Note:** Run against **staging** only; avoid load on prod Stripe test mode shared limits.

---

## Edge cases & workarounds

| Scenario | What to check | Known workaround |
|----------|---------------|------------------|
| Slow 3G | Lead form still usable; timeouts show message | Document retry |
| Webhook delayed | UI shows pending; eventual consistency | Support script to reconcile |
| Double-click pay | Single charge | Idempotent UI + server |
| Browser autofill | No broken validation | — |
| Private / strict mode | LocalStorage chat cleared | Expected |

---

## Rollback procedure

1. **Trigger:** SEV-1 outage, payment breakage, data corruption risk, security incident.  
2. **Immediate:** Enable maintenance banner (if available); pause marketing sends.  
3. **Deploy:** Revert to last **known-good** deployment tag (Vercel rollback / previous Docker image).  
4. **Data:** Do **not** run destructive migrations backward; document forward fix.  
5. **Stripe:** If webhooks wrong, disable endpoint temporarily **only** with finance approval.  
6. **Communicate:** Status page + `INCIDENT_RESPONSE.md` templates.  
7. **Post-mortem:** Within 5 business days for SEV-1/2.

---

## Sign-off (launch gate)

| Gate | Owner | Criteria | Sign-off (name / date) |
|------|-------|----------|-------------------------|
| Functional critical path | QA lead | All Pass | |
| Stripe + webhook + DB | Engineer | All Pass | |
| Security spot-check | Engineer | No open criticals | |
| Legal/copy | Product | Terms/Pricing/FAQ match UI | |
| Performance | Engineer | Meets agreed thresholds or documented waiver | |
| Accessibility | QA / Eng | No blockers on critical flows | |

**Go / No-Go meeting:** Record decision + link to `TEST_RESULTS.md` snapshot.

---

## Appendix: Quick smoke (15 min)

- [ ] `/` loads  
- [ ] Submit minimal valid lead  
- [ ] Open trades lead list  
- [ ] Payment test 4242  
- [ ] Webhook 2xx  
- [ ] `/terms`, `/privacy` 200  
- [ ] Chat opens + one message  

---

## Automated suite

Run Vitest + Playwright + CI as described in **`TEST_AUTOMATION.md`** (unit/integration/E2E/axe, GitHub Actions).

---

*Living document — align IDs with your test case manager if you import to Jira/Linear.*
