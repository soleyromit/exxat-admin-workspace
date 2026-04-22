"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Badge } from "../ui/badge";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { cn, touchTargetMobileClasses } from "../ui/utils";

export interface InternshipOption {
  id: string;
  organizationName: string;
  /** Site name (e.g. "West Campus") — specific site */
  siteName: string;
  internshipName: string;
  logoSrc: string;
  location: string;
  setting: string;
  specialization: string;
  dateLabel: string;
  locationsLabel: string;
  internshipType: "Group" | "Individual";
  paymentRequired: boolean;
  isPartner: boolean;
  /** Hospital location name (e.g. "Mayo Clinic West Campus") — for location display when different from location */
  hospitalLocationName?: string;
}

export interface InternshipCardProps {
  option: InternshipOption;
  className?: string;
  onClick?: () => void;
  /** When true, applies selected-state styling (e.g. for map view) */
  isSelected?: boolean;
  /** When true, applies hover-from-map styling (e.g. map pin hover) */
  isHovered?: boolean;
  /** Rank badge when option is ranked (1-based) */
  rank?: number;
  /** Whether option is saved */
  isSaved?: boolean;
  /** Called when save button clicked */
  onSaveClick?: (e: React.MouseEvent) => void;
  /** Optional controls in the header-right area */
  headerActions?: (option: InternshipOption) => React.ReactNode;
  /** Optional action buttons (e.g. Add to Rank, Move Up/Down) */
  renderActions?: (option: InternshipOption) => React.ReactNode;
  /** Optional content rendered below the action row */
  footerContent?: (option: InternshipOption) => React.ReactNode;
  /** Override aria-label */
  "aria-label"?: string;
  /** Called when map pin is clicked — use to scroll to card or show on map */
  onMapPinClick?: (e: React.MouseEvent) => void;
}

export function InternshipCard({
  option,
  className,
  onClick,
  isSelected,
  isHovered,
  rank,
  isSaved = false,
  onSaveClick,
  headerActions,
  renderActions,
  footerContent,
  "aria-label": ariaLabel,
  onMapPinClick,
}: InternshipCardProps) {

  return (
    <Card
      className={cn(
        "flex h-full flex-col cursor-pointer transition-all duration-200 rounded-2xl",
        "hover:border-sidebar-border hover:shadow-md",
        isSelected ? "bg-sidebar border-sidebar-border shadow-md hover:bg-sidebar" : "hover:bg-sidebar/50",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        isHovered && !isSelected && "bg-sidebar/30 border-sidebar-border/80",
        className
      )}
      role="button"
      tabIndex={0}
      aria-label={ariaLabel ?? `View ${option.hospitalLocationName ?? option.siteName} at ${option.organizationName}`}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
    >
      <CardContent className="flex flex-1 flex-col gap-3 p-4 min-h-0 min-w-0">
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3 min-w-0">
          <div className="flex min-w-0 items-start gap-3 flex-1">
            <Avatar className="h-10 w-10 shrink-0 rounded-md border border-border bg-background">
              {option.logoSrc && (
                <AvatarImage
                  src={option.logoSrc}
                  alt=""
                  className="rounded-md object-contain bg-muted"
                  referrerPolicy="origin"
                />
              )}
              <AvatarFallback className="rounded-md bg-muted text-sm font-medium">
                {option.organizationName.slice(0, 2).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1">
              <h3 className="text-lg leading-normal text-foreground line-clamp-2 font-extrabold">
                {option.siteName}
              </h3>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-2 self-start sm:self-auto">
            {headerActions?.(option)}
            {onSaveClick && (
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    aria-label={isSaved ? "Remove from saved" : "Save internship"}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSaveClick(e);
                    }}
                  >
                    <FontAwesomeIcon
                      name="heart"
                      className={cn("h-4 w-4", isSaved && "text-primary")}
                      weight={isSaved ? "solid" : "regular"}
                      aria-hidden
                    />
                  </Button>
                </TooltipTrigger>
                <TooltipContent side="bottom">{isSaved ? "Remove from saved" : "Save internship"}</TooltipContent>
              </Tooltip>
            )}
          </div>
        </div>

        {/* Metadata — location (hospital location name), specialization */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-2 text-xs font-normal text-foreground min-w-0">
            {onMapPinClick ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      onMapPinClick(e);
                    }}
                    className={cn(
                      "inline-flex items-center gap-2 text-left text-xs font-normal hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 rounded shrink-0 min-w-0",
                      touchTargetMobileClasses
                    )}
                    aria-label={`Show ${option.hospitalLocationName ?? option.location} on map`}
                  >
                    <FontAwesomeIcon
                      name="mapPin"
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      weight="light"
                      aria-hidden
                    />
                    <span className="truncate">{option.hospitalLocationName ?? option.location}</span>
                  </button>
                </TooltipTrigger>
                <TooltipContent side="bottom">Location — click to show on map</TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <span className="inline-flex items-center gap-2 text-xs font-normal min-w-0">
                    <FontAwesomeIcon
                      name="mapPin"
                      className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                      weight="light"
                      aria-hidden
                    />
                    <span className="truncate">{option.hospitalLocationName ?? option.location}</span>
                  </span>
                </TooltipTrigger>
                <TooltipContent side="bottom">Location</TooltipContent>
              </Tooltip>
            )}
          </div>
          {option.specialization && (
            <Tooltip>
              <TooltipTrigger asChild>
                <div className="flex items-center gap-2 text-xs font-normal text-foreground min-w-0">
                  <FontAwesomeIcon
                    name="bookOpen"
                    className="h-3.5 w-3.5 shrink-0 text-muted-foreground"
                    weight="light"
                    aria-hidden
                  />
                  <span className="truncate">{option.specialization}</span>
                </div>
              </TooltipTrigger>
              <TooltipContent side="bottom">Specialization</TooltipContent>
            </Tooltip>
          )}
        </div>

        {/* Chips — date, type, payment, partner */}
        <div className="flex flex-wrap gap-1.5 overflow-hidden min-h-6">
          {rank != null && (
            <Badge variant="secondary" className="h-6 px-2 text-xs font-normal bg-chip-filled-1 text-chip-1">
              Rank {rank}
            </Badge>
          )}
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs font-normal gap-1.5 border-border cursor-default">
                <FontAwesomeIcon name="calendar" className="h-3.5 w-3.5" weight="light" aria-hidden />
                {option.dateLabel}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">Date range</TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Badge variant="secondary" className="text-xs font-normal gap-1.5 cursor-default">
                <FontAwesomeIcon
                  name={option.internshipType === "Group" ? "users" : "user"}
                  className="h-3.5 w-3.5"
                  weight="light"
                  aria-hidden
                />
                {option.internshipType}
              </Badge>
            </TooltipTrigger>
            <TooltipContent side="bottom">Internship type</TooltipContent>
          </Tooltip>
          {option.paymentRequired && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal gap-1.5 bg-chart-4/10 text-chip-4 border-chip-4/40 cursor-default"
                >
                  <FontAwesomeIcon name="lock" className="h-3.5 w-3.5" weight="light" aria-hidden />
                  Payment Required
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">Payment required to unlock</TooltipContent>
            </Tooltip>
          )}
          {option.isPartner && (
            <Tooltip>
              <TooltipTrigger asChild>
                <Badge
                  variant="secondary"
                  className="text-xs font-normal gap-1.5 bg-chart-2/10 text-chip-2 border-chip-2/40 cursor-default"
                >
                  <FontAwesomeIcon name="handshake" className="h-3.5 w-3.5" weight="light" aria-hidden />
                  Partner
                </Badge>
              </TooltipTrigger>
              <TooltipContent side="bottom">Partner site</TooltipContent>
            </Tooltip>
          )}
        </div>

        {renderActions && (
          <div className="w-full pt-1">
            {renderActions?.(option)}
          </div>
        )}

        {footerContent?.(option)}
      </CardContent>
    </Card>
  );
}
