'use client'

import { useState, useEffect, useRef, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Input, Button, LocalBanner, Label,
  Select, SelectTrigger, SelectContent, SelectItem, SelectValue,
  RadioGroup, RadioGroupItem, ToggleSwitch,
  Tabs, TabsList, TabsTrigger, TabsContent,
} from '@exxatdesignux/ui'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'
import { SettingsFormRow } from '@/components/settings-form-row'
import { RoleAccessGrid } from '@/components/pce/role-access-grid'
import { CommunicationSection } from '@/components/pce/settings-communication'
import { TemplatesHub } from '@/components/pce/templates-hub'
import {
  EVAL_RELEASE_THRESHOLD_PCT,
  EVAL_FACULTY_ROLES, EVAL_DEFAULT_FACULTY_ROLE_IDS,
  EVAL_BENCHMARKS, EVAL_DEFAULT_SCALE, EVAL_DATE_RULES,
  DATE_ANCHOR_LABELS, MOCK_PROGRAM_TERMS,
  type DateAnchor,
} from '@/lib/pce-mock-data'

// ── Scale ──────────────────────────────────────────────────────────────────────
type ScalePreset = 'agreement' | 'frequency' | 'satisfaction' | 'quality' | 'custom'
type ScalePoints = '3' | '4' | '5' | '7'

const SCALE_PRESETS: { value: ScalePreset; label: string }[] = [
  { value: 'agreement', label: 'Agreement' }, { value: 'frequency', label: 'Frequency' },
  { value: 'satisfaction', label: 'Satisfaction' }, { value: 'quality', label: 'Quality' },
  { value: 'custom', label: 'Custom' },
]
const SCALE_LABELS: Record<Exclude<ScalePreset, 'custom'>, Record<ScalePoints, string[]>> = {
  agreement: {
    '3': ['Disagree', 'Neutral', 'Agree'],
    '4': ['Strongly Disagree', 'Disagree', 'Agree', 'Strongly Agree'],
    '5': ['Strongly Disagree', 'Disagree', 'Neutral', 'Agree', 'Strongly Agree'],
    '7': ['Strongly Disagree', 'Disagree', 'Somewhat Disagree', 'Neutral', 'Somewhat Agree', 'Agree', 'Strongly Agree'],
  },
  frequency: {
    '3': ['Never', 'Sometimes', 'Always'], '4': ['Never', 'Sometimes', 'Often', 'Always'],
    '5': ['Never', 'Rarely', 'Sometimes', 'Often', 'Always'],
    '7': ['Never', 'Very Rarely', 'Rarely', 'Sometimes', 'Often', 'Very Often', 'Always'],
  },
  satisfaction: {
    '3': ['Dissatisfied', 'Neutral', 'Satisfied'], '4': ['Very Dissatisfied', 'Dissatisfied', 'Satisfied', 'Very Satisfied'],
    '5': ['Very Dissatisfied', 'Dissatisfied', 'Neutral', 'Satisfied', 'Very Satisfied'],
    '7': ['Very Dissatisfied', 'Dissatisfied', 'Somewhat Dissatisfied', 'Neutral', 'Somewhat Satisfied', 'Satisfied', 'Very Satisfied'],
  },
  quality: {
    '3': ['Poor', 'Fair', 'Excellent'], '4': ['Poor', 'Fair', 'Good', 'Excellent'],
    '5': ['Very Poor', 'Poor', 'Fair', 'Good', 'Excellent'],
    '7': ['Very Poor', 'Poor', 'Below Average', 'Fair', 'Good', 'Very Good', 'Excellent'],
  },
}

const SECTIONS = [
  { id: 'templates',        label: 'Templates' },
  { id: 'evaluation-rules', label: 'Evaluation Rules' },
  { id: 'evaluation-dates', label: 'Schedule & release' },
  { id: 'communication',    label: 'Communication' },
  { id: 'role-access',      label: 'Role access' },
] as const
type SectionId = typeof SECTIONS[number]['id']

function shiftIso(iso: string, deltaDays: number): string {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d + deltaDays).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
}

// Left-aligned group sub-heading (replaces the centered FieldSeparator label)
function SubHeading({ children }: { children: React.ReactNode }) {
  return <p className="text-sm font-semibold text-foreground pt-3 pb-2 first:pt-0">{children}</p>
}

// ── DS-idiom resolved-value inset (replaces the old hand-rolled preview chrome) ──
function ResolvesTo({ caption, children }: { caption: string; children: React.ReactNode }) {
  return (
    <div className="rounded-2 bg-muted/50 px-3.5 py-3">
      <p className="text-xs text-muted-foreground mb-1.5">{caption}</p>
      <div className="flex items-center gap-2 text-sm flex-wrap">{children}</div>
    </div>
  )
}

// Scale label band — answers "what will students see?" (kept; 12px floor, DS tokens)
function LabelBand({ labels }: { labels: string[] }) {
  const n = labels.length
  return (
    <div className="rounded-2 bg-muted/50 px-4 py-4">
      <div className="relative flex">
        <div className="absolute top-[10px] h-px bg-border" style={{ left: `${50 / n}%`, right: `${50 / n}%` }} />
        {labels.map((label, i) => (
          <div key={i} className="flex-1 flex flex-col items-center gap-2">
            <div className="w-5 h-5 rounded-full border-2 bg-card z-10 flex items-center justify-center" style={{ borderColor: 'var(--border)' }}>
              <span className="text-xs tabular-nums leading-none text-muted-foreground">{i + 1}</span>
            </div>
            <span className="text-xs text-center leading-tight text-muted-foreground" style={{ maxWidth: n > 5 ? 72 : 88 }}>{label}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ── Page ──────────────────────────────────────────────────────────────────────
export default function EvalSettingsPage() {
  return (
    <Suspense fallback={<h1 className="sr-only">Settings</h1>}>
      <SettingsInner />
    </Suspense>
  )
}

function SettingsInner() {
  const params = useSearchParams()
  const initial = (SECTIONS.find(s => s.id === params?.get('section'))?.id ?? 'templates') as SectionId
  const [section, setSection] = useState<SectionId>(initial)

  // Scale
  const [scalePoints, setScalePoints]   = useState<ScalePoints>(String(EVAL_DEFAULT_SCALE.points) as ScalePoints)
  const [scalePreset, setScalePreset]   = useState<ScalePreset>(EVAL_DEFAULT_SCALE.preset)
  const [customLabels, setCustomLabels] = useState<string[]>(EVAL_DEFAULT_SCALE.labels)
  const activeLabels = scalePreset === 'custom' ? customLabels : SCALE_LABELS[scalePreset][scalePoints]
  const changePreset = (p: ScalePreset) => { setScalePreset(p); if (p !== 'custom') setCustomLabels(SCALE_LABELS[p][scalePoints]) }
  const changePoints = (pts: ScalePoints) => {
    setScalePoints(pts)
    if (scalePreset !== 'custom') setCustomLabels(SCALE_LABELS[scalePreset][pts])
    else {
      const k = Number(pts)
      setCustomLabels(prev => prev.length < k ? [...prev, ...Array.from({ length: k - prev.length }, (_, i) => `Label ${prev.length + i + 1}`)] : prev.slice(0, k))
    }
  }
  const scaleMax = Number(scalePoints)

  // Faculty roles — one-click toggle chips (was Select + Add + remove-✕)
  const [roles, setRoles] = useState<string[]>(EVAL_DEFAULT_FACULTY_ROLE_IDS)
  const toggleRole = (id: string) =>
    setRoles(p => (p.includes(id) ? p.filter(r => r !== id) : [...p, id]))

  // Benchmarks
  const [bRate, setBRate]       = useState<number>(EVAL_BENCHMARKS.targetResponseRate)
  const [bCourse, setBCourse]   = useState<number>(EVAL_BENCHMARKS.targetCourseScore)
  const [bFaculty, setBFaculty] = useState<number>(EVAL_BENCHMARKS.targetFacultyScore)

  // Release controls
  const [releaseMethod, setReleaseMethod]       = useState<'direct' | 'review'>('review')
  const [releaseThreshold, setReleaseThreshold] = useState(EVAL_RELEASE_THRESHOLD_PCT)
  const [commentMod, setCommentMod]             = useState(true)

  // Dates (anchor model)
  const [windowAnchor, setWindowAnchor]   = useState<DateAnchor>(EVAL_DATE_RULES.windowAnchor)
  const [opensOffset, setOpensOffset]     = useState(EVAL_DATE_RULES.opensOffset)
  const [closesOffset, setClosesOffset]   = useState(EVAL_DATE_RULES.closesOffset)
  const [releaseAnchor, setReleaseAnchor] = useState<DateAnchor>(EVAL_DATE_RULES.releaseAnchor)
  const [releaseOffset, setReleaseOffset] = useState(EVAL_DATE_RULES.releaseOffset)
  const activeTerm = MOCK_PROGRAM_TERMS.find(t => t.status === 'active') ?? MOCK_PROGRAM_TERMS[0]

  // Save
  const [saved, setSaved] = useState(false)
  useEffect(() => {
    if (!saved) return
    const id = window.setTimeout(() => setSaved(false), 3000)
    return () => window.clearTimeout(id)
  }, [saved])

  // Dirty tracking — signature vs a saved baseline (robust to StrictMode double
  // effects: dirty is DERIVED, not accumulated).
  const sig = JSON.stringify([scalePoints, scalePreset, customLabels, roles, bRate, bCourse, bFaculty,
    releaseMethod, releaseThreshold, commentMod,
    windowAnchor, opensOffset, closesOffset, releaseAnchor, releaseOffset])
  const baseline = useRef<string | null>(null)
  if (baseline.current === null) baseline.current = sig
  const dirty = sig !== baseline.current

  const handleSave = () => { baseline.current = sig; setSaved(true) }
  const handleDiscard = () => {
    setScalePoints(String(EVAL_DEFAULT_SCALE.points) as ScalePoints)
    setScalePreset(EVAL_DEFAULT_SCALE.preset)
    setCustomLabels(EVAL_DEFAULT_SCALE.labels)
    setRoles(EVAL_DEFAULT_FACULTY_ROLE_IDS)
    setBRate(EVAL_BENCHMARKS.targetResponseRate)
    setBCourse(EVAL_BENCHMARKS.targetCourseScore)
    setBFaculty(EVAL_BENCHMARKS.targetFacultyScore)
    setReleaseMethod('review')
    setReleaseThreshold(EVAL_RELEASE_THRESHOLD_PCT)
    setCommentMod(true)
    setWindowAnchor(EVAL_DATE_RULES.windowAnchor)
    setOpensOffset(EVAL_DATE_RULES.opensOffset)
    setClosesOffset(EVAL_DATE_RULES.closesOffset)
    setReleaseAnchor(EVAL_DATE_RULES.releaseAnchor)
    setReleaseOffset(EVAL_DATE_RULES.releaseOffset)
    baseline.current = null // re-baseline against the reset values on next render
  }

  const numField = (val: number, set: (n: number) => void, aria: string, suffix?: string, min = 0, max = 100, step = 1) => (
    <div className="flex items-center gap-2">
      <Input type="number" min={min} max={max} step={step} value={val}
        onChange={e => set(Math.max(min, Math.min(max, Number(e.target.value))))}
        className="w-16 h-8 text-sm tabular-nums text-right" aria-label={aria} />
      {suffix && <span className="text-sm text-muted-foreground">{suffix}</span>}
    </div>
  )

  return (
    <>
      <SiteHeader title="Settings" />
      <main className="flex flex-col flex-1 min-h-0">
      {/* Single save model: the sticky unsaved-changes bar below is the ONE save
          affordance — no duplicate header button. */}
      <PageHeader
        title="Settings"
        subtitle="Templates and course evaluation defaults for the program."
      />

      <div className="flex-1 overflow-auto" style={{ padding: '16px 28px 28px' }}>
        <div className="w-full">
          {saved && (
            <div className="mb-4">
              <LocalBanner variant="success" title="Settings saved">
                Defaults updated. Templates, term activation and analytics now use these values.
              </LocalBanner>
            </div>
          )}

          <Tabs value={section} onValueChange={v => setSection(v as SectionId)} className="flex flex-col gap-6">
            <TabsList variant="line" className="w-full justify-start" aria-label="Settings sections">
              {SECTIONS.map(s => <TabsTrigger key={s.id} value={s.id}>{s.label}</TabsTrigger>)}
            </TabsList>

            {/* ── Templates (moved from left nav) ──────────────────────── */}
            <TabsContent value="templates" className="mt-0">
              <TemplatesHub mode="course_evaluation" embedded />
            </TabsContent>

            {/* ── Evaluation Rules ─────────────────────────────────────── */}
            <TabsContent value="evaluation-rules" className="flex flex-col gap-8 mt-0">
              <SettingsFormRow label="Rating scale" description="Central default for scaled / rating questions in new templates.">
                <div className="flex flex-col gap-3">
                  <div className="flex items-center gap-1.5">
                    {(['3', '4', '5', '7'] as ScalePoints[]).map(p => (
                      <Button key={p} variant={scalePoints === p ? 'default' : 'outline'} size="sm" className="h-8"
                        aria-pressed={scalePoints === p} onClick={() => changePoints(p)}>{p}-point</Button>
                    ))}
                  </div>
                  <Select value={scalePreset} onValueChange={v => changePreset(v as ScalePreset)}>
                    <SelectTrigger className="w-44 h-8 text-sm" aria-label="Scale type"><SelectValue /></SelectTrigger>
                    <SelectContent>{SCALE_PRESETS.map(p => <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>)}</SelectContent>
                  </Select>
                  <LabelBand labels={activeLabels} />
                  {scalePreset === 'custom' && (
                    <div className="flex flex-col gap-2 max-w-md">
                      <p className="text-xs text-muted-foreground">Edit each point</p>
                      {activeLabels.map((lab, i) => (
                        <div key={i} className="flex items-center gap-2">
                          <Label className="text-xs tabular-nums text-muted-foreground w-4 shrink-0 text-right">{i + 1}</Label>
                          <Input value={lab}
                            onChange={e => { const next = [...customLabels]; next[i] = e.target.value; setCustomLabels(next) }}
                            className="h-8 text-sm" aria-label={`Scale point ${i + 1} label`} />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </SettingsFormRow>

              {/* "Answer-type labels" removed per Jun 30 PCE meeting — redundant with the
                  rating-scale endpoints (custom point editing lives on the scale itself). */}

              <SettingsFormRow label="Faculty roles to evaluate" description="Default set of roles rated in new templates. Click a role to include or exclude it.">
                <div className="flex flex-col gap-2">
                  <div className="flex flex-wrap gap-2" role="group" aria-label="Faculty roles to evaluate">
                    {EVAL_FACULTY_ROLES.map(r => {
                      const on = roles.includes(r.id)
                      return (
                        <Button
                          key={r.id}
                          variant="outline"
                          size="sm"
                          aria-pressed={on}
                          onClick={() => toggleRole(r.id)}
                          className={on ? 'bg-muted' : 'text-muted-foreground'}
                        >
                          {on && <i className="fa-solid fa-check text-xs" aria-hidden="true" />}
                          {r.label}
                        </Button>
                      )
                    })}
                  </div>
                  <p className="text-xs" style={{ color: 'var(--muted-foreground)' }} role="status">
                    {roles.length === 0
                      ? 'No roles selected — new templates will rate the course only.'
                      : `${roles.length} of ${EVAL_FACULTY_ROLES.length} roles rated in new templates.`}
                  </p>
                </div>
              </SettingsFormRow>

              <SettingsFormRow label="Benchmarks" description="Reference targets drawn as lines on term and course analytics.">
                <div className="grid w-fit grid-cols-[auto_auto] items-center gap-x-8 gap-y-3">
                  <span className="text-sm">Response rate</span>
                  {numField(bRate, setBRate, 'Target response rate', '%', 0, 100)}
                  <span className="text-sm">Course score</span>
                  {numField(bCourse, setBCourse, 'Target course score', `/ ${scaleMax}.0`, 1, scaleMax, 0.1)}
                  <span className="text-sm">Faculty score</span>
                  {numField(bFaculty, setBFaculty, 'Target faculty score', `/ ${scaleMax}.0`, 1, scaleMax, 0.1)}
                </div>
              </SettingsFormRow>

            </TabsContent>

            {/* ── Schedule & release ───────────────────────────────────── */}
            <TabsContent value="evaluation-dates" className="flex flex-col gap-8 mt-0">
              <SubHeading>Evaluation window</SubHeading>
              <SettingsFormRow label="Anchor date" description="Anchor the survey window to the term's or course's end date, then offset by days.">
                <Select value={windowAnchor} onValueChange={v => setWindowAnchor(v as DateAnchor)}>
                  <SelectTrigger className="w-44 h-8 text-sm" aria-label="Window anchor date"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(DATE_ANCHOR_LABELS) as DateAnchor[]).map(a => <SelectItem key={a} value={a}>{DATE_ANCHOR_LABELS[a]}</SelectItem>)}</SelectContent>
                </Select>
              </SettingsFormRow>
              <SettingsFormRow label="Window" description="Days from the anchor. Negative = before the anchor, positive = after.">
                <div className="flex items-center gap-5 flex-wrap">
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Opens</span>
                    {numField(opensOffset, setOpensOffset, 'Opens days from anchor', 'days', -60, 60)}
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Closes</span>
                    {numField(closesOffset, setClosesOffset, 'Closes days from anchor', 'days', -60, 60)}
                  </div>
                </div>
              </SettingsFormRow>
              <SettingsFormRow label="Window preview" description="How the rule resolves for the active term.">
                <ResolvesTo caption={`${activeTerm.name} · ${DATE_ANCHOR_LABELS[windowAnchor]} ${shiftIso(activeTerm.endDate, 0)}`}>
                  <span className="inline-flex items-center gap-1.5"><i className="fa-light fa-envelope text-xs text-muted-foreground" aria-hidden="true" />Opens <span className="font-medium tabular-nums">{shiftIso(activeTerm.endDate, opensOffset)}</span></span>
                  <i className="fa-light fa-arrow-right text-xs text-muted-foreground" aria-hidden="true" />
                  <span className="inline-flex items-center gap-1.5"><i className="fa-light fa-flag text-xs text-muted-foreground" aria-hidden="true" />Closes <span className="font-medium tabular-nums">{shiftIso(activeTerm.endDate, closesOffset)}</span></span>
                </ResolvesTo>
              </SettingsFormRow>

              <SubHeading>Result release</SubHeading>
              <SettingsFormRow label="Anchor date" description="Anchor result release to the term's or course's end date, then offset by days.">
                <Select value={releaseAnchor} onValueChange={v => setReleaseAnchor(v as DateAnchor)}>
                  <SelectTrigger className="w-44 h-8 text-sm" aria-label="Release anchor date"><SelectValue /></SelectTrigger>
                  <SelectContent>{(Object.keys(DATE_ANCHOR_LABELS) as DateAnchor[]).map(a => <SelectItem key={a} value={a}>{DATE_ANCHOR_LABELS[a]}</SelectItem>)}</SelectContent>
                </Select>
              </SettingsFormRow>
              <SettingsFormRow label="Releases" description="Results become eligible for release this many days after the anchor.">
                {numField(releaseOffset, setReleaseOffset, 'Releases days from anchor', 'days', 0, 90)}
              </SettingsFormRow>
              <SettingsFormRow label="Release preview" description="How the rule resolves for the active term.">
                <ResolvesTo caption={`${activeTerm.name} · ${DATE_ANCHOR_LABELS[releaseAnchor]} ${shiftIso(activeTerm.endDate, 0)}`}>
                  <span className="inline-flex items-center gap-1.5"><i className="fa-light fa-chart-mixed text-xs text-muted-foreground" aria-hidden="true" />Results eligible <span className="font-medium tabular-nums">{shiftIso(activeTerm.endDate, releaseOffset)}</span></span>
                </ResolvesTo>
              </SettingsFormRow>
              <SettingsFormRow label="Release method" description="Whether faculty see results immediately, or only after an admin review step.">
                <RadioGroup
                  value={releaseMethod}
                  onValueChange={v => setReleaseMethod(v as 'direct' | 'review')}
                  className="grid gap-2 sm:grid-cols-2"
                  aria-label="Release method"
                >
                  {([
                    { value: 'direct', title: 'Direct release', desc: 'Faculty see results on the release date above.' },
                    { value: 'review', title: 'Review step', desc: 'Hold for admin review before faculty release.' },
                  ] as const).map(o => (
                    <Label
                      key={o.value}
                      htmlFor={`rel-${o.value}`}
                      className="flex items-start gap-2.5 rounded-lg border border-border p-3 cursor-pointer has-[[data-state=checked]]:border-brand has-[[data-state=checked]]:bg-brand/10"
                    >
                      <RadioGroupItem value={o.value} id={`rel-${o.value}`} className="mt-0.5" />
                      <span className="flex flex-col gap-0.5">
                        <span className="text-sm font-medium">{o.title}</span>
                        <span className="text-xs font-normal" style={{ color: 'var(--muted-foreground)' }}>{o.desc}</span>
                      </span>
                    </Label>
                  ))}
                </RadioGroup>
              </SettingsFormRow>
              <SettingsFormRow label="Minimum threshold" description="Suppress results until enough responses are received.">
                {numField(releaseThreshold, setReleaseThreshold, 'Minimum threshold', 'responses', 0, 999)}
              </SettingsFormRow>
              <SettingsFormRow label="Comment moderation" description="Hold free-text comments for admin review before release.">
                <ToggleSwitch checked={commentMod} onChange={setCommentMod} />
              </SettingsFormRow>
            </TabsContent>

            {/* ── Communication ────────────────────────────────────────── */}
            <TabsContent value="communication" className="mt-0">
              <CommunicationSection />
            </TabsContent>

            {/* ── Role Access Grid ─────────────────────────────────────── */}
            <TabsContent value="role-access" className="mt-0">
              <RoleAccessGrid />
            </TabsContent>
          </Tabs>

          {/* Sticky unsaved-changes bar (Salesforce / Chatbase pattern) */}
          {dirty && (
            <div className="sticky bottom-3 mt-6 z-10 flex items-center justify-between gap-4 rounded-2 border border-border bg-card px-4 py-2.5">
              <span className="flex items-center gap-2 text-sm">
                <i className="fa-light fa-circle-info text-muted-foreground" aria-hidden="true" />
                You have unsaved changes.
              </span>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm" onClick={handleDiscard}>Discard</Button>
                <Button variant="default" size="sm" onClick={handleSave}>Save settings</Button>
              </div>
            </div>
          )}
        </div>
      </div>
      </main>
    </>
  )
}
