"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Badge } from "../ui/badge";
import { Input } from "../ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { formatDateRangeShort } from "@/utils/date-utils";
import { cn } from "../ui/utils";

const IN_PROGRESS_STYLE = "bg-chart-4/10 text-chip-4 border-chip-4/40";
const UPCOMING_STYLE = "bg-chart-1/10 text-chip-1 border-chip-1/40";

function ProfileAddEmailContent({
  title,
  programType,
  onAddSecondaryEmail,
}: {
  title: string;
  programType?: string;
  onAddSecondaryEmail?: (email: string) => void;
}) {
  const [email, setEmail] = React.useState("");
  const handleSubmit = () => {
    const trimmed = email.trim();
    if (trimmed && onAddSecondaryEmail) {
      onAddSecondaryEmail(trimmed);
      setEmail("");
    }
  };
  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-1 flex-col gap-3 min-w-0">
        <h4 className="text-lg font-bold text-foreground leading-tight">{title}</h4>
        {programType && (
          <div className="flex items-center gap-2 text-sm text-destructive">
            <FontAwesomeIcon name="alertCircle" className="h-4 w-4 shrink-0" weight="solid" />
            <p className="text-destructive">
              <span className="font-semibold">Important: </span>
              {programType}
            </p>
          </div>
        )}
      </div>
      {onAddSecondaryEmail && (
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <Input
            type="email"
            placeholder="Enter email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleSubmit()}
            className="profile-dialog-field flex-1 min-w-0"
            aria-label="Secondary email address"
          />
          <Button variant="outline" size="default" className="h-9 w-fit shrink-0" onClick={handleSubmit}>
            Add Email
          </Button>
        </div>
      )}
    </div>
  );
}

export type TodoTaskStage = "upcoming" | "in progress";

/** Reusable task data shape — use for lists, APIs, or passing to TodoTaskCard */
export interface TodoTask {
  id?: string;
  taskType: string;
  taskTypeIcon?: "briefcase" | "bookOpen" | "heart" | "mail" | "calendarDays";
  siteLogo?: string;
  siteName?: string;
  title: string;
  actionNeeded?: boolean;
  dueDate?: Date | string;
  stage: TodoTaskStage;
  address?: string;
  availabilities?: number;
  programType?: string;
  specialty?: string;
  shift?: string;
  dateRange?: { start: Date | string; end: Date | string };
  primaryActionLabel?: string;
}

export interface TodoTaskCardProps extends TodoTask {
  /** Called when primary action is clicked */
  onPrimaryAction?: () => void;
  /** Called when "View Instructions by School" is clicked */
  onViewInstructions?: () => void;
  /** Called when "Share Preferences" is clicked */
  onSharePreferences?: () => void;
  /** Called when secondary email is added (Profile task) */
  onAddSecondaryEmail?: (email: string) => void;
  className?: string;
}

export function TodoTaskCard({
  taskType,
  taskTypeIcon = "briefcase",
  siteLogo,
  siteName,
  title,
  actionNeeded = false,
  dueDate,
  stage,
  address,
  availabilities,
  programType,
  specialty,
  shift,
  dateRange,
  primaryActionLabel,
  onPrimaryAction,
  onViewInstructions,
  onSharePreferences,
  onAddSecondaryEmail,
  className,
}: TodoTaskCardProps) {
  const dueLabel = dueDate
    ? `Due on ${new Date(dueDate).toLocaleDateString("en-US", {
        day: "numeric",
        month: "short",
      })}`
    : null;

  const specialtyLabel = specialty ?? programType;
  const isUpcomingInternshipCard = siteName != null || siteLogo != null;
  const isProfileCard = taskType === "Account Settings";

  return (
    <Card
      className={cn(
        "rounded-xl border bg-card transition-shadow hover:shadow-md",
        className
      )}
    >
      <CardContent className="p-6 flex flex-col gap-6">
        {/* Header: task type + status chips */}
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-muted/60">
              <FontAwesomeIcon
                name={taskTypeIcon}
                weight="light"
                className="h-4 w-4 text-foreground"
              />
            </div>
            <span className="text-sm font-medium text-foreground capitalize">
              {taskType}
            </span>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            {actionNeeded && (
              <Badge
                variant="secondary"
                className="schedule-status-destructive-warn-icon border-chip-destructive/40 bg-destructive/10 text-chip-destructive text-xs font-normal"
              >
                <FontAwesomeIcon
                  name="alertCircle"
                  className="h-3.5 w-3.5"
                  weight="solid"
                  aria-hidden
                />
                Some Action Needed
              </Badge>
            )}
            {!isProfileCard && dueLabel && (
              <Badge variant="secondary" className="border-border text-xs font-normal">
                <FontAwesomeIcon name="calendar" className="h-3.5 w-3.5" weight="light" />
                {dueLabel}
              </Badge>
            )}
            {!isProfileCard && stage === "in progress" && (
              <Badge
                variant="secondary"
                className={cn("text-xs font-normal", IN_PROGRESS_STYLE)}
              >
                <FontAwesomeIcon name="rocketLaunch" className="h-3.5 w-3.5" weight="light" />
                In Progress
              </Badge>
            )}
            {!isProfileCard && stage === "upcoming" && (
              <Badge
                variant="secondary"
                className={cn("text-xs font-normal", UPCOMING_STYLE)}
              >
                <FontAwesomeIcon name="flagCheckered" className="h-3.5 w-3.5" weight="light" />
                Upcoming
              </Badge>
            )}
          </div>
        </div>

        {/* Profile card: title + inline add email */}
        {isProfileCard && (
          <ProfileAddEmailContent
            title={title}
            programType={programType}
            onAddSecondaryEmail={onAddSecondaryEmail}
          />
        )}

        {/* Wishlist card: title + metadata (school asking for preferences) */}
        {!isUpcomingInternshipCard && !isProfileCard && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-1 flex-col gap-3 min-w-0">
              <h4 className="text-lg font-bold text-foreground leading-tight">
                {title}
              </h4>
              <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-xs text-foreground">
                {availabilities != null && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="mapPin" className="text-xl shrink-0 text-foreground" weight="light" />
                    <span>{availabilities} Availabilities</span>
                  </div>
                )}
                {programType && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon
                      name="bookOpen"
                      className="text-xl shrink-0 text-foreground"
                      weight="light"
                    />
                    <span>{programType}</span>
                  </div>
                )}
                {dateRange && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="calendar" className="text-xl shrink-0 text-foreground" weight="light" />
                    <span>
                      {formatDateRangeShort(dateRange.start, dateRange.end)}
                    </span>
                  </div>
                )}
              </div>
            </div>
            {(onViewInstructions || onSharePreferences) && (
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:space-x-6 shrink-0">
                {onSharePreferences && (
                  <Button
                    variant="outline"
                    size="default"
                    className="h-8"
                    onClick={onSharePreferences}
                  >
                    Share Preferences
                  </Button>
                )}
                {onViewInstructions && (
                  <Button
                    variant="link"
                    size="default"
                    className="h-8 px-0 justify-start sm:justify-center"
                    onClick={onViewInstructions}
                  >
                    View Instructions by School
                  </Button>
                )}
              </div>
            )}
          </div>
        )}

        {/* Upcoming internship card: logo + site name + metadata */}
        {isUpcomingInternshipCard && (
          <div className="flex flex-col gap-6">
            <div className="flex flex-1 flex-col gap-4 min-w-0">
              <div className="flex items-center gap-3 min-w-0">
                <Avatar className="h-10 w-10 shrink-0 rounded-none">
                  {siteLogo ? (
                    <AvatarImage
                      src={siteLogo}
                      alt=""
                      className="rounded-none object-contain bg-muted"
                      referrerPolicy="origin"
                    />
                  ) : null}
                  <AvatarFallback className="rounded-none text-xs bg-muted font-medium">
                    {(siteName ?? title)
                      .split(" ")
                      .map((w) => w[0])
                      .join("")
                      .slice(0, 2)
                      .toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <h4 className="text-lg font-bold text-foreground leading-tight truncate">
                  {siteName ?? title}
                </h4>
              </div>

              <div className="flex flex-wrap items-center gap-x-6 gap-y-4 text-xs text-foreground">
                {address && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="mapPin" className="text-xl shrink-0 text-foreground" weight="light" />
                    <span>{address}</span>
                  </div>
                )}
                {specialtyLabel && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="bookOpen" className="text-xl shrink-0 text-foreground" weight="light" />
                    <span>{specialtyLabel}</span>
                  </div>
                )}
                {dateRange && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="calendar" className="text-xl shrink-0 text-foreground" weight="light" />
                    <span>
                      {formatDateRangeShort(dateRange.start, dateRange.end)}
                    </span>
                  </div>
                )}
                {shift && (
                  <div className="flex items-center gap-1.5">
                    <FontAwesomeIcon name="hourglassEnd" className="text-xl shrink-0 text-foreground" weight="light" />
                    <span>{shift}</span>
                  </div>
                )}
              </div>
            </div>

            {primaryActionLabel && onPrimaryAction && (
              <Button
                variant="outline"
                size="default"
                className="h-8 w-fit"
                onClick={onPrimaryAction}
              >
                {primaryActionLabel}
              </Button>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export interface TodoCardListProps {
  /** Array of tasks to render */
  tasks: TodoTask[];
  /** Render function or callback for task actions. Receives (task, action) */
  onTaskAction?: (task: TodoTask, action: "primary" | "viewInstructions" | "sharePreferences") => void;
  /** Called when secondary email is added from a Profile task card */
  onAddSecondaryEmail?: (email: string) => void;
  /** Optional class for the list container */
  className?: string;
}

/**
 * Reusable list of To Do cards. Pass tasks and optional onTaskAction.
 * Use in Home, Inbox, or any page that displays a task list.
 */
export function TodoCardList({
  tasks,
  onTaskAction,
  onAddSecondaryEmail,
  className,
}: TodoCardListProps) {
  return (
    <div className={cn("flex flex-col gap-4", className)}>
      {tasks.map((task) => (
        <TodoTaskCard
          key={task.id ?? task.title}
          {...task}
          onPrimaryAction={
            task.primaryActionLabel && onTaskAction && task.taskType !== "Account Settings"
              ? () => onTaskAction(task, "primary")
              : undefined
          }
          onViewInstructions={
            !task.siteName && task.taskType !== "Account Settings" && onTaskAction
              ? () => onTaskAction(task, "viewInstructions")
              : undefined
          }
          onSharePreferences={
            !task.siteName && task.taskType !== "Account Settings" && onTaskAction
              ? () => onTaskAction(task, "sharePreferences")
              : undefined
          }
          onAddSecondaryEmail={
            task.taskType === "Account Settings" ? onAddSecondaryEmail : undefined
          }
        />
      ))}
    </div>
  );
}
