"use client";

import * as React from "react";
import { SimpleMetric, type SimpleMetricData } from "./simple-metric";
import { InsightCard, type InsightCardData } from "./insight-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "../ui/utils";

export interface KeyMetricsShowcaseProps {
  /** Section title */
  title: string;
  /** Section description */
  description: string;
  /** Array of metrics (4 = single row, 6 = 2x3 grid) */
  metrics: SimpleMetricData[];
  /** Optional insight card shown on the right */
  insightCard?: InsightCardData & { onClick?: () => void };
  /** Optional filter/select (e.g., time period) */
  filter?: {
    value: string;
    onValueChange: (value: string) => void;
    options: { value: string; label: string }[];
    placeholder?: string;
  };
  /** Called when a metric is clicked */
  onMetricClick?: (metricName: string) => void;
  /** Show brand gradient background */
  showGradient?: boolean;
  /** Full width: break out of parent padding (use for main hero metrics) */
  fullWidth?: boolean;
  /** Optional className */
  className?: string;
}

/**
 * KeyMetricsShowcase - Reusable metrics grid with optional insight card.
 * Layout: 2x3 metrics grid (left) + insight card (right).
 */
export function KeyMetricsShowcase({
  title,
  description,
  metrics,
  insightCard,
  filter,
  onMetricClick,
  showGradient = true,
  fullWidth = false,
  className,
}: KeyMetricsShowcaseProps) {
  const metricsPerRow = metrics.length <= 4 ? 4 : 3;
  const isSingleRow = metrics.length <= 4;

  return (
    <div className={cn("relative", fullWidth && "-mx-4 lg:-mx-6", className)}>
      {showGradient && (
        <div
          data-slot="brand-gradient"
          className="absolute inset-0 pointer-events-none"
          aria-hidden
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--brand-color) 8%, transparent), transparent)",
          }}
        />
      )}

      <div className="relative">
        {/* Header */}
        <div className="px-4 lg:px-6 mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-base md:text-lg font-bold">{title}</h3>
              <p className="text-muted-foreground mt-0.5 text-sm md:text-base">{description}</p>
            </div>

            {filter && (
              <div className="flex items-center gap-2">
                <Select value={filter.value} onValueChange={filter.onValueChange}>
                  <SelectTrigger className="w-[180px] h-9 bg-transparent">
                    <SelectValue placeholder={filter.placeholder} />
                  </SelectTrigger>
                  <SelectContent>
                    {filter.options.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>

        {/* Layout: Metrics Grid + Insight Card */}
        <div className="px-4 lg:px-6 pb-8">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
            {/* Metrics Grid — 4 metrics = single row, 6 = 2x3 */}
            <div>
              <div
                className={cn(
                  "grid gap-x-6 gap-y-10 md:divide-x divide-border",
                  isSingleRow
                    ? "grid-cols-1 sm:grid-cols-2 lg:grid-cols-4"
                    : "grid-cols-1 sm:grid-cols-2 md:grid-cols-3 grid-rows-2"
                )}
              >
                {metrics.map((metric, index) => {
                  const col = index % metricsPerRow;
                  const isFirst = col === 0;
                  const isLast = col === metricsPerRow - 1;
                  const isMiddle = col > 0 && col < metricsPerRow - 1;
                  return (
                    <div
                      key={metric.label}
                      className={cn(
                        isFirst && "md:pr-6",
                        isMiddle && "md:px-6",
                        isLast && "md:pl-6"
                      )}
                    >
                      <SimpleMetric
                        data={metric}
                        onClick={
                          onMetricClick ? () => onMetricClick(metric.label) : undefined
                        }
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Insight Card */}
            {insightCard && (
              <div className="flex items-stretch">
                <InsightCard
                  data={{
                    title: insightCard.title,
                    description: insightCard.description,
                    icon: insightCard.icon,
                    metric: insightCard.metric,
                  }}
                  onClick={insightCard.onClick}
                  className="w-full"
                />
              </div>
            )}
          </div>
        </div>

        {/* Horizontal Separator */}
        <div className="h-px bg-border" />
      </div>
    </div>
  );
}
