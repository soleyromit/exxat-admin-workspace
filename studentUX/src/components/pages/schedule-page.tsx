"use client";

import * as React from "react";
import { PageTabBar } from "../shared/page-tab-bar";
import { ScheduleCard } from "../shared/schedule-card";
import { ScheduleCalendarView } from "../shared/schedule-calendar-view";
import { ProfilePromoCard } from "../shared/profile-promo-card";
import { ButtonGroup } from "../ui/button-group";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { Badge } from "../ui/badge";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { useAppStore } from "../../stores/app-store";
import { useIsMobile, useIsLandscape } from "../ui/use-mobile";
import { scheduleItems as baseScheduleItems, groupByBoard, toBoardItems, type ScheduleItem, type ScheduleItemBoard } from "../../data/schedule-data";
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import { ScheduleBanners } from "../shared/schedule-banners";
import { SchoolNotOnPlatformEmpty } from "./internship-page";
import { ScheduleCardStack } from "../shared/schedule-card-stack";
import { WishlistSection } from "../shared/wishlist-section";
import {
  SubmitPreferencesFlow,
  SubmitPreferencesInstructionsModal,
} from "../features/submit-preferences-flow";
import { PayUnlockDialog } from "../features/pay-unlock-dialog";
import { EmployeeVerificationDialog } from "../features/employee-verification-dialog";
import { ScrollCarouselButtons } from "../shared/scroll-carousel";
import { cn } from "../ui/utils";
import type { WishlistItem } from "../../data/wishlist-data";

const SCHEDULE_TABS = [
  { id: "schedule", label: "Schedule", icon: "calendar" as const },
  { id: "wishlist", label: "Wishlist", icon: "heart" as const },
] as const;

const BOARDS: { id: ScheduleItemBoard; label: string; icon: "calendarDays" | "listChecks" | "checkCircle" }[] = [
  { id: "upcoming", label: "Upcoming", icon: "calendarDays" },
  { id: "in-process", label: "In-Process", icon: "listChecks" },
  { id: "completed", label: "Completed", icon: "checkCircle" },
];

const BOARD_COLORS: Record<ScheduleItemBoard, { container: string; header: string; icon: string }> = {
  upcoming: { container: "bg-muted/50 border-border", header: "bg-muted/70", icon: "text-chip-4" },
  "in-process": { container: "bg-muted/50 border-border", header: "bg-muted/70", icon: "text-chip-1" },
  completed: { container: "bg-muted/50 border-border", header: "bg-muted/70", icon: "text-chip-2" },
};

const COMPLETED_PROMO_TITLE = "Loved your Experience at a site?";
const COMPLETED_PROMO_SUBTITLE = "You could be working there!";

export function SchedulePage() {
  const isMobile = useIsMobile();
  const isLandscape = useIsLandscape();
  const scheduleTab = useAppStore((s) => s.scheduleTab);
  const [submitPrefsItem, setSubmitPrefsItem] = React.useState<WishlistItem | null>(null);
  const [submitPrefsInstructionsOpen, setSubmitPrefsInstructionsOpen] = React.useState(false);
  const [submitPrefsPageOpen, setSubmitPrefsPageOpen] = React.useState(false);
  const setScheduleTab = useAppStore((s) => s.setScheduleTab);
  const scheduleView = useAppStore((s) => s.scheduleView);
  const setScheduleView = useAppStore((s) => s.setScheduleView);
  const navigateToPage = useAppStore((s) => s.navigateToPage);
  const navigateToScheduleDetail = useAppStore((s) => s.navigateToScheduleDetail);
  const scheduleBannerType = useAppStore((s) => s.scheduleBannerType);
  const scheduleEmptyState = useAppStore((s) => s.scheduleEmptyState);

  const scheduleItems = React.useMemo(
    () =>
      scheduleEmptyState === "empty" || scheduleEmptyState === "school-not-on-platform"
        ? []
        : baseScheduleItems,
    [scheduleEmptyState]
  );
  const boardCarouselRef = React.useRef<HTMLDivElement>(null);
  const boardRefs = React.useRef<(HTMLDivElement | null)[]>([]);
  const [activeBoardIndex, setActiveBoardIndex] = React.useState(0);
  const [payDialogOpen, setPayDialogOpen] = React.useState(false);
  const [payDialogItems, setPayDialogItems] = React.useState<ScheduleItem[]>([]);
  const [payDialogAmount, setPayDialogAmount] = React.useState(0);
  const [verifyDialogOpen, setVerifyDialogOpen] = React.useState(false);
  const [verifyDialogItem, setVerifyDialogItem] = React.useState<ScheduleItem | null>(null);

  const openPayDialog = React.useCallback(
    (items: ScheduleItem[], amount: number) => {
      setPayDialogItems(items);
      setPayDialogAmount(amount);
      setPayDialogOpen(true);
    },
    []
  );

  const openVerifyDialog = React.useCallback((item: ScheduleItem) => {
    setVerifyDialogItem(item);
    setVerifyDialogOpen(true);
  }, []);

  const activeTab = scheduleTab === "discover" ? "schedule" : scheduleTab;
  const setActiveTab = (v: string) =>
    setScheduleTab(v as "schedule" | "wishlist");
  const effectiveScheduleView = scheduleView === "grid" ? "board" : scheduleView;

  const itemsByBoard = React.useMemo(() => groupByBoard(scheduleItems), [scheduleItems]);

  const scheduleBannerContext = React.useMemo(() => {
    if (scheduleBannerType === "off") return null;
    const upcoming = scheduleItems.filter((i) => i.board === "upcoming");
    if (scheduleBannerType === "compliance-nearing") {
      const item = upcoming.find((i) => i.actionType === "complete-requirements" && i.dueDate);
      return item ? { facilityName: item.facilityName, dueDate: item.dueDate!, scheduleId: item.id } : null;
    }
    if (scheduleBannerType === "payment-nearing") {
      const item = upcoming.find((i) => i.actionType === "pay-unlock" && i.dueDate && !i.overdueDays);
      return item ? { facilityName: item.facilityName, dueDate: item.dueDate!, scheduleId: item.id } : null;
    }
    if (scheduleBannerType === "overdue") {
      const item = upcoming.find((i) => i.overdueDays || i.status === "overdue");
      return item ? { facilityName: item.facilityName, dueDate: item.dueDate!, scheduleId: item.id } : null;
    }
    return null;
  }, [scheduleBannerType]);

  const isWishlistDetailsOpen = Boolean(submitPrefsItem && submitPrefsPageOpen);
  const hideTopTabBarAndInternshipMenu = useAppStore((s) => s.hideTopTabBarAndInternshipMenu);
  const effectiveTab = hideTopTabBarAndInternshipMenu ? "schedule" : activeTab;

  return (
    <div className="schedule-page min-w-0 min-h-0 overflow-x-hidden bg-background text-foreground flex flex-1 flex-col">
      {!isWishlistDetailsOpen && !hideTopTabBarAndInternshipMenu && (
        <PageTabBar
          items={SCHEDULE_TABS}
          value={activeTab}
          onValueChange={setActiveTab}
        />
      )}
      <div
        className={cn(
          "content-rail @container/main flex flex-1 flex-col w-full min-h-0 overflow-y-auto gap-12 pb-8",
          hideTopTabBarAndInternshipMenu && "pt-6"
        )}
      >
        {effectiveTab === "wishlist" ? (
          <>
            {submitPrefsItem && submitPrefsPageOpen ? (
              <SubmitPreferencesFlow
                item={submitPrefsItem}
                onBack={() => {
                  setSubmitPrefsPageOpen(false);
                  setSubmitPrefsItem(null);
                }}
                onComplete={() => undefined}
                onViewInstructions={() => setSubmitPrefsInstructionsOpen(true)}
              />
            ) : (
              <>
                {/* Wishlist — same header position as Schedule */}
                <header className="pt-0 pb-0 flex flex-col gap-4 w-full px-4 lg:px-6">
                  <h1 className="page-title text-left pt-0">Wishlist</h1>
                </header>
                <div className="flex flex-col w-full px-4 lg:px-6">
                  <WishlistSection
                    onOpenSubmitPreferences={(item) => {
                      setSubmitPrefsItem(item);
                      setSubmitPrefsPageOpen(false);
                      setSubmitPrefsInstructionsOpen(true);
                    }}
                  />
                </div>
              </>
            )}
          </>
        ) : (
        <>
        {/* Header with Ivy title + view toggle */}
        <header className="pt-0 pb-0 flex flex-col gap-4 w-full px-4 lg:px-6">
          <div className="flex flex-row items-center justify-between gap-3 w-full min-w-0">
            <h1 className="page-title text-left pt-0 truncate min-w-0">
              Schedules
            </h1>
            {effectiveTab === "schedule" && (
              <div className="flex items-center justify-end gap-2 shrink-0">
                <ButtonGroup aria-label="View options" className="shrink-0">
                  {(
                    [
                      { id: "board", icon: "kanban", label: "Board view" },
                      { id: "calendar", icon: "calendar", label: "Calendar view" },
                    ] as const
                  ).map((view) => (
                    <Tooltip key={view.id}>
                      <TooltipTrigger asChild>
                        <Button
                          variant="outline"
                          size="icon"
                          aria-label={view.label}
                          aria-pressed={scheduleView === view.id}
                          onClick={() =>
                            setScheduleView(view.id as "board" | "calendar")
                          }
                          className={
                            scheduleView === view.id
                              ? "bg-accent text-accent-foreground"
                              : ""
                          }
                        >
                          <FontAwesomeIcon
                            name={view.icon}
                            className="h-4 w-4"
                            weight={scheduleView === view.id ? "solid" : "light"}
                            aria-hidden="true"
                          />
                        </Button>
                      </TooltipTrigger>
                      <TooltipContent side="bottom">{view.label}</TooltipContent>
                    </Tooltip>
                  ))}
                </ButtonGroup>
                {isMobile && !isLandscape && effectiveScheduleView === "board" && (
                  <ScrollCarouselButtons
                    canScrollLeft={activeBoardIndex > 0}
                    canScrollRight={activeBoardIndex < BOARDS.length - 1}
                    onScrollLeft={() => {
                      const nextIdx = Math.max(0, activeBoardIndex - 1);
                      boardRefs.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                      setActiveBoardIndex(nextIdx);
                    }}
                    onScrollRight={() => {
                      const nextIdx = Math.min(BOARDS.length - 1, activeBoardIndex + 1);
                      boardRefs.current[nextIdx]?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
                      setActiveBoardIndex(nextIdx);
                    }}
                    isMobile={false}
                  />
                )}
              </div>
            )}
          </div>
          {/* Schedule banners — below title */}
          {effectiveTab === "schedule" && (
            <ScheduleBanners
              bannerType={scheduleBannerType}
              scheduleContext={scheduleBannerContext}
              onViewSchedule={(id) => {
                const item = id ? scheduleItems.find((i) => i.id === id) : scheduleItems[0];
                if (item) navigateToScheduleDetail(item.id);
              }}
            />
          )}
        </header>

        {/* Schedule content — Board (default), Calendar, Grid */}
        {effectiveTab === "schedule" && scheduleItems.length === 0 && scheduleEmptyState === "empty" && (
          <div className="flex flex-1 flex-col min-h-[360px] mt-6 px-4 lg:px-6">
            <Empty className="min-h-[360px] py-16">
              <EmptyHeader className="gap-4">
                <EmptyMedia variant="illustration">
                  <img
                    src="/Illustration/Internship-2.webp"
                    alt=""
                    aria-hidden
                    className="w-full h-auto object-contain max-h-[180px]"
                  />
                </EmptyMedia>
                <EmptyTitle size="large">No schedules yet</EmptyTitle>
                <EmptyDescription className="max-w-md">
                  Your clinical placements and rotations will appear here once they&apos;re assigned. Explore jobs to find opportunities that match your profile.
                </EmptyDescription>
              </EmptyHeader>
              <EmptyContent>
                <Button size="default" onClick={() => navigateToPage("Jobs", { jobsTab: "discover" })}>
                  Explore Jobs
                </Button>
              </EmptyContent>
            </Empty>
          </div>
        )}
        {effectiveTab === "schedule" && scheduleItems.length === 0 && scheduleEmptyState === "school-not-on-platform" && (
          <div className="flex flex-1 flex-col min-h-[360px] mt-6 px-4 lg:px-6">
            <SchoolNotOnPlatformEmpty />
          </div>
        )}
        {effectiveTab === "schedule" && scheduleItems.length > 0 && effectiveScheduleView === "board" && (
          <div className="flex flex-1 min-h-0 flex-col gap-6 mt-6">
            {isMobile && !isLandscape ? (
              /* Mobile portrait: carousel with arrows, swipe left/right to switch */
              <div className="relative flex flex-1 min-h-0">
                <div
                  ref={boardCarouselRef}
                  className="flex flex-1 min-h-[min(50dvh,400px)] overflow-x-auto overflow-y-hidden snap-x snap-mandatory gap-4 px-2 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
                  style={{ WebkitOverflowScrolling: "touch" }}
                  aria-label="Schedule boards - swipe or use arrows to switch"
                  onScroll={() => {
                    const el = boardCarouselRef.current;
                    if (!el) return;
                    const scrollLeft = el.scrollLeft;
                    const cardWidth = el.clientWidth * 0.9 + 16;
                    const idx = Math.round(scrollLeft / cardWidth);
                    setActiveBoardIndex(Math.min(idx, BOARDS.length - 1));
                  }}
                >
                {BOARDS.map((board, idx) => {
                  const items = itemsByBoard[board.id];
                  return (
                    <div
                      key={board.id}
                      ref={(el) => { boardRefs.current[idx] = el; }}
                      className={cn("shrink-0 w-[90%] min-w-[90%] snap-center flex flex-col min-h-0 rounded-xl border overflow-hidden", BOARD_COLORS[board.id].container)}
                    >
                      <h2 className={cn("flex items-center gap-2 text-lg font-semibold text-foreground shrink-0 px-4 pt-4 pb-2", BOARD_COLORS[board.id].header)}>
                        <FontAwesomeIcon name={board.icon} className={cn("h-5 w-5", BOARD_COLORS[board.id].icon)} weight="light" />
                        {board.label}
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                          {items.length}
                        </Badge>
                      </h2>
                      <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain px-4 pb-4 flex flex-col gap-4">
                        {items.length === 0 ? (
                          <Empty className="py-8">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <FontAwesomeIcon name={board.icon} className="h-6 w-6 text-muted-foreground" weight="light" />
                              </EmptyMedia>
                              <EmptyTitle>No {board.label.toLowerCase()} items</EmptyTitle>
                              <EmptyDescription>
                                Placements in this stage will appear here.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        ) : (
                          toBoardItems(items).map((boardItem) =>
                            boardItem.type === "single" ? (
                              <ScheduleCard
                                key={boardItem.item.id}
                                item={boardItem.item}
                                onClick={
                                  boardItem.item.actionType === "pay-unlock"
                                    ? () => openPayDialog([boardItem.item], boardItem.item.amount ?? 0)
                                    : () => navigateToScheduleDetail(boardItem.item.id)
                                }
                                onVerifyClick={
                                  boardItem.item.requiresEmployeeVerification
                                    ? () => openVerifyDialog(boardItem.item)
                                    : undefined
                                }
                              />
                            ) : (
                              <ScheduleCardStack
                                key={boardItem.items[0].paymentGroupId}
                                items={boardItem.items}
                                amount={boardItem.amount}
                                onClick={() => openPayDialog(boardItem.items, boardItem.amount)}
                                onPayClick={() => openPayDialog(boardItem.items, boardItem.amount)}
                              />
                            )
                          )
                        )}
                        {board.id === "completed" && (
                          <ProfilePromoCard
                            title={COMPLETED_PROMO_TITLE}
                            subtitle={COMPLETED_PROMO_SUBTITLE}
                            ctaLabel="Explore Jobs"
                            illustrationSrc="/Illustration/Job-2.webp"
                            onClick={() => navigateToPage("Jobs")}
                            className="min-h-[240px] shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
                </div>
              </div>
            ) : (
              /* Mobile landscape or desktop: 3-column grid (landscape has width for columns, limited height) */
              <div
                className={cn(
                  "grid gap-6 flex-1 min-h-0 items-stretch",
                  isLandscape ? "grid-cols-3" : "grid-cols-1 md:grid-cols-3"
                )}
              >
                {BOARDS.map((board) => {
                  const items = itemsByBoard[board.id];
                  return (
                    <div
                      key={board.id}
                      className={cn("flex flex-col min-h-0 rounded-xl border overflow-hidden", BOARD_COLORS[board.id].container)}
                    >
                      <h2 className={cn("flex items-center gap-2 text-lg font-semibold text-foreground shrink-0 px-4 pt-4 pb-2", BOARD_COLORS[board.id].header)}>
                        <FontAwesomeIcon name={board.icon} className={cn("h-5 w-5", BOARD_COLORS[board.id].icon)} weight="light" />
                        {board.label}
                        <Badge variant="secondary" className="h-5 px-1.5 text-xs font-normal">
                          {items.length}
                        </Badge>
                      </h2>
                      <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4 flex flex-col gap-4">
                        {items.length === 0 ? (
                          <Empty className="py-8">
                            <EmptyHeader>
                              <EmptyMedia variant="icon">
                                <FontAwesomeIcon name={board.icon} className="h-6 w-6 text-muted-foreground" weight="light" />
                              </EmptyMedia>
                              <EmptyTitle>No {board.label.toLowerCase()} items</EmptyTitle>
                              <EmptyDescription>
                                Placements in this stage will appear here.
                              </EmptyDescription>
                            </EmptyHeader>
                          </Empty>
                        ) : (
                          toBoardItems(items).map((boardItem) =>
                            boardItem.type === "single" ? (
                              <ScheduleCard
                                key={boardItem.item.id}
                                item={boardItem.item}
                                onClick={
                                  boardItem.item.actionType === "pay-unlock"
                                    ? () => openPayDialog([boardItem.item], boardItem.item.amount ?? 0)
                                    : () => navigateToScheduleDetail(boardItem.item.id)
                                }
                                onVerifyClick={
                                  boardItem.item.requiresEmployeeVerification
                                    ? () => openVerifyDialog(boardItem.item)
                                    : undefined
                                }
                              />
                            ) : (
                              <ScheduleCardStack
                                key={boardItem.items[0].paymentGroupId}
                                items={boardItem.items}
                                amount={boardItem.amount}
                                onClick={() => openPayDialog(boardItem.items, boardItem.amount)}
                                onPayClick={() => openPayDialog(boardItem.items, boardItem.amount)}
                              />
                            )
                          )
                        )}
                        {board.id === "completed" && (
                          <ProfilePromoCard
                            title={COMPLETED_PROMO_TITLE}
                            subtitle={COMPLETED_PROMO_SUBTITLE}
                            ctaLabel="Explore Jobs"
                            illustrationSrc="/Illustration/Job-2.webp"
                            onClick={() => navigateToPage("Jobs")}
                            className="min-h-[240px] shrink-0"
                          />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {effectiveTab === "schedule" && scheduleItems.length > 0 && effectiveScheduleView === "calendar" && (
          <div className="flex flex-1 flex-col min-h-0 overflow-auto mt-6">
            <ScheduleCalendarView
              items={scheduleItems}
              onItemClick={(item) => {
                if (item.actionType === "pay-unlock") {
                  if (item.paymentGroupId) {
                    const groupItems = scheduleItems.filter((i) => i.paymentGroupId === item.paymentGroupId);
                    const amount = groupItems.find((i) => i.amount != null)?.amount ?? 0;
                    openPayDialog(groupItems, amount);
                  } else {
                    openPayDialog([item], item.amount ?? 0);
                  }
                } else {
                  navigateToScheduleDetail(item.id);
                }
              }}
            />
          </div>
        )}


        </>
        )}
      </div>

      <PayUnlockDialog
        open={payDialogOpen}
        onOpenChange={setPayDialogOpen}
        items={payDialogItems}
        amount={payDialogAmount}
        onPay={() => {
          if (payDialogItems.length > 0) {
            navigateToScheduleDetail(payDialogItems[0].id);
          }
        }}
      />

      <EmployeeVerificationDialog
        open={verifyDialogOpen}
        onOpenChange={(open) => {
          setVerifyDialogOpen(open);
          if (!open) setVerifyDialogItem(null);
        }}
        item={verifyDialogItem}
        onVerify={(siteEmail) => {
          if (verifyDialogItem) {
            navigateToScheduleDetail(verifyDialogItem.id);
          }
        }}
      />

      {submitPrefsItem ? (
        <SubmitPreferencesInstructionsModal
          item={submitPrefsItem}
          open={submitPrefsInstructionsOpen}
          onOpenChange={(open) => {
            setSubmitPrefsInstructionsOpen(open);
            if (!open && !submitPrefsPageOpen) {
              setSubmitPrefsItem(null);
            }
          }}
          onContinue={() => {
            setSubmitPrefsInstructionsOpen(false);
            setSubmitPrefsPageOpen(true);
          }}
        />
      ) : null}

    </div>
  );
}
