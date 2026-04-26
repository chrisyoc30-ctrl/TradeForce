import type { ReactNode } from "react";

export const metadata = {
  title: "Homeowner dashboard",
  description:
    "Look up jobs you posted on TradeScore by phone number — scores, status, and project details.",
};

export default function HomeownerDashboardLayout({
  children,
}: {
  children: ReactNode;
}) {
  return children;
}
