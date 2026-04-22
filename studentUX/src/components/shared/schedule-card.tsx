"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { JobTag } from "../shared/job-card";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { ScheduleNotificationPopover } from "./schedule-notification-popover";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../ui/utils";
import { formatDate, formatDateRange } from "@/utils/date-utils";
import type { ScheduleItem, ScheduleItemStatus } from "../../data/schedule-data";

export interface ScheduleCardProps {
  item: ScheduleItem;
  className?: string;
  onClick?: () => void;
  /** When set, hide the action section (used for cards in a stack behind the top) */
  hideAction?: boolean;
  /** When set, show group pay CTA instead of individual (Pay $X to unlock N sites) */
  groupPayment?: { amount: number; count: number; onPay?: () => void };
  /** When set, render card shell only (no content) — for stacked back cards */
  placeholder?: boolean;
  /** When item has requiresEmployeeVerification, called when user clicks Verify */
  onVerifyClick?: () => void;
}

import { SCHEDULE_STATUS_STYLES } from "./schedule-status-styles";

/* Chip styles — JobTag with status colors (matches job card chip pattern) */
const PAYMENT_STYLE = SCHEDULE_STATUS_STYLES.payment;
const DESTRUCTIVE_STYLE = SCHEDULE_STATUS_STYLES.destructive;
const COMPLIANT_STYLE = SCHEDULE_STATUS_STYLES.compliant;

export function StatusChip({
  status,
  overdueDays,
  dueDate,
}: {
  status: ScheduleItemStatus;
  overdueDays?: number;
  dueDate?: Date;
}) {
  const chips: React.ReactNode[] = [];

  if (status === "payment-pending") {
    chips.push(
      <JobTag key="payment" icon="lock" label="Payment Pending" className={PAYMENT_STYLE} />
    );
  }
  if (status === "overdue" || (status === "payment-pending" && overdueDays)) {
    const days = overdueDays ?? 0;
    chips.push(
      <JobTag
        key="overdue"
        icon="clock"
        label={`Overdue by ${days} day${days !== 1 ? "s" : ""}`}
        className={DESTRUCTIVE_STYLE}
      />
    );
  }
  if (status === "compliant") {
    chips.push(
      <JobTag key="compliant" icon="checkCircle" label="Compliant" className={COMPLIANT_STYLE} />
    );
  }

  if (dueDate) {
    const dueLabel = `Due on ${dueDate.toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    })}`;
    chips.push(
      <JobTag key="due" icon="calendar" label={dueLabel} />
    );
  }

  return (
    <div className="flex flex-wrap gap-1 overflow-hidden min-h-6">
      {chips}
    </div>
  );
}

/** Due date is "near" when within 14 days and not overdue — only for upcoming board */
function isDueDateNear(item: ScheduleItem): boolean {
  if (item.board !== "upcoming") return false;
  if (!item.dueDate || item.overdueDays || item.status === "overdue") return false;
  const daysUntil = Math.ceil((item.dueDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));
  return daysUntil > 0 && daysUntil <= 14;
}

/** Overdue: has overdueDays or status is overdue — only for upcoming board */
function isOverdue(item: ScheduleItem): boolean {
  if (item.board !== "upcoming") return false;
  return !!(item.overdueDays || item.status === "overdue");
}

/** Compute overdue days when dueDate is past and overdueDays not provided */
function getOverdueDays(item: ScheduleItem): number | undefined {
  if (item.overdueDays != null) return item.overdueDays;
  if (!item.dueDate || item.dueDate.getTime() >= Date.now()) return undefined;
  return Math.max(
    1,
    Math.ceil((Date.now() - item.dueDate.getTime()) / (1000 * 60 * 60 * 24))
  );
}

export function ScheduleCard({ item, className, onClick, hideAction, groupPayment, placeholder, onVerifyClick }: ScheduleCardProps) {
  const dateRangeStr =
    item.dateRange &&
    formatDateRange(item.dateRange.start, item.dateRange.end);

  const dueNear = isDueDateNear(item);
  const overdue = isOverdue(item);
  const hasUpdates = item.hasUpdates || (item.unreadMessageCount ?? 0) > 0;
  const isUnpaid = item.actionType === "pay-unlock";
  const isClickable = onClick != null;

  if (placeholder) {
    return (
      <Card
        className={cn(
          "flex flex-col rounded-2xl border border-border bg-card pointer-events-none shadow-sm",
          "min-h-[200px]",
          className
        )}
        aria-hidden="true"
      >
        <CardContent className="flex-1 min-h-0 p-4 md:p-6" />
      </Card>
    );
  }

  return (
    <Card
      className={cn(
        "flex flex-col transition-all duration-200 rounded-2xl",
        isClickable && "cursor-pointer hover:border-sidebar-border hover:shadow-md schedule-card-hover",
        !isClickable && "cursor-default",
        isClickable && "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        dueNear && "schedule-card-due-near",
        overdue && "schedule-card-overdue",
        hasUpdates && !dueNear && !overdue && "schedule-card-has-updates",
        className
      )}
      {...(isClickable
        ? {
            role: "button" as const,
            tabIndex: 0,
            "aria-label": isUnpaid
              ? `Pay to unlock ${item.facilityName} — opens payment dialog`
              : `View ${item.facilityName} schedule`,
            onClick,
            onKeyDown: (e: React.KeyboardEvent) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick?.();
              }
            },
          }
        : {
            "aria-label": `${item.facilityName} — payment required to view`,
          })}
    >
      <CardContent className="flex flex-1 flex-col gap-3 md:gap-4 p-4 md:p-6 min-h-0">
        {/* Header: chips + action icons (matches job card header layout) */}
        <div className="flex items-center justify-between">
          <StatusChip
            status={item.status}
            overdueDays={getOverdueDays(item)}
            dueDate={item.dueDate}
          />
          <div className="flex items-center gap-2 shrink-0">
            {(item.hasUpdates || item.showChatIcon || (item.unreadMessageCount ?? 0) > 0) && (
              <>
                {item.hasUpdates && (
                  <ScheduleNotificationPopover
                    variant="updates"
                    icon="bell"
                    showDot
                    triggerAriaLabel="View updates"
                    contentAriaLabel="Updates from this site"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FontAwesomeIcon name="bell" className="h-4 w-4 text-chart-1" weight="light" aria-hidden />
                        Updates
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.updatePreview ?? "You have new updates from this site."}
                      </p>
                    </div>
                  </ScheduleNotificationPopover>
                )}
                {(item.showChatIcon || (item.unreadMessageCount ?? 0) > 0) && (
                  <ScheduleNotificationPopover
                    variant="messages"
                    icon="messageSquare"
                    showDot={(item.unreadMessageCount ?? 0) > 0}
                    unreadCount={item.unreadMessageCount}
                    triggerAriaLabel={
                      (item.unreadMessageCount ?? 0) > 0
                        ? `View messages, ${item.unreadMessageCount} unread`
                        : "View messages"
                    }
                    contentAriaLabel="Messages from this site"
                  >
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                        <FontAwesomeIcon name="messageSquare" className="h-4 w-4 text-chart-1" weight="light" aria-hidden />
                        Messages
                        {(item.unreadMessageCount ?? 0) > 0 && (
                          <span className="text-xs font-normal text-muted-foreground">
                            ({item.unreadMessageCount} unread)
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {item.messagePreview ?? "You have unread messages."}
                      </p>
                    </div>
                  </ScheduleNotificationPopover>
                )}
              </>
            )}
          </div>
        </div>

        {/* Title with site logo */}
        <h3 className="flex items-center gap-2 text-base md:text-lg leading-normal text-foreground line-clamp-2 min-h-title font-extrabold">
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
          {item.facilityName}
        </h3>

        {/* Metadata — location, specialty, date range */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0" aria-hidden>
                  <FontAwesomeIcon
                    name="mapPin"
                    className="text-xl text-muted-foreground"
                    weight="light"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Location</TooltipContent>
            </Tooltip>
            <span>{item.location}</span>
          </div>
          {item.specialty && (
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0" aria-hidden>
                    <FontAwesomeIcon name="bookOpen" className="text-xl text-muted-foreground" weight="light" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Specialization</TooltipContent>
              </Tooltip>
              <span>{item.specialty}</span>
            </div>
          )}
          {dateRangeStr && (
            <div className="flex items-center gap-2 text-xs text-foreground">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex shrink-0" aria-hidden>
                    <FontAwesomeIcon name="calendar" className="text-xl text-muted-foreground" weight="light" />
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Date range</TooltipContent>
              </Tooltip>
              <span>{dateRangeStr}</span>
            </div>
          )}
        </div>

        {/* Employee verification banner (inside pay-unlock card) */}
        {!hideAction && item.actionType === "pay-unlock" && item.requiresEmployeeVerification && onVerifyClick && (
          <div
            role="button"
            tabIndex={0}
            aria-label="Employee — If you are an employee at this site, you can verify your employment to enable simpler onboarding and payment."
            onClick={(e) => {
              e.stopPropagation();
              onVerifyClick();
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                e.stopPropagation();
                onVerifyClick();
              }
            }}
            className={cn(
              "rounded-lg border px-3 py-2 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2",
              "bg-chart-1/5 border-chart-1/15",
              "cursor-pointer hover:bg-chart-1/10 transition-colors",
              "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            )}
          >
            <div className="flex flex-col gap-1 min-w-0">
              <div className="flex items-center gap-2">
                <FontAwesomeIcon name="idCardClip" className="h-4 w-4 shrink-0 text-chip-1" weight="solid" aria-hidden />
                <span className="text-sm font-medium text-foreground">Employee</span>
              </div>
              <p className="text-xs text-muted-foreground">
                If you are an employee at this site, you can verify your employment to enable simpler onboarding and payment.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              aria-label="Verify employment by site email"
              className="min-h-[44px] md:min-h-8 shrink-0 gap-1.5 text-xs self-start sm:self-center"
              onClick={(e) => {
                e.stopPropagation();
                onVerifyClick();
              }}
            >
              <FontAwesomeIcon name="userCheck" className="h-3 w-3" weight="light" aria-hidden />
              Verify
            </Button>
          </div>
        )}

        {/* Amount + Pay button (when payment pending) */}
        {!hideAction && item.actionType === "pay-unlock" && (
          <div className="flex items-center gap-6">
            {groupPayment ? (
              <div className="flex flex-col gap-3 w-full">
                <p className="text-sm font-semibold text-foreground">
                  Pay ${groupPayment.amount} to unlock {groupPayment.count} site{groupPayment.count !== 1 ? "s" : ""}
                </p>
                <Button
                  variant="default"
                  size="default"
                  className="w-full h-10 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    groupPayment.onPay?.();
                  }}
                >
                  <FontAwesomeIcon name="lock" className="h-4 w-4" weight="light" />
                  Pay & Unlock All
                </Button>
              </div>
            ) : (
              <>
                {item.amount != null && (
                  <span className="text-2xl font-bold text-foreground shrink-0">
                    ${item.amount}
                  </span>
                )}
                <Button
                  variant="default"
                  size="default"
                  className="flex-1 min-w-0 h-10 gap-2"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClick?.();
                  }}
                >
                  <FontAwesomeIcon name="lock" className="h-4 w-4" weight="light" />
                  Pay And Unlock
                </Button>
              </>
            )}
          </div>
        )}
        {!hideAction && item.actionType === "complete-requirements" && (
          <Button
            variant="outline"
            size="default"
            className="w-full h-10"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            Complete Requirements
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
