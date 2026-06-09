"use client";

import { usePathname } from "next/navigation";
import { useEffect } from "react";

import { pageview } from "@/lib/fpixel";
import { captureUtms } from "@/lib/utm";

/**
 * App Router does not auto-fire a Pixel PageView on client-side navigation, so we
 * do it here on each pathname change. Also captures UTM params on every load — this
 * is what catches ?utm_*= on the homepage landing before the user moves to
 * /lead-capture.
 *
 * Uses only usePathname (not useSearchParams) to avoid needing a Suspense boundary
 * in the root layout. captureUtms() reads window.location.search directly.
 */
export function PixelPageView() {
  const pathname = usePathname();
  useEffect(() => {
    captureUtms(); // global UTM capture (incl. initial landing)
    pageview(); // no-op until the pixel is loaded post-consent
  }, [pathname]);
  return null;
}
