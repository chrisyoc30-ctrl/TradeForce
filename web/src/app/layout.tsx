import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AIChatBox } from "@/components/AIChatBox";
import { CookieGtagInit } from "@/components/cookie-gtag-init";
import { HomeHeader } from "@/components/homepage/home-header";
import { TooltipProvider } from "@/components/ui/tooltip";
import { TRPCProvider } from "@/trpc/react";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const metadataBaseUrl =
  (process.env.NEXT_PUBLIC_SITE_URL || "").trim() || "https://tradescore.uk";

export const metadata: Metadata = {
  metadataBase: new URL(metadataBaseUrl),
  title: {
    default: "TradeScore",
    template: "TradeScore | %s",
  },
  description:
    "TradeScore connects Glasgow homeowners with verified local tradespeople. Post a job free — trades pay £25 per lead, no commission.",
  openGraph: {
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <TRPCProvider>
          <TooltipProvider delay={0}>
            <HomeHeader />
            {children}
            <AIChatBox />
            <CookieGtagInit />
          </TooltipProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
