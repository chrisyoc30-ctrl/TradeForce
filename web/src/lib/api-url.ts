/**
 * Public URL of the Flask API (CORS + routes under /api/*).
 * - **Server (tRPC):** set `API_URL` in Railway to the Flask service **public** URL (read at
 *   runtime; preferred over `NEXT_PUBLIC_*` for server-side fetch).
 * - **Browser:** set `NEXT_PUBLIC_API_URL` if any client code calls the API directly; must be
 *   available at `next build` for that bundle.
 * Trailing slashes are stripped.
 */
function normalizeBaseUrl(url: string): string {
  return url.replace(/\/+$/, "");
}

export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    const base =
      process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";
    return normalizeBaseUrl(base);
  }

  const fromEnv = process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL;
  if (process.env.RAILWAY_ENVIRONMENT && !fromEnv) {
    throw new Error(
      "Set API_URL on the Next.js service to your Flask public URL, e.g. https://<flask-service>.up.railway.app (no trailing slash). Server-side tRPC will not work against 127.0.0.1 on Railway."
    );
  }
  const base = fromEnv ?? "http://127.0.0.1:5000";
  return normalizeBaseUrl(base);
}
