"use client";

import * as React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { RichTextEditor } from "@/components/shared/rich-text-editor";
import { JobCardTags } from "@/components/shared/job-card";
import { FontAwesomeIcon } from "@/components/brand/font-awesome-icon";
import { cn } from "@/components/ui/utils";
import type { JobListing } from "@/data/jobs-data";
import { logoUrl } from "@/data/jobs-data";
import { useAppStore } from "@/stores/app-store";

export interface ApplyJobModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  job: JobListing | null;
}

/** Full-width apply flow modal — same layout as profile settings (bottom sheet, full width) */
export function ApplyJobModal({
  open,
  onOpenChange,
  job,
}: ApplyJobModalProps) {
  const [coverLetter, setCoverLetter] = React.useState("");
  const [selectedResumeId, setSelectedResumeId] = React.useState<string | null>("1");
  const [hasContentBelow, setHasContentBelow] = React.useState(false);
  const [submitted, setSubmitted] = React.useState(false);
  const scrollRef = React.useRef<HTMLDivElement>(null);

  const handleScroll = React.useCallback(() => {
    const el = scrollRef.current;
    setHasContentBelow(!!el && el.scrollTop > 0);
  }, []);

  const setApplyJobModalMarginActive = useAppStore((s) => s.setApplyJobModalMarginActive);
  const setProfileSettingsOpen = useAppStore((s) => s.setProfileSettingsOpen);
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const addAppliedJob = useAppStore((s) => s.addAppliedJob);

  const handleViewMyJobs = React.useCallback(() => {
    navigateToPage("Jobs", { jobsTab: "my-jobs" });
    onOpenChange(false);
  }, [navigateToPage, onOpenChange]);

  const handleExploreMoreJobs = React.useCallback(() => {
    navigateToPage("Jobs", { jobsTab: "discover" });
    onOpenChange(false);
  }, [navigateToPage, onOpenChange]);

  React.useEffect(() => {
    if (open) {
      setCoverLetter("");
      setSelectedResumeId("1");
      setHasContentBelow(false);
      setSubmitted(false);
      scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
      const id = setTimeout(() => setApplyJobModalMarginActive(true), 500);
      return () => clearTimeout(id);
    } else {
      setApplyJobModalMarginActive(false);
    }
  }, [open, setApplyJobModalMarginActive]);

  if (!job) return null;

  const logoSrc = job.companyLogo ?? logoUrl("example.com");

  const resumeCards = [
    { id: "1", type: "PDF" as const, name: "WJ_Resume_1", lastUsed: "yesterday" },
    { id: "2", type: "PDF" as const, name: "WJ_Resume_2", lastUsed: "Nov 28" },
    { id: "3", type: "DOCX" as const, name: "WJ_Resume_3", lastUsed: "Oct 10" },
  ];

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="bottom"
        showCloseButton={false}
        overlayClassName="bg-transparent"
        onOpenAutoFocus={(e: React.FocusEvent) => {
          e.preventDefault();
          scrollRef.current?.scrollTo({ top: 0, behavior: "instant" });
        }}
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
        className="flex flex-col gap-0 p-0 border border-border w-auto"
      >
        <SheetHeader className="sr-only">
          <SheetTitle>Apply to {job.title}</SheetTitle>
        </SheetHeader>
        {/* iOS-style drag handle */}
        <div className="relative z-10 flex shrink-0 justify-center pt-3 pb-1">
          <div
            className="h-1 w-10 rounded-full bg-muted-foreground/30"
            aria-hidden
          />
        </div>
        {/* Top bar — close button at far right */}
        <div className="relative z-10 flex shrink-0 justify-end px-4 lg:px-6 pt-1 pb-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-10 w-10"
            onClick={() => onOpenChange(false)}
            aria-label="Close apply modal"
          >
            <FontAwesomeIcon
              name="circleXmark"
              className="text-2xl"
              weight="solid"
              aria-hidden
            />
          </Button>
        </div>
        {/* Floating header card — shadow only when content scrolls below it; hidden on success */}
        {!submitted && (
          <div className="relative z-10 flex shrink-0 justify-center px-4 lg:px-6 pb-0">
            <Card
              className={cn(
                "flex shrink-0 flex-col overflow-hidden rounded-xl border border-border w-full max-w-2xl transition-shadow",
                hasContentBelow && "shadow-md"
              )}
            >
              <CardHeader>
                <div className="flex items-start gap-4">
                  <div className="h-12 w-12 shrink-0 rounded-lg overflow-hidden bg-muted">
                    <img
                      src={logoSrc}
                      alt=""
                      className="h-full w-full object-contain"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <CardTitle className="text-lg">{job.title}</CardTitle>
                    <p className="text-sm text-muted-foreground mt-1">
                      {job.company} · {job.location}
                    </p>
                  </div>
                </div>
              </CardHeader>
            </Card>
          </div>
        )}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className={cn(
            "relative z-0 flex flex-1 flex-col min-h-0 overflow-y-auto pt-4 px-4 lg:pt-4 lg:px-6 pb-6 items-center",
            submitted && "justify-center"
          )}
        >
          {submitted ? (
            /* Application Submitted success screen — matches Figma sub-application flow */
            <div className="flex flex-col items-center gap-6 max-w-2xl w-full py-8">
              <Card
                className="w-[360px] rounded-xl border-2 border-chart-2 bg-chart-2/15"
                style={{ boxShadow: "var(--shadow-chart-accent-glow)" }}
              >
                <CardContent className="flex flex-col gap-3 p-4 md:p-6">
                  <span className="text-xs text-muted-foreground">{job.postedAt}</span>
                  <h3 className="text-lg font-bold text-foreground">{job.title}</h3>
                  <div className="flex items-center gap-2">
                    <div className="h-8 w-8 shrink-0 rounded overflow-hidden bg-muted">
                      <img src={logoSrc} alt="" className="h-full w-full object-contain" />
                    </div>
                    <span className="text-sm text-foreground">{job.company}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <FontAwesomeIcon name="mapPin" className="h-4 w-4 text-muted-foreground" weight="regular" aria-hidden />
                    <span className="text-sm text-foreground">{job.location}</span>
                  </div>
                  <JobCardTags job={job} />
                </CardContent>
              </Card>
              <div className="flex flex-col items-center gap-2 text-center">
                <h2 className="text-xl md:text-2xl font-bold text-foreground">Application Submitted!</h2>
                <p className="text-sm text-muted-foreground max-w-md">
                  Your Application For {job.title} At {job.company} Has Been Sent Successfully.
                </p>
              </div>
              <div className="flex flex-col gap-3 w-full max-w-sm">
                <Button variant="default" className="flex-1" onClick={handleViewMyJobs}>
                  View My Jobs
                </Button>
                <Button variant="outline" className="flex-1" onClick={handleExploreMoreJobs}>
                  Explore More Jobs
                </Button>
              </div>
            </div>
          ) : (
          /* Apply flow content — design system borders (border-border) */
          <div className="flex flex-col gap-6 max-w-2xl w-full">
            {/* Select Resume */}
            <Card className="rounded-xl border border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FontAwesomeIcon
                    name="filePdf"
                    className="h-4 w-4 text-muted-foreground"
                    weight="regular"
                  />
                  Select Resume
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Store up to 6 resumes with updated employment history and contact info. Resumes will not affect your Exxat One profile information.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                  {resumeCards.map((resume) => {
                    const isSelected = selectedResumeId === resume.id;
                    return (
                      <button
                        key={resume.id}
                        type="button"
                        onClick={() => setSelectedResumeId(resume.id)}
                        className={cn(
                          "relative flex flex-col p-4 rounded-xl border min-h-[100px] text-left transition-colors",
                          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
                          isSelected ? "bg-chart-2/15 border-chart-2 border-2" : "bg-card border-border"
                        )}
                      >
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <Badge
                            variant="outline"
                            className={cn(
                              "rounded-md px-2 py-0.5 text-xs font-medium shrink-0",
                              resume.type === "PDF" ? "border-chip-5 bg-chip-5/15 text-chip-5" : "border-chip-1 bg-chip-1/15 text-chip-1"
                            )}
                          >
                            {resume.type}
                          </Badge>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 shrink-0 -mr-1 -mt-1"
                            aria-label="Resume options"
                            onClick={(e: React.MouseEvent) => e.stopPropagation()}
                          >
                            <FontAwesomeIcon name="ellipsisVertical" className="h-4 w-4" weight="solid" aria-hidden />
                          </Button>
                        </div>
                        <p className="font-bold text-base text-foreground truncate">{resume.name}</p>
                        <p className="text-xs text-muted-foreground mt-1">Last used {resume.lastUsed}</p>
                        {isSelected && (
                          <div className="absolute bottom-3 right-3 flex h-6 w-6 items-center justify-center rounded-full bg-chart-2 text-primary-foreground shrink-0">
                            <FontAwesomeIcon name="check" className="h-3.5 w-3.5" weight="solid" aria-hidden />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
                <div>
                  <button
                    type="button"
                    className="text-sm text-primary underline font-medium hover:text-primary/80"
                    onClick={() => setProfileSettingsOpen(true)}
                  >
                    Add Resume
                  </button>
                  <p className="text-xs text-muted-foreground mt-1">(DOC, DOCX, PDF (2 MB))</p>
                </div>
              </CardContent>
            </Card>

            {/* Other Details */}
            <Card className="rounded-xl border border-border">
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <FontAwesomeIcon
                    name="clipboard"
                    className="h-4 w-4 text-muted-foreground"
                    weight="regular"
                  />
                  Other Details
                </CardTitle>
                <p className="text-sm text-muted-foreground mt-1">
                  Upload A Cover Letter Tailored To This Position. This Document Will Not Change Your Exxat One Profile Information.
                </p>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="apply-cover-letter" className="text-sm font-medium">
                    Add Cover Letter
                  </Label>
                  <RichTextEditor
                    id="apply-cover-letter"
                    placeholder="Write your cover letter tailored to this position. Introduce yourself and explain why you're a great fit..."
                    minHeight="160px"
                    value={coverLetter}
                    onChange={setCoverLetter}
                  />
                  <p className="text-xs text-muted-foreground">(DOC, DOCX, PDF (2 MB))</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="apply-visa-sponsorship" className="text-sm font-medium">
                    Will You Require Visa Sponsorship Now, Or In The Future?
                  </Label>
                  <input
                    id="apply-visa-sponsorship"
                    type="text"
                    placeholder='Type your response here in "Yes" or "No"'
                    className={cn(
                      "w-full rounded-lg border border-input bg-background px-3 py-2 text-sm",
                      "placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                    )}
                  />
                </div>
              </CardContent>
            </Card>

            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button
                variant="outline"
                className="flex-1 h-10"
                onClick={() => onOpenChange(false)}
              >
                Cancel
              </Button>
              <Button
                variant="default"
                className="flex-1 h-10 gap-2"
                onClick={() => {
                  addAppliedJob(job.id);
                  setSubmitted(true);
                }}
              >
                Submit Application
                <FontAwesomeIcon name="arrowRight" className="h-4 w-4" />
              </Button>
            </div>
          </div>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}
