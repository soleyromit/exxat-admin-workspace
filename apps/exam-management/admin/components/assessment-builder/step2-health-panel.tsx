'use client'

import type { AssessmentDraft } from '@/lib/qb-types'
import type { CourseObjective } from '@/lib/faculty-mock-data'
import { MOCK_MISSING_RATIONALE_QUESTION_IDS, MOCK_POOR_PBIS_QUESTION_IDS } from '@/lib/qb-mock-data'

interface Props {
  activeAsmt: AssessmentDraft
  objectives: CourseObjective[]
  timeMetrics: { totalMin: number; avgMin: number }
  distribution: { Easy: number; Medium: number; Hard: number }
  bloomsMetrics: { level: string; count: number; pct: number }[]
  targetQuestions?: number
}

export function HealthPanel({ activeAsmt, objectives, timeMetrics, distribution, bloomsMetrics, targetQuestions = 50 }: Props) {
  const selectedIds = activeAsmt.questions.map(q => q.questionId)
  const totalQ = selectedIds.length
  const missingRationaleCount = selectedIds.filter(id => MOCK_MISSING_RATIONALE_QUESTION_IDS.has(id)).length
  const poorPbisCount = selectedIds.filter(id => MOCK_POOR_PBIS_QUESTION_IDS.has(id)).length
  const flagCount = missingRationaleCount + poorPbisCount

  const configured = activeAsmt.durationMinutes
  const pctTime = configured > 0 ? Math.round((timeMetrics.totalMin / configured) * 100) : 0

  // Topic coverage: which objectives have ≥1 question tagged to them
  const coveredObjectiveIds = new Set<string>()
  // (In real app, questions would have objectiveId. For mock, randomly assign coverage.)
  objectives.slice(0, Math.ceil(objectives.length * 0.67)).forEach(o => coveredObjectiveIds.add(o.id))
  const coveredCount = coveredObjectiveIds.size
  const totalObjectives = objectives.length

  const health: 'good' | 'warn' | 'poor' =
    flagCount === 0 && totalQ >= targetQuestions * 0.8 ? 'good'
    : flagCount <= 2 ? 'warn'
    : 'poor'

  const healthColor = health === 'good'
    ? 'color-mix(in oklch, var(--brand-color) 70%, transparent)'
    : health === 'warn'
    ? 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))'
    : 'var(--muted-foreground)'

  const healthLabel = health === 'good' ? 'Good' : health === 'warn' ? 'Needs attention' : 'Review required'

  const diffTotal = distribution.Easy + distribution.Medium + distribution.Hard

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <div style={{ padding: '10px 16px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <div className="flex items-center gap-2">
          <i
            className={`fa-solid ${health === 'good' ? 'fa-circle-check' : 'fa-circle-exclamation'}`}
            aria-hidden="true"
            style={{ color: healthColor, fontSize: 14 }}
          />
          <span className="text-sm font-semibold text-foreground">{healthLabel}</span>
        </div>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Question count */}
        <MetricRow label="Questions" value={`${totalQ} of ${targetQuestions}`}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--muted)', overflow: 'hidden' }}>
            <div style={{ height: '100%', width: `${Math.min(100, (totalQ / targetQuestions) * 100)}%`, background: 'var(--brand-color)', borderRadius: 2 }} />
          </div>
        </MetricRow>

        {/* Duration */}
        <MetricRow label="Est. duration" value={`${Math.round(timeMetrics.totalMin)} min vs ${configured} min`}>
          <div style={{ height: 4, borderRadius: 2, background: 'var(--muted)', overflow: 'hidden' }}>
            <div style={{
              height: '100%',
              width: `${Math.min(110, pctTime)}%`,
              background: pctTime > 105 ? 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))' : 'var(--brand-color)',
              borderRadius: 2,
            }} />
          </div>
        </MetricRow>

        {/* Difficulty */}
        {diffTotal > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Difficulty</p>
            {(['Easy', 'Medium', 'Hard'] as const).map(d => (
              <DiffRow key={d} label={d} count={distribution[d]} total={diffTotal} />
            ))}
          </div>
        )}

        {/* Bloom's */}
        {bloomsMetrics.filter(b => b.count > 0).length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Bloom&apos;s</p>
            {bloomsMetrics.filter(b => b.count > 0).map(b => (
              <div key={b.level} className="flex items-center gap-2 mb-1">
                <span className="text-[10px] text-muted-foreground" style={{ width: 70 }}>{b.level}</span>
                <div style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--muted)', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: `${b.pct}%`, background: 'color-mix(in oklch, var(--brand-color) 60%, var(--muted-foreground))', borderRadius: 2 }} />
                </div>
                <span className="text-[10px] font-semibold text-foreground tabular-nums" style={{ width: 16 }}>{b.count}</span>
              </div>
            ))}
          </div>
        )}

        {/* Topic coverage */}
        {objectives.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">
              Topic coverage ({coveredCount}/{totalObjectives})
            </p>
            {objectives.map(o => (
              <div key={o.id} className="flex items-center gap-2 mb-1">
                <i
                  className={`fa-light ${coveredObjectiveIds.has(o.id) ? 'fa-circle-check' : 'fa-circle-xmark'}`}
                  aria-hidden="true"
                  style={{ fontSize: 10, color: coveredObjectiveIds.has(o.id) ? 'var(--brand-color)' : 'var(--muted-foreground)', width: 12 }}
                />
                <span className="text-[10px] text-muted-foreground truncate">{o.title.slice(0, 45)}</span>
              </div>
            ))}
          </div>
        )}

        {/* Flags */}
        {flagCount > 0 && (
          <div style={{ borderTop: '1px solid var(--border)', paddingTop: 12 }}>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Flags</p>
            {missingRationaleCount > 0 && (
              <p className="text-[11px] text-muted-foreground mb-1">
                <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ color: 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))' }} />
                {' '}{missingRationaleCount} missing rationale
              </p>
            )}
            {poorPbisCount > 0 && (
              <p className="text-[11px] text-muted-foreground">
                <i className="fa-light fa-chart-line-down" aria-hidden="true" style={{ color: 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))' }} />
                {' '}{poorPbisCount} low point-biserial
              </p>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

function MetricRow({ label, value, children }: { label: string; value: string; children?: React.ReactNode }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
        <p className="text-[11px] font-semibold text-foreground">{value}</p>
      </div>
      {children}
    </div>
  )
}

function DiffRow({ label, count, total }: { label: string; count: number; total: number }) {
  const colors = { Easy: 'var(--qb-diff-bar-easy)', Medium: 'var(--qb-diff-bar-medium)', Hard: 'var(--qb-diff-bar-hard)' }
  return (
    <div className="flex items-center gap-2 mb-1.5">
      <span className="text-[10px] text-muted-foreground" style={{ width: 44 }}>{label}</span>
      <div style={{ flex: 1, height: 5, borderRadius: 3, background: 'var(--muted)', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: total > 0 ? `${(count / total) * 100}%` : '0%', background: colors[label as keyof typeof colors], borderRadius: 3 }} />
      </div>
      <span className="text-[10px] font-semibold text-foreground tabular-nums" style={{ width: 16 }}>{count}</span>
    </div>
  )
}
