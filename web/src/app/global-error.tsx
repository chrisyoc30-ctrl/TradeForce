"use client";

import { useEffect } from "react";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

/**
 * Catches errors in the root layout. Must include html/body.
 * @see https://nextjs.org/docs/app/api-reference/file-conventions/error#global-error
 */
export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[global error]", error);
  }, [error]);

  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-dvh antialiased`}
      >
        <div className="flex min-h-dvh flex-col items-center justify-center gap-4 px-4 py-16 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Application error</h1>
          <p className="max-w-md text-sm text-muted-foreground">
            {error.message || "A critical error occurred. Please refresh the page."}
          </p>
          <button
            type="button"
            onClick={() => reset()}
            className="inline-flex h-10 items-center justify-center rounded-md border border-border bg-primary px-5 text-sm font-medium text-primary-foreground shadow hover:opacity-90"
          >
            Try again
          </button>
        </div>
      </body>
    </html>
  );
}
