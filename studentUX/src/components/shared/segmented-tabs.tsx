"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";

export interface SegmentedTabItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface SegmentedTabsProps {
  /** Tab items with id, label, icon */
  items: readonly SegmentedTabItem[];
  /** Currently active tab id */
  value: string;
  /** Called when a tab is selected */
  onValueChange: (value: string) => void;
  /** Optional className for the container */
  className?: string;
}

/**
 * Segmented tab group — Figma style: selected = light pink pill bg, unselected = transparent.
 * Height 32px, icon + label, bold text.
 */
export function SegmentedTabs({
  items,
  value,
  onValueChange,
  className,
}: SegmentedTabsProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex h-8 items-center gap-1 rounded-full bg-transparent p-0.5",
        className
      )}
    >
      {items.map((item) => {
        const isActive = value === item.id;
        return (
          <button
            key={item.id}
            role="tab"
            aria-selected={isActive}
            aria-controls={`panel-${item.id}`}
            id={`tab-${item.id}`}
            type="button"
            onClick={() => onValueChange(item.id)}
            className={cn(
              "inline-flex h-7 items-center gap-2 rounded-full px-4 font-bold text-foreground transition-colors",
              "hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isActive && "bg-primary/15 text-foreground"
            )}
          >
            <FontAwesomeIcon
              name={item.icon}
              className="h-4 w-4 shrink-0"
              weight="regular"
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
