'use client'
import React, { useEffect, useState, useMemo } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import {
  Button, Badge,
  Select, SelectTrigger, SelectValue, SelectContent, SelectItem,
  Input,
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
  Separator,
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Checkbox,
  LocalBanner,
  Skeleton,
  useSidebar,
  Avatar, AvatarFallback, AvatarGroup,
  Tooltip, TooltipContent, TooltipProvider, TooltipTrigger,
} from '@exxatdesignux/ui'
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_QUESTIONS, MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
import { PERSONAS } from '@/lib/personas'
import type { AssessmentDraft, AssessmentQuestion, AssessmentSection, Question, QType, QDiff, AssessmentReviewRequest, AssessmentStatus, FolderNode, Assessment } from '@/lib/qb-types'
import { defaultAssessmentSettings } from '@/lib/qb-types'
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
import { Step2SettingsPanel } from '@/components/assessment-builder/step2-settings-panel'
import { Step2SectionSettingsPanel } from '@/components/assessment-builder/step2-section-settings-panel'
import { GradingTray } from '@/components/assessment-builder/step2-grading-tray'
import { GradingSettingsPanel } from '@/components/assessment-builder/step2-grading-settings-panel'
import {
  computeTotalAssigned,
  computeBonusTotal,
  computeUnassignedPts,
  distributeEvenly as distributeEvenlyUtil,
  computeSectionSubtotals,
} from '@/lib/assessment-grading'
import { SendForReviewDialog } from '@/components/assessment-builder/send-for-review-dialog'
import { QuestionDetailSheet } from './question-detail-sheet'
import { QbSearchBar, type QbFilter } from '@/components/assessment-builder/step2-qb-search-bar'

// Estimated minutes per question type (base, before difficulty adjustment)
const TIME_BY_TYPE: Record<QType, number> = {
  'MCQ':               1.5,
  'MSQ':               2.0,
  'Fill blank':         2.0,
  'Hotspot':           2.5,
  'Ordering':          3.0,
  'Matching':          3.0,
  'True/False':        1.0,
  'Short Answer':      3.0,
  'Extended Matching': 4.0,
  'Essay':             5.0,
}

// Difficulty multiplier on base time
const DIFF_MULT: Record<QDiff, number> = {
  Easy:   1.0,
  Medium: 1.25,
  Hard:   1.5,
}

/** Parse section names from a canvas prompt. Handles numbered lists and "sections:" notation. */
function parseSectionsFromPrompt(prompt: string): string[] {
  if (!prompt.trim()) return []
  // Match numbered items: "1. Cardiovascular Pharm" or "§1 CV Pharm"
  const numbered = [...prompt.matchAll(/(?:^|\n)\s*(?:\d+[\.\)]|§\d+)\s+([^\n,·—]{3,50})/g)]
    .map(m => m[1].trim())
    .filter(Boolean)
  if (numbered.length >= 2) return numbered.slice(0, 8)
  // Match "sections:" keyword followed by comma-separated list
  const after = prompt.match(/sections?:?\s+([^\n]{8,})/i)
  if (after) {
    const parts = after[1].split(/,\s*/).map(s => s.trim()).filter(s => s.length >= 3)
    if (parts.length >= 2) return parts.slice(0, 8)
  }
  return []
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

const PERSONA_BY_ID = Object.fromEntries(PERSONAS.map(p => [p.id, p]))

const TYPE_ICONS_Q: Record<string, string> = {
  'MCQ':               'fa-light fa-circle-dot',
  'MSQ':               'fa-light fa-list-check',
  'Fill blank':        'fa-light fa-i-cursor',
  'Hotspot':           'fa-light fa-crosshairs',
  'Ordering':          'fa-light fa-list-ol',
  'Matching':          'fa-light fa-arrows-left-right',
  'True/False':        'fa-light fa-toggle-large-on',
  'Short Answer':      'fa-light fa-text',
  'Extended Matching': 'fa-light fa-table-list',
  'Essay':             'fa-light fa-pen-line',
}

const DIFF_COLORS: Record<string, string> = {
  'Easy':   'var(--qb-diff-bar-easy)',
  'Medium': 'var(--qb-diff-bar-medium)',
  'Hard':   'var(--qb-diff-bar-hard)',
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
  const urlMode = (searchParams?.get('mode') ?? null) as 'blank' | 'qb' | 'copy' | 'pdf' | null
  const urlSourceId = searchParams?.get('sourceId') ?? null

  const initialCourseId = urlCourseId ?? mockCourses[0]?.id ?? ''
  const [courseId, setCourseId] = useState(initialCourseId)
  const [offeringId, setOfferingId] = useState(
    mockCourseOfferings.find(o => o.courseId === initialCourseId)?.id ?? ''
  )
  const [activeAsmt, setActiveAsmt] = useState<AssessmentDraft | null>(null)
  // 'idle' → 'building' (AI animation) → 'ready' (full builder)
  const [builderState, setBuilderState] = useState<'idle' | 'building' | 'ready'>('idle')

  // When the draft store hydrates and we have a draftId in the URL, load
  // the matching draft as activeAsmt. Once-only (idempotent on draftId).
  // Also reads the prompt from sessionStorage to scaffold sections + questions.
  useEffect(() => {
    if (!urlDraftId || !draftsHydrated) return
    const draft = localDrafts.find(d => d.id === urlDraftId)
    if (!draft) return
    if (activeAsmt?.id === draft.id) return

    // Read canvas prompt from sessionStorage
    let storedPrompt = ''
    try { storedPrompt = sessionStorage.getItem(`asmt-creation-prompt-${draft.id}`) ?? '' } catch {}

    // Parse sections from prompt ("1. Section Name", "§1 Name", etc.)
    const parsedSections = parseSectionsFromPrompt(storedPrompt)
    const courseCode = (mockCourses.find(c => c.id === draft.courseId)?.code ?? '').toLowerCase()

    // Round-robin assign canvas collaborators to sections
    const colIds = draft.collaboratorIds ?? []
    const sections: AssessmentSection[] = parsedSections.map((title, i) => {
      const sectionId = `sec-${draft.id}-${i}`
      // Pull up to 20 relevant QB questions for this section
      const keyword = title.toLowerCase().split(/\s+/)[0]
      const sectionQIds = MOCK_QB_QUESTIONS
        .filter(q => q.folder.toLowerCase().includes(keyword) || q.folder.startsWith(courseCode))
        .slice(i * 20, i * 20 + 20)
        .map(q => q.id)
      const facultyId = colIds.length > 0 ? colIds[i % colIds.length] : undefined
      return { id: sectionId, title, questionIds: sectionQIds, facultyId }
    })

    const allQIds = sections.flatMap(s => s.questionIds)
    const questions: AssessmentQuestion[] = allQIds.map((qId, i) => ({
      questionId: qId, order: i + 1, points: 4, bonus: false,
    }))

    const newAsmt: AssessmentDraft = {
      id: draft.id,
      title: draft.title,
      courseId: draft.courseId,
      offeringId: draft.offeringId,
      questions,
      durationMinutes: draft.durationMinutes,
      sections,
      settings: defaultAssessmentSettings('Exam'),
      healthFlags: [],
      collaboratorIds: draft.collaboratorIds,
    }

    if (parsedSections.length > 0) {
      // Show brief AI-building animation before revealing the builder
      setBuilderState('building')
      setTimeout(() => {
        setActiveAsmt(newAsmt)
        setActiveSectionId(sections[0]?.id ?? null)
        setBuilderState('ready')
      }, 2200)
    } else {
      setActiveAsmt(newAsmt)
      setBuilderState('ready')
    }
    setCourseId(draft.courseId)
    setOfferingId(draft.offeringId)
  }, [urlDraftId, draftsHydrated, localDrafts, activeAsmt?.id]) // eslint-disable-line react-hooks/exhaustive-deps

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
      .map((q, i): AssessmentQuestion => ({ questionId: q.id, order: i + 1, points: 0, bonus: false, provenance: 'copied' as const }))

    const copyHealthFlags: import('@/lib/qb-types').QuestionHealthFlag[] = sourceQuestions.flatMap(aq => {
      const q = MOCK_QB_QUESTIONS.find(mq => mq.id === aq.questionId)
      if (!q) return []
      const flags: import('@/lib/qb-types').QuestionHealthFlag[] = []
      if (q.pbis !== null && q.pbis < 0.2) flags.push({ type: 'poor-pbis', questionId: q.id, pbis: q.pbis })
      if (q.options && q.options.every(o => !o.rationale || o.rationale.trim() === '')) {
        flags.push({ type: 'missing-rationale', questionId: q.id })
      }
      return flags
    })

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
      healthFlags: copyHealthFlags,
    })
    setCourseId(source.courseId)
  }, [urlMode, urlSourceId]) // eslint-disable-line react-hooks/exhaustive-deps

  // Session-scoped user-created questions (from inline "New question" panel)
  const [userCreated, setUserCreated] = useState<Question[]>([])

  // AI generate modal — opened from the AI source tab in the picker
  const [aiOpen, setAiOpen] = useState(false)

  const offerings = mockCourseOfferings.filter(o => o.courseId === courseId)
  const assessments = mockAssessments.filter(a => a.courseId === courseId && a.offeringId === offeringId)
  const allCourseAssessments = mockAssessments.filter(a => a.courseId === courseId)

  const currentCourse   = mockCourses.find(c => c.id === courseId)
  const currentOffering = mockCourseOfferings.find(o => o.id === offeringId)
  const courseLabel = currentCourse
    ? `${currentCourse.code} · ${currentOffering?.semester ?? ''}`
    : ''

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

  function toggleQuestion(questionId: string, provenance?: AssessmentQuestion['provenance']) {
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
      const nextSections = activeSectionId
        ? prev.sections.map(s => s.id === activeSectionId
            ? { ...s, questionIds: [...new Set([...s.questionIds, questionId])] }
            : s)
        : prev.sections
      return {
        ...prev,
        questions: [...prev.questions, { questionId, order: prev.questions.length + 1, points: 0, bonus: false, provenance: provenance ?? 'qb' }],
        sections: nextSections,
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
        questions: [...prev.questions, { questionId: q.id, order: prev.questions.length + 1, points: 0, bonus: false }],
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
        questions: [...prev.questions, { questionId: q.id, order: prev.questions.length + 1, points: 0, bonus: false }],
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

  const totalAssigned = useMemo(
    () => computeTotalAssigned(activeAsmt?.questions ?? []),
    [activeAsmt?.questions],
  )
  const bonusTotal = useMemo(
    () => computeBonusTotal(activeAsmt?.questions ?? []),
    [activeAsmt?.questions],
  )
  const unassignedPts = useMemo(
    () => computeUnassignedPts(
      activeAsmt?.settings.totalMarks ?? 100,
      activeAsmt?.questions ?? [],
    ),
    [activeAsmt?.questions, activeAsmt?.settings.totalMarks],
  )
  const sectionSubtotals = useMemo(
    () => computeSectionSubtotals(
      activeAsmt?.sections ?? [],
      activeAsmt?.questions ?? [],
    ),
    [activeAsmt?.sections, activeAsmt?.questions],
  )
  const totalScore = useMemo(
    () => (activeAsmt?.questions ?? []).reduce((sum, q) => sum + (q.points ?? 0), 0),
    [activeAsmt?.questions],
  )

  const psychoMetrics = useMemo(() => {
    if (!activeAsmt) return null
    const questions = activeAsmt.questions
    if (questions.length === 0) return null

    // map question IDs to QB data
    const qMap = Object.fromEntries(MOCK_QB_QUESTIONS.map(q => [q.id, q]))

    const pValues: number[] = []
    const pbisValues: number[] = []
    const discriminationValues: number[] = []

    questions.forEach(aq => {
      const q = qMap[aq.questionId]
      if (q?.pValue != null) pValues.push(q.pValue)
      if (q?.pbis != null) pbisValues.push(q.pbis)
      if (q?.discriminationIndex != null) discriminationValues.push(q.discriminationIndex)
    })

    if (pValues.length === 0 && pbisValues.length === 0 && discriminationValues.length === 0) return null

    const avg = (arr: number[]) => arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : null

    // Upper/lower 27%: sort by pValue, take top and bottom 27%
    const sorted = [...pValues].sort((a, b) => b - a)
    const cutoff = Math.max(1, Math.floor(sorted.length * 0.27))
    const upper27avg = avg(sorted.slice(0, cutoff))
    const lower27avg = avg(sorted.slice(-cutoff))

    return {
      avgPValue: avg(pValues),
      avgPbis: avg(pbisValues),
      avgDiscriminationIndex: avg(discriminationValues),
      upper27avg,
      lower27avg,
      hasData: pValues.length > 0 || pbisValues.length > 0 || discriminationValues.length > 0,
    }
  }, [activeAsmt])

  const computedHealthFlags = useMemo(() => {
    if (!activeAsmt) return []
    const questions = activeAsmt.questions
    const qMap = Object.fromEntries(MOCK_QB_QUESTIONS.map(q => [q.id, q]))
    const newFlags: import('@/lib/qb-types').QuestionHealthFlag[] = []

    questions.forEach(aq => {
      const q = qMap[aq.questionId]
      if (!q) return
      // Missing rationale: no rationale on any option
      if (q.options && q.options.every(o => !o.rationale || o.rationale.trim() === '')) {
        newFlags.push({ type: 'missing-rationale', questionId: aq.questionId })
      }
      // Poor pbis (legacy threshold)
      if (q.pbis != null && q.pbis < 0.2 && q.pbis >= 0.1) {
        newFlags.push({ type: 'poor-pbis', questionId: aq.questionId, pbis: q.pbis })
      }
      // Psychometric outliers
      if (q.pbis != null && q.pbis < 0.1) {
        newFlags.push({ type: 'poor-discriminator', questionId: aq.questionId, pbis: q.pbis })
      }
      if (q.pValue != null && (q.pValue < 0.15 || q.pValue > 0.9)) {
        newFlags.push({ type: 'extreme-difficulty', questionId: aq.questionId, pValue: q.pValue })
      }
      if (q.discriminationIndex != null && q.discriminationIndex < 0.1) {
        newFlags.push({ type: 'near-zero-discrimination', questionId: aq.questionId, discriminationIndex: q.discriminationIndex })
      }
    })

    return newFlags
  }, [activeAsmt])

  // Sync computed health flags back to activeAsmt state
  useEffect(() => {
    if (!activeAsmt) return
    const existing = JSON.stringify(activeAsmt.healthFlags)
    const next = JSON.stringify(computedHealthFlags)
    if (existing === next) return
    setActiveAsmt(prev => prev ? { ...prev, healthFlags: computedHealthFlags } : prev)
  }, [computedHealthFlags]) // eslint-disable-line react-hooks/exhaustive-deps

  // Tab-based navigation replacing the old step wizard
  const [activeTab, setActiveTab] = useState<'setup' | 'build' | 'review'>('build')
  const [pickerOpen, setPickerOpen] = useState(false)
  const [pickerMethod, setPickerMethod] = useState<'qb' | 'pdf' | 'manual' | 'ai'>('qb')
  const [assignSheetSectionId, setAssignSheetSectionId] = useState<string | null>(null)

  // Legacy — kept for dead-code components that reference it
  const [activeStep] = useState<1 | 2 | 3>(2)

  // Change 2: HealthPanel is hidden by default; toggled via icon button
  const [showHealth, setShowHealth] = useState(false)
  const [showGrading, setShowGrading] = useState(false)
  const [activeSectionId, setActiveSectionId] = useState<string | null>(null)
  const [detailQuestionId, setDetailQuestionId] = useState<string | null>(null)

  const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
  const [addSectionOpen, setAddSectionOpen] = useState(false)
  const [addSectionTitle, setAddSectionTitle] = useState('')
  const [pinnedQuestionIds, setPinnedQuestionIds] = useState<Set<string>>(new Set())
  const [assessmentDescription, setAssessmentDescription] = useState('')
  const [sectionAnalysisOpen, setSectionAnalysisOpen] = useState(false)
  const [lastMovedId, setLastMovedId] = useState<string | null>(null)
  const [aiPromptOpen, setAiPromptOpen] = useState(false)
  const [aiPromptText, setAiPromptText] = useState('')
  const [aiBuilding, setAiBuilding] = useState(false)

  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rightPanelMode, setRightPanelMode] = useState<'health' | 'settings' | 'section'>('health')
  const [sendForReviewOpen, setSendForReviewOpen] = useState(false)
  const [bulkSelectedIds, setBulkSelectedIds] = useState<Set<string>>(new Set())

  // Auto-open QB picker when arriving via "Build from QB" quick-start
  useEffect(() => {
    if (urlMode === 'qb' && builderState === 'ready') {
      setPickerOpen(true)
    }
  }, [urlMode, builderState])

  function addSection(title: string) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      sections: [...prev.sections, { id: `sec-${Date.now()}`, title, questionIds: [] }],
    } : prev)
  }

  function reorderQuestionInSection(sectionId: string, questionId: string, direction: 'up' | 'down') {
    setActiveAsmt(prev => {
      if (!prev) return prev
      const sec = prev.sections.find(s => s.id === sectionId)
      if (!sec) return prev
      const idx = sec.questionIds.indexOf(questionId)
      if (idx === -1) return prev
      const newIds = [...sec.questionIds]
      if (direction === 'up' && idx > 0) {
        ;[newIds[idx - 1], newIds[idx]] = [newIds[idx], newIds[idx - 1]]
      } else if (direction === 'down' && idx < newIds.length - 1) {
        ;[newIds[idx], newIds[idx + 1]] = [newIds[idx + 1], newIds[idx]]
      }
      return {
        ...prev,
        sections: prev.sections.map(s => s.id === sectionId ? { ...s, questionIds: newIds } : s),
      }
    })
    setLastMovedId(questionId)
    setTimeout(() => setLastMovedId(cur => cur === questionId ? null : cur), 700)
  }

  function togglePinQuestion(questionId: string) {
    setPinnedQuestionIds(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      return next
    })
  }

  function removeSection(sectionId: string) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      sections: prev.sections.filter(s => s.id !== sectionId),
    } : prev)
  }

  function reorderSection(sectionId: string, direction: 'up' | 'down') {
    setActiveAsmt(prev => {
      if (!prev) return prev
      const idx = prev.sections.findIndex(s => s.id === sectionId)
      if (idx < 0) return prev
      const newIdx = direction === 'up' ? idx - 1 : idx + 1
      if (newIdx < 0 || newIdx >= prev.sections.length) return prev
      const sections = [...prev.sections]
      ;[sections[idx], sections[newIdx]] = [sections[newIdx], sections[idx]]
      return { ...prev, sections }
    })
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

  function updateQuestionPoints(questionId: string, points: number) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q =>
        q.questionId === questionId ? { ...q, points: Math.max(0, points) } : q,
      ),
    } : prev)
  }

  function updateQuestionBonus(questionId: string, bonus: boolean) {
    setActiveAsmt(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q =>
        q.questionId === questionId ? { ...q, bonus } : q,
      ),
    } : prev)
  }

  function handleDistributeEvenly() {
    if (!activeAsmt) return
    setActiveAsmt(prev => prev ? {
      ...prev,
      questions: distributeEvenlyUtil(prev.questions, prev.settings.totalMarks),
    } : prev)
  }

  function bulkSetPoints(questionIds: string[], points: number) {
    const ids = new Set(questionIds)
    setActiveAsmt(prev => prev ? {
      ...prev,
      questions: prev.questions.map(q =>
        ids.has(q.questionId) ? { ...q, points: Math.max(0, points) } : q,
      ),
    } : prev)
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

  // Derive active section object for workspace view
  const activeSection = activeAsmt?.sections.find(s => s.id === activeSectionId) ?? null

  // Questions in the active section
  const activeSectionQuestions = activeSection
    ? activeSection.questionIds
        .map(qId => {
          const aq = activeAsmt?.questions.find(q => q.questionId === qId)
          const q = MOCK_QB_QUESTIONS.find(q => q.id === qId)
          return aq && q ? { aq, q } : null
        })
        .filter(Boolean) as Array<{ aq: AssessmentQuestion; q: Question }>
    : []

  // Section status: Ready if fill ≥ 80% of some target, else Drafting
  function sectionFillPct(sec: AssessmentSection): number {
    const target = sec.fillTarget?.value ?? sec.questionTarget ?? 20
    return Math.min(100, Math.round((sec.questionIds.length / target) * 100))
  }

  // ── Scene 2: AI building skeleton ──────────────────────────────────────────
  if (builderState === 'building') {
    const buildingTitle = localDrafts.find(d => d.id === urlDraftId)?.title ?? 'New Assessment'
    const buildingPrompt = (() => { try { return sessionStorage.getItem(`asmt-creation-prompt-${urlDraftId}`) ?? '' } catch { return '' } })()
    const previewSections = parseSectionsFromPrompt(buildingPrompt)
    const sectionList = previewSections.length > 0 ? previewSections : ['Section 1', 'Section 2', 'Section 3']
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
        <h1 className="sr-only">Building assessment</h1>

        {/* Header skeleton */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 16px', height: 52, borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, gap: 10 }}>
          <Skeleton className="h-4 w-14" />
          <span style={{ color: 'var(--border)' }}>/</span>
          <span className="text-sm font-semibold text-foreground">{buildingTitle}</span>
          <div style={{ display: 'flex', gap: 6, marginLeft: 8 }}>
            <Skeleton className="h-6 w-14 rounded-full" />
            <Skeleton className="h-6 w-20 rounded-full" />
            <Skeleton className="h-6 w-16 rounded-full" />
          </div>
          <div style={{ marginLeft: 'auto', display: 'flex', gap: 8, alignItems: 'center' }}>
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-7 w-20 rounded-md" />
            <Skeleton className="h-7 w-24 rounded-md" />
          </div>
        </div>

        {/* Progress bar */}
        <div style={{ height: 2, background: 'var(--muted)', flexShrink: 0 }}>
          <div style={{ height: '100%', background: 'var(--brand-color)', width: '60%', transition: 'width 2.5s ease' }} />
        </div>

        {/* Tab bar skeleton */}
        <div style={{ height: 40, borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 2, padding: '0 16px' }}>
          {[10, 16, 16].map((w, i) => (
            <div key={i} style={{ height: 28, display: 'flex', alignItems: 'center', padding: '0 14px', borderRadius: 6, background: i === 0 ? 'var(--muted)' : 'transparent' }}>
              <Skeleton className={`h-3.5 w-${w}`} />
            </div>
          ))}
        </div>

        {/* Body */}
        <div style={{ display: 'flex', flex: 1, overflow: 'hidden' }}>

          {/* Sections sidebar — full skeleton */}
          <div style={{ width: 220, borderRight: '1px solid var(--border)', background: 'var(--sidebar)', flexShrink: 0, display: 'flex', flexDirection: 'column', padding: '10px 0' }}>
            <div style={{ padding: '0 12px 8px' }}>
              <Skeleton className="h-3 w-14" />
            </div>
            {(['w-32', 'w-28', 'w-24'] as const).map((w, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '7px 12px',
                borderLeft: `2px solid ${i === 0 ? 'var(--brand-color)' : 'transparent'}`,
                background: i === 0 ? 'var(--background)' : 'transparent',
              }}>
                <span style={{ width: 6, height: 6, borderRadius: '50%', background: i === 0 ? 'var(--brand-color)' : 'var(--border)', flexShrink: 0 }} />
                <Skeleton className={`h-3 flex-1 ${w}`} />
                <Skeleton className="h-3 w-5" />
              </div>
            ))}
          </div>

          {/* Center — product-analogy skeleton */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>

            {/* Generating status bar */}
            <div style={{ padding: '7px 14px', borderBottom: '1px solid var(--border)', background: 'var(--brand-tint)', flexShrink: 0, display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'var(--brand-color)', flexShrink: 0, animation: 'pulse 1.5s ease-in-out infinite' }} />
              <span style={{ fontSize: 12, color: 'var(--foreground)', fontWeight: 500 }}>
                {urlMode === 'pdf' ? 'Parsing PDF and generating structure…' : 'Generating your assessment…'}
              </span>
              <Skeleton className="h-3 w-32 ml-auto" />
            </div>

            {/* Toolbar skeleton */}
            <div style={{ height: 48, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, padding: '0 12px', flexShrink: 0 }}>
              <Skeleton className="h-8 w-52 rounded-md" />
              <div style={{ marginLeft: 'auto', display: 'flex', gap: 6 }}>
                <Skeleton className="h-8 w-20 rounded-md" />
                <Skeleton className="h-8 w-28 rounded-md" />
                <Skeleton className="size-8 rounded-md" />
              </div>
            </div>

            {/* Table header skeleton */}
            <div style={{ height: 34, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, padding: '0 12px', background: 'var(--muted)', flexShrink: 0 }}>
              <Skeleton className="size-3.5" />
              <Skeleton className="h-3 w-28" />
              <Skeleton className="h-3 w-12 ml-auto" />
              <Skeleton className="h-3 w-14" />
              <Skeleton className="h-3 w-12" />
            </div>

            {/* Question rows skeleton */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {Array.from({ length: 10 }).map((_, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '10px 12px',
                  borderBottom: '1px solid var(--border)',
                  opacity: Math.max(0.25, 1 - i * 0.07),
                }}>
                  <Skeleton className="size-3.5" />
                  <Skeleton className="size-6 rounded" />
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                    <Skeleton className="h-3.5" style={{ width: `${52 + (i * 7) % 32}%` }} />
                    {i % 3 === 0 && <Skeleton className="h-2.5 w-1/3" />}
                  </div>
                  <div style={{ display: 'flex', gap: 5 }}>
                    <Skeleton className="h-5 w-10 rounded-full" />
                    <Skeleton className="h-5 w-14 rounded-full" />
                    <Skeleton className="h-5 w-12 rounded-full" />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    )
  }

  // Creation mode chooser — shown when no draft/source is loaded yet
  if (builderState === 'idle' && activeAsmt === null && !urlDraftId) {
    return <CreationModeChooser
      courseId={courseId}
      assessments={allCourseAssessments}
      onCopyWithQuestions={(source: Assessment, questionIds: string[]) => {
        const srcCode = (mockCourses.find(c => c.id === source.courseId)?.code ?? '').toLowerCase()
        const pool = MOCK_QB_QUESTIONS.filter(q => q.folder.startsWith(srcCode)).slice(0, source.questionCount)
        const chosen = questionIds.length > 0 ? pool.filter(q => questionIds.includes(q.id)) : pool
        const asmtQs = chosen.map((q, i): AssessmentQuestion => ({
          questionId: q.id, order: i + 1, points: 0, bonus: false, provenance: 'copied' as const,
        }))
        setActiveAsmt({
          id: `asmt-copy-${source.id}`,
          title: `${source.title} (copy)`,
          courseId: source.courseId,
          offeringId: offeringId,
          questions: asmtQs,
          sections: [],
          durationMinutes: source.durationMinutes,
          settings: defaultAssessmentSettings('Exam'),
          healthFlags: [],
        })
        setBuilderState('ready')
      }}
      onSelectMode={(mode: 'qb' | 'pdf' | 'ai') => {
        if (mode === 'qb') { setPickerOpen(true); setPickerMethod('qb'); setBuilderState('ready'); setActiveAsmt({ id: `asmt-new-${Date.now()}`, title: 'New Assessment', courseId, offeringId, questions: [], sections: [], durationMinutes: 90, settings: defaultAssessmentSettings('Exam'), healthFlags: [] }) }
        if (mode === 'pdf') { setPickerOpen(true); setPickerMethod('pdf'); setBuilderState('ready'); setActiveAsmt({ id: `asmt-new-${Date.now()}`, title: 'New Assessment', courseId, offeringId, questions: [], sections: [], durationMinutes: 90, settings: defaultAssessmentSettings('Exam'), healthFlags: [] }) }
        if (mode === 'ai') { setAiOpen(true); setBuilderState('ready'); setActiveAsmt({ id: `asmt-new-${Date.now()}`, title: 'New Assessment', courseId, offeringId, questions: [], sections: [], durationMinutes: 90, settings: defaultAssessmentSettings('Exam'), healthFlags: [] }) }
      }}
      onBack={() => router.push('/courses')}
    />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <h1 className="sr-only">Assessment Builder</h1>

      {/* ── New header (52px) ─────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'center',
        padding: '0 16px', height: 52,
        borderBottom: '1px solid var(--border)',
        background: 'var(--card)', flexShrink: 0, gap: 8,
      }}>
        {/* Left: back + separator + editable title + chips */}
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push('/assessment-builder/create')}
          className="gap-1.5 shrink-0"
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" />
          {currentCourse?.code ?? 'Back'}
        </Button>
        <span style={{ color: 'var(--border)', fontSize: 14, flexShrink: 0 }}>/</span>
        <input
          aria-label="Assessment title"
          value={activeAsmt?.title ?? 'New Assessment'}
          onChange={e => {
            const val = e.target.value
            setActiveAsmt(prev => prev ? { ...prev, title: val } : prev)
          }}
          style={{
            fontSize: 13, fontWeight: 600,
            background: 'transparent', border: 'none',
            borderBottom: '1.5px solid var(--brand-color)',
            outline: 'none', color: 'var(--foreground)',
            width: 200, padding: '0 2px',
          }}
        />
        {/* Right */}
        <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
          <Badge variant="secondary" style={{ fontSize: 12 }}>Draft</Badge>
          <Button variant="outline" size="sm" onClick={() => setActiveTab('review')}>Preview</Button>
          <Button
            variant="ghost"
            size="sm"
            aria-label="Assessment settings"
            onClick={() => setRightPanelMode(prev => prev === 'settings' ? 'health' : 'settings')}
          >
            <i className="fa-light fa-gear" aria-hidden="true" />
          </Button>
          <Button size="sm" className="gap-1.5" onClick={() => setActiveTab('review')}>
            Publish
            <i className="fa-light fa-arrow-right" aria-hidden="true" />
          </Button>
        </div>
      </div>

      {/* ── Tab bar (38px) ────────────────────────────────────────────────── */}
      <div style={{
        display: 'flex', alignItems: 'stretch',
        height: 38, borderBottom: '1px solid var(--border)',
        background: 'var(--card)', flexShrink: 0, padding: '0 16px',
      }}>
        {[
          { id: 'setup' as const,  label: 'Setup',  done: !!activeAsmt, num: 1 },
          { id: 'build' as const,  label: 'Build',  done: false,         num: 2 },
          { id: 'review' as const, label: 'Review', done: false,         num: 3 },
        ].map(tab => {
          const isActive = activeTab === tab.id
          const isDone = tab.done && !isActive
          return (
            <button
              key={tab.id}
              type="button"
              role="tab"
              aria-selected={isActive}
              onClick={() => { setActiveTab(tab.id); if (tab.id !== 'build') setPickerOpen(false) }}
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                padding: '0 14px', fontSize: 12, fontWeight: isActive ? 600 : 500,
                color: isActive ? 'var(--foreground)' : isDone ? 'var(--chart-2)' : 'var(--muted-foreground)',
                background: 'none', border: 'none',
                borderBottom: isActive ? '2px solid var(--foreground)' : '2px solid transparent',
                cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              <span style={{
                width: 18, height: 18, borderRadius: '50%', fontSize: 12, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: isActive ? 'var(--foreground)' : isDone ? 'var(--chart-2)' : 'var(--muted)',
                color: isActive || isDone ? 'var(--background)' : 'var(--muted-foreground)',
              }}>
                {isDone ? '✓' : tab.num}
              </span>
              {tab.label}
            </button>
          )
        })}
        {/* Question count — right side of tab bar */}
        {activeTab === 'build' && activeAsmt && (
          <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 6, paddingRight: 4 }}>
            <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
              {activeAsmt.questions.length} Q · {activeAsmt.sections.length} section{activeAsmt.sections.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}
      </div>

      {/* ── Setup tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'setup' && (
        <div style={{ flex: 1, overflow: 'auto' }}>
          {activeAsmt ? (
            <div style={{ maxWidth: 560, padding: '28px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

              {/* ── Basic info ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>Basic info</div>

                {/* Name */}
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>Assessment name</div>
                  <input
                    aria-label="Assessment name"
                    value={activeAsmt.title}
                    onChange={e => setActiveAsmt(prev => prev ? { ...prev, title: e.target.value } : prev)}
                    style={{ width: '100%', fontSize: 14, fontWeight: 500, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                  />
                </div>

                {/* Type row */}
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 6 }}>Type</div>
                  <div style={{ display: 'flex', gap: 8 }}>
                    {(['Exam', 'Quiz', 'Assignment', 'Pop Quiz'] as const).map(t => (
                      <button
                        key={t}
                        type="button"
                        aria-pressed={activeAsmt.settings?.type === t}
                        onClick={() => setActiveAsmt(prev => prev ? { ...prev, settings: { ...prev.settings, type: t } } : prev)}
                        style={{
                          padding: '6px 14px', borderRadius: 7, fontSize: 12, fontWeight: 500,
                          border: '1px solid',
                          borderColor: activeAsmt.settings?.type === t ? 'var(--brand-color)' : 'var(--border)',
                          background: activeAsmt.settings?.type === t ? 'color-mix(in srgb, var(--brand-color) 8%, var(--background))' : 'var(--background)',
                          color: activeAsmt.settings?.type === t ? 'var(--brand-color)' : 'var(--muted-foreground)',
                          cursor: 'pointer', fontFamily: 'inherit',
                        }}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Duration + Total marks row */}
                <div style={{ display: 'flex', gap: 20 }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>Duration (min)</div>
                    <input
                      type="number"
                      aria-label="Duration in minutes"
                      min={5}
                      step={5}
                      value={activeAsmt.durationMinutes}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v >= 5) setActiveAsmt(prev => prev ? { ...prev, durationMinutes: v } : prev)
                      }}
                      style={{ width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>Total marks</div>
                    <input
                      type="number"
                      aria-label="Total marks"
                      min={1}
                      value={activeAsmt.settings.totalMarks}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        if (!isNaN(v) && v > 0) setActiveAsmt(prev => prev ? { ...prev, settings: { ...prev.settings, totalMarks: v } } : prev)
                      }}
                      style={{ width: '100%', fontSize: 13, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit' }}
                    />
                  </div>
                </div>
              </div>

              {/* ── Description / Intent ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>Primary goal / intent</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>What skill or knowledge does this assessment measure?</div>
                </div>
                <textarea
                  aria-label="Assessment intent"
                  value={assessmentDescription}
                  onChange={e => setAssessmentDescription(e.target.value)}
                  placeholder="e.g. Assess students' ability to apply pharmacokinetic principles to clinical dosing decisions across renal and hepatic impairment scenarios."
                  rows={3}
                  style={{ width: '100%', fontSize: 13, lineHeight: 1.55, padding: '8px 10px', border: '1px solid var(--border)', borderRadius: 7, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
                />
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                  Used to auto-align question selection and AI gap-fill recommendations.
                </div>
              </div>

              {/* ── Collaborators ── */}
              {(activeAsmt.collaboratorIds?.length ?? 0) > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>Collaborators</div>
                  {(activeAsmt.collaboratorIds ?? []).map((facId, idx) => {
                    const fac = facultyListRows.find(f => f.id === facId)
                    if (!fac) return null
                    const initials = fac.fullName.split(' ').filter(Boolean).map(w => w[0]).join('').slice(0, 2).toUpperCase()
                    const COLLAB_COLORS = ['#7c6bbf', '#3b7abf', '#4e9a6b', '#bf5b3b', '#b87c3b']
                    const color = COLLAB_COLORS[idx % COLLAB_COLORS.length]
                    return (
                      <div key={facId} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                        <div style={{ width: 28, height: 28, borderRadius: '50%', background: color, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: 'var(--background)', flexShrink: 0 }}>
                          {initials}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{fac.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{fac.rank}</div>
                        </div>
                        <span style={{ fontSize: 12, padding: '2px 8px', borderRadius: 4, background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Contributor</span>
                      </div>
                    )
                  })}
                </div>
              )}

              {/* ── Target distribution ── */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10, paddingTop: 20, borderTop: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>Target difficulty mix</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>Set expectations before building — actual distribution shown in Build tab.</div>
                </div>
                <div style={{ display: 'flex', gap: 12 }}>
                  {(['Easy', 'Medium', 'Hard'] as const).map(level => {
                    const colors: Record<string, string> = { Easy: 'var(--qb-diff-bar-easy)', Medium: 'var(--qb-diff-bar-medium)', Hard: 'var(--qb-diff-bar-hard)' }
                    const defaults: Record<string, string> = { Easy: '30', Medium: '50', Hard: '20' }
                    return (
                      <div key={level} style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: 4 }}>
                        <div style={{ fontSize: 12, fontWeight: 500, color: colors[level] }}>{level}</div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                          <input
                            type="number"
                            aria-label={`Target ${level} percentage`}
                            defaultValue={defaults[level]}
                            min={0}
                            max={100}
                            style={{ width: '100%', fontSize: 13, padding: '5px 8px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', boxSizing: 'border-box', fontFamily: 'inherit', textAlign: 'right' }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flexShrink: 0 }}>%</span>
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>

              {/* ── Build CTA ── */}
              <Button size="sm" onClick={() => setActiveTab('build')} className="gap-1.5 self-start">
                Continue to Build
                <i className="fa-light fa-arrow-right" aria-hidden="true" />
              </Button>

            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', gap: 12 }}>
              <p className="text-sm text-muted-foreground">No assessment found. Start from the canvas.</p>
              <Button size="sm" onClick={() => router.push('/assessment-builder/create')} className="gap-1.5">
                <i className="fa-light fa-arrow-left" aria-hidden="true" />
                Back to canvas
              </Button>
            </div>
          )}
        </div>
      )}

      {/* ── Build tab ─────────────────────────────────────────────────────── */}
      {activeTab === 'build' && activeAsmt && (
        <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

          {/* Left: sections sidebar (196px) */}
          <div style={{ width: 196, minWidth: 196, borderRight: '1px solid var(--sidebar-border, var(--border))', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column', background: 'var(--sidebar)' }}>
            <div style={{ padding: '10px 12px 6px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
              <span className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">Sections</span>
              <button
                type="button"
                aria-label="Add section"
                onClick={() => { setAddSectionOpen(true); setAddSectionTitle('') }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--brand-color)', fontSize: 12, fontWeight: 600, fontFamily: 'inherit' }}
              >
                + Add
              </button>
            </div>
            {addSectionOpen && (
              <div style={{ padding: '0 8px 8px', flexShrink: 0 }}>
                <div style={{ display: 'flex', gap: 4 }}>
                  <input
                    autoFocus
                    type="text"
                    placeholder="Section name…"
                    value={addSectionTitle}
                    onChange={e => setAddSectionTitle(e.target.value)}
                    onKeyDown={e => {
                      if (e.key === 'Enter') {
                        if (addSectionTitle.trim()) { addSection(addSectionTitle.trim()); setAddSectionOpen(false) }
                      }
                      if (e.key === 'Escape') setAddSectionOpen(false)
                    }}
                    style={{ flex: 1, height: 28, fontSize: 12, padding: '0 7px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontFamily: 'inherit' }}
                  />
                  <button
                    type="button"
                    onClick={() => { if (addSectionTitle.trim()) { addSection(addSectionTitle.trim()); setAddSectionOpen(false) } }}
                    style={{ height: 28, padding: '0 8px', fontSize: 12, fontWeight: 600, background: 'var(--brand-color)', color: 'var(--background)', border: 'none', borderRadius: 6, cursor: 'pointer', fontFamily: 'inherit' }}
                  >
                    Add
                  </button>
                  <button
                    type="button"
                    aria-label="Cancel add section"
                    onClick={() => setAddSectionOpen(false)}
                    style={{ height: 28, width: 28, fontSize: 12, background: 'none', border: '1px solid var(--border)', borderRadius: 6, cursor: 'pointer', color: 'var(--muted-foreground)', fontFamily: 'inherit' }}
                  >
                    ×
                  </button>
                </div>
              </div>
            )}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {activeAsmt.sections.length === 0 ? (
                <div style={{ padding: '20px 12px', textAlign: 'center' }}>
                  <p className="text-xs text-muted-foreground">No sections yet.</p>
                </div>
              ) : activeAsmt.sections.map((sec, idx) => {
                const isActive = sec.id === activeSectionId
                const facIds = sec.facultyIds?.length ? sec.facultyIds : sec.facultyId ? [sec.facultyId] : []
                const sectionFaculty = facultyListRows.filter(f => facIds.includes(f.id))
                return (
                  <div key={sec.id}>
                    <div style={{ display: 'flex', alignItems: 'center', background: isActive ? 'var(--background)' : 'none', borderLeft: `3px solid ${isActive ? 'var(--brand-color)' : 'transparent'}` }}>
                      <button
                        type="button"
                        onClick={() => {
                          setActiveSectionId(sec.id)
                          setPickerOpen(false)
                          setRightPanelMode('section')
                        }}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 7,
                          padding: '7px 4px 7px 12px', flex: 1, minWidth: 0, textAlign: 'left',
                          background: 'none', border: 'none', cursor: 'pointer',
                        }}
                      >
                        <span style={{ width: 6, height: 6, borderRadius: '50%', background: isActive ? 'var(--brand-color)' : 'var(--border)', flexShrink: 0 }} />
                        <span className="text-xs font-medium text-foreground" style={{ flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {idx + 1}. {sec.title}
                        </span>
                        {(() => {
                          const filled = sec.questionIds.length
                          const target = sec.fillTarget?.value ?? sec.questionTarget ?? 20
                          const isComplete = filled >= target
                          const isStarted = filled > 0
                          return (
                            <span
                              aria-label={`${filled} of ${target} questions filled`}
                              style={{
                                background: isComplete
                                  ? 'color-mix(in srgb, var(--chart-2) 15%, var(--background))'
                                  : isStarted ? 'var(--brand-tint)' : 'var(--muted)',
                                border: `1px solid ${isComplete
                                  ? 'color-mix(in srgb, var(--chart-2) 40%, var(--background))'
                                  : isStarted ? 'var(--ring)' : 'var(--border)'}`,
                                borderRadius: 10,
                                padding: '1px 6px',
                                fontSize: 12,
                                color: isComplete ? 'var(--chart-2)' : isStarted ? 'var(--brand-color)' : 'var(--muted-foreground)',
                                flexShrink: 0,
                                whiteSpace: 'nowrap',
                                fontWeight: 500,
                              }}
                            >
                              {isComplete ? `✓ ${filled}` : `${filled}`} / {target} Q
                            </span>
                          )
                        })()}
                      </button>
                      {/* Section settings icon */}
                      <button
                        type="button"
                        aria-label={`Open settings for ${sec.title}`}
                        onClick={() => {
                          setActiveSectionId(sec.id)
                          setRightPanelMode('section')
                        }}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: '4px 4px', color: 'var(--muted-foreground)', flexShrink: 0, lineHeight: 1 }}
                      >
                        <i className="fa-light fa-sliders" aria-hidden="true" style={{ fontSize: 12 }} />
                      </button>
                      {/* Section reorder buttons */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 0, paddingRight: 6, flexShrink: 0 }}>
                        <button
                          type="button"
                          onClick={() => reorderSection(sec.id, 'up')}
                          disabled={idx === 0}
                          aria-label={`Move ${sec.title} up`}
                          style={{ background: 'none', border: 'none', cursor: idx === 0 ? 'default' : 'pointer', padding: '1px 3px', color: idx === 0 ? 'var(--border)' : 'var(--muted-foreground)', lineHeight: 1 }}
                        >
                          <i className="fa-light fa-chevron-up" aria-hidden="true" style={{ fontSize: 9 }} />
                        </button>
                        <button
                          type="button"
                          onClick={() => reorderSection(sec.id, 'down')}
                          disabled={idx === activeAsmt.sections.length - 1}
                          aria-label={`Move ${sec.title} down`}
                          style={{ background: 'none', border: 'none', cursor: idx === activeAsmt.sections.length - 1 ? 'default' : 'pointer', padding: '1px 3px', color: idx === activeAsmt.sections.length - 1 ? 'var(--border)' : 'var(--muted-foreground)', lineHeight: 1 }}
                        >
                          <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 9 }} />
                        </button>
                      </div>
                    </div>
                    {/* Faculty row — compact text label */}
                    {sectionFaculty.length > 0 ? (
                      <button
                        type="button"
                        onClick={() => setAssignSheetSectionId(sec.id)}
                        style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '0 12px 5px 22px', background: 'none', border: 'none', cursor: 'pointer', width: '100%', textAlign: 'left', fontFamily: 'inherit' }}
                      >
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {sectionFaculty.length === 1
                            ? sectionFaculty[0].fullName.split(' ').slice(-1)[0]
                            : `${sectionFaculty[0].fullName.split(' ').slice(-1)[0]} +${sectionFaculty.length - 1}`}
                        </span>
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setAssignSheetSectionId(sec.id)}
                        style={{ fontSize: 12, color: 'var(--brand-color)', fontWeight: 500, padding: '0 12px 4px 22px', display: 'block', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit' }}
                      >
                        ＋ Assign faculty
                      </button>
                    )}
                  </div>
                )
              })}
              {/* Unassigned questions indicator */}
              {(() => {
                const assignedIds = new Set(activeAsmt.sections.flatMap(s => s.questionIds))
                const unassignedCount = activeAsmt.questions.filter(q => !assignedIds.has(q.questionId)).length
                if (unassignedCount === 0) return null
                return (
                  <div style={{ padding: '8px 12px', borderTop: '1px solid var(--border)' }}>
                    <p className="text-xs text-muted-foreground">
                      <i className="fa-light fa-layer-group" aria-hidden="true" style={{ marginRight: 4 }} />
                      {unassignedCount} unassigned
                    </p>
                  </div>
                )
              })()}
            </div>
          </div>

          {/* Center: section workspace — QB picker is now a Dialog */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>

            {/* PDF import banner */}
            {urlMode === 'pdf' && (
              <div
                className="flex items-center gap-3 px-4 py-2 text-xs shrink-0"
                style={{ background: 'var(--brand-tint)', borderBottom: '1px solid var(--border)' }}
              >
                <i className="fa-light fa-file-pdf shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
                <span className="text-foreground">
                  Built from PDF{urlSourceId ? `: ${decodeURIComponent(urlSourceId)}` : ''}.
                  Review and adjust — edit stems, swap options, or add from QB.
                </span>
              </div>
            )}

            {/* ── Section Workspace view ── */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {activeSection ? (
                <>
                  {/* Section header bar */}
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10, padding: '0 14px', height: 40,
                    borderBottom: '1px solid var(--border)', flexShrink: 0,
                    background: 'var(--card)',
                  }}>
                    <span className="text-sm font-semibold text-foreground" style={{ flexShrink: 0 }}>
                      {activeAsmt.sections.findIndex(s => s.id === activeSection.id) + 1}. {activeSection.title}
                    </span>
                    {/* Faculty — compact inline text label */}
                    {(() => {
                      const facIds = activeSection.facultyIds?.length ? activeSection.facultyIds : activeSection.facultyId ? [activeSection.facultyId] : []
                      const headerFaculty = facultyListRows.filter(f => facIds.includes(f.id))
                      if (headerFaculty.length === 0) return null
                      const label = headerFaculty.length === 1
                        ? headerFaculty[0].fullName
                        : `${headerFaculty[0].fullName.split(' ').slice(-1)[0]} +${headerFaculty.length - 1}`
                      return (
                        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'flex', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <i className="fa-light fa-user" aria-hidden="true" style={{ fontSize: 11 }} />
                          {label}
                        </span>
                      )
                    })()}
                    <div style={{ flex: 1 }} />
                    {/* Q count / ready */}
                    {sectionFillPct(activeSection) >= 80 ? (
                      <span style={{ fontSize: 12, color: 'var(--chart-2)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: 4 }}>
                        <i className="fa-solid fa-circle-check" aria-hidden="true" style={{ fontSize: 11 }} />
                        Ready
                      </span>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                        {activeSectionQuestions.length}{(() => {
                          const target = activeSection.fillTarget?.value ?? activeSection.questionTarget
                          return target ? `/${target}` : ''
                        })()} Q
                      </span>
                    )}
                    {/* Section analysis icon */}
                    {activeSectionQuestions.length > 0 && (
                      <button
                        type="button"
                        aria-label="Section analysis"
                        title="View section analysis"
                        onClick={() => setSectionAnalysisOpen(true)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: '4px 6px', borderRadius: 5, display: 'flex', alignItems: 'center', fontSize: 13 }}
                      >
                        <i className="fa-light fa-chart-simple" aria-hidden="true" />
                      </button>
                    )}
                  </div>

                  {/* Scrollable question list */}
                  <div style={{ flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>

                    {activeSectionQuestions.length === 0 ? (
                      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 20, padding: '32px 24px' }}>
                        <div style={{ textAlign: 'center' }}>
                          <p className="text-sm font-semibold text-foreground" style={{ marginBottom: 4 }}>No questions yet</p>
                          <p className="text-xs text-muted-foreground">Choose how to add questions to this section.</p>
                        </div>
                        <div style={{ display: 'flex', gap: 10, width: '100%', maxWidth: 480 }}>
                          {([
                            { method: 'qb' as const,     icon: 'fa-database',       label: 'Question Bank',  desc: 'Search and pick from saved questions' },
                            { method: 'pdf' as const,    icon: 'fa-file-pdf',       label: 'Import PDF',     desc: 'Upload a doc; Leo extracts questions' },
                            { method: 'manual' as const, icon: 'fa-pen-to-square',  label: 'From scratch',   desc: 'Write a question stem and options' },
                          ] as const).map(({ method, icon, label, desc }) => (
                            <button
                              key={method}
                              type="button"
                              onClick={() => { setPickerMethod(method); setPickerOpen(true) }}
                              style={{
                                flex: 1, textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit',
                                background: 'var(--background)',
                                border: '1px solid var(--border)',
                                borderRadius: 10, padding: '14px 14px 12px',
                                display: 'flex', flexDirection: 'column', gap: 8,
                              }}
                            >
                              <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                <i className={`fa-light ${icon}`} aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted-foreground)' }} />
                              </div>
                              <div>
                                <div className="text-xs font-semibold text-foreground" style={{ marginBottom: 2 }}>{label}</div>
                                <div className="text-xs text-muted-foreground">{desc}</div>
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                      {bulkSelectedIds.size > 0 && (
                        <div
                        role="status"
                        aria-live="polite"
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10, padding: '6px 14px',
                          background: 'var(--brand-tint)',
                          borderBottom: '1px solid var(--ring)',
                          flexShrink: 0,
                        }}
                      >
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-color)' }}>
                            {bulkSelectedIds.size} selected
                          </span>
                          <span style={{ color: 'var(--border)' }}>·</span>
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Set points:</span>
                          <input
                            type="number"
                            aria-label="Bulk set points for selected questions"
                            min={0}
                            placeholder="pts"
                            onKeyDown={e => {
                              if (e.key === 'Enter') {
                                const v = parseInt((e.target as HTMLInputElement).value)
                                if (!isNaN(v)) {
                                  bulkSetPoints([...bulkSelectedIds], v);
                                  (e.target as HTMLInputElement).value = ''
                                }
                              }
                            }}
                            style={{ width: 52, height: 26, textAlign: 'center', fontSize: 12, border: '1px solid var(--border)', borderRadius: 5, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', padding: '0 4px' }}
                          />
                          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>· Enter to apply</span>
                          {activeAsmt.sections.length > 1 && (
                            <>
                              <span style={{ color: 'var(--border)' }}>·</span>
                              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Move to:</span>
                              <select
                                aria-label="Move selected questions to section"
                                defaultValue=""
                                onChange={e => {
                                  const targetSectionId = e.target.value
                                  if (!targetSectionId || !activeAsmt) return
                                  const selectedIds = [...bulkSelectedIds]
                                  setActiveAsmt(prev => {
                                    if (!prev) return prev
                                    const sectionsWithout = prev.sections.map(sec => ({
                                      ...sec,
                                      questionIds: sec.questionIds.filter(qId => !selectedIds.includes(qId)),
                                    }))
                                    const sectionsWithMoved = sectionsWithout.map(sec => {
                                      if (sec.id !== targetSectionId) return sec
                                      const existing = new Set(sec.questionIds)
                                      const toAdd = selectedIds.filter(qId => !existing.has(qId))
                                      return { ...sec, questionIds: [...sec.questionIds, ...toAdd] }
                                    })
                                    return { ...prev, sections: sectionsWithMoved }
                                  })
                                  setBulkSelectedIds(new Set())
                                  e.target.value = ''
                                }}
                                style={{
                                  fontSize: 12, padding: '2px 6px', border: '1px solid var(--border)', borderRadius: 6,
                                  background: 'var(--background)', color: 'var(--foreground)', outline: 'none', cursor: 'pointer',
                                  fontFamily: 'inherit', height: 26,
                                }}
                              >
                                <option value="" disabled>Select section…</option>
                                {activeAsmt.sections.map(sec => (
                                  <option key={sec.id} value={sec.id}>{sec.title}</option>
                                ))}
                              </select>
                            </>
                          )}
                          <button
                            type="button"
                            onClick={() => setBulkSelectedIds(new Set())}
                            style={{ marginLeft: 'auto', background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'inherit' }}
                          >
                            Clear
                          </button>
                        </div>
                      )}
                      <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed' }}>
                        <colgroup>
                          <col style={{ width: 36 }} />{/* Bulk select */}
                          <col style={{ width: 52 }} />{/* # + reorder */}
                          <col />{/* Question — takes remaining width */}
                          <col style={{ width: 78 }} />{/* Type */}
                          <col style={{ width: 68 }} />{/* Difficulty */}
                          <col style={{ width: 84 }} />{/* Bloom's */}
                          <col style={{ width: 50 }} />{/* PBI */}
                          <col style={{ width: 48 }} />{/* By */}
                          <col style={{ width: 48 }} />{/* Pts */}
                          <col style={{ width: 32 }} />{/* Pin */}
                        </colgroup>
                        <thead>
                          <tr style={{ position: 'sticky', top: 0, zIndex: 1, background: 'var(--muted)', borderBottom: '1px solid var(--border)' }}>
                            <th scope="col" style={{ padding: '5px 8px', width: 36, textAlign: 'center' }}>
                              <input
                                type="checkbox"
                                aria-label="Select all questions"
                                checked={bulkSelectedIds.size === activeSectionQuestions.length && activeSectionQuestions.length > 0}
                                onChange={e => {
                                  if (e.target.checked) {
                                    setBulkSelectedIds(new Set(activeSectionQuestions.map(({ q }) => q.id)))
                                  } else {
                                    setBulkSelectedIds(new Set())
                                  }
                                }}
                                style={{ cursor: 'pointer' }}
                              />
                            </th>
                            {(['#', 'Question', 'Type', 'Diff.', 'Bloom\'s', 'PBI', 'By', 'Pts', ''] as const).map((label, i) => (
                              <th key={i} scope="col" style={{
                                padding: i === 0 ? '5px 4px' : '5px 8px',
                                fontSize: 12, fontWeight: 600,
                                color: 'var(--muted-foreground)',
                                textTransform: 'uppercase', letterSpacing: '0.05em',
                                textAlign: i === 0 ? 'center' : i >= 5 ? 'right' : 'left',
                                whiteSpace: 'nowrap',
                              }}>
                                {label}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {activeSectionQuestions.map(({ aq, q }, idx) => {
                            const pbiLow = q.pbis !== null && q.pbis < 0.2
                            const isPinned = pinnedQuestionIds.has(q.id)
                            const totalQ = activeSectionQuestions.length
                            const creatorPersona = q.creator ? PERSONA_BY_ID[q.creator] : null
                            const editorPersona = (q.lastEditedBy && q.lastEditedBy !== q.creator) ? PERSONA_BY_ID[q.lastEditedBy] : null
                            return (
                              <tr
                                key={q.id}
                                style={{
                                  borderBottom: '1px solid color-mix(in srgb, var(--border) 45%, transparent)',
                                  background: lastMovedId === q.id
                                    ? 'color-mix(in srgb, var(--brand-color) 10%, var(--background))'
                                    : isPinned ? 'color-mix(in srgb, var(--chart-2) 4%, var(--background))' : undefined,
                                  transition: 'background 0.6s ease',
                                }}
                              >
                                {/* Bulk select checkbox */}
                                <td style={{ padding: '4px 8px', textAlign: 'center', verticalAlign: 'middle' }}>
                                  <input
                                    type="checkbox"
                                    aria-label={`Select ${q.title}`}
                                    checked={bulkSelectedIds.has(q.id)}
                                    onChange={e => {
                                      e.stopPropagation()
                                      setBulkSelectedIds(prev => {
                                        const next = new Set(prev)
                                        if (e.target.checked) next.add(q.id)
                                        else next.delete(q.id)
                                        return next
                                      })
                                    }}
                                    style={{ cursor: 'pointer' }}
                                  />
                                </td>
                                {/* # + reorder */}
                                <td style={{ padding: '4px 4px', textAlign: 'center', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 1 }}>
                                    <button type="button" aria-label={`Move ${q.title} up`}
                                      onClick={e => { e.stopPropagation(); reorderQuestionInSection(activeSection.id, q.id, 'up') }}
                                      disabled={idx === 0}
                                      style={{ background: 'none', border: 'none', padding: '1px 4px', cursor: idx === 0 ? 'default' : 'pointer', color: 'var(--muted-foreground)', fontSize: 9, lineHeight: 1, opacity: idx === 0 ? 0.2 : 0.55 }}
                                    ><i className="fa-solid fa-angle-up" aria-hidden="true" /></button>
                                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{idx + 1}</span>
                                    <button type="button" aria-label={`Move ${q.title} down`}
                                      onClick={e => { e.stopPropagation(); reorderQuestionInSection(activeSection.id, q.id, 'down') }}
                                      disabled={idx === totalQ - 1}
                                      style={{ background: 'none', border: 'none', padding: '1px 4px', cursor: idx === totalQ - 1 ? 'default' : 'pointer', color: 'var(--muted-foreground)', fontSize: 9, lineHeight: 1, opacity: idx === totalQ - 1 ? 0.2 : 0.55 }}
                                    ><i className="fa-solid fa-angle-down" aria-hidden="true" /></button>
                                  </div>
                                </td>

                                {/* Question title */}
                                <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                                    {/* Provenance badge */}
                                    {(() => {
                                      const prov = aq.provenance
                                      if (!prov || prov === 'qb') return null
                                      const provenanceMap: Record<string, { icon: string; title: string; color: string }> = {
                                        pdf:    { icon: 'fa-file-lines',    title: 'Imported from PDF',      color: 'var(--chart-3)' },
                                        ai:     { icon: 'fa-sparkles',      title: 'AI-generated',           color: 'var(--brand-color)' },
                                        manual: { icon: 'fa-pen-to-square', title: 'Written from scratch',   color: 'var(--muted-foreground)' },
                                        copied: { icon: 'fa-copy',          title: 'Copied from prior exam', color: 'var(--chart-4)' },
                                      }
                                      const p = provenanceMap[prov]
                                      if (!p) return null
                                      return (
                                        <span title={p.title} style={{ flexShrink: 0 }}>
                                          <i className={`fa-light ${p.icon}`} aria-hidden="true" style={{ fontSize: 10, color: p.color }} />
                                        </span>
                                      )
                                    })()}
                                    <span
                                      role="button"
                                      tabIndex={0}
                                      style={{ fontSize: 13, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--foreground)', cursor: 'pointer', lineHeight: 1.4 }}
                                      onClick={() => setDetailQuestionId(prev => prev === q.id ? null : q.id)}
                                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') setDetailQuestionId(prev => prev === q.id ? null : q.id) }}
                                    >
                                      {q.title}
                                    </span>
                                    {(() => {
                                      const flag = activeAsmt.healthFlags.find(f => f.questionId === q.id)
                                      if (!flag) return null
                                      const flagTitle = (() => {
                                        if (flag.type === 'missing-rationale') return 'Missing rationale'
                                        if (flag.type === 'poor-pbis') return `Low pt-biserial (${flag.pbis.toFixed(2)})`
                                        if (flag.type === 'poor-discriminator') return `Poor discriminator (pbis ${flag.pbis.toFixed(2)})`
                                        if (flag.type === 'extreme-difficulty') return `Extreme difficulty (p=${flag.pValue.toFixed(2)})`
                                        if (flag.type === 'near-zero-discrimination') return `Near-zero discrimination (D=${flag.discriminationIndex.toFixed(2)})`
                                        return 'Quality flag'
                                      })()
                                      return (
                                        <i
                                          className="fa-solid fa-triangle-exclamation"
                                          aria-hidden="true"
                                          title={flagTitle}
                                          style={{ fontSize: 11, color: 'var(--chart-4)', flexShrink: 0 }}
                                        />
                                      )
                                    })()}
                                  </div>
                                </td>

                                {/* Type */}
                                <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                  <span style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: 'var(--muted-foreground)' }}>
                                    {TYPE_ICONS_Q[q.type] && <i className={TYPE_ICONS_Q[q.type]} aria-hidden="true" style={{ fontSize: 11, flexShrink: 0 }} />}
                                    <span style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{q.type}</span>
                                  </span>
                                </td>

                                {/* Difficulty */}
                                <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                  <span style={{ fontSize: 12, fontWeight: 600, color: DIFF_COLORS[q.difficulty] ?? 'var(--muted-foreground)' }}>
                                    {q.difficulty}
                                  </span>
                                </td>

                                {/* Bloom's */}
                                <td style={{ padding: '8px 8px', verticalAlign: 'middle' }}>
                                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'block' }}>
                                    {q.blooms}
                                  </span>
                                </td>

                                {/* PBI */}
                                <td style={{ padding: '8px 8px', verticalAlign: 'middle', textAlign: 'right' }}>
                                  {q.pbis !== null ? (
                                    <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', display: 'inline-flex', alignItems: 'center', gap: 3 }}>
                                      {pbiLow && <i className="fa-light fa-triangle-exclamation" aria-hidden="true" />}
                                      {q.pbis.toFixed(2)}
                                    </span>
                                  ) : (
                                    <span style={{ fontSize: 12, color: 'var(--border)' }}>—</span>
                                  )}
                                </td>

                                {/* By — creator + editor avatars (DS AvatarGroup, neutral) */}
                                <td style={{ padding: '8px 6px', verticalAlign: 'middle', textAlign: 'right' }}>
                                  <TooltipProvider>
                                    <AvatarGroup className="justify-end">
                                      {creatorPersona && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Avatar size="sm">
                                              <AvatarFallback>{creatorPersona.initials}</AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent>Created by {creatorPersona.name}</TooltipContent>
                                        </Tooltip>
                                      )}
                                      {editorPersona && (
                                        <Tooltip>
                                          <TooltipTrigger asChild>
                                            <Avatar size="sm">
                                              <AvatarFallback>{editorPersona.initials}</AvatarFallback>
                                            </Avatar>
                                          </TooltipTrigger>
                                          <TooltipContent>Edited by {editorPersona.name}</TooltipContent>
                                        </Tooltip>
                                      )}
                                    </AvatarGroup>
                                  </TooltipProvider>
                                </td>

                                {/* Pts — editable point value */}
                                <td style={{ padding: '4px 6px', verticalAlign: 'middle', textAlign: 'right' }}>
                                  <input
                                    type="number"
                                    aria-label={`Points for ${q.title}`}
                                    min={0}
                                    value={aq.points}
                                    onClick={e => e.stopPropagation()}
                                    onChange={e => {
                                      const v = parseInt(e.target.value)
                                      updateQuestionPoints(q.id, isNaN(v) ? 0 : v)
                                    }}
                                    style={{
                                      width: 38, height: 24, textAlign: 'center', fontSize: 12,
                                      border: '1px solid var(--border)', borderRadius: 5,
                                      background: 'var(--background)', color: 'var(--foreground)',
                                      outline: 'none', padding: '0 4px',
                                    }}
                                  />
                                </td>

                                {/* Pin */}
                                <td style={{ padding: '8px 6px', verticalAlign: 'middle', textAlign: 'center' }}>
                                  <button
                                    type="button"
                                    aria-label={isPinned ? `Unpin ${q.title}` : `Pin ${q.title} — won't be randomized`}
                                    title={isPinned ? 'Pinned — stays fixed during randomization' : 'Pin to fix position during randomization'}
                                    onClick={e => { e.stopPropagation(); togglePinQuestion(q.id) }}
                                    style={{ background: 'none', border: 'none', padding: '3px', cursor: 'pointer', color: isPinned ? 'var(--brand-color)' : 'var(--muted-foreground)', fontSize: 11, opacity: isPinned ? 1 : 0.35 }}
                                  >
                                    <i className={isPinned ? 'fa-solid fa-thumbtack' : 'fa-light fa-thumbtack'} aria-hidden="true" />
                                  </button>
                                </td>
                              </tr>
                            )
                          })}
                        </tbody>
                      </table>

                      {/* Footer: add actions — only shown when section has questions */}
                      <div style={{
                        display: 'flex', alignItems: 'center', gap: 8,
                        padding: '8px 14px', borderTop: '1px solid var(--border)',
                        color: 'var(--muted-foreground)', fontSize: 12, flexShrink: 0,
                      }}>
                        <button
                          type="button"
                          onClick={() => setPickerOpen(true)}
                          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'inherit', padding: 0 }}
                        >
                          + Add questions
                        </button>
                      </div>
                      </>
                    )}
                  </div>
                </>
              ) : (
                /* No section selected */
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 12, padding: 24 }}>
                  {activeAsmt.sections.length === 0 ? (
                    <>
                      <i className="fa-light fa-layer-group text-muted-foreground" aria-hidden="true" style={{ fontSize: 24 }} />
                      <p className="text-sm text-muted-foreground text-center">No sections yet. Add a section in the left panel to get started.</p>
                      <Button variant="outline" size="sm" onClick={() => setPickerOpen(true)} className="gap-1.5">
                        <i className="fa-light fa-plus" aria-hidden="true" />
                        Add questions
                      </Button>
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">Select a section from the left panel.</p>
                  )}
                </div>
              )}
            </div>

            {/* ── AI Prompt Bar ─────────────────────────────────────── */}
            {activeSection && (
              <div style={{
                borderTop: '1px solid var(--border)', flexShrink: 0, background: 'var(--card)',
              }}>
                {aiPromptOpen ? (
                  <div style={{ padding: '8px 12px', display: 'flex', flexDirection: 'column', gap: 6 }}>
                    <textarea
                      autoFocus
                      rows={2}
                      placeholder={`Ask Leo to adjust "${activeSection.title}"… e.g. "Add 3 MCQ on pharmacology at medium difficulty"`}
                      value={aiPromptText}
                      onChange={e => setAiPromptText(e.target.value)}
                      onKeyDown={e => {
                        if (e.key === 'Escape') { setAiPromptOpen(false); setAiPromptText('') }
                        if (e.key === 'Enter' && !e.shiftKey && aiPromptText.trim()) {
                          e.preventDefault()
                          setAiBuilding(true)
                          setTimeout(() => { setAiBuilding(false); setAiPromptOpen(false); setAiPromptText('') }, 1800)
                        }
                      }}
                      style={{
                        width: '100%', fontSize: 13, padding: '6px 9px', resize: 'none',
                        border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'inherit',
                        color: 'var(--foreground)', background: 'var(--background)', outline: 'none',
                        boxSizing: 'border-box', lineHeight: 1.5,
                      }}
                    />
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Enter to send · Shift+Enter for new line · Esc to close</span>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <button type="button" onClick={() => { setAiPromptOpen(false); setAiPromptText('') }}
                          style={{ fontSize: 12, padding: '3px 8px', background: 'none', border: '1px solid var(--border)', borderRadius: 5, cursor: 'pointer', color: 'var(--muted-foreground)', fontFamily: 'inherit' }}>
                          Cancel
                        </button>
                        <button
                          type="button"
                          disabled={!aiPromptText.trim() || aiBuilding}
                          onClick={() => {
                            setAiBuilding(true)
                            setTimeout(() => { setAiBuilding(false); setAiPromptOpen(false); setAiPromptText('') }, 1800)
                          }}
                          style={{ fontSize: 12, padding: '3px 10px', background: 'var(--brand-color)', border: 'none', borderRadius: 5, cursor: aiPromptText.trim() ? 'pointer' : 'default', color: '#fff', fontWeight: 600, fontFamily: 'inherit', opacity: aiPromptText.trim() ? 1 : 0.5 }}
                        >
                          {aiBuilding ? 'Building…' : 'Send'}
                        </button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setAiPromptOpen(true)}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 8, width: '100%', padding: '8px 14px',
                      background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                    }}
                  >
                    <i className="fa-light fa-sparkles" aria-hidden="true" style={{ fontSize: 13, color: 'var(--brand-color)' }} />
                    <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Ask Leo to adjust this section…</span>
                  </button>
                )}
              </div>
            )}
          </div>

          {/* Right panel — 3 states: health / settings / section */}
          <div style={{ width: 280, minWidth: 280, borderLeft: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
            {(rightPanelMode === 'health' || (rightPanelMode === 'section' && !activeSectionId)) && (
              <HealthPanel
                activeAsmt={activeAsmt}
                objectives={courseObjectives.filter(o => o.courseId === activeAsmt.courseId)}
                timeMetrics={timeMetrics}
                distribution={distribution}
                bloomsMetrics={bloomsMetrics}
              />
            )}
            {rightPanelMode === 'settings' && (
              <Step2SettingsPanel
                settings={activeAsmt.settings}
                onPatch={(patch: Partial<import('@/lib/qb-types').AssessmentSettings>) => setActiveAsmt(prev => prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev)}
                onClose={() => setRightPanelMode('health')}
              />
            )}
            {rightPanelMode === 'section' && activeSectionId && (
              <Step2SectionSettingsPanel
                section={activeAsmt.sections.find(s => s.id === activeSectionId)!}
                faculty={facultyListRows}
                onPatch={(patch: Partial<import('@/lib/qb-types').AssessmentSection>) => setActiveAsmt(prev => {
                  if (!prev) return prev
                  return {
                    ...prev,
                    sections: prev.sections.map(s =>
                      s.id === activeSectionId ? { ...s, ...patch } : s
                    ),
                  }
                })}
                onClose={() => setRightPanelMode('health')}
              />
            )}
          </div>
        </div>
      )}

      {/* Build tab — no active assessment */}
      {activeTab === 'build' && !activeAsmt && (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: 12 }}>
          <p className="text-sm text-muted-foreground">No assessment found. Start from the canvas.</p>
          <Button size="sm" onClick={() => router.push('/assessment-builder/create')} className="gap-1.5">
            <i className="fa-light fa-arrow-left" aria-hidden="true" />
            Back to canvas
          </Button>
        </div>
      )}

      {/* ── QB Picker Dialog (centered modal) ──────────────────────────────── */}
      {pickerOpen && (
        <AddQuestionsModal
          initialMethod={pickerMethod}
          selectedIds={selectedIds}
          onToggle={toggleQuestion}
          activeSection={activeSection}
          activeAsmt={activeAsmt}
          onClose={() => setPickerOpen(false)}
        />
      )}

      {/* ── Review tab ────────────────────────────────────────────────────── */}
      {activeTab === 'review' && (
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
          {/* Admin preview bar */}
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8,
            padding: '8px 14px', borderBottom: '1px solid var(--border)',
            background: 'var(--muted)', flexShrink: 0, fontSize: 12, color: 'var(--muted-foreground)',
          }}>
            <span style={{ flex: 1 }}>Admin view — students won&apos;t see this bar.</span>
            {activeAsmt?.sections.map((sec, idx) => (
              <Button key={sec.id} variant="ghost" size="sm" style={{ fontSize: 12, height: 26 }}>
                {idx + 1}. {sec.title}
              </Button>
            ))}
          </div>

          <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
            {/* Left: student sim + readiness */}
            <div style={{ flex: 1, overflowY: 'auto', borderRight: '1px solid var(--border)' }}>
              {/* ── Student taker simulation ── */}
              <div style={{ borderBottom: '1px solid var(--border)' }}>
                {/* ET toolbar */}
                <div style={{ height: 52, background: 'var(--card)', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10 }}>
                  <span style={{ fontSize: 14, fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--foreground)' }}>EM</span>
                  <span style={{ width: 1, height: 20, background: 'var(--border)' }} />
                  <span style={{ fontSize: 13, fontWeight: 500, flex: 1, textAlign: 'center', color: 'var(--foreground)' }}>
                    {activeAsmt?.title ?? 'Assessment'}
                  </span>
                  <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)', fontVariantNumeric: 'tabular-nums' }}>01:26:44</span>
                  <Button variant="outline" size="sm" style={{ marginLeft: 8 }}>Submit</Button>
                </div>
                {/* Progress bar */}
                <div style={{ height: 3, background: 'var(--muted)' }}>
                  <div style={{ height: '100%', width: '35%', background: 'var(--brand-color)' }} />
                </div>
                {/* Question card */}
                <div style={{ padding: '16px 28px', background: 'oklch(0.975 0.005 270)' }}>
                  <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 10, padding: 16, maxWidth: 580, margin: '0 auto' }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: 8 }}>
                      Question 1 of {activeAsmt?.questions.length ?? 20} — {activeAsmt?.sections[0]?.title ?? 'Section 1'}
                    </div>
                    <div style={{ fontSize: 13, lineHeight: 1.6, marginBottom: 12, color: 'var(--foreground)' }}>
                      {(() => {
                        const firstQ = activeAsmt?.sections[0]?.questionIds[0]
                          ? MOCK_QB_QUESTIONS.find(q => q.id === activeAsmt?.sections[0]?.questionIds[0])
                          : MOCK_QB_QUESTIONS[0]
                        return firstQ?.title ?? 'A 68-year-old patient with reduced ejection fraction heart failure is started on metoprolol succinate. Which best explains the long-term benefit?'
                      })()}
                    </div>
                    {['Increased heart rate improves cardiac output', 'Reverse remodeling reduces ventricular wall stress over time', 'Direct inotropic effect augments stroke volume', 'Peripheral vasodilation reduces afterload acutely'].map((opt, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'baseline', gap: 10,
                        border: `2px solid ${i === 1 ? 'var(--brand-color)' : 'var(--border)'}`,
                        borderRadius: 10, padding: '10px 14px', marginBottom: 8,
                        background: i === 1 ? 'var(--brand-tint)' : 'transparent',
                        fontSize: 13, cursor: 'pointer', color: 'var(--foreground)',
                      }}>
                        <span style={{
                          width: 28, height: 28, borderRadius: 6, fontSize: 12, fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                          background: i === 1 ? 'var(--brand-color)' : 'var(--muted)',
                          color: i === 1 ? '#fff' : 'var(--muted-foreground)',
                        }}>
                          {String.fromCharCode(65 + i)}
                        </span>
                        {opt}
                      </div>
                    ))}
                  </div>
                </div>
                {/* ET footer */}
                <div style={{ height: 52, background: 'var(--card)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 20px', gap: 10 }}>
                  <Button variant="outline" size="sm">← Previous</Button>
                  <div style={{ fontSize: 13, fontWeight: 600, background: 'var(--muted)', borderRadius: 20, padding: '4px 14px', margin: '0 auto' }}>Q 1 / {activeAsmt?.questions.length ?? 20}</div>
                  <Button variant="ghost" size="sm">Flag</Button>
                  <Button size="sm">Next →</Button>
                </div>
              </div>

              {/* ── Readiness check ── */}
              <div style={{ padding: 20 }}>
                <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 14, color: 'var(--foreground)' }}>Readiness check</p>
                {[
                  {
                    ok: (activeAsmt?.questions.length ?? 0) >= 1,
                    label: `${activeAsmt?.questions.length ?? 0} questions across ${activeAsmt?.sections.length ?? 0} sections`,
                    status: (activeAsmt?.questions.length ?? 0) >= 1 ? 'Complete' : 'Incomplete',
                  },
                  {
                    ok: !activeAsmt || activeAsmt.sections.length === 0 || activeAsmt.sections.every(s => (s.facultyIds?.length ?? 0) > 0 || !!s.facultyId),
                    label: 'All sections assigned to faculty',
                    status: (!activeAsmt || activeAsmt.sections.length === 0 || activeAsmt.sections.every(s => (s.facultyIds?.length ?? 0) > 0 || !!s.facultyId)) ? 'Complete' : 'Incomplete',
                  },
                  {
                    ok: !!(activeAsmt?.settings?.openDate),
                    label: activeAsmt?.settings?.openDate
                      ? `Exam window set (${new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric' }).format(new Date(activeAsmt.settings.openDate))})`
                      : 'Exam window not set',
                    status: !!(activeAsmt?.settings?.openDate) ? 'Complete' : 'Incomplete',
                  },
                  {
                    ok: false,
                    warn: true,
                    label: `${MOCK_QB_QUESTIONS.filter(q => selectedIds.has(q.id) && q.pbis !== null && q.pbis < 0.2).length} questions with low pt. bi-serial (<0.20)`,
                    status: 'Review',
                  },
                  {
                    ok: false,
                    warn: true,
                    label: 'Not yet approved by department chair',
                    status: 'Pending',
                  },
                ].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                    <span style={{ fontSize: 16 }}>{item.ok ? '✅' : item.warn ? '⚠️' : '❌'}</span>
                    <span style={{ fontSize: 13, flex: 1, color: 'var(--foreground)' }}>{item.label}</span>
                    <span style={{ fontSize: 12, fontWeight: 600, color: item.ok ? 'var(--chart-2)' : 'var(--chart-4)' }}>{item.status}</span>
                  </div>
                ))}

                <div style={{ height: 1, background: 'var(--border)', margin: '14px 0' }} />

                {/* Send for review box */}
                <div style={{
                  background: 'var(--muted)',
                  border: '1px solid var(--border)',
                  borderRadius: 10, padding: 14, marginBottom: 14,
                }}>
                  <p style={{ fontSize: 13, fontWeight: 600, marginBottom: 4, color: 'var(--foreground)' }}>Send for review</p>
                  <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 10, lineHeight: 1.4 }}>
                    Your department chair reviews question quality, difficulty mix, and coverage before publishing.
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 7, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 8, marginBottom: 7, background: 'var(--background)' }}>
                    <div style={{ width: 28, height: 28, borderRadius: '50%', background: '#7c6bbf', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 700, color: '#fff', flexShrink: 0 }}>DK</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>Dr. Kapoor</div>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Program Director</div>
                    </div>
                    <span style={{ fontSize: 12, padding: '2px 7px', borderRadius: 4, background: 'var(--muted)', color: 'var(--muted-foreground)' }}>Reviewer</span>
                  </div>
                  <Button size="sm" style={{ width: '100%', justifyContent: 'center' }} onClick={() => setSendForReviewOpen(true)}>
                    Send for review
                  </Button>
                </div>
              </div>
            </div>

            {/* Right: publish panel (280px) */}
            <div style={{ width: 280, flexShrink: 0, overflowY: 'auto', padding: 16 }}>
              <div style={{
                background: 'var(--brand-tint)',
                border: '1px solid var(--ring)',
                borderRadius: 10, padding: 14,
              }}>
                <p style={{ fontSize: 14, fontWeight: 700, marginBottom: 4, color: 'var(--foreground)' }}>Ready to publish?</p>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 12, lineHeight: 1.4 }}>
                  Students in the {activeAsmt ? 'Spring 2026' : ''} offering will be notified and can access the exam during the scheduled window.
                </p>
                {activeAsmt?.settings?.openDate && (
                  <>
                    <div style={{ marginBottom: 10 }}>
                      <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 3 }}>Opens</div>
                      <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                        {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(activeAsmt.settings.openDate))}
                      </div>
                    </div>
                    {activeAsmt.settings.closeDate && (
                      <div style={{ marginBottom: 14 }}>
                        <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 3 }}>Closes</div>
                        <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>
                          {new Intl.DateTimeFormat('en-US', { month: 'long', day: 'numeric', year: 'numeric', hour: 'numeric', minute: '2-digit' }).format(new Date(activeAsmt.settings.closeDate))}
                        </div>
                      </div>
                    )}
                  </>
                )}
                {!activeAsmt?.settings?.openDate && (
                  <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 14 }}>No exam window set yet. Add dates in Settings.</p>
                )}
                <Button size="sm" style={{ width: '100%', justifyContent: 'center' }} onClick={handlePublish}>
                  Publish assessment
                </Button>
                <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 8, textAlign: 'center' }}>Review not required to publish</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Sheets + modals — always mounted so they survive tab transitions */}
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
      <QuestionDetailSheet
        questionId={detailQuestionId}
        questions={MOCK_QB_QUESTIONS}
        open={detailQuestionId !== null}
        onOpenChange={(o) => { if (!o) setDetailQuestionId(null) }}
        onEdit={(id) => { setEditingQuestionId(id); setDetailQuestionId(null) }}
        gradingConfig={
          activeAsmt?.questions.find(aq => aq.questionId === detailQuestionId)?.gradingConfig
        }
        assessmentNegativeMarking={activeAsmt ? {
          enabled: activeAsmt.settings.negativeMarking,
          fraction: activeAsmt.settings.negativeMarkingFraction,
        } : undefined}
        assessmentDigitalTools={activeAsmt?.settings.digitalTools}
        onGradingConfigChange={(patch) => {
          if (!detailQuestionId) return
          setActiveAsmt(prev => prev ? {
            ...prev,
            questions: prev.questions.map(aq =>
              aq.questionId === detailQuestionId
                ? { ...aq, gradingConfig: { ...(aq.gradingConfig ?? {}), ...patch } }
                : aq
            ),
          } : prev)
        }}
        bonus={activeAsmt?.questions.find(aq => aq.questionId === detailQuestionId)?.bonus}
        onBonusChange={(v) => {
          if (!detailQuestionId) return
          updateQuestionBonus(detailQuestionId, v)
        }}
      />
      <SectionAssignSheet
        open={assignSheetSectionId !== null}
        onOpenChange={(o) => { if (!o) setAssignSheetSectionId(null) }}
        section={activeAsmt?.sections.find(s => s.id === assignSheetSectionId) ?? null}
        sectionIndex={activeAsmt?.sections.findIndex(s => s.id === assignSheetSectionId) ?? -1}
        collaboratorIds={activeAsmt?.collaboratorIds ?? []}
        onAssignFaculty={(sectionId, patch) => updateSection(sectionId, patch)}
      />
      <SectionAnalysisSheet
        open={sectionAnalysisOpen}
        onOpenChange={setSectionAnalysisOpen}
        section={activeSection}
        sectionIndex={activeAsmt?.sections.findIndex(s => s.id === activeSectionId) ?? -1}
        questions={activeSectionQuestions.map(({ q }) => q)}
        pinnedQuestionIds={pinnedQuestionIds}
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
      <div className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground" style={{
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
      <Button variant="outline" size="sm" onClick={() => onAssign(null)} style={{ height: 28, gap: 4 }}>
        <i className="fa-light fa-check" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
        Added
      </Button>
    )
  }

  if (sections.length === 0) {
    return (
      <Button variant="default" size="sm" onClick={() => onAssign(null)} style={{ height: 28 }}>
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
        style={{ height: 28, gap: 4 }}
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
            boxShadow: '0 4px 12px var(--border)',
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
type PickerSource = 'this-course' | 'other-courses' | 'new-question' | 'ai-generate' | 'pdf-import'

function ABQuestionPicker({
  selectedIds, onToggle, activeAsmt, onDurationChange,
  userCreated, onCreateQuestion, onCreateFromDraft, authorPersonaId, onOpenAi,
  isCopyMode, onRenameAsmt, onAssignToSection, activeSectionId,
}: {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeAsmt: AssessmentDraft
  onDurationChange: (min: number) => void
  userCreated: Question[]
  onCreateQuestion: (input: { title: string; options: string[]; correctIdx: number }) => Question
  onCreateFromDraft: (draft: QuestionDraft, dest: SaveDestination) => Question
  authorPersonaId: string
  onOpenAi: () => void
  isCopyMode: boolean
  onRenameAsmt: (title: string) => void
  onAssignToSection?: (questionId: string, sectionId: string | null) => void
  activeSectionId?: string | null
}) {
  const [source, setSource] = useState<PickerSource>('this-course')
  const [searchQuery, setSearchQuery] = useState('')
  const [activeFilters, setActiveFilters] = useState<QbFilter[]>([])
  const [otherCourseId, setOtherCourseId] = useState<string>('')
  const [selectedContentAreaId, setSelectedContentAreaId] = useState<string | null>(null)

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
    let qs = contentAreaFilteredQuestions
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase()
      qs = qs.filter(item => item.title.toLowerCase().includes(q))
    }
    for (const f of activeFilters) {
      if (f.key === 'difficulty') qs = qs.filter(item => item.difficulty === f.label)
      if (f.key === 'type') qs = qs.filter(item => item.type === f.label)
      if (f.key === 'blooms') qs = qs.filter(item => item.blooms === f.label)
    }
    return qs
  }, [contentAreaFilteredQuestions, searchQuery, activeFilters])

  const sourceTabs: Array<{ id: PickerSource; label: string; icon: string; sub: string }> = [
    { id: 'this-course',   label: thisCourse ? `${thisCourse.code} bank` : 'This course',   icon: 'fa-folder',          sub: 'Default — pull from this course' },
    { id: 'other-courses', label: 'Other courses',     icon: 'fa-folder-tree',     sub: 'Pull from another course\'s QB' },
    { id: 'new-question',  label: 'New question',      icon: 'fa-pen-to-square',   sub: 'Create inline in this assessment' },
    { id: 'ai-generate',   label: 'AI gap fill',        icon: 'fa-sparkles',        sub: 'Cover untested objectives' },
    { id: 'pdf-import',    label: 'Import PDF',         icon: 'fa-file-pdf',        sub: 'Extract questions from a document' },
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
            onFocus={e => { (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
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

      {/* Copy mode banner */}
      {isCopyMode && activeAsmt.questions.length > 0 && (
        <div
          className="flex items-center gap-3 px-4 py-2.5 text-xs shrink-0"
          style={{ backgroundColor: 'var(--brand-tint)', borderBottom: '1px solid var(--border)' }}
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
                background: isActive ? 'var(--brand-tint)' : 'transparent',
                color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
              }}
              aria-current={isActive ? 'page' : undefined}
            >
              <span className="text-xs font-semibold flex items-center gap-1.5">
                <i className={`fa-light ${t.icon}`} aria-hidden="true" />
                {t.label}
              </span>
              <span className="text-xs text-muted-foreground">{t.sub}</span>
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
            <span className="text-xs text-muted-foreground">
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

      {/* QbSearchBar — AI search + filter tags for QB sources */}
      {isQbSource && (
        <QbSearchBar
          value={searchQuery}
          onChange={setSearchQuery}
          activeFilters={activeFilters}
          onRemoveFilter={(key, label) =>
            setActiveFilters(prev => prev.filter(f => !(f.key === key && f.label === label)))
          }
          resultCount={filteredQuestions.length}
        />
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

      {/* PDF import source */}
      {source === 'pdf-import' && (
        <PdfImportPanel
          selectedIds={selectedIds}
          onToggle={onToggle}
          activeSectionId={activeSectionId}
          onAssignToSection={onAssignToSection}
          onBack={() => setSource('this-course')}
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
              <TableHead style={{ width: 60 }}>PBI</TableHead>
              <TableHead style={{ width: 72 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredQuestions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-sm text-muted-foreground" style={{ textAlign: 'center', padding: '40px 20px' }}>
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
                  <TableCell className="text-xs font-mono text-foreground">
                    {q.pbis !== null ? (
                      <span style={{ display: 'flex', alignItems: 'center', gap: 3 }}>
                        {q.pbis < 0.2 && <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 9 }} />}
                        {q.pbis.toFixed(2)}
                      </span>
                    ) : '—'}
                  </TableCell>
                  <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {isPicked ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => onToggle(q.id)}
                        style={{ height: 28 }}
                        aria-label={`Remove ${q.title} from assessment`}
                      >
                        <i className="fa-light fa-check" aria-hidden="true" style={{ color: 'var(--chart-2)', marginRight: 4 }} />
                        Added
                      </Button>
                    ) : (
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => onToggle(q.id)}
                        style={{ height: 28 }}
                      >
                        + Use
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
      )}

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
            <span className="text-xs text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Total</span>
            <span className="text-sm font-semibold text-foreground" style={{ lineHeight: 1 }}>{formatMin(timeMetrics.totalMin)}</span>
          </div>
          {/* Avg / question */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-xs text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Avg / Q</span>
            <span className="text-sm font-semibold text-foreground" style={{ lineHeight: 1 }}>
              {timeMetrics.avgMin > 0 ? formatMin(timeMetrics.avgMin) : '—'}
            </span>
          </div>
          {/* Allotted — number input + preset select */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-xs text-muted-foreground" style={{ whiteSpace: 'nowrap' }}>Allotted</span>
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
            <span className={`text-xs font-semibold ${overtime.cls}`}>{overtime.label}</span>
          </div>
        ) : (
          <span className="text-xs text-muted-foreground">Select questions to estimate</span>
        )}
      </div>

      {/* Bloom's */}
      {bloomsMetrics.length > 0 && (
        <>
          <SEP />
          <div style={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
            <span className="text-xs font-bold uppercase tracking-[0.07em] text-muted-foreground">
              Bloom&rsquo;s
            </span>
            {bloomsMetrics.slice(0, 3).map(b => (
              <div key={b.level} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10, minWidth: 136 }}>
                <span className="text-xs text-foreground">{b.level}</span>
                <span className="text-xs font-semibold text-foreground">{b.pct}%</span>
              </div>
            ))}
            {bloomsMetrics.length > 3 && (
              <span className="text-xs text-muted-foreground">+{bloomsMetrics.length - 3} more</span>
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
            <span className="text-xs uppercase tracking-wider font-bold text-muted-foreground">
              Added this session · {userCreated.length}
            </span>
          </div>
          <ul className="flex flex-col gap-1">
            {userCreated.map(q => (
              <li
                key={q.id}
                className="rounded-md px-3 py-2 text-xs flex items-center gap-2"
                style={{
                  background: 'var(--brand-tint)',
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
                <span className="text-xs text-muted-foreground">{q.age}</span>
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
  totalAssigned,
  bonusTotal,
  unassignedPts,
  sectionSubtotals,
  onBack,
  onSaveAsDraft,
  onSendToChair,
  onPublish,
  onOpenGradingTray,
}: {
  activeAsmt: AssessmentDraft
  courseLabel: string
  distribution: { Easy: number; Medium: number; Hard: number }
  bloomsMetrics: { level: string; count: number; pct: number }[]
  timeMetrics: { totalMin: number; avgMin: number }
  totalAssigned: number
  bonusTotal: number
  unassignedPts: number
  sectionSubtotals: Map<string, number>
  onBack: () => void
  onSaveAsDraft: () => void
  onSendToChair: () => void
  onPublish: () => void
  onOpenGradingTray: () => void
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

        {/* Unassigned points warning */}
        {activeAsmt.settings.graded && unassignedPts !== 0 && (
          <LocalBanner variant="warning">
            <span>
              {Math.abs(unassignedPts)} pts {unassignedPts > 0 ? 'unassigned' : 'over budget'} — question point values don&apos;t add up to {activeAsmt.settings.totalMarks} pts.{' '}
              <button
                type="button"
                onClick={() => { onBack(); onOpenGradingTray() }}
                aria-label="Fix points in Build step"
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0, textDecoration: 'underline', fontWeight: 600 }}
              >
                Fix in Build →
              </button>
            </span>
          </LocalBanner>
        )}

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
                background: hasIssues ? 'var(--muted)' : 'var(--brand-tint)',
                border: `1px solid ${hasIssues ? 'var(--border)' : 'var(--ring)'}`,
              }}
            >
              <i
                className={`fa-light ${hasIssues ? 'fa-triangle-exclamation' : 'fa-circle-check'} shrink-0`}
                aria-hidden="true"
                style={{
                  fontSize: 16,
                  color: hasIssues ? 'var(--muted-foreground)' : 'var(--brand-color)',
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
                backgroundColor: 'var(--brand-tint)',
                color: 'var(--brand-color)',
              }}
            >
              {s.type}
            </Badge>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
            {[
              { label: 'Questions', value: String(totalQ) },
              { label: 'Duration',  value: `${activeAsmt.durationMinutes} min` },
              { label: 'Password',  value: s.passwordRequired ? 'Required' : 'None' },
              { label: 'Randomize', value: s.randomize ? 'On' : 'Off' },
              s.graded
                ? { label: 'Total', value: bonusTotal > 0 ? `${s.totalMarks} pts +${bonusTotal}` : `${s.totalMarks} pts` }
                : { label: 'Total', value: 'Ungraded' },
            ].map(({ label, value }) => (
              <div key={label}>
                <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
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
              {bars.map(bar => {
                const barPts = s.graded ? activeAsmt.questions
                  .filter(q => {
                    const m = MOCK_QB_QUESTIONS.find(mq => mq.id === q.questionId)
                    return m?.difficulty === bar.label && !q.bonus
                  })
                  .reduce((sum, q) => sum + q.points, 0) : 0
                const pct = s.graded && s.totalMarks > 0 ? Math.round((barPts / s.totalMarks) * 100) : 0
                return (
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
                    {s.graded && barPts > 0 && (
                      <span className="text-xs text-muted-foreground shrink-0 tabular-nums">
                        · {barPts} pts ({pct}%)
                      </span>
                    )}
                  </div>
                )
              })}
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
                  <div className="flex items-center gap-3">
                    {s.graded && (
                      <span className="text-xs text-muted-foreground tabular-nums">
                        {sectionSubtotals.get(section.id) ?? 0} pts
                      </span>
                    )}
                    <Badge variant="secondary" className="rounded text-xs">
                      {section.questionIds.length} Q
                    </Badge>
                  </div>
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
      <span className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</span>
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
            <Badge variant="outline" className="text-xs">
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
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-2 pt-3">
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
              ? 'var(--muted)'
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
            style={{ background: 'var(--muted)', border: '1px solid var(--border)' }}
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
        <p className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground">
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
                <span className="text-xs text-muted-foreground tabular-nums shrink-0 mt-0.5 w-4 text-right">
                  {item.order}.
                </span>
                <p
                  className="text-xs text-foreground leading-snug flex-1 min-w-0"
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
  totalScore,
  psychoMetrics,
}: {
  distribution: { Easy: number; Medium: number; Hard: number }
  timeMetrics: { totalMin: number; avgMin: number }
  overtimeMetrics: { allottedMin: number; delta: number; pct: number } | null
  durationMinutes: number
  bloomsMetrics: { level: string; count: number; pct: number }[]
  totalScore: number
  psychoMetrics: {
    avgPValue: number | null
    avgPbis: number | null
    avgDiscriminationIndex: number | null
    upper27avg: number | null
    lower27avg: number | null
    hasData: boolean
  } | null
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
        <p className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground mb-1">Questions</p>
        <p className="text-2xl font-bold text-foreground">{total}</p>
        <p className="text-xs text-muted-foreground">
          {durationMinutes} min
          {timeMetrics.avgMin > 0 ? ` · ~${Math.round(timeMetrics.avgMin * 10) / 10} min/Q` : ''}
        </p>
        {overtime && (
          <p className="text-xs mt-0.5 font-medium" style={{ color: overtime.color }}>{overtime.label}</p>
        )}
        {totalScore > 0 && (
          <p className="text-xs mt-1 text-muted-foreground">
            <span className="font-semibold text-foreground">{totalScore}</span> pts assigned
          </p>
        )}
      </div>

      {/* Difficulty distribution */}
      <div>
        <p className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground mb-2">Difficulty</p>
        <div className="flex items-end gap-3 h-14">
          {bars.map(bar => (
            <div key={bar.label} className="flex flex-col items-center gap-1 flex-1">
              <span className="text-xs font-semibold" style={{ color: bar.color }}>
                {bar.count > 0 ? bar.count : ''}
              </span>
              <div style={{
                width: '100%', borderRadius: '3px 3px 0 0',
                background: bar.color,
                height: bar.count === 0 ? 3 : `${(bar.count / maxCount) * 36}px`,
                opacity: bar.count === 0 ? 0.2 : 1,
                transition: 'height .2s',
              }} />
              <span className="text-xs text-muted-foreground">{bar.short}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Psychometrics */}
      {psychoMetrics?.hasData && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground mb-2">Psychometrics</p>
          <div className="flex flex-col gap-1.5">
            {psychoMetrics.avgPValue != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg difficulty</span>
                <span className="text-xs tabular-nums font-medium text-foreground">
                  {(psychoMetrics.avgPValue * 100).toFixed(0)}%
                </span>
              </div>
            )}
            {psychoMetrics.avgPbis != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg pt-biserial</span>
                <span
                  className="text-xs tabular-nums font-medium"
                  style={{
                    color: psychoMetrics.avgPbis >= 0.2 ? 'var(--chart-2)' : 'var(--chart-4)'
                  }}
                >
                  {psychoMetrics.avgPbis.toFixed(2)}
                </span>
              </div>
            )}
            {psychoMetrics.avgDiscriminationIndex != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Avg discrimination</span>
                <span
                  className="text-xs tabular-nums font-medium"
                  style={{
                    color: psychoMetrics.avgDiscriminationIndex >= 0.3 ? 'var(--chart-2)' : 'var(--chart-4)'
                  }}
                >
                  {psychoMetrics.avgDiscriminationIndex.toFixed(2)}
                </span>
              </div>
            )}
            {psychoMetrics.upper27avg != null && psychoMetrics.lower27avg != null && (
              <div className="flex items-center justify-between">
                <span className="text-xs text-muted-foreground">Top / bottom 27%</span>
                <span className="text-xs tabular-nums font-medium text-foreground">
                  {(psychoMetrics.upper27avg * 100).toFixed(0)}% / {(psychoMetrics.lower27avg * 100).toFixed(0)}%
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Blooms */}
      {bloomsMetrics.length > 0 && (
        <div>
          <p className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground mb-2">Bloom&apos;s</p>
          <div className="flex flex-col gap-1.5">
            {bloomsMetrics.slice(0, 5).map(b => (
              <div key={b.level} className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{ width: `${b.pct}%`, backgroundColor: 'var(--brand-color)', opacity: 0.7, transition: 'width .3s' }}
                  />
                </div>
                <span className="text-xs text-muted-foreground w-[60px] truncate">{b.level}</span>
                <span className="text-xs tabular-nums text-foreground w-6 text-right">{b.pct}%</span>
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
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">
              Description <span className="font-normal normal-case tracking-normal text-xs">— optional, shown to students before they start</span>
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
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLTextAreaElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
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
                      border: `1px solid ${active ? 'var(--brand-color)' : 'var(--border)'}`,
                      background: active ? 'var(--brand-tint)' : 'transparent',
                    }}
                  >
                    <div className="flex items-center gap-2">
                      <i className={`fa-light ${icon}`} aria-hidden="true" style={{ color: active ? 'var(--brand-color)' : 'var(--muted-foreground)', fontSize: 13 }} />
                      <span className="text-xs font-semibold text-foreground">{type}</span>
                    </div>
                    <p className="text-xs text-muted-foreground">{description}</p>
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
                onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
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
              <p className="text-xs text-muted-foreground">
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
                        value={(sec.facultyIds?.[0] ?? sec.facultyId) ?? '__none__'}
                        onValueChange={val => onUpdate({
                          sections: sections.map(s =>
                            s.id === sec.id ? { ...s, facultyIds: val === '__none__' ? undefined : [val], facultyId: undefined } : s
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
                style={{ background: 'var(--brand-tint)', border: '1px solid var(--border)' }}
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
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
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
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                  />
                </div>
              </div>
            )}

            {settings.type !== 'Pop Quiz' && (
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Visible to students</p>
                <input
                  type="datetime-local"
                  aria-label="Visible to students date"
                  value={settings.visibleDate?.slice(0, 16) ?? ''}
                  onChange={e => patchSettings({ visibleDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                  style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--ring)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                />
                <p className="text-xs text-muted-foreground mt-1">Card appears on student dashboard before the exam window opens.</p>
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
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
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

            <Toggle
              checked={settings.showRationaleAfter}
              onChange={v => patchSettings({ showRationaleAfter: v })}
              label="Show rationale after submission"
              description="Students see the correct answer and rationale after submitting."
            />

            <Separator />

            {/* Delivery */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Delivery</p>

              {/* Pre-flight date */}
              {settings.type !== 'Pop Quiz' && (
                <div>
                  <p className="text-xs text-muted-foreground mb-1.5">Pre-flight opens</p>
                  <input
                    type="datetime-local"
                    aria-label="Pre-flight opens date"
                    value={settings.openableDate?.slice(0, 16) ?? ''}
                    onChange={e => patchSettings({ openableDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
                    style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--ring)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
                    onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Students can enter the pre-exam screen and download exam data from this time.</p>
                </div>
              )}

              {/* Resume password */}
              <div>
                <p className="text-xs text-muted-foreground mb-1.5">Resume password <span className="text-muted-foreground/60">(optional)</span></p>
                <input
                  type="text"
                  aria-label="Resume password"
                  placeholder="Leave blank — no resume password"
                  value={settings.resumePassword}
                  onChange={e => patchSettings({ resumePassword: e.target.value })}
                  style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--ring)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                />
                <p className="text-xs text-muted-foreground mt-1">Required to resume after an authorized break.</p>
              </div>

              {/* Breaks */}
              <div className="flex items-center gap-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Max breaks</p>
                  <p className="text-xs text-muted-foreground mt-0.5">Leave blank for unlimited. Set to 0 to block all breaks.</p>
                </div>
                <input
                  type="number"
                  aria-label="Maximum breaks allowed"
                  min={0}
                  max={20}
                  placeholder="∞"
                  value={settings.maxBreaks ?? ''}
                  onChange={e => patchSettings({ maxBreaks: e.target.value === '' ? null : Math.max(0, parseInt(e.target.value) || 0) })}
                  style={{ width: 56, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                  onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--ring)'; (e.target as HTMLInputElement).style.boxShadow = '0 0 0 2px var(--ring)' }}
                  onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)'; (e.target as HTMLInputElement).style.boxShadow = 'none' }}
                />
              </div>

              <Toggle
                checked={settings.allowUnauthorizedBreaks}
                onChange={v => patchSettings({ allowUnauthorizedBreaks: v })}
                label="Allow unauthorized breaks"
                description="Students can take breaks without proctor approval."
              />
            </div>

            <Separator />

            {/* Audience */}
            <div className="flex flex-col gap-3">
              <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Audience</p>
              <Toggle
                checked={settings.publishToAll}
                onChange={v => patchSettings({ publishToAll: v, studentGroupIds: v ? [] : settings.studentGroupIds })}
                label="All enrolled students"
                description="When off, select specific student groups below."
              />
              {!settings.publishToAll && (
                <div>
                  <p className="text-xs text-muted-foreground mb-2">Student groups</p>
                  {(['Group A – Morning session', 'Group B – Afternoon session', 'Remedial cohort', 'Honors track'] as const).map((group, i) => {
                    const id = `group-${i}`
                    const selected = settings.studentGroupIds.includes(id)
                    return (
                      <button
                        key={id}
                        type="button"
                        aria-pressed={selected}
                        onClick={() => patchSettings({
                          studentGroupIds: selected
                            ? settings.studentGroupIds.filter(x => x !== id)
                            : [...settings.studentGroupIds, id]
                        })}
                        style={{
                          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                          width: '100%', padding: '7px 10px', marginBottom: 4,
                          border: `1px solid ${selected ? 'var(--brand-color)' : 'var(--border)'}`,
                          borderRadius: 8, background: selected ? 'var(--brand-tint)' : 'transparent',
                          cursor: 'pointer', fontFamily: 'inherit', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: 13, color: 'var(--foreground)' }}>{group}</span>
                        {selected && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 11, color: 'var(--brand-color)' }} />}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>
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
  onOpenSettings,
  canSave,
}: {
  activeStep: 1 | 2 | 3
  onStepClick: (step: 1 | 2 | 3) => void
  assessmentName: string
  courseLabel: string
  onSaveDraft: () => void
  onOpenSettings: () => void
  canSave: boolean
}) {
  const STEPS: { id: 1 | 2 | 3; label: string; icon: string }[] = [
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
        {courseLabel && <i className="fa-light fa-chevron-right text-xs text-muted-foreground hidden sm:block" aria-hidden="true" />}
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
                    ? 'var(--brand-tint)'
                    : isCompleted ? 'var(--brand-tint)'
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

      {/* Right: settings + save draft */}
      <div className="flex items-center gap-2 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={onOpenSettings}
          aria-label="Assessment settings"
          className="gap-1.5"
        >
          <i className="fa-light fa-gear" aria-hidden="true" />
          <span className="text-xs">Settings</span>
        </Button>
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

// ── Assessment settings content (inline, used in Settings tab) ───────────────

function AssessmentSettingsContent({
  settings,
  onPatch,
}: {
  settings: import('@/lib/qb-types').AssessmentSettings
  onPatch: (patch: Partial<import('@/lib/qb-types').AssessmentSettings>) => void
}) {
  const TYPES: import('@/lib/qb-types').AssessmentType[] = ['Exam', 'Quiz', 'Assignment']

  function Toggle({ checked, onChange, label, description }: {
    checked: boolean; onChange: (v: boolean) => void; label: string; description?: string
  }) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
        <div style={{ minWidth: 0 }}>
          <p className="text-sm font-medium text-foreground">{label}</p>
          {description && <p className="text-xs text-muted-foreground mt-0.5">{description}</p>}
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

  return (
    <div style={{ padding: '0 0 40px' }}>
      {/* Type */}
      <div style={{ padding: '12px 20px', borderBottom: '1px solid var(--border)' }}>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Scheduling</p>
        <p className="text-xs text-muted-foreground mb-2">Assessment type</p>
        <div style={{ display: 'flex', gap: 8 }}>
          {TYPES.map(t => (
            <button
              key={t}
              type="button"
              aria-pressed={settings.type === t}
              onClick={() => onPatch({ type: t })}
              style={{
                flex: 1, borderRadius: 8, border: '1px solid',
                borderColor: settings.type === t ? 'var(--brand-color)' : 'var(--border)',
                background: settings.type === t ? 'var(--brand-tint)' : 'transparent',
                color: settings.type === t ? 'var(--brand-color)' : 'var(--muted-foreground)',
                padding: '8px 0', fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit',
              }}
            >
              {t}
            </button>
          ))}
        </div>
      </div>

      {/* Scheduling toggles */}
      <div style={{ padding: '0 20px' }}>
        <Toggle
          checked={settings.passwordRequired}
          onChange={v => onPatch({ passwordRequired: v })}
          label="Password required"
          description="Students enter a password to unlock the exam."
        />
        {settings.passwordRequired && (
          <input
            type="text"
            placeholder="Set exam password…"
            value={settings.password}
            onChange={e => onPatch({ password: e.target.value })}
            style={{ height: 36, padding: '0 12px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', width: '100%', marginBottom: 8 }}
          />
        )}
        <Toggle
          checked={settings.randomize}
          onChange={v => onPatch({ randomize: v })}
          label="Randomize question order"
          description="Each student sees questions in a different order."
        />
        <Toggle
          checked={settings.randomizeOptions}
          onChange={v => onPatch({ randomizeOptions: v })}
          label="Randomize option order"
          description="Shuffle answer choices within each question."
        />
        <Toggle
          checked={settings.showRationaleAfter}
          onChange={v => onPatch({ showRationaleAfter: v })}
          label="Show rationale after submission"
          description="Students see the correct answer and rationale after submitting."
        />
      </div>

      {/* Grading */}
      <div style={{ padding: '12px 20px 0', borderTop: '1px solid var(--border)', marginTop: 4 }}>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Grading</p>
        <Toggle
          checked={settings.graded}
          onChange={v => onPatch({ graded: v })}
          label="Graded"
          description="Assign point values to questions."
        />
        {settings.graded && (
          <div style={{ padding: '8px 0' }}>
            <p className="text-xs text-muted-foreground mb-1">Total marks</p>
            <input
              type="number"
              aria-label="Total marks"
              min={1}
              value={settings.totalMarks}
              onChange={e => {
                const v = parseInt(e.target.value)
                if (!isNaN(v) && v > 0) onPatch({ totalMarks: v })
              }}
              style={{ width: 80, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
            />
          </div>
        )}
      </div>

      {/* Pre-exam setup */}
      <div style={{ borderTop: '1px solid var(--border)', marginTop: 8 }}>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground" style={{ padding: '12px 20px 4px' }}>Pre-exam setup</p>
        <div style={{ padding: '0 20px' }}>
          <PreExamBlock
            label="Instructions"
            description="Cover page text shown before the exam starts"
            enabled={!!settings.instructionsText.trim()}
            onToggle={() => onPatch({ instructionsText: settings.instructionsText.trim() ? '' : ' ' })}
          >
            <textarea
              aria-label="Pre-exam instructions"
              value={settings.instructionsText}
              onChange={e => onPatch({ instructionsText: e.target.value })}
              placeholder="Read all questions carefully. No external resources…"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </PreExamBlock>

          <PreExamBlock
            label="Ethics / policy"
            description="Honor code or institutional policy text"
            enabled={!!settings.policyText.trim()}
            onToggle={() => onPatch({ policyText: settings.policyText.trim() ? '' : ' ' })}
          >
            <textarea
              aria-label="Ethics and policy text"
              value={settings.policyText}
              onChange={e => onPatch({ policyText: e.target.value })}
              placeholder="By participating in this exam, you agree to…"
              rows={3}
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </PreExamBlock>

          <PreExamBlock
            label="Attestation"
            description='Student checks "I agree" to unlock the exam'
            enabled={!!settings.attestationText.trim()}
            onToggle={() => onPatch({ attestationText: settings.attestationText.trim() ? '' : ' ' })}
          >
            <textarea
              aria-label="Attestation text"
              value={settings.attestationText}
              onChange={e => onPatch({ attestationText: e.target.value })}
              placeholder="I affirm that I will complete this exam independently…"
              rows={2}
              style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
            />
          </PreExamBlock>

          <PreExamBlock
            label="Tech check"
            description="Pre-flight system check students complete before starting"
            enabled={settings.techCheck.audio || settings.techCheck.video || settings.techCheck.wifi || settings.techCheck.os}
            onToggle={() => {
              const anyOn = settings.techCheck.audio || settings.techCheck.video || settings.techCheck.wifi || settings.techCheck.os
              onPatch({ techCheck: { audio: !anyOn, video: false, wifi: false, os: false } })
            }}
          >
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
              {(['audio', 'video', 'wifi', 'os'] as const).map(key => (
                <label key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, padding: '3px 8px', border: `1px solid ${settings.techCheck[key] ? 'var(--foreground)' : 'var(--border)'}`, borderRadius: 5, cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={settings.techCheck[key]}
                    onChange={() => onPatch({ techCheck: { ...settings.techCheck, [key]: !settings.techCheck[key] } })}
                    style={{ margin: 0 }}
                  />
                  {key === 'audio' ? 'Audio' : key === 'video' ? 'Camera' : key === 'wifi' ? 'Wi-Fi' : 'OS'}
                </label>
              ))}
            </div>
          </PreExamBlock>
        </div>
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

  function toggleField(key: 'passwordRequired' | 'randomize' | 'showRationaleAfter' | 'requireAnswer' | 'backwardNavigationAllowed' | 'forwardOnlySections' | 'requireAnswerForSectionAdvance' | 'forcedTimerTransition' | 'secureMode' | 'showRawScore' | 'showPercentage' | 'postExamReviewEnabled') {
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
                      ? 'var(--brand-tint)'
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

          <Separator />

          {/* Navigation & access */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Navigation &amp; access</p>

            <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Require answer before advancing</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students must answer each question before moving to the next.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.requireAnswer}
                aria-label="Toggle require answer before advancing"
                onClick={() => toggleField('requireAnswer')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.requireAnswer ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.requireAnswer ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Allow backward navigation</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students can return to previously answered questions.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.backwardNavigationAllowed}
                aria-label="Toggle backward navigation"
                onClick={() => toggleField('backwardNavigationAllowed')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.backwardNavigationAllowed ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.backwardNavigationAllowed ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Forward-only sections</p>
                <p className="text-xs text-muted-foreground mt-0.5">Once students advance past a section, they cannot return to it.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.forwardOnlySections}
                aria-label="Toggle forward-only sections"
                onClick={() => toggleField('forwardOnlySections')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.forwardOnlySections ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.forwardOnlySections ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Require all answers before advancing section</p>
                <p className="text-xs text-muted-foreground mt-0.5">All questions in the current section must be answered before students can move to the next section.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.requireAnswerForSectionAdvance}
                aria-label="Toggle require all answers before advancing section"
                onClick={() => toggleField('requireAnswerForSectionAdvance')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.requireAnswerForSectionAdvance ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.requireAnswerForSectionAdvance ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Auto-advance on section timer expiry</p>
                <p className="text-xs text-muted-foreground mt-0.5">When a section's timer runs out, students are automatically moved to the next section. Unanswered questions are auto-submitted.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.forcedTimerTransition}
                aria-label="Toggle auto-advance on section timer expiry"
                onClick={() => toggleField('forcedTimerTransition')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.forcedTimerTransition ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.forcedTimerTransition ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Secure mode</p>
                <p className="text-xs text-muted-foreground mt-0.5">Enforces lockdown browser (Respondus). Students cannot switch apps.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.secureMode}
                aria-label="Toggle secure mode"
                onClick={() => toggleField('secureMode')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.secureMode ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.secureMode ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>
          </div>

          <Separator />

          {/* Grading & Marking */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Grading &amp; marking</p>

            <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Negative marking</p>
                <p className="text-xs text-muted-foreground mt-0.5">Deduct points for incorrect MCQ answers.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.negativeMarking}
                aria-label="Toggle negative marking"
                onClick={() => setLocal(prev => ({ ...prev, negativeMarking: !prev.negativeMarking }))}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.negativeMarking ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.negativeMarking ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            {local.negativeMarking && (
              <div className="flex items-center gap-3 pt-2 pb-3 border-b border-border">
                <p className="text-xs text-muted-foreground flex-1">Fraction deducted per wrong answer</p>
                <input
                  type="number"
                  aria-label="Negative marking fraction"
                  min={0.1}
                  max={1}
                  step={0.05}
                  value={local.negativeMarkingFraction}
                  onChange={e => {
                    const v = parseFloat(e.target.value)
                    if (!isNaN(v) && v > 0 && v <= 1) setLocal(prev => ({ ...prev, negativeMarkingFraction: v }))
                  }}
                  style={{ width: 70, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                />
              </div>
            )}
          </div>

          <Separator />

          {/* Post-exam results */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Post-exam results</p>

            <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Show raw score</p>
                <p className="text-xs text-muted-foreground mt-0.5">Student sees their numeric score after submission.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.showRawScore}
                aria-label="Toggle show raw score"
                onClick={() => toggleField('showRawScore')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.showRawScore ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.showRawScore ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Show percentage</p>
                <p className="text-xs text-muted-foreground mt-0.5">Student sees their percentage score after submission.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.showPercentage}
                aria-label="Toggle show percentage"
                onClick={() => toggleField('showPercentage')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.showPercentage ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.showPercentage ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 py-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Post-exam review</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students can review their answers and feedback after submission.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.postExamReviewEnabled}
                aria-label="Toggle post-exam review"
                onClick={() => toggleField('postExamReviewEnabled')}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.postExamReviewEnabled ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.postExamReviewEnabled ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            {local.postExamReviewEnabled && (
              <div className="flex flex-col gap-2 pt-2">
                <div className="flex items-center gap-3">
                  <p className="text-xs text-muted-foreground flex-1">Delay before students can review</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      aria-label="Post-exam review delay in hours"
                      min={0}
                      step={1}
                      value={local.postExamReviewDelayHours ?? 0}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        setLocal(prev => ({ ...prev, postExamReviewDelayHours: isNaN(v) || v === 0 ? null : v }))
                      }}
                      style={{ width: 60, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    />
                    <span className="text-xs text-muted-foreground">hours (0 = immediately)</span>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border mt-2">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Lockdown browser for review</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Students must use Respondus to access their review.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={local.postExamReviewLockdown}
                    aria-label="Toggle lockdown browser for review"
                    onClick={() => setLocal(prev => ({ ...prev, postExamReviewLockdown: !prev.postExamReviewLockdown }))}
                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.postExamReviewLockdown ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: local.postExamReviewLockdown ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Show incorrect answers only</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Students see only questions they answered incorrectly.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={local.postExamReviewIncorrectOnly}
                    aria-label="Toggle incorrect answers only"
                    onClick={() => setLocal(prev => ({ ...prev, postExamReviewIncorrectOnly: !prev.postExamReviewIncorrectOnly }))}
                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.postExamReviewIncorrectOnly ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: local.postExamReviewIncorrectOnly ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
                  </button>
                </div>

                <div className="flex items-center justify-between gap-4 pt-2 border-t border-border">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">Show rationale &amp; answer</p>
                    <p className="text-xs text-muted-foreground mt-0.5">Display correct answer and rationale during review.</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={local.postExamReviewShowRationale}
                    aria-label="Toggle show rationale in review"
                    onClick={() => setLocal(prev => ({ ...prev, postExamReviewShowRationale: !prev.postExamReviewShowRationale }))}
                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.postExamReviewShowRationale ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: local.postExamReviewShowRationale ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
                  </button>
                </div>

                <div className="flex items-center gap-3 pt-2 border-t border-border">
                  <p className="text-xs text-muted-foreground flex-1">Review session time limit</p>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                    <input
                      type="number"
                      aria-label="Review time limit in minutes"
                      min={0}
                      step={5}
                      value={local.postExamReviewTimeLimitMinutes ?? 0}
                      onChange={e => {
                        const v = parseInt(e.target.value)
                        setLocal(prev => ({ ...prev, postExamReviewTimeLimitMinutes: isNaN(v) || v === 0 ? null : v }))
                      }}
                      style={{ width: 60, height: 30, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
                    />
                    <span className="text-xs text-muted-foreground">min (0 = unlimited)</span>
                  </div>
                </div>

                <div>
                  <p className="text-xs text-muted-foreground mb-1">Review access password (optional)</p>
                  <input
                    type="text"
                    aria-label="Review access password"
                    placeholder="Leave blank for no password…"
                    value={local.postExamReviewPassword}
                    onChange={e => setLocal(prev => ({ ...prev, postExamReviewPassword: e.target.value }))}
                    style={{ height: 32, padding: '0 10px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', width: '100%' }}
                  />
                </div>
              </div>
            )}
          </div>

          <Separator />

          {/* Exam end */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Exam end</p>
            <div className="flex items-center justify-between gap-4 pb-3 border-b border-border">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Allow early submission</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students can submit the exam before the timer expires.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.allowEarlySubmission}
                aria-label="Toggle allow early submission"
                onClick={() => setLocal(prev => ({ ...prev, allowEarlySubmission: !prev.allowEarlySubmission }))}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.allowEarlySubmission ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.allowEarlySubmission ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>

            <div className="flex items-center justify-between gap-4 pt-3">
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">Blind scoring</p>
                <p className="text-xs text-muted-foreground mt-0.5">Student names hidden during manual grading and essay review.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.blindScoring}
                aria-label="Toggle blind scoring"
                onClick={() => setLocal(prev => ({ ...prev, blindScoring: !prev.blindScoring }))}
                style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.blindScoring ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
              >
                <span style={{ position: 'absolute', top: 2, left: local.blindScoring ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
              </button>
            </div>
          </div>

          <Separator />

          {/* Digital tools */}
          <div className="flex flex-col gap-3">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Digital tools</p>

            {/* Calculator */}
            <div>
              <p className="text-xs text-muted-foreground mb-1.5">Calculator</p>
              <div className="flex gap-2">
                {(['none', 'basic', 'scientific'] as const).map(opt => {
                  const tools = local.digitalTools ?? { calculator: 'none' as const, textHighlight: true, answerElimination: false, scratchpad: false, scratchpadFeedback: false, allowCopyPaste: false, warningAlarmMinutes: 5, spellCheck: false, findReplace: false }
                  return (
                    <button
                      key={opt}
                      type="button"
                      aria-pressed={tools.calculator === opt}
                      onClick={() => setLocal(prev => ({ ...prev, digitalTools: { ...(prev.digitalTools ?? tools), calculator: opt } }))}
                      className="flex-1 rounded-lg border py-1.5 text-xs font-medium transition-colors"
                      style={{
                        borderColor: tools.calculator === opt ? 'var(--brand-color)' : 'var(--border)',
                        backgroundColor: tools.calculator === opt ? 'var(--brand-tint)' : 'transparent',
                        color: tools.calculator === opt ? 'var(--brand-color)' : 'var(--muted-foreground)',
                        cursor: 'pointer', fontFamily: 'inherit',
                      }}
                    >
                      {opt === 'none' ? 'None' : opt === 'basic' ? 'Basic' : 'Scientific'}
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Tool toggles */}
            {([
              { key: 'textHighlight' as const,      label: 'Text highlight',           desc: 'Students can highlight text in questions.' },
              { key: 'answerElimination' as const,   label: 'Answer elimination',       desc: 'Students can strike out options they want to eliminate.' },
              { key: 'scratchpad' as const,          label: 'Notes / scratchpad',       desc: 'Digital scratchpad for rough work.' },
              { key: 'scratchpadFeedback' as const,  label: 'Allow scratchpad feedback', desc: 'Faculty can review student scratchpad notes.' },
              { key: 'allowCopyPaste' as const,      label: 'Allow copy/paste',         desc: 'Permit clipboard operations during the exam.' },
              { key: 'spellCheck' as const,          label: 'Spell check (essay)',      desc: 'Enable spell checking for essay responses.' },
              { key: 'findReplace' as const,         label: 'Find & replace (essay)',   desc: 'Enable find & replace for essay responses.' },
            ] as const).map(({ key, label, desc }) => {
              const tools = local.digitalTools ?? { calculator: 'none' as const, textHighlight: true, answerElimination: false, scratchpad: false, scratchpadFeedback: false, allowCopyPaste: false, warningAlarmMinutes: 5, spellCheck: false, findReplace: false }
              return (
                <div key={key} className="flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground">{label}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{desc}</p>
                  </div>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={tools[key]}
                    aria-label={`Toggle ${label}`}
                    onClick={() => setLocal(prev => { const dt = prev.digitalTools ?? tools; return { ...prev, digitalTools: { ...dt, [key]: !dt[key] } } })}
                    style={{ width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: tools[key] ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: tools[key] ? 18 : 2, width: 16, height: 16, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
                  </button>
                </div>
              )
            })}

            {/* Warning alarm */}
            <div className="flex items-center gap-3">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">Warning alarm</p>
                <p className="text-xs text-muted-foreground mt-0.5">Alert students before the timer expires. Set to 0 to disable.</p>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  aria-label="Warning alarm minutes before expiry"
                  min={0}
                  max={30}
                  value={local.digitalTools?.warningAlarmMinutes ?? 0}
                  onChange={e => {
                    const v = parseInt(e.target.value)
                    const tools = local.digitalTools ?? { calculator: 'none' as const, textHighlight: true, answerElimination: false, scratchpad: false, scratchpadFeedback: false, allowCopyPaste: false, warningAlarmMinutes: 5, spellCheck: false, findReplace: false }
                    setLocal(prev => ({ ...prev, digitalTools: { ...(prev.digitalTools ?? tools), warningAlarmMinutes: isNaN(v) || v === 0 ? null : v } }))
                  }}
                  style={{ width: 50, height: 30, textAlign: 'center', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', padding: '0 4px' }}
                />
                <span className="text-xs text-muted-foreground">min</span>
              </div>
            </div>
          </div>

          <Separator />

          {/* Pre-exam setup */}
          <div className="flex flex-col gap-0">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Pre-exam setup</p>

            {/* Instructions block */}
            <PreExamBlock
              label="Instructions"
              description="Cover page text shown before the exam starts"
              enabled={!!local.instructionsText.trim()}
              onToggle={() => setLocal(prev => ({ ...prev, instructionsText: prev.instructionsText.trim() ? '' : ' ' }))}
            >
              <textarea
                aria-label="Pre-exam instructions"
                value={local.instructionsText}
                onChange={e => setLocal(prev => ({ ...prev, instructionsText: e.target.value }))}
                placeholder="Read all questions carefully. No external resources…"
                rows={3}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
              {local.instructionsText.trim() && (
                <div className="flex items-center justify-between mt-2">
                  <p className="text-xs text-muted-foreground">Require student acknowledgment</p>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={local.requireAcknowledgment}
                    aria-label="Toggle require acknowledgment"
                    onClick={() => setLocal(prev => ({ ...prev, requireAcknowledgment: !prev.requireAcknowledgment }))}
                    style={{ width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: local.requireAcknowledgment ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
                  >
                    <span style={{ position: 'absolute', top: 2, left: local.requireAcknowledgment ? 14 : 2, width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
                  </button>
                </div>
              )}
            </PreExamBlock>

            {/* Ethics / Policy block */}
            <PreExamBlock
              label="Ethics / policy"
              description="Honor code or institutional policy text"
              enabled={!!local.policyText.trim()}
              onToggle={() => setLocal(prev => ({ ...prev, policyText: prev.policyText.trim() ? '' : ' ' }))}
            >
              <textarea
                aria-label="Ethics and policy text"
                value={local.policyText}
                onChange={e => setLocal(prev => ({ ...prev, policyText: e.target.value }))}
                placeholder="By participating in this exam, you agree to…"
                rows={3}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </PreExamBlock>

            {/* Attestation block */}
            <PreExamBlock
              label="Attestation"
              description='Student checks "I agree" to unlock the exam'
              enabled={!!local.attestationText.trim()}
              onToggle={() => setLocal(prev => ({ ...prev, attestationText: prev.attestationText.trim() ? '' : ' ' }))}
            >
              <textarea
                aria-label="Attestation text"
                value={local.attestationText}
                onChange={e => setLocal(prev => ({ ...prev, attestationText: e.target.value }))}
                placeholder="I affirm that I will complete this exam independently…"
                rows={2}
                style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit' }}
              />
            </PreExamBlock>

            {/* Tech check block */}
            <PreExamBlock
              label="Tech check"
              description="Pre-flight system check students complete before starting"
              enabled={local.techCheck.audio || local.techCheck.video || local.techCheck.wifi || local.techCheck.os}
              onToggle={() => {
                const anyOn = local.techCheck.audio || local.techCheck.video || local.techCheck.wifi || local.techCheck.os
                setLocal(prev => ({ ...prev, techCheck: { audio: !anyOn, video: false, wifi: false, os: false } }))
              }}
            >
              <div className="flex flex-wrap gap-2">
                {(['audio', 'video', 'wifi', 'os'] as const).map(key => (
                  <label key={key} className="flex items-center gap-1.5 text-xs cursor-pointer" style={{ padding: '3px 8px', border: `1px solid ${local.techCheck[key] ? 'var(--foreground)' : 'var(--border)'}`, borderRadius: 5 }}>
                    <input
                      type="checkbox"
                      checked={local.techCheck[key]}
                      onChange={() => setLocal(prev => ({ ...prev, techCheck: { ...prev.techCheck, [key]: !prev.techCheck[key] } }))}
                      style={{ margin: 0 }}
                    />
                    {key === 'audio' ? 'Audio' : key === 'video' ? 'Camera' : key === 'wifi' ? 'Wi-Fi' : 'OS'}
                  </label>
                ))}
              </div>
            </PreExamBlock>
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
      <div className="text-xs font-bold uppercase tracking-[.07em] text-muted-foreground" style={{ padding: '10px 14px 6px', flexShrink: 0 }}>
        Sections
      </div>

      <div style={{ flex: 1, overflow: 'auto', padding: '0 10px 10px' }}>
        {unassigned.length > 0 && (
          <div className="mb-3">
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
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
                        style={{ fontSize: 12, borderRadius: 4, border: '1px solid var(--border)', background: 'var(--background)', color: 'var(--foreground)', padding: '1px 4px', maxWidth: 80, cursor: 'pointer' }}
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
                <p className="text-xs text-muted-foreground px-1">+{unassigned.length - 6} more</p>
              )}
            </div>
          </div>
        )}

        {activeAsmt.sections.map((section, idx) => (
          <div key={section.id} className="mb-3">
            <div className="flex items-center justify-between mb-1.5 px-1">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
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
              style={{ background: 'var(--brand-tint)' }}>
              {section.questionIds.length === 0 ? (
                <p className="text-xs text-muted-foreground italic px-1">No questions assigned yet</p>
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
                <p className="text-xs text-muted-foreground px-1">+{section.questionIds.length - 4} more</p>
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
                      <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">{o.bloomsLevel}</Badge>
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
                        <Badge variant="outline" className="text-xs font-mono shrink-0 mt-0.5">{o.bloomsLevel}</Badge>
                        <span className="text-xs text-foreground leading-relaxed flex-1">{o.title}</span>
                        <span className="text-xs text-muted-foreground shrink-0">{days}d ago</span>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            <p className="text-xs text-muted-foreground">
              The generator matches questions to your difficulty and Bloom&apos;s targets. Each question is reviewable before it&apos;s added to the assessment.
            </p>
          </>
        )}
      </div>
    </div>
  )
}

// ── PreExamBlock ───────────────────────────────────────────────────────────────

function PreExamBlock({
  label, description, enabled, onToggle, children,
}: {
  label: string
  description: string
  enabled: boolean
  onToggle: () => void
  children: React.ReactNode
}) {
  const [open, setOpen] = React.useState(enabled)

  React.useEffect(() => { if (enabled && !open) setOpen(true) }, [enabled])

  return (
    <div style={{ borderBottom: '1px solid var(--border)' }}>
      <div className="flex items-center gap-3 py-2.5">
        <button
          type="button"
          role="switch"
          aria-checked={enabled}
          aria-label={`Toggle ${label}`}
          onClick={onToggle}
          style={{ width: 32, height: 18, borderRadius: 9, border: 'none', cursor: 'pointer', flexShrink: 0, backgroundColor: enabled ? 'var(--brand-color)' : 'var(--muted)', position: 'relative', transition: 'background-color .15s' }}
        >
          <span style={{ position: 'absolute', top: 2, left: enabled ? 14 : 2, width: 14, height: 14, borderRadius: '50%', backgroundColor: 'var(--background)', transition: 'left .15s', display: 'block' }} />
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium text-foreground">{label}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        {enabled && (
          <button
            type="button"
            aria-label={open ? `Collapse ${label}` : `Expand ${label}`}
            onClick={() => setOpen(o => !o)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4 }}
          >
            <i className={`fa-light ${open ? 'fa-chevron-up' : 'fa-chevron-down'}`} aria-hidden="true" style={{ fontSize: 10 }} />
          </button>
        )}
      </div>
      {enabled && open && (
        <div style={{ paddingBottom: 12 }}>
          {children}
        </div>
      )}
    </div>
  )
}

// ── Creation Mode Chooser ────────────────────────────────────────────────────

function DiffMiniBar({ dist }: { dist: Record<string, number> }) {
  const easy = dist['Easy'] ?? 0
  const med  = dist['Medium'] ?? 0
  const hard = dist['Hard'] ?? 0
  const total = easy + med + hard
  if (total === 0) return <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>—</span>
  return (
    <div style={{ display: 'flex', gap: 2, alignItems: 'center', height: 7, width: 56 }}>
      <div style={{ height: '100%', flex: easy / total, background: 'var(--chart-2)', borderRadius: 2 }} />
      <div style={{ height: '100%', flex: med  / total, background: 'var(--chart-3)', borderRadius: 2 }} />
      <div style={{ height: '100%', flex: hard / total, background: 'var(--chart-1)', borderRadius: 2 }} />
    </div>
  )
}

function CreationModeChooser({ courseId: _courseId, assessments, onCopyWithQuestions, onSelectMode, onBack }: {
  courseId: string
  assessments: Assessment[]
  onCopyWithQuestions: (source: Assessment, questionIds: string[]) => void
  onSelectMode: (mode: 'qb' | 'pdf' | 'ai') => void
  onBack: () => void
}) {
  const [view, setView] = React.useState<'paths' | 'copy-picker' | 'question-picker'>('paths')
  const [pickerAsmt, setPickerAsmt] = React.useState<Assessment | null>(null)
  const [selectedQids, setSelectedQids] = React.useState<Set<string>>(new Set())
  const [previewQid, setPreviewQid] = React.useState<string | null>(null)

  const sortedAssessments = [...assessments].sort((a, b) => b.id.localeCompare(a.id))

  const SECONDARY_PATHS = [
    { id: 'ai'  as const, icon: 'fa-sparkles',  label: 'AI-assisted',   desc: 'Describe what you need; Leo picks matching questions.' },
    { id: 'pdf' as const, icon: 'fa-file-lines', label: 'Import doc',    desc: 'Upload a PDF; Leo extracts and matches questions.' },
    { id: 'qb'  as const, icon: 'fa-database',   label: 'Build from QB', desc: 'Browse and hand-pick from your question bank.' },
  ] as const

  function getAsmtQuestions(asmt: Assessment): Question[] {
    const sourceCode = (mockCourses.find(c => c.id === asmt.courseId)?.code ?? '').toLowerCase()
    return MOCK_QB_QUESTIONS
      .filter(q => q.folder.startsWith(sourceCode))
      .slice(0, asmt.questionCount)
  }

  // ── Question-picker view ──────────────────────────────────────────────────────
  if (view === 'question-picker' && pickerAsmt) {
    const questions = getAsmtQuestions(pickerAsmt)
    const previewQ = previewQid ? questions.find(q => q.id === previewQid) ?? null : null
    const allSelected = questions.length > 0 && questions.every(q => selectedQids.has(q.id))

    function toggleSelectAll() {
      if (allSelected) {
        setSelectedQids(new Set())
      } else {
        setSelectedQids(new Set(questions.map(q => q.id)))
      }
    }

    function toggleQid(id: string) {
      setSelectedQids(prev => {
        const next = new Set(prev)
        if (next.has(id)) { next.delete(id) } else { next.add(id) }
        return next
      })
    }

    const diffColor = (d: string) =>
      d === 'Easy' ? 'var(--chart-2)' : d === 'Medium' ? 'var(--chart-3)' : 'var(--chart-1)'

    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--background)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, gap: 10 }}>
          <Button variant="ghost" size="sm" onClick={() => setView('copy-picker')} style={{ gap: 6, color: 'var(--muted-foreground)', paddingInline: 8 }}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
            Copy from prior exam
          </Button>
          <span style={{ color: 'var(--border)', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>{pickerAsmt.title}</span>
        </div>

        {/* Two-panel body */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'row', overflow: 'hidden' }}>
          {/* Left panel — question list */}
          <div style={{ flex: '1 1 0', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
            {/* Toolbar */}
            <div style={{ height: 44, borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, padding: '0 16px', display: 'flex', alignItems: 'center', gap: 12 }}>
              <Button variant="ghost" size="sm" onClick={toggleSelectAll} style={{ paddingInline: 8 }}>
                {allSelected ? 'Deselect all' : 'Select all'}
              </Button>
              <span style={{ marginLeft: 'auto', fontSize: 12, color: 'var(--muted-foreground)' }}>
                {selectedQids.size} of {questions.length} selected
              </span>
            </div>

            {/* Scrollable question list */}
            <div style={{ flex: 1, overflowY: 'auto' }}>
              {questions.length === 0 ? (
                <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted-foreground)' }}>
                  No questions found for this assessment.
                </div>
              ) : questions.map(q => {
                const isSelected = selectedQids.has(q.id)
                const isPreviewed = previewQid === q.id
                return (
                  <div
                    key={q.id}
                    style={{
                      display: 'flex', flexDirection: 'row', gap: 10, alignItems: 'flex-start',
                      padding: '10px 16px', borderBottom: '1px solid var(--border)',
                      background: isPreviewed ? 'var(--muted)' : 'transparent',
                      cursor: 'pointer',
                    }}
                    onClick={() => setPreviewQid(q.id)}
                  >
                    {/* Checkbox — stopPropagation so row click still sets preview */}
                    <div onClick={(e) => e.stopPropagation()} style={{ paddingTop: 2, flexShrink: 0 }}>
                      <Checkbox
                        checked={isSelected}
                        onCheckedChange={() => toggleQid(q.id)}
                        aria-label={`Select question ${q.code}`}
                      />
                    </div>

                    {/* Middle — code + badges + stem */}
                    <div style={{ flex: 1, minWidth: 0, display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                        <span style={{ fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace' }}>
                          {q.code}
                        </span>
                        <Badge variant="secondary" style={{ fontSize: 10, padding: '0 5px', height: 18 }}>{q.type}</Badge>
                        <Badge variant="outline" style={{ fontSize: 10, padding: '0 5px', height: 18, color: diffColor(q.difficulty), borderColor: diffColor(q.difficulty) }}>{q.difficulty}</Badge>
                      </div>
                      <div style={{
                        fontSize: 13, lineHeight: 1.4, color: 'var(--foreground)',
                        overflow: 'hidden', display: '-webkit-box',
                        WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                      }}>
                        {q.stemText ?? q.title}
                      </div>
                    </div>

                    {/* Right — PBI + usage */}
                    <div style={{ flexShrink: 0, textAlign: 'right', display: 'flex', flexDirection: 'column', gap: 2 }}>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>PBI {q.pbis != null ? q.pbis.toFixed(2) : '—'}</span>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{q.usage}× used</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right panel — question preview */}
          {previewQ && (
            <div style={{ width: 300, flexShrink: 0, borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
              {/* Panel header */}
              <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, display: 'flex', flexDirection: 'column', gap: 6 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                  <span style={{ fontSize: 10, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '1px 6px', borderRadius: 3, fontFamily: 'monospace' }}>
                    {previewQ.code}
                  </span>
                  <Badge variant="secondary" style={{ fontSize: 10, padding: '0 5px', height: 18 }}>{previewQ.type}</Badge>
                  <Badge variant="outline" style={{ fontSize: 10, padding: '0 5px', height: 18, color: diffColor(previewQ.difficulty), borderColor: diffColor(previewQ.difficulty) }}>{previewQ.difficulty}</Badge>
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
                  Usage {previewQ.usage}× · PBI {previewQ.pbis != null ? previewQ.pbis.toFixed(2) : '—'} · {previewQ.blooms}
                </div>
              </div>

              {/* Panel body */}
              <div style={{ flex: 1, overflowY: 'auto', padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--foreground)', margin: 0 }}>
                  {previewQ.stemText ?? previewQ.title}
                </p>
                {previewQ.options && previewQ.options.length > 0 && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                    {previewQ.options.map(opt => (
                      <div
                        key={opt.key}
                        style={{
                          padding: '8px 10px', borderRadius: 6, fontSize: 12, lineHeight: 1.5,
                          background: opt.isCorrect ? 'var(--brand-tint)' : 'var(--muted)',
                          border: `1px solid ${opt.isCorrect ? 'var(--brand-color)' : 'transparent'}`,
                        }}
                      >
                        {opt.key}. {opt.text}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '12px 20px', borderTop: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0 }}>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{selectedQids.size} questions selected</span>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <Button variant="outline" size="default" onClick={() => setView('copy-picker')}>Cancel</Button>
            <Button
              variant="default"
              size="default"
              disabled={selectedQids.size === 0}
              onClick={() => onCopyWithQuestions(pickerAsmt!, [...selectedQids])}
            >
              Add {selectedQids.size} question{selectedQids.size !== 1 ? 's' : ''} to my exam
              <i className="fa-light fa-arrow-right" aria-hidden="true" />
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // ── Copy-picker view ─────────────────────────────────────────────────────────
  if (view === 'copy-picker') {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--background)' }}>
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, gap: 10 }}>
          <Button variant="ghost" size="sm" onClick={() => setView('paths')} style={{ gap: 6, color: 'var(--muted-foreground)', paddingInline: 8 }}>
            <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
            New Assessment
          </Button>
          <span style={{ color: 'var(--border)', fontSize: 14 }}>/</span>
          <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>Copy from prior exam</span>
        </div>

        {/* Card grid body */}
        <div style={{ flex: 1, overflowY: 'auto', padding: 20 }}>
          {sortedAssessments.length === 0 ? (
            <div style={{ padding: '40px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted-foreground)' }}>
              No prior assessments found for this course.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 12 }}>
              {sortedAssessments.map(a => {
                const offering = mockCourseOfferings.find(o => o.id === a.offeringId)
                const easy  = a.diffDistribution['Easy']   ?? 0
                const med   = a.diffDistribution['Medium'] ?? 0
                const hard  = a.diffDistribution['Hard']   ?? 0
                const total = easy + med + hard
                const pct   = (n: number) => total > 0 ? Math.round(n / total * 100) : 0

                return (
                  <div
                    key={a.id}
                    style={{
                      background: 'var(--card)',
                      border: '1px solid var(--border)',
                      borderRadius: 12,
                      padding: 16,
                      display: 'flex',
                      flexDirection: 'column',
                      gap: 10,
                    }}
                  >
                    {/* Top row: term pill + duration */}
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <span style={{
                        fontSize: 11, color: 'var(--muted-foreground)',
                        background: 'var(--muted)', padding: '2px 8px', borderRadius: 20,
                      }}>
                        {offering?.semester ?? '—'}
                      </span>
                      <span style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>{a.durationMinutes} min</span>
                    </div>

                    {/* Title */}
                    <div style={{ fontSize: 14, fontWeight: 600, lineHeight: 1.4, color: 'var(--foreground)' }}>
                      {a.title}
                    </div>

                    {/* Stats */}
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                      {a.questionCount} questions
                    </div>

                    {/* Difficulty bar */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                      <div style={{ display: 'flex', height: 6, borderRadius: 3, overflow: 'hidden' }}>
                        <div style={{ flex: easy / (total || 1), background: 'var(--chart-2)' }} />
                        <div style={{ flex: med  / (total || 1), background: 'var(--chart-3)' }} />
                        <div style={{ flex: hard / (total || 1), background: 'var(--chart-1)' }} />
                      </div>
                      <div style={{ fontSize: 10, color: 'var(--muted-foreground)', display: 'flex', gap: 8 }}>
                        <span>E {pct(easy)}%</span>
                        <span>M {pct(med)}%</span>
                        <span>H {pct(hard)}%</span>
                      </div>
                    </div>

                    {/* CTA */}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        const qs = getAsmtQuestions(a)
                        setPickerAsmt(a)
                        setSelectedQids(new Set(qs.map(q => q.id)))
                        setPreviewQid(null)
                        setView('question-picker')
                      }}
                      style={{ justifyContent: 'space-between', paddingInline: 8, marginTop: 2 }}
                    >
                      Preview questions
                      <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
                    </Button>
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    )
  }

  // ── Paths view ────────────────────────────────────────────────────────────────
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden', background: 'var(--background)' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', padding: '0 20px', height: 52, borderBottom: '1px solid var(--border)', background: 'var(--card)', flexShrink: 0, gap: 10 }}>
        <Button variant="ghost" size="sm" onClick={onBack} style={{ gap: 6, color: 'var(--muted-foreground)', paddingInline: 8 }}>
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
          Courses
        </Button>
        <span style={{ color: 'var(--border)', fontSize: 14 }}>/</span>
        <span style={{ fontSize: 14, fontWeight: 600, color: 'var(--foreground)' }}>New Assessment</span>
      </div>

      {/* Centered content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '40px 24px', gap: 28, overflowY: 'auto' }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)', marginBottom: 6 }}>How would you like to start?</p>
          <p style={{ fontSize: 14, color: 'var(--muted-foreground)' }}>You can mix any method once you&apos;re inside the builder.</p>
        </div>

        <div style={{ width: '100%', maxWidth: 580, display: 'flex', flexDirection: 'column', gap: 10 }}>
          {/* Primary — copy from prior */}
          <Button
            variant="outline"
            size="default"
            onClick={() => setView('copy-picker')}
            style={{ width: '100%', height: 'auto', textAlign: 'left', padding: '18px 20px', borderRadius: 10, borderColor: 'var(--brand-color)', background: 'var(--brand-tint)' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, width: '100%' }}>
              <div style={{ width: 38, height: 38, borderRadius: 9, background: 'var(--brand-color)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <i className="fa-light fa-copy" aria-hidden="true" style={{ fontSize: 16, color: 'white' }} />
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--foreground)', marginBottom: 2 }}>Copy from prior exam</div>
                <div style={{ fontSize: 12, color: 'var(--muted-foreground)', lineHeight: 1.5, fontWeight: 400 }}>Duplicate a previous exam, then swap questions and settings for this term.</div>
              </div>
              <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 15, color: 'var(--brand-color)', flexShrink: 0 }} />
            </div>
          </Button>

          {/* Secondary — 3-col grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
            {SECONDARY_PATHS.map(path => (
              <Button
                key={path.id}
                variant="outline"
                size="default"
                onClick={() => onSelectMode(path.id)}
                style={{ height: 'auto', textAlign: 'left', padding: '14px 14px 12px', borderRadius: 10 }}
              >
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: 8, width: '100%' }}>
                  <div style={{ width: 30, height: 30, borderRadius: 7, background: 'var(--muted)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <i className={`fa-light ${path.icon}`} aria-hidden="true" style={{ fontSize: 13, color: 'var(--brand-color)' }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 2 }}>{path.label}</div>
                    <div style={{ fontSize: 11, color: 'var(--muted-foreground)', lineHeight: 1.5, fontWeight: 400 }}>{path.desc}</div>
                  </div>
                </div>
              </Button>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

// ── QB Command-Palette Picker ────────────────────────────────────────────────

// ─── Add Questions Modal — 4 methods: QB / AI / Import PDF / From scratch ─────

const ADD_METHODS = [
  { id: 'qb'     as const, icon: 'fa-database',      label: 'Question Bank' },
  { id: 'ai'     as const, icon: 'fa-sparkles',       label: 'AI-assisted'   },
  { id: 'pdf'    as const, icon: 'fa-file-pdf',       label: 'Import PDF'    },
  { id: 'manual' as const, icon: 'fa-pen-to-square',  label: 'From scratch'  },
]

function AddQuestionsModal({ initialMethod, selectedIds, onToggle, activeSection, activeAsmt, onClose }: {
  initialMethod: 'qb' | 'pdf' | 'manual' | 'ai'
  selectedIds: Set<string>
  onToggle: (id: string, provenance?: AssessmentQuestion['provenance']) => void
  activeSection: AssessmentSection | null
  activeAsmt: AssessmentDraft | null
  onClose: () => void
}) {
  const [method, setMethod] = React.useState<'qb' | 'pdf' | 'manual' | 'ai'>(initialMethod)

  // QB state
  const [searchQuery, setSearchQuery] = React.useState('')
  const [activeFilters, setActiveFilters] = React.useState<string[]>([])

  // PDF state
  const [pdfFile, setPdfFile] = React.useState<File | null>(null)
  const [pdfParsing, setPdfParsing] = React.useState(false)
  const [pdfExtracted, setPdfExtracted] = React.useState<Question[]>([])
  const [pdfShowMatching, setPdfShowMatching] = React.useState(false)
  const pdfInputRef = React.useRef<HTMLInputElement>(null)
  const [pdfDragging, setPdfDragging] = React.useState(false)

  // AI state
  const [aiPrompt, setAiPrompt] = React.useState('')
  const [aiGenerating, setAiGenerating] = React.useState(false)
  const [aiResults, setAiResults] = React.useState<Question[]>([])

  // Manual state
  const [stem, setStem] = React.useState('')
  const [opts, setOpts] = React.useState(['', '', '', ''])
  const [correctIdx, setCorrectIdx] = React.useState<number | null>(null)

  const sectionLabel = activeSection && activeAsmt
    ? `${activeAsmt.sections.findIndex(s => s.id === activeSection.id) + 1}. ${activeSection.title}`
    : 'section'

  // QB filtered questions
  const qbQuestions = useMemo(() => {
    let qs = MOCK_QB_QUESTIONS.filter(q => q.status !== 'Draft')
    const q = searchQuery.toLowerCase().trim()
    if (q) qs = qs.filter(item => item.title.toLowerCase().includes(q) || item.folder.toLowerCase().includes(q))
    for (const f of activeFilters) {
      if (f === 'MCQ') qs = qs.filter(item => item.type === 'MCQ')
      if (f === 'Medium') qs = qs.filter(item => item.difficulty === 'Medium')
      if (f === 'Easy') qs = qs.filter(item => item.difficulty === 'Easy')
      if (f === 'Hard') qs = qs.filter(item => item.difficulty === 'Hard')
    }
    return qs.slice(0, 10)
  }, [searchQuery, activeFilters])

  function acceptPdf(f: File | undefined) {
    if (!f) return
    setPdfFile(f)
    setPdfParsing(true)
    setTimeout(() => {
      setPdfExtracted(MOCK_PDF_EXTRACTED)
      setPdfShowMatching(true)
      setPdfParsing(false)
    }, 1800)
  }

  const manualValid = stem.trim().length > 0 && correctIdx !== null && opts[correctIdx]?.trim().length > 0

  const diffColor: Record<string, string> = {
    Easy: 'var(--qb-diff-bar-easy)', Medium: 'var(--qb-diff-bar-medium)', Hard: 'var(--qb-diff-bar-hard)',
  }
  const diffWeight: Record<string, string> = {
    Easy: 'font-normal', Medium: 'font-semibold', Hard: 'font-extrabold',
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Add questions"
      style={{ position: 'fixed', inset: 0, zIndex: 50, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(0,0,0,0.15)' }}
      onClick={e => { if (e.target === e.currentTarget) onClose() }}
    >
      <div style={{ background: 'var(--background)', border: '1px solid var(--border)', borderRadius: 12, width: 580, maxHeight: '78vh', display: 'flex', flexDirection: 'column', boxShadow: '0 8px 32px rgba(0,0,0,0.12)', overflow: 'hidden' }}>

        {/* Header */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
          <span style={{ fontSize: 14, fontWeight: 600, flex: 1, color: 'var(--foreground)' }}>Add questions</span>
          {activeSection && (
            <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--brand-color)', background: 'color-mix(in srgb, var(--brand-color) 10%, var(--background))', border: '1px solid color-mix(in srgb, var(--brand-color) 25%, var(--background))', padding: '2px 8px', borderRadius: 20 }}>
              → {sectionLabel}
            </span>
          )}
          <Button variant="ghost" size="sm" onClick={onClose} aria-label="Close">
            <i className="fa-light fa-xmark" aria-hidden="true" />
          </Button>
        </div>

        {/* Method tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--muted)' }}>
          {ADD_METHODS.map(m => {
            const isActive = method === m.id
            return (
              <button
                key={m.id}
                type="button"
                onClick={() => setMethod(m.id)}
                style={{
                  flex: 1, padding: '10px 8px', border: 'none', cursor: 'pointer', fontFamily: 'inherit',
                  background: isActive ? 'var(--background)' : 'transparent',
                  borderBottom: isActive ? '2px solid var(--brand-color)' : '2px solid transparent',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                  fontSize: 13, fontWeight: isActive ? 600 : 400,
                  color: isActive ? 'var(--foreground)' : 'var(--muted-foreground)',
                }}
              >
                <i className={`fa-light ${m.icon}`} aria-hidden="true" style={{ fontSize: 12 }} />
                {m.label}
              </button>
            )
          })}
        </div>

        {/* ── QB tab ── */}
        {method === 'qb' && (
          <>
            <div style={{ padding: '10px 16px 8px', flexShrink: 0 }}>
              <div style={{ border: '1.5px solid var(--border)', borderRadius: 8, display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px' }}>
                <i className="fa-light fa-magnifying-glass" aria-hidden="true" style={{ fontSize: 13, color: 'var(--muted-foreground)', flexShrink: 0 }} />
                <input
                  type="text"
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  placeholder="Search by topic, keyword, or describe what you need…"
                  aria-label="Search questions"
                  autoFocus
                  style={{ flex: 1, border: 'none', outline: 'none', background: 'transparent', fontSize: 13, color: 'var(--foreground)', fontFamily: 'inherit' }}
                />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                {['MCQ', 'Easy', 'Medium', 'Hard'].map(f => {
                  const on = activeFilters.includes(f)
                  return (
                    <button
                      key={f}
                      type="button"
                      onClick={() => setActiveFilters(prev => on ? prev.filter(x => x !== f) : [...prev, f])}
                      style={{
                        fontSize: 11, fontWeight: 500, borderRadius: 20, padding: '2px 9px', cursor: 'pointer', fontFamily: 'inherit',
                        background: on ? 'var(--foreground)' : 'var(--muted)',
                        color: on ? 'var(--background)' : 'var(--muted-foreground)',
                        border: on ? 'none' : '1px solid var(--border)',
                      }}
                    >
                      {f}
                    </button>
                  )
                })}
                <span style={{ fontSize: 11, color: 'var(--muted-foreground)', marginLeft: 4 }}>
                  {qbQuestions.length} result{qbQuestions.length !== 1 ? 's' : ''}
                </span>
              </div>
            </div>
            <div style={{ flex: 1, overflowY: 'auto', borderTop: '1px solid var(--border)' }}>
              {qbQuestions.length === 0 ? (
                <div style={{ padding: '32px 16px', textAlign: 'center', fontSize: 13, color: 'var(--muted-foreground)' }}>No questions match</div>
              ) : qbQuestions.map(q => {
                const isPicked = selectedIds.has(q.id)
                const contentArea = q.folder.split('/').slice(-1)[0] ?? ''
                return (
                  <div
                    key={q.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => onToggle(q.id)}
                    onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(q.id) }}
                    style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isPicked ? 'var(--brand-tint)' : 'transparent' }}
                  >
                    <div style={{ width: 15, height: 15, borderRadius: 3, flexShrink: 0, border: isPicked ? 'none' : '1.5px solid var(--border)', background: isPicked ? 'var(--brand-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {isPicked && <svg width="8" height="8" viewBox="0 0 10 10" fill="white" aria-hidden="true"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                    </div>
                    <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--foreground)' }}>{q.title}</span>
                    {contentArea && <span className="text-xs text-muted-foreground" style={{ flexShrink: 0 }}>{contentArea}</span>}
                    <span className={`text-xs ${diffWeight[q.difficulty] ?? ''}`} style={{ color: diffColor[q.difficulty], flexShrink: 0 }}>{q.difficulty}</span>
                    {q.pbis !== null && <span className="text-xs font-mono text-foreground" style={{ flexShrink: 0 }}>{q.pbis.toFixed(2)}</span>}
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* ── PDF tab ── */}
        {method === 'pdf' && (
          !pdfFile ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 16 }}>
              <div
                onDragOver={e => { e.preventDefault(); setPdfDragging(true) }}
                onDragLeave={() => setPdfDragging(false)}
                onDrop={e => { e.preventDefault(); setPdfDragging(false); acceptPdf(e.dataTransfer.files[0]) }}
                onClick={() => pdfInputRef.current?.click()}
                style={{ width: '100%', maxWidth: 360, border: `2px dashed ${pdfDragging ? 'var(--brand-color)' : 'var(--border)'}`, borderRadius: 12, padding: '32px 24px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10, cursor: 'pointer', background: pdfDragging ? 'var(--brand-tint)' : 'var(--muted)', textAlign: 'center', transition: 'border-color 0.15s, background 0.15s' }}
              >
                <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" style={{ fontSize: 18, color: 'var(--brand-color)' }} />
                </div>
                <div>
                  <div className="text-sm font-medium text-foreground" style={{ marginBottom: 3 }}>Drop a PDF here</div>
                  <div className="text-xs text-muted-foreground">or click to browse · PDF only</div>
                </div>
                <input ref={pdfInputRef} type="file" accept=".pdf,application/pdf" aria-label="Select PDF file" style={{ display: 'none' }} onChange={e => acceptPdf(e.target.files?.[0])} />
              </div>
              <div style={{ maxWidth: 360, width: '100%' }}>
                <p className="text-xs font-medium text-muted-foreground" style={{ marginBottom: 6 }}>Leo will extract:</p>
                {['Question stems and answer choices', 'Section structure and topics', 'Timing and instruction notes'].map((item, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 4 }}>
                    <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--chart-2)', flexShrink: 0 }} />
                    {item}
                  </div>
                ))}
              </div>
            </div>
          ) : pdfParsing ? (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
              <i className="fa-light fa-loader fa-spin" aria-hidden="true" style={{ fontSize: 28, color: 'var(--brand-color)' }} />
              <div style={{ textAlign: 'center' }}>
                <div className="text-sm font-medium text-foreground" style={{ marginBottom: 3 }}>Extracting questions…</div>
                <div className="text-xs text-muted-foreground">{pdfFile.name}</div>
              </div>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)', flexShrink: 0 }}>
                <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color)', flexShrink: 0 }} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="text-xs font-semibold text-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{pdfFile.name}</div>
                  <div className="text-xs text-muted-foreground">{pdfExtracted.length} questions extracted</div>
                </div>
                <Button variant="ghost" size="sm" onClick={() => { setPdfFile(null); setPdfExtracted([]) }}>Change file</Button>
              </div>
              <div style={{ flex: 1, overflowY: 'auto' }}>
                {pdfExtracted.map(q => {
                  const isPicked = selectedIds.has(q.id)
                  return (
                    <div
                      key={q.id}
                      role="button"
                      tabIndex={0}
                      onClick={() => onToggle(q.id)}
                      onKeyDown={e => { if (e.key === 'Enter' || e.key === ' ') onToggle(q.id) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border)', cursor: 'pointer', background: isPicked ? 'var(--brand-tint)' : 'transparent' }}
                    >
                      <div style={{ width: 15, height: 15, borderRadius: 3, flexShrink: 0, border: isPicked ? 'none' : '1.5px solid var(--border)', background: isPicked ? 'var(--brand-color)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {isPicked && <svg width="8" height="8" viewBox="0 0 10 10" fill="white" aria-hidden="true"><path d="M2 5l2.5 2.5L8 3" stroke="white" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round" /></svg>}
                      </div>
                      <span style={{ fontSize: 13, flex: 1, overflow: 'hidden', whiteSpace: 'nowrap', textOverflow: 'ellipsis', color: 'var(--foreground)' }}>{q.title}</span>
                      <span className={`text-xs ${diffWeight[q.difficulty] ?? ''}`} style={{ color: diffColor[q.difficulty], flexShrink: 0 }}>{q.difficulty}</span>
                      <span className="text-xs text-muted-foreground font-medium" style={{ flexShrink: 0 }}>{q.type}</span>
                    </div>
                  )
                })}
              </div>
            </>
          )
        )}

        {/* ── From scratch tab ── */}
        {method === 'manual' && (
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {/* Stem */}
            <div>
              <label className="text-xs font-semibold text-foreground" style={{ display: 'block', marginBottom: 6 }}>Question stem</label>
              <textarea
                value={stem}
                onChange={e => setStem(e.target.value)}
                placeholder="A 45-year-old patient presents with…"
                rows={4}
                aria-label="Question stem"
                style={{ width: '100%', fontSize: 13, color: 'var(--foreground)', padding: '10px 12px', border: '1.5px solid var(--border)', borderRadius: 8, fontFamily: 'inherit', lineHeight: 1.5, resize: 'vertical', outline: 'none', background: 'var(--background)', boxSizing: 'border-box' }}
              />
            </div>
            {/* Options */}
            <div>
              <label className="text-xs font-semibold text-foreground" style={{ display: 'block', marginBottom: 6 }}>Answer choices <span className="text-muted-foreground font-normal">— click the letter to mark correct</span></label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {opts.map((opt, i) => {
                  const letter = String.fromCharCode(65 + i)
                  const isCorrect = correctIdx === i
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <button
                        type="button"
                        onClick={() => setCorrectIdx(isCorrect ? null : i)}
                        aria-label={`Mark option ${letter} as correct`}
                        aria-pressed={isCorrect}
                        style={{
                          width: 28, height: 28, borderRadius: 6, border: 'none', cursor: 'pointer', fontFamily: 'inherit', flexShrink: 0,
                          background: isCorrect ? 'var(--chart-2)' : 'var(--muted)',
                          color: isCorrect ? 'white' : 'var(--muted-foreground)',
                          fontSize: 12, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'background 0.12s, color 0.12s',
                        }}
                      >
                        {letter}
                      </button>
                      <input
                        type="text"
                        value={opt}
                        onChange={e => setOpts(prev => prev.map((o, j) => j === i ? e.target.value : o))}
                        placeholder={`Option ${letter}`}
                        aria-label={`Option ${letter}`}
                        style={{ flex: 1, fontSize: 13, padding: '7px 10px', border: `1.5px solid ${isCorrect ? 'var(--chart-2)' : 'var(--border)'}`, borderRadius: 7, fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)', outline: 'none', transition: 'border-color 0.12s' }}
                      />
                    </div>
                  )
                })}
              </div>
            </div>
            {/* Type / difficulty row */}
            <div style={{ display: 'flex', gap: 10 }}>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold text-foreground" style={{ display: 'block', marginBottom: 6 }}>Type</label>
                <select aria-label="Question type" style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)' }}>
                  <option>MCQ</option><option>MSQ</option><option>True/False</option><option>Short Answer</option>
                </select>
              </div>
              <div style={{ flex: 1 }}>
                <label className="text-xs font-semibold text-foreground" style={{ display: 'block', marginBottom: 6 }}>Difficulty</label>
                <select aria-label="Difficulty" style={{ width: '100%', fontSize: 12, padding: '6px 8px', border: '1px solid var(--border)', borderRadius: 7, fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)' }}>
                  <option>Easy</option><option>Medium</option><option>Hard</option>
                </select>
              </div>
            </div>
          </div>
        )}

        {/* Footer */}
        <div style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 10, background: 'var(--card)', flexShrink: 0 }}>
          <span style={{ fontSize: 13, color: 'var(--muted-foreground)', flex: 1 }}>
            {method === 'qb'
              ? (selectedIds.size > 0 ? `${selectedIds.size} selected` : 'Select questions to add')
              : method === 'pdf'
              ? (pdfExtracted.length > 0 ? `${selectedIds.size} of ${pdfExtracted.length} selected` : pdfFile ? 'Extracting…' : 'Upload a PDF to begin')
              : (manualValid ? 'Ready to add' : 'Fill in the stem and mark an answer')}
          </span>
          <Button variant="ghost" size="sm" onClick={onClose}>Cancel</Button>
          {method === 'manual' ? (
            <Button size="sm" disabled={!manualValid} onClick={onClose} className="gap-1.5">
              <i className="fa-light fa-plus" aria-hidden="true" />
              Add question
            </Button>
          ) : (
            <Button size="sm" disabled={selectedIds.size === 0} onClick={onClose} className="gap-1.5">
              Add {selectedIds.size > 0 ? selectedIds.size : ''} to {sectionLabel}
            </Button>
          )}
        </div>

      </div>
    </div>
  )
}

// ── Section Assign Sheet ─────────────────────────────────────────────────────

const ASSIGN_AVATAR_COLORS: Record<string, string> = {
  'fac-001': '#7c6bbf', 'fac-002': '#3b7abf', 'fac-003': '#4e9a6b',
  'fac-004': '#bf5b3b', 'fac-005': '#b87c3b', 'fac-006': '#3b9abf',
  'fac-007': '#6b7cbf', 'fac-008': '#4e7a6b', 'fac-009': '#9a4e6b',
}

function SectionAssignSheet({
  open,
  onOpenChange,
  section,
  sectionIndex,
  collaboratorIds,
  onAssignFaculty,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: AssessmentSection | null
  sectionIndex: number
  collaboratorIds: string[]
  onAssignFaculty: (sectionId: string, patch: { facultyIds?: string[]; questionTarget?: number; prereadText?: string; instructions?: string; timeLimitMinutes?: number; prereadTimerMinutes?: number | null; excludePrereadFromDuration?: boolean; sectionWarningAlarmMinutes?: number | null }) => void
}) {
  const initialFacIds = React.useMemo(() => {
    if (!section) return new Set<string>()
    if (section.facultyIds?.length) return new Set(section.facultyIds)
    if (section.facultyId) return new Set([section.facultyId])
    return new Set<string>()
  }, [section?.id, section?.facultyIds, section?.facultyId]) // eslint-disable-line react-hooks/exhaustive-deps

  const [selectedIds, setSelectedIds] = React.useState<Set<string>>(initialFacIds)
  const [questionTarget, setQuestionTarget] = React.useState<string>(section?.questionTarget?.toString() ?? '')
  const [prereadText, setPrereadText] = React.useState<string>(section?.prereadText ?? '')
  const [sectionInstructions, setSectionInstructions] = React.useState<string>(section?.instructions ?? '')
  const [timeLimitMinutes, setTimeLimitMinutes] = React.useState<string>(section?.timeLimitMinutes?.toString() ?? '')
  const [prereadTimer, setPrereadTimer] = React.useState<string>(section?.prereadTimerMinutes?.toString() ?? '')
  const [excludePrereadFromDuration, setExcludePrereadFromDuration] = React.useState(section?.excludePrereadFromDuration ?? false)
  const [sectionWarningAlarm, setSectionWarningAlarm] = React.useState<string>(section?.sectionWarningAlarmMinutes?.toString() ?? '')

  React.useEffect(() => {
    setSelectedIds(initialFacIds)
    setQuestionTarget(section?.questionTarget?.toString() ?? '')
    setPrereadText(section?.prereadText ?? '')
    setSectionInstructions(section?.instructions ?? '')
    setTimeLimitMinutes(section?.timeLimitMinutes?.toString() ?? '')
    setPrereadTimer(section?.prereadTimerMinutes?.toString() ?? '')
    setExcludePrereadFromDuration(section?.excludePrereadFromDuration ?? false)
    setSectionWarningAlarm(section?.sectionWarningAlarmMinutes?.toString() ?? '')
  }, [section?.id, initialFacIds]) // eslint-disable-line react-hooks/exhaustive-deps

  const facultyPool = collaboratorIds.length > 0
    ? facultyListRows.filter(f => collaboratorIds.includes(f.id))
    : facultyListRows.slice(0, 6)

  if (!section) return null

  function toggleFac(id: string) {
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) { next.delete(id) } else { next.add(id) }
      return next
    })
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ width: 320, display: 'flex', flexDirection: 'column', padding: 0 }}
      >
        <SheetHeader style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <SheetTitle style={{ fontSize: 13, fontWeight: 600 }}>
            {sectionIndex + 1}. {section.title}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">Section settings — timer, pre-read, instructions, and faculty assignment.</p>
        </SheetHeader>

        <div style={{ flex: 1, overflowY: 'auto' }}>
          {/* Faculty multi-select */}
          <div style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-foreground)', textTransform: 'uppercase', letterSpacing: '0.06em', padding: '12px 16px 6px' }}>
            {collaboratorIds.length > 0 ? 'Assessment collaborators' : 'Faculty'}
          </div>
          {facultyPool.length === 0 ? (
            <p style={{ fontSize: 13, color: 'var(--muted-foreground)', padding: '8px 16px' }}>
              No collaborators were added on the canvas. Add faculty there first.
            </p>
          ) : facultyPool.map(fac => {
            const initials = fac.fullName.split(' ').filter(Boolean).map((w: string) => w[0]).join('').slice(0, 2).toUpperCase()
            const color = ASSIGN_AVATAR_COLORS[fac.id] ?? '#7c6bbf'
            const isSelected = selectedIds.has(fac.id)
            return (
              <button
                key={fac.id}
                type="button"
                aria-pressed={isSelected}
                onClick={() => toggleFac(fac.id)}
                style={{
                  display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px',
                  width: '100%', textAlign: 'left',
                  background: isSelected ? 'var(--brand-tint)' : 'none',
                  border: 'none', borderLeft: `3px solid ${isSelected ? 'var(--brand-color)' : 'transparent'}`,
                  cursor: 'pointer', fontFamily: 'inherit',
                }}
              >
                <div style={{
                  width: 32, height: 32, borderRadius: '50%', background: color,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#fff', flexShrink: 0,
                }}>
                  {initials}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: 'var(--foreground)' }}>{fac.fullName}</div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{fac.rank}</div>
                </div>
                <div style={{
                  width: 18, height: 18, borderRadius: 4, border: `2px solid ${isSelected ? 'var(--brand-color)' : 'var(--border-control-35, var(--border))'}`,
                  background: isSelected ? 'var(--brand-color)' : 'transparent', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  {isSelected && <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--background)' }} />}
                </div>
              </button>
            )
          })}

          {/* Question target */}
          <div style={{ padding: '14px 16px', borderTop: '1px solid var(--border)', marginTop: 8 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
              Question target <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
            </div>
            <input
              type="number"
              min={1}
              max={200}
              value={questionTarget}
              onChange={e => setQuestionTarget(e.target.value)}
              placeholder="e.g. 15"
              aria-label="Target number of questions for this section"
              style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', width: 90, fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)', outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 5 }}>How many questions this section should have. Shown as progress in the sidebar.</p>
          </div>

          {/* Section pre-read */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
              Case / pre-read <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
            </div>
            <textarea
              aria-label="Section pre-read or case study text"
              value={prereadText}
              onChange={e => setPrereadText(e.target.value)}
              placeholder="Paste case study or clinical vignette shown before this section's questions…"
              rows={4}
              style={{ width: '100%', fontSize: 13, lineHeight: 1.5, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 4 }}>Shown to students as a reading block before they see this section's questions.</p>
            {prereadText.trim() && (
              <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                  <label style={{ fontSize: 12, color: 'var(--muted-foreground)', whiteSpace: 'nowrap' }}>Reading time limit</label>
                  <input
                    type="number"
                    min={1}
                    max={60}
                    value={prereadTimer}
                    onChange={e => setPrereadTimer(e.target.value)}
                    placeholder="—"
                    aria-label="Preread timer in minutes"
                    style={{ width: 52, fontSize: 12, border: '1px solid var(--border)', borderRadius: 6, padding: '3px 6px', color: 'var(--foreground)', background: 'var(--background)', outline: 'none', fontFamily: 'inherit', textAlign: 'center' }}
                    onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
                    onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
                  />
                  <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>min</span>
                </div>
                <label style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 12, color: 'var(--muted-foreground)', cursor: 'pointer' }}>
                  <input
                    type="checkbox"
                    checked={excludePrereadFromDuration}
                    onChange={e => setExcludePrereadFromDuration(e.target.checked)}
                    aria-label="Exclude preread from total duration"
                  />
                  Exclude from total duration
                </label>
              </div>
            )}
          </div>

          {/* Section instructions */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
              Section instructions <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
            </div>
            <textarea
              aria-label="Section-specific instructions for students"
              value={sectionInstructions}
              onChange={e => setSectionInstructions(e.target.value)}
              placeholder="e.g. Answer all questions in this section before proceeding. Calculator not permitted."
              rows={3}
              style={{ width: '100%', fontSize: 13, lineHeight: 1.5, padding: '7px 10px', border: '1px solid var(--border)', borderRadius: 6, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical', fontFamily: 'inherit', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>

          {/* Section timer */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
              Section time limit <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={1}
                max={480}
                value={timeLimitMinutes}
                onChange={e => setTimeLimitMinutes(e.target.value)}
                placeholder="—"
                aria-label="Section time limit in minutes"
                style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', width: 70, fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)', outline: 'none' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>minutes</span>
            </div>
            <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 5 }}>Students have this many minutes for this section. Leave blank for no section limit.</p>
          </div>

          {/* Section warning alarm */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
              Warning alarm <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <input
                type="number"
                min={1}
                max={30}
                value={sectionWarningAlarm}
                onChange={e => setSectionWarningAlarm(e.target.value)}
                placeholder="—"
                aria-label="Section warning alarm minutes before expiry"
                style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', width: 60, fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)', outline: 'none' }}
                onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
                onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
              />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>min before section ends (blank = use assessment default)</span>
            </div>
          </div>

          {/* Contribution deadline */}
          <div style={{ padding: '0 16px 14px', borderTop: '1px solid var(--border)', paddingTop: 14 }}>
            <div style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', marginBottom: 5 }}>
              Contribution deadline <span style={{ fontWeight: 400, color: 'var(--muted-foreground)' }}>(optional)</span>
            </div>
            <input
              type="text"
              defaultValue=""
              placeholder="e.g. May 30, 2026"
              aria-label="Contribution deadline"
              style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '5px 9px', width: '100%', fontFamily: 'inherit', color: 'var(--foreground)', background: 'var(--background)', outline: 'none', boxSizing: 'border-box' }}
              onFocus={e => { e.currentTarget.style.borderColor = 'var(--ring)'; e.currentTarget.style.boxShadow = '0 0 0 2px var(--ring)' }}
              onBlur={e => { e.currentTarget.style.borderColor = 'var(--border)'; e.currentTarget.style.boxShadow = 'none' }}
            />
          </div>
        </div>

        <SheetFooter style={{ padding: '10px 16px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: 8, justifyContent: 'space-between' }}>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
            {selectedIds.size === 0 ? 'No faculty assigned' : `${selectedIds.size} faculty`}
          </span>
          <div style={{ display: 'flex', gap: 8 }}>
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button
              size="sm"
              onClick={() => {
                if (section) onAssignFaculty(section.id, {
                  facultyIds: selectedIds.size > 0 ? [...selectedIds] : undefined,
                  questionTarget: questionTarget ? Number(questionTarget) : undefined,
                  prereadText: prereadText.trim() || undefined,
                  instructions: sectionInstructions.trim() || undefined,
                  timeLimitMinutes: timeLimitMinutes ? Number(timeLimitMinutes) : undefined,
                  prereadTimerMinutes: prereadTimer ? parseInt(prereadTimer) : null,
                  excludePrereadFromDuration,
                  sectionWarningAlarmMinutes: sectionWarningAlarm ? parseInt(sectionWarningAlarm) : null,
                })
                onOpenChange(false)
              }}
            >
              Save
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  )
}

// ── Section Analysis Sheet ────────────────────────────────────────────────────

function HBar({ label, count, total, color, labelWidth = 90, icon }: {
  label: string
  count: number
  total: number
  color: string
  labelWidth?: number
  icon?: string
}) {
  const pct = total > 0 ? Math.round((count / total) * 100) : 0
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <span style={{ fontSize: 12, color: 'var(--muted-foreground)', width: labelWidth, flexShrink: 0, textAlign: 'right', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: 5 }}>
        {icon && <i className={icon} aria-hidden="true" style={{ fontSize: 11 }} />}
        {label}
      </span>
      <div style={{ flex: 1, height: 10, borderRadius: 5, background: 'var(--border)', overflow: 'hidden' }}>
        <div style={{
          width: `${pct}%`, height: '100%', borderRadius: 5, background: color,
          minWidth: count > 0 ? 5 : 0, transition: 'width 0.4s ease',
        }} />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', width: 22, textAlign: 'right', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{count}</span>
      <span style={{ fontSize: 12, color: 'var(--muted-foreground)', width: 30, flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{pct > 0 ? `${pct}%` : ''}</span>
    </div>
  )
}

function SectionAnalysisSheet({ open, onOpenChange, section, sectionIndex, questions, pinnedQuestionIds }: {
  open: boolean
  onOpenChange: (open: boolean) => void
  section: import('@/lib/qb-types').AssessmentSection | null
  sectionIndex: number
  questions: import('@/lib/qb-types').Question[]
  pinnedQuestionIds: Set<string>
}) {
  if (!section) return null
  const total = questions.length

  const typeCounts: Record<string, number> = {}
  const bloomsCounts: Record<string, number> = {}
  const diffCounts: Record<string, number> = { Easy: 0, Medium: 0, Hard: 0 }
  const pbiGroups = { good: 0, ok: 0, low: 0, missing: 0 }

  for (const q of questions) {
    typeCounts[q.type] = (typeCounts[q.type] ?? 0) + 1
    bloomsCounts[q.blooms] = (bloomsCounts[q.blooms] ?? 0) + 1
    if (q.difficulty === 'Easy') diffCounts.Easy++
    else if (q.difficulty === 'Medium') diffCounts.Medium++
    else diffCounts.Hard++
    if (q.pbis === null) pbiGroups.missing++
    else if (q.pbis >= 0.3) pbiGroups.good++
    else if (q.pbis >= 0.2) pbiGroups.ok++
    else pbiGroups.low++
  }

  const BLOOMS_ORDER = ['Remember', 'Understand', 'Apply', 'Analyze', 'Evaluate', 'Create'] as const
  const BLOOMS_COLORS: Record<string, string> = {
    Remember:   'oklch(0.72 0.09 250)',
    Understand: 'oklch(0.70 0.12 230)',
    Apply:      'var(--brand-color)',
    Analyze:    'oklch(0.62 0.14 270)',
    Evaluate:   'oklch(0.58 0.15 290)',
    Create:     'oklch(0.55 0.16 310)',
  }
  const TYPE_COLORS: Record<string, string> = {
    'MCQ':        'var(--brand-color)',
    'Fill blank': 'oklch(0.65 0.12 195)',
    'Hotspot':    'oklch(0.62 0.14 130)',
    'Ordering':   'oklch(0.65 0.13 55)',
    'Matching':   'oklch(0.60 0.14 30)',
  }
  const TYPE_ICONS: Record<string, string> = {
    'MCQ':        'fa-light fa-circle-dot',
    'Fill blank': 'fa-light fa-i-cursor',
    'Hotspot':    'fa-light fa-crosshairs',
    'Ordering':   'fa-light fa-list-ol',
    'Matching':   'fa-light fa-arrows-left-right',
  }

  const pinnedCount = questions.filter(q => pinnedQuestionIds.has(q.id)).length
  const lowPbiQuestions = questions.filter(q => q.pbis !== null && q.pbis < 0.2)

  function ChartSection({ title, children }: { title: string; children: React.ReactNode }) {
    return (
      <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
        <div style={{ fontSize: 12, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.07em', color: 'var(--muted-foreground)' }}>
          {title}
        </div>
        {children}
      </div>
    )
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent side="right" style={{ width: 380, maxWidth: '90vw', display: 'flex', flexDirection: 'column', padding: 0 }}>
        <SheetHeader style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
          <SheetTitle style={{ fontSize: 14, fontWeight: 600 }}>
            {sectionIndex + 1}. {section.title}
          </SheetTitle>
          <p className="text-xs text-muted-foreground">{total} question{total !== 1 ? 's' : ''} · section analysis</p>
        </SheetHeader>

        {total === 0 ? (
          <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <p className="text-sm text-muted-foreground">No questions in this section yet.</p>
          </div>
        ) : (
          <div style={{ flex: 1, overflowY: 'auto', padding: '20px 20px 32px', display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* ── Difficulty ── */}
            <ChartSection title="Difficulty">
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
                {diffCounts.Easy > 0 && <div style={{ flex: diffCounts.Easy, background: 'var(--qb-diff-bar-easy)', minWidth: 4, transition: 'flex 0.4s ease' }} title={`Easy: ${diffCounts.Easy}`} />}
                {diffCounts.Medium > 0 && <div style={{ flex: diffCounts.Medium, background: 'var(--qb-diff-bar-medium)', minWidth: 4, transition: 'flex 0.4s ease' }} title={`Medium: ${diffCounts.Medium}`} />}
                {diffCounts.Hard > 0 && <div style={{ flex: diffCounts.Hard, background: 'var(--qb-diff-bar-hard)', minWidth: 4, transition: 'flex 0.4s ease' }} title={`Hard: ${diffCounts.Hard}`} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <HBar label="Easy" count={diffCounts.Easy} total={total} color="var(--qb-diff-bar-easy)" labelWidth={60} />
                <HBar label="Medium" count={diffCounts.Medium} total={total} color="var(--qb-diff-bar-medium)" labelWidth={60} />
                <HBar label="Hard" count={diffCounts.Hard} total={total} color="var(--qb-diff-bar-hard)" labelWidth={60} />
              </div>
            </ChartSection>

            {/* ── Question type ── */}
            <ChartSection title="Question type">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {Object.entries(typeCounts)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <HBar key={type} label={type} count={count} total={total} color={TYPE_COLORS[type] ?? 'var(--muted-foreground)'} labelWidth={82} icon={TYPE_ICONS[type]} />
                  ))}
              </div>
            </ChartSection>

            {/* ── Bloom's taxonomy ── */}
            <ChartSection title="Bloom's taxonomy">
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {BLOOMS_ORDER.map(level => (
                  <HBar key={level} label={level} count={bloomsCounts[level] ?? 0} total={total} color={BLOOMS_COLORS[level] ?? 'var(--muted-foreground)'} labelWidth={80} />
                ))}
              </div>
              {(() => {
                const covered = BLOOMS_ORDER.filter(l => (bloomsCounts[l] ?? 0) > 0).length
                return (
                  <p style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>
                    {covered} of 6 levels covered
                    {covered <= 2 ? ' — consider adding higher-order questions' : ''}
                  </p>
                )
              })()}
            </ChartSection>

            {/* ── PBI health ── */}
            <ChartSection title="Point-biserial (PBI)">
              <div style={{ display: 'flex', height: 12, borderRadius: 6, overflow: 'hidden', gap: 1 }}>
                {pbiGroups.good > 0 && <div style={{ flex: pbiGroups.good, background: 'var(--chart-2)', minWidth: 4 }} title={`Good ≥0.30: ${pbiGroups.good}`} />}
                {pbiGroups.ok > 0 && <div style={{ flex: pbiGroups.ok, background: 'var(--chart-4)', minWidth: 4 }} title={`Acceptable 0.20–0.29: ${pbiGroups.ok}`} />}
                {pbiGroups.low > 0 && <div style={{ flex: pbiGroups.low, background: 'var(--chart-5)', minWidth: 4 }} title={`Low <0.20: ${pbiGroups.low}`} />}
                {pbiGroups.missing > 0 && <div style={{ flex: pbiGroups.missing, background: 'var(--border)', minWidth: 4 }} title={`No data: ${pbiGroups.missing}`} />}
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                <HBar label="Good ≥0.30" count={pbiGroups.good} total={total} color="var(--chart-2)" labelWidth={88} />
                <HBar label="OK 0.20–0.29" count={pbiGroups.ok} total={total} color="var(--chart-4)" labelWidth={88} />
                <HBar label="Low < 0.20" count={pbiGroups.low} total={total} color="var(--chart-5)" labelWidth={88} />
                {pbiGroups.missing > 0 && (
                  <HBar label="No data" count={pbiGroups.missing} total={total} color="var(--border)" labelWidth={88} />
                )}
              </div>
              {lowPbiQuestions.length > 0 && (
                <div>
                  <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginBottom: 6 }}>Needs review:</div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                    {lowPbiQuestions.map(q => (
                      <div key={q.id} style={{
                        display: 'flex', alignItems: 'center', gap: 8, padding: '6px 10px', borderRadius: 6,
                        background: 'color-mix(in srgb, var(--chart-5) 6%, var(--background))',
                        border: '1px solid color-mix(in srgb, var(--chart-5) 20%, transparent)',
                      }}>
                        <i className="fa-light fa-triangle-exclamation" aria-hidden="true" style={{ fontSize: 10, color: 'var(--chart-5)', flexShrink: 0 }} />
                        <span style={{ fontSize: 12, flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', color: 'var(--foreground)' }}>
                          {q.title}
                        </span>
                        <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--chart-5)', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>
                          {q.pbis!.toFixed(2)}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </ChartSection>

            {/* ── Randomization ── */}
            {pinnedCount > 0 && (
              <ChartSection title="Randomization">
                <div style={{ display: 'flex', gap: 12 }}>
                  <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--muted)', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--brand-color)' }}>{pinnedCount}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>Pinned · fixed</div>
                  </div>
                  <div style={{ flex: 1, padding: '10px 14px', borderRadius: 8, background: 'var(--muted)', textAlign: 'center' }}>
                    <div style={{ fontSize: 20, fontWeight: 700, color: 'var(--foreground)' }}>{total - pinnedCount}</div>
                    <div style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 2 }}>Randomized</div>
                  </div>
                </div>
              </ChartSection>
            )}

          </div>
        )}
      </SheetContent>
    </Sheet>
  )
}

// ─── PDF Import Panel ─────────────────────────────────────────────────────────

const MOCK_PDF_EXTRACTED: Question[] = [
  { id: 'pdf-q-1', code: 'PDF-001', version: 1, age: 'New', title: 'A 55-year-old patient on warfarin presents with an INR of 5.2 and reports minor gum bleeding. No active hemorrhage. Which intervention is most appropriate?', type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-2', code: 'PDF-002', version: 1, age: 'New', title: 'Which beta-blocker has the highest degree of cardioselectivity at therapeutic doses?', type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-3', code: 'PDF-003', version: 1, age: 'New', title: 'A patient with acute STEMI receives thrombolytics. 90 minutes later, ST segments remain elevated and chest pain persists. The most appropriate next step is:', type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-4', code: 'PDF-004', version: 1, age: 'New', title: 'Which of the following is an absolute contraindication to ACE inhibitor therapy?', type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-5', code: 'PDF-005', version: 1, age: 'New', title: 'A 68-year-old with HFrEF (EF 30%) is started on spironolactone. Which laboratory value requires the closest monitoring in the first 4 weeks?', type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-6', code: 'PDF-006', version: 1, age: 'New', title: 'Describe the mechanism by which digoxin reduces ventricular rate in atrial fibrillation without converting the rhythm.', type: 'Short Answer', status: 'Saved', difficulty: 'Hard', blooms: 'Understand', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-7', code: 'PDF-007', version: 1, age: 'New', title: 'A patient on long-term amiodarone develops elevated liver enzymes, hypothyroidism, and pulmonary infiltrates. Which adverse effect profile best accounts for these findings?', type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
  { id: 'pdf-q-8', code: 'PDF-008', version: 1, age: 'New', title: 'Which loop diuretic formulation is preferred for a patient with acute pulmonary edema who cannot tolerate furosemide due to sulfa allergy?', type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Apply', folder: 'pdf-import', folderPath: 'Imported from PDF', tags: [], usage: 0, pbis: null, pbisDir: null },
]

function PdfImportPanel({
  selectedIds, onToggle, onBack,
}: {
  selectedIds: Set<string>
  onToggle: (id: string) => void
  activeSectionId?: string | null
  onAssignToSection?: (questionId: string, sectionId: string | null) => void
  onBack: () => void
}) {
  const [file, setFile] = React.useState<File | null>(null)
  const [isDragging, setIsDragging] = React.useState(false)
  const [isParsing, setIsParsing] = React.useState(false)
  const [extracted, setExtracted] = React.useState<Question[]>([])
  const fileInputRef = React.useRef<HTMLInputElement>(null)

  function accept(f: File | undefined) {
    if (!f) return
    setFile(f)
    setIsParsing(true)
    setTimeout(() => { setExtracted(MOCK_PDF_EXTRACTED); setIsParsing(false) }, 1800)
  }

  const diffColor: Record<string, string> = {
    Easy: 'var(--qb-diff-bar-easy)', Medium: 'var(--qb-diff-bar-medium)', Hard: 'var(--qb-diff-bar-hard)',
  }
  const diffWeight: Record<string, string> = {
    Easy: 'font-normal', Medium: 'font-semibold', Hard: 'font-extrabold',
  }

  // Drop zone — no file yet
  if (!file) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 24px', gap: 16 }}>
        <div
          onDragOver={e => { e.preventDefault(); setIsDragging(true) }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={e => { e.preventDefault(); setIsDragging(false); accept(e.dataTransfer.files[0]) }}
          onClick={() => fileInputRef.current?.click()}
          style={{
            width: '100%', maxWidth: 360,
            border: `2px dashed ${isDragging ? 'var(--brand-color)' : 'var(--border)'}`,
            borderRadius: 12, padding: '32px 24px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 10,
            cursor: 'pointer',
            background: isDragging ? 'var(--brand-tint)' : 'var(--muted)',
            transition: 'border-color 0.15s, background 0.15s',
            textAlign: 'center',
          }}
        >
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'var(--background)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" style={{ fontSize: 18, color: 'var(--brand-color)' }} />
          </div>
          <div>
            <div className="text-sm font-medium text-foreground" style={{ marginBottom: 3 }}>Drop a PDF here</div>
            <div className="text-xs text-muted-foreground">or click to browse · PDF only</div>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,application/pdf"
            aria-label="Select PDF file"
            style={{ display: 'none' }}
            onChange={e => accept(e.target.files?.[0])}
          />
        </div>
        <div style={{ maxWidth: 360, width: '100%' }}>
          <p className="text-xs font-medium text-muted-foreground" style={{ marginBottom: 6 }}>Leo will extract:</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
            {['Question stems and answer choices', 'Section structure and topics', 'Instructions and timing notes'].map((item, i) => (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: 'var(--muted-foreground)' }}>
                <i className="fa-light fa-check" aria-hidden="true" style={{ fontSize: 10, color: 'var(--chart-2)', flexShrink: 0 }} />
                {item}
              </div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  // Parsing state
  if (isParsing) {
    return (
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 14, padding: 32 }}>
        <i className="fa-light fa-loader fa-spin" aria-hidden="true" style={{ fontSize: 28, color: 'var(--brand-color)' }} />
        <div style={{ textAlign: 'center' }}>
          <div className="text-sm font-medium text-foreground" style={{ marginBottom: 3 }}>Extracting questions…</div>
          <div className="text-xs text-muted-foreground">{file.name}</div>
        </div>
      </div>
    )
  }

  // Extracted questions — same table as QB
  return (
    <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      {/* File banner */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 16px', borderBottom: '1px solid var(--border)', background: 'var(--muted)', flexShrink: 0 }}>
        <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 14, color: 'var(--brand-color)', flexShrink: 0 }} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="text-xs font-semibold text-foreground" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{file.name}</div>
          <div className="text-xs text-muted-foreground">{extracted.length} questions extracted</div>
        </div>
        <Button
          variant="ghost" size="sm"
          onClick={() => { setFile(null); setExtracted([]) }}
          style={{ flexShrink: 0 }}
        >
          Change file
        </Button>
      </div>

      {/* Question table — identical style to QB source */}
      <div style={{ flex: 1, overflow: 'auto' }}>
        <Table style={{ width: '100%' }}>
          <TableHeader>
            <TableRow>
              <TableHead style={{ width: 36 }}></TableHead>
              <TableHead>Question</TableHead>
              <TableHead style={{ width: 80 }}>Difficulty</TableHead>
              <TableHead style={{ width: 100 }}>Type</TableHead>
              <TableHead style={{ width: 72 }}></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {extracted.map(q => {
              const isPicked = selectedIds.has(q.id)
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
                    <div style={{ lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {q.title}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className={`text-xs ${diffWeight[q.difficulty] ?? ''}`} style={{ color: diffColor[q.difficulty] }}>{q.difficulty}</span>
                  </TableCell>
                  <TableCell className="text-xs text-muted-foreground font-medium">
                    {q.type}
                  </TableCell>
                  <TableCell onClick={(e: React.MouseEvent) => e.stopPropagation()}>
                    {isPicked ? (
                      <Button variant="outline" size="sm" onClick={() => onToggle(q.id)} style={{ height: 28 }} aria-label={`Remove ${q.title}`}>
                        <i className="fa-light fa-check" aria-hidden="true" style={{ color: 'var(--chart-2)', marginRight: 4 }} />
                        Added
                      </Button>
                    ) : (
                      <Button variant="default" size="sm" onClick={() => onToggle(q.id)} style={{ height: 28 }}>
                        + Use
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              )
            })}
          </TableBody>
        </Table>
      </div>
    </div>
  )
}
