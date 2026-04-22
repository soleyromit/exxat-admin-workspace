"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";

export interface GroupedButtonItem {
  id: string;
  label: string;
  icon: IconName;
}

export interface GroupedButtonProps {
  items: readonly GroupedButtonItem[];
  value: string;
  onValueChange: (value: string) => void;
  className?: string;
}

/**
 * Custom grouped button / segmented control — Figma style.
 * Selected = mixed surface + brand (`.grouped-button-selected`), unselected = transparent.
 * Uses plain buttons for reliable selected state.
 */
export function GroupedButton({
  items,
  value,
  onValueChange,
  className,
}: GroupedButtonProps) {
  return (
    <div
      role="tablist"
      className={cn(
        "inline-flex min-h-11 md:min-h-0 md:h-8 items-center gap-2 rounded-md bg-transparent p-0.5",
        className
      )}
    >
      {items.map((item) => {
        const isSelected = value === item.id;
        return (
          <button
            key={item.id}
            type="button"
            role="tab"
            aria-selected={isSelected}
            onClick={() => onValueChange(item.id)}
            className={cn(
              "inline-flex min-h-11 md:min-h-0 md:h-7 items-center gap-2 rounded-md px-3 py-1.5 md:py-1 font-bold text-foreground transition-colors touch-manipulation",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
              isSelected && "grouped-button-selected",
              !isSelected && "hover:bg-muted/50"
            )}
          >
            <FontAwesomeIcon
              name={item.icon}
              className="h-4 w-4 shrink-0"
              weight={isSelected ? "solid" : "regular"}
            />
            {item.label}
          </button>
        );
      })}
    </div>
  );
}
