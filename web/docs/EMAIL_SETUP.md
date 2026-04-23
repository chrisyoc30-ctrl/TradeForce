# TradeScore — Email configuration guide

This document explains how to connect **TradeScore** to an email provider, authenticate outgoing mail (SPF, DKIM, DMARC), and use the templates in `src/emails/`.

**Templates are code (React Email), not stored inside the provider by default.** You render HTML + plain text in your app (see `renderEmail` in `src/emails/render-email.ts`) and send via your provider’s API or SMTP.

---

## 1. Provider recommendations

| Provider | Best for | Notes |
|----------|----------|--------|
| **Resend** | Next.js / developer-first | Simple API, good DX; pair with React Email. |
| **Postmark** | Transactional (receipts, alerts) | Strong deliverability focus; separate streams for transactional vs broadcast. |
| **SendGrid** | Scale, marketing + transactional | Mature; configure IP warmup if high volume. |
| **Mailgun** | API + EU region options | Flexible; good for programmatic sending. |
| **Amazon SES** | Cost at scale | More setup; pair with SNS for bounces. |
| **Google Workspace / Gmail SMTP** | Very small volume, internal | Not ideal for production bulk; daily limits; use **“Send mail as”** + SPF carefully. |

**Recommendation for TradeScore:** use a **transactional email provider** (Postmark, Resend, or SendGrid) with a dedicated subdomain (e.g. `mail.tradescore.uk` or `notify.tradescore.uk`) for outbound mail.

---

## 2. DNS: SPF, DKIM, DMARC

### SPF (Sender Policy Framework)

Publish a TXT record listing which servers may send mail for your domain.

**Example** (simplified — replace with your provider’s exact value):

```txt
v=spf1 include:sendgrid.net include:stripe.com ~all
```

- Use your provider’s **include** directives (e.g. `include:spf.mtasv.net` for Postmark).
- Only one SPF TXT record per **envelope domain**; combine includes into a single record.
- Use `~all` (soft fail) or `-all` (hard fail) per your policy.

### DKIM

The provider gives you one or more **CNAME** or **TXT** records. Add them exactly as specified. DKIM signs messages so receivers can verify they were not altered.

### DMARC

Add a TXT record on `_dmarc.yourdomain.com`:

```txt
v=DMARC1; p=none; rua=mailto:dmarc@tradescore.uk; fo=1
```

- Start with `p=none` to collect reports without rejecting mail.
- Move to `quarantine` or `reject` once SPF/DKIM are stable.

### Alignment

For best deliverability, the **From** domain should align with SPF/DKIM (same organisation). Avoid random “no-reply@” on a domain you don’t control.

---

## 3. SMTP example (environment variables)

Use these variables in your backend or a Next.js Route Handler / server action that sends mail.

```env
# Example names — match your provider’s docs
SMTP_HOST=smtp.postmarkapp.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your-server-token
SMTP_PASS=your-server-token
EMAIL_FROM="TradeScore <hello@tradescore.uk>"
EMAIL_REPLY_TO=hello@tradescore.uk
```

**Typical ports**

- `587` — STARTTLS (most common).
- `465` — TLS wrapper (implicit TLS).

**Node (illustrative only — use your stack’s mailer):**

```ts
import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  secure: process.env.SMTP_SECURE === "true",
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

// const { html, text } = await renderEmail(<WelcomeTradesmanEmail ... />);
// await transporter.sendMail({ from, to, subject, html, text });
```

Use **API** sending instead of SMTP if your provider recommends it (often better observability and retries).

---

## 4. Using TradeScore templates in code

1. Import the template and `renderEmail`:

   ```ts
   import { renderEmail, WelcomeTradesmanEmail } from "@/emails";

   const { html, text } = await renderEmail(
     <WelcomeTradesmanEmail
       firstName="Alex"
       dashboardUrl="https://tradescore.uk/homeowner-dashboard"
     />,
   );
   ```

2. Send `html` and `text` as a **multipart/alternative** message so clients can show plain text if HTML fails.

3. Set **subject lines** in your send layer (not inside every template file). Suggested subjects:

   | Template | Example subject |
   |----------|------------------|
   | Welcome (tradesman) | Welcome to TradeScore — here’s how to get started |
   | Lead notification | New lead: {projectType} in {area} |
   | Payment confirmation | Payment received — lead accepted |
   | Payment failed | Action needed: payment didn’t go through |
   | Support received | We received your message (ticket {id}) |
   | Support resolved | Resolved: ticket {id} |
   | Dispute | Important: dispute update on TradeScore |

---

## 5. Provider “templates” vs repo templates

- **Repo (`src/emails/*.tsx`):** source of truth for layout and copy; versioned in Git; reviewed in PRs.
- **Provider dashboard templates:** optional duplicates for drag-and-drop teams. If you use both, define a **single owner** (usually code) to avoid drift.

**Automation rules** (e.g. Postmark triggers, SendGrid automations): map events in your product (lead created, payment succeeded) to HTTP calls that render the matching React template and send via API.

---

## 6. Bounces, complaints, and suppression

- Process **webhooks** for bounces and spam complaints; **suppress** those addresses from marketing (and optionally from transactional where invalid).
- Keep Stripe customer emails in sync if billing receipts are separate.

---

## 7. Marketing vs transactional

- **Transactional:** lead alerts, payments, support tickets, security — usually **no unsubscribe** required, but our layout still explains why the user received the email.
- **Marketing / tips:** use optional `marketingPreferencesUrl` and `marketingUnsubscribeUrl` on `WelcomeTradesmanEmail` (and any future campaigns). Honour unsubscribes in your database.

---

## 8. Verify rendering locally

From the `web` directory:

```bash
npm run emails:verify
```

This renders every template to HTML and plain text and fails if output is unexpectedly short. The script uses `tsx` with `tsconfig.emails.json` (React automatic JSX runtime) so templates match how you’ll render them in Node/API routes.

---

## 9. Checklist before go-live

- [ ] SPF, DKIM, DMARC records published and verified (provider + MXToolbox or similar).
- [ ] `From` / `Reply-To` addresses monitored (`hello@tradescore.uk`).
- [ ] Production API keys in secrets manager, not in Git.
- [ ] Bounce/complaint webhook handled.
- [ ] GDPR: privacy policy mentions transactional email; marketing has consent where required.

---

*Operational guide only — not legal advice.*
