import { getPublicApiBaseUrl } from "@/lib/public-api-base";

export async function fetchValidateTradesId(id: string) {
  const base = getPublicApiBaseUrl();
  if (!base) {
    return { kind: "config" as const };
  }
  const res = await fetch(
    `${base}/api/tradesman/${encodeURIComponent(id.trim())}/validate`,
  );
  if (res.status === 404) {
    return { kind: "invalid" as const };
  }
  if (!res.ok) {
    return { kind: "error" as const };
  }
  const j = (await res.json()) as { valid?: boolean; name?: string };
  if (j.valid && j.name) {
    return { kind: "ok" as const, name: j.name };
  }
  return { kind: "invalid" as const };
}
