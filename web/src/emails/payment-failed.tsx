import { Section, Text } from "@react-email/components";

import {
  EmailCta,
  EmailDivider,
  EmailHeading,
  EmailLead,
  EmailMuted,
  TradeScoreLayout,
} from "./components/trade-score-layout";
import { EMAIL_BRAND } from "./constants";

export type PaymentFailedEmailProps = {
  recipientName: string;
  amountFormatted: string;
  leadReference?: string;
  /** User-facing reason, e.g. "Card declined" — avoid raw processor codes. */
  reason?: string;
  retryPaymentUrl: string;
};

export function PaymentFailedEmail({
  recipientName,
  amountFormatted,
  leadReference,
  reason,
  retryPaymentUrl,
}: PaymentFailedEmailProps) {
  const name = recipientName.trim() || "there";

  return (
    <TradeScoreLayout
      preview={`We couldn’t process your ${amountFormatted} payment on TradeScore — here’s what to do next.`}
    >
      <EmailHeading>Payment didn’t go through</EmailHeading>
      <EmailLead>
        Hi {name}, we weren’t able to complete your payment of{" "}
        <strong>{amountFormatted}</strong>. Your lead is not confirmed until
        payment succeeds — but you can try again in a few clicks.
      </EmailLead>
      {reason ? (
        <EmailMuted>
          <strong>Details:</strong> {reason}
        </EmailMuted>
      ) : null}
      {leadReference ? (
        <Section
          style={{
            backgroundColor: "#fff7ed",
            borderRadius: "8px",
            padding: "14px 16px",
            border: `1px solid #fed7aa`,
          }}
        >
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: "22px",
              color: EMAIL_BRAND.text,
            }}
          >
            <strong>Lead reference:</strong> {leadReference}
          </Text>
        </Section>
      ) : null}
      <EmailMuted>
        Common fixes: check your card details, try another card, or contact
        your bank. If the problem continues, we’re here to help.
      </EmailMuted>
      <EmailCta href={retryPaymentUrl}>Retry payment</EmailCta>
      <EmailDivider />
      <EmailMuted>
        Still stuck? Reply to this email or write to {EMAIL_BRAND.supportEmail}{" "}
        and we’ll look into it.
      </EmailMuted>
    </TradeScoreLayout>
  );
}
