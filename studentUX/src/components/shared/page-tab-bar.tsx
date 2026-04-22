"use client";

import { GroupedButton, type GroupedButtonItem } from "./grouped-button";
import { cn } from "../ui/utils";

export interface PageTabBarProps {
  items: readonly GroupedButtonItem[];
  value: string;
  onValueChange: (value: string) => void;
  /** Optional extra classes for the wrapper */
  className?: string;
}

/**
 * Page-level tab bar for main pages (Schedule, Jobs, Internship, etc.).
 * Full bleed with 21px left padding, consistent top/bottom spacing.
 * Renders GroupedButton inside.
 */
export function PageTabBar({
  items,
  value,
  onValueChange,
  className,
}: PageTabBarProps) {
  return (
    <div
      className={cn(
        "flex justify-start w-full min-w-0 pt-4 lg:pt-6 shrink-0",
        className
      )}
      style={{ paddingLeft: 21, marginBottom: 21 }}
    >
      <GroupedButton
        items={items}
        value={value}
        onValueChange={onValueChange}
      />
    </div>
  );
}
