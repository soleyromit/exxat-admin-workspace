'use client'

// VARIANT 3 — "Toolbar + split panel"
//
// Addresses Romit's 2026-08-04 critique of the shipped accordion head-on:
// the expanded panel wasted its whitespace and surfaced ZERO secondary
// actions (the collapsed row carries the only action). Here the panel opens
// with a persistent ACTION TOOLBAR — Preview survey / Reset to default
// template / Remove from push — following Mercury's reimbursement detail
// (mobbin.com/screens/b71279bb-6f4a-4ec2-83b7-9b73d5530ca4: "Edit Expense /
// Cancel Request" as a flat action row at the TOP of the pane, destructive
// one red-tinted, above hairline-divided structured fields) and Airwallex's
// card page (mobbin.com/screens/1f964a5b-e191-4b8a-b494-8b8debffb373: Lock /
// Spend program / Name card / Terminate as equal-weight buttons under the
// card identity, before any field list).
//
// Below the toolbar, a two-pane body: Template on a narrow left rail with
// Mercury-style stacked meta fields (questions, what it evaluates), and
// Evaluatees on the wide right pane with a REAL CommandInput filter — the
// shipped version mounts Command but dropped the input, leaving the list
// unsearchable. Toolbar actions are demo no-ops (console.log), per the
// compare-route lifecycle; only Template select + evaluatee toggles are
// wired to real state.
//
// Collapsed row is deliberately UNCHANGED from the shipped grid — the
// comparison is about what the open state does with its space.

import { Fragment, useState } from 'react'
import {
  Button, Checkbox, Tip,
  Card, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  Command, CommandInput, CommandList, CommandEmpty, CommandGroup, CommandItem,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_SUCCESS, LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_DANGER,
} from '@/lib/list-status-badges'
import { TypePill } from '@/components/pce/courses-evaluatees/scope-controls'
import { COURSE_TYPE_FULL_LABEL } from '@/lib/pce-mock-data'
import {
  useStep2RowDetailDemo, evaluateeLabel, templateCriteria, CRITERION_BY_TYPE,
  type DemoRow, type CourseGate, type SurveyInstance,
} from './_shared'

// checkbox · chevron · course · type · status · action — same as shipped.
const TABLE_GRID = `24px 24px minmax(0,1fr) 92px 96px 192px`

// cmdk marks the first item data-selected for keyboard nav and the DS tints
// it bg-accent — a stray highlighted row on a list nobody focused. Scope the
// tint to focus-within so it only appears once the filter/list has focus.
const CMDK_IDLE_GUARD =
  '[&:not(:focus-within)_[data-slot=command-item][data-selected=true]]:bg-transparent ' +
  '[&:not(:focus-within)_[data-slot=command-item][data-selected=true]]:text-inherit'

function EvaluateeAvatar({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span className={cn('rounded-full flex items-center justify-center border border-border bg-background shrink-0', className)}>
      <i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName!} className={className} decorative />
  )
}

function RowStatus({ gate }: { gate: CourseGate }) {
  if (gate.reasons.length > 0) {
    const detail = gate.reasons.includes('no-template')
      ? 'No template assigned'
      : [...new Set(gate.dups.map(i => i.roleLabel || 'Course material'))].join(', ') + ' blocked'
    return (
      <Tip label={detail} side="top">
        {/* Badge is a plain span — tabIndex keeps the Tip keyboard-reachable. */}
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
        </span>
      </Tip>
    )
  }
  if (gate.gaps.length > 0) {
    const gapRoles = [...new Set(gate.gaps.map(i => i.roleLabel))]
    return (
      <Tip label={`${gapRoles.join(', ')} unassigned`} side="top">
        <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
          <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
        </span>
      </Tip>
    )
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

function RowAction({ gate, onAssign }: { gate: CourseGate; onAssign: () => void }) {
  if (gate.reasons.length > 0 || gate.gaps.length === 0) {
    return <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>&mdash;</span>
  }
  const gapRoles = [...new Set(gate.gaps.map(i => i.roleLabel))]
  const label = gapRoles.length === 1 ? `Assign ${gapRoles[0]}` : `Assign ${gapRoles.length} roles`
  return (
    <Button variant="outline" size="xs" className="justify-start min-w-0 max-w-full" onClick={onAssign} aria-label={label}>
      <i className="fa-regular fa-circle-plus text-xs shrink-0" aria-hidden="true" />
      <span className="truncate">{label}</span>
    </Button>
  )
}

/** The variant's core move #1 — a persistent action toolbar as the panel's
 *  FIRST row (Mercury/Airwallex model), so opening a row immediately offers
 *  every secondary action instead of one action stranded in the collapsed
 *  grid. All three are demo no-ops. */
function DetailToolbar({ row, inCount }: { row: DemoRow; inCount: number }) {
  const previewButton = (
    <Button
      variant="ghost"
      size="icon-xs"
      disabled={!row.template}
      onClick={() => console.log('[demo] preview survey', row.code)}
      aria-label={row.template ? `Preview the survey for ${row.code}` : 'Preview unavailable. Assign a template to preview.'}
    >
      <i className="fa-light fa-eye text-xs" aria-hidden="true" />
    </Button>
  )
  return (
    <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border">
      {row.template ? (
        <Tip label="Preview survey" side="top">{previewButton}</Tip>
      ) : (
        <Tip label="Assign a template to preview" side="top">
          {/* Disabled buttons swallow pointer/focus — the focusable span
              carries the Tip and a visible focus ring. */}
          <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
            {previewButton}
          </span>
        </Tip>
      )}
      <Button
        variant="outline"
        size="xs"
        onClick={() => console.log('[demo] reset to default template', row.code)}
      >
        Reset to default template
      </Button>
      <div className="ms-auto flex items-center gap-3">
        <span className="text-xs text-muted-foreground tabular-nums">
          {row.gate.fresh.length > 0
            ? `${inCount} of ${row.gate.fresh.length} evaluatee${row.gate.fresh.length !== 1 ? 's' : ''} included`
            : 'No evaluatees to include'}
        </span>
        <Button
          variant="outline"
          size="xs"
          style={{ color: 'var(--destructive)' }}
          onClick={() => console.log('[demo] remove from push', row.code)}
        >
          Remove from push
        </Button>
      </div>
    </div>
  )
}

/** Core move #2a — narrow left rail: the Template select plus Mercury-style
 *  stacked meta fields, so the assignment's consequences (question count,
 *  who it evaluates) fill the rail instead of dead space. */
function TemplateRail({ row, publishedTemplates, setTemplateFor }: {
  row: DemoRow
  publishedTemplates: ReturnType<typeof useStep2RowDetailDemo>['publishedTemplates']
  setTemplateFor: (offeringId: string, templateId: string) => void
}) {
  const criteria = row.template ? templateCriteria(row.template) : []
  const evaluates = criteria
    .map(c => (c === 'students' ? 'Course material' : CRITERION_BY_TYPE[row.mode][c]?.label ?? c))
    .join(', ')
  return (
    <div className="flex w-full flex-col gap-2 sm:w-[220px] sm:shrink-0">
      <label htmlFor={`template-${row.offering.id}`} className="text-xs font-medium text-muted-foreground">
        Template
      </label>
      <Select
        value={row.template?.id}
        onValueChange={v => setTemplateFor(row.offering.id, v)}
      >
        <SelectTrigger id={`template-${row.offering.id}`} size="sm" className="w-full">
          <SelectValue placeholder="Assign a template" />
        </SelectTrigger>
        <SelectContent>
          {publishedTemplates.map(t => (
            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
      {row.template ? (
        <dl className="flex flex-col gap-2 pt-1">
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Questions</dt>
            <dd className="text-sm tabular-nums">{row.template.questionCount}</dd>
          </div>
          <div className="flex flex-col gap-0.5">
            <dt className="text-xs text-muted-foreground">Evaluates</dt>
            <dd className="text-sm">{evaluates || '–'}</dd>
          </div>
        </dl>
      ) : (
        <p className="text-xs text-muted-foreground pt-1">
          Assign a template to see its questions and who it evaluates.
        </p>
      )}
    </div>
  )
}

/** Core move #2b — wide right pane: the evaluatee list finally gets the
 *  CommandInput the primitive already supports, so long rosters are
 *  filterable in place. Groups mirror the shipped list exactly. */
function EvaluateesPane({ code, gate, included, toggleUnit }: {
  code: string
  gate: CourseGate
  included: ReadonlySet<string>
  toggleUnit: (key: string) => void
}) {
  const { fresh, gaps, dups } = gate
  return (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
      {fresh.length === 0 && gaps.length === 0 && dups.length === 0 ? (
        <span className="text-xs text-muted-foreground">&ndash;</span>
      ) : (
        <Command className={CMDK_IDLE_GUARD}>
          <CommandInput placeholder="Filter evaluatees…" aria-label={`Filter evaluatees for ${code}`} />
          <CommandList>
            <CommandEmpty>No evaluatees match.</CommandEmpty>

            {fresh.length > 0 && (
              <CommandGroup heading="Include in this push">
                {fresh.map(i => {
                  const isIn = included.has(i.key)
                  return (
                    <CommandItem key={i.key} value={evaluateeLabel(i)} onSelect={() => toggleUnit(i.key)}>
                      <i className={cn('fa-solid fa-check text-xs', !isIn && 'opacity-0')} aria-hidden="true" />
                      <EvaluateeAvatar i={i} className="size-5" />
                      <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                      {i.roleLabel && i.scope !== 'course' && (
                        <span className="text-muted-foreground text-xs shrink-0">&middot; {i.roleLabel}</span>
                      )}
                      {isIn && <span className="sr-only">, included</span>}
                    </CommandItem>
                  )
                })}
              </CommandGroup>
            )}

            {gaps.length > 0 && (
              <CommandGroup heading="Needs a person">
                {gaps.map(i => (
                  <CommandItem
                    key={i.key}
                    value={`no ${i.roleLabel} assigned`}
                    onSelect={() => { if (i.prismHref) window.open(i.prismHref, '_blank', 'noopener,noreferrer') }}
                  >
                    <i className="fa-light fa-user-slash text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                    <span className="truncate">No {i.roleLabel} assigned</span>
                    <span className="ms-auto text-xs shrink-0" style={{ color: 'var(--insight-severity-info-fg)' }}>
                      Add in Prism
                      <span className="sr-only"> (opens in new tab)</span>
                    </span>
                  </CommandItem>
                ))}
              </CommandGroup>
            )}

            {dups.length > 0 && (
              <CommandGroup heading="Already covered">
                {dups.map(i => (
                  <CommandItem key={i.key} value={evaluateeLabel(i)} disabled>
                    <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--qb-status-blocked-fg)' }} aria-hidden="true" />
                    <EvaluateeAvatar i={i} className="size-5" />
                    <span className="truncate">{i.scope === 'course' ? 'Course material' : i.personName}</span>
                    {i.roleLabel && i.scope !== 'course' && (
                      <span className="text-muted-foreground text-xs shrink-0">&middot; {i.roleLabel}</span>
                    )}
                  </CommandItem>
                ))}
              </CommandGroup>
            )}
          </CommandList>
        </Command>
      )}
    </div>
  )
}

export function Variant3ToolbarSplit() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()
  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(new Set())
  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const openRow = (id: string) => setOpenRows(prev => (prev.has(id) ? prev : new Set(prev).add(id)))

  return (
    <Card size="sm" className="py-0 gap-0 overflow-hidden">
      <CardContent className="p-0">
        <div
          className="grid items-center gap-3 ps-3 pe-3 py-2 border-b border-border text-xs font-medium text-muted-foreground"
          style={{ gridTemplateColumns: TABLE_GRID }}
        >
          <span />
          <span />
          <span>Course</span>
          <span>Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {rows.map(row => {
          const { offering, code, name, mode, gate } = row
          const freshKeys = gate.fresh.map(i => i.key)
          const inCount = freshKeys.filter(k => included.has(k)).length
          return (
            <Fragment key={offering.id}>
              <Collapsible
                open={openRows.has(offering.id)}
                onOpenChange={() => toggleRow(offering.id)}
                className="border-b border-border last:border-b-0"
              >
                {/* Collapsed row — same anatomy as shipped; the variant's
                    whole differentiation lives in the panel below. */}
                <div
                  className="grid items-center gap-3 ps-3 pe-3 py-2"
                  style={{ gridTemplateColumns: TABLE_GRID, minHeight: 44 }}
                >
                  <span className="flex items-center">
                    <Checkbox
                      checked={
                        gate.fresh.length > 0
                          ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false)
                          : true
                      }
                      onCheckedChange={v => {
                        // Demo scope: the harness owns unit-grain state only,
                        // so (un)checking maps to all-fresh-units on/off.
                        const flipTo = !!v
                        for (const k of freshKeys) {
                          if (included.has(k) !== flipTo) toggleUnit(k)
                        }
                      }}
                      aria-label={`Include ${code} in this push`}
                    />
                  </span>

                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="group"
                      aria-label={`${openRows.has(offering.id) ? 'Hide' : 'Show'} template and evaluatees for ${code}`}
                    >
                      <i
                        className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                      />
                    </Button>
                  </CollapsibleTrigger>

                  <span className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-xs tabular-nums text-muted-foreground shrink-0">{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>

                  <span><TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} /></span>

                  <span className="min-w-0"><RowStatus gate={gate} /></span>

                  <span className="min-w-0">
                    <RowAction gate={gate} onAssign={() => openRow(offering.id)} />
                  </span>
                </div>

                <CollapsibleContent>
                  <div className="mx-4 mb-3 rounded-md border border-border bg-background">
                    <DetailToolbar row={row} inCount={inCount} />
                    <div className="flex flex-col gap-4 p-3 sm:flex-row sm:gap-0">
                      <div className="sm:pe-4 sm:border-e sm:border-border">
                        <TemplateRail
                          row={row}
                          publishedTemplates={publishedTemplates}
                          setTemplateFor={setTemplateFor}
                        />
                      </div>
                      <div className="min-w-0 flex-1 sm:ps-4">
                        <EvaluateesPane code={code} gate={gate} included={included} toggleUnit={toggleUnit} />
                      </div>
                    </div>
                  </div>
                </CollapsibleContent>
              </Collapsible>
            </Fragment>
          )
        })}
      </CardContent>
    </Card>
  )
}

export default Variant3ToolbarSplit
