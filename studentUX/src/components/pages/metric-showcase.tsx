"use client";

import * as React from "react";
import { KeyMetricsShowcase } from "../shared/key-metrics-showcase";
import { createSimpleMetricData } from "../shared/simple-metric";
import { createInsightCardData } from "../shared/insight-card";
import { metricsData } from "../../data/dashboard-data";
import type { IconName } from "../brand/font-awesome-icon";

/**
 * MetricShowcase - Key metrics with attention-focused insight card.
 * Uses reusable KeyMetricsShowcase component.
 */
export function MetricShowcase() {
  const [timePeriod, setTimePeriod] = React.useState("week");

  const handleMetricClick = (_metricName: string) => {};

  const metrics = React.useMemo(
    () => [
      createSimpleMetricData(
        "Pending requests",
        String(metricsData.pendingRequests.current),
        {
          trend: metricsData.pendingRequests.trend,
          trendValue: `+${metricsData.pendingRequests.current - metricsData.pendingRequests.previous}`,
        }
      ),
      createSimpleMetricData(
        "Confirmed placements",
        String(metricsData.confirmedPlacements.current),
        {
          trend: metricsData.confirmedPlacements.trend,
          trendValue: `+${metricsData.confirmedPlacements.current - metricsData.confirmedPlacements.previous}`,
        }
      ),
      createSimpleMetricData(
        "Pending Reviews",
        String(metricsData.pendingReviews.current),
        {
          trend: metricsData.pendingReviews.trend,
          trendValue: `-${metricsData.pendingReviews.previous - metricsData.pendingReviews.current}`,
        }
      ),
      createSimpleMetricData(
        "Available Slots",
        String(metricsData.availableSlots.current),
        {
          trend: metricsData.availableSlots.trend,
          trendValue: `+${metricsData.availableSlots.current - metricsData.availableSlots.previous}`,
        }
      ),
      createSimpleMetricData(
        "New Applications",
        String(metricsData.newApplications.current),
        {
          trend: metricsData.newApplications.trend,
          trendValue: `+${metricsData.newApplications.current - metricsData.newApplications.previous}`,
        }
      ),
      createSimpleMetricData(
        "Compliance Rate",
        `${metricsData.complianceRate.current}%`,
        {
          trend: metricsData.complianceRate.trend,
          trendValue: `+${metricsData.complianceRate.current - metricsData.complianceRate.previous}`,
        }
      ),
    ],
    []
  );

  const actionableInsight = React.useMemo(() => {
    if (
      metricsData.pendingReviews.current >= 8 &&
      metricsData.pendingRequests.current >= 20
    ) {
      return {
        title: "Review Bottleneck",
        description: `${metricsData.pendingReviews.current} reviews pending with ${metricsData.pendingRequests.current} new requests waiting. Clear reviews to maintain placement velocity.`,
        icon: "alertCircle" as IconName,
        action: "Review Queue",
      };
    }
    if (metricsData.pendingRequests.current >= 20) {
      const increase =
        metricsData.pendingRequests.current - metricsData.pendingRequests.previous;
      return {
        title: "Requests Need Attention",
        description: `${metricsData.pendingRequests.current} pending requests (+${increase} this ${timePeriod}). Review and respond to maintain service quality.`,
        icon: "clock" as IconName,
        action: "Pending Requests",
      };
    }
    if (metricsData.complianceRate.current < 95) {
      return {
        title: "Compliance Alert",
        description: `Compliance rate at ${metricsData.complianceRate.current}%. Review documentation gaps and coordinate with sites to improve.`,
        icon: "alertCircle" as IconName,
        action: "Compliance Details",
      };
    }
    return {
      title: "Needs Attention",
      description: `${metricsData.pendingReviews.current} reviews and ${metricsData.newApplications.current} new applications require immediate action.`,
      icon: "sparkles" as IconName,
      action: "Action Items",
    };
  }, [timePeriod]);

  const insightCard = React.useMemo(
    () => ({
      ...createInsightCardData(
        actionableInsight.title,
        actionableInsight.description,
        actionableInsight.icon
      ),
      onClick: () => handleMetricClick(actionableInsight.action),
    }),
    [actionableInsight]
  );

  return (
    <KeyMetricsShowcase
      title="Key Metrics"
      description="Overview of performance indicators"
      metrics={metrics}
      insightCard={insightCard}
      filter={{
        value: timePeriod,
        onValueChange: setTimePeriod,
        options: [
          { value: "week", label: "vs last week" },
          { value: "month", label: "vs last month" },
          { value: "quarter", label: "vs last quarter" },
          { value: "year", label: "vs last year" },
        ],
      }}
      onMetricClick={handleMetricClick}
    />
  );
}
