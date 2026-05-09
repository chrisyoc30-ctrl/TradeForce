/** Headers for server-side Next.js → Flask admin routes when ADMIN_SECRET is set. */
export function flaskAdminHeaders(): Record<string, string> {
  const secret = process.env.ADMIN_SECRET ?? "";
  if (!secret) return {};
  return { "X-Admin-Secret": secret };
}
