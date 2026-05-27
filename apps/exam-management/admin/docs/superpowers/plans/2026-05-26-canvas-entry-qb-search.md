# Canvas Entry + QB AI Search Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Add an AI-powered text search bar to the QB picker (replaces smart-view chips), and replace the `CreateAssessmentModal` dialog in the course assessments tab with a full-page canvas entry that collects name, type, date, duration, and collaborators in the header before prompting for structure.

**Architecture:** Part A (Tasks 1–2) wires a `QbSearchBar` component into the existing `ABQuestionPicker`, dropping the smart-view chip system. Part B (Tasks 3–7) introduces a new `/assessment-builder/create` route that renders a full-page canvas; metadata lives in the header bar; the `AssessmentDraft` type gains `collaboratorIds`. Both parts are independent — implement Part A first.

**Tech Stack:** Next.js App Router, React 18, `@exxat/ds/packages/ui/src` DS components, TypeScript, `lib/qb-types.ts` types, `lib/faculty-mock-data.ts` mock faculty.

---

## Part A — QB AI Search Bar

### Task 1: `QbSearchBar` component

**Files:**
- Create: `components/assessment-builder/step2-qb-search-bar.tsx`

- [ ] **Step 1: Create the file**

```tsx
'use client'

export interface QbFilter {
  key: 'difficulty' | 'type' | 'blooms'
  label: string
}

interface QbSearchBarProps {
  value: string
  onChange: (v: string) => void
  activeFilters: QbFilter[]
  onRemoveFilter: (key: QbFilter['key'], label: string) => void
  resultCount: number
}

export function QbSearchBar({
  value, onChange, activeFilters, onRemoveFilter, resultCount,
}: QbSearchBarProps) {
  return (
    <div style={{ padding: '10px 16px 6px', borderBottom: '1px solid var(--border)', flexShrink: 0, background: 'var(--background)' }}>
      {/* Search input */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: 8,
        border: '1.5px solid var(--foreground)', borderRadius: 8,
        padding: '8px 12px', background: 'var(--background)',
      }}>
        <i className="fa-light fa-sparkles" aria-hidden="true" style={{ color: 'var(--muted-foreground)', fontSize: 13, flexShrink: 0 }} />
        <input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="Search by topic, type, difficulty…"
          aria-label="Search question bank"
          style={{
            flex: 1, fontSize: 13, border: 'none', outline: 'none',
            background: 'transparent', color: 'var(--foreground)', fontFamily: 'inherit',
          }}
        />
        {value && (
          <button
            onClick={() => onChange('')}
            aria-label="Clear search"
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, display: 'flex' }}
          >
            <i className="fa-light fa-xmark" aria-hidden="true" style={{ fontSize: 12 }} />
          </button>
        )}
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 6px', borderRadius: 4, flexShrink: 0 }}>↵</span>
      </div>

      {/* Active filter tags */}
      {activeFilters.length > 0 && (
        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          <span style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>Filters:</span>
          {activeFilters.map(f => (
            <span
              key={`${f.key}-${f.label}`}
              style={{
                fontSize: 12, padding: '2px 8px', borderRadius: 20,
                background: 'var(--muted)', color: 'var(--foreground)',
                border: '1px solid var(--border)', display: 'inline-flex', alignItems: 'center', gap: 4,
              }}
            >
              {f.label}
              <button
                onClick={() => onRemoveFilter(f.key, f.label)}
                aria-label={`Remove ${f.label} filter`}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', padding: 0, lineHeight: 1, fontSize: 13 }}
              >×</button>
            </span>
          ))}
        </div>
      )}

      {/* Result count */}
      <p style={{ fontSize: 12, color: 'var(--muted-foreground)', marginTop: 6 }}>
        {resultCount} question{resultCount !== 1 ? 's' : ''} · sorted by relevance + PBI
      </p>
    </div>
  )
}
```

- [ ] **Step 2: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors in `step2-qb-search-bar.tsx`.

- [ ] **Step 3: Commit**

```bash
git add components/assessment-builder/step2-qb-search-bar.tsx
git commit -m "feat(builder): add QbSearchBar component — AI search input with removable filters"
```

---

### Task 2: Wire `QbSearchBar` into `ABQuestionPicker`, remove smart-view system

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`

**Context:** `ABQuestionPicker` is defined around line 957 in the file. It currently receives `smartViews`, `activeViewId`, `onViewChange`, `onSaveView` props and renders a chip bar (lines ~1242–1284) and a "Save smart view" dialog (lines ~1420–1462). All of this is replaced by `QbSearchBar`.

- [ ] **Step 1: Add `QbFilter` import and new state to `ABQuestionPicker`**

In `ABQuestionPicker`, add this import at the top of the file (alongside existing imports):

```tsx
import { QbSearchBar, type QbFilter } from '@/components/assessment-builder/step2-qb-search-bar'
```

Inside `ABQuestionPicker` function body, add after the existing `const [source, setSource] = useState<PickerSource>('this-course')` line:

```tsx
const [searchQuery, setSearchQuery] = useState('')
const [activeFilters, setActiveFilters] = useState<QbFilter[]>([])
```

- [ ] **Step 2: Replace `filteredQuestions` useMemo**

Find the existing `filteredQuestions` useMemo (which currently reads `activeView?.filters`). Replace the entire block:

```tsx
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
```

- [ ] **Step 3: Replace the smart-view chips `<div>` with `QbSearchBar`**

Find the smart-view chips block (starts with `{isQbSource && (` followed by `display: 'flex', alignItems: 'center', gap: 6, padding: '8px 16px', borderBottom`). Replace the entire block (including the closing `)}`) with:

```tsx
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
```

- [ ] **Step 4: Remove the "Save smart view" dialog**

Find the Dialog block that starts with `{/* Save smart view dialog */}` and ends with `</Dialog>` (around line 1420–1462). Delete the entire block.

- [ ] **Step 5: Remove smart-view props from `ABQuestionPicker` interface and function signature**

In the props interface for `ABQuestionPicker` (around line 962), remove these four props:

```
smartViews: SmartView[]
activeViewId: string
onViewChange: (id: string) => void
onSaveView: (v: SmartView) => void
```

In the destructured function parameters, remove: `smartViews, activeViewId, onViewChange, onSaveView`.

Remove these internal variables that depended on the old props (they'll cause "used before defined" errors otherwise):
- `const activeView = smartViews.find(v => v.id === activeViewId) ?? smartViews[0]`
- `const [saveDialogOpen, setSaveDialogOpen] = useState(false)`
- `const [newViewName, setNewViewName] = useState('')`
- `const [newViewNameError, setNewViewNameError] = useState<string | null>(null)`
- `function handleSaveView() { ... }` (the entire function)

- [ ] **Step 6: Remove smart-view state from `AssessmentBuilderClient`**

In `AssessmentBuilderClient` (the parent), remove:

```tsx
// Remove these three:
const [smartViewId, setSmartViewId] = useState<string>('all')
const [savedViews, setSavedViews] = useState<SmartView[]>(() => { ... })
const allSmartViews = useMemo(() => [...SYSTEM_SMART_VIEWS, ...savedViews], [savedViews])
const saveSmartView = useCallback((view: SmartView) => { ... }, [])
```

In the `<ABQuestionPicker ... />` JSX call, remove the four props:
```
smartViews={allSmartViews}
activeViewId={smartViewId}
onViewChange={setSmartViewId}
onSaveView={saveSmartView}
```

- [ ] **Step 7: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -30
```

Expected: no errors. If `SmartView` or `SYSTEM_SMART_VIEWS` are now unused, remove those imports too.

- [ ] **Step 8: Run the dev server and verify**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm dev
```

Navigate to `http://localhost:3001/assessment-builder`. Open any assessment → Step 2. Verify:
- Smart-view chip bar is gone
- `QbSearchBar` appears below the content-area chips
- Typing in the search box filters the question list by title substring
- The result count updates live
- Clearing the input restores all questions

- [ ] **Step 9: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(builder): replace smart-view chips with QbSearchBar AI search"
```

---

## Part B — Canvas Creation Entry

### Task 3: Add `collaboratorIds` to data model

**Files:**
- Modify: `lib/qb-types.ts` (lines 114–122 for `Assessment`, lines 190–200 for `AssessmentDraft`)
- Modify: `lib/assessment-draft-store.tsx` (the `addDraft` implementation)

- [ ] **Step 1: Add field to `Assessment` interface**

In `lib/qb-types.ts`, find `export interface Assessment {` (line ~114). Add one line:

```ts
export interface Assessment {
  id: string
  courseId: string
  offeringId: string
  title: string
  questionCount: number
  diffDistribution: Record<QDiff, number>
  durationMinutes: number
  collaboratorIds?: string[]   // ← ADD THIS
}
```

- [ ] **Step 2: Add field to `AssessmentDraft` interface**

Find `export interface AssessmentDraft {` (line ~190). Add one line:

```ts
export interface AssessmentDraft {
  id: string
  title: string
  courseId: string
  offeringId: string
  questions: AssessmentQuestion[]
  durationMinutes: number
  sections: AssessmentSection[]
  settings: AssessmentSettings
  healthFlags: QuestionHealthFlag[]
  collaboratorIds?: string[]   // ← ADD THIS
}
```

- [ ] **Step 3: Thread `collaboratorIds` through `addDraft`**

In `lib/assessment-draft-store.tsx`, find the `addDraft` implementation (lines ~93–106). Add `collaboratorIds` to the `next` object:

```ts
addDraft: (input) => {
  const id = input.id ?? `draft-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`
  const next: Assessment = {
    id,
    courseId:         input.courseId,
    offeringId:       input.offeringId,
    title:            input.title,
    questionCount:    input.questionCount,
    durationMinutes:  input.durationMinutes,
    diffDistribution: input.diffDistribution as Record<QDiff, number>,
    collaboratorIds:  input.collaboratorIds,   // ← ADD THIS
  }
  setDrafts(prev => [...prev, next])
  return next
},
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
git add lib/qb-types.ts lib/assessment-draft-store.tsx
git commit -m "feat(types): add collaboratorIds to Assessment and AssessmentDraft"
```

---

### Task 4: Canvas page scaffold

**Files:**
- Create: `app/(app)/assessment-builder/create/page.tsx`
- Create: `app/(app)/assessment-builder/create/create-canvas-client.tsx`

- [ ] **Step 1: Create `page.tsx`**

```tsx
import { Suspense } from 'react'
import CreateCanvasClient from './create-canvas-client'

export default function CreateCanvasPage() {
  return (
    <Suspense>
      <CreateCanvasClient />
    </Suspense>
  )
}
```

- [ ] **Step 2: Create `create-canvas-client.tsx` shell**

```tsx
'use client'
import { useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { Button, LocalBanner } from '@exxat/ds/packages/ui/src'
import { useAssessmentDrafts } from '@/lib/assessment-draft-store'
import { mockCourses, mockCourseOfferings } from '@/lib/qb-mock-data'
import { facultyListRows } from '@/lib/faculty-mock-data'
import type { AssessmentType } from '@/lib/qb-types'

type QuickStart = 'blank' | 'copy' | 'pdf' | 'blueprint'

function getFacultyInitial(fullName: string): string {
  const parts = fullName.trim().split(' ')
  return (parts[parts.length - 1]?.[0] ?? '?').toUpperCase()
}

const AVATAR_COLORS = [
  'oklch(0.65 0.18 160)',
  'oklch(0.65 0.18 55)',
  'oklch(0.57 0.24 342)',
  'oklch(0.65 0.18 200)',
  'oklch(0.60 0.20 280)',
]

export default function CreateCanvasClient() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { addDraft } = useAssessmentDrafts()

  const courseId   = searchParams?.get('courseId') ?? ''
  const offeringId = searchParams?.get('offeringId') ?? ''

  const course   = mockCourses.find(c => c.id === courseId)
  const offering = mockCourseOfferings.find(o => o.id === offeringId)

  const [name, setName]                     = useState('')
  const [type, setType]                     = useState<AssessmentType>('Exam')
  const [date, setDate]                     = useState('')
  const [duration, setDuration]             = useState(90)
  const [collaboratorIds, setCollaboratorIds] = useState<string[]>([])
  const [prompt, setPrompt]                 = useState('')
  const [nameError, setNameError]           = useState('')

  function handleSubmit(mode: QuickStart = 'blank') {
    if (!name.trim()) {
      setNameError('Assessment name is required.')
      return
    }
    setNameError('')
    const draft = addDraft({
      courseId,
      offeringId: offeringId || (mockCourseOfferings.find(o => o.courseId === courseId)?.id ?? ''),
      title: name.trim(),
      questionCount: 0,
      durationMinutes: duration,
      diffDistribution: { Easy: 0, Medium: 0, Hard: 0 },
      collaboratorIds,
    })
    if (prompt.trim()) {
      try { sessionStorage.setItem(`asmt-creation-prompt-${draft.id}`, prompt.trim()) } catch {}
    }
    const qs = mode !== 'blank' ? `&mode=${mode}` : ''
    router.push(`/assessment-builder?draftId=${draft.id}&courseId=${courseId}${qs}`)
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', overflow: 'hidden' }}>
      <CanvasHeader
        course={course}
        offering={offering}
        name={name}
        onNameChange={v => { setName(v); if (nameError) setNameError('') }}
        type={type}
        onTypeChange={setType}
        date={date}
        onDateChange={setDate}
        duration={duration}
        onDurationChange={setDuration}
        collaboratorIds={collaboratorIds}
        onCollaboratorToggle={id => setCollaboratorIds(prev =>
          prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]
        )}
        onDiscard={() => router.back()}
      />
      {nameError && (
        <div style={{ padding: '8px 16px', flexShrink: 0 }}>
          <LocalBanner variant="destructive">{nameError}</LocalBanner>
        </div>
      )}
      <CanvasBody
        prompt={prompt}
        onPromptChange={setPrompt}
        onSubmit={handleSubmit}
      />
    </div>
  )
}

// ─── Sub-components defined below in Tasks 5 and 6 ───────────────────────────
// Add CanvasHeader and CanvasBody in the same file after this export.
```

- [ ] **Step 3: Verify the route compiles**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: errors only about missing `CanvasHeader` and `CanvasBody` (not yet defined) — that's fine, we add them in Tasks 5 and 6.

- [ ] **Step 4: Commit scaffold**

```bash
git add "app/(app)/assessment-builder/create/"
git commit -m "feat(builder): scaffold canvas creation route /assessment-builder/create"
```

---

### Task 5: `CanvasHeader` — name, chips, collaborator picker

**Files:**
- Modify: `app/(app)/assessment-builder/create/create-canvas-client.tsx` (add `CanvasHeader`)

Add `CanvasHeader` at the bottom of `create-canvas-client.tsx`, after the default export:

- [ ] **Step 1: Add the type/date/duration chip popovers helper + `CanvasHeader`**

```tsx
// ─── CanvasHeader ─────────────────────────────────────────────────────────────

const ASSESSMENT_TYPES: AssessmentType[] = ['Exam', 'Quiz', 'Pop Quiz', 'Assignment']

function ChipPopover({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 5, fontSize: 12,
          padding: '3px 10px', borderRadius: 20,
          border: '1px solid var(--border)', background: 'var(--muted)',
          color: 'var(--foreground)', cursor: 'pointer', fontFamily: 'inherit',
          whiteSpace: 'nowrap',
        }}
      >
        {label}
        <i className="fa-light fa-chevron-down" aria-hidden="true" style={{ fontSize: 10, color: 'var(--muted-foreground)' }} />
      </button>
      {open && (
        <>
          <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => setOpen(false)} />
          <div style={{
            position: 'absolute', top: '100%', left: 0, marginTop: 4,
            background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 8,
            boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, minWidth: 180, padding: 12,
          }}>
            {children}
          </div>
        </>
      )}
    </div>
  )
}

function CanvasHeader({
  course, offering, name, onNameChange, type, onTypeChange,
  date, onDateChange, duration, onDurationChange,
  collaboratorIds, onCollaboratorToggle, onDiscard,
}: {
  course: ReturnType<typeof mockCourses.find>
  offering: ReturnType<typeof mockCourseOfferings.find>
  name: string
  onNameChange: (v: string) => void
  type: AssessmentType
  onTypeChange: (v: AssessmentType) => void
  date: string
  onDateChange: (v: string) => void
  duration: number
  onDurationChange: (v: number) => void
  collaboratorIds: string[]
  onCollaboratorToggle: (id: string) => void
  onDiscard: () => void
}) {
  const [collabOpen, setCollabOpen] = useState(false)
  const [collabSearch, setCollabSearch] = useState('')

  const filteredFaculty = facultyListRows.filter(f =>
    f.status === 'active' &&
    f.fullName.toLowerCase().includes(collabSearch.toLowerCase())
  )

  const selectedFaculty = facultyListRows.filter(f => collaboratorIds.includes(f.id))

  return (
    <div style={{
      height: 46, borderBottom: '1px solid var(--border)',
      display: 'flex', alignItems: 'center', padding: '0 16px', gap: 10, flexShrink: 0,
      background: 'var(--card)',
    }}>
      {/* Back */}
      <button
        onClick={onDiscard}
        style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--muted-foreground)', fontSize: 12, fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: 4 }}
      >
        <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 11 }} />
        {course?.code ?? 'Back'}
      </button>
      <span style={{ color: 'var(--border)', margin: '0 2px' }}>/</span>

      {/* Assessment name — inline editable */}
      <input
        value={name}
        onChange={e => onNameChange(e.target.value)}
        placeholder="Assessment name…"
        aria-label="Assessment name"
        aria-required="true"
        style={{
          fontSize: 13, fontWeight: 600, border: 'none',
          borderBottom: '1.5px solid var(--brand-color)',
          background: 'transparent', outline: 'none',
          color: 'var(--foreground)', padding: '0 2px', width: 220, fontFamily: 'inherit',
        }}
      />

      {/* Type chip */}
      <ChipPopover label={type}>
        {ASSESSMENT_TYPES.map(t => (
          <div
            key={t}
            onClick={() => onTypeChange(t)}
            style={{
              padding: '6px 10px', fontSize: 13, cursor: 'pointer', borderRadius: 6,
              background: type === t ? 'var(--muted)' : 'transparent',
              fontWeight: type === t ? 600 : 400,
            }}
          >
            {t}
          </div>
        ))}
      </ChipPopover>

      {/* Date chip */}
      <ChipPopover label={date ? new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'Date'}>
        <label style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Assessment date</label>
        <input
          type="date"
          value={date}
          onChange={e => onDateChange(e.target.value)}
          style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'inherit', width: '100%' }}
        />
      </ChipPopover>

      {/* Duration chip */}
      <ChipPopover label={`${duration} min`}>
        <label style={{ fontSize: 12, color: 'var(--muted-foreground)', display: 'block', marginBottom: 4 }}>Duration (minutes)</label>
        <input
          type="number"
          min={5}
          step={5}
          value={duration}
          onChange={e => onDurationChange(Math.max(5, Number(e.target.value)))}
          style={{ fontSize: 13, border: '1px solid var(--border)', borderRadius: 6, padding: '4px 8px', fontFamily: 'inherit', width: 100 }}
        />
      </ChipPopover>

      {/* Collaborator avatar row + picker */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginLeft: 8, paddingLeft: 8, borderLeft: '1px solid var(--border)' }}>
        {/* Selected avatars */}
        <div style={{ display: 'flex', alignItems: 'center' }}>
          {selectedFaculty.slice(0, 5).map((f, i) => (
            <div
              key={f.id}
              title={f.fullName}
              style={{
                width: 24, height: 24, borderRadius: '50%',
                background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                border: '2px solid var(--background)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 11, fontWeight: 700, color: '#fff',
                marginRight: i < selectedFaculty.length - 1 ? -6 : 0,
                zIndex: 5 - i, position: 'relative',
              }}
            >
              {getFacultyInitial(f.fullName)}
            </div>
          ))}
          {selectedFaculty.length > 5 && (
            <div style={{
              width: 24, height: 24, borderRadius: '50%',
              background: 'var(--muted)', border: '2px solid var(--background)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 11, color: 'var(--muted-foreground)', position: 'relative', zIndex: 0,
            }}>
              +{selectedFaculty.length - 5}
            </div>
          )}
        </div>

        {/* Add collaborator button + popover */}
        <div style={{ position: 'relative', marginLeft: 4 }}>
          <button
            onClick={() => setCollabOpen(o => !o)}
            aria-label="Add collaborator"
            aria-expanded={collabOpen}
            style={{
              width: 24, height: 24, borderRadius: '50%',
              border: '1.5px dashed var(--border)', background: 'transparent',
              color: 'var(--muted-foreground)', fontSize: 14,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
            }}
          >+</button>

          {collabOpen && (
            <>
              <div style={{ position: 'fixed', inset: 0, zIndex: 49 }} onClick={() => { setCollabOpen(false); setCollabSearch('') }} />
              <div style={{
                position: 'absolute', top: '100%', left: 0, marginTop: 6,
                background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 10,
                boxShadow: '0 4px 16px rgba(0,0,0,0.10)', zIndex: 50, width: 260, overflow: 'hidden',
              }}>
                <div style={{ padding: '10px 12px 6px' }}>
                  <input
                    autoFocus
                    value={collabSearch}
                    onChange={e => setCollabSearch(e.target.value)}
                    placeholder="Search faculty…"
                    aria-label="Search faculty"
                    style={{
                      width: '100%', fontSize: 13, border: '1px solid var(--border)',
                      borderRadius: 6, padding: '5px 8px', fontFamily: 'inherit', outline: 'none',
                    }}
                  />
                </div>
                <div style={{ maxHeight: 200, overflowY: 'auto' }}>
                  {filteredFaculty.length === 0 ? (
                    <div style={{ padding: '10px 12px', fontSize: 13, color: 'var(--muted-foreground)' }}>No faculty found</div>
                  ) : filteredFaculty.map((f, i) => {
                    const isSelected = collaboratorIds.includes(f.id)
                    return (
                      <div
                        key={f.id}
                        onClick={() => onCollaboratorToggle(f.id)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: 10,
                          padding: '8px 12px', cursor: 'pointer',
                          background: isSelected ? 'var(--muted)' : 'transparent',
                        }}
                      >
                        <div style={{
                          width: 28, height: 28, borderRadius: '50%', flexShrink: 0,
                          background: AVATAR_COLORS[i % AVATAR_COLORS.length],
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: 11, fontWeight: 700, color: '#fff',
                        }}>
                          {getFacultyInitial(f.fullName)}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: 13, fontWeight: isSelected ? 600 : 400, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{f.fullName}</div>
                          <div style={{ fontSize: 12, color: 'var(--muted-foreground)' }}>{f.rank}</div>
                        </div>
                        {isSelected && <i className="fa-light fa-check" aria-hidden="true" style={{ color: 'var(--brand-color)', fontSize: 12 }} />}
                      </div>
                    )
                  })}
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* Right actions */}
      <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 12, color: 'var(--muted-foreground)', background: 'var(--muted)', padding: '2px 9px', borderRadius: 4, border: '1px solid var(--border)' }}>Draft</span>
        <Button variant="outline" size="sm" onClick={onDiscard}>Discard</Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Commit**

```bash
git add "app/(app)/assessment-builder/create/create-canvas-client.tsx"
git commit -m "feat(builder): CanvasHeader — name, type/date/duration chips, collaborator picker"
```

---

### Task 6: `CanvasBody` — gradient background, prompt box, quick-starts

**Files:**
- Modify: `app/(app)/assessment-builder/create/create-canvas-client.tsx` (add `CanvasBody`)

Add `CanvasBody` at the bottom of `create-canvas-client.tsx`:

- [ ] **Step 1: Add `CanvasBody`**

```tsx
// ─── CanvasBody ───────────────────────────────────────────────────────────────

const QUICK_STARTS: { id: QuickStart; label: string }[] = [
  { id: 'blank',     label: 'Blank start' },
  { id: 'copy',      label: "Copy last year's" },
  { id: 'pdf',       label: 'Import PDF' },
  { id: 'blueprint', label: 'Use blueprint' },
]

function CanvasBody({
  prompt, onPromptChange, onSubmit,
}: {
  prompt: string
  onPromptChange: (v: string) => void
  onSubmit: (mode: QuickStart) => void
}) {
  return (
    <div style={{
      flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: [
        'radial-gradient(ellipse 65% 50% at 50% 60%, oklch(0.96 0.03 342), transparent 75%)',
        'radial-gradient(ellipse 40% 35% at 8% 88%, oklch(0.93 0.04 330), transparent 70%)',
        'radial-gradient(ellipse 35% 30% at 90% 10%, oklch(0.94 0.03 350), transparent 65%)',
        'oklch(0.985 0.01 343)',
      ].join(', '),
      overflow: 'auto',
      padding: '32px 16px',
    }}>
      <div style={{ width: 520, textAlign: 'center' }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, letterSpacing: '-0.03em', marginBottom: 6, color: 'var(--foreground)' }}>
          What should this look like?
        </h2>
        <p style={{ fontSize: 13, color: 'var(--muted-foreground)', marginBottom: 20, lineHeight: 1.5 }}>
          Describe sections, topics, faculty, timing.<br />Or pick a starting point below.
        </p>

        {/* Prompt box */}
        <div style={{
          border: '1.5px solid var(--foreground)', borderRadius: 12,
          background: 'var(--background)', overflow: 'hidden',
          boxShadow: '0 2px 12px rgba(0,0,0,0.07)', textAlign: 'left',
        }}>
          <textarea
            value={prompt}
            onChange={e => onPromptChange(e.target.value)}
            placeholder='e.g. "3 sections, 20 questions each — Cardiovascular Pharm, Renal Pharm, Clinical Application. Assign to Mehra, Patel, Kim. 90 min, proctored."'
            rows={3}
            aria-label="Describe assessment structure"
            style={{
              width: '100%', fontSize: 13, color: 'var(--foreground)',
              padding: '13px 16px 8px', lineHeight: 1.55,
              border: 'none', outline: 'none', resize: 'none',
              background: 'transparent', fontFamily: 'inherit',
            }}
          />
          <div style={{
            display: 'flex', alignItems: 'center', gap: 8, padding: '8px 12px',
            borderTop: '1px solid var(--border)', background: 'var(--muted)',
          }}>
            <button
              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)' }}
              onClick={() => {}}
              type="button"
            >
              📋 Copy from last year's
            </button>
            <button
              style={{ fontSize: 12, padding: '3px 10px', borderRadius: 6, border: '1px solid var(--border)', background: 'var(--background)', cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)' }}
              onClick={() => {}}
              type="button"
            >
              📎 Attach blueprint
            </button>
            <button
              onClick={() => onSubmit('blank')}
              aria-label="Submit prompt"
              style={{
                marginLeft: 'auto', width: 30, height: 30, borderRadius: 8,
                background: 'var(--foreground)', border: 'none', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <svg viewBox="0 0 16 16" fill="white" width="13" height="13" aria-hidden="true"><path d="M14.5 8L2 14l2.5-6L2 2z"/></svg>
            </button>
          </div>
        </div>

        {/* Quick-start chips */}
        <div style={{ display: 'flex', gap: 8, justifyContent: 'center', marginTop: 16, flexWrap: 'wrap' }}>
          {QUICK_STARTS.map(qs => (
            <button
              key={qs.id}
              onClick={() => onSubmit(qs.id)}
              style={{
                fontSize: 12, padding: '5px 14px', borderRadius: 20,
                border: '1px solid var(--border)', background: 'var(--background)',
                cursor: 'pointer', fontFamily: 'inherit', color: 'var(--foreground)',
              }}
            >
              {qs.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Check TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors.

- [ ] **Step 3: Verify in browser**

Navigate to `http://localhost:3001/assessment-builder/create?courseId=course-card101&offeringId=off-card101-f26` (use a real courseId from `lib/qb-mock-data.ts` if these don't match).

Verify:
- Header shows: back link, name input (editable), Type chip (opens 4-option picker), Date chip (opens date input), Duration chip (opens number input), dashed `+` button
- Clicking `+` opens the faculty picker popover with search and avatar rows
- Selecting a faculty name shows their avatar in the header
- Canvas gradient background renders
- Prompt textarea is editable
- Sending without a name shows the `LocalBanner` error
- Sending with a name saves the draft and navigates to the builder

- [ ] **Step 4: Commit**

```bash
git add "app/(app)/assessment-builder/create/create-canvas-client.tsx"
git commit -m "feat(builder): CanvasBody — gradient prompt canvas with quick-start chips"
```

---

### Task 7: Wire navigation — assessments-tab → canvas route

**Files:**
- Modify: `app/(app)/courses/[id]/tabs/assessments-tab.tsx`

**Context:** `assessments-tab.tsx` currently imports `CreateAssessmentModal` and opens it from two "New assessment" buttons (lines ~138 and ~226). Replace both button handlers with `router.push` to the canvas route. Remove the modal import and the `modalOpen` state.

- [ ] **Step 1: Add `useRouter` import**

At the top of `assessments-tab.tsx`, add:

```tsx
import { useRouter } from 'next/navigation'
```

Remove the `CreateAssessmentModal` import line.

- [ ] **Step 2: Replace modal state with router navigation**

Find `const [modalOpen, setModalOpen] = useState(false)` in the component. Remove it. Add:

```tsx
const router = useRouter()
function openCanvas() {
  router.push(`/assessment-builder/create?courseId=${courseId}`)
}
```

- [ ] **Step 3: Replace both modal trigger buttons**

Find every occurrence of `onClick={() => setModalOpen(true)}` or `onClick={() => setModalOpen(v)}` and replace with `onClick={openCanvas}`.

Remove any `<CreateAssessmentModal ... />` JSX elements (there are two — lines ~138 and ~226).

- [ ] **Step 4: Check TypeScript**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1 | head -20
```

Expected: no errors. If `useState` is now unused, remove it from the import.

- [ ] **Step 5: End-to-end verify**

Navigate to `http://localhost:3001/courses`. Open any course → Assessments tab. Click "New assessment". Verify it navigates to `/assessment-builder/create?courseId=X`. Complete the canvas (enter a name, add a collaborator, write a prompt, click send). Verify it lands on the builder with the assessment name in the header.

- [ ] **Step 6: Final commit**

```bash
git add "app/(app)/courses/[id]/tabs/assessments-tab.tsx"
git commit -m "feat(builder): wire assessments-tab New Assessment button to canvas route"
```

---

## Self-review notes (plan author)

- `AVATAR_COLORS` uses raw `oklch(...)` literals — acceptable here because these are decorative avatar backgrounds, not DS semantic tokens. The DS doesn't define named avatar colors.
- `getFacultyInitial` takes the last word of `fullName` as the initial (e.g. "Dr. Anita Rao" → "R"). This matches standard avatar conventions.
- `QuickStart = 'blank' | 'copy' | 'pdf' | 'blueprint'` is defined in the client file and referenced in `CanvasBody`. If the type is needed elsewhere, extract to `lib/qb-types.ts` — but YAGNI for now.
- The `offeringId` fallback in `handleSubmit` uses the first offering for the course if none is provided in the URL. This covers the case where the assessments-tab only passes `courseId`.
- Smart-view imports (`SmartView`, `SYSTEM_SMART_VIEWS`) in `assessment-builder-client.tsx` should be removed in Task 2 once the chips are gone — TypeScript unused-import errors will flag this.
