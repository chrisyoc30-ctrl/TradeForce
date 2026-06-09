import { track } from "@/lib/fpixel";
import { getUtms } from "@/lib/utm";

type SubmissionPayload = {
  aiGrade: string;
  aiScore: number;
  projectType?: string;
};

/**
 * Central hook for lead submission events (replace with your analytics).
 */
export function trackLeadSubmitted(payload: SubmissionPayload) {
  if (typeof window !== "undefined" && "gtag" in window) {
    const w = window as unknown as { gtag: (...a: unknown[]) => void };
    w.gtag?.("event", "lead_submitted", {
      grade: payload.aiGrade,
      score: payload.aiScore,
      project_type: payload.projectType,
    });
  }
  // Meta Pixel — Lead conversion. No-op until the pixel loads after cookie consent.
  track("Lead", {
    content_name: "post_job",
    content_category: payload.projectType,
    currency: "GBP",
    value: 0,
    ...getUtms(),
  });
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics] lead_submitted", payload);
  }
}

/**
 * Meta Pixel — trade signup conversion (CompleteRegistration).
 * TODO(wire-up): call this from the tradesperson-signup form on successful
 * registration. Not yet wired so the signup form logic stays untouched on this branch.
 */
export function trackTradeRegistration(params: Record<string, unknown> = {}) {
  track("CompleteRegistration", {
    content_name: "trade_signup",
    ...getUtms(),
    ...params,
  });
}
