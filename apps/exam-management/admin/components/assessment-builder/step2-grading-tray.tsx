'use client'

import { useState } from 'react'
import { Button, Checkbox } from '@exxat/ds/packages/ui/src'
import type { AssessmentDraft, AssessmentQuestion, AssessmentSection } from '@/lib/qb-types'
import type { Question } from '@/lib/qb-types'
import { MOCK_QB_QUESTIONS } from '@/lib/qb-mock-data'
import {
  computeTotalAssigned,
  computeBonusTotal,
  computeUnassignedPts,
  computeSectionSubtotals,
  computeNegativeDeduction,
} from '@/lib/assessment-grading'

interface GradingTrayProps {
  activeAsmt: AssessmentDraft
  onUpdatePoints: (questionId: string, points: number) => void
  onUpdateBonus: (questionId: string, bonus: boolean) => void
  onDistributeEvenly: () => void
  onBulkSetPoints: (questionIds: string[], points: number) => void
}

type DisplayRow =
  | { kind: 'section'; id: string; title: string; subtotal: number; isOver: boolean }
  | { kind: 'question'; aq: AssessmentQuestion; meta: Question | undefined; order: number }

export function GradingTray({
  activeAsmt,
  onUpdatePoints,
  onUpdateBonus,
  onDistributeEvenly,
  onBulkSetPoints,
}: GradingTrayProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set())
  const [bulkPts, setBulkPts] = useState('1')

  const { settings, questions, sections } = activeAsmt
  const totalAssigned = computeTotalAssigned(questions)
  const bonusTotal    = computeBonusTotal(questions)
  const unassigned    = computeUnassignedPts(settings.totalMarks, questions)
  const subtotals     = computeSectionSubtotals(sections, questions)

  const nonBonusCount = questions.filter(q => !q.bonus).length
  function fairShare(section: AssessmentSection): number {
    const sectionNonBonus = section.questionIds.filter(id => {
      const q = questions.find(q => q.questionId === id)
      return q && !q.bonus
    }).length
    return nonBonusCount > 0
      ? Math.round((sectionNonBonus / nonBonusCount) * settings.totalMarks)
      : 0
  }

  const rows: DisplayRow[] = []
  const assignedToSection = new Set(sections.flatMap(s => s.questionIds))
  let globalOrder = 0

  for (const section of sections) {
    const sub = subtotals.get(section.id) ?? 0
    rows.push({
      kind: 'section', id: section.id, title: section.title,
      subtotal: sub, isOver: sub > fairShare(section) && fairShare(section) > 0,
    })
    for (const qId of section.questionIds) {
      const aq = questions.find(q => q.questionId === qId)
      if (!aq) continue
      globalOrder++
      rows.push({ kind: 'question', aq, meta: MOCK_QB_QUESTIONS.find(m => m.id === qId), order: globalOrder })
    }
  }

  const unassignedQs = questions.filter(q => !assignedToSection.has(q.questionId))
  if (unassignedQs.length > 0 && sections.length > 0) {
    rows.push({ kind: 'section', id: '__unassigned', title: 'Unassigned', subtotal: unassignedQs.reduce((s, q) => s + q.points, 0), isOver: false })
  }
  if (sections.length === 0 || unassignedQs.length > 0) {
    for (const aq of unassignedQs) {
      globalOrder++
      rows.push({ kind: 'question', aq, meta: MOCK_QB_QUESTIONS.find(m => m.id === aq.questionId), order: globalOrder })
    }
  }

  const allIds = questions.map(q => q.questionId)
  const allSelected = allIds.length > 0 && allIds.every(id => selected.has(id))
  function toggleSelectAll() {
    setSelected(allSelected ? new Set() : new Set(allIds))
  }
  function toggleSelect(id: string) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  const showNeg = settings.negativeMarking

  return (
    <div
      style={{
        height: 240, flexShrink: 0, display: 'flex', flexDirection: 'column',
        borderTop: '1px solid var(--border)', background: 'var(--card)', overflow: 'hidden',
      }}
      aria-label="Grading tray"
    >
      {/* Header */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 12, padding: '6px 16px',
        borderBottom: '1px solid var(--border)', flexShrink: 0,
      }}>
        <Checkbox
          checked={allSelected}
          onCheckedChange={toggleSelectAll}
          aria-label="Select all questions"
        />
        <span className="text-xs text-muted-foreground">{questions.length} questions</span>
        <span className="text-xs font-semibold text-foreground">
          Total: {totalAssigned} / {settings.totalMarks} pts
          {bonusTotal > 0 && (
            <span className="font-normal text-muted-foreground ms-1">
              + {bonusTotal} bonus
            </span>
          )}
        </span>
        {unassigned !== 0 && (
          <span className="text-xs font-semibold" style={{ color: 'var(--chart-4)' }}>
            <i className="fa-light fa-triangle-exclamation me-1" aria-hidden="true" />
            {Math.abs(unassigned)} pts {unassigned > 0 ? 'unassigned' : 'over budget'}
          </span>
        )}
        <Button
          variant="ghost"
          size="sm"
          onClick={onDistributeEvenly}
          disabled={unassigned === 0}
          className="ms-auto h-7 text-xs"
        >
          Distribute evenly
        </Button>
      </div>

      {/* Column headers */}
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: showNeg ? '32px 28px 1fr 60px 56px 72px' : '32px 28px 1fr 60px 56px',
          padding: '3px 16px', borderBottom: '1px solid var(--border)',
          flexShrink: 0, background: 'var(--muted)',
        }}
      >
        <div />
        <span className="text-[10px] text-muted-foreground">#</span>
        <span className="text-[10px] text-muted-foreground">Question</span>
        <span className="text-[10px] text-muted-foreground text-center">Pts</span>
        <span className="text-[10px] text-muted-foreground text-center">Bonus</span>
        {showNeg && <span className="text-[10px] text-muted-foreground text-right">Neg</span>}
      </div>

      {/* Scrollable rows */}
      <div style={{ flex: 1, overflowY: 'auto' }}>
        {rows.map((row, idx) => {
          if (row.kind === 'section') {
            return (
              <div
                key={`sec-${row.id}-${idx}`}
                style={{
                  display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                  padding: '3px 16px', background: 'var(--muted)',
                }}
              >
                <span className="text-[10px] font-semibold text-muted-foreground">
                  {row.title}
                </span>
                <span
                  className="text-[10px] font-semibold"
                  style={{ color: row.isOver ? 'var(--chart-4)' : 'var(--muted-foreground)' }}
                >
                  {row.subtotal} pts{row.isOver && <i className="fa-light fa-triangle-exclamation ms-1" aria-hidden="true" />}
                </span>
              </div>
            )
          }

          const neg = showNeg && !row.aq.bonus
            ? computeNegativeDeduction(row.aq.points, settings.negativeMarkingFraction)
            : null

          return (
            <QuestionTrayRow
              key={row.aq.questionId}
              aq={row.aq}
              meta={row.meta}
              order={row.order}
              selected={selected.has(row.aq.questionId)}
              onToggleSelect={() => toggleSelect(row.aq.questionId)}
              onUpdatePoints={onUpdatePoints}
              onUpdateBonus={onUpdateBonus}
              showNeg={showNeg}
              neg={neg}
            />
          )
        })}
      </div>

      {/* Bulk footer */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8, padding: '5px 16px',
        borderTop: '1px solid var(--border)', flexShrink: 0,
      }}>
        <span className="text-xs text-muted-foreground">Set selected to</span>
        <input
          type="number"
          min={0}
          step={1}
          value={bulkPts}
          onChange={e => setBulkPts(e.target.value)}
          aria-label="Bulk points value"
          style={{
            width: 48, height: 26, fontSize: 12, textAlign: 'center', padding: '0 4px',
            border: '1px solid var(--border)', borderRadius: 6,
            background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
          }}
        />
        <span className="text-xs text-muted-foreground">pts</span>
        <Button
          size="sm"
          variant="outline"
          className="h-7 text-xs"
          disabled={selected.size === 0}
          onClick={() => {
            const pts = parseInt(bulkPts)
            if (!isNaN(pts) && pts >= 0) {
              onBulkSetPoints([...selected], pts)
              setSelected(new Set())
            }
          }}
        >
          Apply
        </Button>
        {selected.size > 0 && (
          <span className="text-xs text-muted-foreground ms-2">{selected.size} selected</span>
        )}
      </div>
    </div>
  )
}

function QuestionTrayRow({
  aq, meta, order, selected, onToggleSelect,
  onUpdatePoints, onUpdateBonus, showNeg, neg,
}: {
  aq: AssessmentQuestion
  meta: Question | undefined
  order: number
  selected: boolean
  onToggleSelect: () => void
  onUpdatePoints: (id: string, pts: number) => void
  onUpdateBonus: (id: string, bonus: boolean) => void
  showNeg: boolean
  neg: number | null
}) {
  const [editing, setEditing] = useState(false)
  const [inputVal, setInputVal] = useState(String(aq.points))

  function commitEdit(raw: string) {
    const n = parseInt(raw)
    if (!isNaN(n) && n >= 0) onUpdatePoints(aq.questionId, n)
    else setInputVal(String(aq.points))
    setEditing(false)
  }

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: showNeg ? '32px 28px 1fr 60px 56px 72px' : '32px 28px 1fr 60px 56px',
        alignItems: 'center', padding: '2px 16px',
        background: selected ? 'var(--muted)' : 'transparent',
      }}
    >
      <Checkbox
        checked={selected}
        onCheckedChange={onToggleSelect}
        aria-label={`Select ${meta?.title ?? aq.questionId}`}
      />
      <span className="text-[10px] text-muted-foreground tabular-nums">{order}</span>
      <span className="text-xs text-foreground truncate" title={meta?.title}>
        {aq.bonus && (
          <i className="fa-solid fa-star text-[9px] me-1" aria-hidden="true"
             style={{ color: 'var(--brand-color)' }} />
        )}
        {meta?.title?.slice(0, 55) ?? aq.questionId}
      </span>

      {/* Points — click to edit inline */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        {editing ? (
          <input
            type="number"
            min={0}
            value={inputVal}
            onChange={e => setInputVal(e.target.value)}
            onBlur={e => commitEdit(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter' || e.key === 'Tab') {
                e.preventDefault()
                commitEdit(inputVal)
              }
              if (e.key === 'Escape') { setInputVal(String(aq.points)); setEditing(false) }
            }}
            autoFocus
            style={{
              width: 44, height: 22, fontSize: 12, textAlign: 'center', padding: '0 4px',
              border: '1px solid var(--brand-color)', borderRadius: 4,
              background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
            }}
          />
        ) : (
          <button
            type="button"
            onClick={() => { setEditing(true); setInputVal(String(aq.points)) }}
            aria-label={`Edit points for ${meta?.title ?? aq.questionId}, currently ${aq.points}`}
            style={{
              width: 44, height: 22, fontSize: 12, textAlign: 'center', padding: '0 4px',
              border: '1px solid var(--border)', borderRadius: 4, cursor: 'text',
              background: 'var(--muted)', color: 'var(--foreground)', fontWeight: 600,
            }}
          >
            {aq.points}
          </button>
        )}
      </div>

      {/* Bonus toggle */}
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <Button
          variant="ghost"
          size="sm"
          aria-pressed={aq.bonus}
          aria-label={aq.bonus ? 'Remove bonus designation' : 'Mark as bonus question'}
          onClick={() => onUpdateBonus(aq.questionId, !aq.bonus)}
          className="h-6 w-6 p-0"
        >
          <i
            className={aq.bonus ? 'fa-solid fa-star' : 'fa-light fa-star'}
            aria-hidden="true"
            style={{ fontSize: 11, color: aq.bonus ? 'var(--brand-color)' : 'var(--muted-foreground)' }}
          />
        </Button>
      </div>

      {/* Applied neg */}
      {showNeg && (
        <span
          className="text-[10px] tabular-nums text-right"
          style={{ color: aq.bonus || neg === null ? 'var(--muted-foreground)' : 'var(--chart-4)' }}
        >
          {aq.bonus || neg === null ? '—' : neg.toFixed(2)}
        </span>
      )}
    </div>
  )
}
