"use client"

import * as React from "react"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { LocalBanner } from "@exxatdesignux/ui/components/ui/banner"
import { Popover, PopoverContent, PopoverTrigger } from "@exxatdesignux/ui/components/ui/popover"
import type { Db, SkillStatusDisplay } from "@/lib/domain/types"
import { buttons, filterIssueText, r4 } from "@/lib/copy"
import { exportAggregate, exportEvidence, filterIssue, filterLines, toCsv, type ExportKind, type ExportTable } from "@/lib/store"
import { reportingCopy as rc } from "@/lib/copy"
import type { OverviewParams } from "./report-params"

function build(db: Db, kind: ExportKind, p: OverviewParams, display: SkillStatusDisplay, now: string): ExportTable {
  // OD-11 is OPEN: the evaluator column is OFF. OD-10 is OPEN: CSV only.
  const o = { includeEvaluator: false, display, generatedAt: now, generatedBy: "Administrator", program: "Program" }
  return kind === "evidence" ? exportEvidence(db, p.filters, o) : exportAggregate(db, kind, p.filters, o)
}

export interface ExportMenuProps {
  db: Db
  params: OverviewParams
  display: SkillStatusDisplay
  /** False while results load: export is disabled with a reason (S-17 D state). */
  ready?: boolean
  /** Injected clock. */
  now?: () => string
  /** Test seam: receives the generated file contents. */
  onExported?: (csv: string, table: ExportTable) => void
}

type Notice = { kind: ExportKind; href: string; file: string; rows: number; filters: string } | { error: true } | { empty: true } | null

/**
 * P-03 / S-17: `Export` (outline) opens a popover under the button with two items, the heading "Export (CSV, opens in Excel)"
 * and the footnote that the current filters are written into the file header. Choosing an item builds the file from the FULL
 * filtered scope (not the visible 25 rows: RP-10), records the filters as `#` header lines, and starts the download. OD-10 is
 * OPEN (CSV only, no Excel claim) and OD-11 is OPEN (no evaluator column).
 */
export function ExportMenu({ db, params, display, ready = true, now = () => new Date().toISOString(), onExported }: ExportMenuProps) {
  const [open, setOpen] = React.useState(false)
  const [notice, setNotice] = React.useState<Notice>(null)
  const disabledId = React.useId()
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const issue = filterIssue(db, params.filters)
  const blocked = Boolean(issue)

  const lastKind = React.useRef<ExportKind>("student")
  const run = (kind: ExportKind) => {
    if (blocked) return
    lastKind.current = kind
    try {
      // The scope is read at press time: filters changing afterwards do not alter this file.
      const t = build(db, kind, params, display, now())
      if (t.rows.length === 0) {
        setNotice({ empty: true })
        return
      }
      const csv = toCsv(t)
      const href =
        typeof URL !== "undefined" && typeof URL.createObjectURL === "function"
          ? URL.createObjectURL(new Blob(["﻿", csv], { type: "text/csv;charset=utf-8" }))
          : `data:text/csv;charset=utf-8,${encodeURIComponent(csv)}`
      const file = r4.exportMenu.fileName(kind)
      setNotice({ kind, href, file, rows: t.rows.length, filters: filterLines(db, params.filters).join("; ") })
      onExported?.(csv, t)
      // Start the download. A real anchor click is the only portable way; the visible link below repeats it for keyboard and test use.
      if (typeof document !== "undefined" && typeof navigator !== "undefined" && !/jsdom/i.test(navigator.userAgent)) {
        const a = document.createElement("a")
        a.href = href
        a.download = file
        a.rel = "noopener"
        document.body.appendChild(a)
        a.click()
        a.remove()
      }
    } catch {
      setNotice({ error: true })
    }
  }

  const aggregateKind: ExportKind = params.tab

  return (
    <>
      <Popover
        open={open}
        onOpenChange={(o) => {
          setOpen(o)
          if (!o) setNotice(null)
        }}
      >
        <PopoverTrigger asChild>
          <Button ref={triggerRef} type="button" variant="outline" size="sm" disabled={!ready} aria-describedby={!ready ? disabledId : undefined}>
            <i className="fa-light fa-download" aria-hidden="true" />
            {buttons.export}
          </Button>
        </PopoverTrigger>
        <PopoverContent align="end" className="flex w-80 flex-col gap-2 p-3" aria-label={r4.exportMenu.heading}>
          <p className="text-xs font-semibold text-muted-foreground">{r4.exportMenu.heading}</p>
          {blocked ? <p className="text-xs text-muted-foreground">{r4.exportMenu.unavailable}</p> : null}
          <ul className="flex flex-col gap-1">
            <li>
              <Button type="button" variant="ghost" size="default" className="h-auto w-full flex-col items-start gap-0.5 whitespace-normal py-2 text-left" disabled={blocked} onClick={() => run(aggregateKind)}>
                <span className="text-sm font-medium">{r4.exportMenu.aggregate[aggregateKind]}</span>
                <span className="text-xs font-normal text-muted-foreground">{r4.exportMenu.aggregateHelp}</span>
              </Button>
            </li>
            <li>
              <Button type="button" variant="ghost" size="default" className="h-auto w-full flex-col items-start gap-0.5 whitespace-normal py-2 text-left" disabled={blocked} onClick={() => run("evidence")}>
                <span className="text-sm font-medium">{r4.exportMenu.evidence}</span>
                <span className="text-xs font-normal text-muted-foreground">{r4.exportMenu.evidenceHelp}</span>
              </Button>
            </li>
          </ul>
          <p className="text-xs text-muted-foreground">{r4.exportMenu.footnote}</p>
          {notice && "empty" in notice ? <LocalBanner variant="info">{r4.exportMenu.unavailable}</LocalBanner> : null}
          {notice && "error" in notice ? (
            <LocalBanner variant="error" retry={{ label: buttons.retry, onClick: () => run(lastKind.current) }}>
              {r4.exportMenu.error}
            </LocalBanner>
          ) : null}
          {notice && "kind" in notice ? (
            <LocalBanner variant="success">
              <p>{r4.exportMenu.started(notice.file, notice.rows)}</p>
              <p>{r4.exportMenu.filtersRecorded(notice.filters)}</p>
              <a className="underline" href={notice.href} download={notice.file} aria-label={rc.exp.download(notice.rows)}>
                {rc.exp.download(notice.rows)}
              </a>
            </LocalBanner>
          ) : null}
          {issue ? <LocalBanner variant="info">{filterIssueText(issue, db)}</LocalBanner> : null}
        </PopoverContent>
      </Popover>
      {!ready ? (
        <span id={disabledId} className="sr-only">
          {rc.exp.disabledReason}
        </span>
      ) : null}
    </>
  )
}
