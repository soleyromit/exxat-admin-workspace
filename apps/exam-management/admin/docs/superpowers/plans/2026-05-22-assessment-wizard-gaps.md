# Assessment Wizard — All Gaps Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development to implement this plan task-by-task. Tasks 2–7 are PARALLEL after Task 1 completes. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Design and integrate all 21 transcript-verified gaps into the assessment creation wizard, live monitor, and question editor — producing a complete, accessible end-to-end faculty workflow.

**Architecture:** Task 1 extends the type system and mock data. Tasks 2–6 are independent components that each modify one layer of the wizard (Step 1, Step 2, Step 3, question editor, new flows). Task 7 updates the existing live monitor. All components use Exxat DS tokens only — no hardcoded hex, no raw `<button>`, no toast. Nav collapses during wizard to give full-width whitespace.

**Tech Stack:** Next.js 15 App Router, `'use client'`, Exxat DS (`@exxat/ds/packages/ui/src`), Font Awesome Pro light icons, `var(--token)` for all color, `color-mix(in oklch, ...)` for tints.

**DS Import:** `import { Button, Badge, Input, ... } from '@exxat/ds/packages/ui/src'`

**Key files:**
- `lib/qb-types.ts` — type definitions (Task 1)
- `lib/qb-mock-data.ts` — mock data (Task 1)
- `lib/question-editor-types.ts` — K-type (Task 5)
- `app/(app)/assessment-builder/assessment-builder-client.tsx` — wizard shell + Step 1 + Step 3
- `components/assessment-builder/step2-sections-outline.tsx` — NEW (Task 3)
- `components/assessment-builder/step2-health-panel.tsx` — NEW (Task 3)
- `components/assessment-builder/step2-inline-editor.tsx` — NEW (Task 3)
- `components/import-assessment-modal.tsx` — NEW (Task 6)
- `app/(app)/assessments/[id]/monitor/live-monitor-client.tsx` — update (Task 7)

---

## UX NORTH STAR (read before implementing anything)

From raw transcripts:

**Aarti (May 19):** *"Create an assessment will have these four options to pick from. And then each track has its own workflow. If I'm copying from an existing question, maybe there is a completely different type of workflow — you are giving me okay, all these questions are copied, but there is a UX screen that highlights the point-biserial score. And if there is a poorly-rated question, maybe there is a highlight that says you have copied this question, but this question did not have a good rating. Do you want to modify it or edit it or select a different question? And review page brings up the important metric so that they can see the overall health of that assessment."*

**Vishaka (May 14):** *"We should allow the course coordinator to create sections — bare minimum. A free text to describe what that section is about."* Sections serve two use cases: (1) multi-faculty where each faculty owns a section, (2) case-study preread where one paragraph precedes a set of questions.

**Vishaka (May 19):** *"Anywhere in the product, you are not going to have faculty stop their work to go do something somewhere else. You'll have links and options to update it there and then."* → inline question editing mandatory.

**Aarti (May 7):** *"I don't want assessment workflow to be the primary concern. Workflow is something ExamSoft doesn't have. We'll build it as a secondary feature. If they want to administer it and it has not been approved, you let them administer it. But you say 'just so you know this is still pending approval'."* → soft gate, never hard block.

**Accessibility (May 21):** 200% magnification, high contrast, dyslexic font support. All interactive elements ≥44px. No info by color alone. Keyboard navigable.

---

## SCREEN DESIGNS

### Entry Modal — 4 Modes

```
╔══════════════════════════════════════════════════════════╗
║  Create assessment                                   [×] ║
╠══════════════════════════════════════════════════════════╣
║                                                          ║
║  ┌─────────────────┐  ┌─────────────────┐               ║
║  │ ○  Start blank  │  │ ○  From QB      │               ║
║  │                 │  │                 │               ║
║  │  Clean slate.   │  │  Open the QB    │               ║
║  │  Set up name,   │  │  browser first, │               ║
║  │  type, sections │  │  pick questions,│               ║
║  │  first.         │  │  details later. │               ║
║  └─────────────────┘  └─────────────────┘               ║
║                                                          ║
║  ┌─────────────────┐  ┌─────────────────┐               ║
║  │ ○  Copy prev.   │  │ ○  Import PDF   │               ║
║  │                 │  │                 │               ║
║  │  Copy structure │  │  Upload a paper │               ║
║  │  + questions    │  │  exam. We match │               ║
║  │  from a prior   │  │  to your QB     │               ║
║  │  term's exam.   │  │  automatically. │               ║
║  └─────────────────┘  └─────────────────┘               ║
║                                                          ║
║                          [Cancel]  [Continue →]         ║
╚══════════════════════════════════════════════════════════╝
```

**Copy mode → source picker (step 2 of modal):**
```
╔══════════════════════════════════════════════════════════╗
║  Copy from previous — PHAR101                        [×] ║
╠══════════════════════════════════════════════════════════╣
║  ┌──────────────────────────────────────────────────┐   ║
║  │ ● Midterm 1 — Spring 2025      42 Q  90 min      │   ║
║  │   ⚠ 3 questions have low point-biserial (<0.15)  │   ║
║  ├──────────────────────────────────────────────────┤   ║
║  │ ○ Final Exam — Spring 2025     58 Q  150 min     │   ║
║  │   ✓ All questions healthy                        │   ║
║  └──────────────────────────────────────────────────┘   ║
║                                                          ║
║  ⚠ Poor point-biserial questions will be flagged in     ║
║    Step 2 so you can swap or edit them.                  ║
║                                                          ║
║                   [← Back]  [Copy Midterm 1 →]          ║
╚══════════════════════════════════════════════════════════╝
```

---

### Step 1 — Setup (collapsed nav, full-width)

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰]  PHAR101 · Fall 2025  ›  New assessment          Step 1 of 3  [×]   │
│      ①Setup  ──────────────  ②Build  ──────────────  ③Review            │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌─────────────────────────────────┐  ┌───────────────────────────────┐ │
│  │  IDENTITY                       │  │  SECTIONS                     │ │
│  │                                 │  │                               │ │
│  │  Assessment name *              │  │  Faculty or topic sections    │ │
│  │  [Midterm Exam 1              ] │  │  let you divide questions by  │ │
│  │                                 │  │  contributor or preread.      │ │
│  │  Type                           │  │                               │ │
│  │  [Exam][Quiz][Pop Quiz][Assign] │  │  ┌──────────────────────────┐ │ │
│  │  ●     ○     ○        ○        │  │  │ Dr. Mehra's Section   [×] │ │ │
│  │                                 │  │  │ Dr. Purani's Section  [×] │ │ │
│  │  Duration                       │  │  └──────────────────────────┘ │ │
│  │  [90] minutes                   │  │  [+ Add section]              │ │
│  │                                 │  │                               │ │
│  │  Description (optional)         │  │  DELIVERY                     │ │
│  │  [                           ] │  │                               │ │
│  │  [                           ] │  │  Opens                        │ │
│  │                                 │  │  [May 28, 2026  ][9:00 AM  ] │ │
│  │                                 │  │                               │ │
│  │                                 │  │  Closes                       │ │
│  │                                 │  │  [May 28, 2026  ][10:30 AM ] │ │
│  │                                 │  │                               │ │
│  │                                 │  │  Download window              │ │
│  │                                 │  │  Students can pre-download    │ │
│  │                                 │  │  [24] hours before exam start │ │
│  │                                 │  │                               │ │
│  │                                 │  │  Password                     │ │
│  │                                 │  │  [──────────────────────────] │ │
│  │                                 │  │                               │ │
│  │                                 │  │  ── ── Randomize questions    │ │
│  │                                 │  │  ── ── Randomize options      │ │
│  │                                 │  │                               │ │
│  │                                 │  │  Pre-exam instructions        │ │
│  │                                 │  │  [                          ] │ │
│  │                                 │  │  ── ── Require acknowledgment │ │
│  └─────────────────────────────────┘  └───────────────────────────────┘ │
│                                                                          │
│  [Cancel]                                        [Continue to Build →]  │
└──────────────────────────────────────────────────────────────────────────┘
```

**Pop Quiz variant — delivery section collapses to:**
```
│  DELIVERY                                                                │
│  ──────────────────────────────────────────────────────────────────────  │
│  ℹ  Pop quizzes are started live in class — no scheduling needed.        │
│     Duration: [15] minutes · Password: [──────────]                      │
```

**State logic:**
- Sections created here persist as keys. Step 2 outline shows them as groups.
- "Add section" → inline input appears, Enter to confirm, Escape to cancel.
- Section title max 60 chars.
- Scheduling fields hidden for Pop Quiz.
- Download window only shown when type = Exam.
- "Continue" disabled if name is empty.

---

### Step 2 — Build (3-panel, collapsed nav)

```
┌──────────────────────────────────────────────────────────────────────────────────┐
│ [☰]  Midterm Exam 1  ·  42 questions         Step 2 of 3   [⚙ Settings] [Save] │
│      ①Setup  ──────────────  ②Build ●  ────────────  ③Review                   │
├────────────────────┬──────────────────────────────┬──────────────────────────────┤
│  OUTLINE    240px  │  QB BROWSER          flex    │  HEALTH             280px   │
│                    │                              │                              │
│  Dr. Mehra (10/10) │  [This course QB][Other][+Q] │  ● Good                      │
│  ├ Q001 ···· MCQ ✓ │  [AI gap fill]               │  42 of 50 questions          │
│  ├ Q002 ···· MCQ ✓ │                              │                              │
│  ├ Q003 ···· MCQ ⚠ │  Filter: [All ▾] [Diff ▾].. │  Estimated time              │
│  └ Q004 ···· MCQ ✓ │                              │  87 min vs 90 min config     │
│                    │  ┌────────────────────────┐  │  ████████████░░  97%         │
│  Dr. Purani (8/10) │  │ ● Q045  MCQ  Medium    │  │                              │
│  ├ Q010 ···· MCQ ✓ │  │ Describe ADME princip… │  │  Difficulty mix              │
│  ├ Q011 ···· MCQ ✓ │  │ Blooms: Understand     │  │  Easy   ████░░  12           │
│                    │  │ pbis: 0.41 ↑  Used: 3x │  │  Medium ████████  28         │
│  Unassigned (4)    │  │        [Use ▾][Edit]   │  │  Hard   ████  8              │
│  ├ Q020 ···· MCQ ✓ │  ├────────────────────────┤  │                              │
│  ├ Q021 ···· TF  ✓ │  │ ○ Q046  MCQ  Hard  ⚠  │  │  Bloom's                     │
│  ├ Q022 ···· MCQ ⚠ │  │ Evaluate adverse-eve…  │  │  Remember ██  4              │
│  │                 │  │ pbis: 0.09 ↓  POOR     │  │  Understand ████  14         │
│  [+ Unassigned]    │  │ ⚠ Low point-biserial   │  │  Apply ████████  18          │
│                    │  │        [Use ▾][Edit]   │  │  Analyze ████  6             │
│  ─────────────     │  ├────────────────────────┤  │                              │
│  ⚠ 3 missing       │  │ ○ Q047  MCQ  Easy      │  │  Topic coverage              │
│     rationale      │  │ ...                    │  │  Pharmacokinetics  ✓         │
│                    │  └────────────────────────┘  │  Drug interactions ✓         │
│                    │                              │  Adverse events    ✓         │
│                    │                              │  Black-box warnings ✗        │
│                    │                              │                              │
│                    │                              │  ── Flags                    │
│                    │                              │  ⚠ 3 missing rationale       │
│                    │                              │  ⚠ 2 poor point-biserial     │
└────────────────────┴──────────────────────────────┴──────────────────────────────┘
                                                    [← Back to Setup]  [Review →]
```

**"Use ▾" dropdown on each QB question:**
```
┌────────────────────┐
│ Add to section:    │
│  · Dr. Mehra's     │
│  · Dr. Purani's    │
│  · Unassigned      │
├────────────────────┤
│ Copy & modify      │
└────────────────────┘
```

**Inline editor (expands below a question row in the outline):**
```
│  ├ Q003 ···· MCQ ⚠  [editing]                                              │
│  │  ┌───────────────────────────────────────────────────────────────────┐  │
│  │  │ Stem                                                               │  │
│  │  │ [A 67-year-old patient is being evaluated for amino...           ] │  │
│  │  │                                                                   │  │
│  │  │ Options         ✓ = correct                                       │  │
│  │  │ [A] Renal function only                        ○ ✓               │  │
│  │  │ [B] Body surface area only                     ○                 │  │
│  │  │ [C] Time of day                                ○                 │  │
│  │  │ [D] Patient handedness                         ○                 │  │
│  │  │                                                                   │  │
│  │  │ Rationale *                                                       │  │
│  │  │ [Aminoglycoside dosing is adjusted primarily...                  ]│  │
│  │  │                                                                   │  │
│  │  │                          [Cancel]  [Save to QB]                  │  │
│  │  └───────────────────────────────────────────────────────────────────┘  │
```

**⚠ indicators:**
- `⚠` in outline = missing rationale
- `⚠ POOR` on QB row = pbis < 0.15 (amber dot, label "Low point-biserial")
- Copy-mode: poorly-rated copied questions pre-flagged in outline on arrival

---

### Step 3 — Review & Schedule

```
┌──────────────────────────────────────────────────────────────────────────┐
│ [☰]  Midterm Exam 1  ·  PHAR101 Fall 2025    Step 3 of 3   [Save draft] │
│      ①Setup  ──────────────  ②Build  ────────────── ③Review ●           │
├──────────────────────────────────────────────────────────────────────────┤
│                                                                          │
│  ┌── Assessment health ─────────────────────────────────────────────┐   │
│  │  ● Ready to publish                                               │   │
│  │  42 questions · 87 min est. vs 90 min · 3 missing rationale ⚠   │   │
│  │  ⚠ 3 questions missing rationale — [Fix in Build →]              │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Summary                                                                 │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Midterm Exam 1                              [Exam]              │   │
│  │  PHAR101 · Pharmacology I · Fall 2025                            │   │
│  │  42 questions · 90 min · Password required · Randomized          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Sections                                                                │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  Dr. Mehra's Section         10 questions                        │   │
│  │  Dr. Purani's Section        8 questions                         │   │
│  │  Unassigned                  4 questions  ⚠ 3 missing rationale │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Schedule                          Approval status                       │
│  ┌────────────────────────────┐    ┌───────────────────────────────┐    │
│  │  Opens                     │    │  ○ Draft                      │    │
│  │  May 28, 2026  9:00 AM EDT │    │                               │    │
│  │                            │    │  Send this assessment to a    │    │
│  │  Closes                    │    │  chair or senior faculty for  │    │
│  │  May 28, 2026  10:30 AM EDT│    │  review before publishing.    │    │
│  │                            │    │                               │    │
│  │  Download window           │    │  [Send for review]            │    │
│  │  Students can pre-download │    │                               │    │
│  │  from May 27, 9:00 AM      │    │  ── or ──                     │    │
│  └────────────────────────────┘    │                               │    │
│                                    │  [Publish without review]     │    │
│  Pre-exam instructions preview     │  (soft warning shown)         │    │
│  ▸ Students will see these before  └───────────────────────────────┘    │
│    starting [Show preview]                                               │
│                                                                          │
│  [← Back to Build]                             [Save draft]             │
└──────────────────────────────────────────────────────────────────────────┘
```

**Send for review sheet:**
```
╔══════════════════════════════════════════════╗
║  Send for review                         [×] ║
╠══════════════════════════════════════════════╣
║  Reviewer                                    ║
║  [Search faculty...          ▾]              ║
║  Selected: Dr. Sarah Chen                    ║
║                                              ║
║  Due date (optional)                         ║
║  [Jun 1, 2026                ]               ║
║                                              ║
║  Message (optional)                          ║
║  [Please review rigor level  ]               ║
║  [for the hard questions in  ]               ║
║  [section 2.                 ]               ║
║                                              ║
║  ℹ You can still publish without approval.  ║
║                                              ║
║           [Cancel]  [Send for review]        ║
╚══════════════════════════════════════════════╝
```

**Publish without review → inline warning:**
```
│  ⚠ This assessment hasn't been reviewed.          │
│  Most programs get chair approval before           │
│  high-stakes exams. You can still publish.         │
│                                   [Publish anyway] │
```

---

### Live Monitor — Flagged Questions Panel

Already has: student buckets, broadcast, pause. Add:
```
│  FLAGGED QUESTIONS (3)                               │
│  ┌───────────────────────────────────────────────┐  │
│  │  Q12 — "Options C and D look identical"       │  │
│  │  Flagged by 3 students                        │  │
│  │  [Acknowledge]  [Dismiss]                     │  │
│  ├───────────────────────────────────────────────┤  │
│  │  Q27 — "Question is missing context"          │  │
│  │  Flagged by 1 student                         │  │
│  │  [Acknowledge]  [Dismiss]                     │  │
│  └───────────────────────────────────────────────┘  │
```

---

## TASK 1: Type System + Mock Data Foundation

**Files:**
- Modify: `lib/qb-types.ts`
- Modify: `lib/qb-mock-data.ts`

- [ ] **Step 1: Extend types in `lib/qb-types.ts`**

Replace the existing `AssessmentType`, `AssessmentSettings`, `AssessmentSection`, `AssessmentDraft` with:

```ts
export type AssessmentType = 'Exam' | 'Quiz' | 'Pop Quiz' | 'Assignment'

export type AssessmentStatus =
  | 'draft'
  | 'pending-review'
  | 'changes-requested'
  | 'approved'
  | 'scheduled'
  | 'live'
  | 'completed'

export interface AssessmentReviewRequest {
  reviewerId: string    // persona ID
  message: string
  dueDate: string | null  // ISO date string
  sentAt: string          // ISO timestamp
}

export interface AssessmentSettings {
  type: AssessmentType
  passwordRequired: boolean
  password: string
  randomize: boolean
  randomizeOptions: boolean      // NEW: randomize option order within each question
  showRationaleAfter: boolean
  // Scheduling
  openDate: string | null        // ISO datetime
  closeDate: string | null       // ISO datetime
  downloadWindowHours: number    // hours before openDate students can pre-download
  timezone: string               // e.g. "America/New_York"
  // Pre-exam
  instructionsText: string
  requireAcknowledgment: boolean
  // Workflow
  status: AssessmentStatus
  reviewRequest: AssessmentReviewRequest | null
}

export interface AssessmentSection {
  id: string
  title: string
  facultyId?: string
  prereadText?: string            // NEW: case-study preread block
  questionIds: string[]
}

export type QuestionHealthFlag =
  | { type: 'missing-rationale'; questionId: string }
  | { type: 'poor-pbis'; questionId: string; pbis: number }

export interface AssessmentDraft {
  id: string
  title: string
  courseId: string
  offeringId: string
  questions: AssessmentQuestion[]
  durationMinutes: number
  sections: AssessmentSection[]
  settings: AssessmentSettings
  healthFlags: QuestionHealthFlag[]   // NEW: computed flags surfaced in Step 2 + Step 3
}

/** Convenience factory for default settings */
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
  }
}
```

- [ ] **Step 2: Add mock assessment data with health flags to `lib/qb-mock-data.ts`**

Find the existing `mockAssessments` array and extend it. Add a helper `mockAssessmentHealthFlags` record:

```ts
// In qb-mock-data.ts, after existing mockAssessments:

export const MOCK_POOR_PBIS_QUESTION_IDS = new Set([
  // Seeded IDs that simulate questions with low point-biserial
  'phar101-q006', 'phar101-q014', 'biol201-q003',
])

export const MOCK_MISSING_RATIONALE_QUESTION_IDS = new Set([
  'phar101-q008', 'phar101-q012', 'phar101-q019',
])

/** Returns health flags for a given set of selected question IDs */
export function computeHealthFlags(questionIds: string[]): import('./qb-types').QuestionHealthFlag[] {
  const flags: import('./qb-types').QuestionHealthFlag[] = []
  for (const qId of questionIds) {
    if (MOCK_MISSING_RATIONALE_QUESTION_IDS.has(qId)) {
      flags.push({ type: 'missing-rationale', questionId: qId })
    }
    if (MOCK_POOR_PBIS_QUESTION_IDS.has(qId)) {
      const q = MOCK_QB_QUESTIONS.find(q => q.id === qId)
      flags.push({ type: 'poor-pbis', questionId: qId, pbis: q?.pbis ?? 0.08 })
    }
  }
  return flags
}

// Mock previous-term assessments for "copy from previous" modal
// (these already exist — add pbisWarning field)
export const MOCK_COPY_SOURCES = [
  {
    id: 'asmt-004',
    courseId: 'course-phar101',
    title: 'Midterm 1 — Spring 2025',
    questionCount: 42,
    durationMinutes: 90,
    poorPbisCount: 3,    // used to show warning in copy modal
    sections: [
      { id: 'sec-sp25-1', title: "Dr. Mehra's Section", questionIds: [] },
      { id: 'sec-sp25-2', title: "Dr. Purani's Section", questionIds: [] },
    ],
  },
  {
    id: 'asmt-005',
    courseId: 'course-phar101',
    title: 'Final Exam — Spring 2025',
    questionCount: 58,
    durationMinutes: 150,
    poorPbisCount: 0,
    sections: [],
  },
]
```

- [ ] **Step 3: Commit**

```bash
git add lib/qb-types.ts lib/qb-mock-data.ts
git commit -m "feat(types): extend AssessmentDraft with sections, health flags, scheduling, randomizeOptions"
```

---

## TASK 2: Step 1 — Setup Redesign

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` (DetailsStep function, lines ~1715–1957)

**Context:** DetailsStep is the full-width Step 1. Currently has: name, course/offering selectors, type (3 options), duration, toggles. Needs: sections, pop quiz type, scheduling, download window, option randomization, instructions page.

- [ ] **Step 1: Replace `TYPES` array and type buttons**

Find in `DetailsStep` (around line 1742):
```tsx
const TYPES: import('@/lib/qb-types').AssessmentType[] = ['Exam', 'Quiz', 'Assignment']
```

Replace with:
```tsx
const TYPES: { type: import('@/lib/qb-types').AssessmentType; icon: string; description: string }[] = [
  { type: 'Exam',       icon: 'fa-file-certificate', description: 'Timed, scheduled, downloadable' },
  { type: 'Quiz',       icon: 'fa-clipboard-question', description: 'Lighter, still timed' },
  { type: 'Pop Quiz',   icon: 'fa-bolt',              description: 'Live start/stop in class' },
  { type: 'Assignment', icon: 'fa-pen-ruler',         description: 'Due-date based, no QB structure' },
]
```

And replace the existing type button row with:
```tsx
<div>
  <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Type *</p>
  <div className="grid grid-cols-2 gap-2">
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
```

- [ ] **Step 2: Add sections panel to right column**

Inside `DetailsStep`, add state:
```tsx
const [newSectionTitle, setNewSectionTitle] = useState('')
const [addingSec, setAddingSec] = useState(false)
const sections = activeAsmt?.sections ?? []

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
```

In the JSX right column, after the offering selector, add:

```tsx
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
          className="flex items-center gap-2 px-3 py-2 rounded-lg text-sm"
          style={{ border: '1px solid var(--border)', background: 'var(--card)' }}
        >
          <i className="fa-light fa-layer-group text-muted-foreground" aria-hidden="true" style={{ fontSize: 12 }} />
          <span className="flex-1 text-foreground truncate">{sec.title}</span>
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
      ))}
    </div>
  )}

  {addingSec ? (
    <div className="flex items-center gap-2">
      <input
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
```

- [ ] **Step 3: Add delivery settings (scheduling, download window, option randomization, instructions)**

Add below sections in the right column. Show scheduling only for Exam/Quiz (not Pop Quiz/Assignment):

```tsx
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
          value={settings.openDate?.slice(0, 16) ?? ''}
          onChange={e => patchSettings({ openDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
          style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
        />
      </div>
      <div>
        <p className="text-xs text-muted-foreground mb-1.5">Closes</p>
        <input
          type="datetime-local"
          value={settings.closeDate?.slice(0, 16) ?? ''}
          onChange={e => patchSettings({ closeDate: e.target.value ? new Date(e.target.value).toISOString() : null })}
          style={{ width: '100%', height: 36, padding: '0 8px', fontSize: 13, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
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
          min={1}
          max={168}
          value={settings.downloadWindowHours}
          onChange={e => patchSettings({ downloadWindowHours: Math.max(1, parseInt(e.target.value) || 24) })}
          style={{ width: 60, height: 32, padding: '0 8px', fontSize: 13, textAlign: 'center', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none' }}
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
      value={settings.instructionsText}
      onChange={e => patchSettings({ instructionsText: e.target.value })}
      placeholder="Academic integrity statement, exam rules, or any instructions students see before they start…"
      rows={3}
      style={{ width: '100%', padding: '8px 10px', fontSize: 13, lineHeight: 1.5, border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', resize: 'vertical' }}
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
</div>
```

- [ ] **Step 4: Update `defaultAssessmentSettings` calls throughout the file**

Search for all places that create `settings: { type: 'Exam' as const, ... }` and replace with `settings: defaultAssessmentSettings('Exam')`. Import `defaultAssessmentSettings` from `@/lib/qb-types`.

- [ ] **Step 5: Verify TypeScript compiles**

```bash
pnpm tsc --noEmit 2>&1 | grep -v "WARN"
```
Expected: no errors.

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard/step1): sections, pop quiz type, scheduling, download window, option randomization, instructions"
```

---

## TASK 3: Step 2 — Health Panel + Sections Outline + Inline Editing

**Files:**
- Create: `components/assessment-builder/step2-sections-outline.tsx`
- Create: `components/assessment-builder/step2-health-panel.tsx`
- Create: `components/assessment-builder/step2-inline-editor.tsx`
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` — replace `SelectedQuestionsOutline` + `MetricsPanel` with new components, add section assignment to question picker

**Context for implementer:**
- `SelectedQuestionsOutline` lives at line ~1493 in `assessment-builder-client.tsx`
- `MetricsPanel` lives at line ~1616
- `ABQuestionPicker` at line ~641 has the source tabs and question list
- The `Question` type in `lib/qb-types.ts` has `pbis: number | null` and `pbisDir`
- `MOCK_MISSING_RATIONALE_QUESTION_IDS` and `MOCK_POOR_PBIS_QUESTION_IDS` are in `lib/qb-mock-data.ts` (added in Task 1)

### 3A: Create `components/assessment-builder/step2-sections-outline.tsx`

- [ ] **Step 1: Write the file**

```tsx
'use client'

import { useState } from 'react'
import { Button, Badge } from '@exxat/ds/packages/ui/src'
import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
import type { Question } from '@/lib/qb-types'
import { MOCK_MISSING_RATIONALE_QUESTION_IDS, MOCK_POOR_PBIS_QUESTION_IDS } from '@/lib/qb-mock-data'

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

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <i
          className={`fa-light ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
          aria-hidden="true"
          style={{ fontSize: 9, color: 'var(--muted-foreground)', width: 10 }}
        />
        <span className="text-[11px] font-semibold text-foreground truncate flex-1">{section.title}</span>
        <span className="text-[10px] text-muted-foreground shrink-0">{section.questionIds.length}</span>
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
          aria-label="Missing rationale"
          style={{ fontSize: 10, color: 'color-mix(in oklch, var(--foreground) 35%, oklch(80% 0.15 80))' }}
        />
      )}
      {/* Poor pbis warning */}
      {poorPbis && !missingRationale && (
        <i
          className="fa-light fa-chart-line-down shrink-0"
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
            className="h-5 w-5 p-0 shrink-0"
          >
            <i className="fa-light fa-pen" aria-hidden="true" style={{ fontSize: 9 }} />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onRemove(questionId)}
            aria-label="Remove question"
            className="h-5 w-5 p-0 shrink-0"
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 9 }} />
          </Button>
        </>
      )}
    </div>
  )
}
```

### 3B: Create `components/assessment-builder/step2-health-panel.tsx`

- [ ] **Step 2: Write the health panel**

```tsx
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
```

### 3C: Create `components/assessment-builder/step2-inline-editor.tsx`

- [ ] **Step 3: Write inline question editor**

```tsx
'use client'

import { useState } from 'react'
import { Button, Textarea } from '@exxat/ds/packages/ui/src'
import type { Question } from '@/lib/qb-types'

interface Props {
  question: Question
  onSave: (updated: Partial<Question> & { rationale: string }) => void
  onCancel: () => void
  onCopyAndModify: (question: Question) => void
}

export function InlineQuestionEditor({ question, onSave, onCancel, onCopyAndModify }: Props) {
  const [stem, setStem]             = useState(question.title)
  const [rationale, setRationale]   = useState('')  // not on Question type yet — draft only

  return (
    <div
      style={{
        margin: '4px 12px 8px 24px',
        borderRadius: 10,
        border: '1px solid var(--border)',
        background: 'var(--card)',
        padding: 14,
        display: 'flex',
        flexDirection: 'column',
        gap: 10,
      }}
    >
      <div className="flex items-center justify-between">
        <span className="text-[11px] font-semibold text-foreground">Editing {question.code}</span>
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onCopyAndModify(question)}
          className="gap-1.5 text-[11px] h-6"
        >
          <i className="fa-light fa-copy" aria-hidden="true" style={{ fontSize: 10 }} />
          Copy &amp; modify
        </Button>
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1">Question stem</p>
        <Textarea
          value={stem}
          onChange={e => setStem(e.target.value)}
          className="text-xs min-h-16 resize-y"
        />
      </div>

      <div>
        <p className="text-[10px] text-muted-foreground mb-1">
          Rationale
          {!rationale.trim() && (
            <span style={{ color: 'color-mix(in oklch, var(--foreground) 40%, oklch(80% 0.15 80))' }}> — missing</span>
          )}
        </p>
        <Textarea
          value={rationale}
          onChange={e => setRationale(e.target.value)}
          placeholder="Explain why this answer is correct…"
          className="text-xs min-h-12 resize-y"
          style={{ borderColor: !rationale.trim() ? 'color-mix(in oklch, var(--foreground) 30%, oklch(80% 0.15 80))' : undefined }}
        />
      </div>

      <div className="flex items-center gap-2 justify-end">
        <Button variant="ghost" size="sm" onClick={onCancel}>Cancel</Button>
        <Button
          variant="default"
          size="sm"
          onClick={() => onSave({ title: stem, rationale })}
          disabled={!stem.trim()}
        >
          Save to QB
        </Button>
      </div>
    </div>
  )
}
```

### 3D: Wire everything into `assessment-builder-client.tsx`

- [ ] **Step 4: Add imports at top of `assessment-builder-client.tsx`**

```tsx
import { SectionsOutline } from '@/components/assessment-builder/step2-sections-outline'
import { HealthPanel } from '@/components/assessment-builder/step2-health-panel'
import { InlineQuestionEditor } from '@/components/assessment-builder/step2-inline-editor'
```

- [ ] **Step 5: Add `editingQuestionId` state near line 313**

```tsx
const [editingQuestionId, setEditingQuestionId] = useState<string | null>(null)
```

- [ ] **Step 6: Replace `SelectedQuestionsOutline` usage in the Step 2 render**

Find where `<SelectedQuestionsOutline` is rendered (the left panel in Step 2) and replace with:

```tsx
<div style={{ width: 240, minWidth: 240, borderRight: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
  <SectionsOutline
    activeAsmt={activeAsmt}
    selectedIds={selectedIds}
    questions={MOCK_QB_QUESTIONS}
    onRemove={removeQuestion}
    onEditQuestion={id => setEditingQuestionId(prev => prev === id ? null : id)}
    editingQuestionId={editingQuestionId}
  />
</div>
```

- [ ] **Step 7: Add inline editor render below the question row in `SectionsOutline`**

In `step2-sections-outline.tsx`, add this inside `QuestionRow` after the hover actions, as a sibling div (not inside the row):

Actually this needs to be wired via a parent. In `assessment-builder-client.tsx`, after the `SectionsOutline` div, add a conditional block that looks up the editing question and renders:

```tsx
{editingQuestionId && (() => {
  const q = MOCK_QB_QUESTIONS.find(q => q.id === editingQuestionId)
  if (!q) return null
  return (
    <div style={{ borderTop: '1px solid var(--border)', padding: '8px 0', flexShrink: 0 }}>
      <InlineQuestionEditor
        question={q}
        onSave={(updated) => {
          // In mock: just close the editor. Real: update QB store.
          setEditingQuestionId(null)
        }}
        onCancel={() => setEditingQuestionId(null)}
        onCopyAndModify={(q) => {
          // Create a new question derived from this one
          createQuestion({ title: q.title + ' (copy)', options: [], correctIdx: 0 })
          setEditingQuestionId(null)
        }}
      />
    </div>
  )
})()}
```

- [ ] **Step 8: Replace `MetricsPanel` with `HealthPanel`**

Find where `<MetricsPanel` is used and replace with:
```tsx
<div style={{ width: 280, minWidth: 280, borderLeft: '1px solid var(--border)', flexShrink: 0, overflow: 'hidden' }}>
  <HealthPanel
    activeAsmt={activeAsmt}
    objectives={courseObjectives.filter(o => o.courseId === activeAsmt.courseId)}
    timeMetrics={timeMetrics}
    distribution={distribution}
    bloomsMetrics={bloomsMetrics}
    targetQuestions={50}
  />
</div>
```

- [ ] **Step 9: Add section assignment to QB question rows**

In `ABQuestionPicker`, find the "Use" button on each question row and replace with a dropdown:

```tsx
{/* Replace the existing Use / toggle button with: */}
<div style={{ position: 'relative', display: 'inline-block' }}>
  <SectionAssignDropdown
    sections={activeAsmt.sections}
    onAssign={(sectionId) => {
      onToggle(q.id)
      if (sectionId) {
        // assign to section via parent callback
        onAssignToSection?.(q.id, sectionId)
      }
    }}
    isSelected={selectedIds.has(q.id)}
  />
</div>
```

Add `SectionAssignDropdown` as a local function inside `assessment-builder-client.tsx`:

```tsx
function SectionAssignDropdown({ sections, onAssign, isSelected }: {
  sections: AssessmentSection[]
  onAssign: (sectionId: string | null) => void
  isSelected: boolean
}) {
  const [open, setOpen] = useState(false)

  if (isSelected) {
    return (
      <Button variant="outline" size="sm" onClick={() => onAssign(null)} style={{ height: 28, fontSize: 11, gap: 4 }}>
        <i className="fa-light fa-check text-brand" aria-hidden="true" />
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
```

Add `onAssignToSection` to `ABQuestionPicker` props and wire it to `assignQuestionToSection` in the parent.

- [ ] **Step 10: TypeScript check + commit**

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add components/assessment-builder/ app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard/step2): sections outline, health panel, inline editing, section assignment dropdown"
```

---

## TASK 4: Step 3 — Review, Schedule, Approval

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` — ReviewStep function (~line 1311)

- [ ] **Step 1: Replace `ReviewStep` health summary row**

At the top of `ReviewStep` return, add health banner before the summary card:

```tsx
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
```

- [ ] **Step 2: Add `ScheduleBlock` inside `ReviewStep`**

After the difficulty breakdown card, add:

```tsx
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
    onPublish={() => {/* handled by onSendToChair with null reviewer = direct publish */}}
  />
</div>
```

Add helpers:
```tsx
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
```

- [ ] **Step 3: Create `ApprovalPanel` inside the file**

```tsx
function ApprovalPanel({ status, reviewRequest, onSendForReview, onPublish }: {
  status: import('@/lib/qb-types').AssessmentStatus
  reviewRequest: import('@/lib/qb-types').AssessmentReviewRequest | null
  onSendForReview: () => void
  onPublish: () => void
}) {
  const [showPublishWarning, setShowPublishWarning] = useState(false)

  const statusLabel: Record<import('@/lib/qb-types').AssessmentStatus, string> = {
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
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full"
          style={{
            background: status === 'approved'
              ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))'
              : 'var(--muted)',
            color: status === 'approved' ? 'var(--brand-color)' : 'var(--muted-foreground)',
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
        <div className="text-xs text-muted-foreground">
          Sent for review{reviewRequest.dueDate ? ` · due ${formatDateTime(reviewRequest.dueDate)}` : ''}
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
```

- [ ] **Step 4: Add instructions preview in ReviewStep**

After the sections breakdown card:

```tsx
{activeAsmt.settings.instructionsText.trim() && (
  <InstructionsPreview text={activeAsmt.settings.instructionsText} requireAck={activeAsmt.settings.requireAcknowledgment} />
)}
```

```tsx
function InstructionsPreview({ text, requireAck }: { text: string; requireAck: boolean }) {
  const [expanded, setExpanded] = useState(false)
  return (
    <div className="rounded-xl border border-border bg-card overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded(e => !e)}
        className="flex items-center justify-between w-full px-5 py-3 text-left"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <div className="flex items-center gap-2">
          <i className="fa-light fa-file-lines" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 13 }} />
          <span className="text-xs font-semibold text-foreground">Pre-exam instructions configured</span>
          {requireAck && <Badge variant="outline" className="text-[10px]">Acknowledgment required</Badge>}
        </div>
        <i className={`fa-light ${expanded ? 'fa-chevron-up' : 'fa-chevron-down'} text-muted-foreground`} aria-hidden="true" style={{ fontSize: 10 }} />
      </button>
      {expanded && (
        <div className="px-5 pb-4 border-t border-border">
          <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 pt-3">Students will see:</p>
          <div
            className="rounded-lg p-4 text-sm text-foreground leading-relaxed whitespace-pre-wrap"
            style={{ background: 'var(--muted)', fontSize: 13 }}
          >
            {text}
          </div>
          {requireAck && (
            <div className="flex items-center gap-2 mt-3 opacity-60">
              <div style={{ width: 16, height: 16, borderRadius: 4, border: '1.5px solid var(--border)', background: 'var(--background)' }} />
              <span className="text-xs text-muted-foreground">I have read and understood the above instructions</span>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
```

- [ ] **Step 5: TypeScript check + commit**

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard/step3): health banner, schedule block, approval panel, instructions preview"
```

---

## TASK 5: K-Type Question

**Files:**
- Modify: `lib/question-editor-types.ts`
- Modify: `components/question-editor/question-editor.tsx`

K-type (also called "complex multiple choice") presents a set of options each rated as True/False, then the student selects a combination key. Used heavily in pharmacy/NAPLEX prep.

- [ ] **Step 1: Add K-type to `lib/question-editor-types.ts`**

Add to `EditorQType`:
```ts
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
  | 'k-type'          // NEW
```

Add payload type:
```ts
export interface KTypeStatement { id: string; text: string; correct: boolean }

// In QuestionPayload union, add:
// | { type: 'k-type'; statements: KTypeStatement[]; combinationKeys: { id: string; label: string; selectedIds: string[]; isCorrect: boolean }[] }
```

Full updated union:
```ts
export type QuestionPayload =
  | { type: 'mcq';          options: McqOption[]; shuffle: boolean }
  | { type: 'multi-select'; options: McqOption[]; shuffle: boolean; partialCredit: boolean }
  | { type: 'true-false';   correct: boolean }
  | { type: 'short-answer'; acceptedAnswers: string[]; caseSensitive: boolean }
  | { type: 'numeric';      answer: number; tolerance: number; units: string }
  | { type: 'essay';        wordLimit: number; rubric: RubricCriterion[] }
  | { type: 'fill-blank';   stemTemplate: string; blanks: FillBlankSpan[] }
  | { type: 'matching';     lefts: MatchPair[]; rights: MatchRight[] }
  | { type: 'ordering';     items: OrderItem[] }
  | { type: 'hotspot';      imageUrl: string; hotspots: Hotspot[] }
  | { type: 'k-type';       statements: KTypeStatement[]; combinationKeys: { id: string; label: string; selectedIds: string[]; isCorrect: boolean }[] }
```

Add to `QUESTION_TYPES`:
```ts
{ id: 'k-type', label: 'K-type', icon: 'fa-table-list', baseMinutes: 3.0, shortDescription: 'Complex MCQ — each option rated True/False, select correct combination' },
```

Add to `defaultPayload`:
```ts
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
```

- [ ] **Step 2: Add `KTypeControls` to `question-editor.tsx`**

In the `TypeControls` switch statement, add:
```tsx
case 'k-type':
  return <KTypeControls payload={payload} onChange={onChange} />
```

Add the component:
```tsx
function KTypeControls({ payload, onChange }: {
  payload: Extract<QuestionPayload, { type: 'k-type' }>
  onChange: (p: QuestionPayload) => void
}) {
  function updateStatement(id: string, patch: Partial<KTypeStatement>) {
    onChange({ ...payload, statements: payload.statements.map(s => s.id === id ? { ...s, ...patch } : s) })
  }
  function addStatement() {
    onChange({ ...payload, statements: [...payload.statements, { id: `ks-${Date.now()}`, text: '', correct: false }] })
  }
  function removeStatement(id: string) {
    onChange({ ...payload, statements: payload.statements.filter(s => s.id !== id) })
  }

  return (
    <div className="flex flex-col gap-4">
      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Statements</p>
        <p className="text-[11px] text-muted-foreground mb-3">Mark each statement as True or False. The correct combination key is the one whose selected pattern matches.</p>
        {payload.statements.map((stmt, idx) => (
          <div key={stmt.id} className="flex items-start gap-2 mb-2">
            <span className="text-xs font-mono text-muted-foreground mt-2 w-4 shrink-0">{String.fromCharCode(65 + idx)}.</span>
            <input
              value={stmt.text}
              onChange={e => updateStatement(stmt.id, { text: e.target.value })}
              placeholder={`Statement ${String.fromCharCode(65 + idx)}`}
              className="flex-1 text-sm"
              style={{ height: 36, padding: '0 10px', border: '1px solid var(--border)', borderRadius: 8, background: 'var(--background)', color: 'var(--foreground)', outline: 'none', fontSize: 13 }}
            />
            <Button
              variant={stmt.correct ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStatement(stmt.id, { correct: true })}
              className="shrink-0"
              style={{ height: 36, minWidth: 56, fontSize: 12 }}
            >
              True
            </Button>
            <Button
              variant={!stmt.correct ? 'default' : 'outline'}
              size="sm"
              onClick={() => updateStatement(stmt.id, { correct: false })}
              className="shrink-0"
              style={{ height: 36, minWidth: 56, fontSize: 12 }}
            >
              False
            </Button>
            {payload.statements.length > 2 && (
              <Button variant="ghost" size="sm" onClick={() => removeStatement(stmt.id)} aria-label="Remove statement" style={{ height: 36 }}>
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </Button>
            )}
          </div>
        ))}
        <Button variant="ghost" size="sm" onClick={addStatement} className="gap-1.5 mt-1">
          <i className="fa-light fa-plus" aria-hidden="true" />
          Add statement
        </Button>
      </div>

      <div>
        <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Combination keys</p>
        <p className="text-[11px] text-muted-foreground mb-3">Define what each answer key (A, B, C, D) means — which statements are true in that combination. Mark the correct key.</p>
        {payload.combinationKeys.map((key, idx) => (
          <div key={key.id} className="flex items-center gap-2 mb-2">
            <Button
              variant={key.isCorrect ? 'default' : 'outline'}
              size="sm"
              onClick={() => onChange({ ...payload, combinationKeys: payload.combinationKeys.map(k => ({ ...k, isCorrect: k.id === key.id })) })}
              style={{ height: 32, width: 32, padding: 0, fontWeight: 700, fontSize: 13, flexShrink: 0 }}
              aria-label={`Mark key ${key.label} as correct`}
            >
              {key.label}
            </Button>
            <span className="text-xs text-muted-foreground flex-1">
              {payload.statements.length > 0
                ? payload.statements.map((s, i) => `${String.fromCharCode(65 + i)}=${s.correct ? 'T' : 'F'}`).join(', ')
                : 'Define statements above'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 3: TypeScript check + commit**

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add lib/question-editor-types.ts components/question-editor/question-editor.tsx
git commit -m "feat(qeditor): K-type question — complex MCQ with statement truth-value + combination keys"
```

---

## TASK 6: Import Assessment from PDF Modal

**Files:**
- Create: `components/import-assessment-modal.tsx`
- Modify: `app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx` — add Import PDF option to CreateAssessmentModal

The user uploads a paper exam PDF. We simulate parsing it into questions, match against the QB, and let them confirm before creating a draft.

- [ ] **Step 1: Create `components/import-assessment-modal.tsx`**

```tsx
'use client'

import { useState } from 'react'
import { Button, Badge, LocalBanner } from '@exxat/ds/packages/ui/src'

type ImportStep = 'upload' | 'review' | 'confirming'

interface ParsedQuestion {
  id: string
  stem: string
  optionsCount: number
  matchedQBId: string | null     // null = new question (will be added to QB)
  matchedTitle: string | null
  confidence: number | null      // 0–1 if matched
}

// Mock parsed questions simulating what OCR + matching would return
const MOCK_PARSED: ParsedQuestion[] = [
  { id: 'p1', stem: 'A patient presents with acute kidney injury. Which aminoglycoside factor most directly influences dosing?', optionsCount: 4, matchedQBId: 'phar101-q001', matchedTitle: 'Apply dose-calculation methods...', confidence: 0.91 },
  { id: 'p2', stem: 'Which receptor subtype mediates bronchodilation when stimulated?', optionsCount: 4, matchedQBId: 'phar101-q003', matchedTitle: 'Distinguish receptor agonist vs antagonist...', confidence: 0.78 },
  { id: 'p3', stem: 'Describe the mechanism by which warfarin inhibits coagulation.', optionsCount: 4, matchedQBId: null, matchedTitle: null, confidence: null },
  { id: 'p4', stem: 'Which of the following is a first-line treatment for type 2 diabetes?', optionsCount: 5, matchedQBId: null, matchedTitle: null, confidence: null },
]

interface Props {
  open: boolean
  onOpenChange: (v: boolean) => void
  courseCode: string
  onImport: (questions: ParsedQuestion[]) => void
}

export function ImportAssessmentModal({ open, onOpenChange, courseCode, onImport }: Props) {
  const [step, setStep] = useState<ImportStep>('upload')
  const [fileName, setFileName] = useState<string | null>(null)
  const [excluded, setExcluded] = useState<Set<string>>(new Set())

  if (!open) return null

  const matchedCount = MOCK_PARSED.filter(q => q.matchedQBId !== null).length
  const newCount = MOCK_PARSED.filter(q => q.matchedQBId === null).length

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (file) {
      setFileName(file.name)
      // Simulate parsing delay
      setTimeout(() => setStep('review'), 800)
    }
  }

  function toggleExclude(id: string) {
    setExcluded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  function handleImport() {
    const toImport = MOCK_PARSED.filter(q => !excluded.has(q.id))
    onImport(toImport)
    onOpenChange(false)
  }

  return (
    <div
      style={{ position: 'fixed', inset: 0, zIndex: 200, background: 'color-mix(in oklch, var(--foreground) 40%, transparent)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}
      onClick={e => { if (e.target === e.currentTarget) onOpenChange(false) }}
    >
      <div style={{ background: 'var(--background)', borderRadius: 16, border: '1px solid var(--border)', width: '100%', maxWidth: 560, maxHeight: '85vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {/* Header */}
        <div style={{ padding: '20px 24px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
          <div>
            <h2 className="text-base font-semibold text-foreground">Import from PDF</h2>
            <p className="text-xs text-muted-foreground mt-0.5">{courseCode} · We match to your question bank automatically</p>
          </div>
          <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)} aria-label="Close" className="h-8 w-8 p-0">
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 14 }} />
          </Button>
        </div>

        {/* Body */}
        <div style={{ flex: 1, overflow: 'auto', padding: 24 }}>
          {step === 'upload' && (
            <div className="flex flex-col items-center gap-4">
              <div
                className="flex flex-col items-center gap-3 rounded-xl border-2 border-dashed p-10 w-full"
                style={{ borderColor: 'var(--border)', background: 'var(--muted)' }}
              >
                <i className="fa-light fa-file-pdf" aria-hidden="true" style={{ fontSize: 36, color: 'var(--brand-color)' }} />
                <div className="text-center">
                  <p className="text-sm font-semibold text-foreground">Upload your paper exam</p>
                  <p className="text-xs text-muted-foreground mt-1">PDF up to 50 MB · We extract questions and match to your QB</p>
                </div>
                <label>
                  <Button variant="default" size="sm" className="gap-2" asChild>
                    <span>
                      <i className="fa-light fa-upload" aria-hidden="true" />
                      Choose file
                    </span>
                  </Button>
                  <input type="file" accept=".pdf" onChange={handleFileChange} style={{ display: 'none' }} />
                </label>
              </div>
              {fileName && (
                <div className="flex items-center gap-2 text-xs text-muted-foreground">
                  <i className="fa-light fa-spinner fa-spin" aria-hidden="true" />
                  Parsing {fileName}…
                </div>
              )}
            </div>
          )}

          {step === 'review' && (
            <div className="flex flex-col gap-4">
              <LocalBanner variant="info" icon="fa-wand-magic-sparkles" title={`Found ${MOCK_PARSED.length} questions`}>
                <p>{matchedCount} matched to your QB · {newCount} will be added as new questions</p>
              </LocalBanner>

              <div className="flex flex-col gap-2">
                {MOCK_PARSED.map(q => (
                  <div
                    key={q.id}
                    className="rounded-lg border p-3 flex items-start gap-3"
                    style={{
                      borderColor: excluded.has(q.id) ? 'var(--muted)' : 'var(--border)',
                      background: excluded.has(q.id) ? 'var(--muted)' : 'var(--card)',
                      opacity: excluded.has(q.id) ? 0.5 : 1,
                    }}
                  >
                    <input
                      type="checkbox"
                      checked={!excluded.has(q.id)}
                      onChange={() => toggleExclude(q.id)}
                      aria-label={`Include question ${q.id}`}
                      style={{ marginTop: 3, accentColor: 'var(--brand-color)', width: 14, height: 14, flexShrink: 0 }}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-foreground leading-relaxed line-clamp-2">{q.stem}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        {q.matchedQBId ? (
                          <>
                            <Badge variant="secondary" className="text-[9px]">
                              <i className="fa-light fa-link mr-1" aria-hidden="true" />
                              QB match
                            </Badge>
                            <span className="text-[10px] text-muted-foreground truncate">{q.matchedTitle}</span>
                            <span className="text-[10px] text-muted-foreground shrink-0">{Math.round((q.confidence ?? 0) * 100)}% confidence</span>
                          </>
                        ) : (
                          <Badge variant="outline" className="text-[9px]">New question</Badge>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'review' && (
          <div style={{ padding: '16px 24px', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
            <span className="text-xs text-muted-foreground">
              {MOCK_PARSED.length - excluded.size} of {MOCK_PARSED.length} questions selected
            </span>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>Cancel</Button>
              <Button
                variant="default"
                size="sm"
                onClick={handleImport}
                disabled={excluded.size === MOCK_PARSED.length}
                className="gap-1.5"
              >
                <i className="fa-light fa-file-import" aria-hidden="true" />
                Create draft
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Add import option to CreateAssessmentModal in `course-offering-detail-client.tsx`**

Find the `CreateAssessmentModal` component and the mode buttons. Add a 4th mode:

```tsx
{/* Add alongside blank/qb/copy buttons: */}
<button
  type="button"
  onClick={() => setMode('import')}
  className={`p-4 rounded-xl border text-left transition-colors ${
    mode === 'import' ? 'border-brand bg-brand/8' : 'border-border hover:border-muted-foreground/30'
  }`}
  style={{ background: mode === 'import' ? 'color-mix(in oklch, var(--brand-color) 8%, var(--background))' : 'var(--card)' }}
>
  <i className="fa-light fa-file-import" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 20, marginBottom: 8 }} />
  <p className="text-sm font-semibold text-foreground">Import PDF</p>
  <p className="text-xs text-muted-foreground mt-0.5">Upload a paper exam. We match questions to your QB.</p>
</button>
```

Handle the import mode in the modal continue action:
```tsx
if (mode === 'import') {
  setImportOpen(true)
  setCreateModalOpen(false)
}
```

Add `importOpen` state and render `ImportAssessmentModal`:
```tsx
const [importOpen, setImportOpen] = useState(false)
// ...
<ImportAssessmentModal
  open={importOpen}
  onOpenChange={setImportOpen}
  courseCode={currentCourse?.code ?? ''}
  onImport={(questions) => {
    router.push(`/assessment-builder?offeringId=${offeringId}&mode=import&questionCount=${questions.length}`)
  }}
/>
```

- [ ] **Step 3: TypeScript check + commit**

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add components/import-assessment-modal.tsx app/\(app\)/courses/offerings/\[id\]/course-offering-detail-client.tsx
git commit -m "feat(assessment): import from PDF modal — extract questions, match to QB, create draft"
```

---

## TASK 7: Live Monitor — Flagged Questions Panel

**Files:**
- Modify: `app/(app)/assessments/[id]/monitor/live-monitor-client.tsx`

The existing file already has: student buckets, broadcast alert, pause/resume, tick-based simulation. It has flagged COMMENTS from students. What's missing is a **flagged QUESTIONS** panel that groups all student flags by question (not by student), allowing the faculty to acknowledge or dismiss per question.

- [ ] **Step 1: Read existing flaggedComments structure**

In `live-monitor-client.tsx`, find `snapshot.flaggedComments` and its type. It should have `{ questionOrder, studentId, comment }` shape. If not, check `buildSnapshot` function.

- [ ] **Step 2: Add flagged questions grouping**

After `const flaggedCount = snapshot.flaggedComments.length`, add:

```tsx
// Group flags by question order
const flagsByQuestion = snapshot.flaggedComments.reduce<Record<number, { count: number; comments: string[] }>>((acc, f) => {
  const k = f.questionOrder
  if (!acc[k]) acc[k] = { count: 0, comments: [] }
  acc[k].count++
  if (f.comment) acc[k].comments.push(f.comment)
  return acc
}, {})
const flaggedQuestions = Object.entries(flagsByQuestion).map(([order, data]) => ({
  questionOrder: Number(order),
  ...data,
})).sort((a, b) => b.count - a.count)
```

- [ ] **Step 3: Add `FlaggedQuestionsPanel` section to the layout**

Find where the existing "Flagged comments" or similar UI renders. Replace or add alongside with:

```tsx
{flaggedQuestions.length > 0 && (
  <div className="flex flex-col gap-3">
    <h3 className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground">
      Flagged questions ({flaggedQuestions.length})
    </h3>
    <div className="flex flex-col gap-2">
      {flaggedQuestions.map(fq => {
        const key = `q-${fq.questionOrder}`
        const status = flagStatuses[key]
        return (
          <div
            key={fq.questionOrder}
            className="flex items-start gap-3 rounded-xl border p-4"
            style={{
              borderColor: status ? 'var(--muted)' : 'var(--border)',
              background: status ? 'var(--muted)' : 'var(--card)',
              opacity: status ? 0.6 : 1,
            }}
          >
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-foreground">Q{fq.questionOrder}</span>
                <Badge variant="secondary" className="text-[10px]">{fq.count} flag{fq.count > 1 ? 's' : ''}</Badge>
                {status && (
                  <Badge variant="outline" className="text-[10px]">{status}</Badge>
                )}
              </div>
              {fq.comments.slice(0, 2).map((c, i) => (
                <p key={i} className="text-xs text-muted-foreground italic truncate">&ldquo;{c}&rdquo;</p>
              ))}
            </div>
            {!status && (
              <div className="flex gap-2 shrink-0">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setFlagStatuses(prev => ({ ...prev, [key]: 'acknowledged' }))}
                  className="text-xs h-8"
                >
                  Acknowledge
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setFlagStatuses(prev => ({ ...prev, [key]: 'dismissed' }))}
                  className="text-xs h-8"
                >
                  Dismiss
                </Button>
              </div>
            )}
          </div>
        )
      })}
    </div>
  </div>
)}
```

- [ ] **Step 4: Update the KeyMetrics to include flagged question count**

Find where `KeyMetrics` metrics are defined and add:
```tsx
{
  label: 'Flagged questions',
  value: flaggedQuestions.length,
  icon: 'fa-triangle-exclamation',
  // color from existing pattern in file
}
```

- [ ] **Step 5: TypeScript check + commit**

```bash
pnpm tsc --noEmit 2>&1 | grep -v WARN
git add app/\(app\)/assessments/\[id\]/monitor/live-monitor-client.tsx
git commit -m "feat(monitor): flagged questions panel — grouped by question, acknowledge/dismiss per question"
```

---

## ACCESSIBILITY REQUIREMENTS (apply to ALL tasks)

From May 21 transcript — Vishaka: 200% magnification, high contrast, dyslexic font support.

**Apply these rules in every component written above:**

1. **Min 44px touch targets** — all buttons must be `h-11` (44px) at full size or `h-8` minimum where space is tight. Never `h-5` without a larger surrounding click area.

2. **No color-only information** — every status indicator must have both a color and a text label or icon. Never `backgroundColor: red` alone. Always pair with `aria-label` or visible text.

3. **200% zoom resilience** — no `overflow: hidden` on containers that hold text. Use `min-width: 0` on flex children. Multi-column grids must collapse via `@media` or `grid-cols-1 sm:grid-cols-2`.

4. **Keyboard navigation** — all interactive elements must be reachable by Tab in visual order. Custom click divs need `role="button"` + `tabIndex={0}` + `onKeyDown` for Enter/Space. Native `<button>` is preferred (via DS `Button`).

5. **ARIA labels on icon-only buttons** — every `Button` with only an `<i>` child needs `aria-label`. Every `<i>` inside a button needs `aria-hidden="true"`.

6. **Focus rings** — do not suppress `outline: none` unless the DS provides its own focus ring. If overriding styles via `style={}`, never set `outline: 'none'` without a `boxShadow` focus fallback.

7. **Responsive text** — all font sizes must use `var(--token)` scales. No `fontSize: 9` on critical labels — use `text-[10px]` (10px is minimum for non-decorative text).

---

## SELF-REVIEW CHECKLIST (run before claiming done)

After implementing all tasks, verify:

- [ ] `pnpm tsc --noEmit` → zero errors
- [ ] `pnpm dev` starts on port 3001 without runtime errors
- [ ] Navigate to a course offering → click "Create assessment" → all 4 modes visible
- [ ] Create blank → Step 1 shows sections + pop quiz type + delivery settings
- [ ] Add a section → appears in Step 2 left panel as a group
- [ ] Select a question in Step 2 → section assignment dropdown appears
- [ ] Click edit icon in outline → inline editor expands below the question row
- [ ] Step 3 shows health banner + schedule block + approval panel
- [ ] Send for review sheet opens with reviewer selector
- [ ] Question editor shows K-type chip → K-type controls render
- [ ] Import PDF modal opens → file picker → review step with matched/new badges
- [ ] Live monitor shows flagged questions grouped by question number
- [ ] All buttons have visible focus rings (Tab through wizard)
- [ ] No `var(--destructive)` in score/performance displays (use amber/oklch)
- [ ] No hardcoded hex or `white`/`black` CSS named colors anywhere
- [ ] No raw `<button>` (all DS `Button` or role="button" with keyboard handler)
