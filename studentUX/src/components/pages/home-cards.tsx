"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { cn } from "../ui/utils";
import { sidebarData } from "../layout/sidebar-data";
import { useProfileStore } from "../../stores/profile-store";
import { useAppStore } from "../../stores/app-store";
import { useIsMobile } from "../ui/use-mobile";
import { ProductCard } from "../shared/product-card";
import volunteershipImg from "../../assets/volunteership.svg";
import internshipImg from "../../assets/internship.svg";
import jobImg from "../../assets/job.svg";

const IMG_VOLUNTEERSHIP_DEFAULT = volunteershipImg;
const IMG_INTERNSHIPS_DEFAULT = internshipImg;
const IMG_JOBS_DEFAULT = jobImg;

const IMG_VOLUNTEERSHIP_WEBP = "/Illustration/Volunteership-2.webp";
const IMG_INTERNSHIPS_WEBP = "/Illustration/Internship-2.webp";
const IMG_JOBS_WEBP = "/Illustration/Job-2.webp";

const IMG_VOLUNTEERSHIP_1ST_TIME = "/Illustration/1st-time/Volunteership-2.svg";
const IMG_INTERNSHIPS_1ST_TIME = "/Illustration/1st-time/Internship-2.svg";
const IMG_JOBS_1ST_TIME = "/Illustration/1st-time/Job-2.svg";

const PROFILE_COMPLETION_HINT = "Updated and complete info gets matched to 20x more relevant job opportunities.";

function ProfileCardContent({ compact }: { compact?: boolean }) {
  const setProfileSettingsOpen = useAppStore((s) => s.setProfileSettingsOpen);
  const schoolName = useProfileStore((s) => s.profile.education[0]?.school ?? "—");

  if (compact) {
    return (
      <div className="relative flex flex-col gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); setProfileSettingsOpen(true); }}
              className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              aria-label="Edit profile"
            >
              <FontAwesomeIcon name="edit" className="h-4 w-4" aria-hidden="true" />
            </button>
          </TooltipTrigger>
          <TooltipContent side="bottom">Edit profile</TooltipContent>
        </Tooltip>
        <div className="flex items-start gap-4">
          <Avatar className="h-10 w-10 shrink-0 rounded-full">
            <AvatarImage src={sidebarData.user.avatar} alt={sidebarData.user.name} />
            <AvatarFallback>
              {sidebarData.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <div className="flex min-w-0 flex-1 flex-col gap-0.5">
            <h3 className="font-bold capitalize text-foreground truncate text-sm">{sidebarData.user.name}</h3>
            <div className="text-muted-foreground text-xs">Nursing</div>
            <div className="text-muted-foreground text-xs truncate">{schoolName}</div>
          </div>
        </div>
        <div className="flex flex-col gap-1.5">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-foreground">Your progress</span>
            <Badge variant="secondary" className="rounded-full bg-chart-4/20 text-chip-4 border-chip-4/40 shrink-0">
              Incomplete
            </Badge>
          </div>
          <div className="flex items-center gap-2">
            <Progress value={5} variant="auto" className="h-1.5 flex-1" />
            <span className="text-xs font-medium tabular-nums shrink-0">5%</span>
          </div>
        </div>
        <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
          <FontAwesomeIcon name="starChristmas" className="h-4 w-4 text-primary shrink-0 mt-0.5" weight="solid" />
          <p className="text-xs text-foreground">{PROFILE_COMPLETION_HINT}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex flex-col gap-3 overflow-y-auto">
      <Tooltip>
        <TooltipTrigger asChild>
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); setProfileSettingsOpen(true); }}
            className="absolute right-0 top-0 flex h-8 w-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            aria-label="Edit profile"
          >
            <FontAwesomeIcon name="edit" className="h-4 w-4" aria-hidden="true" />
          </button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Edit profile</TooltipContent>
      </Tooltip>
      <div className="flex items-start gap-4">
        <Avatar className="h-16 w-16 shrink-0 rounded-full">
          <AvatarImage src={sidebarData.user.avatar} alt={sidebarData.user.name} />
          <AvatarFallback>
            {sidebarData.user.name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase()}
          </AvatarFallback>
        </Avatar>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5">
          <h3 className="font-bold capitalize text-foreground truncate text-xl">{sidebarData.user.name}</h3>
          <div className="text-muted-foreground text-xs">Nursing</div>
          <div className="text-muted-foreground text-xs truncate">{schoolName}</div>
        </div>
      </div>
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">Your progress</span>
          <Badge variant="secondary" className="rounded-full bg-chart-4/20 text-chip-4 border-chip-4/40 shrink-0">
            Incomplete
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Progress value={5} variant="auto" className="h-2 flex-1" />
          <span className="text-xs font-medium tabular-nums shrink-0">5%</span>
        </div>
      </div>
      <div className="flex items-start gap-2 rounded-lg border border-primary/20 bg-primary/5 p-3">
        <FontAwesomeIcon name="starChristmas" className="h-4 w-4 text-primary shrink-0 mt-0.5" weight="solid" />
        <p className="text-xs text-foreground">{PROFILE_COMPLETION_HINT}</p>
      </div>
    </div>
  );
}

const comingSoonBadge = (
  <Badge
    variant="default"
    className="absolute right-2 top-2 md:right-3 md:top-3 rounded-full bg-chart-1 text-primary-foreground border-transparent z-10 text-xs px-2 py-0 md:px-2.5 md:py-0.5"
  >
    Coming Soon
  </Badge>
);

export function HomeCards() {
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const isMobile = useIsMobile();
  const illustrationSet = useAppStore((s) => s.homeCardIllustrationSet);

  /** Hero uses default images; others use their respective sets */
  const imgSet = illustrationSet === "hero" ? "default" : illustrationSet;
  const IMG_VOLUNTEERSHIP =
    imgSet === "webp" ? IMG_VOLUNTEERSHIP_WEBP
    : imgSet === "1st-time" ? IMG_VOLUNTEERSHIP_1ST_TIME
    : IMG_VOLUNTEERSHIP_DEFAULT;
  const IMG_INTERNSHIPS =
    imgSet === "webp" ? IMG_INTERNSHIPS_WEBP
    : imgSet === "1st-time" ? IMG_INTERNSHIPS_1ST_TIME
    : IMG_INTERNSHIPS_DEFAULT;
  const IMG_JOBS =
    imgSet === "webp" ? IMG_JOBS_WEBP
    : imgSet === "1st-time" ? IMG_JOBS_1ST_TIME
    : IMG_JOBS_DEFAULT;

  /** Scale illustrations: webp/default = smaller via inline style to avoid head cropping */
  const scaledImageClass =
    imgSet === "webp" ? "object-contain"
    : imgSet === "1st-time" ? "object-contain object-center"
    : imgSet === "default" ? "object-contain"
    : undefined;
  const illustrationImageStyle =
    imgSet === "webp"
      ? { transform: isMobile ? "scale(0.75)" : "scale(0.6)", transformOrigin: "center top" }
      : imgSet === "default"
      ? { transform: isMobile ? "scale(0.9)" : "scale(0.85)", transformOrigin: "center top" }
      : undefined;
  const imageStyle1stTime =
    imgSet === "1st-time"
      ? { width: "150%", height: "150%", left: "50%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-50%, -50%)" }
      : undefined;
  /** Default SVG: larger Volunteership illustration */
  const volunteershipImageStyle =
    imgSet === "default"
      ? { width: "130%", height: "130%", left: "50%", top: "50%", right: "auto", bottom: "auto", transform: "translate(-50%, -50%)" }
      : imageStyle1stTime;

  const cardBase = cn(
    "min-w-0 h-full min-h-0 rounded-2xl border-border overflow-hidden",
    "hover:border-primary/30 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer",
    "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
  );

  if (isMobile) {
    return (
      <div className="home-cards-mobile flex flex-col gap-12 w-full">
        {/* Profile — full width */}
        <Sheet>
          <SheetTrigger asChild>
            <Card className={cn(cardBase, "w-full")}>
              <CardContent className="p-4 flex flex-col justify-between min-h-0">
                <ProfileCardContent compact />
              </CardContent>
            </Card>
          </SheetTrigger>
          <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl">
            <SheetHeader className="sr-only">
              <SheetTitle>Profile Status</SheetTitle>
            </SheetHeader>
            <div className="p-4 flex flex-col gap-2">
              <ProfileCardContent />
            </div>
          </SheetContent>
        </Sheet>

        {/* Product cards — 2 columns side by side */}
        <div className="home-product-cards-grid grid grid-cols-2 gap-4 w-full">
          <ProductCard
            imageSrc={IMG_INTERNSHIPS}
            imageAlt="Placement Schedules"
            actionIcon="calendarDays"
            imageClassName={scaledImageClass ?? "object-contain object-center"}
            imageStyle={imgSet === "1st-time" ? imageStyle1stTime : illustrationImageStyle}
            aspectRatio={3 / 2}
            title="Placement Schedules"
            count=""
            description="Track your placement schedules"
            illustrationLayout={illustrationSet === "hero" ? "hero" : "default"}
            className={cn(cardBase, "!p-0", "home-product-card h-[185px] min-h-0 shrink-0")}
            isMobile={isMobile}
            skipSheetOnMobile
            onClick={() => navigateToPage("Internship")}
          />
          <ProductCard
            imageSrc={IMG_JOBS}
            imageAlt="Jobs"
            actionIcon="briefcase"
            imageClassName={scaledImageClass ?? "object-contain object-center"}
            imageStyle={imgSet === "1st-time" ? imageStyle1stTime : illustrationImageStyle}
            aspectRatio={3 / 2}
            title="Jobs"
            count="2k+ jobs"
            description="Find your 1st job"
            illustrationLayout={illustrationSet === "hero" ? "hero" : "default"}
            className={cn(cardBase, "!p-0", "home-product-card h-[185px] min-h-0 shrink-0")}
            isMobile={isMobile}
            skipSheetOnMobile
            onClick={() => navigateToPage("Jobs", { jobsTab: "discover" })}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="grid home-cards-grid items-stretch w-full gap-x-8 sm:gap-x-16 lg:gap-x-20 gap-y-4 sm:gap-y-10 lg:gap-y-12">
      {/* Profile — 1.5 columns */}
      <Card
        className={cn(cardBase, "flex flex-col min-h-0")}
        role="button"
        tabIndex={0}
        aria-label="View profile and update status"
        onClick={() => navigateToPage("People")}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === " ") {
            e.preventDefault();
            navigateToPage("People");
          }
        }}
      >
        <CardContent className="p-4 flex flex-col min-h-0 flex-1">
          <ProfileCardContent />
        </CardContent>
      </Card>

      {/* Placement Schedules — 2nd */}
      <ProductCard
        imageSrc={IMG_INTERNSHIPS}
        imageAlt="Placement Schedules"
        actionIcon="calendarDays"
        imageClassName={scaledImageClass ?? "object-contain object-center"}
        imageStyle={imgSet === "1st-time" ? imageStyle1stTime : illustrationImageStyle}
        aspectRatio={3 / 2}
        title="Placement Schedules"
        count=""
        description="Track your placement schedules"
        illustrationLayout={illustrationSet === "hero" ? "hero" : "default"}
        className={cn(cardBase, "!p-0")}
        isMobile={isMobile}
        onClick={() => navigateToPage("Internship")}
      />

      {/* Jobs — last */}
      <ProductCard
        imageSrc={IMG_JOBS}
        imageAlt="Jobs"
        actionIcon="briefcase"
        imageClassName={scaledImageClass ?? "object-contain object-center"}
        imageStyle={imgSet === "1st-time" ? imageStyle1stTime : illustrationImageStyle}
        aspectRatio={3 / 2}
        title="Jobs"
        count="2k+ jobs"
        description="Find your 1st job"
        illustrationLayout={illustrationSet === "hero" ? "hero" : "default"}
        className={cn(cardBase, "!p-0")}
        isMobile={isMobile}
        onClick={() => navigateToPage("Jobs")}
      />
    </div>
  );
}
