import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-url";

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await context.params;
    if (!leadId?.trim()) {
      return NextResponse.json({ error: "leadId required" }, { status: 400 });
    }

    let base: string;
    try {
      base = getApiBaseUrl();
    } catch {
      return NextResponse.json(
        { canUseFree: false, tradeId: "", error: "API not configured" },
        { status: 503 },
      );
    }

    const tradeIdParam =
      new URL(req.url).searchParams.get("tradeId")?.trim() ?? "";

    const leadRes = await fetch(
      `${base}/api/leads/${encodeURIComponent(leadId)}`,
      { cache: "no-store" },
    );
    if (!leadRes.ok) {
      return NextResponse.json({ error: "Lead not found" }, { status: 404 });
    }

    const lead = (await leadRes.json()) as {
      matchedTradespersonId?: string | null;
    };
    const matched = String(lead.matchedTradespersonId ?? "").trim();
    const tradeId = tradeIdParam || matched;

    if (!tradeId) {
      return NextResponse.json({
        canUseFree: false,
        tradeId: "",
        needsTradeId: true,
      });
    }

    const st = await fetch(
      `${base}/api/tradesperson/${encodeURIComponent(tradeId)}/free-lead-status`,
      { cache: "no-store" },
    );
    if (!st.ok) {
      return NextResponse.json({
        canUseFree: false,
        tradeId,
      });
    }

    const j = (await st.json()) as { canUseFree?: boolean; tradeId?: string };
    return NextResponse.json({
      canUseFree: j.canUseFree === true,
      tradeId: j.tradeId ?? tradeId,
    });
  } catch {
    return NextResponse.json(
      { error: "Could not check free lead status" },
      { status: 500 },
    );
  }
}
