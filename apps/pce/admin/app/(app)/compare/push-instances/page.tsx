'use client'

// COMPARE ROUTE (throwaway — delete once a variant is picked, same lifecycle
// as /compare/push-flow-rows and /compare/fix-affordance).
//
// Four layouts for the push wizard's Survey design step, answering Romit's
// Jul 24 feedback: with every row selected the current table reads as a wall
// of checkboxes, the repeated "New" badge drowns the exceptions, and the
// hierarchy between course and instance is unclear. All four variants share
// the same fixture slice (incl. the UC2 late-co-instructor duplicate) and the
// same copy system:
//   · being created is the QUIET DEFAULT — muted text, no badge
//   · only exceptions speak, and they say who/what/when, not a category label
//   · gap rows lose their checkbox — there is nothing to include
//   · "N surveys", never "N records"

import { Suspense, useState, type ReactNode } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Badge, Button, Checkbox, CheckboxLabel, Tip, ToggleSwitch,
  AvatarGroup, Collapsible, CollapsibleTrigger, CollapsibleContent,
  Card, CardHeader, CardTitle, CardDescription, CardContent,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { SurveyStatusBadgeOS } from '@/components/pce/pce-badges'

// ── Shared fixture slice (mirrors the live pt5 expansion incl. UC2) ──────────

interface Item {
  id: string
  kind: 'course' | 'person'
  name?: string
  role?: string
  status: 'new' | 'dup' | 'gap'
  /** Existing-flow phrase for duplicates ("Scheduled · opens Dec 4"). */
  existing?: string
}
interface CourseBlock {
  code: string
  name: string
  items: Item[]
}

const COURSES: CourseBlock[] = [
  {
    code: 'DPT-501', name: 'Human Anatomy & Kinesiology',
    items: [
      { id: 'a1', kind: 'course', status: 'new' },
      { id: 'a2', kind: 'person', name: 'Dr. Anita Patel', role: 'Instructor', status: 'new' },
      { id: 'a3', kind: 'person', name: 'Dr. Kevin Chen', role: 'Coordinator', status: 'new' },
    ],
  },
  {
    code: 'DPT-502', name: 'Physiology & Pathophysiology',
    items: [
      { id: 'b1', kind: 'course', status: 'new' },
      { id: 'b2', kind: 'person', role: 'Instructor', status: 'gap' },
      { id: 'b3', kind: 'person', name: 'Dr. Maria Williams', role: 'Coordinator', status: 'new' },
    ],
  },
  {
    code: 'DPT-510', name: 'Musculoskeletal Physical Therapy I',
    items: [
      { id: 'c1', kind: 'course', status: 'dup', existing: 'Scheduled · opens Dec 4' },
      { id: 'c2', kind: 'person', name: 'Dr. Kevin Chen', role: 'Instructor', status: 'dup', existing: 'Scheduled · opens Dec 4' },
      { id: 'c3', kind: 'person', name: 'Dr. Rachel Gomez', role: 'Instructor', status: 'new' },
      { id: 'c4', kind: 'person', name: 'Dr. Anita Patel', role: 'Coordinator', status: 'new' },
    ],
  },
]

const label = (i: Item) => (i.kind === 'course' ? 'Course material' : i.name ?? 'No one assigned')

function useIncluded() {
  const [included, setIncluded] = useState<Set<string>>(
    () => new Set(COURSES.flatMap(c => c.items.filter(i => i.status === 'new').map(i => i.id))),
  )
  const toggle = (id: string) =>
    setIncluded(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  return { included, toggle }
}

function counts(included: Set<string>) {
  const all = COURSES.flatMap(c => c.items)
  return {
    create: all.filter(i => i.status !== 'gap' && included.has(i.id)).length,
    reEval: all.filter(i => i.status === 'dup' && included.has(i.id)).length,
    skipped: all.filter(i => i.status === 'dup' && !included.has(i.id)).length,
    gaps: all.filter(i => i.status === 'gap').length,
  }
}

// ── Small shared pieces ──────────────────────────────────────────────────────

function EvaluateeCell({ item, subtitleRole }: { item: Item; subtitleRole?: boolean }) {
  if (item.kind === 'course') {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="size-6 rounded-full flex items-center justify-center shrink-0 border border-border" style={{ background: 'var(--background)' }}>
          <i className="fa-light fa-book-open text-[10px]" style={{ color: 'var(--muted-foreground)' }} aria-hidden="true" />
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate">Course material</span>
          {subtitleRole && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Whole course · answered by students</span>}
        </span>
      </span>
    )
  }
  if (!item.name) {
    return (
      <span className="flex items-center gap-2 min-w-0">
        <span className="size-6 rounded-full flex items-center justify-center shrink-0" style={{ background: 'var(--group-band-attention-bg)' }}>
          <i className="fa-light fa-user-slash text-[10px]" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
        </span>
        <span className="flex flex-col min-w-0">
          <span className="text-sm font-medium truncate" style={{ color: 'var(--chip-4)' }}>{item.role} not assigned</span>
          {subtitleRole && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Add in Prism to evaluate this role</span>}
        </span>
      </span>
    )
  }
  return (
    <span className="flex items-center gap-2 min-w-0">
      <PersonAvatar name={item.name} className="size-6" />
      <span className="flex flex-col min-w-0">
        <span className="text-sm font-medium truncate">{item.name}</span>
        {subtitleRole && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>{item.role}</span>}
      </span>
    </span>
  )
}

function TemplateSelectMock({ code }: { code: string }) {
  return (
    <Select value="eot" onValueChange={() => {}}>
      <SelectTrigger aria-label={`Template for ${code}`} className="min-w-0 [&>span]:truncate" style={{ height: 28, fontSize: 12, width: 200, background: 'var(--background)' }}>
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value="eot">End-of-Term Evaluation</SelectItem>
        <SelectItem value="mid">Midterm Check-In</SelectItem>
      </SelectContent>
    </Select>
  )
}

function AddFacultyBtn() {
  return (
    <Button asChild variant="outline" size="xs">
      <a href="https://app.exxat.com/prism/dpt" target="_blank" rel="noopener noreferrer">
        <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
        Add faculty
        <span className="sr-only"> (opens in new tab)</span>
        <i className="fa-light fa-arrow-up-right-from-square text-xs" aria-hidden="true" />
      </a>
    </Button>
  )
}

function SummaryLine({ included }: { included: Set<string> }) {
  const c = counts(included)
  return (
    <p className="text-sm tabular-nums">
      <span className="font-semibold">{c.create} surveys</span> will be created
      {c.reEval > 0 && <span style={{ color: 'var(--chip-4)' }}> · {c.reEval} re-evaluation{c.reEval !== 1 ? 's' : ''}</span>}
      {c.skipped > 0 && <span style={{ color: 'var(--muted-foreground)' }}> · {c.skipped} duplicate{c.skipped !== 1 ? 's' : ''} skipped</span>}
      {c.gaps > 0 && <span style={{ color: 'var(--chip-4)' }}> · {c.gaps} role{c.gaps !== 1 ? 's' : ''} unassigned</span>}
    </p>
  )
}

function VariantFrame({ tag, title, thesis, children }: { tag: string; title: string; thesis: string; children: ReactNode }) {
  return (
    <Card id={tag}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base font-heading">
          <Badge variant="secondary">{tag.toUpperCase()}</Badge>
          {title}
        </CardTitle>
        <CardDescription>{thesis}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        {children}
      </CardContent>
    </Card>
  )
}

// ── Variant A — Quiet ledger ─────────────────────────────────────────────────
// Same anatomy as today, noise removed: creation is the muted default, the
// role rides under the name (one identity column), gap rows have NO checkbox,
// and bands say "surveys", carrying their tally next to the label.

function VariantA() {
  const { included, toggle } = useIncluded()
  return (
    <div className="flex flex-col gap-3">
      <SummaryLine included={included} />
      <div className="rounded-lg border border-border overflow-hidden">
        {COURSES.map(course => {
          const fresh = course.items.filter(i => i.status === 'new').length
          const dups = course.items.filter(i => i.status === 'dup').length
          return (
            <div key={course.code}>
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border" style={{ background: 'var(--muted)' }}>
                <span className="text-sm font-semibold">
                  <span className="font-mono text-xs tabular-nums">{course.code}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {course.name}
                </span>
                <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                  {fresh} new{dups > 0 ? ` · ${dups} duplicate${dups !== 1 ? 's' : ''}` : ''}
                </span>
                <span className="ms-auto"><TemplateSelectMock code={course.code} /></span>
              </div>
              {course.items.map(item => (
                <div key={item.id} className="grid items-center gap-3 px-3 border-b border-border last:border-b-0" style={{ gridTemplateColumns: '24px minmax(0,1.2fr) minmax(0,1.6fr) 130px', minHeight: 52 }}>
                  <span className="flex items-center justify-center">
                    {item.status !== 'gap' && (
                      <Checkbox
                        checked={included.has(item.id)}
                        onCheckedChange={() => toggle(item.id)}
                        aria-label={`Create survey — ${label(item)}${item.role ? `, ${item.role}` : ''}`}
                      />
                    )}
                  </span>
                  <EvaluateeCell item={item} subtitleRole />
                  {item.status === 'new' && (
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Will be created</span>
                  )}
                  {item.status === 'dup' && (
                    <span className="flex items-center gap-1.5 text-sm min-w-0">
                      <i className="fa-solid fa-triangle-exclamation text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                      <span className="truncate">
                        <span className="font-medium" style={{ color: 'var(--chip-4)' }}>Already surveyed</span>
                        <span style={{ color: 'var(--muted-foreground)' }}> — {item.existing}. Check to run again.</span>
                      </span>
                    </span>
                  )}
                  {item.status === 'gap' && (
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing to create for this role</span>
                  )}
                  <span className="flex justify-end">{item.status === 'gap' && <AddFacultyBtn />}</span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Variant B — Decision zones ───────────────────────────────────────────────
// Status-first grouping (Aarti's rule): the calm zone lists what ships with
// NO status column at all — being in the list IS the status. The attention
// zone holds only duplicates + gaps, each with its explanation and remedy.

function VariantB() {
  const { included, toggle } = useIncluded()
  const ready = COURSES.flatMap(c => c.items.filter(i => i.status === 'new').map(i => ({ ...i, course: c.code })))
  const attention = COURSES.flatMap(c => c.items.filter(i => i.status !== 'new').map(i => ({ ...i, course: c.code })))
  return (
    <div className="flex flex-col gap-3">
      <SummaryLine included={included} />
      <div className="rounded-lg border border-border overflow-hidden">
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border text-xs font-semibold" style={{ background: 'var(--group-band-attention-bg)', color: 'var(--chip-4)' }}>
          <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
          Needs your decision
          <span className="font-normal">{attention.length} evaluatees</span>
        </div>
        {attention.map(item => (
          <div key={item.id} className="grid items-center gap-3 px-3 border-b border-border" style={{ gridTemplateColumns: '24px 90px minmax(0,1.1fr) minmax(0,1.7fr) 130px', minHeight: 52 }}>
            <span className="flex items-center justify-center">
              {item.status === 'dup' && (
                <Checkbox checked={included.has(item.id)} onCheckedChange={() => toggle(item.id)} aria-label={`Re-evaluate ${label(item)} as ${item.role}`} />
              )}
            </span>
            <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{item.course}</span>
            <EvaluateeCell item={item} subtitleRole />
            <span className="text-sm min-w-0 truncate">
              {item.status === 'dup'
                ? <><span className="font-medium" style={{ color: 'var(--chip-4)' }}>Already surveyed</span><span style={{ color: 'var(--muted-foreground)' }}> — {item.existing}. Check to run again.</span></>
                : <span style={{ color: 'var(--muted-foreground)' }}>No {item.role} in Prism — nothing to create.</span>}
            </span>
            <span className="flex justify-end">{item.status === 'gap' && <AddFacultyBtn />}</span>
          </div>
        ))}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-border text-xs font-semibold" style={{ background: 'var(--group-band-done-bg)', color: 'var(--chip-2)' }}>
          <i className="fa-solid fa-circle-check" aria-hidden="true" />
          Ready to send
          <span className="font-normal">{ready.filter(i => included.has(i.id)).length} surveys</span>
        </div>
        {ready.map(item => (
          <div key={item.id} className="grid items-center gap-3 px-3 border-b border-border last:border-b-0" style={{ gridTemplateColumns: '24px 90px minmax(0,1.1fr) minmax(0,1.7fr) 130px', minHeight: 48 }}>
            <span className="flex items-center justify-center">
              <Checkbox checked={included.has(item.id)} onCheckedChange={() => toggle(item.id)} aria-label={`Create survey — ${label(item)}`} />
            </span>
            <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{item.course}</span>
            <EvaluateeCell item={item} subtitleRole />
            <span />
            <span />
          </div>
        ))}
      </div>
      <p className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Template assignment moves to a per-course row above the zones (not shown) — the zones themselves are about the send decision only.</p>
    </div>
  )
}

// ── Variant C — Course cards ─────────────────────────────────────────────────
// Containment instead of band tinting: one card per course, template in the
// card header beside a one-line verdict, evaluatee rows kept to a single
// calm line each. Exceptions tint only their own row's leading icon + copy.

function VariantC() {
  const { included, toggle } = useIncluded()
  return (
    <div className="flex flex-col gap-3">
      <SummaryLine included={included} />
      <div className="grid gap-3" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(420px, 1fr))' }}>
        {COURSES.map(course => {
          const fresh = course.items.filter(i => i.status === 'new').length
          const dups = course.items.filter(i => i.status === 'dup').length
          return (
            <div key={course.code} className="rounded-lg border border-border overflow-hidden flex flex-col" style={{ background: 'var(--background)' }}>
              <div className="flex items-start justify-between gap-3 px-4 pt-3 pb-2">
                <div className="flex flex-col min-w-0">
                  <span className="font-mono text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>{course.code}</span>
                  <span className="text-sm font-semibold truncate">{course.name}</span>
                  <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                    {fresh} new{dups > 0 ? ` · ${dups} duplicate${dups !== 1 ? 's' : ''}` : ''}
                  </span>
                </div>
                <TemplateSelectMock code={course.code} />
              </div>
              <div className="border-t border-border">
                {course.items.map(item => (
                  <div key={item.id} className="flex items-center gap-2.5 px-4 border-b border-border last:border-b-0" style={{ minHeight: 46 }}>
                    {item.status !== 'gap'
                      ? <Checkbox checked={included.has(item.id)} onCheckedChange={() => toggle(item.id)} aria-label={`Create survey — ${label(item)}`} />
                      : <span className="w-4" aria-hidden="true" />}
                    <EvaluateeCell item={item} />
                    <span className="ms-auto flex items-center gap-2 text-xs whitespace-nowrap" style={{ color: 'var(--muted-foreground)' }}>
                      {item.role && <span>{item.role}</span>}
                      {item.status === 'dup' && (
                        <Tip label={`Existing survey: ${item.existing}. Check the box to re-evaluate.`} side="left">
                          <span className="flex items-center gap-1 font-medium" style={{ color: 'var(--chip-4)' }}>
                            <i className="fa-solid fa-triangle-exclamation" aria-hidden="true" />
                            Already surveyed
                          </span>
                        </Tip>
                      )}
                      {item.status === 'gap' && <AddFacultyBtn />}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Variant D — Plan sentences ───────────────────────────────────────────────
// The copy does all the work: every line is a readable sentence about what
// will happen, indented under its course. Duplicates are amber sentences
// with the opt-in phrased as the action it is.

function VariantD() {
  const { included, toggle } = useIncluded()
  const [dReEval, setDReEval] = useState<Record<string, boolean>>({})
  return (
    <div className="flex flex-col gap-3">
      <SummaryLine included={included} />
      <Card size="sm" style={{ background: 'var(--background)' }}>
        <CardContent className="flex flex-col gap-4">
        {COURSES.map(course => (
          <div key={course.code} className="flex flex-col gap-1.5">
            <div className="flex items-center gap-3">
              <span className="text-sm font-semibold">
                <span className="font-mono text-xs tabular-nums">{course.code}</span>
                <span className="mx-1.5" aria-hidden="true">·</span>
                {course.name}
              </span>
              <span className="ms-auto"><TemplateSelectMock code={course.code} /></span>
            </div>
            <div className="flex flex-col border-s-2 ps-4 ms-1 gap-0.5" style={{ borderColor: 'var(--border)' }}>
              {course.items.filter(i => i.status === 'new').map(item => (
                <div key={item.id} className="flex items-center gap-2.5" style={{ minHeight: 36 }}>
                  <Checkbox checked={included.has(item.id)} onCheckedChange={() => toggle(item.id)} aria-label={`Create survey — ${label(item)}`} />
                  <span className="text-sm">
                    {item.kind === 'course'
                      ? <>Evaluate the <span className="font-medium">course material</span></>
                      : <>Evaluate <span className="font-medium">{item.name}</span> as {item.role}</>}
                  </span>
                </div>
              ))}
              {course.items.filter(i => i.status === 'gap').map(item => (
                <div key={item.id} className="flex items-center gap-2.5" style={{ minHeight: 36 }}>
                  <span className="flex items-center gap-2.5 text-sm min-w-0">
                    <span style={{ color: 'var(--muted-foreground)' }}>
                      No <span className="font-medium" style={{ color: 'var(--chip-4)' }}>{item.role}</span> on this course — add one in Prism to evaluate the role
                    </span>
                    <AddFacultyBtn />
                  </span>
                </div>
              ))}
              {(() => {
                const dups = course.items.filter(i => i.status === 'dup')
                if (dups.length === 0) return null
                const saidYes = dReEval[course.code] ?? false
                const names = dups.map(i => (i.kind === 'course' ? 'the course material' : `${i.name}`))
                const list = names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
                return (
                  <>
                    <div className="flex items-center gap-2.5" style={{ minHeight: 36 }}>
                      <span className="text-sm min-w-0 truncate">
                        <i className="fa-solid fa-triangle-exclamation text-xs me-1.5" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                        <span className="font-medium" style={{ color: 'var(--chip-4)' }}>{list.charAt(0).toUpperCase() + list.slice(1)}</span>
                        <span style={{ color: 'var(--muted-foreground)' }}> {dups.length !== 1 ? 'were' : 'was'} already surveyed — evaluate again?</span>
                      </span>
                      <label htmlFor={`d-reeval-${course.code}`} className="ms-auto flex items-center gap-2 text-sm shrink-0 cursor-pointer">
                        <span style={{ color: 'var(--muted-foreground)' }}>{saidYes ? 'Yes' : 'No'}</span>
                        <ToggleSwitch
                          id={`d-reeval-${course.code}`}
                          checked={saidYes}
                          onChange={(v) => {
                            setDReEval(p => ({ ...p, [course.code]: v }))
                            // Yes pre-includes everyone (then exclude individuals);
                            // No pulls them all back out.
                            dups.forEach(d => { if (v !== included.has(d.id)) toggle(d.id) })
                          }}
                        />
                        <span className="sr-only">Evaluate the already-surveyed people of {course.code} again</span>
                      </label>
                    </div>
                    {saidYes && dups.map(item => (
                      <div key={item.id} className="flex items-center gap-2.5 ps-6" style={{ minHeight: 36 }}>
                        <Checkbox checked={included.has(item.id)} onCheckedChange={() => toggle(item.id)} aria-label={`Re-evaluate ${label(item)}`} />
                        <span className="text-sm">
                          {item.kind === 'course'
                            ? <>Evaluate the <span className="font-medium">course material</span> again</>
                            : <>Evaluate <span className="font-medium">{item.name}</span> as {item.role} again</>}
                        </span>
                      </div>
                    ))}
                  </>
                )
              })()}
            </div>
          </div>
        ))}
        </CardContent>
      </Card>
    </div>
  )
}

// ── Page ─────────────────────────────────────────────────────────────────────

// ── Variant E — Stacked statuses + course-level question ─────────────────────
// Romit's Jul 24 direction: instances sharing a status STACK into one line per
// course. Duplicates become a QUESTION with a yes/no toggle — "evaluate them
// again?". No (default) keeps them collapsed and skipped; Yes expands the
// stack so the admin picks WHOM to re-evaluate, person by person. The per-row
// decision only appears after the course-level intent is stated.

function VariantE() {
  const { included, toggle } = useIncluded()
  const [reEval, setReEval] = useState<Record<string, boolean>>({})
  const [adjustOpen, setAdjustOpen] = useState<Record<string, boolean>>({})
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const isIn = (item: Item, course: string) =>
    item.status === 'gap' ? false
      : item.status === 'dup' ? (reEval[course] ?? false) && !excluded.has(item.id)
      : included.has(item.id) && !excluded.has(item.id)
  const flip = (item: Item, courseDups?: Item[], courseCode?: string) => {
    if (item.status === 'new') { toggle(item.id); return }
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(item.id) ? next.delete(item.id) : next.add(item.id)
      // "Yes" with nobody selected is a contradiction — unchecking the last
      // person flips the course back to No (collapsed).
      if (courseDups && courseCode && courseDups.every(d => next.has(d.id))) {
        setReEval(r => ({ ...r, [courseCode]: false }))
        courseDups.forEach(d => next.delete(d.id))
      }
      return next
    })
  }
  const all = COURSES.flatMap(c => c.items.map(i => ({ i, c: c.code })))
  const create = all.filter(({ i, c }) => isIn(i, c)).length
  const reEvals = all.filter(({ i, c }) => i.status === 'dup' && isIn(i, c)).length
  const skipped = all.filter(({ i, c }) => i.status === 'dup' && !isIn(i, c)).length

  const names = (items: Item[]) =>
    items.map(i => (i.kind === 'course' ? 'Course material' : i.name!)).join(', ')

  /* Ledger line — the settled flow-ledger anatomy (readiness step / term
     workspace): 20px glyph disc or avatar · name · muted role suffix. */
  const LedgerLine = ({ item }: { item: Item }) => (
    <span className="flex items-center gap-1.5 min-w-0">
      {item.kind === 'course'
        ? (
          <span className="size-5 rounded-full flex items-center justify-center shrink-0 border border-border" style={{ background: 'var(--background)' }}>
            <i className="fa-light fa-book-open" style={{ fontSize: 9, color: 'var(--muted-foreground)' }} aria-hidden="true" />
          </span>
        )
        : <PersonAvatar name={item.name!} className="size-5" />}
      <span className="text-sm truncate">
        {item.kind === 'course' ? 'Course material' : item.name}
        {item.role && <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}> · {item.role}</span>}
      </span>
    </span>
  )

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm tabular-nums">
        <span className="font-semibold">{create} surveys</span> will be created
        {reEvals > 0 && <span style={{ color: 'var(--chip-4)' }}> · {reEvals} re-evaluation{reEvals !== 1 ? 's' : ''}</span>}
        {skipped > 0 && <span style={{ color: 'var(--muted-foreground)' }}> · {skipped} duplicate{skipped !== 1 ? 's' : ''} skipped</span>}
        <span style={{ color: 'var(--chip-4)' }}> · 1 role unassigned</span>
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        {COURSES.map(course => {
          const fresh = course.items.filter(i => i.status === 'new')
          const dups = course.items.filter(i => i.status === 'dup')
          const gaps = course.items.filter(i => i.status === 'gap')
          const freshIn = fresh.filter(i => isIn(i, course.code)).length
          const open = adjustOpen[course.code] ?? false
          const saidYes = reEval[course.code] ?? false
          return (
            <div key={course.code}>
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border" style={{ background: 'var(--muted)' }}>
                <span className="text-sm font-semibold">
                  <span className="font-mono text-xs tabular-nums">{course.code}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {course.name}
                </span>
                <span className="ms-auto"><TemplateSelectMock code={course.code} /></span>
              </div>

              {/* New surveys — one line; the list opens on demand. */}
              {fresh.length > 0 && (
                <Collapsible
                  open={open}
                  onOpenChange={(v) => setAdjustOpen(p => ({ ...p, [course.code]: v }))}
                  className="border-b border-border"
                >
                  <div className="flex items-center gap-2.5 px-3" style={{ minHeight: 46 }}>
                    <span aria-hidden="true" className="size-1.5 rounded-full shrink-0" style={{ background: 'var(--chart-2)' }} />
                    <span className="text-sm shrink-0 font-medium">{freshIn} new survey{freshIn !== 1 ? 's' : ''}</span>
                    <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{names(fresh)}</span>
                    <AvatarGroup className="ms-auto shrink-0">
                      {fresh.filter(i => i.kind === 'person').map(i => (
                        <PersonAvatar key={i.id} name={i.name!} className="size-5" />
                      ))}
                    </AvatarGroup>
                    <CollapsibleTrigger asChild>
                      <Button variant="ghost" size="xs" className="text-muted-foreground hover:text-foreground shrink-0">
                        {open ? 'Hide' : 'Edit'}
                        <i className={`fa-light fa-chevron-${open ? 'up' : 'down'} text-xs`} aria-hidden="true" />
                      </Button>
                    </CollapsibleTrigger>
                  </div>
                  <CollapsibleContent>
                    {fresh.map(item => (
                      <div key={item.id} className="flex items-center gap-2.5 ps-8 pe-3 border-t border-border" style={{ minHeight: 42, background: 'var(--card)' }}>
                        <Checkbox
                          id={`e-new-${item.id}`}
                          checked={isIn(item, course.code)}
                          onCheckedChange={() => flip(item)}
                        />
                        <CheckboxLabel htmlFor={`e-new-${item.id}`} className="flex items-center font-normal min-w-0">
                          <LedgerLine item={item} />
                        </CheckboxLabel>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Already surveyed — the question, its status chip, its toggle. */}
              {dups.length > 0 && (
                <Collapsible open={saidYes} className="border-b border-border">
                  <div className="flex items-center gap-2.5 px-3" style={{ minHeight: 46 }}>
                    <i className="fa-solid fa-triangle-exclamation text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                    <span className="text-sm shrink-0 font-medium" style={{ color: 'var(--chip-4)' }}>Already surveyed</span>
                    <span className="text-sm truncate" style={{ color: 'var(--muted-foreground)' }}>{names(dups)}</span>
                    <span className="shrink-0 flex items-center gap-1.5">
                      <SurveyStatusBadgeOS status="scheduled" />
                      <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>Dec 4</span>
                    </span>
                    <label htmlFor={`reeval-${course.code}`} className="ms-auto flex items-center gap-2 text-sm shrink-0 cursor-pointer">
                      <span className="font-medium">Evaluate again?</span>
                      <span style={{ color: 'var(--muted-foreground)' }}>{saidYes ? 'Yes' : 'No'}</span>
                      <ToggleSwitch
                        id={`reeval-${course.code}`}
                        checked={saidYes}
                        onChange={(v) => {
                          setReEval(p => ({ ...p, [course.code]: v }))
                          if (v) setExcluded(prev => { const n = new Set(prev); dups.forEach(d => n.delete(d.id)); return n })
                        }}
                      />
                      <span className="sr-only">Evaluate the already-surveyed people of {course.code} again</span>
                    </label>
                  </div>
                  <CollapsibleContent>
                    {dups.map(item => (
                      <div key={item.id} className="flex items-center gap-2.5 ps-8 pe-3 border-t border-border" style={{ minHeight: 42, background: 'var(--card)' }}>
                        <Checkbox
                          id={`e-dup-${item.id}`}
                          checked={isIn(item, course.code)}
                          onCheckedChange={() => flip(item, dups, course.code)}
                        />
                        <CheckboxLabel htmlFor={`e-dup-${item.id}`} className="flex items-center font-normal min-w-0">
                          <LedgerLine item={item} />
                        </CheckboxLabel>
                        <span className="ms-auto shrink-0 flex items-center gap-1.5">
                          <SurveyStatusBadgeOS status="scheduled" />
                          <span className="text-xs tabular-nums" style={{ color: 'var(--muted-foreground)' }}>Dec 4</span>
                        </span>
                      </div>
                    ))}
                  </CollapsibleContent>
                </Collapsible>
              )}

              {/* Missing role — one line, the button is the fix. */}
              {gaps.map(item => (
                <div key={item.id} className="flex items-center gap-2.5 px-3 border-b border-border" style={{ minHeight: 46 }}>
                  <i className="fa-solid fa-triangle-exclamation text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                  <span className="text-sm font-medium" style={{ color: 'var(--chip-4)' }}>No {item.role} assigned</span>
                  <span className="ms-auto"><AddFacultyBtn /></span>
                </div>
              ))}
            </div>
          )
        })}
      </div>
    </div>
  )
}

// ── Variant F — Ledger with the question (A × E) ─────────────────────────────
// A's scannable per-row table adopts E's mechanic: new instances stay
// individual rows (sortable, skimmable), but a course's duplicates collapse
// into ONE amber question row with the yes/no toggle. Yes materializes them
// as normal rows beneath it. This shape maps 1:1 onto the vendored DataTable
// (question row = a synthetic group row), so it keeps search/filter/paging.

function VariantF() {
  const { included, toggle } = useIncluded()
  const [reEval, setReEval] = useState<Record<string, boolean>>({})
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  const isIn = (item: Item, course: string) =>
    item.status === 'gap' ? false
      : item.status === 'dup' ? (reEval[course] ?? false) && !excluded.has(item.id)
      : included.has(item.id)
  const flipDup = (item: Item, dups: Item[], course: string) =>
    setExcluded(prev => {
      const next = new Set(prev)
      next.has(item.id) ? next.delete(item.id) : next.add(item.id)
      if (dups.every(d => next.has(d.id))) {
        setReEval(r => ({ ...r, [course]: false }))
        dups.forEach(d => next.delete(d.id))
      }
      return next
    })
  const nameList = (items: Item[]) => {
    const names = items.map(i => (i.kind === 'course' ? 'Course material' : i.name!))
    return names.length <= 1 ? (names[0] ?? '') : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`
  }
  const all = COURSES.flatMap(c => c.items.map(i => ({ i, c: c.code })))
  const create = all.filter(({ i, c }) => isIn(i, c)).length
  const reEvals = all.filter(({ i, c }) => i.status === 'dup' && isIn(i, c)).length
  const skipped = all.filter(({ i, c }) => i.status === 'dup' && !isIn(i, c)).length

  return (
    <div className="flex flex-col gap-3">
      <p className="text-sm tabular-nums">
        <span className="font-semibold">{create} surveys</span> will be created
        {reEvals > 0 && <span style={{ color: 'var(--chip-4)' }}> · {reEvals} re-evaluation{reEvals !== 1 ? 's' : ''}</span>}
        {skipped > 0 && <span style={{ color: 'var(--muted-foreground)' }}> · {skipped} duplicate{skipped !== 1 ? 's' : ''} skipped</span>}
        <span style={{ color: 'var(--chip-4)' }}> · 1 role unassigned</span>
      </p>
      <div className="rounded-lg border border-border overflow-hidden">
        {COURSES.map(course => {
          const fresh = course.items.filter(i => i.status === 'new')
          const dups = course.items.filter(i => i.status === 'dup')
          const gaps = course.items.filter(i => i.status === 'gap')
          const saidYes = reEval[course.code] ?? false
          return (
            <div key={course.code}>
              <div className="flex items-center gap-3 px-3 py-2 border-b border-border" style={{ background: 'var(--muted)' }}>
                <span className="text-sm font-semibold">
                  <span className="font-mono text-xs tabular-nums">{course.code}</span>
                  <span className="mx-1.5" aria-hidden="true">·</span>
                  {course.name}
                </span>
                <span className="ms-auto"><TemplateSelectMock code={course.code} /></span>
              </div>
              {fresh.map(item => (
                <div key={item.id} className="grid items-center gap-3 px-3 border-b border-border" style={{ gridTemplateColumns: '24px minmax(0,1.2fr) minmax(0,1.6fr) 130px', minHeight: 50 }}>
                  <span className="flex items-center justify-center">
                    <Checkbox
                      checked={included.has(item.id)}
                      onCheckedChange={() => toggle(item.id)}
                      aria-label={`Create survey — ${label(item)}${item.role ? `, ${item.role}` : ''}`}
                    />
                  </span>
                  <EvaluateeCell item={item} subtitleRole />
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Will be created</span>
                  <span />
                </div>
              ))}
              {gaps.map(item => (
                <div key={item.id} className="grid items-center gap-3 px-3 border-b border-border" style={{ gridTemplateColumns: '24px minmax(0,1.2fr) minmax(0,1.6fr) 130px', minHeight: 50 }}>
                  <span />
                  <EvaluateeCell item={item} subtitleRole />
                  <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Nothing to create for this role</span>
                  <span className="flex justify-end"><AddFacultyBtn /></span>
                </div>
              ))}
              {dups.length > 0 && (
                <>
                  <div className="flex items-center gap-2.5 px-3 border-b border-border" style={{ minHeight: 50, background: saidYes ? undefined : 'var(--card)' }}>
                    <i className="fa-solid fa-triangle-exclamation text-xs shrink-0" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
                    <span className="text-sm min-w-0 truncate">
                      <span className="font-medium" style={{ color: 'var(--chip-4)' }}>{nameList(dups)} {dups.length !== 1 ? 'were' : 'was'} already surveyed</span>
                      <span style={{ color: 'var(--muted-foreground)' }}> — {dups.length !== 1 ? 'those surveys open' : 'it opens'} Dec 4</span>
                    </span>
                    <label htmlFor={`f-reeval-${course.code}`} className="ms-auto flex items-center gap-2.5 text-sm shrink-0 cursor-pointer">
                      <span className="font-medium">Evaluate again?</span>
                      <span style={{ color: 'var(--muted-foreground)' }}>{saidYes ? 'Yes' : 'No'}</span>
                      <ToggleSwitch
                        id={`f-reeval-${course.code}`}
                        checked={saidYes}
                        onChange={(v) => {
                          setReEval(pr => ({ ...pr, [course.code]: v }))
                          if (v) setExcluded(prev => { const n = new Set(prev); dups.forEach(d => n.delete(d.id)); return n })
                        }}
                      />
                      <span className="sr-only">Evaluate the already-surveyed people of {course.code} again</span>
                    </label>
                  </div>
                  {saidYes && dups.map(item => (
                    <div key={item.id} className="grid items-center gap-3 ps-6 pe-3 border-b border-border" style={{ gridTemplateColumns: '24px minmax(0,1.2fr) minmax(0,1.6fr) 130px', minHeight: 50, background: 'var(--card)' }}>
                      <span className="flex items-center justify-center">
                        <Checkbox
                          checked={isIn(item, course.code)}
                          onCheckedChange={() => flipDup(item, dups, course.code)}
                          aria-label={`Re-evaluate ${label(item)}${item.role ? ` as ${item.role}` : ''}`}
                        />
                      </span>
                      <EvaluateeCell item={item} subtitleRole />
                      <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
                        {isIn(item, course.code) ? 'Will get a second survey' : 'Kept out'}
                      </span>
                      <span />
                    </div>
                  ))}
                </>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}

const VARIANTS = [
  { tag: 'a', title: 'Quiet ledger', thesis: "Today's anatomy, noise removed — role rides under the name, 'Will be created' is muted text, only duplicates and gaps carry color.", body: <VariantA /> },
  { tag: 'b', title: 'Decision zones', thesis: "Status-first grouping: an attention zone holding only the decisions (duplicates, gaps), then a calm 'Ready to send' list with no status column at all.", body: <VariantB /> },
  { tag: 'c', title: 'Course cards', thesis: 'Containment over band tinting: one card per course with the template in its header — instance rows stay one calm line each.', body: <VariantC /> },
  { tag: 'd', title: 'Plan sentences', thesis: "The copy does the work: every row is a sentence about what will happen. Adapted to the stacked question — duplicates are one amber sentence with the yes/no toggle; Yes reveals per-person 'evaluate again' sentences.", body: <VariantD /> },
  { tag: 'f', title: 'Ledger with the question (A × E)', thesis: "A's scannable per-row table adopts E's mechanic: new instances stay individual rows, a course's duplicates collapse into one amber question row with the toggle — Yes materializes them as rows. Maps 1:1 onto the real DataTable.", body: <VariantF /> },
  { tag: 'e', title: 'Stacked question', thesis: "Common statuses stack into one line per course. Duplicates become a question — 'evaluate again?' with a yes/no toggle; Yes reveals the people so you pick whom to re-evaluate.", body: <VariantE /> },
]

function CompareInner() {
  // ?v=a|b|c|d shows ONE variant full-width; no param stacks all four.
  const params = useSearchParams()
  const only = params?.get('v')?.toLowerCase() ?? null
  const shown = VARIANTS.filter(v => !only || v.tag === only)
  const active = shown.length === 1 ? shown[0] : null
  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      <SiteHeader
        breadcrumbs={[{ label: 'Compare', href: '/compare/push-instances' }]}
        title={active ? `Survey design — ${active.tag.toUpperCase()} · ${active.title}` : 'Survey design table — 4 variants'}
      />
      <h1 className="sr-only">{active ? `Survey design variant ${active.tag.toUpperCase()} — ${active.title}` : 'Survey design table — 4 variants'}</h1>
      <div className="flex-1 overflow-auto flex flex-col gap-6" style={{ padding: '24px 40px 64px', maxWidth: 1180 }}>
        {/* Variant switcher — one link per variant + all. */}
        <div className="flex items-center gap-2 flex-wrap">
          {VARIANTS.map(v => (
            <Button key={v.tag} asChild size="sm" variant={only === v.tag ? 'secondary' : 'outline'}>
              <a href={`/compare/push-instances?v=${v.tag}`} aria-current={only === v.tag ? 'page' : undefined}>
                {v.tag.toUpperCase()} — {v.title}
              </a>
            </Button>
          ))}
          <Button asChild size="sm" variant={!only ? 'secondary' : 'ghost'}>
            <a href="/compare/push-instances" aria-current={!only ? 'page' : undefined}>All four</a>
          </Button>
        </div>
        <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
          Same data in {active ? 'every variant' : 'all variants'} (incl. the DPT-510 late-co-instructor duplicate case). Shared copy system: creation is the quiet default,
          only exceptions speak, gap rows have no checkbox, bands count surveys not records.
        </p>
        {/* CardTitle renders an h3 — this h2 keeps the heading outline
            sequential (axe heading-order). */}
        <h2 className="sr-only">Variants</h2>
        {shown.map(v => (
          <VariantFrame key={v.tag} tag={v.tag} title={v.title} thesis={v.thesis}>
            {v.body}
          </VariantFrame>
        ))}
      </div>
    </div>
  )
}

export default function PushInstancesComparePage() {
  return (
    <Suspense fallback={<h1 className="sr-only">Survey design table — 4 variants</h1>}>
      <CompareInner />
    </Suspense>
  )
}
