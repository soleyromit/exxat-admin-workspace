"use client";

import * as React from "react";
import {
  Users,
  Building2,
  Calendar,
  TrendingUp,
  CheckCircle2,
} from "lucide-react";
import { MapSection } from "../shared/map-section";
import { mapLocations } from "../../data/dashboard-data";
import { sidebarData } from "../layout/sidebar-data";

export function HomeMapSection() {
  const [searchWhere, setSearchWhere] = React.useState("");
  const [searchSite, setSearchSite] = React.useState("");
  const [searchWhen, setSearchWhen] = React.useState("");
  const [searchSpecialization, setSearchSpecialization] = React.useState("");

  const searchFields = React.useMemo(
    () => [
      {
        label: "Where",
        placeholder: "Search locations",
        value: searchWhere,
        onChange: setSearchWhere,
      },
      {
        label: "Site",
        placeholder: "Add site",
        value: searchSite,
        onChange: setSearchSite,
      },
      {
        label: "When",
        placeholder: "Add dates",
        value: searchWhen,
        onChange: setSearchWhen,
      },
      {
        label: "Specialization",
        placeholder: "Add specialty",
        value: searchSpecialization,
        onChange: setSearchSpecialization,
      },
    ],
    [searchWhere, searchSite, searchWhen, searchSpecialization]
  );

  const marketingAlerts = React.useMemo(
    () => [
      {
        icon: Building2,
        color: "chart-1",
        message: "University of Michigan just requested 15 PT placements",
        subtext: "Internal Medicine • Spring 2024",
      },
      {
        icon: Calendar,
        color: "chart-2",
        message: "Mayo Clinic just posted 8 new placement slots",
        subtext: "Cardiology rotation • Available now",
      },
      {
        icon: TrendingUp,
        color: "chart-3",
        message: "127 new placements posted in the last 20 days",
        subtext: "35% increase from last month",
      },
      {
        icon: Users,
        color: "chart-4",
        message: "Stanford Medical posted urgent need for 12 nursing students",
        subtext: "Emergency Medicine • Starts March 15",
      },
      {
        icon: CheckCircle2,
        color: "chart-2",
        message: "Cleveland Clinic confirmed 6 PT placement requests",
        subtext: "Orthopedics • Summer semester",
      },
    ],
    []
  );

  const handleSearch = (_values: Record<string, string>) => {};

  return (
    <MapSection
      locations={mapLocations}
      greeting={{
        userName: sidebarData.user.name,
      }}
      searchFields={searchFields}
      onSearch={handleSearch}
      alerts={marketingAlerts}
      alertInterval={8000}
      mapHeight={240}
      onLocationSelect={() => {}}
    />
  );
}

export default HomeMapSection;
