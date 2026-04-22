"use client";

import * as React from "react";
import { Badge } from "../ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs";
import { cn } from "../ui/utils";

export interface ReportPageViewConfig {
  name: string;
  count?: string;
  id: string;
  icon?: React.ReactNode;
  /** Optional short description (e.g. for tooltip or subtitle) */
  description?: string;
}

export interface ReportPageTemplateProps {
  /** Page title */
  title: string;
  /** Page description */
  description: string;
  /** Optional elements to the right of the title (e.g. Export, Generate Report) */
  headerActions?: React.ReactNode;
  /** Tab configuration */
  views: ReportPageViewConfig[];
  activeTab: string;
  onTabChange: (tab: string) => void;
  /** Render tab content */
  renderTabContent: (tabId: string) => React.ReactNode;
  /** Optional content in toolbar (right of tabs), e.g. search */
  toolbarActions?: React.ReactNode;
  /** Additional class names */
  className?: string;
}

/**
 * ReportPageTemplate — For report-style pages with tabs and dashboard content.
 * No top key metrics (Total Active Students, etc.). Header + tabs + scrollable content.
 * Use for Reports, Analytics, and similar content-heavy pages.
 */
export function ReportPageTemplate({
  title,
  description,
  headerActions,
  views,
  activeTab,
  onTabChange,
  renderTabContent,
  toolbarActions,
  className,
}: ReportPageTemplateProps) {
  return (
    <div
      className={cn(
        "report-page-container flex flex-col flex-1 min-h-0 max-w-full overflow-hidden",
        className
      )}
    >
      <div className="flex-1 min-h-0 overflow-auto pb-6">
        {/* Header */}
        <div className="flex-none px-4 lg:px-6 pt-4 lg:pt-6 space-y-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="page-title-sm">{title}</h1>
              <p className="text-muted-foreground mt-1">{description}</p>
            </div>
            {headerActions}
          </div>
        </div>

        {/* Tabs — same pattern as Student Schedule, Slots, Wishlist */}
        <div className="flex-none flex items-center justify-between gap-4 p-4">
          <div className="min-w-0 flex-1 overflow-x-auto scrollbar-none">
            <Tabs value={activeTab} onValueChange={onTabChange}>
              <TabsList className="flex-nowrap w-max">
                {views.map((view) => (
                  <TabsTrigger key={view.id} value={view.id} className="flex-shrink-0">
                    <div className="flex items-center gap-2">
                      {view.icon}
                      <span>{view.name}</span>
                      {view.count != null && (
                        <Badge variant="secondary" className="h-4 px-1.5">
                          {view.count}
                        </Badge>
                      )}
                    </div>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          {toolbarActions}
        </div>

        {/* Tab Content — sections provide their own px-4 lg:px-6 */}
        <div className="flex flex-col">
          <Tabs value={activeTab} onValueChange={onTabChange}>
            {views.map((view) => (
              <TabsContent key={view.id} value={view.id} className="m-0 pt-6">
                {renderTabContent(view.id)}
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    </div>
  );
}
