"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { useAppStore } from "../../stores/app-store";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";

export interface QuickAccessItem {
  id: string;
  label: string;
  icon: IconName;
  count: number;
  onClick: () => void;
}

const CHIP_COLORS = [
  "bg-chip-filled-1 border-transparent text-chip-1",
  "bg-chip-filled-2 border-transparent text-chip-2",
  "bg-chip-filled-3 border-transparent text-chip-3",
  "bg-chip-filled-4 border-transparent text-chip-4",
  "bg-chip-filled-5 border-transparent text-chip-5",
] as const;

const QUICK_ACCESS_ITEMS: QuickAccessItem[] = [
  {
    id: "upcoming-internship",
    label: "Upcoming Placement",
    icon: "calendarDays",
    count: 3,
    onClick: () => useAppStore.getState().navigateToPage("Internship"),
  },
  {
    id: "saved-jobs",
    label: "Saved Jobs",
    icon: "heart",
    count: 8,
    onClick: () => useAppStore.getState().navigateToPage("Jobs", { jobsTab: "my-jobs" }),
  },
  {
    id: "applied-jobs",
    label: "Applied Jobs",
    icon: "badgeCheck",
    count: 2,
    onClick: () => useAppStore.getState().navigateToPage("Jobs", { jobsTab: "my-jobs" }),
  },
  {
    id: "my-files",
    label: "My files",
    icon: "fileText",
    count: 4,
    onClick: () => useAppStore.getState().navigateToPage("Settings"),
  },
];

export function HomeQuickAccessSection() {
  return (
    <section
      className="w-full rounded-2xl border border-border bg-muted/30 py-2"
      aria-labelledby="section-quick-access"
    >
      <div className="flex flex-col gap-4 px-4 py-2 sm:flex-row sm:items-center sm:justify-between sm:gap-4">
        <div className="flex items-center gap-4">
          <h3
            id="section-quick-access"
            className="text-base md:text-lg font-bold text-foreground"
          >
            Quick Access
          </h3>
          <div
            className="hidden h-10 w-px shrink-0 bg-border sm:block"
            aria-hidden
          />
        </div>
        <div className="flex flex-wrap gap-4 sm:justify-end sm:ml-auto">
          {QUICK_ACCESS_ITEMS.map((item, index) => (
            <button
              key={item.id}
              type="button"
              onClick={item.onClick}
              className={cn(
                "inline-flex h-10 min-h-10 items-center gap-2 rounded-xl border border-border bg-background px-6 py-1",
                "text-sm font-normal text-foreground",
                "hover:bg-muted/50 transition-colors",
                "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                "touch-manipulation"
              )}
              aria-label={`${item.label}, ${item.count} items`}
            >
              <FontAwesomeIcon
                name={item.icon}
                className="h-5 w-5 shrink-0 text-muted-foreground"
                weight="light"
              />
              <span>{item.label}</span>
              <Badge variant="outline" className={cn("h-5 px-1.5 text-xs font-normal", CHIP_COLORS[index % CHIP_COLORS.length])}>
                {item.count}
              </Badge>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
