'use client'
import React, { useEffect, useState, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Button, Badge,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Input,
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Separator,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Checkbox,
  Field, FieldLabel, FieldError,
  LocalBanner,
  useSidebar,
} from '@exxat/ds/packages/ui/src'
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_QUESTIONS, MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
import type { AssessmentDraft, AssessmentQuestion, AssessmentSection, Question, SmartView, QType, QDiff, AssessmentReviewRequest, AssessmentStatus, FolderNode } from '@/lib/qb-types'
import { SYSTEM_SMART_VIEWS, defaultAssessmentSettings } from '@/lib/qb-types'
import { courseObjectives, facultyListRows, type CourseObjective } from '@/lib/faculty-mock-data'
import { useFacultySession } from '@/lib/faculty-session'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { AiGenerateModal } from '@/components/ai-generate-modal'
import { QuestionEditor } from '@/components/question-editor/question-editor'
import {
  createDraft, toQuestion, type QuestionDraft, type SaveDestination,
} from '@/lib/question-editor-types'
import { SectionsOutline } from '@/components/assessment-builder/step2-sections-outline'
import { HealthPanel } from '@/components/assessment-builder/step2-health-panel'
import { InlineQuestionEditor } from '@/components/assessment-builder/step2-inline-editor'
import { SendForReviewDialog } from '@/components/assessment-builder/send-for-review-dialog'

// Estimated minutes per question type (base, before difficulty adjustment)
const TIME_BY_TYPE: Record<QType, number> = {
  'MCQ':        1.5,
  'Fill blank':  2.0,
  'Hotspot':    2.5,
  'Ordering':   3.0,
  'Matching':   3.0,
}

// Difficulty multiplier on base time
const DIFF_MULT: Record<QDiff, number> = {
  Easy:   1.0,
  Medium: 1.25,
  Hard:   1.5,
}

/** Recursively collect a folder ID and all its descendants. */
function getAllSubfolderIds(folderId: string): string[] {
  const result: string[] = [folderId]
  MOCK_QB_FOLDERS.filter(f => f.parentId === folderId).forEach(child => {
    result.push(...getAllSubfolderIds(child.id))
  })
  return result
}

function formatMin(min: number): string {
  if (!min || !isFinite(min)) return '—'
  const rounded = Math.round(min)
  if (rounded < 60) return `~${rounded} min`
  const h = Math.floor(rounded / 60)
  const m = rounded % 60
  return m > 0 ? `${h}h ${m}m` : `${h}h`
}

export default function AssessmentBuilderClient() {
  const { currentPersona } = useFacultySession()
  const searchParams = useSearchParams()
  const router = useRouter()
  const { drafts: localDrafts, hydrated: draftsHydrated } = useAssessmentDrafts()

  // Change 1: Collapse the app sidebar while the builder is mounted
  const { setOpen: setSidebarOpen } = useSidebar()
  useEffect(() => {
    setSidebarOpen(false)
    return () => setSidebarOpen(true)
  }, [setSidebarOpen])

  // URL hand-off from CreateAssessmentModal: ?draftId=X&courseId=Y
  // The modal saves a draft via the store, then routes here. We pre-select
  // the right course + offering and load the draft as activeAsmt so the
  // builder lands ready instead of empty.
  const urlCourseId = searchParams?.get('courseId') ?? null
  const urlDraftId = searchParams?.get('draftId') ?? null
  const urlMode = (searchParams?.get('mode') ?? null) as 'blank' | 'qb' | 'copy' | null
  const urlSourceId = searchParams?.get('sourceId') ?? null

  const initialCourseId = urlCourseId ?? mockCourses[0]?.id ?? ''
  const [courseId, setCourseId] = useState(initialCourseId)
  const [offeringId, setOfferingId] = useState(
    mockCourseOfferings.find(o => o.courseId === initialCourseId)?.id ?? ''
  )
  const [activeAsmt, setActiveAsmt] = useState<AssessmentDraft | null>(null)

  // When the draft store hydrates and we have a draftId in the URL, load
  // the matching draft as activeAsmt. Once-only (idempotent on draftId).
  useEffect(() => {
    if (!urlDraftId || !draftsHydrated) return
    const draft = localDrafts.find(d => d.id === urlDraftId)
    if (!draft) return
    if (activeAsmt?.id === draft.id) return
    setActiveAsmt({
      id: draft.id,
      title: draft.title,
      courseId: draft.courseId,
      offeringId: draft.offeringId,
      questions: [],
      durationMinutes: draft.durationMinutes,
      sections: [],
      settings: defaultAssessmentSettings('Exam'),
      healthFlags: [],
    })
    setCourseId(draft.courseId)
    setOfferingId(draft.offeringId)
  }, [urlDraftId, draftsHydrated, localDrafts, activeAsmt?.id])

  // Load source assessment questions when arriving via "Copy from previous"
  useEffect(() => {
    if (urlMode !== 'copy' || !urlSourceId) return
    const source = mockAssessments.find(a => a.id === urlSourceId)
    if (!source) return
    // Already loaded — don't overwrite
    if (activeAsmt?.id === `asmt-copy-${urlSourceId}`) return

    const sourceCode = (mockCourses.find(c => c.id === source.courseId)?.code ?? '').toLowerCase()
    const sourceQuestions = MOCK_QB_QUESTIONS
      .filter(q => q.folder.startsWith(sourceCode))
      .slice(0, source.questionCount)
      .map((q, i): AssessmentQuestion => ({ questionId: q.id, order: i + 1 }))

    const targetOfferingId = urlCourseId
      ? (mockCourseOfferings.find(o => o.courseId === source.courseId)?.id ?? source.offeringId)
      : source.offeringId

    setActiveAsmt({
      id: `asmt-copy-${urlSourceId}`,
      title: `${source.title} (copy)`,
      courseId: source.courseId,
      offeringId: targetOfferingId,
      questions: sourceQuestions,
      durationMinutes: source.durationMinutes,
      sections: [],
      settings: defaultAssessmentSettings('Exam'),
      healthFlags: [],
    })
    setCourseId(source.courseId)
  }, [urlMode, urlSourceId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [smartViewId, setSmartViewId] = useState<string>('all')
  const [savedViews, setSavedViews] = useState<SmartView[]>(() => {
    try {
      const stored = typeof window !== 'undefined' ? localStorage.getItem('qb-smart-views') : null
      return stored ? JSON.parse(stored) : []
    } catch { return [] }
  })

  // Session-scoped user-created questions (from inline "New question" panel)
  const [userCreated, setUserCreated] = useState<Question[]>([])

  // AI generate modal — opened from the AI source tab in the picker
  const [aiOpen, setAiOpen] = useState(false)

  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const assessments = mockAssessments.filter(a => a.courseId === courseId && a.offeringId === offeringId)
  const allSmartViews = useMemo(() => [...SYSTEM_SMART_VIEWS, ...savedViews], [savedViews])

  const currentCourse   = mockCourses.find(c => c.id === courseId)
  const currentOffering = mockCourseOfferings.find(o => o.id === offeringId)
  const courseLabel = currentCourse
    ? `${currentCourse.code} · ${currentOffering?.semester ?? ''}`
    : ''

  const saveSmartView = useCallback((view: SmartView) => {
    setSavedViews(prev => {
      const next = [...prev, view]
      try { localStorage.setItem('qb-smart-views', JSON.stringify(next)) } catch {}
      return next
    })
  }, [])

  function openAssessment(asmtId: string) {
    const source = assessments.find(a => a.id === asmtId)
    if (!source) return
    setActiveAsmt({
      id: source.id,
      title: source.title,
      courseId: source.courseId,
      offeringId: source.offeringId,
      questions: [],
      durationMinutes: source.durationMinutes,
      sections: [],
      settings: defaultAssessmentSettings('Exam'),
      healthFlags: [],
    })
  }

  function createAssessment() {
    setActiveAsmt({
      id: `asmt-new-${Date.now()}`,
      title: 'New Assessment',
      courseId,
      offeringId,
      questions: [],
      durationMinutes: 60,
      sections: [],
      settings: defaultAssessmentSettings('Exam'),
      healthFlags: [],
    })
  }

  function toggleQuestion(questionId: string) {
    if (!activeAsmt) return
    setActiveAsmt(prev => {
      if (!prev) return prev
      const exists = prev.questions.find(q => q.questionId === questionId)
      if (exists) {
        return {
          ...prev,
          questions: prev.questions.filter(q => q.questionId !== questionId),
          sections: prev.sections.map(s => ({
            ...s,
            questionIds: s.questionIds.filter(id => id !== questionId),
          })),
        }
      }
      return {
        ...prev,
        questions: [...prev.questions, { questionId, order: prev.questions.length + 1 }],
      }
    })
  }

  // Project a fully-edited `QuestionDraft` (from QuestionEditor) into a QB
  // `Question` row, append it to userCreated, and add it to the active
  // assessment. Used by the inline editor in the picker's "new-question" tab.
  function createQuestionFromDraft(draft: QuestionDraft, dest: SaveDestination): Question {
    const folderPrefix = (mockCourses.find(c => c.id === activeAsmt?.courseId)?.code ?? 'COURSE').toLowerCase()
    const folderPath = dest === 'bank'
      ? `${folderPrefix.toUpperCase()} QB / Faculty drafts`
      : 'User-created · this session'
    const q: Question = toQuestion(draft, {
      folder: `${folderPrefix}-${dest === 'bank' ? 'faculty-drafts' : 'user-created'}`,
      folderPath,
    })
    setUserCreated(prev => [q, ...prev])
    if (activeAsmt && (dest === 'assessment' || dest === 'bank')) {
      setActiveAsmt(prev => prev ? {
        ...prev,
        questions: [...prev.questions, { questionId: q.id, order: prev.questions.length + 1 }],
      } : prev)
    }
    return q
  }

  // Create a brand-new question inline and add it to the assessment.
  // Persists in `userCreated` state so the picker can also display it
  // when the user switches back to the QB-source view.
  function createQuestion(input: {
    title: string
    options: string[]
    correctIdx: number
  }): Question {
    const id = `user-${Date.now()}`
    const code = `USR-${String(userCreated.length + 1).padStart(3, '0')}`
    const folderPrefix = (mockCourses.find(c => c.id === activeAsmt?.courseId)?.code ?? 'COURSE').toLowerCase()
    const q: Question = {
      id,
      code,
      version: 1,
      age: 'just now',
      title: input.title.trim(),
      type: 'MCQ',
      status: 'Draft',
      difficulty: 'Medium',
      blooms: 'Apply',
      folder: `${folderPrefix}-user-created`,
      folderPath: 'User-created · this session',
      tags: [],
      usage: 0,
      pbis: null,
      pbisDir: 'flat',
    }
    setUserCreated(prev => [q, ...prev])
    // Add it to the active assessment immediately
    if (activeAsmt) {
      setActiveAsmt(prev => prev ? {
        ...prev,
        questions: [...prev.questions, { questionId: q.id, order: prev.questions.length + 1 }],
      } : prev)
    }
    return q
  }

  const selectedIds = useMemo(
    () => new Set(activeAsmt?.questions.map(q => q.questionId) ?? []),
    [activeAsmt]
  )

  const distribution = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    return {
      Easy:   picked.filter(q => q.difficulty === 'Easy').length,
      Medium: picked.filter(q => q.difficulty === 'Medium').length,
      Hard:   picked.filter(q => q.difficulty === 'Hard').length,
    }
  }, [selectedIds])

  const bloomsMetrics = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    if (picked.length === 0) return []
    const counts: Record<string, number> = {}
    for (const q of picked) counts[q.blooms] = (counts[q.blooms] ?? 0) + 1
    const total = picked.length
    return Object.entries(counts)
      .sort((a, b) => b[1] - a[1])
      .map(([level, count]) => ({ level, count, pct: Math.round((count / total) * 100) }))
  }, [selectedIds])

  const timeMetrics = useMemo(() => {
    const picked = MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id))
    if (picked.length === 0) return { totalMin: 0, avgMin: 0 }
    const totalMin = picked.reduce(
      (sum, q) => sum + (TIME_BY_TYPE[q.type] ?? 2) * (DIFF_MULT[q.difficulty] ?? 1),
      0
    )
    return { totalMin, avgMin: totalMin / picked.length }
  }, [selectedIds])

  const overtimeMetrics = useMemo(() => {
    if (timeMetrics.totalMin === 0) return null
    const delta = timeMetrics.totalMin - (activeAsmt?.durationMinutes ?? 0)
    const pct = Math.round((timeMetrics.totalMin / (activeAsmt?.durationMinutes ?? 1)) * 100)
    return { allottedMin: activeAsmt?.durationMinutes ?? 0, delta, pct }
  }, [timeMetrics.totalMin, activeAsmt?.durationMinutes])

  const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)

  // Change 2: HealthPanel is hidden by default; toggled via icon button
  const [showHealth, setShowHealth] = useState(false)

  // Change 3: sections sub-phase for Step 2
  const [builderPhase, setBuilderPhase] = useState<'sections' | 'questions'>('sections')

  // When entering Step 2: start in sections phase if no sections exist yet, otherwise go to questions
  useEffect(() => {
    if (activeStep === 2) {
      if (activeAsmt && activeAsmt.sections.length === 0) {
        setBuilderPhase('sections')
      } else {
        setBuilderPhase('questions')
      }
    }
  }, [activeStep]) // eslint-disable-line react-hooks/exhaustive-deps

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [sendForReviewOpen, setSendForReviewOpen] = useState(false)

  function addSection(title: string) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      sections: [...prev.sections, { id: `sec-${Date.now()}`, title, questionIds: [] }],
    } : prev)
  }

  function removeSection(sectionId: string) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    } : prev)
  }

  function assignQuestionToSection(questionId: string, sectionId: string | null) {
    setActiveAsmt(prev => {
      if (!prev) return prev
      return {
        ...prev,
        // sectionId=null means unassign — remove from all sections (works because each question is in at most one section)
        sections: prev.sections.map(s => ({
          ...s,
          questionIds: sectionId === s.id
            ? [...new Set([...s.questionIds, questionId])]
            : s.questionIds.filter(id => id !== questionId),
        })),
      }
    })
  }

  function removeQuestion(questionId: string) {
    setActiveAsmt(prev => {
      if (!prev) return prev
      return {
        ...prev,
        questions: prev.questions
          .filter(q => q.questionId !== questionId)
          .map((q, i) => ({ ...q, order: i + 1 })),
        sections: prev.sections.map(s => ({
          ...s,
          questionIds: s.questionIds.filter(id => id !== questionId),
        })),
      }
    })
  }

  function updateSection(sectionId: string, patch: Partial<AssessmentSection>) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s),
    } : prev)
  }

  function handleSaveDraft() {
    router.push('/courses')
  }

  function handleSendToChair() {
    setSendForReviewOpen(true)
  }

  function handleReviewSubmit(req: AssessmentReviewRequest) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      settings: {
        ...prev.settings,
        status: 'pending-review',
        reviewRequest: req,
      },
    } : prev)
  }

  function handlePublish() {
    if (!activeAsmt) return
    setActiveAsmt(prev => prev ? {
      ...prev,
      settings: { ...prev.settings, status: 'scheduled' },
    } : prev)
    // In a real app this would navigate to the assessment detail page.
    // For now, stay on the builder so the status update is visible.
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h1 className="sr-only">Assessment Builder</h1>

      {/* Wizard header — replaces the old selector bar */}
      <WizardHeader
        activeStep={activeStep}
        onStepClick={setActiveStep}
        assessmentName={activeAsmt?.title ?? ''}
        courseLabel={courseLabel}
        onSaveDraft={handleSaveDraft}
        canSave={!!activeAsmt}
      />

      {/* Step 1 — Details */}
      {activeStep === 1 && (
        <DetailsStep
          activeAsmt={activeAsmt}
          mockCoursesLocal={mockCourses}
          mockCourseOfferingsLocal={mockCourseOfferings}
          courseId={courseId}
          offeringId={offeringId}
          onCourseChange={(val) => {
            setCourseId(val)
            const first = mockCourseOfferings.find(o => o.courseId === val)
            if (first) setOfferingId(first.id)
            setActiveAsmt(null)
          }}
          onOfferingChange={(val) => { setOfferingId(val); setActiveAsmt(null) }}
          onUpdate={(patch) => {
            setActiveAsmt(prev => {
              if (!prev) {
                return {
                  id: `asmt-new-${Date.now()}`,
                  title: patch.title ?? 'New Assessment',
                  courseId,
                  offeringId,
                  questions: [],
                  durationMinutes: patch.durationMinutes ?? 90,
                  sections: [],
                  settings: defaultAssessmentSettings('Exam'),
                  healthFlags: [],
                  ...patch,
                }
              }
              return { ...prev, ...patch }
            })
          }}
          onContinue={() => setActiveStep(2)}
          onCancel={() => router.push('/courses')}
        />
      )}

      {/* Step 2 — Build */}
      {activeStep === 2 && activeAsmt && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
          {/* Left: sections outline — always visible in questions phase */}
          {builderPhase === 'questions' && (
            <div style={{ width: 240, minWidth: 240, borderRight: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
              <SectionsOutline
                activeAsmt={activeAsmt}
                selectedIds={selectedIds}
                questions={MOCK_QB_QUESTIONS}
                onRemove={removeQuestion}
                onEditQuestion={id => setEditingQuestionId(prev => prev === id ? null : id)}
                editingQuestionId={editingQuestionId}
                onUpdateSection={updateSection}
                onAddSection={addSection}
              />
              {editingQuestionId && (() => {
                const q = MOCK_QB_QUESTIONS.find(q => q.id === editingQuestionId)
                if (!q) return null
                return (
                  <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0', flexShrink: 0 }}>
                    <InlineQuestionEditor
                      question={q}
                      onSave={() => {
                        setEditingQuestionId(null)
                      }}
                      onCancel={() => setEditingQuestionId(null)}
                      onCopyAndModify={(copyQ) => {
                        createQuestion({ title: copyQ.title + ' (copy)', options: [], correctIdx: 0 })
                        setEditingQuestionId(null)
                      }}
                    />
                  </div>
                )
              })()}
            </div>
          )}

          {/* Center: sections sub-phase OR question picker */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
            {builderPhase === 'sections' ? (
              /* Sections setup sub-phase */
              <>
                <div style={{ padding: '8px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
                  <div>
                    <p className="text-sm font-semibold text-foreground">Set up sections</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Organize questions by topic or assign sections to instructors. You can skip this and add sections later.</p>
                  </div>
                </div>
                <div style={{ flex: 1, overflow: 'auto' }}>
                  <SectionsOutline
                    activeAsmt={activeAsmt}
                    selectedIds={selectedIds}
                    questions={MOCK_QB_QUESTIONS}
                    onRemove={removeQuestion}
                    onEditQuestion={id => setEditingQuestionId(prev => prev === id ? null : id)}
                    editingQuestionId={editingQuestionId}
                    onUpdateSection={updateSection}
                    onAddSection={addSection}
                  />
                </div>
                <div style={{ padding: '12px 20px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 8, flexShrink: 0, background: 'var(--card)' }}>
                  <Button variant="ghost" size="sm" onClick={() => setActiveStep(1)} className="gap-1.5">
                    <i className="fa-light fa-arrow-left" aria-hidden="true" />
                    Back
                  </Button>
                  <div style={{ display: 'flex', gap: 8 }}>
                    <Button variant="ghost" size="sm" onClick={() => setBuilderPhase('questions')}>
                      Skip
                    </Button>
                    <Button size="sm" onClick={() => setBuilderPhase('questions')} className="gap-1.5">
                      Start building questions
                      <i className="fa-light fa-arrow-right" aria-hidden="true" />
                    </Button>
                  </div>
                </div>
              </>
            ) : (
              /* Questions picking sub-phase */
              <>
                <button
                  type="button"
                  onClick={() => setBuilderPhase('sections')}
                  className="text-xs text-muted-foreground flex items-center gap-1 px-4 py-2 hover:text-foreground transition-colors"
                  style={{ background: 'none', border: 'none', borderBottom: '1px solid var(--border)', cursor: 'pointer', flexShrink: 0 }}
                >
                  <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 10 }} />
                  Back to sections
                </button>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', padding: '4px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0, gap: 4 }}>
                  {/* Change 2: HealthPanel toggle button */}
                  <Button
                    variant={showHealth ? 'secondary' : 'ghost'}
                    size="sm"
                    onClick={() => setShowHealth(h => !h)}
                    aria-label={showHealth ? 'Hide health panel' : 'Show health panel'}
                    aria-pressed={showHealth}
                    className="h-7 w-7 p-0"
                  >
                    <i className="fa-light fa-heart-pulse" aria-hidden="true" />
                  </Button>
                </div>
                <ABQuestionPicker
                  selectedIds={selectedIds}
                  onToggle={toggleQuestion}
                  activeAsmt={activeAsmt}
                  onDurationChange={(min) => setActiveAsmt(prev => prev ? { ...prev, durationMinutes: min } : prev)}
                  smartViews={allSmartViews}
                  activeViewId={smartViewId}
                  onViewChange={setSmartViewId}
                  onSaveView={saveSmartView}
                  userCreated={userCreated}
                  onCreateQuestion={createQuestion}
                  onCreateFromDraft={createQuestionFromDraft}
                  authorPersonaId={currentPersona.id}
                  onOpenAi={() => setAiOpen(true)}
                  isCopyMode={urlMode === 'copy'}
                  onRenameAsmt={(title) => setActiveAsmt(prev => prev ? { ...prev, title } : prev)}
                  onAssignToSection={assignQuestionToSection}
                />
                {/* Step 2 navigation footer */}
                <div
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                    padding: '8px 20px', borderTop: '1px solid var(--border)',
                    background: 'var(--card)', flexShrink: 0,
                  }}
                >
                  <Button variant="ghost" size="sm" onClick={() => setActiveStep(1)} className="gap-1.5">
                    <i className="fa-light fa-arrow-left" aria-hidden="true" />
                    Back
                  </Button>
                  <Button size="sm" onClick={() => setActiveStep(3)} className="gap-1.5">
                    Review
                    <i className="fa-light fa-arrow-right" aria-hidden="true" />
                  </Button>
                </div>
              </>
            )}
          </div>

          {/* Right: health panel — only in questions phase when toggled on */}
          {builderPhase === 'questions' && showHealth && (
            <div style={{ width: 260, borderLeft: '1px solid var(--border)', flexShrink: 0, overflow: 'auto' }}>
              <HealthPanel
                activeAsmt={activeAsmt}
                objectives={courseObjectives.filter(o => o.courseId === activeAsmt.courseId)}
                timeMetrics={timeMetrics}
                distribution={distribution}
                bloomsMetrics={bloomsMetrics}
                targetQuestions={50}
              />
            </div>
          )}
        </div>
      )}

      {/* Step 2 — no active assessment */}
      {activeStep === 2 && !activeAsmt && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p className="text-sm text-muted-foreground">No assessment selected. Go back to Details to set one up.</p>
          <Button size="sm" onClick={() => setActiveStep(1)} className="gap-1.5">
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to Details
          </Button>
        </div>
      )}

      {/* Step 3 — Review */}
      {activeStep === 3 && activeAsmt && (
        <ReviewStep
          activeAsmt={activeAsmt}
          courseLabel={courseLabel}
          distribution={distribution}
          bloomsMetrics={bloomsMetrics}
          timeMetrics={timeMetrics}
          onBack={() => setActiveStep(2)}
          onSaveAsDraft={handleSaveDraft}
          onSendToChair={handleSendToChair}
          onPublish={handlePublish}
        />
      )}

      {/* Step 3 — no active assessment */}
      {activeStep === 3 && !activeAsmt && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Button size="sm" onClick={() => setActiveStep(1)}>← Back to Details</Button>
        </div>
      )}

      {/* Sheets + modals — always mounted so they survive step transitions */}
      <AiGenerateModal
        open={aiOpen}
        onOpenChange={setAiOpen}
        objectives={courseObjectives.filter(o => {
          if (o.courseId !== activeAsmt?.courseId) return false
          if (!o.lastAssessed) return true
          const daysAgo = (Date.now() - new Date(o.lastAssessed).getTime()) / (1000 * 60 * 60 * 24)
          return daysAgo > 60
        })}
        acceptLabel="Add to assessment"
        onAccept={(drafts) => {
          drafts.forEach(d => {
            createQuestion({ title: d.stem, options: d.options, correctIdx: d.correctIdx })
          })
        }}
      />
      <AssessmentSettingsSheet
        open={settingsOpen}
        onOpenChange={setSettingsOpen}
        settings={activeAsmt?.settings ?? defaultAssessmentSettings('Exam')}
        onSave={(s) => setActiveAsmt(prev => prev ? { ...prev, settings: s } : prev)}
      />
      <SendForReviewDialog
        open={sendForReviewOpen}
        onOpenChange={setSendForReviewOpen}
        onSubmit={handleReviewSubmit}
      />
    </div>
  )
}

// ─── Assessment list sidebar (Task 16) ───────────────────────────────────────

function ABAssessmentList({ assessments, activeId, onOpen, onCreate }: {
  assessments: typeof mockAssessments
  activeId: string | null
  onOpen: (id: string) => void
  onCreate: () => void
}) {
  return (
    <aside style={{
      width: 224,
      minWidth: 224,
      borderRight: '1px solid var(--border)',
      display: 'flex',
      flexDirection: 'column',
      overflow: 'hidden',
      background: 'var(--ab-panel-bg)',
    }}>
      <div className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground" style={{
        padding: '10px 10px 4px',
        flexShrink: 0,
      }}>
        Assessments
      </div>
      <div style={{ flex: 1, overflow: 'auto', padding: '0 6px 6px' }}>
        {assessments.map(a => {
          const isActive = activeId === a.id
          const diff = a.diffDistribution ?? { Easy: 0, Medium: 0, Hard: 0 }
          const total = diff.Easy + diff.Medium + diff.Hard
          const pct = (n: number) => total > 0 ? (n / total) * 100 : 0
          return (
            <Button
              key={a.id}
              variant="ghost"
              size="sm"
              onClick={() => onOpen(a.id)}
              className="w-full h-auto text-left flex-col items-start"
              style={{
                borderRadius: 7,
                padding: '8px 10px',
                marginBottom: 2,
                background: isActive ? 'var(--accent)' : 'transparent',
                border: '1px solid',
                borderColor: isActive ? 'var(--ab-active-border)' : 'transparent',
              }}
            >
              <div className="text-sm font-semibold text-foreground">{a.title}</div>
              <div className="text-xs text-muted-foreground" style={{ margin: '2px 0 6px' }}>
                {a.questionCount} questions
              </div>
              <div style={{
                display: 'flex',
                height: 4,
                borderRadius: 2,
                overflow: 'hidden',
                gap: 1,
                width: '100%',
              }}>
                <div style={{ width: `${pct(diff.Easy)}%`, background: 'var(--qb-diff-bar-easy)', opacity: 0.7, borderRadius: 2, transition: 'width .2s' }} />
                <div style={{ width: `${pct(diff.Medium)}%`, background: 'var(--qb-diff-bar-medium)', opacity: 0.85, borderRadius: 2, transition: 'width .2s' }} />
                <div style={{ width: `${pct(diff.Hard)}%`, background: 'var(--qb-diff-bar-hard)', borderRadius: 2, transition: 'width .2s' }} />
              </div>
            </Button>
          )
        })}
        <Button
          variant="outline"
          size="sm"
          onClick={onCreate}
          className="w-full mt-1 text-sm text-muted-foreground"
          style={{ borderStyle: 'dashed' }}
        >
          <i className="fa-light fa-plus" aria-hidden="true" />
          {' '}New assessment
        </Button>
      </div>
    </aside>
  )
}

// ─── Question picker (Task 14) ────────────────────────────────────────────────

const DURATION_OPTIONS = [
  { label: '20 min',  value: 20  },
  { label: '30 min',  value: 30  },
  { label: '45 min',  value: 45  },
  { label: '60 min',  value: 60  },
  { label: '90 min',  value: 90  },
  { label: '2 hours', value: 120 },
  { label: '2.5 hrs', value: 150 },
  { label: '3 hours', value: 180 },
]

// ─── Section assign dropdown ─────────────────────────────────────────────────

function SectionAssignDropdown({ sections, onAssign, isSelected }: {
  sections: AssessmentSection[]
  onAssign: (sectionId: string | null) => void
  isSelected: boolean
}) {
  const [open, setOpen] = useState(false)

  if (isSelected) {
    return (
      <Button variant="outline" size="sm" onClick={() => onAssign(null)} style={{ height: 28, fontSize: 11, gap: 4 }}>
        <i className="fa-light fa-check" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
        Added
      </Button>
    )
  }

  if (sections.length === 0) {
    return (
      <Button variant="default" size="sm" onClick={() => onAssign(null)} style={{ height: 28, fontSize: 11 }}>
        Use
      </Button>
    )
  }

  return (
    <div style={{ position: 'relative' }}>
      <Button
        variant="default"
        size="sm"
        onClick={() => setOpen(o => !o)}
        style={{ height: 28, fontSize: 11, gap: 4 }}
      >
        Use
        <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
      </Button>
      {open && (
        <>
          <div
            style={{ position: 'fixed', inset: 0, zIndex: 49 }}
            onClick={() => setOpen(false)}
          />
          <div style={{
            position: 'absolute', right: 0, top: '100%', marginTop: 4,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 4px 16px color-mix(in oklch, var(--foreground) 10%, transparent)',
            zIndex: 50, minWidth: 180, overflow: 'hidden',
          }}>
            <div
              onClick={() => { onAssign(null); setOpen(false) }}
              className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-muted"
            >
              <i className="fa-light fa-layer-group" aria-hidden="true" style={{ color: 'var(--muted-foreground)', width: 14 }} />
              Unassigned
            </div>
            {sections.map(s => (
              <div
                key={s.id}
                onClick={() => { onAssign(s.id); setOpen(false) }}
                className="flex items-center gap-2 px-3 py-2 text-xs cursor-pointer hover:bg-muted"
              >
                <i className="fa-light fa-layer-group" aria-hidden="true" style={{ color: 'var(--brand-color)', width: 14 }} />
                {s.title}
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  )
}

// ─── Question source — Vishaka: questions can come from multiple places ────
//   1. THIS course's question bank (default)
//   2. OTHER courses' question banks (e.g. shared bug content across micro + immuno)
//   3. NEW question created inline within this assessment
//   4. AI generate from course objectives (Aarti's principle)
type PickerSource = 'this-course' | 'other-courses' | 'new-question' | 'ai-generate'

function ABQuestionPicker({
  selectedIds, onToggle, activeAsmt, onDurationChange,
  smartViews, activeViewId, onViewChange, onSaveView,
  userCreated, onCreateQuestion, onCreateFromDraft, authorPersonaId, onOpenAi,
  isCopyMode, onRenameAsmt, onAssignToSection,
}: {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeAsmt: AssessmentDraft
  onDurationChange: (min: number) => void
  smartViews: SmartView[]
  activeViewId: string
  onViewChange: (id: string) => void
  onSaveView: (v: SmartView) => void
  userCreated: Question[]
  onCreateQuestion: (input: { title: string; options: string[]; correctIdx: number }) => Question
  onCreateFromDraft: (draft: QuestionDraft, dest: SaveDestination) => Question
  authorPersonaId: string
  onOpenAi: () => void
  isCopyMode: boolean
  onRenameAsmt: (title: string) => void
  onAssignToSection?: (questionId: string, sectionId: string | null) => void
}) {
  const [saveDialogOpen, setSaveDialogOpen] = useState(false)
  const [newViewName, setNewViewName] = useState('')
  const [newViewNameError, setNewViewNameError] = useState<string | null>(null)
  const [source, setSource] = useState<PickerSource>('this-course')
  const [otherCourseId, setOtherCourseId] = useState<string>('')
  const [selectedContentAreaId, setSelectedContentAreaId] = useState<string | null>(null)

  const activeView = smartViews.find(v => v.id === activeViewId) ?? smartViews[0]

  // The current course's folder prefix is derived from its code
  // (e.g. "PHAR101" → "phar101").
  const thisCourse = mockCourses.find(c => c.id === activeAsmt.courseId)
  const thisCourseFolderPrefix = thisCourse?.code.toLowerCase() ?? ''

  const otherCourses = useMemo(
    () => mockCourses.filter(c => c.id !== activeAsmt.courseId),
    [activeAsmt.courseId]
  )

  // Content areas = direct-child folders of the course QB root
  const contentAreas = useMemo<FolderNode[]>(() => {
    if (!thisCourse) return []
    return MOCK_QB_FOLDERS.filter(f => f.parentId === thisCourse.questionBankFolderId)
  }, [thisCourse])

  // Reset content area filter when source or course changes
  useEffect(() => {
    setSelectedContentAreaId(null)
  }, [source, activeAsmt.courseId])

  // Source-scoped questions: only questions tagged to the relevant QB folder.
  const sourcedQuestions = useMemo(() => {
    if (source === 'this-course') {
      return MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(thisCourseFolderPrefix))
    }
    if (source === 'other-courses') {
      if (!otherCourseId) return []
      const other = mockCourses.find(c => c.id === otherCourseId)
      if (!other) return []
      const prefix = other.code.toLowerCase()
      return MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(prefix))
    }
    return [] // new-question + ai-generate render their own UI
  }, [source, thisCourseFolderPrefix, otherCourseId])

  const contentAreaFilteredQuestions = useMemo(() => {
    if (!selectedContentAreaId) return sourcedQuestions
    const ids = new Set(getAllSubfolderIds(selectedContentAreaId))
    return sourcedQuestions.filter(q => ids.has(q.folder))
  }, [sourcedQuestions, selectedContentAreaId])

  const filteredQuestions = useMemo(() => {
    const { difficulty, type, blooms, unusedOnly } = activeView?.filters ?? {}
    return contentAreaFilteredQuestions.filter(q => {
      if (difficulty?.length && !difficulty.includes(q.difficulty)) return false
      if (type?.length && !type.includes(q.type)) return false
      if (blooms?.length && !blooms.includes(q.blooms)) return false
      if (unusedOnly && (q.usage ?? 0) > 0) return false
      return true
    })
  }, [activeView, contentAreaFilteredQuestions])

  function handleSaveView() {
    const trimmed = newViewName.trim()
    if (!trimmed) {
      setNewViewNameError('Give the smart view a name.')
      return
    }
    // Reject duplicate name vs system or saved views (case-insensitive).
    const dup = smartViews.find(v => v.label.toLowerCase() === trimmed.toLowerCase())
    if (dup) {
      setNewViewNameError(`A view called "${dup.label}" already exists.`)
      return
    }
    setNewViewNameError(null)
    onSaveView({
      id: `user-${Date.now()}`,
      label: trimmed,
      isSystem: false,
      filters: activeView?.filters ?? {},
    })
    setNewViewName('')
    setSaveDialogOpen(false)
  }

  const sourceTabs: Array<{ id: PickerSource; label: string; icon: string; sub: string }> = [
    { id: 'this-course',   label: thisCourse ? `${thisCourse.code} bank` : 'This course',   icon: 'fa-folder',          sub: 'Default — pull from this course' },
    { id: 'other-courses', label: 'Other courses',     icon: 'fa-folder-tree',     sub: 'Pull from another course\'s QB' },
    { id: 'new-question',  label: 'New question',      icon: 'fa-pen-to-square',   sub: 'Create inline in this assessment' },
    { id: 'ai-generate',   label: 'AI gap fill',        icon: 'fa-sparkles',        sub: 'Cover untested objectives' },
  ]

  const isQbSource = source === 'this-course' || source === 'other-courses'

  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* Assessment context header */}
      <div style={{
        padding: '8px 16px',
        borderBottom: '1px solid var(--border)',
        display: 'flex',
        alignItems: 'center',
        gap: 8,
        flexShrink: 0,
      }}>
        {activeAsmt.title === 'New Assessment' ? (
          <input
            aria-label="Assessment name"
            defaultValue={activeAsmt.title}
            placeholder="Assessment name…"
            onBlur={e => {
              const val = e.target.value.trim()
              if (val && val !== 'New Assessment') onRenameAsmt(val)
              ;(e.target as HTMLInputElement).style.boxShadow = 'none'
            }}
            onFocus={e => { (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
            onKeyDown={e => {
              if (e.key === 'Enter') (e.target as HTMLInputElement).blur()
            }}
            style={{
              fontSize: 14,
              fontWeight: 600,
              background: 'transparent',
              border: 'none',
              borderBottom: '1px solid var(--brand-color)',
              outline: 'none',
              color: 'var(--foreground)',
              width: 200,
              padding: '0 2px',
            }}
          />
        ) : (
          <span className="text-sm font-semibold">{activeAsmt.title}</span>
        )}
        <span className="text-xs text-muted-foreground">· {selectedIds.size} questions selected</span>
      </div>

      {/* Copy mode banner — shown when arriving via "Copy from previous" */}
      {isCopyMode && activeAsmt.questions.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 text-xs shrink-0"
          style={{
            backgroundColor: 'color-mix(in oklch, var(--brand-color) 6%, var(--background))',
            borderBottom: '1px solid var(--border)',
          }}
        >
          <i className="fa-light fa-copy shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
          <span className="text-foreground">
            <strong>{activeAsmt.questions.length} questions</strong> copied from previous assessment.
            Swap, remove, or add questions below.
          </span>
        </div>
      )}

      {/* Source bar — Vishaka: questions can come from multiple places. Make
          the source explicit and switchable, default to this course's QB. */}
      <div style={{
        display: 'flex',
        alignItems: 'stretch',
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        flexShrink: 0,
        overflowX: 'auto',
      }}>
        {sourceTabs.map(t => {
          const isActive = source === t.id
          return (
            <Button
              key={t.id}
              variant="ghost"
              onClick={() => setSource(t.id)}
              className="flex flex-col items-start justify-center gap-0.5 h-auto px-4 py-2.5 text-start whitespace-normal shrink-0 rounded-none"
              style={{
                borderBottom: isActive ? '2px solid var(--brand-color)' : '2px solid transparent',
                background: isActive ? 'color-mix(in oklch, var(--brand-color) 6%, var(--background))' : 'transparent',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <i className={`fa-light ${t.icon}`} aria-hidden="true" />
                {t.label}
              </span>
              <span className="text-[10px] text-muted-foreground">{t.sub}</span>
            </Button>
          )
        })}
      </div>

      {/* Other-courses picker — only shown when 'other-courses' is the active source */}
      {source === 'other-courses' && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          background: 'var(--muted)',
          flexShrink: 0,
        }}>
          <span className="text-xs font-semibold text-muted-foreground">Pick a course:</span>
          <Select value={otherCourseId} onValueChange={setOtherCourseId}>
            <SelectTrigger className="text-sm" style={{ width: 240, height: 28 }} aria-label="Select course question bank">
              <SelectValue placeholder="Select a course's question bank…" />
            </SelectTrigger>
            <SelectContent>
              {otherCourses.map(c => (
                <SelectItem key={c.id} value={c.id}>{c.code} · {c.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          {otherCourseId && (
            <span className="text-[11px] text-muted-foreground">
              {sourcedQuestions.length} questions available
            </span>
          )}
        </div>
      )}

      {/* Content area filter — primary navigation for QB question picking */}
      {isQbSource && contentAreas.length > 0 && (
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 16px',
            borderBottom: '1px solid var(--border)',
            overflowX: 'auto',
            flexShrink: 0,
            background: 'var(--background)',
          }}
          role="group"
          aria-label="Filter by content area"
        >
          <span className="text-xs text-muted-foreground shrink-0">Area</span>
          <Button
            variant={selectedContentAreaId === null ? 'default' : 'outline'}
            size="sm"
            onClick={() => setSelectedContentAreaId(null)}
            className="shrink-0 rounded-full text-xs h-7 px-3"
          >
            All
          </Button>
          {contentAreas.map(ca => (
            <Button
              key={ca.id}
              variant={selectedContentAreaId === ca.id ? 'default' : 'outline'}
              size="sm"
              onClick={() => setSelectedContentAreaId(prev => prev === ca.id ? null : ca.id)}
              className="shrink-0 rounded-full text-xs h-7 px-3 whitespace-nowrap"
              aria-pressed={selectedContentAreaId === ca.id}
            >
              {ca.name}
              <span className="ms-1.5 text-xs opacity-60">{ca.count}</span>
            </Button>
          ))}
        </div>
      )}

      {/* Smart view chips — only for QB sources (this/other) */}
      {isQbSource && (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          padding: '8px 16px',
          borderBottom: '1px solid var(--border)',
          overflowX: 'auto',
          flexShrink: 0,
          background: 'var(--ab-smart-view-bar-bg)',
        }}>
          {smartViews.map(view => {
            const isActive = activeViewId === view.id
            return (
              <Button
                key={view.id}
                variant={isActive ? 'default' : 'outline'}
                size="sm"
                onClick={() => onViewChange(view.id)}
                className="shrink-0 rounded-full text-[11px] h-7 px-3"
                style={!view.isSystem && !isActive
                  ? { borderStyle: 'dashed', color: 'var(--brand-color)', borderColor: 'var(--brand-color)' }
                  : undefined}
              >
                {!view.isSystem && (
                  <i className="fa-solid fa-star text-[9px] mr-1" aria-hidden="true" />
                )}
                {view.label}
              </Button>
            )
          })}
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setSaveDialogOpen(true)}
            className="shrink-0 rounded-full text-[11px] h-7 px-3"
            style={{ color: 'var(--brand-color)', opacity: 0.7 }}
          >
            <i className="fa-light fa-plus" aria-hidden="true" />
            {' '}Save view
          </Button>
        </div>
      )}

      {/* New-question source — inline editor (full type/form-control coverage)
          Switching back to a different source preserves nothing; the editor is
          remounted via React's `key` whenever the assessment changes. */}
      {source === 'new-question' && (
        <NewQuestionEditorPanel
          key={activeAsmt.id}
          activeAsmt={activeAsmt}
          authorPersonaId={authorPersonaId}
          onCreateFromDraft={onCreateFromDraft}
          userCreated={userCreated}
          onCancel={() => setSource('this-course')}
        />
      )}

      {/* AI-generate source — entry point to gap-fill wizard */}
      {source === 'ai-generate' && (
        <AiGeneratePanel
          courseLabel={thisCourse ? `${thisCourse.code} · ${thisCourse.name}` : 'this course'}
          onOpen={onOpenAi}
          gapObjectives={courseObjectives.filter(o => {
            if (o.courseId !== activeAsmt.courseId) return false
            if (!o.lastAssessed) return true
            const days = (Date.now() - new Date(o.lastAssessed).getTime()) / (1000 * 60 * 60 * 24)
            return days > 60
          })}
        />
      )}

      {/* Question list — only for QB sources */}
      {isQbSource && (
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}></TableHead>
              <TableHead>Question</TableHead>
              <TableHead style={{ width: 80 }}>Difficulty</TableHead>
              <TableHead style={{ width: 100 }}>Type</TableHead>
              <TableHead style={{ width: 60 }}>Usage</TableHead>
              <TableHead style={{ width: 90 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-sm text-muted-foreground" style={{ textAlign: 'center', padding: '40px 20px' }}>
                  No questions match this view
                </TableCell>
              </TableRow>
            ) : filteredQuestions.map(q => {
              const isPicked = selectedIds.has(q.id)
              // Custom qb tokens — kept in style (no Tailwind class exists)
              const diffColor: Record<string, string> = {
                Easy:   'var(--qb-diff-bar-easy)',
                Medium: 'var(--qb-diff-bar-medium)',
                Hard:   'var(--qb-diff-bar-hard)',
              }
              const diffWeight: Record<string, string> = {
                Easy: 'font-normal', Medium: 'font-semibold', Hard: 'font-extrabold',
              }
              return (
                <TableRow
                  key={q.id}
                  onClick={() => onToggle(q.id)}
                  style={{ cursor: 'pointer', background: isPicked ? 'var(--ab-picker-selected-bg)' : undefined }}
                >
                  <TableCell>
                    <Checkbox
                      checked={isPicked}
                      onCheckedChange={() => onToggle(q.id)}
                      onClick={(e: React.MouseEvent) => e.stopPropagation()}
                      aria-label={`Select ${q.title}`}
                    />
                  </TableCell>
                  <TableCell className="text-sm" style={{ maxWidth: 400 }}>
                    <div style={{
                      lineHeight: 1.4,
                      display: '-webkit-box',
                      WebkitLineClamp: 2,
                      WebkitBoxOrient: 'vertical',
                      overflow: 'hidden',
                    }}>
                      {q.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${diffWeight[q.difficulty] ?? ''}`} style={{ color: diffColor[q.difficulty] }}>{q.difficulty}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {q.type}
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground">
                    {(q.usage ?? 0) > 0 ? `${q.usage}×` : '—'}
                  </TableCell>
                  <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    <SectionAssignDropdown
                      sections={activeAsmt.sections}
                      isSelected={isPicked}
                      onAssign={(sectionId) => {
                        if (!isPicked) onToggle(q.id)
                        if (sectionId !== null) {
                          onAssignToSection?.(q.id, sectionId)
                        }
                      }}
                    />
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      )}

      {/* Save smart view dialog — Field + FieldError surfaces both
          "required" and "duplicate name" failures (was silent disable
          on submit button). */}
      <Dialog
        open={saveDialogOpen}
        onOpenChange={(o) => {
          if (!o) { setNewViewName(''); setNewViewNameError(null) }
          setSaveDialogOpen(o)
        }}
      >
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Save smart view</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground" style={{ marginBottom: 8 }}>
            Saves the current filter configuration as &ldquo;{activeView?.label}&rdquo; with a custom name.
          </p>
          <Field orientation="vertical">
            <FieldLabel htmlFor="save-view-name">View name *</FieldLabel>
            <Input
              id="save-view-name"
              autoFocus
              value={newViewName}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                setNewViewName(e.target.value)
                if (newViewNameError) setNewViewNameError(null)
              }}
              onKeyDown={(e: React.KeyboardEvent<HTMLInputElement>) => e.key === 'Enter' && handleSaveView()}
              placeholder="View name…"
              aria-required="true"
              aria-invalid={!!newViewNameError}
              aria-describedby={newViewNameError ? 'save-view-name-error' : undefined}
            />
            {newViewNameError && (
              <FieldError id="save-view-name-error">{newViewNameError}</FieldError>
            )}
          </Field>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setSaveDialogOpen(false)}>Cancel</Button>
            <Button variant="default" size="sm" onClick={handleSaveView}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

// ─── Difficulty distribution chart (Task 15) ─────────────────────────────────

function ABDiffChart({ distribution, timeMetrics, overtimeMetrics, durationMinutes, onDurationChange, bloomsMetrics, saveConfirmed, onSave, onCancel: _onCancel }: {
  distribution: { Easy: number; Medium: number; Hard: number }
  timeMetrics: { totalMin: number; avgMin: number }
  overtimeMetrics: { allottedMin: number; delta: number; pct: number } | null
  durationMinutes: number
  onDurationChange: (min: number) => void
  bloomsMetrics: { level: string; count: number; pct: number }[]
  saveConfirmed: boolean
  onSave: () => void
  onCancel: () => void
}) {
  const [inputMin, setInputMin] = useState(String(durationMinutes))
  // Sync input when durationMinutes changes externally (e.g. opening a different assessment)
  React.useEffect(() => { setInputMin(String(durationMinutes)) }, [durationMinutes])

  function commitInput(raw: string) {
    const n = parseInt(raw)
    if (!isNaN(n) && n >= 5) onDurationChange(n)
    else setInputMin(String(durationMinutes))
  }

  const total = distribution.Easy + distribution.Medium + distribution.Hard
  const bars = [
    { label: 'E', count: distribution.Easy,   color: 'var(--qb-diff-bar-easy)'   },
    { label: 'M', count: distribution.Medium, color: 'var(--qb-diff-bar-medium)' },
    { label: 'H', count: distribution.Hard,   color: 'var(--qb-diff-bar-hard)'   },
  ]
  const maxCount = Math.max(...bars.map(b => b.count), 1)

  const overtime = overtimeMetrics ? (() => {
    const { delta } = overtimeMetrics
    if (delta > 0)  return { icon: 'fa-triangle-exclamation', label: `+${Math.round(delta)} min over`, color: 'var(--chart-5)',             cls: 'text-chart-5'             }
    if (delta > -5) return { icon: 'fa-clock',                label: 'Tight',                          color: 'var(--chart-4)',             cls: 'text-[color:var(--chart-4)]' }
    return               { icon: 'fa-circle-check',           label: 'On time',                        color: 'var(--qb-trust-senior-color)', cls: 'text-[color:var(--qb-trust-senior-color)]' }
  })() : null

  const SEP = () => <div style={{ width: 1, alignSelf: 'stretch', background: 'var(--border)', margin: '0 4px' }} />

  return (
    <div style={{
      padding: '12px 20px',
      borderTop: '1px solid var(--border)',
      display: 'flex',
      alignItems: 'center',
      gap: 24,
      flexShrink: 0,
      background: 'var(--ab-chart-bg)',
    }}>
      {/* Difficulty bar chart */}
      <div style={{ display: 'flex', alignItems: 'flex-end', gap: 6, height: 52 }}>
        {bars.map(bar => (
          <div key={bar.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3 }}>
            <span className="text-xs font-semibold" style={{ color: bar.color, lineHeight: 1 }}>
              {bar.count > 0 ? bar.count : ''}
            </span>
            <div style={{
              width: 24, borderRadius: '3px 3px 0 0',
              background: bar.color,
              height: bar.count === 0 ? 3 : `${(bar.count / maxCount) * 32}px`,
              transition: 'height .2s ease',
              opacity: bar.count === 0 ? 0.2 : 1,
            }} />
            <span className="text-xs text-muted-foreground" style={{ lineHeight: 1 }}>{bar.label}</span>
          </div>
        ))}
      </div>

      <SEP />

      {/* Est. time + overtime */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
          {/* Total */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Total</span>
            <span className="text-sm font-semibold text-foreground" style={{ lineHeight: 1 }}>{formatMin(timeMetrics.totalMin)}</span>
          </div>
          {/* Avg / question */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Avg / Q</span>
            <span className="text-sm font-semibold text-foreground" style={{ lineHeight: 1 }}>
              {timeMetrics.avgMin > 0 ? formatMin(timeMetrics.avgMin) : '—'}
            </span>
          </div>
          {/* Allotted — number input + preset select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Allotted</span>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <Input
                type="number"
                min={5}
                step={5}
                value={inputMin}
                onChange={e => setInputMin(e.target.value)}
                onBlur={e => commitInput(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter') commitInput(inputMin) }}
                className="text-sm font-semibold text-foreground text-center"
                style={{ width: 48, height: 26, padding: '0 4px' }}
              />
              <Select
                value={DURATION_OPTIONS.some(o => o.value === durationMinutes) ? String(durationMinutes) : ''}
                onValueChange={v => { onDurationChange(Number(v)); setInputMin(v) }}
              >
                <SelectTrigger className="text-xs" style={{ width: 76, height: 26 }} aria-label="Select preset">
                  <SelectValue placeholder="preset" />
                </SelectTrigger>
                <SelectContent>
                  {DURATION_OPTIONS.map(o => (
                    <SelectItem key={o.value} value={String(o.value)}>{o.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        {overtime ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
            <i className={`fa-solid ${overtime.icon} ${overtime.cls}`} aria-hidden="true" style={{ fontSize: 11 }} />
            <span className={`text-[11px] font-semibold ${overtime.cls}`}>{overtime.label}</span>
          </div>
        ) : (
          <span className="text-[10px] text-muted-foreground">Select questions to estimate</span>
        )}
      </div>

      {/* Bloom's */}
      {bloomsMetrics.length > 0 && (
        <>
          <SEP />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-[10px] font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Bloom&rsquo;s
            </span>
            {bloomsMetrics.slice(0, 3).map(b => (
              <div key={b.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 136 }}>
                <span className="text-xs text-foreground">{b.level}</span>
                <span className="text-xs font-semibold text-foreground">{b.pct}%</span>
              </div>
            ))}
            {bloomsMetrics.length > 3 && (
              <span className="text-[10px] text-muted-foreground">+{bloomsMetrics.length - 3} more</span>
            )}
          </div>
        </>
      )}

      <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
        {total === 0 && (
          <span className="text-xs text-muted-foreground">Select questions to build</span>
        )}
        <Button variant="default" size="sm" disabled={total === 0 || saveConfirmed} onClick={onSave}>
          {saveConfirmed ? 'Saved ✓' : 'Save assessment'}
        </Button>
      </div>
    </div>
  )
}

// ─── New question — inline editor (full type/form-control coverage) ─────────
//
// Hosts the unified `QuestionEditor` so faculty can author any question type
// without leaving the assessment builder. On save, the draft is projected to
// a QB `Question` row and added to the active assessment (and optionally the
// faculty drafts folder of the QB).
function NewQuestionEditorPanel({
  activeAsmt,
  authorPersonaId,
  onCreateFromDraft,
  userCreated,
  onCancel,
}: {
  activeAsmt: AssessmentDraft
  authorPersonaId: string
  onCreateFromDraft: (draft: QuestionDraft, dest: SaveDestination) => Question
  userCreated: Question[]
  onCancel: () => void
}) {
  const objectives = useMemo(
    () => courseObjectives.filter(o => o.courseId === activeAsmt.courseId),
    [activeAsmt.courseId]
  )

  const [draft, setDraft] = useState<QuestionDraft>(() =>
    createDraft({ authorPersonaId })
  )
  const [confirmation, setConfirmation] = useState<string | null>(null)

  function handleSave(d: QuestionDraft, dest: SaveDestination) {
    if (dest === 'draft') {
      setDraft({ ...d, state: 'draft' })
      setConfirmation('Saved as draft')
    } else {
      onCreateFromDraft({ ...d, state: 'saved' }, dest)
      setConfirmation(dest === 'bank' ? 'Saved to bank + added to assessment' : 'Added to assessment')
      // Reset for the next question
      setDraft(createDraft({ authorPersonaId }))
    }
    setTimeout(() => setConfirmation(null), 2000)
  }

  return (
    <div style={{ flex: 1, overflow: 'auto', background: 'var(--background)' }}>
      <div role="status" aria-live="polite">
        {confirmation && (
          <div className="mx-auto max-w-3xl mt-4">
            <LocalBanner variant="success">{confirmation}</LocalBanner>
          </div>
        )}
      </div>
      <QuestionEditor
        draft={draft}
        onChange={setDraft}
        objectives={objectives}
        compact
        showAddToAssessment
        onSave={handleSave}
        onCancel={onCancel}
      />
      {userCreated.length > 0 && (
        <div className="mx-auto max-w-3xl mb-6 px-4 py-3 border-t border-border flex flex-col gap-2">
          <div className="flex items-center gap-2">
            <i className="fa-light fa-clock-rotate-left text-muted-foreground" aria-hidden="true" style={{ fontSize: 12 }} />
            <span className="text-[10px] uppercase tracking-wider font-bold text-muted-foreground">
              Added this session · {userCreated.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {userCreated.map(q => (
              <li
                key={q.id}
                className="rounded-md px-3 py-2 text-xs flex items-center gap-2"
                style={{
                  background: 'color-mix(in oklch, var(--brand-color) 5%, var(--card))',
                  border: '1px solid var(--border)',
                }}
              >
                <Badge
                  variant="secondary"
                  className="rounded font-mono text-[9px] uppercase tracking-wider"
                  style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                >
                  {q.code}
                </Badge>
                <span className="flex-1 truncate text-foreground">{q.title}</span>
                <span className="text-[10px] text-muted-foreground">{q.age}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}

// ── Review step (wizard step 3) ───────────────────────────────────────────────

function ReviewStep({
  activeAsmt,
  courseLabel,
  distribution,
  bloomsMetrics,
  timeMetrics,
  onBack,
  onSaveAsDraft,
  onSendToChair,
  onPublish,
}: {
  activeAsmt: AssessmentDraft
  courseLabel: string
  distribution: { Easy: number; Medium: number; Hard: number }
  bloomsMetrics: { level: string; count: number; pct: number }[]
  timeMetrics: { totalMin: number; avgMin: number }
  onBack: () => void
  onSaveAsDraft: () => void
  onSendToChair: () => void
  onPublish: () => void
}) {
  const totalQ  = distribution.Easy + distribution.Medium + distribution.Hard
  const s       = activeAsmt.settings

  const bars = [
    { label: 'Easy',   count: distribution.Easy,   color: 'var(--qb-diff-bar-easy)'   },
    { label: 'Medium', count: distribution.Medium, color: 'var(--qb-diff-bar-medium)' },
    { label: 'Hard',   count: distribution.Hard,   color: 'var(--qb-diff-bar-hard)'   },
  ]

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      <div className="flex-1 px-8 py-8 max-w-3xl mx-auto w-full flex flex-col gap-6">

        {/* Health banner */}
        {(() => {
          const flags = activeAsmt.healthFlags ?? []
          const missingRationale = flags.filter(f => f.type === 'missing-rationale').length
          const poorPbis = flags.filter(f => f.type === 'poor-pbis').length
          const hasIssues = missingRationale > 0 || poorPbis > 0

          return (
            <div
              className="flex items-center gap-3 rounded-xl px-4 py-3"
              style={{
                background: hasIssues
                  ? 'color-mix(in oklch, oklch(80% 0.15 80) 8%, var(--background))'
                  : 'color-mix(in oklch, var(--brand-color) 6%, var(--background))',
                border: `1px solid ${hasIssues
                  ? 'color-mix(in oklch, oklch(80% 0.15 80) 25%, transparent)'
                  : 'color-mix(in oklch, var(--brand-color) 20%, transparent)'}`,
              }}
            >
              <i
                className={`fa-light ${hasIssues ? 'fa-triangle-exclamation' : 'fa-circle-check'} shrink-0`}
                aria-hidden="true"
                style={{
                  fontSize: 16,
                  color: hasIssues ? 'color-mix(in oklch, var(--foreground) 50%, oklch(80% 0.15 80))' : 'var(--brand-color)',
                }}
              />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {hasIssues ? 'Needs attention before publishing' : 'Ready to publish'}
                </p>
                {hasIssues && (
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {[
                      missingRationale > 0 && `${missingRationale} questions missing rationale`,
                      poorPbis > 0 && `${poorPbis} low point-biserial`,
                    ].filter(Boolean).join(' · ')}
                  </p>
                )}
              </div>
              {hasIssues && (
                <Button variant="outline" size="sm" onClick={onBack} className="gap-1.5 shrink-0 text-xs">
                  <i className="fa-light fa-arrow-left" aria-hidden="true" />
                  Fix in Build
                </Button>
              )}
            </div>
          )
        })()}

        {/* Summary card */}
        <div className="rounded-xl border border-border bg-card p-6 flex flex-col gap-3">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2
                className="text-2xl font-semibold text-foreground"
                style={{ fontFamily: 'var(--font-heading)', letterSpacing: '-0.02em' }}
              >
                {activeAsmt.title}
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">{courseLabel}</p>
            </div>
            <Badge
              variant="secondary"
              className="rounded text-xs shrink-0"
              style={{
                backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                color: 'var(--brand-color)',
              }}
            >
              {s.type}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-2">
            {[
              { label: 'Questions', value: String(totalQ) },
              { label: 'Duration',  value: `${activeAsmt.durationMinutes} min` },
              { label: 'Password',  value: s.passwordRequired ? 'Required' : 'None' },
              { label: 'Randomize', value: s.randomize ? 'On' : 'Off' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
                <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Difficulty breakdown */}
        {totalQ > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-4">Difficulty distribution</p>
            <div className="flex items-center gap-6">
              {bars.map(bar => (
                <div key={bar.label} className="flex items-center gap-2">
                  <div
                    className="h-2.5 rounded-full"
                    style={{
                      width: totalQ > 0 ? `${Math.round((bar.count / totalQ) * 120)}px` : '8px',
                      minWidth: bar.count > 0 ? 8 : 0,
                      backgroundColor: bar.color,
                      opacity: bar.count === 0 ? 0.15 : 0.8,
                    }}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">{bar.label}</span>
                  <span className="text-xs font-semibold text-foreground shrink-0 tabular-nums">{bar.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Estimated time: ~{Math.round(timeMetrics.totalMin)} min total
              {timeMetrics.avgMin > 0 ? ` · ~${Math.round(timeMetrics.avgMin * 10) / 10} min per question` : ''}
            </p>
          </div>
        )}

        {/* Sections breakdown */}
        {activeAsmt.sections.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Sections</p>
            <div className="flex flex-col divide-y divide-border">
              {activeAsmt.sections.map((section, idx) => (
                <div key={section.id} className="flex items-center justify-between py-2.5">
                  <p className="text-sm text-foreground">
                    <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                    {section.title}
                  </p>
                  <Badge variant="secondary" className="rounded text-xs">
                    {section.questionIds.length} Q
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Instructions preview */}
        {activeAsmt.settings.instructionsText.trim() && (
          <InstructionsPreview text={activeAsmt.settings.instructionsText} requireAck={activeAsmt.settings.requireAcknowledgment} />
        )}

        {/* Schedule + Approval */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Schedule */}
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Schedule</p>
            {activeAsmt.settings.type === 'Pop Quiz' ? (
              <div className="flex items-start gap-2 text-xs text-muted-foreground">
                <i className="fa-light fa-bolt mt-0.5" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                <span>Pop quizzes are started live in class. No scheduling needed.</span>
              </div>
            ) : activeAsmt.settings.openDate ? (
              <div className="flex flex-col gap-2">
                <ScheduleRow label="Opens" value={formatDateTime(activeAsmt.settings.openDate)} />
                {activeAsmt.settings.closeDate && (
                  <ScheduleRow label="Closes" value={formatDateTime(activeAsmt.settings.closeDate)} />
                )}
                {activeAsmt.settings.type === 'Exam' && (
                  <ScheduleRow
                    label="Download from"
                    value={activeAsmt.settings.openDate
                      ? formatDateTime(new Date(new Date(activeAsmt.settings.openDate).getTime() - activeAsmt.settings.downloadWindowHours * 3600000).toISOString())
                      : '—'}
                  />
                )}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No schedule set — go back to Step 1 to add dates.</p>
            )}
          </div>

          {/* Approval */}
          <ApprovalPanel
            status={activeAsmt.settings.status ?? 'draft'}
            reviewRequest={activeAsmt.settings.reviewRequest ?? null}
            onSendForReview={onSendToChair}
            onPublish={onPublish}
          />
        </div>

        {/* Blooms */}
        {bloomsMetrics.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">
              Bloom&apos;s taxonomy coverage
            </p>
            <div className="flex flex-col gap-2">
              {bloomsMetrics.map(b => (
                <div key={b.level} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{b.level}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{
                        width: `${b.pct}%`,
                        backgroundColor: 'var(--brand-color)',
                        opacity: 0.7,
                        transition: 'width .3s',
                      }}
                    />
                  </div>
                  <span className="text-xs text-foreground font-medium tabular-nums w-8 text-right">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty state */}
        {totalQ === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <i className="fa-light fa-clipboard-list text-muted-foreground text-2xl mb-3 block" aria-hidden="true" />
            <p className="text-sm text-muted-foreground">No questions selected yet. Go back to Build to add questions.</p>
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
      >
        <Button variant="ghost" size="sm" onClick={onBack} className="gap-1.5">
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          Back to Build
        </Button>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={onSaveAsDraft} className="gap-1.5">
            <i className="fa-light fa-floppy-disk" aria-hidden="true" />
            Save as draft
          </Button>
          <Button size="sm" onClick={onSendToChair} className="gap-1.5">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Send to chair
          </Button>
        </div>
      </div>
    </div>
  )
}

// ── ReviewStep helpers ────────────────────────────────────────────────────────

function ScheduleRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <span className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
      <span className="text-xs text-foreground">{value}</span>
    </div>
  )
}

function formatDateTime(iso: string): string {
  try {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit', timeZoneName: 'short' }).format(new Date(iso))
  } catch { return iso }
}

function InstructionsPreview({ text, requireAck }: { text: string; requireAck: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((e) => !e)}
        className="flex items-center justify-between w-full px-5 py-3 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <i
            className="fa-light fa-file-lines"
            aria-hidden="true"
            style={{ color: 'var(--brand-color)', fontSize: 13 }}
          />
          <span className="text-xs font-semibold text-foreground">
            Pre-exam instructions configured
          </span>
          {requireAck && (
            <Badge variant="outline" className="text-[10px]">
              Acknowledgment required
            </Badge>
          )}
        </div>
        <i
          className={`fa-light ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted-foreground`}
          aria-hidden="true"
          style={{ fontSize: 10 }}
        />
      </button>
      {expanded && (
        <div className="px-5 pb-4 border-t border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 pt-3">
            Students will see:
          </p>
          <div
            className="rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap"
            style={{ background: 'var(--muted)', fontSize: 13 }}
          >
            {text}
          </div>
          {requireAck && (
            <div className="flex items-center gap-2 mt-3 opacity-60">
              <div
                style={{
                  width: 16,
                  height: 16,
                  borderRadius: 4,
                  border: '1.5px solid var(--border)',
                  background: 'var(--background)',
                }}
              />
              <span className="text-xs text-muted-foreground">
                I have read and understood the above instructions
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

function ApprovalPanel({ status, reviewRequest, onSendForReview, onPublish }: {
  status: AssessmentStatus
  reviewRequest: AssessmentReviewRequest | null
  onSendForReview: () => void
  onPublish: () => void
}) {
  const [showPublishWarning, setShowPublishWarning] = useState(false)

  const statusLabel: Record<AssessmentStatus, string> = {
    draft: 'Draft',
    'pending-review': 'Pending review',
    'changes-requested': 'Changes requested',
    approved: 'Approved',
    scheduled: 'Scheduled',
    live: 'Live',
    completed: 'Completed',
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Approval</p>
        <span
          className="text-xs font-medium px-2 py-0.5 rounded-full"
          style={{
            background: status === 'approved'
              ? 'color-mix(in oklch, var(--chart-2) 12%, var(--background))'
              : 'var(--muted)',
            color: status === 'approved' ? 'var(--chart-2)' : 'var(--muted-foreground)',
          }}
        >
          {statusLabel[status]}
        </span>
      </div>

      {status === 'draft' && (
        <p className="text-xs text-muted-foreground leading-relaxed">
          Send to a chair or senior faculty for review before publishing. This is optional but recommended for high-stakes exams.
        </p>
      )}

      {reviewRequest && (
        <div className="text-xs text-muted-foreground flex flex-col gap-1">
          <span>
            Sent to{' '}
            {reviewRequest.reviewerIds
              .map(id => facultyListRows.find(f => f.id === id)?.fullName ?? id)
              .join(', ')}
          </span>
          {reviewRequest.dueDate && (
            <span>Due {formatDateTime(reviewRequest.dueDate)}</span>
          )}
        </div>
      )}

      <div className="flex flex-col gap-2">
        {status === 'draft' && (
          <Button variant="outline" size="sm" onClick={onSendForReview} className="gap-1.5 justify-center">
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Send for review
          </Button>
        )}

        {showPublishWarning ? (
          <div
            className="rounded-lg px-3 py-2.5 text-xs"
            style={{ background: 'color-mix(in oklch, oklch(80% 0.15 80) 8%, var(--background))', border: '1px solid color-mix(in oklch, oklch(80% 0.15 80) 25%, transparent)' }}
          >
            <p className="text-foreground font-medium mb-1">This assessment hasn&apos;t been reviewed.</p>
            <p className="text-muted-foreground mb-2">Most programs get chair approval before high-stakes exams. You can still publish.</p>
            <Button variant="default" size="sm" onClick={onPublish} className="w-full">
              Publish anyway
            </Button>
          </div>
        ) : (
          <Button
            variant={status === 'approved' ? 'default' : 'ghost'}
            size="sm"
            onClick={() => status === 'approved' ? onPublish() : setShowPublishWarning(true)}
            className="gap-1.5 justify-center"
          >
            <i className="fa-light fa-rocket-launch" aria-hidden="true" />
            {status === 'approved' ? 'Publish' : 'Publish without review'}
          </Button>
        )}
      </div>
    </div>
  )
}

// ── Selected questions outline (Step 2 left panel) ───────────────────────────

function SelectedQuestionsOutline({
  activeAsmt,
  onRemove,
}: {
  activeAsmt: import('@/lib/qb-types').AssessmentDraft
  onRemove: (questionId: string) => void
}) {
  const orderedQuestions = [...activeAsmt.questions].sort((a, b) => a.order - b.order)

  type DisplayItem =
    | { kind: 'section'; id: string; title: string; count: number }
    | { kind: 'question'; questionId: string; order: number; question: import('@/lib/qb-types').Question | undefined }

  const displayItems: DisplayItem[] = []

  if (activeAsmt.sections.length === 0) {
    orderedQuestions.forEach(aq => {
      displayItems.push({
        kind: 'question',
        questionId: aq.questionId,
        order: aq.order,
        question: MOCK_QB_QUESTIONS.find(q => q.id === aq.questionId),
      })
    })
  } else {
    const assignedIds = new Set(activeAsmt.sections.flatMap(s => s.questionIds))
    activeAsmt.sections.forEach(section => {
      const sectionQs = orderedQuestions.filter(aq => section.questionIds.includes(aq.questionId))
      displayItems.push({ kind: 'section', id: section.id, title: section.title, count: sectionQs.length })
      sectionQs.forEach(aq => {
        displayItems.push({
          kind: 'question',
          questionId: aq.questionId,
          order: aq.order,
          question: MOCK_QB_QUESTIONS.find(q => q.id === aq.questionId),
        })
      })
    })
    const unassigned = orderedQuestions.filter(aq => !assignedIds.has(aq.questionId))
    if (unassigned.length > 0) {
      displayItems.push({ kind: 'section', id: '__unassigned', title: 'Unassigned', count: unassigned.length })
      unassigned.forEach(aq => {
        displayItems.push({
          kind: 'question',
          questionId: aq.questionId,
          order: aq.order,
          question: MOCK_QB_QUESTIONS.find(q => q.id === aq.questionId),
        })
      })
    }
  }

  return (
    <aside style={{
      width: 210, minWidth: 210, borderRight: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'var(--card)',
    }}>
      <div style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
        <p className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground">
          Selected · {activeAsmt.questions.length}
        </p>
      </div>

      <div style={{ flex: 1, overflowY: 'auto', padding: '0 6px 10px' }}>
        {displayItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-3">
            <i className="fa-light fa-clipboard-list text-muted-foreground text-xl mb-2" aria-hidden="true" />
            <p className="text-xs text-muted-foreground leading-snug">
              Pick questions from the panel →
            </p>
          </div>
        ) : (
          displayItems.map((item, idx) => {
            if (item.kind === 'section') {
              return (
                <div key={`section-${item.id}-${idx}`} className="mt-3 mb-1 px-2">
                  <p className="text-[9px] font-bold uppercase tracking-[0.1em] text-muted-foreground">
                    {item.title} ({item.count})
                  </p>
                </div>
              )
            }

            return (
              <div
                key={item.questionId}
                className="flex items-start gap-1.5 rounded-md px-2 py-1.5 group hover:bg-muted/40 transition-colors"
              >
                <span className="text-[10px] text-muted-foreground tabular-nums shrink-0 mt-0.5 w-4 text-right">
                  {item.order}.
                </span>
                <p
                  className="text-[11px] text-foreground leading-snug flex-1 min-w-0"
                  style={{
                    display: '-webkit-box',
                    WebkitLineClamp: 2,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden',
                  }}
                >
                  {item.question?.title ?? item.questionId}
                </p>
                <button
                  type="button"
                  onClick={() => onRemove(item.questionId)}
                  aria-label="Remove question"
                  className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                  style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted-foreground)', marginTop: 1 }}
                >
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                </button>
              </div>
            )
          })
        )}
      </div>
    </aside>
  )
}

// ── Metrics panel (Step 2 right panel) ───────────────────────────────────────

function MetricsPanel({
  distribution,
  timeMetrics,
  overtimeMetrics,
  durationMinutes,
  bloomsMetrics,
}: {
  distribution: { Easy: number; Medium: number; Hard: number }
  timeMetrics: { totalMin: number; avgMin: number }
  overtimeMetrics: { allottedMin: number; delta: number; pct: number } | null
  durationMinutes: number
  bloomsMetrics: { level: string; count: number; pct: number }[]
}) {
  const total = distribution.Easy + distribution.Medium + distribution.Hard
  const bars = [
    { label: 'Easy',   short: 'E', count: distribution.Easy,   color: 'var(--qb-diff-bar-easy)'   },
    { label: 'Medium', short: 'M', count: distribution.Medium, color: 'var(--qb-diff-bar-medium)' },
    { label: 'Hard',   short: 'H', count: distribution.Hard,   color: 'var(--qb-diff-bar-hard)'   },
  ]
  const maxCount = Math.max(...bars.map(b => b.count), 1)

  const overtime = overtimeMetrics ? (() => {
    const { delta } = overtimeMetrics
    if (delta > 0)  return { label: `+${Math.round(delta)} min over`, color: 'var(--chart-5)' }
    if (delta > -5) return { label: 'Tight fit',                      color: 'var(--chart-4)' }
    return               { label: 'On time',                          color: 'var(--qb-trust-senior-color)' }
  })() : null

  return (
    <aside style={{
      width: 220, minWidth: 220, borderLeft: '1px solid var(--border)',
      display: 'flex', flexDirection: 'column', overflow: 'hidden',
      background: 'var(--card)', padding: '14px 16px', gap: 16,
    }}>
      {/* Question count */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground mb-1">Questions</p>
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-xs text-muted-foreground">
          {durationMinutes} min
          {timeMetrics.avgMin > 0 ? ` · ~${Math.round(timeMetrics.avgMin * 10) / 10} min/Q` : ''}
        </p>
        {overtime && (
          <p className="text-xs mt-0.5 font-medium" style={{ color: overtime.color }}>{overtime.label}</p>
        )}
      </div>

      {/* Difficulty distribution */}
      <div>
        <p className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground mb-2">Difficulty</p>
        <div className="flex items-end gap-3 h-14">
          {bars.map(bar => (
            <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-[10px] font-semibold" style={{ color: bar.color }}>
                {bar.count > 0 ? bar.count : ''}
              </span>
              <div style={{
                width: '100%', borderRadius: '3px 3px 0 0',
                background: bar.color,
                height: bar.count === 0 ? 3 : `${(bar.count / maxCount) * 36}px`,
                opacity: bar.count === 0 ? 0.2 : 1,
                transition: 'height .2s',
              }} />
              <span className="text-[10px] text-muted-foreground">{bar.short}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Blooms */}
      {bloomsMetrics.length > 0 && (
        <div>
          <p className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground mb-2">Bloom&apos;s</p>
          <div className="flex flex-col gap-1.5">
            {bloomsMetrics.slice(0, 5).map(b => (
              <div key={b.level} className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${b.pct}%`, backgroundColor: 'var(--brand-color)', opacity: 0.7, transition: 'width .3s' }}
                  />
                </div>
                <span className="text-[10px] text-muted-foreground w-[60px] truncate">{b.level}</span>
                <span className="text-[10px] tabular-nums text-foreground w-6 text-right">{b.pct}%</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {bloomsMetrics.length === 0 && total === 0 && (
        <p className="text-xs text-muted-foreground">Select questions to see metrics.</p>
      )}
    </aside>
  )
}

// ── Details step (wizard step 1) ─────────────────────────────────────────────

function DetailsStep({
  activeAsmt,
  mockCoursesLocal,
  mockCourseOfferingsLocal,
  courseId,
  offeringId,
  onCourseChange,
  onOfferingChange,
  onUpdate,
  onContinue,
  onCancel,
}: {
  activeAsmt: import('@/lib/qb-types').AssessmentDraft | null
  mockCoursesLocal: { id: string; name: string; code: string }[]
  mockCourseOfferingsLocal: { id: string; courseId: string; semester: string }[]
  courseId: string
  offeringId: string
  onCourseChange: (id: string) => void
  onOfferingChange: (id: string) => void
  onUpdate: (patch: Partial<import('@/lib/qb-types').AssessmentDraft>) => void
  onContinue: () => void
  onCancel: () => void
}) {
  const name     = activeAsmt?.title ?? ''
  const settings = activeAsmt?.settings ?? defaultAssessmentSettings('Exam')
  const duration = activeAsmt?.durationMinutes ?? 90

  const TYPES: { type: import('@/lib/qb-types').AssessmentType; icon: string; description: string }[] = [
    { type: 'Exam',       icon: 'fa-file-certificate',  description: 'Timed, scheduled, downloadable' },
    { type: 'Quiz',       icon: 'fa-clipboard-question', description: 'Lighter, still timed' },
    { type: 'Pop Quiz',   icon: 'fa-bolt',               description: 'Live start/stop in class' },
    { type: 'Assignment', icon: 'fa-pen-ruler',          description: 'Due-date based, no QB structure' },
  ]

  const [newSectionTitle, setNewSectionTitle] = useState('')
  const [addingSec, setAddingSec] = useState(false)
  const sections = activeAsmt?.sections ?? []
  const activeFaculty = useMemo(() => facultyListRows.filter(f => f.status === 'active'), [])

  const thisCourseForDetails = mockCourses.find(c => c.id === courseId)
  const sectionContentAreas = useMemo<FolderNode[]>(
    () => thisCourseForDetails
      ? MOCK_QB_FOLDERS.filter(f => f.parentId === thisCourseForDetails.questionBankFolderId)
      : [],
    [thisCourseForDetails]
  )

  function addSection() {
    const title = newSectionTitle.trim()
    if (!title) return
    onUpdate({
      sections: [...sections, { id: `sec-${Date.now()}`, title, questionIds: [] }],
    })
    setNewSectionTitle('')
    setAddingSec(false)
  }

  function removeSection(id: string) {
    onUpdate({ sections: sections.filter(s => s.id !== id) })
  }

  function patchSettings(patch: Partial<import('@/lib/qb-types').AssessmentSettings>) {
    onUpdate({ settings: { ...settings, ...patch } })
  }

  function Toggle({ checked, onChange, label, description }: { checked: boolean; onChange: (v: boolean) => void; label: string; description: string }) {
    return (
      <div className="flex items-center justify-between gap-4">
        <div className="min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={checked}
          aria-label={label}
          onClick={() => onChange(!checked)}
          style={{
            width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
            backgroundColor: checked ? 'var(--brand-color)' : 'var(--muted)',
            position: 'relative', transition: 'background-color .15s',
          }}
        >
          <span style={{
            position: 'absolute', top: 2, left: checked ? 18 : 2,
            width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)',
            transition: 'left .15s', display: 'block',
          }} />
        </button>
      </div>
    )
  }

  function SectionContentAreaSelect({
    selectedIds: selectedCaIds,
    onChange,
  }: {
    selectedIds: string[]
    onChange: (ids: string[]) => void
  }) {
    if (sectionContentAreas.length === 0) return null
    function toggle(id: string) {
      onChange(selectedCaIds.includes(id)
        ? selectedCaIds.filter(x => x !== id)
        : [...selectedCaIds, id])
    }
    return (
      <div className="flex flex-wrap gap-1">
        {sectionContentAreas.map(ca => {
          const selected = selectedCaIds.includes(ca.id)
          return (
            <button
              key={ca.id}
              type="button"
              onClick={() => toggle(ca.id)}
              aria-pressed={selected}
              className="text-xs px-2 py-0.5 rounded-full border transition-colors"
              style={{
                background: selected ? 'var(--muted)' : 'transparent',
                borderColor: selected ? 'var(--foreground)' : 'var(--border)',
                color: selected ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: selected ? 600 : 400,
                cursor: 'pointer',
              }}
            >
              {ca.name}
            </button>
          )
        })}
      </div>
    )
  }

  const offerings = mockCourseOfferingsLocal.filter(o => o.courseId === courseId)
  const canContinue = name.trim().length > 0

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* Course + Offering context bar */}
      <div
        className="flex items-center gap-4 px-6 py-3 shrink-0"
        style={{ borderBottom: '1px solid var(--border)', backgroundColor: 'var(--muted)' }}
      >
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Course</span>
          <select
            value={courseId}
            onChange={e => onCourseChange(e.target.value)}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', padding: '4px 8px', cursor: 'pointer' }}
          >
            {mockCoursesLocal.map(c => (
              <option key={c.id} value={c.id}>{c.code} · {c.name}</option>
            ))}
          </select>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-muted-foreground">Offering</span>
          <select
            value={offeringId}
            onChange={e => onOfferingChange(e.target.value)}
            style={{ fontSize: 13, borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', padding: '4px 8px', cursor: 'pointer' }}
          >
            {offerings.map(o => (
              <option key={o.id} value={o.id}>{o.semester}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Main 2-col form */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-2 gap-8 px-8 py-8 max-w-5xl mx-auto w-full">
        {/* Left — identity */}
        <div className="flex flex-col gap-5">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Assessment name *</p>
            <input
              type="text"
              aria-label="Assessment name"
              value={name}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="e.g. Midterm Exam"
              autoFocus
              style={{
                width: '100%', height: 44, padding: '0 14px', fontSize: 16, fontWeight: 500,
                border: '1px solid var(--border)', borderRadius: 10,
                background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">
              Description <span className="font-normal normal-case tracking-normal text-[11px]">— optional, shown to students before they start</span>
            </p>
            <textarea
              aria-label="Description"
              placeholder="Brief context about what this assessment covers…"
              rows={5}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14, lineHeight: '1.5',
                border: '1px solid var(--border)', borderRadius: 10, resize: 'vertical',
                background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
              }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
              onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; (e.target as HTMLTextAreaElement).style.boxShadow = 'none' }}
            />
          </div>
        </div>

        {/* Right — settings */}
        <div className="flex flex-col gap-5">
          {/* Type */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Type *</p>
            <div className="grid grid-cols-2 gap-2" role="radiogroup" aria-label="Assessment type">
              {TYPES.map(({ type, icon, description }) => {
                const active = settings.type === type
                return (
                  <Button
                    key={type}
                    variant="ghost"
                    size="sm"
                    onClick={() => patchSettings({ type })}
                    aria-pressed={active}
                    className="h-auto flex-col items-start text-left px-3 py-2.5 gap-1"
                    style={{
                      border: `1px solid ${active ? 'color-mix(in oklch, var(--brand-color) 55%, transparent)' : 'var(--border)'}`,
                      background: active ? 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <i className={`fa-light ${icon}`} aria-hidden="true" style={{ color: active ? 'var(--brand-color)' : 'var(--muted-foreground)', fontSize: 13 }} />
                      <span className="text-xs font-semibold text-foreground">{type}</span>
                    </div>
                    <p className="text-[10px] text-muted-foreground">{description}</p>
                  </Button>
                )
              })}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Duration</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
                aria-label="Duration in minutes"
                min={5}
                max={300}
                value={duration}
                onChange={e => {
                  const v = parseInt(e.target.value)
                  if (!isNaN(v) && v >= 5) onUpdate({ durationMinutes: v })
                }}
                style={{
                  width: 80, height: 36, padding: '0 10px', fontSize: 14, textAlign: 'center',
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
                }}
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
                onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          {/* Password */}
          <div className="flex flex-col gap-2">
            <Toggle
              checked={settings.passwordRequired}
              onChange={v => patchSettings({ passwordRequired: v })}
              label="Password required"
              description="Students enter a password to unlock the exam."
            />
            {settings.passwordRequired && (
              <input
                type="text"
                placeholder="Set exam password…"
                value={settings.password}
                onChange={e => patchSettings({ password: e.target.value })}
                style={{
                  height: 36, padding: '0 12px', fontSize: 13,
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--background)', color: 'var(--foreground)', outline: 'none', width: '100%',
                }}
              />
            )}
          </div>

          <Separator />

          {/* Sections */}
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Sections</p>
              <p className="text-[10px] text-muted-foreground">
                Multi-faculty or case-study preread
              </p>
            </div>

            {sections.length > 0 && (
              <div className="flex flex-col gap-1.5">
                {sections.map(sec => (
                  <div
                    key={sec.id}
                    className="flex flex-col gap-1.5 px-3 py-2.5 rounded-lg"
                    style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
                  >
                    <div className="flex items-center gap-2">
                      <i className="fa-light fa-layer-group" aria-hidden="true" style={{ fontSize: 12, color: 'var(--muted-foreground)' }} />
                      <span className="flex-1 text-sm text-foreground truncate">{sec.title}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeSection(sec.id)}
                        aria-label={`Remove section ${sec.title}`}
                        className="h-6 w-6 p-0 shrink-0"
                      >
                        <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
                      </Button>
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs text-muted-foreground w-20 shrink-0">Assigned to</span>
                      <Select
                        value={sec.facultyId ?? '__none__'}
                        onValueChange={val => onUpdate({
                          sections: sections.map(s =>
                            s.id === sec.id ? { ...s, facultyId: val === '__none__' ? undefined : val } : s
                          ),
                        })}
                      >
                        <SelectTrigger className="h-7 text-xs flex-1" aria-label={`Assign faculty to section ${sec.title}`}>
                          <SelectValue placeholder="Assign faculty…" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="__none__">
                            <span className="text-muted-foreground">Unassigned</span>
                          </SelectItem>
                          {activeFaculty.map(f => (
                            <SelectItem key={f.id} value={f.id}>
                              {f.fullName}
                              <span className="text-muted-foreground ml-1.5 text-xs">· {f.adminPosition}</span>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Content area targeting */}
                    {sectionContentAreas.length > 0 && (
                      <div className="flex flex-col gap-1">
                        <span className="text-xs text-muted-foreground">Content areas</span>
                        <SectionContentAreaSelect
                          selectedIds={sec.contentAreaIds ?? []}
                          onChange={ids => onUpdate({
                            sections: sections.map(s =>
                              s.id === sec.id ? { ...s, contentAreaIds: ids } : s
                            ),
                          })}
                        />
                      </div>
                    )}

                    {/* Per-section randomize toggle */}
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-foreground">Randomize questions</p>
                        <p className="text-xs text-muted-foreground">Shuffle order within this section</p>
                      </div>
                      <button
                        type="button"
                        role="switch"
                        aria-checked={sec.randomize ?? false}
                        aria-label={`Randomize questions in section ${sec.title}`}
                        onClick={() => onUpdate({
                          sections: sections.map(s =>
                            s.id === sec.id ? { ...s, randomize: !(s.randomize ?? false) } : s
                          ),
                        })}
                        style={{
                          width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', flexShrink: 0,
                          backgroundColor: (sec.randomize ?? false) ? 'var(--foreground)' : 'var(--muted)',
                          position: 'relative', transition: 'background-color .15s',
                        }}
                      >
                        <span style={{
                          position: 'absolute', top: 1, left: (sec.randomize ?? false) ? 15 : 1,
                          width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)',
                          transition: 'left .15s', display: 'block',
                        }} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {addingSec ? (
              <div className="flex items-center gap-2">
                <input
                  aria-label="Section name"
                  autoFocus
                  value={newSectionTitle}
                  onChange={e => setNewSectionTitle(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') addSection()
                    if (e.key === 'Escape') { setAddingSec(false); setNewSectionTitle('') }
                  }}
                  placeholder="Section name…"
                  maxLength={60}
                  style={{
                    flex: 1, height: 36, padding: '0 10px', fontSize: 13,
                    border: '1px solid var(--brand-color)', borderRadius: 8,
                    background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
                  }}
                />
                <Button variant="default" size="sm" onClick={addSection} style={{ height: 36 }}>Add</Button>
                <Button variant="ghost" size="sm" onClick={() => { setAddingSec(false); setNewSectionTitle('') }} style={{ height: 36 }}>
                  <i className="fa-light fa-xmark" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setAddingSec(true)}
                className="gap-1.5 self-start"
              >
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add section
              </Button>
            )}
          </div>

          {/* Delivery Settings */}
          <div className="flex flex-col gap-4" style={{ borderTop: '1px solid var(--border)', paddingTop: 16 }}>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Delivery</p>

            {settings.type === 'Pop Quiz' ? (
              <div
                className="flex items-start gap-3 rounded-lg px-3 py-2.5 text-xs"
                style={{ background: 'color-mix(in oklch, var(--brand-color) 6%, var(--background))', border: '1px solid var(--border)' }}
              >
                <i className="fa-light fa-bolt mt-0.5 shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                <span className="text-muted-foreground">Pop quizzes are started live in class — no scheduling needed. Students see it the moment you start it.</span>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Opens</p>
                  <input
                    type="datetime-local"
                    aria-label="Opens"
                    value={settings.openDate?.slice(0, 16) ?? ''}
                    onChange={e => patchSettings({ openDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                  />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Closes</p>
                  <input
                    type="datetime-local"
                    aria-label="Closes"
                    value={settings.closeDate?.slice(0, 16) ?? ''}
                    onChange={e => patchSettings({ closeDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            )}

            {settings.type === 'Exam' && (
              <div>
                <p className="text-xs text-muted-foreground mb-1">Download window</p>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-muted-foreground">Students can pre-download</span>
                  <input
                    type="number"
                    aria-label="Download window in hours"
                    min={1}
                    max={168}
                    value={settings.downloadWindowHours}
                    onChange={e => patchSettings({ downloadWindowHours: Math.max(1, parseInt(e.target.value) || 24) })}
                    style={{ width: 60, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                  />
                  <span className="text-xs text-muted-foreground">hours before exam start</span>
                </div>
              </div>
            )}

            <Toggle
              checked={settings.randomize}
              onChange={v => patchSettings({ randomize: v })}
              label="Randomize question order"
              description="Students see questions in a different sequence"
            />
            <Toggle
              checked={settings.randomizeOptions}
              onChange={v => patchSettings({ randomizeOptions: v })}
              label="Randomize option order"
              description="Shuffle answer choices within each question"
            />

            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Pre-exam instructions (optional)</p>
              <textarea
                aria-label="Pre-exam instructions"
                value={settings.instructionsText}
                onChange={e => patchSettings({ instructionsText: e.target.value })}
                placeholder="Academic integrity statement, exam rules, or any instructions students see before they start…"
                rows={3}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
                onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 2px color-mix(in oklch, var(--brand-color) 25%, transparent)' }}
                onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)'; (e.target as HTMLTextAreaElement).style.boxShadow = 'none' }}
              />
              {settings.instructionsText.trim() && (
                <Toggle
                  checked={settings.requireAcknowledgment}
                  onChange={v => patchSettings({ requireAcknowledgment: v })}
                  label="Require student acknowledgment"
                  description="Students must check a box before starting"
                />
              )}
            </div>

            <Toggle
              checked={settings.showRationaleAfter}
              onChange={v => patchSettings({ showRationaleAfter: v })}
              label="Show rationale after submission"
              description="Students see the correct answer and rationale after submitting."
            />
          </div>
        </div>
      </div>

      {/* Footer */}
      <div
        className="flex items-center justify-between px-8 py-4 shrink-0"
        style={{ borderTop: '1px solid var(--border)', background: 'var(--card)' }}
      >
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button size="sm" disabled={!canContinue} onClick={onContinue} className="gap-1.5">
          Continue
          <i className="fa-light fa-arrow-right" aria-hidden="true" />
        </Button>
      </div>
    </div>
  )
}

// ── Wizard header ─────────────────────────────────────────────────────────────

function WizardHeader({
  activeStep,
  onStepClick,
  assessmentName,
  courseLabel,
  onSaveDraft,
  canSave,
}: {
  activeStep: 1 | 2 | 3
  onStepClick: (step: 1 | 2 | 3) => void
  assessmentName: string
  courseLabel: string
  onSaveDraft: () => void
  canSave: boolean
}) {
  const STEPS: { id: 1 | 2 | 3; label: string; icon: string }[] = [
    { id: 1, label: 'Details',  icon: 'fa-circle-info' },
    { id: 2, label: 'Build',    icon: 'fa-books' },
    { id: 3, label: 'Review',   icon: 'fa-circle-check' },
  ]

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 20px',
        height: 52,
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)',
        flexShrink: 0,
        gap: 16,
      }}
    >
      {/* Left: breadcrumb */}
      <div className="flex items-center gap-2 min-w-0 shrink-0">
        <span className="text-xs text-muted-foreground truncate hidden sm:block">{courseLabel}</span>
        {courseLabel && <i className="fa-light fa-chevron-right text-[10px] text-muted-foreground hidden sm:block" aria-hidden="true" />}
        <span className="text-sm font-semibold text-foreground truncate max-w-[160px]">
          {assessmentName || 'New Assessment'}
        </span>
      </div>

      {/* Center: step indicators */}
      <div className="flex items-center gap-1" role="tablist" aria-label="Assessment wizard steps">
        {STEPS.map((step, idx) => {
          const isActive    = activeStep === step.id
          const isCompleted = activeStep > step.id
          const isClickable = step.id < activeStep

          return (
            <React.Fragment key={step.id}>
              {idx > 0 && (
                <div
                  style={{
                    width: 32, height: 1,
                    backgroundColor: isCompleted ? 'var(--brand-color)' : 'var(--border)',
                    transition: 'background-color .2s',
                  }}
                />
              )}
              <button
                type="button"
                role="tab"
                aria-selected={isActive}
                onClick={() => isClickable && onStepClick(step.id)}
                disabled={!isClickable && !isActive}
                className="focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded-full"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: isActive ? 'var(--brand-color)' : isCompleted ? 'var(--brand-color)' : 'var(--border)',
                  background: isActive
                    ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))'
                    : isCompleted ? 'color-mix(in oklch, var(--brand-color) 6%, var(--background))'
                    : 'transparent',
                  color: isActive ? 'var(--brand-color)' : isCompleted ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  cursor: isClickable ? 'pointer' : 'default',
                  opacity: (!isClickable && !isActive) ? 0.45 : 1,
                  transition: 'all .15s',
                }}
              >
                <i
                  className={`fa-light ${isCompleted ? 'fa-circle-check' : step.icon} text-xs`}
                  aria-hidden="true"
                />
                <span>{step.label}</span>
              </button>
            </React.Fragment>
          )
        })}
      </div>

      {/* Right: save draft */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="outline"
          size="sm"
          onClick={onSaveDraft}
          disabled={!canSave}
          className="gap-1.5"
        >
          <i className="fa-light fa-floppy-disk" aria-hidden="true" />
          Save draft
        </Button>
      </div>
    </div>
  )
}

// ── Assessment settings sheet ─────────────────────────────────────────────────

function AssessmentSettingsSheet({
  open,
  onOpenChange,
  settings,
  onSave,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  settings: import('@/lib/qb-types').AssessmentSettings
  onSave: (s: import('@/lib/qb-types').AssessmentSettings) => void
}) {
  const [local, setLocal] = React.useState(settings)

  React.useEffect(() => { setLocal(settings) }, [settings])

  function toggleField(key: 'passwordRequired' | 'randomize' | 'showRationaleAfter') {
    setLocal(prev => ({ ...prev, [key]: !prev[key] }))
  }

  const TYPES: import('@/lib/qb-types').AssessmentType[] = ['Exam', 'Quiz', 'Assignment']

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: 360, maxWidth: '90vw' }}>
        <SheetHeader>
          <SheetTitle>Assessment Settings</SheetTitle>
        </SheetHeader>

        <div className="flex flex-col gap-5 mt-6">
          {/* Assessment type */}
          <div className="flex flex-col gap-2">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Type</p>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  aria-pressed={local.type === t}
                  onClick={() => setLocal(prev => ({ ...prev, type: t }))}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
                  style={{
                    borderColor: local.type === t ? 'var(--brand-color)' : 'var(--border)',
                    backgroundColor: local.type === t
                      ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))'
                      : 'transparent',
                    color: local.type === t ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <Separator />

          {/* Password */}
          <div className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-4">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Password required</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students enter a password to unlock the exam.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.passwordRequired}
                aria-label="Toggle password required"
                onClick={() => toggleField('passwordRequired')}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                  backgroundColor: local.passwordRequired ? 'var(--brand-color)' : 'var(--muted)',
                  position: 'relative', transition: 'background-color .15s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2,
                  left: local.passwordRequired ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%',
                  backgroundColor: 'var(--background)',
                  transition: 'left .15s',
                  display: 'block',
                }} />
              </button>
            </div>
            {local.passwordRequired && (
              <input
                type="text"
                placeholder="Set exam password…"
                value={local.password}
                onChange={e => setLocal(prev => ({ ...prev, password: e.target.value }))}
                style={{
                  height: 36, padding: '0 12px', fontSize: 13,
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
                }}
              />
            )}
          </div>

          <Separator />

          {/* Randomize */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Randomize question order</p>
              <p className="text-xs text-muted-foreground mt-0.5">Each student sees questions in a different order.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={local.randomize}
              aria-label="Toggle randomize question order"
              onClick={() => toggleField('randomize')}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                backgroundColor: local.randomize ? 'var(--brand-color)' : 'var(--muted)',
                position: 'relative', transition: 'background-color .15s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: local.randomize ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: 'var(--background)',
                transition: 'left .15s',
                display: 'block',
              }} />
            </button>
          </div>

          <Separator />

          {/* Show rationale */}
          <div className="flex items-center justify-between gap-4">
            <div className="min-w-0">
              <p className="text-sm font-medium text-foreground">Show rationale after submission</p>
              <p className="text-xs text-muted-foreground mt-0.5">Students see the correct answer and rationale after submitting.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={local.showRationaleAfter}
              aria-label="Toggle show rationale after submission"
              onClick={() => toggleField('showRationaleAfter')}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0,
                backgroundColor: local.showRationaleAfter ? 'var(--brand-color)' : 'var(--muted)',
                position: 'relative', transition: 'background-color .15s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2,
                left: local.showRationaleAfter ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%',
                backgroundColor: 'var(--background)',
                transition: 'left .15s',
                display: 'block',
              }} />
            </button>
          </div>
        </div>

        <SheetFooter className="mt-8">
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button size="sm" onClick={() => { onSave(local); onOpenChange(false) }}>Save settings</Button>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Sections panel ────────────────────────────────────────────────────────────

function SectionsPanel({
  activeAsmt,
  onAddSection,
  onRemoveSection,
  onAssignQuestion,
}: {
  activeAsmt: AssessmentDraft
  onAddSection: (title: string) => void
  onRemoveSection: (id: string) => void
  onAssignQuestion: (questionId: string, sectionId: string | null) => void
}) {
  const [newTitle, setNewTitle] = useState('')

  const unassigned = activeAsmt.questions.filter(
    q => !activeAsmt.sections.some(s => s.questionIds.includes(q.questionId))
  )

  function submit() {
    const t = newTitle.trim()
    if (!t) return
    onAddSection(t)
    setNewTitle('')
  }

  return (
    <div style={{ width: 280, minWidth: 280, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden', background: 'var(--card)' }}>
      <div className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground" style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
        Sections
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 10px 10px' }}>
        {unassigned.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
              Unassigned ({unassigned.length})
            </p>
            <div className="rounded-lg border border-dashed border-border p-2 flex flex-col gap-1">
              {unassigned.slice(0, 6).map(q => {
                const question = MOCK_QB_QUESTIONS.find(mq => mq.id === q.questionId)
                return (
                  <div key={q.questionId} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <i className="fa-light fa-grip-dots-vertical shrink-0" aria-hidden="true" style={{ fontSize: 10 }} />
                    <span className="truncate flex-1">{question?.title ?? q.questionId}</span>
                    {activeAsmt.sections.length > 0 && (
                      <select
                        aria-label="Assign to section"
                        value=""
                        onChange={e => {
                          if (e.target.value) onAssignQuestion(q.questionId, e.target.value)
                        }}
                        style={{ fontSize: 10, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', padding: '1px 4px', maxWidth: 80, cursor: 'pointer' }}
                      >
                        <option value="">Assign…</option>
                        {activeAsmt.sections.map(s => (
                          <option key={s.id} value={s.id}>{s.title}</option>
                        ))}
                      </select>
                    )}
                  </div>
                )
              })}
              {unassigned.length > 6 && (
                <p className="text-[10px] text-muted-foreground px-1">+{unassigned.length - 6} more</p>
              )}
            </div>
          </div>
        )}

        {activeAsmt.sections.map((section, idx) => (
          <div key={section.id} className="mb-3">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">
                {idx + 1}. {section.title} ({section.questionIds.length})
              </p>
              <button
                type="button"
                onClick={() => onRemoveSection(section.id)}
                aria-label={`Remove section ${section.title}`}
                style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2, color: 'var(--muted-foreground)' }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="rounded-lg border border-border p-2 flex flex-col gap-1 min-h-[40px]"
              style={{ background: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}>
              {section.questionIds.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic px-1">No questions assigned yet</p>
              ) : (
                section.questionIds.slice(0, 4).map(qId => {
                  const question = MOCK_QB_QUESTIONS.find(mq => mq.id === qId)
                  return (
                    <div key={qId} className="flex items-center gap-2 text-xs text-foreground">
                      <i className="fa-light fa-circle-dot shrink-0" aria-hidden="true" style={{ fontSize: 9, color: 'var(--brand-color)' }} />
                      <span className="truncate">{question?.title ?? qId}</span>
                    </div>
                  )
                })
              )}
              {section.questionIds.length > 4 && (
                <p className="text-[10px] text-muted-foreground px-1">+{section.questionIds.length - 4} more</p>
              )}
            </div>
          </div>
        ))}

        {activeAsmt.sections.length === 0 && unassigned.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Add questions first, then organize them into sections.
          </p>
        )}
      </div>

      <div style={{ padding: '8px 10px', borderTop: '1px solid var(--border)', flexShrink: 0, display: 'flex', gap: 6 }}>
        <input
          type="text"
          placeholder="Section name…"
          value={newTitle}
          onChange={e => setNewTitle(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && submit()}
          style={{
            flex: 1, height: 32, fontSize: 12, padding: '0 8px',
            border: '1px solid var(--border)', borderRadius: 6,
            background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
          }}
        />
        <Button size="sm" variant="outline" onClick={submit} style={{ height: 32, padding: '0 10px', fontSize: 12 }}>
          Add
        </Button>
      </div>
    </div>
  )
}

// ─── AI gap fill — shows which objectives are untested, then launches generator ─
function AiGeneratePanel({
  courseLabel,
  onOpen,
  gapObjectives,
}: {
  courseLabel: string
  onOpen: () => void
  gapObjectives: CourseObjective[]
}) {
  const neverAssessed = gapObjectives.filter(o => !o.lastAssessed)
  const stale = gapObjectives.filter(o => {
    if (!o.lastAssessed) return false
    const days = (Date.now() - new Date(o.lastAssessed).getTime()) / (1000 * 60 * 60 * 24)
    return days > 60
  })

  return (
    <div style={{ flex: 1, overflow: 'auto', padding: 24, background: 'var(--background)' }}>
      <div className="max-w-2xl flex flex-col gap-4">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-sm font-semibold text-foreground">AI gap fill</h3>
            <p className="text-xs text-muted-foreground mt-0.5">
              Objectives in <strong className="text-foreground">{courseLabel}</strong> not yet covered by this assessment
            </p>
          </div>
          <Button
            variant="default"
            size="sm"
            className="gap-2 shrink-0"
            onClick={onOpen}
            disabled={gapObjectives.length === 0}
          >
            <i className="fa-duotone fa-solid fa-sparkles" aria-hidden="true" />
            Generate questions
          </Button>
        </div>

        {gapObjectives.length === 0 ? (
          <LocalBanner variant="success" icon="fa-circle-check" title="All objectives covered">
            <p>Every course objective has been assessed within the last 60 days.</p>
          </LocalBanner>
        ) : (
          <>
            {neverAssessed.length > 0 && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                  <i className="fa-light fa-circle-exclamation" aria-hidden="true" style={{ color: 'var(--foreground)', fontSize: 12 }} />
                  <span className="text-xs font-semibold text-foreground">{neverAssessed.length} never assessed</span>
                  <span className="text-xs text-muted-foreground">— students haven&apos;t seen these at all</span>
                </div>
                <div className="divide-y divide-border">
                  {neverAssessed.map(o => (
                    <div key={o.id} className="px-4 py-2.5 flex items-start gap-3">
                      <Badge variant="outline" className="text-[10px] font-mono shrink-0 mt-0.5">{o.bloomsLevel}</Badge>
                      <span className="text-xs text-foreground leading-relaxed">{o.title}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {stale.length > 0 && (
              <div className="rounded-lg border border-border bg-card overflow-hidden">
                <div className="px-4 py-2.5 border-b border-border flex items-center gap-2">
                  <i className="fa-light fa-clock" aria-hidden="true" style={{ color: 'var(--muted-foreground)', fontSize: 12 }} />
                  <span className="text-xs font-semibold text-foreground">{stale.length} stale</span>
                  <span className="text-xs text-muted-foreground">— last assessed over 60 days ago</span>
                </div>
                <div className="divide-y divide-border">
                  {stale.map(o => {
                    const days = Math.round((Date.now() - new Date(o.lastAssessed!).getTime()) / (1000 * 60 * 60 * 24))
                    return (
                      <div key={o.id} className="px-4 py-2.5 flex items-start gap-3">
                        <Badge variant="outline" className="text-[10px] font-mono shrink-0 mt-0.5">{o.bloomsLevel}</Badge>
                        <span className="text-xs text-foreground leading-relaxed flex-1">{o.title}</span>
                        <span className="text-[10px] text-muted-foreground shrink-0">{days}d ago</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-[11px] text-muted-foreground">
              The generator matches questions to your difficulty and Bloom&apos;s targets. Each question is reviewable before it&apos;s added to the assessment.
            </p>
          </>
        )}
      </div>
    </div>
  )
}
