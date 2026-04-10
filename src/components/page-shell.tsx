import { type ReactNode } from "react";
import { AppHeader } from "@/components/app-header";
import { cn } from "@/lib/utils";

type PageShellProps = {
  title?: string;
  subtitle?: string;
  eyebrow?: string;
  heroTone?: "default" | "home";
  currentPath: string;
  children: ReactNode;
};

export function PageShell({
  title,
  subtitle,
  eyebrow,
  heroTone = "default",
  currentPath,
  children
}: PageShellProps) {
  const isHomeTone = heroTone === "home";
  const hasHeroContent = Boolean(title || subtitle || eyebrow);

  return (
    <main className="relative z-10 mx-auto w-full max-w-6xl px-4 py-8 sm:px-6 lg:py-12">
      <AppHeader currentPath={currentPath} />

      {hasHeroContent ? (
        <section className={cn("mb-8 max-w-4xl space-y-3", isHomeTone && "mb-7 max-w-3xl space-y-2.5")}>
          {eyebrow ? (
            <p
              className={cn(
                "text-xs tracking-[0.06em] text-moss-700/85",
                isHomeTone && "text-[13px] tracking-[0.08em]"
              )}
            >
              {eyebrow}
            </p>
          ) : null}

          {title ? (
            <h2
              className={cn(
                "text-3xl text-ink-900 sm:text-4xl",
                isHomeTone && "max-w-3xl text-[2rem] leading-[1.26] sm:text-[2.35rem]"
              )}
            >
              {title}
            </h2>
          ) : null}
          {subtitle ? (
            <p
              className={cn(
                "max-w-3xl text-sm leading-7 text-ink-900/72 sm:text-base",
                isHomeTone && "max-w-2xl text-[15px] leading-7 text-ink-900/70 sm:text-base"
              )}
            >
              {subtitle}
            </p>
          ) : null}
        </section>
      ) : null}

      {children}
    </main>
  );
}
