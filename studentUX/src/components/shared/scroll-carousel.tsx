"use client";

import * as React from "react";
import { Button } from "../ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";

/** Consistent gap between carousel cards across all sections */
export const CAROUSEL_GAP = 24;

/** Scroll container classes — use across Jobs, Home career, promo sections. Add -mx-10 px-10 for edge bleed. */
export const SCROLL_CAROUSEL_CLASSES =
  "overflow-x-auto pb-2 snap-x snap-mandatory w-full [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden";

/** Inner flex container — items-stretch for consistent card height in each row */
export const SCROLL_CAROUSEL_INNER_CLASSES = "flex snap-x items-stretch";

/** Circular scroll buttons — size-8 (32px), desktop only. Use with ScrollCarouselButtons. */
export function ScrollCarouselButtons({
  canScrollLeft = false,
  canScrollRight = true,
  onScrollLeft,
  onScrollRight,
  isMobile = false,
}: {
  canScrollLeft?: boolean;
  canScrollRight?: boolean;
  onScrollLeft?: () => void;
  onScrollRight?: () => void;
  isMobile?: boolean;
}) {
  if (isMobile || !onScrollLeft || !onScrollRight) return null;

  return (
    <div className="flex shrink-0 gap-2">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full shrink-0 aspect-square"
            onClick={onScrollLeft}
            disabled={!canScrollLeft}
            aria-label="Scroll left"
          >
            <FontAwesomeIcon name="chevronLeft" className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Scroll left</TooltipContent>
      </Tooltip>
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="outline"
            size="icon"
            className="size-8 rounded-full shrink-0 aspect-square"
            onClick={onScrollRight}
            disabled={!canScrollRight}
            aria-label="Scroll right"
          >
            <FontAwesomeIcon name="chevronRight" className="h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </TooltipTrigger>
        <TooltipContent side="bottom">Scroll right</TooltipContent>
      </Tooltip>
    </div>
  );
}
