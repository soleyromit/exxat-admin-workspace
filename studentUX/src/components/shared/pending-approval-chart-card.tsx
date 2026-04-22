"use client";

import * as React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "../ui/card";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  LineChart,
  Line,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";
import { AskLeoButton } from "./ask-leo-button";
import { cn } from "../ui/utils";

export interface ChartDataItem {
  [key: string]: string | number;
}

export type ChartType = "bar" | "pie" | "donut" | "line" | "area";

export interface PendingApprovalChartCardProps {
  /** Card title */
  title: string;
  /** Card description */
  description: string;
  /** Chart data array */
  data: ChartDataItem[];
  /** Chart type: bar, pie, donut, line, or area */
  chartType?: ChartType;
  /** Key for X-axis / category (bar, line, area) or label (pie, donut) */
  dataKeyX?: string;
  /** Key for Y-axis / value */
  dataKeyY?: string;
  /** Default fill color. Ignored when colorKey is set. */
  barColor?: string;
  /** Key in each data item for per-segment color (e.g., "color") */
  colorKey?: string;
  /** Show legend grid below chart */
  showLegend?: boolean;
  /** Optional Ask Leo button config */
  askLeo?: {
    chartTitle: string;
    chartDescription: string;
    chartData: string;
  };
  /** Chart height in pixels */
  chartHeight?: number;
  /** Optional className for the card */
  className?: string;
  /** Optional id for the card */
  id?: string;
}

const RADIAN = Math.PI / 180;
const renderPieLabel = ({
  cx,
  cy,
  midAngle,
  innerRadius,
  outerRadius,
  percent,
}: {
  cx: number;
  cy: number;
  midAngle: number;
  innerRadius: number;
  outerRadius: number;
  percent: number;
}) => {
  if (percent < 0.01) return null;
  const radius = innerRadius + (outerRadius - innerRadius) * 0.5;
  const x = cx + radius * Math.cos(-midAngle * RADIAN);
  const y = cy + radius * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="var(--primary-foreground)"
      textAnchor="middle"
      dominantBaseline="central"
      className="text-sm font-semibold"
      style={{
        textShadow: "0 1px 2px color-mix(in oklch, var(--foreground) 30%, transparent)",
        pointerEvents: "none",
      }}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
};

const tooltipContentStyle = {
  backgroundColor: "var(--card)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  fontSize: "var(--font-size-xs)",
};

/**
 * PendingApprovalChartCard - Reusable card with configurable chart types:
 * bar, pie, donut, line, area.
 */
export function PendingApprovalChartCard({
  title,
  description,
  data,
  chartType = "bar",
  dataKeyX = "age",
  dataKeyY = "count",
  barColor = "var(--chart-1)",
  colorKey,
  showLegend = false,
  askLeo,
  chartHeight = 280,
  className,
  id,
}: PendingApprovalChartCardProps) {
  const nameKey = dataKeyX;
  const valueKey = dataKeyY;

  const renderChart = () => {
    switch (chartType) {
      case "pie":
      case "donut": {
        const innerRadius = chartType === "donut" ? 60 : 0;
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={renderPieLabel}
              outerRadius={100}
              innerRadius={innerRadius}
              dataKey={valueKey}
              strokeWidth={0}
            >
              {data.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={(colorKey && (entry[colorKey] as string)) || barColor}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipContentStyle} />
          </PieChart>
        );
      }

      case "line":
        return (
          <LineChart data={data}>
            <XAxis
              dataKey={nameKey}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: "var(--muted)" }} />
            <Line
              type="monotone"
              dataKey={valueKey}
              stroke={barColor}
              strokeWidth={2}
              dot={{ fill: barColor, r: 4 }}
            />
          </LineChart>
        );

      case "area":
        return (
          <AreaChart data={data}>
            <XAxis
              dataKey={nameKey}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: "var(--muted)" }} />
            <Area
              type="monotone"
              dataKey={valueKey}
              stroke={barColor}
              fill={barColor}
              fillOpacity={0.3}
              strokeWidth={2}
            />
          </AreaChart>
        );

      case "bar":
      default:
        return (
          <BarChart data={data} barCategoryGap="30%">
            <XAxis
              dataKey={nameKey}
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <YAxis
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
              axisLine={{ stroke: "var(--border)" }}
            />
            <Tooltip contentStyle={tooltipContentStyle} cursor={{ fill: "var(--muted)" }} />
            <Bar
              dataKey={valueKey}
              fill={colorKey ? undefined : barColor}
              radius={[4, 4, 0, 0]}
              barSize={28}
            >
              {colorKey &&
                data.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={(entry[colorKey] as string) || barColor}
                  />
                ))}
            </Bar>
          </BarChart>
        );
    }
  };

  return (
    <Card id={id} className={cn(className)}>
      <CardHeader className="flex flex-row items-start justify-between space-y-0">
        <div>
          <CardTitle>{title}</CardTitle>
          <CardDescription>{description}</CardDescription>
        </div>
        {askLeo && (
          <AskLeoButton
            chartTitle={askLeo.chartTitle}
            chartDescription={askLeo.chartDescription}
            chartData={askLeo.chartData}
          />
        )}
      </CardHeader>
      <CardContent>
        <div style={{ height: chartHeight }}>
          <ResponsiveContainer width="100%" height="100%">
            {renderChart()}
          </ResponsiveContainer>
        </div>
        {showLegend && nameKey && (
          <div className="grid grid-cols-2 gap-2 mt-4">
            {data.map((item, index) => (
              <div key={index} className="flex items-center gap-2 text-xs">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{
                    backgroundColor:
                      (colorKey && (item[colorKey] as string)) || barColor,
                  }}
                />
                <span className="text-muted-foreground truncate">
                  {String(item[nameKey])}:
                </span>
                <span className="font-medium">{String(item[valueKey])}</span>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
