"use client";

import { useEffect, useMemo, useState } from "react";
import { cn } from "@/lib/utils";

type TypewriterHeadlineProps = {
  text: string;
  className?: string;
  speedMs?: number;
  pauseMs?: number;
  mobileBreakBefore?: string;
};

export function TypewriterHeadline({
  text,
  className,
  speedMs = 150,
  pauseMs = 3000,
  mobileBreakBefore
}: TypewriterHeadlineProps) {
  const chars = useMemo(() => Array.from(text), [text]);
  const mobileBreakIndex = mobileBreakBefore ? text.indexOf(mobileBreakBefore) : -1;
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (chars.length === 0) {
      return;
    }

    setIndex(0);
  }, [chars]);

  useEffect(() => {
    if (chars.length === 0) {
      return;
    }

    const timer = window.setTimeout(
      () => {
        setIndex((current) => {
          return current >= chars.length ? 0 : current + 1;
        });
      },
      index >= chars.length ? pauseMs : speedMs
    );

    return () => window.clearTimeout(timer);
  }, [chars.length, index, pauseMs, speedMs]);

  const displayedText = chars.slice(0, index).join("");
  const shouldBreakOnMobile = mobileBreakIndex > 0 && index > mobileBreakIndex;

  return (
    <h1 className={cn(className)}>
      <span>
        {shouldBreakOnMobile ? (
          <>
            {displayedText.slice(0, mobileBreakIndex)}
            <br className="sm:hidden" />
            {displayedText.slice(mobileBreakIndex)}
          </>
        ) : (
          displayedText
        )}
        <span aria-hidden="true" className="type-caret">
          |
        </span>
      </span>
    </h1>
  );
}
