"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "@/components/brand/font-awesome-icon";
import { cn } from "@/components/ui/utils";

export interface ProfileSectionEmptyStateProps {
  /** Icon name from FontAwesome */
  icon: IconName;
  /** Short message shown in the empty state */
  message: string;
  /** Optional longer description */
  description?: string;
  className?: string;
}

/**
 * Empty state for profile section cards.
 * Used when a section has no content (e.g. no education, no work experience).
 */
export function ProfileSectionEmptyState({
  icon,
  message,
  description,
  className,
}: ProfileSectionEmptyStateProps) {
  const text = description ?? message;
  return (
    <div
      role="status"
      className={cn(
        "flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed border-border bg-muted/20 py-8 px-6 text-center",
        className
      )}
    >
      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-muted" aria-hidden>
        <FontAwesomeIcon name={icon} className="h-6 w-6 text-muted-foreground" weight="light" aria-hidden />
      </div>
      {text && (
        <p className="text-sm font-medium text-muted-foreground">{text}</p>
      )}
    </div>
  );
}
