import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { AIChatBox } from "@/components/AIChatBox";
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

export const metadata: Metadata = {
  title: {
    default: "TradeScore",
    template: "%s | TradeScore",
  },
  description:
    "TradeScore connects Glasgow homeowners with verified trades. AI lead matching, transparent pricing, secure payments.",
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
            {children}
            <AIChatBox />
          </TooltipProvider>
        </TRPCProvider>
      </body>
    </html>
  );
}
