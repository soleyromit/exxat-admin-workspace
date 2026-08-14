'use client'

/* Stats tab — two sub-views: Monitoring (live) and Results (post-exam).
   Replaces the legacy AssessmentStatus component for the outer Stats tab.
   Monitoring: started/submitted/active counts, student status list, issue flags, proctor actions.
   Results: score distribution histogram, per-question psychometric analysis. */

import { useMemo, useState } from 'react'
import { Card, CardContent, Button, Badge, LocalBanner } from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { EmptyState } from '@/components/empty-state'
import { Icon, LeoStar } from '../icons'
import { AskLeo, useApp } from '../primitives'
import {
  FACULTY, QTYPE, aggregatePsy, fmt2, diffColor, discColor, pbiColor,
  type BuilderMeta, type Section, type Question,
} from '../data'

interface Props {
  meta: BuilderMeta
  sections: Section[]
  persona: string
  onBack: () => void
  onList: () => void
  onBuilder: () => void
}

// ── deterministic PRNG ───────────────────────────────────────────
function seeded(str: string) {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return () => { h += 0x6D2B79F5; let t = h; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296 }
}

// ── student rows for monitoring ────────────────────────────────
type StudentState = 'not_started' | 'in_progress' | 'submitted' | 'issue'
interface StudentRow extends Record<string, unknown> {
  id: string; name: string; state: StudentState
  progress: number; timeLeft: string; issue?: string
}

const STUDENT_NAMES = [
  'Aisha Patel', 'Ben Okafor', 'Clara Zhang', 'David Kim', 'Elena Reyes',
  'Fatima Hassan', 'George Liu', 'Hannah Smith', 'Ivan Torres', 'Jenna Park',
  'Kevin Nguyen', 'Lara Mosby', 'Marcus Webb', 'Nadia Chow', 'Oscar Ferreira',
]

function makeStudents(seed: string, n: number): StudentRow[] {
  const rng = seeded(seed)
  return Array.from({ length: n }, (_, i) => {
    const r = rng()
    const state: StudentState = r < 0.1 ? 'not_started' : r < 0.15 ? 'issue' : r < 0.55 ? 'submitted' : 'in_progress'
    const progress = state === 'submitted' ? 100 : state === 'not_started' ? 0 : Math.round(30 + rng() * 60)
    const minsLeft = Math.round(5 + rng() * 55)
    return {
      id: `s${i}`, name: STUDENT_NAMES[i % STUDENT_NAMES.length],
      state, progress, timeLeft: `${minsLeft}m`,
      issue: state === 'issue' ? (rng() > 0.5 ? 'Raised hand' : 'Technical issue') : undefined,
    }
  })
}

// ── score histogram ───────────────────────────────────────────
function ScoreHistogram({ buckets, mean }: { buckets: number[]; mean: number }) {
  const max = Math.max(...buckets, 1)
  const labels = ['0–49', '50–59', '60–69', '70–79', '80–89', '90–100']
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
      {buckets.map((count, i) => {
        const pct = (count / max) * 100
        const isAvg = (i === 4 && mean >= 80) || (i === 3 && mean >= 70 && mean < 80) || (i === 2 && mean >= 60 && mean < 70) || (i === 1 && mean >= 50 && mean < 60) || (i === 5 && mean >= 90)
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{ fontSize: 12, color: 'var(--muted-foreground)', width: 52, flexShrink: 0 }}>{labels[i]}</div>
            <div style={{ flex: 1, height: 22, borderRadius: 4, overflow: 'hidden', background: 'var(--muted)' }}>
              <div style={{ height: '100%', width: `${pct}%`, background: isAvg ? 'var(--brand-color)' : 'var(--chart-1)', borderRadius: 4, transition: 'width 0.3s' }} />
            </div>
            <div style={{ fontSize: 12, fontWeight: 600, width: 24, textAlign: 'right' }}>{count}</div>
          </div>
        )
      })}
      <div className="hint" style={{ marginTop: 4 }}>Mean: {mean.toFixed(1)}%</div>
    </div>
  )
}

// ── KPI chip ─────────────────────────────────────────────────
function KpiChip({ label, value, sub, color }: { label: string; value: string | number; sub?: string; color?: string }) {
  return (
    <Card style={{ borderRadius: 12, flex: 1 }}>
      <CardContent style={{ padding: '14px 16px' }}>
        <div className="hint" style={{ marginBottom: 4 }}>{label}</div>
        <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 24, color: color ?? 'var(--foreground)' }}>{value}</div>
        {sub && <div className="hint" style={{ marginTop: 2 }}>{sub}</div>}
      </CardContent>
    </Card>
  )
}

// ── monitoring sub-view ───────────────────────────────────────
function MonitoringView({ meta, sections }: { meta: BuilderMeta; sections: Section[] }) {
  const { notify } = useApp()
  const students = useMemo(() => makeStudents(meta.id, 15), [meta.id])
  const started = students.filter(s => s.state !== 'not_started').length
  const submitted = students.filter(s => s.state === 'submitted').length
  const issues = students.filter(s => s.state === 'issue')
  const [dismissed, setDismissed] = useState<Set<string>>(new Set())

  const stateColor: Record<StudentState, string> = {
    submitted: 'var(--chart-2)',
    in_progress: 'var(--brand-color)',
    not_started: 'var(--muted-foreground)',
    issue: 'var(--destructive)',
  }
  const stateLabel: Record<StudentState, string> = {
    submitted: 'Submitted',
    in_progress: 'In progress',
    not_started: 'Not started',
    issue: 'Issue',
  }

  const cols: ColumnDef<StudentRow>[] = [
    { key: 'name', label: 'Student', cell: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 13, fontWeight: 500 }}>{row.name}</span>
        {row.issue && <Badge variant="destructive" style={{ fontSize: 11 }}>{row.issue}</Badge>}
      </div>
    )},
    { key: 'state', label: 'Status', cell: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ width: 7, height: 7, borderRadius: 999, background: stateColor[row.state as StudentState], display: 'inline-block' }} />
        <span style={{ fontSize: 13 }}>{stateLabel[row.state as StudentState]}</span>
      </div>
    )},
    { key: 'progress', label: 'Progress', cell: (row) => (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <div style={{ width: 80, height: 6, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}>
          <div style={{ height: '100%', width: `${row.progress}%`, background: row.state === 'submitted' ? 'var(--chart-2)' : 'var(--brand-color)', borderRadius: 3 }} />
        </div>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{row.progress}%</span>
      </div>
    )},
    { key: 'timeLeft', label: 'Time left', cell: (row) => (
      <span style={{ fontSize: 13, color: row.state === 'in_progress' ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
        {row.state === 'submitted' ? '—' : row.state === 'not_started' ? '—' : String(row.timeLeft)}
      </span>
    )},
    { key: '_actions', label: '', cell: (row) => (
      <div style={{ display: 'flex', gap: 4 }}>
        {row.state === 'in_progress' && (
          <Button type="button" variant="ghost" size="sm" onClick={() => notify(`Ended exam for ${row.name}`, 'warn')}>
            End exam
          </Button>
        )}
        {row.state === 'issue' && (
          <Button type="button" variant="ghost" size="sm" style={{ color: 'var(--destructive)' }} onClick={() => notify(`Invalidated ${row.name}'s exam`, 'warn')}>
            Invalidate
          </Button>
        )}
      </div>
    )},
  ]

  const nQ = sections.reduce((s, sec) => s + sec.questions.length, 0)

  return (
    <div>
      {/* issue flags */}
      {issues.filter(s => !dismissed.has(s.id)).map(s => (
        <LocalBanner key={s.id} variant="warning" dismissible onDismiss={() => setDismissed(d => new Set([...d, s.id]))} className="mb-3">
          <strong>{s.name}</strong> — {s.issue}
          <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
            <Button type="button" variant="outline" size="sm" onClick={() => { notify(`Issued printout to ${s.name}`, 'info') }}>
              <Icon name="print" />Print backup
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={() => notify(`Ended exam early for ${s.name}`, 'warn')}>
              End exam early
            </Button>
          </div>
        </LocalBanner>
      ))}

      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiChip label="Enrolled" value={students.length} />
        <KpiChip label="Started" value={started} sub={`${Math.round((started / students.length) * 100)}%`} color="var(--brand-color)" />
        <KpiChip label="Submitted" value={submitted} sub={`${Math.round((submitted / students.length) * 100)}%`} color="var(--chart-2)" />
        <KpiChip label="Issues" value={issues.length} color={issues.length > 0 ? 'var(--destructive)' : 'var(--foreground)'} />
      </div>

      {/* student table */}
      {nQ > 0 ? (
        <div style={{ maxHeight: 480, overflow: 'auto', borderRadius: 12, border: '1px solid var(--border)' }}>
          <DataTable
            columns={cols}
            data={students}
            emptyState={<EmptyState icon="fa-users" title="No students" description="No students enrolled for this assessment." />}
          />
        </div>
      ) : (
        <EmptyState icon="fa-users" title="No questions" description="Add questions before monitoring the exam." />
      )}
    </div>
  )
}

// ── results sub-view ──────────────────────────────────────────
type AnalyzedQ = Question & { psy: { p: number; disc: number; pbi: number }; sec: string } & Record<string, unknown>

function ResultsView({ meta, sections }: { meta: BuilderMeta; sections: Section[] }) {
  const { openLeo } = useApp()
  const rng = useMemo(() => seeded(meta.id + 'results'), [meta.id])
  const [exploreQ, setExploreQ] = useState<AnalyzedQ | null>(null)

  const allQ: AnalyzedQ[] = useMemo(() =>
    sections.flatMap(sec => sec.questions.map(q => ({
      ...q,
      psy: q.psy ?? { p: 0.5 + (rng() - 0.5) * 0.4, disc: 0.2 + rng() * 0.3, pbi: 0.15 + rng() * 0.3 },
      sec: sec.name,
    }))), [sections]) // eslint-disable-line react-hooks/exhaustive-deps

  const n = Math.max(allQ.length > 0 ? 29 : 0, 0)
  const agg = aggregatePsy(allQ)
  const mean = 74 + rng() * 12
  const median = mean - 2 + rng() * 4
  const sd = 8 + rng() * 5
  const buckets = [1, 2, 4, 8, 9, 5]

  const cols: ColumnDef<AnalyzedQ>[] = [
    { key: 'type', label: 'Type', cell: (row) => <Badge variant="secondary">{QTYPE[row.type as keyof typeof QTYPE]?.short}</Badge> },
    { key: 'topic', label: 'Topic', cell: (row) => <span style={{ fontSize: 12 }}>{String(row.topic)}</span> },
    { key: 'bloom', label: "Bloom's", cell: (row) => <span style={{ fontSize: 12 }}>{String(row.bloom)}</span> },
    { key: 'p', label: 'Difficulty', cell: (row) => {
      const v = (row.psy as { p: number }).p
      return <span style={{ fontSize: 13, fontWeight: 600, color: diffColor(v) }}>{fmt2(v)}</span>
    }},
    { key: 'disc', label: 'Disc.', cell: (row) => {
      const v = (row.psy as { disc: number }).disc
      return <span style={{ fontSize: 13, fontWeight: 600, color: discColor(v) }}>{fmt2(v)}</span>
    }},
    { key: 'pbi', label: 'PBI', cell: (row) => {
      const v = (row.psy as { pbi: number }).pbi
      return <span style={{ fontSize: 13, fontWeight: 600, color: pbiColor(v) }}>{fmt2(v)}</span>
    }},
    { key: 'points', label: 'Pts', cell: (row) => <span style={{ fontSize: 12 }}>{Number(row.points)}</span> },
    { key: '_actions', label: '', cell: (row) => (
      <Button type="button" variant="ghost" size="sm" onClick={() => setExploreQ(row as AnalyzedQ)}>
        <Icon name="expand" />Explore
      </Button>
    )},
  ]

  if (n === 0) {
    return <EmptyState icon="fa-chart-bar" title="No results yet" description="Results appear once students have submitted the assessment." />
  }

  return (
    <div>
      {/* KPIs */}
      <div style={{ display: 'flex', gap: 12, marginBottom: 20, flexWrap: 'wrap' }}>
        <KpiChip label="Submitted" value={`${n} / 32`} />
        <KpiChip label="Mean score" value={`${mean.toFixed(1)}%`} color="var(--brand-color)" />
        <KpiChip label="Median" value={`${median.toFixed(1)}%`} />
        <KpiChip label="Std dev" value={`±${sd.toFixed(1)}`} />
      </div>

      {/* histogram */}
      <Card style={{ borderRadius: 16, marginBottom: 16 }}>
        <CardContent style={{ padding: '18px 22px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
            <Icon name="chart-bar" style={{ color: 'var(--brand-color-dark)' }} />
            <div style={{ fontSize: 14, fontWeight: 600 }}>Score distribution</div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
              <Button type="button" variant="ghost" size="sm" onClick={() => openLeo({})}>
                <LeoStar style={{ filter: 'brightness(0.8)' }} />Ask Leo
              </Button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start' }}>
            <div style={{ flex: 1 }}>
              <ScoreHistogram buckets={buckets} mean={mean} />
            </div>
            <div style={{ width: 1, background: 'var(--border)', alignSelf: 'stretch' }} />
            <div style={{ width: 160 }}>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {[
                  { label: 'Avg difficulty', v: fmt2(agg.p), c: diffColor(agg.p) },
                  { label: 'Avg discrimination', v: fmt2(agg.disc), c: discColor(agg.disc) },
                  { label: 'Avg PBI', v: fmt2(agg.pbi), c: pbiColor(agg.pbi) },
                ].map(row => (
                  <div key={row.label}>
                    <div className="hint">{row.label}</div>
                    <div style={{ fontSize: 18, fontFamily: 'var(--font-heading)', fontWeight: 300, color: row.c }}>{row.v}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* per-question table */}
      <Card style={{ borderRadius: 16 }}>
        <CardContent style={{ padding: '18px 22px' }}>
          <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 14 }}>Item analysis</div>
          <div style={{ maxHeight: 420, overflow: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
            <DataTable
              columns={cols}
              data={allQ}
              emptyState={<EmptyState icon="fa-list-check" title="No items" description="No assessment items to display." />}
            />
          </div>
          <div className="hint" style={{ marginTop: 10 }}>
            Difficulty index (p): 0 = everyone wrong, 1 = everyone correct. Target 0.4–0.8.
            Discrimination (disc): &gt;0.30 good. PBI: &gt;0.25 good. Color: green = good, amber = watch, red = review.
          </div>
        </CardContent>
      </Card>

      {/* item explorer overlay */}
      {exploreQ && (
        <div
          style={{ position: 'fixed', inset: 0, background: 'oklch(0.1 0 0 / 0.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50 }}
          role="dialog" aria-modal="true" aria-label="Item performance detail"
          onClick={() => setExploreQ(null)}
        >
          <div
            onClick={e => e.stopPropagation()}
            style={{ background: 'var(--background)', borderRadius: 18, padding: 28, maxWidth: 520, width: '94vw', boxShadow: 'var(--shadow-lg)' }}
          >
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 14 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Item performance</div>
                <div style={{ fontSize: 13, lineHeight: 1.5 }}>{exploreQ.stem}</div>
              </div>
              <Button type="button" variant="ghost" size="icon-sm" aria-label="Close" onClick={() => setExploreQ(null)}>
                <Icon name="xmark" />
              </Button>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: 10 }}>
              {[
                { label: 'Difficulty (p)', v: fmt2(exploreQ.psy.p), c: diffColor(exploreQ.psy.p) },
                { label: 'Discrimination', v: fmt2(exploreQ.psy.disc), c: discColor(exploreQ.psy.disc) },
                { label: 'Pt-biserial', v: fmt2(exploreQ.psy.pbi), c: pbiColor(exploreQ.psy.pbi) },
              ].map(kpi => (
                <Card key={kpi.label} style={{ borderRadius: 10 }}>
                  <CardContent style={{ padding: '10px 12px' }}>
                    <div className="hint" style={{ marginBottom: 2 }}>{kpi.label}</div>
                    <div style={{ fontFamily: 'var(--font-heading)', fontWeight: 300, fontSize: 22, color: kpi.c }}>{kpi.v}</div>
                  </CardContent>
                </Card>
              ))}
            </div>
            <div style={{ marginTop: 14, display: 'flex', gap: 8 }}>
              <Badge variant="secondary">{QTYPE[exploreQ.type]?.label}</Badge>
              <Badge variant="outline">{exploreQ.bloom}</Badge>
              <Badge variant="outline">{exploreQ.topic}</Badge>
            </div>
            <div className="hint" style={{ marginTop: 12 }}>Section: {exploreQ.sec}</div>
          </div>
        </div>
      )}
    </div>
  )
}

// ── main export ───────────────────────────────────────────────
export function StatsTab({ meta, sections, persona, onBack, onList, onBuilder }: Props) {
  void persona; void onBack; void onList
  const isLive = meta.state === 'ready'
  const hasResults = meta.state === 'completed' || meta.state === 'archived'
  const [view, setView] = useState<'monitoring' | 'results'>(isLive ? 'monitoring' : 'results')

  if (meta.state === 'draft' || meta.state === 'planned') {
    return (
      <div className="content">
        <EmptyState
          icon="fa-chart-bar"
          title="Not published yet"
          description="Stats are available once the assessment is published and students have started."
        />
        <div style={{ display: 'flex', justifyContent: 'center', marginTop: 16 }}>
          <Button type="button" variant="outline" onClick={onBuilder}><Icon name="arrow-left" />Back to Edit</Button>
        </div>
      </div>
    )
  }

  return (
    <div className="content" style={{ maxWidth: 960, paddingBottom: 40 }}>
      <h2 className="sr-only">Stats</h2>

      {/* sub-toggle */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 22 }}>
        <div style={{ display: 'inline-flex', gap: 2, padding: 2, borderRadius: 8, border: '1px solid var(--border)', background: 'var(--background)' }}>
          <Button type="button" variant={view === 'monitoring' ? 'default' : 'ghost'} size="sm" aria-pressed={view === 'monitoring'} disabled={!isLive && !hasResults} onClick={() => setView('monitoring')}>
            <Icon name="radar" />Monitoring
          </Button>
          <Button type="button" variant={view === 'results' ? 'default' : 'ghost'} size="sm" aria-pressed={view === 'results'} disabled={!hasResults} onClick={() => setView('results')}>
            <Icon name="chart-bar" />Results
          </Button>
        </div>
        {isLive && (
          <Badge variant="secondary" style={{ color: 'var(--chart-2)' }}>
            <span style={{ width: 6, height: 6, borderRadius: 999, background: 'var(--chart-2)', display: 'inline-block', marginRight: 5 }} />
            Live
          </Badge>
        )}
        <div style={{ marginLeft: 'auto' }}>
          <AskLeo />
        </div>
      </div>

      {view === 'monitoring' && <MonitoringView meta={meta} sections={sections} />}
      {view === 'results' && <ResultsView meta={meta} sections={sections} />}
    </div>
  )
}
