import { cookies } from "next/headers";
import { NextResponse } from "next/server";

import { getExpectedAdminSessionToken } from "@/lib/admin-auth";

export async function POST(request: Request) {
  const expected = await getExpectedAdminSessionToken();
  if (!expected) {
    return NextResponse.json(
      { error: "ADMIN_PASSWORD is not set on the server" },
      { status: 503 }
    );
  }
  let body: { password?: string } = {};
  try {
    body = (await request.json()) as { password?: string };
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const password = (body.password ?? "").trim();
  if (password !== (process.env.ADMIN_PASSWORD ?? "")) {
    return NextResponse.json({ error: "Invalid password" }, { status: 401 });
  }
  const store = await cookies();
  const isProd = process.env.NODE_ENV === "production";
  const token = await getExpectedAdminSessionToken();
  store.set("tradescore_admin_session", token, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
    secure: isProd,
  });
  return NextResponse.json({ ok: true });
}
