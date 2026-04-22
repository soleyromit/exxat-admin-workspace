"use client";

import * as React from "react";
import { ScheduleCard } from "./schedule-card";
import { cn } from "../ui/utils";
import type { ScheduleItem } from "../../data/schedule-data";

const OFFSET_2ND = 12;
const OFFSET_3RD = 24;

export interface ScheduleCardStackProps {
  items: ScheduleItem[];
  amount: number;
  className?: string;
  onClick?: () => void;
  onPayClick?: () => void;
}

export function ScheduleCardStack({
  items,
  amount,
  className,
  onClick,
  onPayClick,
}: ScheduleCardStackProps) {
  const count = items.length;
  const stackDepth = Math.min(count, 3);

  return (
    <div
      className={cn("relative w-full min-w-0", className)}
      role="group"
      aria-label={`Pay $${amount} to unlock ${count} site${count !== 1 ? "s" : ""}`}
      style={{
        marginBottom: stackDepth > 1 ? (stackDepth - 1) * OFFSET_3RD : 0,
      }}
    >
      {/* 3rd card — furthest back, offset down only */}
      {stackDepth > 2 && (
        <div
          className="absolute left-0 w-full h-full"
          style={{ top: OFFSET_3RD }}
        >
          <ScheduleCard item={items[0]} placeholder className="h-full w-full min-h-[200px]" />
        </div>
      )}
      {/* 2nd card — middle, offset down only */}
      {stackDepth > 1 && (
        <div
          className="absolute left-0 w-full h-full"
          style={{ top: OFFSET_2ND }}
        >
          <ScheduleCard item={items[0]} placeholder className="h-full w-full min-h-[200px]" />
        </div>
      )}
      {/* Front card — with content */}
      <div className="relative z-10">
        <ScheduleCard
          item={items[0]}
          onClick={onClick}
          hideAction={false}
          className="shadow-sm"
          groupPayment={{
            amount,
            count,
            onPay: onPayClick,
          }}
        />
      </div>
    </div>
  );
}
