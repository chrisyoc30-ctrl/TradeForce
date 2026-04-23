# TradeScore — Automated testing guide

This repo implements a **test pyramid** for the Next.js app (`web/`):

| Layer | Tool | Location | Command |
|-------|------|----------|---------|
| **Unit / integration** | Vitest | `src/**/*.test.ts(x)` | `npm test` |
| **E2E + a11y** | Playwright + axe-core | `e2e/*.spec.ts` | `npm run test:e2e` |
| **CI** | GitHub Actions | `.github/workflows/web-ci.yml` | on push/PR |

---

## Quick start

```bash
cd web
npm ci
npm test                 # Vitest (unit + integration)
npm run test:coverage    # optional HTML report in coverage/
npm run test:e2e         # Playwright (builds app, starts server — slow first run)
```

**E2E locally:** Ensure port **3000** is free, or set `PORT` + `PLAYWRIGHT_BASE_URL` to match. With a dev server already on 3000, Playwright’s `reuseExistingServer` (non-CI) skips starting production server if `/api/health` responds.

---

## What is covered

### Unit / integration (Vitest)

- **Pricing & copy** — `src/lib/pricing.test.ts`
- **Lead form rules** — `src/lib/lead-form-submittable.test.ts` (+ used by `LeadCapture`)
- **Quote estimate math** — `src/lib/quote-estimate.test.ts`
- **Chat knowledge / prompts** — `src/lib/chat-knowledge-base.test.ts`
- **Escalation rules** — `src/server/chat/chat-escalation.test.ts`
- **LLM guard** — `src/server/_core/llm.test.ts` (missing API key)
- **leads.create** — `leads.msw.integration.test.ts` (**MSW** mocks Flask `POST /api/leads`)
- **chat.sendMessage** — `chat.integration.test.ts` (mocked OpenAI + chat store)
- **payments.createLeadAcceptanceIntent** — `payments.integration.test.ts` (mocked Stripe SDK)
- **Security smoke** — `src/server/security/input-validation.test.ts`

### E2E (Playwright)

- **smoke.spec.ts** — `/`, `/api/health`, legal pages
- **lead-form.spec.ts** — required-field gating on `/lead-capture`
- **chat-widget.spec.ts** — launcher opens dialog
- **a11y-axe.spec.ts** — axe serious/critical on `/` and `/lead-capture` (contrast rule disabled — run Lighthouse separately for colour)

**Not yet automated (extend as needed):**

- Full Stripe **4242** browser flow (needs test keys + Elements timing)
- Flask + Mongo **production-like** data path (use staging + `E2E_*` env gates)
- Email **SMTP** delivery (use Mailpit / Ethereal in CI)
- Load (**k6** / Artillery) — run on staging per `TESTING_CHECKLIST.md`

---

## Coverage targets

- **Stretch:** statements/branches/functions/lines **> 80%** (org goal)
- **Today:** coverage is **incremental** — run `npm run test:coverage` and raise thresholds in `vitest.config.ts` as suites grow.

---

## MSW (Mock Service Worker)

Integration tests use **`msw/node`** to stub HTTP to the Flask base URL (`http://127.0.0.1:5000/api/leads`). Add handlers under `src/test/msw/` if more routes need stubbing.

---

## Playwright configuration

- **Config:** `playwright.config.ts`
- **Web server:** `npm run test:e2e:server` → `next build --turbopack && next start -p 3000`
- **Projects:** Desktop Chrome + iPhone 12 profile

```bash
npx playwright install   # first time locally
npm run test:e2e:ui      # interactive UI mode
```

---

## CI pipeline

Workflow: `.github/workflows/web-ci.yml`

1. `npm ci`
2. `npm run lint`
3. `npm run typecheck`
4. `npm run test`
5. Playwright **chromium** only (faster CI; add firefox/webkit if needed)
6. Upload Playwright HTML report on failure

---

## Performance & security in automation

- **Lighthouse CI:** not wired by default — run manually or add `@lhci/cli` job (see `MONITORING_SETUP.md`).
- **npm audit:** run `npm audit` in release process; optional CI step: `npm audit --audit-level=high`.
- **OWASP ZAP / Burp:** manual / scheduled against staging.

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| Vitest can’t resolve `@/` | Check `vitest.config.ts` `resolve.alias` |
| MSW “no handler” | Add handler or set `onUnhandledRequest: 'bypass'` |
| Playwright timeout on webServer | Increase `timeout`; ensure `next build` succeeds |
| **`EADDRINUSE` on port 3000** | Stop other dev servers (`next dev` / old `next start`) or set `PORT=3001` + `PLAYWRIGHT_BASE_URL=http://localhost:3001` and `webServer` command `next start -p 3001` |
| CI vs local webServer | **CI:** workflow runs `npm run build` then Playwright starts **only** `next start`. **Local:** `npm run test:e2e` runs **build + start** via `test:e2e:server`. |
| E2E passes locally, fails CI | Pin Node version; ensure no port conflict |
| Axe contrast noise | Keep `color-contrast` disabled in automated axe or fix theme tokens |

---

## Related docs

- `TESTING_CHECKLIST.md` — manual pre-launch matrix  
- `TEST_RESULTS.md` — run log template  
- `BUG_REPORT_TEMPLATE.md` — defect template  
- `MONITORING_SETUP.md` — SLOs after launch  

---

*Expand suites as features ship; keep critical path (lead → pay → webhook) under both manual and automated coverage.*
