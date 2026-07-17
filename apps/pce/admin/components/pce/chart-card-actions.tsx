'use client'

/**
 * The card contract for Analytics: consistent height, one expand, one export.
 *
 * Every card on this surface sized itself to its data — 34 faculty meant a 1,680px card, 106
 * offerings meant a 4,600px table — so "card height" really meant "entity count", and no two cards
 * on a row matched. That is the bug this file closes.
 *
 * Three rules, applied per tab, per card:
 *
 * 1. **`CHART_CARD_PLOT_PX` is the plot height. All of it, everywhere.** The card renders a fixed
 *    box and the viz fits the box. A card never grows to fit its data — it shows the compact read
 *    and sends the density to the dialog.
 * 2. **`detail` is the same viz at full density**, not a different chart, so the card is a summary
 *    of the dialog and the two can never tell different stories.
 * 3. **Every chart exports.** Monil: "whatever we build on screen should also have a reporting
 *    angle." PNG comes off the rendered SVG; Excel/CSV off the same rows the sr-only
 *    `ChartDataTable` already carries, so export and the a11y table cannot diverge.
 *
 * `ChartCard` has no `actions` slot (real props: title, description, children, variant,
 * trendContent, filterOptions, defaultFilter, onFilterChange, miniMetrics, tabOptions, leoInsight),
 * so the affordances mount in the card body footer — where `Open By Faculty` already lives. Raised
 * as a DS gap; this is the local unblock, not a fork of ChartCard.
 *
 * PDF prints the real DOM via `@media print` (rules in `app/globals.css`, keyed off
 * `data-chart-print`), not a hand-written HTML document: zero deps, and the output inherits DS
 * tokens and fonts instead of hard-coded hex.
 */

import * as React from 'react'
import {
  Button,
  Dialog,
  LocalBanner,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@exxatdesignux/ui'

/** One number, every card, every tab. Cards line up because the plot box is identical. */
export const CHART_CARD_PLOT_PX = 220
export const CHART_CARD_PLOT_STYLE: React.CSSProperties = {
  height: CHART_CARD_PLOT_PX,
  overflow: 'hidden',
}
/** The dialog is where density may be tall — it scrolls; the card never does. */
export const CHART_DIALOG_PLOT_MIN_PX = 420

export interface ChartExportRows {
  /** Mirror the sr-only ChartDataTable headers so export == a11y table. */
  headers: string[]
  rows: (string | number)[][]
}

function toCsv({ headers, rows }: ChartExportRows): string {
  const esc = (v: string | number) => {
    const s = String(v ?? '')
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s
  }
  return [headers.map(esc).join(','), ...rows.map((r) => r.map(esc).join(','))].join('\n')
}

function download(name: string, blob: Blob) {
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = name
  a.click()
  URL.revokeObjectURL(url)
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

/**
 * SVG → PNG. Both engines here (Observable Plot, Recharts) render SVG, so one path covers every
 * card. Colours are read from the live document rather than literals — a detached SVG resolves no
 * CSS custom properties, so `var(--foreground)` would serialize to nothing.
 */
async function svgToPng(svg: SVGSVGElement, scale = 2): Promise<Blob | null> {
  const box = svg.getBoundingClientRect()
  if (!box.width || !box.height) return null
  const clone = svg.cloneNode(true) as SVGSVGElement
  clone.setAttribute('width', String(box.width))
  clone.setAttribute('height', String(box.height))
  const ink = getComputedStyle(document.body).color
  clone.querySelectorAll('text').forEach((t) => {
    if (!t.getAttribute('fill')) t.setAttribute('fill', ink)
  })
  const xml = new XMLSerializer().serializeToString(clone)
  const img = new Image()
  const ok = await new Promise<boolean>((res) => {
    img.onload = () => res(true)
    img.onerror = () => res(false)
    img.src = `data:image/svg+xml;charset=utf-8,${encodeURIComponent(xml)}`
  })
  if (!ok) return null
  const canvas = document.createElement('canvas')
  canvas.width = Math.max(1, Math.round(box.width * scale))
  canvas.height = Math.max(1, Math.round(box.height * scale))
  const ctx = canvas.getContext('2d')
  if (!ctx) return null
  ctx.fillStyle = getComputedStyle(document.body).backgroundColor || 'white'
  ctx.fillRect(0, 0, canvas.width, canvas.height)
  ctx.drawImage(img, 0, 0, canvas.width, canvas.height)
  return new Promise((res) => canvas.toBlob((b) => res(b), 'image/png'))
}

export type ChartExportFormat = 'png' | 'pdf' | 'excel' | 'csv'

function ChartExportMenu({
  title,
  getSvg,
  table,
  onPrint,
  onError,
  formats = ['png', 'pdf', 'excel', 'csv'],
}: {
  title: string
  getSvg: () => SVGSVGElement | null
  table: ChartExportRows
  onPrint: () => void
  /** Export is async and CAN fail (detached SVG, canvas ceiling) — silence is not a state. */
  onError: (message: string) => void
  /** Text cards have no SVG — they offer pdf/excel/csv and skip png rather than error. */
  formats?: ChartExportFormat[]
}) {
  const base = slug(title)
  const date = new Date().toISOString().slice(0, 10)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="sm" aria-label={`Export ${title}`} className="h-7 w-7 p-0">
          <i className="fa-light fa-arrow-down-to-line text-sm" aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        {formats.includes('png') && <DropdownMenuItem
          onSelect={async () => {
            const svg = getSvg()
            if (!svg) {
              onError('No rendered chart found to export.')
              return
            }
            const png = await svgToPng(svg)
            if (!png) {
              onError('Could not render the chart to an image.')
              return
            }
            download(`${base}_${date}.png`, png)
          }}
        >
          PNG — slide-ready image
        </DropdownMenuItem>}
        {formats.includes('pdf') && (
          <DropdownMenuItem onSelect={onPrint}>PDF — print-ready</DropdownMenuItem>
        )}
        {formats.includes('excel') && <DropdownMenuItem
          onSelect={() =>
            /* Excel opens CSV natively; the BOM is what makes it read UTF-8 rather than mojibake.
               True .xlsx needs a writer dep — deferred, see the spec's open questions. */
            download(
              `${base}_${date}.csv`,
              new Blob([`﻿${toCsv(table)}`], {
                type: 'application/vnd.ms-excel;charset=utf-8',
              }),
            )
          }
        >
          Excel — formatted rows
        </DropdownMenuItem>}
        {formats.includes('csv') && (
          <DropdownMenuItem
            onSelect={() =>
              download(
                `${base}_${date}.csv`,
                new Blob([toCsv(table)], { type: 'text/csv;charset=utf-8' }),
              )
            }
          >
            CSV — raw rows
          </DropdownMenuItem>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/**
 * Mount inside a `ChartCard`'s children, under the plot.
 *
 * @param detail the SAME viz at full density — all 34 faculty, all 12 courses. Omit and Expand
 *               shows the card's own chart larger.
 * @param table  the rows behind the plot; feeds Excel/CSV/PDF and mirrors `ChartDataTable`.
 */
export function ChartCardActions({
  title,
  description,
  detail,
  table,
  children,
  formats,
}: {
  title: string
  description?: string
  detail?: React.ReactNode
  table: ChartExportRows
  /** Extra affordances (e.g. "Open By Faculty") kept left of Export/Expand. */
  children?: React.ReactNode
  formats?: ChartExportFormat[]
}) {
  const [open, setOpen] = React.useState(false)
  const [exportError, setExportError] = React.useState<string | null>(null)
  const anchorRef = React.useRef<HTMLDivElement>(null)
  const dialogRef = React.useRef<HTMLDivElement>(null)

  /* Icons live in the card's TOP-RIGHT corner (Romit, 2026-07-15: "expand and export can be
     at the top right as an icon instead of a button"). ChartCard has no actions slot and its
     root isn't positioned, so the mount stamps `position:relative` on the nearest card
     surface — contained here until the DS grows a real slot. */
  const [leoOffset, setLeoOffset] = React.useState(false)
  React.useEffect(() => {
    const card = anchorRef.current?.closest<HTMLElement>('[data-slot="card"], .rounded-lg.border')
    if (card && getComputedStyle(card).position === 'static') card.style.position = 'relative'
    /* ChartCard's own Ask-Leo affordance also lives top-right; painting the icons over it
       (caught on the prod screenshot, 2026-07-16) hides both. Yield the corner when present. */
    setLeoOffset(!!card?.querySelector('[aria-label="Ask Leo about this chart"]'))
  }, [])

  /** Export what is on screen: the dialog's chart when open, else the card's own. */
  const getSvg = React.useCallback((): SVGSVGElement | null => {
    if (open) return dialogRef.current?.querySelector('svg') ?? null
    // Walk up from the footer to the card body, then take the plot beside us.
    let node: HTMLElement | null | undefined = anchorRef.current?.parentElement
    while (node) {
      const svg = node.querySelector('svg')
      if (svg) return svg
      node = node.parentElement
    }
    return null
  }, [open])

  const print = React.useCallback(() => {
    const target = open ? dialogRef.current : anchorRef.current?.parentElement
    if (!target) return
    target.setAttribute('data-chart-print', '')
    const clear = () => {
      target.removeAttribute('data-chart-print')
      window.removeEventListener('afterprint', clear)
    }
    window.addEventListener('afterprint', clear)
    window.print()
  }, [open])

  return (
    <div ref={anchorRef} data-chart-actions className="mt-2 flex flex-col gap-2 empty:mt-0">
      {exportError ? (
        <LocalBanner variant="error" title="Export failed" dismissible onDismiss={() => setExportError(null)}>
          {exportError}
        </LocalBanner>
      ) : null}
      <div className={`absolute top-3 z-10 flex items-center gap-0.5 ${leoOffset ? 'right-28' : 'right-3'}`}>
        <ChartExportMenu title={title} getSvg={getSvg} table={table} onPrint={print} onError={setExportError} formats={formats} />
        {/* No detail = export-only: a fixed 6-term line gains nothing from a dialog, but it
            still has a reporting angle. Expand appears only where density earns it. */}
        {detail ? (
          <Button
            variant="ghost"
            size="sm"
            aria-label={`Expand ${title}`}
            className="h-7 w-7 p-0"
            onClick={() => setOpen(true)}
          >
            <i className="fa-light fa-arrows-maximize text-sm" aria-hidden="true" />
          </Button>
        ) : null}
      </div>
      {children ? <div className="flex items-center justify-end gap-2">{children}</div> : null}

      <Dialog open={open} onOpenChange={setOpen}>
        {/* `sm:` prefix is load-bearing: DialogContent ships `sm:max-w-lg`, which outranks a bare
            `max-w-*` and pinned the dialog to 384px — too narrow to be worth expanding into. */}
        <DialogContent className="sm:max-w-[min(1100px,92vw)]">
          <DialogHeader>
            {/* Required, not decorative — P7. */}
            <DialogTitle>{title}</DialogTitle>
            {description ? <DialogDescription>{description}</DialogDescription> : null}
          </DialogHeader>

          {/* tabIndex + role/label, not decoration: axe `scrollable-region-focusable` (serious) —
              a scroll container that no keyboard can reach is content a keyboard user cannot read. */}
          <div
            ref={dialogRef}
            tabIndex={0}
            role="region"
            aria-label={`${title} — full detail`}
            className="max-h-[70vh] overflow-y-auto focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            style={{ minHeight: CHART_DIALOG_PLOT_MIN_PX }}
          >
            {detail}
          </div>

          <div className="flex justify-end">
            <ChartExportMenu title={title} getSvg={getSvg} table={table} onPrint={print} onError={setExportError} formats={formats} />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
}
