"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn, touchTargetMobileClasses } from "../ui/utils";
import { formatDate, formatDateRange, formatDueDateCompact } from "@/utils/date-utils";
import type { WishlistItem, WishlistItemStatus } from "../../data/wishlist-data";

export interface WishlistCardProps {
  item: WishlistItem;
  className?: string;
  onClick?: () => void;
  /** Hide the CTA button (e.g. when used in instructions flow) */
  hideCta?: boolean;
  /** Hide due date and status badges (e.g. when used in instructions flow) */
  hideBadges?: boolean;
  /** Text only: hide icons (e.g. when used in instructions flow) */
  hideIcons?: boolean;
}

/* Chip styles — match todo-task-card (Badge + design tokens from globals.css) */
const CLOSING_SOON_STYLE = "bg-chart-4/10 text-chip-4 border-chip-4/40";
const OPEN_STYLE = "bg-chart-1/10 text-chip-1 border-chip-1/40";
const VIEW_SUBMISSION_STYLE = "bg-chart-1/10 text-chip-1 border-chip-1/40";
const CLOSED_STYLE = "border-border bg-muted/60 text-muted-foreground";

const STATUS_CHIP: Record<
  WishlistItemStatus,
  { icon: React.ComponentProps<typeof FontAwesomeIcon>["name"]; label: string; className: string }
> = {
  "preferences-not-submitted": {
    icon: "clock",
    label: "Open",
    className: OPEN_STYLE,
  },
  "preferences-submitted": {
    icon: "checkCircle",
    label: "Open",
    className: OPEN_STYLE,
  },
  viewable: {
    icon: "eye",
    label: "View submission",
    className: VIEW_SUBMISSION_STYLE,
  },
  "not-viewable": {
    icon: "lock",
    label: "Closed — students placed",
    className: CLOSED_STYLE,
  },
};

export function WishlistCard({ item, className, onClick, hideCta, hideBadges, hideIcons }: WishlistCardProps) {
  const daysUntilDue = item.dueDate
    ? Math.ceil((item.dueDate.getTime() - Date.now()) / (24 * 60 * 60 * 1000))
    : null;
  const isClosingSoon =
    item.status === "preferences-not-submitted" && daysUntilDue != null && daysUntilDue <= 7 && daysUntilDue >= 0;
  const chip = STATUS_CHIP[item.status];
  const statusChipLabel = isClosingSoon ? "Closing Soon" : chip.label;
  const statusChipClass = isClosingSoon ? CLOSING_SOON_STYLE : chip.className;
  const dateRangeStr =
    item.dateRange && formatDateRange(item.dateRange.start, item.dateRange.end);
  const dueDateCompact = item.dueDate ? formatDueDateCompact(item.dueDate) : null;
  const title = item.rotationTitle ?? item.facilityName;
  const showFigmaLayout = item.programLabel != null || item.rotationTitle != null;

  const isClickable =
    item.status !== "not-viewable" && onClick != null;

  const getCtaLabel = () => {
    switch (item.status) {
      case "preferences-not-submitted":
        return "Submit preferences";
      case "preferences-submitted":
        return "View preferences";
      case "viewable":
        return "View submission";
      case "not-viewable":
        return null;
    }
  };

  const ctaLabel = getCtaLabel();

  return (
    <Card
      className={cn(
        "flex h-full flex-col transition-all duration-200 rounded-2xl",
        isClickable && "cursor-pointer hover:border-sidebar-border hover:shadow-md schedule-card-hover",
        !isClickable && "cursor-default",
        isClickable && "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      {...(isClickable
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-label": `View ${item.facilityName} wishlist`,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            },
          }
        : {
            "aria-label": `${item.facilityName} — closed, students already placed`,
          })}
    >
      <CardContent className="flex flex-1 flex-col gap-3 md:gap-4 p-4 md:p-6 min-h-0">
        {/* Header: due date (Badge like todo) + status chip */}
        {!hideBadges && (
        <div className="flex items-center justify-between gap-2 flex-wrap">
          {dueDateCompact ? (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="shrink-0 border-border text-xs font-normal gap-1.5 cursor-default"
                  aria-label={`Due ${dueDateCompact}`}
                >
                  {!hideIcons && <FontAwesomeIcon name="calendar" className="h-3.5 w-3.5 shrink-0" weight="light" aria-hidden />}
                  {dueDateCompact}
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">Due date</TooltipContent>
            </Tooltip>
          ) : (
            <span className="flex-1" />
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge
                variant="secondary"
                className={cn("shrink-0 text-xs font-normal gap-1.5 cursor-default", statusChipClass)}
                aria-label={statusChipLabel}
              >
                {!hideIcons && <FontAwesomeIcon name={chip.icon} className="h-3.5 w-3.5 shrink-0" weight="light" aria-hidden />}
                {statusChipLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">Status</TooltipContent>
          </Tooltip>
        </div>
        )}

        {/* Title — rotation title or facility name */}
        <h3 className="flex items-center gap-2 text-base md:text-lg leading-normal text-foreground line-clamp-2 font-extrabold">
          {!showFigmaLayout && (
            <Avatar className="h-5 w-5 shrink-0 rounded">
              {item.facilityLogo && (
                <AvatarImage
                  src={item.facilityLogo}
                  alt=""
                  className="rounded object-contain bg-muted"
                  referrerPolicy="origin"
                />
              )}
              <AvatarFallback className="bg-muted text-xs font-medium">
                {item.facilityName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          )}
          {title}
        </h3>

        {/* Metadata — course name (program label), date range, preferences submitted */}
        <div className="flex flex-1 flex-col gap-4 min-h-0">
          {showFigmaLayout && item.programLabel && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                  {!hideIcons && (
                    <FontAwesomeIcon
                      name="bookOpen"
                      className="text-xl shrink-0 text-muted-foreground"
                      weight="light"
                      aria-hidden
                    />
                  )}
                  <span className="truncate">{item.programLabel}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Course</TooltipContent>
            </Tooltip>
          )}
          {dateRangeStr && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                  {!hideIcons && (
                    <FontAwesomeIcon
                      name="calendar"
                      className="text-xl shrink-0 text-muted-foreground"
                      weight="light"
                      aria-hidden
                    />
                  )}
                  <span>{dateRangeStr}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Date range</TooltipContent>
            </Tooltip>
          )}
          {showFigmaLayout &&
            item.status === "preferences-submitted" &&
            item.preferencesSubmitted != null &&
            item.preferencesSubmittedDate && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                    {!hideIcons && (
                      <FontAwesomeIcon
                        name="checkCircle"
                        className="text-xl shrink-0 text-muted-foreground"
                        weight="light"
                        aria-hidden
                      />
                    )}
                    <span>
                      {item.preferencesSubmitted} preferences submitted on {formatDate(item.preferencesSubmittedDate)}
                    </span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Submission status</TooltipContent>
              </Tooltip>
            )}
          {!showFigmaLayout && (
            <>
              <Tooltip>
                <TooltipTrigger asChild>
                  <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                    {!hideIcons && (
                      <FontAwesomeIcon
                        name="mapPin"
                        className="text-xl shrink-0 text-muted-foreground"
                        weight="regular"
                        aria-hidden
                      />
                    )}
                    <span>{item.location}</span>
                  </div>
                </TooltipTrigger>
                <TooltipContent side="bottom">Location</TooltipContent>
              </Tooltip>
              {item.specialty && (
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div className="flex items-center gap-2 text-xs text-foreground min-w-0">
                      {!hideIcons && (
                        <FontAwesomeIcon
                          name="bookOpen"
                          className="text-xl shrink-0 text-muted-foreground"
                          weight="light"
                          aria-hidden
                        />
                      )}
                      <span>{item.specialty}</span>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Specialization</TooltipContent>
                </Tooltip>
              )}
            </>
          )}
        </div>

        {/* CTA button — pinned to bottom */}
        {ctaLabel && !hideCta && (
          <Button
            variant={item.status === "preferences-not-submitted" ? "default" : "outline"}
            size="default"
            className={cn("mt-auto w-full shrink-0", touchTargetMobileClasses, "h-10 md:h-9")}
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            {ctaLabel}
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
