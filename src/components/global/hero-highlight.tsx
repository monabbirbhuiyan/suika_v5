"use client";

import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface HeroHighlightProps {
  children: ReactNode;
  className?: string;
  containerClassName?: string;
}

export function HeroHighlight({
  children,
  className,
  containerClassName,
}: HeroHighlightProps) {
  return (
    <div className={cn("relative overflow-hidden", containerClassName)}>
      <div className={cn("relative", className)}>{children}</div>
    </div>
  );
}
