import { TRADESMAN_LEAD_PRICE_GBP } from "@/lib/pricing";
import { PaymentConfirmationEmail } from "./payment-confirmation";
import { renderEmail } from "./render-email";

function getAppBaseUrl(): string {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ??
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : undefined);
  if (raw) {
    return raw.startsWith("http") ? raw : `https://${raw}`;
  }
  return "http://localhost:3000";
}

/**
 * Trades view for open work — keep in sync with app routes.
 * Override with NEXT_PUBLIC_TRADES_APP_PATH (e.g. /dashboard/bids).
 */
export function getTradesDashboardUrl(): string {
  const path =
    process.env.NEXT_PUBLIC_TRADES_APP_PATH?.trim() || "/available-jobs";
  const base = getAppBaseUrl().replace(/\/$/, "");
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base}${p}`;
}

/** Lead detail page the tradesman paid to accept. */
export function getLeadDetailUrl(leadId: string): string {
  const base = getAppBaseUrl().replace(/\/$/, "");
  return `${base}/leads/${encodeURIComponent(leadId)}`;
}

/**
 * Send payment confirmation email to the tradesman after Stripe reports success.
 * Console-only until a provider (e.g. SendGrid) is configured.
 */
export async function sendPaymentConfirmationEmail({
  tradesmanEmail,
  tradesmanName,
  leadId,
  leadTitle,
  amountGbp = TRADESMAN_LEAD_PRICE_GBP,
  homeownerName,
  projectSummary,
  dashboardUrl,
}: {
  tradesmanEmail: string;
  tradesmanName: string;
  leadId: string;
  leadTitle: string;
  amountGbp?: number;
  homeownerName: string;
  projectSummary?: string;
  dashboardUrl: string;
}): Promise<{ success: true; email: string }> {
  const amountFormatted = `£${amountGbp.toFixed(2)}`;

  const { html, text } = await renderEmail(
    <PaymentConfirmationEmail
      recipientName={tradesmanName}
      amountFormatted={amountFormatted}
      leadReference={leadId}
      leadTitle={leadTitle}
      homeownerName={homeownerName}
      projectSummary={projectSummary}
      dashboardUrl={dashboardUrl}
    />,
  );

  const subject = `Payment confirmed — ${amountFormatted}`;

  // TODO: plug in SendGrid / Resend / etc.
  console.log(`
📧 PAYMENT CONFIRMATION EMAIL
To: ${tradesmanEmail}
Subject: ${subject}

Text preview (first 200 chars):
${text.slice(0, 200)}${text.length > 200 ? "…" : ""}

HTML preview (first 200 chars):
${html.slice(0, 200)}${html.length > 200 ? "…" : ""}
`);

  return { success: true, email: tradesmanEmail };
}
