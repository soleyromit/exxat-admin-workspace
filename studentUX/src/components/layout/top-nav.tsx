"use client";

import * as React from "react";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { ExxatOneLogo } from "../brand/exxat-one-logo";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";
import { TopNavProfile } from "./top-nav-profile";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useIsMobile } from "../ui/use-mobile";

const MAIN_LINKS = [
  { title: "Home", page: "Home" },
  { title: "Placement Schedules", page: "Internship" },
  { title: "Jobs", page: "Jobs" },
] as const;

const USER = {
  name: "Sarah Morgan",
  email: "sarah.morgan@example.com",
  avatar:
    "https://images.unsplash.com/photo-1494790108755-2616b612b786?w=32&h=32&fit=crop&crop=face",
};

export interface TopNavProps {
  currentPage: string;
  onNavigationChange: (page: string) => void;
  onNotificationsClick: () => void;
  notificationCount?: number;
}

export function TopNav({
  currentPage,
  onNavigationChange,
  onNotificationsClick,
  notificationCount = 15,
}: TopNavProps) {
  const isMobile = useIsMobile();

  return (
    <header className="sticky top-0 z-50 flex h-14 shrink-0 items-center justify-between border-b border-border bg-background px-4 lg:px-6">
      {/* Left: hamburger menu on mobile, inline links on desktop */}
      {isMobile ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="h-9 w-9" aria-label="Open menu">
              <FontAwesomeIcon name="bars" className="h-4 w-4" weight="light" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-44">
            {MAIN_LINKS.map((link) => (
              <DropdownMenuItem
                key={link.page}
                className={cn(
                  "font-medium",
                  currentPage === link.page && "bg-muted text-foreground"
                )}
                onClick={() => onNavigationChange(link.page)}
              >
                {link.title}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : (
        <nav className="flex items-center gap-1" aria-label="Main navigation">
          {MAIN_LINKS.map((link) => (
            <Button
              key={link.page}
              variant="ghost"
              size="sm"
              className={cn(
                "font-medium text-sm",
                currentPage === link.page
                  ? "bg-muted text-foreground"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
              )}
              onClick={() => onNavigationChange(link.page)}
            >
              {link.title}
            </Button>
          ))}
        </nav>
      )}

      {/* Center: Logo */}
      <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center justify-center">
        <ExxatOneLogo className="h-8 w-8 sm:hidden" objectPosition="left" />
        <ExxatOneLogo className="h-8 hidden sm:block" />
      </div>

      {/* Right: Notification + Profile */}
      <div className="flex items-center gap-2">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              className="relative h-9 w-9"
              onClick={onNotificationsClick}
              aria-label={`Notifications${notificationCount ? ` (${notificationCount} unread)` : ""}`}
            >
              <FontAwesomeIcon name="bell" className="h-4 w-4" weight="light" aria-hidden="true" />
              {notificationCount > 0 && (
                <span className="absolute -top-0.5 -right-0.5 flex h-4 w-4 items-center justify-center rounded-full bg-destructive text-xs font-medium text-destructive-foreground">
                  {notificationCount > 99 ? "99+" : notificationCount}
                </span>
              )}
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom">
            Notifications{notificationCount ? ` (${notificationCount} unread)` : ""}
          </TooltipContent>
        </Tooltip>
        <TopNavProfile user={USER} />
      </div>
    </header>
  );
}
