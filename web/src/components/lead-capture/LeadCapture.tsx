"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QuoteEstimator } from "@/components/leads/quote-estimator";
import { LeadSubmissionSuccessDialog } from "@/components/lead-capture/lead-submission-success-dialog";
import { trpc } from "@/trpc/react";
import { trackLeadSubmitted } from "@/lib/analytics";
import { isLeadFormSubmittable } from "@/lib/lead-form-submittable";
import {
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

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  projectType: "",
  description: "",
  budget: "",
  timeline: "flexible",
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
          const min = estimate.min;
          const max = estimate.max;
          const payload = {
            name: f.name.trim(),
            phone: f.phone.trim(),
            email: f.email.trim() || undefined,
            projectType: f.projectType.trim(),
            description: f.description.trim(),
            budget: f.budget || undefined,
            timeline: f.timeline,
            projectComplexity: f.projectComplexity,
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
          />
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
            />
          </div>
          <div className="grid gap-2">
            <Label htmlFor="email">Email</Label>
            <Input
              id="email"
              type="email"
              value={f.email}
              onValueChange={(value) => setF((s) => ({ ...s, email: value }))}
              autoComplete="email"
            />
          </div>
        </div>

        <div className="grid gap-2">
          <Label htmlFor="projectType">Project type *</Label>
          <Input
            id="projectType"
            value={f.projectType}
            onValueChange={(value) =>
              setF((s) => ({ ...s, projectType: value }))
            }
            placeholder="e.g. Plumbing, Electrical"
            required
          />
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
          />
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
            <Input
              id="budget"
              value={f.budget}
              onValueChange={(value) => setF((s) => ({ ...s, budget: value }))}
              inputMode="decimal"
              placeholder="e.g. 1500"
            />
          </div>
          <div className="grid gap-2">
            <span id="complexity-label" className="text-sm font-medium">
              Project complexity
            </span>
            <Select
              value={f.projectComplexity}
              onValueChange={(v) =>
                setF((s) => ({
                  ...s,
                  projectComplexity: (v ?? "simple") as ProjectComplexity,
                }))
              }
            >
              <SelectTrigger className="w-full" aria-labelledby="complexity-label">
                <SelectValue placeholder="Complexity" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="simple">Simple (1×)</SelectItem>
                <SelectItem value="medium">Medium (1.5×)</SelectItem>
                <SelectItem value="complex">Complex (2×)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="grid gap-2">
          <span id="timeline-label" className="text-sm font-medium">
            Timeline
          </span>
          <Select
            value={f.timeline}
            onValueChange={(v) =>
              setF((s) => ({ ...s, timeline: v ?? "flexible" }))
            }
          >
            <SelectTrigger
              className="w-full"
              aria-labelledby="timeline-label"
            >
              <SelectValue placeholder="When do you need it?" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="this week">This week</SelectItem>
              <SelectItem value="this month">This month</SelectItem>
              <SelectItem value="flexible">Flexible</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {create.error && (
          <p className="text-sm text-destructive">{create.error.message}</p>
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
