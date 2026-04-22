"use client";

import * as React from "react";
import { cn } from "../ui/utils";

export type SectionWithHeaderVariant = "default" | "withFilter";

export interface SectionWithHeaderProps {
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Optional id for the title (for aria-labelledby) */
  titleId?: string;
  /** Variant: default (no filter) or withFilter (shows filter slot) */
  variant?: SectionWithHeaderVariant;
  /** Filter content (Select, custom controls). Rendered when variant is "withFilter" */
  filter?: React.ReactNode;
  /** Section content (children) */
  children: React.ReactNode;
  /** Optional className for the section wrapper */
  className?: string;
  /** Optional aria-label for the section */
  "aria-label"?: string;
}

/**
 * SectionWithHeader - Reusable section with consistent header layout.
 * Variant "default": title + description only.
 * Variant "withFilter": title + description + filter slot on the right (like Pipeline Overview).
 */
export function SectionWithHeader({
  title,
  description,
  titleId,
  variant = "default",
  filter,
  children,
  className,
  "aria-label": ariaLabel,
}: SectionWithHeaderProps) {
  const showFilter = variant === "withFilter" && filter;

  return (
    <section
      className={cn("w-full space-y-4", className)}
      aria-labelledby={titleId}
      aria-label={ariaLabel}
    >
      <div className="flex items-center justify-between">
        <div>
          <h3 id={titleId} className="text-base md:text-lg font-bold">
            {title}
          </h3>
          <p className="text-muted-foreground mt-0.5 text-sm md:text-base">{description}</p>
        </div>

        {showFilter && <div className="flex items-center gap-2">{filter}</div>}
      </div>

      {children}
    </section>
  );
}
