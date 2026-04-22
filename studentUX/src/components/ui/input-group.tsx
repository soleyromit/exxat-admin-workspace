"use client";

import * as React from "react";
import { cn } from "./utils";
import { Input } from "./input";

const InputGroup = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement>
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="input-group"
    className={cn(
      "flex min-w-0 items-center overflow-hidden rounded-md border bg-input-background transition-[color,box-shadow]",
      "border-[var(--control-border)]",
      "focus-within:border-ring focus-within:ring-ring/50 focus-within:ring-[3px]",
      "has-[[data-slot=input-group-control]:focus]:border-ring has-[[data-slot=input-group-control]:focus]:ring-ring/50 has-[[data-slot=input-group-control]:focus]:ring-[3px]",
      className
    )}
    {...props}
  />
));
InputGroup.displayName = "InputGroup";

type InputGroupAddonAlign =
  | "inline-start"
  | "inline-end"
  | "block-start"
  | "block-end";

const InputGroupAddon = React.forwardRef<
  HTMLDivElement,
  React.HTMLAttributes<HTMLDivElement> & { align?: InputGroupAddonAlign }
>(({ className, align = "inline-start", ...props }, ref) => {
  const alignClass =
    align === "inline-end"
      ? "order-last"
      : align === "block-start"
        ? "order-first w-full"
        : align === "block-end"
          ? "order-last w-full"
          : "order-first";
  return (
    <div
      ref={ref}
      data-slot="input-group-addon"
      data-align={align}
      className={cn(
        "inline-flex shrink-0 items-center gap-1 text-muted-foreground",
        alignClass,
        className
      )}
      {...props}
    />
  );
});
InputGroupAddon.displayName = "InputGroupAddon";

const InputGroupInput = React.forwardRef<
  HTMLInputElement,
  React.ComponentProps<typeof Input>
>(({ className, ...props }, ref) => (
  <Input
    ref={ref}
    data-slot="input-group-control"
    className={cn(
      "h-8 flex-1 min-w-0 border-0 bg-transparent px-3 shadow-none focus-visible:ring-0 focus-visible:ring-offset-0",
      className
    )}
    {...props}
  />
));
InputGroupInput.displayName = "InputGroupInput";

const InputGroupText = React.forwardRef<
  HTMLSpanElement,
  React.HTMLAttributes<HTMLSpanElement>
>(({ className, ...props }, ref) => (
  <span
    ref={ref}
    data-slot="input-group-text"
    className={cn("text-sm text-muted-foreground", className)}
    {...props}
  />
));
InputGroupText.displayName = "InputGroupText";

export {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
};
