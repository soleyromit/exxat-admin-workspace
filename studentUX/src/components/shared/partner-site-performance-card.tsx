"use client";

import * as React from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "../ui/card";
import { Button } from "../ui/button";
import { ArrowRight } from "lucide-react";
import { SimpleMetric, type SimpleMetricData } from "./simple-metric";
import { InsightCard, type InsightCardData } from "./insight-card";
import { cn } from "../ui/utils";

export interface PartnerSitePerformanceCardProps {
  /** Card title */
  title: string;
  /** Optional id for the title (for aria-labelledby) */
  titleId?: string;
  /** Card description */
  description: string;
  /** Array of metrics to display horizontally (e.g., partner names with slot counts) */
  metrics: SimpleMetricData[];
  /** Optional insight card shown on the right */
  insightCard?: InsightCardData & { onClick?: () => void };
  /** Optional action button (e.g., "View All Sites") */
  actionButton?: {
    label: string;
    onClick?: () => void;
  };
  /** Optional card id for accessibility */
  id?: string;
  /** Optional className for the card */
  className?: string;
  /** Show brand gradient background */
  showGradient?: boolean;
}

/**
 * PartnerSitePerformanceCard - Reusable card for displaying partner/site metrics
 * with optional insight card. Layout: metrics row (left) + insight card (right).
 */
export function PartnerSitePerformanceCard({
  title,
  titleId,
  description,
  metrics,
  insightCard,
  actionButton,
  id,
  className,
  showGradient = true,
}: PartnerSitePerformanceCardProps) {
  const metricCount = metrics.length;

  return (
    <Card
      id={id}
      className={cn("relative overflow-visible", className)}
    >
      {showGradient && (
        <div
          data-slot="brand-gradient"
          className="absolute inset-0 rounded-xl pointer-events-none"
          aria-hidden
          style={{
            background:
              "linear-gradient(to top, color-mix(in oklch, var(--brand-color) 8%, transparent), transparent)",
          }}
        />
      )}

      <CardHeader className="relative">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle id={titleId}>{title}</CardTitle>
            <CardDescription>{description}</CardDescription>
          </div>
          {actionButton && (
            <Button variant="outline" size="sm" onClick={actionButton.onClick}>
              {actionButton.label}
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>
      </CardHeader>

      <CardContent className="relative">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_340px] gap-6">
          {/* Metrics — horizontal row, middle-aligned */}
          <div className="min-w-0 flex items-center">
            <div
              className={cn(
                "grid gap-x-6 items-center w-full",
                metricCount === 1 && "grid-cols-1",
                metricCount === 2 && "grid-cols-2 divide-x divide-border",
                metricCount === 3 && "grid-cols-3 divide-x divide-border",
                metricCount >= 4 && "grid-cols-2 md:grid-cols-4 divide-x divide-border"
              )}
            >
              {metrics.map((metric, index) => (
                <div
                  key={metric.label}
                  className={cn(
                    "min-w-0",
                    index === 0 && "pr-6",
                    index > 0 && index < metricCount - 1 && "px-6",
                    index === metricCount - 1 && metricCount > 1 && "pl-6"
                  )}
                >
                  <SimpleMetric data={metric} />
                </div>
              ))}
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
      </CardContent>
    </Card>
  );
}
