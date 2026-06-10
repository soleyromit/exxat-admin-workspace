'use client'

/* Assessment Status — state-aware lifecycle views for assessments that are
   past authoring. Opening a Ready / Completed / Archived assessment lands here
   instead of the builder, so each lifecycle phase has its own design:

   ready      → Scheduled & sealed (approval record, schedule, delivery config)
   completed  → Delivered & graded (cohort results + per-item psychometrics)
   archived   → Archived record    (frozen read-only snapshot + recycle)

   DS-native: @exxatdesignux/ui Card/CardContent/Button/Badge/AvatarInitials,
   the vendored DataTable for item analysis, and token bars for inline meters.
   Component-substitution port of the Claude Design status.jsx +
   results-explorer.jsx. */

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import { Card, CardContent, Button, Badge, AvatarInitials } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { Icon, LeoStar } from '../icons'
import { AskLeo, useApp } from '../primitives'
import { AssessmentStatusBadge } from '../assessment-status-badge'
import {
  FACULTY,
  ASSESSMENTS,
  QTYPE,
  STATES,
  qIcon,
  aggregatePsy,
  flaggedCount,
  totalQuestions,
  totalPoints,
  fmt2,
  diffColor,
  discColor,
  pbiColor,
  type BuilderMeta,
  type Section,
  type Question,
  type LifecycleState,
} from '../data'

const LIFE: LifecycleState[] = ['planned', 'draft', 'review', 'ready', 'completed', 'archived']

// question shape used in the analysis tables / explorer (psy is always present here)
type AnalyzedQ = Question & { psy: { p: number; disc: number; pbi: number }; sec?: string }

interface Results {
  students: number
  meanPct: number
  median: number
  sd: number
  buckets: number[]
  passRate: number
  agg: ReturnType<typeof aggregatePsy>
  allQ: AnalyzedQ[]
  flagged: number
  completionRate: number
}

// green-tinted "Healthy"/"Approved" pill, consistent with AssessmentStatusBadge
const HEALTHY_TINT: CSSProperties = { backgroundColor: 'oklch(from var(--chart-2) l c h / 0.14)', color: 'var(--chip-2)' }

// deterministic PRNG so every render of an assessment shows the same numbers
function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

function resultsFor(meta: BuilderMeta, sections: Section[]): Results {
  const rnd = seeded(meta.id || 'x')
  const allQ = sections.flatMap(s => s.questions) as AnalyzedQ[]
  const agg = aggregatePsy(allQ)
  const meanPct = Math.round(agg.p * 100)
  const students = 72 + Math.floor(rnd() * 46)
  const sd = 11 + Math.floor(rnd() * 6)
  const buckets = new Array(10).fill(0)
  for (let i = 0; i < students; i++) {
    let u = 0, v = 0; while (u === 0) u = rnd(); while (v === 0) v = rnd()
    const g = Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * v)
    const score = Math.max(2, Math.min(99, meanPct + g * sd))
    buckets[Math.floor(score / 10)]++
  }
  // median from cumulative buckets
  let cum = 0, median = meanPct
  for (let i = 0; i < 10; i++) { cum += buckets[i]; if (cum >= students / 2) { median = i * 10 + 5; break } }
  const passN = buckets.reduce((s: number, c: number, i: number) => s + (i >= 6 ? c : 0), 0)
  const passRate = Math.round((passN / students) * 100)
  const flagged = flaggedCount(sections)
  const completionRate = 88 + Math.floor(rnd() * 11) // %
  return { students, meanPct, median, sd, buckets, passRate, agg, allQ, flagged, completionRate }
}

function daysUntil(dateStr: string): number | null {
  const d = new Date(dateStr); if (isNaN(d.getTime())) return null
  return Math.round((d.getTime() - Date.now()) / 86400000)
}

/* ── token bar (replaces Meter; no DS Progress export) ──────── */
function Bar({ pct, color, height = 6 }: { pct: number; color: string; height?: number }) {
  return (
    <div className="rounded-full bg-muted overflow-hidden" style={{ flex: 1, height, minWidth: 40 }}>
      <div className="h-full rounded-full" style={{ width: `${Math.min(100, Math.max(0, pct))}%`, background: color, transition: 'width .4s ease' }} />
    </div>
  )
}

/* ── shared chrome ──────────────────────────────────────────── */
function LifecycleRail({ state }: { state: LifecycleState }) {
  const cur = LIFE.indexOf(state)
  return (
    <Card className="mb-4">
      <CardContent>
        <div className="flex items-center">
          {LIFE.map((st, i) => {
            const done = i < cur, active = i === cur
            return (
              <div key={st} className="flex items-center" style={{ flex: i < LIFE.length - 1 ? 1 : '0 0 auto' }}>
                <div className="flex flex-col items-center gap-1.5">
                  <div className="grid size-7 place-items-center rounded-full text-xs font-semibold" style={{ background: done ? 'var(--chip-2)' : active ? 'var(--brand-color)' : 'var(--muted)', color: done || active ? 'white' : 'var(--muted-foreground)' }}>
                    {done ? <Icon name="check" /> : i + 1}
                  </div>
                  <span className="text-xs" style={{ fontWeight: active ? 700 : 500, color: active ? 'var(--foreground)' : 'var(--muted-foreground)' }}>{STATES[st].label}</span>
                </div>
                {i < LIFE.length - 1 && <div className="mb-5" style={{ flex: 1, height: 2, background: i < cur ? 'var(--chip-2)' : 'var(--border)', margin: '0 10px' }} />}
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function StatTile({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: string }) {
  return (
    <div className="min-w-[120px]">
      <div className="text-xs font-medium text-muted-foreground">{label}</div>
      <div className="mt-0.5 text-2xl font-semibold leading-tight tabular-nums text-foreground" style={tone ? { color: tone } : undefined}>{value}</div>
      {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
    </div>
  )
}

function StatRow({ children }: { children: ReactNode }) {
  return <div className="flex flex-wrap gap-x-10 gap-y-4">{children}</div>
}

function SectionSummary({ sections, readonly = true }: { sections: Section[]; readonly?: boolean }) {
  return (
    <div className="flex flex-col gap-2.5">
      {sections.map(s => {
        const pts = s.questions.reduce((a, q) => a + (q.bonus ? 0 : q.points), 0)
        return (
          <Card key={s.id}>
            <div className="flex items-center gap-3" style={{ padding: '11px 14px' }}>
              <AvatarInitials size="sm" initials={FACULTY[s.owner]?.initials ?? '?'} />
              <div className="min-w-0 flex-1">
                <div className="truncate text-sm font-semibold">{s.name}</div>
                <div className="text-xs text-muted-foreground">{(FACULTY[s.owner] || {}).name} · {s.questions.length} questions · {pts} pts</div>
              </div>
              {readonly && <Badge variant="secondary" className="font-medium" style={HEALTHY_TINT}>Approved</Badge>}
            </div>
          </Card>
        )
      })}
    </div>
  )
}

/* ── score distribution histogram ───────────────────────────── */
function Histogram({ buckets, meanPct }: { buckets: number[]; meanPct: number }) {
  const max = Math.max(...buckets, 1)
  return (
    <div>
      <div className="flex items-end gap-1.5" style={{ height: 150, padding: '0 2px' }}>
        {buckets.map((c, i) => {
          const lo = i * 10, isMean = meanPct >= lo && meanPct < lo + 10
          const isPass = i >= 6
          return (
            <div key={i} className="flex h-full flex-col items-center justify-end gap-1.5" style={{ flex: 1 }}>
              <div className="text-xs font-semibold text-muted-foreground">{c || ''}</div>
              <div title={`${lo}–${lo + 9}%: ${c} students`} style={{ width: '100%', height: `${(c / max) * 100}%`, minHeight: c ? 4 : 0, borderRadius: '6px 6px 0 0', background: isPass ? 'var(--chip-2)' : 'oklch(from var(--chart-4) l c h / 0.70)', outline: isMean ? '2px solid var(--brand-color)' : 'none', outlineOffset: 1, transition: 'height .4s ease' }} />
            </div>
          )
        })}
      </div>
      <div className="flex gap-1.5" style={{ marginTop: 6, padding: '0 2px' }}>
        {buckets.map((c, i) => <div key={i} className="flex-1 text-center text-xs text-muted-foreground">{i * 10}</div>)}
      </div>
      <div className="mt-3 flex justify-center gap-5 text-xs text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'oklch(from var(--chart-4) l c h / 0.70)' }} />Below pass (&lt;60%)</span>
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, background: 'var(--chip-2)' }} />Passing</span>
        <span className="inline-flex items-center gap-1.5"><span style={{ width: 10, height: 10, borderRadius: 3, outline: '2px solid var(--brand-color)', background: 'transparent' }} />Mean band</span>
      </div>
    </div>
  )
}

/* ── per-item analysis table (vendored DataTable) ───────────── */
type ItemRow = AnalyzedQ & { idx: number } & Record<string, unknown>

function ItemAnalysis({ allQ, onOpen }: { allQ: AnalyzedQ[]; onOpen?: (i: number) => void }) {
  const rows = useMemo<ItemRow[]>(() =>
    [...allQ]
      .map((q, i) => ({ ...q, idx: i } as ItemRow))
      .sort((a, b) => (a.flagged ? 0 : 1) - (b.flagged ? 0 : 1)),
    [allQ],
  )

  const columns: ColumnDef<ItemRow>[] = [
    {
      key: 'num', label: '#', width: 44,
      cell: (row) => <span className="text-sm text-muted-foreground tabular-nums">{row.idx + 1}</span>,
    },
    {
      key: 'question', label: 'Question', width: 360,
      cell: (row) => (
        <div className="min-w-0">
          <div className="truncate text-sm font-medium text-foreground" style={{ maxWidth: 320 }}>{row.stem}</div>
          <div className="truncate text-xs text-muted-foreground">{row.topic}</div>
        </div>
      ),
    },
    {
      key: 'type', label: 'Type', width: 90,
      cell: (row) => <Badge variant="outline">{(QTYPE[row.type] || {}).short || row.type}</Badge>,
    },
    {
      key: 'p', label: 'Difficulty (p)', width: 150,
      cell: (row) => (
        <span className="inline-flex items-center gap-2">
          <b className="text-sm tabular-nums" style={{ color: diffColor(row.psy.p) }}>{fmt2(row.psy.p)}</b>
          <Bar pct={row.psy.p * 100} color={diffColor(row.psy.p)} height={5} />
        </span>
      ),
    },
    {
      key: 'disc', label: 'Discrimination', width: 130,
      cell: (row) => <span className="text-sm font-semibold tabular-nums" style={{ color: discColor(row.psy.disc) }}>{fmt2(row.psy.disc)}</span>,
    },
    {
      key: 'pbi', label: 'Point-biserial', width: 130,
      cell: (row) => <span className="text-sm font-semibold tabular-nums" style={{ color: pbiColor(row.psy.pbi) }}>{fmt2(row.psy.pbi)}</span>,
    },
    {
      key: 'status', label: 'Status', width: 130, defaultPin: 'right', lockPin: true,
      cell: (row) => row.flagged
        ? <Badge variant="destructive" className="font-medium"><Icon name="triangle-exclamation" aria-hidden="true" />Outlier</Badge>
        : <Badge variant="secondary" className="font-medium" style={HEALTHY_TINT}>Healthy</Badge>,
    },
    {
      key: 'chevron', label: '', width: 44, defaultPin: 'right', lockPin: true,
      cell: () => onOpen ? <Icon name="chevron-right" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} /> : null,
    },
  ]

  return (
    <div className="mt-1">
      <DataTable<ItemRow>
        data={rows}
        columns={columns}
        getRowId={(row) => row.id}
        selectable={false}
        searchable={false}
        showQueryControls={false}
        onRowClick={onOpen ? (row) => onOpen(row.idx) : undefined}
      />
    </div>
  )
}

/* ════════════════════════════════════════════════════════════ */
export function AssessmentStatus({ meta, sections, persona, onBack, onList, onBuilder, onReview, onPreview, onUnpublish, onRestore, onRecycle }: {
  meta: BuilderMeta
  sections: Section[]
  persona: string
  onBack: () => void
  onList: () => void
  onBuilder: () => void
  onReview: () => void
  onPreview: () => void
  onUnpublish: () => void
  onRestore: () => void
  onRecycle: () => void
}) {
  const { notify } = useApp()
  const state = meta.state
  const ownerName = (FACULTY[meta.owner] || {}).name || 'Owner'
  const due = ASSESSMENTS.find(a => a.id === meta.id)?.due || '—'

  const head = (
    <div className="page-head" style={{ alignItems: 'flex-start' }}>
      <div>
        <div className="mb-1.5 flex items-center gap-2.5">
          <Button variant="ghost" size="sm" onClick={onList}><Icon name="arrow-left" aria-hidden="true" />All assessments</Button>
          <AssessmentStatusBadge state={state} />
        </div>
        <h1 className="page-title">{meta.name}</h1>
        <p className="page-sub">{meta.course} · {totalQuestions(sections)} questions · {totalPoints(sections)} points · {meta.security}</p>
      </div>
      <div className="actions">
        <Button variant="outline" onClick={onBuilder}><Icon name="eye" aria-hidden="true" />View questions</Button>
        {state === 'ready' && <Button onClick={onPreview}><Icon name="play" aria-hidden="true" />Preview as student</Button>}
        {state === 'completed' && <Button onClick={() => notify('Exporting results — ExamSoft Excel + item analysis', 'info')}><Icon name="file-export" aria-hidden="true" />Export results</Button>}
        {state === 'archived' && <Button onClick={onRecycle}><Icon name="recycle" aria-hidden="true" />Recycle as blueprint</Button>}
      </div>
    </div>
  )

  return (
    <div className="content" style={{ maxWidth: 1120 }}>
      {head}
      <LifecycleRail state={state} />
      {state === 'ready' && <ReadyView meta={meta} sections={sections} due={due} ownerName={ownerName} onReview={onReview} onBuilder={onBuilder} onPreview={onPreview} onUnpublish={onUnpublish} notify={notify} />}
      {state === 'completed' && <CompletedView meta={meta} sections={sections} due={due} ownerName={ownerName} notify={notify} onReview={onReview} onRecycle={onRecycle} />}
      {state === 'archived' && <ArchivedView meta={meta} sections={sections} due={due} ownerName={ownerName} notify={notify} onBuilder={onBuilder} onRecycle={onRecycle} onRestore={onRestore} />}
    </div>
  )
}

type NotifyFn = (msg: string, tone?: 'success' | 'info' | 'warn') => void

/* ── READY ──────────────────────────────────────────────────── */
function ReadyView({ meta, sections, due, ownerName, onReview, onBuilder, onPreview, onUnpublish, notify }: {
  meta: BuilderMeta; sections: Section[]; due: string; ownerName: string
  onReview: () => void; onBuilder: () => void; onPreview: () => void; onUnpublish: () => void; notify: NotifyFn
}) {
  const days = daysUntil(due)
  return (
    <div className="grid items-start gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
      <div className="flex flex-col gap-4">
        <Card style={{ background: 'oklch(from var(--chart-2) l c h / 0.06)', borderColor: 'oklch(from var(--chart-2) l c h / 0.28)' }}>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="grid place-items-center" style={{ width: 46, height: 46, borderRadius: 12, background: 'var(--card)', color: 'var(--chip-2)', flexShrink: 0 }}><Icon name="lock" aria-hidden="true" style={{ fontSize: 20 }} /></span>
              <div className="flex-1">
                <div className="text-base font-bold">Approved &amp; sealed</div>
                <div className="text-xs text-muted-foreground" style={{ lineHeight: 1.45 }}>Both review levels passed. The exam is locked — no edits without unpublishing — and opens to students automatically at the scheduled time.</div>
              </div>
              {days != null && days >= 0 && <div className="text-center" style={{ flexShrink: 0 }}><div className="text-2xl font-bold leading-none" style={{ color: 'var(--chip-2)' }}>{days}</div><div className="text-xs text-muted-foreground">day{days !== 1 ? 's' : ''} to open</div></div>}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-1 text-base font-semibold">Approval record</div>
            <div className="mb-3.5 text-xs text-muted-foreground">The two-level sign-off that cleared this exam for delivery.</div>
            <div className="flex flex-col gap-2.5">
              {[{ who: meta.owner, lvl: 'Level 1 — Owner', note: 'Verified every section against the blueprint', when: '10/12/2026 09:40 AM EST' },
                { who: 'reyes' as const, lvl: 'Level 2 — Chairperson', note: 'Independent validation for high-stakes delivery', when: '10/12/2026 02:18 PM EST' }].map(r => (
                <Card key={r.lvl}>
                  <div className="flex items-center gap-3" style={{ padding: '12px 14px' }}>
                    <AvatarInitials size="sm" initials={FACULTY[r.who]?.initials ?? '?'} />
                    <div className="flex-1">
                      <div className="text-sm font-semibold">{r.lvl} · {(FACULTY[r.who] || {}).name}</div>
                      <div className="text-xs text-muted-foreground">{r.note}</div>
                    </div>
                    <div className="text-right">
                      <Badge variant="secondary" className="font-medium" style={HEALTHY_TINT}>Approved</Badge>
                      <div className="mt-1 text-xs text-muted-foreground">{r.when}</div>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
            <div className="divider" />
            <Button variant="ghost" size="sm" onClick={onReview}><Icon name="clock-rotate-left" aria-hidden="true" />Open the full review timeline</Button>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-1 text-base font-semibold">Sections</div>
            <div className="mb-3.5 text-xs text-muted-foreground">Locked at publish. Open the builder to view (read-only) — editing requires unpublishing.</div>
            <SectionSummary sections={sections} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4" style={{ position: 'sticky', top: 76 }}>
        <Card>
          <CardContent>
            <div className="mb-3.5 text-sm font-semibold">Schedule &amp; delivery</div>
            <ConfigRow icon="calendar" label="Opens" value={due} />
            <ConfigRow icon="hourglass-half" label="Window" value="120 min · single attempt" />
            <ConfigRow icon="shield-halved" label="Security" value={`${meta.security} · lockdown browser`} />
            <ConfigRow icon="shuffle" label="Delivery" value="Questions & options randomized" />
            <ConfigRow icon="eye-slash" label="Results" value="Released after grading window" last />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="mb-2.5 text-sm font-semibold">Manage</div>
            <div className="flex flex-col gap-2">
              <Button variant="outline" className="w-full justify-center" onClick={onUnpublish}><Icon name="lock-open" aria-hidden="true" />Unpublish to edit</Button>
              <Button variant="ghost" className="w-full justify-center" onClick={() => notify('Reschedule — pick a new open date', 'info')}><Icon name="calendar" aria-hidden="true" />Reschedule</Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── COMPLETED ──────────────────────────────────────────────── */
function CompletedView({ meta, sections, due, ownerName, notify, onReview, onRecycle }: {
  meta: BuilderMeta; sections: Section[]; due: string; ownerName: string
  notify: NotifyFn; onReview: () => void; onRecycle: () => void
}) {
  const r = useMemo(() => resultsFor(meta, sections), [meta.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const allQ = useMemo(() => sections.flatMap(s => s.questions.map(q => ({ ...q, sec: s.name }))) as AnalyzedQ[], [meta.id]) // eslint-disable-line react-hooks/exhaustive-deps
  const [explore, setExplore] = useState<number | null>(null) // start index | null
  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardContent>
          <div className="flex items-center gap-3">
            <span className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'oklch(from var(--chart-2) l c h / 0.12)', color: 'var(--chip-2)', flexShrink: 0 }}><Icon name="circle-check" aria-hidden="true" style={{ fontSize: 20 }} /></span>
            <div className="flex-1">
              <div className="text-base font-bold">Delivered &amp; graded</div>
              <div className="text-xs text-muted-foreground">Administered {due} · {r.students} students · grading complete. Results below are read-only.</div>
            </div>
            <Button variant="outline" size="sm" onClick={() => setExplore(0)}><Icon name="chart-simple" aria-hidden="true" />Explore items</Button>
            <Button variant="ghost" size="sm" onClick={onRecycle}><Icon name="recycle" aria-hidden="true" />Use as blueprint</Button>
          </div>
        </CardContent>
      </Card>

      <StatRow>
        <StatTile label="Students" value={r.students} sub={`${r.completionRate}% completed`} />
        <StatTile label="Mean score" value={r.meanPct + '%'} sub={`median ${r.median}%`} tone="var(--chip-2)" />
        <StatTile label="Pass rate" value={r.passRate + '%'} sub="≥ 60% threshold" tone={r.passRate >= 70 ? 'var(--chip-2)' : 'var(--chart-4)'} />
        <StatTile label="Std deviation" value={'±' + r.sd} sub="spread of scores" />
        <StatTile label="Flagged items" value={r.flagged} sub="psychometric outliers" tone={r.flagged ? 'var(--chart-4)' : 'var(--chip-2)'} />
      </StatRow>

      <div className="grid items-start gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
        <Card>
          <CardContent>
            <div className="mb-1 text-base font-semibold">Score distribution</div>
            <div className="mb-4 text-xs text-muted-foreground">How the cohort of {r.students} students scored, in 10-point bands.</div>
            <Histogram buckets={r.buckets} meanPct={r.meanPct} />
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="mb-3.5 text-sm font-semibold">Cohort insight</div>
            <div className="flex flex-col gap-3">
              <InsightRow ok={r.meanPct >= 55 && r.meanPct <= 80} text={`Mean of ${r.meanPct}% sits ${r.meanPct >= 55 && r.meanPct <= 80 ? 'in the healthy 55–80% target band' : 'outside the 55–80% target band'}.`} />
              <InsightRow ok={r.passRate >= 70} text={`${r.passRate}% passed — ${r.passRate >= 70 ? 'in line with cohort expectations' : 'below the 70% expectation; review remediation'}.`} />
              <InsightRow ok={r.flagged === 0} text={r.flagged ? `${r.flagged} item${r.flagged > 1 ? 's' : ''} flagged as outliers — exclude or revise before reuse.` : 'No psychometric outliers — every item discriminated well.'} />
            </div>
            <div className="divider" />
            <AskLeo label="Ask Leo to interpret these results" />
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <div className="flex flex-wrap items-baseline justify-between gap-2">
            <div>
              <div className="text-base font-semibold">Item analysis</div>
              <div className="text-xs text-muted-foreground">Per-question difficulty, discrimination &amp; point-biserial from this administration. Outliers float to the top.</div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => notify('Exporting item analysis (CSV)', 'info')}><Icon name="file-export" aria-hidden="true" />Export</Button>
          </div>
          <div className="mt-3"><ItemAnalysis allQ={r.allQ} onOpen={(i) => setExplore(i)} /></div>
        </CardContent>
      </Card>

      {explore != null && <ResultsExplorer allQ={allQ} startIdx={explore} students={r.students} meta={meta} onClose={() => setExplore(null)} />}
    </div>
  )
}

/* ── ARCHIVED ───────────────────────────────────────────────── */
function ArchivedView({ meta, sections, due, ownerName, notify, onBuilder, onRecycle, onRestore }: {
  meta: BuilderMeta; sections: Section[]; due: string; ownerName: string
  notify: NotifyFn; onBuilder: () => void; onRecycle: () => void; onRestore: () => void
}) {
  const r = useMemo(() => resultsFor(meta, sections), [meta.id]) // eslint-disable-line react-hooks/exhaustive-deps
  return (
    <div className="grid items-start gap-4" style={{ gridTemplateColumns: '1.5fr 1fr' }}>
      <div className="flex flex-col gap-4">
        <Card style={{ background: 'var(--muted)', borderStyle: 'dashed' }}>
          <CardContent>
            <div className="flex items-center gap-3">
              <span className="grid place-items-center" style={{ width: 44, height: 44, borderRadius: 12, background: 'var(--card)', color: 'var(--muted-foreground)', flexShrink: 0 }}><Icon name="box-archive" aria-hidden="true" style={{ fontSize: 19 }} /></span>
              <div className="flex-1">
                <div className="text-base font-bold">Archived record</div>
                <div className="text-xs text-muted-foreground" style={{ lineHeight: 1.45 }}>A frozen, read-only snapshot kept for audit and reuse. Administered {due}. Restore it to a working copy, or recycle its blueprint into a new exam.</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-1 text-base font-semibold">Final summary</div>
            <div className="mb-4 text-xs text-muted-foreground">Captured at archival — the historical performance of this exam.</div>
            <StatRow>
              <StatTile label="Cohort" value={r.students} sub="students sat" />
              <StatTile label="Mean score" value={r.meanPct + '%'} sub={`median ${r.median}%`} />
              <StatTile label="Pass rate" value={r.passRate + '%'} sub="≥ 60%" />
              <StatTile label="Avg. difficulty" value={fmt2(r.agg.p)} sub="proportion correct" />
            </StatRow>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-1 text-base font-semibold">Sections (frozen)</div>
            <div className="mb-3.5 text-xs text-muted-foreground">The exact structure as delivered. Read-only.</div>
            <SectionSummary sections={sections} />
          </CardContent>
        </Card>
      </div>

      <div className="flex flex-col gap-4" style={{ position: 'sticky', top: 76 }}>
        <Card>
          <CardContent>
            <div className="mb-1 text-sm font-semibold">Reuse</div>
            <div className="mb-3.5 text-xs text-muted-foreground">Bring this exam&apos;s blueprint forward into a new assessment.</div>
            <div className="flex flex-col gap-2">
              <Button className="w-full justify-center" onClick={onRecycle}><Icon name="recycle" aria-hidden="true" />Recycle as blueprint</Button>
              <Button variant="outline" className="w-full justify-center" onClick={onRestore}><Icon name="rotate-left" aria-hidden="true" />Restore to draft copy</Button>
              <Button variant="ghost" className="w-full justify-center" onClick={() => notify('Exporting — ExamSoft Excel', 'info')}><Icon name="file-export" aria-hidden="true" />Export</Button>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent>
            <div className="mb-3 text-sm font-semibold">Provenance</div>
            <ConfigRow icon="user" label="Owner" value={ownerName} />
            <ConfigRow icon="calendar" label="Delivered" value={due} />
            <ConfigRow icon="box-archive" label="Archived" value={ASSESSMENTS.find(a => a.id === meta.id)?.updated || '—'} last />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── small shared rows ──────────────────────────────────────── */
function ConfigRow({ icon, label, value, last }: { icon: string; label: string; value: ReactNode; last?: boolean }) {
  return (
    <div className="flex items-center gap-2.5" style={{ padding: '9px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <Icon name={icon} aria-hidden="true" style={{ fontSize: 14, color: 'var(--muted-foreground)', width: 18 }} />
      <span className="flex-1 text-xs text-muted-foreground">{label}</span>
      <span className="text-right text-sm font-medium">{value}</span>
    </div>
  )
}
function InsightRow({ ok, text }: { ok: boolean; text: ReactNode }) {
  return (
    <div className="flex gap-2.5">
      <Icon name={ok ? 'circle-check' : 'circle-exclamation'} aria-hidden="true" style={{ color: ok ? 'var(--chip-2)' : 'var(--chart-4)', fontSize: 16, marginTop: 1, flexShrink: 0 }} />
      <div className="text-sm" style={{ lineHeight: 1.45 }}>{text}</div>
    </div>
  )
}

/* ════════════════════════════════════════════════════════════
   Item Performance Explorer — opened from a Completed assessment's item
   analysis. A dual-pane, navigable view modeled on the Preview & Simulation
   engine: the left pane shows the item exactly as delivered (correct answer +
   per-option response distribution); the right pane shows dense per-item
   analytics correlated to performance. A question rail at the bottom walks
   every item (← / →).
   ════════════════════════════════════════════════════════════ */
const clamp01 = (x: number) => Math.max(0.02, Math.min(0.99, x))

interface QGroup { label: string; rate: number; n?: number; color: string }
interface QOptionResult { text: string; correct: boolean; pick: number; upper: number; lower: number }
interface QPartial { label: string; rate: number; color: string }
interface QuestionResultModel {
  p: number; disc: number; pbi: number
  upper: number; mid: number; lower: number
  groups: QGroup[]; options: QOptionResult[] | null; partials: QPartial[] | null
  meanTimeS: number; students: number
}

// Deterministic per-question result model derived from its psychometrics.
function questionResult(q: AnalyzedQ, students: number): QuestionResultModel {
  const rnd = seeded((q.id || 'q') + 'res')
  const p = q.psy.p, disc = q.psy.disc
  const upper = clamp01(p + disc * 0.6)
  const lower = clamp01(p - disc * 0.6)
  const mid = clamp01(p)
  const g = Math.round(students / 3)
  const groups: QGroup[] = [
    { label: 'Top third', rate: upper, n: g, color: 'var(--chip-2)' },
    { label: 'Middle third', rate: mid, n: students - 2 * g, color: 'var(--chart-1)' },
    { label: 'Bottom third', rate: lower, n: g, color: 'var(--chart-4)' },
  ]

  let options: QOptionResult[] | null = null
  if (q.options && q.options.length) {
    if (q.type === 'msq') {
      options = q.options.map((o) => {
        const base = o.correct ? clamp01(0.5 + rnd() * 0.35) : clamp01(0.08 + rnd() * 0.2)
        return { text: o.text, correct: o.correct, pick: base, upper: clamp01(o.correct ? base + disc * 0.4 : base - disc * 0.3), lower: clamp01(o.correct ? base - disc * 0.4 : base + disc * 0.35) }
      })
    } else {
      // single-answer: distribute the cohort across options, correct ≈ p
      const raw = q.options.map((o) => (o.correct ? 0 : rnd() * 0.6 + 0.12))
      const dTot = raw.reduce((s, v) => s + v, 0) || 1
      options = q.options.map((o, i) => {
        const pick = o.correct ? p : (1 - p) * (raw[i] / dTot)
        // correct: top group picks more; distractor: bottom group picks more (good)
        const upPick = o.correct ? upper : clamp01(pick * 0.55)
        const loPick = o.correct ? lower : clamp01(pick * 1.7)
        return { text: o.text, correct: o.correct, pick, upper: upPick, lower: loPick }
      })
    }
  }

  // score breakdown for non-option types
  const partials: QPartial[] | null = !options ? (() => {
    const full = clamp01(p - 0.08), zero = clamp01(1 - p - 0.12)
    const partial = clamp01(1 - full - zero)
    return [
      { label: 'Full marks', rate: full, color: 'var(--chip-2)' },
      { label: 'Partial', rate: partial, color: 'var(--chart-1)' },
      { label: 'Zero', rate: zero, color: 'var(--chart-4)' },
    ]
  })() : null

  const baseTime = ({ mcq: 62, msq: 92, tf: 32, fitb: 50, match: 120, hotspot: 84, essay: 430 } as Record<string, number>)[q.type] || 60
  const meanTimeS = Math.round(baseTime * (1 + (0.65 - p) * 0.8))
  return { p, disc, pbi: q.psy.pbi, upper, mid, lower, groups, options, partials, meanTimeS, students }
}

function fmtTime(s: number) { const m = Math.floor(s / 60), ss = s % 60; return m ? `${m}m ${ss}s` : `${ss}s` }

const paneStyle: CSSProperties = { flex: 1, display: 'flex', flexDirection: 'column', background: 'white', borderRadius: 12, border: '1px solid var(--border)', overflow: 'hidden', minWidth: 0 }
const paneHeadStyle: CSSProperties = { padding: '12px 18px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10 }

function ResultsExplorer({ allQ, startIdx = 0, students, meta, onClose }: {
  allQ: AnalyzedQ[]; startIdx?: number; students: number; meta: BuilderMeta; onClose: () => void
}) {
  const [idx, setIdx] = useState(startIdx)
  const [view, setView] = useState<'split' | 'question' | 'performance'>('split')
  const q = allQ[idx] || ({} as AnalyzedQ)
  const r = useMemo(() => questionResult(q, students), [q.id, students]) // eslint-disable-line react-hooks/exhaustive-deps
  const go = (d: number) => setIdx(i => Math.max(0, Math.min(allQ.length - 1, i + d)))

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => { if (e.key === 'ArrowRight') go(1); else if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', onKey); return () => window.removeEventListener('keydown', onKey)
  }, [allQ.length]) // eslint-disable-line react-hooks/exhaustive-deps

  const correctPct = Math.round(r.p * 100)
  const luringDistractor = (r.options || []).some(o => !o.correct && o.upper > o.lower)

  /* ── left: the question exactly as delivered, annotated with responses ── */
  const questionPane = (
    <div style={paneStyle}>
      <div style={paneHeadStyle}>
        <Icon name={qIcon(q.type)} aria-hidden="true" style={{ color: 'var(--brand-color-dark)' }} />
        <div className="text-sm font-semibold">Question view</div>
        <Badge variant="outline">as delivered</Badge>
        <span className="ml-auto text-xs text-muted-foreground">{q.sec}</span>
      </div>
      <div style={{ flex: 1, padding: '20px 22px', overflowY: 'auto' }}>
        <div className="mb-3 flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Question {idx + 1} of {allQ.length}</span>
          <Badge variant="outline"><Icon name={qIcon(q.type)} aria-hidden="true" />{QTYPE[q.type]?.short}</Badge>
          <Badge variant="outline">{q.topic}</Badge>
          {q.flagged && <Badge variant="destructive" className="font-medium"><Icon name="triangle-exclamation" aria-hidden="true" />Outlier</Badge>}
          <span className="ml-auto text-xs font-semibold">{q.points} pts</span>
        </div>
        <div className="mb-5 text-base" style={{ lineHeight: 1.5 }}>{q.stem}</div>

        {r.options && (
          <div className="flex flex-col gap-2.5">
            {r.options.map((o, i) => {
              const pct = Math.round(o.pick * 100)
              return (
                <div key={i} style={{ border: `1px solid ${o.correct ? 'oklch(from var(--chip-2) l c h / 0.50)' : 'var(--border-control-3)'}`, borderRadius: 12, padding: '11px 13px', background: o.correct ? 'oklch(from var(--chip-2) l c h / 0.06)' : 'var(--card)' }}>
                  <div className="mb-2 flex items-center gap-2.5">
                    <Icon name={o.correct ? 'circle-check' : (q.type === 'msq' ? 'square' : 'circle')} aria-hidden="true" style={{ color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)', fontSize: 15, flexShrink: 0 }} />
                    <span className="flex-1 text-sm">{o.text}</span>
                    {o.correct && <Badge variant="secondary" className="font-medium" style={{ backgroundColor: 'oklch(from var(--chip-2) l c h / 0.14)', color: 'var(--chip-2)' }}>Key</Badge>}
                    <span className="text-right text-xs font-bold" style={{ color: o.correct ? 'var(--chip-2)' : 'var(--muted-foreground)', width: 38 }}>{pct}%</span>
                  </div>
                  <Bar pct={o.pick * 100} color={o.correct ? 'var(--chip-2)' : (o.upper > o.lower ? 'var(--chart-4)' : 'var(--border-control-3)')} height={6} />
                </div>
              )
            })}
            <div className="text-xs text-muted-foreground">{q.type === 'msq' ? 'Share of students who selected each option.' : 'Share of students who chose each option.'}</div>
          </div>
        )}

        {r.partials && (
          <div className="flex flex-col gap-3">
            <div className="text-xs text-muted-foreground">{QTYPE[q.type]?.label} — graded score breakdown across {students} students.</div>
            {r.partials.map((s, i) => (
              <div key={i}>
                <div className="mb-1 flex justify-between text-xs"><span>{s.label}</span><b>{Math.round(s.rate * 100)}%</b></div>
                <Bar pct={s.rate * 100} color={s.color} height={8} />
              </div>
            ))}
          </div>
        )}
      </div>
      <div style={{ padding: '12px 18px', borderTop: '1px solid var(--border)', display: 'flex', gap: 8, alignItems: 'center' }}>
        <Button variant="outline" size="sm" disabled={idx === 0} onClick={() => go(-1)}><Icon name="arrow-left" aria-hidden="true" />Previous</Button>
        <span className="text-xs text-muted-foreground" style={{ margin: '0 auto' }}>Question {idx + 1} / {allQ.length}</span>
        <Button size="sm" disabled={idx === allQ.length - 1} onClick={() => go(1)}>Next<Icon name="arrow-right" aria-hidden="true" /></Button>
      </div>
    </div>
  )

  /* ── right: dense analytics correlated to performance ── */
  const perfPane = (
    <div style={paneStyle}>
      <div style={paneHeadStyle}>
        <Icon name="chart-simple" aria-hidden="true" style={{ color: 'var(--brand-color-dark)' }} />
        <div className="text-sm font-semibold">Performance</div>
        <Badge variant="outline">{students} students</Badge>
      </div>
      <div style={{ flex: 1, padding: 16, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 14 }}>
        {/* KPI strip */}
        <div className="grid gap-2" style={{ gridTemplateColumns: 'repeat(2, 1fr)' }}>
          <MetricCell label="Answered correctly" value={correctPct + '%'} tone={diffColor(r.p)} />
          <MetricCell label="Avg. time on item" value={fmtTime(r.meanTimeS)} />
          <MetricCell label="Discrimination" value={fmt2(r.disc)} tone={discColor(r.disc)} sub={r.disc >= 0.3 ? 'strong' : r.disc >= 0.15 ? 'fair' : 'weak'} />
          <MetricCell label="Point-biserial" value={fmt2(r.pbi)} tone={pbiColor(r.pbi)} sub={r.pbi < 0.1 ? 'review' : 'healthy'} />
        </div>

        {/* score-group breakdown = discrimination, made visible */}
        <Card>
          <div style={{ padding: '13px 15px' }}>
            <div className="mb-0.5 text-xs font-semibold">Correct rate by ability group</div>
            <div className="mb-3 text-xs text-muted-foreground">Students split into thirds by total exam score. A healthy item is answered correctly by more high scorers than low scorers.</div>
            <div className="flex flex-col gap-2.5">
              {r.groups.map((g, i) => (
                <div key={i} className="flex items-center gap-2.5">
                  <span className="text-xs" style={{ width: 84 }}>{g.label}</span>
                  <Bar pct={g.rate * 100} color={g.color} height={9} />
                  <span className="text-right text-xs font-semibold" style={{ width: 38 }}>{Math.round(g.rate * 100)}%</span>
                </div>
              ))}
            </div>
            <div className="mt-3 flex items-center gap-2 text-xs" style={{ paddingTop: 11, borderTop: '1px solid var(--border)' }}>
              <Icon name={r.upper - r.lower >= 0.2 ? 'arrow-trend-up' : 'triangle-exclamation'} aria-hidden="true" style={{ color: r.upper - r.lower >= 0.2 ? 'var(--chip-2)' : 'var(--chart-4)' }} />
              <span><b>{Math.round((r.upper - r.lower) * 100)} pt</b> gap between top and bottom thirds — {r.upper - r.lower >= 0.2 ? 'the item separates ability well.' : 'weak separation; the item barely distinguishes strong from weak students.'}</span>
            </div>
          </div>
        </Card>

        {/* distractor / option analysis */}
        {r.options && (
          <Card>
            <div style={{ padding: '13px 15px' }}>
              <div className="mb-0.5 text-xs font-semibold">{q.type === 'msq' ? 'Option selection by group' : 'Distractor analysis'}</div>
              <div className="mb-3 text-xs text-muted-foreground">How each option pulled the top vs bottom third. A distractor that lures <b>more top-third</b> students is a warning sign.</div>
              <div className="flex flex-col gap-2.5">
                {r.options.map((o, i) => {
                  const lure = !o.correct && o.upper > o.lower
                  return (
                    <div key={i}>
                      <div className="mb-1 flex items-center gap-2">
                        <Icon name={o.correct ? 'circle-check' : 'circle'} aria-hidden="true" style={{ fontSize: 12, color: o.correct ? 'var(--chip-2)' : lure ? 'var(--chart-4)' : 'var(--muted-foreground)' }} />
                        <span className="flex-1 truncate text-xs">{o.text}</span>
                        {o.correct && <span className="text-xs text-muted-foreground">Key</span>}
                        {lure && <Badge variant="secondary" className="font-medium" style={{ backgroundColor: 'oklch(from var(--chart-4) l c h / 0.14)', color: 'var(--chart-4)' }}>lures top</Badge>}
                      </div>
                      <div className="flex gap-3" style={{ paddingLeft: 20 }}>
                        <GroupBar label="Top" value={o.upper} color="var(--chip-2)" />
                        <GroupBar label="Bottom" value={o.lower} color="var(--chart-4)" />
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </Card>
        )}

        {/* auto insight */}
        <div className="info-banner" style={{ alignItems: 'flex-start' }}>
          <LeoStar style={{ marginTop: 1 }} />
          <div style={{ lineHeight: 1.45 }}>{itemInsight(q, r, luringDistractor)}</div>
        </div>
      </div>
    </div>
  )

  return (
    <div className="exam-creation-overlay exam-creation" style={{ background: 'oklch(0.18 0.01 270 / 0.6)' }} onClick={onClose}>
      <div className="exam-creation-modal" onClick={e => e.stopPropagation()} style={{ margin: 'auto', width: 'min(1280px, 96vw)', height: '92vh', maxHeight: '92vh', display: 'flex', flexDirection: 'column', background: 'var(--background)', borderRadius: 18, padding: 18, boxShadow: 'var(--shadow-lg)' }}>
        <div className="mb-3.5 flex items-center gap-3">
          <div style={{ fontFamily: 'var(--font-display)', fontWeight: 300, fontSize: 22 }}>Item performance</div>
          <span className="text-xs text-muted-foreground">{meta?.name} · question-by-question results</span>
          <div className="ml-auto flex items-center gap-1.5">
            <Button variant={view === 'split' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'split'} onClick={() => setView('split')}>Split</Button>
            <Button variant={view === 'question' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'question'} onClick={() => setView('question')}>Question</Button>
            <Button variant={view === 'performance' ? 'default' : 'outline'} size="sm" aria-pressed={view === 'performance'} onClick={() => setView('performance')}>Performance</Button>
          </div>
          <Button variant="ghost" size="icon-sm" aria-label="Close" onClick={onClose}><Icon name="xmark" aria-hidden="true" /></Button>
        </div>

        <div style={{ flex: 1, display: 'flex', gap: 16, minHeight: 0 }}>
          {(view === 'split' || view === 'question') && questionPane}
          {(view === 'split' || view === 'performance') && perfPane}
        </div>

        {/* question rail */}
        <div className="mt-3.5 flex items-center gap-2">
          <span className="text-xs text-muted-foreground" style={{ flexShrink: 0 }}>Items</span>
          <div className="flex flex-wrap gap-1.5" style={{ flex: 1 }}>
            {allQ.map((qq, i) => {
              const on = i === idx
              return (
                <Button
                  type="button"
                  key={qq.id}
                  variant={on ? 'default' : 'outline'}
                  size="icon-sm"
                  onClick={() => setIdx(i)}
                  aria-label={`Question ${i + 1}`}
                  aria-pressed={on}
                  title={`Q${i + 1} · ${Math.round(qq.psy.p * 100)}% correct`}
                  className="size-7 rounded-lg text-xs font-semibold"
                  style={on ? undefined : qq.flagged ? { border: '1px solid oklch(from var(--destructive) l c h / 0.45)', background: 'oklch(from var(--destructive) l c h / 0.08)', color: 'var(--destructive)' } : undefined}
                >{i + 1}</Button>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}

function MetricCell({ label, value, sub, tone }: { label: string; value: ReactNode; sub?: string; tone?: string }) {
  return (
    <Card>
      <div style={{ padding: '10px 12px' }}>
        <div className="text-xs text-muted-foreground">{label}</div>
        <div className="text-xl font-bold" style={{ color: tone || 'var(--foreground)', lineHeight: 1.2 }}>{value}</div>
        {sub && <div className="text-xs text-muted-foreground">{sub}</div>}
      </div>
    </Card>
  )
}
function GroupBar({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div className="flex flex-1 items-center gap-1.5">
      <span className="text-xs text-muted-foreground" style={{ width: 38 }}>{label}</span>
      <Bar pct={value * 100} color={color} height={6} />
      <span className="text-right text-xs font-semibold" style={{ width: 30 }}>{Math.round(value * 100)}%</span>
    </div>
  )
}

function itemInsight(q: AnalyzedQ, r: QuestionResultModel, lure: boolean): ReactNode {
  if (q.flagged) return <span><b>Flagged outlier.</b> {q.flagged.reason} With a point-biserial of {fmt2(r.pbi)} and only a {Math.round((r.upper - r.lower) * 100)}-point top-to-bottom gap, this item adds little signal — revise the key or wording, or exclude it from scoring before reuse.</span>
  if (lure) return <span>A distractor is pulling more <b>top-third</b> than bottom-third students — often a sign of an ambiguous option or an arguable second-best answer. Worth a wording review even though overall stats are healthy.</span>
  if (r.p > 0.9) return <span>Very easy — {Math.round(r.p * 100)}% answered correctly. Fine as a warm-up or confidence item, but it does little to separate ability. Consider raising difficulty if you need more discrimination here.</span>
  if (r.p < 0.35) return <span>Hard — only {Math.round(r.p * 100)}% correct, yet the top third outperformed the bottom by {Math.round((r.upper - r.lower) * 100)} points, so it still discriminates well. Keep it as a stretch item.</span>
  return <span>Healthy item: {Math.round(r.p * 100)}% correct with strong separation between ability groups ({fmt2(r.disc)} discrimination). Good candidate to recycle into future blueprints.</span>
}
