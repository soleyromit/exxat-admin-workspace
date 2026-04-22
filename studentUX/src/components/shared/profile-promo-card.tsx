"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { Progress } from "../ui/progress";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { sidebarData } from "../layout/sidebar-data";
import { cn } from "../ui/utils";

export interface ProfilePromoCardProps {
  /** Conversational title (Ivy font when subtitle present) */
  title: string;
  /** Subtitle in normal font (shown below title) */
  subtitle?: string;
  /** CTA label. Defaults to "Update profile" */
  ctaLabel?: string;
  /** User avatar image source */
  avatarSrc?: string;
  /** Illustration image source — when provided, shows illustration on the right (or instead of avatar in compact) */
  illustrationSrc?: string;
  /** Progress 0–100 for compact variant (shows progress bar) */
  progress?: number;
  /** Compact layout for job list sidebar */
  variant?: "default" | "compact";
  onClick?: () => void;
  className?: string;
  /** Accessible label when card is interactive (role=button) */
  "aria-label"?: string;
}

const AVATAR_SIZE_COMPACT = "h-14 w-14";
const AVATAR_SIZE_DEFAULT = "h-16 w-16";

export function ProfilePromoCard({
  title,
  subtitle,
  ctaLabel = "Update profile",
  avatarSrc,
  illustrationSrc,
  progress,
  variant = "default",
  onClick,
  className,
  "aria-label": ariaLabel,
}: ProfilePromoCardProps) {
  const isCompact = variant === "compact";
  const avatarUrl = avatarSrc ?? sidebarData.user.avatar;
  const showIllustration = Boolean(illustrationSrc);
  const illustrationOnRight = showIllustration && !isCompact;

  const topMediaEl = showIllustration && !illustrationOnRight ? (
    <img
      src={illustrationSrc}
      alt=""
      aria-hidden
      className={cn(
        "shrink-0 object-contain",
        isCompact ? "h-14 w-14" : "h-16 w-16"
      )}
    />
  ) : !illustrationOnRight ? (
    <Avatar
      className={cn(
        "shrink-0 rounded-full",
        isCompact ? AVATAR_SIZE_COMPACT : AVATAR_SIZE_DEFAULT
      )}
      aria-hidden
    >
      {avatarUrl ? (
        <AvatarImage src={avatarUrl} alt="" />
      ) : null}
      <AvatarFallback className="bg-muted text-muted-foreground">
        {sidebarData.user.name
          .split(" ")
          .map((n) => n[0])
          .join("")
          .slice(0, 2)
          .toUpperCase()}
      </AvatarFallback>
    </Avatar>
  ) : null;

  if (isCompact) {
    return (
      <Card
        className={cn(
          "flex flex-col border border-border overflow-hidden cursor-pointer transition-all rounded-2xl",
          "bg-chart-1/5",
          onClick && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
        role={onClick ? "button" : undefined}
        tabIndex={onClick ? 0 : undefined}
        aria-label={onClick ? ariaLabel : undefined}
        onClick={onClick}
        onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
      >
        <CardContent className="flex flex-col gap-4 p-6 min-h-0">
          {/* Avatar or illustration on top */}
          <div className="flex flex-col gap-3">
            {topMediaEl}
            <h4 className="page-title-sm leading-snug">
              {title}
            </h4>
          </div>
          {progress != null && (
            <div className="flex items-center gap-3">
              <Progress value={progress} className="h-2 flex-1" />
              <span className="text-xs text-muted-foreground shrink-0 capitalize">
                {progress}% Complete
              </span>
            </div>
          )}
          <Button
            variant="default"
            size="sm"
            className="w-fit"
            onClick={(e) => {
              e.stopPropagation();
              onClick?.();
            }}
          >
            {ctaLabel}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card
        className={cn(
          "flex border-0 bg-chart-1/5 overflow-hidden cursor-pointer transition-all rounded-2xl",
          illustrationOnRight ? "flex-row gap-0" : "flex-col gap-6",
          onClick && "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
          className
        )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? ariaLabel : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent
        className={cn(
          "flex flex-1 flex-col justify-center items-start gap-3 p-6 min-h-0 text-left",
          illustrationOnRight && "min-w-0"
        )}
      >
        {topMediaEl}
        <div className="flex flex-col gap-1">
          <h2
            className="promo-card-title leading-snug text-left"
          >
            {title}
          </h2>
          {subtitle && (
            <p className="text-base font-normal text-foreground leading-snug">
              {subtitle}
            </p>
          )}
        </div>
        <Button
          variant="default"
          size="sm"
          className="w-fit gap-2 shrink-0"
          onClick={(e) => {
            e.stopPropagation();
            onClick?.();
          }}
        >
          {ctaLabel}
          <FontAwesomeIcon name="arrowUpRight" className="h-4 w-4" />
        </Button>
      </CardContent>
      {illustrationOnRight && (
        <div className="flex items-end justify-end shrink-0 overflow-hidden pr-4 pb-4 self-stretch">
          <img
            src={illustrationSrc}
            alt=""
            aria-hidden
            className="h-32 w-auto max-h-[140px] object-contain object-right-bottom"
          />
        </div>
      )}
    </Card>
  );
}
