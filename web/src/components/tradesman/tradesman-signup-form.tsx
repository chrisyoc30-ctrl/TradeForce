"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";

const TRADE_OPTIONS = [
  "Plumber",
  "Electrician",
  "Joiner",
  "Plasterer",
  "Painter & Decorator",
  "Roofer",
  "General Builder",
  "Other",
] as const;

export function TradesmanSignupForm() {
  const router = useRouter();
  const [name, setName] = useState("");
  const [tradeType, setTradeType] = useState("");
  const [area, setArea] = useState("");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [experienceYears, setExperienceYears] = useState("");
  const [description, setDescription] = useState("");
  const [serviceAreas, setServiceAreas] = useState("");
  const [agree, setAgree] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  return (
    <form
      className="space-y-4"
      onSubmit={async (e) => {
        e.preventDefault();
        setErr(null);
        if (!agree) {
          setErr("Please accept the Terms of Service");
          return;
        }
        const base = getPublicApiBaseUrl();
        if (!base) {
          setErr("NEXT_PUBLIC_API_URL is not configured.");
          return;
        }
        setPending(true);
        try {
          const res = await fetch(`${base}/api/tradesman/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              name: name.trim(),
              trade_type: tradeType,
              area: area.trim(),
              phone: phone.trim(),
              email: email.trim(),
              experience_years: experienceYears.trim() || null,
              description: description.trim() || null,
              service_areas: serviceAreas,
              terms: agree,
            }),
          });
          if (!res.ok) {
            const j = (await res.json().catch(() => ({}))) as { error?: string };
            setErr(j.error ?? "Registration failed");
            return;
          }
          router.push("/tradesman-signup/success");
        } catch {
          setErr("Network error — try again.");
        } finally {
          setPending(false);
        }
      }}
    >
      <div className="grid gap-2">
        <Label htmlFor="ts-name">Full name *</Label>
        <Input
          id="ts-name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
          autoComplete="name"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-trade">Trade type *</Label>
        <select
          id="ts-trade"
          required
          value={tradeType}
          onChange={(e) => setTradeType(e.target.value)}
          className="h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm"
        >
          <option value="">Select trade</option>
          {TRADE_OPTIONS.map((t) => (
            <option key={t} value={t}>
              {t}
            </option>
          ))}
        </select>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-area">Area / postcode *</Label>
        <Input
          id="ts-area"
          value={area}
          onChange={(e) => setArea(e.target.value)}
          required
          placeholder="e.g. G41 or Southside"
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-areas">Areas you cover (optional)</Label>
        <Input
          id="ts-areas"
          value={serviceAreas}
          onChange={(e) => setServiceAreas(e.target.value)}
          placeholder="e.g. West End, Southside, East End"
        />
        <p className="text-xs text-muted-foreground">
          Comma-separated list of neighbourhoods or postcodes.
        </p>
      </div>
      <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
        <div className="grid gap-2">
          <Label htmlFor="ts-phone">Phone *</Label>
          <Input
            id="ts-phone"
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            required
            inputMode="tel"
            autoComplete="tel"
          />
        </div>
        <div className="grid gap-2">
          <Label htmlFor="ts-email">Email *</Label>
          <Input
            id="ts-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
          />
        </div>
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-exp">Years of experience (optional)</Label>
        <Input
          id="ts-exp"
          type="number"
          min={0}
          max={60}
          value={experienceYears}
          onChange={(e) => setExperienceYears(e.target.value)}
        />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="ts-desc">Brief description of services (optional)</Label>
        <Textarea
          id="ts-desc"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="min-h-[100px]"
        />
      </div>
      <div className="flex items-start gap-2">
        <input
          id="ts-terms"
          type="checkbox"
          className="mt-1 size-4 rounded border border-input"
          checked={agree}
          onChange={(e) => setAgree(e.target.checked)}
        />
        <label htmlFor="ts-terms" className="text-sm text-muted-foreground">
          I agree to the{" "}
          <Link
            href="/terms"
            className="text-foreground underline"
            target="_blank"
            rel="noopener noreferrer"
          >
            Terms of Service
          </Link>{" "}
          *
        </label>
      </div>
      {err && <p className="text-sm text-destructive">{err}</p>}
      <Button type="submit" disabled={pending} className="w-full sm:w-auto">
        {pending ? "Submitting…" : "Join the list"}
      </Button>
    </form>
  );
}
