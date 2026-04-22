"use client";

import * as React from "react";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { ExxatOneLogo } from "../brand/exxat-one-logo";
import { Button } from "../ui/button";
import { TopNavProfile } from "./top-nav-profile";
import { ProductSwitcher } from "./product-switcher";
import { ProductSwitcherWithCoachMark } from "../features/product-switcher-coach-mark";
import { AskLeoButton } from "../shared/ask-leo-button";
import { sidebarData } from "./sidebar-data";
import { cn } from "../ui/utils";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { useIsDesktop } from "../ui/use-mobile";
import { useAppStore } from "@/stores/app-store";

const PRODUCTS = [
  { id: "exxat-one", name: "Exxat One", href: "#" as const },
  { id: "exxat-prism", name: "Exxat Prism", href: "https://exxat.com/products/exxat-prism" as const },
] as const;

const MAIN_LINKS = [
  { title: "Home", page: "Home", icon: "home" as IconName },
  {
    title: "Placement Schedules",
    page: "Schedules",
    icon: "calendarDays" as IconName,
    submenu: [
      { label: "Schedules", page: "Schedules", scheduleTab: "schedule" as const, icon: "calendar" as IconName },
      { label: "Wishlist", page: "Schedules", scheduleTab: "wishlist" as const, icon: "heart" as IconName },
    ],
  },
  {
    title: "Jobs",
    page: "Jobs",
    icon: "briefcase" as IconName,
    submenu: [
      { label: "Discover", page: "Jobs", jobsTab: "discover" as const, icon: "compass" as IconName },
      { label: "My Jobs", page: "Jobs", jobsTab: "my-jobs" as const, icon: "listChecks" as IconName },
    ],
  },
] as const;

const HOVER_OPEN_DELAY = 100;
const HOVER_CLOSE_DELAY = 200;

function NavItemWithHoverMenu({
  link,
  currentPage,
  jobsTab,
  scheduleTab,
  onNavigate,
}: {
  link: (typeof MAIN_LINKS)[number] & {
    submenu: readonly { label: string; page: string; icon: IconName; jobsTab?: "discover" | "my-jobs"; scheduleTab?: "schedule" | "wishlist" }[];
  };
  currentPage: string;
  jobsTab?: "discover" | "my-jobs";
  scheduleTab?: "schedule" | "wishlist";
  onNavigate: (page: string, options?: { jobsTab?: "discover" | "my-jobs"; scheduleTab?: "discover" | "schedule" | "wishlist" }) => void;
}) {
  const [open, setOpen] = React.useState(false);
  const openTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const isClickingTriggerRef = React.useRef(false);
  const blockMouseEnterRef = React.useRef(false);
  const blockTimerRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);
  const justOpenedRef = React.useRef(false);
  const isActive =
    currentPage === link.page ||
    link.submenu.some(
      (s) =>
        currentPage === s.page &&
        (!s.jobsTab || s.jobsTab === jobsTab) &&
        (!s.scheduleTab || s.scheduleTab === scheduleTab)
    );

  const clearTimers = () => {
    if (openTimerRef.current) {
      clearTimeout(openTimerRef.current);
      openTimerRef.current = null;
    }
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
    if (blockTimerRef.current) {
      clearTimeout(blockTimerRef.current);
      blockTimerRef.current = null;
    }
  };

  const handleMouseEnter = () => {
    if (blockMouseEnterRef.current) return;
    clearTimers();
    if (!open) {
      openTimerRef.current = setTimeout(() => {
        setOpen(true);
        justOpenedRef.current = true;
        setTimeout(() => {
          justOpenedRef.current = false;
        }, 120);
      }, HOVER_OPEN_DELAY);
    }
  };

  const handleMouseLeave = () => {
    if (justOpenedRef.current) return;
    clearTimers();
    closeTimerRef.current = setTimeout(() => setOpen(false), HOVER_CLOSE_DELAY);
  };

  const handleOpenChange = (next: boolean) => {
    clearTimers();
    if (next && isClickingTriggerRef.current) {
      setOpen(false);
    } else {
      setOpen(next);
    }
  };

  React.useEffect(() => () => clearTimers(), []);

  return (
    <DropdownMenu open={open} onOpenChange={handleOpenChange}>
      <div onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            className={cn(
              "h-8 px-3 text-lg gap-2 shrink-0 [&_[data-glow]]:hidden",
              isActive
                ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-medium data-[state=open]:bg-sidebar-accent/50 data-[state=open]:text-sidebar-foreground"
            )}
            onPointerDown={() => {
              isClickingTriggerRef.current = true;
              requestAnimationFrame(() => {
                isClickingTriggerRef.current = false;
              });
            }}
            onClick={() => {
              blockMouseEnterRef.current = true;
              if (blockTimerRef.current) clearTimeout(blockTimerRef.current);
              blockTimerRef.current = setTimeout(() => {
                blockMouseEnterRef.current = false;
                blockTimerRef.current = null;
              }, 350);
              setOpen(false);
              onNavigate(
                link.page,
                link.submenu.some((s) => s.jobsTab)
                  ? { jobsTab: "discover" }
                  : link.submenu.some((s) => s.scheduleTab)
                    ? { scheduleTab: "schedule" }
                    : undefined
              );
            }}
          >
            <FontAwesomeIcon
              name={link.icon}
              weight={isActive ? "solid" : "light"}
              className="text-lg"
            />
            {link.title}
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent
          align="center"
          sideOffset={2}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
          onCloseAutoFocus={(e) => e.preventDefault()}
          className="min-w-[8rem]"
        >
          {link.submenu.map((item) => (
            <DropdownMenuItem
              key={item.page + (item.jobsTab ?? "")}
              className={cn(
                "cursor-pointer gap-2",
                currentPage === item.page &&
                  (!item.jobsTab || item.jobsTab === jobsTab) &&
                  (!item.scheduleTab || item.scheduleTab === scheduleTab) &&
                  "bg-muted text-foreground"
              )}
              onClick={() =>
                onNavigate(
                  item.page,
                  item.jobsTab ? { jobsTab: item.jobsTab } : item.scheduleTab ? { scheduleTab: item.scheduleTab } : undefined
                )
              }
            >
              <FontAwesomeIcon
                name={item.icon}
                weight="light"
                className="h-4 w-4 shrink-0"
              />
              {item.label}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </div>
    </DropdownMenu>
  );
}

export interface TopSidebarProps {
  onNavigationChange?: (page: string, options?: { jobsTab?: "discover" | "my-jobs"; scheduleTab?: "discover" | "schedule" | "wishlist" }) => void;
  currentPage?: string;
  jobsTab?: "discover" | "my-jobs";
  scheduleTab?: "schedule" | "wishlist";
  /** When true (e.g. Welcome page before Home), hide nav, Ask Leo, Notification, Help, Product switcher */
  isWelcomePage?: boolean;
  /** When true, nav and actions animate in (used after Go to home from welcome) */
  animateFromWelcome?: boolean;
}

export function TopSidebar({
  onNavigationChange,
  currentPage = "Home",
  jobsTab,
  scheduleTab,
  isWelcomePage = false,
  animateFromWelcome = false,
}: TopSidebarProps) {
  const isDesktop = useIsDesktop();
  const productSwitcherApproach = useAppStore((s) => s.productSwitcherApproach);
  const currentProductId = useAppStore((s) => s.currentProductId);
  const setCurrentProductId = useAppStore((s) => s.setCurrentProductId);
  const hideTopTabBarAndInternshipMenu = useAppStore((s) => s.hideTopTabBarAndInternshipMenu);

  /** Only call `onNavigationChange` — App wraps it in `startTransition` + `navigateToPage`.
   * Do not also call `navigateToPage` here: a deferred transition would run later and clear
   * `selectedJobId` / other route state set after nav (e.g. opening a job from a job card). */
  const handleNavClick = (page: string, options?: { jobsTab?: "discover" | "my-jobs"; scheduleTab?: "discover" | "schedule" | "wishlist" }) => {
    if (onNavigationChange) {
      onNavigationChange(page, options);
    } else {
      useAppStore.getState().navigateToPage(page, options);
    }
  };

  return (
    <header
      data-slot="sidebar"
      data-top-bar
      className="top-bar flex shrink-0 items-center justify-between overflow-hidden bg-sidebar text-sidebar-foreground px-4"
      style={{ height: 40, minHeight: 40, maxHeight: 40 }}
    >
      {/* Left: hamburger menu (mobile) + [grid when logo-area] | [logo+chevron when logo-chevron] | logo */}
      <div className="flex items-center gap-2 shrink-0 min-h-0">
        {!isDesktop && !isWelcomePage && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1.5 text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground [&_[data-glow]]:hidden"
                aria-label="Open navigation menu"
              >
                <FontAwesomeIcon name="bars" className="h-4 w-4" weight="light" aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="start" className="w-52">
              {MAIN_LINKS.map((link) => {
                const hasSubmenu = "submenu" in link && link.submenu;
                const useDirectInternship = link.page === "Internship" && hideTopTabBarAndInternshipMenu;
                const navPage = useDirectInternship ? "Schedules" : link.page;
                const navOpts = useDirectInternship
                  ? { scheduleTab: "schedule" as const }
                  : link.page === "Internship"
                    ? undefined
                    : hasSubmenu && link.submenu?.some((s) => s.jobsTab)
                      ? { jobsTab: "discover" as const }
                      : undefined;
                const isActive =
                  link.page === "Internship"
                    ? currentPage === "Schedules" || currentPage === link.page
                    : currentPage === link.page;
                return (
                  <DropdownMenuItem
                    key={link.page}
                    className={cn(
                      "gap-2 font-medium",
                      isActive && "bg-muted text-foreground"
                    )}
                    onClick={() => handleNavClick(navPage, navOpts)}
                  >
                    <FontAwesomeIcon
                      name={link.icon}
                      weight="light"
                      className="h-4 w-4"
                    />
                    {link.title}
                  </DropdownMenuItem>
                );
              })}
              <DropdownMenuSeparator />
              <DropdownMenuItem className="gap-2 font-medium" aria-label="Notifications">
                <FontAwesomeIcon name="bell" className="h-4 w-4" weight="light" />
                Notifications
              </DropdownMenuItem>
              <DropdownMenuItem className="gap-2 font-medium" aria-label="Help">
                <FontAwesomeIcon name="circleQuestion" className="h-4 w-4" weight="light" />
                Help
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuLabel className="text-xs font-medium text-muted-foreground">Switch product</DropdownMenuLabel>
              {PRODUCTS.map((product) => (
                <DropdownMenuItem
                  key={product.id}
                  className={cn(
                    "gap-2 font-medium cursor-pointer",
                    product.id === currentProductId && "bg-muted font-medium"
                  )}
                  onClick={() => {
                    setCurrentProductId(product.id);
                    if (product.href && product.href !== "#") {
                      window.location.href = product.href;
                    }
                  }}
                >
                  <FontAwesomeIcon name="grid2" className="h-4 w-4 shrink-0" weight="light" />
                  {product.name}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        )}
        {!isWelcomePage && productSwitcherApproach === "logo-area" && (
          <ProductSwitcher placement="logo-area" className="text-sidebar-foreground" />
        )}
        {!isWelcomePage && productSwitcherApproach === "logo-chevron" ? (
          <ProductSwitcher placement="logo-chevron" className="text-sidebar-foreground" />
        ) : !isWelcomePage && (productSwitcherApproach === "greeting-popover" || productSwitcherApproach === "header-and-banner-inline") ? (
          <ProductSwitcherWithCoachMark placement="logo-chevron" className="text-sidebar-foreground" />
        ) : (
          <ExxatOneLogo className="h-8" />
        )}
      </div>

      {/* Center: inline links on desktop only — tablet uses hamburger menu */}
      {isDesktop && !isWelcomePage && (
        <nav
          className={cn(
            "flex items-center gap-1 flex-1 justify-center min-w-0",
            animateFromWelcome && "animate-in fade-in slide-in-from-top-2 duration-500"
          )}
          aria-label="Main navigation"
        >
          {MAIN_LINKS.map((link) => {
            const useDirectLink =
              !("submenu" in link && link.submenu) ||
              (link.page === "Internship" && hideTopTabBarAndInternshipMenu);
            return useDirectLink ? (
              <Button
                key={link.page}
                variant="ghost"
                size="sm"
                className={cn(
                  "h-8 px-3 text-lg gap-2 shrink-0 [&_[data-glow]]:hidden",
                  (link.page === "Internship" ? currentPage === "Schedules" : currentPage === link.page)
                    ? "bg-sidebar-accent text-sidebar-accent-foreground font-bold hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground font-medium"
                )}
                onClick={() =>
                  handleNavClick(
                    link.page === "Internship" && hideTopTabBarAndInternshipMenu
                      ? "Schedules"
                      : link.page,
                    link.page === "Internship" && hideTopTabBarAndInternshipMenu
                      ? { scheduleTab: "schedule" }
                      : undefined
                  )
                }
              >
                <FontAwesomeIcon
                  name={link.icon}
                  weight={
                    (link.page === "Internship" ? currentPage === "Schedules" : currentPage === link.page)
                      ? "solid"
                      : "light"
                  }
                  className="h-4 w-4"
                />
                {link.title}
              </Button>
            ) : (
              <NavItemWithHoverMenu
                key={link.page}
                link={link}
                currentPage={currentPage}
                jobsTab={link.page === "Jobs" ? jobsTab : undefined}
                scheduleTab={link.page === "Schedules" ? scheduleTab : undefined}
                onNavigate={handleNavClick}
              />
            );
          })}
        </nav>
      )}

      {/* Right: Ask Leo, Notification, Help, Avatar — hidden on Welcome page */}
      <div
        className={cn(
          "flex items-center gap-2 shrink-0",
          animateFromWelcome && "animate-in fade-in slide-in-from-top-2 duration-500"
        )}
      >
        {!isWelcomePage && (
          <>
            <AskLeoButton variant="default" icon="starChristmas" className="shrink-0" />
            {isDesktop && (
              <>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-lg min-w-8"
                      aria-label="Notifications"
                    >
                      <FontAwesomeIcon name="bell" className="text-lg" weight="light" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Notifications</TooltipContent>
                </Tooltip>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 shrink-0 text-lg min-w-8"
                      aria-label="Help"
                    >
                      <FontAwesomeIcon name="circleQuestion" className="text-lg" weight="light" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="bottom">Help</TooltipContent>
                </Tooltip>
                {productSwitcherApproach === "icon-next-to-help" && (
                  <ProductSwitcher
                    placement="icon-next-to-help"
                    className="text-sidebar-foreground shrink-0"
                  />
                )}
                {(productSwitcherApproach === "header-and-banner" ||
                  productSwitcherApproach === "banner-top") && (
                  <ProductSwitcherWithCoachMark className="text-sidebar-foreground shrink-0" />
                )}
              </>
            )}
          </>
        )}
        {!isWelcomePage && (
          <div className="w-px min-w-px self-stretch shrink-0 mx-2 bg-sidebar-foreground opacity-50 rounded-full" role="separator" aria-hidden="true" />
        )}
        <div className="shrink-0">
          <TopNavProfile user={sidebarData.user} />
        </div>
      </div>
    </header>
  );
}
