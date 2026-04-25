# TradeScore → Manus (React + Wouter) integration guide

This guide maps **TradeForce** `web/` assets from this repository into a **Manus** project that uses **React**, **Wouter** (client routing), and **tRPC** (API). It focuses on **Priority 1 (launch)**: landing UI, email templates, the **chat** tRPC router, and the **payments** tRPC router (plus the Stripe webhook).

**Conventions**

- *Original path* = file in this TradeForce repo.
- *Manus* = your app; adjust folders and import aliases to match.
- Everywhere the Next app uses `next/link`, use Wouter: `import { Link } from "wouter"` (same `href` API).

**Homepage composition reference (Next):** `web/src/app/page.tsx` — in Manus, render the same section tree on your `/` route.

---

## 1. Inventory: what to copy and how it maps

| Area | In this repo | In Manus |
|------|--------------|----------|
| Landing (hero, header, footer, pricing strip, CTAs) | `web/src/components/homepage/*`, `web/src/components/pricing/pricing-card.tsx` | Wouter `Link`; Tailwind + your `Button` / `Card` (see §3). |
| Shared pricing copy | `web/src/lib/pricing.ts` | Copy as-is. |
| SEO JSON-LD | `web/src/components/homepage/structured-data.tsx` | No Next `head` — use `react-helmet-async` or put JSON-LD in your HTML shell. |
| Onboarding emails | `web/src/emails/onboarding/*` | Standalone TSX. |
| Payment / support emails | `web/src/emails/payment-*.tsx`, `web/src/emails/support-*.tsx` | Standalone TSX. |
| Email shell + render | `web/src/emails/components/trade-score-layout.tsx`, `web/src/emails/constants.ts`, `web/src/emails/render-email.ts` | Server: `renderEmail()` then send via your provider. |
| tRPC `chat` | `web/src/server/api/routers/chat.ts` + deps (§5) | Merge `chatRouter` into `appRouter`. |
| tRPC `payments` | `web/src/server/api/routers/payments.ts`, `web/src/lib/stripe-server.ts` | Merge; configure env (§6). |
| Stripe webhook (HTTP, not tRPC) | `web/src/app/api/stripe/webhook/route.ts`, `web/src/lib/record-lead-payment.ts` | One `POST` route on Express/Hono/Fastify/etc. with **raw** body. |
| tRPC base | `web/src/server/api/trpc.ts`, `web/src/server/api/root.ts` | Same pattern. |

---

## 2. Dependencies

**Client (Vite/CRA + Manus)**

```bash
npm install wouter @tanstack/react-query @trpc/client @trpc/react-query
npm install class-variance-authority clsx tailwind-merge lucide-react
```

Also: **Tailwind** and shadcn-style **Button** / **Card** (this repo: `web/src/components/ui/`).

**Server (tRPC + chat + payments)**

```bash
npm install @trpc/server zod stripe mongodb
```

**Email**

```bash
npm install @react-email/components @react-email/render
```

**Split frontend/backend origins:** set something like `VITE_API_URL` and point tRPC at `${VITE_API_URL}/api/trpc` (§7).

**Do not** rely on `next` or `@trpc/next` in Manus; use the vanilla tRPC client with `httpBatchLink`.

---

## 3. Landing (Priority 1): React + Wouter

### 3.1 Rules

1. `import Link from "next/link"` → `import { Link } from "wouter"`.
2. Wrap the app in Wouter’s `Router` (or `HashRouter` if the host has no SPA fallback).
3. Copy `web/src/lib/utils.ts` (`cn`) and `web/src/components/ui/button.tsx` / `card.tsx` if missing.
4. `PricingPreview` needs `HomepageSection`, `PricingCard`, and `pricingCopy` from `web/src/lib/pricing.ts`.

### 3.2 Files to copy (then replace `next/link`)

| File | Role |
|------|------|
| `web/src/lib/pricing.ts` | `TRADESMAN_LEAD_PRICE_GBP`, `pricingCopy` |
| `web/src/lib/utils.ts` | `cn()` |
| `web/src/components/ui/button.tsx` | `buttonVariants` |
| `web/src/components/ui/card.tsx` | `Card`, etc. |
| `web/src/components/homepage/section.tsx` | `HomepageSection` |
| `web/src/components/pricing/pricing-card.tsx` | `PricingCard` |
| `web/src/components/homepage/home-header.tsx` | Header + nav |
| `web/src/components/homepage/hero.tsx` | Hero |
| `web/src/components/homepage/how-it-works.tsx` | Steps |
| `web/src/components/homepage/value-propositions.tsx` | Value cards |
| `web/src/components/homepage/social-proof.tsx` | Social proof |
| `web/src/components/homepage/pricing-preview.tsx` | Pricing block |
| `web/src/components/homepage/final-cta.tsx` | Final CTA |
| `web/src/components/homepage/home-footer.tsx` | Footer |
| `web/src/components/homepage/structured-data.tsx` | JSON-LD (optional) |

### 3.3 Full adapted `HomeHeader` (Wouter)

**Original:** `web/src/components/homepage/home-header.tsx`

```tsx
// Manus: e.g. src/components/homepage/home-header.tsx
import { Link } from "wouter";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

const accent = "#FF6B35";

export function HomeHeader() {
  return (
    <header
      className="sticky top-0 z-50 border-b border-white/5 bg-zinc-950/80 backdrop-blur-md"
      role="banner"
    >
      <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:h-16 sm:px-6">
        <Link
          href="/"
          className="text-lg font-semibold tracking-tight text-foreground"
          aria-label="TradeScore home"
        >
          Trade<span style={{ color: accent }}>Score</span>
        </Link>
        <nav
          className="flex min-w-0 flex-1 justify-center gap-4 overflow-x-auto whitespace-nowrap px-2 text-xs text-muted-foreground sm:gap-5 sm:text-sm md:justify-center md:gap-6"
          aria-label="Primary"
        >
          <Link href="/pricing" className="shrink-0 transition-colors hover:text-foreground">
            Pricing
          </Link>
          <Link href="/faq" className="shrink-0 transition-colors hover:text-foreground">
            FAQ
          </Link>
          <Link href="/terms" className="shrink-0 transition-colors hover:text-foreground">
            Terms
          </Link>
          <Link href="/lead-capture" className="shrink-0 transition-colors hover:text-foreground">
            Post a job
          </Link>
          <Link
            href="/homeowner-dashboard"
            className="hidden shrink-0 transition-colors hover:text-foreground sm:inline"
          >
            My projects
          </Link>
          <Link href="/tradesman-signup" className="shrink-0 transition-colors hover:text-foreground">
            For trades
          </Link>
          <Link
            href="/lead-scoring"
            className="hidden shrink-0 transition-colors hover:text-foreground sm:inline"
          >
            Browse leads
          </Link>
          <Link
            href="/available-jobs"
            className="hidden shrink-0 transition-colors hover:text-foreground md:inline"
          >
            Available jobs
          </Link>
          <Link
            href="/admin/analytics"
            className="hidden shrink-0 text-muted-foreground/80 transition-colors hover:text-foreground lg:inline"
          >
            Admin
          </Link>
        </nav>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/lead-capture"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "hidden sm:inline-flex"
            )}
          >
            Homeowners
          </Link>
          <Link
            href="/tradesman-signup"
            className={cn(
              buttonVariants({ size: "sm" }),
              "border-0 bg-[#FF6B35] text-white hover:bg-[#e85f2d]"
            )}
          >
            Trades
          </Link>
        </div>
      </div>
    </header>
  );
}
```

Do the same `Link` swap for `hero.tsx`, `home-footer.tsx`, `final-cta.tsx`, and `pricing-preview.tsx`.

### 3.4 Example home route

```tsx
import { HomeFooter } from "@/components/homepage/home-footer";
import { HomeHeader } from "@/components/homepage/home-header";
import { HomeHero } from "@/components/homepage/hero";
import { HowItWorks } from "@/components/homepage/how-it-works";
import { ValuePropositions } from "@/components/homepage/value-propositions";
import { SocialProof } from "@/components/homepage/social-proof";
import { PricingPreview } from "@/components/homepage/pricing-preview";
import { FinalCta } from "@/components/homepage/final-cta";

export function HomePage() {
  return (
    <div className="min-h-dvh bg-zinc-950 text-foreground">
      <HomeHeader />
      <main id="main-content">
        <HomeHero />
        <ValuePropositions />
        <HowItWorks />
        <SocialProof />
        <PricingPreview />
        <FinalCta />
      </main>
      <HomeFooter />
    </div>
  );
}
```

### 3.5 Landing integration steps

1. Copy files from §3.2; fix `@/` path aliases.
2. Replace all `next/link` usage with Wouter.
3. Define Wouter routes (or your equivalents) for each `href` you use.
4. Ensure `text-foreground` / `text-muted-foreground` exist in CSS **or** replace with fixed Tailwind colours.
5. Build; copy any missing pieces from `web/src/components/ui/`.

---

## 4. Email templates (Priority 1)

### 4.1 Copy list

| Category | Path |
|----------|------|
| Brand | `web/src/emails/constants.ts` |
| Layout | `web/src/emails/components/trade-score-layout.tsx` |
| Render | `web/src/emails/render-email.ts` |
| Onboarding | `web/src/emails/onboarding/onboarding-1.tsx` … `onboarding-5.tsx`, `index.ts`, `subjects.ts`, `types.ts` |
| Payment | `web/src/emails/payment-confirmation.tsx`, `payment-failed.tsx` |
| Support | `web/src/emails/support-ticket-received.tsx`, `web/src/emails/support-ticket-resolved.tsx` |

`@react-email/components` `Link` is for email HTML only — not Wouter.

### 4.2 `render-email.ts` (from repo)

```ts
import { render } from "@react-email/render";
import type { ReactElement } from "react";

export async function renderEmail(element: ReactElement) {
  const [html, text] = await Promise.all([
    render(element),
    render(element, { plainText: true }),
  ]);
  return { html, text };
}
```

Server-only: `renderEmail(<YourTemplate />)` → send `html` + `text` with your mailer.

### 4.3 Email integration steps

1. Copy the files; keep or remap imports to `@/emails/...`.
2. Optional: `web/scripts/verify-email-templates.tsx` with `tsx`.
3. Do not send client-generated HTML as authoritative — render on the server.

---

## 5. Chat router (tRPC)

### 5.1 Source

- `web/src/server/api/routers/chat.ts` — merged in `web/src/server/api/root.ts` as `chat: chatRouter`.

### 5.2 Required modules (copy with the router)

| Module | Path | Role |
|--------|------|------|
| tRPC base | `web/src/server/api/trpc.ts` | `createTRPCRouter`, `publicProcedure` |
| System prompt | `web/src/lib/chat-knowledge-base.ts` | `buildChatSystemPrompt` (uses `web/src/lib/faq-content.ts`, `web/src/lib/pricing.ts`) |
| LLM | `web/src/server/_core/llm.ts` | `invokeLLM` |
| Store | `web/src/server/chat/chat-store.ts` | persist + in-memory fallback |
| Escalation | `web/src/server/chat/chat-escalation.ts` | pre-LLM rules |
| DB (optional) | `web/src/server/db/mongo.ts` | Mongo when `MONGODB_URI` is set |

**Env:** `OPENAI_API_KEY` (required); `OPENAI_CHAT_MODEL`, `OPENAI_BASE_URL` (optional); `MONGODB_URI`, `MONGODB_DB_NAME` (optional, for durable chat).

### 5.3 Public API (unchanged in Manus)

Copy **`chat.ts` in full** from the repo. Imports should resolve to the modules above.

- `chat.sendMessage` — mutation  
- `chat.getHistory` — query  

**Client example**

```ts
trpc.chat.sendMessage.mutate({ message, conversationId, userId, userRole, pageContext });
trpc.chat.getHistory.useQuery({ conversationId });
```

### 5.4 Chat integration steps

1. Copy the router and all §5.2 modules, or the project will not compile.
2. Add `chat: chatRouter` to `appRouter`.
3. Mount tRPC (§7).
4. If you drop `faq-content` / `chat-knowledge-base`, supply your own `buildChatSystemPrompt` (quality will suffer).

---

## 6. Payments (tRPC) + Stripe webhook

### 6.1 Source files

- `web/src/server/api/routers/payments.ts`
- `web/src/lib/stripe-server.ts`
- `web/src/lib/pricing.ts` — `TRADESMAN_LEAD_PRICE_GBP`
- Webhook: `web/src/app/api/stripe/webhook/route.ts`
- Backend call: `web/src/lib/record-lead-payment.ts` (Flask internal API)

### 6.2 Env: drop Next-only names

Vite often uses `VITE_*`. The server can expose the publishable key in the mutation response. Example fallback line when adapting `payments.ts`:

```ts
const publishableKey =
  process.env.STRIPE_PUBLISHABLE_KEY ??
  process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY ??
  process.env.VITE_STRIPE_PUBLISHABLE_KEY ??
  "";
```

**Procedure:** `payments.createLeadAcceptanceIntent` with `{ leadId: string }`.

**Returns:** `{ clientSecret, publishableKey, amountPence, currency: "gbp" }`.

### 6.3 Webhook (Express-style sketch)

**Original logic:** `web/src/app/api/stripe/webhook/route.ts`

- Use the **raw** request body (Stripe signature verification will fail on pre-parsed JSON).
- On `payment_intent.succeeded`, read `metadata.leadId` and call `recordLeadPaymentInApi` (or your own DB update).

`recordLeadPaymentInApi` needs `API_URL` / `NEXT_PUBLIC_API_URL` and `INTERNAL_WEBHOOK_SECRET` if you keep the Flask bridge.

### 6.4 Payments integration steps

1. Copy `payments.ts` and `stripe-server.ts`; add `payments` to `appRouter`.
2. Set `STRIPE_SECRET_KEY` (server only).
3. Return the publishable key from the server for Stripe.js.
4. Implement `POST` webhook with raw body; register URL in Stripe.
5. Staging: test with test keys; production: live keys + live webhook secret.

---

## 7. tRPC in Manus (server + client)

### 7.1 Minimal `appRouter` (launch)

```ts
// server/api/root.ts
import { createTRPCRouter } from "./trpc";
import { chatRouter } from "./routers/chat";
import { paymentsRouter } from "./routers/payments";

export const appRouter = createTRPCRouter({
  chat: chatRouter,
  payments: paymentsRouter,
});

export type AppRouter = typeof appRouter;
```

Serve `/api/trpc` with `fetchRequestHandler`, `createExpressMiddleware`, or Hono tRPC — see `web/src/app/api/trpc/[trpc]/route.ts` as a **fetch** reference.

### 7.2 `TRPCProvider` (Vite)

```tsx
"use client";
import { useState } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { httpBatchLink, loggerLink } from "@trpc/client";
import { createTRPCReact } from "@trpc/react-query";
import type { AppRouter } from "../server/api/root";

const apiBase = import.meta.env.VITE_API_URL ?? "";

export const trpc = createTRPCReact<AppRouter>();

export function TRPCProvider({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());
  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        loggerLink({ enabled: () => import.meta.env.DEV }),
        httpBatchLink({
          url: apiBase ? `${apiBase}/api/trpc` : "/api/trpc",
        }),
      ],
    })
  );
  return (
    <trpc.Provider client={trpcClient} queryClient={queryClient}>
      <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>
    </trpc.Provider>
  );
}
```

Place next to Wouter; enable **CORS** on `/api/trpc` if the SPA is on another origin.

---

## 8. tRPC `root.ts` checklist

- [ ] `import { chatRouter } from ...`
- [ ] `import { paymentsRouter } from ...`
- [ ] `export type AppRouter = typeof appRouter`

---

## 9. Deployment checklist

**Build**

- [ ] Client + server deps installed.
- [ ] SPA build; Wouter history fallback (or hash router) correct.
- [ ] No broken `@/` imports.

**Env — chat / LLM**

- [ ] `OPENAI_API_KEY`
- [ ] (Optional) `OPENAI_CHAT_MODEL`, `OPENAI_BASE_URL`, `MONGODB_URI`, `MONGODB_DB_NAME`

**Env — payments**

- [ ] `STRIPE_SECRET_KEY`
- [ ] Publishable key available to client (via mutation is fine)
- [ ] `STRIPE_WEBHOOK_SECRET`
- [ ] (Flask) `API_URL`, `INTERNAL_WEBHOOK_SECRET`

**Env — client**

- [ ] `VITE_API_URL` = API origin, `https://...`, no trailing slash, if split from SPA.

**Stripe**

- [ ] Live keys only on server; webhook endpoint + `payment_intent.succeeded`.
- [ ] Staging tested with test keys.

**Email**

- [ ] Provider configured; SPF/DKIM; test sends for onboarding, payment, support.

**Security**

- [ ] Never expose `STRIPE_SECRET_KEY`, `OPENAI_API_KEY`, `INTERNAL_WEBHOOK_SECRET` to the client.
- [ ] Webhook uses raw body; internal APIs authenticated.

**Smoke (after deploy)**

- [ ] `/` landing.
- [ ] `chat.sendMessage` works.
- [ ] Payment intent + Stripe test card (staging).
- [ ] (Optional) Webhook updates lead/DB.

---

## 10. File path quick reference

```
web/src/components/homepage/home-header.tsx
web/src/components/homepage/hero.tsx
web/src/components/homepage/section.tsx
web/src/components/homepage/how-it-works.tsx
web/src/components/homepage/value-propositions.tsx
web/src/components/homepage/social-proof.tsx
web/src/components/homepage/pricing-preview.tsx
web/src/components/homepage/final-cta.tsx
web/src/components/homepage/home-footer.tsx
web/src/components/homepage/structured-data.tsx
web/src/components/pricing/pricing-card.tsx
web/src/lib/pricing.ts
web/src/lib/utils.ts
web/src/components/ui/button.tsx
web/src/components/ui/card.tsx

web/src/emails/constants.ts
web/src/emails/render-email.ts
web/src/emails/components/trade-score-layout.tsx
web/src/emails/onboarding/*
web/src/emails/payment-confirmation.tsx
web/src/emails/payment-failed.tsx
web/src/emails/support-ticket-received.tsx
web/src/emails/support-ticket-resolved.tsx

web/src/server/api/trpc.ts
web/src/server/api/root.ts
web/src/server/api/routers/chat.ts
web/src/server/api/routers/payments.ts
web/src/lib/stripe-server.ts
web/src/lib/record-lead-payment.ts
web/src/lib/chat-knowledge-base.ts
web/src/lib/faq-content.ts
web/src/server/_core/llm.ts
web/src/server/chat/chat-store.ts
web/src/server/chat/chat-escalation.ts
web/src/server/db/mongo.ts
web/src/app/api/stripe/webhook/route.ts
web/src/app/api/trpc/[trpc]/route.ts
```

---

**Next steps for your fork:** point Wouter paths (`/lead-capture`, etc.) at real Manus routes; keep or replace the Flask payment bridge in `recordLeadPaymentInApi` with a direct database update in the webhook, depending on your stack.

**Canonical file in this repo:** `web/docs/MANUS_INTEGRATION_GUIDE.md` — if the editor loses the buffer, reopen that path.
