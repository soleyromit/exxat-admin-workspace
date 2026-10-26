"use client"

/**
 * Row detail for the skills library (split template T4): a non-modal DS FloatingSheetPanel over the list, so the list stays
 * in view and clickable. The record is in the URL (?skill=), Previous and Next step through the rows in view, and the one
 * primary in the panel footer is the next thing to do with that skill (Configure, Check and publish, Open configuration,
 * Reactivate). Everything else (edit details, deactivate, delete) sits in the panel's overflow menu.
 */
import { skillNoun } from "@/lib/lab/terms"
import * as React from "react"
import { useLabRouter } from "@/components/lab/lab-bar/lab-link"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import {
  FloatingSheetPanel,
  FloatingSheetPanelBody,
  FloatingSheetPanelContent,
  FloatingSheetPanelHeader,
  FloatingSheetPanelToolbar,
  FloatingSheetPanelWorkflowFooter,
} from "@exxatdesignux/ui/components/ui/floating-sheet-panel"
import { Badge } from "@exxatdesignux/ui/components/ui/badge"
import { NUM_LINK } from "@/components/lab/link-styles"
import { configureHref, evidenceHref, mappingHref, NO_CATEGORY, type LibraryRow } from "@/lib/lab/library"
import { plural } from "@/lib/v2/format"
import { LibraryStatusBadge } from "./library-chrome"
import { RowActions, type RowActionHandlers } from "./row-actions"

function primaryFor(r: LibraryRow): { label: string; href?: string } {
  if (r.status === "not-configured") return { label: "Configure", href: configureHref(r.id) }
  if (r.status === "configured") return { label: "Check and publish", href: `${configureHref(r.id)}&step=check` }
  if (r.status === "published") return { label: "Open configuration", href: configureHref(r.id) }
  return { label: "Reactivate" }
}

function Fact({ term, children }: { term: string; children: React.ReactNode }) {
  return (
    <div className="grid grid-cols-[9rem_1fr] gap-3 py-2.5">
      <dt className="text-sm text-muted-foreground">{term}</dt>
      <dd className="min-w-0 text-sm text-foreground">{children}</dd>
    </div>
  )
}

export function SkillPanel({ row, rows, handlers, onOpen, onClose }: {
  row: LibraryRow | null
  /** The rows in view, in order, for Previous and Next. */
  rows: readonly LibraryRow[]
  handlers: RowActionHandlers
  onOpen: (id: string) => void
  onClose: () => void
}) {
  const router = useLabRouter()
  const i = row ? rows.findIndex((r) => r.id === row.id) : -1
  const prev = i > 0 ? rows[i - 1] : undefined
  const next = i >= 0 && i < rows.length - 1 ? rows[i + 1] : undefined
  const primary = row ? primaryFor(row) : null
  const mappable = row?.status === "configured" || row?.status === "published"
  return (
    <FloatingSheetPanel open={!!row} onOpenChange={(o) => !o && onClose()}>
      <FloatingSheetPanelContent side="right" size="md" contentSlot="lab-skill-detail">
        {row && primary ? (
          <>
            <FloatingSheetPanelToolbar
              onPrevious={prev ? () => onOpen(prev.id) : undefined}
              onNext={next ? () => onOpen(next.id) : undefined}
              previousLabel={`Previous ${skillNoun()}`}
              nextLabel={`Next ${skillNoun()}`}
              closeLabel="Close"
              showSize={false}
              actions={<RowActions row={row} handlers={handlers} hideConfigure />}
            />
            <FloatingSheetPanelHeader title={row.name} subtitle={row.section === NO_CATEGORY ? undefined : row.section} />
            <FloatingSheetPanelBody className="px-4 pb-4">
              <dl className="flex flex-col divide-y divide-border">
                <Fact term="Status"><LibraryStatusBadge status={row.status} /></Fact>
                <Fact term="Required to graduate">{row.requiredToGraduate ? "Yes" : "No"}</Fact>
                <Fact term="How it's judged">{row.modelLabel || <span className="text-muted-foreground">Chosen when you configure it</span>}</Fact>
                <Fact term="Courses">
                  {row.status === "not-configured" ? (
                    <span className="text-muted-foreground">Mapped after it is configured</span>
                  ) : row.status === "inactive" ? (
                    <span className="text-muted-foreground">Withdrawn from mapping</span>
                  ) : mappable && row.courses ? (
                    <Link className={NUM_LINK} href={mappingHref(row.id)}>{`${plural(row.courses, "course", "courses")}${row.mandatoryCourses ? `, ${row.mandatoryCourses} mandatory` : ""}`}</Link>
                  ) : (
                    <Link className={NUM_LINK} href={mappingHref(row.id)}>Not mapped yet</Link>
                  )}
                </Fact>
                <Fact term="Evaluations">
                  {row.evidence ? <Link className={NUM_LINK} href={evidenceHref(row.id)}>{plural(row.evidence, "evaluation", "evaluations")}</Link> : <span className="text-muted-foreground">None yet</span>}
                </Fact>
                <Fact term="Tags">
                  {row.tags.length ? <span className="flex flex-wrap gap-1">{row.tags.map((t) => <Badge key={t} variant="secondary">{t}</Badge>)}</span> : <span className="text-muted-foreground">None</span>}
                </Fact>
                <Fact term="Came from">{row.source}</Fact>
              </dl>
            </FloatingSheetPanelBody>
            <FloatingSheetPanelWorkflowFooter
              cancelLabel="Close"
              onCancel={onClose}
              primaryLabel={primary.label}
              // Text-only CTA (no icons on action buttons); the DS default is a download glyph.
              primaryIconClassName=""
              onPrimary={() => {
                if (primary.href) router.push(primary.href)
                else handlers.onReactivate([row])
              }}
            />
          </>
        ) : null}
      </FloatingSheetPanelContent>
    </FloatingSheetPanel>
  )
}
