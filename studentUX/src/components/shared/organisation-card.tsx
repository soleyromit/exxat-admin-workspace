"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Avatar, AvatarImage, AvatarFallback } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "../ui/utils";
import type { OrganisationListing } from "../../data/jobs-data";

export interface OrganisationCardProps {
  organisation: OrganisationListing;
  className?: string;
  onClick?: () => void;
}

export function OrganisationCard({
  organisation,
  className,
  onClick,
}: OrganisationCardProps) {
  const [isSaved, setIsSaved] = React.useState(organisation.isSaved ?? false);

  const handleSaveClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsSaved((prev) => !prev);
  };

  return (
    <Card
      className={cn(
        "flex h-full flex-col cursor-pointer transition-all duration-200",
        "hover:border-primary/30 hover:shadow-md",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={`View ${organisation.name} - ${organisation.openingCount} openings`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="flex flex-1 flex-col gap-4 p-4 md:p-6 min-h-0">
        {/* Header: large logo + heart save */}
        <div className="flex items-start justify-between gap-3">
          <Avatar className="h-16 w-16 shrink-0 rounded-none">
            {organisation.logo ? (
              <AvatarImage
                src={organisation.logo}
                alt=""
                className="rounded-none object-contain bg-muted"
                referrerPolicy="origin"
              />
            ) : null}
            <AvatarFallback className="rounded-none bg-muted text-base font-semibold">
              {organisation.name.slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                className="flex min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:h-6 md:w-6 shrink-0 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-primary focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 touch-manipulation"
                aria-label={isSaved ? "Unsave organisation" : "Save organisation"}
                onClick={handleSaveClick}
              >
                <FontAwesomeIcon
                  name="heart"
                  className={cn("h-5 w-5", isSaved && "text-primary")}
                  weight={isSaved ? "solid" : "regular"}
                />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">{isSaved ? "Unsave organisation" : "Save organisation"}</TooltipContent>
          </Tooltip>
        </div>

        {/* Organisation name - bold 16px */}
        <h3 className="text-base font-bold leading-normal text-foreground">
          {organisation.name}
        </h3>

        {/* Row 1: Locations • Opening */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{organisation.locationsCount} Locations</span>
          <span aria-hidden="true">•</span>
          <span>{organisation.openingCount}+ Opening</span>
        </div>

        {/* Row 2: Salary • Experience */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span>{organisation.salaryRange}</span>
          <span aria-hidden="true">•</span>
          <span>{organisation.experienceRange}</span>
        </div>

        {/* Chip: building-circle-check + status — color by Ongoing vs Worked here */}
        <Badge
          variant="outline"
          className={cn(
            "w-fit gap-1.5 text-xs font-medium",
            organisation.statusChip === "Worked here"
              ? "border-chip-2 text-chip-2 bg-chart-2/10"
              : "border-chip-1 text-chip-1 bg-chart-1/10"
          )}
        >
          <FontAwesomeIcon
            name="buildingCircleCheck"
            className="h-3.5 w-3.5 shrink-0"
            weight="regular"
          />
          {organisation.statusChip}
        </Badge>
      </CardContent>
    </Card>
  );
}
