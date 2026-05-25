# Marks & Grading Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add a complete marks and grading system to the assessment builder — per-question point entry via a collapsible grading tray, graded/ungraded toggle, assessment-level negative marking, bonus question designation, and point summaries on the Review step.

**Architecture:** Pure grading calculations extracted to `lib/assessment-grading.ts` for unit testability. `GradingTray` extracted to its own component file following the existing pattern (SectionsOutline, HealthPanel live in `components/assessment-builder/`). Data model additions are 4 fields on `AssessmentSettings` and 2 on `AssessmentQuestion`. All mutable state stays in the existing `activeAsmt` useState in `AssessmentBuilderClient`.

**Tech Stack:** Next.js App Router, React 18, TypeScript, Exxat DS (`@exxat/ds/packages/ui/src`), FontAwesome light icons, Vitest (to be installed) for unit tests on pure functions.

**Spec:** `admin/docs/superpowers/specs/2026-05-25-marks-grading-design.md`

---

## File Map

| File | Status | Responsibility |
|---|---|---|
| `lib/qb-types.ts` | Modify (L87–176) | Add `points`, `bonus` to `AssessmentQuestion`; add `graded`, `totalMarks`, `negativeMarking`, `negativeMarkingFraction` to `AssessmentSettings`; update `defaultAssessmentSettings()` |
| `lib/assessment-grading.ts` | **Create** | Pure grading utility functions — `computeTotalAssigned`, `computeBonusTotal`, `computeUnassignedPts`, `distributeEvenly`, `computeSectionSubtotals`, `computeNegativeDeduction` |
| `lib/__tests__/assessment-grading.test.ts` | **Create** | Unit tests for all grading utilities |
| `components/assessment-builder/step2-grading-tray.tsx` | **Create** | `GradingTray` + `QuestionTrayRow` components — tray header, scrollable question table, inline point editing, bonus toggle, bulk ops |
| `app/(app)/assessment-builder/assessment-builder-client.tsx` | Modify | Step 1 Grading section; `showGrading` state; grading handlers; derived grading values; toolbar pts toggle; `GradingTray` render; Step 3 pts summaries + unassigned banner |

---

## Task 1: Install Vitest + extend data model

**Files:**
- Modify: `lib/qb-types.ts` (L87–176)

- [ ] **Step 1: Install Vitest**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm add -D vitest
```

Add test script to `package.json` scripts object:
```json
"test": "vitest run"
```

- [ ] **Step 2: Add `points` and `bonus` to `AssessmentQuestion` (L87–90)**

Replace:
```ts
export interface AssessmentQuestion {
  questionId: string
  order: number
}
```
With:
```ts
export interface AssessmentQuestion {
  questionId: string
  order: number
  points: number   // point value for this question; 0 until explicitly set
  bonus: boolean   // bonus questions award points but don't count against totalMarks
}
```

- [ ] **Step 3: Add grading fields to `AssessmentSettings` (L110–128)**

Replace:
```ts
export interface AssessmentSettings {
  type: AssessmentType
  passwordRequired: boolean
  password: string
  randomize: boolean
  randomizeOptions: boolean
  showRationaleAfter: boolean
  openDate: string | null
  closeDate: string | null
  downloadWindowHours: number
  timezone: string
  instructionsText: string
  requireAcknowledgment: boolean
  status: AssessmentStatus
  reviewRequest: AssessmentReviewRequest | null
}
```
With:
```ts
export interface AssessmentSettings {
  type: AssessmentType
  passwordRequired: boolean
  password: string
  randomize: boolean
  randomizeOptions: boolean
  showRationaleAfter: boolean
  openDate: string | null
  closeDate: string | null
  downloadWindowHours: number
  timezone: string
  instructionsText: string
  requireAcknowledgment: boolean
  status: AssessmentStatus
  reviewRequest: AssessmentReviewRequest | null
  // Grading
  graded: boolean               // false = ungraded; only valid for Quiz / Assignment
  totalMarks: number            // default 100
  negativeMarking: boolean      // applies to MCQ only; assessment-level
  negativeMarkingFraction: number // deducted per wrong answer; default 0.25
}
```

- [ ] **Step 4: Update `defaultAssessmentSettings()` (L159–176)**

Replace the return statement to include the four new fields:
```ts
export function defaultAssessmentSettings(type: AssessmentType = 'Exam'): AssessmentSettings {
  return {
    type,
    passwordRequired: false,
    password: '',
    randomize: false,
    randomizeOptions: false,
    showRationaleAfter: true,
    openDate: null,
    closeDate: null,
    downloadWindowHours: 24,
    timezone: 'America/New_York',
    instructionsText: '',
    requireAcknowledgment: false,
    status: 'draft',
    reviewRequest: null,
    graded: true,
    totalMarks: 100,
    negativeMarking: false,
    negativeMarkingFraction: 0.25,
  }
}
```

- [ ] **Step 5: Check TypeScript errors**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -50
```

Expected: errors about `points` and `bonus` missing from `AssessmentQuestion` object literals throughout `assessment-builder-client.tsx` — those are fixed in Task 3.

- [ ] **Step 6: Commit**

```bash
git add lib/qb-types.ts package.json
git commit -m "feat(grading): extend AssessmentQuestion + AssessmentSettings types"
```

---

## Task 2: Grading utility functions + unit tests

**Files:**
- Create: `lib/assessment-grading.ts`
- Create: `lib/__tests__/assessment-grading.test.ts`

- [ ] **Step 1: Create `lib/assessment-grading.ts`**

```ts
import type { AssessmentQuestion, AssessmentSection } from './qb-types'

/** Sum of points for non-bonus questions only. Used as the "assigned" total vs totalMarks. */
export function computeTotalAssigned(questions: AssessmentQuestion[]): number {
  return questions.filter(q => !q.bonus).reduce((sum, q) => sum + q.points, 0)
}

/** Sum of points for bonus questions only. */
export function computeBonusTotal(questions: AssessmentQuestion[]): number {
  return questions.filter(q => q.bonus).reduce((sum, q) => sum + q.points, 0)
}

/** Positive = pts still unassigned. Negative = pts over budget. Zero = fully assigned. */
export function computeUnassignedPts(
  totalMarks: number,
  questions: AssessmentQuestion[],
): number {
  return totalMarks - computeTotalAssigned(questions)
}

/**
 * Distribute totalMarks evenly across non-bonus questions.
 * Remainder from floor division goes to the first non-bonus question.
 * Bonus questions are returned unchanged.
 */
export function distributeEvenly(
  questions: AssessmentQuestion[],
  totalMarks: number,
): AssessmentQuestion[] {
  const nonBonus = questions.filter(q => !q.bonus)
  const n = nonBonus.length
  if (n === 0) return questions
  const each = Math.floor(totalMarks / n)
  const remainder = totalMarks - each * n
  const nonBonusIds = new Set(nonBonus.map(q => q.questionId))
  let remainderAssigned = false
  return questions.map(q => {
    if (!nonBonusIds.has(q.questionId)) return q
    if (!remainderAssigned) {
      remainderAssigned = true
      return { ...q, points: each + remainder }
    }
    return { ...q, points: each }
  })
}

/**
 * Points-per-section map. Includes bonus questions in section subtotals
 * so faculty can see the full picture, even though bonus pts are excluded
 * from the main totalAssigned count.
 */
export function computeSectionSubtotals(
  sections: AssessmentSection[],
  questions: AssessmentQuestion[],
): Map<string, number> {
  const ptsByQId = new Map(questions.map(q => [q.questionId, q.points]))
  return new Map(
    sections.map(s => [
      s.id,
      s.questionIds.reduce((sum, qId) => sum + (ptsByQId.get(qId) ?? 0), 0),
    ]),
  )
}

/** The negative deduction amount displayed for one wrong MCQ answer. Always negative. */
export function computeNegativeDeduction(points: number, fraction: number): number {
  return -(points * fraction)
}
```

- [ ] **Step 2: Create `lib/__tests__/assessment-grading.test.ts`**

```ts
import { describe, it, expect } from 'vitest'
import {
  computeTotalAssigned,
  computeBonusTotal,
  computeUnassignedPts,
  distributeEvenly,
  computeSectionSubtotals,
  computeNegativeDeduction,
} from '../assessment-grading'
import type { AssessmentQuestion, AssessmentSection } from '../qb-types'

function q(id: string, points: number, bonus = false): AssessmentQuestion {
  return { questionId: id, order: 1, points, bonus }
}

describe('computeTotalAssigned', () => {
  it('sums non-bonus question points', () => {
    expect(computeTotalAssigned([q('a', 10), q('b', 20), q('c', 5, true)])).toBe(30)
  })
  it('returns 0 for empty list', () => {
    expect(computeTotalAssigned([])).toBe(0)
  })
  it('returns 0 when all questions are bonus', () => {
    expect(computeTotalAssigned([q('a', 10, true)])).toBe(0)
  })
})

describe('computeBonusTotal', () => {
  it('sums bonus question points only', () => {
    expect(computeBonusTotal([q('a', 10), q('b', 5, true)])).toBe(5)
  })
  it('returns 0 when no bonus questions', () => {
    expect(computeBonusTotal([q('a', 10)])).toBe(0)
  })
})

describe('computeUnassignedPts', () => {
  it('returns positive when pts are unassigned', () => {
    expect(computeUnassignedPts(100, [q('a', 40), q('b', 40)])).toBe(20)
  })
  it('returns 0 when fully assigned', () => {
    expect(computeUnassignedPts(100, [q('a', 60), q('b', 40)])).toBe(0)
  })
  it('returns negative when over budget', () => {
    expect(computeUnassignedPts(100, [q('a', 60), q('b', 50)])).toBe(-10)
  })
  it('excludes bonus from the assigned total', () => {
    expect(computeUnassignedPts(100, [q('a', 90), q('b', 5, true)])).toBe(10)
  })
})

describe('distributeEvenly', () => {
  it('distributes evenly when divisible', () => {
    const result = distributeEvenly([q('a', 0), q('b', 0)], 100)
    expect(result.find(r => r.questionId === 'a')!.points).toBe(50)
    expect(result.find(r => r.questionId === 'b')!.points).toBe(50)
  })
  it('puts remainder on first non-bonus question', () => {
    const result = distributeEvenly([q('a', 0), q('b', 0), q('c', 0)], 100)
    expect(result[0].points).toBe(34) // 33 + 1 remainder
    expect(result[1].points).toBe(33)
    expect(result[2].points).toBe(33)
  })
  it('does not touch bonus questions', () => {
    const result = distributeEvenly([q('a', 0), q('bonus', 10, true)], 100)
    expect(result.find(r => r.questionId === 'bonus')!.points).toBe(10)
    expect(result.find(r => r.questionId === 'a')!.points).toBe(100)
  })
  it('returns unchanged list when all questions are bonus', () => {
    const qs = [q('a', 10, true)]
    expect(distributeEvenly(qs, 100)).toEqual(qs)
  })
})

describe('computeSectionSubtotals', () => {
  it('sums pts for questions in each section', () => {
    const questions = [q('q1', 10), q('q2', 20), q('q3', 30)]
    const sections: AssessmentSection[] = [
      { id: 's1', title: 'A', questionIds: ['q1', 'q2'] },
      { id: 's2', title: 'B', questionIds: ['q3'] },
    ]
    const result = computeSectionSubtotals(sections, questions)
    expect(result.get('s1')).toBe(30)
    expect(result.get('s2')).toBe(30)
  })
  it('includes bonus questions in section subtotal', () => {
    const questions = [q('q1', 10), q('q2', 5, true)]
    const sections: AssessmentSection[] = [
      { id: 's1', title: 'A', questionIds: ['q1', 'q2'] },
    ]
    expect(computeSectionSubtotals(sections, questions).get('s1')).toBe(15)
  })
  it('returns 0 for empty section', () => {
    const sections: AssessmentSection[] = [{ id: 's1', title: 'A', questionIds: [] }]
    expect(computeSectionSubtotals(sections, []).get('s1')).toBe(0)
  })
})

describe('computeNegativeDeduction', () => {
  it('returns negative fraction of points', () => {
    expect(computeNegativeDeduction(10, 0.25)).toBe(-2.5)
  })
  it('returns 0 for zero points', () => {
    expect(computeNegativeDeduction(0, 0.25)).toBe(0)
  })
})
```

- [ ] **Step 3: Run tests — expect all to pass**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test
```

Expected output: `✓ lib/__tests__/assessment-grading.test.ts (17 tests)` — all green.

- [ ] **Step 4: Commit**

```bash
git add lib/assessment-grading.ts lib/__tests__/assessment-grading.test.ts
git commit -m "feat(grading): grading utility functions + unit tests"
```

---

## Task 3: Fix type errors + add derived values and handlers to builder

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `points: 0, bonus: false` to every `AssessmentQuestion` literal**

Search for `{ questionId` in `assessment-builder-client.tsx`. There are several places where `AssessmentQuestion` objects are constructed. Add `points: 0, bonus: false` to each:

**`openAssessment()` (~L186):**
```ts
questions: [],  // no change needed — array is empty
```

**`createAssessment()` (~L206):**
```ts
questions: [],  // no change needed — array is empty
```

**`toggleQuestion()` — the add branch (~L232):**
```ts
// Before:
{ questionId, order: prev.questions.length + 1 }
// After:
{ questionId, order: prev.questions.length + 1, points: 0, bonus: false }
```

**`createQuestion()` — the returned `AssessmentQuestion` push (~L290):**
The function returns a `Question`, not an `AssessmentQuestion`. The line that pushes into `activeAsmt.questions` is:
```ts
// Before:
{ questionId: q.id, order: prev.questions.length + 1 }
// After:
{ questionId: q.id, order: prev.questions.length + 1, points: 0, bonus: false }
```

**Copy mode `useEffect` (~L129):**
```ts
// Before:
.map((q, i): AssessmentQuestion => ({ questionId: q.id, order: i + 1 }))
// After:
.map((q, i): AssessmentQuestion => ({ questionId: q.id, order: i + 1, points: 0, bonus: false }))
```

- [ ] **Step 2: Add import for grading utilities at top of file**

After the existing imports block, add:
```ts
import {
  computeTotalAssigned,
  computeBonusTotal,
  computeUnassignedPts,
  distributeEvenly as distributeEvenlyUtil,
  computeSectionSubtotals,
} from '@/lib/assessment-grading'
```

- [ ] **Step 3: Add `showGrading` state**

After the existing `const [showHealth, setShowHealth] = useState(false)` line (~L346), add:
```ts
const [showGrading, setShowGrading] = useState(false)
```

- [ ] **Step 4: Add derived grading values**

After the existing `overtimeMetrics` useMemo block (~L341), add:
```ts
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
```

- [ ] **Step 5: Add grading handlers**

After `removeQuestion()` (~L399), add:
```ts
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
```

- [ ] **Step 6: Verify TypeScript is clean**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -40
```

Expected: 0 errors.

- [ ] **Step 7: Commit**

```bash
git add app/(app)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(grading): fix AssessmentQuestion literals + derived values + handlers"
```

---

## Task 4: Step 1 — Grading section in DetailsStep

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` — `DetailsStep` component (~L2287–2846)

- [ ] **Step 1: Add Grading section to right column of DetailsStep**

In `DetailsStep`, find the closing `</div>` of the Delivery settings section (the one containing the randomize toggles and pre-exam instructions, ending ~L2830), right before the outer right-column closing `</div>`. Add a `<Separator />` then the Grading section:

```tsx
<Separator />

{/* Grading */}
<div className="flex flex-col gap-4">
  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">Grading</p>

  {/* Graded / Ungraded */}
  <div className="flex flex-col gap-1.5">
    <p className="text-xs text-muted-foreground">Weightage</p>
    <div className="flex gap-2" role="radiogroup" aria-label="Assessment weightage">
      {(['Graded', 'Ungraded'] as const).map(option => {
        const wantsUngraded = option === 'Ungraded'
        const isDisabled = wantsUngraded && settings.type === 'Exam'
        const isActive = wantsUngraded ? !settings.graded : settings.graded
        return (
          <Button
            key={option}
            variant="ghost"
            size="sm"
            onClick={() => { if (!isDisabled) patchSettings({ graded: !wantsUngraded }) }}
            aria-pressed={isActive}
            disabled={isDisabled}
            title={isDisabled ? 'Ungraded is only available for Quiz and Assignment' : undefined}
            className="flex-1 text-xs font-semibold"
            style={{
              border: `1px solid ${isActive ? 'var(--brand-color)' : 'var(--border)'}`,
              background: isActive ? 'var(--muted)' : 'transparent',
            }}
          >
            {option}
          </Button>
        )
      })}
    </div>
  </div>

  {/* Total marks — only when graded */}
  {settings.graded && (
    <div className="flex flex-col gap-1.5">
      <p className="text-xs text-muted-foreground">Total marks</p>
      <div className="flex items-center gap-2">
        <Input
          type="number"
          min={1}
          step={1}
          aria-label="Total marks"
          value={settings.totalMarks}
          onChange={e => {
            const v = parseInt(e.target.value)
            if (!isNaN(v) && v >= 1) patchSettings({ totalMarks: v })
          }}
          style={{ width: 80, height: 36, padding: '0 10px', fontSize: 14, textAlign: 'center' }}
        />
        <span className="text-sm text-muted-foreground">pts</span>
      </div>
    </div>
  )}

  {/* Negative marking — only when graded */}
  {settings.graded && (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-2">
        <Checkbox
          id="negative-marking-toggle"
          checked={settings.negativeMarking}
          onCheckedChange={v => patchSettings({ negativeMarking: Boolean(v) })}
        />
        <label
          htmlFor="negative-marking-toggle"
          className="text-sm font-medium text-foreground cursor-pointer select-none"
        >
          Enable negative marking
        </label>
      </div>
      {settings.negativeMarking && (
        <div className="flex items-center gap-2 ps-6">
          <span className="text-xs text-muted-foreground">Deduct</span>
          <Input
            type="number"
            min={0.01}
            max={1}
            step={0.05}
            aria-label="Negative marking fraction per wrong answer"
            value={settings.negativeMarkingFraction}
            onChange={e => {
              const v = parseFloat(e.target.value)
              if (!isNaN(v) && v > 0 && v <= 1) patchSettings({ negativeMarkingFraction: v })
            }}
            style={{ width: 64, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center' }}
          />
          <span className="text-xs text-muted-foreground">pts per wrong answer</span>
        </div>
      )}
    </div>
  )}
</div>
```

- [ ] **Step 2: Verify in browser**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm dev
```

Open `http://localhost:3001/assessment-builder`. Proceed to Step 1 and scroll to bottom of right column. Confirm:
- Grading section renders below Delivery settings
- "Ungraded" is disabled when type = Exam; enabled for Quiz
- Total marks input accepts positive integers
- Negative marking checkbox shows/hides fraction input

- [ ] **Step 3: Commit**

```bash
git add app/(app)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(grading): Step 1 — graded toggle, total marks, negative marking"
```

---

## Task 5: Create GradingTray component

**Files:**
- Create: `components/assessment-builder/step2-grading-tray.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

import { useState, useRef } from 'react'
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

// ─── Props ────────────────────────────────────────────────────────────────────

interface GradingTrayProps {
  activeAsmt: AssessmentDraft
  onUpdatePoints: (questionId: string, points: number) => void
  onUpdateBonus: (questionId: string, bonus: boolean) => void
  onDistributeEvenly: () => void
  onBulkSetPoints: (questionIds: string[], points: number) => void
}

// ─── Display row types ────────────────────────────────────────────────────────

type DisplayRow =
  | { kind: 'section'; id: string; title: string; subtotal: number; isOver: boolean }
  | { kind: 'question'; aq: AssessmentQuestion; meta: Question | undefined; order: number }

// ─── GradingTray ──────────────────────────────────────────────────────────────

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

  // Fair share per section (non-bonus questions only, proportional)
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

  // Build display rows
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

  // Unassigned questions (no section, or no sections at all)
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

  // Select all
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
                <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-[0.06em]">
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

// ─── QuestionTrayRow ──────────────────────────────────────────────────────────

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
```

- [ ] **Step 2: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 3: Commit**

```bash
git add components/assessment-builder/step2-grading-tray.tsx
git commit -m "feat(grading): GradingTray component — inline editing, bonus, bulk ops"
```

---

## Task 6: Wire GradingTray into Step 2

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add GradingTray import**

At the top of `assessment-builder-client.tsx`, alongside the other `assessment-builder` component imports:
```ts
import { GradingTray } from '@/components/assessment-builder/step2-grading-tray'
```

- [ ] **Step 2: Add pts toggle button to toolbar**

Find the health toggle toolbar div (~L539). After the existing health button, add:
```tsx
{activeAsmt?.settings.graded && (
  <Button
    variant={showGrading ? 'secondary' : 'ghost'}
    size="sm"
    onClick={() => setShowGrading(g => !g)}
    aria-label={showGrading ? 'Hide grading tray' : 'Show grading tray'}
    aria-pressed={showGrading}
    className="h-7 gap-1.5 px-2"
  >
    <i className="fa-light fa-scale-balanced" aria-hidden="true" />
    <span className="text-xs">pts</span>
  </Button>
)}
```

- [ ] **Step 3: Render GradingTray in Step 2 center column**

In the Step 2 center column (`activeStep === 2 && activeAsmt`), find the Step 2 navigation footer div (~L573). Immediately before it, add:
```tsx
{/* Grading tray */}
{showGrading && activeAsmt.settings.graded && (
  <GradingTray
    activeAsmt={activeAsmt}
    onUpdatePoints={updateQuestionPoints}
    onUpdateBonus={updateQuestionBonus}
    onDistributeEvenly={handleDistributeEvenly}
    onBulkSetPoints={bulkSetPoints}
  />
)}
```

- [ ] **Step 4: Verify in browser**

Start dev server if not running: `pnpm dev`. Navigate to `/assessment-builder`, go to Step 1, set type to Exam (Graded default). Advance to Step 2 and add 3–4 questions. Then:

- "pts" toggle appears in toolbar — click it → tray renders below picker
- Click a points cell → inline input appears; type a number → Tab commits, moves to next row
- Star button toggles bonus (filled star + `var(--brand-color)`)
- Negative marking: enable it in Step 1, return to Step 2 → "Neg" column appears with deduction values
- Select 2 rows → set bulk to 10 → Apply → both rows update
- "Distribute evenly" sets all non-bonus questions to equal points

- [ ] **Step 5: Commit**

```bash
git add app/(app)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(grading): wire GradingTray into Step 2 toolbar"
```

---

## Task 7: Step 3 — Review step point summaries

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` — `ReviewStep` component and its call site

- [ ] **Step 1: Extend ReviewStep props signature**

Find `function ReviewStep({` (~L1618) and add to its props destructuring and interface:
```tsx
function ReviewStep({
  activeAsmt,
  courseLabel,
  distribution,
  bloomsMetrics,
  timeMetrics,
  totalAssigned,   // NEW
  bonusTotal,      // NEW
  unassignedPts,   // NEW
  sectionSubtotals, // NEW
  onBack,
  onSaveAsDraft,
  onSendToChair,
  onPublish,
  onOpenGradingTray, // NEW
}: {
  activeAsmt: AssessmentDraft
  courseLabel: string
  distribution: { Easy: number; Medium: number; Hard: number }
  bloomsMetrics: { level: string; count: number; pct: number }[]
  timeMetrics: { totalMin: number; avgMin: number }
  totalAssigned: number       // NEW
  bonusTotal: number          // NEW
  unassignedPts: number       // NEW
  sectionSubtotals: Map<string, number>  // NEW
  onBack: () => void
  onSaveAsDraft: () => void
  onSendToChair: () => void
  onPublish: () => void
  onOpenGradingTray: () => void  // NEW
})
```

- [ ] **Step 2: Add unassigned-pts warning banner**

At the very top of ReviewStep's scrollable content div (before the health banner), add:
```tsx
{activeAsmt.settings.graded && unassignedPts !== 0 && (
  <LocalBanner variant="warning">
    <span>
      {Math.abs(unassignedPts)} pts {unassignedPts > 0 ? 'unassigned' : 'over budget'} — question point values don&apos;t add up to {activeAsmt.settings.totalMarks} pts.{' '}
      <button
        type="button"
        onClick={() => { onBack(); onOpenGradingTray() }}
        className="underline font-semibold"
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'inherit', padding: 0 }}
      >
        Fix in Build →
      </button>
    </span>
  </LocalBanner>
)}
```

- [ ] **Step 3: Add Total column to Summary stats grid**

Find the stats grid in ReviewStep (~L1726). Replace the `grid-cols-2 sm:grid-cols-4` className with `grid-cols-2 sm:grid-cols-5` and add Total to the array:
```tsx
<div className="grid grid-cols-2 sm:grid-cols-5 gap-4 pt-2">
  {[
    { label: 'Questions', value: String(totalQ) },
    { label: 'Duration',  value: `${activeAsmt.durationMinutes} min` },
    { label: 'Password',  value: s.passwordRequired ? 'Required' : 'None' },
    { label: 'Randomize', value: s.randomize ? 'On' : 'Off' },
    s.graded
      ? { label: 'Total', value: bonusTotal > 0 ? `${s.totalMarks} pts +${bonusTotal} bonus` : `${s.totalMarks} pts` }
      : { label: 'Total', value: 'Ungraded' },
  ].map(({ label, value }) => (
    <div key={label}>
      <p className="text-[10px] font-bold uppercase tracking-[0.08em] text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground mt-0.5">{value}</p>
    </div>
  ))}
</div>
```

- [ ] **Step 4: Add pts to Difficulty distribution card**

Find the difficulty bars section (~L1745). Replace the bar render with:
```tsx
{bars.map(bar => {
  const barPts = activeAsmt.questions
    .filter(q => {
      const m = MOCK_QB_QUESTIONS.find(mq => mq.id === q.questionId)
      return m?.difficulty === bar.label && !q.bonus
    })
    .reduce((sum, q) => sum + q.points, 0)
  const pct = s.totalMarks > 0 ? Math.round((barPts / s.totalMarks) * 100) : 0

  return (
    <div key={bar.label} className="flex items-center gap-2 flex-wrap">
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
          {barPts} pts ({pct}%)
        </span>
      )}
    </div>
  )
})}
```

- [ ] **Step 5: Add pts column to Sections card**

Find the sections list (~L1773). Replace each section row with:
```tsx
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
```

- [ ] **Step 6: Pass new props to ReviewStep at the call site**

Find where `<ReviewStep` is rendered (~L617) and add the new props:
```tsx
<ReviewStep
  activeAsmt={activeAsmt}
  courseLabel={courseLabel}
  distribution={distribution}
  bloomsMetrics={bloomsMetrics}
  timeMetrics={timeMetrics}
  totalAssigned={totalAssigned}
  bonusTotal={bonusTotal}
  unassignedPts={unassignedPts}
  sectionSubtotals={sectionSubtotals}
  onBack={() => setActiveStep(2)}
  onSaveAsDraft={handleSaveDraft}
  onSendToChair={handleSendToChair}
  onPublish={handlePublish}
  onOpenGradingTray={() => { setActiveStep(2); setShowGrading(true) }}
/>
```

- [ ] **Step 7: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors.

- [ ] **Step 8: Verify in browser — Step 3**

Add 3 questions in Step 2, set point values in the tray, proceed to Step 3. Confirm:
- Summary card shows "Total: 100 pts" (or "Ungraded" if switched)
- Difficulty breakdown shows pts + percentage per difficulty
- Sections card shows pts per section
- If sum ≠ totalMarks: warning banner appears, "Fix in Build →" navigates back to Step 2 with tray open
- Bonus questions: Summary shows "+ N bonus" suffix

- [ ] **Step 9: Run tests one final time**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test
```

Expected: all 17 tests pass.

- [ ] **Step 10: Commit**

```bash
git add app/(app)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(grading): Step 3 Review — pts summary, difficulty breakdown, unassigned banner"
```
