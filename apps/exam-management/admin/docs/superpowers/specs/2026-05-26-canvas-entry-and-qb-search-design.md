# Assessment Canvas Entry + QB AI Search — Design Spec

## What this builds

Two features that complete the assessment creation flow:

1. **Canvas creation entry** — Replaces the 3-step `CreateAssessmentModal` dialog with a full-page canvas. The header carries metadata (name, type, date, duration, collaborators). The canvas body is a single prompt box + quick-start chips.

2. **QB picker AI search** — Adds a command-palette-style text search input to `ABQuestionPicker` that replaces the smart-view chips. Compact single-line input with sparkle icon, removable filter tags, result count. Questions filter live as you type.

---

## Feature 1 — Canvas creation entry

### Route

New page: `app/(app)/assessment-builder/create/page.tsx`

Navigated to from course detail via: `/assessment-builder/create?courseId=X&offeringId=Y`

The existing `CreateAssessmentModal` stays in place for now (used from the assessments list). The canvas is an alternative entry from course detail pages.

### Header

The `site-header` carries all metadata inline — no separate form panel:

| Slot | Component | Behavior |
|---|---|---|
| Back link | `← Cardiology I` | routes back to course detail |
| Separator | `/` | static |
| Name | `<input>` inline, underlined with `--brand-color` | required, validates on submit |
| Type chip | tappable pill — `Exam` / `Quiz` / `OSCE` | cycles or opens a 3-option popover |
| Date chip | tappable pill — `May 30` | opens a date picker popover |
| Duration chip | tappable pill — `90 min` | opens a number input popover |
| Collaborators | stacked avatar row + dashed `+` button | opens faculty picker popover (see below) |
| Right | `Draft` badge + `Discard` button | Discard → confirm then route back |

**Name validation:** required. Error surfaces as a `LocalBanner variant="destructive"` below the header if the user submits without a name.

### Collaborator picker popover

Opens when clicking `+` or any existing avatar.

- `Input` for search — filters `facultyListRows` by name
- Results as flat rows: avatar initial + full name + role
- Checkbox per row — selected = collaborator on this assessment
- Already-selected names appear at top with a checkmark
- Max display: 5 avatars in header; overflow as `+N` chip
- Selected faculty IDs stored in `collaboratorIds: string[]` on the draft
- These IDs are pre-populated as options in section assignment (Scene 3c — contributors/graders)

### Canvas body

Gradient rose background (existing `.canvas-wrap` CSS). Center column, 520px wide.

```
"What should this look like?"
[subtitle — describe sections, topics, faculty, timing]

[prompt-box]
  <textarea rows="3" placeholder="3 sections, 20 questions each…" />
  [footer chips: 📋 Copy from: last year's | 📎 Attach blueprint | [send button]]

[quick-start chips below: Blank start | Copy last year's | Import PDF | Use blueprint]
```

Prompt is optional — if empty and user hits send, assessment opens as blank.

### Submit → builder

On submit (prompt or quick-start chip):

1. Validate name (required). If missing → show error, stay on canvas.
2. Call `addDraft({ courseId, offeringId, title, durationMinutes, collaboratorIds, diffDistribution: {Easy:0,Medium:0,Hard:0}, questionCount: 0 })`
3. Store prompt text in `sessionStorage` under key `asmt-creation-prompt-${draft.id}` (builder reads it to pre-populate; cleared after first read).
4. Route to `/assessment-builder?draftId=${draft.id}&courseId=${courseId}`

### Data model changes

`AssessmentDraft` in `lib/qb-types.ts` — add:

```ts
collaboratorIds?: string[]
```

`Assessment` (persisted) — add:

```ts
collaboratorIds?: string[]
```

`assessment-draft-store.tsx` — pass `collaboratorIds` through in `addDraft`.

---

## Feature 2 — QB picker AI search bar

### Where

`ABQuestionPicker` in `assessment-builder-client.tsx` — replaces the smart-view chips bar (lines ~1242–1284).

### New component

`components/assessment-builder/step2-qb-search-bar.tsx`

Props:
```ts
interface QbSearchBarProps {
  value: string
  onChange: (v: string) => void
  activeFilters: QbFilter[]
  onRemoveFilter: (key: string) => void
  onAddFilter: () => void
  resultCount: number
}

interface QbFilter {
  key: string        // 'difficulty' | 'type' | 'blooms'
  label: string      // 'Medium' | 'MCQ' | 'Analyze'
}
```

### Layout

```
[✦ sparkle icon] [text input — "RAAS inhibitors, medium difficulty, MCQ"] [↵ search hint]

[Filters: ] [MCQ ×] [Medium ×] [+ filter]

9 questions · sorted by relevance + PBI
```

- Input: `border: 1.5px solid var(--foreground); border-radius: 8px; padding: 9px 12px`
- Sparkle icon: `fa-light fa-sparkles`, `color: var(--muted-foreground)`
- `↵ search` hint: small muted badge on right edge
- Filter tags: `background: var(--muted); border: 1px solid var(--border); border-radius: 20px; padding: 2px 8px`
- `+ filter` tag: `border: 1px dashed var(--border)`, opens a small popover with difficulty/type/blooms pickers
- Result count line: `font-size: 13px; color: var(--muted-foreground)`

### Filtering logic

`value` (search query) filters `filteredQuestions` by `q.title.toLowerCase().includes(query.toLowerCase())`.

`activeFilters` replace the previous smart-view filter system for the search bar path:
- `key: 'difficulty'` → `q.difficulty === label`
- `key: 'type'` → `q.type === label`
- `key: 'blooms'` → `q.blooms === label`

Smart-view chips are removed. The content-area chips (All / Cardio / Renal / …) stay — they're navigation, not search.

### State in ABQuestionPicker

```ts
const [searchQuery, setSearchQuery] = useState('')
const [activeFilters, setActiveFilters] = useState<QbFilter[]>([])
```

`filteredQuestions` adds search + filter pass after the existing `contentAreaFilteredQuestions`:

```ts
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

---

## Out of scope

- AI server-side ranking (search is client-side substring for now)
- Persisting collaborator assignments to sections automatically (coordinator still assigns per-section manually in Scene 3c — collaborators just pre-populate the picker)
- Prompt parsing / AI scaffold generation (prompt text is stored and displayed; actual parsing is Phase 2)
- `CreateAssessmentModal` removal (kept as-is, canvas is additive)

---

## Files touched

| Action | File |
|---|---|
| Create | `app/(app)/assessment-builder/create/page.tsx` |
| Create | `app/(app)/assessment-builder/create/create-canvas-client.tsx` |
| Create | `components/assessment-builder/step2-qb-search-bar.tsx` |
| Modify | `lib/qb-types.ts` — add `collaboratorIds` to `AssessmentDraft` + `Assessment` |
| Modify | `lib/assessment-draft-store.tsx` — pass `collaboratorIds` through |
| Modify | `app/(app)/assessment-builder/assessment-builder-client.tsx` — replace smart-view chips with `QbSearchBar`, wire `searchQuery` + `activeFilters` into `filteredQuestions` |
| Modify | `app/(app)/courses/[id]/tabs/assessments-tab.tsx` — add "New assessment" button that links to canvas route |
