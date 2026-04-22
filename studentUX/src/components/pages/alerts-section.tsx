"use client";

import * as React from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { AlertsSection as AlertsSectionBase } from "../shared/alerts-section";
import { alertsData } from "../../data/dashboard-data";

/**
 * Alerts & Items Needing Attention - Page section.
 * Uses reusable AlertsSection with variant (default = no filter).
 * Set variant="withFilter" and pass filter to show filter like Pipeline Overview.
 */
export function AlertsSection() {
  const [urgencyFilter, setUrgencyFilter] = React.useState("all");

  // Variant: "default" (no filter) or "withFilter" (shows filter like Pipeline Overview)
  const useFilterVariant = true;

  const filterContent = useFilterVariant && (
    <Select value={urgencyFilter} onValueChange={setUrgencyFilter}>
      <SelectTrigger className="w-[180px] h-9 bg-transparent" aria-label="Filter by urgency">
        <SelectValue placeholder="Filter by urgency" />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="all">All items</SelectItem>
        <SelectItem value="high">High priority</SelectItem>
        <SelectItem value="medium">Medium priority</SelectItem>
        <SelectItem value="low">Low priority</SelectItem>
      </SelectContent>
    </Select>
  );

  const filteredAlerts = React.useMemo(() => {
    if (urgencyFilter === "all") return alertsData;
    return alertsData.filter((a) => a.urgency === urgencyFilter);
  }, [urgencyFilter]);

  return (
    <AlertsSectionBase
      title="Alerts & Items Needing Attention"
      description="Critical items requiring immediate action"
      alerts={filteredAlerts}
      variant={useFilterVariant ? "withFilter" : "default"}
      filter={filterContent}
      onAlertAction={() => {}}
    />
  );
}
