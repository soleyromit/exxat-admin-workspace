"use client";

import * as React from "react";
import { PendingApprovalChartCard } from "../shared/pending-approval-chart-card";
import { SectionWithHeader } from "../shared/section-with-header";
import { requestsAgeData, schedulesAgeData } from "../../data/dashboard-data";

/**
 * Pending Items by Age - Uses reusable PendingApprovalChartCard
 */
export function PendingItemsSection() {
  return (
    <SectionWithHeader
      title="Pending Items by Age"
      titleId="pending-items-title"
      description="How long items have been waiting for action"
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PendingApprovalChartCard
          title="Requests Pending Approval"
          description="Age distribution of pending requests"
          data={requestsAgeData}
          dataKeyX="age"
          dataKeyY="count"
          barColor="var(--chart-1)"
          askLeo={{
            chartTitle: "Requests Pending Approval",
            chartDescription: "Age distribution of pending requests",
            chartData: "<7 days: 142, 7-15 days: 98, 16-30 days: 123, >30 days: 123",
          }}
        />

        <PendingApprovalChartCard
          title="Schedules Pending Confirmation"
          description="Age distribution of unconfirmed schedules"
          data={schedulesAgeData}
          dataKeyX="age"
          dataKeyY="count"
          barColor="var(--chart-4)"
          askLeo={{
            chartTitle: "Schedules Pending Confirmation",
            chartDescription: "Age distribution of unconfirmed schedules",
            chartData: "<7 days: 28, 7-15 days: 15, 16-30 days: 8, >30 days: 5",
          }}
        />
      </div>
    </SectionWithHeader>
  );
}
