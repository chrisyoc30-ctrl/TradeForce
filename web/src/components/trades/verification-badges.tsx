const BADGE_CONFIG = {
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
