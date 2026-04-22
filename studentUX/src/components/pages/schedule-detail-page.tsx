"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { ScheduleListViewRow } from "../shared/schedule-list-view-row";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { StatusChip } from "../shared/schedule-card";
import { JobTag } from "../shared/job-card";
import { ProfilePromoCard } from "../shared/profile-promo-card";
import { AddressMap } from "../shared/address-map";
import { cn, touchTargetMobileClasses } from "../ui/utils";
import { useIsMobile } from "../ui/use-mobile";
import { formatDateRange, formatDateRangeShort } from "@/utils/date-utils";
import { differenceInDays } from "date-fns";
import { useAppStore } from "../../stores/app-store";
import { scheduleItems } from "../../data/schedule-data";
import { getScheduleDetail } from "../../data/schedule-detail-data";
import type { ScheduleDetail, ScheduleRequirement } from "../../data/schedule-detail-data";

/* ── Detail row (icon + content) ─────────────────────────────────────────── */

function DetailRow({
  icon,
  iconTooltip,
  children,
  className,
}: {
  icon: React.ReactNode;
  iconTooltip?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const iconEl = (
    <span className="shrink-0 mt-0.5 text-muted-foreground inline-flex" aria-hidden>
      {icon}
    </span>
  );
  return (
    <div className={cn("flex items-start gap-2.5 px-4 py-3", className)}>
      {iconTooltip ? (
        <Tooltip>
          <TooltipTrigger asChild>{iconEl}</TooltipTrigger>
          <TooltipContent side="right">{iconTooltip}</TooltipContent>
        </Tooltip>
      ) : (
        iconEl
      )}
      <div className="min-w-0 flex-1">{children}</div>
    </div>
  );
}

/* ── Details card content (screenshot layout) ────────────────────────────── */

function DetailsCardContent({
  detail,
  formatDateRangeShort,
}: {
  detail: ScheduleDetail;
  formatDateRangeShort: (start: Date, end: Date) => string;
}) {
  const address = detail.address ?? detail.location;
  const department = detail.department ?? detail.specialty;
  const duration = detail.dateRange && formatDateRangeShort(detail.dateRange.start, detail.dateRange.end);
  const shiftDaysArray = detail.shiftDaysArray;
  const shiftTime = detail.shiftTime;

  const hasAny = address || department || duration || (shiftDaysArray && shiftDaysArray.length > 0) || shiftTime || detail.preceptorName;

  return (
    <Card className="rounded-xl border border-border overflow-hidden shrink-0 w-full">
      <div className={cn(!hasAny && "p-4")}>
        {!hasAny ? (
          <p className="text-sm font-normal text-muted-foreground">No details available</p>
        ) : (
          <>
        {address && (
          <div className="divide-y-0">
            <AddressMap
              address={address}
              lat={detail.addressLat}
              lng={detail.addressLng}
              height={112}
              maptilerKey={import.meta.env?.VITE_MAPTILER_API_KEY as string | undefined}
            />
            <DetailRow icon={<FontAwesomeIcon name="mapPin" className="h-4 w-4" weight="light" aria-hidden />} iconTooltip="Address">
              <div className="flex flex-col gap-1.5">
                <span className="text-sm font-medium text-foreground break-words">{address}</span>
                <a
                  href={`https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(address)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={cn(
                    "inline-flex items-center gap-1.5 text-xs text-chart-1 hover:text-chart-1/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded w-fit",
                    touchTargetMobileClasses
                  )}
                >
                  <FontAwesomeIcon name="route" className="h-3.5 w-3.5" weight="solid" aria-hidden />
                  Get directions
                </a>
              </div>
            </DetailRow>
          </div>
        )}
        {(department || detail.departmentDetail) && (
          <DetailRow icon={<FontAwesomeIcon name="building" className="h-4 w-4" weight="light" aria-hidden />} iconTooltip="Department">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{department}</span>
              {detail.departmentDetail && (
                <span className="text-xs text-muted-foreground">{detail.departmentDetail}</span>
              )}
            </div>
          </DetailRow>
        )}
        {duration && (
          <DetailRow icon={<FontAwesomeIcon name="calendar" className="h-4 w-4" weight="light" aria-hidden />} iconTooltip="Date range">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-medium text-foreground">{duration}</span>
              {detail.dateRange && (() => {
                const days = differenceInDays(detail.dateRange.end, detail.dateRange.start) + 1;
                const weeks = Math.round(days / 7);
                const label = weeks >= 2 ? `${weeks} weeks` : `${days} days`;
                return <span className="text-xs text-muted-foreground">{label}</span>;
              })()}
            </div>
          </DetailRow>
        )}
        {(shiftDaysArray?.length || shiftTime) && (
          <DetailRow icon={<FontAwesomeIcon name="clock" className="h-4 w-4" weight="light" aria-hidden />} iconTooltip="Shift">
            <div className="flex flex-col gap-2">
              {shiftDaysArray && shiftDaysArray.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                  {shiftDaysArray.map((d, i) => (
                    <span
                      key={i}
                      className={cn(
                        "inline-flex h-7 min-w-7 items-center justify-center rounded-md px-2 text-xs font-bold",
                        d.active ? "bg-foreground text-background" : "bg-muted text-muted-foreground"
                      )}
                    >
                      {d.label}
                    </span>
                  ))}
                </div>
              )}
              {shiftTime && (
                <span className="text-sm font-medium text-foreground">{shiftTime}</span>
              )}
            </div>
          </DetailRow>
        )}

        {detail.preceptorName && (
          <DetailRow icon={<FontAwesomeIcon name="user" className="h-4 w-4" weight="light" aria-hidden />} iconTooltip="Preceptor">
            <div className="flex flex-col gap-0.5">
              <span className="text-sm font-semibold text-foreground">{detail.preceptorName}</span>
              {detail.preceptorTitle && (
                <span className="text-xs text-muted-foreground">{detail.preceptorTitle}</span>
              )}
            </div>
          </DetailRow>
        )}

          </>
        )}
      </div>
    </Card>
  );
}

const REQUIREMENT_TABS = [
  { id: "onboarding", label: "Onboarding" },
  { id: "ongoing", label: "Ongoing" },
  { id: "offboarding", label: "Offboarding" },
] as const;

/** Stage tag colors — Upcoming, In-process, Completed (board-based, does not change with tab) */
const STAGE_STYLES: Record<string, { label: string; icon: "calendarDays" | "listChecks" | "checkCircle"; className: string }> = {
  upcoming: { label: "Upcoming", icon: "calendarDays", className: "bg-chart-4/10 text-chip-4 border-chip-4/40" },
  "in-process": { label: "In-Process", icon: "listChecks", className: "bg-chart-1/10 text-chip-1 border-chip-1/40" },
  completed: { label: "Completed", icon: "checkCircle", className: "bg-chart-2/10 text-chip-2 border-chip-2/40" },
};

const STATUS_STYLES: Record<string, string> = {
  "Get Started": "border-border bg-muted/50 text-muted-foreground",
  "Pending review": "bg-chart-4/10 text-chip-4 border-chip-4/40",
  Approved: "bg-chart-2/10 text-chip-2 border-chip-2/40",
  "Need attention": "bg-destructive/10 text-chip-destructive border-chip-destructive/40",
};

const COMPLIANCE_STYLE = "bg-chart-2/10 text-chip-2 border-chip-2/40";
const COMPLIANCE_NEEDS_ATTENTION = "bg-destructive/10 text-chip-destructive border-chip-destructive/40";
const COMPLIANCE_MUTED = "border-border bg-muted/50 text-muted-foreground";

/** Single flat list of requirements (no status grouping) */
function RequirementsList({
  items,
  allDoneMessage,
}: {
  items: ScheduleRequirement[];
  allDoneMessage: string;
}) {
  if (items.length === 0) return null;
  const allApproved = items.every((r) => r.status === "Approved");
  return (
    <div className="rounded-xl border border-border overflow-hidden bg-card">
      {allApproved ? (
        <>
          <div className="flex items-center gap-2.5 px-4 py-3 bg-chart-2/10 border-b border-chip-2/40">
            <FontAwesomeIcon name="checkCircle" className="h-4 w-4 text-chip-2" weight="solid" aria-hidden />
            <span className="text-sm font-semibold text-foreground">All done</span>
          </div>
          <div className="px-4 py-3">
            <p className="text-sm text-muted-foreground mb-3">{allDoneMessage}</p>
            {items.map((req) => (
              <div key={req.id} className="flex items-center gap-2 py-1.5 text-sm">
                <FontAwesomeIcon name="checkCircle" className="h-4 w-4 text-chip-2 shrink-0" weight="solid" aria-hidden />
                <span className="text-foreground">{req.name}</span>
              </div>
            ))}
          </div>
        </>
      ) : (
        <>
          <div className="flex items-center gap-2.5 px-4 py-3 bg-muted/30 border-b border-border">
            <FontAwesomeIcon name="listChecks" className="h-4 w-4 text-muted-foreground" weight="light" aria-hidden />
            <span className="text-sm font-semibold text-foreground">Requirements</span>
            <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
              {items.length}
            </Badge>
          </div>
          {items.map((req, idx) => (
            <div
              key={req.id}
              className={cn(idx < items.length - 1 && "border-b border-border")}
            >
              <ScheduleListViewRow
                variant="compact"
                avatarFallback={req.name.slice(0, 2).toUpperCase()}
                title={
                  <>
                    {req.name}
                    {req.required && <span className="text-destructive ml-0.5">*</span>}
                  </>
                }
                subtitle={`Due ${req.dueDate}`}
                trailing={
                  <JobTag
                    icon={
                      req.status === "Approved" ? "checkCircle" :
                      req.status === "Pending review" ? "clock" :
                      req.status === "Need attention" ? "triangleExclamation" : "circle"
                    }
                    label={req.status}
                    className={cn(STATUS_STYLES[req.status] ?? STATUS_STYLES["Get Started"])}
                  />
                }
                showChevron
                ariaLabel={`View ${req.name} requirement`}
                onClick={() => {}}
              />
            </div>
          ))}
        </>
      )}
    </div>
  );
}

export function ScheduleDetailPage() {
  const isMobile = useIsMobile();
  const selectedScheduleId = useAppStore((s) => s.selectedScheduleId);
  const navigateBackFromScheduleDetail = useAppStore((s) => s.navigateBackFromScheduleDetail);

  const item = React.useMemo(
    () => scheduleItems.find((i) => i.id === selectedScheduleId) ?? scheduleItems[0],
    [selectedScheduleId]
  );

  const detail = React.useMemo(() => getScheduleDetail(item), [item]);

  const progressTotal = detail.progressApproved + detail.progressPendingReview + detail.progressNeedAttention;
  const progressPercent = React.useMemo(() => {
    if (progressTotal === 0) return 0;
    return Math.round((detail.progressApproved / progressTotal) * 100);
  }, [detail, progressTotal]);

  const initialTabByBoard = React.useMemo(() => {
    if (item.board === "in-process") return "ongoing";
    if (item.board === "completed") return "offboarding";
    return "onboarding";
  }, [item.board]);

  const [activeTab, setActiveTab] = React.useState<string>(initialTabByBoard);
  const [isScrolled, setIsScrolled] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    setActiveTab(initialTabByBoard);
  }, [initialTabByBoard]);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;
    setIsScrolled(el.scrollTop > 80);
  }, []);

  return (
    <div className="flex flex-col min-h-0 h-full bg-background text-foreground">
      <div className="content-rail @container/main flex flex-col flex-1 min-h-0 px-4 lg:px-6 py-4 lg:py-6">
        {/* Back button — outside card */}
        <div className="flex items-center gap-3 mb-3">
          <Button
            variant="ghost"
            size="icon"
            className={cn("shrink-0", touchTargetMobileClasses, "md:min-h-0 md:min-w-0 md:size-10")}
            onClick={navigateBackFromScheduleDetail}
            aria-label="Back to schedules"
          >
            <FontAwesomeIcon name="arrowLeft" className="h-4 w-4" aria-hidden="true" />
          </Button>
        </div>

        {/* Top card — profile-style, shrinks on scroll, tabs inside */}
        <Card
          className={cn(
            "flex shrink-0 flex-col overflow-hidden rounded-xl border-border bg-muted/30 w-full transition-all duration-200 pb-0",
            isScrolled ? "gap-2 pt-3 sm:pt-4 px-3 sm:px-4" : "gap-4 sm:gap-6 pt-4 sm:pt-5 md:pt-6 px-4 sm:px-5 md:px-6"
          )}
        >
          {/* Row 1: Logo + Content (logo vertically centered with site name + meta) */}
          <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4 w-full">
            <div className="flex items-center gap-3 sm:gap-4 min-w-0">
            {detail.facilityLogo ? (
              <img
                src={detail.facilityLogo}
                alt={`${detail.facilityName} logo`}
                className={cn(
                  "rounded-lg object-cover shrink-0 border border-border",
                  isScrolled ? "h-8 w-8 sm:h-9 sm:w-9" : "h-10 w-10 sm:h-11 sm:w-11"
                )}
              />
            ) : (
              <div
                className={cn(
                  "rounded-lg bg-muted flex items-center justify-center shrink-0 border border-border",
                  isScrolled ? "h-8 w-8 sm:h-9 sm:w-9" : "h-10 w-10 sm:h-11 sm:w-11"
                )}
              >
                <FontAwesomeIcon name="building" className={cn("text-muted-foreground", isScrolled ? "h-3 w-3 sm:h-4 sm:w-4" : "h-4 w-4 sm:h-5 sm:w-5")} weight="light" aria-hidden />
              </div>
            )}
            {/* Content: site title + address */}
            <div className="flex-1 min-w-0 flex flex-col gap-1.5">
                <h1 className={cn(
                  "truncate",
                  isScrolled ? "text-base font-semibold" : "text-xl sm:text-2xl md:page-title font-display font-bold"
                )}>
                  {detail.facilityName}
                </h1>
                {!isScrolled && (detail.address || detail.dateRange) && (
                  <div className="flex flex-col sm:flex-row sm:flex-wrap sm:items-center gap-y-1 gap-x-6 mt-0.5 sm:mt-1.5 text-xs text-muted-foreground">
                    {detail.address && (
                      <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <FontAwesomeIcon name="mapPin" className="h-3.5 w-3.5 shrink-0" weight="light" aria-hidden />
                        <span className="truncate">{detail.address}</span>
                      </span>
                    )}
                    {detail.dateRange && (
                      <span className="flex items-center gap-1.5 min-w-0 truncate">
                        <FontAwesomeIcon name="calendar" className="h-3.5 w-3.5 shrink-0" weight="light" aria-hidden />
                        {formatDateRange(detail.dateRange.start, detail.dateRange.end)}
                      </span>
                    )}
                  </div>
                )}
            </div>
            </div>
            {/* Badges — full width on mobile, wrap; right-aligned on desktop */}
            {!isScrolled && (
                  <div className="flex flex-wrap items-center gap-1.5 sm:ml-auto sm:justify-end">
                    <JobTag
                      icon={STAGE_STYLES[item.board]?.icon ?? "calendarDays"}
                      label={STAGE_STYLES[item.board]?.label ?? item.board}
                      className={STAGE_STYLES[item.board]?.className ?? COMPLIANCE_MUTED}
                    />
                    {!(progressPercent >= 100 && detail.status === "compliant") && (
                      <JobTag
                        icon={progressPercent >= 100 ? "checkCircle" : detail.progressNeedAttention > 0 ? "triangleExclamation" : "circleCheck"}
                        label={
                          progressPercent >= 100
                            ? "100% complete"
                            : detail.progressNeedAttention > 0
                              ? "Needs attention"
                              : `${progressPercent}% complete`
                        }
                        className={
                          progressPercent >= 100
                            ? COMPLIANCE_STYLE
                            : detail.progressNeedAttention > 0
                              ? COMPLIANCE_NEEDS_ATTENTION
                              : COMPLIANCE_MUTED
                        }
                      />
                    )}
                    <StatusChip
                      status={detail.status}
                      overdueDays={detail.overdueDays}
                      dueDate={detail.dueDate}
                    />
                  </div>
                )}
          </div>

          {/* Tabs — profile-style underline */}
          <div
            role="tablist"
            aria-label="Requirement sections"
            className={cn(
              "flex h-12 w-full items-end justify-start gap-0 overflow-x-auto -mb-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
              isScrolled ? "-mx-4 sm:-mx-5 md:-mx-6 pl-0 pr-4 sm:pr-5 md:pr-6" : "-mx-4 sm:-mx-5 md:-mx-6 pl-0 pr-4 sm:pr-5 md:pr-6"
            )}
          >
            {REQUIREMENT_TABS.map((tab) => {
              const isActive = activeTab === tab.id;
              return (
                <button
                  key={tab.id}
                  type="button"
                  role="tab"
                  aria-selected={isActive}
                  aria-controls={`${tab.id}-section`}
                  id={`tab-${tab.id}`}
                  onClick={() => setActiveTab(tab.id)}
                  onKeyDown={(e) => {
                    if (e.key === "ArrowLeft") {
                      e.preventDefault();
                      const idx = REQUIREMENT_TABS.findIndex((t) => t.id === tab.id);
                      if (idx > 0) setActiveTab(REQUIREMENT_TABS[idx - 1].id);
                    } else if (e.key === "ArrowRight") {
                      e.preventDefault();
                      const idx = REQUIREMENT_TABS.findIndex((t) => t.id === tab.id);
                      if (idx >= 0 && idx < REQUIREMENT_TABS.length - 1) setActiveTab(REQUIREMENT_TABS[idx + 1].id);
                    }
                  }}
                  className={cn(
                    "relative inline-flex h-full min-w-0 shrink-0 items-center justify-center whitespace-nowrap rounded-none px-3 pb-2 text-sm font-medium transition-colors",
                    "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                    isActive
                      ? "text-foreground font-semibold tab-active-underline"
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {tab.label}
                </button>
              );
            })}
          </div>
        </Card>

        {/* Mobile: single column, whole page scrolls. Desktop: two columns, left scrolls. */}
        {isMobile ? (
          <div
            ref={scrollRef}
            onScroll={handleScroll}
            className="flex flex-1 min-h-0 overflow-y-auto overflow-x-hidden flex-col gap-6 pt-6"
          >
            {/* Requirements first — visible in scroll */}
            <div className="flex flex-col gap-6 pl-0 pr-4 lg:pr-6">
            {activeTab === "onboarding" && (
                <div
                  id="onboarding-section"
                  role="tabpanel"
                  aria-labelledby="tab-onboarding"
                  className="flex flex-col gap-4"
                >
                  {/* Progress card — "Let's get you set-up" with progress bar, or "All set" green card with brief content when complete */}
                  {progressPercent >= 100 ? (
                    <Card className="rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-chart-2/10 border-b border-chip-2/40">
                        <FontAwesomeIcon name="checkCircle" className="h-4 w-4 text-chip-2" weight="solid" aria-hidden />
                        <span className="text-sm font-semibold text-foreground">All set</span>
                      </div>
                      <CardContent className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">Onboarding requirements completed.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="rounded-xl border border-border overflow-hidden">
                      <CardContent className="px-4 py-4">
                        <p className="text-sm font-semibold text-foreground mb-3">Let&apos;s get you set-up</p>
                        <div className="flex flex-col gap-3">
                          <div
                            className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border"
                            role="progressbar"
                            aria-valuenow={progressPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Onboarding progress: ${detail.progressApproved} approved, ${detail.progressPendingReview} pending review, ${detail.progressNeedAttention} need attention`}
                            aria-describedby="onboarding-progress-legend"
                          >
                            {progressTotal > 0 && (
                              <div
                                className="h-full w-full rounded-full transition-all"
                                style={{
                                  background: (() => {
                                    const gap = 0.5;
                                    const numGaps = [detail.progressApproved, detail.progressPendingReview, detail.progressNeedAttention].filter((n) => n > 0).length - 1;
                                    const totalGap = Math.max(0, numGaps) * gap;
                                    const available = 100 - totalGap;
                                    const p1 = (detail.progressApproved / progressTotal) * available;
                                    const p2 = (detail.progressPendingReview / progressTotal) * available;
                                    const p3 = (detail.progressNeedAttention / progressTotal) * available;
                                    const stops: string[] = [];
                                    let pos = 0;
                                    if (detail.progressApproved > 0) {
                                      stops.push(`var(--chart-2) ${pos}%`, `var(--chart-2) ${pos + p1}%`);
                                      pos += p1;
                                      if (detail.progressPendingReview > 0 || detail.progressNeedAttention > 0) {
                                        stops.push(`var(--background) ${pos}%`, `var(--background) ${pos + gap}%`);
                                        pos += gap;
                                      }
                                    }
                                    if (detail.progressPendingReview > 0) {
                                      stops.push(`var(--chart-4) ${pos}%`, `var(--chart-4) ${pos + p2}%`);
                                      pos += p2;
                                      if (detail.progressNeedAttention > 0) {
                                        stops.push(`var(--background) ${pos}%`, `var(--background) ${pos + gap}%`);
                                        pos += gap;
                                      }
                                    }
                                    if (detail.progressNeedAttention > 0) {
                                      stops.push(`var(--destructive) ${pos}%`, `var(--destructive) 100%`);
                                    }
                                    return `linear-gradient(to right, ${stops.join(", ")})`;
                                  })(),
                                }}
                              />
                            )}
                          </div>
                          <div id="onboarding-progress-legend" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon name="checkCircle" className="h-3.5 w-3.5 text-chart-2 shrink-0" weight="solid" aria-hidden />
                              <span className="text-muted-foreground">Approved</span>
                              <span className="font-medium text-foreground">{detail.progressApproved}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon name="clock" className="h-3.5 w-3.5 text-chart-4 shrink-0" weight="light" aria-hidden />
                              <span className="text-muted-foreground">Pending Review</span>
                              <span className="font-medium text-foreground">{detail.progressPendingReview}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon name="triangleExclamation" className="h-3.5 w-3.5 text-destructive shrink-0" weight="solid" aria-hidden />
                              <span className="text-muted-foreground">Need attention</span>
                              <span className="font-medium text-foreground">{detail.progressNeedAttention}</span>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <RequirementsList
                    items={detail.onboardingRequirements}
                    allDoneMessage="Onboarding requirements completed."
                  />
                </div>
            )}

            {activeTab === "ongoing" && (
              <div id="ongoing-section" role="tabpanel" aria-labelledby="tab-ongoing">
              {detail.ongoingRequirements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FontAwesomeIcon name="rocketLaunch" className="h-7 w-7 text-muted-foreground" weight="light" aria-hidden />
                  </div>
                  <p className="text-base font-medium text-foreground">No ongoing requirements</p>
                  <p className="text-sm text-muted-foreground mt-1">Surveys and compliance items will appear during your rotation.</p>
                </div>
              ) : (
                <RequirementsList
                  items={detail.ongoingRequirements}
                  allDoneMessage="Surveys and compliance completed."
                />
              )}
              </div>
            )}

            {activeTab === "offboarding" && (
              <div id="offboarding-section" role="tabpanel" aria-labelledby="tab-offboarding" className="flex flex-col gap-6">
              {/* Job promo banner — always shown in offboarding */}
              <ProfilePromoCard
                title="56% of students land jobs while interning!"
                subtitle="Explore opportunities at sites where you've already completed your rotation."
                ctaLabel="Explore Jobs"
                illustrationSrc="/Illustration/Job-2.webp"
                onClick={() => useAppStore.getState().navigateToPage("Jobs")}
                className="min-h-[200px] shrink-0"
                aria-label="Explore Jobs"
              />
              {detail.offboardingRequirements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FontAwesomeIcon name="checkCircle" className="h-7 w-7 text-muted-foreground" weight="light" aria-hidden />
                  </div>
                  <p className="text-base font-medium text-foreground">No offboarding requirements</p>
                  <p className="text-sm text-muted-foreground mt-1">Offboarding formalities appear when your rotation completes.</p>
                </div>
              ) : (
                <RequirementsList
                  items={detail.offboardingRequirements}
                  allDoneMessage="Offboarding formalities completed."
                />
              )}
              </div>
            )}
            </div>
            {/* Map + message — below requirements in single scroll */}
            <div className="flex w-full flex-col gap-4 shrink-0">
              <DetailsCardContent detail={detail} formatDateRangeShort={formatDateRangeShort} />
              <Card className="rounded-xl border border-border overflow-hidden shrink-0 w-full">
                <CardContent className="p-4">
                  <p className="text-sm font-semibold text-foreground mb-2">Message to site or School</p>
                  <p className="text-xs text-muted-foreground mb-3">Send a message to your site preceptor or school coordinator.</p>
                  <Button variant="outline" size="sm" className={cn("w-full gap-2", touchTargetMobileClasses, "md:min-h-0")}>
                    <FontAwesomeIcon name="envelope" className="h-4 w-4" weight="light" aria-hidden />
                    Compose message
                  </Button>
                </CardContent>
              </Card>
            </div>
          </div>
        ) : (
          /* Desktop: two columns, left scrolls, right sticky */
          <div className="flex flex-1 min-h-0 h-0 overflow-hidden gap-6 flex-row pt-6">
            <div
              ref={scrollRef}
              onScroll={handleScroll}
              className="flex-1 min-w-0 min-h-0 overflow-y-auto pl-0 pr-4 lg:pr-6"
            >
              <div className="flex flex-col gap-6">
            {activeTab === "onboarding" && (
                <div
                  id="onboarding-section"
                  role="tabpanel"
                  aria-labelledby="tab-onboarding"
                  className="flex flex-col gap-4"
                >
                  {progressPercent >= 100 ? (
                    <Card className="rounded-xl border border-border overflow-hidden">
                      <div className="flex items-center gap-2.5 px-4 py-3 bg-chart-2/10 border-b border-chip-2/40">
                        <FontAwesomeIcon name="checkCircle" className="h-4 w-4 text-chip-2" weight="solid" aria-hidden />
                        <span className="text-sm font-semibold text-foreground">All set</span>
                      </div>
                      <CardContent className="px-4 py-3">
                        <p className="text-sm text-muted-foreground">Onboarding requirements completed.</p>
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="rounded-xl border border-border overflow-hidden">
                      <CardContent className="px-4 py-4">
                        <p className="text-sm font-semibold text-foreground mb-3">Let&apos;s get you set-up</p>
                        <div className="flex flex-col gap-3">
                          <div
                            className="h-2 w-full overflow-hidden rounded-full bg-muted border border-border"
                            role="progressbar"
                            aria-valuenow={progressPercent}
                            aria-valuemin={0}
                            aria-valuemax={100}
                            aria-label={`Onboarding progress: ${detail.progressApproved} approved, ${detail.progressPendingReview} pending review, ${detail.progressNeedAttention} need attention`}
                            aria-describedby="onboarding-progress-legend"
                          >
                            {progressTotal > 0 && (
                              <div
                                className="h-full w-full rounded-full transition-all"
                                style={{
                                  background: (() => {
                                    const gap = 0.5;
                                    const numGaps = [detail.progressApproved, detail.progressPendingReview, detail.progressNeedAttention].filter((n) => n > 0).length - 1;
                                    const totalGap = Math.max(0, numGaps) * gap;
                                    const available = 100 - totalGap;
                                    const p1 = (detail.progressApproved / progressTotal) * available;
                                    const p2 = (detail.progressPendingReview / progressTotal) * available;
                                    const p3 = (detail.progressNeedAttention / progressTotal) * available;
                                    const stops: string[] = [];
                                    let pos = 0;
                                    if (detail.progressApproved > 0) {
                                      stops.push(`var(--chart-2) ${pos}%`, `var(--chart-2) ${pos + p1}%`);
                                      pos += p1;
                                      if (detail.progressPendingReview > 0 || detail.progressNeedAttention > 0) {
                                        stops.push(`var(--background) ${pos}%`, `var(--background) ${pos + gap}%`);
                                        pos += gap;
                                      }
                                    }
                                    if (detail.progressPendingReview > 0) {
                                      stops.push(`var(--chart-4) ${pos}%`, `var(--chart-4) ${pos + p2}%`);
                                      pos += p2;
                                      if (detail.progressNeedAttention > 0) {
                                        stops.push(`var(--background) ${pos}%`, `var(--background) ${pos + gap}%`);
                                        pos += gap;
                                      }
                                    }
                                    if (detail.progressNeedAttention > 0) {
                                      stops.push(`var(--destructive) ${pos}%`, `var(--destructive) 100%`);
                                    }
                                    return `linear-gradient(to right, ${stops.join(", ")})`;
                                  })(),
                                }}
                              />
                            )}
                          </div>
                          <div id="onboarding-progress-legend" className="flex flex-wrap gap-x-6 gap-y-2 text-xs">
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon name="checkCircle" className="h-3.5 w-3.5 text-chart-2 shrink-0" weight="solid" aria-hidden />
                              <span className="text-muted-foreground">Approved</span>
                              <span className="font-medium text-foreground">{detail.progressApproved}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon name="clock" className="h-3.5 w-3.5 text-chart-4 shrink-0" weight="light" aria-hidden />
                              <span className="text-muted-foreground">Pending Review</span>
                              <span className="font-medium text-foreground">{detail.progressPendingReview}</span>
                            </span>
                            <span className="flex items-center gap-2">
                              <FontAwesomeIcon name="triangleExclamation" className="h-3.5 w-3.5 text-destructive shrink-0" weight="solid" aria-hidden />
                              <span className="text-muted-foreground">Need attention</span>
                              <span className="font-medium text-foreground">{detail.progressNeedAttention}</span>
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                  <RequirementsList
                    items={detail.onboardingRequirements}
                    allDoneMessage="Onboarding requirements completed."
                  />
                </div>
            )}
            {activeTab === "ongoing" && (
              <div id="ongoing-section" role="tabpanel" aria-labelledby="tab-ongoing">
              {detail.ongoingRequirements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FontAwesomeIcon name="rocketLaunch" className="h-7 w-7 text-muted-foreground" weight="light" aria-hidden />
                  </div>
                  <p className="text-base font-medium text-foreground">No ongoing requirements</p>
                  <p className="text-sm text-muted-foreground mt-1">Surveys and compliance items will appear during your rotation.</p>
                </div>
              ) : (
                <RequirementsList
                  items={detail.ongoingRequirements}
                  allDoneMessage="Surveys and compliance completed."
                />
              )}
              </div>
            )}
            {activeTab === "offboarding" && (
              <div id="offboarding-section" role="tabpanel" aria-labelledby="tab-offboarding" className="flex flex-col gap-6">
              <ProfilePromoCard
                title="56% of students land jobs while interning!"
                subtitle="Explore opportunities at sites where you've already completed your rotation."
                ctaLabel="Explore Jobs"
                illustrationSrc="/Illustration/Job-2.webp"
                onClick={() => useAppStore.getState().navigateToPage("Jobs")}
                className="min-h-[200px] shrink-0"
                aria-label="Explore Jobs"
              />
              {detail.offboardingRequirements.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="h-14 w-14 rounded-full bg-muted flex items-center justify-center mb-4">
                    <FontAwesomeIcon name="checkCircle" className="h-7 w-7 text-muted-foreground" weight="light" aria-hidden />
                  </div>
                  <p className="text-base font-medium text-foreground">No offboarding requirements</p>
                  <p className="text-sm text-muted-foreground mt-1">Offboarding formalities appear when your rotation completes.</p>
                </div>
              ) : (
                <RequirementsList
                  items={detail.offboardingRequirements}
                  allDoneMessage="Offboarding formalities completed."
                />
              )}
              </div>
            )}
            </div>
          </div>
          {/* Right column — map/details card + message card */}
          <div className="flex w-80 md:w-96 shrink-0 flex-col gap-4 overflow-y-auto min-h-0">
            <DetailsCardContent detail={detail} formatDateRangeShort={formatDateRangeShort} />
            <Card className="rounded-xl border border-border overflow-hidden shrink-0 w-full">
              <CardContent className="p-4">
                <p className="text-sm font-semibold text-foreground mb-2">Message to site or School</p>
                <p className="text-xs text-muted-foreground mb-3">Send a message to your site preceptor or school coordinator.</p>
                <Button variant="outline" size="sm" className={cn("w-full gap-2", touchTargetMobileClasses, "md:min-h-0")}>
                  <FontAwesomeIcon name="envelope" className="h-4 w-4" weight="light" aria-hidden />
                  Compose message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
        )}
      </div>
    </div>
  );
}
