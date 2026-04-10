import { type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type TextAreaProps = TextareaHTMLAttributes<HTMLTextAreaElement>;

export function TextArea({ className, ...props }: TextAreaProps) {
  return (
    <textarea
      className={cn(
        "min-h-36 w-full rounded-xl border border-moss-300 bg-white px-4 py-3 text-sm leading-6 text-ink-900",
        "placeholder:text-ink-900/45 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-moss-300",
        className
      )}
      {...props}
    />
  );
}
