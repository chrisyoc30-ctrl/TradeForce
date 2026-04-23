import {
  Body,
  Container,
  Head,
  Heading,
  Hr,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from "@react-email/components";
import type { ReactNode } from "react";

import { EMAIL_BRAND, fontStack } from "../constants";

export type TradeScoreLayoutProps = {
  preview: string;
  children: ReactNode;
  /** Optional: show marketing unsubscribe + preferences (omit for purely transactional). */
  marketingPreferencesUrl?: string;
  marketingUnsubscribeUrl?: string;
};

export function TradeScoreLayout({
  preview,
  children,
  marketingPreferencesUrl,
  marketingUnsubscribeUrl,
}: TradeScoreLayoutProps) {
  const showMarketingLinks =
    Boolean(marketingPreferencesUrl) || Boolean(marketingUnsubscribeUrl);

  return (
    <Html lang="en">
      <Head />
      <Preview>{preview}</Preview>
      <Body
        style={{
          backgroundColor: EMAIL_BRAND.pageBg,
          fontFamily: fontStack,
          margin: 0,
          padding: "24px 16px",
        }}
      >
        <Container
          style={{
            maxWidth: "560px",
            margin: "0 auto",
          }}
        >
          <Section
            style={{
              textAlign: "center",
              marginBottom: "20px",
            }}
          >
            <Text
              style={{
                margin: 0,
                fontSize: "22px",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: EMAIL_BRAND.text,
              }}
            >
              <span style={{ color: EMAIL_BRAND.accent }}>Trade</span>
              Score
            </Text>
          </Section>

          <Section
            style={{
              backgroundColor: EMAIL_BRAND.cardBg,
              borderRadius: "12px",
              border: `1px solid ${EMAIL_BRAND.border}`,
              padding: "32px 28px",
              boxShadow: "0 1px 3px rgba(0,0,0,0.06)",
            }}
          >
            {children}
          </Section>

          <Section style={{ paddingTop: "24px", paddingBottom: "8px" }}>
            <Text
              style={{
                margin: "0 0 12px",
                fontSize: "13px",
                lineHeight: "20px",
                color: EMAIL_BRAND.muted,
                textAlign: "center",
              }}
            >
              Questions?{" "}
              <Link
                href={EMAIL_BRAND.supportMailto}
                style={{ color: EMAIL_BRAND.accent, fontWeight: 600 }}
              >
                {EMAIL_BRAND.supportEmail}
              </Link>
            </Text>
            <Text
              style={{
                margin: 0,
                fontSize: "12px",
                lineHeight: "18px",
                color: EMAIL_BRAND.muted,
                textAlign: "center",
              }}
            >
              © {new Date().getFullYear()} {EMAIL_BRAND.name} ·{" "}
              <Link
                href={EMAIL_BRAND.siteUrl}
                style={{ color: EMAIL_BRAND.muted, textDecoration: "underline" }}
              >
                {EMAIL_BRAND.siteUrl.replace(/^https:\/\//, "")}
              </Link>
            </Text>
            {showMarketingLinks ? (
              <Text
                style={{
                  margin: "12px 0 0",
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: EMAIL_BRAND.muted,
                  textAlign: "center",
                }}
              >
                {marketingPreferencesUrl ? (
                  <>
                    <Link
                      href={marketingPreferencesUrl}
                      style={{ color: EMAIL_BRAND.muted }}
                    >
                      Email preferences
                    </Link>
                    {marketingUnsubscribeUrl ? " · " : ""}
                  </>
                ) : null}
                {marketingUnsubscribeUrl ? (
                  <Link
                    href={marketingUnsubscribeUrl}
                    style={{ color: EMAIL_BRAND.muted }}
                  >
                    Unsubscribe from marketing
                  </Link>
                ) : null}
              </Text>
            ) : (
              <Text
                style={{
                  margin: "12px 0 0",
                  fontSize: "12px",
                  lineHeight: "18px",
                  color: EMAIL_BRAND.muted,
                  textAlign: "center",
                }}
              >
                You’re receiving this because you use {EMAIL_BRAND.name} or
                recently interacted with your account.
              </Text>
            )}
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export function EmailHeading({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <Heading
      as="h1"
      style={{
        margin: "0 0 16px",
        fontSize: "22px",
        lineHeight: "28px",
        fontWeight: 700,
        color: EMAIL_BRAND.text,
      }}
    >
      {children}
    </Heading>
  );
}

export function EmailLead({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 20px",
        fontSize: "16px",
        lineHeight: "24px",
        color: EMAIL_BRAND.text,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailMuted({ children }: { children: ReactNode }) {
  return (
    <Text
      style={{
        margin: "0 0 16px",
        fontSize: "14px",
        lineHeight: "22px",
        color: EMAIL_BRAND.muted,
      }}
    >
      {children}
    </Text>
  );
}

export function EmailCta({
  href,
  children,
}: {
  href: string;
  children: ReactNode;
}) {
  return (
    <Section style={{ textAlign: "center", margin: "28px 0 8px" }}>
      <Link
        href={href}
        style={{
          display: "inline-block",
          backgroundColor: EMAIL_BRAND.accent,
          color: "#ffffff",
          fontSize: "15px",
          fontWeight: 600,
          textDecoration: "none",
          textAlign: "center",
          padding: "14px 28px",
          borderRadius: "8px",
          lineHeight: "1",
        }}
      >
        {children}
      </Link>
    </Section>
  );
}

export function EmailDivider() {
  return (
    <Hr
      style={{
        borderColor: EMAIL_BRAND.border,
        margin: "24px 0",
      }}
    />
  );
}
