import { NextResponse } from "next/server";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function stripeMode(): "live" | "test" | "missing" {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key?.trim()) return "missing";
  if (key.startsWith("sk_live_")) return "live";
  if (key.startsWith("sk_test_")) return "test";
  return "missing";
}

/**
 * Liveness / readiness probe for uptime monitors (e.g. UptimeRobot).
 * Does not expose secrets. MongoDB is not used by this Next.js app yet — see `checks.mongo`.
 */
export async function GET() {
  const mode = stripeMode();
  const body = {
    ok: true,
    service: "tradescore-web",
    timestamp: new Date().toISOString(),
    commit: process.env.VERCEL_GIT_COMMIT_SHA ?? null,
    checks: {
      stripe: {
        configured: mode !== "missing",
        mode,
      },
      mongo: "not_configured" as const,
    },
  };

  return NextResponse.json(body, {
    status: 200,
    headers: {
      "Cache-Control": "no-store, max-age=0",
    },
  });
}
