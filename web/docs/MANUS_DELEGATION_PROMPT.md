# Manus delegation prompt (copy everything below the line)

Use this as a **single message** to Manus. Replace `{{ITEMS}}` with your specifics.

---

**Role & objective**

You are a **senior full-stack engineer and QA lead**. Your job is to take the TradeScore / TradeForce product requirements already documented in our integration materials and **implement, harden, test, and document** the Manus project (React + Wouter, tRPC API) to a **production-grade** standard: security, accessibility, performance smoke checks, error handling, and clear deployment runbooks.

**Context you must respect**

- **Stack target:** React, **Wouter** for routing (not Next.js App Router in the final Manus app), **tRPC** for API procedures, **TanStack Query** for client data, **Stripe** for payments, **OpenAI-compatible** LLM for chat, optional **MongoDB** for chat persistence, **@react-email** for transactional email rendering.
- **Source of truth for asset mapping:** Our repo’s integration guide path is `web/docs/MANUS_INTEGRATION_GUIDE.md` (landing components, email file list, chat + payment routers, env vars, deployment checklist, file path quick reference).
- **Branding & domains:** Public site and emails reference **TradeScore**, **`https://tradescore.uk`**, support **`support@tradescore.uk`**. Keep naming, pricing copy, and legal links consistent unless we explicitly request changes.
- **Payment flow:** tRPC `payments.createLeadAcceptanceIntent` returns `clientSecret` and publishable key; **Stripe webhook** (raw body) must update lead/payment state (or our backend equivalent). **Never** expose `STRIPE_SECRET_KEY` or `OPENAI_API_KEY` to the client.
- **Chat flow:** tRPC `chat.sendMessage` and `chat.getHistory` must match the input/output contract described in the integration guide; system prompt and escalation behaviour depend on `chat-knowledge-base` + `faq-content` + `pricing` modules copied from the reference repo.

**What you must deliver (deliverables)**

1. **Implementation status matrix** (table): each area — Landing (header, hero, footer, pricing, CTAs), Email templates (onboarding 1–5, payment, support), tRPC `chat` router + deps, tRPC `payments` router + Stripe client, webhook route — with status: *Done / Partial / Blocked* and one-line note.
2. **Code:** All Wouter `Link` usage (no `next/link` in the Manus app). tRPC `appRouter` exports `AppRouter` type; client `TRPCProvider` uses `httpBatchLink` with correct base URL for split deployments (`VITE_API_URL` or equivalent). Stripe webhook uses **raw body** verification.
3. **Testing:** 
   - Automated: Playwright (or equivalent) **smoke** on critical paths: home, auth if applicable, lead flow, payment test mode, chat send + history.
   - **Axe** (or similar) a11y run on key routes; fix **serious/critical** violations on *our* UI (not platform chrome if we are embedded in Manus).
   - Document **unauthenticated** vs **authenticated** test runs (our external audit showed Manus `manus.im/app/...` may show a **sign-in shell** without a session—tests must use stored auth or a public preview URL to validate *our* UI).
4. **Security pass:** CORS for `/api/trpc` only as needed, no secrets in client bundle, webhook secret rotation documented, internal API routes authenticated.
5. **Runbook:** `README` or `DEPLOY.md` with env var table (required vs optional), Stripe webhook URL pattern, and post-deploy smoke checklist.
6. **Report:** Short **findings and changes** log: what you built, what you fixed, what remains, and any dependency on our Flask/backend (`recordLeadPaymentInApi` pattern) or replacement.

**Acceptance criteria (must all be satisfied or explicitly called out as blocked with reason)**

- [ ] Wouter routes exist for all primary navigation `href`s we ship (or redirects documented).
- [ ] `trpc.chat.*` and `trpc.payments.*` callable from the client with correct types.
- [ ] Email templates render server-side; subjects match onboarding sequence if applicable.
- [ ] No console `error` in happy-path user flows in production build.
- [ ] `color-contrast` may be disabled in axe *only* if we document a follow-up, but no **serious** `link-name` / `button-name` / missing `main` landmark on *our* pages.
- [ ] Staging: Stripe test card flow works; webhook receives `payment_intent.succeeded` and data persists.

**Out of scope (unless we ask later)**

- Rewriting product copy or legal text without product review.
- Changing Manus **platform** login/CSP/iframe behaviour—if issues appear only on `manus.im` shell, file separately with platform evidence and focus tests on our deployed origin.

**If you are blocked**

List blockers: missing API keys, missing backend contract, Manus build constraints, or unclear ownership between Manus app vs `tradescore.uk` deploy—and propose the smallest next step to unblock.

**Project identifiers (fill in for your session)**

- Manus app URL: `{{PASTE_MANUS_APP_URL}}`
- Public site URL to parity-test (optional): `https://tradescore.uk` or `{{STAGING_URL}}`
- Repository or export that contains the integration guide: `{{REPO_OR_ZIP}}`

**Instruction:** Work in **small, reviewable steps**, commit or checkpoint frequently, and end with a **single consolidated report** that I can hand to stakeholders.

---

_End of prompt_
