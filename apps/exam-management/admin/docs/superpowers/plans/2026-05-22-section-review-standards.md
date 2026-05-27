# Section Assignment + Review Workflow + Standard Mapping Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Implement three transcript-confirmed missing features: (1) per-section instructor assignment, (2) send-for-review dialog with reviewer selection, (3) question → standard mapping in the question editor.

**Architecture:** Section assignment adds a `Select` to each section row in DetailsStep and a faculty chip in `SectionsOutline`. The review dialog is a new standalone component wired to the existing `ApprovalPanel`. Standard mapping adds `standardIds: string[]` to `QuestionDraft` and a `StandardsSelect` inline component inside `MetadataPanel`.

**Tech Stack:** Next.js 15 App Router, Exxat DS (`@exxat/ds/packages/ui/src`), TypeScript, React 19, `facultyListRows` from `lib/faculty-mock-data.ts`

**Decision sources:** `af529725.md` (section assignment + review), `fb9e76c2.md` (standards mapping)

---

## File Map

| Action | File | What changes |
|---|---|---|
| Modify | `lib/qb-types.ts:103-108` | `reviewerId: string` → `reviewerIds: string[]` |
| Modify | `lib/question-editor-types.ts:96-114` | Add `standardIds: string[]` to `QuestionDraft` |
| Create | `lib/mock-standards.ts` | NAPLEX + NCLEX mock standards for demo |
| Modify | `app/(app)/assessment-builder/assessment-builder-client.tsx:2358-2380` | Section rows: add faculty `Select` |
| Modify | `app/(app)/assessment-builder/assessment-builder-client.tsx:375-380` | `handleSendToChair` → open dialog state |
| Modify | `app/(app)/assessment-builder/assessment-builder-client.tsx:1798-1878` | `ApprovalPanel`: fix brand-color → chart-2, wire dialog |
| Create | `components/assessment-builder/send-for-review-dialog.tsx` | Reviewer selection dialog |
| Modify | `components/assessment-builder/step2-sections-outline.tsx:81-120` | `SectionGroup`: show assigned faculty chip |
| Modify | `components/question-editor/question-editor.tsx` | `MetadataPanel`: add `StandardsSelect` |

---

## Task 1: Section → Instructor Assignment

**Files:**
- Modify: `lib/qb-types.ts` (no change needed — `facultyId?: string` already on `AssessmentSection:134`)
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx:2349-2416`
- Modify: `components/assessment-builder/step2-sections-outline.tsx`

- [ ] **Step 1: Add faculty `Select` to each section row in `DetailsStep`**

In `assessment-builder-client.tsx`, find the sections rendering block (around line 2358). The current code renders each section as a single row with title + remove button. Replace it with a two-row layout: title row + faculty assignment row.

First, add the import at the top of the file (line ~19, after the `faculty-mock-data` import):

```tsx
import { facultyListRows } from '@/lib/faculty-mock-data'
```

Then replace the section row (lines 2358–2379):

```tsx
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
        value={sec.facultyId ?? '__none__'}
        onValueChange={val => onUpdate({
          sections: sections.map(s =>
            s.id === sec.id ? { ...s, facultyId: val === '__none__' ? undefined : val } : s
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
          {facultyListRows.filter(f => f.status === 'active').map(f => (
            <SelectItem key={f.id} value={f.id}>
              {f.fullName}
              <span className="text-muted-foreground ml-1.5 text-xs">· {f.adminPosition}</span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  </div>
))}
```

- [ ] **Step 2: Show assigned faculty chip in `SectionsOutline` section header**

In `components/assessment-builder/step2-sections-outline.tsx`, add the import and update `SectionGroup`.

Add import at top (after existing imports):

```tsx
import { facultyListRows } from '@/lib/faculty-mock-data'
```

Inside `SectionGroup`, update the header button to show the faculty name chip after the question count:

```tsx
function SectionGroup({ section, questions, onRemove, onEdit, editingId }: {
  section: AssessmentSection
  questions: Question[]
  onRemove: (id: string) => void
  onEdit: (id: string) => void
  editingId: string | null
}) {
  const [collapsed, setCollapsed] = useState(false)
  const qById = Object.fromEntries(questions.map(q => [q.id, q]))
  const assignedFaculty = section.facultyId
    ? facultyListRows.find(f => f.id === section.facultyId)
    : null

  return (
    <div>
      <button
        type="button"
        onClick={() => setCollapsed(c => !c)}
        className="flex items-center gap-2 w-full px-3 py-1.5 text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 rounded"
        style={{ background: 'none', border: 'none', cursor: 'pointer' }}
      >
        <i
          className={`fa-light ${collapsed ? 'fa-chevron-right' : 'fa-chevron-down'}`}
          aria-hidden="true"
          style={{ fontSize: 9, color: 'var(--muted-foreground)', width: 10 }}
        />
        <span className="text-xs font-semibold text-foreground truncate flex-1">{section.title}</span>
        {assignedFaculty && (
          <span
            className="text-xs text-muted-foreground shrink-0 truncate max-w-[70px]"
            title={assignedFaculty.fullName}
          >
            {assignedFaculty.fullName.split(' ').slice(-1)[0]}
          </span>
        )}
        <span className="text-xs text-muted-foreground shrink-0">{section.questionIds.length}</span>
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
```

- [ ] **Step 3: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 4: Visual check — section panel in DetailsStep**

Start dev server at port 3001, navigate to `/assessment-builder`, add a section, verify the "Assigned to" select appears and selecting a faculty name persists. Then navigate to Step 2, verify the assigned faculty last name appears in the SectionsOutline section header.

- [ ] **Step 5: Commit**

```bash
git add \
  apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx \
  apps/exam-management/admin/components/assessment-builder/step2-sections-outline.tsx
git commit -m "feat(assessment): add per-section instructor assignment

Section rows in Step 1 now show an 'Assigned to' faculty select.
SectionsOutline shows the assigned faculty's last name in the section header.

Decision source: af529725 — 'I will create the assessment shell, and I will
tell Nippon you put it in your section.'"
```

---

## Task 2: Review Workflow Dialog

**Files:**
- Modify: `lib/qb-types.ts:103-108`
- Create: `components/assessment-builder/send-for-review-dialog.tsx`
- Modify: `app/(app)/assessment-builder/assessment-builder-client.tsx` (state + wiring)

- [ ] **Step 1: Change `reviewerId: string` to `reviewerIds: string[]` in `qb-types.ts`**

In `lib/qb-types.ts`, replace lines 103-108:

```ts
export interface AssessmentReviewRequest {
  reviewerIds: string[]    // FacultyListRow IDs — multiple reviewers allowed
  message: string
  dueDate: string | null
  sentAt: string
}
```

- [ ] **Step 2: Create `send-for-review-dialog.tsx`**

Create `components/assessment-builder/send-for-review-dialog.tsx`:

```tsx
'use client'

import { useState } from 'react'
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
  Button, Checkbox, Label, Textarea,
} from '@exxat/ds/packages/ui/src'
import { facultyListRows } from '@/lib/faculty-mock-data'
import type { AssessmentReviewRequest } from '@/lib/qb-types'

interface Props {
  open: boolean
  onOpenChange: (open: boolean) => void
  onSubmit: (req: AssessmentReviewRequest) => void
}

export function SendForReviewDialog({ open, onOpenChange, onSubmit }: Props) {
  const [selectedIds, setSelectedIds] = useState<string[]>([])
  const [message, setMessage] = useState('')
  const [dueDate, setDueDate] = useState('')

  const reviewers = facultyListRows.filter(f =>
    f.status === 'active' &&
    (f.adminPosition === 'Program Director' || f.adminPosition === 'Course Coordinator')
  )

  function toggle(id: string) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id])
  }

  function handleSubmit() {
    if (selectedIds.length === 0) return
    onSubmit({
      reviewerIds: selectedIds,
      message: message.trim(),
      dueDate: dueDate ? new Date(dueDate).toISOString() : null,
      sentAt: new Date().toISOString(),
    })
    onOpenChange(false)
    setSelectedIds([])
    setMessage('')
    setDueDate('')
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Send for review</DialogTitle>
        </DialogHeader>
        <div className="flex flex-col gap-4 py-1">
          <div>
            <p className="text-xs font-semibold text-muted-foreground mb-2">
              Reviewer(s) <span className="text-destructive">*</span>
            </p>
            <div className="flex flex-col gap-2.5">
              {reviewers.map(f => (
                <div key={f.id} className="flex items-center gap-2.5">
                  <Checkbox
                    id={`reviewer-${f.id}`}
                    checked={selectedIds.includes(f.id)}
                    onCheckedChange={() => toggle(f.id)}
                  />
                  <Label htmlFor={`reviewer-${f.id}`} className="text-sm cursor-pointer leading-none">
                    {f.fullName}
                    <span className="text-muted-foreground ml-1.5 text-xs">· {f.adminPosition}</span>
                  </Label>
                </div>
              ))}
            </div>
            {reviewers.length === 0 && (
              <p className="text-xs text-muted-foreground">No Program Directors or Course Coordinators found.</p>
            )}
          </div>

          <div>
            <Label htmlFor="review-message" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Message <span className="font-normal normal-case">— optional</span>
            </Label>
            <Textarea
              id="review-message"
              value={message}
              onChange={e => setMessage(e.target.value)}
              placeholder="Add context for the reviewer…"
              className="text-sm min-h-[68px] resize-none"
              rows={3}
            />
          </div>

          <div>
            <Label htmlFor="review-due" className="text-xs font-semibold text-muted-foreground mb-1.5 block">
              Due date <span className="font-normal normal-case">— optional</span>
            </Label>
            <input
              id="review-due"
              type="date"
              value={dueDate}
              onChange={e => setDueDate(e.target.value)}
              aria-label="Review due date"
              style={{
                width: '100%', height: 36, padding: '0 10px', fontSize: 13,
                border: '1px solid var(--border)', borderRadius: 8,
                background: 'var(--background)', color: 'var(--foreground)', outline: 'none',
              }}
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button
            size="sm"
            disabled={selectedIds.length === 0}
            onClick={handleSubmit}
            className="gap-1.5"
          >
            <i className="fa-light fa-paper-plane" aria-hidden="true" />
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
```

- [ ] **Step 3: Wire the dialog into `assessment-builder-client.tsx`**

**3a.** Add import (near line 29, after the existing component imports):

```tsx
import { SendForReviewDialog } from '@/components/assessment-builder/send-for-review-dialog'
```

**3b.** Add state (after line 323, near the other `useState` declarations):

```tsx
const [sendForReviewOpen, setSendForReviewOpen] = useState(false)
```

**3c.** Change `handleSendToChair` (line 375) from router.push to opening the dialog:

```tsx
function handleSendToChair() {
  setSendForReviewOpen(true)
}
```

**3d.** Add a `handleReviewSubmit` function after `handleSendToChair`:

```tsx
function handleReviewSubmit(req: import('@/lib/qb-types').AssessmentReviewRequest) {
  setActiveAsmt(prev => prev ? {
    ...prev,
    settings: {
      ...prev.settings,
      status: 'pending-review',
      reviewRequest: req,
    },
  } : prev)
}
```

**3e.** Mount the dialog near the end of the `return` block (after the `AssessmentSettingsSheet`, before the closing `</div>`):

```tsx
<SendForReviewDialog
  open={sendForReviewOpen}
  onOpenChange={setSendForReviewOpen}
  onSubmit={handleReviewSubmit}
/>
```

- [ ] **Step 4: Fix `ApprovalPanel` — use `--chart-2` for approved state, show reviewer names**

In `ApprovalPanel` (around line 1817), replace the status badge style and update the `reviewRequest` display to show reviewer names:

Replace the status badge (lines 1820–1831):
```tsx
<span
  className="text-xs font-medium px-2 py-0.5 rounded-full"
  style={{
    background: status === 'approved'
      ? 'color-mix(in oklch, var(--chart-2) 12%, var(--background))'
      : 'var(--muted)',
    color: status === 'approved' ? 'var(--chart-2)' : 'var(--muted-foreground)',
  }}
>
  {statusLabel[status]}
</span>
```

Replace the `reviewRequest` display (lines 1839–1843) to show reviewer names:
```tsx
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
```

Add the `facultyListRows` import to `assessment-builder-client.tsx` if not already present (check: it was added in Task 1 Step 1 — it should be there).

- [ ] **Step 5: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 6: Visual check — review workflow**

Navigate to `/assessment-builder`, create an assessment, proceed to Step 3 (Review). Click "Send for review". Verify: dialog opens, shows Program Directors and Course Coordinators as checkboxes, can select multiple, can add message and due date, clicking "Send for review" closes the dialog and the ApprovalPanel now shows "Pending review" status with reviewer names.

Then click "Publish without review" and verify the warning box appears ("This assessment hasn't been reviewed") with a "Publish anyway" button.

- [ ] **Step 7: Commit**

```bash
git add \
  apps/exam-management/admin/lib/qb-types.ts \
  apps/exam-management/admin/components/assessment-builder/send-for-review-dialog.tsx \
  apps/exam-management/admin/app/\(app\)/assessment-builder/assessment-builder-client.tsx
git commit -m "feat(assessment): implement send-for-review workflow

Course coordinators can now send an assessment for review to one or more
reviewers (Program Directors and Course Coordinators). The review is a soft
gate — publishing without review shows a warning but is not blocked.

Decision source: af529725 — 'Assessment review is a real thing, which today
ExamSoft does not cater into. It could be a good differentiator for us.'"
```

---

## Task 3: Question → Standard Mapping

**Files:**
- Create: `lib/mock-standards.ts`
- Modify: `lib/question-editor-types.ts:96-114` (add `standardIds`)
- Modify: `components/question-editor/question-editor.tsx` (MetadataPanel + new `StandardsSelect` component)

- [ ] **Step 1: Create `lib/mock-standards.ts`**

```ts
/**
 * Mock standards for NAPLEX and NCLEX blueprints.
 * Used for question → standard direct mapping (Phase 1 feature).
 * Decision source: fb9e76c2 — "We definitely want to give the ability for a user
 * to map the questions directly to the standards."
 */

export interface Standard {
  id: string
  code: string
  title: string
  framework: 'NAPLEX' | 'NCLEX' | 'NCCPA' | 'ACPE'
}

export const MOCK_STANDARDS: Standard[] = [
  // NAPLEX content areas (NABP blueprint)
  { id: 'std-nap-1', code: 'Area 1', title: 'Obtain, interpret, or assess data', framework: 'NAPLEX' },
  { id: 'std-nap-2', code: 'Area 2', title: 'Identify drug characteristics', framework: 'NAPLEX' },
  { id: 'std-nap-3', code: 'Area 3', title: 'Develop or manage treatment plans', framework: 'NAPLEX' },
  { id: 'std-nap-4', code: 'Area 4', title: 'Perform calculations required for drug therapy', framework: 'NAPLEX' },
  { id: 'std-nap-5', code: 'Area 5', title: 'Compound, dispense, or administer drugs', framework: 'NAPLEX' },
  { id: 'std-nap-6', code: 'Area 6', title: 'Counsel patients or caregivers', framework: 'NAPLEX' },
  // NCLEX-RN client needs categories
  { id: 'std-nclex-1', code: 'Safety', title: 'Safety and infection control', framework: 'NCLEX' },
  { id: 'std-nclex-2', code: 'Pharm', title: 'Pharmacological and parenteral therapies', framework: 'NCLEX' },
  { id: 'std-nclex-3', code: 'Physio', title: 'Physiological adaptation', framework: 'NCLEX' },
  { id: 'std-nclex-4', code: 'Psych', title: 'Psychosocial integrity', framework: 'NCLEX' },
  { id: 'std-nclex-5', code: 'Health', title: 'Health promotion and maintenance', framework: 'NCLEX' },
]

/** Group standards by framework — used in UI pickers. */
export function groupedStandards(): Record<string, Standard[]> {
  return MOCK_STANDARDS.reduce<Record<string, Standard[]>>((acc, s) => {
    if (!acc[s.framework]) acc[s.framework] = []
    acc[s.framework].push(s)
    return acc
  }, {})
}
```

- [ ] **Step 2: Add `standardIds` to `QuestionDraft` in `question-editor-types.ts`**

In `lib/question-editor-types.ts`, add `standardIds` to the `QuestionDraft` interface (after `tags: string[]`, around line 108):

```ts
export interface QuestionDraft {
  id: string
  code: string
  type: EditorQType
  stem: string
  explanation: string
  difficulty: QDiff
  blooms: QBlooms
  objectiveId: string | null
  folderId: string | null
  tags: string[]
  standardIds: string[]               // direct mapping to standards/competencies
  state: EditorState
  confidence: Confidence
  payload: QuestionPayload
  aiOriginated: boolean
  authorPersonaId: string
}
```

In `createDraft` (around line 242), add `standardIds: []` to the return object:

```ts
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
```

- [ ] **Step 3: Add `StandardsSelect` component and wire into `MetadataPanel` in `question-editor.tsx`**

**3a.** Add imports at the top of `question-editor.tsx` (after the existing imports):

```tsx
import { MOCK_STANDARDS, groupedStandards, type Standard } from '@/lib/mock-standards'
```

**3b.** Add `StandardsSelect` as a new component (before `ToggleSwitchRow`, near the bottom of the file):

```tsx
// ─── Standards multi-select ───────────────────────────────────────────────────

function StandardsSelect({
  selectedIds,
  onUpdate,
}: {
  selectedIds: string[]
  onUpdate: (ids: string[]) => void
}) {
  const [open, setOpen] = useState(false)
  const selected = MOCK_STANDARDS.filter(s => selectedIds.includes(s.id))
  const grouped = groupedStandards()

  function toggle(id: string) {
    onUpdate(selectedIds.includes(id) ? selectedIds.filter(x => x !== id) : [...selectedIds, id])
  }

  return (
    <div className="flex flex-col gap-1.5">
      {selected.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {selected.map(s => (
            <Badge key={s.id} variant="secondary" className="rounded text-xs gap-1">
              <span className="font-mono text-muted-foreground">{s.framework}</span>
              {' '}{s.code}
              <Button
                variant="ghost"
                size="icon-xs"
                onClick={() => toggle(s.id)}
                aria-label={`Remove ${s.title}`}
                className="size-3 p-0 hover:bg-transparent"
              >
                <i className="fa-solid fa-xmark" aria-hidden="true" style={{ fontSize: 8 }} />
              </Button>
            </Badge>
          ))}
        </div>
      )}
      <Button
        variant="outline"
        size="sm"
        onClick={() => setOpen(o => !o)}
        className="gap-1.5 h-7 text-xs justify-start"
        aria-expanded={open}
        aria-haspopup="listbox"
      >
        <i className="fa-light fa-plus" aria-hidden="true" />
        {selected.length === 0 ? 'Map to standard…' : 'Add more'}
      </Button>
      {open && (
        <div
          className="rounded-lg border border-border bg-card p-2"
          role="listbox"
          aria-multiselectable="true"
          aria-label="Available standards"
        >
          {Object.entries(grouped).map(([framework, stds]) => (
            <div key={framework}>
              <p className="text-xs font-semibold text-muted-foreground px-1 pt-2 pb-1">{framework}</p>
              {stds.map(s => {
                const checked = selectedIds.includes(s.id)
                return (
                  <label
                    key={s.id}
                    role="option"
                    aria-selected={checked}
                    className="flex items-start gap-2 px-1 py-1 rounded cursor-pointer hover:bg-muted/50"
                  >
                    <Checkbox
                      checked={checked}
                      onCheckedChange={() => toggle(s.id)}
                      aria-label={s.title}
                    />
                    <span className="text-xs leading-relaxed">
                      <span className="font-mono text-muted-foreground mr-1 text-xs">{s.code}</span>
                      {s.title}
                    </span>
                  </label>
                )
              })}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

**3c.** In `MetadataPanel`, add the Standards section after the "Custom labels" section (after the `draft.tags` div, before the closing `</section>`):

```tsx
<div>
  <div className="flex items-center justify-between mb-1">
    <Label className="text-xs font-medium">Standards</Label>
    <span className="text-xs text-muted-foreground">direct mapping</span>
  </div>
  <StandardsSelect
    selectedIds={draft.standardIds ?? []}
    onUpdate={ids => onUpdate('standardIds', ids)}
  />
</div>
```

- [ ] **Step 4: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/exam-management/admin && pnpm tsc --noEmit 2>&1
```
Expected: no errors.

- [ ] **Step 5: Visual check — standards mapping**

Navigate to `/questions/new`. In the right rail "Tagging" section, verify "Standards" heading appears below "Custom labels". Click "Map to standard…" — dropdown should show NAPLEX and NCLEX grouped sections with checkboxes. Select 2 standards — badges should appear. Remove one — badge disappears. Check that switching question type preserves selected standards.

- [ ] **Step 6: Commit**

```bash
git add \
  apps/exam-management/admin/lib/mock-standards.ts \
  apps/exam-management/admin/lib/question-editor-types.ts \
  apps/exam-management/admin/components/question-editor/question-editor.tsx
git commit -m "feat(qb): add question → standard direct mapping

Faculty can now map questions directly to NAPLEX/NCLEX standards in the
question editor. standardIds: string[] added to QuestionDraft. Phase 2
will add the question → course objective → standard chain.

Decision source: fb9e76c2 — 'We definitely want to give the ability for a user
to map the questions directly to the standards.'"
```

---

## Task 4: Update Feature Registry

- [ ] **Step 1: Update feature registry for completed items**

In `admin/docs/decisions/feature-registry.md`, update:

| Feature | Old status | New status |
|---|---|---|
| Download window configuration | ⚠️ | ✅ (already built in DetailsStep lines 2460–2479) |
| Section → instructor assignment | ❌ | ✅ (Task 1) |
| Instructor can only edit their section | ❌ | ⚠️ (UI shows assignment; RBAC enforcement needs real auth) |
| Instructor "section ready" signal | ❌ | ❌ (still missing) |
| Send assessment for review | ❌ | ✅ (Task 2) |
| Reviewer selection | ❌ | ✅ (Task 2) |
| Soft gate on publish | ❌ | ✅ (Task 2) |
| Review status chip on assessment list | ❌ | ⚠️ (ApprovalPanel shows status in Step 3; assessment list doesn't yet) |
| Question → direct standard/competency mapping | ❌ | ✅ (Task 3) |

- [ ] **Step 2: Commit registry update**

```bash
git add apps/exam-management/admin/docs/decisions/feature-registry.md
git commit -m "chore(registry): update feature status after section/review/standards"
```

---

## Self-Review

**Spec coverage check:**

| Decision (source) | Task covering it |
|---|---|
| "I will create the assessment shell and tell Nippon put it in your section" (af529725) | Task 1 ✅ |
| "Section level review NOT required. Just assessment level review is enough" (af529725) | Task 2 ✅ |
| "They can be multiple but in most cases it's the chair" — multiple reviewers (af529725) | Task 2 ✅ |
| "If not approved, you let them administer it. But say this is still pending approval" (af529725) | Task 2 ✅ |
| "We definitely want to give the ability for a user to map the questions directly to the standards" (fb9e76c2) | Task 3 ✅ |
| Download window already built | Task 4 registry update ✅ |

**Placeholder scan:** None found. All code blocks are complete.

**Type consistency:**
- `AssessmentReviewRequest.reviewerIds: string[]` matches Task 2 Step 1, dialog Step 2, and wiring Step 3.
- `QuestionDraft.standardIds: string[]` matches types Step 2 and MetadataPanel Step 3.
- `FacultyListRow.id` (`fac-001` format) matches what `reviewerIds` stores.
- `groupedStandards()` return type `Record<string, Standard[]>` matches `Object.entries()` usage in `StandardsSelect`.
