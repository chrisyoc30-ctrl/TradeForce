/**
 * Verifies all TradeScore React Email templates render to HTML + plain text.
 * Run: npm run emails:verify
 */
import { renderEmail } from "../src/emails/render-email";
import { DisputeNotificationEmail } from "../src/emails/dispute-notification";
import { LeadNotificationEmail } from "../src/emails/lead-notification";
import { PaymentConfirmationEmail } from "../src/emails/payment-confirmation";
import { PaymentFailedEmail } from "../src/emails/payment-failed";
import { SupportTicketReceivedEmail } from "../src/emails/support-ticket-received";
import { SupportTicketResolvedEmail } from "../src/emails/support-ticket-resolved";
import { WelcomeTradesmanEmail } from "../src/emails/welcome-tradesman";
import {
  OnboardingAcceptLeadsEmail,
  OnboardingFindLeadsEmail,
  OnboardingPaymentsEmail,
  OnboardingSuccessTipsEmail,
  OnboardingWelcomeEmail,
} from "../src/emails/onboarding";

const base = "https://tradescore.uk";
const prefs = `${base}/settings/email`;
const unsub = `${base}/unsubscribe`;

async function main() {
  const checks: { name: string; htmlLen: number; textLen: number }[] = [];

  const push = async (name: string, el: Parameters<typeof renderEmail>[0]) => {
    const { html, text } = await renderEmail(el);
    if (html.length < 200) {
      throw new Error(`${name}: HTML unexpectedly short (${html.length} chars)`);
    }
    if (text.length < 80) {
      throw new Error(`${name}: plain text unexpectedly short (${text.length} chars)`);
    }
    checks.push({ name, htmlLen: html.length, textLen: text.length });
  };

  await push(
    "welcome-tradesman",
    <WelcomeTradesmanEmail
      firstName="Alex"
      dashboardUrl={`${base}/homeowner-dashboard`}
      marketingPreferencesUrl={`${base}/settings/email`}
      marketingUnsubscribeUrl={`${base}/unsubscribe`}
    />,
  );

  await push(
    "lead-notification",
    <LeadNotificationEmail
      tradesmanName="Alex"
      projectType="Bathroom refurbishment"
      location="Glasgow, G41"
      leadSummary="Homeowner needs full bathroom update, flexible start date."
      acceptLeadUrl={`${base}/submit-quote/sample-lead`}
      urgencyNote="Other trades are viewing this lead — review soon."
    />,
  );

  await push(
    "payment-confirmation",
    <PaymentConfirmationEmail
      recipientName="Alex"
      amountFormatted="£25"
      leadReference="LD-2026-0042"
      projectSummary="Kitchen tiling — estimate agreed"
      dashboardUrl={`${base}/homeowner-dashboard`}
    />,
  );

  await push(
    "payment-failed",
    <PaymentFailedEmail
      recipientName="Alex"
      amountFormatted="£25"
      leadReference="LD-2026-0042"
      reason="Your bank declined the transaction."
      retryPaymentUrl={`${base}/submit-quote/sample-lead`}
    />,
  );

  await push(
    "support-ticket-received",
    <SupportTicketReceivedEmail
      recipientName="Alex"
      ticketId="TS-9182"
      subjectLine="Question about lead fees"
      helpCenterUrl={`${base}/faq`}
    />,
  );

  await push(
    "support-ticket-resolved",
    <SupportTicketResolvedEmail
      recipientName="Alex"
      ticketId="TS-9182"
      resolutionSummary="We’ve clarified that the first accepted lead may be free per your plan; further accepts are £25 as shown in your dashboard."
      reopenOrFeedbackUrl={`mailto:hello@tradescore.uk`}
    />,
  );

  await push(
    "dispute-notification",
    <DisputeNotificationEmail
      recipientName="Alex"
      disputeId="DSP-1044"
      roleLabel="tradesperson"
      summary="A homeowner has raised a concern about work quality on job reference LD-2026-0042."
      respondUrl={`${base}/homeowner-dashboard`}
      deadlineNote="Please respond within 5 business days."
    />,
  );

  const onboardBase = {
    firstName: "Alex",
    tradeType: "electrician",
    marketingPreferencesUrl: prefs,
    marketingUnsubscribeUrl: unsub,
  };

  await push(
    "onboarding-1-welcome",
    <OnboardingWelcomeEmail
      {...onboardBase}
      viewFirstLeadUrl={`${base}/leads`}
    />,
  );
  await push(
    "onboarding-2-find-leads",
    <OnboardingFindLeadsEmail
      {...onboardBase}
      browseLeadsUrl={`${base}/leads`}
    />,
  );
  await push(
    "onboarding-3-accept-leads",
    <OnboardingAcceptLeadsEmail
      {...onboardBase}
      acceptLeadUrl={`${base}/submit-quote/sample-lead`}
    />,
  );
  await push(
    "onboarding-4-payments",
    <OnboardingPaymentsEmail
      {...onboardBase}
      updatePaymentMethodUrl={`${base}/tradesman-signup`}
    />,
  );
  await push(
    "onboarding-5-success-tips",
    <OnboardingSuccessTipsEmail
      {...onboardBase}
      browseMoreLeadsUrl={`${base}/leads`}
    />,
  );

  console.log("All email templates rendered OK:\n");
  for (const c of checks) {
    console.log(`  ${c.name}: HTML ${c.htmlLen} chars, text ${c.textLen} chars`);
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
