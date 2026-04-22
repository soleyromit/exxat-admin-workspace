"use client";

import * as React from "react";
import * as ProgressPrimitive from "@radix-ui/react-progress@1.1.2";

import { cn } from "./utils";

export type ProgressVariant = "default" | "success" | "warning" | "destructive" | "auto";

const indicatorVariants: Record<Exclude<ProgressVariant, "auto">, string> = {
  default: "bg-primary",
  success: "bg-chart-2",
  warning: "bg-chart-4",
  destructive: "bg-destructive",
};

function getProgressVariantFromValue(value: number): Exclude<ProgressVariant, "auto"> {
  if (value >= 67) return "success";
  if (value >= 34) return "warning";
  return "destructive";
}

function Progress({
  className,
  value,
  variant,
  indicatorClassName,
  ...props
}: React.ComponentProps<typeof ProgressPrimitive.Root> & {
  variant?: ProgressVariant;
  indicatorClassName?: string;
}) {
  const resolvedVariant =
    variant === "auto"
      ? getProgressVariantFromValue(value ?? 0)
      : variant ?? "default";
  const indicatorVariant = indicatorVariants[resolvedVariant];
  return (
    <ProgressPrimitive.Root
      data-slot="progress"
      className={cn(
        "bg-muted relative h-2 w-full overflow-hidden rounded-full",
        className,
      )}
      {...props}
    >
      <ProgressPrimitive.Indicator
        data-slot="progress-indicator"
        className={cn(indicatorVariant, "h-full w-full flex-1 transition-all duration-200", indicatorClassName)}
        style={{ transform: `translateX(-${100 - (value || 0)}%)` }}
      />
    </ProgressPrimitive.Root>
  );
}

export { Progress };
