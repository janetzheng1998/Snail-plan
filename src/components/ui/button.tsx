import { type ButtonHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type ButtonVariant = "primary" | "secondary" | "ghost";
type ButtonSize = "md" | "lg";

export function buttonClasses(
  variant: ButtonVariant = "primary",
  size: ButtonSize = "md",
  fullWidth = false
): string {
  return cn(
    "inline-flex items-center justify-center rounded-full border font-medium tracking-[0.01em] transition-all duration-200",
    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300 focus-visible:ring-offset-2 focus-visible:ring-offset-transparent",
    size === "md" && "h-11 px-5 text-sm",
    size === "lg" && "h-12 px-6 text-base",
    variant === "primary" &&
      "border-moss-700 bg-gradient-to-b from-moss-600 to-moss-700 text-white shadow-lg shadow-moss-700/20 hover:-translate-y-0.5 hover:shadow-xl",
    variant === "secondary" &&
      "border-moss-300 bg-white/92 text-moss-700 hover:border-moss-500 hover:bg-moss-50",
    variant === "ghost" &&
      "border-transparent bg-white/65 text-ink-900 hover:border-moss-300 hover:bg-white",
    fullWidth && "w-full"
  );
}

type ButtonProps = ButtonHTMLAttributes<HTMLButtonElement> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  fullWidth?: boolean;
};

export function Button({
  className,
  variant = "primary",
  size = "md",
  fullWidth = false,
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(buttonClasses(variant, size, fullWidth), className)}
      {...props}
    />
  );
}
