'use client'

// COMPARE ROUTE (throwaway — same lifecycle as /compare/push-step2-simplify
// and its siblings, delete once a direction is picked).
//
// 2026-08-05 — Romit flagged the shipped inline "Switch template / Keep
// current" card (step-survey-instances.tsx:1657-1691) as confusing: the
// Select trigger jumps to the newly-picked template instantly while the
// metadata caption below it still describes the old one, so the row shows
// two different templates as already-true at once. Round 1 explored three
// interaction models for that (interactive HTML mockup, not reproduced
// here). Round 2 pushed back on all three: none of them made the decision
// MANDATORY — an admin could stage a pick and just move on to Step 3,
// leaving the row half-decided.
//
// This route applies the picked direction (Variant A — "Honest Trigger":
// the Select never moves until the admin decides) PLUS the fix for that
// second round of feedback, wired into the wizard's existing block-Continue
// gate instead of a new mechanism (`canContinue` / `gate.reasons`,
// step-survey-instances.tsx:1187-1192, 2174-2188 — the same gate an
// unresolved template overlap already uses). Toggle "Today's behavior" to
// see the shipped dismissible-card version for comparison; "Proposed" adds
// the Decision-needed badge, the disabled-Continue footer, and a LocalBanner
// validation summary — the same tier as a form's error-summary pattern,
// which reads better than a per-row Tip alone once there are 10+ courses in
// one push (Aug 4 transcript scale concern, already precedented for the
// late-added-co-instructor case at line 1164-1166 of the real file).
//
// Section 2 is a second, real use case the first round under-covered: a
// switch that adds SEVERAL new faculty roles at once, one of them ending up
// staffed by more than one person. Nothing here is new engineering — the
// Action-column "Assign N roles" copy (:390) and the AvatarGroup
// co-instructor rendering (:567-591) already exist in the shipped file;
// this route just gives them a template-switch entry point to walk through.
//
// Self-contained fixture below (own DemoTemplate/consequence helpers) —
// deliberately NOT wired to the real CourseGate/expandInstances engine, so
// this stays reviewable in isolation. Real DS components throughout
// (Select/Button/Card/LocalBanner/Badge/Checkbox/Tip/AvatarGroup +
// ListHubStatusBadge/PersonAvatar), same imports as the production file.

import { useRef, useState } from 'react'
import {
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  Button, LocalBanner, Tip, Card, CardContent,
  Checkbox, CheckboxLabel, AvatarGroup, AvatarGroupCount,
} from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { ListHubStatusBadge } from '@/components/list-hub-status-badge'
import { LIST_HUB_STATUS_TINT_WARNING, LIST_HUB_STATUS_TINT_SUCCESS } from '@/lib/list-status-badges'

// ── Self-contained fixture — not the real PceTemplate/CourseGate model ────
interface DemoTemplate { id: string; name: string; questionCount: number; criteria: string[] }

const TEMPLATES: DemoTemplate[] = [
  { id: 'eot', name: 'End-of-Term Evaluation', questionCount: 8, criteria: ['Course material', 'Instructor', 'Coordinator'] },
  { id: 'fmc', name: 'Faculty Midterm Check-In', questionCount: 3, criteria: ['Coordinator'] },
  { id: 'cps', name: 'Coordinator Pulse Survey', questionCount: 4, criteria: ['Instructor', 'Coordinator'] },
]

const MF_TEMPLATES: DemoTemplate[] = [
  { id: 'ccr', name: 'Course Content Review', questionCount: 4, criteria: ['Course material'] },
  { id: 'fca', name: 'Full Clinical Assessment', questionCount: 12, criteria: ['Course material', 'Instructor', 'Course Coordinator', 'Clinical Preceptor'] },
]

const FACULTY_CANDIDATES = ['Dr. Kevin Chen', 'Dr. Rachel Gomez', 'Dr. Priya Raman', 'Dr. Daniel Okafor']
const MF_ROLES = ['Instructor', 'Course Coordinator', 'Clinical Preceptor'] as const

const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

function consequence(current: DemoTemplate, staged: DemoTemplate) {
  const currentSet = new Set(current.criteria)
  const stagedSet = new Set(staged.criteria)
  return {
    added: staged.criteria.filter(c => !currentSet.has(c)),
    removed: current.criteria.filter(c => !stagedSet.has(c)),
  }
}

function consequenceCopy(current: DemoTemplate, staged: DemoTemplate, tense: 'present' | 'future') {
  const { added, removed } = consequence(current, staged)
  const lead = tense === 'future' ? `Replace with ${staged.name}?` : `${staged.name} takes its place.`
  let body: string
  if (removed.length > 0 && added.length > 0) body = `Stops evaluating ${listFmt(removed)} and adds ${listFmt(added)}.`
  else if (removed.length > 0) body = `Stops evaluating ${listFmt(removed)} and adds nothing new.`
  else if (added.length > 0) body = `Adds ${listFmt(added)}. Nothing is removed.`
  else body = 'Same aspects, different questions.'
  return { lead, body }
}

function captionOf(t: DemoTemplate) {
  return `${t.name} · ${t.questionCount} question${t.questionCount !== 1 ? 's' : ''} · evaluates ${t.criteria.join(', ')}`
}

// ── Section 1 — the mandatory decision ────────────────────────────────────

function TemplateSelect({
  templates, committedId, onPick, disabled,
}: {
  templates: DemoTemplate[]
  committedId: string
  onPick: (id: string) => void
  disabled?: boolean
}) {
  return (
    <Select value={committedId} onValueChange={onPick} disabled={disabled}>
      <SelectTrigger size="sm" aria-label="Template" className="w-full max-w-sm">
        <SelectValue />
      </SelectTrigger>
      <SelectContent>
        {templates.map(t => (
          <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}

function ConsequenceCard({
  current, staged, onSwitch, onKeep,
}: {
  current: DemoTemplate
  staged: DemoTemplate
  onSwitch: () => void
  onKeep: () => void
}) {
  const { lead, body } = consequenceCopy(current, staged, 'future')
  return (
    <Card className="max-w-sm">
      <CardContent className="flex flex-col gap-2 p-2.5">
        <p className="text-xs text-muted-foreground">
          <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
          <span className="font-medium text-foreground">{lead}</span> {body}
        </p>
        <div className="flex items-center gap-1.5">
          <Button variant="default" size="xs" onClick={onSwitch}>Switch template</Button>
          <Button variant="ghost" size="xs" onClick={onKeep}>Keep current</Button>
        </div>
      </CardContent>
    </Card>
  )
}

function MandatorySection() {
  const [mode, setMode] = useState<'today' | 'proposed'>('proposed')
  const [committed, setCommitted] = useState('eot')
  const [pending, setPending] = useState<string | null>(null)
  const [continued, setContinued] = useState(false)
  const rowRef = useRef<HTMLDivElement>(null)

  const committedTemplate = TEMPLATES.find(t => t.id === committed)!
  const stagedTemplate = pending ? TEMPLATES.find(t => t.id === pending) ?? null : null
  const unresolved = mode === 'proposed' && !!stagedTemplate
  const canContinue = !unresolved

  const reset = () => { setCommitted('eot'); setPending(null); setContinued(false) }

  return (
    <section className="flex flex-col gap-3">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h2 className="text-base font-semibold font-heading">1 · Making the decision mandatory</h2>
          <p className="text-sm text-muted-foreground max-w-2xl">
            Pick a different template on DPT-101, then try to Continue without resolving it.
          </p>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          <Button variant={mode === 'today' ? 'default' : 'outline'} size="xs" onClick={() => { setMode('today'); reset() }}>
            Today&rsquo;s behavior
          </Button>
          <Button variant={mode === 'proposed' ? 'default' : 'outline'} size="xs" onClick={() => { setMode('proposed'); reset() }}>
            Proposed
          </Button>
        </div>
      </div>

      {mode === 'proposed' && unresolved && (
        <LocalBanner
          variant="warning"
          title="1 course needs a decision"
          action={{ label: 'Review', onClick: () => rowRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' }) }}
        >
          DPT-101 has a pending template change. Resolve it — Switch or Keep current — before continuing.
        </LocalBanner>
      )}

      <Card>
        <CardContent className="flex flex-col gap-3 p-4" ref={rowRef}>
          <div className="flex items-center justify-between gap-2">
            <span className="text-sm font-medium">DPT-101 · Human Anatomy &amp; Kinesiology</span>
            {mode === 'proposed' && (
              unresolved
                ? <ListHubStatusBadge label="Decision needed" tint={LIST_HUB_STATUS_TINT_WARNING} icon="fa-triangle-exclamation" />
                : <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
            )}
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Template</span>
            <TemplateSelect
              templates={TEMPLATES}
              committedId={committed}
              onPick={id => setPending(id === committed ? null : id)}
            />
          </div>

          {stagedTemplate && (
            <ConsequenceCard
              current={committedTemplate}
              staged={stagedTemplate}
              onSwitch={() => { setCommitted(stagedTemplate.id); setPending(null) }}
              onKeep={() => setPending(null)}
            />
          )}

          <p className="text-xs text-muted-foreground tabular-nums">{captionOf(committedTemplate)}</p>
        </CardContent>
      </Card>

      <div className="flex items-center justify-between text-xs text-muted-foreground border-t border-dashed border-border pt-2">
        <span>DPT-142 · Clinical Reasoning Seminar</span>
        <ListHubStatusBadge label="Ready" tint={LIST_HUB_STATUS_TINT_SUCCESS} icon="fa-circle-check" />
      </div>

      <div className="sticky bottom-0 bg-background border-t border-border py-3 flex items-center justify-between gap-4">
        <Button variant="outline" size="sm" disabled>
          <i className="fa-light fa-arrow-left text-xs" aria-hidden="true" />
          Back
        </Button>
        <div className="flex items-center gap-4">
          {mode === 'proposed' && unresolved && (
            <span className="text-xs tabular-nums font-medium" style={{ color: 'var(--chip-4)' }}>
              1 course has a pending template change
            </span>
          )}
          {canContinue ? (
            <Button variant="default" size="sm" onClick={() => setContinued(true)}>
              Continue
              <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
            </Button>
          ) : (
            <Tip label="Resolve the pending template change on DPT-101 first." side="top">
              <span className="inline-flex rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1" tabIndex={0}>
                <Button variant="default" size="sm" disabled>
                  Continue
                  <i className="fa-light fa-arrow-right text-xs" aria-hidden="true" />
                </Button>
              </span>
            </Tip>
          )}
        </div>
      </div>

      {continued && (
        <LocalBanner variant="success" action={{ label: 'Replay', onClick: reset }}>
          Advanced to Step 3 — Communication.
        </LocalBanner>
      )}
    </section>
  )
}

// ── Section 2 — a switch that adds several new faculty roles ─────────────

function RoleSlot({
  role, people, open, onToggleOpen, onToggleFaculty, onDone,
}: {
  role: string
  people: string[]
  open: boolean
  onToggleOpen: () => void
  onToggleFaculty: (name: string, checked: boolean) => void
  onDone: () => void
}) {
  const isGap = people.length === 0
  return (
    <div className="flex flex-col gap-2">
      <div className={`flex items-center justify-between gap-3 rounded-md border p-2.5 ${isGap ? 'border-dashed' : 'border-border'}`}>
        <div className="min-w-0">
          <div className="text-sm font-medium">
            {role}
            {isGap && <span className="ms-2 text-xs font-normal" style={{ color: 'var(--chip-4)' }}>needs a person</span>}
          </div>
          {people.length > 0 && (
            <div className="flex items-center gap-2 mt-1">
              <AvatarGroup aria-hidden="true">
                {people.slice(0, 2).map(name => <PersonAvatar key={name} name={name} decorative className="size-6" />)}
                {people.length > 2 && <AvatarGroupCount>+{people.length - 2}</AvatarGroupCount>}
              </AvatarGroup>
              <span className="text-xs text-muted-foreground truncate">{listFmt(people)}</span>
            </div>
          )}
        </div>
        <Button
          variant={isGap ? 'outline' : 'ghost'}
          size="xs"
          className="shrink-0"
          onClick={onToggleOpen}
          aria-label={isGap ? `Assign ${role}` : `Add more people to ${role}`}
        >
          <i className="fa-regular fa-circle-plus text-xs" aria-hidden="true" />
          {isGap ? 'Assign' : 'Add more'}
        </Button>
      </div>
      {open && (
        <Card>
          <CardContent className="flex flex-col gap-1.5 p-2.5">
            {FACULTY_CANDIDATES.map(name => {
              const id = `${role}-${name}`.replace(/\s+/g, '-')
              return (
                <CheckboxLabel key={id} htmlFor={id} className="flex items-center gap-2.5">
                  <Checkbox
                    id={id}
                    checked={people.includes(name)}
                    onCheckedChange={checked => onToggleFaculty(name, checked === true)}
                  />
                  <PersonAvatar name={name} className="size-6" />
                  <span className="text-sm">{name}</span>
                </CheckboxLabel>
              )
            })}
            <div className="flex justify-end pt-1">
              <Button variant="default" size="xs" onClick={onDone}>Done</Button>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}

function MultiFacultySection() {
  const [committed, setCommitted] = useState('ccr')
  const [pending, setPending] = useState<string | null>(null)
  const [switched, setSwitched] = useState(false)
  const [roles, setRoles] = useState<Record<string, string[]>>({
    'Instructor': [], 'Course Coordinator': [], 'Clinical Preceptor': [],
  })
  const [openPicker, setOpenPicker] = useState<string | null>(null)

  const committedTemplate = MF_TEMPLATES.find(t => t.id === committed)!
  const stagedTemplate = pending ? MF_TEMPLATES.find(t => t.id === pending) ?? null : null
  const gapRoles = MF_ROLES.filter(r => roles[r].length === 0)
  const actionLabel = gapRoles.length === 0 ? null : gapRoles.length === 1 ? `Assign ${gapRoles[0]}` : `Assign ${gapRoles.length} roles`

  const reset = () => {
    setCommitted('ccr'); setPending(null); setSwitched(false)
    setRoles({ 'Instructor': [], 'Course Coordinator': [], 'Clinical Preceptor': [] })
    setOpenPicker(null)
  }

  return (
    <section className="flex flex-col gap-3">
      <div>
        <h2 className="text-base font-semibold font-heading">2 · A switch that adds several new faculty roles</h2>
        <p className="text-sm text-muted-foreground max-w-2xl">
          DPT-205 switches from a course-only template to one needing three faculty roles — assign two
          co-instructors to Instructor to see the multi-person case.
        </p>
      </div>

      <Card>
        <CardContent className="flex flex-col gap-3 p-4">
          <span className="text-sm font-medium">DPT-205 · Advanced Orthotics</span>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs font-medium text-muted-foreground">Template</span>
            {switched ? (
              <Tip label="Template is locked after confirming the switch." side="top">
                <span
                  className="inline-flex w-full max-w-sm rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  tabIndex={0}
                >
                  <TemplateSelect
                    templates={MF_TEMPLATES}
                    committedId={committed}
                    onPick={id => setPending(id === committed ? null : id)}
                    disabled
                  />
                </span>
              </Tip>
            ) : (
              <TemplateSelect
                templates={MF_TEMPLATES}
                committedId={committed}
                onPick={id => setPending(id === committed ? null : id)}
              />
            )}
          </div>

          {stagedTemplate && (
            <ConsequenceCard
              current={committedTemplate}
              staged={stagedTemplate}
              onSwitch={() => { setCommitted(stagedTemplate.id); setPending(null); setSwitched(true) }}
              onKeep={() => setPending(null)}
            />
          )}

          <p className="text-xs text-muted-foreground tabular-nums">{captionOf(committedTemplate)}</p>

          {switched && (
            <div className="flex flex-col gap-2 border-t border-border pt-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
                {actionLabel
                  ? <span className="text-xs font-medium" style={{ color: 'var(--chip-4)' }}>{actionLabel}</span>
                  : <span className="text-xs text-muted-foreground">All roles staffed</span>}
              </div>
              {MF_ROLES.map(role => (
                <RoleSlot
                  key={role}
                  role={role}
                  people={roles[role]}
                  open={openPicker === role}
                  onToggleOpen={() => setOpenPicker(openPicker === role ? null : role)}
                  onToggleFaculty={(name, checked) => {
                    setRoles(prev => {
                      const list = prev[role]
                      const next = checked ? [...list, name] : list.filter(n => n !== name)
                      return { ...prev, [role]: next }
                    })
                  }}
                  onDone={() => setOpenPicker(null)}
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <div>
        <Button variant="ghost" size="xs" onClick={reset}>Reset use case</Button>
      </div>
    </section>
  )
}

export default function PushStep2TemplateSwitchComparePage() {
  return (
    <div className="flex flex-col gap-10 p-6 max-w-[900px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Step 2 — template-switch confirmation</h1>
        <p className="text-sm text-muted-foreground">
          Applies the picked interaction (Honest Trigger) plus the mandatory-decision gate. Not wired into the
          production wizard — real DS components, self-contained fixture data.
        </p>
      </div>
      <MandatorySection />
      <MultiFacultySection />
    </div>
  )
}
