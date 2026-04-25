"use client";

import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";

const TRADES = [
  "Plumber",
  "Electrician",
  "Joiner",
  "General",
] as const;

export function NotifyMeInline() {
  const [email, setEmail] = useState("");
  const [tradeType, setTradeType] = useState<string>(TRADES[0]!);
  const [msg, setMsg] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <div className="rounded-xl border border-border/80 bg-muted/5 p-6">
      <h3 className="text-sm font-semibold text-foreground">
        Get notified when leads match you
      </h3>
      <p className="mt-1 text-xs text-muted-foreground">
        Leave your email and trade — we&apos;ll only use this to ping you about
        relevant work in Glasgow.
      </p>
      <form
        className="mt-4 flex max-w-md flex-col gap-3 sm:flex-row sm:items-end"
        onSubmit={async (e) => {
          e.preventDefault();
          setErr(null);
          setMsg(null);
          const base = getPublicApiBaseUrl();
          if (!base) {
            setErr("App is not configured with NEXT_PUBLIC_API_URL.");
            return;
          }
          setPending(true);
          try {
            const res = await fetch(`${base}/api/notify-me`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ email: email.trim(), tradeType }),
            });
            if (!res.ok) {
              const j = (await res.json().catch(() => ({}))) as { error?: string };
              setErr(j.error ?? "Could not save");
              return;
            }
            setMsg("You’re on the list — we’ll be in touch.");
            setEmail("");
          } catch {
            setErr("Network error — try again.");
          } finally {
            setPending(false);
          }
        }}
      >
        <div className="grid flex-1 gap-2">
          <Label htmlFor="notify-email">Email</Label>
          <Input
            id="notify-email"
            type="email"
            required
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@example.com"
            autoComplete="email"
          />
        </div>
        <div className="grid w-full gap-2 sm:w-40">
          <Label>Trade</Label>
          <Select
            value={tradeType}
            onValueChange={(v) => setTradeType(v ?? TRADES[0]!)}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {TRADES.map((t) => (
                <SelectItem key={t} value={t}>
                  {t}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Button type="submit" disabled={pending || !email.trim()}>
          {pending ? "Saving…" : "Notify me"}
        </Button>
      </form>
      {msg && <p className="mt-2 text-sm text-emerald-600 dark:text-emerald-400">{msg}</p>}
      {err && <p className="mt-2 text-sm text-destructive">{err}</p>}
    </div>
  );
}
