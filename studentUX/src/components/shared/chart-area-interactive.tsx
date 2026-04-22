"use client";

import * as React from "react";
import {
  Area,
  AreaChart,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { AskLeoButton } from "./ask-leo-button";

const tooltipContentStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "var(--font-size-xs)",
};

// Mock data for last 90 days - same shape as dashboard chart data
const placementOverviewData = (() => {
  const data: { date: string; pending: number; active: number; completed: number }[] = [];
  const now = new Date();
  for (let i = 89; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const base = 20 + Math.sin(i / 7) * 15;
    data.push({
      date: d.toISOString().split("T")[0],
      pending: Math.floor(base * 0.2 + Math.random() * 5),
      active: Math.floor(base * 0.5 + Math.random() * 8),
      completed: Math.floor(base * 0.3 + Math.random() * 6),
    });
  }
  return data;
})();

export function ChartAreaInteractive() {
  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>Student Placements Overview</CardTitle>
          <CardDescription>
            Showing placement trends and completion rates
          </CardDescription>
        </div>
        <AskLeoButton
          chartTitle="Student Placements Overview"
          chartDescription="Healthcare placement volumes: pending approvals, students in rotation, and approved placements"
          chartData="Stacked area chart with Pending Approvals, Students in Rotation, and Approved Placements over time"
        />
      </CardHeader>
      <CardContent>
        <div style={{ height: 280 }}>
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart
              data={placementOverviewData}
              margin={{ left: 0, right: 0, top: 4, bottom: 0 }}
            >
              <CartesianGrid vertical={false} stroke="var(--border)" />
              <XAxis
                dataKey="date"
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  });
                }}
              />
              <YAxis
                tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
                axisLine={{ stroke: "var(--border)" }}
              />
              <Tooltip
                contentStyle={tooltipContentStyle}
                cursor={{ fill: "var(--muted)" }}
                labelFormatter={(value) => {
                  const date = new Date(value);
                  return date.toLocaleDateString("en-US", {
                    month: "long",
                    day: "numeric",
                    year: "numeric",
                  });
                }}
              />
              <Area
                dataKey="pending"
                type="monotone"
                stackId="a"
                stroke="var(--chart-4)"
                fill="var(--chart-4)"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Area
                dataKey="active"
                type="monotone"
                stackId="a"
                stroke="var(--chart-1)"
                fill="var(--chart-1)"
                fillOpacity={0.4}
                strokeWidth={2}
              />
              <Area
                dataKey="completed"
                type="monotone"
                stackId="a"
                stroke="var(--chart-2)"
                fill="var(--chart-2)"
                fillOpacity={0.4}
                strokeWidth={2}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
        <div className="flex flex-wrap gap-4 mt-4 text-xs">
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: "var(--chart-4)" }}
            />
            <span className="text-muted-foreground">Pending Approvals</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: "var(--chart-1)" }}
            />
            <span className="text-muted-foreground">Students in Rotation</span>
          </div>
          <div className="flex items-center gap-2">
            <div
              className="w-3 h-3 rounded-full shrink-0"
              style={{ backgroundColor: "var(--chart-2)" }}
            />
            <span className="text-muted-foreground">Approved Placements</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
