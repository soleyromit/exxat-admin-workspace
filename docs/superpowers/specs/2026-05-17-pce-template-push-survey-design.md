# PCE — Template Question Builder + Push Survey
**Date:** 2026-05-17
**Tasks:** T28 (create template UI), T29 (push survey UI)
**App:** `apps/pce/admin/`
**Source decisions:** Aarti 2026-05-08, Adi 2026-05-14 (granola 6a648f67)

---

## Scope

Phase 1, traditional flow only. No AI-native flow, no question bank import, no LMS integration.

Two surfaces:
1. **Template editor** — full-page experience for building a survey template question by question
2. **Push survey** — dedicated multi-step page for pushing a published template to a term + courses

---

## T28 — Template editor

### Route
`/templates/[id]` — replaces the current read-only detail page. The detail page IS the editor.

### Layout

Full-page editor split into two panels:

```
┌─ breadcrumb ──────────────────────────────────── [Save draft] [Publish] ─┐
│ Templates › {name}   [Draft badge]                                        │
├──────────────┬────────────────────────────────────────────────────────────┤
│  SECTIONS    │  {Active section} · {n} questions                          │
│  ──────────  │                                                             │
│  Course      │  [drag] Question text…………………………………  [Likert 5]  [⋯]      │
│  Content  5  │  [drag] Question text…………………………………  [Free text] [⋯]      │
│              │                                                             │
│  Faculty     │  ┌─ New question ──────────────────────────────────────┐   │
│  Perf.    0  │  │ [textarea: Type your question…]                     │   │
│              │  │ Answer type: [Likert ●] [Free text ○]               │   │
│  Course      │  │                              [Cancel]  [Add]        │   │
│  Director 0  │  └────────────────────────────────────────────────────-┘   │
│              │                                                             │
└──────────────┴────────────────────────────────────────────────────────────┘
```

**Section sidebar (130px, fixed):**
- Sections: Course Content, Faculty Performance, Course Director — fixed set, not user-created
- Each shows question count
- Active section: `--brand-tint` background + `--brand-color` text
- Inactive sections with 0 questions: muted text
- Clicking a section switches the question list on the right

**Question list (flex-1):**
- Each question row: drag handle (`DragHandleGrip` DS component) + question text + answer type badge + row actions menu (`⋯`)
- Row actions: Edit, Delete
  - Edit: replaces that question row with the expand card pre-filled with existing text + answer type; saving updates in place
  - Delete: removes immediately, no confirmation (question count in section sidebar updates)
- Questions are reorderable within a section via drag; order persists to mock state (`order` field on `TemplateQuestion`)
- Answer type badge: `Likert {n}` (where n = program's configured Likert pointer from settings, defaulting to 5 until T30 settings page is built) or `Free text`

**Add question — expand card:**
- `+ Add question` button at the bottom of the question list
- On click: expand card appears below the last question (not a modal, not a sheet)
- Card contains:
  - `<Textarea>` for question text (auto-focused, required)
  - Answer type toggle: Likert | Free text (Likert selected by default)
  - `Cancel` + `Add` buttons
- Add is disabled if textarea is empty
- On Add: question appended to section, expand card closes, `+ Add question` re-appears
- Only one expand card open at a time

**Zero state (new template, no questions):**
- Empty state illustration + "No questions yet" heading + 1-line instruction
- Expand card pre-opened below the empty state — program director immediately knows what to do
- No extra click required to start adding

**Save / Publish:**
- `Save draft`: always enabled, saves current state without status change
- `Publish`: disabled (greyed, `disabled` prop) until ≥1 section has ≥1 question
- On Publish: status changes to `active`, button changes to `Unpublish`
- Status badge in breadcrumb row: `Draft` / `Active` — `Badge` DS component, `className="rounded"`, colors via `style` prop (brand tint for active, muted for draft)

### Data model additions needed in `pce-mock-data.ts`

Current `PceTemplate` has `questionCount: number`. Needs to be extended to hold actual questions:

```ts
interface TemplateQuestion {
  id: string
  text: string
  answerType: 'likert' | 'free_text'
  order: number
}

// extend PceTemplate:
questions: Record<TemplateSection, TemplateQuestion[]>
```

`usePce()` state needs: `addQuestion`, `updateQuestion`, `deleteQuestion`, `reorderQuestions`.

### DS components used
`SidebarTrigger`, `Separator`, `Button`, `Textarea`, `Badge`, `DragHandleGrip`, `DropdownMenu` (row actions), `Tooltip`, `LocalBanner` (save feedback)

---

## T29 — Push survey

### Route
`/surveys/push` — new page, accessed via "Push survey" button on `/surveys`.

### Flow — 3 steps

```
Step 1 ─────────────────── Step 2 ──────────────────── Step 3
Select template            Select term + courses        Set window + review
```

Breadcrumb: `Surveys › Push survey`

**Step 1 — Select template**
- List of published (active) templates
- Each row: template name, section chips (`TemplateSectionChips`), question count, last modified
- Single selection — clicking a row selects it (highlight + checkmark)
- "Next →" button enabled once a template is selected

**Step 2 — Select term + courses**
- `Select` for term (populated from `MOCK_TERMS`, active terms only)
- On term select: course offerings for that term appear as a multi-select list
- Each offering row: course code, course name, faculty name, enrolled count
- Checkboxes via DS `Checkbox` component
- "Select all" affordance
- Count indicator: "3 courses selected"
- "← Back" + "Next →"

**Step 3 — Set window + review**
- Open date + Close date via DS `DatePickerField` (both required)
- Validation: close date must be after open date
- Review summary card: template name, term, N courses, window dates
- `LocalBanner variant="error"` for date validation failures (no toast)
- "← Back" + "Push survey" (primary CTA)
- On success: redirect to `/surveys`, `LocalBanner variant="success"` on that page confirming push

### State management
Step state lives in component-local `useState` — no URL params needed since the flow is linear. On browser back/forward, user restarts from Step 1 (acceptable for Phase 1).

### DS components used
`Button`, `Select` + subcomponents, `Checkbox`, `DatePickerField`, `Badge`, `LocalBanner`, `Separator`, `SidebarTrigger`, `TemplateSectionChips` (existing PCE component)

---

## What is NOT in scope (Phase 1)

- AI-native survey flow
- Question bank import
- LMS/Canvas integration (data is manual/mock)
- Analytics after survey is pushed
- Student response view
- Editing a pushed survey (surveys are immutable once pushed)

---

## Files to create / modify

| File | Action |
|---|---|
| `app/(app)/templates/[id]/page.tsx` | Rewrite — full-page editor |
| `app/(app)/surveys/push/page.tsx` | Create — 3-step push flow |
| `app/(app)/surveys/page.tsx` | Add "Push survey" button + success banner |
| `lib/pce-mock-data.ts` | Extend `PceTemplate` + `usePce` with question CRUD |
| `components/pce/pce-modals.tsx` | Remove `CreateTemplateSheet` question-count stub (replaced by editor) |
