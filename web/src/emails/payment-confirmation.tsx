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

export type PaymentConfirmationEmailProps = {
  recipientName: string;
  amountFormatted: string;
  leadReference: string;
  projectSummary?: string;
  /** Homeowner or contact name (from lead) when we have it. */
  homeownerName?: string;
  /** Short project title, e.g. project type. */
  leadTitle?: string;
  dashboardUrl: string;
  /** First accepted lead — no Stripe payment. */
  isFirstLeadFree?: boolean;
  /** Unlimited monthly plan — included in subscription. */
  isSubscriptionIncluded?: boolean;
};

export function PaymentConfirmationEmail({
  recipientName,
  amountFormatted,
  leadReference,
  projectSummary,
  homeownerName,
  leadTitle,
  dashboardUrl,
  isFirstLeadFree = false,
  isSubscriptionIncluded = false,
}: PaymentConfirmationEmailProps) {
  const name = recipientName.trim() || "there";
  const hasMatchCopy = Boolean(
    (homeownerName && homeownerName.trim()) || (leadTitle && leadTitle.trim())
  );
  const preview = isSubscriptionIncluded
    ? `Lead accepted on TradeScore — included in your subscription.`
    : isFirstLeadFree
      ? `Your first lead is unlocked on TradeScore — no payment needed.`
      : `Payment of ${amountFormatted} received — lead accepted on TradeScore.`;

  return (
    <TradeScoreLayout preview={preview}>
      <EmailHeading>
        {isSubscriptionIncluded
          ? "Lead included in your plan"
          : isFirstLeadFree
            ? "First lead unlocked — free"
            : "Payment received"}
      </EmailHeading>
      <EmailLead>
        {isSubscriptionIncluded ? (
          <>
            Hi {name}, this lead is <strong>included in your TradeScore Unlimited</strong>{" "}
            subscription — no per-lead payment was taken. Your lead is confirmed and
            unlocked.
          </>
        ) : isFirstLeadFree ? (
          <>
            Hi {name}, your <strong>first lead on TradeScore is free</strong> — no
            payment was taken. Your lead is confirmed and unlocked.
          </>
        ) : (
          <>
            Hi {name}, we’ve successfully received your payment of{" "}
            <strong>{amountFormatted}</strong>. Your lead is confirmed.
          </>
        )}
      </EmailLead>
      {hasMatchCopy ? (
        <Text
          style={{
            fontSize: "15px",
            lineHeight: "24px",
            color: EMAIL_BRAND.muted,
            margin: "0 0 16px 0",
          }}
        >
          {homeownerName && homeownerName.trim() ? (
            <>
              You&apos;re now matched with{" "}
              <strong style={{ color: EMAIL_BRAND.text }}>
                {homeownerName.trim()}
              </strong>
              {leadTitle && leadTitle.trim() ? (
                <> for: {leadTitle.trim()}</>
              ) : null}
            </>
          ) : leadTitle && leadTitle.trim() ? (
            <>Project: {leadTitle.trim()}</>
          ) : null}
        </Text>
      ) : null}
      <Section
        style={{
          backgroundColor: EMAIL_BRAND.pageBg,
          borderRadius: "8px",
          padding: "16px 18px",
          border: `1px solid ${EMAIL_BRAND.border}`,
        }}
      >
        <Text
          style={{
            margin: "0 0 8px",
            fontSize: "14px",
            color: EMAIL_BRAND.muted,
          }}
        >
          <strong style={{ color: EMAIL_BRAND.text }}>Lead reference:</strong>{" "}
          {leadReference}
        </Text>
        {projectSummary ? (
          <Text
            style={{
              margin: 0,
              fontSize: "14px",
              lineHeight: "22px",
              color: EMAIL_BRAND.muted,
            }}
          >
            <strong style={{ color: EMAIL_BRAND.text }}>Job:</strong>{" "}
            {projectSummary}
          </Text>
        ) : null}
      </Section>
      <EmailMuted>
        You can view this lead anytime in your dashboard. Thank you for using{" "}
        {EMAIL_BRAND.name}.
      </EmailMuted>
      <EmailCta href={dashboardUrl}>View lead in dashboard</EmailCta>
      <EmailDivider />
      <EmailMuted>
        {isSubscriptionIncluded
          ? `Questions about your subscription? Email ${EMAIL_BRAND.supportEmail} with your lead reference.`
          : isFirstLeadFree
            ? `Questions about your free first lead? Email ${EMAIL_BRAND.supportEmail} with your lead reference.`
            : `Receipt questions? Email ${EMAIL_BRAND.supportEmail} with your lead reference and we’ll help.`}
      </EmailMuted>
    </TradeScoreLayout>
  );
}
