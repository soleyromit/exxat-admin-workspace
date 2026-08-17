'use client'

// COMPARE ROUTE (throwaway — same lifecycle as sibling /compare/push-step2-*
// routes, delete once a direction is picked, not wired into production).
//
// Rounds 6-7 built six layout treatments (A-F) against a SIMPLIFIED snapshot
// of DPT-510 — one Ready pair, one Advisory person, one Blocked person — and
// reused the real TemplateControl's immediate-commit radios as-is. Cross-
// checking against the raw Aug 4 transcript (granola:5f6c8679...) and a live
// click-through of the real page (/surveys/push?term=pt5) surfaced three
// things none of the six actually modeled:
//
//   1. THE ORIGINAL BUG ITSELF — TemplateControl's radio visually commits
//      the instant you click it, then a SEPARATE inline card still gates the
//      real onTemplateChange behind "Switch template" — the exact
//      pending-vs-committed confusion this whole thread started from.
//      Verified still live today.
//   2. S2's coexisting two-row state — "Keep both" on a real conflict
//      produces a genuine second "Also evaluating" row, verified live.
//   3. S4's excluded-but-in-Prism avatar — grayscale + "In Prism, not
//      included — Auto Update is off", verified live.
//
// Round 8 — same six layouts, same organizing principles, but now built on
// a shared "honest" template-decision engine (below) that fixes #1 by never
// feeding TemplateControl the staged pick — only the committed value — and
// faithfully reproduces the real "Change template?" AlertDialog (Keep
// both/Replace, "Edit it instead" escape hatch) for #2, plus a fourth
// roster person (Dr. James Kim) for #3. All six variants now render the
// SAME underlying decision engine inside their own layout.
//
// Diff copy for the Faculty Midterm Check-In switch is the exact real copy
// verified live ("Also schedules Faculty Midterm Check-In. It covers
// nothing the current survey does not already."). Diff copy for Alumni
// Outcomes Survey / Comprehensive Course Evaluation is NOT independently
// verified live — their assumed criteria are flagged in ASSUMED_CRITERIA
// below.

import { useState } from 'react'
import Link from 'next/link'
import {
  Button, Checkbox, Label, RadioGroup, RadioGroupItem,
  AlertDialog, AlertDialogContent, AlertDialogHeader, AlertDialogTitle,
  AlertDialogFooter, AlertDialogCancel, AlertDialogAction,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
} from '@exxatdesignux/ui'
import { PersonAvatar } from '@/components/pce/person-avatar'
import { StoryStatusBadgeOS } from '@/components/pce/pce-badges'
import { TemplateControl } from '@/components/pce/courses-evaluatees/step-survey-instances'
import { SurveyPreviewDialog } from '@/components/pce/distribute-wizard/survey-preview-dialog'
import { MOCK_COURSE_OFFERINGS, MOCK_TEMPLATES, type PceTemplate } from '@/lib/pce-mock-data'

const OFFERING = MOCK_COURSE_OFFERINGS.find(o => o.id === 'co13')!
const DEFAULT_TEMPLATE_ID = 'tmpl1'
const PUBLISHED = MOCK_TEMPLATES.filter(t => t.status === 'active')

// Verified live for "Faculty Midterm Check-In" (real copy: "Stops
// evaluating Course material and Instructor and adds nothing new" on
// Replace; "It covers nothing the current survey does not already" on Keep
// both — both imply this template's only aspect is Coordinator). The other
// two active templates' criteria are ASSUMED for this demo, not verified.
const ASSUMED_CRITERIA: Record<string, string[]> = {}
function criteriaFor(t: PceTemplate): string[] {
  if (t.name === 'End-of-Term Evaluation') return ['Course material', 'Instructor', 'Coordinator']
  if (t.name === 'Faculty Midterm Check-In') return ['Coordinator'] // verified live
  if (t.name === 'Alumni Outcomes Survey') return ASSUMED_CRITERIA[t.id] ?? ['Course material'] // assumed
  return ASSUMED_CRITERIA[t.id] ?? ['Course material', 'Instructor', 'Coordinator'] // assumed (Comprehensive)
}

function diffOf(fromT: PceTemplate, toT: PceTemplate) {
  const from = criteriaFor(fromT), to = criteriaFor(toT)
  const toSet = new Set(to), fromSet = new Set(from)
  return { added: to.filter(c => !fromSet.has(c)), removed: from.filter(c => !toSet.has(c)) }
}
const listFmt = (items: string[]) => new Intl.ListFormat('en', { style: 'long', type: 'conjunction' }).format(items)

// ═════════════════════════════════════════════════════════════════════════
// Shared "honest" template-decision engine — used identically by all six
// layouts. TemplateControl only ever receives the COMMITTED id; picking a
// different one only stages `pendingTemplateId`, never moves the radio.
// ═════════════════════════════════════════════════════════════════════════
function useFullScenario() {
  const [committedTemplateId, setCommittedTemplateId] = useState(DEFAULT_TEMPLATE_ID)
  const [pendingTemplateId, setPendingTemplateId] = useState<string | null>(null)
  const [secondaryTemplateId, setSecondaryTemplateId] = useState<string | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [dialogChoice, setDialogChoice] = useState<'override' | 'create-new'>('create-new')
  const [previewTemplate, setPreviewTemplate] = useState<PceTemplate | null>(null)

  // Late-added co-instructor (Dr. Rachel Gomez) — her own override.
  const [reyesOverrideId, setReyesOverrideId] = useState<string | null>(null)
  const [reyesPicking, setReyesPicking] = useState(false)
  const [reyesPickedId, setReyesPickedId] = useState('')

  // Excluded-but-in-Prism (Dr. James Kim) — S4. Defaults excluded so the
  // state is visible without requiring interaction, matching how it's
  // discovered live (Auto Update off, never explicitly added).
  const [kimIncluded, setKimIncluded] = useState(false)

  const committedTemplate = MOCK_TEMPLATES.find(t => t.id === committedTemplateId)!
  const pendingTemplate = pendingTemplateId ? MOCK_TEMPLATES.find(t => t.id === pendingTemplateId) ?? null : null
  const secondaryTemplate = secondaryTemplateId ? MOCK_TEMPLATES.find(t => t.id === secondaryTemplateId) ?? null : null
  const reyesOverrideTemplate = reyesOverrideId ? MOCK_TEMPLATES.find(t => t.id === reyesOverrideId) ?? null : null

  function stageTemplate(id: string) {
    setPendingTemplateId(id === committedTemplateId ? null : id)
  }
  function confirmSwitch() {
    // The real page always shows this dialog when a Scheduled survey
    // already exists for the offering (true here — co13/tmpl1 is
    // "Scheduled" in fixture) — so any staged pick opens it.
    setDialogChoice('create-new')
    setDialogOpen(true)
  }
  function keepCurrent() {
    setPendingTemplateId(null)
  }
  function cancelDialog() {
    // Real behavior: dismissing reverts the pick entirely — nothing
    // half-applies.
    setDialogOpen(false)
    setPendingTemplateId(null)
    setDialogChoice('create-new')
  }
  function resolveDialog() {
    if (!pendingTemplateId) return
    if (dialogChoice === 'override') {
      setCommittedTemplateId(pendingTemplateId)
      setSecondaryTemplateId(null)
    } else {
      setSecondaryTemplateId(pendingTemplateId)
    }
    setPendingTemplateId(null)
    setDialogOpen(false)
    setDialogChoice('create-new')
  }

  return {
    committedTemplateId, committedTemplate, pendingTemplateId, pendingTemplate,
    secondaryTemplateId, secondaryTemplate, dialogOpen, dialogChoice, setDialogChoice,
    stageTemplate, confirmSwitch, keepCurrent, cancelDialog, resolveDialog,
    previewTemplate, setPreviewTemplate,
    reyesOverrideId, reyesOverrideTemplate, reyesPicking, setReyesPicking, reyesPickedId, setReyesPickedId, setReyesOverrideId,
    kimIncluded, setKimIncluded,
  }
}
type Scenario = ReturnType<typeof useFullScenario>

// ── Shared "honest" pending banner — Round 1's fix, reused everywhere ──
function PendingBanner({ s }: { s: Scenario }) {
  if (!s.pendingTemplate) return null
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-2.5" style={{ background: 'var(--muted)' }}>
      <p className="text-xs text-muted-foreground">
        <i className="fa-light fa-arrow-right-arrow-left me-1.5" aria-hidden="true" />
        Switch to <span className="font-medium text-foreground">{s.pendingTemplate.name}</span>?
      </p>
      <div className="flex gap-1.5">
        <Button variant="default" size="xs" onClick={s.confirmSwitch}>Switch template</Button>
        <Button variant="ghost" size="xs" onClick={s.keepCurrent}>Keep current</Button>
      </div>
    </div>
  )
}

// ── Shared reassign dialog — faithful to the real "Change template?" AlertDialog ──
function ReassignDialog({ s, courseCode }: { s: Scenario; courseCode: string }) {
  if (!s.pendingTemplate) return null
  const { added, removed } = diffOf(s.committedTemplate, s.pendingTemplate)
  return (
    <AlertDialog open={s.dialogOpen} onOpenChange={open => { if (!open) s.cancelDialog() }}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Change template for {courseCode}?</AlertDialogTitle>
        </AlertDialogHeader>
        <div className="mx-6 flex items-center gap-2 text-sm text-muted-foreground">
          <i className="fa-light fa-file-lines text-xs shrink-0" aria-hidden="true" />
          <span className="truncate">{s.committedTemplate.name}</span>
          <StoryStatusBadgeOS status="scheduled" size="sm" />
        </div>
        <RadioGroup
          value={s.dialogChoice}
          onValueChange={v => s.setDialogChoice(v as 'override' | 'create-new')}
          className="flex flex-col divide-y divide-border px-6"
          aria-label="How to apply this template change"
        >
          <div className="flex flex-col gap-1 py-3">
            <Label className="flex items-start gap-2 cursor-pointer">
              <RadioGroupItem value="create-new" id="reassign-new" className="mt-0.5" />
              <span className="flex flex-col gap-0.5 min-w-0">
                <span className="text-sm font-medium">Keep both</span>
                <span className="text-xs text-muted-foreground">
                  Also schedules {s.pendingTemplate.name}.{' '}
                  {added.length > 0
                    ? <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing sends twice.</>
                    : <>It covers nothing the current survey does not already. Nothing sends twice.</>}
                </span>
              </span>
            </Label>
            <p className="text-xs text-muted-foreground ps-6">
              Only need one more aspect?{' '}
              <Link href={`/templates/${s.committedTemplateId}`} target="_blank" rel="noreferrer" className="underline underline-offset-2">
                Edit it instead
              </Link>
            </p>
          </div>
          <Label className="flex items-start gap-2 cursor-pointer py-3">
            <RadioGroupItem value="override" id="reassign-override" className="mt-0.5" />
            <span className="flex flex-col gap-0.5 min-w-0">
              <span className="text-sm font-medium">Replace</span>
              <span className="text-xs text-muted-foreground">
                {s.pendingTemplate.name} takes its place.{' '}
                {removed.length > 0 && added.length > 0 && <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds <span className="font-medium text-foreground">{listFmt(added)}</span>.</>}
                {removed.length > 0 && added.length === 0 && <>Stops evaluating <span className="font-medium text-foreground">{listFmt(removed)}</span> and adds nothing new.</>}
                {removed.length === 0 && added.length > 0 && <>Adds <span className="font-medium text-foreground">{listFmt(added)}</span>. Nothing is removed.</>}
                {removed.length === 0 && added.length === 0 && <>Same aspects, different questions.</>}
              </span>
            </span>
          </Label>
        </RadioGroup>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={s.cancelDialog}>Cancel</AlertDialogCancel>
          <AlertDialogAction onClick={s.resolveDialog}>Continue</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

// ── Shared coexisting "Also evaluating" row (S2 result) ──
function SecondaryRow({ s }: { s: Scenario }) {
  if (!s.secondaryTemplate) return null
  return (
    <div className="flex items-center justify-between gap-3 rounded-md border border-dashed border-border p-2.5">
      <span className="flex items-center gap-2 text-sm">
        <i className="fa-light fa-arrow-right-arrow-left text-xs" style={{ color: 'var(--chip-4)' }} aria-hidden="true" />
        <span className="font-medium">Also evaluating</span>
        <span className="text-muted-foreground">· {s.secondaryTemplate.name}</span>
      </span>
      <span className="flex items-center gap-2">
        <PersonAvatar name="Dr. Anita Patel" className="size-6" />
        <span className="text-xs text-muted-foreground">Dr. Anita Patel</span>
      </span>
    </div>
  )
}

// ── Shared excluded-person row (S4) ──
function ExcludedRow({ s }: { s: Scenario }) {
  return (
    <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
      <PersonAvatar name="Dr. James Kim" className={s.kimIncluded ? 'size-6' : 'size-6 grayscale'} />
      <span className="flex-1 flex flex-col">
        <span className="text-sm font-medium">Dr. James Kim</span>
        <span className="text-xs text-muted-foreground">
          {s.kimIncluded ? 'Instructor' : 'In Prism, not included — Auto Update is off'}
        </span>
      </span>
      <Checkbox checked={s.kimIncluded} onCheckedChange={() => s.setKimIncluded(v => !v)} aria-label="Include Dr. James Kim" />
    </Label>
  )
}

function AdvisoryBox({ s }: { s: Scenario }) {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-2.5 min-w-0" style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}>
      <Label className="flex cursor-pointer items-start gap-2.5 min-w-0">
        <PersonAvatar name="Dr. Rachel Gomez" className="size-6" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">Dr. Rachel Gomez</span>
          <span className="truncate text-xs text-muted-foreground">Instructor · late-added</span>
        </span>
        <Checkbox checked aria-label="Include Dr. Rachel Gomez" />
      </Label>
      <div className="flex flex-col gap-1.5 border-t border-border pt-1.5">
        <p className="text-xs text-muted-foreground">
          Template: <span className="font-medium text-foreground">{s.reyesOverrideTemplate?.name ?? s.committedTemplate.name}</span>
          {!s.reyesOverrideTemplate && <> — same as Dr. Kevin Chen</>}
        </p>
        {s.reyesPicking ? (
          <div className="flex flex-col gap-1.5">
            <Select value={s.reyesPickedId} onValueChange={s.setReyesPickedId}>
              <SelectTrigger size="sm" aria-label="Different template for Dr. Rachel Gomez" className="w-full">
                <SelectValue placeholder="Choose a template" />
              </SelectTrigger>
              <SelectContent>
                {PUBLISHED.map(t => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="flex gap-1.5">
              <Button variant="outline" size="xs" disabled={!s.reyesPickedId} onClick={() => { s.setReyesOverrideId(s.reyesPickedId); s.setReyesPicking(false); s.setReyesPickedId('') }}>
                Use this template
              </Button>
              <Button variant="ghost" size="xs" onClick={() => { s.setReyesPicking(false); s.setReyesPickedId('') }}>Cancel</Button>
            </div>
          </div>
        ) : (
          <Button variant="link" size="xs" className="self-start px-0 h-auto" style={{ color: 'var(--chip-4)' }} onClick={() => s.setReyesPicking(true)}>
            Use a different template
          </Button>
        )}
      </div>
    </div>
  )
}

function BlockedBox() {
  return (
    <div className="flex flex-col gap-1.5 rounded-md border p-2.5 min-w-0" style={{ borderColor: 'var(--chip-destructive)', background: 'var(--pce-impact-bg)' }}>
      <div className="flex items-start gap-2.5 min-w-0">
        <PersonAvatar name="Dr. Kevin Chen" className="size-6 grayscale" />
        <span className="flex min-w-0 flex-1 flex-col gap-0.5">
          <span className="truncate text-sm font-medium">Dr. Kevin Chen</span>
          <span className="truncate text-xs text-muted-foreground">Instructor</span>
        </span>
        <i className="fa-solid fa-lock text-xs shrink-0 mt-0.5" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
      </div>
      <p className="text-xs text-muted-foreground">
        Already covered by a <StoryStatusBadgeOS status="live" size="sm" /> survey opened Dec 6.
      </p>
      <Button variant="outline" size="xs" asChild className="self-start">
        <Link href="/surveys/pf2">View survey</Link>
      </Button>
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// A — Decide, then fallout
// ═════════════════════════════════════════════════════════════════════════
function VariantA() {
  const s = useFullScenario()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <TemplateControl
          offering={OFFERING} templateId={s.committedTemplateId} defaultTemplateId={DEFAULT_TEMPLATE_ID}
          publishedTemplates={PUBLISHED} onTemplateChange={(_id, id) => s.stageTemplate(id)}
          onCreate={() => {}} onPreview={s.setPreviewTemplate}
        />
        <PendingBanner s={s} />
      </div>
      <SecondaryRow s={s} />
      <div className="flex flex-col gap-2 border-t border-border pt-3">
        <span className="text-xs font-medium text-muted-foreground">Evaluatees — under {s.committedTemplate.name}</span>
        <div className="flex items-center gap-2.5"><Checkbox checked aria-label="Include Course material" /><span className="text-sm">Course material</span></div>
        <div className="flex items-center gap-2.5">
          <Checkbox checked aria-label="Include Dr. Anita Patel" /><PersonAvatar name="Dr. Anita Patel" className="size-6" />
          <span className="text-sm">Dr. Anita Patel <span className="text-muted-foreground">· Coordinator</span></span>
        </div>
        <ExcludedRow s={s} />
        <AdvisoryBox s={s} />
        <BlockedBox />
      </div>
      <SurveyPreviewDialog template={s.previewTemplate} open={!!s.previewTemplate} onOpenChange={v => { if (!v) s.setPreviewTemplate(null) }} />
      <ReassignDialog s={s} courseCode="DPT-510" />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// B — Exception ledger
// ═════════════════════════════════════════════════════════════════════════
function VariantB() {
  const s = useFullScenario()
  const [readyOpen, setReadyOpen] = useState(false)
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <TemplateControl
          offering={OFFERING} templateId={s.committedTemplateId} defaultTemplateId={DEFAULT_TEMPLATE_ID}
          publishedTemplates={PUBLISHED} onTemplateChange={(_id, id) => s.stageTemplate(id)}
          onCreate={() => {}} onPreview={s.setPreviewTemplate}
        />
        <PendingBanner s={s} />
        <div className="pt-2"><SecondaryRow s={s} /></div>
      </div>
      <div className="flex flex-col gap-3">
        <span className="text-xs font-medium text-muted-foreground">Evaluatees</span>
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs font-medium" style={{ color: 'var(--insight-severity-success-fg, var(--foreground))' }}>2 ready</span>
            <Button variant="ghost" size="xs" onClick={() => setReadyOpen(v => !v)}>{readyOpen ? 'Hide' : 'Show'}</Button>
          </div>
          {readyOpen && (
            <div className="flex flex-col gap-2">
              <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
                <span className="size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0"><i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" /></span>
                <span className="flex-1 text-sm font-medium">Course material</span>
                <Checkbox checked aria-label="Include Course material" />
              </Label>
              <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
                <PersonAvatar name="Dr. Anita Patel" className="size-6" />
                <span className="flex-1 flex flex-col"><span className="text-sm font-medium">Dr. Anita Patel</span><span className="text-xs text-muted-foreground">Coordinator</span></span>
                <Checkbox checked aria-label="Include Dr. Anita Patel" />
              </Label>
            </div>
          )}
        </div>
        <ExcludedRow s={s} />
        <AdvisoryBox s={s} />
        <BlockedBox />
      </div>
      <SurveyPreviewDialog template={s.previewTemplate} open={!!s.previewTemplate} onOpenChange={v => { if (!v) s.setPreviewTemplate(null) }} />
      <ReassignDialog s={s} courseCode="DPT-510" />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// C — People first
// ═════════════════════════════════════════════════════════════════════════
function VariantC() {
  const s = useFullScenario()
  const [changing, setChanging] = useState(false)
  return (
    <div className="grid grid-cols-1 md:grid-cols-[1fr_280px] gap-6">
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Course materials</span>
          <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
            <span className="size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0"><i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" /></span>
            <span className="flex-1 text-sm font-medium">Course material</span>
            <Checkbox checked aria-label="Include Course material" />
          </Label>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Instructors</span>
          <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
            <PersonAvatar name="Dr. Anita Patel" className="size-6" />
            <span className="flex-1 flex flex-col"><span className="text-sm font-medium">Dr. Anita Patel</span><span className="text-xs text-muted-foreground">Coordinator</span></span>
            <Checkbox checked aria-label="Include Dr. Anita Patel" />
          </Label>
          <ExcludedRow s={s} />
          <AdvisoryBox s={s} />
          <BlockedBox />
        </div>
        <SecondaryRow s={s} />
      </div>
      <div className="flex flex-col gap-2">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <div className="flex flex-col gap-1.5 rounded-md border border-border p-3">
          <span className="flex items-center gap-1.5 text-sm font-medium">
            {s.committedTemplate.name}
            {s.committedTemplateId === DEFAULT_TEMPLATE_ID && <span className="text-[10px] font-medium rounded px-1.5 py-0.5" style={{ background: 'var(--secondary)' }}>Default</span>}
          </span>
          <span className="text-xs text-muted-foreground">{s.committedTemplate.questionCount} questions</span>
          <div className="flex gap-1.5 pt-1">
            <Button variant="ghost" size="xs" onClick={() => s.setPreviewTemplate(s.committedTemplate)}>Preview</Button>
            <Button variant="ghost" size="xs" onClick={() => setChanging(v => !v)}>{changing ? 'Cancel' : 'Change'}</Button>
          </div>
        </div>
        {changing && (
          <TemplateControl
            offering={OFFERING} templateId={s.committedTemplateId} defaultTemplateId={DEFAULT_TEMPLATE_ID}
            publishedTemplates={PUBLISHED} onTemplateChange={(_id, id) => { s.stageTemplate(id); setChanging(false) }}
            onCreate={() => {}} onPreview={s.setPreviewTemplate}
          />
        )}
        <PendingBanner s={s} />
      </div>
      <SurveyPreviewDialog template={s.previewTemplate} open={!!s.previewTemplate} onOpenChange={v => { if (!v) s.setPreviewTemplate(null) }} />
      <ReassignDialog s={s} courseCode="DPT-510" />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// D — Status board
// ═════════════════════════════════════════════════════════════════════════
function VariantD() {
  const s = useFullScenario()
  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-1.5">
        <span className="text-xs font-medium text-muted-foreground">Template</span>
        <TemplateControl
          offering={OFFERING} templateId={s.committedTemplateId} defaultTemplateId={DEFAULT_TEMPLATE_ID}
          publishedTemplates={PUBLISHED} onTemplateChange={(_id, id) => s.stageTemplate(id)}
          onCreate={() => {}} onPreview={s.setPreviewTemplate}
        />
        <PendingBanner s={s} />
      </div>
      <SecondaryRow s={s} />
      <div className="grid grid-cols-1 md:grid-cols-4 gap-3 border-t border-border pt-4">
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--insight-severity-success-fg, var(--foreground))' }}>Ready</span>
          <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
            <span className="size-6 rounded-full flex items-center justify-center border border-border bg-background shrink-0"><i className="fa-light fa-book-open text-[10px] text-muted-foreground" aria-hidden="true" /></span>
            <span className="flex-1 text-sm font-medium">Course material</span>
            <Checkbox checked aria-label="Include Course material" />
          </Label>
          <Label className="flex cursor-pointer items-center gap-2.5 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
            <PersonAvatar name="Dr. Anita Patel" className="size-6" />
            <span className="flex-1 flex flex-col"><span className="text-sm font-medium">Dr. Anita Patel</span><span className="text-xs text-muted-foreground">Coordinator</span></span>
            <Checkbox checked aria-label="Include Dr. Anita Patel" />
          </Label>
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium text-muted-foreground">Excluded</span>
          <ExcludedRow s={s} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--chip-4)' }}>Advisory</span>
          <AdvisoryBox s={s} />
        </div>
        <div className="flex flex-col gap-2">
          <span className="text-xs font-medium" style={{ color: 'var(--chip-destructive)' }}>Blocked</span>
          <BlockedBox />
        </div>
      </div>
      <SurveyPreviewDialog template={s.previewTemplate} open={!!s.previewTemplate} onOpenChange={v => { if (!v) s.setPreviewTemplate(null) }} />
      <ReassignDialog s={s} courseCode="DPT-510" />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// E — Closing checklist
// ═════════════════════════════════════════════════════════════════════════
function ChecklistStep({ n, title, done, open, onToggle, summary, children }: {
  n: number; title: string; done: boolean; open: boolean; onToggle: () => void; summary: string; children: React.ReactNode
}) {
  return (
    <div className="flex flex-col gap-2 rounded-md border border-border p-3">
      <Button variant="ghost" size="sm" onClick={onToggle} className="flex w-full items-center justify-between gap-2 text-left h-auto py-1" aria-expanded={open}>
        <span className="flex items-center gap-2 text-sm font-medium">
          <i className={done ? 'fa-solid fa-circle-check text-xs' : 'fa-light fa-circle text-xs'} style={{ color: done ? 'var(--insight-severity-success-fg, var(--foreground))' : 'var(--muted-foreground)' }} aria-hidden="true" />
          {n} {title}
        </span>
        <span className="text-xs text-muted-foreground font-normal">{!open && summary}</span>
      </Button>
      {open && <div className="pt-1">{children}</div>}
    </div>
  )
}
function VariantE() {
  const s = useFullScenario()
  const [step1Open, setStep1Open] = useState(false)
  const [step2Open, setStep2Open] = useState(true)
  return (
    <div className="flex flex-col gap-3">
      <ChecklistStep
        n={1} title="Template" done={!s.pendingTemplate} open={step1Open || !!s.pendingTemplate} onToggle={() => setStep1Open(v => !v)}
        summary={`${s.committedTemplate.name} · Change`}
      >
        <TemplateControl
          offering={OFFERING} templateId={s.committedTemplateId} defaultTemplateId={DEFAULT_TEMPLATE_ID}
          publishedTemplates={PUBLISHED} onTemplateChange={(_id, id) => s.stageTemplate(id)}
          onCreate={() => {}} onPreview={s.setPreviewTemplate}
        />
        <div className="pt-2"><PendingBanner s={s} /></div>
        <div className="pt-2"><SecondaryRow s={s} /></div>
      </ChecklistStep>
      <ChecklistStep n={2} title="Evaluatees" done={false} open={step2Open} onToggle={() => setStep2Open(v => !v)} summary="2 ready · 1 excluded · 1 advisory · 1 blocked">
        <div className="flex flex-col gap-2">
          <div className="flex items-center gap-2.5"><Checkbox checked aria-label="Include Course material" /><span className="text-sm">Course material</span></div>
          <div className="flex items-center gap-2.5">
            <Checkbox checked aria-label="Include Dr. Anita Patel" /><PersonAvatar name="Dr. Anita Patel" className="size-6" />
            <span className="text-sm">Dr. Anita Patel <span className="text-muted-foreground">· Coordinator</span></span>
          </div>
          <ExcludedRow s={s} />
          <AdvisoryBox s={s} />
          <BlockedBox />
        </div>
      </ChecklistStep>
      <SurveyPreviewDialog template={s.previewTemplate} open={!!s.previewTemplate} onOpenChange={v => { if (!v) s.setPreviewTemplate(null) }} />
      <ReassignDialog s={s} courseCode="DPT-510" />
    </div>
  )
}

// ═════════════════════════════════════════════════════════════════════════
// F — Decision + receipt
// ═════════════════════════════════════════════════════════════════════════
function VariantF() {
  const s = useFullScenario()
  const gomezEffectiveId = s.reyesOverrideTemplate?.id ?? s.committedTemplateId
  const gomezSameGroup = gomezEffectiveId === s.committedTemplateId

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <div className="flex flex-col gap-4">
        <span className="text-xs font-medium text-muted-foreground">Decisions</span>
        <div className="flex flex-col gap-1.5">
          <span className="text-xs font-medium text-muted-foreground">Template</span>
          <TemplateControl
            offering={OFFERING} templateId={s.committedTemplateId} defaultTemplateId={DEFAULT_TEMPLATE_ID}
            publishedTemplates={PUBLISHED} onTemplateChange={(_id, id) => s.stageTemplate(id)}
            onCreate={() => {}} onPreview={s.setPreviewTemplate}
          />
          <PendingBanner s={s} />
        </div>
        <div className="flex flex-col gap-2 border-t border-border pt-3">
          <span className="text-xs font-medium text-muted-foreground">People</span>
          <div className="flex items-center gap-2.5">
            <PersonAvatar name="Dr. Anita Patel" className="size-6" />
            <span className="text-sm">Dr. Anita Patel <span className="text-muted-foreground">· Coordinator</span></span>
          </div>
          <ExcludedRow s={s} />
          <AdvisoryBox s={s} />
          <div className="flex items-center gap-2.5 pt-1">
            <PersonAvatar name="Dr. Kevin Chen" className="size-6 grayscale" />
            <span className="text-sm text-muted-foreground">Dr. Kevin Chen · Instructor</span>
            <i className="fa-solid fa-lock text-xs" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
          </div>
        </div>
      </div>

      <div className="flex flex-col gap-2 rounded-md border border-border p-3" style={{ background: 'var(--muted)' }}>
        <span className="text-xs font-medium text-muted-foreground">Will be sent ({(gomezSameGroup ? 1 : 0) + 1 + (s.secondaryTemplate ? 1 : 0) + (gomezSameGroup ? 1 : 0)})</span>
        <div className="flex flex-col gap-1 rounded-md border border-border p-2.5" style={{ background: 'var(--card)' }}>
          <span className="text-sm font-medium">{s.committedTemplate.name} · {s.committedTemplate.questionCount} questions</span>
          <span className="text-xs text-muted-foreground">→ Course material</span>
          <span className="text-xs text-muted-foreground">→ Dr. Anita Patel</span>
          {gomezSameGroup && <span className="text-xs text-muted-foreground">→ Dr. Rachel Gomez</span>}
          {s.kimIncluded && <span className="text-xs text-muted-foreground">→ Dr. James Kim</span>}
        </div>
        {!gomezSameGroup && (
          <div className="flex flex-col gap-1 rounded-md border p-2.5" style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}>
            <span className="text-sm font-medium">{s.reyesOverrideTemplate?.name} · {s.reyesOverrideTemplate?.questionCount} questions</span>
            <span className="text-xs text-muted-foreground">→ Dr. Rachel Gomez <span style={{ color: 'var(--chip-4)' }}>(different template)</span></span>
          </div>
        )}
        {s.secondaryTemplate && (
          <div className="flex flex-col gap-1 rounded-md border p-2.5" style={{ borderColor: 'var(--chip-4)', background: 'var(--card)' }}>
            <span className="text-sm font-medium">{s.secondaryTemplate.name} · {s.secondaryTemplate.questionCount} questions</span>
            <span className="text-xs text-muted-foreground">→ Dr. Anita Patel <span style={{ color: 'var(--chip-4)' }}>(also evaluating)</span></span>
          </div>
        )}
        <span className="text-xs font-medium text-muted-foreground pt-2">Not sent</span>
        <div className="flex items-center gap-2 rounded-md border p-2.5" style={{ borderColor: 'var(--chip-destructive)', background: 'var(--pce-impact-bg)' }}>
          <i className="fa-solid fa-lock text-xs shrink-0" style={{ color: 'var(--chip-destructive)' }} aria-hidden="true" />
          <span className="text-xs text-muted-foreground">Dr. Kevin Chen — already in a <StoryStatusBadgeOS status="live" size="sm" /> survey opened Dec 6</span>
        </div>
        {!s.kimIncluded && (
          <div className="flex items-center gap-2 rounded-md border border-dashed border-border p-2.5">
            <i className="fa-light fa-eye-slash text-xs shrink-0 text-muted-foreground" aria-hidden="true" />
            <span className="text-xs text-muted-foreground">Dr. James Kim — in Prism, not included (Auto Update off)</span>
          </div>
        )}
      </div>
      <SurveyPreviewDialog template={s.previewTemplate} open={!!s.previewTemplate} onOpenChange={v => { if (!v) s.setPreviewTemplate(null) }} />
      <ReassignDialog s={s} courseCode="DPT-510" />
    </div>
  )
}

type VariantKey = 'a' | 'b' | 'c' | 'd' | 'e' | 'f'
const VARIANTS: { key: VariantKey; label: string; sub: string }[] = [
  { key: 'a', label: 'A · Decide, then fallout', sub: 'Single column — template on top, roster as a flat annotated list below it.' },
  { key: 'b', label: 'B · Exception ledger', sub: '"Ready" collapses to a one-line receipt; Excluded/Advisory/Blocked stay full-size.' },
  { key: 'c', label: 'C · People first', sub: 'Roster is the wide main pane, grouped by concern; template is a compact rail card.' },
  { key: 'd', label: 'D · Status board', sub: 'Ready / Excluded / Advisory / Blocked as four side-by-side columns.' },
  { key: 'e', label: 'E · Closing checklist', sub: 'Two numbered steps, each collapses to a one-line ✓ summary on request.' },
  { key: 'f', label: 'F · Decision + receipt', sub: 'Decisions on the left; a live "Will be sent" pane on the right, now with 4 possible groups.' },
]

export default function PushStep2AccordionLayoutComparePage() {
  const [active, setActive] = useState<VariantKey>('a')

  return (
    <div className="flex flex-col gap-5 p-6 max-w-[1100px] mx-auto">
      <div className="flex flex-col gap-1">
        <h1 className="text-xl font-semibold font-heading">Accordion-expanded row — layout variants</h1>
        <p className="text-sm text-muted-foreground">
          DPT-510 · Musculoskeletal Physical Therapy I — now including the coexisting-row (S2), excluded-avatar (S4),
          and honest-pending-template scenarios verified live against the Aug 4 transcript.
        </p>
      </div>
      <div className="flex flex-wrap items-center gap-2 border-b border-border pb-3">
        {VARIANTS.map(v => (
          <Button key={v.key} variant={active === v.key ? 'default' : 'outline'} size="sm" onClick={() => setActive(v.key)}>
            {v.label}
          </Button>
        ))}
      </div>
      <p className="text-xs text-muted-foreground -mt-2">{VARIANTS.find(v => v.key === active)?.sub}</p>

      <div className="rounded-md border border-border p-4">
        {active === 'a' && <VariantA />}
        {active === 'b' && <VariantB />}
        {active === 'c' && <VariantC />}
        {active === 'd' && <VariantD />}
        {active === 'e' && <VariantE />}
        {active === 'f' && <VariantF />}
      </div>
    </div>
  )
}
