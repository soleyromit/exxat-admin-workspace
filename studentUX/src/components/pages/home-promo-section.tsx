"use client";

import * as React from "react";
import { useAppStore } from "../../stores/app-store";
import { PromoCard } from "../shared/promo-card";
import { useIsDesktop } from "../ui/use-mobile";
import {
  CAROUSEL_GAP,
  SCROLL_CAROUSEL_CLASSES,
  SCROLL_CAROUSEL_INNER_CLASSES,
} from "../shared/scroll-carousel";

const PROMO_CARDS = [
  {
    id: "jobs",
    title: "56% of students land jobs while interning!",
    onExplore: () => useAppStore.getState().navigateToPage("Internship"),
  },
  {
    id: "entry-level",
    title: "More than 100+ sites seek students like you for entry-level jobs!",
    onExplore: () => useAppStore.getState().navigateToPage("Jobs"),
  },
  {
    id: "internships",
    title: "40K+ Placement opportunities across 230+ sites",
    onExplore: () => useAppStore.getState().navigateToPage("Internship"),
  },
] as const;

const CARD_WIDTH = 300;

export function HomePromoSection() {
  const isDesktop = useIsDesktop();

  if (!isDesktop) {
    return (
      <div className="" style={{ width: "calc(50vw + 50%)", marginLeft: 0 }}>
        <div className={SCROLL_CAROUSEL_CLASSES}>
          <div
            className={SCROLL_CAROUSEL_INNER_CLASSES}
            style={{ gap: CAROUSEL_GAP }}
          >
            {PROMO_CARDS.map((card) => (
              <div
                key={card.id}
                className="snap-start shrink-0 flex flex-col"
                style={{ width: CARD_WIDTH, minWidth: CARD_WIDTH }}
              >
                <PromoCard
                  title={card.title}
                  onExplore={card.onExplore}
                />
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 lg:gap-10 w-full">
      {PROMO_CARDS.map((card) => (
        <PromoCard
          key={card.id}
          title={card.title}
          onExplore={card.onExplore}
        />
      ))}
    </div>
  );
}
