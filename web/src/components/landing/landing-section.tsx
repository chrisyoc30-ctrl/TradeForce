import { cn } from "@/lib/utils";

type LandingSectionProps = {
  id?: string;
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
  /** Alternate background band */
  variant?: "default" | "muted";
};

export function LandingSection({
  id,
  title,
  description,
  children,
  className,
  variant = "default",
}: LandingSectionProps) {
  const headingId = id ? `${id}-heading` : undefined;

  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "scroll-mt-20 border-t border-white/10 px-6 py-16 lg:px-8 lg:py-24",
        variant === "muted" && "bg-zinc-900/40",
        className
      )}
    >
      <div className="mx-auto max-w-7xl">
        <div className="mx-auto max-w-3xl text-center">
          <h2
            id={headingId}
            className="text-balance text-2xl font-semibold tracking-tight text-foreground sm:text-3xl lg:text-4xl"
          >
            {title}
          </h2>
          {description ? (
            <p className="mt-4 text-pretty text-base text-muted-foreground sm:text-lg">
              {description}
            </p>
          ) : null}
        </div>
        <div className="mt-12 lg:mt-16">{children}</div>
      </div>
    </section>
  );
}
