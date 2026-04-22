"use client";

import * as React from "react";
import { Tabs, TabsList, TabsTrigger } from "../ui/tabs";
import { WishlistCard } from "./wishlist-card";
import { FontAwesomeIcon, type IconName } from "../brand/font-awesome-icon";
import { useAppStore } from "@/stores/app-store";
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "../ui/empty";
import {
  CAROUSEL_GAP,
  SCROLL_CAROUSEL_CLASSES,
  SCROLL_CAROUSEL_INNER_CLASSES,
  ScrollCarouselButtons,
} from "../shared/scroll-carousel";
import { useIsMobile } from "../ui/use-mobile";
import { wishlistItems, type WishlistItem } from "../../data/wishlist-data";

const WISHLIST_CARD_WIDTH_DESKTOP = 320;
const WISHLIST_CARD_WIDTH_MOBILE = 280;
const WISHLIST_EMPTY_ILLUSTRATION = "/Illustration/Internship-2.webp";

const WISHLIST_TABS = [
  { id: "open", label: "Open" },
  { id: "closed", label: "Closed" },
] as const;

function SectionEmptyState({
  icon,
  title,
  description,
}: {
  icon: IconName;
  title: string;
  description: string;
}) {
  return (
    <Empty className="py-10">
      <EmptyHeader>
        <EmptyMedia variant="default">
          <FontAwesomeIcon name={icon} className="h-12 w-12 text-muted-foreground" weight="regular" />
        </EmptyMedia>
        <EmptyTitle>{title}</EmptyTitle>
        <EmptyDescription>{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

function WishlistHeroEmptyState({
  title,
  description,
}: {
  title: string;
  description: string;
}) {
  return (
    <Empty className="min-h-[360px] py-12 md:py-16">
      <EmptyHeader className="gap-4">
        <EmptyMedia variant="illustration">
          <img
            src={WISHLIST_EMPTY_ILLUSTRATION}
            alt=""
            aria-hidden
            className="h-auto w-full object-contain"
          />
        </EmptyMedia>
        <EmptyTitle size="large">{title}</EmptyTitle>
        <EmptyDescription className="max-w-md">{description}</EmptyDescription>
      </EmptyHeader>
    </Empty>
  );
}

export interface WishlistSectionProps {
  /** Called when user clicks "Submit preferences" on an open wishlist card */
  onOpenSubmitPreferences?: (item: WishlistItem) => void;
}

export function WishlistSection({ onOpenSubmitPreferences }: WishlistSectionProps) {
  const [activeTab, setActiveTab] = React.useState<"open" | "closed">("open");
  const wishlistEmptyState = useAppStore((s) => s.wishlistEmptyState);
  const isMobile = useIsMobile();
  const cardWidth = isMobile ? WISHLIST_CARD_WIDTH_MOBILE : WISHLIST_CARD_WIDTH_DESKTOP;
  const scrollAmount = cardWidth + CAROUSEL_GAP;

  const baseOpenItems = React.useMemo(() => wishlistItems.filter((i) => i.tab === "open"), []);
  const baseClosedItems = React.useMemo(() => wishlistItems.filter((i) => i.tab === "closed"), []);

  const openItems = React.useMemo(() => {
    if (wishlistEmptyState === "no-wishlist" || wishlistEmptyState === "all-closed") {
      return [];
    }
    return baseOpenItems;
  }, [baseOpenItems, wishlistEmptyState]);

  const closedItems = React.useMemo(() => {
    if (wishlistEmptyState === "no-wishlist") {
      return [];
    }
    return baseClosedItems;
  }, [baseClosedItems, wishlistEmptyState]);

  const openRef = React.useRef<HTMLDivElement>(null);
  const closedRef = React.useRef<HTMLDivElement>(null);
  const openScrollRef = React.useRef<HTMLDivElement>(null);
  const closedScrollRef = React.useRef<HTMLDivElement>(null);

  const [openCanScrollLeft, setOpenCanScrollLeft] = React.useState(false);
  const [openCanScrollRight, setOpenCanScrollRight] = React.useState(true);
  const [closedCanScrollLeft, setClosedCanScrollLeft] = React.useState(false);
  const [closedCanScrollRight, setClosedCanScrollRight] = React.useState(true);

  const updateOpenScroll = React.useCallback(() => {
    const el = openScrollRef.current;
    if (!el) return;
    setOpenCanScrollLeft(el.scrollLeft > 4);
    setOpenCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  const updateClosedScroll = React.useCallback(() => {
    const el = closedScrollRef.current;
    if (!el) return;
    setClosedCanScrollLeft(el.scrollLeft > 4);
    setClosedCanScrollRight(el.scrollLeft + el.clientWidth < el.scrollWidth - 4);
  }, []);

  React.useEffect(() => {
    updateOpenScroll();
    updateClosedScroll();
  }, [updateOpenScroll, updateClosedScroll, openItems.length, closedItems.length]);

  React.useEffect(() => {
    if (wishlistEmptyState === "all-closed") {
      setActiveTab("closed");
      return;
    }
    if (wishlistEmptyState === "no-wishlist") {
      setActiveTab("open");
    }
  }, [wishlistEmptyState]);

  const handleTabChange = React.useCallback((value: string) => {
    const tab = value as "open" | "closed";
    setActiveTab(tab);
    if (tab === "open") {
      openRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      closedRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  React.useEffect(() => {
    const refs = [openRef, closedRef];
    const ids: ("open" | "closed")[] = ["open", "closed"];

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting);
        if (visible.length === 0) return;
        const topmost = visible.reduce((a, b) =>
          a.boundingClientRect.top < b.boundingClientRect.top ? a : b
        );
        const index = refs.findIndex((r) => r.current === topmost.target);
        if (index >= 0) setActiveTab(ids[index]);
      },
      { rootMargin: "0px 0px -80% 0px", threshold: 0 }
    );

    refs.forEach((ref) => ref.current && observer.observe(ref.current));
    return () => observer.disconnect();
  }, []);

  const handleItemClick = React.useCallback(
    (item: WishlistItem) => {
      if (item.status === "not-viewable") return;
      if (item.status === "preferences-not-submitted" && onOpenSubmitPreferences) {
        onOpenSubmitPreferences(item);
      }
      // TODO: handle "preferences-submitted" and "viewable" (view preferences/submission)
    },
    [onOpenSubmitPreferences]
  );

  const renderCarousel = (
    items: WishlistItem[],
    scrollRef: React.RefObject<HTMLDivElement | null>,
    setLeft: React.Dispatch<React.SetStateAction<boolean>>,
    setRight: React.Dispatch<React.SetStateAction<boolean>>,
    onScroll: () => void
  ) => (
    <div className="" style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}>
      <div ref={scrollRef} className={SCROLL_CAROUSEL_CLASSES} onScroll={onScroll}>
        <div className={SCROLL_CAROUSEL_INNER_CLASSES} style={{ gap: CAROUSEL_GAP }}>
          {items.map((item) => (
            <div
              key={item.id}
              className="snap-start shrink-0 flex flex-col"
              style={{ width: cardWidth, minWidth: cardWidth }}
            >
              <WishlistCard
                item={item}
                onClick={() => handleItemClick(item)}
                className="rounded-2xl border border-border flex-1 min-w-0 h-full"
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );

  if (wishlistEmptyState === "no-wishlist") {
    return (
      <div className="flex w-full flex-col">
        <WishlistHeroEmptyState
          title="No wishlist yet"
          description="Your school will surface wishlist rotations here when preference matching opens."
        />
      </div>
    );
  }

  return (
    <div className="flex flex-col w-full">
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <div className="sticky top-0 z-10 bg-background pt-1 -mt-1">
          <TabsList
            variant="underline"
            className="w-full justify-start"
            aria-label="Wishlist categories"
          >
            {WISHLIST_TABS.map((tab) => (
              <TabsTrigger key={tab.id} value={tab.id}>
                {tab.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </div>

        {/* Both sections on single page — scroll to section when tab clicked */}
        <div className="mt-6 flex flex-col w-full gap-24">
          <section
            ref={openRef}
            id="wishlist-open"
            className="scroll-mt-20 pb-12"
            aria-labelledby="wishlist-open-heading"
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 id="wishlist-open-heading" className="text-base md:text-lg font-bold">
                    Open
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-sm md:text-base">
                    Sites accepting preference submissions
                  </p>
                </div>
                {!isMobile && openItems.length > 0 && (
                  <ScrollCarouselButtons
                    canScrollLeft={openCanScrollLeft}
                    canScrollRight={openCanScrollRight}
                    onScrollLeft={() =>
                      openScrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" })
                    }
                    onScrollRight={() =>
                      openScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" })
                    }
                    isMobile={isMobile}
                  />
                )}
              </div>
              {openItems.length === 0 ? (
                wishlistEmptyState === "all-closed" ? (
                  <WishlistHeroEmptyState
                    title="No open wishlists"
                    description="All current wishlist rotations are closed. You can still review previously closed items below."
                  />
                ) : (
                  <SectionEmptyState
                    icon="penToSquare"
                    title="No open wishlist items"
                    description="Sites you can submit preferences for will appear here."
                  />
                )
              ) : (
                renderCarousel(
                  openItems,
                  openScrollRef,
                  setOpenCanScrollLeft,
                  setOpenCanScrollRight,
                  updateOpenScroll
                )
              )}
            </div>
          </section>

          <section
            ref={closedRef}
            id="wishlist-closed"
            className="scroll-mt-20 pt-12"
            aria-labelledby="wishlist-closed-heading"
          >
            <div className="flex flex-col gap-8">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div>
                  <h3 id="wishlist-closed-heading" className="text-base md:text-lg font-bold">
                    Closed
                  </h3>
                  <p className="text-muted-foreground mt-0.5 text-sm md:text-base">
                    Sites with closed due dates — students already placed
                  </p>
                </div>
                {!isMobile && closedItems.length > 0 && (
                  <ScrollCarouselButtons
                    canScrollLeft={closedCanScrollLeft}
                    canScrollRight={closedCanScrollRight}
                    onScrollLeft={() =>
                      closedScrollRef.current?.scrollBy({ left: -scrollAmount, behavior: "smooth" })
                    }
                    onScrollRight={() =>
                      closedScrollRef.current?.scrollBy({ left: scrollAmount, behavior: "smooth" })
                    }
                    isMobile={isMobile}
                  />
                )}
              </div>
              {closedItems.length === 0 ? (
                <SectionEmptyState
                  icon="archive"
                  title="No closed wishlist items"
                  description="Sites with closed due dates and placed students will appear here."
                />
              ) : (
                renderCarousel(
                  closedItems,
                  closedScrollRef,
                  setClosedCanScrollLeft,
                  setClosedCanScrollRight,
                  updateClosedScroll
                )
              )}
            </div>
          </section>
        </div>
      </Tabs>
    </div>
  );
}
