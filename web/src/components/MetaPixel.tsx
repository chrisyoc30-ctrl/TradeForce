"use client";

import { useEffect } from "react";

import { initPixelIfConsented } from "@/lib/fpixel";

/**
 * Loads the Meta Pixel — but ONLY after cookie consent is accepted.
 *
 * Mirrors `CookieGtagInit`: tries to init on mount (covers returning visitors who
 * already accepted) and re-tries when the consent banner dispatches
 * "cookie-consent-change" (covers the user clicking Accept this visit).
 *
 * NOTE: this relies on the EXISTING consent banner (cookie-consent-banner.tsx).
 * No CookieYes / third-party CMP is needed — the pixel is gated by the same
 * `cookie_consent` signal that gates Google Analytics.
 */
export function MetaPixel() {
  useEffect(() => {
    initPixelIfConsented();
    const onConsent = () => initPixelIfConsented();
    window.addEventListener("cookie-consent-change", onConsent);
    return () => window.removeEventListener("cookie-consent-change", onConsent);
  }, []);
  return null;
}
