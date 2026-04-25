"use client";

import { useCallback, useEffect, useState } from "react";

import { Button } from "@/components/ui/button";

const STORAGE_KEY = "cookie_consent";

function readStored(): "accepted" | "declined" | null {
  if (typeof document === "undefined") return null;
  const m = document.cookie.match(/(?:^|;\s*)cookie_consent=(accepted|declined)/);
  if (m?.[1] === "accepted" || m?.[1] === "declined") return m[1];
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === "accepted" || v === "declined") return v;
  } catch {
    /* ignore */
  }
  return null;
}

function setConsent(value: "accepted" | "declined") {
  const maxAge = 60 * 60 * 24 * 365;
  const secure =
    typeof location !== "undefined" && location.protocol === "https:"
      ? "; Secure"
      : "";
  document.cookie = `cookie_consent=${value}; Path=/; Max-Age=${maxAge}; SameSite=Lax${secure}`;
  try {
    localStorage.setItem(STORAGE_KEY, value);
  } catch {
    /* ignore */
  }
  window.dispatchEvent(new Event("cookie-consent-change"));
}

/** Call after consent so gtag can load (if present). */
export function initGtagIfConsented() {
  if (typeof window === "undefined") return;
  const c = readStored();
  if (c !== "accepted") return;
  const id = process.env.NEXT_PUBLIC_GA_MEASUREMENT_ID;
  if (!id) return;
  const w = window as unknown as {
    gtag?: unknown;
    dataLayer?: unknown[];
  };
  if (w.gtag) return;
  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);
  w.dataLayer = w.dataLayer || [];
  function gtag(...args: unknown[]) {
    w.dataLayer!.push(args);
  }
  w.gtag = gtag;
  gtag("js", new Date());
  gtag("config", id, { anonymize_ip: true });
}

export function CookieConsentBanner() {
  const [visible, setVisible] = useState(false);

  const sync = useCallback(() => {
    setVisible(readStored() === null);
  }, []);

  useEffect(() => {
    sync();
    const on = () => sync();
    window.addEventListener("storage", on);
    return () => window.removeEventListener("storage", on);
  }, [sync]);

  if (!visible) return null;

  return (
    <div
      role="dialog"
      aria-label="Cookie consent"
      className="fixed bottom-0 left-0 right-0 z-[100] border-t border-border bg-card/95 p-4 shadow-lg backdrop-blur"
    >
      <div className="mx-auto flex max-w-4xl flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          We use cookies to improve your experience. By continuing, you agree
          to our use of cookies.
        </p>
        <div className="flex shrink-0 gap-2">
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setConsent("declined");
              setVisible(false);
            }}
          >
            Decline
          </Button>
          <Button
            type="button"
            size="sm"
            onClick={() => {
              setConsent("accepted");
              setVisible(false);
              initGtagIfConsented();
            }}
          >
            Accept
          </Button>
        </div>
      </div>
    </div>
  );
}
