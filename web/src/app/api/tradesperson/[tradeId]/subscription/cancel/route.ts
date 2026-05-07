import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-url";

export async function POST(
  _req: Request,
  context: { params: Promise<{ tradeId: string }> },
) {
  let tradeId: string;
  try {
    tradeId = (await context.params).tradeId?.trim() ?? "";
  } catch {
    tradeId = "";
  }
  if (!tradeId) {
    return NextResponse.json({ error: "tradeId required" }, { status: 400 });
  }

  const secret = process.env.INTERNAL_WEBHOOK_SECRET;
  let base: string;
  try {
    base = getApiBaseUrl();
  } catch {
    return NextResponse.json({ error: "API not configured" }, { status: 503 });
  }
  if (!secret?.trim()) {
    return NextResponse.json(
      { error: "INTERNAL_WEBHOOK_SECRET not configured" },
      { status: 503 },
    );
  }

  const res = await fetch(
    `${base.replace(/\/$/, "")}/api/tradesperson/${encodeURIComponent(tradeId)}/subscription/cancel`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Internal-Secret": secret,
      },
    },
  );

  const text = await res.text();
  let data: unknown = {};
  try {
    data = JSON.parse(text) as Record<string, unknown>;
  } catch {
    /* raw */
  }
  if (!res.ok) {
    const err =
      typeof (data as { error?: unknown })?.error === "string"
        ? (data as { error: string }).error
        : text || "Could not cancel";
    return NextResponse.json({ error: err }, { status: res.status });
  }
  return NextResponse.json({ success: true });
}
