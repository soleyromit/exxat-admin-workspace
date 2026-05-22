/**
 * QUESTION EDITOR — extended type system.
 *
 * The QB types in `qb-types.ts` describe a saved question's metadata for the
 * library + assessment-builder grid. The editor needs richer per-type payloads
 * (options, correct answers, blanks, matching pairs, etc.). We keep the two
 * worlds aligned via `toQuestion()` which projects a `QuestionDraft` into the
 * existing `Question` shape for QB persistence.
 *
 * Aarti differentiator (May 6 meeting):
 *   - Draft mode until faculty approval
 *   - AI enhance suggestions with accept/reject
 *   - Confidence markers (high/low) — surfaces in QB filtering
 */

import type { QDiff, QBlooms, Question } from './qb-types'

/** All question types the editor supports. Superset of QB grid's `QType`. */
export type EditorQType =
  | 'mcq'
  | 'multi-select'
  | 'true-false'
  | 'short-answer'
  | 'numeric'
  | 'essay'
  | 'fill-blank'
  | 'matching'
  | 'ordering'
  | 'hotspot'
  | 'k-type'

export interface QuestionTypeMeta {
  id: EditorQType
  label: string
  icon: string                    // Font Awesome name
  shortDescription: string
  /** Approximate time per item — feeds the assessment time estimate. */
  baseMinutes: number
}

export const QUESTION_TYPES: QuestionTypeMeta[] = [
  { id: 'mcq',           label: 'Multiple choice',  icon: 'fa-list-radio',    baseMinutes: 1.5, shortDescription: 'Single correct answer from a set of options' },
  { id: 'multi-select',  label: 'Multi-select',     icon: 'fa-list-check',    baseMinutes: 2.0, shortDescription: 'One or more correct answers — partial credit' },
  { id: 'true-false',    label: 'True / False',     icon: 'fa-circle-half-stroke', baseMinutes: 1.0, shortDescription: 'Binary statement — quick recall' },
  { id: 'short-answer',  label: 'Short answer',     icon: 'fa-input-text',    baseMinutes: 2.0, shortDescription: 'Single word or short phrase, exact-match grading' },
  { id: 'numeric',       label: 'Numeric',          icon: 'fa-input-numeric', baseMinutes: 2.0, shortDescription: 'Number with units and tolerance band' },
  { id: 'essay',         label: 'Essay',            icon: 'fa-paragraph',     baseMinutes: 8.0, shortDescription: 'Long response — rubric-graded' },
  { id: 'fill-blank',    label: 'Fill in the blank',icon: 'fa-text-size',     baseMinutes: 2.0, shortDescription: 'Sentence with one or more blanks to complete' },
  { id: 'matching',      label: 'Matching',         icon: 'fa-arrow-right-arrow-left', baseMinutes: 3.0, shortDescription: 'Pair terms on the left to definitions on the right' },
  { id: 'ordering',      label: 'Ordering',         icon: 'fa-arrow-down-1-9', baseMinutes: 3.0, shortDescription: 'Place items in the correct sequence' },
  { id: 'hotspot',       label: 'Hotspot',          icon: 'fa-bullseye',      baseMinutes: 2.5, shortDescription: 'Click the correct region of an image' },
  { id: 'k-type',        label: 'K-type',           icon: 'fa-table-list',    baseMinutes: 3.0, shortDescription: 'Complex MCQ — each option rated True/False, select correct combination' },
]

export const QUESTION_TYPE_BY_ID: Record<EditorQType, QuestionTypeMeta> =
  Object.fromEntries(QUESTION_TYPES.map(t => [t.id, t])) as Record<EditorQType, QuestionTypeMeta>

// ─── Per-type payloads ──────────────────────────────────────────────────────

export interface McqOption     { id: string; text: string; correct: boolean; rationale?: string; locked?: boolean }
export interface MatchPair     { id: string; left: string; rightId: string }
export interface MatchRight    { id: string; text: string }
export interface OrderItem     { id: string; text: string; canonicalIdx: number }
export interface FillBlankSpan { id: string; acceptedAnswers: string[]; caseSensitive: boolean }
export interface Hotspot       { id: string; x: number; y: number; w: number; h: number; label: string }
export interface RubricCriterion { id: string; label: string; weight: number; description: string }
export interface KTypeStatement  { id: string; text: string; correct: boolean }

export type QuestionPayload =
  | { type: 'mcq';          options: McqOption[]; shuffle: boolean }
  | { type: 'multi-select'; options: McqOption[]; shuffle: boolean; partialCredit: boolean }
  | { type: 'true-false';   correct: boolean; rationale?: string }
  | { type: 'short-answer'; acceptedAnswers: string[]; caseSensitive: boolean }
  | { type: 'numeric';      answer: number; tolerance: number; units: string }
  | { type: 'essay';        wordLimit: number; rubric: RubricCriterion[] }
  | { type: 'fill-blank';   stemTemplate: string; blanks: FillBlankSpan[] }
  | { type: 'matching';     lefts: MatchPair[]; rights: MatchRight[] }
  | { type: 'ordering';     items: OrderItem[] }
  | { type: 'hotspot';      imageUrl: string; hotspots: Hotspot[] }
  | { type: 'k-type';       statements: KTypeStatement[]; combinationKeys: { id: string; label: string; selectedIds: string[]; isCorrect: boolean }[] }

// ─── Workflow ──────────────────────────────────────────────────────────────

/** Where the user wants to commit the draft when they hit Save. */
export type SaveDestination = 'draft' | 'bank' | 'assessment' | 'review'

export type EditorState = 'draft' | 'saved'
export type Confidence = 'high' | 'low' | null

/**
 * The full draft that the editor manipulates. Owns the stem + payload + meta.
 * On save, this projects to a `Question` row (qb-types) for the QB grid plus
 * the payload is stored separately (in a real backend; for the demo we keep
 * it session-scoped).
 */
export interface QuestionDraft {
  id: string                         // stable across the editor session
  code: string                       // e.g. "USR-001" or existing QB code
  type: EditorQType
  stem: string                       // markdown-ish; for now plain text
  explanation: string                // shown after submission to students
  difficulty: QDiff
  blooms: QBlooms
  objectiveId: string | null         // course-objective tag
  folderId: string | null
  tags: string[]
  standardIds: string[]               // direct mapping to standards/competencies
  state: EditorState
  confidence: Confidence             // AI-set; faculty can override
  payload: QuestionPayload
  /** Set when the draft originated from an AI generation. */
  aiOriginated: boolean
  /** Faculty who's currently editing — for ownership badge. */
  authorPersonaId: string
}

// ─── Defaults per type ─────────────────────────────────────────────────────

let pidCounter = 0
// No Date.now() — counter-only IDs are stable across SSR + hydration.
const newPayloadId = (prefix: string) => `${prefix}-${++pidCounter}`

export function defaultPayload(type: EditorQType): QuestionPayload {
  switch (type) {
    case 'mcq':
      return {
        type: 'mcq',
        shuffle: true,
        options: [
          { id: newPayloadId('opt'), text: '', correct: true  },
          { id: newPayloadId('opt'), text: '', correct: false },
          { id: newPayloadId('opt'), text: '', correct: false },
          { id: newPayloadId('opt'), text: '', correct: false },
        ],
      }
    case 'multi-select':
      return {
        type: 'multi-select',
        shuffle: true,
        partialCredit: true,
        options: [
          { id: newPayloadId('opt'), text: '', correct: true  },
          { id: newPayloadId('opt'), text: '', correct: true  },
          { id: newPayloadId('opt'), text: '', correct: false },
          { id: newPayloadId('opt'), text: '', correct: false },
        ],
      }
    case 'true-false':
      return { type: 'true-false', correct: true }
    case 'short-answer':
      return { type: 'short-answer', acceptedAnswers: [''], caseSensitive: false }
    case 'numeric':
      return { type: 'numeric', answer: 0, tolerance: 0.01, units: '' }
    case 'essay':
      return {
        type: 'essay',
        wordLimit: 300,
        rubric: [
          { id: newPayloadId('rb'), label: 'Clarity',    weight: 25, description: 'Clear organization and writing' },
          { id: newPayloadId('rb'), label: 'Accuracy',   weight: 50, description: 'Factually correct and well-supported' },
          { id: newPayloadId('rb'), label: 'Reasoning',  weight: 25, description: 'Logical analysis and evidence' },
        ],
      }
    case 'fill-blank':
      return {
        type: 'fill-blank',
        stemTemplate: 'The mitochondrion is responsible for [[ATP]] production via [[oxidative phosphorylation]].',
        blanks: [
          { id: newPayloadId('blk'), acceptedAnswers: ['ATP'], caseSensitive: false },
          { id: newPayloadId('blk'), acceptedAnswers: ['oxidative phosphorylation'], caseSensitive: false },
        ],
      }
    case 'matching': {
      const r1 = newPayloadId('r')
      const r2 = newPayloadId('r')
      const r3 = newPayloadId('r')
      return {
        type: 'matching',
        lefts: [
          { id: newPayloadId('l'), left: '', rightId: r1 },
          { id: newPayloadId('l'), left: '', rightId: r2 },
          { id: newPayloadId('l'), left: '', rightId: r3 },
        ],
        rights: [
          { id: r1, text: '' },
          { id: r2, text: '' },
          { id: r3, text: '' },
        ],
      }
    }
    case 'ordering':
      return {
        type: 'ordering',
        items: [
          { id: newPayloadId('o'), text: '', canonicalIdx: 0 },
          { id: newPayloadId('o'), text: '', canonicalIdx: 1 },
          { id: newPayloadId('o'), text: '', canonicalIdx: 2 },
          { id: newPayloadId('o'), text: '', canonicalIdx: 3 },
        ],
      }
    case 'hotspot':
      return {
        type: 'hotspot',
        imageUrl: '',
        hotspots: [],
      }
    case 'k-type':
      return {
        type: 'k-type',
        statements: [
          { id: newPayloadId('ks'), text: '', correct: true },
          { id: newPayloadId('ks'), text: '', correct: false },
          { id: newPayloadId('ks'), text: '', correct: false },
          { id: newPayloadId('ks'), text: '', correct: false },
        ],
        combinationKeys: [
          { id: newPayloadId('kk'), label: 'A', selectedIds: [], isCorrect: false },
          { id: newPayloadId('kk'), label: 'B', selectedIds: [], isCorrect: false },
          { id: newPayloadId('kk'), label: 'C', selectedIds: [], isCorrect: false },
          { id: newPayloadId('kk'), label: 'D', selectedIds: [], isCorrect: false },
        ],
      }
  }
}

// ─── New draft factory ─────────────────────────────────────────────────────

export function createDraft(opts: {
  code?: string
  type?: EditorQType
  authorPersonaId: string
  folderId?: string | null
  objectiveId?: string | null
}): QuestionDraft {
  const type = opts.type ?? 'mcq'
  return {
    id: `draft-${++pidCounter}`,
    code: opts.code ?? `DRAFT-${String(pidCounter).padStart(4, '0')}`,
    type,
    stem: '',
    explanation: '',
    difficulty: 'Medium',
    blooms: 'Apply',
    objectiveId: opts.objectiveId ?? null,
    folderId: opts.folderId ?? null,
    tags: [],
    standardIds: [],
    state: 'draft',
    confidence: null,
    payload: defaultPayload(type),
    aiOriginated: false,
    authorPersonaId: opts.authorPersonaId,
  }
}

// ─── Validation ────────────────────────────────────────────────────────────

export interface DraftValidationIssue {
  field: string
  message: string
  severity: 'error' | 'warning'
}

export function validateDraft(d: QuestionDraft): DraftValidationIssue[] {
  const issues: DraftValidationIssue[] = []
  if (!d.stem.trim()) {
    issues.push({ field: 'stem', message: 'Question stem is required', severity: 'error' })
  }
  if (d.payload.type === 'mcq' || d.payload.type === 'multi-select') {
    const filled = d.payload.options.filter(o => o.text.trim().length > 0)
    if (filled.length < 2) {
      issues.push({ field: 'options', message: 'At least 2 options are required', severity: 'error' })
    }
    const correct = d.payload.options.filter(o => o.correct && o.text.trim().length > 0)
    if (correct.length === 0) {
      issues.push({ field: 'options', message: 'Mark at least one option as correct', severity: 'error' })
    }
    if (d.payload.type === 'mcq' && correct.length > 1) {
      issues.push({ field: 'options', message: 'MCQ has multiple correct — switch to Multi-select?', severity: 'warning' })
    }
    const missingRationale = correct.filter(o => !o.rationale?.trim())
    if (missingRationale.length > 0) {
      issues.push({ field: 'rationale', message: `${missingRationale.length} correct option${missingRationale.length > 1 ? 's are' : ' is'} missing a rationale`, severity: 'warning' })
    }
  }
  if (d.payload.type === 'true-false') {
    if (!d.payload.rationale?.trim()) {
      issues.push({ field: 'rationale', message: 'Add a rationale explaining why this answer is correct', severity: 'warning' })
    }
  }
  if (d.payload.type === 'short-answer') {
    if (!d.payload.acceptedAnswers.some(a => a.trim().length > 0)) {
      issues.push({ field: 'acceptedAnswers', message: 'Provide at least one accepted answer', severity: 'error' })
    }
  }
  if (d.payload.type === 'numeric') {
    if (!Number.isFinite(d.payload.answer)) {
      issues.push({ field: 'answer', message: 'Answer must be a number', severity: 'error' })
    }
  }
  if (d.payload.type === 'fill-blank') {
    if (d.payload.blanks.length === 0) {
      issues.push({ field: 'blanks', message: 'Add at least one blank using [[…]] in the stem template', severity: 'error' })
    }
  }
  if (d.payload.type === 'matching') {
    const lefts = d.payload.lefts.filter(l => l.left.trim().length > 0)
    const rights = d.payload.rights.filter(r => r.text.trim().length > 0)
    if (lefts.length < 2 || rights.length < 2) {
      issues.push({ field: 'matching', message: 'Add at least 2 pairs', severity: 'error' })
    }
  }
  if (d.payload.type === 'ordering') {
    const filled = d.payload.items.filter(i => i.text.trim().length > 0)
    if (filled.length < 2) {
      issues.push({ field: 'items', message: 'Add at least 2 items to order', severity: 'error' })
    }
  }
  if (d.payload.type === 'essay') {
    const totalWeight = d.payload.rubric.reduce((s, r) => s + r.weight, 0)
    if (totalWeight !== 100) {
      issues.push({ field: 'rubric', message: `Rubric weights total ${totalWeight}% — should sum to 100%`, severity: 'warning' })
    }
  }
  if (d.payload.type === 'hotspot' && d.payload.hotspots.length === 0) {
    issues.push({ field: 'hotspots', message: 'Mark at least one hotspot on the image', severity: 'error' })
  }
  if (!d.objectiveId) {
    issues.push({ field: 'objectiveId', message: 'Tag this question to a course objective for curricular reporting', severity: 'warning' })
  }
  return issues
}

// ─── Project to QB Question for the library grid ───────────────────────────

const TYPE_TO_QB_TYPE: Record<EditorQType, Question['type']> = {
  'mcq':          'MCQ',
  'multi-select': 'MCQ',
  'true-false':   'MCQ',
  'short-answer': 'Fill blank',
  'numeric':      'Fill blank',
  'essay':        'Fill blank',
  'fill-blank':   'Fill blank',
  'matching':     'Matching',
  'ordering':     'Ordering',
  'hotspot':      'Hotspot',
  'k-type':       'MCQ',
}

export function toQuestion(draft: QuestionDraft, opts: { folderPath: string; folder: string }): Question {
  return {
    id:           draft.id,
    code:         draft.code,
    version:      1,
    age:          'just now',
    title:        draft.stem.trim() || '(Untitled draft)',
    type:         TYPE_TO_QB_TYPE[draft.type],
    status:       draft.state === 'saved' ? 'Saved' : 'Draft',
    difficulty:   draft.difficulty,
    blooms:       draft.blooms,
    folder:       opts.folder,
    folderPath:   opts.folderPath,
    tags:         draft.tags,
    usage:        0,
    pbis:         null,
    pbisDir:      'flat',
  }
}
