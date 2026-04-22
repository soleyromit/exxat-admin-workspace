import * as React from "react";
import { cn } from "@/components/ui/utils";

export interface BuildProfilePageTemplateProps {
  /** Main heading text */
  title: string;
  /** Subtitle or description below the heading (optional) */
  description?: string;
  /** Page content (e.g. collapsible cards, forms) */
  children: React.ReactNode;
  /** Max width of content area (default: 520) */
  contentMaxWidth?: number;
  /** Additional class names on the root container */
  className?: string;
}

/**
 * BuildProfilePageTemplate — Dedicated layout for the "Choose how to build your profile" flow.
 * Single-column, centered content with sidebar background. Use for build-profile step only.
 */
export function BuildProfilePageTemplate({
  title,
  description,
  children,
  contentMaxWidth = 520,
  className,
}: BuildProfilePageTemplateProps) {
  return (
    <div
      className={cn(
        "build-profile-page-template min-w-0 min-h-0 flex flex-1 flex-col p-6 md:p-8 bg-sidebar text-sidebar-foreground",
        className
      )}
    >
      <div className="flex flex-1 flex-col justify-center min-h-0 w-full py-8 md:py-10">
        <div
          className="flex flex-col max-w-full items-center gap-6 w-full mx-auto"
          style={{ maxWidth: `${contentMaxWidth}px` }}
        >
          <div className="flex flex-col gap-4 md:gap-6 min-w-0 w-full">
            {title ? <h1 className="page-title-sm text-inherit">{title}</h1> : null}
            {description ? (
              <p className="text-base md:text-lg leading-6 text-sidebar-foreground/80">
                {description}
              </p>
            ) : null}
            <div className="flex flex-col gap-6 w-full" data-slot="build-profile-content">
              {children}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
