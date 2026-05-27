# Assessment & Question Creation Flows — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the end-to-end assessment creation experience — 3-option entry modal, copy from previous assessment, sections within an assessment, and a settings panel — matching what Aarti described in the May 19 transcript.

**Architecture:** The course offering Assessments tab gets a `CreateAssessmentModal` that lets faculty choose how to start (blank / QB / copy). The assessment builder (`/assessment-builder`) reads new URL params (`mode`, `sourceId`) to pre-populate accordingly. Sections and settings extend `AssessmentDraft` in `qb-types.ts` without changing the existing question picker logic.

**Tech Stack:** Next.js 15 App Router, `'use client'` components, Exxat DS (`@exxat/ds/packages/ui/src`), mock data in `lib/qb-mock-data.ts`, types in `lib/qb-types.ts`.

---

## Context for every task

- **Repo root:** `/Users/romitsoley/Work/apps/exam-management/admin/`
- **Dev server port:** 3001 (`pnpm dev` from above path)
- **DS imports:** `import { Button, Badge, Dialog, … } from '@exxat/ds/packages/ui/src'`
- **No raw `<button>` allowed** — use DS `Button` with explicit `variant` + `size`, except inside `'use client'` components where the DS `Button` would be nested inside another interactive element (then use `<button type="button">` with inline styles matching DS tokens).
- **No hardcoded hex/rgb** — always `var(--token)`.
- **No test files exist** — this codebase has no test suite; skip all test steps. Instead, verify by loading the page in the browser.
- **`'use client'`** must be the first line of every interactive component file.
- **FA icons:** always `aria-hidden="true"` on decorative icons.

---

## Files touched

| File | Action | Purpose |
|---|---|---|
| `lib/qb-types.ts` | Modify | Add `AssessmentSection`, `AssessmentSettings`, extend `AssessmentDraft` |
| `lib/qb-mock-data.ts` | Modify | Add previous-year assessments + section data on existing assessments |
| `app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx` | Modify | Add `CreateAssessmentModal`, wire "New Assessment" button to it |
| `app/(app)/assessment-builder/assessment-builder-client.tsx` | Modify | Handle `mode`/`sourceId` URL params, add Sections view, add Settings sheet |

---

## Task 1: "Create Assessment" entry modal on course offering

**What:** Replace the current direct route push (`router.push('/assessment-builder?offeringId=…')`) with a modal that gives faculty 3 starting options.

**Aarti's exact words (May 19):** "Oh, you wanna create an assessment? How would you like to start? Create questions from scratch, build from your question bank, or use a previous assessment and tweak it."

**Files:**
- Modify: `app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx`

- [ ] **Step 1: Add `CreateAssessmentModal` component** — paste this above the `AssessmentsTab` function (around line 416):

```tsx
// ── Create Assessment modal ───────────────────────────────────────────────────
// Three entry modes per Aarti May 19: blank, QB-first, copy from previous.

function CreateAssessmentModal({
  open, onOpenChange, offeringId, courseId,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  offeringId: string
  courseId: string
}) {
  const router = useRouter()
  const [step, setStep] = useState<'pick-mode' | 'pick-source'>('pick-mode')

  // Previous assessments for this course (from other offerings — different term)
  const prevAssessments = mockAssessments.filter(
    a => a.courseId === courseId && a.offeringId !== offeringId
  )

  function close() { onOpenChange(false); setStep('pick-mode') }

  function handleMode(mode: 'blank' | 'qb' | 'copy') {
    if (mode === 'copy') { setStep('pick-source'); return }
    close()
    router.push(`/assessment-builder?offeringId=${offeringId}&mode=${mode}`)
  }

  function handleSource(sourceId: string) {
    close()
    router.push(`/assessment-builder?offeringId=${offeringId}&mode=copy&sourceId=${sourceId}`)
  }

  const MODES = [
    {
      id: 'blank' as const,
      icon: 'fa-file-pen',
      label: 'From scratch',
      desc: 'Start with a blank assessment and add questions from the QB.',
    },
    {
      id: 'qb' as const,
      icon: 'fa-books',
      label: 'From question bank',
      desc: 'Jump straight to the QB picker with smart view filters ready.',
    },
    {
      id: 'copy' as const,
      icon: 'fa-copy',
      label: 'Copy from previous',
      desc: 'Use a previous term\'s assessment as your starting point — keep structure, swap questions.',
    },
  ]

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) close(); else onOpenChange(true) }}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>New Assessment</DialogTitle>
          <SheetDescription className="text-sm text-muted-foreground">
            How would you like to start?
          </SheetDescription>
        </DialogHeader>

        {step === 'pick-mode' && (
          <div className="flex flex-col gap-2 pt-1">
            {MODES.map(m => (
              <button
                key={m.id}
                type="button"
                onClick={() => handleMode(m.id)}
                className="flex items-start gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/30"
              >
                <div
                  className="flex size-10 shrink-0 items-center justify-center rounded-lg"
                  style={{
                    backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))',
                    color: 'var(--brand-color)',
                  }}
                >
                  <i className={`fa-light ${m.icon} text-base`} aria-hidden="true" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{m.label}</p>
                  <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{m.desc}</p>
                </div>
                <i className="fa-light fa-chevron-right text-xs text-muted-foreground mt-1 shrink-0" aria-hidden="true" />
              </button>
            ))}
          </div>
        )}

        {step === 'pick-source' && (
          <div className="flex flex-col gap-3 pt-1">
            <button
              type="button"
              onClick={() => setStep('pick-mode')}
              className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors self-start"
            >
              <i className="fa-light fa-arrow-left" aria-hidden="true" />
              Back
            </button>
            <p className="text-sm font-medium text-foreground">Select a previous assessment to copy from:</p>
            {prevAssessments.length === 0 ? (
              <div className="rounded-xl border border-border bg-muted/30 p-5 text-center">
                <p className="text-sm text-muted-foreground">No previous assessments found for this course.</p>
                <Button variant="outline" size="sm" className="mt-3" onClick={() => handleMode('blank')}>
                  Start from scratch instead
                </Button>
              </div>
            ) : (
              prevAssessments.map(a => (
                <button
                  key={a.id}
                  type="button"
                  onClick={() => handleSource(a.id)}
                  className="flex items-center gap-4 rounded-xl border border-border p-4 text-left transition-colors hover:bg-muted/30"
                >
                  <div
                    className="flex size-9 shrink-0 items-center justify-center rounded-lg"
                    style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}
                  >
                    <i className="fa-light fa-clipboard-list text-sm" aria-hidden="true" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{a.title}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">
                      {a.questionCount} questions · {a.durationMinutes} min
                    </p>
                  </div>
                  <i className="fa-light fa-arrow-right text-xs text-muted-foreground shrink-0" aria-hidden="true" />
                </button>
              ))
            )}
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 2: Add `mockAssessments` import** — the course offering detail file doesn't currently import it. Add it to the existing qb-mock-data import line (around line 14):

```tsx
// BEFORE (existing line, approximately):
import { facultyStudents, type ExtendedFaculty, facultyAccommodations } from '@/lib/faculty-mock-data'

// ADD below it (new line):
import { mockAssessments } from '@/lib/qb-mock-data'
```

- [ ] **Step 3: Add `createModalOpen` state and wire buttons** — in `CourseOfferingDetailClient`, after the existing `useState` declarations (around line 972), add:

```tsx
const [createModalOpen, setCreateModalOpen] = useState(false)
```

Then find every `onNewAssessment` call site in the render (there are two — the toolbar button and the empty state button). Replace the `onNewAssessment` prop passed to `AssessmentsTab` with `() => setCreateModalOpen(true)`, and add `SheetDescription` import to the DS imports (it's needed by the modal). Also add the `DialogDescription` import alias `SheetDescription`:

In the DS import block at the top, add `DialogDescription` if not already there:
```tsx
Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter,
```

- [ ] **Step 4: Add `<CreateAssessmentModal>` to the JSX** — place it alongside the other sheets (after `AssignFacultySheet`, around line 1230):

```tsx
<CreateAssessmentModal
  open={createModalOpen}
  onOpenChange={setCreateModalOpen}
  offeringId={offering.id}
  courseId={offering.courseId}
/>
```

- [ ] **Step 5: Verify in browser**
  - Go to `http://localhost:3001/courses/offerings/co-001`
  - Click the **Assessments** tab
  - Click **New Assessment**
  - Modal should open with 3 cards: From scratch, From question bank, Copy from previous
  - Click "Copy from previous" — should advance to source picker list
  - Click Back — should return to mode picker
  - Click "From scratch" — should navigate to `/assessment-builder?offeringId=co-001&mode=blank`

- [ ] **Step 6: Commit**
```bash
git add app/\(app\)/courses/offerings/\[id\]/course-offering-detail-client.tsx
git commit -m "feat(assessment): add 3-option Create Assessment modal on course offering"
```

---

## Task 2: Mock data — add previous-year assessments

**What:** The "Copy from previous" flow needs assessments on the same course but a different offering (previous term). Add Fall 2025 assessments for PHAR101 and BIOL201 so the source picker isn't empty.

**Files:**
- Modify: `lib/qb-mock-data.ts`

- [ ] **Step 1: Check current `mockAssessments`** — currently 3 entries:
  - `asmt-001`: PHAR101, offering `offering-phar101-f25`, Midterm, 40q/90min
  - `asmt-002`: PHAR101, offering `offering-phar101-f25`, Final, 60q/150min
  - `asmt-003`: BIOL201, offering `offering-biol201-f25`, Unit 1 Quiz, 20q/30min

- [ ] **Step 2: Check what offeringId the Spring 2026 PHAR101 offering has** — grep the course mock data:
```bash
grep -n "phar101\|biol201" /Users/romitsoley/Work/apps/exam-management/admin/lib/course-mock-data.ts | head -20
```
Note the Spring 2026 offering IDs so we know what `offeringId !== offeringId` will filter out.

- [ ] **Step 3: Add previous-year assessments to `mockAssessments`** — append to the array in `lib/qb-mock-data.ts`:

```ts
// Previous-term assessments (Fall 2025) — used as copy sources
// These belong to offering-phar101-f25 (Fall 2025), so they appear
// in the copy picker when viewing a Spring 2026 PHAR101 offering.
{ id: 'asmt-004', courseId: 'course-phar101', offeringId: 'offering-phar101-sp25', title: 'Midterm 1 — Spring 2025', questionCount: 42, diffDistribution: { Easy: 12, Medium: 22, Hard: 8  }, durationMinutes: 90  },
{ id: 'asmt-005', courseId: 'course-phar101', offeringId: 'offering-phar101-sp25', title: 'Final Exam — Spring 2025', questionCount: 58, diffDistribution: { Easy: 14, Medium: 26, Hard: 18 }, durationMinutes: 150 },
{ id: 'asmt-006', courseId: 'course-biol201', offeringId: 'offering-biol201-sp25', title: 'Midterm — Spring 2025',    questionCount: 35, diffDistribution: { Easy: 10, Medium: 18, Hard: 7  }, durationMinutes: 75  },
{ id: 'asmt-007', courseId: 'course-biol201', offeringId: 'offering-biol201-sp25', title: 'Lab Practical — Spring 2025', questionCount: 25, diffDistribution: { Easy: 5, Medium: 12, Hard: 8 }, durationMinutes: 45 },
```

- [ ] **Step 4: Verify** — after starting the builder, click "Copy from previous" on a PHAR101 offering. The source picker should list 2 Spring 2025 assessments.

- [ ] **Step 5: Commit**
```bash
git add lib/qb-mock-data.ts
git commit -m "feat(mock): add previous-term assessments for copy-from-previous flow"
```

---

## Task 3: Builder — handle `mode` and `sourceId` URL params

**What:** The builder reads `?mode=blank|qb|copy` and `?sourceId=…`. Mode `qb` pre-selects the QB source tab. Mode `copy` loads the source assessment's questions into the new draft on mount.

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Read new URL params** — the file already reads `urlCourseId` and `urlDraftId` from `useSearchParams`. Add two more reads (around line 60):

```tsx
const urlMode = searchParams?.get('mode') as 'blank' | 'qb' | 'copy' | null ?? null
const urlSourceId = searchParams?.get('sourceId') ?? null
```

- [ ] **Step 2: Handle `mode=copy` — pre-populate with source questions** — add a `useEffect` after the existing draft-loading effect (around line 87). This only runs once when `mode=copy` and `sourceId` is set:

```tsx
useEffect(() => {
  if (urlMode !== 'copy' || !urlSourceId || !offeringId) return
  // Find the source assessment from mock data
  const source = mockAssessments.find(a => a.id === urlSourceId)
  if (!source) return
  // Find questions that belong to this course's QB (heuristic: folder prefix matches course code)
  const sourceCode = (mockCourses.find(c => c.id === source.courseId)?.code ?? '').toLowerCase()
  const sourceQuestions = MOCK_QB_QUESTIONS
    .filter(q => q.folder.startsWith(sourceCode))
    .slice(0, source.questionCount)
    .map((q, i) => ({ questionId: q.id, order: i + 1 }))

  setActiveAsmt({
    id: `asmt-copy-${Date.now()}`,
    title: `${source.title} (copy)`,
    courseId: source.courseId,
    offeringId,
    questions: sourceQuestions,
    durationMinutes: source.durationMinutes,
    sections: [],
    settings: { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true },
  })
  setCourseId(source.courseId)
}, [urlMode, urlSourceId, offeringId]) // eslint-disable-line react-hooks/exhaustive-deps
```

- [ ] **Step 3: Handle `mode=qb` — auto-select QB source tab** — the picker's `source` state lives in `ABQuestionPicker`. Pass a prop `initialSource` defaulting to `'this-course'`. When mode is `qb`, pass `'this-course'` (which is the QB tab). The default is already `this-course`, so no visual change for `qb` mode — but add a banner to make it explicit:

In `ABQuestionPicker`, add a prop `isCopyMode: boolean`. When `isCopyMode` is true, show a banner at the top of the picker:

```tsx
{isCopyMode && activeAsmt.questions.length > 0 && (
  <div
    className="flex items-center gap-3 px-4 py-2.5 text-xs shrink-0"
    style={{ backgroundColor: 'color-mix(in oklch, var(--brand-color) 6%, var(--background))', borderBottom: '1px solid var(--border)' }}
  >
    <i className="fa-light fa-copy shrink-0" aria-hidden="true" style={{ color: 'var(--brand-color)' }} />
    <span className="text-foreground">
      <strong>{activeAsmt.questions.length} questions</strong> copied from previous assessment.
      Swap, remove, or add questions below.
    </span>
  </div>
)}
```

Pass `isCopyMode={urlMode === 'copy'}` when rendering `<ABQuestionPicker>`.

- [ ] **Step 4: Handle `mode=blank` — show a title input on first load** — when mode is `blank` and `activeAsmt` was just created, show a simple `LocalBanner` at the top of the picker prompting the user to name the assessment. Add a rename handler using a small inline input in the assessment context header:

In the picker header (`{/* Assessment context header */}`), make the assessment title editable when it's "New Assessment":

```tsx
// Replace:
<span className="text-sm font-semibold">{activeAsmt.title}</span>

// With:
{activeAsmt.title === 'New Assessment' ? (
  <input
    className="text-sm font-semibold bg-transparent border-b border-brand-color outline-none"
    defaultValue={activeAsmt.title}
    placeholder="Assessment name…"
    onBlur={(e) => {
      const val = e.target.value.trim()
      if (val && val !== activeAsmt.title) {
        // propagate title update via a local handler
        setActiveAsmt(prev => prev ? { ...prev, title: val } : prev)
      }
    }}
    style={{ color: 'var(--foreground)', borderBottom: '1px solid var(--brand-color)' }}
  />
) : (
  <span className="text-sm font-semibold">{activeAsmt.title}</span>
)}
```

Note: `setActiveAsmt` is in the parent; pass it down or lift the title-edit inline into the parent component's picker render. The simplest approach is to add a `onRenameAsmt: (title: string) => void` prop to `ABQuestionPicker` and call it from the blur handler.

- [ ] **Step 5: Verify in browser**
  - From course offering `/courses/offerings/co-001`, click "New Assessment" → modal → "Copy from previous" → pick "Midterm 1 — Spring 2025" → confirm navigation to `/assessment-builder?offeringId=co-001&mode=copy&sourceId=asmt-004`
  - Builder should open with the active assessment pre-titled "Midterm 1 — Spring 2025 (copy)" and questions pre-selected
  - The "X questions copied" banner should appear at the top of the picker
  - Try "From scratch" — builder opens with blank new assessment and title input ready

- [ ] **Step 6: Commit**
```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(assessment): handle mode/sourceId URL params — copy-from-previous + blank mode"
```

---

## Task 4: Assessment sections

**What:** Faculty often divide assessments into sections by topic or by faculty (e.g., Dr. Chen writes Section A on Antibiotics, Dr. Patel writes Section B on Cardiovascular). Aarti: "If they created sections in the last exam, those should be copied."

**Files:**
- Modify: `lib/qb-types.ts` (add types)
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` (sections UI in builder)

- [ ] **Step 1: Add `AssessmentSection` type to `lib/qb-types.ts`** — insert after `AssessmentQuestion` (around line 91):

```ts
export interface AssessmentSection {
  id: string
  title: string
  facultyId?: string       // optional faculty assignment (persona ID)
  questionIds: string[]    // ordered list of question IDs in this section
}
```

- [ ] **Step 2: Extend `AssessmentDraft`** — add `sections` field (around line 92):

```ts
export interface AssessmentDraft {
  id: string
  title: string
  courseId: string
  offeringId: string
  questions: AssessmentQuestion[]
  durationMinutes: number
  sections: AssessmentSection[]       // NEW — empty array = no sections
  settings: AssessmentSettings         // NEW — see Task 5
}
```

- [ ] **Step 3: Add `AssessmentSettings` type** — insert before `AssessmentDraft`:

```ts
export type AssessmentType = 'Exam' | 'Quiz' | 'Assignment'

export interface AssessmentSettings {
  type: AssessmentType
  passwordRequired: boolean
  password: string
  randomize: boolean
  showRationaleAfter: boolean
}
```

- [ ] **Step 4: Update all `AssessmentDraft` creation sites** — there are 3 places in `assessment-builder-client.tsx` where `AssessmentDraft` objects are constructed (`createAssessment()`, `openAssessment()`, and the URL-draft loading `useEffect`). Add the new fields to each:

```tsx
// In createAssessment():
sections: [],
settings: { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true },

// In openAssessment():
sections: [],
settings: { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true },

// In the draft-loading useEffect:
sections: [],
settings: { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true },
```

- [ ] **Step 5: Add sections state to `AssessmentBuilderClient`** — the `activeAsmt` already holds `sections`. Add a `setSections` helper:

```tsx
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
      sections: prev.sections.map(s => ({
        ...s,
        questionIds: sectionId === s.id
          ? [...new Set([...s.questionIds, questionId])]
          : s.questionIds.filter(id => id !== questionId),
      })),
    }
  })
}
```

- [ ] **Step 6: Add `SectionsPanel` component** — add this new component in `assessment-builder-client.tsx` (before the main export). It's shown as a drawer/sidebar when sections mode is active:

```tsx
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
        {/* Unassigned bucket */}
        {unassigned.length > 0 && (
          <div className="mb-3">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-1.5 px-1">
              Unassigned ({unassigned.length})
            </p>
            <div className="rounded-lg border border-dashed border-border p-2 flex flex-col gap-1">
              {unassigned.slice(0, 5).map(q => {
                const question = MOCK_QB_QUESTIONS.find(mq => mq.id === q.questionId)
                return (
                  <div key={q.questionId} className="flex items-center gap-2 text-xs text-muted-foreground">
                    <i className="fa-light fa-grip-dots-vertical shrink-0" aria-hidden="true" style={{ fontSize: 10 }} />
                    <span className="truncate flex-1">{question?.title ?? q.questionId}</span>
                    {activeAsmt.sections.length > 0 && (
                      <select
                        aria-label="Assign to section"
                        className="text-[10px] rounded border border-border bg-background px-1 py-0.5"
                        onChange={e => onAssignQuestion(q.questionId, e.target.value || null)}
                        defaultValue=""
                        style={{ color: 'var(--foreground)', maxWidth: 80 }}
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
              {unassigned.length > 5 && (
                <p className="text-[10px] text-muted-foreground px-1">+{unassigned.length - 5} more</p>
              )}
            </div>
          </div>
        )}

        {/* Section buckets */}
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
                className="text-muted-foreground hover:text-foreground transition-colors"
                style={{ fontSize: 10, background: 'none', border: 'none', cursor: 'pointer', padding: 2 }}
              >
                <i className="fa-light fa-xmark" aria-hidden="true" />
              </button>
            </div>
            <div className="rounded-lg border border-border p-2 flex flex-col gap-1 min-h-[40px]"
              style={{ background: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}>
              {section.questionIds.length === 0 ? (
                <p className="text-[10px] text-muted-foreground italic px-1">No questions yet — assign from Unassigned above</p>
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

        {/* Empty state */}
        {activeAsmt.sections.length === 0 && unassigned.length === 0 && (
          <p className="text-xs text-muted-foreground text-center py-8">
            Add questions first, then organize them into sections.
          </p>
        )}
      </div>

      {/* Add section input */}
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
```

- [ ] **Step 7: Add sections toggle button and `SectionsPanel` to the builder render** — in the main `ABQuestionPicker` render or in `AssessmentBuilderClient`, add:

Add `sectionsOpen` state to `AssessmentBuilderClient`:
```tsx
const [sectionsOpen, setSectionsOpen] = useState(false)
```

Add a "Sections" button in the assessment context header of `ABQuestionPicker` (pass `onToggleSections` and `sectionsOpen` as props):
```tsx
<Button
  variant={sectionsOpen ? 'default' : 'outline'}
  size="sm"
  onClick={onToggleSections}
  className="gap-1.5 text-xs"
  style={{ height: 28 }}
>
  <i className="fa-light fa-layer-group" aria-hidden="true" />
  Sections {activeAsmt.sections.length > 0 && `(${activeAsmt.sections.length})`}
</Button>
```

Add `<SectionsPanel>` to the right of the picker when `sectionsOpen`:
```tsx
{/* Main split */}
<div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>
  <ABAssessmentList … />
  {activeAsmt ? (
    <>
      <ABQuestionPicker … onToggleSections={() => setSectionsOpen(p => !p)} sectionsOpen={sectionsOpen} />
      {sectionsOpen && (
        <SectionsPanel
          activeAsmt={activeAsmt}
          onAddSection={addSection}
          onRemoveSection={removeSection}
          onAssignQuestion={assignQuestionToSection}
        />
      )}
    </>
  ) : ( … )}
</div>
```

- [ ] **Step 8: Verify in browser**
  - Open assessment builder with an active assessment that has questions
  - Click "Sections" button → `SectionsPanel` slides in from the right
  - Add a section "Antibiotics" → appears in the section list
  - Assign a question using the "Assign…" dropdown → question moves from Unassigned to the section
  - Remove a section → it disappears
  - Click "Sections" again → panel closes

- [ ] **Step 9: Commit**
```bash
git add lib/qb-types.ts app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(assessment): add sections panel — organize questions by topic/faculty"
```

---

## Task 5: Assessment settings panel

**What:** A gear-icon sheet that lets faculty set assessment type (Exam/Quiz/Assignment), password, randomization, and rationale visibility. All settings are stored in `activeAsmt.settings`.

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

- [ ] **Step 1: Add `AssessmentSettingsSheet` component** — paste before the main export:

```tsx
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
  const [local, setLocal] = useState(settings)

  // Sync when settings prop changes (e.g. different assessment selected)
  React.useEffect(() => { setLocal(settings) }, [settings])

  function toggle(key: keyof Pick<typeof local, 'passwordRequired' | 'randomize' | 'showRationaleAfter'>) {
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
                  onClick={() => setLocal(prev => ({ ...prev, type: t }))}
                  className="flex-1 rounded-lg border py-2 text-sm font-medium transition-colors"
                  style={{
                    borderColor: local.type === t ? 'var(--brand-color)' : 'var(--border)',
                    backgroundColor: local.type === t ? 'color-mix(in oklch, var(--brand-color) 10%, var(--background))' : 'transparent',
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
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Password required</p>
                <p className="text-xs text-muted-foreground mt-0.5">Students enter a password to unlock the exam.</p>
              </div>
              <button
                type="button"
                role="switch"
                aria-checked={local.passwordRequired}
                onClick={() => toggle('passwordRequired')}
                style={{
                  width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                  backgroundColor: local.passwordRequired ? 'var(--brand-color)' : 'var(--muted)',
                  position: 'relative', flexShrink: 0, transition: 'background .15s',
                }}
              >
                <span style={{
                  position: 'absolute', top: 2, left: local.passwordRequired ? 18 : 2,
                  width: 16, height: 16, borderRadius: '50%', background: 'white',
                  transition: 'left .15s', display: 'block',
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

          {/* Randomize questions */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Randomize question order</p>
              <p className="text-xs text-muted-foreground mt-0.5">Each student sees questions in a different order.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={local.randomize}
              onClick={() => toggle('randomize')}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                backgroundColor: local.randomize ? 'var(--brand-color)' : 'var(--muted)',
                position: 'relative', flexShrink: 0, transition: 'background .15s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: local.randomize ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%', background: 'white',
                transition: 'left .15s', display: 'block',
              }} />
            </button>
          </div>

          <Separator />

          {/* Show rationale after submission */}
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-foreground">Show rationale after submission</p>
              <p className="text-xs text-muted-foreground mt-0.5">Students see the correct answer and rationale after submitting.</p>
            </div>
            <button
              type="button"
              role="switch"
              aria-checked={local.showRationaleAfter}
              onClick={() => toggle('showRationaleAfter')}
              style={{
                width: 36, height: 20, borderRadius: 10, border: 'none', cursor: 'pointer',
                backgroundColor: local.showRationaleAfter ? 'var(--brand-color)' : 'var(--muted)',
                position: 'relative', flexShrink: 0, transition: 'background .15s',
              }}
            >
              <span style={{
                position: 'absolute', top: 2, left: local.showRationaleAfter ? 18 : 2,
                width: 16, height: 16, borderRadius: '50%', background: 'white',
                transition: 'left .15s', display: 'block',
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
```

- [ ] **Step 2: Add settings state and gear button** — in `AssessmentBuilderClient`, add:

```tsx
const [settingsOpen, setSettingsOpen] = useState(false)
```

In the selector bar (the top bar with Course/Offering selects), add a gear button at the far right when `activeAsmt` is set:

```tsx
{activeAsmt && (
  <Button
    variant="ghost"
    size="icon-sm"
    aria-label="Assessment settings"
    onClick={() => setSettingsOpen(true)}
    style={{ marginLeft: 'auto' }}
  >
    <i className="fa-light fa-gear" aria-hidden="true" />
  </Button>
)}
```

- [ ] **Step 3: Render `AssessmentSettingsSheet`** — add it alongside the `AiGenerateModal` at the bottom of the return:

```tsx
<AssessmentSettingsSheet
  open={settingsOpen}
  onOpenChange={setSettingsOpen}
  settings={activeAsmt?.settings ?? { type: 'Exam', passwordRequired: false, password: '', randomize: false, showRationaleAfter: true }}
  onSave={(s) => setActiveAsmt(prev => prev ? { ...prev, settings: s } : prev)}
/>
```

- [ ] **Step 4: Show settings summary in the assessment list sidebar** — in `ABAssessmentList`, when an assessment is active, show a small "Exam · Password · Randomized" summary in the active assessment button. Add a settings badge under the title:

```tsx
// In the active assessment button, below the question count:
{isActive && activeAsmt?.settings && (
  <div className="flex items-center gap-1 flex-wrap mt-1">
    <Badge variant="secondary" className="rounded text-[9px] px-1.5 py-0"
      style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
      {activeAsmt.settings.type}
    </Badge>
    {activeAsmt.settings.passwordRequired && (
      <Badge variant="secondary" className="rounded text-[9px] px-1.5 py-0"
        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
        <i className="fa-light fa-lock" aria-hidden="true" style={{ fontSize: 8 }} />
      </Badge>
    )}
    {activeAsmt.settings.randomize && (
      <Badge variant="secondary" className="rounded text-[9px] px-1.5 py-0"
        style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }}>
        <i className="fa-light fa-shuffle" aria-hidden="true" style={{ fontSize: 8 }} />
      </Badge>
    )}
  </div>
)}
```

Note: `activeAsmt` is in the parent, so pass it as a prop `activeAsmtDraft?: AssessmentDraft` to `ABAssessmentList`, or keep the badge inside `AssessmentBuilderClient`'s render by not moving it into `ABAssessmentList`. Either approach is fine — take the simpler one.

- [ ] **Step 5: Verify in browser**
  - Open builder with active assessment
  - Gear icon should appear in the selector bar
  - Click gear → Settings sheet opens with Type selector, Password toggle, Randomize toggle, Show Rationale toggle
  - Toggle Password required → password input appears
  - Click Save → sheet closes, settings saved to `activeAsmt.settings`
  - Re-open → settings persisted

- [ ] **Step 6: Commit**
```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(assessment): add settings panel — type, password, randomize, rationale"
```

---

## Self-Review

### 1. Spec coverage

| Transcript requirement | Task |
|---|---|
| "How would you like to start? Create from scratch / QB / copy previous" | Task 1 |
| "Major use case: take last year's exam and make tweaks" | Task 2 + Task 3 |
| "Sections should be copied from previous assessment" | Task 4 |
| Assessment type (Exam/Quiz/Assignment) | Task 5 |
| Password to unlock exam | Task 5 |
| Randomize question order | Task 5 |
| Show rationale after submission | Task 5 |

### 2. Placeholder scan

- All code blocks are complete — no TBD or TODO placeholders
- Toggle buttons use inline `<button type="button">` with style tokens (not raw hex) — DS `Button` doesn't support `role="switch"` toggle pattern natively

### 3. Type consistency

- `AssessmentSection` defined in Task 4 Step 1; referenced in `AssessmentDraft` Task 4 Step 2
- `AssessmentSettings` defined in Task 4 Step 3; referenced in `AssessmentDraft` Task 4 Step 2; used in Task 5
- `AssessmentDraft.sections` and `AssessmentDraft.settings` created in Task 4; used in Task 3 (copy mode) and Task 5 (settings sheet)
- All creation sites updated in Task 4 Step 4 before the panel references them in Task 4 Step 6
