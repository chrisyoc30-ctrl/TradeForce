import type { FraudRisk } from "@/types/lead";

const GRADE_COLORS: Record<string, { badge: string; border: string; hex: string }> = {
  A: {
    badge: "bg-emerald-600/90 text-white",
    border: "border-emerald-500/50",
    hex: "#10b981",
  },
  B: { badge: "bg-blue-600/90 text-white", border: "border-blue-500/50", hex: "#3b82f6" },
  C: {
    badge: "bg-amber-500/90 text-amber-950",
    border: "border-amber-500/50",
    hex: "#f59e0b",
  },
  D: { badge: "bg-orange-600/90 text-white", border: "border-orange-500/50", hex: "#f97316" },
  F: { badge: "bg-red-600/90 text-white", border: "border-red-500/50", hex: "#ef4444" },
};

export function gradeClass(grade: string | undefined) {
  const g = (grade ?? "F").toUpperCase();
  return GRADE_COLORS[g] ?? GRADE_F;
}

const GRADE_F = GRADE_COLORS["F"]!;

export function fraudStyles(risk: FraudRisk | string | undefined) {
  const r = (risk ?? "low").toLowerCase() as FraudRisk;
  if (r === "high") {
    return { label: "High", className: "text-red-400 bg-red-950/50 border-red-500/40" };
  }
  if (r === "medium") {
    return { label: "Medium", className: "text-amber-200 bg-amber-950/40 border-amber-500/40" };
  }
  return { label: "Low", className: "text-emerald-200 bg-emerald-950/30 border-emerald-500/40" };
}

export function priorityMessage(grade: string) {
  const g = grade.toUpperCase();
  if (g === "A")
    return "Excellent lead! Tradesmen will prioritize this.";
  if (g === "B") return "Great lead! High demand from tradesmen.";
  if (g === "C") return "Good lead. Tradesmen are interested.";
  if (g === "D") return "Moderate interest. You may get fewer quotes.";
  return "Low priority. Consider improving details.";
}
