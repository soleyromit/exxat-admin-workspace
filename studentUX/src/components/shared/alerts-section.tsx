"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { SectionWithHeader, type SectionWithHeaderVariant } from "./section-with-header";
import { cn } from "../ui/utils";

export interface AlertItem {
  id: string | number;
  icon: React.ComponentType<{ className?: string }>;
  iconColor: string;
  bgColor: string;
  title: string;
  description: string;
  action: string;
  urgency: "high" | "medium" | "low";
}

export interface AlertsSectionProps {
  /** Section title */
  title?: string;
  /** Section description */
  description?: string;
  /** Alert items to display */
  alerts: AlertItem[];
  /** Variant: default (no filter) or withFilter */
  variant?: SectionWithHeaderVariant;
  /** Filter content when variant is "withFilter" */
  filter?: React.ReactNode;
  /** Called when an alert action button is clicked */
  onAlertAction?: (alert: AlertItem) => void;
  /** Grid columns: 2, 3, or 4 */
  columns?: 2 | 3 | 4;
  /** Optional section id */
  id?: string;
  /** Optional className */
  className?: string;
}

/**
 * AlertsSection - Reusable alerts/items needing attention section.
 * Variant "default": header without filter.
 * Variant "withFilter": header with filter slot (like Pipeline Overview).
 */
export function AlertsSection({
  title = "Alerts & Items Needing Attention",
  description = "Critical items requiring immediate action",
  alerts,
  variant = "default",
  filter,
  onAlertAction,
  columns = 4,
  id,
  className,
}: AlertsSectionProps) {
  const gridCols =
    columns === 2
      ? "md:grid-cols-2"
      : columns === 3
        ? "md:grid-cols-2 lg:grid-cols-3"
        : "md:grid-cols-2 lg:grid-cols-4";

  return (
    <SectionWithHeader
      title={title}
      description={description}
      titleId={id ? `${id}-title` : undefined}
      variant={variant}
      filter={filter}
      className={className}
    >
      <div className={cn("grid gap-4", gridCols)}>
        {alerts.map((alert) => (
          <Card key={alert.id} className="group transition-all">
            <CardContent className="p-5 flex flex-col h-full">
              <div className="flex items-start justify-between mb-3">
                <div
                  className={cn(
                    "w-10 h-10 rounded-lg flex items-center justify-center",
                    alert.bgColor
                  )}
                >
                  <alert.icon className={cn("h-5 w-5", alert.iconColor)} />
                </div>
              </div>
              <h4 className="font-semibold mb-2 text-sm">{alert.title}</h4>
              <p className="text-xs text-muted-foreground mb-4 leading-relaxed flex-1">
                {alert.description}
              </p>
              <Button
                size="sm"
                variant={alert.urgency === "high" ? "default" : "ghost"}
                className="w-full mt-auto"
                onClick={() => onAlertAction?.(alert)}
              >
                {alert.action}
                <ArrowRight className="h-4 w-4 ml-2" />
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>
    </SectionWithHeader>
  );
}
