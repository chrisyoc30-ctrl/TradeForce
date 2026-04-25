/**
 * Public URL of the Flask API (CORS + routes under /api/*).
 * Browser uses NEXT_PUBLIC_API_URL; server-side tRPC can use API_URL.
 */
export function getApiBaseUrl(): string {
  if (typeof window !== "undefined") {
    return process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";
  }
  return process.env.API_URL ?? process.env.NEXT_PUBLIC_API_URL ?? "http://127.0.0.1:5000";
}
