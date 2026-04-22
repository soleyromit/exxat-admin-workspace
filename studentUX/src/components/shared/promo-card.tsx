"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Button } from "../ui/button";
import { cn } from "../ui/utils";

export interface PromoCardProps {
  title: string;
  /** Called when the "Explore Now" button is clicked */
  onExplore: () => void;
  /** Override the CTA label. Defaults to "Explore Now" */
  exploreLabel?: string;
  /** Illustration image source for bottom-right corner */
  bottomRightBgSrc?: string;
  className?: string;
}

export function PromoCard({
  title,
  onExplore,
  exploreLabel = "Explore Now",
  bottomRightBgSrc,
  className,
}: PromoCardProps) {
  return (
    <Card className={cn("relative flex flex-col flex-1 min-w-0 h-[300px] overflow-hidden rounded-2xl border-border bg-card", className)}>
      {bottomRightBgSrc && (
        <div className="absolute inset-0 flex items-end justify-end overflow-hidden pointer-events-none">
          <img
            src={bottomRightBgSrc}
            alt=""
            aria-hidden
            className="opacity-40 block"
            style={{
              height: "fit-content",
              width: "fit-content",
              maxWidth: "100%",
              objectFit: "contain",
              objectPosition: "right bottom",
            }}
          />
        </div>
      )}
      <CardContent className="relative z-10 p-6 flex flex-1 flex-col gap-4 overflow-hidden min-h-0">
        <p className="page-title leading-normal flex-1 min-h-0 overflow-hidden line-clamp-3">{title}</p>
        <div className="flex items-end justify-between gap-3 mt-auto min-w-0">
          <Button
            variant="default"
            size="sm"
            className="min-w-0 overflow-hidden"
            onClick={onExplore}
          >
            <span className="truncate">{exploreLabel}</span>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
