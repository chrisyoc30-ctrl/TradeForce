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

export async function GET(
  _req: Request,
  context: { params: Promise<{ filename: string }> },
) {
  const denied = await requireAdminSession();
  if (denied) return denied;
  const { filename } = await context.params;
  const safe = (filename ?? "").trim();
  if (!safe) {
    return NextResponse.json({ error: "filename required" }, { status: 400 });
  }
  let base: string;
  try {
    base = getApiBaseUrl();
  } catch {
    return NextResponse.json(
      { error: "API not configured (API_URL / NEXT_PUBLIC_API_URL)" },
      { status: 503 },
    );
  }
  const res = await fetch(
    `${base}/api/admin/verification/download/${encodeURIComponent(safe)}`,
    { cache: "no-store", headers: flaskAdminHeaders() },
  );
  if (!res.ok) {
    const t = await res.text().catch(() => "");
    return NextResponse.json(
      { error: t || res.statusText },
      { status: res.status },
    );
  }
  const buf = await res.arrayBuffer();
  const ct =
    res.headers.get("content-type") ?? "application/octet-stream";
  const cd = res.headers.get("content-disposition");
  const headers = new Headers();
  headers.set("Content-Type", ct);
  if (cd) headers.set("Content-Disposition", cd);
  return new NextResponse(buf, { status: 200, headers });
}
