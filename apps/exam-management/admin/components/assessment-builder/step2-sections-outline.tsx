'use client'

import { useState } from 'react'
import { Button, Badge } from '@exxat/ds/packages/ui/src'
import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
import type { Question } from '@/lib/qb-types'
import { MOCK_MISSING_RATIONALE_QUESTION_IDS, MOCK_POOR_PBIS_QUESTION_IDS } from '@/lib/qb-mock-data'
import { facultyListRows } from '@/lib/faculty-mock-data'

interface Props {
  activeAsmt: AssessmentDraft
  selectedIds: Set<string>
  questions: Question[]           // all QB questions (for lookup)
  onRemove: (questionId: string) => void
  onEditQuestion: (questionId: string) => void
  editingQuestionId: string | null
}

export function SectionsOutline({ activeAsmt, selectedIds, questions, onRemove, onEditQuestion, editingQuestionId }: Props) {
  const qById = Object.fromEntries(questions.map(q => [q.id, q]))

  // Build section → question mapping
  const assignedIds = new Set(activeAsmt.sections.flatMap(s => s.questionIds))
  const unassigned = activeAsmt.questions
    .filter(aq => !assignedIds.has(aq.questionId))
    .sort((a, b) => a.order - b.order)

  const totalFlags = activeAsmt.questions.filter(aq =>
    MOCK_MISSING_RATIONALE_QUESTION_IDS.has(aq.questionId)
  ).length

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <p className="text-xs font-bold text-foreground">{activeAsmt.questions.length} questions</p>
        {totalFlags > 0 && (
          <p className="text-[10px] text-muted-foreground mt-0.5">
            <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ color: 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))' }} />
            {' '}{totalFlags} missing rationale
          </p>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* Sections */}
        {activeAsmt.sections.map(section => (
          <SectionGroup
            key={section.id}
            section={section}
            questions={questions}
            onRemove={onRemove}
            onEdit={onEditQuestion}
            editingId={editingQuestionId}
          />
        ))}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground px-3 pt-3 pb-1">
              Unassigned ({unassigned.length})
            </p>
            {unassigned.map(aq => (
              <QuestionRow
                key={aq.questionId}
                questionId={aq.questionId}
                question={qById[aq.questionId]}
                onRemove={onRemove}
                onEdit={onEditQuestion}
                isEditing={editingQuestionId === aq.questionId}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionGroup({ section, questions, onRemove, onEdit, editingId }: {
  section: AssessmentSection
  questions: Question[]
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  editingId: string | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const qById = Object.fromEntries(questions.map(q => [q.id, q]))
  const assignedFaculty = section.facultyId
    ? facultyListRows.find(f => f.id === section.facultyId)
    : null

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <i
          className={`fa-light ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
          aria-hidden="true"
          style={{ fontSize: 9, color: 'var(--muted-foreground)', width: 10 }}
        />
        <span className="text-xs font-semibold text-foreground truncate flex-1">{section.title}</span>
        {assignedFaculty && (
          <span
            className="text-xs text-muted-foreground shrink-0 truncate max-w-[70px]"
            title={assignedFaculty.fullName}
          >
            {assignedFaculty.fullName.split(' ').slice(-1)[0]}
          </span>
        )}
        <span className="text-xs text-muted-foreground shrink-0">{section.questionIds.length}</span>
      </button>
      {!collapsed && section.questionIds.map(qId => (
        <QuestionRow
          key={qId}
          questionId={qId}
          question={qById[qId]}
          onRemove={onRemove}
          onEdit={onEdit}
          isEditing={editingId === qId}
          indent
        />
      ))}
    </div>
  )
}

function QuestionRow({ questionId, question, onRemove, onEdit, isEditing, indent = false }: {
  questionId: string
  question: Question | undefined
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  isEditing: boolean
  indent?: boolean
}) {
  const [hovered, setHovered] = useState(false)
  const missingRationale = MOCK_MISSING_RATIONALE_QUESTION_IDS.has(questionId)
  const poorPbis = MOCK_POOR_PBIS_QUESTION_IDS.has(questionId)

  return (
    <div
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onFocus={() => setHovered(true)}
      onBlur={() => setHovered(false)}
      tabIndex={-1}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: `5px 12px 5px ${indent ? 24 : 12}px`,
        background: isEditing ? 'color-mix(in oklch, var(--brand-color) 6%, var(--background))' : hovered ? 'var(--muted)' : 'transparent',
        cursor: 'default',
      }}
    >
      {/* Rationale warning */}
      {missingRationale && (
        <i
          className="fa-light fa-triangle-exclamation shrink-0"
          role="img"
          aria-label="Missing rationale"
          style={{ fontSize: 10, color: 'color-mix(in oklch, var(--foreground) 35%, oklch(80% 0.15 80))' }}
        />
      )}
      {/* Poor pbis warning */}
      {poorPbis && !missingRationale && (
        <i
          className="fa-light fa-chart-line-down shrink-0"
          role="img"
          aria-label="Low point-biserial"
          style={{ fontSize: 10, color: 'color-mix(in oklch, var(--foreground) 35%, oklch(80% 0.15 80))' }}
        />
      )}
      {!missingRationale && !poorPbis && (
        <span style={{ width: 12 }} />
      )}

      {/* Code */}
      <span className="text-[10px] font-mono text-muted-foreground shrink-0" style={{ width: 40 }}>
        {question?.code?.slice(-4) ?? '—'}
      </span>

      {/* Title */}
      <span className="text-xs text-foreground truncate flex-1">
        {question?.title?.slice(0, 40) ?? questionId}
      </span>

      {/* Type badge */}
      <Badge variant="outline" className="text-[9px] shrink-0 h-4 px-1">
        {question?.type ?? '?'}
      </Badge>

      {/* Actions — show on hover */}
      {hovered && (
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onEdit(questionId)}
            aria-label="Edit question"
            className="h-7 w-7 p-0 shrink-0"
          >
            <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 9 }} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(questionId)}
            aria-label="Remove question"
            className="h-7 w-7 p-0 shrink-0"
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
          </Button>
        </>
      )}
    </div>
  )
}
