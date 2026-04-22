"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { useAppStore } from "../../stores/app-store";
import { JobCard } from "../shared/job-card";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { JobsListModal } from "../features/jobs-list-modal";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import {
  CAROUSEL_GAP,
  SCROLL_CAROUSEL_CLASSES,
  SCROLL_CAROUSEL_INNER_CLASSES,
  ScrollCarouselButtons,
} from "../shared/scroll-carousel";
import { useIsMobile } from "../ui/use-mobile";
import {
  draftApplications,
  appliedJobs,
  recommendedJobs,
  type DraftApplication,
  type AppliedJob,
  type JobListing,
} from "../../data/jobs-data";

const JOB_CARD_WIDTH_DESKTOP = 320;
const JOB_CARD_WIDTH_MOBILE = 280;

const MY_JOBS_SUB_TABS = [
  { id: "draft", label: "Draft" },
  { id: "saved", label: "Saved by You" },
  { id: "applied", label: "Recently Applied" },
] as const;

function draftToJobListing(draft: DraftApplication): JobListing {
  const fullJob = recommendedJobs.find((j) => j.id === draft.jobId);
  return {
    id: draft.jobId,
    title: draft.title,
    company: draft.company,
    companyLogo: draft.companyLogo,
    location: draft.location,
    postedAt: draft.savedAt,
    matchScore: fullJob?.matchScore ?? null,
    salary: fullJob?.salary,
    specialty: fullJob?.specialty,
    isSaved: true,
  };
}

function SavedJobCard({ job }: { job: (typeof recommendedJobs)[0] }) {
  const navigateToJobDetail = useAppStore((s) => s.navigateToJobDetail);
  return (
    <JobCard
      job={job}
      onClick={() => navigateToJobDetail(job.id)}
      className="rounded-2xl border border-border"
    />
  );
}

function appliedToJobListing(item: AppliedJob): JobListing {
  return {
    id: item.jobId ?? item.id,
    title: item.title,
    company: item.company,
    location: item.location,
    postedAt: item.appliedAt,
  };
}

function SectionEmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="default">
          <FontAwesomeIcon name={icon} className="h-12 w-12 text-muted-foreground" weight="regular" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

const EMPTY_ILLUSTRATION_JOB = "/Illustration/Job-2.webp";

function PageEmptyState() {
  const navigateToDiscover = useAppStore((s) => s.navigateToPage);
  return (
    <Empty className="h-full min-h-[360px] py-16">
      <EmptyHeader className="gap-4">
        <EmptyMedia variant="illustration">
          <img
            src={EMPTY_ILLUSTRATION_JOB}
            alt=""
            aria-hidden
            className="w-full h-auto object-contain"
          />
        </EmptyMedia>
        <EmptyTitle size="large">Your job journey starts here</EmptyTitle>
        <EmptyDescription className="max-w-md">
          Explore jobs, save the ones that interest you, and come back to track your applications. Let&apos;s find your next opportunity.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button size="default" onClick={() => navigateToDiscover("Jobs", { jobsTab: "discover" })}>
          Browse jobs
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export function MyJobsSection() {
  const [activeSubTab, setActiveSubTab] = React.useState<"draft" | "saved" | "applied">("draft");
  const [savedModalOpen, setSavedModalOpen] = React.useState(false);
  const [appliedModalOpen, setAppliedModalOpen] = React.useState(false);
  const navigateToJobDetail = useAppStore((s) => s.navigateToJobDetail);
  const navigateToDiscover = useAppStore((s) => s.navigateToPage);
  const myJobsEmptyState = useAppStore((s) => s.myJobsEmptyState);
  const appliedJobIds = useAppStore((s) => s.appliedJobIds);
  const savedJobs = recommendedJobs.filter((j) => j.isSaved);

  const mergedAppliedJobs = React.useMemo((): AppliedJob[] => {
    const fromStore: AppliedJob[] = appliedJobIds
      .map((jobId) => {
        const job = recommendedJobs.find((j) => j.id === jobId);
        if (!job) return null;
        return {
          id: `applied-${jobId}`,
          jobId,
          title: job.title,
          company: job.company,
          location: job.location,
          appliedAt: "Just now",
          status: "Application Submitted" as const,
        };
      })
      .filter((a): a is AppliedJob => a != null);
    return [...fromStore, ...appliedJobs];
  }, [appliedJobIds]);
  const isMobile = useIsMobile();
  const cardWidth = isMobile ? JOB_CARD_WIDTH_MOBILE : JOB_CARD_WIDTH_DESKTOP;
  const scrollAmount = cardWidth + CAROUSEL_GAP;

  const draftScrollRef = React.useRef<HTMLDivElement>(null);
  const savedScrollRef = React.useRef<HTMLDivElement>(null);
  const appliedScrollRef = React.useRef<HTMLDivElement>(null);
  const [draftCanScrollLeft, setDraftCanScrollLeft] = React.useState(false);
  const [draftCanScrollRight, setDraftCanScrollRight] = React.useState(true);
  const [savedCanScrollLeft, setSavedCanScrollLeft] = React.useState(false);
  const [savedCanScrollRight, setSavedCanScrollRight] = React.useState(true);
  const [appliedCanScrollLeft, setAppliedCanScrollLeft] = React.useState(false);
  const [appliedCanScrollRight, setAppliedCanScrollRight] = React.useState(true);

  const updateDraftScroll = React.useCallback(() => {
    const el = draftScrollRef.current;
    if (!el) return;
    setDraftCanScrollLeft(el.scrollLeft > 4);
    setDraftCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  const updateSavedScroll = React.useCallback(() => {
    const el = savedScrollRef.current;
    if (!el) return;
    setSavedCanScrollLeft(el.scrollLeft > 4);
    setSavedCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);
  const updateAppliedScroll = React.useCallback(() => {
    const el = appliedScrollRef.current;
    if (!el) return;
    setAppliedCanScrollLeft(el.scrollLeft > 4);
    setAppliedCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateDraftScroll();
    updateSavedScroll();
    updateAppliedScroll();
  }, [updateDraftScroll, updateSavedScroll, updateAppliedScroll, savedJobs.length, mergedAppliedJobs.length, draftApplications.length]);

  const draftRef = React.useRef<HTMLDivElement>(null);
  const savedRef = React.useRef<HTMLDivElement>(null);
  const appliedRef = React.useRef<HTMLDivElement>(null);
  const sectionRefs = { draft: draftRef, saved: savedRef, applied: appliedRef } as const;

  const handleTabChange = React.useCallback((value: string) => {
    const tab = value as "draft" | "saved" | "applied";
    setActiveSubTab(tab);
    sectionRefs[tab].current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  React.useEffect(() => {
    const refs = [draftRef, savedRef, appliedRef] as const;
    const ids = ["draft", "saved", "applied"] as const;

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        const index = refs.findIndex((r) => r.current === topmost.target);
        if (index >= 0) setActiveSubTab(ids[index]);
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0 }
    );

    refs.forEach((ref) => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, []);

  const showPageEmpty = myJobsEmptyState === "page";

  const draftEmpty = myJobsEmptyState === "page" || myJobsEmptyState === "section" || draftApplications.length === 0;
  const savedEmpty = myJobsEmptyState === "page" || myJobsEmptyState === "section" || savedJobs.length === 0;
  const appliedEmpty = myJobsEmptyState === "page" || myJobsEmptyState === "section" || mergedAppliedJobs.length === 0;

  return (
    <div className="flex flex-col w-full">
      <Tabs value={activeSubTab} onValueChange={handleTabChange}>
        <div className="sticky top-0 z-10 bg-background pt-1 -mt-1">
          <TabsList
            variant="underline"
            className="w-full justify-start"
            aria-label="Job categories"
          >
            {MY_JOBS_SUB_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {showPageEmpty ? (
          <div className="mt-6 flex flex-col w-full flex-1 min-h-0">
            <PageEmptyState />
          </div>
        ) : (
        <div className="mt-6 flex flex-col w-full gap-12">
          <section ref={draftRef} id="my-jobs-draft" className="scroll-mt-20" aria-labelledby="my-jobs-draft-heading">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 id="my-jobs-draft-heading" className="text-base md:text-lg font-bold">Draft</h3>
                  <p className="text-muted-foreground mt-0.5 text-sm md:text-base">Applications saved as drafts</p>
                </div>
                {!isMobile && !draftEmpty && (
                  <ScrollCarouselButtons
                    canScrollLeft={draftCanScrollLeft}
                    canScrollRight={draftCanScrollRight}
                    onScrollLeft={() => draftScrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" })}
                    onScrollRight={() => draftScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" })}
                    isMobile={isMobile}
                  />
                )}
              </div>
              {draftEmpty ? (
                <SectionEmptyState
                  icon="edit"
                  title="Your drafts will appear here"
                  description="Save an application as a draft to finish it later—your progress will be waiting for you."
                />
              ) : (
                <div className="" style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}>
                  <div
                    ref={draftScrollRef}
                    className={SCROLL_CAROUSEL_CLASSES}
                    onScroll={updateDraftScroll}
                  >
                    <div className={SCROLL_CAROUSEL_INNER_CLASSES} style={{ gap: CAROUSEL_GAP }}>
                      {draftApplications.map((draft) => (
                        <div key={draft.id} className="snap-start shrink-0 flex flex-col" style={{ width: cardWidth, minWidth: cardWidth }}>
                          <JobCard
                            job={draftToJobListing(draft)}
                            headerChip={{
                              icon: "edit",
                              label: "Draft",
                              className: "bg-chip-filled-1 border-transparent text-chip-1",
                            }}
                            className="rounded-2xl border border-border flex-1 min-w-0 h-full"
                            onClick={() => navigateToJobDetail(draft.jobId)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section ref={savedRef} id="my-jobs-saved" className="scroll-mt-20" aria-labelledby="my-jobs-saved-heading">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 id="my-jobs-saved-heading" className="text-base md:text-lg font-bold">Saved by You</h3>
                  <p className="text-muted-foreground mt-0.5 text-sm md:text-base">Applications saved by you</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isMobile && !savedEmpty && (
                    <ScrollCarouselButtons
                      canScrollLeft={savedCanScrollLeft}
                      canScrollRight={savedCanScrollRight}
                      onScrollLeft={() => savedScrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" })}
                      onScrollRight={() => savedScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" })}
                      isMobile={isMobile}
                    />
                  )}
                  {!savedEmpty && (
                    <Button
                      variant="link"
                      size="sm"
                      className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:py-0 shrink-0 py-3 px-4 text-primary font-medium touch-manipulation"
                      onClick={() => setSavedModalOpen(true)}
                      aria-label="View all saved jobs"
                    >
                      View all
                    </Button>
                  )}
                </div>
              </div>
              {savedEmpty ? (
                <SectionEmptyState
                  icon="bookmark"
                  title="Your saved jobs will show up here"
                  description="Bookmark a job you like and it&apos;ll appear here so you can find it easily."
                />
              ) : (
                <div className="" style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}>
                  <div
                    ref={savedScrollRef}
                    className={SCROLL_CAROUSEL_CLASSES}
                    onScroll={updateSavedScroll}
                  >
                    <div className={SCROLL_CAROUSEL_INNER_CLASSES} style={{ gap: CAROUSEL_GAP }}>
                      {savedJobs.map((job) => (
                        <div key={job.id} className="snap-start shrink-0 flex flex-col" style={{ width: cardWidth, minWidth: cardWidth }}>
                          <SavedJobCard job={job} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>

          <section ref={appliedRef} id="my-jobs-applied" className="scroll-mt-20" aria-labelledby="my-jobs-applied-heading">
            <div className="flex flex-col gap-4">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 id="my-jobs-applied-heading" className="text-base md:text-lg font-bold">Recently Applied</h3>
                  <p className="text-muted-foreground mt-0.5 text-sm md:text-base">Jobs you&apos;ve applied to</p>
                </div>
                <div className="flex items-center gap-2">
                  {!isMobile && !appliedEmpty && (
                    <ScrollCarouselButtons
                      canScrollLeft={appliedCanScrollLeft}
                      canScrollRight={appliedCanScrollRight}
                      onScrollLeft={() => appliedScrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" })}
                      onScrollRight={() => appliedScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" })}
                      isMobile={isMobile}
                    />
                  )}
                  {!appliedEmpty && (
                    <Button
                      variant="link"
                      size="sm"
                      className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:py-0 shrink-0 py-3 px-4 text-primary font-medium touch-manipulation"
                      onClick={() => setAppliedModalOpen(true)}
                      aria-label="View all applied jobs"
                    >
                      View all
                    </Button>
                  )}
                </div>
              </div>
              {appliedEmpty ? (
                <SectionEmptyState
                  icon="fileText"
                  title="Your applications will appear here"
                  description="Once you apply, you&apos;ll see your applications here with their status."
                />
              ) : (
                <div className="" style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}>
                  <div
                    ref={appliedScrollRef}
                    className={SCROLL_CAROUSEL_CLASSES}
                    onScroll={updateAppliedScroll}
                  >
                    <div className={SCROLL_CAROUSEL_INNER_CLASSES} style={{ gap: CAROUSEL_GAP }}>
                      {mergedAppliedJobs.map((item) => (
                        <div key={item.id} className="snap-start shrink-0 flex flex-col" style={{ width: cardWidth, minWidth: cardWidth }}>
                          <JobCard
                            job={appliedToJobListing(item)}
                            headerChip={{
                              icon: item.status === "Application Submitted" ? "check" : "eye",
                              label: item.status === "Application Submitted" ? "Submitted" : "Viewed",
                              className:
                                item.status === "Application Submitted"
                                  ? "bg-chip-filled-4 border-transparent text-chip-4"
                                  : "bg-muted border-transparent text-muted-foreground",
                            }}
                            headerChipReplacesSave
                            className="rounded-2xl border border-border flex-1 min-w-0 h-full"
                            aria-label={`View application: ${item.title} at ${item.company}, status: ${item.status === "Application Submitted" ? "Submitted" : "Viewed"}`}
                            onClick={() => navigateToJobDetail(item.jobId ?? item.id)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
        )}
      </Tabs>

      <JobsListModal
        open={savedModalOpen}
        onOpenChange={setSavedModalOpen}
        title="Saved by You"
        jobs={savedJobs}
        onJobClick={(id) => {
          setSavedModalOpen(false);
          navigateToJobDetail(id);
        }}
      />

      <JobsListModal
        open={appliedModalOpen}
        onOpenChange={setAppliedModalOpen}
        title="Recently Applied"
        jobs={mergedAppliedJobs.map(appliedToJobListing)}
        renderJobCard={(job) => {
          const applied = mergedAppliedJobs.find((a) => (a.jobId ?? a.id) === job.id);
          return (
            <JobCard
              key={job.id}
              job={job}
              headerChip={{
                icon: applied?.status === "Application Submitted" ? "check" : "eye",
                label: applied?.status === "Application Submitted" ? "Submitted" : "Viewed",
                className:
                  applied?.status === "Application Submitted"
                    ? "bg-chip-filled-4 border-transparent text-chip-4"
                    : "bg-muted border-transparent text-muted-foreground",
              }}
              headerChipReplacesSave
              className="rounded-2xl border border-border"
              aria-label={`View application: ${job.title} at ${job.company}, status: ${applied?.status === "Application Submitted" ? "Submitted" : "Viewed"}`}
              onClick={() => {
                setAppliedModalOpen(false);
                navigateToJobDetail(job.id);
              }}
            />
          );
        }}
      />
    </div>
  );
}
