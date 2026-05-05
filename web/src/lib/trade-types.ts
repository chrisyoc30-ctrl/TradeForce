// Comprehensive UK trade list for TradeScore signup.
// Order: most common first, specialist trades after.
// 'Other' kept as fallback for genuinely unusual trades.

export const TRADE_TYPES = [
  // Most common general trades
  "Plumber",
  "Electrician",
  "Joiner / Carpenter",
  "Builder",
  "Painter & Decorator",
  "Roofer",
  "Gas Engineer",
  "Plasterer",
  "Renderer / External Wall Coating",
  "Tiler",

  // Common installation trades
  "Windows & Doors / Glazier",
  "Flooring",
  "Kitchen Fitter",
  "Bathroom Fitter",
  "Handyman / Multi-trade",
  "Bricklayer / Stone Mason",
  "Heating Engineer",
  "Boiler Installer",

  // Outdoor and structural
  "Driveway / Paving",
  "Landscaping / Gardening",
  "Fencing",
  "Decking",
  "Tree Surgeon / Arborist",
  "Scaffolder",

  // Specialist trades
  "Locksmith",
  "Air Conditioning / HVAC",
  "Security Systems / CCTV",
  "Solar Panel Installer",
  "EV Charger Installer",
  "Drainage Specialist",
  "Pest Control",
  "Cleaner",
  "Removals",
  "Demolition",
  "Insulation",
  "Damp Proofing",
  "Asbestos Removal",
  "Welder / Fabrication",

  // Catch-all (always last)
  "Other",
] as const;

export type TradeType = (typeof TRADE_TYPES)[number];

// Scottish postcode areas, ordered by Glasgow proximity.
// We can expand UK-wide later when we launch outside Scotland.

export const POSTCODE_AREAS = [
  { code: "G", label: "G — Glasgow" },
  { code: "ML", label: "ML — Motherwell / Lanarkshire" },
  { code: "PA", label: "PA — Paisley / Renfrewshire" },
  { code: "KA", label: "KA — Kilmarnock / Ayrshire" },
  { code: "FK", label: "FK — Falkirk / Stirling" },
  { code: "EH", label: "EH — Edinburgh / Lothian" },
  { code: "KY", label: "KY — Kirkcaldy / Fife" },
  { code: "DD", label: "DD — Dundee" },
  { code: "PH", label: "PH — Perth / Highland" },
  { code: "AB", label: "AB — Aberdeen" },
  { code: "IV", label: "IV — Inverness" },
  { code: "DG", label: "DG — Dumfries / Galloway" },
  { code: "TD", label: "TD — Borders" },
  { code: "HS", label: "HS — Outer Hebrides" },
  { code: "ZE", label: "ZE — Shetland" },
  { code: "KW", label: "KW — Kirkwall / Orkney" },
] as const;

export type PostcodeArea = (typeof POSTCODE_AREAS)[number]["code"];

/** Labels for signup success copy (code → short place name). */
const AREA_SHORT_LABEL: Record<string, string> = Object.fromEntries(
  POSTCODE_AREAS.map((a) => {
    const short = a.label.includes("—")
      ? a.label.split("—")[1]!.trim()
      : a.label;
    return [a.code, short];
  })
);

export function serviceAreaCodesToShortLabels(codes: string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const c of codes) {
    const key = (c || "").trim().toUpperCase();
    if (!key || seen.has(key)) continue;
    seen.add(key);
    out.push(AREA_SHORT_LABEL[key] ?? key);
  }
  return out;
}

// Helper: extract postcode area from a full UK postcode.
// "G43 2DZ" -> "G", "ML5 4RD" -> "ML", "PA5 9EW" -> "PA".
export function extractPostcodeArea(postcode: string): string {
  const cleaned = (postcode || "").trim().toUpperCase();
  const match = cleaned.match(/^([A-Z]{1,2})\d/);
  return match ? match[1]! : "";
}
