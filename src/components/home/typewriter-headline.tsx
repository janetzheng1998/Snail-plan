"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TypewriterHeadlineProps = {
  text: string;
  className?: string;
  speedMs?: number;
};

export function TypewriterHeadline({
  text,
  className,
  speedMs = 150
}: TypewriterHeadlineProps) {
  const chars = useMemo(() => Array.from(text), [text]);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (chars.length === 0) {
      return;
    }

    setIndex(0);
    const timer = window.setInterval(() => {
      setIndex((current) => {
        return current >= chars.length ? 0 : current + 1;
      });
    }, speedMs);

    return () => window.clearInterval(timer);
  }, [chars, speedMs]);

  const displayedText = chars.slice(0, index).join("");

  return (
    <h1 className={cn(className)}>
      <span className="relative inline-block whitespace-nowrap">
        <span className="invisible select-none">{text}</span>
        <span className="absolute left-0 top-0 whitespace-nowrap text-left">
          {displayedText}
          <span aria-hidden="true" className="type-caret">
            |
          </span>
        </span>
      </span>
    </h1>
  );
}
