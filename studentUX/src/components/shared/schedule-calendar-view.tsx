"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Calendar } from "../ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { HoverCard, HoverCardContent, HoverCardTrigger } from "../ui/hover-card";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { JobTag } from "../shared/job-card";
import { ScheduleCard } from "./schedule-card";
import { cn } from "../ui/utils";
import type { ScheduleItem } from "../../data/schedule-data";
import { SCHEDULE_STATUS_STYLES } from "./schedule-status-styles";

/* ── Legend chip styles (same as schedule-card status chips) ──────────── */
const LEGEND_PAYMENT = SCHEDULE_STATUS_STYLES.payment;
const LEGEND_DESTRUCTIVE = SCHEDULE_STATUS_STYLES.destructive;
const LEGEND_COMPLIANT = SCHEDULE_STATUS_STYLES.compliant;
const LEGEND_MUTED = SCHEDULE_STATUS_STYLES.muted;

const WEEK_DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

function getStatusStyle(status: ScheduleItem["status"]) {
  switch (status) {
    case "payment-pending":
      return "bg-chart-4/10 border-l-chip-4/80 text-chip-4 hover:bg-chart-4/20";
    case "action-needed":
    case "overdue":
      return "bg-destructive/10 border-l-chip-destructive text-chip-destructive hover:bg-destructive/20";
    case "compliant":
      return "bg-chart-2/10 border-l-chip-2/80 text-chip-2 hover:bg-chart-2/20";
    case "not-started":
      return "bg-muted/50 border-l-border text-muted-foreground hover:bg-muted";
    default:
      return "bg-muted/50 border-l-border text-muted-foreground hover:bg-muted";
  }
}

export interface ScheduleCalendarViewProps {
  items: ScheduleItem[];
  onItemClick?: (item: ScheduleItem) => void;
}

export function ScheduleCalendarView({ items, onItemClick }: ScheduleCalendarViewProps) {
  const [currentDate, setCurrentDate] = React.useState(new Date());
  const today = new Date();

  const itemsWithDateRange = React.useMemo(
    () => items.filter((i) => i.dateRange) as ScheduleItem[],
    [items]
  );

  const getCalendarDays = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();
    const firstDayOfMonth = new Date(year, month, 1);
    const startCalendar = new Date(firstDayOfMonth);
    startCalendar.setDate(startCalendar.getDate() - firstDayOfMonth.getDay());
    const days: Date[] = [];
    const current = new Date(startCalendar);
    for (let i = 0; i < 42; i++) {
      days.push(new Date(current));
      current.setDate(current.getDate() + 1);
    }
    return days;
  };

  const getItemsForDate = (date: Date) => {
    const checkDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());
    return itemsWithDateRange.filter((item) => {
      const range = item.dateRange!;
      const start = new Date(range.start.getFullYear(), range.start.getMonth(), range.start.getDate());
      const end = new Date(range.end.getFullYear(), range.end.getMonth(), range.end.getDate());
      return checkDate >= start && checkDate <= end;
    });
  };

  const formatMonth = (date: Date) =>
    date.toLocaleDateString("en-US", { month: "long", year: "numeric" });

  const goToPreviousMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  const goToNextMonth = () =>
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  const goToToday = () => setCurrentDate(new Date());

  const isToday = (date: Date) => date.toDateString() === today.toDateString();
  const isCurrentMonth = (date: Date) => date.getMonth() === currentDate.getMonth();

  const calendarDays = getCalendarDays();

  return (
    <div className="flex flex-col gap-4">
      {/* Header: nav + month + Today + Go to date + Status legend — single row */}
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1 rounded-md border border-border bg-background p-0.5">
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={goToPreviousMonth}
              aria-label="Previous month"
            >
              <FontAwesomeIcon name="chevronLeft" className="h-4 w-4" weight="light" aria-hidden="true" />
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="h-8 w-8 shrink-0"
              onClick={goToNextMonth}
              aria-label="Next month"
            >
              <FontAwesomeIcon name="chevronRight" className="h-4 w-4" weight="light" aria-hidden="true" />
            </Button>
          </div>
          <h2 className="text-xl font-semibold text-foreground">{formatMonth(currentDate)}</h2>
          <Button
            variant="ghost"
            size="sm"
            onClick={goToToday}
            className="text-chart-1 hover:text-chart-1/80 hover:bg-chart-1/10 font-medium"
          >
            Today
          </Button>
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="gap-2" aria-label="Go to date">
                <FontAwesomeIcon name="calendar" className="h-4 w-4" weight="light" />
                Go to date
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={currentDate}
                onSelect={(date) => date && setCurrentDate(date)}
                defaultMonth={currentDate}
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Status legend — right-aligned chips */}
        <div className="flex flex-wrap items-center gap-2 ml-auto">
          <JobTag icon="lock" label="Payment Pending" className={LEGEND_PAYMENT} />
          <JobTag icon="alertCircle" label="Action Needed" className={LEGEND_DESTRUCTIVE} />
          <JobTag icon="checkCircle" label="Compliant" className={LEGEND_COMPLIANT} />
          <JobTag icon="circle" label="Not Started" className={LEGEND_MUTED} />
        </div>
      </div>

      {/* Month grid — proper 7-column calendar */}
      <div className="rounded-xl border border-border overflow-hidden bg-card">
        <div
          className="grid"
          style={{ gridTemplateColumns: "repeat(7, minmax(0, 1fr))" }}
        >
          {WEEK_DAYS.map((day, i) => (
            <div
              key={day}
              className={cn(
                "px-2 py-2.5 text-center text-xs font-medium text-muted-foreground bg-muted/30 min-w-0",
                i < 6 && "border-r border-border"
              )}
            >
              {day}
            </div>
          ))}
          {calendarDays.map((date, index) => {
            const dayItems = getItemsForDate(date);
            const isCurrentMonthDay = isCurrentMonth(date);
            const isTodayDate = isToday(date);
            const row = Math.floor(index / 7);
            const col = index % 7;
            const firstItem = dayItems[0];
            const handleDayClick = () => {
              if (firstItem && onItemClick) onItemClick(firstItem);
            };

            return (
              <div
                key={index}
                role={firstItem ? "button" : undefined}
                tabIndex={firstItem ? 0 : undefined}
                className={cn(
                  "min-h-[100px] p-2 flex flex-col transition-colors min-w-0 overflow-hidden text-left",
                  row < 5 && "border-b border-border",
                  col < 6 && "border-r border-border",
                  !isCurrentMonthDay && "bg-muted/20 text-muted-foreground",
                  isTodayDate && "bg-chart-1/5",
                  firstItem && "cursor-pointer hover:bg-muted/30 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-inset"
                )}
                onClick={handleDayClick}
                onKeyDown={
                  firstItem
                    ? (e) => {
                        if (e.key === "Enter" || e.key === " ") {
                          e.preventDefault();
                          handleDayClick();
                        }
                      }
                    : undefined
                }
                aria-label={
                  firstItem
                    ? `View ${firstItem.specialty ?? firstItem.facilityName} schedule`
                    : undefined
                }
              >
                <div
                  className={cn(
                    "flex items-center justify-center w-6 h-6 text-sm font-medium shrink-0 mb-1.5",
                    isTodayDate
                      ? "bg-chart-1 text-primary-foreground rounded-full"
                      : "text-foreground",
                    !isCurrentMonthDay && "text-muted-foreground"
                  )}
                >
                  {date.getDate()}
                </div>
                <div className="flex flex-col gap-1 min-h-0 min-w-0 overflow-hidden">
                  {dayItems.length > 0 ? (
                    <>
                      {dayItems.slice(0, 2).map((item) => (
                        <HoverCard key={item.id} openDelay={300} closeDelay={150}>
                          <HoverCardTrigger asChild>
                            <div
                              role="button"
                              tabIndex={0}
                              className={cn(
                                "text-left text-xs px-1.5 py-1 rounded-md transition-colors border-l-2 min-w-0 overflow-hidden cursor-pointer",
                                getStatusStyle(item.status)
                              )}
                              onClick={(e) => {
                                e.stopPropagation();
                                onItemClick?.(item);
                              }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter" || e.key === " ") {
                                  e.preventDefault();
                                  onItemClick?.(item);
                                }
                              }}
                            >
                              <span className="font-medium truncate block">
                                {item.specialty ?? item.facilityName}
                              </span>
                            </div>
                          </HoverCardTrigger>
                          <HoverCardContent
                            side="top"
                            align="center"
                            sideOffset={8}
                            className="w-[320px] max-w-[calc(100vw-2rem)] p-2 border border-border rounded-xl shadow-lg bg-popover"
                          >
                            <ScheduleCard
                              item={item}
                              onClick={() => onItemClick?.(item)}
                            />
                          </HoverCardContent>
                        </HoverCard>
                      ))}
                      {dayItems.length > 2 && (
                        <span className="text-xs text-muted-foreground px-1.5 py-0.5">
                          +{dayItems.length - 2} more
                        </span>
                      )}
                    </>
                  ) : null}
                </div>
              </div>
            );
          })}
        </div>
      </div>

    </div>
  );
}
