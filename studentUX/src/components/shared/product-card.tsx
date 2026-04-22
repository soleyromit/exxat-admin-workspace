"use client";

import * as React from "react";

/** Illustration: items-start = align to top (keeps head visible), items-end = bottom (clips head) */
const ILLUSTRATION_ALIGN = "items-start";
/** object-position: "center top" = show head, "center bottom" = show feet */
const ILLUSTRATION_OBJECT_POSITION = "center top";
import { Card, CardContent } from "../ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { FontAwesomeIcon } from "../brand/font-awesome-icon";
import { cn } from "../ui/utils";

export interface ProductCardProps {
  imageSrc: string;
  imageAlt: string;
  imageClassName?: string;
  /** Inline style for image (overrides className for sizing) */
  imageStyle?: React.CSSProperties;
  aspectRatio?: number;
  badge?: React.ReactNode;
  /** Icon name (FontAwesome) to show before the title in the action section */
  actionIcon?: React.ComponentProps<typeof FontAwesomeIcon>["name"];
  title: string;
  titleClassName?: string;
  /** Count shown bold in description (e.g. "40K+ internship", "2k+ jobs") */
  count?: string;
  description: string;
  descriptionClassName?: string;
  /** "default" | "hero" — Hero layout: count on left, illustration on right (same container size) */
  illustrationLayout?: "default" | "hero";
  className?: string;
  /** On mobile, tapping opens a bottom sheet. Pass the sheet body here. */
  sheetContent?: React.ReactNode;
  /** On desktop, called when the card is clicked. */
  onClick?: () => void;
  isMobile: boolean;
  /** When true and isMobile, skip sheet and navigate directly via onClick (same as desktop). */
  skipSheetOnMobile?: boolean;
}

function CardBody({
  imageSrc,
  imageAlt,
  imageClassName,
  imageStyle,
  aspectRatio = 4 / 3,
  badge,
  actionIcon,
  title,
  titleClassName,
  count,
  description,
  descriptionClassName,
  illustrationLayout = "default",
  isMobile,
}: Omit<ProductCardProps, "className" | "sheetContent" | "onClick">) {
  return (
    <CardContent className={cn("flex flex-col min-h-0", isMobile ? "p-3 pb-2 gap-1.5" : "p-4 pb-3.5 gap-3")}>
      <div className="flex flex-col gap-0.5 shrink-0">
        <div className="flex items-center justify-between gap-1">
          <div className="flex items-center gap-2 min-w-0">
            {actionIcon && (
              <FontAwesomeIcon name={actionIcon} className={cn("shrink-0 text-foreground", isMobile ? "h-3 w-3" : "h-4 w-4")} weight="light" aria-hidden />
            )}
            <span className={cn("font-bold truncate", isMobile ? "text-sm" : "text-lg", titleClassName)}>{title}</span>
          </div>
          <FontAwesomeIcon name="arrowRight" className={cn("text-foreground shrink-0", isMobile ? "h-3 w-3" : "h-4 w-4")} weight="light" />
        </div>
        <p className={cn("text-muted-foreground line-clamp-2", "text-xs", descriptionClassName)}>
          {illustrationLayout !== "hero" && count ? (
            <>
              <span className="font-bold">{count}</span>
              {description && ` · ${description}`}
            </>
          ) : (
            description
          )}
        </p>
      </div>
      {/* Illustration container — same size for default and hero */}
      <div className={cn(
        "overflow-hidden rounded-lg md:rounded-xl bg-muted/50 flex-1 flex min-h-0 shrink-0",
        isMobile ? "pt-3 pb-2 px-3 min-h-[56px] h-[74px]" : "pt-8 pb-4 px-4 sm:min-h-[64px]",
        illustrationLayout === "hero" ? "flex-row items-center gap-4" : "flex justify-center",
        ILLUSTRATION_ALIGN
      )}>
        {illustrationLayout === "hero" && count && (
          <div className="flex flex-1 flex-col justify-center min-w-0 shrink-0">
            <span className={cn(
"page-title-sm leading-none tracking-tight"
            )}>
              {count}
            </span>
          </div>
        )}
        <div className={cn(
          "relative flex justify-center min-h-0 min-w-0",
          illustrationLayout === "hero" ? "flex-1 basis-0 shrink" : "w-full flex-1",
          ILLUSTRATION_ALIGN
        )}>
          <img
            src={imageSrc}
            alt={imageAlt}
            className={cn("max-w-full max-h-full object-contain object-center", imageClassName)}
            style={{ ...imageStyle, objectPosition: ILLUSTRATION_OBJECT_POSITION }}
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = "none";
            }}
          />
          {badge}
        </div>
      </div>
    </CardContent>
  );
}

export function ProductCard({
  className,
  sheetContent,
  onClick,
  isMobile,
  skipSheetOnMobile = false,
  ...bodyProps
}: ProductCardProps) {
  const body = <CardBody {...bodyProps} isMobile={isMobile} />;

  if (isMobile && !skipSheetOnMobile) {
    return (
      <Sheet>
        <SheetTrigger asChild>
          <Card className={className}>{body}</Card>
        </SheetTrigger>
        <SheetContent side="bottom" className="max-h-[90vh] overflow-y-auto rounded-t-2xl p-0">
          <SheetHeader className="sr-only">
            <SheetTitle>{bodyProps.title}</SheetTitle>
          </SheetHeader>
          {sheetContent ?? body}
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <Card
      className={cn(className, onClick && "cursor-pointer focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2")}
      role="button"
      tabIndex={onClick ? 0 : undefined}
      aria-label={onClick ? `Open ${bodyProps.title}` : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === "Enter" || e.key === " ") {
                e.preventDefault();
                onClick();
              }
            }
          : undefined
      }
    >
      {body}
    </Card>
  );
}
