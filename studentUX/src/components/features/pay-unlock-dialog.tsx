"use client";

import * as React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { ScheduleCard } from "../shared/schedule-card";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn, touchTargetMobileClasses } from "../ui/utils";
import type { ScheduleItem } from "../../data/schedule-data";

export interface PayUnlockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  items: ScheduleItem[];
  amount: number;
  onPay?: () => void;
}

/**
 * Dialog shown when clicking stacked card or Pay & Unlock All.
 * Uses existing ScheduleCard; Platform Fee, Pay And Unlock All.
 */
export function PayUnlockDialog({
  open,
  onOpenChange,
  items,
  amount,
  onPay,
}: PayUnlockDialogProps) {
  const handlePay = React.useCallback(() => {
    onPay?.();
    onOpenChange(false);
  }, [onPay, onOpenChange]);

  const count = items.length;
  const isGroup = count > 1;
  const facilityNames = [...new Set(items.map((i) => i.facilityName))];
  const facilityLabel =
    facilityNames.length === 1 ? facilityNames[0] : "your confirmed schedules";
  const paymentCopy =
    count === 1
      ? `One Time Payment To Unlock Your Confirmed Schedule In ${facilityLabel}`
      : `One Time Payment To Unlock All Your Confirmed Schedules In ${facilityLabel}`;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="max-w-[min(28rem,calc(100%-2rem))] !flex flex-col overflow-hidden gap-4"
        style={{
          // Single schedule: compact height; multiple: full 85vh
          height: count === 1 ? "min(70vh, 420px)" : "85vh",
          maxHeight: count === 1 ? "min(70vh, 420px)" : "85vh",
        }}
        aria-labelledby="pay-unlock-title"
        aria-describedby="pay-unlock-description"
      >
        <DialogHeader className="shrink-0">
          <DialogTitle
            id="pay-unlock-title"
            className="font-display font-bold text-xl text-foreground"
          >
            Unlock Schedule{count !== 1 ? "s" : ""}
          </DialogTitle>
          <p
            id="pay-unlock-description"
            className="text-sm font-normal text-foreground"
          >
            {count} Upcoming Schedule{count !== 1 ? "s" : ""} Confirmed
          </p>
        </DialogHeader>

        {/* Schedule cards — scrollable middle */}
        <div className="flex flex-col gap-3 min-h-0 flex-1 overflow-y-auto">
          {items.map((item) => (
            <ScheduleCard
              key={item.id}
              item={item}
              hideAction
              className="shrink-0"
            />
          ))}
        </div>

        {/* Payment section — sticky cost + action */}
        <div className="flex flex-col gap-4 pt-2 shrink-0 border-t border-border">
          <div className="flex items-start gap-2 text-sm text-foreground">
            <span
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-chart-2/20 text-chip-2"
              aria-hidden
            >
              <FontAwesomeIcon
                name="lockOpen"
                className="h-4 w-4"
                weight="light"
                aria-hidden
              />
            </span>
            <span>{paymentCopy}</span>
          </div>
          <div className="flex items-center justify-between gap-4">
            <div className="flex flex-col gap-0.5">
              <span className="text-xs text-muted-foreground">Platform Fee</span>
              <span className="text-2xl font-bold text-foreground">${amount}</span>
            </div>
            <Button
              variant="default"
              size="default"
              onClick={handlePay}
              aria-label={isGroup ? "Pay and unlock all schedules" : "Pay and unlock schedule"}
              className={cn(
                "gap-2 shrink-0",
                touchTargetMobileClasses,
                "md:min-h-0"
              )}
            >
              <FontAwesomeIcon name="lock" className="h-4 w-4" weight="light" aria-hidden />
              Pay And Unlock{isGroup ? " All" : ""}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
