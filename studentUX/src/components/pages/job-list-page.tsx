"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { JobSearchBar } from "../shared/job-search-bar";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { JobCard } from "../shared/job-card";
import { ProfilePromoCard } from "../shared/profile-promo-card";
import FilterBar, {
  type FilterConfig,
  type ActiveFilter,
} from "../shared/filter-bar";
import { useAppStore } from "../../stores/app-store";
import {
  recommendedJobs,
  getJobWithDetails,
  getJobSearchSuggestions,
  JOB_LOCATIONS,
  JOB_SITE_LOGO_MAP,
  JOB_WORK_SETTINGS,
  SITES_WITH_JOBS,
  JOB_BENEFITS,
} from "../../data/jobs-data";
import { parseDate } from "../../utils/date-utils";
import { useIsMobile } from "../ui/use-mobile";

const PROFILE_PROMO_TITLE =
  "The more we know about you, the better jobs we can recommend";

const JOB_FILTER_CONFIGS: FilterConfig[] = [
  // Upfront filters
  {
    key: "specialty",
    label: "Discipline",
    icon: "stethoscope",
    options: Array.from(
      new Set(recommendedJobs.map((j) => j.specialty).filter(Boolean))
    ).sort() as string[],
  },
  {
    key: "location",
    label: "Location (State)",
    icon: "mapPin",
    options: [...JOB_LOCATIONS],
  },
  {
    key: "jobType",
    label: "Job Type",
    icon: "briefcase",
    options: ["Full-time", "Part-time", "Contract", "Per diem"],
  },
  {
    key: "workSetting",
    label: "Work Setting",
    icon: "building2",
    options: [...JOB_WORK_SETTINGS],
  },
  // More filters
  {
    key: "salary",
    label: "Salary",
    icon: "sackDollar",
    options: [],
    type: "range",
    rangeMin: 50,
    rangeMax: 200,
    rangeStep: 5,
  },
  {
    key: "publishDate",
    label: "Published Date",
    icon: "calendarDays",
    options: ["Last 24 hours", "Last 7 days", "Last 30 days"],
    type: "date",
    singleSelect: true,
  },
  {
    key: "site",
    label: "Company/Site",
    icon: "building",
    options: [...SITES_WITH_JOBS],
    optionLogos: JOB_SITE_LOGO_MAP,
  },
  {
    key: "benefits",
    label: "Benefits",
    icon: "handHoldingHeart",
    options: [...JOB_BENEFITS],
  },
];

export function JobListPage() {
  const navigateBackFromJobListFull = useAppStore(
    (s) => s.navigateBackFromJobListFull
  );
  const navigateToJobDetail = useAppStore((s) => s.navigateToJobDetail);
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const jobSearchBarVariant = useAppStore((s) => s.jobSearchBarVariant);
  const isMobile = useIsMobile();

  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchLocation, setSearchLocation] = React.useState("Baltimore, MD");
  const [alertsEnabled, setAlertsEnabled] = React.useState(false);
  const [activeFilters, setActiveFilters] = React.useState<ActiveFilter[]>(() => [
    { id: "specialty_0", key: "specialty", label: "Discipline", values: [], removable: false },
    { id: "location_0", key: "location", label: "Location (State)", values: [], removable: false },
    { id: "jobType_0", key: "jobType", label: "Job Type", values: [], removable: false },
    { id: "workSetting_0", key: "workSetting", label: "Work Setting", values: [], removable: false },
  ]);

  const parseSalaryK = (salaryStr: string | undefined): number | null => {
    if (!salaryStr) return null;
    const m = salaryStr.match(/(\d+)/);
    return m ? parseInt(m[1], 10) : null;
  };

  const parsePostedAtDays = (postedAt: string): number | null => {
    const m = postedAt.match(/(\d+)\s*d\s*ago/);
    return m ? parseInt(m[1], 10) : null;
  };

  const filteredJobs = React.useMemo(() => {
    let jobs = recommendedJobs;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      jobs = jobs.filter(
        (j) =>
          j.title.toLowerCase().includes(q) ||
          j.company.toLowerCase().includes(q) ||
          (j.specialty && j.specialty.toLowerCase().includes(q))
      );
    }
    activeFilters.forEach((filter) => {
      if (filter.values.length > 0) {
        if (filter.key === "salary" && filter.values[0]?.includes(":")) {
          const [minK, maxK] = filter.values[0].split(":").map(Number);
          jobs = jobs.filter((j) => {
            const k = parseSalaryK(j.salary);
            if (k === null) return false;
            return k >= minK && k <= maxK;
          });
        } else if (filter.key === "publishDate") {
          if (filter.values[0] === "Custom") return; // Custom selected but no date yet — don't filter
          const maxDaysMap: Record<string, number> = {
            "Last 24 hours": 1,
            "Last 7 days": 7,
            "Last 30 days": 30,
          };
          const customDate = filter.values[0] && /^\d{1,2}\/\d{1,2}\/\d{4}$/.test(filter.values[0])
            ? parseDate(filter.values[0])
            : null;
          jobs = jobs.filter((j) => {
            const days = parsePostedAtDays(j.postedAt);
            if (days === null) return false;
            if (customDate) {
              const postedDate = new Date();
              postedDate.setDate(postedDate.getDate() - days);
              return postedDate <= customDate;
            }
            return filter.values.some((v) => {
              const maxDays = maxDaysMap[v];
              return maxDays !== undefined && days <= maxDays;
            });
          });
        } else if (filter.key === "benefits") {
          jobs = jobs.filter((j) => {
            const withDetails = getJobWithDetails(j);
            const jobBenefits = withDetails.benefits ?? [];
            return filter.values.some((v) => jobBenefits.includes(v));
          });
        } else {
          jobs = jobs.filter((j) =>
            filter.values.some(
              (v) => String((j as Record<string, unknown>)[filter.key]) === v
            )
          );
        }
      }
    });
    return jobs;
  }, [searchQuery, activeFilters]);

  const handleFilterRangeChange = (filterId: string, min: number, max: number) => {
    setActiveFilters((prev) =>
      prev.map((f) =>
        f.id === filterId ? { ...f, values: [`${min}:${max}`] } : f
      )
    );
  };

  const handleAddFilter = (filterKey: string) => {
    const existing = activeFilters.find((f) => f.key === filterKey);
    if (existing) return;
    const config = JOB_FILTER_CONFIGS.find((c) => c.key === filterKey);
    setActiveFilters((prev) => [
      ...prev,
      {
        id: `${filterKey}_${Date.now()}`,
        key: filterKey,
        label: config?.label ?? filterKey,
        values: [],
        removable: true,
      },
    ]);
  };

  const handleToggleFilterValue = (filterId: string, value: string) => {
    setActiveFilters((prev) =>
      prev.map((f) =>
        f.id === filterId
          ? {
              ...f,
              values: f.values.includes(value)
                ? f.values.filter((v) => v !== value)
                : [...f.values, value],
            }
          : f
      )
    );
  };

  const handleRemoveFilter = (filterId: string) => {
    setActiveFilters((prev) => prev.filter((f) => f.id !== filterId));
  };

  const handleClearAllFilters = () => {
    setActiveFilters([]);
  };

  return (
    <div className="flex flex-1 flex-col min-h-0 bg-background text-foreground overflow-hidden">
      {/* Header: Back | Search bar | Job alerts toggle */}
      <div className="content-rail shrink-0 px-4 lg:px-6 py-4 flex flex-row flex-nowrap items-center justify-between gap-4">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0"
          onClick={() => navigateBackFromJobListFull()}
          aria-label="Back to discover"
        >
          <FontAwesomeIcon name="arrowLeft" className="h-4 w-4" />
        </Button>

        <JobSearchBar
          searchQuery={searchQuery}
          onSearchQueryChange={setSearchQuery}
          searchLocation={searchLocation}
          onSearchLocationChange={setSearchLocation}
          className="flex-1 min-w-0 max-w-[700px] mx-10"
          placeholderVariant={jobSearchBarVariant}
          suggestionGroups={getJobSearchSuggestions()}
        />

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            id="job-list-alerts"
            checked={alertsEnabled}
            onCheckedChange={setAlertsEnabled}
            aria-label="Job alerts for job matches"
          />
          <Label
            htmlFor="job-list-alerts"
            className="text-sm font-medium text-foreground cursor-pointer whitespace-nowrap"
          >
            Job alerts
          </Label>
        </div>
      </div>

      {/* Filter bar with Sort */}
      <div className="content-rail">
        <FilterBar
          filterConfigs={JOB_FILTER_CONFIGS}
          activeFilters={activeFilters}
          onAddFilter={handleAddFilter}
          onToggleFilterValue={handleToggleFilterValue}
          onRemoveFilter={handleRemoveFilter}
          onClearAll={handleClearAllFilters}
          onFilterRangeChange={handleFilterRangeChange}
          resultsCount={filteredJobs.length}
          resultsLabel="Jobs found"
          addFilterLabel="More filters"
          className="pb-4 pt-0"
        rightContent={
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8 shrink-0"
            aria-label="Sort"
          >
            <FontAwesomeIcon
              name="arrowUpDown"
              className="h-4 w-4"
              weight="regular"
              aria-hidden
            />
          </Button>
        }
        />
      </div>

      {/* Job list */}
      <div className="content-rail flex-1 min-h-0 overflow-y-auto bg-background">
        <div className="py-2 flex flex-col gap-4">
          <div className="flex flex-col gap-4">
            {filteredJobs.slice(0, 3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={false}
                className="w-full"
                onClick={() => navigateToJobDetail(job.id, { fromJobList: true })}
              />
            ))}
            <ProfilePromoCard
              title={PROFILE_PROMO_TITLE}
              progress={48}
              variant="compact"
              onClick={() => navigateToPage("Settings")}
              className="w-full"
            />
            {filteredJobs.slice(3).map((job) => (
              <JobCard
                key={job.id}
                job={job}
                isSelected={false}
                className="w-full"
                onClick={() => navigateToJobDetail(job.id, { fromJobList: true })}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
