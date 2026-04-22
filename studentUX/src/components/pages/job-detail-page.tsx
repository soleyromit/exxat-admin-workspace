"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { JobSearchBar } from "../shared/job-search-bar";
import { Switch } from "../ui/switch";
import { Label } from "../ui/label";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import {
  JobCard,
  JobCardTags,
  JobTag,
  JOB_CARD_HOVER_CLASSES,
  JOB_CARD_TRANSITION_CLASSES,
} from "../shared/job-card";
import { ProfilePromoCard } from "../shared/profile-promo-card";
import FilterBar, {
  type FilterConfig,
  type ActiveFilter,
} from "../shared/filter-bar";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useAppStore } from "../../stores/app-store";
import { useIsMobile } from "../ui/use-mobile";
import {
  recommendedJobs,
  getJobWithDetails,
  getJobListingById,
  getJobSearchSuggestions,
  logoUrl,
  JOB_LOCATIONS,
  JOB_SITE_LOGO_MAP,
  JOB_WORK_SETTINGS,
  SITES_WITH_JOBS,
  JOB_BENEFITS,
  type JobListing,
} from "../../data/jobs-data";
import { parseDate } from "../../utils/date-utils";
import { cn } from "../ui/utils";
import { ApplyJobModal } from "../features/apply-job-modal";

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

export function JobDetailPage() {
  const selectedJobId = useAppStore((s) => s.selectedJobId);
  const navigateBackFromJobDetail = useAppStore(
    (s) => s.navigateBackFromJobDetail
  );
  const navigateToJobDetail = useAppStore((s) => s.navigateToJobDetail);
  const navigateToPage = useAppStore((s) => s.navigateToPage);
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
  const applyModalOpen = useAppStore((s) => s.applyJobModalOpen);
  const setApplyModalOpen = useAppStore((s) => s.setApplyJobModalOpen);
  const appliedJobIds = useAppStore((s) => s.appliedJobIds);
  const showJobListFull = useAppStore((s) => s.showJobListFull);

  const selectedJob = React.useMemo(
    () => (selectedJobId ? getJobListingById(selectedJobId) : undefined),
    [selectedJobId]
  );
  const jobWithDetails = selectedJob
    ? getJobWithDetails(selectedJob)
    : null;

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

  if (!selectedJobId) return null;

  if (!selectedJob) {
    return (
      <div className="flex flex-1 flex-col min-h-0 bg-background items-center justify-center p-6">
        <Card className="max-w-md w-full rounded-2xl border border-border">
          <CardContent className="p-6 flex flex-col gap-4">
            <div className="flex items-center gap-2 text-foreground">
              <FontAwesomeIcon
                name="alertCircle"
                className="h-5 w-5 text-destructive shrink-0"
                weight="regular"
                aria-hidden
              />
              <span className="font-semibold">Job not found</span>
            </div>
            <p className="text-sm text-muted-foreground">
              This job isn&apos;t in the current list. It may have been removed or the link is outdated.
            </p>
            <Button
              type="button"
              onClick={() => navigateBackFromJobDetail()}
              className="self-start"
            >
              Back to jobs
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
    <div className="flex flex-1 flex-col min-h-0 bg-background text-foreground overflow-hidden">
      {/* Header: Back | Search bar (truly centered) | Job alerts */}
      <div className="shrink-0 py-4 w-full min-w-0 relative flex flex-row flex-nowrap items-center justify-between px-4 lg:px-6">
        <Button
          variant="ghost"
          size="icon"
          className="shrink-0 h-9 w-9"
          onClick={() => {
            navigateBackFromJobDetail();
          }}
          aria-label="Back to discover"
        >
          <FontAwesomeIcon name="arrowLeft" className="h-4 w-4" />
        </Button>

        {/* Search bar: absolutely centered in header */}
        <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-2xl min-w-0 px-4">
          <JobSearchBar
            searchQuery={searchQuery}
            onSearchQueryChange={setSearchQuery}
            searchLocation={searchLocation}
            onSearchLocationChange={setSearchLocation}
            className="w-full min-w-0"
            placeholderVariant="default"
            suggestionGroups={getJobSearchSuggestions()}
          />
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Switch
            id="set-alerts"
            checked={alertsEnabled}
            onCheckedChange={setAlertsEnabled}
            aria-label="Job alerts for job matches"
          />
          <Label
            htmlFor="set-alerts"
            className="text-sm font-medium text-foreground cursor-pointer whitespace-nowrap"
          >
            Job alerts
          </Label>
        </div>
      </div>

      {/* Filter bar with Sort: desktop only — mobile Case 1 has no filter */}
      {!isMobile && (
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
          className="px-4 md:px-6 lg:px-10 pb-4 pt-0"
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
      )}

      {/* Main content: left job list + right job details — two columns on desktop; full-screen detail only on mobile */}
      <div
        className="flex-1 min-h-0 w-full min-w-0 overflow-hidden rounded-2xl"
        style={{
          display: "grid",
          gridTemplateColumns: isMobile
            ? "1fr"
            : "minmax(0, 344px) minmax(320px, 1fr)",
          gap: isMobile ? 0 : 0,
        }}
      >
        {/* Left: job cards list — 344px fixed on desktop; hidden on mobile (detail is full-screen "next page") */}
        {!isMobile && (
        <div className="overflow-y-auto bg-background">
          <div className="py-2 px-3 flex flex-col gap-4">
            <div className="flex flex-col gap-4">
              {filteredJobs.slice(0, 3).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobId === job.id}
                  className="w-full"
                  onClick={() =>
                    navigateToJobDetail(job.id, { fromJobList: showJobListFull })
                  }
                />
              ))}
              <ProfilePromoCard
                title={PROFILE_PROMO_TITLE}
                progress={48}
                variant="compact"
                onClick={() => navigateToPage("Settings")}
                className="w-full"
              />
              {filteredJobs.slice(3, 5).map((job) => (
                <JobCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJobId === job.id}
                  className="w-full"
                  onClick={() =>
                    navigateToJobDetail(job.id, { fromJobList: showJobListFull })
                  }
                />
              ))}
            </div>
            <Button variant="outline" size="default" className="w-full">
              Show More
            </Button>
          </div>
        </div>
        )}

        {/* Right: job details panel — full screen on mobile (next-page style with back) */}
        <div className="min-h-0 overflow-y-auto bg-background">
          {jobWithDetails ? (
            <JobDetailPanel
              job={jobWithDetails}
              isApplied={appliedJobIds.includes(jobWithDetails.id)}
              onApplyClick={() => setApplyModalOpen(true)}
              onViewStatusClick={() => {
                navigateToPage("Jobs", { jobsTab: "my-jobs" });
              }}
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full p-8 text-muted-foreground">
              <FontAwesomeIcon
                name="briefcase"
                className="h-12 w-12 mb-4"
                weight="regular"
              />
              <p className="text-sm">Select a job to view details</p>
            </div>
          )}
        </div>
      </div>
    </div>
    <ApplyJobModal
      open={applyModalOpen}
      onOpenChange={setApplyModalOpen}
      job={selectedJob ?? null}
    />
  </>
  );
}

function JobDetailPanel({
  job,
  isApplied,
  onApplyClick,
  onViewStatusClick,
}: {
  isApplied?: boolean;
  onApplyClick?: () => void;
  onViewStatusClick?: () => void;
  job: JobListing & {
    description?: string;
    requirements?: string[];
    benefits?: string[];
    aiInsights?: {
      summary: string;
      strongMatches: string[];
      recommendedPrep: string[];
    };
  };
}) {
  const [isSaved, setIsSaved] = React.useState(job.isSaved ?? false);
  const companyLogo = job.companyLogo ?? logoUrl("example.com");

  return (
    <div className="p-2 max-w-3xl mt-8">
      {/* Root card per Figma: rounded-16, border, p-24, gap-32 */}
      <Card
        className={cn(
          "rounded-2xl border border-border",
          JOB_CARD_TRANSITION_CLASSES,
          JOB_CARD_HOVER_CLASSES,
        )}
      >
        <CardContent className="p-6 flex flex-col gap-8">
          {/* 1. Header — gap between chips and actions */}
          <div className="flex flex-col gap-8">
            {/* Title block — company, title, location, badges */}
            <div className="flex flex-col gap-3">
              <div className="flex items-center gap-2">
                <Avatar className="h-5 w-5 shrink-0 rounded">
                  <AvatarImage
                    src={companyLogo}
                    alt=""
                    className="rounded object-contain bg-muted"
                    referrerPolicy="origin"
                  />
                  <AvatarFallback className="text-xs font-medium">
                    {job.company.slice(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <span className="text-xs font-medium text-foreground">
                  {job.company}
                  {job.site && job.site !== job.company && (
                    <span className="text-muted-foreground font-normal"> · {job.site}</span>
                  )}
                </span>
              </div>
              <h1 className="text-lg font-black text-foreground leading-tight">
                {job.title}
              </h1>
              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                <FontAwesomeIcon name="mapPin" className="h-4 w-4 shrink-0" />
                <span>{job.location}</span>
              </div>
              <JobCardTags job={job} />
            </div>
            {/* Actions row — Save/Apply + engagement metrics */}
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div className="flex gap-4">
                <Button
                  variant="outline"
                  size="default"
                  className="h-10 min-w-[96px]"
                  onClick={() => setIsSaved((s) => !s)}
                >
                  <FontAwesomeIcon
                    name="heart"
                    className={cn("h-4 w-4 mr-2", isSaved && "text-primary")}
                    weight={isSaved ? "solid" : "regular"}
                  />
                  {isSaved ? "Saved" : "Save"}
                </Button>
                {isApplied ? (
                  <>
                    <Button
                      variant="secondary"
                      size="default"
                      className="h-10 min-w-[96px] gap-2"
                      disabled
                    >
                      <FontAwesomeIcon name="circleCheck" className="h-4 w-4" weight="solid" />
                      Applied
                    </Button>
                    <Button
                      variant="outline"
                      size="default"
                      className="h-10 min-w-[120px] gap-2"
                      onClick={() => onViewStatusClick?.()}
                    >
                      View status
                      <FontAwesomeIcon name="arrowRight" className="h-4 w-4" weight="light" />
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="default"
                    size="default"
                    className="h-10 min-w-[96px] gap-2"
                    onClick={() => onApplyClick?.()}
                  >
                    Apply
                    <FontAwesomeIcon name="arrowRight" className="h-4 w-4" />
                  </Button>
                )}
              </div>
              <div className="flex gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon name="eye" className="h-3.5 w-3.5" />
                  49K Views
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon name="userCheck" className="h-3.5 w-3.5" />
                  230 Shown Interest
                </span>
                <span className="flex items-center gap-1.5">
                  <FontAwesomeIcon name="badgeCheck" className="h-3.5 w-3.5" />
                  20 Applied
                </span>
              </div>
            </div>
          </div>

          <div className="h-px w-full bg-border" />

          {/* 2. AI-Powered Insights — border-chart-1 per Figma */}
          {job.aiInsights && (
            <section
              className="flex flex-col gap-6 rounded-2xl border-2 border-border bg-card p-5 border-l-4 border-l-chart-1"
              aria-labelledby="job-ai-insights-heading"
            >
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <FontAwesomeIcon
                    name="sparkles"
                    className="h-6 w-6 shrink-0 text-chart-1"
                    aria-hidden
                  />
                  <h2
                    id="job-ai-insights-heading"
                    className="text-base font-semibold text-foreground"
                  >
                    AI-Powered Insights
                  </h2>
                </div>
                {job.matchScore && (
                  <JobTag
                    icon="faceGrinStars"
                    label={job.matchScore}
                    showInfo
                    variant="match"
                  />
                )}
              </div>
              <p className="text-sm text-foreground leading-relaxed tracking-wide">
                {job.aiInsights.summary}
              </p>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground tracking-wide">
                  Strong Matches
                </h3>
                <ul className="list-disc list-inside text-sm text-foreground space-y-2.5 leading-7 tracking-wide pl-0.5">
                  {job.aiInsights.strongMatches.map((m, i) => (
                    <li key={i}>{m}</li>
                  ))}
                </ul>
              </div>
              <div className="flex flex-col gap-3">
                <h3 className="text-sm font-semibold text-foreground tracking-wide">
                  Recommended Prep
                </h3>
                <ul className="list-disc list-inside text-sm text-foreground space-y-2.5 leading-7 tracking-wide pl-0.5">
                  {job.aiInsights.recommendedPrep.map((p, i) => (
                    <li key={i}>{p}</li>
                  ))}
                </ul>
              </div>
              {/* Update Profile CTA — gradient per Figma */}
              <div className="job-profile-cta-gradient flex items-center gap-4 rounded-2xl p-6">
                <p className="text-base font-bold text-foreground flex-1">
                  Update your profile! Get some cool insights for this job.
                </p>
                <Button size="default" variant="outline" className="h-10 shrink-0">
                  Update Profile
                </Button>
              </div>
            </section>
          )}

          {/* 3. Job Description — separate card per Figma */}
          {(job.description || (job.requirements && job.requirements.length > 0)) && (
            <section className="flex flex-col gap-3 rounded-2xl border border-border px-6 py-4">
              {job.description && (
                <>
                  <h2 className="text-base font-semibold text-foreground">
                    Job Description
                  </h2>
                  <p className="text-sm text-foreground leading-relaxed whitespace-pre-line">
                    {job.description}
                  </p>
                </>
              )}
              {job.requirements && job.requirements.length > 0 && (
                <>
                  <h3 className={cn("text-sm font-bold text-foreground", job.description && "pt-2")}>
                    Key Responsibilities
                  </h3>
                  <ul className="list-disc list-inside text-sm text-foreground space-y-1">
                    {job.requirements.map((req, i) => (
                      <li key={i}>{req}</li>
                    ))}
                  </ul>
                </>
              )}
            </section>
          )}

          {/* 4. This job offers — icon + text per row per Figma */}
          {job.benefits && job.benefits.length > 0 && (
            <section className="flex flex-col gap-3 rounded-2xl border border-border px-6 py-4">
              <h2 className="text-base font-semibold text-foreground">
                This job offers
              </h2>
              <div className="flex flex-col gap-1">
                {job.benefits.map((benefit, i) => (
                  <div key={i} className="flex items-center gap-2">
                    <FontAwesomeIcon
                      name="checkCircle"
                      className="h-4 w-4 shrink-0 text-chart-2"
                    />
                    <span className="text-xs leading-4 text-foreground">
                      {benefit}
                    </span>
                  </div>
                ))}
              </div>
            </section>
          )}

          {/* 5. About company — 72x72 logo, meta row with icons per Figma */}
          <section className="flex flex-col gap-3 rounded-2xl border border-border px-6 py-4">
            <h2 className="text-base font-semibold text-foreground">
              About {job.company}
            </h2>
            <div className="flex items-start gap-4">
              <Avatar className="h-[72px] w-[72px] shrink-0 rounded-lg">
                <AvatarImage
                  src={companyLogo}
                  alt=""
                  className="rounded-lg object-contain bg-muted"
                  referrerPolicy="origin"
                />
                <AvatarFallback className="text-lg font-medium rounded-lg">
                  {job.company.slice(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-col gap-2 flex-1 min-w-0">
                <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="bookOpen" className="h-4 w-4" />
                    Academic Medical Center
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="mapPin" className="h-4 w-4" />
                    {job.location}
                  </span>
                  <span className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="globe" className="h-4 w-4" />
                    Website
                  </span>
                </div>
                <p className="text-sm text-muted-foreground leading-5">
                  {job.company} is a large not-for-profit healthcare organization
                  committed to providing high-quality care and advancing medical
                  research and education.
                </p>
                <Button variant="outline" size="default" className="h-10 w-full">
                  View Profile
                </Button>
              </div>
            </div>
          </section>

          {/* Job listing disclaimer */}
          <p className="text-xs text-muted-foreground -mt-4">
            <span className="font-semibold">Disclaimer:</span> This job listing is created and managed by the employer. Exxat does not verify the accuracy, completeness, or legality of the content and is not responsible for representations made in this posting.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
