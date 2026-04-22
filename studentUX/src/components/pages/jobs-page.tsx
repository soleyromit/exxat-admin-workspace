"use client";

import * as React from "react";
import { PageTabBar } from "../shared/page-tab-bar";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { JobSearchBar } from "../shared/job-search-bar";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { cn } from "../ui/utils";
import { useAppStore } from "../../stores/app-store";
import { useIsMobile } from "../ui/use-mobile";
import { JobCard } from "../shared/job-card";
import { OrganisationCard } from "../shared/organisation-card";
import { ProfilePromoCard } from "../shared/profile-promo-card";
import { HomeCareerSection } from "./home-career-section";
import { HomeCareerJourneySection } from "./home-career-journey-section";
import { MyJobsSection } from "./my-jobs-section";
import { recommendedJobs, recommendedOrganisations, getJobSearchSuggestions } from "../../data/jobs-data";
import {
  CAROUSEL_GAP,
  SCROLL_CAROUSEL_CLASSES,
  SCROLL_CAROUSEL_INNER_CLASSES,
  ScrollCarouselButtons,
} from "../shared/scroll-carousel";

const JOB_CARD_WIDTH_DESKTOP = 320;
const JOB_CARD_WIDTH_MOBILE = 280;
const PROFILE_PROMO_TITLE = "The more we know about you, the better jobs we can recommend";

const SUGGESTION_CHIPS = [
  { label: "Physical therapy Jobs", icon: "stethoscope" as const },
  { label: "Loan reimbursement", icon: "sackDollar" as const },
  { label: "Pediatric Outpatient Jobs", icon: "child" as const },
];

const IMG_JOB_CARD_BANNER = "/Illustration/Doctor-pana-p.svg";

function JobsBanner() {
  const isMobile = useIsMobile();
  const [dismissed, setDismissed] = React.useState(false);

  // Keep placeholder so hero section height stays stable after dismissal
  if (dismissed) return <div className="w-full" style={{ minHeight: 88 }} aria-hidden />;

  return (
    <div className="relative w-full overflow-hidden jobs-banner">
      {/* Illustration — bottom-left, decorative (desktop only) */}
      {!isMobile && (
        <img
          src={IMG_JOB_CARD_BANNER}
          alt=""
          aria-hidden
          className="absolute pointer-events-none"
          style={{
            bottom: -42,
            left: 12,
            height: 110,
            width: 170,
            transform: "rotate(1.81deg)",
            transformOrigin: "bottom center",
            zIndex: 0,
          }}
        />
      )}

      {/* Text + CTA — above image */}
      <div
        className="relative flex flex-row items-center h-full gap-3 px-5 py-4 pl-[22px] pr-[22px]"
        style={{ zIndex: 1 }}
      >
        <div className="jobs-banner-text flex flex-1 min-w-0 flex-col gap-0.5">
          <p className="font-semibold text-sm leading-snug text-foreground">
            We think you&apos;re unique, and we&apos;d love to get to know you better!
          </p>
          <p className="text-xs text-muted-foreground">
            Just 4 quick questions
          </p>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Button size="sm">
            Continue
          </Button>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/10"
                onClick={() => setDismissed(true)}
                aria-label="Dismiss banner"
              >
                <FontAwesomeIcon name="x" className="h-4 w-4" weight="regular" aria-hidden />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Dismiss banner</TooltipContent>
          </Tooltip>
        </div>
      </div>
    </div>
  );
}

const JOBS_TABS = [
  { id: "discover", label: "Discover", icon: "compass" as const },
  { id: "my-jobs", label: "My Jobs", icon: "listChecks" as const },
] as const;

export function JobsPage() {
  const jobsTab = useAppStore((s) => s.jobsTab);
  const setJobsTab = useAppStore((s) => s.setJobsTab);
  const jobSearchBarVariant = useAppStore((s) => s.jobSearchBarVariant);
  const navigateToJobDetail = useAppStore((s) => s.navigateToJobDetail);
  const navigateToJobListFull = useAppStore((s) => s.navigateToJobListFull);
  const activeTab = jobsTab;
  const setActiveTab = setJobsTab;
  const isMobile = useIsMobile();
  const scrollRef = React.useRef<HTMLDivElement>(null);
  const scrollRef2 = React.useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = React.useState(false);
  const [canScrollRight, setCanScrollRight] = React.useState(true);
  const [canScrollLeft2, setCanScrollLeft2] = React.useState(false);
  const [canScrollRight2, setCanScrollRight2] = React.useState(true);

  const row1Jobs = recommendedJobs.slice(0, 5);
  const row2Jobs = recommendedJobs.slice(5, 10);

  const orgCardWidth = isMobile ? 260 : 280;
  const orgScrollRef = React.useRef<HTMLDivElement>(null);
  const [canScrollOrgLeft, setCanScrollOrgLeft] = React.useState(false);
  const [canScrollOrgRight, setCanScrollOrgRight] = React.useState(true);
  const [viewAllOrgs, setViewAllOrgs] = React.useState(false);
  const [openJobsPopover, setOpenJobsPopover] = React.useState(false);
  const [openOrgsPopover, setOpenOrgsPopover] = React.useState(false);
  const [searchQuery, setSearchQuery] = React.useState("");
  const [searchLocation, setSearchLocation] = React.useState("");

  const cardWidth = isMobile ? JOB_CARD_WIDTH_MOBILE : JOB_CARD_WIDTH_DESKTOP;
  const scrollAmount = cardWidth + CAROUSEL_GAP;

  const isSyncingRef = React.useRef(false);

  const updateScrollButtons = () => {
    const el = scrollRef.current;
    if (el) {
      setCanScrollLeft(el.scrollLeft > 4);
      setCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
  };

  const updateScrollButtons2 = () => {
    const el = scrollRef2.current;
    if (el) {
      setCanScrollLeft2(el.scrollLeft > 4);
      setCanScrollRight2(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
  };

  const handleScroll1 = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const el1 = scrollRef.current;
    const el2 = scrollRef2.current;
    if (el1 && el2) {
      el2.scrollLeft = el1.scrollLeft;
    }
    updateScrollButtons();
    updateScrollButtons2();
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  };

  const handleScroll2 = () => {
    if (isSyncingRef.current) return;
    isSyncingRef.current = true;
    const el1 = scrollRef.current;
    const el2 = scrollRef2.current;
    if (el1 && el2) {
      el1.scrollLeft = el2.scrollLeft;
    }
    updateScrollButtons();
    updateScrollButtons2();
    requestAnimationFrame(() => { isSyncingRef.current = false; });
  };

  const updateOrgScrollButtons = () => {
    const el = orgScrollRef.current;
    if (el) {
      setCanScrollOrgLeft(el.scrollLeft > 4);
      setCanScrollOrgRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
    }
  };

  React.useEffect(() => {
    updateScrollButtons();
    updateScrollButtons2();
    updateOrgScrollButtons();
  }, []);

  return (
    <div className="jobs-page min-w-0 min-h-0 bg-background text-foreground flex flex-1 flex-col relative">
      <PageTabBar
        items={JOBS_TABS}
        value={activeTab}
        onValueChange={(v) => setActiveTab(v as "discover" | "my-jobs")}
      />
      <div className="content-rail @container/main flex flex-1 flex-col gap-12 w-full p-4 lg:p-6">
        {activeTab === "my-jobs" ? (
          <div className="flex flex-col gap-12">
            <h1 className="page-title text-left pt-0">My Jobs</h1>
            <MyJobsSection />
          </div>
        ) : (
        <div className="flex flex-col gap-0">
          {/* Hero section — heading, search, filter chips, banner, decorative illustration (behind) */}
          <section className="relative flex flex-col gap-0 h-[200px] min-h-0 shrink-0 overflow-visible" aria-label="Hero">
            {/* Illustration — absolutely behind all content, intentionally full viewport width */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                width: "100vw",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundImage: "url(/Illustration/job_discover_bg.svg)",
                backgroundRepeat: "no-repeat",
                backgroundPosition: "bottom center",
                backgroundSize: "100% auto",
                zIndex: 0,
              }}
              aria-hidden
            />
            <header className="relative z-10 pt-0 pb-0 flex flex-col items-center gap-4 w-full max-w-2xl mx-auto">
              <h1 className="page-title text-center pt-0">
                Discover your next healthcare opportunity
              </h1>

              {/* Search bar — reusable across discover and job detail */}
              <JobSearchBar
                searchQuery={searchQuery}
                onSearchQueryChange={setSearchQuery}
                searchLocation={searchLocation}
                onSearchLocationChange={setSearchLocation}
                className="w-full"
                placeholderVariant={jobSearchBarVariant}
                suggestionGroups={getJobSearchSuggestions()}
              />

            </header>

            {/* Suggestion chips */}
            <div className="relative z-10 flex flex-wrap justify-center gap-2 w-full max-w-4xl mx-auto mt-2">
              {SUGGESTION_CHIPS.map(({ label, icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() => setSearchQuery(searchQuery === label ? "" : label)}
                  className={cn(
                    "inline-flex shrink-0 items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors whitespace-nowrap",
                    searchQuery === label
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-background text-muted-foreground border-border hover:border-primary/40 hover:text-foreground hover:bg-muted"
                  )}
                >
                  <FontAwesomeIcon name={icon} className="h-3 w-3 shrink-0" aria-hidden />
                  {label}
                </button>
              ))}
            </div>

            {/* Banner — profile promo, below chips */}
            <div className="relative z-10 flex justify-center w-full max-w-2xl mx-auto mt-4">
              <JobsBanner />
            </div>

          </section>

          {/* Content sections — Recommended Jobs, Organisations, etc. */}
          <div className="home-sections-gap flex flex-col">
            {/* Recommended Jobs section */}
            <section className="flex flex-col gap-4" aria-label="Recommended jobs">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base md:text-lg font-bold">Recommended Jobs for you</h3>
                      <Popover open={openJobsPopover} onOpenChange={setOpenJobsPopover}>
                        <PopoverTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:size-8 shrink-0 text-muted-foreground hover:text-foreground touch-manipulation"
                                aria-label="Learn more about recommended jobs"
                              >
                                <FontAwesomeIcon name="circleQuestion" className="h-4 w-4" weight="regular" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Learn more about recommended jobs</TooltipContent>
                          </Tooltip>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] p-4" align="start" side="bottom">
                          <div className="relative">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:size-8 -m-1 text-muted-foreground hover:text-foreground touch-manipulation"
                                  aria-label="Close"
                                  onClick={() => setOpenJobsPopover(false)}
                                >
                                  <FontAwesomeIcon name="x" className="h-4 w-4" weight="regular" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Close</TooltipContent>
                            </Tooltip>
                            <p className="text-sm text-foreground pr-6">
                              We use your profile, specialty, and preferences to surface roles that match your career goals. &quot;Great Fit&quot; and &quot;Good Fit&quot; badges indicate how well each job aligns with your profile.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm md:text-base">
                      Jobs based on your profile and preferences
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMobile && (
                      <ScrollCarouselButtons
                        canScrollLeft={canScrollLeft || canScrollLeft2}
                        canScrollRight={canScrollRight || canScrollRight2}
                        onScrollLeft={() => {
                          scrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                          scrollRef2.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" });
                        }}
                        onScrollRight={() => {
                          scrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
                          scrollRef2.current?.scrollBy({ left: scrollAmount, behavior: "smooth" });
                        }}
                        isMobile={isMobile}
                      />
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:py-0 shrink-0 py-3 px-4 text-primary font-medium touch-manipulation"
                      onClick={() => {
                        navigateToJobListFull();
                        if (!isMobile && recommendedJobs.length > 0) {
                          navigateToJobDetail(recommendedJobs[0].id, {
                          fromJobList: true,
                        });
                        }
                      }}
                    >
                      View all
                    </Button>
                  </div>
                </div>
                <div
                  className="flex flex-col gap-6 md:gap-8"
                  style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}
                >
                  {/* Row 1 — aligns with section title, extends to right edge */}
                  <div
                    ref={scrollRef}
                    className={SCROLL_CAROUSEL_CLASSES}
                    onScroll={handleScroll1}
                  >
                      <div
                        className={SCROLL_CAROUSEL_INNER_CLASSES}
                        style={{ gap: CAROUSEL_GAP }}
                      >
                        {row1Jobs.map((job) => (
                          <div
                            key={job.id}
                            className="snap-start shrink-0 flex flex-col"
                            style={{
                              width: cardWidth,
                              minWidth: cardWidth,
                            }}
                          >
                            <JobCard
                              job={job}
                              className="flex-1 min-w-0 h-full"
                              onClick={() => navigateToJobDetail(job.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  {/* Row 2 */}
                  <div
                    ref={scrollRef2}
                    className={SCROLL_CAROUSEL_CLASSES}
                    onScroll={handleScroll2}
                  >
                      <div
                        className={SCROLL_CAROUSEL_INNER_CLASSES}
                        style={{ gap: CAROUSEL_GAP }}
                      >
                        {row2Jobs.slice(0, 2).map((job) => (
                          <div
                            key={job.id}
                            className="snap-start shrink-0 flex flex-col"
                            style={{
                              width: cardWidth,
                              minWidth: cardWidth,
                            }}
                          >
                            <JobCard
                              job={job}
                              className="flex-1 min-w-0 h-full"
                              onClick={() => navigateToJobDetail(job.id)}
                            />
                          </div>
                        ))}
                        <div
                          className="snap-start shrink-0 flex flex-col"
                          style={{ width: cardWidth, minWidth: cardWidth }}
                        >
                          <ProfilePromoCard
                            title={PROFILE_PROMO_TITLE}
                            onClick={() => useAppStore.getState().navigateToPage("Settings")}
                            className="flex-1 min-h-0"
                          />
                        </div>
                        {row2Jobs.slice(2).map((job) => (
                          <div
                            key={job.id}
                            className="snap-start shrink-0 flex flex-col"
                            style={{
                              width: cardWidth,
                              minWidth: cardWidth,
                            }}
                          >
                            <JobCard
                              job={job}
                              className="flex-1 min-w-0 h-full"
                              onClick={() => navigateToJobDetail(job.id)}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
            </section>

            {/* Organisations we think you'll love */}
            <section className="flex flex-col gap-4" aria-label="Organisations">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base md:text-lg font-bold">Organisations we think you&apos;ll love</h3>
                      <Popover open={openOrgsPopover} onOpenChange={setOpenOrgsPopover}>
                        <PopoverTrigger asChild>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:size-8 shrink-0 text-muted-foreground hover:text-foreground touch-manipulation"
                                aria-label="Learn more about organisations"
                              >
                                <FontAwesomeIcon name="circleQuestion" className="h-4 w-4" weight="regular" />
                              </Button>
                            </TooltipTrigger>
                            <TooltipContent side="bottom">Learn more about organisations</TooltipContent>
                          </Tooltip>
                        </PopoverTrigger>
                        <PopoverContent className="w-72 max-w-[calc(100vw-2rem)] p-4" align="start" side="bottom">
                          <div className="relative">
                            <Tooltip>
                              <TooltipTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute right-0 top-0 min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:size-8 -m-1 text-muted-foreground hover:text-foreground touch-manipulation"
                                  aria-label="Close"
                                  onClick={() => setOpenOrgsPopover(false)}
                                >
                                  <FontAwesomeIcon name="x" className="h-4 w-4" weight="regular" />
                                </Button>
                              </TooltipTrigger>
                              <TooltipContent side="bottom">Close</TooltipContent>
                            </Tooltip>
                            <p className="text-sm text-foreground pr-6">
                              These healthcare employers have active openings and match your experience level. Save organisations to quickly find their jobs later. &quot;Ongoing&quot; means they regularly hire; &quot;Worked here&quot; indicates you have prior experience with them.
                            </p>
                          </div>
                        </PopoverContent>
                      </Popover>
                    </div>
                    <p className="text-muted-foreground mt-0.5 text-sm md:text-base">
                      Top healthcare employers with roles matching your profile
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {!isMobile && !viewAllOrgs && (
                      <ScrollCarouselButtons
                        canScrollLeft={canScrollOrgLeft}
                        canScrollRight={canScrollOrgRight}
                        onScrollLeft={() => {
                          orgScrollRef.current?.scrollBy({
                            left: -(orgCardWidth + CAROUSEL_GAP),
                            behavior: "smooth",
                          });
                        }}
                        onScrollRight={() => {
                          orgScrollRef.current?.scrollBy({
                            left: orgCardWidth + CAROUSEL_GAP,
                            behavior: "smooth",
                          });
                        }}
                        isMobile={isMobile}
                      />
                    )}
                    <Button
                      variant="link"
                      size="sm"
                      className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:py-0 shrink-0 py-3 px-4 text-primary font-medium touch-manipulation"
                      onClick={() => setViewAllOrgs((v) => !v)}
                    >
                      {viewAllOrgs ? "Show less" : "View all"}
                    </Button>
                  </div>
                </div>
                {viewAllOrgs ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 items-stretch">
                    {recommendedOrganisations.map((org) => (
                      <div key={org.id} className="h-full">
                        <OrganisationCard organisation={org} className="h-full" />
                      </div>
                    ))}
                  </div>
                ) : (
                  <div
                    className=""
                    style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}
                  >
                    <div
                      ref={orgScrollRef}
                      className={SCROLL_CAROUSEL_CLASSES}
                      onScroll={updateOrgScrollButtons}
                    >
                        <div
                          className={SCROLL_CAROUSEL_INNER_CLASSES}
                          style={{ gap: CAROUSEL_GAP }}
                        >
                          {recommendedOrganisations.map((org) => (
                            <div
                              key={org.id}
                              className="snap-start shrink-0 flex flex-col"
                              style={{
                                width: orgCardWidth,
                                minWidth: orgCardWidth,
                              }}
                            >
                              <OrganisationCard organisation={org} className="flex-1 min-w-0 h-full" />
                            </div>
                          ))}
                        </div>
                      </div>
                  </div>
                )}
            </section>

            {/* Let's talk career */}
            <HomeCareerSection />

            {/* Career journey statement — compact spacing */}
            <HomeCareerJourneySection compact />
          </div>
        </div>
        )}
      </div>
    </div>
  );
}

