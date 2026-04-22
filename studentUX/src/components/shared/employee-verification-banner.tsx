"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";
import { formatDateShort } from "@/utils/date-utils";
import type { ScheduleItem } from "../../data/schedule-data";

export interface EmployeeVerificationBannerProps {
  item: ScheduleItem;
  onClick?: () => void;
  className?: string;
}

/**
 * Banner shown in upcoming board for schedules requiring employee verification.
 * Clicking opens the verification dialog.
 */
export function EmployeeVerificationBanner({
  item,
  onClick,
  className,
}: EmployeeVerificationBannerProps) {
  const dueLabel = item.dueDate
    ? `Due ${formatDateShort(item.dueDate)}`
    : null;

  const ariaLabel = dueLabel
    ? `${item.facilityName} — Employee verification required. ${dueLabel}. Click to verify by site email.`
    : `${item.facilityName} — Employee verification required. Click to verify by site email.`;

  return (
    <div
      role="button"
      tabIndex={0}
      aria-label={ariaLabel}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={cn(
        "rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3",
        "bg-chart-1/5 border-chart-1/15",
        "cursor-pointer hover:bg-chart-1/10 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
    >
      <div className="flex gap-3 min-w-0 flex-1">
        <FontAwesomeIcon
          name="idCardClip"
          className="h-5 w-5 shrink-0 mt-0.5 text-chip-1"
          weight="solid"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">Employee verification required</p>
          {item.facilityName && (
            <p className="text-sm font-medium text-foreground mt-0.5">
              {item.facilityName}
              {dueLabel ? ` — ${dueLabel}` : ""}
            </p>
          )}
          <p className="text-sm text-foreground mt-0.5">
            Verify your employment by entering the site coordinator&apos;s email address.
          </p>
        </div>
      </div>
      {onClick && (
        <Button
          variant="default"
          size="sm"
          className="shrink-0 self-start gap-2"
          onClick={(e) => {
            e.stopPropagation();
            onClick();
          }}
        >
          <FontAwesomeIcon name="userCheck" className="h-3.5 w-3.5" weight="light" aria-hidden />
          Verify
        </Button>
      )}
    </div>
  );
}
