"use client";

import { Suspense, useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CheckCircle2,
  Loader2,
  ShieldCheck,
  Upload,
  AlertCircle,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { postJobOrangeSolidCtaClasses } from "@/lib/cta-tailwind";
import { getPublicApiBaseUrl } from "@/lib/public-api-base";
import {
  VERIFY_SECTIONS,
  CPS_SCHEME_OPTIONS,
  verifyFormSchema,
  type CpsSchemeId,
  type VerifyProfile,
} from "@/lib/schemas/verify-form";
import { cn } from "@/lib/utils";

const BIO_MAX = 1500;
const ACCEPT_FILES = ".pdf,.jpg,.jpeg,.png,.heic,.heif,image/*,application/pdf";

type FieldErrors = Partial<Record<string, string>>;

const emptyForm = {
  tradesperson_id: "",
  business_name: "",
  business_structure: "" as "" | "sole_trader" | "limited_company" | "partnership",
  companies_house_number: "",
  years_experience: "",
  customer_facing_bio: "",
  insurance_company: "",
  insurance_policy_number: "",
  insurance_expiry: "",
  id_type: "" as "" | "driving_licence" | "passport",
  gas_safe_number: "",
  niceic_reg: "",
  napit_reg: "",
  elecsa_reg: "",
  stroma_reg: "",
  cps_other_name: "",
  cps_other_number: "",
  other_certifications: "",
  confirm_accurate: false,
  confirm_authorities: false,
};

type CpsEntry = {
  enabled: boolean;
  number: string;
  otherName: string;
  file: File | null;
};

function emptyCpsState(): Record<CpsSchemeId, CpsEntry> {
  return {
    niceic: { enabled: false, number: "", otherName: "", file: null },
    napit: { enabled: false, number: "", otherName: "", file: null },
    elecsa: { enabled: false, number: "", otherName: "", file: null },
    stroma: { enabled: false, number: "", otherName: "", file: null },
    other: { enabled: false, number: "", otherName: "", file: null },
  };
}

function VerifyPageContent() {
  const searchParams = useSearchParams();
  const urlId = (searchParams.get("id") ?? "").trim().toUpperCase();

  const [form, setForm] = useState({ ...emptyForm, tradesperson_id: urlId });
  const [profile, setProfile] = useState<VerifyProfile | null>(null);
  const [lookupError, setLookupError] = useState<string | null>(null);
  const [lookupLoading, setLookupLoading] = useState(Boolean(urlId));
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [formError, setFormError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState<{ message: string } | null>(null);

  const [insuranceFile, setInsuranceFile] = useState<File | null>(null);
  const [photoIdFile, setPhotoIdFile] = useState<File | null>(null);
  const [certFiles, setCertFiles] = useState<File[]>([]);
  const [cpsSchemes, setCpsSchemes] = useState<Record<CpsSchemeId, CpsEntry>>(
    emptyCpsState,
  );

  const tradeType = (profile?.trade_type ?? "").toLowerCase();
  const showGasSafe = tradeType.includes("gas");
  const showCps = tradeType.includes("electric");

  const lookupTrade = useCallback(async (id: string) => {
    const base = getPublicApiBaseUrl();
    const tid = id.trim().toUpperCase();
    if (!base || !tid) {
      setProfile(null);
      setLookupLoading(false);
      return;
    }
    setLookupLoading(true);
    setLookupError(null);
    try {
      const res = await fetch(
        `${base}/api/tradesperson/${encodeURIComponent(tid)}/verify-profile`,
        { cache: "no-store" },
      );
      const data = (await res.json()) as VerifyProfile & { error?: string };
      if (!res.ok) {
        setProfile(null);
        setLookupError(data.error ?? "Trade not found — check your TS-ID");
        return;
      }
      setProfile(data);
      setForm((f) => ({
        ...f,
        tradesperson_id: tid,
        business_name: f.business_name || data.business_name || "",
        business_structure:
          f.business_structure ||
          (data.business_structure as typeof f.business_structure) ||
          "",
      }));
      if (data.can_submit === false && data.submission_blocked_reason) {
        setFormError(data.submission_blocked_reason);
      }
    } catch {
      setLookupError("Could not look up your TradeScore ID. Try again.");
      setProfile(null);
    } finally {
      setLookupLoading(false);
    }
  }, []);

  useEffect(() => {
    if (urlId) void lookupTrade(urlId);
  }, [urlId, lookupTrade]);

  const bioCount = form.customer_facing_bio.length;

  const sectionComplete = useMemo(() => {
    const idOk = Boolean(profile?.full_name) && profile?.can_submit !== false;
    const bizOk =
      Boolean(form.business_structure) &&
      (form.business_structure !== "limited_company" ||
        /^[A-Z0-9]{8}$/.test(form.companies_house_number));
    const bioOk = form.customer_facing_bio.trim().length >= 10;
    const insOk =
      Boolean(form.insurance_company.trim()) &&
      Boolean(form.insurance_policy_number.trim()) &&
      Boolean(form.insurance_expiry) &&
      Boolean(insuranceFile);
    const idDocOk = Boolean(form.id_type) && Boolean(photoIdFile);
    const hasCps =
      !showCps ||
      CPS_SCHEME_OPTIONS.some((opt) => {
        const entry = cpsSchemes[opt.id];
        if (!entry.enabled) return false;
        if ("other" in opt && opt.other) {
          return (
            entry.otherName.trim().length > 0 && entry.number.trim().length > 0
          );
        }
        return entry.number.trim().length > 0;
      });
    const certOk = hasCps;
    const confirmOk = form.confirm_accurate && form.confirm_authorities;
    return [idOk, bizOk, bioOk, insOk, idDocOk, certOk, confirmOk];
  }, [form, profile, insuranceFile, photoIdFile, cpsSchemes, showCps]);

  function setField<K extends keyof typeof form>(key: K, value: (typeof form)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
    setFieldErrors((e) => ({ ...e, [key]: undefined }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setFormError(null);
    setFieldErrors({});

    if (!insuranceFile) {
      setFieldErrors({ insurance_certificate: "Upload your insurance certificate" });
      return;
    }
    if (!photoIdFile) {
      setFieldErrors({ photo_id: "Upload a photo of your ID" });
      return;
    }

    if (showCps) {
      const hasScheme = CPS_SCHEME_OPTIONS.some((opt) => {
        const entry = cpsSchemes[opt.id];
        if (!entry.enabled) return false;
        if ("other" in opt && opt.other) {
          return (
            entry.otherName.trim().length > 0 && entry.number.trim().length > 0
          );
        }
        return entry.number.trim().length > 0;
      });
      if (!hasScheme) {
        setFormError(
          "Select at least one competent person scheme and enter the registration number.",
        );
        return;
      }
    }

    const cpsFormValues = {
      niceic_reg: cpsSchemes.niceic.enabled ? cpsSchemes.niceic.number.trim() : "",
      napit_reg: cpsSchemes.napit.enabled ? cpsSchemes.napit.number.trim() : "",
      elecsa_reg: cpsSchemes.elecsa.enabled ? cpsSchemes.elecsa.number.trim() : "",
      stroma_reg: cpsSchemes.stroma.enabled ? cpsSchemes.stroma.number.trim() : "",
      cps_other_name: cpsSchemes.other.enabled ? cpsSchemes.other.otherName.trim() : "",
      cps_other_number: cpsSchemes.other.enabled ? cpsSchemes.other.number.trim() : "",
    };

    const parsed = verifyFormSchema.safeParse({
      ...form,
      ...cpsFormValues,
      years_experience: form.years_experience === "" ? NaN : Number(form.years_experience),
      confirm_accurate: form.confirm_accurate ? true : undefined,
      confirm_authorities: form.confirm_authorities ? true : undefined,
    });

    if (!parsed.success) {
      const next: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const key = issue.path[0]?.toString() ?? "form";
        if (!next[key]) next[key] = issue.message;
      }
      setFieldErrors(next);
      return;
    }

    const base = getPublicApiBaseUrl();
    if (!base) {
      setFormError("API is not configured. Please try again later.");
      return;
    }

    setSubmitting(true);
    const fd = new FormData();
    const d = parsed.data;
    fd.append("tradesperson_id", d.tradesperson_id);
    if (d.business_name) fd.append("business_name", d.business_name);
    fd.append("business_structure", d.business_structure);
    if (d.companies_house_number) fd.append("companies_house_number", d.companies_house_number);
    fd.append("years_experience", String(d.years_experience));
    fd.append("customer_facing_bio", d.customer_facing_bio);
    fd.append("insurance_company", d.insurance_company);
    fd.append("insurance_policy_number", d.insurance_policy_number);
    fd.append("insurance_expiry", d.insurance_expiry);
    fd.append("id_type", d.id_type);
    if (d.gas_safe_number) fd.append("gas_safe_number", d.gas_safe_number);
    if (d.niceic_reg) fd.append("niceic_reg", d.niceic_reg);
    if (d.napit_reg) fd.append("napit_reg", d.napit_reg);
    if (d.elecsa_reg) fd.append("elecsa_reg", d.elecsa_reg);
    if (d.stroma_reg) fd.append("stroma_reg", d.stroma_reg);
    if (d.cps_other_name) fd.append("cps_other_name", d.cps_other_name);
    if (d.cps_other_number) fd.append("cps_other_number", d.cps_other_number);
    if (d.other_certifications) fd.append("other_certifications", d.other_certifications);
    fd.append("confirm_accurate", "true");
    fd.append("confirm_authorities", "true");
    fd.append("insurance_certificate", insuranceFile);
    fd.append("photo_id", photoIdFile);
    for (const opt of CPS_SCHEME_OPTIONS) {
      const entry = cpsSchemes[opt.id];
      if (entry.enabled && entry.file) {
        fd.append(`cps_cert_${opt.id}`, entry.file);
      }
    }
    for (const f of certFiles) fd.append("certification_documents", f);

    try {
      const res = await fetch(`${base}/api/trades/verify-submission`, {
        method: "POST",
        body: fd,
      });
      const data = (await res.json()) as {
        success?: boolean;
        friendly_message?: string;
        error?: string;
        field_errors?: string[];
      };
      if (!res.ok) {
        if (data.field_errors?.length) {
          setFormError(data.field_errors.join(" "));
        } else {
          setFormError(
            data.friendly_message ?? data.error ?? "Submission failed. Please try again.",
          );
        }
        return;
      }
      const first = profile?.full_name?.split(/\s+/)[0] ?? "there";
      setSuccess({
        message:
          data.friendly_message ??
          `Thanks ${first}! Your submission has been received. Christopher will review within 24 hours and grant your verification badges.`,
      });
    } catch {
      setFormError("Network error — check your connection and try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (success) {
    return (
      <div className="min-h-dvh bg-zinc-950 px-4 py-10 text-foreground">
        <div className="mx-auto max-w-lg space-y-6">
          <div className="rounded-lg border border-emerald-500/40 bg-emerald-950/40 px-5 py-6">
            <div className="flex gap-3">
              <CheckCircle2 className="mt-0.5 h-6 w-6 shrink-0 text-emerald-400" />
              <div className="space-y-3">
                <h1 className="text-xl font-semibold text-emerald-50">Submission received</h1>
                <p className="text-sm leading-relaxed text-emerald-100/90">{success.message}</p>
                <p className="text-sm text-emerald-100/80">
                  You&apos;ll receive an email confirmation when review is complete. Questions?{" "}
                  <a
                    href="mailto:support@tradeforce.uk"
                    className="font-medium underline underline-offset-2"
                  >
                    support@tradeforce.uk
                  </a>
                </p>
              </div>
            </div>
          </div>
          <Link href="/available-jobs" className={cn(postJobOrangeSolidCtaClasses, "inline-flex")}>
            Back to available jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-dvh bg-zinc-950 px-4 py-8 text-foreground pb-16">
      <div className="mx-auto max-w-lg space-y-6">
        <header className="space-y-2">
          <Link href="/available-jobs" className="text-xs text-muted-foreground hover:text-foreground">
            ← Available jobs
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-7 w-7 text-orange-500" aria-hidden />
            <h1 className="text-2xl font-bold tracking-tight">Trade verification</h1>
          </div>
          <p className="text-sm text-muted-foreground">
            Complete once to earn trust badges shown to homeowners. Takes about 5–7 minutes.
          </p>
        </header>

        <div className="flex gap-1 overflow-x-auto pb-1">
          {VERIFY_SECTIONS.map((label, i) => (
            <div
              key={label}
              className={cn(
                "shrink-0 rounded-full px-2.5 py-1 text-[10px] font-medium uppercase tracking-wide",
                sectionComplete[i]
                  ? "bg-emerald-500/20 text-emerald-300"
                  : "bg-zinc-800 text-zinc-400",
              )}
            >
              {i + 1}. {label}
            </div>
          ))}
        </div>

        {formError ? (
          <div
            role="alert"
            className="flex gap-2 rounded-lg border border-amber-500/40 bg-amber-500/10 px-4 py-3 text-sm"
          >
            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0 text-amber-500" />
            <span>{formError}</span>
          </div>
        ) : null}

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Section 1 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">1. Identify yourself</CardTitle>
              <CardDescription>Your TradeScore ID links this form to your account.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ts-id">TradeScore ID (TS-XXXXXX)</Label>
                <div className="flex gap-2">
                  <Input
                    id="ts-id"
                    value={form.tradesperson_id}
                    onChange={(e) => setField("tradesperson_id", e.target.value.toUpperCase())}
                    placeholder="TS-EPQJF2"
                    className="font-mono uppercase"
                    disabled={submitting}
                  />
                  <Button
                    type="button"
                    variant="secondary"
                    disabled={lookupLoading || !form.tradesperson_id.trim()}
                    onClick={() => void lookupTrade(form.tradesperson_id)}
                  >
                    {lookupLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Look up"}
                  </Button>
                </div>
                {fieldErrors.tradesperson_id ? (
                  <p className="text-xs text-destructive">{fieldErrors.tradesperson_id}</p>
                ) : null}
                {lookupError ? <p className="text-xs text-destructive">{lookupError}</p> : null}
              </div>
              {profile ? (
                <div className="rounded-md border border-orange-500/30 bg-orange-500/10 px-3 py-2 text-sm">
                  <p className="font-medium text-orange-100">
                    Verifying as: {profile.full_name}
                  </p>
                  <p className="text-orange-200/80">{profile.email}</p>
                  <p className="text-orange-200/80">{profile.trade_type}</p>
                </div>
              ) : null}
            </CardContent>
          </Card>

          {/* Section 2 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">2. Business information</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="business_name">Business name (if different from your name)</Label>
                <Input
                  id="business_name"
                  value={form.business_name}
                  onChange={(e) => setField("business_name", e.target.value)}
                  disabled={submitting}
                />
              </div>
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">Business structure</legend>
                {(
                  [
                    ["sole_trader", "Sole trader"],
                    ["limited_company", "Limited company"],
                    ["partnership", "Partnership"],
                  ] as const
                ).map(([val, label]) => (
                  <label key={val} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="business_structure"
                      value={val}
                      checked={form.business_structure === val}
                      onChange={() => setField("business_structure", val)}
                      disabled={submitting}
                      className="accent-orange-500"
                    />
                    {label}
                  </label>
                ))}
                {fieldErrors.business_structure ? (
                  <p className="text-xs text-destructive">{fieldErrors.business_structure}</p>
                ) : null}
              </fieldset>
              {form.business_structure === "limited_company" ? (
                <div className="grid gap-2">
                  <Label htmlFor="ch">Companies House number</Label>
                  <Input
                    id="ch"
                    value={form.companies_house_number}
                    onChange={(e) =>
                      setField("companies_house_number", e.target.value.toUpperCase())
                    }
                    maxLength={8}
                    placeholder="SC123456"
                    disabled={submitting}
                  />
                  {fieldErrors.companies_house_number ? (
                    <p className="text-xs text-destructive">{fieldErrors.companies_house_number}</p>
                  ) : null}
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="years">Years of experience</Label>
                <Input
                  id="years"
                  type="number"
                  min={0}
                  max={70}
                  value={form.years_experience}
                  onChange={(e) => setField("years_experience", e.target.value)}
                  disabled={submitting}
                />
                {fieldErrors.years_experience ? (
                  <p className="text-xs text-destructive">{fieldErrors.years_experience}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Section 3 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">3. Customer-facing bio</CardTitle>
              <CardDescription>
                Shown to homeowners when you&apos;re matched. 2–3 sentences.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <textarea
                id="bio"
                rows={4}
                maxLength={BIO_MAX}
                value={form.customer_facing_bio}
                onChange={(e) => setField("customer_facing_bio", e.target.value)}
                disabled={submitting}
                placeholder="e.g. Glasgow-based gas engineer with 15 years experience. Gas Safe registered, specialising in boiler installs and annual services across G postcodes."
                className="border-input bg-background ring-offset-background placeholder:text-muted-foreground focus-visible:ring-ring flex min-h-[100px] w-full rounded-md border px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-offset-2 focus-visible:outline-none"
              />
              <p className="text-xs text-muted-foreground text-right">
                {bioCount}/{BIO_MAX}
              </p>
              {fieldErrors.customer_facing_bio ? (
                <p className="text-xs text-destructive">{fieldErrors.customer_facing_bio}</p>
              ) : null}
            </CardContent>
          </Card>

          {/* Section 4 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">4. Public liability insurance</CardTitle>
              <CardDescription>Minimum £2m cover required for badge.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label htmlFor="ins-co">Insurance company</Label>
                <Input
                  id="ins-co"
                  value={form.insurance_company}
                  onChange={(e) => setField("insurance_company", e.target.value)}
                  disabled={submitting}
                />
                {fieldErrors.insurance_company ? (
                  <p className="text-xs text-destructive">{fieldErrors.insurance_company}</p>
                ) : null}
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ins-pol">Policy number</Label>
                <Input
                  id="ins-pol"
                  value={form.insurance_policy_number}
                  onChange={(e) => setField("insurance_policy_number", e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ins-exp">Expiry date</Label>
                <Input
                  id="ins-exp"
                  type="date"
                  value={form.insurance_expiry}
                  onChange={(e) => setField("insurance_expiry", e.target.value)}
                  disabled={submitting}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="ins-file">Certificate (PDF or photo)</Label>
                <Input
                  id="ins-file"
                  type="file"
                  accept={ACCEPT_FILES}
                  disabled={submitting}
                  onChange={(e) => setInsuranceFile(e.target.files?.[0] ?? null)}
                />
                {insuranceFile ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Upload className="h-3 w-3" /> {insuranceFile.name}
                  </p>
                ) : null}
                {fieldErrors.insurance_certificate ? (
                  <p className="text-xs text-destructive">{fieldErrors.insurance_certificate}</p>
                ) : null}
                <p className="text-xs text-muted-foreground">PDF, JPG, PNG, or HEIC — max 10MB</p>
              </div>
            </CardContent>
          </Card>

          {/* Section 5 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">5. Photo ID</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <fieldset className="space-y-2">
                <legend className="text-sm font-medium">ID type</legend>
                {(
                  [
                    ["driving_licence", "Driving licence"],
                    ["passport", "Passport"],
                  ] as const
                ).map(([val, label]) => (
                  <label key={val} className="flex cursor-pointer items-center gap-2 text-sm">
                    <input
                      type="radio"
                      name="id_type"
                      value={val}
                      checked={form.id_type === val}
                      onChange={() => setField("id_type", val)}
                      disabled={submitting}
                      className="accent-orange-500"
                    />
                    {label}
                  </label>
                ))}
                {fieldErrors.id_type ? (
                  <p className="text-xs text-destructive">{fieldErrors.id_type}</p>
                ) : null}
              </fieldset>
              <div className="grid gap-2">
                <Label htmlFor="id-file">Photo of ID (front)</Label>
                <Input
                  id="id-file"
                  type="file"
                  accept={ACCEPT_FILES}
                  disabled={submitting}
                  onChange={(e) => setPhotoIdFile(e.target.files?.[0] ?? null)}
                />
                {photoIdFile ? (
                  <p className="text-xs text-muted-foreground flex items-center gap-1">
                    <Upload className="h-3 w-3" /> {photoIdFile.name}
                  </p>
                ) : null}
                {fieldErrors.photo_id ? (
                  <p className="text-xs text-destructive">{fieldErrors.photo_id}</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Section 6 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">6. Trade certifications</CardTitle>
              <CardDescription>
                {showCps
                  ? "Select competent person schemes you are registered with — upload a certificate for each."
                  : "Optional uploads — speeds up badge grants."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {showGasSafe ? (
                <div className="grid gap-2">
                  <Label htmlFor="gas">Gas Safe registration number</Label>
                  <Input
                    id="gas"
                    inputMode="numeric"
                    value={form.gas_safe_number}
                    onChange={(e) => setField("gas_safe_number", e.target.value.replace(/\D/g, ""))}
                    maxLength={10}
                    disabled={submitting}
                  />
                </div>
              ) : null}
              {showCps ? (
                <div className="space-y-4 rounded-md border border-zinc-700/80 p-3">
                  <p className="text-sm font-medium">Competent Person Scheme (electricians)</p>
                  <p className="text-xs text-muted-foreground">
                    Select all schemes you&apos;re registered with. At least one is required.
                  </p>
                  {CPS_SCHEME_OPTIONS.map((opt) => {
                    const entry = cpsSchemes[opt.id];
                    const isOther = "other" in opt && opt.other;
                    return (
                      <div key={opt.id} className="space-y-2 border-t border-zinc-800 pt-3 first:border-0 first:pt-0">
                        <label className="flex cursor-pointer items-center gap-2 text-sm font-medium">
                          <input
                            type="checkbox"
                            checked={entry.enabled}
                            disabled={submitting}
                            className="accent-orange-500"
                            onChange={(e) =>
                              setCpsSchemes((prev) => ({
                                ...prev,
                                [opt.id]: { ...prev[opt.id], enabled: e.target.checked },
                              }))
                            }
                          />
                          {opt.label}
                        </label>
                        {entry.enabled ? (
                          <div className="ml-6 space-y-2">
                            {isOther ? (
                              <Input
                                placeholder="Scheme name"
                                value={entry.otherName}
                                disabled={submitting}
                                onChange={(e) =>
                                  setCpsSchemes((prev) => ({
                                    ...prev,
                                    [opt.id]: { ...prev[opt.id], otherName: e.target.value },
                                  }))
                                }
                              />
                            ) : null}
                            <Input
                              placeholder={isOther ? "Registration number" : `${opt.label} number`}
                              value={entry.number}
                              maxLength={20}
                              disabled={submitting}
                              onChange={(e) =>
                                setCpsSchemes((prev) => ({
                                  ...prev,
                                  [opt.id]: { ...prev[opt.id], number: e.target.value },
                                }))
                              }
                            />
                            <div className="grid gap-1">
                              <Label className="text-xs">Certificate (PDF or photo)</Label>
                              <Input
                                type="file"
                                accept={ACCEPT_FILES}
                                disabled={submitting}
                                onChange={(e) =>
                                  setCpsSchemes((prev) => ({
                                    ...prev,
                                    [opt.id]: {
                                      ...prev[opt.id],
                                      file: e.target.files?.[0] ?? null,
                                    },
                                  }))
                                }
                              />
                              {entry.file ? (
                                <p className="text-xs text-muted-foreground flex items-center gap-1">
                                  <Upload className="h-3 w-3" /> {entry.file.name}
                                </p>
                              ) : null}
                            </div>
                          </div>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : null}
              <div className="grid gap-2">
                <Label htmlFor="other-cert">Other certifications</Label>
                <textarea
                  id="other-cert"
                  rows={2}
                  value={form.other_certifications}
                  onChange={(e) => setField("other_certifications", e.target.value)}
                  disabled={submitting}
                  className="border-input bg-background w-full rounded-md border px-3 py-2 text-sm"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="cert-files">Certification documents (optional)</Label>
                <Input
                  id="cert-files"
                  type="file"
                  accept={ACCEPT_FILES}
                  multiple
                  disabled={submitting}
                  onChange={(e) => setCertFiles(Array.from(e.target.files ?? []))}
                />
                {certFiles.length > 0 ? (
                  <p className="text-xs text-muted-foreground">{certFiles.length} file(s) selected</p>
                ) : null}
              </div>
            </CardContent>
          </Card>

          {/* Section 7 */}
          <Card className="border-zinc-800 bg-zinc-900/80">
            <CardHeader className="pb-3">
              <CardTitle className="text-lg">7. Confirm & submit</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.confirm_accurate}
                  onChange={(e) => setField("confirm_accurate", e.target.checked)}
                  disabled={submitting}
                  className="mt-1 accent-orange-500"
                />
                I confirm all information is accurate and documents are authentic.
              </label>
              {fieldErrors.confirm_accurate ? (
                <p className="text-xs text-destructive">{fieldErrors.confirm_accurate}</p>
              ) : null}
              <label className="flex cursor-pointer items-start gap-2 text-sm">
                <input
                  type="checkbox"
                  checked={form.confirm_authorities}
                  onChange={(e) => setField("confirm_authorities", e.target.checked)}
                  disabled={submitting}
                  className="mt-1 accent-orange-500"
                />
                I agree to TradeScore verifying these details with issuing authorities.
              </label>
              {fieldErrors.confirm_authorities ? (
                <p className="text-xs text-destructive">{fieldErrors.confirm_authorities}</p>
              ) : null}
              <Button
                type="submit"
                className={cn("w-full min-h-12 bg-orange-500 hover:bg-orange-600 text-white font-bold")}
                disabled={submitting || !profile || profile.can_submit === false}
              >
                {submitting ? (
                  <span className="inline-flex items-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Submitting…
                  </span>
                ) : (
                  "Submit verification"
                )}
              </Button>
            </CardContent>
          </Card>
        </form>
      </div>
    </div>
  );
}

function VerifyPageFallback() {
  return (
    <div className="flex min-h-dvh items-center justify-center bg-zinc-950 px-4 text-sm text-muted-foreground">
      <Loader2 className="mr-2 h-4 w-4 animate-spin" aria-hidden />
      Loading verification form…
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<VerifyPageFallback />}>
      <VerifyPageContent />
    </Suspense>
  );
}
