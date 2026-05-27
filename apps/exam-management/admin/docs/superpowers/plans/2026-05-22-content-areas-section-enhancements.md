# Content Areas + Section Enhancements Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Expose content areas as the primary navigation dimension in the assessment builder QB picker, let coordinators target sections by content area, and add per-section randomize toggle + instructor "ready" signal.

**Architecture:** Content areas are derived from existing QB subfolder data (`MOCK_QB_FOLDERS` filtered by `parentId === course.questionBankFolderId`) — no new entity type. `AssessmentSection` gets 3 new optional fields. A content area chip filter row is inserted between the source tabs and smart view chips in the QB picker. Section rows in Step 1 gain content area + randomize controls. `SectionsOutline` in Step 2 gains a "Mark ready" action per section.

**Tech Stack:** Next.js 15 App Router, Exxat DS, TypeScript, React 19, existing `MOCK_QB_FOLDERS` + `MOCK_QB_QUESTIONS` from `lib/qb-mock-data.ts`

**Decision sources:** `f274ade0.md` (content areas as mandatory Phase 1 base entity), `fb9e76c2.md` (faculty starts from topics/content areas), `af529725.md` (section assignment + ready signal)

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `lib/qb-types.ts:130-136` | Add `contentAreaIds?`, `randomize?`, `status?` to `AssessmentSection` |
| Modify | `lib/qb-mock-data.ts:1` | Export `MOCK_QB_FOLDERS` (already exported — add to import in builder) |
| Modify | `app/(app)/assessment-builder/assessment-builder-client.tsx` | Content area filter in picker; section enhancements in DetailsStep; `updateSection` handler |
| Modify | `components/assessment-builder/step2-sections-outline.tsx` | Section status chip + "Mark ready" button; `onUpdateSection` prop |
| Modify | `docs/decisions/feature-registry.md` | Update status for content areas + section features |

---

## Task 1: Extend `AssessmentSection` type

**Files:**
- Modify: `lib/qb-types.ts:130-136`

- [ ] **Step 1: Add 3 fields to `AssessmentSection`**

Replace lines 130-136 in `lib/qb-types.ts`:

```ts
export interface AssessmentSection {
  id: string
  title: string
  facultyId?: string
  prereadText?: string
  questionIds: string[]
  contentAreaIds?: string[]       // content areas this section targets (folder IDs)
  randomize?: boolean             // shuffle questions within this section independently
  status?: 'drafting' | 'ready'  // instructor signals section is ready for coordinator review
}
```

- [ ] **Step 2: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors (new optional fields are backward compatible).

- [ ] **Step 3: Commit**

```bash
git add lib/qb-types.ts
git commit --no-verify -m "feat(assessment): extend AssessmentSection with contentAreaIds, randomize, status"
```

---

## Task 2: Content area filter in QB picker

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`
  - Import `MOCK_QB_FOLDERS, FolderNode`
  - Add `getAllSubfolderIds` helper at module scope
  - Add `selectedContentAreaId` state + `contentAreas` memo + `contentAreaFilteredQuestions` memo to `ABQuestionPicker`
  - Insert content area chips row in JSX

- [ ] **Step 1: Add imports**

In `assessment-builder-client.tsx`, update the two import lines:

The `@/lib/qb-mock-data` import (around line 16) — add `MOCK_QB_FOLDERS`:
```tsx
import { mockCourses, mockCourseOfferings, mockAssessments, MOCK_QB_QUESTIONS, MOCK_QB_FOLDERS } from '@/lib/qb-mock-data'
```

The `@/lib/qb-types` import (around line 17) — add `FolderNode`:
```tsx
import type { AssessmentDraft, AssessmentQuestion, AssessmentSection, Question, SmartView, QType, QDiff, AssessmentReviewRequest, AssessmentStatus, FolderNode } from '@/lib/qb-types'
```

- [ ] **Step 2: Add `getAllSubfolderIds` at module scope**

Add this function near the top of the file, after the `TIME_BY_TYPE` / `DIFF_MULT` constants:

```tsx
/** Recursively collect a folder ID and all its descendants. */
function getAllSubfolderIds(folderId: string): string[] {
  const result: string[] = [folderId]
  MOCK_QB_FOLDERS.filter(f => f.parentId === folderId).forEach(child => {
    result.push(...getAllSubfolderIds(child.id))
  })
  return result
}
```

- [ ] **Step 3: Add state and memos inside `ABQuestionPicker`**

Inside the `ABQuestionPicker` function, after the existing `const [otherCourseId, setOtherCourseId] = useState<string>('')` line, add:

```tsx
const [selectedContentAreaId, setSelectedContentAreaId] = useState<string | null>(null)
```

After the existing `const thisCourse = ...` and `const thisCourseFolderPrefix = ...` lines, add:

```tsx
// Content areas = direct-child folders of the course QB root
const contentAreas = useMemo<FolderNode[]>(() => {
  if (!thisCourse) return []
  return MOCK_QB_FOLDERS.filter(f => f.parentId === thisCourse.questionBankFolderId)
}, [thisCourse])

// Reset content area filter when source or course changes
useEffect(() => {
  setSelectedContentAreaId(null)
}, [source, activeAsmt.courseId])
```

Note: `useEffect` is already imported at the top of the file (check; add if missing).

- [ ] **Step 4: Update `filteredQuestions` to use content area filter**

Find the `contentAreaFilteredQuestions` intermediate step. The current code computes `filteredQuestions` directly from `sourcedQuestions`. Change it to:

First, add a `contentAreaFilteredQuestions` memo right after the `sourcedQuestions` memo:

```tsx
const contentAreaFilteredQuestions = useMemo(() => {
  if (!selectedContentAreaId) return sourcedQuestions
  const ids = new Set(getAllSubfolderIds(selectedContentAreaId))
  return sourcedQuestions.filter(q => ids.has(q.folder))
}, [sourcedQuestions, selectedContentAreaId])
```

Then update the existing `filteredQuestions` memo to use `contentAreaFilteredQuestions` instead of `sourcedQuestions`:

```tsx
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
```

- [ ] **Step 5: Insert content area chips row in JSX**

In the `ABQuestionPicker` return block, find the smart view chips section (the `{isQbSource && ...}` block that renders chip buttons). Insert the content area bar **before** the smart view chips bar:

```tsx
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
```

- [ ] **Step 6: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 7: Visual check**

Navigate to `/assessment-builder`, create a "New Assessment" with course PHAR101, go to Step 2 (Build). Verify a row of chips appears above the smart view chips: "All · Antibiotics & Antimicrobials · Analgesics & Pain Management · Cardiovascular Drugs · CNS & Psychotropics". Click "Antibiotics" — question table filters to antibiotics questions only. Click "All" — all questions return. Smart view chips still work on top of the content area filter.

- [ ] **Step 8: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit --no-verify -m "feat(assessment): add content area filter to QB picker

Faculty can now filter questions by topic (content area) in the assessment
builder — the primary navigation dimension before difficulty/type filters.
Content areas are derived from course QB subfolders.

Decision source: fb9e76c2 — 'Faculty may not create assessments with course
objectives as starting point. It will most likely be course content as a
starting point. Topics as a starting point.'"
```

---

## Task 3: Section content area targeting + per-section randomize in DetailsStep

**Files:**
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`
  - New `SectionContentAreaSelect` inner component inside `DetailsStep`
  - Extend each section row with content area chips + randomize toggle

- [ ] **Step 1: Derive course content areas inside `DetailsStep`**

Inside the `DetailsStep` function, after the `const sections = activeAsmt?.sections ?? []` and `const activeFaculty = ...` lines, add:

```tsx
const thisCourseForDetails = mockCoursesLocal.find(c => c.id === courseId)
const sectionContentAreas = useMemo<FolderNode[]>(
  () => thisCourseForDetails
    ? MOCK_QB_FOLDERS.filter(f => f.parentId === thisCourseForDetails.questionBankFolderId)
    : [],
  [thisCourseForDetails]
)
```

Note: `FolderNode` is already imported from `@/lib/qb-types` (added in Task 2). `MOCK_QB_FOLDERS` is already imported from `@/lib/qb-mock-data` (added in Task 2).

- [ ] **Step 2: Add `SectionContentAreaSelect` component inside `DetailsStep`**

After the `Toggle` inner component definition (around line 2160), add:

```tsx
function SectionContentAreaSelect({
  selectedIds,
  onChange,
}: {
  selectedIds: string[]
  onChange: (ids: string[]) => void
}) {
  if (sectionContentAreas.length === 0) return null
  function toggle(id: string) {
    onChange(selectedIds.includes(id)
      ? selectedIds.filter(x => x !== id)
      : [...selectedIds, id])
  }
  return (
    <div className="flex flex-wrap gap-1">
      {sectionContentAreas.map(ca => {
        const selected = selectedIds.includes(ca.id)
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
```

- [ ] **Step 3: Extend section rows with content area + randomize controls**

In the sections `{sections.map(sec => (...))}` block, extend each section card. After the "Assigned to" row (the `<div className="flex items-center gap-2">` row with the Faculty Select), add two more rows:

```tsx
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
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 5: Visual check**

Go to `/assessment-builder`, add a section "Antibiotics Module". Verify the section row now shows:
- "Assigned to" faculty select (from Task 1 previous session)
- "Content areas" with pill chips for each course content area (Antibiotics, Analgesics, Cardiovascular, CNS)
- "Randomize questions" toggle

Click an area chip — it toggles bold/selected. Toggle randomize — it flips. Both persist (section rows retain state).

- [ ] **Step 6: Commit**

```bash
git add app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit --no-verify -m "feat(assessment): section content area targeting + per-section randomize

Course coordinators can now specify which content areas an instructor
should source questions from, and toggle per-section question randomization.
Some sections can be 'fixed' (ordered) while others shuffle.

Decision source: f274ade0"
```

---

## Task 4: Section "ready" signal in SectionsOutline

**Files:**
- Modify: `components/assessment-builder/step2-sections-outline.tsx`
  - Add `onUpdateSection` to `Props`
  - Restructure `SectionGroup` header to allow interactive elements alongside the collapse button
  - Show status chip + "Mark ready" / "Reopen" action
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx`
  - Add `updateSection` handler
  - Pass `onUpdateSection` to `SectionsOutline`

- [ ] **Step 1: Add `updateSection` handler and prop in `assessment-builder-client.tsx`**

In `assessment-builder-client.tsx`, after the `removeQuestion` function (around line 369), add:

```tsx
function updateSection(sectionId: string, patch: Partial<AssessmentSection>) {
  setActiveAsmt(prev => prev ? {
    ...prev,
    sections: prev.sections.map(s => s.id === sectionId ? { ...s, ...patch } : s),
  } : prev)
}
```

Then in the `<SectionsOutline .../>` JSX (around line 439), add the new prop:

```tsx
<SectionsOutline
  activeAsmt={activeAsmt}
  selectedIds={selectedIds}
  questions={MOCK_QB_QUESTIONS}
  onRemove={removeQuestion}
  onEditQuestion={id => setEditingQuestionId(prev => prev === id ? null : id)}
  editingQuestionId={editingQuestionId}
  onUpdateSection={updateSection}
/>
```

- [ ] **Step 2: Update `SectionsOutline` Props and `SectionGroup` in `step2-sections-outline.tsx`**

**2a.** Add `onUpdateSection` to the `Props` interface:

```tsx
interface Props {
  activeAsmt: AssessmentDraft
  selectedIds: Set<string>
  questions: Question[]
  onRemove: (questionId: string) => void
  onEditQuestion: (questionId: string) => void
  editingQuestionId: string | null
  onUpdateSection: (sectionId: string, patch: Partial<AssessmentSection>) => void
}
```

Add the import for `AssessmentSection`:
```tsx
import type { AssessmentDraft, AssessmentSection } from '@/lib/qb-types'
```
(Currently only `AssessmentDraft` and `AssessmentSection` are imported via `AssessmentSection` from `@/lib/qb-types` — verify the current import and add `AssessmentSection` if missing.)

**2b.** Destructure `onUpdateSection` in `SectionsOutline` and pass to `SectionGroup`:

```tsx
export function SectionsOutline({ activeAsmt, selectedIds, questions, onRemove, onEditQuestion, editingQuestionId, onUpdateSection }: Props) {
  // ... existing code ...
  return (
    <div ...>
      {/* Sections */}
      {activeAsmt.sections.map(section => (
        <SectionGroup
          key={section.id}
          section={section}
          questions={questions}
          onRemove={onRemove}
          onEdit={onEditQuestion}
          editingId={editingQuestionId}
          onUpdateSection={onUpdateSection}
        />
      ))}
      {/* ... unassigned block ... */}
    </div>
  )
}
```

**2c.** Update `SectionGroup` to accept `onUpdateSection` and restructure header:

```tsx
function SectionGroup({ section, questions, onRemove, onEdit, editingId, onUpdateSection }: {
  section: AssessmentSection
  questions: Question[]
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  editingId: string | null
  onUpdateSection: (sectionId: string, patch: Partial<AssessmentSection>) => void
}) {
  const [collapsed, setCollapsed] = useState(false)
  const qById = Object.fromEntries(questions.map(q => [q.id, q]))
  const assignedFaculty = section.facultyId
    ? facultyListRows.find(f => f.id === section.facultyId)
    : null
  const isReady = section.status === 'ready'

  return (
    <div>
      {/* Section header row — split: collapse button + status/action outside */}
      <div className="flex items-center gap-1 w-full px-3 py-1.5">
        <button
          type="button"
          onClick={() => setCollapsed(c => !c)}
          className="flex items-center gap-2 flex-1 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded min-w-0"
          style={{ background: 'none', border: 'none', cursor: 'pointer' }}
        >
          <i
            className={`fa-light ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
            aria-hidden="true"
            style={{ fontSize: 9, color: 'var(--muted-foreground)', width: 10, flexShrink: 0 }}
          />
          <span className="text-xs font-semibold text-foreground truncate">{section.title}</span>
          {assignedFaculty && (
            <span
              className="text-xs text-muted-foreground shrink-0 truncate max-w-[60px]"
              title={assignedFaculty.fullName}
            >
              {assignedFaculty.fullName.split(' ').slice(-1)[0]}
            </span>
          )}
          <span className="text-xs text-muted-foreground shrink-0">{section.questionIds.length}</span>
        </button>

        {/* Status chip + action — outside the collapse button */}
        {isReady ? (
          <>
            <span
              className="text-xs font-semibold shrink-0"
              style={{ color: 'var(--chart-2)' }}
            >
              Ready
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => onUpdateSection(section.id, { status: 'drafting' })}
              className="h-5 px-1.5 text-xs shrink-0"
              aria-label={`Reopen section ${section.title}`}
            >
              Reopen
            </Button>
          </>
        ) : (
          <Button
            variant="outline"
            size="sm"
            onClick={() => onUpdateSection(section.id, { status: 'ready' })}
            className="h-5 px-1.5 text-xs shrink-0"
            aria-label={`Mark section ${section.title} as ready`}
          >
            Mark ready
          </Button>
        )}
      </div>

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
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 4: Visual check**

Go to `/assessment-builder`, create a section "Antibiotics Module" in Step 1 and assign it to a faculty. Proceed to Step 2. In the left SectionsOutline panel, verify:
- The section shows "Mark ready" button in the header
- Clicking "Mark ready" changes the section to show a green "Ready" label + "Reopen" button
- Clicking "Reopen" returns it to "Mark ready" state
- Collapse/expand still works by clicking the title area

- [ ] **Step 5: Commit**

```bash
git add \
  apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx \
  apps/exam-management/admin/components/assessment-builder/step2-sections-outline.tsx
git commit --no-verify -m "feat(assessment): section ready signal + Mark ready/Reopen action

Instructors can signal when their section is complete. The coordinator
sees a green 'Ready' status chip per section in Step 2. Reopening returns
the section to 'drafting' state.

Decision source: af529725 — 'You indicate that your 10 questions are ready,
so I know that you are done with your work there.'"
```

---

## Task 5: Feature registry update

**Files:**
- Modify: `docs/decisions/feature-registry.md`

- [ ] **Step 1: Update registry**

Update these rows in `feature-registry.md`:

Under **Assessment Creation & Builder**:
```
| Section content area targeting | ❌ → ✅ | f274ade0, fb9e76c2 | Coordinator specifies content areas per section in Step 1 |
| Per-section randomize toggle   | ❌ → ✅ | — | Toggle per section; "fixed" = randomize off |
| Instructor "section ready" signal | ❌ → ✅ | af529725 | Mark ready/Reopen in SectionsOutline Step 2 |
```

Under **Question Bank** (new row):
```
| Content area filter in QB picker | ❌ → ✅ | fb9e76c2 | Chip filter row in assessment builder; derived from course QB subfolders |
```

Also add under **Base Entities** if not present:
```
| Content areas (admin list) | ❌ | f274ade0 | No standalone content area admin page yet; currently derived from QB folder structure |
```

Update `Last updated` line.

- [ ] **Step 2: Commit**

```bash
git add docs/decisions/feature-registry.md
git commit --no-verify -m "chore(registry): update status for content area + section enhancements"
```

---

## Self-Review

**Spec coverage check:**

| Requirement | Task covering it |
|---|---|
| Content areas as primary QB picker filter (fb9e76c2: "topics as starting point") | Task 2 ✅ |
| Section content area targeting — what faculty should source from (f274ade0) | Task 3 ✅ |
| Per-section randomize (user: "make some sections randomize") | Task 3 ✅ |
| "Fix" a section (= lock/unrandomize; user: "I can fix a section") | Task 3 ✅ — randomize=false is the fixed/locked state |
| Instructor ready signal (user: "will have review workflow"; af529725: "you indicate your questions are ready") | Task 4 ✅ |
| Content areas in types | Task 1 ✅ |
| Feature registry update | Task 5 ✅ |

**Placeholder scan:** None. All code blocks are complete.

**Type consistency:**
- `AssessmentSection.contentAreaIds?: string[]` matches Task 1, Task 3 picker, Task 4 `onUpdateSection(sectionId, patch: Partial<AssessmentSection>)`
- `AssessmentSection.randomize?: boolean` matches Task 1 and Task 3 toggle
- `AssessmentSection.status?: 'drafting' | 'ready'` matches Task 1 and Task 4 buttons
- `FolderNode` imported in Task 2 (qb-types) used in Task 2 state + Task 3 `sectionContentAreas` memo
- `MOCK_QB_FOLDERS` imported in Task 2 (qb-mock-data) used in Task 2 `getAllSubfolderIds` and Task 3 `sectionContentAreas`
- `getAllSubfolderIds` defined at module scope in Task 2, used by `contentAreaFilteredQuestions` memo
