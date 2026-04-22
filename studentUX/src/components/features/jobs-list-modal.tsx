"use client";

import * as React from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { JobCard } from "@/components/shared/job-card";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import type { JobListing } from "@/data/jobs-data";

export interface JobsListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  jobs: JobListing[];
  /** Render props for each job card (e.g. headerChip for applied status) */
  renderJobCard?: (job: JobListing) => React.ReactNode;
  onJobClick?: (jobId: string) => void;
}

export function JobsListModal({
  open,
  onOpenChange,
  title,
  jobs,
  renderJobCard,
  onJobClick,
}: JobsListModalProps) {
  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-transparent"
        style={{
          top: "4rem",
          bottom: "0",
          left: "0.5rem",
          right: "0.5rem",
          maxHeight: "calc(100vh - 4rem)",
          borderRadius: "var(--radius-2xl)",
          overflow: "hidden",
          boxShadow: "var(--shadow-modal-deep)",
        }}
        className="flex flex-col gap-0 p-0 border w-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>{title}</SheetTitle>
        </SheetHeader>
        {/* iOS-style drag handle */}
        <div className="flex shrink-0 justify-center pt-3 pb-1">
          <div className="h-1 w-10 rounded-full bg-muted-foreground/30" aria-hidden />
        </div>
        {/* Header */}
        <div className="flex shrink-0 items-center justify-between gap-4 px-4 pt-2 pb-3 lg:px-6 lg:pt-4">
          <h2 className="text-xl font-bold">{title}</h2>
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => onOpenChange(false)}
            aria-label="Close"
          >
            <FontAwesomeIcon name="x" className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>
        {/* Scrollable job grid */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-6 lg:px-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {jobs.map((job) =>
              renderJobCard ? (
                <React.Fragment key={job.id}>{renderJobCard(job)}</React.Fragment>
              ) : (
                <JobCard
                  key={job.id}
                  job={job}
                  className="rounded-2xl border border-border"
                  onClick={() => onJobClick?.(job.id)}
                />
              )
            )}
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}
