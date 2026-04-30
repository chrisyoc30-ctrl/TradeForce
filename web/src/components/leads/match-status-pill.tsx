"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/utils";

export type ExclusiveMatchStatus =
  | "reserved"
  | "matched"
  | "declined"
  | "exhausted"
  | "unmatched"
  | string;

function clampMs(ms: number) {
  return ms < 0 ? 0 : ms;
}

function formatRemaining(ms: number): string {
  const totalMinutes = Math.floor(clampMs(ms) / 60000);
  const h = Math.floor(totalMinutes / 60);
  const m = totalMinutes % 60;
  if (h <= 0) return `${m}m`;
  return `${h}h ${m}m`;
}

export type MatchStatusPillProps = {
  matchStatus: ExclusiveMatchStatus | undefined | null;
  reservedUntil: string | null | undefined;
  className?: string;
};

export function MatchStatusPill({
  matchStatus,
  reservedUntil,
  className,
}: MatchStatusPillProps) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    if (matchStatus !== "reserved" || !reservedUntil) return;
    const tick = window.setInterval(() => setNow(Date.now()), 30_000);
    return () => window.clearInterval(tick);
  }, [matchStatus, reservedUntil]);

  const ms =
    reservedUntil &&
    typeof reservedUntil === "string" &&
    matchStatus === "reserved"
      ? clampMs(Date.parse(reservedUntil) - now)
      : NaN;

  if (!matchStatus || matchStatus === "unmatched") return null;

  if (matchStatus === "reserved" && reservedUntil && !Number.isNaN(ms)) {
    const label =
      ms <= 0
        ? "Reserved — expired"
        : `Reserved — expires in ${formatRemaining(ms)}`;
    return (
      <span
        className={cn(
          "inline-flex max-w-full items-center rounded-full border border-amber-500/50 bg-amber-500/15 px-2.5 py-0.5 text-xs font-medium text-amber-950 dark:text-amber-100",
          className
        )}
      >
        {label}
      </span>
    );
  }

  if (matchStatus === "matched") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-emerald-500/50 bg-emerald-500/15 px-2.5 py-0.5 text-xs font-medium text-emerald-900 dark:text-emerald-50",
          className
        )}
      >
        Matched
      </span>
    );
  }

  if (matchStatus === "exhausted") {
    return (
      <span
        className={cn(
          "inline-flex items-center rounded-full border border-border bg-muted/40 px-2.5 py-0.5 text-xs font-medium text-muted-foreground",
          className
        )}
      >
        No match found
      </span>
    );
  }

  return null;
}
