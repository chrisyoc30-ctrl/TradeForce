import { cn } from "@/lib/utils";

type HomepageSectionProps = {
  id?: string;
  /** Small label above title */
  eyebrow?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Extra class for inner container */
  containerClassName?: string;
};

/**
 * Semantic section wrapper with consistent spacing and max-width.
 */
export function HomepageSection({
  id,
  eyebrow,
  title,
  description,
  children,
  className,
  containerClassName,
}: HomepageSectionProps) {
  return (
    <section
      id={id}
      aria-labelledby={id ? `${id}-heading` : undefined}
      className={cn("scroll-mt-20 px-4 py-16 sm:px-6 sm:py-20 lg:py-24", className)}
    >
      <div
        className={cn(
          "mx-auto max-w-6xl",
          containerClassName
        )}
      >
        <div className="mx-auto max-w-3xl text-center">
          {eyebrow ? (
            <p className="mb-3 text-xs font-semibold uppercase tracking-[0.2em] text-[#FF6B35]">
              {eyebrow}
            </p>
          ) : null}
          <h2
            id={id ? `${id}-heading` : undefined}
            className="text-balance text-3xl font-semibold tracking-tight text-foreground sm:text-4xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-12 sm:mt-16">{children}</div>
      </div>
    </section>
  );
}
