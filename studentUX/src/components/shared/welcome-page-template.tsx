import * as React from "react";
import { cn } from "@/components/ui/utils";

/** Background variant for the welcome page template */
export type WelcomePageBackgroundVariant =
  | "sidebar"
  | "background"
  | "muted";

/** Header typography variant */
export type WelcomePageHeaderVariant =
  | "hero"
  | "page-title"
  | "page-title-sm";

const BACKGROUND_CLASSES: Record<WelcomePageBackgroundVariant, string> = {
  sidebar: "bg-sidebar text-sidebar-foreground",
  background: "bg-background text-foreground",
  muted: "bg-muted text-foreground",
};

const HEADER_CLASSES: Record<WelcomePageHeaderVariant, string> = {
  hero: "hero-header",
  "page-title": "page-title",
  "page-title-sm": "page-title-sm",
};

const DESCRIPTION_OPACITY: Record<WelcomePageBackgroundVariant, string> = {
  sidebar: "text-sidebar-foreground/80",
  background: "text-muted-foreground",
  muted: "text-muted-foreground",
};

export interface WelcomePageTemplateProps {
  /** Main heading text */
  title: string;
  /** Subtitle or description below the heading */
  description: string;
  /** Background variant — sidebar (brand), background (neutral), or muted */
  background?: WelcomePageBackgroundVariant;
  /** Header typography — hero (40px), page-title (32px), or page-title-sm (24px) */
  headerVariant?: WelcomePageHeaderVariant;
  /** Primary and secondary actions (e.g. buttons) */
  children: React.ReactNode;
  /** Illustration or image for the right column (required for two-column layout) */
  illustration?: React.ReactNode;
  /** Additional class names on the root container */
  className?: string;
}

/**
 * WelcomePageTemplate — Reusable layout for welcome/landing-style pages.
 * Two-column layout: content left, illustration right. Use for onboarding and first-time user flows.
 */
export function WelcomePageTemplate({
  title,
  description,
  background = "sidebar",
  headerVariant = "hero",
  children,
  illustration,
  className,
}: WelcomePageTemplateProps) {
  const bgClasses = BACKGROUND_CLASSES[background];
  const headerClass = HEADER_CLASSES[headerVariant];
  const descOpacity = DESCRIPTION_OPACITY[background];

  return (
    <div
      className={cn(
        "welcome-page-template min-w-0 min-h-0 flex flex-1 flex-col p-6 md:p-8",
        bgClasses,
        className
      )}
    >
      <div className="content-rail @container/main flex flex-1 flex-col justify-center min-h-0 w-full py-8 md:py-10">
        <div className="flex flex-row gap-8 md:gap-12 lg:gap-20 min-h-[min(400px,55vh)] md:min-h-[min(500px,65vh)] w-full mx-auto items-center md:pr-0">
          {/* Left column: Content */}
          <div className="flex flex-col gap-4 md:gap-6 min-w-0 flex-[0_1_360px]">
            <h1 className={cn(headerClass, "text-inherit")}>{title}</h1>
            {description ? (
              <p className={cn("text-base md:text-lg leading-6", descOpacity)}>
                {description}
              </p>
            ) : null}
            <div
              className="flex flex-col sm:flex-row gap-4 sm:gap-10 items-start"
              data-slot="welcome-actions"
            >
              {children}
            </div>
          </div>

          {/* Right column: Illustration */}
          {illustration ? (
            <div
              data-slot="welcome-illustration"
              className="flex flex-1 items-center justify-center md:justify-end min-h-[200px] md:min-h-[300px] min-w-0 shrink"
            >
              {illustration}
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
