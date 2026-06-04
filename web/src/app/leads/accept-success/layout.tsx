import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Lead accepted | TradeScore",
  description: "Your lead acceptance was successful",
};

export default function AcceptSuccessLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return children;
}
