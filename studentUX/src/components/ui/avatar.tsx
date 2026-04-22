"use client";

import * as React from "react";
import * as AvatarPrimitive from "@radix-ui/react-avatar@1.1.3";

import { cn } from "./utils";

/** Exxat E icon for avatar placeholder — uses currentColor or fillColor for theme compatibility */
function AvatarPlaceholderIcon({
  className,
  fillColor,
}: {
  className?: string;
  /** Optional: explicit fill (e.g. "var(--chart-1)" or color-mix for light lavender) */
  fillColor?: string;
}) {
  const pathFill = fillColor ?? "currentColor";
  return (
    <svg
      viewBox="0 0 178 197"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden
      className={cn("size-full p-2 text-muted-foreground", className)}
    >
      <path
        d="M177.229 196.93H31.7695L54.5098 157.54H177.229V196.93ZM77.2598 118.16L54.5098 157.54H0V118.16H77.2598ZM177.231 118.16H77.2617L88.6221 98.4697L77.2617 78.7705H177.231V118.16ZM77.2598 78.7705H0V39.3896H54.5098L77.2598 78.7705ZM177.229 39.3896H54.5098L31.7695 0H177.229V39.3896Z"
        fill={pathFill}
      />
    </svg>
  );
}

function Avatar({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Root>) {
  return (
    <AvatarPrimitive.Root
      data-slot="avatar"
      className={cn(
        "relative flex size-10 shrink-0 overflow-hidden rounded-full",
        className,
      )}
      {...props}
    />
  );
}

function AvatarImage({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Image>) {
  return (
    <AvatarPrimitive.Image
      data-slot="avatar-image"
      className={cn("aspect-square size-full", className)}
      {...props}
    />
  );
}

function AvatarFallback({
  className,
  ...props
}: React.ComponentProps<typeof AvatarPrimitive.Fallback>) {
  return (
    <AvatarPrimitive.Fallback
      data-slot="avatar-fallback"
      className={cn(
        "bg-muted flex size-full items-center justify-center rounded-full",
        className,
      )}
      {...props}
    />
  );
}

export { Avatar, AvatarImage, AvatarFallback, AvatarPlaceholderIcon };
