# External test report: Manus app URL

**URL tested:** [https://manus.im/app/BhvLBFWqDXXFisN9Dtpi4B](https://manus.im/app/BhvLBFWqDXXFisN9Dtpi4B)  
**Date:** 24 April 2026 (automated run from TradeForce `web/` repo)  
**Method:** [Playwright](https://playwright.dev/) (Chromium), [axe-core](https://github.com/dequelabs/axe-core) (via `@axe-core/playwright`), console + network diagnostics.

---

## Executive summary

| Item | Result |
|------|--------|
| **HTTP** | Initial navigation returns success (`< 400`). |
| **Unauthenticated experience** | The page presents **Manus’s account gate** (“Sign in or sign up”, OAuth, Terms/Privacy), not a standalone public preview of your app’s UI. |
| **API / session** | Multiple **401** responses and a **`ConnectError: [unauthenticated] missing authorization header`** for `getUserClientConfig` — **expected** when no Manus session cookie is present. |
| **CSP (Content-Security-Policy)** | A **script-src** violation was logged for a dynamic chunk on `files.manuscdn.com` in the automated browser context. This is **Manus platform / delivery** behaviour, not something this TradeForce repository can change. |
| **Accessibility (axe)** | **1 serious** issue on the unauthenticated shell: **link without discernible name** (`a[href="/?index=1"]`). This appears on the **Manus** login/shell layout, not on TradeScore source in this repo. |
| **Code fixes in this repo** | We **cannot** “fix” the live Manus shell or their CDN from TradeForce. Changes belong in the **Manus** project or in Manus support if the issue reproduces in a normal user browser. |

**Bottom line:** This was the most honest “comprehensive” test possible **without a logged-in Manus session**. The URL is a **Manus app route** behind (or combined with) **platform auth**. To audit **your** UI and business flows, use a **public deploy URL** (e.g. your production domain) and/or run Playwright with **saved authentication** for Manus.

---

## How to reproduce the automated audit

From `web/`:

```bash
# PowerShell
$env:MANUS_BASE_URL="https://manus.im"
npx playwright test e2e/manus-external-audit.spec.ts --config=playwright.manus.config.ts --project=chromium
```

Artifacts: HTML report under `playwright-report/`, attachments include `body-snippet.txt`, `axe.json`, and console exports when configured.

**Files added in this repository (for repeatability, not “fixes” to Manus):**

- `playwright.manus.config.ts` — no local `webServer`, targets `https://manus.im` by default.
- `e2e/manus-external-audit.spec.ts` — load path `/app/BhvLBFWqDXXFisN9Dtpi4B`, collect axe + console, **report-only** (does not fail the job on third-party a11y/console noise; HTTP success is still asserted).

---

## Detailed findings

### 1. Authentication and 401s

- Console reported **Failed to load resource: 401** (multiple) and an **unauthenticated** error for **user client config** (`getUserClientConfig`).
- **Interpretation:** The Manus web app expects an **authorized** user. The automated test uses a **clean browser profile** with no login.
- **Professional standard:** For production monitoring of **your** product, run tests against an environment where the **end-user experience** is defined (e.g. public marketing site, or a **test account** with credentials stored in CI secrets, using Playwright `storageState` after a login step).

### 2. Content Security Policy (CSP)

- A **script** load was **blocked** by `script-src` / `strict-dynamic` + nonce, logged as a console error in the test run.
- **Interpretation:** Dynamic loading order or timing in **headless automation** can differ from a real user session. If this **only** appears in Playwright, treat as **flaky** relative to the platform; if it also appears in Chrome for real users, it is a **Manus** incident to report to their team.

### 3. Accessibility (axe)

- **Rule:** `link-name` (serious) — link at `a[href="/?index=1"]` has **no visible text, no `aria-label`, no `title`**.
- **Where:** Manus unauthenticated **shell** DOM, not the TradeNext.js pages in this repo.
- **Remediation (platform):** Add visible text, `aria-label`, or `title` on that control; or remove from tab order if decorative. **Not actionable inside TradeForce** unless the same pattern exists on **your** deployed site (e.g. `https://tradescore.uk`).

### 4. What was visible in the page body (unauthenticated)

Captured snippet included patterns such as: **Sign in or sign up**, **Start creating with Manus**, **Continue with Facebook / Google / Microsoft / Apple**, **Terms of service**, **Privacy policy** — i.e. **onboarding / auth**, not your TradeScore-specific screens.

---

## TradeScore vs Manus in this project

- **This repository** contains the **Next.js** `web` app and references production branding at **`https://tradescore.uk`** (see `sitemap`, `robots`, metadata).
- The **Manus** link is a **separate host** and **product** (canvas/app builder). **Deploying or editing Manus** is outside this git repo’s deploy pipeline unless you sync exports manually.

**If the goal is a “professional” QA of your public product**, the next step is to run the **same** Playwright + axe checks against:

- `https://tradescore.uk` (or your staging URL), and/or  
- A ** password-protected** preview with auth steps encoded in E2E.

---

## Recommendations (prioritised)

1. **Clarify the canonical public URL** for customers (e.g. `tradescore.uk`) and add E2E smoke + a11y there (extend existing `e2e/smoke.spec.ts` with `PLAYWRIGHT_BASE_URL` in CI).  
2. **Manus:** For the app at `.../app/BhvLBFWq...`, log in with a **test user** in Playwright, save `storageState`, and re-run audits **after** login to test **your** app UI, not the gate.  
3. **Manus platform** `link-name` and CSP: track with Manus or reproduce in a normal browser; only then treat as a production defect.  
4. **CI:** If you want this external check weekly, add a non-blocking workflow job that runs `playwright.manus.config.ts` and uploads the HTML report as an artifact.

---

## Changes made in this repository (for testing only)

| File | Change |
|------|--------|
| `playwright.manus.config.ts` | **New** — Playwright config for external base URL, no `webServer`. |
| `e2e/manus-external-audit.spec.ts` | **New** — Load Manus app path, axe + console attachments, assert HTTP &lt; 400, **no strict fail** on third-party console/a11y. |
| `docs/MANUS_EXTERNAL_TEST_REPORT.md` | **New** — This report. |

No application routes, tRPC logic, or Manus UI were modified—those assets are not hosted from this repo at the Manus URL.
