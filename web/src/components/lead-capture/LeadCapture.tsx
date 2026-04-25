"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QuoteEstimator } from "@/components/leads/quote-estimator";
import { LeadSubmissionSuccessDialog } from "@/components/lead-capture/lead-submission-success-dialog";
import { trpc } from "@/trpc/react";
import { trackLeadSubmitted } from "@/lib/analytics";
import { isLeadFormSubmittable } from "@/lib/lead-form-submittable";
import { leadCaptureFormSchema } from "@/lib/schemas/lead-capture";
import {
  LEAD_CAPTURE_BUDGET_RANGE_OPTIONS,
  type ProjectComplexity,
  type ScoreBreakdown,
  calculateQuoteEstimate,
} from "@/lib/quote-estimate";

const defaultBreakdown: ScoreBreakdown = {
  contactQuality: 50,
  projectValue: 50,
  urgency: 50,
  budget: 50,
  timeline: 50,
};

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
  email: "",
  projectType: "",
  location: "",
  description: "",
  budget: "",
  timeline: "flexible" as "this week" | "this month" | "flexible",
  projectComplexity: "simple" as ProjectComplexity,
};

export function LeadCapture() {
  const [f, setF] = useState(() => ({ ...emptyForm }));
  const [success, setSuccess] = useState<{
    leadId: string;
    grade: string;
    score: number;
    breakdown: ScoreBreakdown;
  } | null>(null);
  const [open, setOpen] = useState(false);
  const [fieldErrors, setFieldErrors] = useState<Partial<Record<string, string>>>({});

  const create = trpc.leads.create.useMutation();

  const estimate = calculateQuoteEstimate(
    f.budget,
    f.timeline,
    f.projectComplexity
  );

  const canSubmit = isLeadFormSubmittable(f);

  function reset() {
    setF({ ...emptyForm });
    create.reset();
  }

  return (
    <div className="mx-auto max-w-xl space-y-8 px-4 py-10">
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
        onSubmit={(e) => {
          e.preventDefault();
          if (!canSubmit) return;
          setFieldErrors({});
          const min = estimate.min;
          const max = estimate.max;
          const parsed = leadCaptureFormSchema.safeParse({
            name: f.name,
            phone: f.phone,
            email: f.email,
            projectType: f.projectType,
            location: f.location,
            description: f.description,
            budget: f.budget,
            timeline: f.timeline,
            projectComplexity: f.projectComplexity,
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
            location: v.location,
            description: v.description,
            budget: v.budget || undefined,
            timeline: v.timeline,
            projectComplexity: v.projectComplexity,
            estimatedQuoteMin: min,
            estimatedQuoteMax: max,
          };
          create.mutate(payload, {
            onSuccess: (data) => {
              setSuccess({
                leadId: data.id,
                grade: data.aiGrade,
                score: data.aiScore,
                breakdown: data.scoreBreakdown
                  ? { ...defaultBreakdown, ...data.scoreBreakdown }
                  : defaultBreakdown,
              });
              setOpen(true);
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
            required
            aria-invalid={Boolean(fieldErrors.name)}
            aria-describedby={fieldErrors.name ? "name-error" : undefined}
          />
          {fieldErrors.name ? (
            <p id="name-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.name}
            </p>
          ) : null}
        </div>
        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone *</Label>
            <Input
              id="phone"
              value={f.phone}
              onValueChange={(value) => setF((s) => ({ ...s, phone: value }))}
              autoComplete="tel"
              inputMode="tel"
              required
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
        </div>

        <div className="grid gap-2">
          <Label htmlFor="projectType">Project type *</Label>
          <select
            id="projectType"
            name="projectType"
            required
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
          <Label htmlFor="location">Your postcode or area *</Label>
          <Input
            id="location"
            value={f.location}
            onValueChange={(value) => setF((s) => ({ ...s, location: value }))}
            placeholder="e.g. G1 1AA or West End"
            required
            autoComplete="street-address"
            aria-invalid={Boolean(fieldErrors.location)}
            aria-describedby={fieldErrors.location ? "location-error" : undefined}
          />
          {fieldErrors.location ? (
            <p id="location-error" className="text-sm text-destructive" role="alert">
              {fieldErrors.location}
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
            required
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

        <QuoteEstimator
          projectType={f.projectType}
          description={f.description}
          budget={f.budget}
          timeline={f.timeline}
          complexity={f.projectComplexity}
        />

        <div className="grid gap-2 sm:grid-cols-2 sm:gap-4">
          <div className="grid gap-2">
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
            <Label htmlFor="projectComplexity" className="text-sm font-medium">
              Project complexity
            </Label>
            <select
              id="projectComplexity"
              name="projectComplexity"
              value={f.projectComplexity}
              onChange={(e) => {
                const v = (e.target as HTMLSelectElement)
                  .value as ProjectComplexity;
                setF((s) => ({ ...s, projectComplexity: v }));
              }}
              className={selectClassName}
            >
              <option value="simple">Simple (1×)</option>
              <option value="medium">Medium (1.5×)</option>
              <option value="complex">Complex (2×)</option>
            </select>
          </div>
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

      {success && (
        <LeadSubmissionSuccessDialog
          open={open}
          onOpenChange={setOpen}
          aiGrade={success.grade}
          aiScore={success.score}
          scoreBreakdown={success.breakdown}
          leadId={success.leadId}
          onSubmitAnother={reset}
        />
      )}
    </div>
  );
}
