import React from "react";
import { cn } from "@/lib/utils";

type Props = {
  label?: string;
  className?: string;
  variant?: "page" | "inline";
};

const LoadingSpinner = ({
  label = "Loading...",
  className,
  variant = "page",
}: Props) => {
  const isInline = variant === "inline";

  return (
    <div
      className={cn(
        "flex items-center justify-center",
        isInline && "justify-start",
        className,
      )}
    >
      <div
        className={cn(
          "flex items-center",
          isInline ? "gap-2" : "flex-col gap-3",
        )}
      >
        <div
          className={cn(
            "animate-spin rounded-full border-2 border-muted border-t-primary",
            isInline ? "h-4 w-4" : "h-8 w-8",
          )}
          aria-hidden="true"
        />
        <p
          className={cn(
            "text-muted-foreground",
            isInline ? "text-xs" : "text-sm",
          )}
        >
          {label}
        </p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
