# PCE UX Redesign — Design Spec

> **For agentic workers:** This spec feeds directly into writing-plans. Do not implement until a plan exists.

**Goal:** Fix 5 concrete UX failures across the PCE admin and student apps — admin dashboard structure, student survey progress, student re-edit path, faculty results reading model, and copy/taxonomy mismatches.

**Apps in scope:**
- `apps/pce/admin/` — Next.js, Admin DS (`@exxat/ds`), theme-prism
- `apps/pce/student/` — Next.js, Student DS (`@exxat/student`), theme-one

**Visual references:** `/apps/pce/admin/.superpowers/brainstorm/43360-1776958379/content/`
- `admin-dashboard-v2.html` — status-grouped dashboard
- `student-survey-v2.html` — segmented pip progress bar
- `faculty-results-v2.html` — three sentiment groups
- `student-submitted.html` — re-edit after submission

---

## Fix 1 — Admin Dashboard: Status-Grouped Survey List

### Problem

The current `/surveys` page is a flat table. All 7+ surveys appear in the same rows regardless of status. When an admin opens the page, there is no priority signal — a survey needing immediate action (pending review) sits next to closed surveys from last semester. The raw `<input>` search element is a DS violation.

### Decision: Status-grouped sections, not Kanban

Kanban was considered and rejected — it doesn't scale to 40+ courses per term (horizontal scrolling, small card text). Grouped sections within a single scrollable column scale cleanly and are already familiar from email clients (Gmail Priority Inbox), issue trackers (Linear), and task apps (Things 3).

### Group Structure

```
┌─────────────────────────────────────────────────────────┐
│  Surveys                                   [+ New] [↕]  │  ← page header
├─────────────────────────────────────────────────────────┤
│  [Search input — DS InputGroup + Input]                  │
├─────────────────────────────────────────────────────────┤
│                                                          │
│  ── Needs Action  (3) ──────────────────────────────    │  ← group header: thin border-top, muted label
│  [ row ] BIO 201   Dr. Patel    pending_review  ...     │
│  [ row ] MED 410   Dr. Chen     pending_review  ...     │
│  [ row ] NUR 305   Dr. Reeves   pending_review  ...     │
│                                                          │
│  ── Collecting  (2) ────────────────────────────────    │
│  [ row ] CHE 101   Dr. Kim      collecting      ...     │
│  [ row ] PHY 202   Dr. Singh    collecting      ...     │
│                                                          │
│  ── Draft  (1) ─────────────────────────────────────   │
│  [ row ] LAB 401   —            draft           ...     │
│                                                          │
│  ── Shared with Faculty  (1) ───────────────────────   │  ← collapsed by default
│  [ row ] PSY 310   Dr. Adams    released        ...     │
│                                                          │
│  ── Closed  (4) ────────────────────────────────────   │  ← collapsed by default
│  [ row ] ...                                            │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

### Group Order and Collapse Rules

| Order | Group name | Status value | Default state |
|---|---|---|---|
| 1 | Needs Action | `pending_review` | Expanded |
| 2 | Collecting | `collecting` | Expanded |
| 3 | Draft | `draft` | Expanded |
| 4 | Shared with Faculty | `released` | Collapsed |
| 5 | Closed | `closed` | Collapsed |

- Groups with 0 surveys do not render at all (no empty section)
- Collapse state is per-session (not persisted to localStorage)

### Group Header Anatomy

```
── Needs Action  (3) ─────────────────────────── [chevron ↑/↓]

- Thin top border: 1px solid var(--border)
- Label: text-xs font-medium text-muted-foreground uppercase tracking-wide
- Count: DS Badge variant="secondary" (no color override)
- Chevron: DS Button variant="ghost" size="icon-xs"
- NO colored background, NO amber/red tinting on any group header
```

### Row Columns

| Column | Content | Notes |
|---|---|---|
| Course | `courseCode · courseName` | Bold code, muted name |
| Instructor | Name or "—" if none assigned | |
| Status | `SurveyStatusBadge` | Existing component |
| Response rate | `48 / 52` or `—` if collecting | |
| Deadline | Relative date (`Due in 3 days`) | Red text if ≤ 3 days |
| Actions | DS DropdownMenu (⋯) | Edit, Share, Close, Delete |

### DS Violations Fixed

| Before | After |
|---|---|
| Raw `<input>` search | DS `InputGroup` + `Input` + `InputGroupAddon` |
| Flat table with no grouping | Status-grouped collapsible sections |
| No row action menu | DS `DropdownMenu` per row |

### Files Changed

- `apps/pce/admin/app/(app)/surveys/page.tsx` — full rewrite to status-grouped layout
- `apps/pce/admin/components/pce/pce-state.tsx` — no changes needed (data is already there)
- `apps/pce/admin/lib/pce-mock-data.ts` — no changes needed

---

## Fix 2 — Student Survey: Section Progress Bar

### Problem

The current section header shows:
- "Faculty Performance — Dr. Anita Patel" — admin taxonomy exposed to student
- "2 of 3" — section count with no question detail
- No local progress indicator — student doesn't know how many required questions remain in this section

The raw `<button>` elements for Previous, Next, and rating pills are DS violations.

### Section Title Rename

Admin taxonomy → Natural language. Applied to both `lib/mock-surveys.ts` and anywhere the title is displayed.

| Before | After |
|---|---|
| `Course Content` | `About the Course` |
| `Faculty Performance — Dr. Anita Patel` | `About Dr. Anita Patel` |
| `Faculty Performance — Dr. Kevin Chen` | `About Dr. Kevin Chen` |

Breadcrumb: the existing `s.title.split(' — ')[0]` code works correctly with new titles — since "About Dr. Anita Patel" has no " — ", it returns the full title as-is. No breadcrumb code change needed.

Question personalization: Rating question stems that say "The instructor was…" become "Dr. Patel was…" — replace `'The instructor'` with the instructor name extracted by `section.title.replace('About ', '')`. For "About Dr. Anita Patel" → "Dr. Anita Patel".

### Progress Bar Design

Replace the text hint "1 of 5 required questions answered" with a segmented pip bar.

```
Section description text here.
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
● ● ● ○ ○        ← 3 of 5 filled
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Pip states:
  ● filled    — answered required question (var(--brand-color))
  ○ empty     — unanswered required question (var(--border))
  [none]      — optional questions do not create pips

Bar only renders if section has ≥ 1 required question.
Bar does not render for optional-only sections.
```

Implementation:

```tsx
// Count required questions in current section
const requiredQs = section.questions.filter(q => q.required)
const answeredCount = requiredQs.filter(q => answers[q.id] !== undefined).length

// Pip bar
<div style={{ display: 'flex', gap: 4, marginTop: 8 }}>
  {requiredQs.map((q, i) => (
    <div
      key={q.id}
      style={{
        width: 8, height: 8, borderRadius: '50%',
        background: i < answeredCount
          ? 'var(--brand-color)'
          : 'var(--border)',
        transition: 'background 0.15s ease',
      }}
    />
  ))}
</div>
```

### DS Violations Fixed

| Before | After |
|---|---|
| Raw `<button>` Previous/Next | DS `Button variant="ghost"` / `variant="default"` |
| Raw `<button>` rating pills | DS `Button variant="outline"` selected state via className |
| Raw `<button>` breadcrumb items | DS `Button variant="ghost" size="xs"` |

### "Section N of M" Header

Replace plain "2 of 3" with colored "Section 2 of 3" — `color: var(--brand-color); font-weight: 600`.

### Files Changed

- `apps/pce/student/lib/mock-surveys.ts` — rename section titles, update question stems
- `apps/pce/student/app/surveys/[id]/page.tsx` — pip bar, button replacements, header label

---

## Fix 3 — Student Re-Edit After Submission

### Problem

After submitting, the student lands on `/surveys/[id]/submitted`. There is no path back if they made a mistake. The take-survey gate (`if (survey.status !== 'open')`) hard-blocks re-entry even while the collection window is still open — `submitted` surveys hit the locked state.

### Product Analogy

Google Forms allows re-editing if "Allow response editing" is on and the deadline hasn't passed. The submitted confirmation page shows "Edit your response" link. This is the correct mental model: submission = intent recorded, not permanent.

### Submitted Page Changes

Add below the existing "Back to Surveys" button:

```
┌─────────────────────────────────────────────────────────┐
│                                                          │
│  [ Back to Surveys → ]           ← existing primary CTA │
│                                                          │
│  ┌──────────────────────────────────────────────────┐   │
│  │  ✏  Changed your mind? You can edit your         │   │
│  │     responses until this survey closes on        │   │
│  │     May 5, 2026.                                 │   │
│  └──────────────────────────────────────────────────┘   │
│                                                          │
│  [ ✏ Edit my responses ]        ← DS Button outline     │
│                                                          │
└─────────────────────────────────────────────────────────┘
```

- Info banner: amber background (`var(--insight-severity-warning-bg)`), text `var(--insight-severity-warning-fg)`, no border
- "Edit my responses" button: DS `Button variant="outline"` full width
- Both elements only render when `survey.status === 'submitted'` (not `'closed'`)
- Deadline copy pulls from `survey.deadline` formatted as `"MMMM D, YYYY"`

### Take-Survey Gate Fix

```tsx
// BEFORE
if (survey.status !== 'open') {
  return <LockedView />
}

// AFTER
if (survey.status !== 'open' && survey.status !== 'submitted') {
  return <LockedView />
}
```

### Editing Banner (at top of take-survey when re-entering)

When `survey.status === 'submitted'`, show a contextual banner at the top of the take-survey view:

```
┌─────────────────────────────────────────────────────────┐
│  ✏  You're editing your previous submission.             │
│     When you re-submit, your earlier answers will be     │
│     replaced.                                            │
└─────────────────────────────────────────────────────────┘
```

- Amber info banner (`var(--insight-severity-warning-bg)` / `var(--insight-severity-warning-fg)`)
- Renders at the top of the survey body, above the section title
- Answers pre-fill from localStorage (existing `loadProgress` behavior — no change needed)

### Re-Submit Behavior

No changes to re-submit logic — `clearProgress()` is already called on submit. The student re-submits via the same "Submit" button on the last section. After submit, they land on `/submitted` again, which is correct.

### Files Changed

- `apps/pce/student/app/surveys/[id]/submitted/page.tsx` — add info banner + Edit CTA
- `apps/pce/student/app/surveys/[id]/page.tsx` — gate fix + editing banner

---

## Fix 4 — Faculty Results: Three Sentiment Groups

### Problem

The faculty results page (`/my-surveys/[id]/results`) shows raw individual comments as a flat list. Neutral comments are shown identically to positive ones — no signal about weight or category. Admin moderation (`toggleHideComment`) has no visible effect on the reading experience.

### Decision: Three curated groups

Neutral comments appear as a distinct "watch list" group — informational, not alarming. Admin-hidden comments are excluded from all groups. This makes moderation meaningful: admin choosing to hide a comment removes it from faculty's view entirely.

### Three Group Model

```
┌─────────────────────────────────────────────────────────────┐
│  About Your Teaching                           avg 4.1/5    │
│  ████████████████░░░░  Based on 46 responses               │
│                                                             │
│  ┌─ 😊 What students appreciated  ──  2 highlights ──────┐ │
│  │  "Dr. Williams is an excellent communicator."          │ │
│  │  "Office hours were very helpful."                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ 💭 Students also noted  ─────  2 observations ───────┐ │  ← slate, not amber
│  │  "Pace of lectures was sometimes too fast."            │ │
│  │  "Slides could be more organized."                     │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│  ┌─ 📌 Areas for consideration  ─  1 highlight ───────────┐ │
│  │  "Some topics could use deeper coverage."              │ │
│  └────────────────────────────────────────────────────────┘ │
│                                                             │
│     Highlights selected by your program administrator       │  ← attribution
└─────────────────────────────────────────────────────────────┘
```

### Group Specs

| Group | Sentiment filter | Label | Icon | Color | Max quotes |
|---|---|---|---|---|---|
| What students appreciated | `positive` | "What students appreciated" | 😊 | Green | 3 |
| Students also noted | `neutral` | "Students also noted" | 💭 | Slate | 3 |
| Areas for consideration | `concern` | "Areas for consideration" | 📌 | Amber | 3 |

- Empty groups (no non-hidden comments of that sentiment) do not render
- Order is always: positive → neutral → concern
- `hidden` comments (in `hiddenComments[commentId]`) never appear in any group

### Filtering Logic

```ts
// For each section's comments:
const visible = comments.filter(c => !hiddenIds.includes(c.id))

const positive = visible.filter(c => c.sentiment === 'positive').slice(0, 3)
const neutral  = visible.filter(c => c.sentiment === 'neutral').slice(0, 3)
const concern  = visible.filter(c => c.sentiment === 'concern').slice(0, 3)
```

### Section Label Mapping (faculty self-view)

```ts
const FACULTY_SECTION_LABELS: Record<string, string> = {
  faculty_performance: 'About Your Teaching',
  course_content:      'About the Course',
  course_director:     'About the Course Director',
}
```

This mapping is used only in the faculty results page — admin pages keep the existing `SECTION_LABELS` for internal clarity.

### Color Tokens (no hardcoded hex)

```
Positive  bg: color-mix(in oklch, var(--chart-2) 12%, transparent)
           border: color-mix(in oklch, var(--chart-2) 30%, transparent)
           text: color-mix(in oklch, var(--chart-2) 80%, var(--foreground))

Neutral   bg: var(--muted)
           border: var(--border)
           text: var(--muted-foreground)

Concern   bg: var(--insight-severity-warning-bg)
           border: color-mix(in oklch, var(--chart-4) 30%, transparent)
           text: var(--insight-severity-warning-fg)
```

### Reading Model for Faculty

The three groups establish a clear priority ladder:
- **Appreciated** → stable, no action needed. Reinforce these behaviors.
- **Noted** → mixed or ambiguous signal. Worth monitoring next term.
- **Consider** → friction point students wanted to raise. Likely worth addressing.

### Files Changed

- `apps/pce/admin/app/(app)/my-surveys/[id]/results/page.tsx` — full rewrite of comment display
- `apps/pce/admin/lib/pce-mock-data.ts` — add `sentiment` field to mock comments

---

## Fix 5 — Copy and Taxonomy Fixes

### "Share with Faculty" (was "Release to Faculty")

"Release" implies a one-way, irreversible, authoritative act — appropriate internally but alienating as user-facing language. "Share" is warmer, reflects the collaborative intent, and is consistent with how survey platforms (Google Forms, SurveyMonkey) describe this action.

Change in 4 locations:

| File | Location | Before | After |
|---|---|---|---|
| `surveys/[id]/page.tsx` | Button label (lines 65, 115) | "Release to Faculty" | "Share with Faculty" |
| `pce-modals.tsx` | `ReleaseSheet` title (line 445) | "Release to Faculty" | "Share with Faculty" |
| `pce-modals.tsx` | Footer CTA (line 508) | "Release to Faculty" | "Share with Faculty" |

### "Shared Apr 17" badge (was "Released")

Faculty-facing status badge on the results header — same rationale, warmer language.

| Before | After |
|---|---|
| `Released` | `Shared Apr 17` |

This badge is only in `/my-surveys/[id]/results` — not in the admin survey list (which keeps "Released" as the internal status label).

### Admin DS Violations (non-copy)

| File | Violation | Fix |
|---|---|---|
| `surveys/[id]/responses/page.tsx:72` | Hand-rolled `<span>` for hidden count | DS `Badge variant="secondary"` |
| `surveys/[id]/page.tsx:109` | `style={{ color: var(--destructive) }}` on Close Survey button | DS `Button variant="destructive"` |
| `templates/page.tsx:139` | Raw `<button>` for "Used by" count | DS `Button variant="link" size="sm"` |
| `templates/page.tsx` | Raw `<input>` search | DS `InputGroup` + `Input` |

---

## Data Model Changes

### `pce-mock-data.ts` — add `sentiment` to comments

```ts
// Type addition in pce-mock-data.ts
type CommentSentiment = 'positive' | 'neutral' | 'concern'

interface MockComment {
  id: number
  sectionType: string
  text: string
  sentiment: CommentSentiment   // NEW
  hidden: boolean               // existing
}

// Example
{ id: 1, sectionType: 'faculty_performance', text: 'Dr. Williams is an excellent communicator.', sentiment: 'positive', hidden: false }
{ id: 2, sectionType: 'faculty_performance', text: 'Pace of lectures was sometimes too fast.', sentiment: 'neutral', hidden: false }
{ id: 3, sectionType: 'faculty_performance', text: 'Some topics could use deeper coverage.', sentiment: 'concern', hidden: false }
```

All existing mock comments need a `sentiment` value assigned. Hidden comments keep their sentiment value — the filter logic excludes them before grouping.

### `mock-surveys.ts` (student) — section title rename

```ts
// Before
{ id: 's1', title: 'Course Content', ... }
{ id: 's2', title: 'Faculty Performance — Dr. Anita Patel', ... }
{ id: 's3', title: 'Faculty Performance — Dr. Kevin Chen', ... }

// After
{ id: 's1', title: 'About the Course', ... }
{ id: 's2', title: 'About Dr. Anita Patel', ... }
{ id: 's3', title: 'About Dr. Kevin Chen', ... }
```

Question stems in sections s2/s3: replace `'The instructor'` with `'Dr. Patel'` / `'Dr. Chen'`.

---

## Out of Scope

- Real backend / API integration (all changes work against mock data)
- New comment sentiment analysis (sentiment values are admin-set in mock data)
- Admin UI for setting comment sentiment (admin marks sentiment when reviewing — not in this spec)
- Dark mode
- Mobile responsiveness beyond what DS components provide by default

---

## Success Criteria

| Fix | How to verify |
|---|---|
| Admin dashboard | `/surveys` shows status groups; Needs Action first; no amber headers; DS Input search works |
| Student survey | Section titles say "About Dr. …"; pip bar fills as answers are selected; no raw `<button>` elements |
| Re-edit | After submitting, "Edit my responses" appears; clicking it opens prefilled survey; editing banner shows; re-submit works |
| Faculty results | Three groups render; neutral is slate; hidden comments absent; attribution footer present |
| Copy | "Share with Faculty" in all 4 spots; no "Release to Faculty" remaining |
