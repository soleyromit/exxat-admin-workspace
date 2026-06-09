'use client'

import React from 'react'
import { useRouter } from 'next/navigation'
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
  Button, Avatar, AvatarFallback,
} from '@exxatdesignux/ui'
import { DataTable } from '@/components/data-table'
import type { ColumnDef } from '@/components/data-table/types'
import { SiteHeader } from '@/components/site-header'
import { PageHeader } from '@/components/page-header'

/* ── Types ──────────────────────────────────────────────────────────────── */

interface AsmtMeta {
  id: string; name: string; course: string; type: string; state: string
  questions: number; points: number; owner: string; ownerName: string
  collaborators: string[]; due: string; security: string; graded: boolean
}

/* ── Mock data ──────────────────────────────────────────────────────────── */

const MOCK_ASSESSMENTS: AsmtMeta[] = [
  { id: 'a1', name: 'Cardiovascular Pharmacology — Midterm', course: 'MED-201', type: 'Exam', state: 'draft', questions: 24, points: 100, owner: 'SC', ownerName: 'Dr. Sarah Chen', collaborators: ['JO','PN','MW'], due: '10/24/2026 09:00 AM EST', security: 'Secure', graded: true },
  { id: 'a2', name: 'Antihypertensives — Weekly Quiz 4', course: 'MED-201', type: 'Quiz', state: 'ready', questions: 10, points: 20, owner: 'JO', ownerName: 'Dr. James Okafor', collaborators: [], due: '10/15/2026 11:59 PM EST', security: 'Unsecure', graded: false },
  { id: 'a3', name: 'Heart Failure Management — Remedial', course: 'MED-201', type: 'Quiz', state: 'planned', questions: 0, points: 0, owner: 'PN', ownerName: 'Dr. Priya Nair', collaborators: [], due: '11/02/2026 09:00 AM EST', security: 'Secure', graded: true },
  { id: 'a4', name: 'ECG Interpretation — Unit Exam', course: 'MED-201', type: 'Exam', state: 'review', questions: 30, points: 120, owner: 'JO', ownerName: 'Dr. James Okafor', collaborators: ['SC'], due: '10/28/2026 09:00 AM EST', security: 'Secure', graded: true },
  { id: 'a5', name: 'Anticoagulation Therapy — Final', course: 'MED-301', type: 'Exam', state: 'completed', questions: 40, points: 150, owner: 'SC', ownerName: 'Dr. Sarah Chen', collaborators: ['PN','JO'], due: '05/12/2026 09:00 AM EST', security: 'Secure', graded: true },
  { id: 'a6', name: 'Diuretics & Electrolytes — Midterm', course: 'MED-201', type: 'Exam', state: 'completed', questions: 28, points: 100, owner: 'SC', ownerName: 'Dr. Sarah Chen', collaborators: ['PN'], due: '03/03/2026 09:00 AM EST', security: 'Secure', graded: true },
  { id: 'a7', name: 'Lipid-Lowering Agents — Spring Final', course: 'MED-201', type: 'Exam', state: 'archived', questions: 35, points: 120, owner: 'JO', ownerName: 'Dr. James Okafor', collaborators: ['SC','PN'], due: '05/20/2025 09:00 AM EST', security: 'Secure', graded: true },
]

/* ── Lifecycle ──────────────────────────────────────────────────────────── */

const LIFECYCLE = ['planned', 'draft', 'review', 'ready', 'completed', 'archived'] as const
type LifecycleStage = typeof LIFECYCLE[number]

const LIFECYCLE_LABELS: Record<LifecycleStage, string> = {
  planned: 'Planned', draft: 'Draft', review: 'In Review',
  ready: 'Ready', completed: 'Completed', archived: 'Archived',
}

/* ── Item analysis mock data ────────────────────────────────────────────── */

const ITEM_ROWS = [
  { n: 3, stem: 'Thiazide diuretics act on the distal convoluted tubule...', topic: 'Diuretics', type: 'T/F', p: 0.83, disc: 0.18, pbi: -0.06, flagged: true },
  { n: 5, stem: 'Digoxin toxicity is most dangerously potentiated by...', topic: 'Heart Failure', type: 'MCQ', p: 0.92, disc: 0.09, pbi: 0.04, flagged: true },
  { n: 1, stem: 'A 58-year-old man with hypertension and diabetes...', topic: 'ACE Inhibitors', type: 'MCQ', p: 0.66, disc: 0.42, pbi: 0.39, flagged: false },
  { n: 2, stem: 'Select ALL beta-blockers that are cardioselective...', topic: 'Beta Blockers', type: 'MSQ', p: 0.54, disc: 0.46, pbi: 0.44, flagged: false },
  { n: 4, stem: 'Loop diuretics inhibit the ___ cotransporter...', topic: 'Diuretics', type: 'FITB', p: 0.61, disc: 0.36, pbi: 0.33, flagged: false },
]

/* ── Item analysis table — canonical DataTable ──────────────────────────── */

type ItemRow = typeof ITEM_ROWS[number] & Record<string, unknown>

function itemDiffColor(p: number): string {
  if (p > 0.85 || p < 0.2) return 'var(--chart-4)'
  return 'var(--foreground)'
}

const ITEM_COLUMNS: ColumnDef<ItemRow>[] = [
  {
    key: 'n',
    label: '#',
    width: 40,
    cell: (row) => <span className="text-muted-foreground">{row.n as number}</span>,
  },
  {
    key: 'stem',
    label: 'Question',
    cell: (row) => (
      <div>
        <div className="text-sm text-foreground truncate max-w-xs">{row.stem as string}</div>
        <div className="text-xs text-muted-foreground">{row.topic as string}</div>
      </div>
    ),
  },
  {
    key: 'type',
    label: 'Type',
    width: 64,
    cell: (row) => (
      <span className="inline-flex items-center rounded-md border border-border px-1.5 py-0.5 text-xs font-medium text-foreground">
        {row.type as string}
      </span>
    ),
  },
  {
    key: 'p',
    label: 'Difficulty (p)',
    width: 112,
    cell: (row) => (
      <span className="font-semibold" style={{ color: itemDiffColor(row.p as number) }}>
        {(row.p as number).toFixed(2)}
      </span>
    ),
  },
  {
    key: 'disc',
    label: 'Discrimination',
    width: 112,
    cell: (row) => (
      <span className="font-semibold" style={{ color: (row.disc as number) < 0.3 ? 'var(--chart-4)' : 'var(--chart-2)' }}>
        {(row.disc as number).toFixed(2)}
      </span>
    ),
  },
  {
    key: 'pbi',
    label: 'Point-biserial',
    width: 112,
    cell: (row) => (
      <span className="font-semibold" style={{ color: (row.pbi as number) < 0.1 ? 'var(--destructive)' : 'var(--chart-2)' }}>
        {(row.pbi as number).toFixed(2)}
      </span>
    ),
  },
  {
    key: 'flagged',
    label: 'Status',
    width: 96,
    cell: (row) => row.flagged ? (
      <span className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: 'oklch(from var(--destructive) l c h / 0.12)', color: 'var(--destructive)' }}>
        <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 11 }} />
        Outlier
      </span>
    ) : (
      <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
        style={{ background: 'oklch(from var(--chart-2) l c h / 0.15)', color: 'var(--chart-2)' }}>
        <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--chart-2)' }} />
        Healthy
      </span>
    ),
  },
]

/* ── Sub-components ─────────────────────────────────────────────────────── */

function LifecycleRail({ state }: { state: string }) {
  const cur = LIFECYCLE.indexOf(state as LifecycleStage)
  return (
    <Card>
      <CardContent className="pt-5 pb-4">
        <div className="flex items-center">
          {LIFECYCLE.map((st, i) => {
            const done = i < cur
            const active = i === cur
            return (
              <React.Fragment key={st}>
                <div className="flex flex-col items-center gap-2" style={{ minWidth: 0 }}>
                  <div
                    className="flex items-center justify-center rounded-full text-xs font-semibold"
                    style={{
                      width: 30, height: 30, flexShrink: 0,
                      background: done ? 'var(--chart-2)' : active ? 'var(--brand-color)' : 'var(--muted)',
                      color: done || active ? 'white' : 'var(--muted-foreground)',
                    }}
                  >
                    {done ? <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11 }} /> : i + 1}
                  </div>
                  <span
                    style={{
                      fontSize: 11, fontWeight: active ? 700 : 500,
                      color: active ? 'var(--foreground)' : 'var(--muted-foreground)',
                      whiteSpace: 'nowrap',
                    }}
                  >
                    {LIFECYCLE_LABELS[st]}
                  </span>
                </div>
                {i < LIFECYCLE.length - 1 && (
                  <div style={{ flex: 1, height: 2, marginBottom: 22, marginLeft: 8, marginRight: 8, background: i < cur ? 'var(--chart-2)' : 'var(--border)' }} />
                )}
              </React.Fragment>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}

function ConfigRow({ icon, label, value, last = false }: { icon: string; label: string; value: string; last?: boolean }) {
  return (
    <div className="flex items-center gap-3" style={{ padding: '9px 0', borderBottom: last ? 'none' : '1px solid var(--border)' }}>
      <i className={`fa-light fa-${icon} text-muted-foreground`} aria-hidden="true" style={{ fontSize: 14, width: 18 }} />
      <span className="text-xs text-muted-foreground flex-1">{label}</span>
      <span className="text-sm font-medium">{value}</span>
    </div>
  )
}

function ApprovalChip() {
  return (
    <span className="inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-xs font-medium"
      style={{ background: 'oklch(from var(--chart-2) l c h / 0.15)', color: 'var(--chart-2)' }}>
      <span className="w-1.5 h-1.5 rounded-full" style={{ background: 'var(--chart-2)' }} />
      Approved
    </span>
  )
}

function ApprovalEntry({ initials, level, note, when }: { initials: string; level: string; note: string; when: string }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-3">
        <Avatar className="h-9 w-9 shrink-0">
          <AvatarFallback className="text-xs font-bold" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {initials}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground">{level}</div>
          <div className="text-xs text-muted-foreground">{note}</div>
        </div>
        <div className="text-right shrink-0">
          <ApprovalChip />
          <div className="text-xs text-muted-foreground mt-1">{when}</div>
        </div>
      </CardContent>
    </Card>
  )
}

function SectionRow({ label, owner, questions, pts, locked = false }: { label: string; owner: string; questions: number; pts: number; locked?: boolean }) {
  return (
    <Card>
      <CardContent className="flex items-center gap-3 py-3 px-3">
        <Avatar className="h-7 w-7 shrink-0">
          <AvatarFallback className="text-[10px] font-bold" style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}>
            {owner}
          </AvatarFallback>
        </Avatar>
        <div className="flex-1 min-w-0">
          <div className="text-sm font-semibold text-foreground truncate">{label}</div>
          <div className="text-xs text-muted-foreground">{questions} questions · {pts} pts</div>
        </div>
        {locked && <i className="fa-light fa-lock text-muted-foreground" aria-hidden="true" style={{ fontSize: 13 }} />}
        <ApprovalChip />
      </CardContent>
    </Card>
  )
}

function InsightRow({ ok, text }: { ok: boolean; text: string }) {
  return (
    <div className="flex gap-3">
      <i
        className={`fa-light ${ok ? 'fa-circle-check' : 'fa-circle-exclamation'}`}
        aria-hidden="true"
        style={{ color: ok ? 'var(--chart-2)' : 'var(--chart-4)', fontSize: 16, marginTop: 1, flexShrink: 0 }}
      />
      <p className="text-sm text-foreground leading-relaxed">{text}</p>
    </div>
  )
}

function ScoreHistogram() {
  const bars = [1, 3, 7, 11, 16, 18, 14, 12, 10, 8]
  const max = Math.max(...bars)
  return (
    <div>
      <div className="flex items-end gap-1" style={{ height: 140 }}>
        {bars.map((h, i) => {
          const isPassing = i >= 6
          const isMean = i === 7
          return (
            <div key={i} className="flex flex-1 flex-col items-center justify-end gap-1" style={{ height: '100%' }}>
              <span style={{ fontSize: 9, fontWeight: 600, color: 'var(--muted-foreground)' }}>{h > 5 ? h : ''}</span>
              <div
                style={{
                  width: '100%',
                  height: `${(h / max) * 100}%`,
                  minHeight: h ? 3 : 0,
                  borderRadius: '4px 4px 0 0',
                  background: isPassing ? 'var(--chart-2)' : 'var(--chart-4)',
                  outline: isMean ? '2px solid var(--brand-color)' : 'none',
                  outlineOffset: 1,
                }}
              />
            </div>
          )
        })}
      </div>
      <div className="flex mt-1.5">
        {bars.map((_, i) => (
          <div key={i} className="flex-1 text-center" style={{ fontSize: 9, color: 'var(--muted-foreground)' }}>{i * 10}</div>
        ))}
      </div>
      <div className="flex items-center gap-4 mt-3 justify-center" style={{ fontSize: 11 }}>
        <span className="flex items-center gap-1.5">
          <span className="rounded-sm" style={{ width: 10, height: 10, background: 'var(--chart-4)' }} />
          <span style={{ color: 'var(--muted-foreground)' }}>Below pass (&lt;60%)</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-sm" style={{ width: 10, height: 10, background: 'var(--chart-2)' }} />
          <span style={{ color: 'var(--muted-foreground)' }}>Passing</span>
        </span>
        <span className="flex items-center gap-1.5">
          <span className="rounded-sm" style={{ width: 10, height: 10, outline: '2px solid var(--brand-color)', background: 'transparent' }} />
          <span style={{ color: 'var(--muted-foreground)' }}>Mean band</span>
        </span>
      </div>
    </div>
  )
}

function KpiTile({ label, value, sub, tone }: { label: string; value: string | number; sub: string; tone?: 'good' | 'warn' | 'neutral' }) {
  const color = tone === 'good' ? 'var(--chart-2)' : tone === 'warn' ? 'var(--chart-4)' : 'var(--foreground)'
  return (
    <div className="flex flex-col gap-1 px-5 py-4 border-r border-border last:border-r-0">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="text-2xl font-semibold tabular-nums leading-none" style={{ color }}>{value}</span>
      <span className="text-xs text-muted-foreground">{sub}</span>
    </div>
  )
}

/* ── Views ──────────────────────────────────────────────────────────────── */

function ReadyView({ asmt, router }: { asmt: AsmtMeta; router: ReturnType<typeof useRouter> }) {
  const daysUntil = () => {
    const d = new Date(asmt.due)
    if (isNaN(d.getTime())) return null
    return Math.round((d.getTime() - Date.now()) / 86400000)
  }
  const days = daysUntil()
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
      {/* Left column */}
      <div className="flex flex-col gap-5">
        {/* Approved & sealed banner */}
        <Card style={{ background: 'oklch(from var(--chart-2) l c h / 0.06)', borderColor: 'oklch(from var(--chart-2) l c h / 0.3)' }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 46, height: 46, background: 'var(--card)', color: 'var(--chart-2)' }}>
                <i className="fa-light fa-lock" aria-hidden="true" style={{ fontSize: 20 }} />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-foreground">Approved &amp; sealed</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  Both review levels passed. The exam is locked — no edits without unpublishing — and opens to students automatically at the scheduled time.
                </p>
              </div>
              {days !== null && days >= 0 && (
                <div className="text-center shrink-0">
                  <div className="text-2xl font-bold leading-none" style={{ color: 'var(--chart-2)' }}>{days}</div>
                  <div className="text-xs text-muted-foreground">day{days !== 1 ? 's' : ''} to open</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Approval record */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Approval record</CardTitle>
            <CardDescription className="text-xs">The two-level sign-off that cleared this exam for delivery.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <ApprovalEntry initials={asmt.owner} level="Level 1 — Owner" note="Verified every section against the blueprint" when="10/12/2026 09:40 AM EST" />
            <ApprovalEntry initials="ER" level="Level 2 — Chairperson · Dr. Elena Reyes" note="Independent validation for high-stakes delivery" when="10/12/2026 02:18 PM EST" />
            <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12, marginTop: 4 }}>
              <Button variant="ghost" size="sm" className="gap-1.5">
                <i className="fa-light fa-clock-rotate-left" aria-hidden="true" />
                Open the full review timeline
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Sections */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sections</CardTitle>
            <CardDescription className="text-xs">Locked at publish. Open the builder to view (read-only) — editing requires unpublishing.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <SectionRow label="Section A — Antihypertensives" owner={asmt.owner} questions={asmt.questions} pts={asmt.points} locked />
          </CardContent>
        </Card>
      </div>

      {/* Right column — sticky */}
      <div className="flex flex-col gap-5" style={{ position: 'sticky', top: 76 }}>
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Schedule &amp; delivery</CardTitle></CardHeader>
          <CardContent>
            <ConfigRow icon="calendar" label="Opens" value={asmt.due} />
            <ConfigRow icon="hourglass-half" label="Window" value="120 min · single attempt" />
            <ConfigRow icon="shield-halved" label="Security" value={`${asmt.security} · lockdown browser`} />
            <ConfigRow icon="shuffle" label="Delivery" value="Questions & options randomized" />
            <ConfigRow icon="eye-slash" label="Results" value="Released after grading window" last />
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Manage</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button variant="outline" className="w-full justify-start gap-1.5">
              <i className="fa-light fa-lock-open" aria-hidden="true" />
              Unpublish to edit
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-1.5">
              <i className="fa-light fa-calendar" aria-hidden="true" />
              Reschedule
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

function CompletedView({ asmt }: { asmt: AsmtMeta }) {
  function diffColor(p: number) {
    if (p > 0.8) return 'var(--chart-4)'
    if (p < 0.4) return 'var(--destructive)'
    return 'var(--chart-2)'
  }
  return (
    <div className="flex flex-col gap-5">
      {/* KPI strip */}
      <Card>
        <CardContent className="p-0">
          <div className="grid grid-cols-5 divide-x divide-border">
            <KpiTile label="Students" value={86} sub="92% completed" />
            <KpiTile label="Mean score" value="71%" sub="median 68%" tone="good" />
            <KpiTile label="Pass rate" value="78%" sub="≥ 60% threshold" tone="good" />
            <KpiTile label="Std deviation" value="±13" sub="spread of scores" />
            <KpiTile label="Flagged items" value={2} sub="psychometric outliers" tone="warn" />
          </div>
        </CardContent>
      </Card>

      {/* Histogram + cohort insight */}
      <div className="grid gap-5" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Score distribution</CardTitle>
            <CardDescription className="text-xs">How the cohort of 86 students scored, in 10-point bands.</CardDescription>
          </CardHeader>
          <CardContent><ScoreHistogram /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Cohort insight</CardTitle></CardHeader>
          <CardContent>
            <div className="flex flex-col gap-4">
              <InsightRow ok text="Mean of 71% sits in the healthy 55–80% target band." />
              <InsightRow ok text="78% passed — in line with cohort expectations." />
              <InsightRow ok={false} text="2 items flagged as outliers — exclude or revise before reuse." />
            </div>
            <div style={{ borderTop: '1px solid var(--border)', marginTop: 16, paddingTop: 12 }}>
              <Button variant="ghost" size="sm" className="gap-1.5 w-full justify-start">
                <i className="fa-duotone fa-star-christmas" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                Ask Leo to interpret these results
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item analysis table */}
      <Card>
        <CardHeader>
          <div className="flex items-baseline justify-between">
            <div>
              <CardTitle className="text-base font-semibold">Item analysis</CardTitle>
              <CardDescription className="text-xs">Per-question psychometrics. Outliers float to the top.</CardDescription>
            </div>
            <Button variant="ghost" size="sm" className="gap-1.5 shrink-0">
              <i className="fa-light fa-file-export" aria-hidden="true" />
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <DataTable<ItemRow>
            data={ITEM_ROWS as ItemRow[]}
            columns={ITEM_COLUMNS}
            getRowId={(row) => String(row.n)}
            emptyState={<div className="py-10 text-center text-sm text-muted-foreground">No item data available.</div>}
          />
        </CardContent>
      </Card>
    </div>
  )
}

function ArchivedView({ asmt }: { asmt: AsmtMeta }) {
  return (
    <div className="grid gap-5" style={{ gridTemplateColumns: '1.5fr 1fr', alignItems: 'start' }}>
      {/* Left column */}
      <div className="flex flex-col gap-5">
        {/* Archived banner */}
        <Card style={{ background: 'var(--muted)', borderStyle: 'dashed' }}>
          <CardContent className="pt-5">
            <div className="flex items-center gap-4">
              <div className="flex items-center justify-center rounded-xl shrink-0"
                style={{ width: 44, height: 44, background: 'var(--card)', color: 'var(--muted-foreground)' }}>
                <i className="fa-light fa-box-archive" aria-hidden="true" style={{ fontSize: 19 }} />
              </div>
              <div className="flex-1">
                <div className="text-base font-bold text-foreground">Archived record</div>
                <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
                  A frozen, read-only snapshot kept for audit and reuse. Administered {asmt.due}. Restore it to a working copy, or recycle its blueprint into a new exam.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Final summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Final summary</CardTitle>
            <CardDescription className="text-xs">Captured at archival — the historical performance of this exam.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="grid grid-cols-4 divide-x divide-border border-t border-border">
              <KpiTile label="Cohort" value={94} sub="students sat" />
              <KpiTile label="Mean score" value="68%" sub="median 65%" />
              <KpiTile label="Pass rate" value="74%" sub="≥ 60%" tone="good" />
              <KpiTile label="Avg. difficulty" value="0.61" sub="proportion correct" />
            </div>
          </CardContent>
        </Card>

        {/* Sections frozen */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base font-semibold">Sections (frozen)</CardTitle>
            <CardDescription className="text-xs">The exact structure as delivered. Read-only.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-2">
            <SectionRow label="Section A — Antihypertensives & Diuretics" owner={asmt.owner} questions={12} pts={48} locked />
            <SectionRow label="Section B — Antiarrhythmics & Heart Failure" owner="JO" questions={14} pts={54} locked />
            <SectionRow label="Section C — Anticoagulation & Lipids" owner="PN" questions={9} pts={18} locked />
          </CardContent>
        </Card>
      </div>

      {/* Right column */}
      <div className="flex flex-col gap-5" style={{ position: 'sticky', top: 76 }}>
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Reuse</CardTitle></CardHeader>
          <CardContent className="flex flex-col gap-2">
            <Button className="w-full justify-start gap-1.5">
              <i className="fa-light fa-recycle" aria-hidden="true" />
              Recycle as blueprint
            </Button>
            <Button variant="outline" className="w-full justify-start gap-1.5">
              <i className="fa-light fa-rotate-left" aria-hidden="true" />
              Restore to draft copy
            </Button>
            <Button variant="ghost" className="w-full justify-start gap-1.5">
              <i className="fa-light fa-file-export" aria-hidden="true" />
              Export
            </Button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle className="text-sm font-semibold">Provenance</CardTitle></CardHeader>
          <CardContent>
            <ConfigRow icon="user" label="Owner" value={asmt.ownerName} />
            <ConfigRow icon="calendar" label="Delivered" value={asmt.due} />
            <ConfigRow icon="box-archive" label="Archived" value="06/01/2025 09:00 AM EST" last />
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

/* ── Main export ────────────────────────────────────────────────────────── */

export default function AssessmentStatusClient({ assessmentId }: { assessmentId: string }) {
  const router = useRouter()
  const asmt = MOCK_ASSESSMENTS.find(a => a.id === assessmentId)

  if (!asmt) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <p className="font-semibold text-foreground">Assessment not found</p>
        <Button variant="outline" size="sm" className="mt-3 gap-2" onClick={() => router.push('/assessments')}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          Back to assessments
        </Button>
      </div>
    )
  }

  // Non-status states route to the builder — redirect gracefully
  if (asmt.state === 'draft' || asmt.state === 'planned' || asmt.state === 'review') {
    router.push('/assessment-builder')
    return null
  }

  const headerActions = (
    <div className="flex items-center gap-2">
      {asmt.state === 'ready' && (
        <>
          <Button variant="outline" size="sm" className="gap-1.5" onClick={() => router.push('/assessment-builder')}>
            <i className="fa-light fa-eye" aria-hidden="true" />
            View in builder
          </Button>
          <Button size="sm" className="gap-1.5">
            <i className="fa-light fa-play" aria-hidden="true" />
            Preview as student
          </Button>
        </>
      )}
      {asmt.state === 'completed' && (
        <Button size="sm" className="gap-1.5">
          <i className="fa-light fa-file-export" aria-hidden="true" />
          Export results
        </Button>
      )}
      {asmt.state === 'archived' && (
        <>
          <Button variant="outline" size="sm" className="gap-1.5">
            <i className="fa-light fa-rotate-left" aria-hidden="true" />
            Restore to draft
          </Button>
          <Button size="sm" className="gap-1.5">
            <i className="fa-light fa-recycle" aria-hidden="true" />
            Recycle as blueprint
          </Button>
        </>
      )}
    </div>
  )

  const breadcrumbs = [
    { label: 'Assessments', href: '/assessments' },
    { label: asmt.name },
  ]

  return (
    <>
      <SiteHeader title={asmt.name} breadcrumbs={breadcrumbs} />
      <div id="main-content" tabIndex={-1} className="flex flex-1 flex-col outline-none overflow-auto">
        <PageHeader
          title={asmt.name}
          subtitle={`${asmt.course} · ${asmt.questions} questions · ${asmt.points} pts · ${asmt.security}`}
          actions={headerActions}
        />
        <div className="p-6 flex flex-col gap-5">
          <LifecycleRail state={asmt.state} />
          {asmt.state === 'ready' && <ReadyView asmt={asmt} router={router} />}
          {asmt.state === 'completed' && <CompletedView asmt={asmt} />}
          {asmt.state === 'archived' && <ArchivedView asmt={asmt} />}
        </div>
      </div>
    </>
  )
}
