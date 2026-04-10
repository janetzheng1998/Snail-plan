import Link from "next/link";
import { BrandLockup } from "@/components/brand-lockup";
import { cn } from "@/lib/utils";

const navItems = [
  { href: "/", label: "首页" },
  { href: "/plans/new", label: "开始新目标" },
  { href: "/plans", label: "我的计划" },
  { href: "/calendar", label: "成长日历" }
];

type AppHeaderProps = {
  currentPath: string;
};

function isActive(currentPath: string, href: string): boolean {
  if (href === "/") {
    return currentPath === "/";
  }

  if (href === "/plans") {
    return currentPath.startsWith("/plans") && !currentPath.startsWith("/plans/new");
  }

  return currentPath.startsWith(href);
}

export function AppHeader({ currentPath }: AppHeaderProps) {
  return (
    <header className="mb-9 rounded-[1.2rem] border border-white/70 bg-white/62 px-4 py-3 shadow-[0_8px_22px_-22px_rgba(31,42,38,0.55)] backdrop-blur sm:px-5">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <BrandLockup size="header" />

        <nav className="flex flex-wrap gap-2" aria-label="主导航">
          {navItems.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "rounded-full border px-3 py-1 text-sm transition",
                isActive(currentPath, item.href)
                  ? "border-moss-700 bg-moss-700 text-white"
                  : "border-white/80 bg-white/72 text-ink-900/74 hover:border-moss-300 hover:text-moss-700"
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
