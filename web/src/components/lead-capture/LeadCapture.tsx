"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  LeadCaptureSuccessPanel,
  type LeadCaptureSuccessData,
} from "@/components/lead-capture/lead-capture-success-panel";
import { trpc } from "@/trpc/react";
import { trackLeadSubmitted } from "@/lib/analytics";
import { isLeadFormSubmittable } from "@/lib/lead-form-submittable";
import { leadCaptureFormSchema } from "@/lib/schemas/lead-capture";
import { LEAD_CAPTURE_BUDGET_RANGE_OPTIONS } from "@/lib/quote-estimate";

const PROJECT_TYPE_OPTIONS: readonly { value: string; label: string }[] = [
  { value: "", label: "Select project type" },
  { value: "Plumbing", label: "Plumbing" },
  { value: "Electrical", label: "Electrical" },
  { value: "Heating & gas", label: "Heating & gas" },
  { value: "Bathroom or kitchen", label: "Bathroom or kitchen" },
  { value: "Roofing", label: "Roofing" },
  { value: "Joinery / carpentry", label: "Joinery / carpentry" },
  { value: "General building", label: "General building" },
  { value: "Other", label: "Other" },
] as const;

const selectClassName =
  "h-8 w-full rounded-lg border border-input bg-transparent px-2.5 py-1 text-sm transition-colors " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 " +
  "disabled:cursor-not-allowed disabled:opacity-50 dark:bg-input/30 " +
  "md:text-sm";

const emptyForm = {
  name: "",
  phone: "",
  postcode: "",
  email: "",
  projectType: "",
  description: "",
  budget: "",
  timeline: "flexible" as "this week" | "this month" | "flexible",
};

export function LeadCapture() {
  const [f, setF] = useState(() => ({ ...emptyForm }));
  const [success, setSuccess] = useState<LeadCaptureSuccessData | null>(null);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  const create = trpc.leads.create.useMutation();

  const canSubmit = isLeadFormSubmittable(f);

  function reset() {
    setF({ ...emptyForm });
    setSuccess(null);
    create.reset();
  }

  if (success) {
    return (
      <div className="mx-auto max-w-xl space-y-8 px-4 py-10 pb-28 sm:pb-10">
        <header>
          <h1 className="text-2xl font-semibold tracking-tight">Post a job</h1>
        </header>
        <LeadCaptureSuccessPanel
          data={success}
          onPostAnother={reset}
        />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10 pb-28 sm:pb-10">
      <header>
        <h1 className="text-2xl font-semibold tracking-tight">Post a job</h1>
        <p className="text-sm text-muted-foreground">
          Tell us what you need — it&apos;s{" "}
          <span className="font-medium text-foreground/90">always free</span> for
          homeowners. We score every request so the right pros see it first.
        </p>
      </header>

      <form
        className="space-y-5"
        noValidate
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setFieldErrors({});
          const parsed = leadCaptureFormSchema.safeParse({
            name: f.name,
            phone: f.phone,
            email: f.email,
            projectType: f.projectType,
            postcode: f.postcode,
            description: f.description,
            budget: f.budget,
            timeline: f.timeline,
          });
          if (!parsed.success) {
            const flat = parsed.error.flatten();
            const fe: Partial<Record<string, string>> = {};
            for (const [k, v] of Object.entries(flat.fieldErrors)) {
              if (v?.[0]) fe[k] = v[0];
            }
            if (Object.keys(fe).length === 0 && flat.formErrors[0]) {
              fe._form = flat.formErrors[0];
            }
            setFieldErrors(fe);
            return;
          }
          const v = parsed.data;
          const payload = {
            name: v.name,
            phone: v.phone,
            email: v.email,
            projectType: v.projectType,
            postcode: v.postcode,
            description: v.description,
            budget: v.budget || undefined,
            timeline: v.timeline,
          };
          create.mutate(payload, {
            onSuccess: (data) => {
              const scored = data.aiScoredByAI !== false;
              const est =
                data.aiEstimatedValue ?? "Unable to estimate";
              const sum =
                data.aiSummary ?? "Your job is now listed.";
              setSuccess({
                leadId: data.id,
                aiGrade: data.aiGrade,
                aiScore: data.aiScore,
                aiSummary: sum,
                aiReason: data.aiReason?.trim() ?? "",
                aiEstimatedValue: est,
                aiFlags: data.aiFlags ?? data.ai_flags ?? [],
                aiScoredByAI: scored,
              });
              trackLeadSubmitted({
                aiGrade: data.aiGrade,
                aiScore: data.aiScore,
                projectType: payload.projectType,
              });
            },
          });
        }}
      >
        <div className="grid gap-2">
          <Label htmlFor="name">Name *</Label>
          <Input
            id="name"
            value={f.name}
            onValueChange={(value) => setF((s) => ({ ...s, name: value }))}
            autoComplete="name"
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="name-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="phone">Phone *</Label>
          <Input
            id="phone"
            value={f.phone}
            onValueChange={(value) => setF((s) => ({ ...s, phone: value }))}
            autoComplete="tel"
            inputMode="tel"
            aria-invalid={Boolean(fieldErrors.phone)}
            aria-describedby={fieldErrors.phone ? "phone-error" : undefined}
          />
          {fieldErrors.phone ? (
            <p id="phone-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.phone}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="postcode">Postcode *</Label>
          <Input
            id="postcode"
            value={f.postcode}
            onValueChange={(value) =>
              setF((s) => ({ ...s, postcode: value.toUpperCase() }))
            }
            autoComplete="postal-code"
            placeholder="e.g. G1 1AA"
            aria-invalid={Boolean(fieldErrors.postcode)}
            aria-describedby={fieldErrors.postcode ? "postcode-error" : undefined}
          />
          {fieldErrors.postcode ? (
            <p
              id="postcode-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {fieldErrors.postcode}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="email"
            value={f.email}
            onValueChange={(value) => setF((s) => ({ ...s, email: value }))}
            autoComplete="email"
            aria-invalid={Boolean(fieldErrors.email)}
            aria-describedby={fieldErrors.email ? "email-error" : undefined}
          />
          {fieldErrors.email ? (
            <p id="email-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.email}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="projectType">Project type *</Label>
          <select
            id="projectType"
            name="projectType"
            value={f.projectType}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setF((s) => ({ ...s, projectType: v }));
            }}
            className={selectClassName}
            aria-invalid={Boolean(fieldErrors.projectType)}
            aria-describedby={fieldErrors.projectType ? "projectType-error" : undefined}
          >
            {PROJECT_TYPE_OPTIONS.map(({ value, label }) => (
              <option key={label + value} value={value}>
                {label}
              </option>
            ))}
          </select>
          {fieldErrors.projectType ? (
            <p id="projectType-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.projectType}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2">
          <Label htmlFor="description">Project description *</Label>
          <Textarea
            id="description"
            value={f.description}
            onChange={(e) =>
              setF((s) => ({ ...s, description: e.target.value }))
            }
            className="min-h-[120px] resize-y"
            placeholder="What needs doing, access, materials…"
            aria-invalid={Boolean(fieldErrors.description)}
            aria-describedby={fieldErrors.description ? "description-error" : undefined}
          />
          {fieldErrors.description ? (
            <p
              id="description-error"
              className="text-sm text-destructive"
              role="alert"
            >
              {fieldErrors.description}
            </p>
          ) : null}
        </div>

        <div className="grid gap-2 sm:max-w-md">
          <Label htmlFor="budget">Budget (optional)</Label>
          <select
            id="budget"
            name="budget"
            value={f.budget}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value;
              setF((s) => ({ ...s, budget: v }));
            }}
            className={selectClassName}
          >
            {LEAD_CAPTURE_BUDGET_RANGE_OPTIONS.map(({ value, label }) => (
              <option key={value || "empty"} value={value}>
                {label}
              </option>
            ))}
          </select>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="timeline" className="text-sm font-medium">
            Timeline
          </Label>
          <select
            id="timeline"
            name="timeline"
            value={f.timeline}
            onChange={(e) => {
              const v = (e.target as HTMLSelectElement).value as (typeof f)["timeline"];
              setF((s) => ({ ...s, timeline: v }));
            }}
            className={selectClassName}
          >
            <option value="this week">This week</option>
            <option value="this month">This month</option>
            <option value="flexible">Flexible</option>
          </select>
        </div>

        {fieldErrors._form ? (
          <p className="text-sm text-destructive" role="alert">
            {fieldErrors._form}
          </p>
        ) : null}
        {create.error && (
          <p className="text-sm text-destructive" role="alert">
            {create.error.message}
          </p>
        )}

        <Button
          type="submit"
          className="w-full sm:w-auto"
          disabled={!canSubmit || create.isPending}
        >
          {create.isPending && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Submit job
        </Button>
      </form>
    </div>
  );
}
