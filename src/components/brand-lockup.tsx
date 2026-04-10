import { cn } from "@/lib/utils";

type BrandLockupProps = {
  size?: "header" | "hero";
};

export function BrandLockup({ size = "header" }: BrandLockupProps) {
  const large = size === "hero";

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={cn(
          "flex items-center justify-center rounded-full border border-moss-200 bg-white/80",
          large ? "h-12 w-12" : "h-9 w-9"
        )}
        aria-hidden="true"
      >
        <svg
          viewBox="0 0 64 64"
          fill="none"
          className={cn("text-moss-700", large ? "h-7 w-7" : "h-5 w-5")}
        >
          <path
            d="M39 25c0-8-6-14-14-14s-14 6-14 14 6 14 14 14c5 0 10-4 10-10 0-4-4-8-8-8s-7 3-7 7c0 3 2 5 5 5"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8 39h21c10 0 18 7 19 14H29c-12 0-21-6-21-14Z"
            stroke="currentColor"
            strokeWidth="4"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path d="M35 39l4-9" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <path d="M41 39l6-8" stroke="currentColor" strokeWidth="4" strokeLinecap="round" />
          <circle cx="39" cy="30" r="1.8" fill="currentColor" />
          <circle cx="47" cy="31" r="1.8" fill="currentColor" />
        </svg>
      </div>

      <div className="flex items-baseline gap-3 leading-none">
        <p
          className={cn(
            "font-brand-cn font-bold tracking-[0.01em] text-ink-900",
            large ? "text-3xl" : "text-[2rem]"
          )}
        >
          蜗牛计划
        </p>
        <p
          className={cn(
            "font-brand-en font-bold text-ink-900/52",
            large ? "text-[1.65rem] tracking-[0.04em]" : "text-[1.45rem] tracking-[0.03em]"
          )}
        >
          Snail Plan
        </p>
      </div>
    </div>
  );
}
