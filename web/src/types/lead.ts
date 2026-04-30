import type { ScoreBreakdown } from "@/lib/quote-estimate";

export type FraudRisk = "low" | "medium" | "high";

export interface Lead {
  id: string;
  name?: string;
  phone?: string;
  email?: string;
  projectType?: string;
  service?: string;
  description?: string;
  /** Postcode or area (Glasgow). */
  location?: string;
  /** Structured UK postcode when supplied by homeowner form. */
  postcode?: string;
  budget?: number | string;
  timeline?: string;
  aiScore?: number;
  aiGrade?: string;
  /** Claude AI lead scoring (Mongo `ai_*` fields, exposed as camelCase in API). */
  aiSummary?: string | null;
  aiReason?: string | null;
  aiEstimatedValue?: string | null;
  aiFlags?: string[];
  aiScoredByAI?: boolean;
  aiModelUsed?: string | null;
  aiScoredAt?: string | null;
  fraudRisk?: FraudRisk;
  scoreBreakdown?: ScoreBreakdown;
  matchConfidence?: number;
  createdAt?: string;
  /** Set when Stripe payment succeeds (webhook → Flask). */
  paymentStatus?: string;
  stripePaymentIntentId?: string;
  paidAt?: string;
  matched?: boolean;
  status?: string;
  acceptedBidId?: string;
  /** Exclusive smart matching engine (Prompt 01). */
  matchStatus?: string | null;
  matchedTradespersonId?: string | null;
  matchedTradespersonName?: string | null;
  /** Heuristic matcher score for current reservation (distinct from homeowner AI score). */
  matchScore?: number | null;
  matchAttempt?: number | null;
  previouslyOfferedTo?: string[];
  reservedUntil?: string | null;
  matchedAt?: string | null;
}

export interface CreateLeadResult {
  id: string;
  lead_id?: string;
  success?: boolean;
  ai_grade?: string;
  ai_score?: number;
  ai_summary?: string;
  ai_reason?: string;
  ai_estimated_value?: string;
  ai_flags?: string[];
  ai_scored_by_ai?: boolean;
  ai_model_used?: string;
  aiScore: number;
  aiGrade: string;
  fraudRisk: FraudRisk;
  scoreBreakdown?: ScoreBreakdown;
  aiSummary?: string;
  aiReason?: string;
  aiEstimatedValue?: string;
  aiFlags?: string[];
  aiScoredByAI?: boolean;
}

export interface MatchedTradesman {
  id: string;
  name: string;
  trade: string;
  matchScore: number;
  skills: string[];
}

export interface Bid {
  id: string;
  leadId: string;
  /** @deprecated legacy; prefer bidderName / bidderPhone */
  tradesmanId?: string;
  tradesmanName?: string;
  bidderName?: string;
  bidderPhone?: string;
  amount: number;
  description: string;
  status: string;
  createdAt?: string;
  tradesman?: { id?: string; name?: string };
}

export interface AdminMetrics {
  leads: { total: number; averageScore: number; paid: number };
  bidding: {
    total: number;
    pending: number;
    accepted: number;
    acceptanceRate: number;
  };
  tradesman: { demoPool: number };
  health: { database: boolean; api: string };
  activity: {
    recentLeads: Record<string, unknown>[];
    recentBids: Record<string, unknown>[];
  };
  aiPerformance: { gradesTracked: boolean; scoringModel: string };
  ai_scoring?: {
    total_scored: number;
    grade_a_count: number;
    grade_b_count: number;
    grade_c_count: number;
    average_score: number;
    fallback_count: number;
  };
}
