"use client";

import * as React from "react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn, touchTargetMobileClasses } from "../ui/utils";

const HOVER_OPEN_DELAY = 300;
const HOVER_CLOSE_DELAY = 150;

export interface ScheduleNotificationPopoverProps {
  /** "updates" | "messages" */
  variant: "updates" | "messages";
  /** Trigger icon name */
  icon: "bell" | "messageSquare";
  /** Show dot indicator */
  showDot?: boolean;
  /** Unread count for messages (shown in header) */
  unreadCount?: number;
  /** Popover content */
  children: React.ReactNode;
  /** Accessible label for trigger */
  triggerAriaLabel: string;
  /** Accessible label for popover content (announced to screen readers) */
  contentAriaLabel: string;
  /** Compact trigger (e.g. list view) — smaller icon */
  compact?: boolean;
  className?: string;
}

/**
 * Accessible popover for schedule card notifications (updates, messages).
 * WCAG 2.1 AA: keyboard operable (Enter/Space to open, Escape to close),
 * hover-to-open, focus-visible ring, aria-labels.
 */
export function ScheduleNotificationPopover({
  variant,
  icon,
  showDot = false,
  unreadCount,
  children,
  triggerAriaLabel,
  contentAriaLabel,
  compact = false,
  className,
}: ScheduleNotificationPopoverProps) {
  const [open, setOpen] = React.useState(false);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const clearTimers = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
  };

  const handleOpenChange = (next: boolean) => {
    clearTimers();
    setOpen(next);
  };

  const handlePointerEnter = () => {
    clearTimers();
    openTimerRef.current = setTimeout(() => setOpen(true), HOVER_OPEN_DELAY);
  };

  const handlePointerLeave = () => {
    clearTimers();
    closeTimerRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  };

  React.useEffect(() => () => clearTimers(), []);

  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span className="inline-flex">
          <Popover open={open} onOpenChange={handleOpenChange}>
            <PopoverTrigger asChild>
              <button
          type="button"
          className={cn(
            "relative flex items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground",
            "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
            "shrink-0",
            className ?? cn(touchTargetMobileClasses, "md:h-6 md:w-6")
          )}
          aria-label={triggerAriaLabel}
          aria-expanded={open}
          aria-haspopup="dialog"
          onPointerEnter={handlePointerEnter}
          onPointerLeave={handlePointerLeave}
          onKeyDown={(e) => {
            if (e.key === "Enter" || e.key === " ") {
              e.stopPropagation();
            }
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <FontAwesomeIcon
            name={icon}
            className={compact ? "h-4 w-4" : "h-5 w-5 md:h-4 md:w-4"}
            weight="light"
            aria-hidden
          />
          {showDot && (
            <span
              className="absolute top-0 right-0 h-1.5 w-1.5 rounded-full update-dot-gradient"
              aria-hidden
            />
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent
        side="bottom"
        align="end"
        className="w-72"
        aria-label={contentAriaLabel}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
        onOpenAutoFocus={(e) => e.preventDefault()}
      >
        {children}
      </PopoverContent>
          </Popover>
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">{triggerAriaLabel}</TooltipContent>
    </Tooltip>
  );
}
