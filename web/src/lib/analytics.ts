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
  if (process.env.NODE_ENV === "development") {
    console.info("[analytics] lead_submitted", payload);
  }
}
