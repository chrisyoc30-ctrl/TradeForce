"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import {
  AUTH_CHANGED_EVENT,
  HOMEOWNER_SESSION_PHONE_KEY,
} from "@/lib/auth-nav";

export type AuthUser = {
  phone: string;
};

function readStoredUser(): AuthUser | null {
  if (typeof window === "undefined") return null;
  try {
    const p = sessionStorage.getItem(HOMEOWNER_SESSION_PHONE_KEY);
    const t = p?.trim();
    return t ? { phone: t } : null;
  } catch {
    return null;
  }
}

/**
 * Mirrors the Cursor checklist hook shape — TradeScore homeowner “sign-in” is a
 * dashboard phone lookup persisted in sessionStorage for this browser tab/window only.
 */
export function useAuth() {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  const sync = useCallback(() => {
    setUser(readStoredUser());
  }, []);

  useEffect(() => {
    sync();
    setLoading(false);

    window.addEventListener("storage", sync);
    window.addEventListener(AUTH_CHANGED_EVENT, sync);
    window.addEventListener("focus", sync);

    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(AUTH_CHANGED_EVENT, sync);
      window.removeEventListener("focus", sync);
    };
  }, [sync]);

  return useMemo(
    () => ({
      user,
      loading,
      /** True when homeowner session phone is stored after a dashboard lookup */
      isAuthenticated: Boolean(user?.phone),
    }),
    [user, loading],
  );
}
