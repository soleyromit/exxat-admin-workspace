"use client";

import * as React from "react";
import { Button } from "../ui/button";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { useAppStore } from "../../stores/app-store";

const EMPTY_ILLUSTRATION_INTERNSHIP = "/Illustration/Internship-2.webp";

/** Case 1: Schools don't access placement to students — humane, opportunity-focused */
function PlacementNotEnabledEmpty() {
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  return (
    <Empty className="h-full min-h-[360px] py-16">
      <EmptyHeader className="gap-4">
        <EmptyMedia variant="illustration">
          <img
            src={EMPTY_ILLUSTRATION_INTERNSHIP}
            alt=""
            aria-hidden
            className="w-full h-auto object-contain"
          />
        </EmptyMedia>
        <EmptyTitle size="large">
          Your path to hands-on experience is taking shape
        </EmptyTitle>
        <EmptyDescription className="max-w-md">
          When your program connects with Exxat One, you&apos;ll discover thousands of placement opportunities across healthcare sites. Reach out to your program coordinator to learn when placements become available.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="default"
          onClick={() => navigateToPage("Home")}
        >
          <FontAwesomeIcon name="book" className="h-4 w-4" weight="regular" />
          Explore career tips
        </Button>
      </EmptyContent>
    </Empty>
  );
}

/** Case 2: Schools are not on the platform — humane, marketing opportunity (shared with Schedules) */
export function SchoolNotOnPlatformEmpty() {
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  return (
    <Empty className="h-full min-h-[360px] py-16">
      <EmptyHeader className="gap-4">
        <EmptyMedia variant="illustration">
          <img
            src={EMPTY_ILLUSTRATION_INTERNSHIP}
            alt=""
            aria-hidden
            className="w-full h-auto object-contain"
          />
        </EmptyMedia>
        <EmptyTitle size="large">
          Your school could open doors to 40K+ opportunities
        </EmptyTitle>
        <EmptyDescription className="max-w-md">
          Exxat One connects schools with healthcare sites nationwide. Share your interest with your program coordinator — together we can unlock pathways for students like you.
        </EmptyDescription>
      </EmptyHeader>
      <EmptyContent>
        <Button
          variant="outline"
          size="default"
          onClick={() => navigateToPage("Home")}
        >
          <FontAwesomeIcon name="circleInfo" className="h-4 w-4" weight="regular" />
          Learn more
        </Button>
      </EmptyContent>
    </Empty>
  );
}

export type InternshipEmptyState = "placement-not-enabled" | "school-not-on-platform" | "off";

export function InternshipPage() {
  const internshipEmptyState = useAppStore((s) => s.internshipEmptyState);
  const navigateToPage = useAppStore((s) => s.navigateToPage);

  React.useEffect(() => {
    if (internshipEmptyState === "off") {
      navigateToPage("Schedules");
    }
  }, [internshipEmptyState, navigateToPage]);

  if (internshipEmptyState === "placement-not-enabled") {
    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-auto bg-background text-foreground">
        <div className="content-rail flex flex-1 items-center justify-center px-4 lg:px-6 py-8">
          <PlacementNotEnabledEmpty />
        </div>
      </div>
    );
  }

  if (internshipEmptyState === "school-not-on-platform") {
    return (
      <div className="flex flex-1 flex-col min-h-0 overflow-auto bg-background text-foreground">
        <div className="content-rail flex flex-1 items-center justify-center px-4 lg:px-6 py-8">
          <SchoolNotOnPlatformEmpty />
        </div>
      </div>
    );
  }

  // "off" — redirect to Schedules (handled by useEffect above)
  return null;
}
