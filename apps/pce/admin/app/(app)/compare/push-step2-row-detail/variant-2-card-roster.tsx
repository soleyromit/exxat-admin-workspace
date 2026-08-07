'use client'

// COMPARE VARIANT 2 — "Card roster + switch consequences" (throwaway; same
// lifecycle as the other /compare/push-step2-* routes — delete once a
// direction is picked).
//
// Critique addressed (Romit, 2026-08-04 live review of the shipped
// accordion): the expanded panel wastes its whitespace, template switches
// show no consequence until AFTER the commit (the S2 AlertDialog), and
// Evaluatees is a plain list with no creative layout.
//
// Thesis of this variant:
//   1. EVALUATEES AS A CARD ROSTER — each evaluatee (person or course
//      material) is its own small selectable card in a responsive grid, so
//      the expanded panel's width actually gets used instead of stacking a
//      narrow list into it. Gap roles get their own amber card with the
//      Prism deep-link; already-covered roles get a locked, non-interactive
//      card. Mobbin grounding: Aboard's bordered card-per-item layout with
//      an inline action per card (mobbin.com/screens/374c934a…), Mistral
//      AI's admin Preferences two-column tile grid where every tile is
//      name + description + its own toggle (mobbin.com/screens/c9a8c9a3…),
//      and Navan's admin users table for the per-person metadata hierarchy
//      (mobbin.com/screens/044fd459…).
//   2. SWITCH CONSEQUENCES BEFORE COMMIT — picking a different template in
//      the Select STAGES it locally instead of committing: an inline strip
//      under the Select states exactly what the switch does, in the same
//      copy voice the shipped S2 dialog already proved ("Stops evaluating X
//      and adds Y." / "Adds Y. Nothing is removed." / "Same aspects,
//      different questions."), with explicit Switch/Keep buttons. Mobbin
//      grounding: Framer's Cancel Plan consequence bullets shown before the
//      destructive commit (mobbin.com/screens/5b128cb6…) — same idea, but
//      inline instead of a dialog, per the brief.
//
// WHY STAGED-then-apply rather than previewing after onValueChange commits:
// `setTemplateFor` re-renders `row.template` immediately, so by the time a
// post-commit preview strip rendered there would be nothing left to compare
// against (old vs new are the same value) and the admin would be reading a
// warning about a change that already happened — exactly the after-the-fact
// pattern this variant exists to replace. A per-row `pending` map keeps the
// Select's displayed value separate from the committed assignment until the
// admin confirms, which is the smallest state that makes the preview honest.
//
// Collapsed row is intentionally UNCHANGED from the shipped accordion
// (checkbox · chevron · course · type · status · one action) — the
// differentiation is entirely inside the expanded panel, per the brief.

import { Fragment, useMemo, useState } from 'react'
import {
  Button, Checkbox, Label, Tip,
  Card, CardContent,
  Collapsible, CollapsibleTrigger, CollapsibleContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { cn } from '@/lib/utils'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import {
  LIST_HUB_STATUS_TINT_DANGER,
  LIST_HUB_STATUS_TINT_SUCCESS,
  LIST_HUB_STATUS_TINT_WARNING,
} from '@/lib/list-status-badges'
import { TypePill } from '@/components/pce/courses-evaluatees/scope-controls'
import { COURSE_TYPE_FULL_LABEL, type DeliveryMode } from '@/lib/pce-mock-data'
import type { Criterion } from '@/lib/pce-course-readiness'
import {
  useStep2RowDetailDemo, evaluateeLabel, templateCriteria, CRITERION_BY_TYPE,
  type CourseGate, type SurveyInstance,
} from './_shared'

// Same 6-column collapsed grid as the shipped step — apples-to-apples.
const TABLE_GRID = `24px 24px minmax(0,1fr) 92px 96px 192px`

// ── Status badge (same vocabulary as the shipped RowStatus) ──────────────────

function RowStatus({ gate }: { gate: CourseGate }) {
  if (gate.reasons.length > 0) {
    return <ListHubStatusBadge label="Blocked" tint={LIST_HUB_STATUS_TINT_DANGER} icon="fa-lock" />
  }
  if (gate.gaps.length > 0) {
    return <ListHubStatusBadge label="Gap" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-user-slash" />
  }
  return <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
}

// ── Evaluatee glyph — person photo/initials, or the course-material book ─────
// One avatar per card, laid out side by side in the grid: nothing overlaps.

function EvaluateeGlyph({ i, className }: { i: SurveyInstance; className?: string }) {
  return i.scope === 'course' ? (
    <span
      className={cn(
        'size-6 rounded-full flex items-center justify-center border shrink-0',
        className,
      )}
      style={{ borderColor: 'var(--border)', background: 'var(--background)' }}
      aria-hidden="true"
    >
      <i className="fa-light fa-book-open text-[10px]" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
    </span>
  ) : (
    <PersonAvatar name={i.personName ?? ''} className={cn('size-6', className)} decorative />
  )
}

// ── Switch-consequence copy — the shipped S2 dialog's proven voice ───────────

const listFmt = (roles: string[]) =>
  new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(roles)

/** Criteria that actually apply to this offering's delivery mode — same
 *  "spec undefined → drop it" rule expandInstances applies internally, so a
 *  criterion valid for labs but not this classroom course never leaks its
 *  raw internal key into the sentence. */
function applicableCriteria(mode: DeliveryMode, criteria: Criterion[]): Criterion[] {
  return criteria.filter(c => c === 'students' || !!CRITERION_BY_TYPE[mode][c])
}

function criterionLabel(mode: DeliveryMode, c: Criterion): string | undefined {
  return c === 'students' ? 'Course material' : CRITERION_BY_TYPE[mode][c]?.label
}

function Emphasis({ children }: { children: React.ReactNode }) {
  return <span className="font-medium" style={{ color: 'var(--foreground)' }}>{children}</span>
}

/** "Stops evaluating X and adds Y." — verbatim voice from the shipped S2
 *  Replace option (step-survey-instances.tsx), rendered inline instead of
 *  inside an AlertDialog. */
function SwitchConsequence({ added, removed }: { added: string[]; removed: string[] }) {
  if (removed.length > 0 && added.length > 0) {
    return <>Stops evaluating <Emphasis>{listFmt(removed)}</Emphasis> and adds <Emphasis>{listFmt(added)}</Emphasis>.</>
  }
  if (removed.length > 0) {
    return <>Stops evaluating <Emphasis>{listFmt(removed)}</Emphasis> and adds nothing new.</>
  }
  if (added.length > 0) {
    return <>Adds <Emphasis>{listFmt(added)}</Emphasis>. Nothing is removed.</>
  }
  return <>Same aspects, different questions.</>
}

// ── The variant ──────────────────────────────────────────────────────────────

export default function Variant2CardRoster() {
  const { rows, publishedTemplates, included, toggleUnit, setTemplateFor } = useStep2RowDetailDemo()

  const [openRows, setOpenRows] = useState<ReadonlySet<string>>(new Set())
  const toggleRow = (id: string) =>
    setOpenRows(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  const openRow = (id: string) => setOpenRows(prev => new Set(prev).add(id))

  // Staged (not yet committed) template pick, per offering — see the header
  // comment for why the preview needs its own state instead of reading the
  // already-committed `row.template` after onValueChange.
  const [pending, setPending] = useState<Record<string, string | undefined>>({})
  const stagePick = (offeringId: string, templateId: string | undefined) =>
    setPending(prev => ({ ...prev, [offeringId]: templateId }))

  const setAll = (keys: string[], target: boolean) => {
    for (const k of keys) if (included.has(k) !== target) toggleUnit(k)
  }

  const templatesById = useMemo(
    () => new Map(publishedTemplates.map(t => [t.id, t])),
    [publishedTemplates],
  )

  return (
    <Card size="sm" className="py-0 gap-0 overflow-hidden">
      <CardContent className="p-0">
        <div
          className="grid items-center gap-3 ps-3 pe-3 py-2 border-b border-border text-xs font-medium"
          style={{ gridTemplateColumns: TABLE_GRID, color: 'var(--muted-foreground)' }}
        >
          <span />
          <span />
          <span>Course</span>
          <span>Type</span>
          <span>Status</span>
          <span>Action</span>
        </div>

        {rows.map(row => {
          const { offering: o, code, name, mode, template, gate } = row
          const { fresh, gaps, dups } = gate
          const freshKeys = fresh.map(i => i.key)
          const inCount = freshKeys.filter(k => included.has(k)).length
          const isOpen = openRows.has(o.id)

          const committedId = template?.id
          const pendingId = pending[o.id]
          const staged = pendingId && pendingId !== committedId
            ? templatesById.get(pendingId) ?? null
            : null

          // Consequence diff — committed vs staged, delivery-mode-applicable
          // criteria only, mapped through the same per-mode labels the rest
          // of this step uses.
          const currentCriteria = applicableCriteria(mode, template ? templateCriteria(template) : [])
          const stagedCriteria = staged ? applicableCriteria(mode, templateCriteria(staged)) : []
          const currentSet = new Set(currentCriteria)
          const stagedSet = new Set(stagedCriteria)
          const added = stagedCriteria
            .filter(c => !currentSet.has(c))
            .map(c => criterionLabel(mode, c))
            .filter((l): l is string => !!l)
          const removed = currentCriteria
            .filter(c => !stagedSet.has(c))
            .map(c => criterionLabel(mode, c))
            .filter((l): l is string => !!l)

          return (
            <Fragment key={o.id}>
              <Collapsible
                open={isOpen}
                onOpenChange={() => toggleRow(o.id)}
                className="border-b border-border last:border-b-0"
              >
                {/* Collapsed row — unchanged from the shipped accordion. */}
                <div
                  className="grid items-center gap-3 ps-3 pe-3 py-2"
                  style={{ gridTemplateColumns: TABLE_GRID, minHeight: 44 }}
                >
                  <span className="flex items-center">
                    <Checkbox
                      checked={
                        fresh.length > 0
                          ? (inCount === freshKeys.length ? true : inCount > 0 ? 'indeterminate' : false)
                          : true
                      }
                      // Demo harness owns only unit-grain state, so the course
                      // checkbox selects/deselects the row's fresh units (the
                      // real step additionally unselects the course itself).
                      onCheckedChange={v => setAll(freshKeys, v === true)}
                      aria-label={`Include ${code} in this push`}
                    />
                  </span>

                  <CollapsibleTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      className="group"
                      aria-label={`${isOpen ? 'Hide' : 'Show'} template and evaluatees for ${code}`}
                    >
                      <i
                        className="fa-light fa-chevron-down text-xs transition-transform group-data-[state=open]:rotate-180"
                        aria-hidden="true"
                      />
                    </Button>
                  </CollapsibleTrigger>

                  <span className="flex items-baseline gap-2 min-w-0">
                    <span className="font-mono text-xs tabular-nums shrink-0" style={{ color: 'var(--muted-foreground)' }}>{code}</span>
                    {name && <span className="truncate text-sm">{name}</span>}
                  </span>

                  <span><TypePill deliveryMode={mode} label={COURSE_TYPE_FULL_LABEL[mode]} /></span>

                  <span className="min-w-0"><RowStatus gate={gate} /></span>

                  <span className="min-w-0">
                    {gate.reasons.length === 0 && gaps.length > 0 ? (
                      <Button
                        variant="outline"
                        size="xs"
                        className="justify-start min-w-0 max-w-full"
                        onClick={() => openRow(o.id)}
                      >
                        <span className="truncate">
                          {gaps.length === 1 ? `Assign ${gaps[0].roleLabel}` : `Assign ${gaps.length} roles`}
                        </span>
                      </Button>
                    ) : (
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>&mdash;</span>
                    )}
                  </span>
                </div>

                <CollapsibleContent>
                  {/* Expanded panel — Template rail + Evaluatee roster side by
                      side on wide viewports, so the panel's width does work
                      instead of stacking narrow content into it. */}
                  <div className="mx-4 mb-3 grid gap-4 rounded-md border border-border p-3 lg:grid-cols-[minmax(240px,300px)_1fr]" style={{ background: 'var(--background)' }}>
                    {/* ── Template ─────────────────────────────────────── */}
                    <div className="flex flex-col gap-1.5">
                      <span className="text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>Template</span>
                      <Select
                        value={pendingId ?? committedId ?? ''}
                        onValueChange={v => stagePick(o.id, v === committedId ? undefined : v)}
                      >
                        <SelectTrigger size="sm" aria-label={`Template for ${code}`}>
                          <SelectValue placeholder="Assign a template" />
                        </SelectTrigger>
                        <SelectContent>
                          {publishedTemplates.map(t => (
                            <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>

                      {template && !staged && (
                        <p className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>
                          {template.questionCount} question{template.questionCount !== 1 ? 's' : ''} · evaluates{' '}
                          {currentCriteria.map(c => criterionLabel(mode, c)).filter(Boolean).join(', ')}
                        </p>
                      )}

                      {/* Consequence strip — renders the moment a DIFFERENT
                          template is staged, before anything commits. */}
                      {staged && (
                        <div className="flex flex-col gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--muted)' }}>
                          <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                            <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
                            <Emphasis>{staged.name}</Emphasis> takes its place.{' '}
                            <SwitchConsequence added={added} removed={removed} />
                          </p>
                          <div className="flex items-center gap-1.5">
                            <Button
                              variant="default"
                              size="xs"
                              onClick={() => { setTemplateFor(o.id, staged.id); stagePick(o.id, undefined) }}
                            >
                              Switch template
                            </Button>
                            <Button
                              variant="ghost"
                              size="xs"
                              onClick={() => stagePick(o.id, undefined)}
                            >
                              Keep current
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* ── Evaluatees — card roster ─────────────────────── */}
                    <div className="flex flex-col gap-1.5 min-w-0">
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium" style={{ color: 'var(--muted-foreground)' }}>
                        Evaluatees
                        {fresh.length > 0 && (
                          <span className="font-normal tabular-nums">
                            · {inCount} of {fresh.length} included
                          </span>
                        )}
                        <Tip label="Check a card to include that person or course material in this push." side="top">
                          <span
                            className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                            tabIndex={0}
                          >
                            <i className="fa-light fa-circle-info" aria-hidden="true" style={{ fontSize: 11 }} />
                          </span>
                        </Tip>
                      </span>

                      {!template ? (
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Assign a template to see who gets evaluated.
                        </p>
                      ) : fresh.length + gaps.length + dups.length === 0 ? (
                        <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          This template evaluates no one on this course.
                        </p>
                      ) : (
                        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-3">
                          {/* Included/includable units — whole card is the
                              label of its checkbox, so the click target is
                              the full card, not a 16px box. Unselected cards
                              drain to grayscale — the same "not in this
                              push" vocabulary ExcludedEvaluatee already
                              established in this step. */}
                          {fresh.map(i => {
                            const checkboxId = `v2-unit-${i.key}`
                            const isIn = included.has(i.key)
                            return (
                              <Label
                                key={i.key}
                                htmlFor={checkboxId}
                                className="flex cursor-pointer items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0"
                                style={{ background: 'var(--card)' }}
                              >
                                <EvaluateeGlyph i={i} className={isIn ? undefined : 'grayscale'} />
                                <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                  <span
                                    className="truncate text-sm font-medium"
                                    style={{ color: isIn ? 'var(--foreground)' : 'var(--muted-foreground)' }}
                                  >
                                    {i.scope === 'course' ? 'Course material' : i.personName}
                                  </span>
                                  <span className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                    {i.scope === 'course' ? 'Course' : i.roleLabel}
                                  </span>
                                </span>
                                <Checkbox
                                  id={checkboxId}
                                  size="sm"
                                  checked={isIn}
                                  onCheckedChange={() => toggleUnit(i.key)}
                                  aria-label={`Include ${evaluateeLabel(i)} in this push`}
                                />
                              </Label>
                            )
                          })}

                          {/* Gap roles — no person in Prism yet. Amber card
                              with the staffing deep-link; nothing to toggle
                              because there is nobody to include. */}
                          {gaps.map(i => (
                            <div
                              key={i.key}
                              className="flex items-start gap-2.5 rounded-md border border-dashed p-2.5 min-w-0"
                              style={{
                                borderColor: LIST_HUB_STATUS_TINT_WARNING.border,
                                background: LIST_HUB_STATUS_TINT_WARNING.bg,
                              }}
                            >
                              <span
                                className="size-6 rounded-full flex items-center justify-center border border-dashed shrink-0"
                                style={{ borderColor: LIST_HUB_STATUS_TINT_WARNING.fg, color: LIST_HUB_STATUS_TINT_WARNING.fg }}
                                aria-hidden="true"
                              >
                                <i className="fa-light fa-user-plus text-[10px]" aria-hidden="true" />
                              </span>
                              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-sm font-medium" style={{ color: LIST_HUB_STATUS_TINT_WARNING.fg }}>
                                  {i.roleLabel}
                                </span>
                                <span className="text-xs" style={{ color: LIST_HUB_STATUS_TINT_WARNING.fg }}>
                                  No one assigned in Prism
                                </span>
                                {i.prismHref && (
                                  <a
                                    href={i.prismHref}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="text-xs underline underline-offset-2"
                                    style={{ color: LIST_HUB_STATUS_TINT_WARNING.fg }}
                                  >
                                    Add in Prism
                                    <span className="sr-only"> (opens Prism in a new tab to assign the {i.roleLabel} role on {code})</span>
                                  </a>
                                )}
                              </span>
                            </div>
                          ))}

                          {/* Already covered by a live survey — locked, not
                              clickable, visually out of the running. */}
                          {dups.map(i => (
                            <div
                              key={i.key}
                              className="flex items-start gap-2.5 rounded-md border border-border p-2.5 min-w-0"
                              style={{ background: 'var(--muted)' }}
                            >
                              <EvaluateeGlyph i={i} className="grayscale" />
                              <span className="flex min-w-0 flex-1 flex-col gap-0.5">
                                <span className="truncate text-sm font-medium" style={{ color: 'var(--muted-foreground)' }}>
                                  {i.scope === 'course' ? 'Course material' : i.personName}
                                </span>
                                <span className="truncate text-xs" style={{ color: 'var(--muted-foreground)' }}>
                                  {i.roleLabel} · Already covered
                                </span>
                              </span>
                              <i
                                className="fa-solid fa-lock text-xs shrink-0 mt-0.5"
                                style={{ color: 'var(--muted-foreground)' }}
                                aria-hidden="true"
                              />
                            </div>
                          ))}
                        </div>
                      )}
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
