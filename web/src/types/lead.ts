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
}

export interface CreateLeadResult {
  id: string;
  aiScore: number;
  aiGrade: string;
  fraudRisk: FraudRisk;
  scoreBreakdown?: ScoreBreakdown;
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
}
