import type { Lead } from "@/types/lead";
import { midpointForBudgetInput } from "@/lib/quote-estimate";

export function budgetLabel(lead: Lead): string {
  const b = lead.budget;
  if (b === undefined || b === null || b === "") return "—";
  if (typeof b === "number") {
    if (b <= 0) return "—";
    return `£${b.toLocaleString("en-GB")}`;
  }
  const s = String(b).trim();
  if (!s) return "—";
  if (/not sure yet/i.test(s)) return "Not sure yet";
  if (/[£$]/.test(s)) return s;
  return `£${s}`;
}

export function timelineLabel(lead: Lead): string {
  return (lead.timeline as string) || (lead as { urgency?: string }).urgency || "—";
}

export function projectTypeLabel(lead: Lead): string {
  return (lead.projectType as string) || (lead.service as string) || "Project";
}

export function locationLabel(lead: Lead): string {
  const pc = lead.postcode?.trim();
  if (pc) return pc;
  const s = (lead.location as string | undefined)?.trim();
  return s || "—";
}

/**
 * Area-only label for trades (postcode outward + "area") when API masks street-level location.
 */
export function tradesLeadLocationPreview(lead: Lead): string {
  const area = lead.contactPostcodeArea?.trim();
  if (area) return area;
  return locationLabel(lead);
}

/** Flask may return snake_case until normalised — read either form. */
export function leadMatchedTradespersonId(lead: Lead): string {
  const raw = lead as Lead & { matched_tradesperson_id?: string | null };
  return String(raw.matchedTradespersonId ?? raw.matched_tradesperson_id ?? "").trim();
}

export function leadMatchStatus(lead: Lead): string {
  const raw = lead as Lead & { match_status?: string | null };
  return String(raw.matchStatus ?? raw.match_status ?? "").trim();
}

export function leadPaymentStatus(lead: Lead): string {
  const raw = lead as Lead & { payment_status?: string | null };
  return String(raw.paymentStatus ?? raw.payment_status ?? "").trim();
}

/** Homeowner contacts are unlocked for this JSON payload (matched trade + acceptance + payment cleared). */
export function isTradeLeadContactUnlocked(lead: Lead): boolean {
  return lead.contactRevealUnlocked === true;
}

export function descriptionExcerpt(lead: Lead, max = 100): string {
  const d = (lead.description as string) || "";
  if (d.length <= max) return d;
  return `${d.slice(0, max).trimEnd()}…`;
}

export function urgencyScore(lead: Lead): number {
  const t = (lead.timeline as string | undefined)?.toLowerCase() ?? "";
  if (t.includes("this week") || t.includes("asap") || t.includes("urgent")) return 3;
  if (t.includes("this month") || t.includes("month")) return 2;
  if (t.includes("flexib")) return 0;
  return 1;
}

export function parseBudgetNumber(lead: Lead): number {
  const b = lead.budget;
  if (typeof b === "number" && !Number.isNaN(b)) return b;
  if (b === undefined || b === null) return 0;
  const fromBand = midpointForBudgetInput(b);
  if (fromBand > 0) return fromBand;
  const n = parseFloat(String(b).replace(/[£$,\s]/g, ""));
  return Number.isFinite(n) ? n : 0;
}

export function defaultMatchConfidence(lead: Lead): number {
  if (typeof lead.matchConfidence === "number") {
    return Math.round(Math.min(100, Math.max(0, lead.matchConfidence)));
  }
  const s = lead.aiScore ?? 50;
  return Math.min(100, Math.max(0, Math.round(55 + s * 0.35)));
}
