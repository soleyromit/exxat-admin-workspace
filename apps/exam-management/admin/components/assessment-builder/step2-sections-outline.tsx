'use client'

import { useState } from 'react'
import { Button } from '@exxat/ds/packages/ui/src'
import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
import type { Question } from '@/lib/qb-types'
import { MOCK_MISSING_RATIONALE_QUESTION_IDS, MOCK_POOR_PBIS_QUESTION_IDS } from '@/lib/qb-mock-data'
import { facultyListRows } from '@/lib/faculty-mock-data'

const PBI_LOW_THRESHOLD = 0.2

interface Props {
  activeAsmt: AssessmentDraft
  selectedIds: Set<string>
  questions: Question[]
  onRemove: (questionId: string) => void
  onEditQuestion: (questionId: string) => void
  editingQuestionId: string | null
  onUpdateSection: (sectionId: string, patch: Partial<AssessmentSection>) => void
  onAddSection?: (title: string) => void
  activeSectionId: string | null
  onSetActiveSection: (id: string | null) => void
  onShowDetail?: (questionId: string) => void
}

export function SectionsOutline({
  activeAsmt, selectedIds, questions, onRemove, onEditQuestion,
  editingQuestionId, onUpdateSection, onAddSection,
  activeSectionId, onSetActiveSection, onShowDetail,
}: Props) {
  const [showAddForm, setShowAddForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const qById = Object.fromEntries(questions.map(q => [q.id, q]))

  const assignedIds = new Set(activeAsmt.sections.flatMap(s => s.questionIds))
  const unassigned = activeAsmt.questions
    .filter(aq => !assignedIds.has(aq.questionId))
    .sort((a, b) => a.order - b.order)

  function handleAddSection() {
    const trimmed = newTitle.trim()
    if (!trimmed) return
    onAddSection?.(trimmed)
    setNewTitle('')
    setShowAddForm(false)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <p className="text-xs font-semibold text-foreground">{activeAsmt.questions.length} questions</p>
        {activeSectionId && (
          <button
            type="button"
            onClick={() => onSetActiveSection(null)}
            className="text-xs text-muted-foreground hover:text-foreground transition-colors"
            style={{ background: 'none', border: 'none', cursor: 'pointer' }}
            aria-label="Clear active section"
          >
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </button>
        )}
      </div>

      {/* Scrollable list */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '8px 0' }}>
        {/* Inline add-section form */}
        {onAddSection && (
          <div style={{ padding: '4px 12px 8px' }}>
            {showAddForm ? (
              <div className="flex items-center gap-1.5">
                <input
                  type="text"
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleAddSection()
                    if (e.key === 'Escape') { setShowAddForm(false); setNewTitle('') }
                  }}
                  placeholder="Section title…"
                  autoFocus
                  style={{
                    flex: 1, fontSize: 12, padding: '4px 8px', borderRadius: 'var(--radius)',
                    border: '1px solid var(--border-control-35)', background: 'var(--background)',
                    color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit',
                  }}
                  aria-label="New section title"
                />
                <Button size="sm" onClick={handleAddSection} className="h-6 px-2 text-xs">Add</Button>
                <Button variant="ghost" size="sm" onClick={() => { setShowAddForm(false); setNewTitle('') }} className="h-6 px-2 text-xs">✕</Button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setShowAddForm(true)}
                className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
                style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '2px 0' }}
              >
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add section
              </button>
            )}
          </div>
        )}

        {/* Sections */}
        {activeAsmt.sections.map(section => (
          <SectionGroup
            key={section.id}
            section={section}
            questions={questions}
            qById={qById}
            onRemove={onRemove}
            onEdit={onEditQuestion}
            editingId={editingQuestionId}
            onUpdateSection={onUpdateSection}
            isActive={activeSectionId === section.id}
            onSetActive={() => onSetActiveSection(activeSectionId === section.id ? null : section.id)}
            onShowDetail={onShowDetail}
          />
        ))}

        {/* Unassigned */}
        {unassigned.length > 0 && (
          <div style={{ marginTop: 8 }}>
            <p className="text-xs font-semibold text-muted-foreground px-3 pt-1 pb-1">
              Unassigned · {unassigned.length}
            </p>
            {unassigned.map(aq => (
              <QuestionRow
                key={aq.questionId}
                questionId={aq.questionId}
                question={qById[aq.questionId]}
                onRemove={onRemove}
                onEdit={onEditQuestion}
                isEditing={editingQuestionId === aq.questionId}
                onShowDetail={onShowDetail}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function SectionGroup({
  section, questions, qById, onRemove, onEdit, editingId, onUpdateSection,
  isActive, onSetActive, onShowDetail,
}: {
  section: AssessmentSection
  questions: Question[]
  qById: Record<string, Question>
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  editingId: string | null
  onUpdateSection: (sectionId: string, patch: Partial<AssessmentSection>) => void
  isActive: boolean
  onSetActive: () => void
  onShowDetail?: (questionId: string) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const assignedFaculty = section.facultyId
    ? facultyListRows.find(f => f.id === section.facultyId)
    : null
  const collaborator = section.collaboratorId
    ? facultyListRows.find(f => f.id === section.collaboratorId)
    : null
  const isReady = section.status === 'ready'

  return (
    <div
      style={{
        background: isActive ? 'var(--muted)' : 'transparent',
        borderLeft: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
        marginBottom: 2,
      }}
    >
      {/* Section header */}
      <div className="flex items-center gap-1 w-full px-3 py-1.5">
        {/* Collapse trigger */}
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-1.5 flex-1 text-left min-w-0 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <i
            className={`fa-light ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
            aria-hidden="true"
            style={{ fontSize: 9, color: 'var(--muted-foreground)', width: 10, flexShrink: 0 }}
          />
          <span className="text-xs font-semibold text-foreground truncate">{section.title}</span>
          <span className="text-xs text-muted-foreground shrink-0">{section.questionIds.length}</span>
        </button>

        {/* Faculty + collaborator chips */}
        <div className="flex items-center gap-1 shrink-0">
          {assignedFaculty && (
            <span
              className="text-xs text-muted-foreground shrink-0"
              title={assignedFaculty.fullName}
              style={{ maxWidth: 48, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
            >
              {assignedFaculty.fullName.split(' ').slice(-1)[0]}
            </span>
          )}
          {collaborator && (
            <span
              className="text-xs text-muted-foreground shrink-0"
              title={`Collaborator: ${collaborator.fullName}`}
              style={{ maxWidth: 40, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', opacity: 0.7 }}
            >
              +{collaborator.fullName.split(' ').slice(-1)[0]}
            </span>
          )}
        </div>

        {/* Ready / Reopen */}
        {isReady ? (
          <>
            <span className="text-xs font-semibold shrink-0" style={{ color: 'var(--chart-2)' }}>Ready</span>
            <Button
              variant="ghost" size="sm"
              onClick={() => onUpdateSection(section.id, { status: 'drafting' })}
              className="h-5 px-1.5 text-xs shrink-0"
              aria-label={`Reopen section ${section.title}`}
            >Reopen</Button>
          </>
        ) : (
          <Button
            variant="outline" size="sm"
            onClick={() => onUpdateSection(section.id, { status: 'ready' })}
            className="h-5 px-1.5 text-xs shrink-0"
            aria-label={`Mark section ${section.title} as ready`}
          >Mark ready</Button>
        )}
      </div>

      {/* "Add questions" targeting button */}
      <div style={{ paddingLeft: 24, paddingRight: 12, paddingBottom: 4 }}>
        <button
          type="button"
          onClick={onSetActive}
          className="text-xs transition-colors flex items-center gap-1"
          style={{
            background: 'none', border: 'none', cursor: 'pointer',
            color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
            fontWeight: isActive ? 600 : 400,
          }}
          aria-pressed={isActive}
          aria-label={isActive ? `Stop adding to ${section.title}` : `Add questions to ${section.title}`}
        >
          <i className={`fa-light ${isActive ? 'fa-arrow-right-to-bracket' : 'fa-plus'}`} aria-hidden="true" style={{ fontSize: 10 }} />
          {isActive ? 'Adding here' : 'Add questions'}
        </button>
      </div>

      {/* Questions in section */}
      {!collapsed && section.questionIds.map(qId => (
        <QuestionRow
          key={qId}
          questionId={qId}
          question={qById[qId]}
          onRemove={onRemove}
          onEdit={onEdit}
          isEditing={editingId === qId}
          indent
          onShowDetail={onShowDetail}
        />
      ))}
    </div>
  )
}

function QuestionRow({
  questionId, question, onRemove, onEdit, isEditing, indent = false, onShowDetail,
}: {
  questionId: string
  question: Question | undefined
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  isEditing: boolean
  indent?: boolean
  onShowDetail?: (questionId: string) => void
}) {
  const [hovered, setHovered] = useState(false)
  const poorPbis = MOCK_POOR_PBIS_QUESTION_IDS.has(questionId)
  const missingRationale = MOCK_MISSING_RATIONALE_QUESTION_IDS.has(questionId)
  const pbis = question?.pbis ?? null
  const pbisLow = pbis !== null && pbis < PBI_LOW_THRESHOLD

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
        padding: `4px 12px 4px ${indent ? 24 : 12}px`,
        background: isEditing ? 'var(--muted)' : hovered ? 'var(--muted)' : 'transparent',
        cursor: 'default',
      }}
    >
      {/* Warning icons */}
      {missingRationale ? (
        <i
          className="fa-light fa-triangle-exclamation shrink-0"
          role="img"
          aria-label="Missing rationale"
          style={{ fontSize: 10, color: 'var(--chart-4)', width: 12 }}
        />
      ) : poorPbis || pbisLow ? (
        <i
          className="fa-light fa-chart-line-down shrink-0"
          role="img"
          aria-label="Low point-biserial"
          style={{ fontSize: 10, color: 'var(--chart-4)', width: 12 }}
        />
      ) : (
        <span style={{ width: 12 }} />
      )}

      {/* Code */}
      <span className="text-xs font-mono text-muted-foreground shrink-0" style={{ width: 38 }}>
        {question?.code?.slice(-4) ?? '—'}
      </span>

      {/* Title — clickable to show detail */}
      <span
        className="text-xs text-foreground truncate flex-1"
        style={{ cursor: onShowDetail ? 'pointer' : 'default' }}
        onClick={() => onShowDetail?.(questionId)}
        title={question?.title}
      >
        {question?.title?.slice(0, 36) ?? questionId}
      </span>

      {/* PBI chip */}
      {pbis !== null && (
        <span
          className="text-xs font-mono shrink-0"
          style={{ color: pbisLow ? 'var(--chart-4)' : 'var(--muted-foreground)' }}
          title={`Point-biserial: ${pbis}${pbisLow ? ' — low, consider replacing' : ''}`}
        >
          {pbisLow && <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 9, marginRight: 2 }} />}
          {pbis.toFixed(2)}
        </span>
      )}

      {/* Hover actions */}
      {hovered && (
        <>
          <Button
            variant="ghost" size="sm"
            onClick={() => onEdit(questionId)}
            aria-label="Edit question"
            className="h-6 w-6 p-0 shrink-0"
          >
            <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 9 }} />
          </Button>
          <Button
            variant="ghost" size="sm"
            onClick={() => onRemove(questionId)}
            aria-label="Remove question"
            className="h-6 w-6 p-0 shrink-0"
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
          </Button>
        </>
      )}
    </div>
  )
}
