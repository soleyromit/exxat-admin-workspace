"use client";

import * as React from "react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";

export interface ScheduleListViewRowProps {
  /** Avatar image URL (optional) */
  avatarSrc?: string;
  /** Avatar alt text when using image */
  avatarAlt?: string;
  /** Avatar fallback content (initials, icon, etc.) */
  avatarFallback: React.ReactNode;
  /** Primary title text */
  title: React.ReactNode;
  /** Optional subtitle below title */
  subtitle?: React.ReactNode;
  /** Optional trailing content (chips, date, etc.) - shown before action */
  trailing?: React.ReactNode;
  /** Optional action (button, chevron, etc.) - shown on the right */
  action?: React.ReactNode;
  /** Click handler - makes row interactive (role=button, tabIndex=0) */
  onClick?: () => void;
  /** Accessible label for the row when interactive (e.g. "View Immunization Records requirement") */
  ariaLabel?: string;
  /** Additional className for the row */
  className?: string;
  /** Show chevron when row is clickable and no action provided */
  showChevron?: boolean;
  /** Use compact grid for narrower containers (e.g. schedule detail) */
  variant?: "default" | "compact";
}

/**
 * Reusable schedule list view row — consistent layout across schedule list,
 * requirement rows, and detail card rows.
 *
 * Layout: Avatar | Title + Subtitle | Trailing | Action
 */
export function ScheduleListViewRow({
  avatarSrc,
  avatarAlt,
  avatarFallback,
  title,
  subtitle,
  trailing,
  action,
  onClick,
  ariaLabel,
  className,
  showChevron = false,
  variant = "default",
}: ScheduleListViewRowProps) {
  const isInteractive = Boolean(onClick);

  const hasAction = action != null || showChevron;
  const actionContent = hasAction
    ? (action ?? <FontAwesomeIcon name="chevronRight" className="h-4 w-4 text-muted-foreground/60" weight="light" />)
    : null;

  const content = (
    <>
      {/* Column 1: Avatar */}
      <Avatar className={cn(
        "shrink-0 rounded-lg",
        variant === "compact" ? "h-8 w-8 sm:h-9 sm:w-9" : "h-9 w-9"
      )}>
        {avatarSrc && <AvatarImage src={avatarSrc} alt={avatarAlt ?? ""} />}
        <AvatarFallback className="rounded-lg text-xs bg-muted">
          {avatarFallback}
        </AvatarFallback>
      </Avatar>

      {/* Column 2: Title + Subtitle (no truncate) */}
      <div className={cn("min-w-0 flex flex-col", variant === "compact" ? "gap-0.5" : "gap-2")}>
        <div className={cn(
          "font-extrabold text-foreground break-words",
          variant === "compact" ? "text-sm sm:text-base" : "text-base md:text-lg"
        )}>{title}</div>
        {subtitle && (
          <div className="text-xs text-muted-foreground break-words">{subtitle}</div>
        )}
      </div>

      {/* Column 3: Trailing chips — right-aligned, pushed right */}
      <div className="flex items-center justify-end gap-1.5 min-w-0 shrink-0">
        {trailing}
      </div>

      {/* Column 4: Action — right-aligned */}
      <div className="flex items-center justify-end min-w-0">
        {actionContent}
      </div>
    </>
  );

  const rowClassName = cn(
    "grid items-center transition-all duration-200",
    variant === "compact"
      ? "gap-2 sm:gap-3 px-3 py-2.5 sm:px-4 sm:py-3"
      : "gap-4 px-4 py-3",
    isInteractive && "cursor-pointer hover:bg-sidebar/50 hover:shadow-md focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset",
    className
  );

  const gridStyle: React.CSSProperties =
    variant === "compact"
      ? { gridTemplateColumns: "auto minmax(0, 1fr) auto auto" }
      : { gridTemplateColumns: "auto minmax(0, 1fr) auto auto" };

  if (isInteractive) {
    return (
      <div
        role="button"
        tabIndex={0}
        aria-label={ariaLabel}
        className={rowClassName}
        style={gridStyle}
        onClick={onClick}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            onClick?.();
          }
        }}
      >
        {content}
      </div>
    );
  }

  return (
    <div className={rowClassName} style={gridStyle}>
      {content}
    </div>
  );
}
