"use client";

import * as React from "react";
import { PartnerSitePerformanceCard } from "../shared/partner-site-performance-card";
import { createSimpleMetricData } from "../shared/simple-metric";
import { createInsightCardData } from "../shared/insight-card";

// Partner data with historical performance metrics
const partnerData = [
  {
    name: "Mayo Clinic",
    currentSlots: 45,
    previousSlots: 33, // +36% increase
    approvalRate: 92,
    previousApprovalRate: 85, // +7% improvement
  },
  {
    name: "Cleveland Clinic",
    currentSlots: 38,
    previousSlots: 30, // +27% increase
    approvalRate: 88,
    previousApprovalRate: 82, // +6% improvement
  },
  {
    name: "Johns Hopkins",
    currentSlots: 52,
    previousSlots: 37, // +41% increase
    approvalRate: 95,
    previousApprovalRate: 89, // +6% improvement
  },
];

// Calculate if partner qualifies for partnership upgrade based on performance
const qualifiesForPartnership = (partner: (typeof partnerData)[0]) => {
  const slotIncrease = ((partner.currentSlots - partner.previousSlots) / partner.previousSlots) * 100;
  const approvalImprovement = partner.approvalRate - partner.previousApprovalRate;

  // Qualify if: 20%+ slot increase AND 5%+ approval rate improvement
  return slotIncrease >= 20 && approvalImprovement >= 5;
};

export function PartnerPerformanceSection() {
  const partnerMetrics = React.useMemo(
    () =>
      partnerData.map((partner) =>
        createSimpleMetricData(partner.name, String(partner.currentSlots), {
          trend: "up",
          trendValue: `+${Math.round(((partner.currentSlots - partner.previousSlots) / partner.previousSlots) * 100)}%`,
        })
      ),
    []
  );

  const topPerformer = React.useMemo(() => {
    const qualified = partnerData
      .filter(qualifiesForPartnership)
      .sort((a, b) => {
        const aScore =
          ((a.currentSlots - a.previousSlots) / a.previousSlots) * 100 + (a.approvalRate - a.previousApprovalRate);
        const bScore =
          ((b.currentSlots - b.previousSlots) / b.previousSlots) * 100 + (b.approvalRate - b.previousApprovalRate);
        return bScore - aScore;
      });

    return qualified[0];
  }, []);

  const insightCard = React.useMemo(() => {
    if (!topPerformer) return undefined;

    const slotIncrease = Math.round(
      ((topPerformer.currentSlots - topPerformer.previousSlots) / topPerformer.previousSlots) * 100
    );
    const approvalImprovement = topPerformer.approvalRate - topPerformer.previousApprovalRate;

    return {
      ...createInsightCardData(
        "Partnership Upgrade Recommended",
        `${topPerformer.name} has increased slots by ${slotIncrease}% and improved approval rates to ${topPerformer.approvalRate}% (+${approvalImprovement}%) over the past quarter. Consider upgrading to Gold Partner tier.`,
        "award",
        `${topPerformer.approvalRate}% approval`
      ),
      onClick: () => {},
    };
  }, [topPerformer]);

  return (
    <section className="px-4 lg:px-6" aria-labelledby="partner-site-performance-title">
      <PartnerSitePerformanceCard
        id="partner-site-performance"
        title="Partner Site Performance"
        titleId="partner-site-performance-title"
        description="Active placements across your top partner sites this semester"
        metrics={partnerMetrics}
        insightCard={insightCard}
        actionButton={{ label: "View All Sites" }}
        className="-mt-8"
      />
    </section>
  );
}
