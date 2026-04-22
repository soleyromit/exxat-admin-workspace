"use client";

import * as React from "react";
import { cn } from "./utils";

const Empty = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<"div">
>(({ className, ...props }, ref) => (
  <div
    ref={ref}
    data-slot="empty"
    className={cn(
      "flex flex-col items-center justify-center gap-6 rounded-xl py-12 px-6 text-center",
      className
    )}
    {...props}
  />
));
Empty.displayName = "Empty";

function EmptyHeader({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-header"
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

function EmptyMedia({
  variant = "default",
  className,
  ...props
}: React.ComponentProps<"div"> & {
  variant?: "default" | "icon" | "illustration";
}) {
  return (
    <div
      data-slot="empty-media"
      className={cn(
        variant === "icon" &&
          "flex size-12 items-center justify-center rounded-full bg-muted text-muted-foreground [&>*]:size-6",
        variant === "illustration" &&
          "flex items-center justify-center w-full max-w-[200px] md:max-w-[240px] [&>img]:max-h-[140px] md:[&>img]:max-h-[180px] [&>img]:object-contain",
        className
      )}
      {...props}
    />
  );
}

function EmptyTitle({
  size = "default",
  className,
  ...props
}: React.ComponentProps<"h3"> & {
  size?: "default" | "large";
}) {
  return (
    <h3
      data-slot="empty-title"
      className={cn(
        "font-semibold leading-tight",
        size === "default" && "text-base",
        size === "large" && "page-title-sm",
        className
      )}
      {...props}
    />
  );
}

function EmptyDescription({
  className,
  ...props
}: React.ComponentProps<"p">) {
  return (
    <p
      data-slot="empty-description"
      className={cn("text-sm text-muted-foreground max-w-sm", className)}
      {...props}
    />
  );
}

function EmptyContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="empty-content"
      className={cn("flex flex-col items-center gap-2", className)}
      {...props}
    />
  );
}

export {
  Empty,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
  EmptyDescription,
  EmptyContent,
};
