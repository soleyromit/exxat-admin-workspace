'use client'

// Wizard step shell — hand-roll justified (no DS step-frame organism), see
// docs/governance/ds-adoption.md §PCE. Composes the vendored DataTable + DS
// Select/Badge/Button/LocalBanner.
//
// Step 2 of the push wizard — "Survey design" (Jul 2026 two-step split).
// The row is a SURVEY INSTANCE: one course-material survey per course, plus
// one survey per (faculty role × person) the course's template evaluates.
// Instances group under their course; the group band carries the course's
// template Select, so changing a template regenerates that course's rows live.
//
// Duplicate logic (engineering feedback + UC2–UC5, Jul 2026): the composite
// key is offering + role + person. An instance whose key matches an OPEN flow
// gets a SOFT warning (UC4), not a hard block: it renders "Duplicate" with the
// existing flow named, and its checkbox defaults UNCHECKED — only truly new
// combinations are created unless the admin explicitly checks a duplicate to
// re-evaluate (a late-added co-instructor's colleagues, UC2). Accepted
// duplicates re-surface as an acknowledgement at Review (UC5); unchecked ones
// stay an informational skip count. Import-review pattern (Remote / Intercom):
// per-row verdict, issues filter, CTA restates the count.

import { useMemo, useEffect, useRef, useState, type ReactNode } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Badge, Button, LocalBanner,
} from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { usePce } from '@/components/pce/pce-state'
import { CreateBlankTemplate } from '@/components/pce/create-blank-template'
import { TemplateEditor } from '@/components/pce/template-editor'
import { DataTable } from '@/components/data-table'
import { PaginationBar } from '@/components/data-table/pagination'
import { useTableState } from '@/components/data-table/use-table-state'
import type { ColumnDef } from '@/components/data-table/types'
import { type CourseOffering, type PceTemplate } from '@/lib/pce-mock-data'
import { courseLabelOf } from '@/lib/pce-course-readiness'
import { type SurveyInstance, existingFlowSummary } from '@/lib/pce-push-validation'
import { AddInPrismButton, EmptyHint } from './scope-controls'

interface InstanceRow extends Record<string, unknown> {
  id: string
  /** Group key — instances sit under their course. */
  offeringId: string
  courseLabel: string
  evaluatee: string
  roleLabel: string
  /** Sortable/filterable scalar mirror of inst.status. */
  statusKey: 'new' | 'duplicate' | 'gap'
  inst: SurveyInstance
}

interface StepSurveyInstancesProps {
  /** Step-1 selection, already scoped + student-checked. */
  selectedOfferings: CourseOffering[]
  /** The expanded instance plan (page-owned — the push handler uses the same list). */
  instances: SurveyInstance[]
  publishedTemplates: PceTemplate[]
  templateAssignments: Record<string, string>
  defaultAssignments: Record<string, string>
  onTemplateChange: (offeringId: string, templateId: string) => void
  onResetDefaults: () => void
  /** Instance keys the admin is INCLUDING in the push (reported on change) —
   *  new instances default checked, duplicates default unchecked (UC4). */
  onIncludedChange: (keys: Set<string>) => void
  onBack: () => void
  onContinue: () => void
}

const STATUS_ORDER: Record<InstanceRow['statusKey'], number> = { gap: 0, duplicate: 1, new: 2 }

export function StepSurveyInstances({
  selectedOfferings, instances, publishedTemplates,
  templateAssignments, defaultAssignments, onTemplateChange, onResetDefaults,
  onIncludedChange, onBack, onContinue,
}: StepSurveyInstancesProps) {
  // In-step template creation — the SAME create flow + builder as Settings >
  // Templates (ported from the merged step; the wizard page never unmounts, so
  // state persists across the sub-view swap).
  const { templates: allTemplates } = usePce()
  const [subView, setSubView] = useState<'assign' | 'create' | { buildId: string }>('assign')
  const [notice, setNotice] = useState<{ kind: 'published' | 'draft'; name: string } | null>(null)
  const backToAssign = () => {
    if (typeof subView === 'object') {
      const t = allTemplates.find(x => x.id === subView.buildId)
      if (t && t.status !== 'active') setNotice({ kind: 'draft', name: t.name || 'Untitled template' })
    }
    setSubView('assign')
  }

  // "Show only issues" — duplicates + unassigned roles (Remote's import-review
  // affordance). Local view filter; counts always speak for the full plan.
  const [issuesOnly, setIssuesOnly] = useState(false)

  const offeringsById = useMemo(
    () => new Map(selectedOfferings.map(o => [o.id, o])),
    [selectedOfferings],
  )

  const rows = useMemo<InstanceRow[]>(
    () =>
      instances
        .filter(i => !issuesOnly || i.status !== 'new')
        .map(i => {
          const offering = offeringsById.get(i.offeringId)
          return {
            id: i.key,
            offeringId: i.offeringId,
            courseLabel: offering ? courseLabelOf(offering) : i.offeringId,
            evaluatee: i.scope === 'course' ? 'Course material' : (i.personName ?? 'No one assigned'),
            roleLabel: i.roleLabel,
            statusKey: i.status,
            inst: i,
          }
        })
        // Within a course: course material first, then roles in expansion order —
        // the expansion already emits that order, so keep arrival order.
        ,
    [instances, issuesOnly, offeringsById],
  )

  // Classification counts always come from the FULL plan, not the filtered view.
  const counts = useMemo(() => {
    let fresh = 0, duplicates = 0, gaps = 0
    for (const i of instances) {
      if (i.status === 'new') fresh++
      else if (i.status === 'duplicate') duplicates++
      else gaps++
    }
    return { fresh, duplicates, gaps }
  }, [instances])

  // Selected courses with no effective template — they expand to nothing, so
  // the plan silently under-counts. Same gate as the merged step.
  const missingTemplate = useMemo(
    () => selectedOfferings.filter(o => {
      const tid = templateAssignments[o.id] ?? defaultAssignments[o.id] ?? ''
      return !tid || !publishedTemplates.some(t => t.id === tid)
    }).length,
    [selectedOfferings, templateAssignments, defaultAssignments, publishedTemplates],
  )

  // Course groups ordered by code; band label is the course identity.
  const groupOrder = useMemo(
    () =>
      [...selectedOfferings]
        .sort((a, b) => courseLabelOf(a).localeCompare(courseLabelOf(b), undefined, { numeric: true }))
        .map(o => o.id),
    [selectedOfferings],
  )
  const groupLabels = useMemo(
    () => Object.fromEntries(selectedOfferings.map(o => [o.id, courseLabelOf(o)])),
    [selectedOfferings],
  )

  // Width budget: 40+280+170+310+150 = 950 ≤ ~1110 — no horizontal scroll.
  const columns = useMemo<ColumnDef<InstanceRow>[]>(() => [
    // The checkbox IS the soft-warning control (UC4): checked = this survey
    // gets created. New instances default checked; duplicates default
    // unchecked — checking one is the explicit "re-evaluate anyway".
    { key: 'select', label: '', width: 40, defaultPin: 'left', lockPin: true },
    {
      key: 'evaluatee', label: 'Evaluatee', sortable: false, width: 280,
      cell: r => {
        if (r.inst.scope === 'course') {
          return (
            <span className="flex items-center gap-1.5 min-w-0 py-0.5">
              <span className="size-5 rounded-full flex items-center justify-center shrink-0 border border-border" style={{ background: 'var(--background)' }}>
                <i className="fa-light fa-book-open" style={{ fontSize: 9, color: 'var(--muted-foreground)' }} aria-hidden="true" />
              </span>
              <span className="text-sm truncate">Course material</span>
            </span>
          )
        }
        if (!r.inst.personName) {
          return (
            <span className="flex items-center gap-1.5 min-w-0 py-0.5">
              <span className="size-5 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
                <i className="fa-light fa-user-slash" style={{ fontSize: 9, color: 'var(--chip-4)' }} aria-hidden="true" />
              </span>
              <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>No one assigned</span>
            </span>
          )
        }
        return (
          <span className="flex items-center gap-1.5 min-w-0 py-0.5">
            <PersonAvatar name={r.inst.personName} className="size-5" />
            <span className="text-sm font-medium truncate">{r.inst.personName}</span>
          </span>
        )
      },
    },
    {
      key: 'roleLabel', label: 'Role', sortable: true, width: 170,
      cell: r => r.roleLabel
        ? <span className="text-sm whitespace-nowrap">{r.roleLabel}</span>
        : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>,
    },
    {
      key: 'statusKey', label: 'Status', sortable: true, width: 310,
      filter: {
        type: 'select', icon: 'fa-circle-half-stroke',
        options: [
          { value: 'new', label: 'New' },
          { value: 'duplicate', label: 'Duplicate — skipped' },
          { value: 'gap', label: 'Role unassigned' },
        ],
      },
      cell: r => {
        if (r.statusKey === 'new') {
          return (
            <Badge variant="outline" className="gap-1.5 font-normal">
              <span aria-hidden="true" className="size-1.5 rounded-full" style={{ background: 'var(--chart-2)' }} />
              New — no survey exists yet
            </Badge>
          )
        }
        if (r.statusKey === 'duplicate') {
          // Soft warning (UC4): name the exact overlap — who, which role,
          // which flow — so "duplicate" is a fact the admin can verify, not
          // a verdict to trust. Amber icon = needs a decision; the checkbox
          // beside the row IS that decision.
          const word = r.inst.existing ? existingFlowSummary(r.inst.existing) : 'Open'
          return (
            <span className="flex flex-col items-start gap-0.5 py-0.5">
              <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--chip-4)' }}>
                <i className="fa-solid fa-triangle-exclamation text-xs" aria-hidden="true" />
                Duplicate — survey already exists
              </span>
              <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                {r.inst.scope === 'course'
                  ? <>This course&apos;s survey: {word}. Check the box to run it again.</>
                  : <>{r.inst.personName}&apos;s {r.roleLabel} survey: {word}. Check the box to re-evaluate.</>}
              </span>
            </span>
          )
        }
        return (
          <span className="flex items-center gap-1.5 text-sm font-medium" style={{ color: 'var(--chip-4)' }}>
            <i className="fa-solid fa-triangle-exclamation text-xs" aria-hidden="true" />
            No {r.roleLabel} assigned — nothing to create
          </span>
        )
      },
    },
    {
      key: 'actions', label: 'Action needed', width: 150, defaultPin: 'right', lockPin: true,
      cell: r => r.statusKey === 'gap' && r.inst.prismHref
        ? <AddInPrismButton href={r.inst.prismHref} label="Add faculty" roles={[r.roleLabel]} />
        : <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>—</span>,
    },
  ], [])

  const [page, setPage] = useState(1)
  const [pageSize, setPageSize] = useState(25)

  const tableState = useTableState<InstanceRow>(
    rows, columns, undefined, { page, pageSize },
    'offeringId',
    groupLabels,
    groupOrder,
  )
  const filteredTotal = tableState.rows.length
  const totalPages = Math.max(1, Math.ceil(filteredTotal / pageSize))
  const safePage = Math.min(page, totalPages)

  // Default inclusion (UC4): new instances checked; duplicates and gaps
  // unchecked — only truly new combinations are created unless the admin
  // explicitly opts a duplicate in. Re-derived when the plan itself changes
  // (template/selection edits); manual checks survive view-filter changes.
  const planSig = instances.map(i => `${i.key}:${i.status}`).join('\0')
  const lastPlanSig = useRef('')
  useEffect(() => {
    if (lastPlanSig.current === planSig) return
    lastPlanSig.current = planSig
    tableState.setSelected(new Set(instances.filter(i => i.status === 'new').map(i => i.key)))
  }, [planSig, instances, tableState])

  // Report inclusion up (de-duped) — the page pushes exactly this set.
  const lastReported = useRef('')
  useEffect(() => {
    const sig = [...tableState.selected].map(String).sort().join('\0')
    if (lastReported.current === sig) return
    lastReported.current = sig
    onIncludedChange(new Set([...tableState.selected].map(String)))
  }, [tableState.selected, onIncludedChange])

  // Push-plan counts follow the checkboxes; classification counts stay fixed.
  const included = tableState.selected
  const toCreate = useMemo(
    () => instances.filter(i => i.status !== 'gap' && included.has(i.key)).length,
    [instances, included],
  )
  const reEvals = useMemo(
    () => instances.filter(i => i.status === 'duplicate' && included.has(i.key)).length,
    [instances, included],
  )
  const skippedDup = counts.duplicates - reEvals

  // Per-course template Select, rendered inside the course's group band via the
  // DataTable groupHeaderSlot extension (safe: DS Select portals its floating
  // content; the band already hosts interactive controls).
  const groupSlot = (offeringId: string): ReactNode => {
    const offering = offeringsById.get(offeringId)
    if (!offering) return null
    const code = groupLabels[offeringId]?.split(' – ')[0] ?? offeringId
    const rawId = templateAssignments[offeringId] ?? defaultAssignments[offeringId] ?? ''
    const templateId = publishedTemplates.some(t => t.id === rawId) ? rawId : ''
    const edited = !!templateId && templateId !== defaultAssignments[offeringId]
    const tally = instances.filter(i => i.offeringId === offeringId)
    const newCount = tally.filter(i => i.status === 'new').length
    const dupCount = tally.filter(i => i.status === 'duplicate').length

    if (publishedTemplates.length === 0) {
      return (
        <Button
          variant="outline"
          size="xs"
          aria-label={`Create a template — none exist yet to assign to ${code}`}
          onClick={() => { setNotice(null); setSubView('create') }}
        >
          <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
          Create template
        </Button>
      )
    }
    return (
      <span className="flex items-center gap-2.5">
        {/* A2 empty state: an add-affordance pill, not a blank form field —
            info-blue = a choice made in-app; amber stays the missing-data hue. */}
        <Select value={templateId} onValueChange={v => onTemplateChange(offeringId, v)}>
          <SelectTrigger
            aria-label={`Template for ${code}${!templateId ? ' — required' : ''}${edited ? ' — changed from default' : ''}`}
            className={!templateId
              ? 'w-fit min-w-0 border-0 shadow-none'
              : `min-w-0 [&>span]:truncate [&>span]:min-w-0 ${edited ? 'bg-secondary' : ''}`}
            style={{
              height: 26, fontSize: 12, fontWeight: 400,
              ...(templateId ? { width: 224, background: edited ? undefined : 'var(--background)' } : {
                paddingInline: 10,
                background: 'var(--insight-severity-info-bg)',
              }),
            }}
          >
            <SelectValue
              placeholder={
                <span className="flex items-center gap-1.5 font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
                  <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                  Assign template
                </span>
              }
            />
          </SelectTrigger>
          <SelectContent>
            {publishedTemplates.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
          </SelectContent>
        </Select>
        {templateId && (
          <span className="text-[12px] font-normal normal-case tracking-normal whitespace-nowrap">
            {newCount} new{dupCount > 0 ? ` · ${dupCount} duplicate${dupCount !== 1 ? 's' : ''}` : ''}
          </span>
        )}
      </span>
    )
  }

  // ── Create sub-view: same chooser + builder as Settings > Templates ────────
  if (subView !== 'assign') {
    return (
      <div className="flex flex-col gap-3">
        <div>
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={backToAssign}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back to Survey design
          </Button>
        </div>
        {subView === 'create' ? (
          <CreateBlankTemplate onCreated={id => setSubView({ buildId: id })} />
        ) : (
          <TemplateEditor
            templateId={subView.buildId}
            embedded
            onPublished={id => {
              const t = allTemplates.find(x => x.id === id)
              setNotice({ kind: 'published', name: t?.name || 'Template' })
              setSubView('assign')
            }}
          />
        )}
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-5 flex-1">
      {/* ── Plan summary + table actions ──────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <span className="text-sm tabular-nums">
          <span className="font-semibold">{toCreate} survey{toCreate !== 1 ? 's' : ''}</span> will be created
          {reEvals > 0 && (
            <span style={{ color: 'var(--chip-4)' }}> · {reEvals} re-evaluation{reEvals !== 1 ? 's' : ''}</span>
          )}
          {skippedDup > 0 && (
            <span style={{ color: 'var(--muted-foreground)' }}> · {skippedDup} duplicate{skippedDup !== 1 ? 's' : ''} skipped</span>
          )}
          {counts.gaps > 0 && (
            <span style={{ color: 'var(--chip-4)' }}> · {counts.gaps} role{counts.gaps !== 1 ? 's' : ''} unassigned</span>
          )}
        </span>
        <div className="ms-auto flex items-center gap-2">
          {(counts.duplicates > 0 || counts.gaps > 0) && (
            <Button
              variant="outline"
              size="sm"
              aria-pressed={issuesOnly}
              onClick={() => setIssuesOnly(v => !v)}
              className={issuesOnly ? 'bg-secondary' : undefined}
            >
              <i className="fa-light fa-filter text-xs" aria-hidden="true" />
              {issuesOnly ? 'Show all' : 'Show only issues'}
            </Button>
          )}
          <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground" onClick={onResetDefaults}>
            <i className="fa-light fa-arrow-rotate-left text-xs" aria-hidden="true" />
            Reset to defaults
          </Button>
          <Button variant="outline" size="sm" onClick={() => { setNotice(null); setSubView('create') }}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            New template
          </Button>
        </div>
      </div>

      {notice && (
        <LocalBanner
          variant={notice.kind === 'published' ? 'success' : 'info'}
          dismissible
          onDismiss={() => setNotice(null)}
        >
          {notice.kind === 'published'
            ? <>&ldquo;{notice.name}&rdquo; published — assign it in a course band below.</>
            : <>&ldquo;{notice.name}&rdquo; saved as a draft — publish it to make it assignable. It&apos;s in Settings &rsaquo; Templates.</>}
        </LocalBanner>
      )}

      {counts.duplicates > 0 && (
        <LocalBanner variant="info">
          {counts.duplicates} evaluatee{counts.duplicates !== 1 ? 's' : ''} already {counts.duplicates !== 1 ? 'have' : 'has'} a
          live or scheduled survey for the same course and role. {counts.duplicates !== 1 ? 'They start' : 'It starts'} unchecked
          so only new combinations are created — check one to re-evaluate anyway.
        </LocalBanner>
      )}

      {/* ── Instances ─────────────────────────────────────────────────────── */}
      {selectedOfferings.length === 0 ? (
        <EmptyHint heading="No courses selected" sub="Go back and select at least one course." />
      ) : (
        <div className="flex flex-col gap-0">
          <DataTable<InstanceRow>
            data={rows}
            columns={columns}
            state={tableState}
            getRowId={r => r.id}
            getRowSelectionLabel={r => `${r.evaluatee} — ${r.roleLabel || 'Course material'} (${r.courseLabel})`}
            emptyState={issuesOnly
              ? 'No duplicates or unassigned roles — every instance is new.'
              : 'No survey instances — assign a template to each course band.'}
            selectable
            searchable
            hideBulkActions
            hasFooter
            edgeInset={false}
            stickyHeader={false}
            groupHeaderSlot={groupSlot}
          />
          <div className="border-x border-b border-border rounded-b-lg overflow-hidden">
            <PaginationBar
              page={safePage}
              pageSize={pageSize}
              total={filteredTotal}
              pageSizeOptions={[25, 50, 100]}
              onPageChange={setPage}
              onPageSizeChange={n => { setPageSize(n); setPage(1) }}
            />
          </div>
        </div>
      )}

      {/* ── Footer ────────────────────────────────────────────────────────── */}
      <div className="sticky bottom-0 mt-auto bg-background border-t border-border py-4 flex items-center justify-between gap-4">
        <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
          {toCreate} survey{toCreate !== 1 ? 's' : ''} across {selectedOfferings.length} course{selectedOfferings.length !== 1 ? 's' : ''}
          {reEvals > 0 && <> · {reEvals} re-evaluation{reEvals !== 1 ? 's' : ''}</>}
          {skippedDup > 0 && <> · {skippedDup} duplicate{skippedDup !== 1 ? 's' : ''} skipped</>}
          {missingTemplate > 0 && (
            <>
              {' · '}
              <span className="font-medium" style={{ color: 'var(--insight-severity-info-fg)' }}>
                {missingTemplate} course{missingTemplate !== 1 ? 's' : ''} without a template
              </span>
            </>
          )}
        </span>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onBack}>
            <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
            Back
          </Button>
          <Button
            variant="default"
            size="sm"
            disabled={missingTemplate > 0 || toCreate === 0}
            onClick={onContinue}
          >
            Continue
            <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
          </Button>
        </div>
      </div>
    </div>
  )
}
