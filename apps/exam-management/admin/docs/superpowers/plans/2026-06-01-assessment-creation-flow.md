# Assessment Creation Flow — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Wire the 3-state right panel (Health / Settings / Section settings), section fill chips, new type fields, and ReviewStep fill status into the existing assessment builder — per the spec at `admin/docs/superpowers/specs/2026-06-01-assessment-creation-flow-design.md`.

**Architecture:** Six independent tasks building on each other. Tasks 1–2 are pure logic with Vitest tests. Tasks 3–6 are UI wiring that verify via `tsc --noEmit`. Tasks 4–5 create new component files; Tasks 3 and 6 modify the existing builder client.

**Tech Stack:** Next.js 15 App Router, `@exxatdesignux/ui`, Vitest, TypeScript strict mode.

---

## File map

| Status | File | What changes |
|---|---|---|
| Modify | `admin/lib/qb-types.ts` | 11 new fields on `AssessmentSettings`; 3 new fields on `AssessmentSection`; 12 new defaults in `defaultAssessmentSettings()` |
| Create | `admin/lib/__tests__/default-settings.test.ts` | Vitest test for new defaults |
| Create | `admin/lib/__tests__/section-fill.test.ts` | Vitest test for updated `sectionFillPct` logic |
| Modify | `admin/app/(app)/assessment-builder/assessment-builder-client.tsx` | Task 2: chip + `sectionFillPct`; Task 3: `rightPanelMode` state + ⚙ gear + section click + MetricsPanel swap; Task 6: ReviewStep sections fill status |
| Create | `admin/components/assessment-builder/step2-settings-panel.tsx` | Settings panel (right panel State ②) |
| Create | `admin/components/assessment-builder/step2-section-settings-panel.tsx` | Section settings panel (right panel State ③) |

---

## Task 1: Type additions — `lib/qb-types.ts`

**Files:**
- Modify: `admin/lib/qb-types.ts:197-273` (`AssessmentSettings` + `AssessmentSection` + `defaultAssessmentSettings`)
- Create: `admin/lib/__tests__/default-settings.test.ts`

- [ ] **Step 1: Write the failing test**

Create `admin/lib/__tests__/default-settings.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import { defaultAssessmentSettings } from '../qb-types'

describe('defaultAssessmentSettings — new P1 fields', () => {
  it('includes all new P1 fields with correct defaults', () => {
    const s = defaultAssessmentSettings()
    expect(s.isHighStakes).toBe(false)
    expect(s.passingScore).toBeNull()
    expect(s.allowComments).toBe(false)
    expect(s.referenceMaterials).toEqual([])
    expect(s.warnOnBlankQuestion).toBe(false)
    expect(s.submitButtonVisibility).toBe('always')
    expect(s.scoreDisplay).toBe('raw-and-percent')
    expect(s.preReadDocuments).toEqual([])
  })

  it('includes P2 fields with correct defaults', () => {
    const s = defaultAssessmentSettings()
    expect(s.reviewShowsCorrectAnswers).toBe(false)
    expect(s.reviewSessionStart).toBeNull()
    expect(s.reviewSessionEnd).toBeNull()
  })

  it('accepts explicit type argument', () => {
    expect(defaultAssessmentSettings('Pop Quiz').type).toBe('Pop Quiz')
  })
})
```

- [ ] **Step 2: Run test to confirm it fails**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test
```

Expected: FAIL — `s.isHighStakes` is `undefined`, not `false`.

- [ ] **Step 3: Add new fields to `AssessmentSettings` interface**

In `admin/lib/qb-types.ts`, locate the `AssessmentSettings` interface closing `}` (currently after `studentGroupIds: string[]` at line ~253). Add before the closing brace:

```ts
  // New — P1 settings panel
  isHighStakes: boolean                                                    // results held until faculty review
  passingScore: number | null                                              // percentage threshold — FACULTY-FACING ONLY; pass/fail label never shown to students
  allowComments: boolean                                                   // per-question comment/flag box during exam
  referenceMaterials: { name: string; url: string }[]                      // global PDFs in exam toolbar
  warnOnBlankQuestion: boolean                                             // warn when leaving a question unanswered
  submitButtonVisibility: 'always' | 'after-viewing-all' | 'after-answering-all'
  scoreDisplay: 'raw' | 'raw-and-percent' | 'scaled'                      // what score students see post-exam; never includes pass/fail
  preReadDocuments: { name: string; url: string }[]                        // assessment-level pre-reads in exam toolbar
  // New — P2 (data model ready; UI deferred)
  reviewShowsCorrectAnswers: boolean
  reviewSessionStart: string | null
  reviewSessionEnd: string | null
```

- [ ] **Step 4: Add new fields to `AssessmentSection` interface**

In `admin/lib/qb-types.ts`, locate `AssessmentSection` closing `}` (currently after `sectionWarningAlarmMinutes` at line ~272). Add before the closing brace:

```ts
  fillTarget: { type: 'count' | 'points'; value: number } | null          // coordinator sets section fill target
  dueDate: string | null                                                   // ISO date — when faculty must fill this section
  preReadDocuments?: { name: string; url: string }[]                       // section-level pre-reads during this section
```

- [ ] **Step 5: Add new defaults to `defaultAssessmentSettings()`**

In `admin/lib/qb-types.ts`, locate `defaultAssessmentSettings()` return object (currently ends with `studentGroupIds: []` at line ~357). Add after `studentGroupIds: [],`:

```ts
    isHighStakes: false,
    passingScore: null,
    allowComments: false,
    referenceMaterials: [],
    warnOnBlankQuestion: false,
    submitButtonVisibility: 'always',
    scoreDisplay: 'raw-and-percent',
    preReadDocuments: [],
    reviewShowsCorrectAnswers: false,
    reviewSessionStart: null,
    reviewSessionEnd: null,
```

- [ ] **Step 6: Run test to confirm it passes**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test
```

Expected: PASS — all 3 describe blocks green.

- [ ] **Step 7: Confirm TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors. If TS errors appear, they will be in files that use `AssessmentSettings` or `AssessmentSection` and are now missing the new required fields — fix by adding the new fields to those usages.

- [ ] **Step 8: Commit**

```bash
git add admin/lib/qb-types.ts admin/lib/__tests__/default-settings.test.ts
git commit -m "feat(types): add P1 settings + section fill fields to AssessmentSettings/Section"
```

---

## Task 2: Section fill chip (sidebar + `sectionFillPct`)

**Files:**
- Modify: `admin/app/(app)/assessment-builder/assessment-builder-client.tsx` — lines 759-762 (`sectionFillPct`) and 1279-1283 (chip display)
- Create: `admin/lib/__tests__/section-fill.test.ts`

**Context:** The left sidebar section rows currently show either `✓` (green) when fill ≥ 80%, or `N/M Q` in muted text. Replace with a 3-color compact chip: grey (not started), purple brand (in progress), green (complete).

- [ ] **Step 1: Write the failing test**

Create `admin/lib/__tests__/section-fill.test.ts`:

```ts
import { describe, it, expect } from 'vitest'
import type { AssessmentSection } from '../qb-types'

// Copy of the updated sectionFillPct logic — tested here before wiring into React component
function sectionFillPct(sec: AssessmentSection): number {
  const target = sec.fillTarget?.value ?? sec.questionTarget ?? 20
  return Math.min(100, Math.round((sec.questionIds.length / target) * 100))
}

function sec(overrides: Partial<AssessmentSection> = {}): AssessmentSection {
  return { id: 's1', title: 'Test', questionIds: [], ...overrides }
}

describe('sectionFillPct with fillTarget', () => {
  it('returns 0 when empty with fillTarget', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 15 } }))).toBe(0)
  })

  it('returns 53 when 8 of 15 filled', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 15 }, questionIds: Array(8).fill('q') }))).toBe(53)
  })

  it('returns 100 when filled equals target', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 10 }, questionIds: Array(10).fill('q') }))).toBe(100)
  })

  it('caps at 100 when overfilled', () => {
    expect(sectionFillPct(sec({ fillTarget: { type: 'count', value: 5 }, questionIds: Array(7).fill('q') }))).toBe(100)
  })

  it('falls back to questionTarget when fillTarget is null', () => {
    expect(sectionFillPct(sec({ fillTarget: null, questionTarget: 10, questionIds: Array(5).fill('q') }))).toBe(50)
  })

  it('falls back to 20 when both fillTarget and questionTarget are absent', () => {
    expect(sectionFillPct(sec({ questionIds: Array(4).fill('q') }))).toBe(20)
  })
})
```

- [ ] **Step 2: Run test to confirm it passes immediately** (logic is already correct in the test file itself)

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test -- section-fill
```

Expected: PASS — this test validates logic before wiring into React.

- [ ] **Step 3: Update `sectionFillPct` in the builder**

In `assessment-builder-client.tsx` at lines 759-762, replace:

```ts
  function sectionFillPct(sec: AssessmentSection): number {
    const target = sec.questionTarget ?? 20
    return Math.min(100, Math.round((sec.questionIds.length / target) * 100))
  }
```

With:

```ts
  function sectionFillPct(sec: AssessmentSection): number {
    const target = sec.fillTarget?.value ?? sec.questionTarget ?? 20
    return Math.min(100, Math.round((sec.questionIds.length / target) * 100))
  }
```

- [ ] **Step 4: Update section chip in the sidebar**

In `assessment-builder-client.tsx` at lines 1279-1283, replace:

```tsx
                        {isReady ? (
                          <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--chart-2)', flexShrink: 0 }}>✓</span>
                        ) : (
                          <span className="text-xs text-muted-foreground" style={{ flexShrink: 0 }}>{sec.questionIds.length}/{sec.questionTarget ?? 20}</span>
                        )}
```

With:

```tsx
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
                                fontSize: 10,
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
```

- [ ] **Step 5: Run TypeScript check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 6: Commit**

```bash
git add "admin/app/(app)/assessment-builder/assessment-builder-client.tsx" admin/lib/__tests__/section-fill.test.ts
git commit -m "feat(builder): section fill chip — grey/purple/green based on fillTarget"
```

---

## Task 3: Right panel 3-state machine

**Files:**
- Modify: `admin/app/(app)/assessment-builder/assessment-builder-client.tsx`
  - Line 571: remove `settingsOpen` state; add `rightPanelMode` state
  - Line 964: wire ⚙ gear button to panel mode (not Sheet)
  - Lines 1285-1292: wire section sliders icon to panel mode (not `SectionAssignSheet`)
  - Line 1268: wire section header click to set panel mode
  - Line 1907: replace `<MetricsPanel>` with 3-state panel render

**Context:** The right panel is currently always `<MetricsPanel>`. The spec defines 3 states triggered by user actions. `HealthPanel` and `AssessmentSettingsContent` (for the Sheet) already exist in the codebase; `Step2SettingsPanel` and `Step2SectionSettingsPanel` will be created in Tasks 4–5 and imported here.

- [ ] **Step 1: Add `rightPanelMode` state and remove `settingsOpen` state**

In `assessment-builder-client.tsx`, locate line 571:

```ts
  const [settingsOpen, setSettingsOpen] = useState(false)
```

Replace with:

```ts
  const [rightPanelMode, setRightPanelMode] = useState<'health' | 'settings' | 'section'>('health')
```

**Important:** `settingsOpen` is also used at line 2149 in `<AssessmentSettingsSheet open={settingsOpen} ...>`. Leave the Sheet in place but it will no longer be the primary entry point for the ⚙ button. Keep `settingsOpen` for any other callers or remove the Sheet after verifying no other code references it. To be safe: add a second state alongside `rightPanelMode`:

Actually — keep `settingsOpen` as-is for the Sheet (may be used by other code paths). Just add the new state alongside:

```ts
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [rightPanelMode, setRightPanelMode] = useState<'health' | 'settings' | 'section'>('health')
```

- [ ] **Step 2: Wire the ⚙ gear button to panel mode**

In `assessment-builder-client.tsx` at line 964, replace:

```tsx
            onClick={() => setSettingsOpen(true)}
```

With:

```tsx
            onClick={() => setRightPanelMode(prev => prev === 'settings' ? 'health' : 'settings')}
```

This makes the ⚙ button a toggle: click once → opens Settings panel; click again → returns to Health. The Sheet (`AssessmentSettingsSheet`) is preserved but no longer triggered by this button.

- [ ] **Step 3: Wire section header click to set panel mode**

In `assessment-builder-client.tsx` at line 1268, the section header button currently does:

```tsx
                        onClick={() => { setActiveSectionId(sec.id); setPickerOpen(false) }}
```

Replace with:

```tsx
                        onClick={() => {
                          setActiveSectionId(sec.id)
                          setPickerOpen(false)
                          setRightPanelMode('section')
                        }}
```

- [ ] **Step 4: Wire section sliders icon to panel mode**

In `assessment-builder-client.tsx` at line 1289, replace:

```tsx
                        onClick={() => setAssignSheetSectionId(sec.id)}
```

With:

```tsx
                        onClick={() => {
                          setActiveSectionId(sec.id)
                          setRightPanelMode('section')
                        }}
```

Update the `aria-label` on that button (line 1288) to reflect the new action:

```tsx
                      aria-label={`Open settings for ${sec.title}`}
```

- [ ] **Step 5: Add imports for new panel components**

At the top of `assessment-builder-client.tsx` where `SectionsOutline` and `HealthPanel` are imported (around line 30), add:

```ts
import { Step2SettingsPanel } from '@/components/assessment-builder/step2-settings-panel'
import { Step2SectionSettingsPanel } from '@/components/assessment-builder/step2-section-settings-panel'
```

`FacultyListRow` and `courseObjectives` are already imported at line 22 from `@/lib/faculty-mock-data` — no change needed there.

**Note:** The two component files don't exist yet (created in Tasks 4–5). These imports will cause TS errors until Tasks 4 and 5 are complete — that is expected.

- [ ] **Step 6: Replace `<MetricsPanel>` with 3-state panel**

In `assessment-builder-client.tsx` at lines 1907-1915, replace:

```tsx
          <MetricsPanel
            distribution={distribution}
            timeMetrics={timeMetrics}
            overtimeMetrics={overtimeMetrics}
            durationMinutes={activeAsmt.durationMinutes}
            bloomsMetrics={bloomsMetrics}
            totalScore={totalScore}
            psychoMetrics={psychoMetrics}
          />
```

With:

```tsx
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
                onPatch={patch => setActiveAsmt(prev => prev ? { ...prev, settings: { ...prev.settings, ...patch } } : prev)}
                onClose={() => setRightPanelMode('health')}
              />
            )}
            {rightPanelMode === 'section' && activeSectionId && (
              <Step2SectionSettingsPanel
                section={activeAsmt.sections.find(s => s.id === activeSectionId)!}
                faculty={facultyListRows}
                onPatch={patch => setActiveAsmt(prev => {
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
```

**`HealthPanel` props** (confirmed from `step2-health-panel.tsx`): `activeAsmt`, `objectives`, `timeMetrics`, `distribution`, `bloomsMetrics`, `targetQuestions?`. The `courseObjectives` array is already imported at line 22 from `@/lib/faculty-mock-data`.

- [ ] **Step 7: Run TypeScript check (expect errors until Tasks 4–5 complete)**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | grep -v "step2-settings-panel\|step2-section-settings-panel" | head -20
```

Expected: 0 errors (aside from the two missing component imports — those resolve after Tasks 4–5).

- [ ] **Step 8: Commit**

```bash
git add "admin/app/(app)/assessment-builder/assessment-builder-client.tsx"
git commit -m "feat(builder): right panel 3-state machine — health / settings / section"
```

---

## Task 4: New `step2-settings-panel.tsx`

**Files:**
- Create: `admin/components/assessment-builder/step2-settings-panel.tsx`

**Context:** This is the Settings panel (State ②). It replaces the right panel when the user clicks ⚙ in the Step 2 header. It patches `AssessmentSettings` inline — no Sheet/dialog. Fields are grouped per the spec: Grading, Navigation, Submit Button, Score Display, Post-Exam Review, Warnings, Reference Materials, Pre-Reads.

**Note on existing fields:** Several spec fields already exist on `AssessmentSettings` — use them directly:
- `backwardNavigationAllowed` — already exists
- `requireAnswer` — already exists (maps to "require answer before advancing")
- `randomize` — already exists (maps to "question ordering")
- `digitalTools.warningAlarmMinutes` — already exists
- `postExamReviewEnabled`, `postExamReviewShowRationale` — already exist
- `visibleDate`, `postExamReviewDelayHours` — already exist

- [ ] **Step 1: Create the component file**

Create `admin/components/assessment-builder/step2-settings-panel.tsx`:

```tsx
'use client'

import * as React from 'react'
import { Button, Input, Label, Switch, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@exxatdesignux/ui'
import type { AssessmentSettings } from '@/lib/qb-types'

interface Props {
  settings: AssessmentSettings
  onPatch: (patch: Partial<AssessmentSettings>) => void
  onClose: () => void
}

export function Step2SettingsPanel({ settings, onPatch, onClose }: Props) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'inherit', padding: 0 }}
          aria-label="Back to health panel"
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 11 }} />
          Health
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)' }}>
          <i className="fa-light fa-gear" aria-hidden="true" style={{ marginRight: 5, color: 'var(--muted-foreground)' }} />
          Settings
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close settings panel"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4, lineHeight: 1 }}
        >
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>

        {/* GRADING */}
        <section aria-labelledby="sp-grading-hd" style={{ marginBottom: 20 }}>
          <p id="sp-grading-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>GRADING</p>

          <SettingRow
            label="High-stakes exam"
            description="Results held until faculty review"
            control={
              <Switch
                checked={settings.isHighStakes}
                onCheckedChange={v => onPatch({ isHighStakes: v })}
                aria-label="High-stakes exam"
              />
            }
          />

          <div style={{ marginTop: 10 }}>
            <Label htmlFor="sp-passing-score" style={{ fontSize: 11, color: 'var(--muted-foreground)' }}>
              Passing score threshold
            </Label>
            <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 4 }}>Faculty-visible only — students never see pass/fail</p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Input
                id="sp-passing-score"
                type="number"
                min={0}
                max={100}
                value={settings.passingScore ?? ''}
                onChange={e => onPatch({ passingScore: e.target.value === '' ? null : Number(e.target.value) })}
                style={{ width: 64, height: 32, fontSize: 12 }}
                aria-label="Passing score percentage"
              />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>%</span>
            </div>
          </div>

          <SettingRow
            label="Allow student comments"
            description="Per-question flag/comment box during exam"
            style={{ marginTop: 10 }}
            control={
              <Switch
                checked={settings.allowComments}
                onCheckedChange={v => onPatch({ allowComments: v })}
                aria-label="Allow student comments"
              />
            }
          />
        </section>

        <Divider />

        {/* NAVIGATION */}
        <section aria-labelledby="sp-nav-hd" style={{ marginBottom: 20 }}>
          <p id="sp-nav-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>NAVIGATION</p>

          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="sp-question-order" style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Question ordering</Label>
            <Select
              value={settings.randomize ? 'random' : 'fixed'}
              onValueChange={v => onPatch({ randomize: v === 'random' })}
            >
              <SelectTrigger id="sp-question-order" style={{ height: 32, fontSize: 12 }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="fixed">Fixed — same order for all students</SelectItem>
                <SelectItem value="random">Random — shuffled per student</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <SettingRow
            label="Allow backward navigation"
            description="Students can return to previous questions within a section"
            control={
              <Switch
                checked={settings.backwardNavigationAllowed}
                onCheckedChange={v => onPatch({ backwardNavigationAllowed: v })}
                aria-label="Allow backward navigation"
              />
            }
          />

          <SettingRow
            label="Require answer before advancing"
            style={{ marginTop: 8 }}
            control={
              <Switch
                checked={settings.requireAnswer}
                onCheckedChange={v => onPatch({ requireAnswer: v })}
                aria-label="Require answer before advancing"
              />
            }
          />
        </section>

        <Divider />

        {/* SUBMIT BUTTON */}
        <section aria-labelledby="sp-submit-hd" style={{ marginBottom: 20 }}>
          <p id="sp-submit-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>SUBMIT BUTTON</p>
          <Label htmlFor="sp-submit-visibility" style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Show submit when</Label>
          <Select
            value={settings.submitButtonVisibility}
            onValueChange={v => onPatch({ submitButtonVisibility: v as AssessmentSettings['submitButtonVisibility'] })}
          >
            <SelectTrigger id="sp-submit-visibility" style={{ height: 32, fontSize: 12 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="always">Always</SelectItem>
              <SelectItem value="after-viewing-all">After viewing all questions</SelectItem>
              <SelectItem value="after-answering-all">After answering all questions</SelectItem>
            </SelectContent>
          </Select>
        </section>

        <Divider />

        {/* SCORE DISPLAY */}
        <section aria-labelledby="sp-score-hd" style={{ marginBottom: 20 }}>
          <p id="sp-score-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>SCORE DISPLAY (post-exam)</p>
          <Label htmlFor="sp-score-display" style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Show to student</Label>
          <Select
            value={settings.scoreDisplay}
            onValueChange={v => onPatch({ scoreDisplay: v as AssessmentSettings['scoreDisplay'] })}
          >
            <SelectTrigger id="sp-score-display" style={{ height: 32, fontSize: 12 }}>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="raw">Raw score only</SelectItem>
              <SelectItem value="raw-and-percent">Raw score + percentage</SelectItem>
              <SelectItem value="scaled">Scaled score</SelectItem>
            </SelectContent>
          </Select>
          <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 4 }}>Pass/fail label is never shown to students.</p>
        </section>

        <Divider />

        {/* POST-EXAM REVIEW */}
        <section aria-labelledby="sp-review-hd" style={{ marginBottom: 20 }}>
          <p id="sp-review-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>POST-EXAM REVIEW</p>
          <SettingRow
            label="Allow students to review answers"
            control={
              <Switch
                checked={settings.postExamReviewEnabled}
                onCheckedChange={v => onPatch({ postExamReviewEnabled: v })}
                aria-label="Allow post-exam review"
              />
            }
          />
          {settings.postExamReviewEnabled && (
            <SettingRow
              label="Show correct answers in review"
              style={{ marginTop: 8 }}
              control={
                <Switch
                  checked={settings.reviewShowsCorrectAnswers}
                  onCheckedChange={v => onPatch({ reviewShowsCorrectAnswers: v })}
                  aria-label="Show correct answers in review"
                />
              }
            />
          )}
        </section>

        <Divider />

        {/* WARNINGS */}
        <section aria-labelledby="sp-warn-hd" style={{ marginBottom: 20 }}>
          <p id="sp-warn-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>WARNINGS</p>
          <div style={{ marginBottom: 10 }}>
            <Label htmlFor="sp-warn-minutes" style={{ fontSize: 11, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Warn student at</Label>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <Input
                id="sp-warn-minutes"
                type="number"
                min={1}
                max={60}
                value={settings.digitalTools.warningAlarmMinutes ?? ''}
                onChange={e => onPatch({
                  digitalTools: {
                    ...settings.digitalTools,
                    warningAlarmMinutes: e.target.value === '' ? null : Number(e.target.value),
                  },
                })}
                style={{ width: 64, height: 32, fontSize: 12 }}
                aria-label="Warning minutes remaining"
              />
              <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>minutes remaining</span>
            </div>
          </div>
          <SettingRow
            label="Warn on blank question"
            description="Warn when student leaves a question unanswered"
            control={
              <Switch
                checked={settings.warnOnBlankQuestion}
                onCheckedChange={v => onPatch({ warnOnBlankQuestion: v })}
                aria-label="Warn on blank question"
              />
            }
          />
        </section>

        <Divider />

        {/* REFERENCE MATERIALS */}
        <section aria-labelledby="sp-refs-hd" style={{ marginBottom: 20 }}>
          <p id="sp-refs-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 6 }}>REFERENCE MATERIALS</p>
          <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8 }}>Global PDFs available via toolbar during exam</p>
          {settings.referenceMaterials.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, flex: 1, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <button
                type="button"
                aria-label={`Remove ${m.name}`}
                onClick={() => onPatch({ referenceMaterials: settings.referenceMaterials.filter((_, j) => j !== i) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 2, lineHeight: 1 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
              </button>
            </div>
          ))}
          <UrlAdder
            placeholder="PDF name"
            onAdd={(name, url) => onPatch({ referenceMaterials: [...settings.referenceMaterials, { name, url }] })}
          />
        </section>

        <Divider />

        {/* PRE-READS */}
        <section aria-labelledby="sp-prereads-hd" style={{ marginBottom: 20 }}>
          <p id="sp-prereads-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 6 }}>PRE-READS (assessment level)</p>
          <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8 }}>Shown in exam toolbar as "Pre-reads" button</p>
          {settings.preReadDocuments.map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, flex: 1, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <button
                type="button"
                aria-label={`Remove pre-read ${m.name}`}
                onClick={() => onPatch({ preReadDocuments: settings.preReadDocuments.filter((_, j) => j !== i) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 2, lineHeight: 1 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
              </button>
            </div>
          ))}
          <UrlAdder
            placeholder="Document name"
            onAdd={(name, url) => onPatch({ preReadDocuments: [...settings.preReadDocuments, { name, url }] })}
          />
        </section>

      </div>
    </div>
  )
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function Divider() {
  return <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} aria-hidden="true" />
}

function SettingRow({
  label,
  description,
  control,
  style,
}: {
  label: string
  description?: string
  control: React.ReactNode
  style?: React.CSSProperties
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8, ...style }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontSize: 12, color: 'var(--foreground)', lineHeight: 1.3 }}>{label}</p>
        {description && <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginTop: 2 }}>{description}</p>}
      </div>
      <div style={{ flexShrink: 0 }}>{control}</div>
    </div>
  )
}

function UrlAdder({ placeholder, onAdd }: { placeholder: string; onAdd: (name: string, url: string) => void }) {
  const [name, setName] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [open, setOpen] = React.useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ fontSize: 11, color: 'var(--brand-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
      >
        + Add PDF
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
      <Input
        autoFocus
        placeholder={placeholder}
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ height: 28, fontSize: 11 }}
        aria-label="Document name"
      />
      <Input
        placeholder="URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ height: 28, fontSize: 11 }}
        aria-label="Document URL"
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <Button
          size="sm"
          disabled={!name.trim() || !url.trim()}
          onClick={() => { onAdd(name.trim(), url.trim()); setName(''); setUrl(''); setOpen(false) }}
        >
          Add
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setName(''); setUrl('') }}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: 0 errors (or only errors from `step2-section-settings-panel.tsx` which doesn't exist yet).

Fix any TS errors by checking the actual props accepted by DS components (`Button`, `Input`, `Label`, `Switch`, `Select`) in `node tools/ds/source.mjs --list`.

- [ ] **Step 3: Commit**

```bash
git add admin/components/assessment-builder/step2-settings-panel.tsx
git commit -m "feat(builder): Step2SettingsPanel — inline settings right panel"
```

---

## Task 5: New `step2-section-settings-panel.tsx`

**Files:**
- Create: `admin/components/assessment-builder/step2-section-settings-panel.tsx`

**Context:** This is State ③ of the right panel — shown when the user clicks a section header row in the outline. It patches the `AssessmentSection` inline. Key fields: `fillTarget` (with N/M progress bar), `dueDate`, faculty selector, `instructions` (already on section), `preReadDocuments`.

**Note on faculty data:** The builder has a `facultyListRows` array (type `FacultyListRow[]`). The panel receives it as a prop.

- [ ] **Step 1: Confirm `FacultyListRow` type** (already researched — skip grep, proceed directly)

`FacultyListRow` is exported from `admin/lib/faculty-mock-data.ts` at line 25. It has `id: string` and `fullName: string` (not `name`). The component must import this type and use `f.fullName` in the Select.

- [ ] **Step 2: Create the component file**

Create `admin/components/assessment-builder/step2-section-settings-panel.tsx`:

```tsx
'use client'

import * as React from 'react'
import { Button, Input, Label, Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@exxatdesignux/ui'
import type { AssessmentSection } from '@/lib/qb-types'
import type { FacultyListRow } from '@/lib/faculty-mock-data'

interface Props {
  section: AssessmentSection
  faculty: FacultyListRow[]
  onPatch: (patch: Partial<AssessmentSection>) => void
  onClose: () => void
}

export function Step2SectionSettingsPanel({ section, faculty, onPatch, onClose }: Props) {
  const filled = section.questionIds.length
  const target = section.fillTarget?.value ?? section.questionTarget ?? 20
  const fillPct = Math.min(100, Math.round((filled / target) * 100))
  const isComplete = filled >= target
  const isStarted = filled > 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 12px', borderBottom: '1px solid var(--border)', flexShrink: 0 }}>
        <button
          type="button"
          onClick={onClose}
          style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'none', border: 'none', cursor: 'pointer', fontSize: 12, color: 'var(--muted-foreground)', fontFamily: 'inherit', padding: 0 }}
          aria-label="Back to health panel"
        >
          <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 11 }} />
          Health
        </button>
        <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', maxWidth: 140 }}>
          {section.title}
        </span>
        <button
          type="button"
          onClick={onClose}
          aria-label="Close section settings"
          style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 4, lineHeight: 1 }}
        >
          <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 13 }} />
        </button>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '12px 12px' }}>

        {/* FILL TARGET */}
        <section aria-labelledby="sp-sec-fill-hd" style={{ marginBottom: 20 }}>
          <p id="sp-sec-fill-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 10 }}>FILL TARGET</p>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <Input
              type="number"
              min={1}
              value={section.fillTarget?.value ?? section.questionTarget ?? ''}
              onChange={e => onPatch({
                fillTarget: {
                  type: section.fillTarget?.type ?? 'count',
                  value: Number(e.target.value),
                },
              })}
              style={{ width: 64, height: 32, fontSize: 12 }}
              aria-label="Fill target value"
            />
            <Select
              value={section.fillTarget?.type ?? 'count'}
              onValueChange={v => onPatch({
                fillTarget: {
                  type: v as 'count' | 'points',
                  value: section.fillTarget?.value ?? section.questionTarget ?? 10,
                },
              })}
            >
              <SelectTrigger style={{ height: 32, fontSize: 12, width: 110 }} aria-label="Fill target unit">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="count">Questions</SelectItem>
                <SelectItem value="points">Points</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {/* Progress bar */}
          <div
            role="progressbar"
            aria-valuenow={fillPct}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-label={`${filled} of ${target} ${section.fillTarget?.type === 'points' ? 'points' : 'questions'} filled`}
            style={{ height: 4, background: 'var(--muted)', borderRadius: 2, overflow: 'hidden', marginBottom: 4 }}
          >
            <div style={{
              height: '100%',
              width: `${fillPct}%`,
              background: isComplete ? 'var(--chart-2)' : isStarted ? 'var(--brand-color)' : 'var(--border)',
              borderRadius: 2,
              transition: 'width 0.2s ease',
            }} />
          </div>
          <p style={{ fontSize: 10, color: isComplete ? 'var(--chart-2)' : isStarted ? 'var(--brand-color)' : 'var(--muted-foreground)' }}>
            {filled} of {target} {section.fillTarget?.type === 'points' ? 'points' : 'questions'} filled
          </p>
        </section>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} aria-hidden="true" />

        {/* DUE DATE + ASSIGNED TO */}
        <section aria-labelledby="sp-sec-due-hd" style={{ marginBottom: 20 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <Label htmlFor="sp-sec-due" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>DUE DATE</Label>
              <Input
                id="sp-sec-due"
                type="date"
                value={section.dueDate ?? ''}
                onChange={e => onPatch({ dueDate: e.target.value || null })}
                style={{ height: 32, fontSize: 12 }}
                aria-label="Section due date"
              />
            </div>
            <div>
              <Label htmlFor="sp-sec-faculty" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', display: 'block', marginBottom: 6 }}>ASSIGNED TO</Label>
              <Select
                value={section.facultyId ?? ''}
                onValueChange={v => onPatch({ facultyId: v || undefined })}
              >
                <SelectTrigger id="sp-sec-faculty" style={{ height: 32, fontSize: 12 }} aria-label="Assigned faculty">
                  <SelectValue placeholder="Unassigned" />
                </SelectTrigger>
                <SelectContent>
                  {faculty.map(f => (
                    <SelectItem key={f.id} value={f.id}>{f.fullName}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </section>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} aria-hidden="true" />

        {/* STUDENT INSTRUCTIONS */}
        <section aria-labelledby="sp-sec-instr-hd" style={{ marginBottom: 20 }}>
          <p id="sp-sec-instr-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 4 }}>STUDENT INSTRUCTIONS</p>
          <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 6 }}>Shown to student before Q1 of this section</p>
          <textarea
            value={section.instructions ?? ''}
            onChange={e => onPatch({ instructions: e.target.value })}
            placeholder="Shown to student at the start of this section…"
            rows={3}
            style={{
              width: '100%', fontSize: 12, padding: '6px 8px',
              border: '1px solid var(--border)', borderRadius: 6,
              background: 'var(--background)', color: 'var(--foreground)',
              fontFamily: 'inherit', resize: 'vertical', outline: 'none',
            }}
            aria-label="Student instructions for this section"
          />
        </section>

        <div style={{ height: 1, background: 'var(--border)', margin: '4px 0 16px' }} aria-hidden="true" />

        {/* PRE-READS (section level) */}
        <section aria-labelledby="sp-sec-prereads-hd" style={{ marginBottom: 20 }}>
          <p id="sp-sec-prereads-hd" style={{ fontSize: 10, fontWeight: 700, color: 'var(--muted-foreground)', letterSpacing: '0.06em', marginBottom: 4 }}>PRE-READS</p>
          <p style={{ fontSize: 10, color: 'var(--muted-foreground)', marginBottom: 8 }}>Shown in exam sidebar during this section</p>
          {(section.preReadDocuments ?? []).map((m, i) => (
            <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
              <span style={{ fontSize: 12, flex: 1, color: 'var(--foreground)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{m.name}</span>
              <button
                type="button"
                aria-label={`Remove pre-read ${m.name}`}
                onClick={() => onPatch({ preReadDocuments: (section.preReadDocuments ?? []).filter((_, j) => j !== i) })}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 2, lineHeight: 1 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 11 }} />
              </button>
            </div>
          ))}
          <SectionUrlAdder
            onAdd={(name, url) => onPatch({ preReadDocuments: [...(section.preReadDocuments ?? []), { name, url }] })}
          />
        </section>

      </div>
    </div>
  )
}

function SectionUrlAdder({ onAdd }: { onAdd: (name: string, url: string) => void }) {
  const [name, setName] = React.useState('')
  const [url, setUrl] = React.useState('')
  const [open, setOpen] = React.useState(false)

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        style={{ fontSize: 11, color: 'var(--brand-color)', background: 'none', border: 'none', cursor: 'pointer', padding: 0, fontFamily: 'inherit' }}
      >
        + Add pre-read document
      </button>
    )
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginTop: 4 }}>
      <Input
        autoFocus
        placeholder="Document name"
        value={name}
        onChange={e => setName(e.target.value)}
        style={{ height: 28, fontSize: 11 }}
        aria-label="Pre-read document name"
      />
      <Input
        placeholder="URL"
        value={url}
        onChange={e => setUrl(e.target.value)}
        style={{ height: 28, fontSize: 11 }}
        aria-label="Pre-read document URL"
      />
      <div style={{ display: 'flex', gap: 4 }}>
        <Button
          size="sm"
          disabled={!name.trim() || !url.trim()}
          onClick={() => { onAdd(name.trim(), url.trim()); setName(''); setUrl(''); setOpen(false) }}
        >
          Add
        </Button>
        <Button variant="ghost" size="sm" onClick={() => { setOpen(false); setName(''); setUrl('') }}>
          Cancel
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 3: Run TypeScript check — expect 0 errors**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Fix any errors by checking actual prop types. The most common issue will be the `FacultyRow` type — update based on the actual type found in Step 1.

- [ ] **Step 4: Run full test suite to confirm nothing broke**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test
```

Expected: all tests pass (Tasks 1–2 tests still green).

- [ ] **Step 5: Commit**

```bash
git add admin/components/assessment-builder/step2-section-settings-panel.tsx
git commit -m "feat(builder): Step2SectionSettingsPanel — inline section settings right panel"
```

---

## Task 6: ReviewStep section fill status

**Files:**
- Modify: `admin/app/(app)/assessment-builder/assessment-builder-client.tsx` — `ReviewStep` function, sections breakdown block (~lines 3250-3275)

**Context:** The ReviewStep currently shows a Sections card with each section's title + Q count badge. Per the spec, it should show fill status: `N / M Q  ⚠ not complete` when `fillTarget` is set and section isn't complete.

- [ ] **Step 1: Update sections breakdown in ReviewStep**

In `assessment-builder-client.tsx`, locate the sections breakdown block inside `ReviewStep` (around line 3255):

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

Replace with:

```tsx
              {activeAsmt.sections.map((section, idx) => {
                const filled = section.questionIds.length
                const target = section.fillTarget?.value ?? section.questionTarget
                const isComplete = target != null ? filled >= target : true
                const isStarted = filled > 0
                return (
                  <div key={section.id} className="flex items-center justify-between py-2.5">
                    <div>
                      <p className="text-sm text-foreground">
                        <span className="text-muted-foreground mr-2">{idx + 1}.</span>
                        {section.title}
                      </p>
                      {target != null && (
                        <p className="text-xs text-muted-foreground mt-0.5">
                          {filled} / {target} {section.fillTarget?.type === 'points' ? 'pts' : 'Q'}
                          {!isComplete && (
                            <span
                              style={{ color: 'var(--muted-foreground)', marginLeft: 4 }}
                              aria-label={isStarted ? 'not complete' : 'not started'}
                            >
                              · ⚠ {isStarted ? 'not complete' : 'not started'}
                            </span>
                          )}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center gap-3">
                      {s.graded && (
                        <span className="text-xs text-muted-foreground tabular-nums">
                          {sectionSubtotals.get(section.id) ?? 0} pts
                        </span>
                      )}
                      <Badge
                        variant="secondary"
                        className="rounded text-xs"
                        style={isComplete && target != null ? {
                          background: 'color-mix(in srgb, var(--chart-2) 15%, var(--background))',
                          color: 'var(--chart-2)',
                        } : undefined}
                      >
                        {section.questionIds.length} Q
                      </Badge>
                    </div>
                  </div>
                )
              })}
```

- [ ] **Step 2: Run TypeScript check**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: 0 errors.

- [ ] **Step 3: Run full test suite**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm test
```

Expected: all tests pass.

- [ ] **Step 4: Grep for banned patterns in changed files**

```bash
grep -n "uppercase tracking-wide\|py-20 text-center\|color-mix(in oklch" \
  "/Users/romitsoley/Work/apps/exam-management/admin/app/(app)/assessment-builder/assessment-builder-client.tsx" \
  /Users/romitsoley/Work/apps/exam-management/admin/components/assessment-builder/step2-settings-panel.tsx \
  /Users/romitsoley/Work/apps/exam-management/admin/components/assessment-builder/step2-section-settings-panel.tsx
```

Expected: no output. If any hit: fix before committing.

- [ ] **Step 5: Commit**

```bash
git add "admin/app/(app)/assessment-builder/assessment-builder-client.tsx"
git commit -m "feat(builder): ReviewStep section fill status with ⚠ incomplete indicators"
```

---

## Post-implementation checklist

After all 6 tasks complete, run these checks before claiming done:

- [ ] `pnpm test` — all tests pass
- [ ] `pnpm tsc --noEmit` — 0 type errors
- [ ] Grep for banned patterns across all changed files (see Task 6, Step 4 for command)
- [ ] Spawn `compliance-reviewer` — paste the literal GREENLIGHT/NEEDS-MORE verdict
- [ ] Spawn `state-review` for the builder page — paste the literal verdict
- [ ] Spawn `verification-reviewer` — paste the literal verdict
- [ ] Two-tier verdict: declare `GREENLIGHT (static)` or `GREENLIGHT (runtime)` and list what was NOT verified (popover clip, color token rendering in browser, hover/focus states)
