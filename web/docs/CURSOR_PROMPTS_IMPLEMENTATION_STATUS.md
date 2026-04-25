# Cursor delegation prompts — implementation status (TradeForce `web/`)

The pack in `web/docs/cursor-prompts/` targets a **Manus / Vite / Wouter** layout (`client/src/App.tsx`). This repository uses **Next.js App Router** under `web/src/app/`. Behaviour below maps prompt intent to what is already implemented or what was added in-repo.

**Last updated:** 2026-04-24

## Phase 1 — CRITICAL (routes & navigation)

| Prompt expectation | In this repo |
|--------------------|--------------|
| `/lead-capture` | `src/app/lead-capture/page.tsx` → `LeadCapture` (tRPC `leads.create`, quote estimator) |
| `/tradesman-signup` | `src/app/tradesman-signup/page.tsx` (pricing + links; not a separate mock form) |
| `/lead-scoring` | `src/app/lead-scoring/page.tsx` |
| `/available-jobs` | `src/app/available-jobs/page.tsx` (tRPC `tradesman.getMatchedProjects` + bids; not a static placeholder) |
| Wouter `App.tsx` | **N/A** — use `src/app/**/page.tsx` and `layout.tsx` instead |
| No console errors | Ongoing: run `pnpm dev` and e2e smoke (`e2e/smoke.spec.ts`) |

**Part 2 polish:** Styling and back links are already aligned with the design system; homepage `HomeHeader` / `HomeFooter` use `next/link`.

## Phase 2 — HIGH (chat & payments)

| Prompt expectation | In this repo |
|--------------------|--------------|
| Chat tRPC | `src/server/api/routers/chat.ts` + `lib/chat-knowledge-base.ts`, `server/_core/llm.ts`, `server/chat/*` |
| Payments tRPC | `src/server/api/routers/payments.ts` + `lib/stripe-server.ts` |
| Stripe webhook | `src/app/api/stripe/webhook/route.ts` + `lib/record-lead-payment.ts` |
| Chat UI | `src/components/AIChatBox.tsx` (root layout) |
| Payment UI | `src/components/leads/lead-accept-payment.tsx` (lead acceptance flow) |

**No duplicate Drizzle `server/db.ts` router** from the prompt: persistence is via Flask API + optional Mongo for chat, as in existing code.

## Phase 3 — MEDIUM (email, validation, errors)

| Prompt expectation | In this repo |
|--------------------|--------------|
| React Email templates | `src/emails/*` + `renderEmail` in `src/emails/render-email.ts` |
| Zod on lead form | **Added** `src/lib/schemas/lead-capture.ts` + client validation in `LeadCapture.tsx` |
| Error boundary | **Added** `src/app/error.tsx` and `src/app/global-error.tsx` (Next.js conventions) |
| tRPC `email` procedures | Not added — sending is not wired to a provider in the prompt’s “log only” sense; use your mailer + `renderEmail` when ready |

## Follow-up (optional)

- Wire Resend/Sendgrid using `SENDGRID_API_KEY` and call `renderEmail` from server actions or tRPC when business events fire.
- Extend Zod to other forms (e.g. available-jobs bid inputs) if you want the same pattern.

## Re-run / extend tests

```bash
cd web
pnpm typecheck
pnpm test
pnpm test:e2e
```

Use `e2e/manus-external-audit.spec.ts` only for external Manus URLs; use default Playwright config for this app.
