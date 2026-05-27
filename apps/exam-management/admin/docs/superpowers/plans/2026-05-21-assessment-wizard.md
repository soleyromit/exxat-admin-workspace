# Assessment Wizard — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the cluttered assessment builder selector bar + assessment list sidebar with a clean 3-step wizard (Details → Build → Review), matching the Employment Hero / Kajabi patterns from Mobbin research.

**Architecture:** All changes are in `assessment-builder-client.tsx`. New components are added as private functions at the top of the file. An `activeStep: 1 | 2 | 3` state controls which step is visible. Step 2 replaces the `ABAssessmentList` (assessment list sidebar) with a `SelectedQuestionsOutline` (ordered list of selected questions), and moves the footer `ABDiffChart` metrics to a right-side `MetricsPanel`. Step 1 and Step 3 are full-width forms.

**Tech Stack:** Next.js 15 `'use client'`, Exxat DS (`@exxat/ds/packages/ui/src`), existing `AssessmentDraft` + `AssessmentSettings` types from `lib/qb-types.ts`.

---

## Context for every task

- **File to modify:** `app/(app)/assessment-builder/assessment-builder-client.tsx` (currently ~1,350 lines)
- **Working dir:** `/Users/romitsoley/Work/apps/exam-management/admin/`
- **DS imports:** `import { Button, Badge, Input, Separator, … } from '@exxat/ds/packages/ui/src'`
- **No hardcoded hex/rgb** — always `var(--token)`
- **FA icons:** `aria-hidden="true"` on all decorative icons
- **`'use client'`** already at top of file — do not add again
- **No test suite** — verify by type-checking with `npx tsc --noEmit`
- **Read the full file before making any changes in each task**

---

## Files touched

| File | Action |
|---|---|
| `app/(app)/assessment-builder/assessment-builder-client.tsx` | Modify — all wizard tasks |

---

## Wizard layout summary

```
Step 1 — Details (full-width form)
  left col:  Assessment name (input) + description (textarea, optional)
  right col: Type buttons (Exam/Quiz/Assignment) + Duration + Password + Randomize + Show Rationale
  footer:    [Cancel]  [Continue →]

Step 2 — Build (3-panel canvas)
  left 200px:  SelectedQuestionsOutline — ordered list of picked questions, section grouping
  center flex: ABQuestionPicker (existing, unchanged)
  right 220px: MetricsPanel — difficulty bars + Blooms breakdown + time estimate
  footer:      [← Back]  [Save draft]  [Review →]

Step 3 — Review (full-width summary)
  Summary card: name, type, Q count, duration, password, randomize
  Difficulty distribution (mini bars)
  Sections breakdown
  footer: [← Back to Build]  [Save as draft]  [Send to chair →]
```

---

## Task 1: WizardHeader component + `activeStep` state

**What:** Add `activeStep` state and a `WizardHeader` component that replaces the current selector bar (Course + Offering dropdowns). Shows breadcrumb + 3 clickable step indicators + Save draft button.

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `activeStep` state to `AssessmentBuilderClient`**

Find the block of `useState` declarations in `AssessmentBuilderClient` (around line 268). Add:

```tsx
const [activeStep, setActiveStep] = useState<1 | 2 | 3>(1)
```

- [ ] **Step 2: Add `WizardHeader` component** — paste this before the `// ── Assessment settings sheet` comment:

```tsx
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
          const isClickable = step.id < activeStep   // can go back, not forward

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
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  padding: '4px 10px',
                  borderRadius: 20,
                  border: '1px solid',
                  borderColor: isActive ? 'var(--brand-color)' : isCompleted ? 'var(--brand-color)' : 'var(--border)',
                  backgroundColor: isActive
                    ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))'
                    : isCompleted ? 'color-mix(in oklch, var(--brand-color) 6%, var(--background))'
                    : 'transparent',
                  color: isActive ? 'var(--brand-color)' : isCompleted ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  fontSize: 12,
                  fontWeight: isActive ? 600 : 400,
                  cursor: isClickable ? 'pointer' : 'default',
                  background: 'none',
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
```

Note: `React` needs to be imported for `React.Fragment`. Check the existing imports — if only destructured hooks are imported (`import { useState, … } from 'react'`), add `import React from 'react'` or change to `import React, { useState, … } from 'react'`.

- [ ] **Step 3: Verify types compile**

```bash
npx tsc --noEmit
```

Expected: clean (no output).

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard): add WizardHeader + activeStep state"
```

---

## Task 2: DetailsStep component (Step 1)

**What:** A full-width 2-column form for assessment name + settings. Left col = name + description. Right col = type picker, duration, password, randomize, show rationale. Writes directly to `activeAsmt` via `onUpdate`. Has Continue button.

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `DetailsStep` component** — paste before `WizardHeader`:

```tsx
// ── Details step (wizard step 1) ─────────────────────────────────────────────

function DetailsStep({
  activeAsmt,
  courseLabel,
  offeringLabel,
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
  courseLabel: string
  offeringLabel: string
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
  const settings = activeAsmt?.settings ?? { type: 'Exam' as const, passwordRequired: false, password: '', randomize: false, showRationaleAfter: true }
  const duration = activeAsmt?.durationMinutes ?? 90

  const TYPES: import('@/lib/qb-types').AssessmentType[] = ['Exam', 'Quiz', 'Assignment']

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
            width: 16, height: 16, borderRadius: '50%', backgroundColor: 'white',
            transition: 'left .15s', display: 'block',
          }} />
        </button>
      </div>
    )
  }

  const offerings = mockCourseOfferingsLocal.filter(o => o.courseId === courseId)
  const canContinue = name.trim().length > 0

  return (
    <div className="flex flex-col flex-1 overflow-auto">
      {/* Context (course + offering) */}
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
              value={name}
              onChange={e => onUpdate({ title: e.target.value })}
              placeholder="e.g. Midterm Exam"
              autoFocus
              style={{
                width: '100%', height: 44, padding: '0 14px', fontSize: 16, fontWeight: 500,
                border: '1px solid var(--border)', borderRadius: 10,
                background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
              }}
              onFocus={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--brand-color)' }}
              onBlur={e => { (e.target as HTMLInputElement).style.borderColor = 'var(--border)' }}
            />
          </div>
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Description <span className="font-normal normal-case tracking-normal text-[11px]">— optional, shown to students before they start</span></p>
            <textarea
              placeholder="Brief context about what this assessment covers…"
              rows={5}
              style={{
                width: '100%', padding: '10px 14px', fontSize: 14, lineHeight: '1.5',
                border: '1px solid var(--border)', borderRadius: 10, resize: 'vertical',
                background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
              }}
              onFocus={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--brand-color)' }}
              onBlur={e => { (e.target as HTMLTextAreaElement).style.borderColor = 'var(--border)' }}
            />
          </div>
        </div>

        {/* Right — settings */}
        <div className="flex flex-col gap-5">
          {/* Type */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Type</p>
            <div className="flex gap-2">
              {TYPES.map(t => (
                <button
                  key={t}
                  type="button"
                  onClick={() => patchSettings({ type: t })}
                  className="flex-1 rounded-lg border py-2.5 text-sm font-medium transition-colors"
                  style={{
                    borderColor: settings.type === t ? 'var(--brand-color)' : 'var(--border)',
                    backgroundColor: settings.type === t
                      ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))'
                      : 'transparent',
                    color: settings.type === t ? 'var(--brand-color)' : 'var(--muted-foreground)',
                  }}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Duration */}
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-2">Duration</p>
            <div className="flex items-center gap-2">
              <input
                type="number"
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
              />
              <span className="text-sm text-muted-foreground">minutes</span>
            </div>
          </div>

          <Separator />

          {/* Toggles */}
          <div className="flex flex-col gap-4">
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
                  height: 36, padding: '0 12px', fontSize: 13, marginTop: -8,
                  border: '1px solid var(--border)', borderRadius: 8,
                  background: 'var(--background)', color: 'var(--foreground)', outline: 'none', width: '100%',
                }}
              />
            )}
            <Toggle
              checked={settings.randomize}
              onChange={v => patchSettings({ randomize: v })}
              label="Randomize question order"
              description="Each student sees questions in a different order."
            />
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard): add DetailsStep component (Step 1)"
```

---

## Task 3: SelectedQuestionsOutline + MetricsPanel (Step 2 panels)

**What:** `SelectedQuestionsOutline` shows the ordered list of selected questions (replaces `ABAssessmentList`). `MetricsPanel` shows difficulty distribution + Blooms + time estimate (extracted from `ABDiffChart` footer).

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `SelectedQuestionsOutline` component** — paste before `DetailsStep`:

```tsx
// ── Selected questions outline (Step 2 left panel) ───────────────────────────

function SelectedQuestionsOutline({
  activeAsmt,
  onRemove,
}: {
  activeAsmt: import('@/lib/qb-types').AssessmentDraft
  onRemove: (questionId: string) => void
}) {
  const orderedQuestions = [...activeAsmt.questions].sort((a, b) => a.order - b.order)

  // Group by section if sections exist
  const sectionById = Object.fromEntries(activeAsmt.sections.map(s => [s.id, s]))
  const hasNoSections = activeAsmt.sections.length === 0

  // Build display list: if sections exist, group; else flat
  const displayItems: Array<
    | { kind: 'section'; id: string; title: string; count: number }
    | { kind: 'question'; questionId: string; order: number; question: import('@/lib/qb-types').Question | undefined; sectionTitle?: string }
  > = []

  if (hasNoSections) {
    orderedQuestions.forEach(aq => {
      displayItems.push({
        kind: 'question',
        questionId: aq.questionId,
        order: aq.order,
        question: MOCK_QB_QUESTIONS.find(q => q.id === aq.questionId),
      })
    })
  } else {
    activeAsmt.sections.forEach(section => {
      const sectionQs = orderedQuestions.filter(aq => section.questionIds.includes(aq.questionId))
      displayItems.push({ kind: 'section', id: section.id, title: section.title, count: sectionQs.length })
      sectionQs.forEach(aq => {
        displayItems.push({
          kind: 'question',
          questionId: aq.questionId,
          order: aq.order,
          question: MOCK_QB_QUESTIONS.find(q => q.id === aq.questionId),
          sectionTitle: section.title,
        })
      })
    })
    // Unassigned
    const assignedIds = new Set(activeAsmt.sections.flatMap(s => s.questionIds))
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
                <div key={`section-${item.id}`} className="mt-3 mb-1 px-2">
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
```

- [ ] **Step 2: Add `MetricsPanel` component** — paste right after `SelectedQuestionsOutline`:

```tsx
// ── Metrics panel (Step 2 right panel — extracted from ABDiffChart) ──────────

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
        <p className="text-xs text-muted-foreground">{durationMinutes} min · {timeMetrics.avgMin > 0 ? `~${Math.round(timeMetrics.avgMin * 10) / 10} min/Q` : 'no questions'}</p>
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
          <p className="text-[10px] font-bold uppercase tracking-[.07em] text-muted-foreground mb-2">Bloom's</p>
          <div className="flex flex-col gap-1.5">
            {bloomsMetrics.slice(0, 5).map(b => (
              <div key={b.level} className="flex items-center gap-2">
                <div className="flex-1 bg-muted rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-1.5 rounded-full"
                    style={{
                      width: `${b.pct}%`,
                      backgroundColor: 'var(--brand-color)',
                      opacity: 0.7,
                      transition: 'width .3s',
                    }}
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
```

- [ ] **Step 3: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 4: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard): add SelectedQuestionsOutline + MetricsPanel for Step 2"
```

---

## Task 4: ReviewStep component (Step 3)

**What:** A full-width summary screen showing assessment details, difficulty distribution, Blooms, and section breakdown before sending to chair.

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `ReviewStep` component** — paste before `DetailsStep`:

```tsx
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
}: {
  activeAsmt: import('@/lib/qb-types').AssessmentDraft
  courseLabel: string
  distribution: { Easy: number; Medium: number; Hard: number }
  bloomsMetrics: { level: string; count: number; pct: number }[]
  timeMetrics: { totalMin: number; avgMin: number }
  onBack: () => void
  onSaveAsDraft: () => void
  onSendToChair: () => void
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
              style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', color: 'var(--brand-color)' }}
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
            <div className="flex items-center gap-4">
              {bars.map(bar => (
                <div key={bar.label} className="flex items-center gap-2 flex-1">
                  <div
                    className="h-2.5 rounded-full flex-1"
                    style={{
                      backgroundColor: bar.color,
                      opacity: bar.count === 0 ? 0.15 : 0.8,
                      width: `${totalQ > 0 ? (bar.count / totalQ) * 100 : 0}%`,
                      minWidth: bar.count > 0 ? 8 : 0,
                    }}
                  />
                  <span className="text-xs text-muted-foreground shrink-0">{bar.label}</span>
                  <span className="text-xs font-semibold text-foreground shrink-0 tabular-nums">{bar.count}</span>
                </div>
              ))}
            </div>
            <p className="text-xs text-muted-foreground mt-3">
              Estimated time: ~{Math.round(timeMetrics.totalMin)} min total · ~{Math.round(timeMetrics.avgMin * 10) / 10} min per question
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

        {/* Blooms */}
        {bloomsMetrics.length > 0 && (
          <div className="rounded-xl border border-border bg-card p-5">
            <p className="text-xs font-bold uppercase tracking-[0.08em] text-muted-foreground mb-3">Bloom's taxonomy coverage</p>
            <div className="flex flex-col gap-2">
              {bloomsMetrics.map(b => (
                <div key={b.level} className="flex items-center gap-3">
                  <span className="text-xs text-muted-foreground w-20 shrink-0">{b.level}</span>
                  <div className="flex-1 bg-muted rounded-full h-2 overflow-hidden">
                    <div
                      className="h-2 rounded-full"
                      style={{ width: `${b.pct}%`, backgroundColor: 'var(--brand-color)', opacity: 0.7, transition: 'width .3s' }}
                    />
                  </div>
                  <span className="text-xs text-foreground font-medium tabular-nums w-8 text-right">{b.pct}%</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {totalQ === 0 && (
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
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
```

- [ ] **Step 2: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean.

- [ ] **Step 3: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard): add ReviewStep component (Step 3)"
```

---

## Task 5: Wire wizard into `AssessmentBuilderClient`

**What:** Replace the current selector bar + `ABAssessmentList` render with the wizard. Conditionally render `DetailsStep` (step 1), `SelectedQuestionsOutline` + `ABQuestionPicker` + `MetricsPanel` (step 2), or `ReviewStep` (step 3). Remove `ABDiffChart` from the footer (its data moves to `MetricsPanel`). Keep `SectionsPanel`, `AiGenerateModal`, `AssessmentSettingsSheet`.

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `removeQuestion` helper to `AssessmentBuilderClient`**

The `SelectedQuestionsOutline` needs an `onRemove` handler. Add this after `assignQuestionToSection` (around line 253):

```tsx
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
```

- [ ] **Step 2: Add `handleSaveDraft` and `handleSendToChair` helpers**

After `removeQuestion`, add:

```tsx
function handleSaveDraft() {
  // In a real app, persist to backend. For the demo, show a LocalBanner.
  // The assessment is already in activeAsmt state — just navigate back.
  router.push('/courses')
}

function handleSendToChair() {
  // Route to the assessment landing page which has the send-to-chair flow.
  if (activeAsmt) {
    router.push(`/assessments/${activeAsmt.id}`)
  }
}
```

- [ ] **Step 3: Add `courseLabel` derived value**

Near the top of the component body (after `setCourseId` etc.), add:

```tsx
const currentCourse  = mockCourses.find(c => c.id === courseId)
const currentOffering = mockCourseOfferings.find(o => o.id === offeringId)
const courseLabel = currentCourse
  ? `${currentCourse.code} · ${currentOffering?.semester ?? ''}`
  : ''
```

- [ ] **Step 4: Replace the main return JSX**

The current return starts with `<div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>`. Replace the entire return with:

```tsx
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
        courseLabel={courseLabel}
        offeringLabel={currentOffering?.semester ?? ''}
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
              // Create a new assessment on first detail entry
              return {
                id: `asmt-new-${Date.now()}`,
                title: patch.title ?? 'New Assessment',
                courseId,
                offeringId,
                questions: [],
                durationMinutes: patch.durationMinutes ?? 90,
                sections: [],
                settings: patch.settings ?? { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true },
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

    {/* Step 2 — Build (3-panel canvas) */}
    {activeStep === 2 && activeAsmt && (
      <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
        {/* Left: selected questions outline */}
        <SelectedQuestionsOutline
          activeAsmt={activeAsmt}
          onRemove={removeQuestion}
        />

        {/* Center: question picker */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
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
            sectionsOpen={sectionsOpen}
            onToggleSections={() => setSectionsOpen(p => !p)}
          />
          {sectionsOpen && (
            <SectionsPanel
              activeAsmt={activeAsmt}
              onAddSection={addSection}
              onRemoveSection={removeSection}
              onAssignQuestion={assignQuestionToSection}
            />
          )}
          {/* Step 2 footer */}
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
        </div>

        {/* Right: metrics panel */}
        <MetricsPanel
          distribution={distribution}
          timeMetrics={timeMetrics}
          overtimeMetrics={overtimeMetrics}
          durationMinutes={activeAsmt.durationMinutes}
          bloomsMetrics={bloomsMetrics}
        />
      </div>
    )}

    {/* Step 2 — no active assessment yet (shouldn't happen if coming from Step 1) */}
    {activeStep === 2 && !activeAsmt && (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <Button size="sm" onClick={() => setActiveStep(1)}>← Go back to Details</Button>
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
      />
    )}

    {/* Sheets + modals — always mounted so they survive step transitions */}
    <AiGenerateModal
      open={aiOpen}
      onOpenChange={setAiOpen}
      objectives={courseObjectives.filter(o => o.courseId === activeAsmt?.courseId && !o.lastAssessed)}
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
      settings={activeAsmt?.settings ?? { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true }}
      onSave={(s) => setActiveAsmt(prev => prev ? { ...prev, settings: s } : prev)}
    />
  </div>
)
```

Note: `distribution`, `timeMetrics`, `overtimeMetrics`, `bloomsMetrics` are `useMemo` values already computed in `AssessmentBuilderClient`. Verify these variable names match what's already in the file — they were used by `ABDiffChart` in the old footer. If any are not declared at the component level, move them up from `ABQuestionPicker`'s local scope to the parent.

- [ ] **Step 5: Remove `ABDiffChart` call from inside `ABQuestionPicker`**

Find the `ABDiffChart` JSX render call inside `ABQuestionPicker` (in the footer area). Delete it — the metrics now live in `MetricsPanel` at the wizard level. Also remove the `saveConfirmed` state and `onSave`/`onCancel` props from `ABQuestionPicker` if they were only for the chart.

- [ ] **Step 6: Type-check**

```bash
npx tsc --noEmit
```

Expected: clean. Fix any variable-not-found errors by moving useMemo computations from `ABQuestionPicker` to `AssessmentBuilderClient`.

- [ ] **Step 7: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(wizard): wire 3-step wizard into AssessmentBuilderClient"
```

---

## Self-Review

### 1. Spec coverage

| Requirement (from Mobbin + transcript) | Task |
|---|---|
| 3-step wizard (Details → Build → Review) with step indicator | Task 1 |
| Step 1: name, type, duration, password, randomize, show rationale | Task 2 |
| Step 2: selected questions outline on left | Task 3 |
| Step 2: metrics panel on right (off the footer) | Task 3 |
| Step 3: summary before sending to chair | Task 4 |
| Back navigation (can go back from any step) | Task 5 |
| Save draft always available | Task 1 (WizardHeader) |
| Send to chair routes to assessment landing | Task 4 + Task 5 |
| Sections shown in review | Task 4 |
| Blooms shown in review + metrics panel | Tasks 3 + 4 |

### 2. Placeholder scan

No TBD, TODO, or "similar to Task N" patterns. All code is complete.

### 3. Type consistency

- `AssessmentDraft` (from `lib/qb-types.ts`) — used consistently across all tasks with `.title`, `.settings`, `.questions`, `.sections`, `.durationMinutes`
- `AssessmentSettings` — used in Task 2 DetailsStep patch and Task 4 ReviewStep display
- `removeQuestion` defined in Task 5 Step 1, used in `SelectedQuestionsOutline` (Task 3) via `onRemove` prop — order is fine since Task 3 renders the component while Task 5 wires the props
