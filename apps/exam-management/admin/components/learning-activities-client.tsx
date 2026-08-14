"use client"

/**
 * Learning activities hub — secondary panel scope + course offerings table.
 */

import * as React from "react"
import {
  ListPageTemplate,
  type ViewTab,
} from "@/components/data-views"
import { ExportDrawer } from "@/components/export-drawer"
import { PageHeader } from "@/components/page-header"
import { SecondaryPanelHubTemplate } from "@/components/templates/secondary-panel-hub-template"
import { LearningActivitiesTable } from "@/components/learning-activities-table"
import { LearningActivitiesFolderBridge } from "@/components/sidebar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { useProduct } from "@/contexts/product-context"
import { productPersistKey } from "@/stores/app-store"
import { useLearningActivitiesHubNav } from "@/hooks/use-learning-activities-hub-nav"
import { DEFAULT_LEARNING_ACTIVITY_GROUPS } from "@/lib/mock/learning-activities-folders"
import { LEARNING_ACTIVITY_OFFERINGS } from "@/lib/mock/learning-activities-offerings"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import {
  filterOfferingsByNav,
  laHubHeaderModel,
  laRouteHref,
} from "@/lib/learning-activities-nav"

const DEFAULT_TABS: ViewTab[] = [
  {
    id: "course-offerings",
    label: "Course offerings",
    viewType: "table",
    icon: "fa-table",
    filterId: "all",
  },
]

function ModePlaceholder({ title, description }: { title: string; description: string }) {
  return (
    <div
      className="flex min-h-[40vh] flex-col items-center justify-center rounded-2 border border-dashed border-border bg-card/40 px-6 py-12 text-center"
      role="status"
    >
      <span
        aria-hidden="true"
        className="mb-4 flex size-12 items-center justify-center rounded-full bg-secondary-panel-bg text-xl text-brand"
      >
        <i className="fa-light fa-compass-drafting" />
      </span>
      <p className="max-w-md text-sm text-muted-foreground">{description}</p>
    </div>
  )
}

export function LearningActivitiesClient() {
  const { product, customProducts, activeCustomIndex } = useProduct()
  const persistKey = productPersistKey(product, "learning-activities", customProducts, activeCustomIndex)
  const [folders, setFolders] = React.useState<LibraryFolder[]>(() =>
    DEFAULT_LEARNING_ACTIVITY_GROUPS.map(f => ({ ...f })),
  )
  const [offerings] = React.useState(() => LEARNING_ACTIVITY_OFFERINGS.map(o => ({ ...o })))
  const [exportOpen, setExportOpen] = React.useState(false)

  const { navState, hubBasePath } = useLearningActivitiesHubNav(folders)

  const filteredRows = React.useMemo(
    () => filterOfferingsByNav(offerings, folders, navState),
    [folders, navState, offerings],
  )

  const hubHeader = React.useMemo(
    () => laHubHeaderModel(folders, navState),
    [folders, navState],
  )

  const siteHeader = React.useMemo(
    () => ({
      title: hubHeader.title,
      breadcrumbs: hubHeader.breadcrumbs?.map(crumb => ({
        ...crumb,
        href: crumb.href ? laRouteHref(crumb.href, hubBasePath) : undefined,
      })),
    }),
    [hubBasePath, hubHeader.breadcrumbs, hubHeader.title],
  )

  const renderBody = () => {
    if (navState.mode === "reports") {
      return (
        <ModePlaceholder
          title="Reports"
          description="Learning activity reports are not built in this workspace yet. Wire report surfaces here when ready."
        />
      )
    }
    if (navState.mode === "notifications") {
      return (
        <ModePlaceholder
          title="Auto Notification"
          description="Auto notification rules for learning activities are not built in this workspace yet."
        />
      )
    }
    return <LearningActivitiesTable rows={filteredRows} persistKey={persistKey} hubBasePath={hubBasePath} />
  }

  return (
    <>
      <LearningActivitiesFolderBridge folders={folders} onFoldersChange={setFolders} />
      <SecondaryPanelHubTemplate siteHeader={siteHeader}>
        <ListPageTemplate
          defaultTabs={DEFAULT_TABS}
          hideViewsToolbar
          defaultShowMetrics={false}
          supportedViewTypes={["table"]}
          getTabCount={() => filteredRows.length}
          header={
            <PageHeader
              title={hubHeader.title}
              subtitle="Set up, distribute, review, and grade course-related activities."
              actions={
                <DropdownMenu>
                  <Tip side="bottom" label="More actions">
                    <DropdownMenuTrigger asChild>
                      <Button type="button" size="icon-lg" variant="outline" aria-label="More actions">
                        <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                  </Tip>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onSelect={() => setExportOpen(true)}>
                      <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                      Export
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              }
            />
          }
          renderContent={() => renderBody()}
        />
      </SecondaryPanelHubTemplate>
      <ExportDrawer
        open={exportOpen}
        onOpenChange={setExportOpen}
        totalRows={filteredRows.length}
      />
    </>
  )
}
