import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

import { getApiBaseUrl } from "@/lib/api-url";

export async function POST(
  _req: NextRequest,
  context: { params: Promise<{ leadId: string }> },
) {
  try {
    const { leadId } = await context.params;
    let base: string;
    try {
      base = getApiBaseUrl();
    } catch {
      return NextResponse.json({ ok: true });
    }

    await fetch(
      `${base}/api/leads/${encodeURIComponent(leadId)}/mark-pending`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      },
    ).catch(() => {});
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: true });
  }
}
