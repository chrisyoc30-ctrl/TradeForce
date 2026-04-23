# TradeScore — Tradesman onboarding email sequence

Educational **onboarding** emails for new tradespeople after signup. Templates are **React Email** components (HTML + mobile-friendly layout); render to **HTML** and **plain text** with `renderEmail()` from `@/emails/render-email`.

**Tone:** Welcoming, helpful, encouraging, professional, action-oriented.

**Contact in every send:** `hello@tradescore.uk` (via template footer).

---

## Schedule overview

| Send | Day | Template file | Purpose |
|------|-----|---------------|---------|
| 1 | **0** (signup) | `onboarding-1.tsx` | Welcome + what to expect |
| 2 | **1** | `onboarding-2.tsx` | How to find quality leads |
| 3 | **3** | `onboarding-3.tsx` | How to accept leads + what happens next |
| 4 | **5** | `onboarding-4.tsx` | Payments: lead fee vs getting paid for jobs |
| 5 | **7** | `onboarding-5.tsx` | Five success tips + browse more leads |

Trigger sends from your **ESP or job queue** using the user’s timezone where possible; avoid sending outside quiet hours (e.g. 22:00–07:00 local) unless the user expects instant transactional mail.

---

## Subject lines

Import from code to avoid drift:

```ts
import { ONBOARDING_EMAIL_SUBJECTS } from "@/emails/onboarding";

// ONBOARDING_EMAIL_SUBJECTS[1] … [5]
```

| # | Subject |
|---|---------|
| 1 | `Welcome to TradeScore! 🎉` |
| 2 | `How to find quality leads on TradeScore` |
| 3 | `Accept your first lead and start earning` |
| 4 | `How to get paid for your leads` |
| 5 | `5 tips to maximize your earnings on TradeScore` |

**Note on #4:** The subject reflects the full earnings journey (lead fee + **getting paid by the homeowner** for the job). The email body explicitly separates **£25 lead acceptance** (Stripe) from **your invoice to the customer** so there’s no confusion.

**US vs UK spelling:** Template #5 uses **maximise** (UK) in the heading; adjust to **maximize** if your audience is US-only.

---

## Primary CTAs

| # | Button label | URL prop | Typical destination |
|---|--------------|----------|---------------------|
| 1 | View your first lead | `viewFirstLeadUrl` | `/leads`, `/lead-scoring`, or first recommended lead |
| 2 | Browse available leads | `browseLeadsUrl` | `/leads` or dashboard leads tab |
| 3 | Accept a lead now | `acceptLeadUrl` | Deep link to a highlighted lead or `/leads` |
| 4 | Update payment method | `updatePaymentMethodUrl` | Stripe Customer Portal or in-app billing settings |
| 5 | Browse more leads | `browseMoreLeadsUrl` | `/leads` |

All CTAs should use **HTTPS** and, if you track campaigns, append UTMs (e.g. `utm_campaign=onboarding_d3`).

---

## Personalization variables

Pass into each template (see TypeScript props in each `onboarding-*.tsx` file):

| Variable | Required | Example | Notes |
|----------|----------|---------|--------|
| `firstName` | Yes | `Alex` | Fallback: “there” if blank |
| `tradeType` | Yes | `electrician`, `plumber` | Shown in copy; fallback: “your trade” |
| `marketingPreferencesUrl` | Yes* | `https://tradescore.uk/settings/email` | *Required to show footer “Email preferences” |
| `marketingUnsubscribeUrl` | Yes* | Signed token link | *Required to show “Unsubscribe from onboarding tips” |

Per-email URL props: `viewFirstLeadUrl`, `browseLeadsUrl`, `acceptLeadUrl`, `updatePaymentMethodUrl`, `browseMoreLeadsUrl` (see table above).

**Optional server-side fields** (for your CRM / ESP, not always in the JSX):

- `userId`, `signupAt`, `city`, `utm_source` at signup  
- **Locale** for spelling and currency display if you expand beyond GBP

---

## HTML templates & plain text

- **HTML:** Each file exports a React component. At send time:

  ```ts
  import { renderEmail } from "@/emails/render-email";
  import {
    ONBOARDING_EMAIL_SUBJECTS,
    OnboardingWelcomeEmail,
  } from "@/emails/onboarding";

  const { html, text } = await renderEmail(
    <OnboardingWelcomeEmail
      firstName={user.firstName}
      tradeType={user.tradeType}
      viewFirstLeadUrl={buildUrl("/leads")}
      marketingPreferencesUrl={...}
      marketingUnsubscribeUrl={...}
    />,
  );

  await sendMail({
    to: user.email,
    subject: ONBOARDING_EMAIL_SUBJECTS[1],
    html,
    text, // multipart/alternative plain text
  });
  ```

- **Plain text:** Produced automatically by `@react-email/render` with `{ plainText: true }` inside `renderEmail()`.

---

## Content summary (for CRM / legal review)

Approximate body length: **150–200 words** per email (excluding footer).

1. **Welcome:** Congratulations; 7-day series overview; first lead may be free; £25 per accept; CTA view first lead.  
2. **Find leads:** 3 steps — open list, use scoring, shortlist; habit of checking daily; CTA browse.  
3. **Accept leads:** Meaning of accept; payment at accept; speed of reply; CTA accept now.  
4. **Payments:** Lead fee £25 + Stripe vs earning from homeowner on the job; timeline; failed payment retry; CTA update payment method.  
5. **Tips:** Five numbered habits; last in series; CTA browse more; mentions preference/unsubscribe links.

---

## Compliance & classification

- Treat this sequence as **onboarding / marketing** in many jurisdictions: provide **unsubscribe** and honour it (templates include footer links when URLs are passed).  
- **Transactional** mail (receipts, security) should use separate templates and may bypass marketing unsubscribe — confirm with counsel.  
- Align all fee claims (**£25**, first lead free) with your live **Terms** and product behaviour.

---

## Testing checklist

Before enabling automation in production:

- [ ] **Render:** Run `npm run emails:verify` (includes all five onboarding templates).  
- [ ] **Subjects:** A/B only after baseline works; avoid spam triggers (excessive caps, misleading “Re:”).  
- [ ] **Links:** Every CTA and footer link resolves; `mailto:hello@tradescore.uk` opens.  
- [ ] **Personalization:** Empty `firstName` / `tradeType` fallbacks look acceptable.  
- [ ] **Unsubscribe:** Token URL expires correctly; user stops receiving onboarding but still gets required account mail.  
- [ ] **Mobile:** Open HTML in Litmus / Email on Acid or send test to iPhone + Gmail app.  
- [ ] **Dark mode:** Quick visual check (some clients invert colours).  
- [ ] **Plain text:** Readable without HTML; CTAs repeated as raw URLs.  
- [ ] **Schedule:** Day offsets correct; no duplicate sends on re-signup (idempotent job keys).  
- [ ] **Locale / pricing:** Copy matches your actual Stripe and pricing rules.

---

## File reference

```
web/src/emails/onboarding/
  types.ts           # OnboardingBaseProps
  subjects.ts        # ONBOARDING_EMAIL_SUBJECTS
  onboarding-1.tsx   # Welcome
  onboarding-2.tsx   # Find leads
  onboarding-3.tsx   # Accept leads
  onboarding-4.tsx   # Payments
  onboarding-5.tsx   # Success tips
  index.ts           # Barrel exports
```

---

*Operational guide — align sends with privacy policy and marketing consent.*
