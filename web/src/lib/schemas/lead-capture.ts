import { z } from "zod";

/**
 * Client-side lead form validation (stricter UX than tRPC min rules).
 * Keep aligned with `LeadCapture` fields and `leads.create` input.
 */
export const leadCaptureFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Name must be at least 2 characters")
    .max(120, "Name is too long"),
  phone: z
    .string()
    .trim()
    .min(5, "Enter a valid phone number")
    .max(32, "Phone number is too long")
    .regex(
      /^[\d\s+().-]+$/,
      "Phone should contain only digits and common separators",
    ),
  email: z
    .string()
    .max(254)
    .transform((s) => s.trim())
    .refine(
      (s) => s === "" || z.string().email().safeParse(s).success,
      "Enter a valid email address",
    )
    .transform((s) => (s === "" ? undefined : s)),
  projectType: z
    .string()
    .trim()
    .min(1, "Please select a project type")
    .max(120),
  location: z
    .string()
    .trim()
    .min(2, "Enter your postcode or area")
    .max(80),
  description: z
    .string()
    .trim()
    .min(10, "Please add a bit more detail (at least 10 characters)")
    .max(8000, "Description is too long"),
  budget: z.string().optional(),
  timeline: z.string().min(1),
  projectComplexity: z.enum(["simple", "medium", "complex"]),
});

export type LeadCaptureFormInput = z.infer<typeof leadCaptureFormSchema>;
