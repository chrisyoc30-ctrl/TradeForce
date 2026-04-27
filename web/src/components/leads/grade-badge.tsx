import { cn } from "@/lib/utils";

export type LeadGrade = "A" | "B" | "C";

const STYLES: Record<
  LeadGrade,
  { className: string; label: string }
> = {
  A: {
    className: "bg-emerald-600 text-white",
    label: "Grade A",
  },
  B: {
    className: "bg-amber-500 text-white",
    label: "Grade B",
  },
  C: {
    className: "bg-slate-600 text-white",
    label: "Grade C",
  },
};

type GradeBadgeProps = {
  grade: LeadGrade;
  size?: "sm" | "md";
};

export function GradeBadge({ grade, size = "md" }: GradeBadgeProps) {
  const s = STYLES[grade];
  return (
    <span
      className={cn(
        "inline-flex items-center justify-center rounded-full font-semibold",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-3 py-1 text-sm",
        s.className
      )}
    >
      {s.label}
    </span>
  );
}
