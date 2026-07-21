"use client"

/**
 * Shared “new folder” floating sheet (same shell as Export) — used by OS folder grid and column panel.
 */

import * as React from "react"
import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelHeader,
  FloatingSheetPanelWorkflowFooter,
} from "@/lib/floating-sheet-panel"
import { cn } from "@/lib/utils"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  LIBRARY_FOLDER_COLOR_STYLES,
  LIBRARY_FOLDER_ICON_OPTIONS,
  type LibraryFolderColorKey,
} from "@/lib/mock/library-folders"
import { OsFolderGlyph } from "@/components/data-views/os-folder-glyph"

const COLOR_OPTIONS: LibraryFolderColorKey[] = [
  "brand",
  "success",
  "warning",
  "destructive",
  "muted",
  "chart1",
  "chart2",
  "chart3",
]

function FolderTilePreview({
  name,
  colorKey,
  icon,
  className,
}: {
  name: string
  colorKey: LibraryFolderColorKey
  icon: string
  className?: string
}) {
  const display = name.trim() || "Untitled"
  return (
    <div
      className={cn(
        "flex flex-col items-center gap-4 rounded-2xl border border-border/80 bg-muted/20 p-6 shadow-sm",
        className,
      )}
    >
      <OsFolderGlyph
        colorKey={colorKey}
        icon={icon}
        size="lg"
        decorative={false}
        label={`Folder preview: ${display}`}
      />
      <p className="line-clamp-2 min-h-[2.5rem] w-full text-center text-sm font-medium text-foreground">
        {display}
      </p>
    </div>
  )
}

export interface LibraryNewFolderSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Parent folder id for the new folder (`null` = top level). */
  parentFolderId: string | null
  /** Replaces default helper copy under the title. */
  descriptionText?: string
  /** When provided, the sheet is in "customize" mode with these initial values. */
  customizingFolder?: {
    name: string
    icon: string
    colorKey: LibraryFolderColorKey
    parentId: string | null
  } | null
  onCreated: (folder: {
    name: string
    icon: string
    colorKey: LibraryFolderColorKey
    parentId: string | null
  }) => void
}

export function LibraryNewFolderSheet({
  open,
  onOpenChange,
  parentFolderId,
  customizingFolder,
  descriptionText = "Name, color, and icon update the preview. The folder is created in the location shown in the breadcrumb above the grid.",
  onCreated,
}: LibraryNewFolderSheetProps) {
  const [draft, setDraft] = React.useState<{
    name: string
    colorKey: LibraryFolderColorKey
    icon: string
  }>({ name: "Untitled", colorKey: "brand", icon: "fa-folder" })

  const handleOpenChange = React.useCallback(
    (next: boolean) => {
      if (next) {
        setDraft(
          customizingFolder
            ? {
                name: customizingFolder.name,
                colorKey: customizingFolder.colorKey,
                icon: customizingFolder.icon,
              }
            : { name: "Untitled", colorKey: "brand", icon: "fa-folder" },
        )
      }
      onOpenChange(next)
    },
    [customizingFolder, onOpenChange],
  )

  const createDisabled = !draft.name.trim()

  function commit() {
    const v = draft.name.trim()
    if (!v) return
    onCreated({
      name: v,
      icon: draft.icon,
      colorKey: draft.colorKey,
      parentId: parentFolderId,
    })
    onOpenChange(false)
  }

  return (
    <FloatingSheetPanel open={open} onOpenChange={handleOpenChange}>
      <FloatingSheetPanelContent contentSlot="new-folder-drawer">
        <FloatingSheetPanelHeader
          title={customizingFolder ? "Customize folder" : "New folder"}
          description={descriptionText}
          onClose={() => onOpenChange(false)}
        />

        <form
          id="new-folder-form"
          className="flex min-h-0 flex-1 flex-col"
          onSubmit={event => {
            event.preventDefault()
            commit()
          }}
        >
          <FloatingSheetPanelBody className="gap-6 px-4 pb-4">
              <div className="flex flex-col items-center gap-4">
                <FolderTilePreview
                  name={draft.name}
                  colorKey={draft.colorKey}
                  icon={draft.icon}
                  className="w-full max-w-[280px]"
                />
                <div className="w-full max-w-[280px] space-y-2">
                  <Label htmlFor="new-folder-name-shared">Folder name</Label>
                  <Input
                    id="new-folder-name-shared"
                    value={draft.name}
                    onChange={e => setDraft(d => ({ ...d, name: e.target.value }))}
                    autoComplete="off"
                    aria-describedby="new-folder-name-hint-shared"
                    aria-invalid={createDisabled}
                  />
                  <p id="new-folder-name-hint-shared" className="text-sm text-muted-foreground">
                    Shown under the folder icon in the grid or column.
                  </p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Color</p>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map(c => (
                    <button
                      key={c}
                      type="button"
                      aria-label={`Color ${c}`}
                      aria-pressed={draft.colorKey === c}
                      className={cn(
                        "size-10 rounded-xl border-2 transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring",
                        LIBRARY_FOLDER_COLOR_STYLES[c].tile,
                        draft.colorKey === c
                          ? "ring-2 ring-ring"
                          : "border-transparent opacity-85 hover:opacity-100",
                      )}
                      onClick={() => setDraft(d => ({ ...d, colorKey: c }))}
                    />
                  ))}
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-medium text-muted-foreground">Icon</p>
                <div className="grid max-h-48 grid-cols-5 gap-2 overflow-y-auto rounded-xl border border-border p-3">
                  {LIBRARY_FOLDER_ICON_OPTIONS.map(ic => (
                    <button
                      key={ic}
                      type="button"
                      aria-label={`Icon ${ic.replace(/^fa-/, "").replace(/-/g, " ")}`}
                      aria-pressed={draft.icon === ic}
                      className={cn(
                        "flex size-10 items-center justify-center rounded-lg border text-sm transition-colors",
                        draft.icon === ic
                          ? "border-brand bg-brand/10 text-brand"
                          : "border-transparent hover:bg-muted",
                      )}
                      onClick={() => setDraft(d => ({ ...d, icon: ic }))}
                    >
                      <i className={cn("fa-light", ic)} aria-hidden="true" />
                    </button>
                  ))}
                </div>
              </div>
          </FloatingSheetPanelBody>

          <FloatingSheetPanelWorkflowFooter
            onCancel={() => onOpenChange(false)}
            primaryLabel={customizingFolder ? "Update folder" : "Create folder"}
            primaryForm="new-folder-form"
            onPrimary={commit}
            primaryDisabled={createDisabled}
            primaryIconClassName="fa-light fa-folder text-xs"
          />
        </form>
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
