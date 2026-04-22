"use client";

import * as React from "react";

import { Label } from "./label";
import { cn } from "./utils";

function FieldGroup({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="field-group" className={cn("grid gap-3", className)} {...props} />;
}

function FieldSet({
  className,
  ...props
}: React.ComponentProps<"fieldset">) {
  return <fieldset data-slot="field-set" className={cn("grid gap-3 border-0 p-0 m-0 min-w-0", className)} {...props} />;
}

function FieldLegend({
  className,
  variant = "default",
  ...props
}: React.ComponentProps<"legend"> & { variant?: "default" | "label" }) {
  return (
    <legend
      data-slot="field-legend"
      data-variant={variant}
      className={cn(
        variant === "label"
          ? "text-sm font-medium text-foreground"
          : "text-base font-semibold text-foreground",
        className
      )}
      {...props}
    />
  );
}

function FieldDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="field-description"
      className={cn("text-sm text-muted-foreground", className)}
      {...props}
    />
  );
}

function FieldLabel({
  className,
  ...props
}: React.ComponentProps<typeof Label>) {
  return (
    <Label
      data-slot="field-label"
      className={cn("w-full cursor-pointer rounded-xl", className)}
      {...props}
    />
  );
}

function Field({
  className,
  orientation = "vertical",
  ...props
}: React.ComponentProps<"div"> & { orientation?: "horizontal" | "vertical" }) {
  return (
    <div
      data-slot="field"
      data-orientation={orientation}
      className={cn(
        "flex rounded-xl border border-[var(--control-border)] bg-card px-4 py-3 transition-colors",
        "hover:border-primary/40 hover:bg-muted/30",
        "has-[[data-state=checked]]:border-chart-2 has-[[data-state=checked]]:bg-chart-2/15",
        orientation === "horizontal" ? "items-center justify-between gap-4" : "flex-col gap-3",
        className
      )}
      {...props}
    />
  );
}

function FieldContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="field-content" className={cn("flex min-w-0 flex-1 flex-col gap-1", className)} {...props} />;
}

function FieldTitle({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return <div data-slot="field-title" className={cn("text-sm font-semibold text-foreground", className)} {...props} />;
}

export {
  Field,
  FieldContent,
  FieldDescription,
  FieldGroup,
  FieldLabel,
  FieldLegend,
  FieldSet,
  FieldTitle,
};
