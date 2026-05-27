# Question Detail Panel Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the existing 103-line `QuestionDetailSheet` inline component in the assessment builder with a fully-featured tabbed detail panel showing question preview (in the question's configured layout), performance stats with pt. bi-serial warning, version history with per-version authorship, and a collaborators access list.

**Architecture:** Extract `QuestionDetailSheet` from `assessment-builder-client.tsx` into its own file `question-detail-sheet.tsx`. Extend `Question` in `qb-types.ts` with new optional fields (options, layout, correctness, version history, collaborators). Add rich mock data for three representative questions. The calling code in `assessment-builder-client.tsx` changes only the import — props and state are unchanged.

**Tech Stack:** Next.js App Router, React, TypeScript, `@exxat/ds/packages/ui/src` (Sheet, Button, SheetContent), Tailwind utilities, Prism DS tokens (`var(--brand-color)` hue 342, `var(--chart-2)` green, `var(--chart-4)` orange-red)

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `lib/qb-types.ts` | Modify | Add `QLayout`, `QuestionOption`, `QuestionVersionEntry`, `QuestionCollaborator`; extend `Question` |
| `lib/qb-mock-data.ts` | Modify | Add detail fields to 3 questions: MCQ (healthy pbi), MCQ (low pbi), Essay |
| `app/(app)/assessment-builder/question-detail-sheet.tsx` | Create | Full tabbed detail sheet + 4 sub-tab components |
| `app/(app)/assessment-builder/assessment-builder-client.tsx` | Modify | Remove inline `QuestionDetailSheet` (lines 3433–3538), add import |

---

### Task 1: Extend QB types

**Files:**
- Modify: `lib/qb-types.ts`

- [ ] **Step 1: Add `QLayout` and `QuestionOption` types after line 10**

```typescript
export type QLayout = 'stacked' | 'split'

export interface QuestionOption {
  key: string              // 'A' | 'B' | 'C' | 'D'
  text: string
  isCorrect: boolean
  rationaleAuthor?: string // "Dr. Sarah Chen" — shown on correct option
  rationale: string        // Full rationale for correct; "why wrong" for distractors
}
```

- [ ] **Step 2: Add `QuestionVersionEntry` and `QuestionCollaborator` types after `QuestionOption`**

```typescript
export interface QuestionVersionEntry {
  version: number
  modifiedBy: string       // display name e.g. "Dr. Sarah Chen"
  date: string             // ISO date string e.g. "2026-05-14"
  isOriginal?: boolean     // true on v1
  changes: string[]        // bullet list of what changed from prior version
  usedInAssessments: string[] // assessment names that used this version
}

export interface QuestionCollaborator {
  personaId: string
  role: 'owner' | 'edit' | 'view'
}
```

- [ ] **Step 3: Extend `Question` interface — add optional detail fields after `favorited?: boolean`**

```typescript
  // Question detail panel fields (optional — present when detail data is loaded)
  layout?: QLayout
  stemText?: string                        // full question stem; falls back to title
  options?: QuestionOption[]               // MCQ / MSQ only
  rubric?: { criterion: string; points: number }[]  // Essay only
  minWordCount?: number                    // Essay only
  correctness?: number | null              // 0–100; % students who answered correctly
  avgTimeSeconds?: number | null           // avg seconds per student
  pValue?: number | null                   // numeric difficulty 0–1
  optionDistribution?: { key: string; count: number }[]  // per-option selection counts
  totalAttempts?: number | null            // total student attempts across all versions
  versionHistory?: QuestionVersionEntry[]  // sorted newest-first
  collaborators?: QuestionCollaborator[]   // includes owner
```

- [ ] **Step 4: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors (all new fields are optional)

- [ ] **Step 5: Commit**

```bash
git add lib/qb-types.ts
git commit -m "feat(types): add QuestionOption, QuestionVersionEntry, QuestionCollaborator and detail fields to Question"
```

---

### Task 2: Add rich mock data for three questions

**Files:**
- Modify: `lib/qb-mock-data.ts`

Read the file first to find three suitable questions to augment — one MCQ with healthy pbi, one MCQ with low pbi, one Essay. Look at the existing `MOCK_QB_QUESTIONS` array — use the first three questions. If the first question is MCQ, use it for the healthy case; pick the one with lowest pbis for the low-pbi case; pick the essay for the essay case.

- [ ] **Step 1: Find the three target question IDs**

```bash
grep -n "id:\|type:\|pbis:\|title:" /Users/romitsoley/Work/apps/exam-management/admin/lib/qb-mock-data.ts | head -40
```

Note the `id` values for: first MCQ with pbis ≥ 0.30, first MCQ with pbis < 0.20, and first Essay question.

- [ ] **Step 2: Add detail fields to the healthy MCQ question**

Find the question object in `MOCK_QB_QUESTIONS` with the healthy pbi and add these fields inside the object literal (after `favorited`):

```typescript
  layout: 'split' as const,
  stemText: 'A 68-year-old patient with reduced ejection fraction heart failure is started on metoprolol succinate. Which of the following best explains the long-term benefit of beta-blocker therapy in this condition?',
  options: [
    { key: 'A', text: 'Increased heart rate improves cardiac output', isCorrect: false, rationale: 'Beta-blockers reduce heart rate — the opposite effect. Increased HR worsens myocardial oxygen demand in heart failure.' },
    { key: 'B', text: 'Reverse remodeling reduces ventricular wall stress over time', isCorrect: true, rationaleAuthor: 'Dr. Sarah Chen', rationale: 'Chronic sympathetic blockade reduces myocardial oxygen demand and enables reverse remodeling — the ventricle decreases in volume and improves ejection fraction over 3–6 months. This is the mechanism behind improved survival in HFrEF.' },
    { key: 'C', text: 'Direct inotropic effect augments stroke volume', isCorrect: false, rationale: 'Beta-blockers are negative inotropes acutely. Long-term benefit is through neurohormonal blockade — a common misconception.' },
    { key: 'D', text: 'Peripheral vasodilation reduces afterload acutely', isCorrect: false, rationale: 'Afterload reduction is the mechanism of ACEi/ARBs. Some vasodilation occurs with carvedilol but it is not the primary or general mechanism.' },
  ],
  correctness: 71,
  avgTimeSeconds: 102,
  pValue: 0.71,
  totalAttempts: 186,
  optionDistribution: [
    { key: 'A', count: 11 },
    { key: 'B', count: 132 },
    { key: 'C', count: 29 },
    { key: 'D', count: 14 },
  ],
  versionHistory: [
    {
      version: 3,
      modifiedBy: 'Dr. Sarah Chen',
      date: '2026-05-14',
      changes: ['Expanded rationale for option B — added reverse remodeling timeline detail', 'Added distractor rationales for A, C, D'],
      usedInAssessments: ['Cardiology Midterm — Spring 2026', 'Heart Failure Module Quiz'],
    },
    {
      version: 2,
      modifiedBy: 'Dr. James Wu',
      date: '2026-03-02',
      changes: ['Added option D (vasodilation distractor)', 'Reworded stem: "long-term benefit" clarified'],
      usedInAssessments: ['USMLE Step 1 Prep Bank'],
    },
    {
      version: 1,
      modifiedBy: 'Dr. Sarah Chen',
      date: '2026-01-09',
      isOriginal: true,
      changes: [],
      usedInAssessments: ['Pharmacology Final — Fall 2025'],
    },
  ],
  collaborators: [
    { personaId: 'p1', role: 'owner' as const },
    { personaId: 'p2', role: 'edit' as const },
    { personaId: 'p3', role: 'view' as const },
    { personaId: 'p4', role: 'view' as const },
  ],
```

- [ ] **Step 3: Add detail fields to the low-pbi MCQ question**

```typescript
  layout: 'stacked' as const,
  stemText: 'What is the approximate resting membrane potential of a typical ventricular cardiac myocyte at rest?',
  options: [
    { key: 'A', text: '−40 mV', isCorrect: false, rationale: '−40 mV is the threshold potential for action potential firing in SA node pacemaker cells, not the resting potential of ventricular myocytes.' },
    { key: 'B', text: '−90 mV', isCorrect: true, rationaleAuthor: 'Dr. James Wu', rationale: 'Ventricular myocytes have a resting potential of approximately −90 mV, maintained primarily by high K⁺ permeability through inward rectifier K⁺ channels (IK1).' },
    { key: 'C', text: '−70 mV', isCorrect: false, rationale: '−70 mV is the resting potential of neurons — a common neuroscience/cardiology confusion.' },
    { key: 'D', text: '−55 mV', isCorrect: false, rationale: 'Near the action potential threshold in neurons; does not represent the resting state of any cardiac cell type.' },
  ],
  correctness: 91,
  avgTimeSeconds: 24,
  pValue: 0.91,
  totalAttempts: 186,
  optionDistribution: [
    { key: 'A', count: 4 },
    { key: 'B', count: 170 },
    { key: 'C', count: 10 },
    { key: 'D', count: 2 },
  ],
  versionHistory: [
    {
      version: 2,
      modifiedBy: 'Dr. James Wu',
      date: '2026-02-20',
      changes: ['Added "at rest" to stem for clarity', 'Added rationale for option B'],
      usedInAssessments: ['Cardiology Midterm — Spring 2026'],
    },
    {
      version: 1,
      modifiedBy: 'Dr. Sarah Chen',
      date: '2025-11-14',
      isOriginal: true,
      changes: [],
      usedInAssessments: ['Heart Failure Quiz — Fall 2025'],
    },
  ],
  collaborators: [
    { personaId: 'p2', role: 'owner' as const },
    { personaId: 'p1', role: 'edit' as const },
  ],
```

- [ ] **Step 4: Add detail fields to the Essay question**

For an essay question, add `rubric` and `minWordCount` instead of `options`:

```typescript
  layout: 'stacked' as const,
  stemText: 'Discuss the role of the renin-angiotensin-aldosterone system (RAAS) in the progression of heart failure. Include key mediators, their pathophysiological effects, and how current pharmacological interventions target this system.',
  minWordCount: 300,
  rubric: [
    { criterion: 'Identifies key RAAS mediators (renin, angiotensin II, aldosterone, ACE)', points: 3 },
    { criterion: 'Explains pathophysiological effects on preload, afterload, fibrosis, remodeling', points: 3 },
    { criterion: 'Describes ACEi/ARB/ARNi mechanism and clinical evidence', points: 2 },
    { criterion: 'Clarity, organization, appropriate medical terminology', points: 2 },
  ],
  correctness: null,
  avgTimeSeconds: 1110,
  totalAttempts: 42,
  versionHistory: [
    {
      version: 1,
      modifiedBy: 'Dr. Sarah Chen',
      date: '2026-04-01',
      isOriginal: true,
      changes: [],
      usedInAssessments: ['Cardiology Final — Spring 2026', 'Clinical Reasoning Exam'],
    },
  ],
  collaborators: [
    { personaId: 'p1', role: 'owner' as const },
    { personaId: 'p3', role: 'view' as const },
  ],
```

- [ ] **Step 5: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors

- [ ] **Step 6: Commit**

```bash
git add lib/qb-mock-data.ts
git commit -m "feat(mock): add question detail fields (options, rationale, versions, collaborators) to 3 representative questions"
```

---

### Task 3: Create question-detail-sheet.tsx

**Files:**
- Create: `app/(app)/assessment-builder/question-detail-sheet.tsx`

This component replaces the inline `QuestionDetailSheet`. It accepts the same props, so the calling code only needs an import change.

- [ ] **Step 1: Create the file with imports and type definitions**

```typescript
'use client'
import { useState, useEffect } from 'react'
import {
  Sheet, SheetContent, Button,
} from '@exxat/ds/packages/ui/src'
import type {
  Question, QuestionVersionEntry, QuestionCollaborator, QuestionOption,
} from '@/lib/qb-types'
import { MOCK_QB_PERSONAS } from '@/lib/qb-mock-data'

type DetailTab = 'details' | 'stats' | 'versions' | 'collaborators'
```

- [ ] **Step 2: Add the `PbiChip` helper component**

```typescript
function PbiChip({ pbis }: { pbis: number | null | undefined }) {
  if (pbis === null || pbis === undefined) {
    return (
      <span
        className="text-xs px-2 py-1 rounded"
        style={{ background: 'color-mix(in oklch, var(--chart-1) 10%, white)', color: 'var(--chart-1)', border: '1px solid color-mix(in oklch, var(--chart-1) 20%, white)' }}
      >
        Manual grading
      </span>
    )
  }
  const isLow = pbis < 0.2
  return (
    <span
      className="text-xs px-2 py-1 rounded flex items-center gap-1.5 font-semibold"
      style={
        isLow
          ? { background: 'color-mix(in oklch, var(--chart-4) 14%, white)', color: 'oklch(0.40 0.19 27)', border: '1px solid color-mix(in oklch, var(--chart-4) 32%, white)' }
          : { background: 'color-mix(in oklch, var(--chart-2) 12%, white)', color: 'oklch(0.38 0.14 160)', border: '1px solid color-mix(in oklch, var(--chart-2) 24%, white)' }
      }
      aria-label={`Point biserial: ${pbis.toFixed(2)}${isLow ? ' — low' : ''}`}
    >
      <span
        aria-hidden="true"
        style={{ width: 6, height: 6, borderRadius: '50%', flexShrink: 0, background: isLow ? 'var(--chart-4)' : 'var(--chart-2)' }}
      />
      {isLow && '⚠ '}Pt. bi-serial {pbis.toFixed(2)}
    </span>
  )
}
```

- [ ] **Step 3: Add `FooterChip`, `Eyebrow`, and `MetaDivider` helpers**

```typescript
function FooterChip({ children, warn }: { children: React.ReactNode; warn?: boolean }) {
  return (
    <span
      className="text-xs px-2 py-0.5 rounded border"
      style={
        warn
          ? { background: 'color-mix(in oklch, var(--chart-4) 10%, white)', color: 'oklch(0.40 0.19 27)', borderColor: 'color-mix(in oklch, var(--chart-4) 24%, white)' }
          : { background: 'var(--muted)', color: 'var(--muted-foreground)', borderColor: 'var(--border)' }
      }
    >
      {children}
    </span>
  )
}

function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.05em] mb-2">
      {children}
    </p>
  )
}

function MetaDivider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />
}
```

- [ ] **Step 4: Add `OptionPreview` — renders one MCQ option with its rationale**

```typescript
function OptionPreview({ opt }: { opt: QuestionOption }) {
  return (
    <div
      style={{
        border: opt.isCorrect
          ? '1.5px solid var(--border); border-left: 3px solid var(--chart-2)'
          : '1.5px solid var(--border)',
        borderRadius: 7,
        overflow: 'hidden',
        borderLeft: opt.isCorrect ? '3px solid var(--chart-2)' : undefined,
      }}
    >
      <div className="flex items-center gap-2 px-3 py-2">
        <span
          className="text-xs font-bold flex items-center justify-center rounded flex-shrink-0"
          style={{ width: 22, height: 22, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
          aria-label={`Option ${opt.key}`}
        >
          {opt.key}
        </span>
        <span className="text-sm flex-1 leading-snug">{opt.text}</span>
        {opt.isCorrect && (
          <span className="text-xs font-semibold flex-shrink-0" style={{ color: 'oklch(0.38 0.14 160)' }}>
            ✓ Correct
          </span>
        )}
      </div>
      <div
        style={{
          borderTop: '1px solid var(--border)',
          padding: '6px 11px 7px 43px',
          background: opt.isCorrect
            ? 'color-mix(in oklch, var(--chart-2) 5%, white)'
            : 'oklch(0.985 0.002 264)',
        }}
      >
        <p
          className="text-xs font-semibold mb-0.5"
          style={{ color: opt.isCorrect ? 'oklch(0.38 0.14 160)' : 'var(--muted-foreground)' }}
        >
          {opt.isCorrect
            ? `Rationale${opt.rationaleAuthor ? ` — ${opt.rationaleAuthor}` : ''}`
            : 'Why this is incorrect'}
        </p>
        <p className="text-xs leading-relaxed" style={{ color: opt.isCorrect ? 'var(--foreground)' : 'var(--muted-foreground)' }}>
          {opt.rationale}
        </p>
      </div>
    </div>
  )
}
```

- [ ] **Step 5: Add `DetailsTab` component — two-column layout**

```typescript
function DetailsTab({ question }: { question: Question }) {
  const stem = question.stemText ?? question.title
  const isEssay = question.type === 'Fill blank' || (!question.options && question.rubric)
  const isSplit = question.layout === 'split'

  return (
    <div className="flex h-full overflow-hidden">
      {/* Left: question preview */}
      <div className="flex-1 overflow-y-auto p-5 border-r border-border">
        <Eyebrow>Preview — {isSplit ? 'Split view' : 'Stacked'} layout</Eyebrow>

        {/* Split layout card */}
        {isSplit && question.options && (
          <div className="flex rounded-xl border border-border overflow-hidden" style={{ minHeight: 240 }}>
            {/* Left col: stem + correct answer rationale */}
            <div className="flex-1 p-4 border-r border-border flex flex-col gap-3">
              <p className="text-xs font-semibold text-muted-foreground">Question stem</p>
              <p className="text-sm leading-relaxed">{stem}</p>
              {question.options.find(o => o.isCorrect) && (
                <div
                  className="rounded-lg p-3"
                  style={{
                    background: 'color-mix(in oklch, var(--chart-2) 5%, white)',
                    border: '1px solid color-mix(in oklch, var(--chart-2) 18%, white)',
                  }}
                >
                  <p className="text-xs font-semibold mb-1" style={{ color: 'oklch(0.38 0.14 160)' }}>
                    Rationale
                    {question.options.find(o => o.isCorrect)?.rationaleAuthor
                      ? ` — ${question.options.find(o => o.isCorrect)!.rationaleAuthor}`
                      : ''}
                  </p>
                  <p className="text-xs leading-relaxed text-foreground">
                    {question.options.find(o => o.isCorrect)!.rationale}
                  </p>
                </div>
              )}
            </div>
            {/* Right col: options */}
            <div className="flex flex-col gap-1.5 p-3" style={{ width: '42%' }}>
              <p className="text-xs font-semibold text-muted-foreground mb-1">Select one answer</p>
              {question.options.map(opt => (
                <div
                  key={opt.key}
                  style={{
                    border: opt.isCorrect ? '1.5px solid var(--border)' : '1.5px solid var(--border)',
                    borderLeft: opt.isCorrect ? '3px solid var(--chart-2)' : undefined,
                    borderRadius: 7,
                  }}
                  className="flex items-center gap-2 px-2.5 py-2"
                >
                  <span
                    className="text-xs font-bold flex items-center justify-center rounded flex-shrink-0"
                    style={{ width: 20, height: 20, background: 'var(--muted)', border: '1px solid var(--border)', color: 'var(--muted-foreground)' }}
                  >
                    {opt.key}
                  </span>
                  <span className="text-xs flex-1 leading-snug">{opt.text}</span>
                  {opt.isCorrect && <span className="text-xs font-bold flex-shrink-0" style={{ color: 'oklch(0.38 0.14 160)' }}>✓</span>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Stacked layout card — MCQ */}
        {!isSplit && question.options && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex gap-2.5 p-4 border-b border-border items-start">
              <span
                className="text-xs font-bold flex items-center justify-center rounded flex-shrink-0"
                style={{ width: 26, height: 26, background: 'var(--muted)' }}
              >
                Q
              </span>
              <p className="text-sm leading-relaxed flex-1">{stem}</p>
            </div>
            <div className="flex flex-col gap-1.5 p-3">
              {question.options.map(opt => <OptionPreview key={opt.key} opt={opt} />)}
            </div>
          </div>
        )}

        {/* Essay / no-options card */}
        {!question.options && (
          <div className="rounded-xl border border-border overflow-hidden">
            <div className="flex gap-2.5 p-4 border-b border-border items-start">
              <span
                className="text-xs font-bold flex items-center justify-center rounded flex-shrink-0"
                style={{ width: 26, height: 26, background: 'var(--muted)' }}
              >
                Q
              </span>
              <p className="text-sm leading-relaxed flex-1">
                {stem}
                {question.minWordCount && (
                  <span className="text-muted-foreground"> (Min {question.minWordCount} words)</span>
                )}
              </p>
            </div>
            <div className="p-3">
              <div
                className="rounded-lg p-3 text-sm text-muted-foreground"
                style={{ minHeight: 80, background: 'var(--muted)', border: '1.5px solid var(--border)' }}
              >
                Student response area
              </div>
              {question.rubric && question.rubric.length > 0 && (
                <div
                  className="rounded-lg p-3 mt-3"
                  style={{
                    background: 'color-mix(in oklch, var(--chart-1) 6%, white)',
                    border: '1px solid color-mix(in oklch, var(--chart-1) 18%, white)',
                  }}
                >
                  <p className="text-xs font-semibold mb-2" style={{ color: 'var(--chart-1)' }}>
                    Scoring rubric
                  </p>
                  <div className="flex flex-col gap-1.5">
                    {question.rubric.map((r, i) => (
                      <div key={i} className="flex justify-between gap-2">
                        <span className="text-xs leading-snug flex-1">{r.criterion}</span>
                        <span className="text-xs font-semibold text-muted-foreground flex-shrink-0">{r.points} pts</span>
                      </div>
                    ))}
                    <div style={{ height: 1, background: 'color-mix(in oklch, var(--chart-1) 18%, white)', margin: '4px 0' }} />
                    <div className="flex justify-between">
                      <span className="text-sm font-semibold">Total</span>
                      <span className="text-sm font-bold" style={{ color: 'var(--chart-1)' }}>
                        {question.rubric.reduce((s, r) => s + r.points, 0)} pts
                      </span>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Right: quick stats + location + classification */}
      <div className="flex flex-col gap-0 overflow-y-auto p-4" style={{ width: 224, flexShrink: 0 }}>
        <Eyebrow>Quick stats</Eyebrow>
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Correctness</span>
          <span
            className="text-xs font-bold"
            style={{ color: question.correctness != null ? 'oklch(0.38 0.14 160)' : 'var(--foreground)' }}
          >
            {question.correctness != null ? `${question.correctness}%` : '—'}
          </span>
        </div>
        {question.pbis != null && (
          <div className="flex items-center gap-2 mb-2">
            <span className="text-xs text-muted-foreground flex-shrink-0">Pt. bi-serial</span>
            <div
              style={{ flex: 1, height: 4, borderRadius: 2, background: 'var(--border)', position: 'relative' }}
              role="img"
              aria-label={`Pt. bi-serial: ${question.pbis.toFixed(2)}`}
            >
              <div
                style={{
                  height: '100%',
                  borderRadius: 2,
                  width: `${Math.min(question.pbis * 100, 100)}%`,
                  background: question.pbis < 0.2 ? 'var(--chart-4)' : 'var(--chart-2)',
                }}
              />
            </div>
            <span
              className="text-xs font-bold"
              style={{ color: question.pbis < 0.2 ? 'oklch(0.40 0.19 27)' : 'oklch(0.38 0.14 160)', minWidth: 28, textAlign: 'right' }}
            >
              {question.pbis.toFixed(2)}
            </span>
          </div>
        )}
        {question.pbis !== null && question.pbis !== undefined && question.pbis < 0.2 && (
          <div
            className="text-xs leading-snug rounded p-2 mb-2"
            style={{
              background: 'color-mix(in oklch, var(--chart-4) 9%, white)',
              border: '1px solid color-mix(in oklch, var(--chart-4) 22%, white)',
              color: 'oklch(0.40 0.19 27)',
            }}
          >
            Below threshold — see Stats tab for details and suggestions.
          </div>
        )}
        <div className="flex justify-between items-center mb-2">
          <span className="text-xs text-muted-foreground">Used in</span>
          <span className="text-xs font-bold text-foreground">{question.usage} assessment{question.usage !== 1 ? 's' : ''}</span>
        </div>

        <MetaDivider />

        <Eyebrow>Location in QB</Eyebrow>
        {[{ folderPath: question.folderPath }, ...(question.extraFolders ?? [])].map((loc, i) => {
          const parts = loc.folderPath.split(' / ')
          return (
            <div key={i} className="flex items-baseline gap-1 flex-wrap text-xs text-muted-foreground mb-1.5 leading-snug">
              <span>→</span>
              {parts.map((p, pi) => (
                <span key={pi}>
                  {pi < parts.length - 1
                    ? <span>{p} <span style={{ color: 'var(--border)' }}>/</span> </span>
                    : <span className="text-foreground font-medium">{p}</span>}
                </span>
              ))}
            </div>
          )
        })}

        <MetaDivider />

        <Eyebrow>Classification</Eyebrow>
        <div className="flex flex-wrap gap-1">
          {question.tags.map(tag => (
            <span
              key={tag}
              className="text-xs px-2 py-0.5 rounded"
              style={{ background: 'color-mix(in oklch, var(--brand-color) 10%, white)', color: 'var(--brand-dark)' }}
            >
              {tag}
            </span>
          ))}
          <span
            className="text-xs px-2 py-0.5 rounded"
            style={{ background: 'color-mix(in oklch, var(--chart-1) 10%, white)', color: 'var(--chart-1)' }}
          >
            {question.blooms} — Bloom&apos;s
          </span>
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 6: Add `StatsTab` — performance + option distribution + question config**

```typescript
function StatsTab({ question }: { question: Question }) {
  const pbisLow = question.pbis !== null && question.pbis !== undefined && question.pbis < 0.2
  const totalAttempts = question.totalAttempts ?? question.usage
  const formatTime = (s: number | null | undefined) => {
    if (!s) return '—'
    const m = Math.floor(s / 60)
    const sec = s % 60
    return `${m}:${String(sec).padStart(2, '0')}`
  }

  return (
    <div className="overflow-y-auto p-5 flex-1">
      {pbisLow && (
        <div
          className="flex gap-2.5 rounded-lg p-3 mb-5"
          style={{
            background: 'color-mix(in oklch, var(--chart-4) 10%, white)',
            border: '1px solid color-mix(in oklch, var(--chart-4) 28%, white)',
          }}
        >
          <span className="text-sm flex-shrink-0 mt-0.5" style={{ color: 'oklch(0.40 0.19 27)' }}>⚠</span>
          <div>
            <p className="text-sm font-semibold mb-1">Low discrimination — may reduce assessment reliability</p>
            <p className="text-xs text-muted-foreground leading-relaxed">
              Pt. bi-serial of {question.pbis?.toFixed(2)} means high-scoring students are no more likely to answer correctly than low scorers.
              Likely cause: {question.correctness && question.correctness > 80 ? `${question.correctness}% correctness with implausible distractors makes the question too easy. ` : ''}
              Consider making distractors more clinically realistic, elevating to apply-level, or retiring this question.
            </p>
          </div>
        </div>
      )}
      {question.pbis === null && (
        <div
          className="flex gap-2.5 rounded-lg p-3 mb-5"
          style={{ background: 'color-mix(in oklch, var(--chart-1) 8%, white)', border: '1px solid color-mix(in oklch, var(--chart-1) 20%, white)' }}
        >
          <span className="text-sm flex-shrink-0 mt-0.5" style={{ color: 'var(--chart-1)' }}>ℹ</span>
          <div>
            <p className="text-sm font-semibold mb-1">No pt. bi-serial for essay questions</p>
            <p className="text-xs text-muted-foreground leading-relaxed">Point biserial applies to auto-scored questions only. Essay analytics show average score and time on task.</p>
          </div>
        </div>
      )}

      {/* Stats grid */}
      <div className="grid grid-cols-3 gap-2 mb-5">
        {question.correctness != null && (
          <div className="rounded-lg p-3" style={{ background: 'var(--muted)' }}>
            <p className="text-xs text-muted-foreground mb-1">Correctness</p>
            <p className="text-2xl font-bold" style={{ color: 'oklch(0.38 0.14 160)' }}>{question.correctness}%</p>
            <p className="text-xs text-muted-foreground mt-1">{totalAttempts} attempts</p>
          </div>
        )}
        {question.avgTimeSeconds != null && (
          <div className="rounded-lg p-3" style={{ background: 'var(--muted)' }}>
            <p className="text-xs text-muted-foreground mb-1">Avg time</p>
            <p className="text-2xl font-bold">{formatTime(question.avgTimeSeconds)}</p>
            <p className="text-xs text-muted-foreground mt-1">per student</p>
          </div>
        )}
        {question.pValue != null && (
          <div className="rounded-lg p-3" style={{ background: 'var(--muted)' }}>
            <p className="text-xs text-muted-foreground mb-1">Difficulty</p>
            <p
              className="text-2xl font-bold"
              style={{
                color: question.pValue > 0.8 ? 'oklch(0.38 0.14 160)'
                  : question.pValue > 0.4 ? 'oklch(0.44 0.18 55)'
                  : 'oklch(0.40 0.19 27)',
              }}
            >
              {question.difficulty}
            </p>
            <p className="text-xs text-muted-foreground mt-1">p = {question.pValue.toFixed(2)}</p>
          </div>
        )}
        {question.pbis != null && (
          <div className="rounded-lg p-3 col-span-3" style={{ background: 'var(--muted)' }}>
            <p className="text-xs text-muted-foreground mb-1">Point biserial — discrimination index</p>
            <p
              className="font-bold mt-1"
              style={{
                fontSize: 26,
                color: question.pbis < 0.2 ? 'oklch(0.40 0.19 27)' : 'oklch(0.38 0.14 160)',
              }}
            >
              {question.pbis.toFixed(2)}
            </p>
            <div style={{ height: 6, borderRadius: 3, background: 'var(--border)', margin: '8px 0 5px', position: 'relative' }}>
              <div style={{ position: 'absolute', left: '20%', top: -3, bottom: -3, width: 1, background: 'var(--border)' }} aria-hidden="true" />
              <div style={{ position: 'absolute', left: '30%', top: -3, bottom: -3, width: 1, background: 'var(--border)' }} aria-hidden="true" />
              <div
                style={{
                  height: '100%',
                  borderRadius: 3,
                  width: `${Math.min(question.pbis * 100, 100)}%`,
                  background: question.pbis < 0.2 ? 'var(--chart-4)' : 'var(--chart-2)',
                }}
              />
            </div>
            <div className="flex justify-between">
              <span className="text-xs text-muted-foreground">0</span>
              <span className="text-xs text-muted-foreground">0.20 — acceptable</span>
              <span className="text-xs text-muted-foreground">0.30 — good</span>
              <span className="text-xs text-muted-foreground">1.0</span>
            </div>
            <p
              className="text-xs mt-1.5"
              style={{ color: question.pbis < 0.2 ? 'oklch(0.40 0.19 27)' : 'var(--muted-foreground)' }}
            >
              {question.pbis < 0.2
                ? 'Below threshold — does not meaningfully differentiate high from low performers.'
                : 'Strong discrimination — students who know the material are significantly more likely to answer correctly.'}
            </p>
          </div>
        )}
      </div>

      {/* Option distribution */}
      {question.optionDistribution && question.optionDistribution.length > 0 && totalAttempts && (
        <div className="mb-5">
          <Eyebrow>Option distribution</Eyebrow>
          <table className="w-full border-collapse">
            <thead>
              <tr>
                {['Option', 'Selected', '%', ''].map(h => (
                  <th key={h} className="text-xs text-muted-foreground font-medium text-left p-1.5 border-b border-border">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {question.optionDistribution.map(({ key, count }) => {
                const pct = Math.round((count / totalAttempts) * 100)
                const opt = question.options?.find(o => o.key === key)
                const isCorrect = opt?.isCorrect ?? false
                return (
                  <tr key={key} style={{ background: isCorrect ? 'color-mix(in oklch, var(--chart-2) 4%, white)' : undefined }}>
                    <td className="text-sm p-1.5 border-b border-border">
                      <span className="text-xs font-bold" style={{ color: isCorrect ? 'oklch(0.38 0.14 160)' : 'var(--muted-foreground)' }}>
                        {key}{isCorrect ? ' ✓' : ''}
                      </span>
                      {opt && <span className="text-sm text-foreground ml-2">{opt.text.slice(0, 40)}{opt.text.length > 40 ? '…' : ''}</span>}
                    </td>
                    <td className="text-sm p-1.5 border-b border-border font-semibold" style={{ color: isCorrect ? 'oklch(0.38 0.14 160)' : 'var(--muted-foreground)' }}>{count}</td>
                    <td className="text-sm p-1.5 border-b border-border font-semibold" style={{ color: isCorrect ? 'oklch(0.38 0.14 160)' : 'var(--muted-foreground)' }}>{pct}%</td>
                    <td className="p-1.5 border-b border-border" style={{ width: 80 }}>
                      <div style={{ height: 5, borderRadius: 3, background: 'var(--muted)' }}>
                        <div style={{ height: '100%', borderRadius: 3, width: `${pct}%`, background: isCorrect ? 'var(--chart-2)' : 'var(--muted-foreground)' }} />
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* Question config */}
      <div>
        <Eyebrow>Question config</Eyebrow>
        <div className="grid grid-cols-2 gap-2">
          {[
            { label: 'Type', value: question.type },
            { label: 'Layout', value: question.layout === 'split' ? 'Split view' : 'Stacked' },
            { label: 'Bloom\'s', value: question.blooms },
            { label: 'Difficulty', value: question.difficulty },
          ].map(({ label, value }) => (
            <div key={label} className="rounded-lg p-2.5" style={{ background: 'var(--muted)' }}>
              <p className="text-xs text-muted-foreground mb-1">{label}</p>
              <p className="text-sm font-semibold text-foreground">{value ?? '—'}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 7: Add `VersionsTab` — version timeline with "Viewing" indicator and "View this version" links**

```typescript
function VersionsTab({
  question,
  viewingVersion,
  onView,
}: {
  question: Question
  viewingVersion: number
  onView: (v: number) => void
}) {
  const history = question.versionHistory ?? [
    {
      version: question.version,
      modifiedBy: question.lastEditedBy ?? question.creator ?? 'Unknown',
      date: question.age,
      isOriginal: true,
      changes: [],
      usedInAssessments: [],
    },
  ]

  return (
    <div className="overflow-y-auto p-5 flex-1">
      <div
        className="text-xs text-muted-foreground leading-relaxed rounded-lg p-3 mb-5"
        style={{ background: 'var(--muted)' }}
      >
        Any version of this question can be used independently. Assessments keep the version they were built with. Editing always creates a new version.
      </div>
      <div className="flex flex-col" style={{ maxWidth: 560 }}>
        {history.map((entry, i) => (
          <div
            key={entry.version}
            className="flex gap-3 relative"
            style={{ paddingBottom: i < history.length - 1 ? 22 : 0 }}
          >
            {/* Connector line */}
            {i < history.length - 1 && (
              <div
                aria-hidden="true"
                style={{ position: 'absolute', left: 12, top: 25, bottom: 0, width: 1, background: 'var(--border)' }}
              />
            )}
            {/* Version dot */}
            <div
              className="flex items-center justify-center text-xs font-bold flex-shrink-0"
              style={{
                width: 24, height: 24, borderRadius: '50%', zIndex: 1,
                border: entry.version === viewingVersion
                  ? '2px solid var(--brand-color)'
                  : '2px solid var(--border)',
                background: entry.version === viewingVersion
                  ? 'color-mix(in oklch, var(--brand-color) 8%, white)'
                  : 'var(--background)',
                color: entry.version === viewingVersion ? 'var(--brand-color)' : 'var(--muted-foreground)',
              }}
              aria-label={`Version ${entry.version}`}
            >
              {entry.version}
            </div>
            {/* Info */}
            <div className="flex-1 pt-0.5">
              <div className="flex items-center gap-2 mb-1 flex-wrap">
                <span className="text-sm font-semibold">Version {entry.version}</span>
                {entry.version === viewingVersion ? (
                  <span
                    className="text-xs px-2 py-0.5 rounded"
                    style={{ background: 'color-mix(in oklch, var(--brand-color) 12%, white)', color: 'var(--brand-dark)' }}
                  >
                    Viewing
                  </span>
                ) : (
                  <button
                    onClick={() => onView(entry.version)}
                    className="text-xs underline cursor-pointer"
                    style={{ color: 'var(--brand-color)', background: 'none', border: 'none', padding: 0 }}
                  >
                    View this version
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground mb-1.5">
                {entry.isOriginal ? 'Created' : 'Modified'} by <strong>{entry.modifiedBy}</strong> · {entry.date}
              </p>
              {entry.changes.length > 0 && (
                <div className="rounded p-2 mb-2" style={{ background: 'var(--muted)' }}>
                  {entry.changes.map((c, ci) => (
                    <p key={ci} className="text-xs text-foreground leading-snug py-0.5">
                      <span className="text-muted-foreground mr-1">·</span>{c}
                    </p>
                  ))}
                </div>
              )}
              {entry.usedInAssessments.length > 0 && (
                <div className="flex gap-1.5 flex-wrap">
                  {entry.usedInAssessments.map(a => (
                    <span
                      key={a}
                      className="text-xs px-2 py-0.5 rounded"
                      style={{ background: 'var(--muted)', color: 'var(--muted-foreground)' }}
                    >
                      {a}
                    </span>
                  ))}
                </div>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
```

- [ ] **Step 8: Add `CollaboratorsTab`**

```typescript
function CollaboratorsTab({ question }: { question: Question }) {
  const collaborators = question.collaborators ?? []
  const personas = MOCK_QB_PERSONAS

  return (
    <div className="overflow-y-auto p-5 flex-1">
      <p className="text-xs font-semibold text-muted-foreground uppercase tracking-[0.04em] mb-3">People with access</p>
      <div className="rounded-lg border border-border overflow-hidden mb-3">
        {collaborators.length === 0 && (
          <p className="text-sm text-muted-foreground p-4">No collaborators</p>
        )}
        {collaborators.map((collab, i) => {
          const persona = personas.find(p => p.id === collab.personaId)
          if (!persona) return null
          return (
            <div
              key={collab.personaId}
              className="flex items-center gap-3 p-3 bg-white"
              style={{ borderBottom: i < collaborators.length - 1 ? '1px solid var(--border)' : undefined }}
            >
              <div
                className="flex items-center justify-center text-xs font-bold text-white flex-shrink-0 rounded-full"
                style={{ width: 30, height: 30, background: persona.color }}
                aria-hidden="true"
              >
                {persona.initials}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{persona.name}</p>
                <p className="text-xs text-muted-foreground capitalize">{persona.role.replace('_', ' ')}</p>
              </div>
              <span
                className="text-xs px-2 py-0.5 rounded"
                style={
                  collab.role === 'owner'
                    ? { background: 'color-mix(in oklch, var(--brand-color) 10%, white)', color: 'var(--brand-dark)' }
                    : collab.role === 'edit'
                    ? { background: 'color-mix(in oklch, var(--chart-1) 10%, white)', color: 'var(--chart-1)' }
                    : { background: 'var(--muted)', color: 'var(--muted-foreground)' }
                }
              >
                {collab.role === 'owner' ? 'Owner' : collab.role === 'edit' ? 'Can edit' : 'Can view'}
              </span>
            </div>
          )
        })}
      </div>
      <p className="text-xs text-muted-foreground leading-relaxed">
        Access is managed at the folder level. Contact the folder owner or an admin to change permissions.
      </p>
    </div>
  )
}
```

- [ ] **Step 9: Add the main `QuestionDetailSheet` export**

```typescript
export function QuestionDetailSheet({
  questionId,
  questions,
  open,
  onOpenChange,
  onEdit,
}: {
  questionId: string | null
  questions: Question[]
  open: boolean
  onOpenChange: (open: boolean) => void
  onEdit: (id: string) => void
}) {
  const [activeTab, setActiveTab] = useState<DetailTab>('details')
  const [viewingVersion, setViewingVersion] = useState<number | null>(null)

  const question = questions.find(q => q.id === (questionId ?? ''))

  // Reset state when question changes
  useEffect(() => {
    setActiveTab('details')
    setViewingVersion(null)
  }, [questionId])

  if (!question) return null

  const displayVersion = viewingVersion ?? question.version
  const history = question.versionHistory ?? []
  const pbisLow = question.pbis !== null && question.pbis !== undefined && question.pbis < 0.2

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        style={{ width: '82vw', maxWidth: 960, display: 'flex', flexDirection: 'column', padding: 0 }}
        aria-label={`Question detail: ${question.title}`}
      >
        {/* Header */}
        <div
          style={{ height: 52, borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 8, flexShrink: 0, background: 'var(--card)' }}
        >
          <span className="flex-1 text-sm font-semibold truncate">{question.title}</span>

          {/* Version selector */}
          {history.length > 1 && (
            <select
              value={displayVersion}
              onChange={e => setViewingVersion(Number(e.target.value))}
              className="text-xs border border-border rounded bg-muted px-2 py-1 text-foreground"
              aria-label="Select version to view"
            >
              {history.map(v => (
                <option key={v.version} value={v.version}>
                  Version {v.version}
                </option>
              ))}
            </select>
          )}

          <PbiChip pbis={question.pbis} />

          <Button
            size="sm"
            onClick={() => { onEdit(question.id); onOpenChange(false) }}
            className="gap-1.5"
          >
            <i className="fa-light fa-pen" aria-hidden="true" />
            Edit question
          </Button>
          <button
            onClick={() => onOpenChange(false)}
            className="text-muted-foreground px-2 py-1 text-sm hover:text-foreground"
            aria-label="Close detail panel"
          >
            ✕
          </button>
        </div>

        {/* Tabs */}
        <div
          style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 14px', background: 'var(--card)', flexShrink: 0 }}
          role="tablist"
        >
          {(['details', 'stats', 'versions', 'collaborators'] as DetailTab[]).map(tab => (
            <button
              key={tab}
              role="tab"
              aria-selected={activeTab === tab}
              onClick={() => setActiveTab(tab)}
              style={{
                fontSize: 'var(--text-sm, 13px)',
                padding: '9px 13px',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--foreground)' : 'transparent'}`,
                color: activeTab === tab ? 'var(--foreground)' : 'var(--muted-foreground)',
                fontWeight: activeTab === tab ? 500 : 400,
                background: 'none', border: 'none',
                borderBottom: `2px solid ${activeTab === tab ? 'var(--foreground)' : 'transparent'}`,
                marginBottom: -1, cursor: 'pointer', whiteSpace: 'nowrap',
              }}
            >
              {tab === 'details' && 'Details'}
              {tab === 'stats' && (
                <>Stats{pbisLow && <span style={{ marginLeft: 4, color: 'oklch(0.40 0.19 27)' }} aria-label="warning">⚠</span>}</>
              )}
              {tab === 'versions' && (
                <>Versions
                  <span
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px', background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, marginLeft: 4 }}
                  >
                    {history.length || 1}
                  </span>
                </>
              )}
              {tab === 'collaborators' && (
                <>Collaborators
                  <span
                    style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', minWidth: 18, height: 18, borderRadius: 9, padding: '0 4px', background: 'var(--muted)', color: 'var(--muted-foreground)', fontSize: 12, fontWeight: 600, marginLeft: 4 }}
                  >
                    {question.collaborators?.length ?? 0}
                  </span>
                </>
              )}
            </button>
          ))}
        </div>

        {/* Tab panels */}
        <div style={{ flex: 1, overflow: 'hidden', display: 'flex' }} role="tabpanel">
          {activeTab === 'details' && <DetailsTab question={question} />}
          {activeTab === 'stats' && <StatsTab question={question} />}
          {activeTab === 'versions' && (
            <VersionsTab question={question} viewingVersion={displayVersion} onView={setViewingVersion} />
          )}
          {activeTab === 'collaborators' && <CollaboratorsTab question={question} />}
        </div>

        {/* Footer */}
        <div
          style={{ height: 50, borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', padding: '0 14px', gap: 7, flexShrink: 0, background: 'var(--card)' }}
        >
          <div style={{ flex: 1, display: 'flex', gap: 7 }}>
            <FooterChip>Viewing v{displayVersion}</FooterChip>
            {pbisLow && <FooterChip warn>⚠ Pt. bi-serial {question.pbis?.toFixed(2)}</FooterChip>}
            {question.layout && (
              <FooterChip>{question.layout === 'split' ? 'Split view' : 'Stacked'}</FooterChip>
            )}
          </div>
          <Button variant="outline" size="sm">
            Remove from section
          </Button>
          <Button
            size="sm"
            onClick={() => { onEdit(question.id); onOpenChange(false) }}
            className="gap-1.5"
          >
            <i className="fa-light fa-pen" aria-hidden="true" />
            Edit question
          </Button>
        </div>
      </SheetContent>
    </Sheet>
  )
}
```

- [ ] **Step 10: Check TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 11: Commit**

```bash
git add app/\(app\)/assessment-builder/question-detail-sheet.tsx
git commit -m "feat(builder): extract QuestionDetailSheet to own file with tabs (Details/Stats/Versions/Collaborators), pbi chip, layout-aware preview, version history"
```

---

### Task 4: Wire new component into assessment-builder-client.tsx

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

The wiring at lines 772-778 stays unchanged. Only the import changes and the inline function at lines 3433-3538 is removed.

- [ ] **Step 1: Add import at the top of `assessment-builder-client.tsx`**

Find the existing imports block (first ~30 lines). After the last local component import (e.g., after `step2-health-panel` or `step2-inline-editor`), add:

```typescript
import { QuestionDetailSheet } from './question-detail-sheet'
```

- [ ] **Step 2: Delete the inline `QuestionDetailSheet` function**

Remove lines 3433–3538 (the comment `// ─── Question detail Sheet` through the closing `}` of the function). The code at line 772 (`<QuestionDetailSheet .../>`) stays exactly as-is.

Verify the line range first:
```bash
grep -n "Question detail Sheet\|function QuestionDetailSheet" "/Users/romitsoley/Work/apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx"
```

Then delete those lines in the editor.

- [ ] **Step 3: TypeScript check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors

- [ ] **Step 4: Visual test — start dev server and open the builder**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm dev
```

Open http://localhost:3001. Navigate to Assessment Builder → Step 2. Click on a question in the sections outline. Verify:
- Sheet opens at ~82% width
- Header shows question title, version dropdown (if multiple versions), pbi chip, Edit button
- Details tab shows question preview in its configured layout (stacked or split) with per-option rationale
- Details right panel shows quick stats, folder breadcrumbs, classification tags
- Stats tab shows performance tiles, pbi bar, option distribution table, question config tiles
- Versions tab shows timeline with "Viewing" badge on current version and "View this version" links on others
- Collaborators tab shows access list with role badges
- Footer shows "Viewing v3", layout chip, Remove and Edit buttons

For a question with low pbi (< 0.20):
- Header pbi chip is red with ⚠ prefix
- Stats tab label shows ⚠ icon
- Stats tab shows red warning banner
- Details right panel shows inline callout

- [ ] **Step 5: Commit**

```bash
git add "app/(app)/assessment-builder/assessment-builder-client.tsx"
git commit -m "feat(builder): wire QuestionDetailSheet import, remove 103-line inline function"
```

---

## Self-Review

**Spec coverage:**
- ✅ Header: title, version selector, pbi chip (colored), Edit button — Task 3 Step 9
- ✅ Pt. bi-serial warning: header chip, Stats tab ⚠, Stats warning banner, Details inline callout — Task 3 Steps 2, 6, 9
- ✅ Details tab two-column: preview (stacked and split layouts) + right panel (quick stats, location, classification) — Task 3 Step 5
- ✅ Stats tab: performance grid, pbi bar with zone markers, option distribution table, question config tiles — Task 3 Step 6
- ✅ Versions tab: timeline, "Viewing" badge, "View this version" links, per-version authorship — Task 3 Step 7
- ✅ Collaborators tab: access list with owner/edit/view badges — Task 3 Step 8
- ✅ Footer: version chip, pbi warn chip, layout chip, Remove, Edit — Task 3 Step 9
- ✅ No "Current" version badge — replaced by "Viewing" — Task 3 Step 7
- ✅ Neutral correct answer (left border + ✓ text, no fill) — Task 3 Step 4
- ✅ QB location breadcrumbs (multiple paths if extraFolders) — Task 3 Step 5
- ✅ Essay question: rubric instead of options, no pbi chip, manual grading chip in header — Task 3 Steps 5, 6, 9
- ✅ WCAG AA: all font sizes via text-xs (12px) minimum, no inline px below 12 — verified in OptionPreview and all sub-tabs

**Placeholder scan:** No TBDs, no "implement later", no vague steps. Every step contains code or exact commands.

**Type consistency:** `QuestionVersionEntry`, `QuestionOption`, `QuestionCollaborator` defined in Task 1 and used correctly in Tasks 2 and 3. `versionHistory` (not `versions`) used consistently throughout.
