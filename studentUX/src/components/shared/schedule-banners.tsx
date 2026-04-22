"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";
import { formatDateShort } from "@/utils/date-utils";

export type ScheduleBannerType = "off" | "compliance-nearing" | "payment-nearing" | "overdue";

export interface ScheduleBannerContext {
  facilityName: string;
  dueDate: Date;
  scheduleId?: string;
}

interface ScheduleBannersProps {
  bannerType: ScheduleBannerType;
  scheduleContext?: ScheduleBannerContext | null;
  onViewSchedule?: (scheduleId?: string) => void;
}

const COMPLIANCE_NEARING = {
  title: "Compliance due soon",
  descriptionBase: "Your due date is nearing but compliance is still pending. Complete your onboarding requirements to stay on track.",
  icon: "triangleExclamation" as const,
  ctaLabel: "Complete requirements",
  isDestructive: false,
};

const PAYMENT_NEARING = {
  title: "Payment due soon",
  descriptionBase: "Your due date is nearing but payment is still pending. Complete your payment to unlock your placement.",
  icon: "creditCard" as const,
  ctaLabel: "Pay now",
  isDestructive: false,
};

const OVERDUE = {
  title: "Action needed — overdue",
  descriptionBase: "Your due date has passed. Payment or compliance is not complete. Please take action to avoid placement delays.",
  icon: "alertCircle" as const,
  ctaLabel: "View details",
  isDestructive: true,
};

const BANNER_CONFIG: Record<Exclude<ScheduleBannerType, "off">, typeof COMPLIANCE_NEARING> = {
  "compliance-nearing": COMPLIANCE_NEARING,
  "payment-nearing": PAYMENT_NEARING,
  overdue: OVERDUE,
};

export function ScheduleBanners({ bannerType, scheduleContext, onViewSchedule }: ScheduleBannersProps) {
  if (bannerType === "off") return null;

  const config = BANNER_CONFIG[bannerType];
  const scheduleText = scheduleContext
    ? `${scheduleContext.facilityName} — Due ${formatDateShort(scheduleContext.dueDate)}`
    : null;

  const ariaLabel = scheduleText
    ? `${config.title}: ${scheduleText}. ${config.descriptionBase}`
    : `${config.title}. ${config.descriptionBase}`;

  return (
    <div
      role="alert"
      aria-label={ariaLabel}
      className={cn(
        "rounded-xl border px-4 py-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3",
        config.isDestructive
          ? "bg-destructive/10 border-chip-destructive/40"
          : "bg-chart-4/10 border-chip-4/40"
      )}
    >
      <div className="flex gap-3 min-w-0 flex-1">
        <FontAwesomeIcon
          name={config.icon}
          className={cn("h-5 w-5 shrink-0 mt-0.5", config.isDestructive ? "text-destructive" : "text-chip-4")}
          weight="solid"
          aria-hidden="true"
        />
        <div className="min-w-0">
          <p className="font-semibold text-foreground">{config.title}</p>
          {scheduleText && (
            <p className="text-sm font-medium text-foreground mt-0.5">{scheduleText}</p>
          )}
          <p className="text-sm text-foreground mt-0.5">{config.descriptionBase}</p>
        </div>
      </div>
      {onViewSchedule && (
        <Button
          variant={config.isDestructive ? "destructive" : "default"}
          size="sm"
          className="shrink-0 self-start"
          onClick={() => onViewSchedule(scheduleContext?.scheduleId)}
        >
          {config.ctaLabel}
        </Button>
      )}
    </div>
  );
}
