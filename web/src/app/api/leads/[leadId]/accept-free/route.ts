import { NextResponse } from "next/server";

import {
  descriptionExcerpt,
  projectTypeLabel,
} from "@/components/leads/lead-helpers";
import {
  getLeadDetailUrl,
  sendPaymentConfirmationEmail,
} from "@/emails/email-service";
import { getApiBaseUrl } from "@/lib/api-url";
import { internalFlaskHeaders } from "@/lib/flask-internal-fetch";
import type { Lead } from "@/types/lead";

export const runtime = "nodejs";

export async function POST(
  req: Request,
  context: { params: Promise<{ leadId: string }> },
) {
  const { leadId } = await context.params;
  if (!leadId?.trim()) {
    return NextResponse.json({ error: "leadId required" }, { status: 400 });
  }

  let body: {
    tradespersonId?: string;
    fullName?: string;
    email?: string;
  };
  try {
    body = (await req.json()) as typeof body;
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const tid = (body.tradespersonId ?? "").trim();
  if (!tid) {
    return NextResponse.json({ error: "tradespersonId required" }, { status: 400 });
  }

  let base: string;
  try {
    base = getApiBaseUrl();
  } catch {
    return NextResponse.json({ error: "API not configured" }, { status: 503 });
  }

  const res = await fetch(
    `${base}/api/leads/${encodeURIComponent(leadId)}/accept-free`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tradesperson_id: tid }),
    },
  );

  const text = await res.text();
  let data: Record<string, unknown> = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* ignore */
  }

  if (!res.ok) {
    return NextResponse.json(
      {
        error:
          typeof data.error === "string"
            ? data.error
            : text || "Could not accept lead",
      },
      { status: res.status },
    );
  }

  const name = (body.fullName ?? "").trim() || "there";
  const email = (body.email ?? "").trim();
  if (email) {
    try {
      const lr = await fetch(
        `${base}/api/leads/${encodeURIComponent(leadId)}`,
        { cache: "no-store", headers: internalFlaskHeaders() },
      );
      let leadTitle = "Project";
      let homeownerName = "Your client";
      let projectSummary: string | undefined;
      if (lr.ok) {
        const lead = (await lr.json()) as Lead;
        leadTitle = projectTypeLabel(lead);
        homeownerName = (lead.name && lead.name.trim()) || "Your client";
        projectSummary = descriptionExcerpt(lead, 200);
      }
      await sendPaymentConfirmationEmail({
        tradesmanEmail: email,
        tradesmanName: name,
        leadId,
        leadTitle,
        homeownerName,
        projectSummary,
        dashboardUrl: getLeadDetailUrl(leadId),
        isFirstLeadFree: true,
      });
    } catch (e) {
      console.error("[accept-free] confirmation email failed (ignored):", e);
    }
  }

  return NextResponse.json({
    success: true,
    paymentStatus: data.paymentStatus ?? "free_first",
    idempotent: data.idempotent === true,
  });
}
