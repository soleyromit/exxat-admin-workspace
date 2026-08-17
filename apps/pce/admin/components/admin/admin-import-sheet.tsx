"use client"

/**
 * Import roster — the primary action on every Admin hub.
 *
 * A sheet rather than a route because the hub behind it is the context: the
 * super admin is looking at what is already there while deciding what to bring
 * in, and closing the panel has to leave that untouched
 * (`exxat-drawer-vs-dialog`). It is also reversible, which rules out a dialog.
 *
 * Scope: this queues an import and reports what will happen. The column mapping
 * editor and the row level exception review are the next two screens, and both
 * need a real feed behind them to be worth building.
 */

import * as React from "react"

import { devLog } from "@/lib/dev-log"
import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelHeader,
  FloatingSheetPanelToolbar,
  FloatingSheetPanelWorkflowFooter,
} from "@/lib/floating-sheet-panel"
import { cn } from "@/lib/utils"
import { Field, FieldDescription, FieldLabel } from "@/components/ui/field"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card"

type ImportSource = "file" | "feed"

const SOURCES: { id: ImportSource; label: string; description: string; icon: string }[] = [
  {
    id: "file",
    label: "Upload a file",
    description: "A CSV or Excel export from your student or HR system.",
    icon: "fa-file-arrow-up",
  },
  {
    id: "feed",
    label: "Run the connected feed now",
    description: "Pulls the same data the nightly sync collects, ahead of schedule.",
    icon: "fa-database",
  },
]

export interface AdminImportSheetProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** Plural object name in the hub's own words, e.g. "people". */
  objectLabel: string
  /** Called with a one sentence summary the hub renders as a banner. */
  onQueued: (summary: string) => void
}

export function AdminImportSheet({
  open,
  onOpenChange,
  objectLabel,
  onQueued,
}: AdminImportSheetProps) {
  const [source, setSource] = React.useState<ImportSource>("file")
  const [fileName, setFileName] = React.useState<string | null>(null)

  const ready = source === "feed" || fileName !== null

  function reset() {
    setSource("file")
    setFileName(null)
  }

  function handleOpenChange(next: boolean) {
    if (!next) reset()
    onOpenChange(next)
  }

  function handleQueue() {
    if (!ready) return
    devLog("Queue admin import:", { objectLabel, source, fileName })
    onQueued(
      source === "feed"
        ? `The connected feed is running now. New and changed ${objectLabel} will appear here within a few minutes.`
        : `${fileName} is queued. Rows that cannot be matched to a program will be held for your review rather than skipped.`,
    )
    handleOpenChange(false)
  }

  return (
    <FloatingSheetPanel open={open} onOpenChange={handleOpenChange}>
      <FloatingSheetPanelContent contentSlot="admin-import-sheet">
        <FloatingSheetPanelToolbar />
        <FloatingSheetPanelHeader
          title={`Import ${objectLabel}`}
          description="Nothing is overwritten. Existing records are matched on their workspace ID and updated in place; anything that cannot be matched waits for you."
        />

        <FloatingSheetPanelBody className="gap-6 px-4 pb-4">
          <fieldset className="flex flex-col gap-2">
            <legend className="mb-2 text-sm font-medium text-foreground">Where from</legend>
            {SOURCES.map(option => {
              const selected = source === option.id
              return (
                <label
                  key={option.id}
                  className={cn(
                    "flex cursor-pointer items-start gap-3 rounded-2 border p-3 transition-colors",
                    selected
                      ? "border-brand bg-brand-tint"
                      : "border-border hover:bg-interactive-hover",
                  )}
                >
                  <input
                    type="radio"
                    name="admin-import-source"
                    value={option.id}
                    checked={selected}
                    onChange={() => setSource(option.id)}
                    className="mt-1 size-4 accent-[var(--brand-color)]"
                  />
                  <span className="flex min-w-0 flex-col gap-0.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <i className={`fa-light ${option.icon}`} aria-hidden="true" />
                      {option.label}
                    </span>
                    <span className="text-sm text-muted-foreground">{option.description}</span>
                  </span>
                </label>
              )
            })}
          </fieldset>

          {source === "file" ? (
            <Field>
              <FieldLabel htmlFor="admin-import-file">File</FieldLabel>
              <input
                id="admin-import-file"
                type="file"
                accept=".csv,.xlsx"
                onChange={event => setFileName(event.target.files?.[0]?.name ?? null)}
                className="block w-full text-sm text-muted-foreground file:mr-3 file:rounded-2 file:border file:border-border file:bg-background file:px-3 file:py-1.5 file:text-sm file:font-medium file:text-foreground hover:file:bg-interactive-hover"
              />
              <FieldDescription>
                CSV or Excel. The first row is read as column headings.
              </FieldDescription>
            </Field>
          ) : null}

          <Card size="sm" className="bg-muted/40">
            <CardHeader>
              <CardTitle className="text-sm font-medium">What happens next</CardTitle>
            </CardHeader>
            <CardContent>
              <ol className="flex list-decimal flex-col gap-1.5 ps-4 text-sm text-muted-foreground">
                <li>Columns are matched to Exxat fields and you confirm the mapping.</li>
                <li>Records already here are updated; new ones are added as Invited.</li>
                <li>Rows without a program, or with an email already in use, are held.</li>
              </ol>
            </CardContent>
          </Card>
        </FloatingSheetPanelBody>

        <FloatingSheetPanelWorkflowFooter
          onCancel={() => handleOpenChange(false)}
          primaryLabel={source === "feed" ? "Run the feed" : "Start import"}
          onPrimary={handleQueue}
          primaryDisabled={!ready}
          primaryIconClassName="fa-light fa-file-arrow-up text-xs"
        />
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
