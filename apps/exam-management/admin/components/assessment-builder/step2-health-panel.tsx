'use client'

import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
import type { CourseObjective } from '@/lib/faculty-mock-data'
import { facultyListRows } from '@/lib/faculty-mock-data'
import { MOCK_QB_QUESTIONS, MOCK_MISSING_RATIONALE_QUESTION_IDS } from '@/lib/qb-mock-data'

interface Props {
  activeAsmt: AssessmentDraft
  objectives: CourseObjective[]
  timeMetrics: { totalMin: number; avgMin: number }
  distribution: { Easy: number; Medium: number; Hard: number }
  bloomsMetrics: { level: string; count: number; pct: number }[]
  targetQuestions?: number
}

// Bloom's levels in cognitive order — used for consistent color mapping
const BLOOMS_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create']
const BLOOMS_COLORS = [
  'var(--chart-1)', 'var(--chart-2)', 'var(--chart-3)',
  'var(--chart-4)', 'var(--chart-5)', 'var(--brand-color)',
]

export function HealthPanel({
  activeAsmt, objectives, timeMetrics, distribution, bloomsMetrics, targetQuestions = 50,
}: Props) {
  const selectedIds = activeAsmt.questions.map(q => q.questionId)
  const totalQ = selectedIds.length

  // PBI distribution from real question data
  const pbiValues = selectedIds
    .map(id => MOCK_QB_QUESTIONS.find(q => q.id === id)?.pbis)
    .filter((v): v is number => typeof v === 'number')
  const lowPbisCount = pbiValues.filter(v => v < 0.2).length
  const missingRationaleCount = selectedIds.filter(id => MOCK_MISSING_RATIONALE_QUESTION_IDS.has(id)).length
  const flagCount = lowPbisCount + missingRationaleCount

  // Version distribution
  const versionCounts = selectedIds.reduce<Record<number, number>>((acc, id) => {
    const v = MOCK_QB_QUESTIONS.find(q => q.id === id)?.version ?? 1
    acc[v] = (acc[v] ?? 0) + 1
    return acc
  }, {})
  const multiVersionCount = Object.entries(versionCounts)
    .filter(([v]) => Number(v) > 1)
    .reduce((s, [, c]) => s + c, 0)

  // Collaborators by section
  const collaboratorSections: { faculty: { id: string; fullName: string; adminPosition: string }; sections: AssessmentSection[] }[] = []
  const seen = new Set<string>()
  activeAsmt.sections.forEach(sec => {
    const ids = sec.facultyIds?.length ? sec.facultyIds : sec.facultyId ? [sec.facultyId] : []
    ids.forEach(fId => {
      const f = facultyListRows.find(r => r.id === fId)
      if (!f) return
      const existing = collaboratorSections.find(c => c.faculty.id === fId)
      if (existing) { existing.sections.push(sec) }
      else { collaboratorSections.push({ faculty: f, sections: [sec] }) }
      seen.add(fId)
    })
  })
  // Assessment-level collaborators not already in a section
  const asmtCollabs = (activeAsmt.collaboratorIds ?? [])
    .filter(id => !seen.has(id))
    .map(id => facultyListRows.find(r => r.id === id))
    .filter(Boolean) as typeof facultyListRows

  const diffTotal = distribution.Easy + distribution.Medium + distribution.Hard
  const overTime = timeMetrics.totalMin > activeAsmt.durationMinutes * 1.05

  const health: 'good' | 'warn' | 'poor' =
    flagCount === 0 && totalQ >= targetQuestions * 0.8 ? 'good'
    : flagCount <= 2 ? 'warn'
    : 'poor'

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-foreground">Assessment health</span>
          <span style={{
            fontSize: 11, fontWeight: 600, padding: '1px 6px', borderRadius: 4,
            background: health === 'good' ? 'var(--chart-2)' : health === 'warn' ? 'var(--chart-4)' : 'var(--muted)',
            color: health === 'good' || health === 'warn' ? '#fff' : 'var(--muted-foreground)',
          }}>
            {health === 'good' ? 'Ready' : health === 'warn' ? 'Needs attention' : 'Review'}
          </span>
        </div>
        <p className="text-xs text-muted-foreground mt-0.5">
          {totalQ} Q · {Math.round(timeMetrics.totalMin)} min est.{flagCount > 0 ? ` · ${flagCount} flag${flagCount !== 1 ? 's' : ''}` : ''}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 18 }}>

        {/* ── Questions bullet ── */}
        <Section label="Questions">
          <BulletBar value={totalQ} target={targetQuestions} color="var(--brand-color)" />
          <div className="flex justify-between mt-1">
            <span className="text-[11px] text-muted-foreground">{totalQ} added</span>
            <span className="text-[11px] text-muted-foreground">{targetQuestions} target</span>
          </div>
        </Section>

        {/* ── Difficulty stacked bar ── */}
        {diffTotal > 0 && (
          <Section label="Difficulty">
            <StackedBar segments={[
              { label: 'Easy',   count: distribution.Easy,   color: 'var(--chart-2)' },
              { label: 'Medium', count: distribution.Medium, color: 'var(--chart-3)' },
              { label: 'Hard',   count: distribution.Hard,   color: 'var(--chart-4)' },
            ]} total={diffTotal} />
            <Legend segments={[
              { label: 'Easy',   count: distribution.Easy,   color: 'var(--chart-2)' },
              { label: 'Med',    count: distribution.Medium, color: 'var(--chart-3)' },
              { label: 'Hard',   count: distribution.Hard,   color: 'var(--chart-4)' },
            ]} />
          </Section>
        )}

        {/* ── Bloom's stacked bar ── */}
        {bloomsMetrics.some(b => b.count > 0) && (
          <Section label="Bloom's taxonomy">
            <StackedBar segments={BLOOMS_ORDER.map((level, i) => {
              const b = bloomsMetrics.find(x => x.level === level)
              return { label: level, count: b?.count ?? 0, color: BLOOMS_COLORS[i] }
            }).filter(s => s.count > 0)} total={totalQ} />
            <div className="flex flex-wrap gap-x-3 gap-y-0.5 mt-1.5">
              {BLOOMS_ORDER.map((level, i) => {
                const b = bloomsMetrics.find(x => x.level === level)
                if (!b || b.count === 0) return null
                return (
                  <span key={level} className="text-[10px] text-muted-foreground flex items-center gap-1">
                    <span style={{ width: 6, height: 6, borderRadius: 1, background: BLOOMS_COLORS[i], display: 'inline-block', flexShrink: 0 }} />
                    {level.slice(0, 3)} {b.count}
                  </span>
                )
              })}
            </div>
          </Section>
        )}

        {/* ── Duration bullet ── */}
        <Section label="Estimated time">
          <BulletBar
            value={timeMetrics.totalMin}
            target={activeAsmt.durationMinutes}
            color={overTime ? 'var(--chart-4)' : 'var(--chart-2)'}
            overflowColor="var(--chart-4)"
          />
          <div className="flex justify-between mt-1">
            <span className="text-[11px]" style={{ color: overTime ? 'var(--chart-4)' : 'var(--muted-foreground)' }}>
              {Math.round(timeMetrics.totalMin)} min est.
            </span>
            <span className="text-[11px] text-muted-foreground">{activeAsmt.durationMinutes} min alloc.</span>
          </div>
        </Section>

        {/* ── PBI strip plot ── */}
        {pbiValues.length > 0 && (
          <Section label={`Point-biserial  ·  ${pbiValues.length} with data`}>
            <PbiStrip values={pbiValues} threshold={0.2} />
            <div className="flex justify-between mt-1">
              <span className="text-[11px] text-muted-foreground">0</span>
              <span className="text-[11px] text-muted-foreground" style={{ color: lowPbisCount > 0 ? 'var(--chart-4)' : 'var(--muted-foreground)' }}>
                {lowPbisCount > 0 ? `${lowPbisCount} below threshold` : 'All above 0.2'}
              </span>
              <span className="text-[11px] text-muted-foreground">1.0</span>
            </div>
          </Section>
        )}

        {/* ── Version distribution ── */}
        {totalQ > 0 && (
          <Section label="Question versions">
            <div className="flex items-center gap-3">
              {Object.entries(versionCounts)
                .sort(([a], [b]) => Number(a) - Number(b))
                .map(([v, count]) => (
                  <div key={v} className="flex items-center gap-1.5">
                    <span style={{
                      fontSize: 10, fontWeight: 700, padding: '1px 5px', borderRadius: 3,
                      background: Number(v) === 1 ? 'var(--muted)' : 'var(--brand-tint)',
                      color: Number(v) === 1 ? 'var(--muted-foreground)' : 'var(--brand-color)',
                      border: `1px solid ${Number(v) === 1 ? 'var(--border)' : 'var(--brand-color)'}`,
                    }}>v{v}</span>
                    <span className="text-[11px] text-muted-foreground">{count}</span>
                  </div>
                ))}
              {multiVersionCount > 0 && (
                <span className="text-[11px] text-muted-foreground ml-auto">
                  {multiVersionCount} updated since first use
                </span>
              )}
            </div>
          </Section>
        )}

        {/* ── Topic coverage ── */}
        {objectives.length > 0 && (
          <Section label={`Topic coverage`}>
            <TopicGrid objectives={objectives} coveredCount={Math.ceil(objectives.length * 0.67)} />
          </Section>
        )}

        {/* ── Collaborators ── */}
        {(collaboratorSections.length > 0 || asmtCollabs.length > 0) && (
          <Section label="Collaborators">
            <div className="flex flex-col gap-2">
              {collaboratorSections.map(({ faculty, sections }) => (
                <div key={faculty.id} className="flex items-start gap-2">
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'var(--muted-foreground)',
                  }}>
                    {faculty.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{faculty.fullName}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {sections.length === 1 ? sections[0].title : `${sections.length} sections`}
                    </p>
                  </div>
                </div>
              ))}
              {asmtCollabs.map(f => (
                <div key={f.id} className="flex items-start gap-2">
                  <div style={{
                    width: 22, height: 22, borderRadius: '50%', flexShrink: 0,
                    background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 9, fontWeight: 700, color: 'var(--muted-foreground)',
                  }}>
                    {f.fullName.split(' ').map(n => n[0]).join('').slice(0, 2)}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium text-foreground truncate">{f.fullName}</p>
                    <p className="text-[11px] text-muted-foreground">Assessment reviewer</p>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        )}

        {/* ── Flags ── */}
        {flagCount > 0 && (
          <Section label="Flags">
            {missingRationaleCount > 0 && (
              <FlagRow icon="fa-file-lines" label={`${missingRationaleCount} missing rationale`} />
            )}
            {lowPbisCount > 0 && (
              <FlagRow icon="fa-chart-line-down" label={`${lowPbisCount} low point-biserial (< 0.2)`} />
            )}
          </Section>
        )}

      </div>
    </div>
  )
}

// ── Sub-components ────────────────────────────────────────────────────────────

function Section({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <p className="text-[10px] font-semibold uppercase tracking-[0.06em] text-muted-foreground mb-2">{label}</p>
      {children}
    </div>
  )
}

function BulletBar({
  value, target, color, overflowColor,
}: { value: number; target: number; color: string; overflowColor?: string }) {
  const pct = target > 0 ? Math.min(120, (value / target) * 100) : 0
  const isOver = value > target
  return (
    <div style={{ position: 'relative', height: 10, background: 'var(--muted)', borderRadius: 3, overflow: 'visible' }}>
      {/* Fill */}
      <div style={{
        position: 'absolute', left: 0, top: 0, bottom: 0,
        width: `${Math.min(100, pct)}%`,
        background: isOver && overflowColor ? overflowColor : color,
        borderRadius: 3,
      }} />
      {/* Target marker */}
      <div style={{
        position: 'absolute', top: -2, bottom: -2, right: 0,
        width: 2, background: 'var(--foreground)', borderRadius: 1,
      }} />
    </div>
  )
}

function StackedBar({ segments, total }: {
  segments: { label: string; count: number; color: string }[]
  total: number
}) {
  return (
    <div style={{ display: 'flex', height: 10, borderRadius: 3, overflow: 'hidden', gap: 1 }}>
      {segments.map(s => (
        <div
          key={s.label}
          title={`${s.label}: ${s.count}`}
          style={{
            flex: total > 0 ? s.count / total : 0,
            background: s.color,
            minWidth: s.count > 0 ? 2 : 0,
          }}
        />
      ))}
    </div>
  )
}

function Legend({ segments }: { segments: { label: string; count: number; color: string }[] }) {
  return (
    <div className="flex gap-3 mt-1.5">
      {segments.filter(s => s.count > 0).map(s => (
        <span key={s.label} className="text-[10px] text-muted-foreground flex items-center gap-1">
          <span style={{ width: 6, height: 6, borderRadius: 1, background: s.color, display: 'inline-block', flexShrink: 0 }} />
          {s.label} {s.count}
        </span>
      ))}
    </div>
  )
}

function PbiStrip({ values, threshold }: { values: number[]; threshold: number }) {
  const W = 220
  return (
    <div style={{ position: 'relative', height: 24 }}>
      {/* Track */}
      <div style={{
        position: 'absolute', left: 0, right: 0, top: 11, height: 2,
        background: 'var(--muted)', borderRadius: 1,
      }} />
      {/* Threshold line */}
      <div style={{
        position: 'absolute', top: 6, bottom: 6,
        left: `${threshold * 100}%`,
        width: 1.5, background: 'var(--chart-4)', borderRadius: 1,
      }} />
      {/* Dots */}
      {values.map((v, i) => (
        <div
          key={i}
          title={`PBI: ${v.toFixed(2)}`}
          style={{
            position: 'absolute', top: '50%', transform: 'translate(-50%, -50%)',
            left: `${Math.min(99, v * 100)}%`,
            width: 7, height: 7, borderRadius: '50%',
            background: v < threshold ? 'var(--chart-4)' : 'var(--brand-color)',
            opacity: 0.8,
          }}
        />
      ))}
    </div>
  )
}

function TopicGrid({ objectives, coveredCount }: { objectives: CourseObjective[]; coveredCount: number }) {
  return (
    <div>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 3, marginBottom: 6 }}>
        {objectives.map((o, i) => (
          <div
            key={o.id}
            title={o.title}
            style={{
              width: 10, height: 10, borderRadius: 2,
              background: i < coveredCount ? 'var(--brand-color)' : 'var(--muted)',
              opacity: i < coveredCount ? 0.85 : 0.4,
            }}
          />
        ))}
      </div>
      <p className="text-[11px] text-muted-foreground">{coveredCount} of {objectives.length} objectives covered</p>
    </div>
  )
}

function FlagRow({ icon, label }: { icon: string; label: string }) {
  return (
    <div className="flex items-center gap-2 mb-1">
      <i className={`fa-light ${icon} text-[11px]`} aria-hidden="true" style={{ color: 'var(--chart-4)', width: 12 }} />
      <span className="text-[11px] text-muted-foreground">{label}</span>
    </div>
  )
}
