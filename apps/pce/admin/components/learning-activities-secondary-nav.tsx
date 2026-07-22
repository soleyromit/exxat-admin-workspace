"use client"

/**
 * Learning activities secondary nav — hub modes + activity groups (Question bank pattern).
 */

import * as React from "react"
import { Link, useLocation, useSearchParams } from "react-router-dom"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { cn } from "@/lib/utils"
import type { LibraryFolder } from "@/lib/mock/library-folders"
import { useSecondaryPanel } from "@/components/sidebar"
import {
  SecondaryHubIconNavRow,
  SecondaryHubNavCompactShell,
  SecondaryHubNavRow,
  SecondaryHubNavSectionHeader,
  useSecondaryHubNavChrome,
} from "@/components/sidebar/secondary-hub-nav-primitives"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import { newFolderId } from "@/lib/mock/learning-activities-folders"
import {
  coerceLearningActivitiesNav,
  isLearningActivitiesFolderNavActive,
  isLearningActivitiesNavActive,
  laHubScopeHref,
  parseLearningActivitiesNav,
} from "@/lib/learning-activities-nav"

export function LearningActivitiesSecondaryNav() {
  const pathname = useLocation().pathname
  const [searchParams] = useSearchParams()
  const { openPanel, learningActivitiesFolderBridge } = useSecondaryPanel()
  const { showCompactRail, dismissNavFlyout } = useSecondaryHubNavChrome()

  const folders = learningActivitiesFolderBridge?.folders ?? []
  const onFoldersChange = learningActivitiesFolderBridge?.onFoldersChange
  const canManageFolders = learningActivitiesFolderBridge != null

  const nav = React.useMemo(
    () => coerceLearningActivitiesNav(parseLearningActivitiesNav(searchParams), folders),
    [folders, searchParams],
  )

  const [newFolderOpen, setNewFolderOpen] = React.useState(false)

  const folderTreeScopeActive = nav.scope === "folder" && nav.folderId != null

  const folderTreeRoots = React.useMemo(
    () =>
      folders
        .filter(f => f.parentId === null)
        .sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const flattenedFolderLinks = React.useMemo(() => {
    const out: LibraryFolder[] = []
    const walk = (folder: LibraryFolder) => {
      out.push(folder)
      folders
        .filter(c => c.parentId === folder.id)
        .sort((a, b) => a.name.localeCompare(b.name))
        .forEach(walk)
    }
    folderTreeRoots.forEach(walk)
    return out
  }, [folderTreeRoots, folders])

  const hubNavModals = (
    <LibraryNewFolderSheet
      open={newFolderOpen}
      onOpenChange={setNewFolderOpen}
      parentFolderId={null}
      descriptionText="Add a learning activity group to organize course offerings."
      onCreated={folder => {
        onFoldersChange?.(prev => [...prev, { ...folder, id: newFolderId() }])
        setNewFolderOpen(false)
      }}
    />
  )

  if (showCompactRail) {
    return (
      <>
        <SecondaryHubNavCompactShell
          ariaLabel="Learning activities"
          panelId="learning-activities"
          footer={
            canManageFolders ? (
              <div className="flex flex-col items-center border-t border-sidebar-border/60 px-1 py-2">
                <Tip label="Add group" side="right">
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className="icon-button-chrome size-9 shrink-0"
                    aria-label="Add group"
                    onClick={() => setNewFolderOpen(true)}
                  >
                    <i className="fa-light fa-plus text-md" aria-hidden="true" />
                  </Button>
                </Tip>
              </div>
            ) : null
          }
        >
          <SecondaryHubIconNavRow
            href={laHubScopeHref(pathname, searchParams, { mode: "courses", scope: "all", folderId: null })}
            active={isLearningActivitiesNavActive(pathname, nav, "courses", folders)}
            iconClass="fa-table-list"
            label="All courses"
            onClick={() => openPanel("learning-activities")}
          />
          <SecondaryHubIconNavRow
            href={laHubScopeHref(pathname, searchParams, { mode: "reports", scope: "all", folderId: null })}
            active={isLearningActivitiesNavActive(pathname, nav, "reports", folders)}
            iconClass="fa-chart-line"
            label="Reports"
            onClick={() => openPanel("learning-activities")}
          />
          <SecondaryHubIconNavRow
            href={laHubScopeHref(pathname, searchParams, {
              mode: "notifications",
              scope: "all",
              folderId: null,
            })}
            active={isLearningActivitiesNavActive(pathname, nav, "notifications", folders)}
            iconClass="fa-bell"
            label="Auto Notification"
            onClick={() => openPanel("learning-activities")}
          />
          <li className="flex w-full justify-center pt-1" role="none">
            <DropdownMenu>
              <Tip label="Learning activity groups" side="right">
                <DropdownMenuTrigger asChild>
                  <Button
                    type="button"
                    size="icon"
                    variant="ghost"
                    className={cn(
                      "size-9 shrink-0 text-sidebar-foreground",
                      folderTreeScopeActive &&
                        "bg-sidebar-accent text-sidebar-accent-foreground",
                    )}
                    aria-current={folderTreeScopeActive ? "page" : undefined}
                    aria-label="Learning activity groups"
                  >
                    <i className="fa-light fa-folder-tree text-md" aria-hidden="true" />
                  </Button>
                </DropdownMenuTrigger>
              </Tip>
              <DropdownMenuContent side="right" align="start" className="max-h-72 overflow-y-auto">
                {flattenedFolderLinks.length === 0 ? (
                  <div className="px-2 py-1.5 text-xs text-muted-foreground">No groups</div>
                ) : (
                  flattenedFolderLinks.map(folder => {
                    const href = laHubScopeHref(pathname, searchParams, {
                      mode: "courses",
                      scope: "folder",
                      folderId: folder.id,
                    })
                    const active = isLearningActivitiesFolderNavActive(
                      pathname,
                      nav,
                      folder.id,
                      folders,
                    )
                    return (
                      <DropdownMenuItem key={folder.id} asChild>
                        <Link
                          to={href}
                          className={cn(active && "bg-accent")}
                          onClick={() => {
                            openPanel("learning-activities")
                            dismissNavFlyout()
                          }}
                        >
                          {folder.name}
                        </Link>
                      </DropdownMenuItem>
                    )
                  })
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </li>
        </SecondaryHubNavCompactShell>
        {hubNavModals}
      </>
    )
  }

  return (
    <>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4" role="navigation" aria-label="Learning activities">
        <ul className="space-y-0.5">
          <SecondaryHubNavRow
            href={laHubScopeHref(pathname, searchParams, { mode: "courses", scope: "all", folderId: null })}
            active={isLearningActivitiesNavActive(pathname, nav, "courses", folders)}
            iconClass="fa-table-list"
            label="All courses"
            onClick={() => openPanel("learning-activities")}
          />
          <SecondaryHubNavRow
            href={laHubScopeHref(pathname, searchParams, { mode: "reports", scope: "all", folderId: null })}
            active={isLearningActivitiesNavActive(pathname, nav, "reports", folders)}
            iconClass="fa-chart-line"
            label="Reports"
          />
          <SecondaryHubNavRow
            href={laHubScopeHref(pathname, searchParams, {
              mode: "notifications",
              scope: "all",
              folderId: null,
            })}
            active={isLearningActivitiesNavActive(pathname, nav, "notifications", folders)}
            iconClass="fa-bell"
            label="Auto Notification"
          />
          <SecondaryHubNavSectionHeader
            label="Learning activity groups"
            action={
              <Tip label="Add group" side="right">
                <Button
                  type="button"
                  size="icon-xs"
                  variant="ghost"
                  className="icon-button-chrome shrink-0"
                  aria-label="Add group"
                  disabled={!onFoldersChange}
                  onClick={() => setNewFolderOpen(true)}
                >
                  <i className="fa-light fa-plus" aria-hidden="true" />
                </Button>
              </Tip>
            }
          />
          {folderTreeRoots.map(folder => (
            <SecondaryHubNavRow
              key={folder.id}
              href={laHubScopeHref(pathname, searchParams, {
                mode: "courses",
                scope: "folder",
                folderId: folder.id,
              })}
              active={isLearningActivitiesFolderNavActive(pathname, nav, folder.id, folders)}
              iconClass={folder.icon.startsWith("fa-") ? folder.icon : `fa-${folder.icon}`}
              label={folder.name}
              onClick={() => openPanel("learning-activities")}
            />
          ))}
        </ul>
      </div>
      {hubNavModals}
    </>
  )
}
