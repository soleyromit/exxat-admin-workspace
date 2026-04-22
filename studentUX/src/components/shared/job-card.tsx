"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn } from "../ui/utils";
import type { JobListing } from "../../data/jobs-data";

export interface JobCardProps {
  job: JobListing;
  className?: string;
  onClick?: () => void;
  /** When true, applies selected-state styling (e.g. for job detail list) */
  isSelected?: boolean;
  /** Optional chip to show in header next to save button (e.g. Draft) */
  headerChip?: {
    icon: React.ComponentProps<typeof FontAwesomeIcon>["name"];
    label: string;
    className?: string;
  };
  /** When true, header chip replaces save button (e.g. for applied cards with status) */
  headerChipReplacesSave?: boolean;
  /** Override aria-label for the card (e.g. to include application status for screen readers) */
  "aria-label"?: string;
}

const CHIP_LINE_HEIGHT = 24; // h-6
const CHIP_GAP = 4;
const MAX_LINES = 2;
const MAX_CHIP_HEIGHT = CHIP_LINE_HEIGHT * MAX_LINES + CHIP_GAP * (MAX_LINES - 1);

/** Shared interactive shell for job cards (Jobs discovery, job detail sidebar, list, modals). */
export const JOB_CARD_TRANSITION_CLASSES = "transition-all duration-200";
export const JOB_CARD_HOVER_CLASSES =
  "hover:border-sidebar-border hover:bg-sidebar/50 hover:shadow-md";
export const JOB_CARD_FOCUS_RING_CLASSES =
  "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2";
export const JOB_CARD_SELECTED_CLASSES = "bg-sidebar border-sidebar-border shadow-md";

export function JobCardTags({ job }: { job: JobListing }) {
  const tags: { icon: React.ComponentProps<typeof FontAwesomeIcon>["name"]; label: string; showInfo?: boolean; variant?: "default" | "match" }[] = [];
  if (job.matchScore) {
    tags.push({ icon: "faceGrinStars", label: job.matchScore, showInfo: true, variant: "match" as const });
  }
  if (job.salary) {
    tags.push({ icon: "sackDollar", label: job.salary });
  }
  if (job.specialty) {
    tags.push({ icon: "stethoscope", label: job.specialty });
  }

  const containerRef = React.useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = React.useState(tags.length);
  const [showCountChip, setShowCountChip] = React.useState(false);

  React.useEffect(() => {
    setVisibleCount(tags.length);
    setShowCountChip(false);
  }, [job.id, tags.length]);

  const checkOverflow = React.useCallback(() => {
    const el = containerRef.current;
    if (!el || tags.length === 0) return;

    const isOverflowing = el.scrollHeight > MAX_CHIP_HEIGHT || el.scrollWidth > el.clientWidth;

    if (isOverflowing && visibleCount > 1) {
      setVisibleCount((c) => c - 1);
      setShowCountChip(true);
    } else if (isOverflowing && visibleCount === 1) {
      setShowCountChip(true);
    } else if (!isOverflowing) {
      setShowCountChip(false);
    }
  }, [tags.length, visibleCount]);

  React.useLayoutEffect(() => {
    checkOverflow();
  }, [checkOverflow]);

  React.useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      setVisibleCount(tags.length);
      setShowCountChip(false);
    });
    ro.observe(el);
    return () => ro.disconnect();
  }, [tags.length]);

  const visible = tags.slice(0, visibleCount);
  const overflowCount = tags.length - visibleCount;
  const hasOverflow = showCountChip && overflowCount > 0;

  return (
    <div
      ref={containerRef}
      className="flex flex-wrap gap-1 overflow-hidden min-h-6"
    >
      {visible.map((tag) => (
        <JobTag
          key={`${tag.icon}-${tag.label}`}
          icon={tag.icon}
          label={tag.label}
          showInfo={tag.showInfo}
          variant={tag.variant}
        />
      ))}
      {hasOverflow && (
        <span
          className="inline-flex h-6 shrink-0 items-center rounded-full border border-[var(--border-control-35)] bg-transparent px-2 py-1 text-xs font-normal text-foreground"
          aria-label={`${overflowCount} more`}
        >
          +{overflowCount}
        </span>
      )}
    </div>
  );
}

const JOB_TAG_TOOLTIP: Record<string, string> = {
  faceGrinStars: "Match score",
  sackDollar: "Salary",
  stethoscope: "Specialty",
  lock: "Payment status",
  clock: "Due date",
  checkCircle: "Compliance status",
  calendar: "Due date",
};

/** When set, skip default border/bg/text so schedule/payment chip utilities win (avoids purple border-control + bg-transparent vs .schedule-status-compliant). */
function shouldApplyDefaultJobTagChrome(className: string | undefined): boolean {
  if (!className) return true;
  return !(
    className.includes("schedule-status-") ||
    /bg-chart-\d/.test(className) ||
    className.includes("bg-destructive")
  );
}

export function JobTag({
  icon,
  label,
  showInfo,
  variant = "default",
  className,
}: {
  icon: React.ComponentProps<typeof FontAwesomeIcon>["name"];
  label: string;
  showInfo?: boolean;
  variant?: "default" | "match";
  className?: string;
}) {
  const tooltipLabel = JOB_TAG_TOOLTIP[icon] ?? label;
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <span
          className={cn(
            "inline-flex h-6 items-center gap-1 rounded-full border px-2 py-1 text-xs font-normal cursor-default",
            variant === "match" && "bg-sidebar border-sidebar-border text-sidebar-foreground",
            variant === "default" &&
              shouldApplyDefaultJobTagChrome(className) &&
              "border-[var(--border-control-35)] bg-transparent text-foreground",
            className
          )}
        >
          <FontAwesomeIcon name={icon} className="h-4 w-4 shrink-0" weight="light" aria-hidden />
          <span>{label}</span>
          {showInfo && (
            <FontAwesomeIcon
              name="circleInfo"
              className="h-3 w-3 shrink-0 text-muted-foreground"
              weight="light"
              aria-hidden
            />
          )}
        </span>
      </TooltipTrigger>
      <TooltipContent side="bottom">
        {showInfo ? `${tooltipLabel} — learn more` : tooltipLabel}
      </TooltipContent>
    </Tooltip>
  );
}

export function JobCard({
  job,
  className,
  onClick,
  isSelected,
  headerChip,
  headerChipReplacesSave,
  "aria-label": ariaLabel,
}: JobCardProps) {
  const [isSaved, setIsSaved] = React.useState(job.isSaved ?? false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved((prev) => !prev);
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col cursor-pointer rounded-2xl",
        JOB_CARD_TRANSITION_CLASSES,
        JOB_CARD_HOVER_CLASSES,
        JOB_CARD_FOCUS_RING_CLASSES,
        isSelected && JOB_CARD_SELECTED_CLASSES,
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? `View ${job.title} at ${job.company}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="flex flex-1 flex-col gap-3 md:gap-4 p-4 md:p-6 min-h-0">
        {/* Header: posted time + optional chip + save button */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-muted-foreground">{job.postedAt}</span>
          <div className="flex items-center gap-2">
            {headerChip && (
              <JobTag
                icon={headerChip.icon}
                label={headerChip.label}
                className={cn("shrink-0", headerChip.className)}
              />
            )}
            {!(headerChipReplacesSave && headerChip) && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    className="flex min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                    aria-label={isSaved ? "Unsave job" : "Save job"}
                    onClick={handleSaveClick}
                  >
                    <FontAwesomeIcon
                      name="heart"
                      className={cn("h-5 w-5", isSaved && "text-foreground")}
                      weight={isSaved ? "solid" : "regular"}
                    />
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isSaved ? "Unsave job" : "Save job"}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Job title — 2-line clamp; no min-height so single-line titles don't have extra gap */}
        <h3 className="text-lg md:text-xl leading-normal text-foreground line-clamp-2 font-extrabold">
          {job.title}
        </h3>

        {/* Company + location */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Avatar className="h-5 w-5 shrink-0 rounded">
              {job.companyLogo && (
                <AvatarImage
                  src={job.companyLogo}
                  alt=""
                  className="rounded object-contain bg-muted"
                  referrerPolicy="origin"
                />
              )}
              <AvatarFallback className="bg-muted text-xs font-medium">
                {job.company.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <span>{job.company}</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-foreground">
            <Tooltip>
              <TooltipTrigger asChild>
                <span className="inline-flex shrink-0" aria-hidden>
                  <FontAwesomeIcon
                    name="mapPin"
                    className="h-4 w-4 shrink-0 text-muted-foreground"
                    weight="light"
                  />
                </span>
              </TooltipTrigger>
              <TooltipContent side="bottom">Location</TooltipContent>
            </Tooltip>
            <span>{job.location}</span>
          </div>
        </div>

        {/* Tags — show all; +N count chip only when chips wrap past 2 lines */}
        <JobCardTags job={job} />
      </CardContent>
    </Card>
  );
}
