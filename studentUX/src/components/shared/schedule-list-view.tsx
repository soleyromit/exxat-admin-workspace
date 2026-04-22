"use client";

import * as React from "react";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { JobTag } from "../shared/job-card";
import { ScheduleListViewRow } from "../shared/schedule-list-view-row";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { ScheduleNotificationPopover } from "./schedule-notification-popover";
import { cn } from "../ui/utils";
import { formatDateRange } from "@/utils/date-utils";
import { groupByBoard } from "../../data/schedule-data";
import type { ScheduleItem, ScheduleItemBoard, ScheduleItemStatus } from "../../data/schedule-data";

import { SCHEDULE_STATUS_STYLES } from "./schedule-status-styles";

/* ── Status chip helpers ─────────────────────────────────────────────── */

const PAYMENT_STYLE = SCHEDULE_STATUS_STYLES.payment;
const DESTRUCTIVE_STYLE = SCHEDULE_STATUS_STYLES.destructive;
const COMPLIANT_STYLE = SCHEDULE_STATUS_STYLES.compliant;
const MUTED_STYLE = SCHEDULE_STATUS_STYLES.muted;
function statusChips(status: ScheduleItemStatus, overdueDays?: number) {
  const chips: { key: string; icon: string; label: string; className: string }[] = [];

  if (status === "payment-pending") {
    chips.push({ key: "payment", icon: "lock", label: "Payment Pending", className: PAYMENT_STYLE });
  }
  if (status === "overdue" || (status === "payment-pending" && overdueDays)) {
    chips.push({ key: "overdue", icon: "clock", label: "Overdue", className: DESTRUCTIVE_STYLE });
  }
  if (status === "action-needed") {
    chips.push({ key: "action", icon: "alertCircle", label: "Action Needed", className: DESTRUCTIVE_STYLE });
  }
  if (status === "compliant") {
    chips.push({ key: "compliant", icon: "checkCircle", label: "Compliant", className: COMPLIANT_STYLE });
  }
  if (status === "not-started") {
    chips.push({ key: "not-started", icon: "circle", label: "Not Started", className: MUTED_STYLE });
  }

  return chips;
}

/* ── Board metadata ──────────────────────────────────────────────────── */

const BOARD_META: Record<ScheduleItemBoard, { label: string; icon: "calendarDays" | "listChecks" | "checkCircle"; headerBg: string; borderClass: string; iconClass: string }> = {
  upcoming: { label: "Upcoming", icon: "calendarDays", headerBg: "bg-muted/50", borderClass: "border-border", iconClass: "text-chip-4" },
  "in-process": { label: "In-Process", icon: "listChecks", headerBg: "bg-muted/50", borderClass: "border-border", iconClass: "text-chip-1" },
  completed: { label: "Completed", icon: "checkCircle", headerBg: "bg-muted/50", borderClass: "border-border", iconClass: "text-chip-2" },
};

const BOARD_ORDER: ScheduleItemBoard[] = ["upcoming", "in-process", "completed"];

/* ── Action button helper ────────────────────────────────────────────── */

function RowAction({ item, onPayClick }: { item: ScheduleItem; onPayClick?: () => void }) {
  if (item.actionType === "pay-unlock") {
    return (
      <Button
        variant="default"
        size="sm"
        className="h-8 shrink-0 gap-1.5 whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
          onPayClick?.();
        }}
      >
        <FontAwesomeIcon name="lock" className="h-3.5 w-3.5" weight="solid" />
        Pay & Unlock{item.amount ? ` $${item.amount}` : ""}
      </Button>
    );
  }

  if (item.actionType === "complete-requirements") {
    return (
      <Button
        variant="outline"
        size="sm"
        className="h-8 shrink-0 whitespace-nowrap"
        onClick={(e) => {
          e.stopPropagation();
        }}
      >
        Complete Requirements
      </Button>
    );
  }

  return null;
}

/* ── Component ───────────────────────────────────────────────────────── */

export interface ScheduleListViewProps {
  items: ScheduleItem[];
  onItemClick?: (item: ScheduleItem) => void;
}

export function ScheduleListView({ items, onItemClick }: ScheduleListViewProps) {
  const grouped = React.useMemo(() => groupByBoard(items), [items]);

  return (
    <div className="flex flex-col gap-4">
      {BOARD_ORDER.map((boardId) => {
        const boardItems = grouped[boardId];
        if (boardItems.length === 0) return null;
        const meta = BOARD_META[boardId];

        return (
          <div key={boardId} className={cn("rounded-xl border overflow-hidden bg-card border-border", meta.borderClass)}>
            {/* Section header */}
            <div className={cn("flex items-center gap-2.5 px-4 py-3 border-b", meta.headerBg, meta.borderClass)}>
              <FontAwesomeIcon
                name={meta.icon}
                className={cn("h-4 w-4", meta.iconClass)}
                weight="light"
              />
              <span className="text-sm font-semibold text-foreground">
                {meta.label}
              </span>
              <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                {boardItems.length}
              </Badge>
            </div>

            {/* Rows */}
            {boardItems.map((item, idx) => {
              const dateStr =
                item.dateRange && formatDateRange(item.dateRange.start, item.dateRange.end);
              const chips = statusChips(item.status, item.overdueDays);
              const initials = item.facilityName
                .split(/\s+/)
                .slice(0, 2)
                .map((w) => w[0])
                .join("")
                .toUpperCase();

              const subtitleWithDate = [item.specialty, dateStr].filter(Boolean).join(" • ");

              return (
                <div
                  key={item.id}
                  className={cn(idx < boardItems.length - 1 && "border-b border-border")}
                >
                  <ScheduleListViewRow
                    avatarSrc={item.facilityLogo}
                    avatarAlt={item.facilityName}
                    avatarFallback={initials}
                    title={item.facilityName}
                    subtitle={subtitleWithDate || undefined}
                    trailing={
                      <div className="hidden sm:flex items-center justify-end gap-1.5">
                        {chips.map((chip) => (
                          <JobTag
                            key={chip.key}
                            icon={chip.icon}
                            label={chip.label}
                            className={chip.className}
                          />
                        ))}
                        {(item.hasUpdates || item.showChatIcon || (item.unreadMessageCount ?? 0) > 0) && (
                          <>
                            {item.hasUpdates && (
                              <div onClick={(e) => e.stopPropagation()}>
                                <ScheduleNotificationPopover
                                  variant="updates"
                                  icon="bell"
                                  showDot
                                  triggerAriaLabel="View updates"
                                  contentAriaLabel="Updates from this site"
                                  compact
                                  className="h-6 w-6"
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
                              </div>
                            )}
                            {(item.showChatIcon || (item.unreadMessageCount ?? 0) > 0) && (
                              <div onClick={(e) => e.stopPropagation()}>
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
                                  compact
                                  className="h-6 w-6"
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
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    }
                    action={
                      <RowAction
                        item={item}
                        onPayClick={
                          item.actionType === "pay-unlock"
                            ? () => onItemClick?.(item)
                            : undefined
                        }
                      />
                    }
                    onClick={() => onItemClick?.(item)}
                  />
                </div>
              );
            })}
          </div>
        );
      })}
    </div>
  );
}
