import { type HTMLAttributes } from "react";
import { cn } from "@/lib/utils";

export function Tag({ className, ...props }: HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-moss-300 bg-moss-50 px-3 py-1 text-xs font-medium text-moss-700",
        className
      )}
      {...props}
    />
  );
}
