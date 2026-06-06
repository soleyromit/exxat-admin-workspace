'use client'

import { useState } from 'react'
import { Button, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem } from '@exxatdesignux/ui'
import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
import type { Question } from '@/lib/qb-types'
import { MOCK_MISSING_RATIONALE_QUESTION_IDS, MOCK_POOR_PBIS_QUESTION_IDS, searchQBQuestions } from '@/lib/qb-mock-data'
import { facultyListRows } from '@/lib/faculty-mock-data'
import { AddQuestionsInput } from './add-questions-input'
import { QbInlineResults } from './qb-inline-results'
import { GeneratingSteps } from './generating-steps'
import { RunwayReview } from './runway-review'
import { WriteFromScratchForm } from './write-from-scratch-form'
import { PdfDropZone } from './pdf-drop-zone'
import type { AddMode, GeneratedQuestion } from '@/lib/add-questions-types'

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
  onOpenQBDetail: (question: Question, results: Question[], index: number) => void
  onAddQuestion: (questionId: string, sectionId: string) => void
  onAddGenerated: (question: GeneratedQuestion, sectionId: string) => void
  newlyAddedIds: Set<string>
}

export function SectionsOutline({
  activeAsmt, selectedIds, questions, onRemove, onEditQuestion,
  editingQuestionId, onUpdateSection, onAddSection,
  activeSectionId, onSetActiveSection, onShowDetail,
  onOpenQBDetail, onAddQuestion, onAddGenerated, newlyAddedIds,
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
        <p className="text-xs font-semibold text-foreground">{activeAsmt.sections.length} section{activeAsmt.sections.length !== 1 ? 's' : ''}</p>
        {activeSectionId && (
          <Button variant="ghost" size="icon-xs" aria-label="Clear active section" onClick={() => onSetActiveSection(null)} className="text-muted-foreground hover:text-foreground h-auto w-auto p-0">
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
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
              <Button variant="ghost" size="xs" onClick={() => setShowAddForm(true)} className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors px-0 h-auto py-0.5">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add section
              </Button>
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
            onOpenQBDetail={onOpenQBDetail}
            onAddQuestion={onAddQuestion}
            onAddGenerated={onAddGenerated}
            newlyAddedIds={newlyAddedIds}
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
                isNew={newlyAddedIds.has(aq.questionId)}
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
  onOpenQBDetail, onAddQuestion, onAddGenerated, newlyAddedIds,
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
  onOpenQBDetail: (question: Question, results: Question[], index: number) => void
  onAddQuestion: (questionId: string, sectionId: string) => void
  onAddGenerated: (question: GeneratedQuestion, sectionId: string) => void
  newlyAddedIds: Set<string>
}) {
  const [collapsed, setCollapsed] = useState(false)
  const [addMode, setAddMode] = useState<AddMode>('resting')
  const [query, setQuery] = useState('')
  const [qbResults, setQbResults] = useState<Question[]>([])
  const [activeResultIndex, setActiveResultIndex] = useState(-1)
  const [generatedQuestions, setGeneratedQuestions] = useState<GeneratedQuestion[]>([])
  const [editPrefill, setEditPrefill] = useState<GeneratedQuestion | undefined>(undefined)
  const [pdfFile, setPdfFile] = useState<File | undefined>(undefined)

  function handleQueryChange(q: string) {
    setQuery(q)
    if (q.trim()) {
      setQbResults(searchQBQuestions(q, 6))
    } else {
      setQbResults([])
      setActiveResultIndex(-1)
    }
  }

  function handleResultClick(question: Question, index: number) {
    setActiveResultIndex(index)
    onOpenQBDetail(question, qbResults, index)
  }

  function handleAiGenerate(_prompt: string, _file?: File) {
    setAddMode('generating')
  }

  function handleGeneratingComplete() {
    const mockGenerated: GeneratedQuestion[] = [
      {
        id: `gen-${Date.now()}-1`,
        type: 'MCQ',
        difficulty: 'Hard',
        stemText: 'A 72-year-old man presents with progressive PR lengthening before a dropped beat. Which is the most appropriate next step?',
        options: [
          { key: 'A', text: 'Mobitz I (Wenckebach); observation appropriate', isCorrect: true, isSuggestedCorrect: true },
          { key: 'B', text: 'Mobitz II; immediate temporary pacing', isCorrect: false },
          { key: 'C', text: 'Complete heart block; permanent pacemaker', isCorrect: false },
          { key: 'D', text: 'First-degree AV block; no intervention', isCorrect: false },
        ],
        source: addMode === 'extracting' ? 'pdf' : 'ai',
      },
    ]
    setGeneratedQuestions(mockGenerated)
    setAddMode('runway')
  }

  function handleModeChange(mode: AddMode) {
    setAddMode(mode)
    if (mode === 'resting') {
      setQuery('')
      setQbResults([])
      setActiveResultIndex(-1)
      setEditPrefill(undefined)
    }
  }

  function handleWriteSave(q: GeneratedQuestion) {
    onAddGenerated(q, section.id)
    setAddMode('resting')
    setEditPrefill(undefined)
    setQuery('')
  }

  function handlePdfFile(file: File) {
    setPdfFile(file)
    setAddMode('extracting')
  }

  function handleRunwayAddAll(qs: GeneratedQuestion[]) {
    qs.forEach(q => onAddGenerated(q, section.id))
    setAddMode('resting')
    setGeneratedQuestions([])
    setQuery('')
  }
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
      <div className="flex items-center gap-2 w-full px-3 py-2">
        {/* Collapse chevron */}
        <Button
          variant="ghost" size="icon-xs"
          onClick={() => setCollapsed(c => !c)}
          className="shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
          aria-label={collapsed ? 'Expand section' : 'Collapse section'}
        >
          <i
            className={`fa-solid ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'} text-[9px]`}
            aria-hidden="true"
          />
        </Button>

        {/* Title — flex-1 so it takes remaining space */}
        <span className="text-sm font-medium text-[var(--foreground)] truncate flex-1 min-w-0">
          {section.title}
        </span>

        {/* Question count chip */}
        <span className="shrink-0 text-[11px] tabular-nums font-medium text-[var(--muted-foreground)] bg-[var(--muted)] rounded px-1.5 py-0.5">
          {section.questionIds.length}
        </span>

        {/* Faculty / collaborator avatars — compact */}
        {(assignedFaculty || collaborator) && (
          <div className="flex items-center shrink-0" style={{ gap: 2 }}>
            {assignedFaculty && (
              <span
                className="text-[10px] text-[var(--muted-foreground)]"
                title={assignedFaculty.fullName}
              >
                {assignedFaculty.fullName.split(' ').map((n: string) => n[0]).join('')}
              </span>
            )}
            {collaborator && (
              <span
                className="text-[10px] text-[var(--muted-foreground)] opacity-70"
                title={`Collaborator: ${collaborator.fullName}`}
              >
                +{collaborator.fullName.split(' ').map((n: string) => n[0]).join('')}
              </span>
            )}
          </div>
        )}

        {/* Status — Ready badge or Mark ready button */}
        {isReady ? (
          <div className="flex items-center gap-1 shrink-0">
            <Badge variant="outline" className="h-5 px-1.5 text-[10px] border-[var(--chart-2)] text-[var(--chart-2)]">
              Ready
            </Badge>
            <Button
              variant="ghost" size="icon-xs"
              onClick={() => onUpdateSection(section.id, { status: 'drafting' })}
              aria-label="Reopen section"
              className="text-[var(--muted-foreground)]"
            >
              <i className="fa-regular fa-rotate-left text-[9px]" aria-hidden="true" />
            </Button>
          </div>
        ) : (
          <Button
            variant="ghost" size="sm"
            onClick={() => onUpdateSection(section.id, { status: 'ready' })}
            className="h-6 px-2 text-[11px] shrink-0 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            aria-label={`Mark section ${section.title} as ready`}
          >
            Mark ready
          </Button>
        )}

        {/* ··· options menu */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon-xs" aria-label="Section options" className="shrink-0">
              <i className="fa-regular fa-ellipsis text-[10px]" aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-48">
            <DropdownMenuItem onClick={() => { handleModeChange('write'); onSetActive() }}>
              <i className="fa-regular fa-pen text-xs" aria-hidden="true" />
              Write from scratch
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => { handleModeChange('pdf'); onSetActive() }}>
              <i className="fa-regular fa-file-pdf text-xs" aria-hidden="true" />
              Import from PDF
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* AddQuestionsInput — shown unless in write/pdf/generating/extracting/runway mode */}
      {addMode !== 'write' && addMode !== 'pdf' && addMode !== 'generating' && addMode !== 'extracting' && addMode !== 'runway' && (
        <AddQuestionsInput
          mode={addMode}
          query={query}
          onModeChange={handleModeChange}
          onQueryChange={handleQueryChange}
          onAiGenerate={handleAiGenerate}
        />
      )}

      {/* State 1A — QB inline results */}
      {addMode === 'qb' && qbResults.length > 0 && (
        <QbInlineResults
          results={qbResults}
          totalCount={qbResults.length}
          activeIndex={activeResultIndex}
          onResultClick={handleResultClick}
        />
      )}

      {/* State 1C — Write from scratch */}
      {addMode === 'write' && (
        <WriteFromScratchForm
          prefill={editPrefill}
          onSave={handleWriteSave}
          onCancel={() => handleModeChange('resting')}
        />
      )}

      {/* State 1D — PDF drop zone */}
      {addMode === 'pdf' && (
        <PdfDropZone
          onFile={handlePdfFile}
          onCancel={() => handleModeChange('resting')}
        />
      )}

      {/* State 2 / 2D — Generating / Extracting */}
      {(addMode === 'generating' || addMode === 'extracting') && (
        <GeneratingSteps
          source={addMode === 'extracting' ? 'pdf' : 'ai'}
          prompt={query}
          fileName={pdfFile?.name}
          onComplete={handleGeneratingComplete}
        />
      )}

      {/* State 3 — Runway review */}
      {addMode === 'runway' && generatedQuestions.length > 0 && (
        <RunwayReview
          questions={generatedQuestions}
          onAddOne={q => onAddGenerated(q, section.id)}
          onSkipOne={() => {}}
          onAddAll={handleRunwayAddAll}
          onEditCurrent={q => { setEditPrefill(q); setAddMode('write') }}
        />
      )}

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
          isNew={newlyAddedIds.has(qId)}
        />
      ))}

      {/* Inline instructions + preread fields when section is active */}
      {isActive && (
        <div style={{ padding: '8px 12px 10px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 6 }}>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, borderRadius: '3px 0 0 3px', background: 'var(--chart-1)', opacity: 0.4 }} />
            <textarea
              aria-label={`Instructions for section ${section.title}`}
              value={section.instructions ?? ''}
              onChange={e => onUpdateSection(section.id, { instructions: e.target.value })}
              placeholder="Section instructions (shown before this section starts)…"
              rows={2}
              style={{
                width: '100%', paddingLeft: 10, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
                fontSize: 12, lineHeight: 1.5, fontFamily: 'inherit',
                border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 4px 4px 0',
                background: 'var(--background)', color: 'var(--foreground)',
                outline: 'none', resize: 'none',
              }}
            />
          </div>
          <div style={{ position: 'relative' }}>
            <div style={{ position: 'absolute', top: 0, bottom: 0, left: 0, width: 3, borderRadius: '3px 0 0 3px', background: 'var(--brand-color)', opacity: 0.3 }} />
            <textarea
              aria-label={`Preread for section ${section.title}`}
              value={section.prereadText ?? ''}
              onChange={e => onUpdateSection(section.id, { prereadText: e.target.value })}
              placeholder="Preread / case vignette (shown alongside questions)…"
              rows={2}
              style={{
                width: '100%', paddingLeft: 10, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
                fontSize: 12, lineHeight: 1.5, fontFamily: 'inherit',
                border: '1px solid var(--border)', borderLeft: 'none', borderRadius: '0 4px 4px 0',
                background: 'var(--background)', color: 'var(--foreground)',
                outline: 'none', resize: 'none',
              }}
            />
          </div>
        </div>
      )}
    </div>
  )
}

function QuestionRow({
  questionId, question, onRemove, onEdit, isEditing, indent = false, onShowDetail, isNew,
}: {
  questionId: string
  question: Question | undefined
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  isEditing: boolean
  indent?: boolean
  onShowDetail?: (questionId: string) => void
  isNew?: boolean
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
        borderLeft: isNew ? '2px solid var(--chart-2)' : undefined,
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

      {/* New badge */}
      {isNew && (
        <Badge
          variant="outline"
          className="shrink-0 text-[10px] h-4 px-1 border-[var(--chart-2)] text-[var(--chart-2)]"
        >
          ✓ New
        </Badge>
      )}

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
