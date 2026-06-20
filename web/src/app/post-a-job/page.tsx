import { permanentRedirect } from "next/navigation";

/**
 * Route kept for old links; job posting is at /lead-capture.
 * Permanent (308) redirect so browsers + search engines cache it and skip the
 * round-trip on repeat visits. (Next App Router emits 308 for a permanent
 * redirect — the method-preserving equivalent of a 301.)
 */
export default function PostAJob() {
  permanentRedirect("/lead-capture");
}
