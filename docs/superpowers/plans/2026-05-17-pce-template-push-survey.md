# PCE Template Question Builder + Push Survey — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Build the template question editor (T28) and push survey flow (T29) for the PCE admin app, grounded in Aarti/Adi's approved PRD decisions.

**Architecture:** Extend `pce-mock-data.ts` with a `TemplateQuestion` type and questions per section on `PceTemplate`. Wire CRUD methods into `pce-state.tsx`. Rewrite `templates/[id]/page.tsx` as a full-page two-panel editor. Add a new `surveys/push/page.tsx` with 3-step wizard state in component-local `useState`. Add "Push survey" entry point and success banner to `surveys/page.tsx`.

**Tech Stack:** Next.js 15 App Router, React 19, Exxat-DS (`@exxat/ds/packages/ui/src`), TypeScript, Tailwind v4, native HTML5 drag-and-drop.

---

## File map

| File | Action |
|---|---|
| `lib/pce-mock-data.ts` | Add `TemplateQuestion` + `questions` field to `PceTemplate` + seed data |
| `components/pce/pce-state.tsx` | Add `addQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions` |
| `app/(app)/templates/[id]/page.tsx` | Full rewrite — two-panel editor |
| `app/(app)/surveys/push/page.tsx` | Create — 3-step push wizard |
| `app/(app)/surveys/page.tsx` | Add "Push survey" button + `?pushed=1` success banner |

---

## Task 1: Extend data model — `TemplateQuestion` + `PceTemplate.questions`

**Files:**
- Modify: `apps/pce/admin/lib/pce-mock-data.ts`

- [ ] **Step 1: Add `TemplateQuestion` interface after the `PceTemplate` interface (around line 24)**

Open `lib/pce-mock-data.ts`. After the closing `}` of `PceTemplate`, add:

```ts
export interface TemplateQuestion {
  id: string
  text: string
  answerType: 'likert' | 'free_text'
  /** 0-based position within its section */
  order: number
}
```

- [ ] **Step 2: Add `questions` and `likertPointer` fields to `PceTemplate`**

In the `PceTemplate` interface, add two fields after `createdBy`:

```ts
  /** Actual question content per section. Source of truth — questionCount is derived from this. */
  questions: Record<TemplateSection, TemplateQuestion[]>
  /** Likert pointer (3 | 4 | 5 | 7 | 10). Defaults to 5 until T30 settings page. */
  likertPointer: 3 | 4 | 5 | 7 | 10
```

- [ ] **Step 3: Seed `MOCK_TEMPLATES` with questions**

Find `MOCK_TEMPLATES` in the file. Replace it entirely with the version below. This adds `questions` and `likertPointer` to each existing template — keeping existing `id`, `name`, `status`, `usedBySurveyCount`, `lastModified`, `createdBy` values intact:

```ts
export const MOCK_TEMPLATES: PceTemplate[] = [
  {
    id: 'tmpl1',
    name: 'End-of-Term Evaluation',
    sections: ['course_content', 'faculty_performance'],
    status: 'active',
    questionCount: 8,
    usedBySurveyCount: 3,
    lastModified: 'Apr 10, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    questions: {
      course_content: [
        { id: 'q1', text: 'The course objectives were clearly stated.', answerType: 'likert', order: 0 },
        { id: 'q2', text: 'Course materials supported my learning.', answerType: 'likert', order: 1 },
        { id: 'q3', text: 'The workload was appropriate for the credit hours.', answerType: 'likert', order: 2 },
        { id: 'q4', text: 'Assessments were aligned with learning objectives.', answerType: 'likert', order: 3 },
        { id: 'q5', text: 'What would you change about this course?', answerType: 'free_text', order: 4 },
      ],
      faculty_performance: [
        { id: 'q6', text: 'The instructor was well-prepared for each class.', answerType: 'likert', order: 0 },
        { id: 'q7', text: 'The instructor communicated expectations clearly.', answerType: 'likert', order: 1 },
        { id: 'q8', text: 'What feedback do you have for the instructor?', answerType: 'free_text', order: 2 },
      ],
      course_director: [],
    },
  },
  {
    id: 'tmpl2',
    name: 'Faculty Midterm Check-In',
    sections: ['faculty_performance'],
    status: 'active',
    questionCount: 3,
    usedBySurveyCount: 1,
    lastModified: 'Mar 22, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    questions: {
      course_content: [],
      faculty_performance: [
        { id: 'q9',  text: 'The instructor encourages student participation.', answerType: 'likert', order: 0 },
        { id: 'q10', text: 'The instructor is available during office hours.', answerType: 'likert', order: 1 },
        { id: 'q11', text: 'Any concerns to share at the midpoint?', answerType: 'free_text', order: 2 },
      ],
      course_director: [],
    },
  },
  {
    id: 'tmpl3',
    name: 'Exit Survey',
    sections: ['course_content', 'faculty_performance', 'course_director'],
    status: 'draft',
    questionCount: 0,
    usedBySurveyCount: 0,
    lastModified: 'Apr 28, 2026',
    createdBy: 'Dr. Thompson',
    likertPointer: 5,
    questions: {
      course_content: [],
      faculty_performance: [],
      course_director: [],
    },
  },
]
```

- [ ] **Step 4: Verify TypeScript compiles**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck 2>&1 | head -30
```

Expected: no errors related to `PceTemplate`. If `questionCount` type errors appear in other files, those are fixed in Task 2.

- [ ] **Step 5: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/pce/admin/lib/pce-mock-data.ts && git commit -m "feat(pce): add TemplateQuestion type + questions field to PceTemplate + seed data"
```

---

## Task 2: Extend `pce-state.tsx` with question CRUD + derived `questionCount`

**Files:**
- Modify: `apps/pce/admin/components/pce/pce-state.tsx`

- [ ] **Step 1: Add new methods to `PceState` interface**

In `pce-state.tsx`, add these four entries to the `PceState` interface after `updateTemplate`:

```ts
  addQuestion: (templateId: string, section: TemplateSection, text: string, answerType: 'likert' | 'free_text') => void
  updateQuestion: (templateId: string, section: TemplateSection, questionId: string, patch: Pick<TemplateQuestion, 'text' | 'answerType'>) => void
  deleteQuestion: (templateId: string, section: TemplateSection, questionId: string) => void
  reorderQuestions: (templateId: string, section: TemplateSection, fromIndex: number, toIndex: number) => void
```

Also add `TemplateQuestion` to the import from `@/lib/pce-mock-data`:

```ts
import type { PceUser, PceSurvey, PceTemplate, SurveyStatus, TemplateSection, TemplateQuestion } from '@/lib/pce-mock-data'
```

- [ ] **Step 2: Implement `addQuestion` in `PceProvider`**

Add this `useCallback` inside `PceProvider`, after `updateTemplate`:

```ts
const addQuestion = useCallback((
  templateId: string,
  section: TemplateSection,
  text: string,
  answerType: 'likert' | 'free_text'
) => {
  setTemplates(ts => ts.map(t => {
    if (t.id !== templateId) return t
    const sectionQs = t.questions[section]
    const newQ: TemplateQuestion = {
      id: `q${Date.now()}`,
      text,
      answerType,
      order: sectionQs.length,
    }
    const updated = {
      ...t,
      questions: { ...t.questions, [section]: [...sectionQs, newQ] },
    }
    updated.questionCount = Object.values(updated.questions).flat().length
    return updated
  }))
}, [])
```

- [ ] **Step 3: Implement `updateQuestion`**

```ts
const updateQuestion = useCallback((
  templateId: string,
  section: TemplateSection,
  questionId: string,
  patch: Pick<TemplateQuestion, 'text' | 'answerType'>
) => {
  setTemplates(ts => ts.map(t => {
    if (t.id !== templateId) return t
    return {
      ...t,
      questions: {
        ...t.questions,
        [section]: t.questions[section].map(q =>
          q.id === questionId ? { ...q, ...patch } : q
        ),
      },
    }
  }))
}, [])
```

- [ ] **Step 4: Implement `deleteQuestion`**

```ts
const deleteQuestion = useCallback((
  templateId: string,
  section: TemplateSection,
  questionId: string
) => {
  setTemplates(ts => ts.map(t => {
    if (t.id !== templateId) return t
    const filtered = t.questions[section].filter(q => q.id !== questionId)
    const updated = {
      ...t,
      questions: { ...t.questions, [section]: filtered.map((q, i) => ({ ...q, order: i })) },
    }
    updated.questionCount = Object.values(updated.questions).flat().length
    return updated
  }))
}, [])
```

- [ ] **Step 5: Implement `reorderQuestions`**

```ts
const reorderQuestions = useCallback((
  templateId: string,
  section: TemplateSection,
  fromIndex: number,
  toIndex: number
) => {
  setTemplates(ts => ts.map(t => {
    if (t.id !== templateId) return t
    const qs = [...t.questions[section]]
    const [moved] = qs.splice(fromIndex, 1)
    qs.splice(toIndex, 0, moved)
    return {
      ...t,
      questions: {
        ...t.questions,
        [section]: qs.map((q, i) => ({ ...q, order: i })),
      },
    }
  }))
}, [])
```

- [ ] **Step 6: Wire all four methods into the context value**

In the `PceContext.Provider value={{...}}` block, add:

```ts
addQuestion, updateQuestion, deleteQuestion, reorderQuestions,
```

- [ ] **Step 7: Fix `createTemplate` to include empty `questions` and default `likertPointer`**

Update the `createTemplate` callback so new templates always have valid `questions`:

```ts
const createTemplate = useCallback((
  tmpl: Omit<PceTemplate, 'id' | 'lastModified' | 'usedBySurveyCount'>
) => {
  setTemplates(ts => [
    ...ts,
    {
      ...tmpl,
      id: `t${Date.now()}`,
      lastModified: 'May 17, 2026',
      usedBySurveyCount: 0,
      questions: tmpl.questions ?? { course_content: [], faculty_performance: [], course_director: [] },
      likertPointer: tmpl.likertPointer ?? 5,
    },
  ])
}, [])
```

- [ ] **Step 8: Verify TypeScript**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 9: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/pce/admin/components/pce/pce-state.tsx && git commit -m "feat(pce): add question CRUD methods to usePce — addQuestion, updateQuestion, deleteQuestion, reorderQuestions"
```

---

## Task 3: Template editor page — full rewrite of `templates/[id]/page.tsx`

**Files:**
- Rewrite: `apps/pce/admin/app/(app)/templates/[id]/page.tsx`

This is the largest task. Build it top-to-bottom: header → sidebar → question list → expand card → zero state → drag → save/publish.

- [ ] **Step 1: Write the page skeleton with header + two-panel layout**

Replace the entire contents of `apps/pce/admin/app/(app)/templates/[id]/page.tsx` with:

```tsx
'use client'

import { useState, useRef } from 'react'
import { useParams } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Badge,
  Separator,
  SidebarTrigger,
  Textarea,
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  LocalBanner,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
  DragHandleGripIcon,
} from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import type { TemplateSection, TemplateQuestion } from '@/lib/pce-mock-data'

const SECTION_LABELS: Record<TemplateSection, string> = {
  course_content:     'Course Content',
  faculty_performance: 'Faculty Performance',
  course_director:    'Course Director',
}

const ALL_SECTIONS: TemplateSection[] = ['course_content', 'faculty_performance', 'course_director']

export default function TemplateEditorPage() {
  const { id } = useParams<{ id: string }>()
  const { templates, updateTemplate, addQuestion, updateQuestion, deleteQuestion, reorderQuestions } = usePce()
  const template = templates.find(t => t.id === id)

  const [activeSection, setActiveSection] = useState<TemplateSection>('course_content')
  // null = no card open; 'new' = add card; questionId = edit card for that question
  const [openCard, setOpenCard] = useState<'new' | string | null>(
    // auto-open add card on zero state
    () => {
      if (!template) return null
      const total = Object.values(template.questions).flat().length
      return total === 0 ? 'new' : null
    }
  )
  const [cardText, setCardText] = useState('')
  const [cardType, setCardType] = useState<'likert' | 'free_text'>('likert')
  const [saved, setSaved] = useState(false)
  const dragIndex = useRef<number | null>(null)

  if (!template) {
    return (
      <div className="flex flex-col items-center justify-center flex-1 gap-3 text-center py-20">
        <i className="fa-light fa-circle-exclamation text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <p className="text-sm font-medium">Template not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link href="/templates">Back to Templates</Link>
        </Button>
      </div>
    )
  }

  const totalQuestions = Object.values(template.questions).flat().length
  const canPublish = totalQuestions > 0

  // ── Card helpers ──────────────────────────────────────────────────────────

  function openAddCard() {
    setOpenCard('new')
    setCardText('')
    setCardType('likert')
  }

  function openEditCard(q: TemplateQuestion) {
    setOpenCard(q.id)
    setCardText(q.text)
    setCardType(q.answerType)
  }

  function closeCard() {
    setOpenCard(null)
    setCardText('')
    setCardType('likert')
  }

  function handleAdd() {
    if (!cardText.trim()) return
    addQuestion(template.id, activeSection, cardText.trim(), cardType)
    closeCard()
  }

  function handleEditSave(questionId: string) {
    if (!cardText.trim()) return
    updateQuestion(template.id, activeSection, questionId, { text: cardText.trim(), answerType: cardType })
    closeCard()
  }

  // ── Drag handlers ─────────────────────────────────────────────────────────

  function handleDragStart(index: number) {
    dragIndex.current = index
  }

  function handleDragOver(e: React.DragEvent, index: number) {
    e.preventDefault()
    if (dragIndex.current === null || dragIndex.current === index) return
    reorderQuestions(template.id, activeSection, dragIndex.current, index)
    dragIndex.current = index
  }

  function handleDragEnd() {
    dragIndex.current = null
  }

  // ── Save / Publish ────────────────────────────────────────────────────────

  function handleSaveDraft() {
    // State is live in usePce — "save" just gives feedback
    setSaved(true)
    setTimeout(() => setSaved(false), 3000)
  }

  function handlePublish() {
    updateTemplate(template.id, { status: 'active' })
  }

  function handleUnpublish() {
    updateTemplate(template.id, { status: 'draft' })
  }

  const sectionQs = template.questions[activeSection]

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* ── Header ── */}
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/templates" className="text-sm text-muted-foreground hover:underline">
          Templates
        </Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <span className="text-sm font-semibold flex-1 truncate">{template.name}</span>
        <Badge
          variant="secondary"
          className="rounded shrink-0"
          style={template.status === 'active'
            ? { backgroundColor: 'color-mix(in oklch, var(--brand-color) 10%, var(--background))', color: 'var(--brand-color-dark)' }
            : { backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)' }
          }
        >
          {template.status === 'active' ? 'Active' : 'Draft'}
        </Badge>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleSaveDraft}>
            Save draft
          </Button>
          {template.status === 'active' ? (
            <Button variant="outline" size="sm" onClick={handleUnpublish}>
              Unpublish
            </Button>
          ) : (
            <Tooltip>
              <TooltipTrigger asChild>
                <span>
                  <Button
                    variant="default"
                    size="sm"
                    disabled={!canPublish}
                    onClick={handlePublish}
                    style={!canPublish ? { pointerEvents: 'none' } : undefined}
                  >
                    Publish
                  </Button>
                </span>
              </TooltipTrigger>
              {!canPublish && (
                <TooltipContent>Add at least one question before publishing</TooltipContent>
              )}
            </Tooltip>
          )}
        </div>
      </header>

      {saved && (
        <div style={{ paddingInline: 28, paddingTop: 12 }}>
          <LocalBanner variant="success" onClose={() => setSaved(false)}>
            Draft saved.
          </LocalBanner>
        </div>
      )}

      {/* ── Two-panel body ── */}
      <div className="flex flex-1 overflow-hidden">

        {/* Section sidebar */}
        <aside
          className="flex flex-col gap-1 border-r border-border shrink-0 overflow-y-auto"
          style={{ width: 168, padding: '16px 10px', background: 'var(--muted)' }}
        >
          <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)', marginBottom: 6, paddingInline: 6 }}>
            Sections
          </p>
          {ALL_SECTIONS.map(section => {
            const count = template.questions[section].length
            const isActive = section === activeSection
            return (
              <button
                key={section}
                onClick={() => { setActiveSection(section); closeCard() }}
                className="flex items-center justify-between rounded-md text-sm px-2.5 py-2 text-left w-full transition-colors"
                style={isActive
                  ? { background: 'var(--brand-tint)', color: 'var(--brand-color)', fontWeight: 600 }
                  : { color: count === 0 ? 'var(--muted-foreground)' : 'var(--foreground)' }
                }
              >
                <span className="leading-tight">{SECTION_LABELS[section]}</span>
                <span className="text-xs tabular-nums ml-2" style={{ color: isActive ? 'var(--brand-color)' : 'var(--muted-foreground)' }}>
                  {count}
                </span>
              </button>
            )
          })}
        </aside>

        {/* Question list */}
        <main className="flex flex-col flex-1 overflow-y-auto" style={{ padding: '20px 28px 32px' }}>
          <div className="flex items-center gap-2 mb-4">
            <h2 className="text-sm font-semibold">{SECTION_LABELS[activeSection]}</h2>
            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
              · {sectionQs.length} question{sectionQs.length !== 1 ? 's' : ''}
            </span>
          </div>

          <div className="flex flex-col gap-2" style={{ maxWidth: 680 }}>
            {/* Zero state */}
            {sectionQs.length === 0 && openCard !== 'new' && (
              <div className="flex flex-col items-center gap-3 py-12 text-center">
                <i className="fa-light fa-list-ul text-4xl" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
                <div>
                  <p className="text-sm font-medium">No questions yet</p>
                  <p className="text-sm mt-0.5" style={{ color: 'var(--muted-foreground)' }}>
                    Add your first question to the {SECTION_LABELS[activeSection]} section.
                  </p>
                </div>
              </div>
            )}

            {/* Question rows */}
            {sectionQs.map((q, index) => (
              openCard === q.id ? (
                /* Edit card in place of the row */
                <ExpandCard
                  key={q.id}
                  text={cardText}
                  answerType={cardType}
                  likertPointer={template.likertPointer}
                  onTextChange={setCardText}
                  onTypeChange={setCardType}
                  onAdd={() => handleEditSave(q.id)}
                  onCancel={closeCard}
                  addLabel="Save"
                />
              ) : (
                <div
                  key={q.id}
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragOver={(e) => handleDragOver(e, index)}
                  onDragEnd={handleDragEnd}
                  className="flex items-start gap-2 rounded-lg border border-border bg-card px-3 py-2.5 group"
                  style={{ cursor: 'grab' }}
                >
                  <DragHandleGripIcon
                    className="mt-0.5 shrink-0 transition-colors"
                    style={{ color: 'var(--muted-foreground)', opacity: 0.4, fontSize: 14 }}
                    aria-hidden="true"
                  />
                  <span className="flex-1 text-sm leading-snug">{q.text}</span>
                  <Badge
                    variant="secondary"
                    className="rounded shrink-0 text-xs"
                    style={{ backgroundColor: 'var(--muted)', color: 'var(--muted-foreground)', fontWeight: 400 }}
                  >
                    {q.answerType === 'likert' ? `Likert ${template.likertPointer}` : 'Free text'}
                  </Badge>
                  <DropdownMenu modal={false}>
                    <DropdownMenuTrigger asChild>
                      <Button
                        variant="ghost"
                        size="icon-sm"
                        aria-label="Question actions"
                        onClick={(e) => e.stopPropagation()}
                        className="shrink-0 opacity-0 group-hover:opacity-100 focus:opacity-100"
                      >
                        <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                      <DropdownMenuItem onClick={() => openEditCard(q)}>
                        <i className="fa-light fa-pen" aria-hidden="true" />
                        Edit
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem
                        variant="destructive"
                        onClick={() => deleteQuestion(template.id, activeSection, q.id)}
                      >
                        <i className="fa-light fa-trash" aria-hidden="true" />
                        Delete
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              )
            ))}

            {/* Add card */}
            {openCard === 'new' && (
              <ExpandCard
                text={cardText}
                answerType={cardType}
                likertPointer={template.likertPointer}
                onTextChange={setCardText}
                onTypeChange={setCardType}
                onAdd={handleAdd}
                onCancel={closeCard}
                addLabel="Add"
              />
            )}

            {/* Add question button — hidden while a card is open */}
            {openCard === null && (
              <button
                onClick={openAddCard}
                className="flex items-center gap-2 rounded-lg border border-dashed text-sm px-3 py-2.5 transition-colors hover:bg-muted"
                style={{ borderColor: 'var(--border)', color: 'var(--muted-foreground)', maxWidth: 680 }}
              >
                <i className="fa-light fa-plus text-xs" aria-hidden="true" />
                Add question
              </button>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

// ── ExpandCard — shared between add and edit ──────────────────────────────

interface ExpandCardProps {
  text: string
  answerType: 'likert' | 'free_text'
  likertPointer: number
  addLabel: string
  onTextChange: (v: string) => void
  onTypeChange: (v: 'likert' | 'free_text') => void
  onAdd: () => void
  onCancel: () => void
}

function ExpandCard({ text, answerType, likertPointer, addLabel, onTextChange, onTypeChange, onAdd, onCancel }: ExpandCardProps) {
  return (
    <div
      className="flex flex-col gap-3 rounded-lg border-2 p-4"
      style={{ borderColor: 'var(--brand-color)', background: 'color-mix(in oklch, var(--brand-color) 4%, var(--background))' }}
    >
      <p className="text-xs font-semibold" style={{ color: 'var(--brand-color)' }}>New question</p>
      <Textarea
        autoFocus
        placeholder="Type your question…"
        value={text}
        onChange={e => onTextChange(e.target.value)}
        rows={2}
        onKeyDown={e => {
          if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) onAdd()
          if (e.key === 'Escape') onCancel()
        }}
        style={{ resize: 'none' }}
      />
      <div className="flex items-center gap-3">
        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>Answer type</span>
        <div className="flex gap-1.5">
          <Button
            variant={answerType === 'likert' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('likert')}
          >
            Likert {likertPointer}
          </Button>
          <Button
            variant={answerType === 'free_text' ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTypeChange('free_text')}
          >
            Free text
          </Button>
        </div>
      </div>
      <div className="flex items-center justify-end gap-2">
        <Button variant="outline" size="sm" onClick={onCancel}>Cancel</Button>
        <Button variant="default" size="sm" disabled={!text.trim()} onClick={onAdd}>
          {addLabel}
        </Button>
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Run the dev server and verify the editor loads**

```bash
kill $(lsof -ti :3005) 2>/dev/null; nohup bash -c 'cd /Users/romitsoley/Work/apps/pce/admin && pnpm dev' > /tmp/pce-dev.log 2>&1 &
```

Open http://localhost:3005/templates/tmpl1 — should see the two-panel editor with 5 Course Content questions.

Open http://localhost:3005/templates/tmpl3 — should see zero state with the expand card pre-opened.

- [ ] **Step 3: Verify core interactions**

Check each manually:
- [ ] Click a section in the sidebar — question list switches
- [ ] Click "Add question" → expand card appears, focused
- [ ] Type a question, pick "Free text", click Add → question appears in list with "Free text" badge
- [ ] Click `⋯` on a question → Edit → card pre-fills → Save → question updated
- [ ] Click `⋯` → Delete → question removed, count in sidebar updates
- [ ] Drag a question row up/down — order changes
- [ ] Publish disabled on tmpl3 (0 questions); enabled on tmpl1
- [ ] Click Publish on tmpl1 → badge changes to "Active", button becomes "Unpublish"
- [ ] Click "Save draft" → success banner appears, auto-dismisses after 3 s

- [ ] **Step 4: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck 2>&1 | head -30
```

Expected: no errors.

- [ ] **Step 5: Commit**

```bash
cd /Users/romitsoley/Work && git add apps/pce/admin/app/\(app\)/templates/\[id\]/page.tsx && git commit -m "feat(pce/T28): full-page template editor — section sidebar, question list, expand card, drag reorder, save/publish"
```

---

## Task 4: Push survey page — `surveys/push/page.tsx`

**Files:**
- Create: `apps/pce/admin/app/(app)/surveys/push/page.tsx`

- [ ] **Step 1: Create `app/(app)/surveys/push/page.tsx`**

```tsx
'use client'

import { useState, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import {
  Button,
  Separator,
  SidebarTrigger,
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
  Checkbox,
  LocalBanner,
  Badge,
} from '@exxat/ds/packages/ui/src'
import { DatePickerField } from '@exxat/ds/packages/ui/src'
import { usePce } from '@/components/pce/pce-state'
import { TemplateSectionChips } from '@/components/pce/pce-badges'
import {
  MOCK_PROGRAM_TERMS,
  MOCK_COURSE_OFFERINGS,
  MOCK_FACULTY,
  MOCK_MASTER_COURSES,
  SECTION_LABELS,
} from '@/lib/pce-mock-data'
import type { PceTemplate } from '@/lib/pce-mock-data'

/** YYYY-MM-DD ↔ Date helpers (same pattern as terms/page.tsx) */
function ymdToDate(ymd: string): Date | undefined {
  if (!ymd) return undefined
  const [y, m, d] = ymd.split('-').map(Number)
  if (!y || !m || !d) return undefined
  return new Date(y, m - 1, d)
}
function dateToYmd(d: Date | undefined): string {
  if (!d) return ''
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

type Step = 1 | 2 | 3

export default function PushSurveyPage() {
  const router = useRouter()
  const { templates, createSurvey } = usePce()

  const [step, setStep] = useState<Step>(1)
  const [selectedTemplateId, setSelectedTemplateId] = useState<string | null>(null)
  const [selectedTermId, setSelectedTermId] = useState<string>('')
  const [selectedOfferingIds, setSelectedOfferingIds] = useState<Set<string>>(new Set())
  const [openDate, setOpenDate] = useState<Date | undefined>(undefined)
  const [closeDate, setCloseDate] = useState<Date | undefined>(undefined)
  const [dateError, setDateError] = useState<string | null>(null)

  const publishedTemplates = templates.filter(t => t.status === 'active')
  const selectedTemplate = publishedTemplates.find(t => t.id === selectedTemplateId) ?? null

  const activeTerms = MOCK_PROGRAM_TERMS.filter(t => t.status === 'active')
  const selectedTerm = activeTerms.find(t => t.id === selectedTermId) ?? null

  const offeringsForTerm = useMemo(
    () => selectedTermId
      ? MOCK_COURSE_OFFERINGS.filter(o => o.termId === selectedTermId && o.status !== 'archived')
      : [],
    [selectedTermId]
  )

  function toggleOffering(id: string) {
    setSelectedOfferingIds(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function toggleAll() {
    if (selectedOfferingIds.size === offeringsForTerm.length) {
      setSelectedOfferingIds(new Set())
    } else {
      setSelectedOfferingIds(new Set(offeringsForTerm.map(o => o.id)))
    }
  }

  function validateDates(): boolean {
    if (!openDate || !closeDate) {
      setDateError('Both open date and close date are required.')
      return false
    }
    if (closeDate <= openDate) {
      setDateError('Close date must be after open date.')
      return false
    }
    setDateError(null)
    return true
  }

  function handlePush() {
    if (!validateDates()) return
    if (!selectedTemplate || !selectedTerm) return

    const offerings = offeringsForTerm.filter(o => selectedOfferingIds.has(o.id))
    offerings.forEach(offering => {
      const masterCourse = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
      const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
      createSurvey({
        courseCode: masterCourse?.code ?? offering.masterCourseId,
        courseName: masterCourse?.name ?? '',
        term: selectedTerm.name,
        templateId: selectedTemplate.id,
        status: 'collecting',
        instructors: faculty
          ? [{ id: faculty.id, name: faculty.name, initials: faculty.initials, role: 'primary' }]
          : [],
        enrollmentCount: offering.enrolledCount,
        deadline: dateToYmd(closeDate),
      })
    })

    router.push('/surveys?pushed=1')
  }

  // ── Step progress indicator ───────────────────────────────────────────────

  function StepIndicator() {
    const steps = [
      { n: 1, label: 'Select template' },
      { n: 2, label: 'Select courses' },
      { n: 3, label: 'Set window' },
    ]
    return (
      <div className="flex items-center gap-0 mb-8">
        {steps.map(({ n, label }, i) => (
          <div key={n} className="flex items-center gap-0">
            <div className="flex items-center gap-2">
              <div
                className="flex items-center justify-center rounded-full text-xs font-semibold shrink-0"
                style={{
                  width: 24, height: 24,
                  background: step >= n ? 'var(--brand-color)' : 'var(--muted)',
                  color: step >= n ? '#fff' : 'var(--muted-foreground)',
                }}
              >
                {step > n ? <i className="fa-solid fa-check" aria-hidden="true" style={{ fontSize: 10 }} /> : n}
              </div>
              <span className="text-sm" style={{ color: step === n ? 'var(--foreground)' : 'var(--muted-foreground)', fontWeight: step === n ? 600 : 400 }}>
                {label}
              </span>
            </div>
            {i < steps.length - 1 && (
              <div className="mx-3 h-px flex-1" style={{ width: 32, background: 'var(--border)' }} />
            )}
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="flex flex-col flex-1 overflow-hidden">
      {/* Header */}
      <header className="flex items-center gap-2 border-b border-border shrink-0" style={{ padding: '18px 28px 14px' }}>
        <SidebarTrigger className="-ms-1" />
        <Separator orientation="vertical" className="h-4" />
        <Link href="/surveys" className="text-sm text-muted-foreground hover:underline">Surveys</Link>
        <i className="fa-light fa-chevron-right text-xs" aria-hidden="true" style={{ color: 'var(--muted-foreground)' }} />
        <h1 className="text-sm font-semibold flex-1">Push survey</h1>
      </header>

      <div className="flex-1 overflow-auto" style={{ padding: '32px 28px 48px', maxWidth: 680 }}>
        <StepIndicator />

        {/* ── Step 1: Select template ── */}
        {step === 1 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">Select a template</h2>
            <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>
              Only published templates can be used to push a survey.
            </p>
            {publishedTemplates.length === 0 ? (
              <div className="flex flex-col items-center gap-2 py-12 text-center border border-dashed rounded-lg" style={{ borderColor: 'var(--border)' }}>
                <p className="text-sm font-medium">No published templates yet</p>
                <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>Publish a template first, then push it as a survey.</p>
                <Button variant="outline" size="sm" asChild>
                  <Link href="/templates">Go to Templates</Link>
                </Button>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {publishedTemplates.map(t => (
                  <button
                    key={t.id}
                    onClick={() => setSelectedTemplateId(t.id)}
                    className="flex items-start gap-3 rounded-lg border px-4 py-3 text-left transition-colors"
                    style={{
                      borderColor: selectedTemplateId === t.id ? 'var(--brand-color)' : 'var(--border)',
                      background: selectedTemplateId === t.id
                        ? 'color-mix(in oklch, var(--brand-color) 5%, var(--background))'
                        : 'var(--background)',
                    }}
                  >
                    <div
                      className="mt-0.5 flex items-center justify-center rounded-full shrink-0"
                      style={{
                        width: 18, height: 18,
                        border: selectedTemplateId === t.id ? '5px solid var(--brand-color)' : '2px solid var(--border)',
                        background: 'var(--background)',
                        transition: 'border-color 0.1s',
                      }}
                    />
                    <div className="flex flex-col gap-1.5 flex-1 min-w-0">
                      <span className="text-sm font-medium">{t.name}</span>
                      <div className="flex items-center gap-3">
                        <TemplateSectionChips sections={t.sections} />
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          {t.questionCount} question{t.questionCount !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                          Modified {t.lastModified}
                        </span>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
            <div className="flex justify-end pt-2">
              <Button
                variant="default"
                size="sm"
                disabled={!selectedTemplateId}
                onClick={() => setStep(2)}
              >
                Next
                <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 2: Select term + courses ── */}
        {step === 2 && (
          <div className="flex flex-col gap-4">
            <h2 className="text-base font-semibold">Select term and course offerings</h2>

            <div className="flex flex-col gap-1.5">
              <label className="text-sm font-medium">Term</label>
              <Select value={selectedTermId} onValueChange={v => { setSelectedTermId(v); setSelectedOfferingIds(new Set()) }}>
                <SelectTrigger className="w-64" aria-label="Select term">
                  <SelectValue placeholder="Choose a term…" />
                </SelectTrigger>
                <SelectContent>
                  {activeTerms.map(t => (
                    <SelectItem key={t.id} value={t.id}>{t.name} · {t.academicYear}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTermId && (
              <>
                <div className="flex items-center justify-between mt-2">
                  <p className="text-sm font-medium">
                    Course offerings
                    {selectedOfferingIds.size > 0 && (
                      <span className="ml-2 font-normal" style={{ color: 'var(--muted-foreground)' }}>
                        — {selectedOfferingIds.size} selected
                      </span>
                    )}
                  </p>
                  {offeringsForTerm.length > 0 && (
                    <button
                      onClick={toggleAll}
                      className="text-xs underline"
                      style={{ color: 'var(--brand-color)' }}
                    >
                      {selectedOfferingIds.size === offeringsForTerm.length ? 'Deselect all' : 'Select all'}
                    </button>
                  )}
                </div>

                {offeringsForTerm.length === 0 ? (
                  <p className="text-sm" style={{ color: 'var(--muted-foreground)' }}>No active course offerings for this term.</p>
                ) : (
                  <div className="flex flex-col gap-1.5">
                    {offeringsForTerm.map(offering => {
                      const course = MOCK_MASTER_COURSES.find(c => c.id === offering.masterCourseId)
                      const faculty = MOCK_FACULTY.find(f => f.id === offering.primaryFacultyId)
                      const checked = selectedOfferingIds.has(offering.id)
                      return (
                        <label
                          key={offering.id}
                          className="flex items-center gap-3 rounded-lg border px-3 py-2.5 cursor-pointer transition-colors"
                          style={{
                            borderColor: checked ? 'var(--brand-color)' : 'var(--border)',
                            background: checked ? 'color-mix(in oklch, var(--brand-color) 5%, var(--background))' : 'var(--background)',
                          }}
                        >
                          <Checkbox
                            checked={checked}
                            onCheckedChange={() => toggleOffering(offering.id)}
                            aria-label={`Select ${course?.code}`}
                          />
                          <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                            <span className="text-sm font-medium">{course?.code} — {course?.name}</span>
                            <span className="text-xs" style={{ color: 'var(--muted-foreground)' }}>
                              {faculty?.name ?? 'Unassigned'} · {offering.enrolledCount} enrolled · {offering.cohort}
                            </span>
                          </div>
                        </label>
                      )
                    })}
                  </div>
                )}
              </>
            )}

            <div className="flex items-center justify-between pt-2">
              <Button variant="outline" size="sm" onClick={() => setStep(1)}>
                <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
                Back
              </Button>
              <Button
                variant="default"
                size="sm"
                disabled={selectedOfferingIds.size === 0}
                onClick={() => setStep(3)}
              >
                Next
                <i className="fa-light fa-arrow-right" aria-hidden="true" style={{ fontSize: 12 }} />
              </Button>
            </div>
          </div>
        )}

        {/* ── Step 3: Set window + review ── */}
        {step === 3 && selectedTemplate && selectedTerm && (
          <div className="flex flex-col gap-6">
            <h2 className="text-base font-semibold">Set distribution window</h2>

            {dateError && (
              <LocalBanner variant="error" onClose={() => setDateError(null)}>
                {dateError}
              </LocalBanner>
            )}

            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Opens on</label>
                <DatePickerField
                  label="Open date"
                  value={openDate}
                  onChange={setOpenDate}
                />
              </div>
              <div className="flex flex-col gap-1.5">
                <label className="text-sm font-medium">Closes on</label>
                <DatePickerField
                  label="Close date"
                  value={closeDate}
                  onChange={setCloseDate}
                />
              </div>
            </div>

            {/* Review summary */}
            <div className="rounded-lg border border-border p-4 flex flex-col gap-3" style={{ background: 'var(--muted)' }}>
              <p className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--muted-foreground)' }}>Summary</p>
              <div className="flex flex-col gap-2 text-sm">
                <div className="flex gap-3">
                  <span style={{ color: 'var(--muted-foreground)', minWidth: 80 }}>Template</span>
                  <span className="font-medium">{selectedTemplate.name}</span>
                </div>
                <div className="flex gap-3">
                  <span style={{ color: 'var(--muted-foreground)', minWidth: 80 }}>Term</span>
                  <span className="font-medium">{selectedTerm.name}</span>
                </div>
                <div className="flex gap-3">
                  <span style={{ color: 'var(--muted-foreground)', minWidth: 80 }}>Courses</span>
                  <span className="font-medium">{selectedOfferingIds.size} course offering{selectedOfferingIds.size !== 1 ? 's' : ''}</span>
                </div>
                <div className="flex gap-3">
                  <span style={{ color: 'var(--muted-foreground)', minWidth: 80 }}>Window</span>
                  <span className="font-medium">
                    {openDate ? openDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                    {' → '}
                    {closeDate ? closeDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <Button variant="outline" size="sm" onClick={() => setStep(2)}>
                <i className="fa-light fa-arrow-left" aria-hidden="true" style={{ fontSize: 12 }} />
                Back
              </Button>
              <Button variant="default" size="sm" onClick={handlePush}>
                <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
                Push survey
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
```

- [ ] **Step 2: Verify page loads**

Open http://localhost:3005/surveys/push — should see Step 1 with the template list.

- [ ] **Step 3: Walk through the full flow manually**

- [ ] Step 1: Select "End-of-Term Evaluation" → Next enabled → click Next
- [ ] Step 2: Pick "Spring 2026" → course offerings appear → check 2 → "2 selected" shows → Next
- [ ] Step 3: Set open + close dates → Summary card populates → click "Push survey" → redirected to `/surveys`

- [ ] **Step 4: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck 2>&1 | head -30
```

- [ ] **Step 5: Commit**

```bash
cd /Users/romitsoley/Work && git add "apps/pce/admin/app/(app)/surveys/push/page.tsx" && git commit -m "feat(pce/T29): 3-step push survey page — select template, term+courses, distribution window"
```

---

## Task 5: Wire entry point + success banner into `surveys/page.tsx`

**Files:**
- Modify: `apps/pce/admin/app/(app)/surveys/page.tsx`

- [ ] **Step 1: Add `useSearchParams` import and `Suspense` wrapper**

At the top of `surveys/page.tsx`, add to the existing Next.js import:

```ts
import { useSearchParams } from 'next/navigation'
import { Suspense } from 'react'
```

Also add `LocalBanner` to the existing DS import block:

```ts
  LocalBanner,
```

- [ ] **Step 2: Add `Link` import (already present — skip if already there)**

Check the existing imports. `Link` from `'next/link'` is already imported. Skip this step if confirmed.

- [ ] **Step 3: Replace the "Create Survey" button with a "Push survey" button and add the success banner**

In `SurveysPage`, change the header button from:

```tsx
        <Button variant="default" size="sm" onClick={() => setCreateOpen(true)}>
          <i className="fa-light fa-plus" aria-hidden="true" style={{ fontSize: 12 }} />
          Create Survey
        </Button>
```

To:

```tsx
        <Button variant="default" size="sm" asChild>
          <Link href="/surveys/push">
            <i className="fa-light fa-paper-plane" aria-hidden="true" style={{ fontSize: 12 }} />
            Push survey
          </Link>
        </Button>
```

- [ ] **Step 4: Add success banner component that reads `?pushed=1`**

Add this component just before the `export default function SurveysPage()` declaration:

```tsx
function PushedBanner() {
  const params = useSearchParams()
  if (!params.get('pushed')) return null
  return (
    <div style={{ paddingInline: 28, paddingTop: 12 }}>
      <LocalBanner variant="success">
        Survey pushed successfully. It is now collecting responses.
      </LocalBanner>
    </div>
  )
}
```

- [ ] **Step 5: Mount `PushedBanner` inside a `<Suspense>` wrapper in `SurveysPage`**

After the closing `</header>` tag and before the term filter `<div>`, insert:

```tsx
      <Suspense>
        <PushedBanner />
      </Suspense>
```

- [ ] **Step 6: Verify full round trip**

- Navigate to http://localhost:3005/surveys — header now shows "Push survey" button
- Click "Push survey" → goes to `/surveys/push`
- Complete all 3 steps → lands back on `/surveys` → success banner shows
- Newly pushed surveys appear in the DataTable

- [ ] **Step 7: Typecheck**

```bash
cd /Users/romitsoley/Work/apps/pce/admin && pnpm typecheck 2>&1 | head -30
```

- [ ] **Step 8: Commit**

```bash
cd /Users/romitsoley/Work && git add "apps/pce/admin/app/(app)/surveys/page.tsx" && git commit -m "feat(pce/T29): add Push survey entry point + success banner to surveys list"
```

---

## Spec coverage check

| Spec requirement | Task |
|---|---|
| Template editor — full-page layout, section sidebar, question list | Task 3 |
| Add question — expand card, textarea, Likert/free text toggle, Add/Cancel | Task 3 |
| Zero state — empty state + expand card pre-opened | Task 3 |
| Edit question — card pre-filled with existing text | Task 3 |
| Delete question — immediate, no confirmation | Task 3 |
| Drag reorder within section | Task 3 |
| Likert pointer defaults to 5 until T30 | Tasks 1, 3 |
| Publish disabled until ≥1 question | Task 3 |
| Save draft → success banner | Task 3 |
| `TemplateQuestion` type + `questions` field on `PceTemplate` | Task 1 |
| `addQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions` on `usePce` | Task 2 |
| Push survey — Step 1: select template (published only) | Task 4 |
| Push survey — Step 2: select term + courses, checkbox multi-select, select-all | Task 4 |
| Push survey — Step 3: DatePickerField open + close, validation, summary card | Task 4 |
| Push survey — success redirect + LocalBanner on surveys page | Tasks 4, 5 |
| DS components throughout (DragHandleGripIcon, DatePickerField, Checkbox, Badge, LocalBanner, etc.) | Tasks 3, 4, 5 |
| No toast — banners only | Tasks 3, 4, 5 |
