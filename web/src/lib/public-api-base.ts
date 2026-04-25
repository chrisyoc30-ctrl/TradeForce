/** Browser-side Flask base URL (set NEXT_PUBLIC_API_URL in production). */
export function getPublicApiBaseUrl(): string {
  return (process.env.NEXT_PUBLIC_API_URL ?? "").replace(/\/+$/, "");
}
