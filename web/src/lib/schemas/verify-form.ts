import { z } from "zod";

export const TS_ID_REGEX = /^TS-[A-Z0-9]{4,8}$/i;

export const verifyFormSchema = z
  .object({
    tradesperson_id: z
      .string()
      .trim()
      .toUpperCase()
      .regex(TS_ID_REGEX, "Enter a valid TradeScore ID (e.g. TS-EPQJF2)"),
    business_name: z.string().trim().max(200).optional(),
    business_structure: z.enum(
      ["sole_trader", "limited_company", "partnership"],
      "Select your business structure",
    ),
    companies_house_number: z.string().trim().toUpperCase().max(8).optional(),
    years_experience: z.coerce
      .number("Enter years of experience")
      .min(0, "Minimum 0 years")
      .max(70, "Maximum 70 years"),
    customer_facing_bio: z
      .string()
      .trim()
      .min(10, "Bio must be at least 10 characters")
      .max(280, "Bio must be 280 characters or fewer"),
    insurance_company: z.string().trim().min(1, "Insurance company is required").max(120),
    insurance_policy_number: z.string().trim().min(1, "Policy number is required").max(100),
    insurance_expiry: z.string().trim().min(1, "Expiry date is required"),
    id_type: z.enum(["driving_licence", "passport"], "Select ID type"),
    gas_safe_number: z.string().trim().max(10).optional(),
    niceic_reg: z.string().trim().max(20).optional(),
    napit_reg: z.string().trim().max(20).optional(),
    elecsa_reg: z.string().trim().max(20).optional(),
    stroma_reg: z.string().trim().max(20).optional(),
    cps_other_name: z.string().trim().max(80).optional(),
    cps_other_number: z.string().trim().max(20).optional(),
    other_certifications: z.string().trim().max(500).optional(),
    confirm_accurate: z.literal(
      true,
      "You must confirm your information is accurate",
    ),
    confirm_authorities: z.literal(
      true,
      "You must agree to verification with issuing authorities",
    ),
  })
  .superRefine((data, ctx) => {
    if (
      data.business_structure === "limited_company" &&
      (!data.companies_house_number || !/^[A-Z0-9]{8}$/.test(data.companies_house_number))
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "Enter a valid 8-character Companies House number",
        path: ["companies_house_number"],
      });
    }
  });

export type VerifyFormValues = z.infer<typeof verifyFormSchema>;

export type VerifyProfile = {
  id: string;
  full_name?: string;
  email?: string;
  trade_type?: string;
  business_name?: string;
  business_structure?: string;
  can_submit?: boolean;
  submission_blocked_reason?: string | null;
};

export const VERIFY_SECTIONS = [
  "Identify",
  "Business",
  "Bio",
  "Insurance",
  "Photo ID",
  "Certifications",
  "Confirm",
] as const;

export const CPS_SCHEME_OPTIONS = [
  { id: "niceic", label: "NICEIC", numberField: "niceic_reg" as const },
  { id: "napit", label: "NAPIT", numberField: "napit_reg" as const },
  { id: "elecsa", label: "ELECSA", numberField: "elecsa_reg" as const },
  { id: "stroma", label: "STROMA", numberField: "stroma_reg" as const },
  { id: "other", label: "Other", numberField: "cps_other_number" as const, other: true },
] as const;

export type CpsSchemeId = (typeof CPS_SCHEME_OPTIONS)[number]["id"];
