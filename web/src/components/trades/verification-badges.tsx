const BADGE_CONFIG = {
  // Legacy slugs (pre-badges-dict trades)
  companies_house: {
    label: "Companies House verified",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  },
  id_verified: {
    label: "ID verified",
    className: "bg-green-100 text-green-800 dark:bg-green-950/50 dark:text-green-200",
  },
  insured: {
    label: "Insured",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200",
  },
  // Modern badge keys (badges dict / admin grant flow)
  companies_house_verified: {
    label: "Companies House verified",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  },
  sole_trader_verified: {
    label: "Sole trader verified",
    className: "bg-blue-100 text-blue-800 dark:bg-blue-950/50 dark:text-blue-200",
  },
  gas_safe_registered: {
    label: "Gas Safe registered",
    className: "bg-orange-100 text-orange-900 dark:bg-orange-950/50 dark:text-orange-200",
  },
  niceic_registered: {
    label: "NICEIC registered",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  napit_registered: {
    label: "NAPIT registered",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  elecsa_registered: {
    label: "ELECSA registered",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  stroma_registered: {
    label: "STROMA registered",
    className: "bg-amber-100 text-amber-900 dark:bg-amber-950/50 dark:text-amber-200",
  },
  public_liability_insured: {
    label: "Public liability insured",
    className:
      "bg-purple-100 text-purple-800 dark:bg-purple-950/50 dark:text-purple-200",
  },
  founder_reviewed: {
    label: "Founder reviewed",
    className: "bg-yellow-100 text-yellow-900 dark:bg-yellow-950/50 dark:text-yellow-200",
  },
} as const;

export function VerificationBadges({ badges }: { badges: string[] | undefined }) {
  const list = Array.isArray(badges) ? badges : [];
  if (!list.length) return null;

  return (
    <div className="flex flex-wrap gap-2">
      {list.map((badge) => {
        const cfg = BADGE_CONFIG[badge as keyof typeof BADGE_CONFIG];
        if (!cfg) return null;
        return (
          <span
            key={badge}
            className={`rounded px-2 py-1 text-xs font-medium ${cfg.className}`}
          >
            ✓ {cfg.label}
          </span>
        );
      })}
    </div>
  );
}
