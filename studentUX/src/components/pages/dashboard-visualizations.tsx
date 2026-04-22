"use client";

import * as React from "react";
import { PendingApprovalChartCard } from "../shared/pending-approval-chart-card";
import { SectionWithHeader } from "../shared/section-with-header";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "../ui/popover";
import { Button } from "../ui/button";
import { Calendar } from "lucide-react";
import { Calendar as CalendarComponent } from "../ui/calendar";
import { format } from "date-fns";
import { pipelineData, onboardingData } from "../../data/dashboard-data";

export function PipelineOverviewSection() {
  const [dateRange, setDateRange] = React.useState("30");
  const [customStartDate, setCustomStartDate] = React.useState<Date | undefined>();
  const [customEndDate, setCustomEndDate] = React.useState<Date | undefined>();
  const [showCustomDatePicker, setShowCustomDatePicker] = React.useState(false);

  const filterContent = (
    <>
      <Select
        value={dateRange}
        onValueChange={(value) => {
          setDateRange(value);
          if (value !== "custom") {
            setShowCustomDatePicker(false);
          }
        }}
      >
        <SelectTrigger className="w-[180px] h-9 bg-transparent" aria-label="Select duration">
          <SelectValue placeholder="Select duration" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="30">Last 30 days</SelectItem>
          <SelectItem value="90">Last 90 days</SelectItem>
          <SelectItem value="custom">Custom date range</SelectItem>
        </SelectContent>
      </Select>

      {dateRange === "custom" && (
        <Popover open={showCustomDatePicker} onOpenChange={setShowCustomDatePicker}>
          <PopoverTrigger asChild>
            <Button variant="outline" size="sm" className="h-9">
              <Calendar className="h-4 w-4 mr-2" />
              {customStartDate && customEndDate
                ? `${format(customStartDate, "MM/dd/yyyy")} - ${format(customEndDate, "MM/dd/yyyy")}`
                : "Pick dates"}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto p-4" align="end">
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Start Date</label>
                <CalendarComponent
                  mode="single"
                  selected={customStartDate}
                  onSelect={setCustomStartDate}
                  initialFocus
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">End Date</label>
                <CalendarComponent
                  mode="single"
                  selected={customEndDate}
                  onSelect={setCustomEndDate}
                  disabled={(date) => (customStartDate ? date < customStartDate : false)}
                />
              </div>
              <Button
                onClick={() => setShowCustomDatePicker(false)}
                className="w-full"
                disabled={!customStartDate || !customEndDate}
              >
                Apply
              </Button>
            </div>
          </PopoverContent>
        </Popover>
      )}
    </>
  );

  return (
    <SectionWithHeader
      title="Pipeline Overview"
      description="Current status of schedules and student onboarding"
      titleId="pipeline-overview-title"
      variant="withFilter"
      filter={filterContent}
    >
      <div className="grid gap-4 lg:grid-cols-2">
        <PendingApprovalChartCard
          title="Schedule Pipeline Overview"
          description="Current schedule status breakdown"
          data={pipelineData}
          chartType="donut"
          dataKeyX="name"
          dataKeyY="value"
          colorKey="color"
          showLegend
          askLeo={{
            chartTitle: "Schedule Pipeline Overview",
            chartDescription: "Current schedule status breakdown",
            chartData: "To Be Scheduled: 11, Confirmed: 2, Not Confirmed: 0, Cancelled: 0",
          }}
        />

        <PendingApprovalChartCard
          title="Student Onboarding Overview"
          description="Compliance status breakdown"
          data={onboardingData}
          chartType="donut"
          dataKeyX="name"
          dataKeyY="value"
          colorKey="color"
          showLegend
          askLeo={{
            chartTitle: "Student Onboarding Overview",
            chartDescription: "Compliance status breakdown",
            chartData: "Compliant: 745, Pending Documents: 186, Expired Credentials: 92, Not Started: 211",
          }}
        />
      </div>
    </SectionWithHeader>
  );
}
