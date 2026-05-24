import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Trade Verification — TradeScore",
  description:
    "Submit verification documents and business details to earn trust badges on TradeScore.",
};

export default function VerifyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
