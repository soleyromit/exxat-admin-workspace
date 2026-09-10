"use client"

/**
 * **Tree view** — `ListPageTreePanelShell` + outline tree + read-only details (`FolderDetailsShell`).
 * Hub wiring (folders, mock sheet) stays in the caller; this module hosts library demo wiring only.
 */

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Collapsible, CollapsibleTrigger } from "@/components/ui/collapsible"
import { Tip } from "@/components/ui/tip"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import { cn } from "@/lib/utils"
import {
  OutlineTreeCollapsibleContentRail,
  OutlineTreeLeafButton,
  OutlineTreeMenu,
  OutlineTreeMenuItem,
  OutlineTreeSub,
  OutlineTreeSubItem,
} from "@/components/data-views/outline-tree-menu"
import { ListPageTreePanelShell } from "@/components/data-views/list-page-tree-panel-shell"
import { LIST_PAGE_SPLIT_MILLER_SCROLL_BODY_CLASS } from "@/components/data-views/list-page-split-hub-tokens"
import { ListPageSplitDetailsPlaceholder } from "@/components/data-views/list-page-split-details-placeholder"
import { ListPageTreeColumnHeader } from "@/components/data-views/list-page-tree-column-header"
import { LibraryNewFolderSheet } from "@/components/library-new-folder-sheet"
import type {
  LibraryItem,
} from "@/lib/mock/library"
import type { LibraryFolder, LibraryFolderColorKey } from "@/lib/mock/library-folders"
import { FolderDetailsShell } from "@/components/folder-details-shell"
import { LibraryQuestionDetailBody } from "@/components/library-question-detail"

// ============================================================================
// TreeItem — recursive folder/question renderer using Collapsible
// ============================================================================

interface TreeItemProps {
  folder: LibraryFolder
  folders: LibraryFolder[]
  questions: LibraryItem[]
  selectedItemId: string | null
  onSelectItem: (itemId: string) => void
}

function TreeItem({
  folder,
  folders,
  questions,
  selectedItemId,
  onSelectItem,
}: TreeItemProps) {
  const childFolders = folders
    .filter(f => f.parentId === folder.id)
    .sort((a, b) => a.name.localeCompare(b.name))
  const childQuestions = questions
    .filter(q => q.folderId === folder.id)

  const hasChildren = childFolders.length > 0 || childQuestions.length > 0
  const isFolderSelected = selectedItemId === folder.id

  return (
    <Collapsible className="group/collapsible">
      {/* Folder row — chevron column + row body (icons align with shadcn tree pattern) */}
      <div
        className={cn(
          "flex min-h-8 items-center rounded-md px-2 hover:bg-muted/50",
          isFolderSelected && "bg-accent text-accent-foreground",
        )}
      >
        {hasChildren ? (
          <CollapsibleTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              className="icon-button-chrome"
              aria-label={folder.name ? `${folder.name} — expand or collapse` : "Expand or collapse folder"}
            >
              <i
                className="fa-light fa-chevron-right shrink-0 text-xs leading-none transition-transform duration-150 group-data-[state=open]/collapsible:rotate-90"
                aria-hidden="true"
              />
            </Button>
          </CollapsibleTrigger>
        ) : (
          <div className="size-8 shrink-0" aria-hidden />
        )}

        <Button
          type="button"
          variant="ghost"
          onClick={() => onSelectItem(folder.id)}
          className={cn(
            "h-auto min-w-0 flex-1 justify-start gap-2 py-1.5 pe-3 text-left text-sm",
            !isFolderSelected && "text-foreground",
          )}
          aria-selected={isFolderSelected}
          role="option"
        >
          <i
            className={cn(
              "fa-light fa-folder shrink-0 text-xs leading-none",
              isFolderSelected ? "fa-solid opacity-80" : "text-muted-foreground",
            )}
            aria-hidden="true"
          />
          <span className="truncate leading-tight">{folder.name}</span>
          {hasChildren && (
            <span className="ms-auto shrink-0 text-xs tabular-nums text-muted-foreground">
              {childFolders.length + childQuestions.length}
            </span>
          )}
        </Button>
      </div>

      {hasChildren && (
        <OutlineTreeCollapsibleContentRail>
          <OutlineTreeSub surface="panel" guideLayout="chevronRail">
            {childFolders.map(child => (
              <OutlineTreeMenuItem key={child.id}>
                <TreeItem
                  folder={child}
                  folders={folders}
                  questions={questions}
                  selectedItemId={selectedItemId}
                  onSelectItem={onSelectItem}
                />
              </OutlineTreeMenuItem>
            ))}
            {childQuestions.map(question => {
              const isSelected = selectedItemId === question.id
              return (
                <OutlineTreeSubItem key={question.id}>
                  <OutlineTreeLeafButton
                    surface="panel"
                    isActive={isSelected}
                    onClick={() => onSelectItem(question.id)}
                    aria-selected={isSelected}
                    role="option"
                    className="h-auto min-h-8 items-start py-1.5"
                  >
                    <i
                      className={cn(
                        "fa-light fa-file mt-0.5 shrink-0 text-xs leading-none",
                        isSelected ? "fa-solid opacity-80" : "text-muted-foreground",
                      )}
                      aria-hidden="true"
                    />
                    <span className="min-w-0 flex-1 text-left">
                      <span className="block truncate leading-tight">{question.stem}</span>
                      <span className="block truncate font-mono text-xs text-muted-foreground">
                        {question.questionId}
                      </span>
                    </span>
                  </OutlineTreeLeafButton>
                </OutlineTreeSubItem>
              )
            })}
          </OutlineTreeSub>
        </OutlineTreeCollapsibleContentRail>
      )}
    </Collapsible>
  )
}

// ============================================================================
// DetailsPanel — right panel content (folder or question details)
// ============================================================================

interface DetailsPanelProps {
  selectedItemId: string | null
  folders: LibraryFolder[]
  questions: LibraryItem[]
  /** Clears tree selection (header dismiss). */
  onClearSelection?: () => void
}

function DetailsPanel({ selectedItemId, folders, questions, onClearSelection }: DetailsPanelProps) {
  if (!selectedItemId) {
    return (
      <ListPageSplitDetailsPlaceholder title="Nothing selected" />
    )
  }

  const folder = folders.find(f => f.id === selectedItemId)
  if (folder) {
    return (
      <FolderDetailsShell
        folder={folder}
        folders={folders}
        questions={questions}
        onClearSelection={onClearSelection}
      />
    )
  }

  const question = questions.find(q => q.id === selectedItemId)
  if (question) {
    return (
      <div className="flex flex-col bg-card">
        <header className="sticky top-(--shell-utility-bar-height) z-20 isolate shrink-0 border-b border-border/60 bg-card px-4 pb-4 pt-3">
          <div className="flex items-start justify-between gap-3">
            <p className="font-mono text-xs text-muted-foreground">{question.questionId}</p>
            {onClearSelection ? (
              <Tip label="Close details" side="bottom">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  className="shrink-0 text-muted-foreground hover:text-foreground"
                  onClick={onClearSelection}
                  aria-label="Close details"
                >
                  <i className="fa-light fa-xmark text-xs leading-none" aria-hidden="true" />
                </Button>
              </Tip>
            ) : null}
          </div>
          <h2 className="mt-3 text-lg font-semibold leading-snug tracking-tight text-foreground">{question.stem}</h2>
          <div className="mt-3 flex flex-wrap gap-2">
            <Tip label="Opens the full editor when your bank workflow is connected." side="bottom">
              <span className="inline-flex">
                <Button type="button" size="sm" className="gap-1.5 shadow-sm" disabled>
                  <i className="fa-light fa-pencil text-xs leading-none" aria-hidden="true" />
                  Edit question
                </Button>
              </span>
            </Tip>
            <Tip label="Revert connects when your assessments API is wired." side="bottom">
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
                  <i className="fa-light fa-hourglass text-xs leading-none" aria-hidden="true" />
                  Revert to draft
                </Button>
              </span>
            </Tip>
            <Tip label="Move question connects when folder APIs are wired." side="bottom">
              <span className="inline-flex">
                <Button type="button" variant="outline" size="sm" className="gap-1.5" disabled>
                  <i className="fa-light fa-right-left text-xs leading-none" aria-hidden="true" />
                  Move
                </Button>
              </span>
            </Tip>
          </div>
        </header>

        <LibraryQuestionDetailBody question={question} folders={folders} />
      </div>
    )
  }

  return (
    <div className="flex h-full min-h-0 flex-col items-center justify-center bg-card px-6 py-10 text-center text-muted-foreground">
      <div className="mb-3 flex size-12 items-center justify-center rounded-xl border border-border/60 bg-card">
        <i className="fa-light fa-file text-2xl leading-none opacity-50" aria-hidden="true" />
      </div>
      <p className="text-sm font-medium text-foreground">Item not found</p>
      <p className="mt-1 max-w-[14rem] text-xs leading-relaxed text-muted-foreground">
        This selection is no longer in the tree. Choose another folder or question.
      </p>
    </div>
  )
}

// ============================================================================
// HubTreePanelView — tree + details wiring (library demo; reusable shell above)
// ============================================================================

export interface HubTreePanelViewProps {
  items: LibraryItem[]
  folders: LibraryFolder[]
  onItemsChange: (items: LibraryItem[]) => void
  onFoldersChange: (folders: LibraryFolder[]) => void
}

export function HubTreePanelView({
  items,
  folders,
  onFoldersChange,
}: HubTreePanelViewProps) {
  const [selectedItemId, setSelectedItemId] = React.useState<string | null>(null)
  const [newFolderOpen, setNewFolderOpen] = React.useState(false)
  const [newFolderParentId, setNewFolderParentId] = React.useState<string | null>(null)
  const [customizingFolder, setCustomizingFolder] = React.useState<LibraryFolder | null>(null)

  const rootFolders = React.useMemo(
    () => folders.filter(f => f.parentId === null).sort((a, b) => a.name.localeCompare(b.name)),
    [folders],
  )

  const handleNewFolderCreated = React.useCallback(
    (newFolder: { name: string; icon: string; colorKey: LibraryFolderColorKey; parentId: string | null }) => {
      if (customizingFolder) {
        onFoldersChange(
          folders.map(f =>
            f.id === customizingFolder.id
              ? { ...f, name: newFolder.name, icon: newFolder.icon, colorKey: newFolder.colorKey }
              : f,
          ),
        )
        setCustomizingFolder(null)
      } else {
        onFoldersChange([
          ...folders,
          {
            id: `fld-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`,
            name: newFolder.name,
            icon: newFolder.icon,
            colorKey: newFolder.colorKey,
            parentId: newFolder.parentId,
          },
        ])
      }
      setNewFolderOpen(false)
    },
    [customizingFolder, folders, onFoldersChange],
  )

  return (
    <>
      <ListPageTreePanelShell
        resizableGroupId="hub-tree-panel"
        ariaLabel="Folder tree and details"
        tree={
          <>
            <ListPageTreeColumnHeader
              title="Questions"
              trailing={
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon-sm"
                      variant="ghost"
                      onClick={() => {
                        setNewFolderParentId(null)
                        setCustomizingFolder(null)
                        setNewFolderOpen(true)
                      }}
                      aria-label="Add folder"
                    >
                      <i className="fa-light fa-folder-plus text-xs" aria-hidden="true" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="top" sideOffset={4}>
                    Add folder
                  </TooltipContent>
                </Tooltip>
              }
            />

            <div className={cn(LIST_PAGE_SPLIT_MILLER_SCROLL_BODY_CLASS, "py-1")}>
            <OutlineTreeMenu
              className="w-full"
              role="listbox"
              aria-label="Folder tree"
            >
              {rootFolders.length === 0 ? (
                <li className="list-none px-3 py-4 text-sm text-muted-foreground">No folders</li>
              ) : (
                rootFolders.map(folder => (
                  <OutlineTreeMenuItem key={folder.id}>
                    <TreeItem
                      folder={folder}
                      folders={folders}
                      questions={items}
                      selectedItemId={selectedItemId}
                      onSelectItem={setSelectedItemId}
                    />
                  </OutlineTreeMenuItem>
                ))
              )}
            </OutlineTreeMenu>
            </div>
          </>
        }
        details={
          <DetailsPanel
            selectedItemId={selectedItemId}
            folders={folders}
            questions={items}
            onClearSelection={() => setSelectedItemId(null)}
          />
        }
      />

      <LibraryNewFolderSheet
        open={newFolderOpen}
        onOpenChange={setNewFolderOpen}
        parentFolderId={customizingFolder?.parentId ?? newFolderParentId}
        customizingFolder={customizingFolder}
        onCreated={handleNewFolderCreated}
      />
    </>
  )
}
