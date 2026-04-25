"use client";

import { useEffect } from "react";

import { CookieConsentBanner, initGtagIfConsented } from "@/components/cookie-consent-banner";

export function CookieGtagInit() {
  useEffect(() => {
    initGtagIfConsented();
  }, []);
  return <CookieConsentBanner />;
}
