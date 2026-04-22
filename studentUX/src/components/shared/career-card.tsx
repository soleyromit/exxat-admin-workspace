"use client";

import * as React from "react";
import { Card, CardContent } from "../ui/card";
import { Tooltip, TooltipContent, TooltipTrigger } from "../ui/tooltip";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";

export interface CareerCardProps {
  imageSrc: string;
  imageAlt: string;
  title: string;
  readTime: string;
  onSave?: () => void;
  onClick?: () => void;
  className?: string;
}

export function CareerCard({
  imageSrc,
  imageAlt,
  title,
  readTime,
  onSave,
  onClick,
  className,
}: CareerCardProps) {
  return (
    <Card
      className={cn(
        "min-w-0 shrink-0 overflow-hidden rounded-2xl border-border bg-card",
        "hover:shadow-md hover:-translate-y-0.5 transition-all duration-200",
        onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        className
      )}
      role={onClick ? "button" : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={onClick ? (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onClick(); } } : undefined}
    >
      <CardContent className="flex flex-col gap-3 p-4 pb-4">
        <div
          className="w-full shrink-0 overflow-hidden rounded-xl bg-muted/50"
          style={{ height: 110 }}
        >
          <img
            src={imageSrc}
            alt={imageAlt}
            style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
        </div>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <FontAwesomeIcon name="clock" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
            <span className="text-xs text-muted-foreground">{readTime}</span>
          </div>
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                type="button"
                aria-label="Save article"
                className="min-h-11 min-w-11 md:min-h-0 md:min-w-0 md:size-5 shrink-0 p-0 text-muted-foreground hover:text-foreground transition-colors touch-manipulation flex items-center justify-center"
                onClick={(e) => {
                  e.stopPropagation();
                  onSave?.();
                }}
              >
                <FontAwesomeIcon name="bookmark" className="h-3.5 w-3.5" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="bottom">Save article</TooltipContent>
          </Tooltip>
        </div>
        <h3 className="font-semibold text-sm leading-snug text-foreground line-clamp-3">{title}</h3>
      </CardContent>
    </Card>
  );
}
