# Bug report template — TradeScore

Use this for **pre-launch** and **post-launch** defects. Paste into GitHub Issues, Linear, Jira, or email to engineering.

---

## Summary

**One-line title:** _Clear, specific (e.g. “Lead form: submit button stays disabled after fixing email”)_

---

## Environment

| Field | Value |
|-------|--------|
| **URL** | _https://…_ |
| **Build / commit** | _SHA or “unknown”_ |
| **Browser + version** | _e.g. Safari 17, Chrome 124_ |
| **OS / device** | _e.g. iOS 17, iPhone 12, Windows 11_ |
| **Account type** | _homeowner | tradesman | anonymous_ |
| **Stripe mode** | _test | live | N/A_ |

---

## Severity

_Choose one (align with `INCIDENT_RESPONSE.md` if customer-facing)._

- [ ] **SEV-1** — Outage, data loss, payment integrity, security breach  
- [ ] **SEV-2** — Major feature broken (checkout, lead submit)  
- [ ] **SEV-3** — Degraded UX, workaround exists  
- [ ] **SEV-4** — Cosmetic, typo, minor edge case  

---

## Steps to reproduce

1. _Step 1_  
2. _Step 2_  
3. _…_

**Repro rate:** _always | often | intermittent (~X%)_

---

## Expected result

_What should happen._

---

## Actual result

_What happened instead._

---

## Evidence

- **Screenshot / screen recording:** _Describe or attach (no sensitive PII)_  
- **Console errors:** _Paste redacted stack_  
- **Network:** _Failing request URL, status code_  
- **Stripe:** _PaymentIntent id, event id (if applicable)_  
- **MongoDB:** _Collection + query filters (no raw PII in public tickets)_  

---

## Workaround

_If any — e.g. “Use Firefox”, “Retry after refresh”._

---

## Suggested component / area

_ e.g. `LeadCapture`, `paymentsRouter`, Stripe webhook, Flask `/api/...` _

---

## Reporter

| Field | Value |
|-------|--------|
| **Name** | |
| **Date** | |
| **Contact** | _optional_ |

---

_Checklist for reporter:_ remove passwords, full card numbers, and secrets before sending._
