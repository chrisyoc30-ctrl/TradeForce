import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { verifyAdminSessionToken } from "@/lib/admin-auth";
import { getApiBaseUrl } from "@/lib/api-url";
import { flaskAdminHeaders } from "@/lib/flask-admin-headers";

async function requireAdminSession(): Promise<NextResponse | null> {
  const token = (await cookies()).get("tradescore_admin_session")?.value;
  if (!(await verifyAdminSessionToken(token))) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return null;
}

export async function GET() {
  const denied = await requireAdminSession();
  if (denied) return denied;
  let base: string;
  try {
    base = getApiBaseUrl();
  } catch {
    return NextResponse.json(
      { error: "API not configured (API_URL / NEXT_PUBLIC_API_URL)" },
      { status: 503 },
    );
  }
  const res = await fetch(`${base}/api/admin/verification/pending`, {
    cache: "no-store",
    headers: flaskAdminHeaders(),
  });
  const body = await res.text();
  return new NextResponse(body, {
    status: res.status,
    headers: {
      "Content-Type": res.headers.get("content-type") ?? "application/json",
    },
  });
}
