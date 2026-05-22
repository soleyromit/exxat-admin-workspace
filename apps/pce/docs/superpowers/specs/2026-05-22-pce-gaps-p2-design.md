# PCE — Gap Fill P2: Student Survey, Faculty Results, Model Fixes
**Date:** 2026-05-22
**Author:** Romit Soley (Product Designer II)
**Status:** Approved — ready for planning
**Source:** PRD (Monil Pokar, May 12 2026) + 8 Granola transcripts (Apr 21–May 19) + Roadmap CSVs (Capabilities + Phase 1 tabs)
**Execution order:** Quick fixes → Student survey → Faculty results → Wizard/template gaps → Settings

---

## 0. Gap Summary

| # | Category | Area | Severity |
|---|---|---|---|
| A1 | Missing | Student survey response experience | Critical |
| A2 | Missing | Faculty results view | Critical |
| A3 | Missing | Settings page scaffold | Medium |
| B1 | Wrong model | CreateTemplateSheet — old hardcoded sections | High |
| B2 | Wrong model | Survey detail — old releaseSurvey + wrong button label | High |
| B3 | Wrong label | My Surveys — shows admin view, not faculty-filtered | Medium |
| C1 | Underbuilt | Per-course drawer in wizard Step 2 | High |
| C2 | Underbuilt | Template duplicate — no-op handler | Low |
| C3 | Underbuilt | PDF import button — missing from template editor | Medium |
| C4 | Underbuilt | Moderation tab on survey detail page | Medium |
| D1 | Wrong label | Status display labels: "collecting"→"Live", "released"→"Results Available" | High |
| D2 | Missing | Result Release Date field in wizard Communication step | High |
| D3 | Underbuilt | Settings page: configurable threshold + Likert N + results access matrix | Medium |
| D4 | Underbuilt | Reminder cadence: custom days OR recurring frequency (not just "3 days before") | Medium |

---

## 0.5 Roadmap CSV Additions (2026-05-22)

### Survey Status Labels (D1)

The roadmap defines the correct display labels. The internal status keys stay the same but GROUP_LABELS and badges must show these exact strings:

| Internal key | Current display | Correct display |
|---|---|---|
| `collecting` | "Collecting" | **"Live"** |
| `released` | "Shared with Faculty" | **"Results Available"** |
| `scheduled` | "Scheduled" | "Scheduled" ✓ |
| `pending_review` | "Needs Action" | "Needs Action" ✓ |
| `draft` | "Draft" | "Draft" ✓ |
| `closed` | "Closed" | "Closed" ✓ |

Files to update: `surveys/page.tsx` GROUP_LABELS, `my-surveys/page.tsx` GROUP_LABELS, `pce-badges.tsx` STATUS_CONFIG.

### Result Release Date (D2)

The roadmap Step 2 Create Survey → Basic Details shows: "Start date, End Date and Result Release Date (optional)."

This is separate from close date — it controls WHEN faculty can access results (the admin can set this in advance rather than manually clicking "Share Results"). Add to wizard Communication step:

```
Results access date (optional)
[DatePickerField — defaults to empty, meaning admin controls manually]
If set: system auto-enables results on that date.
```

Add `resultReleaseDate?: string` to `PceSurvey` and `PushWizardConfig`.

### Settings page scope (D3)

Roadmap lists Settings fields for CE:
1. Cover image, Logo, Brand Color (Phase 2 — skip)
2. **Minimum threshold** — configurable (default 5). Changes the threshold shown in moderation warning and used in results suppression.
3. **Likert N** — configurable (3 / 4 / 5 / 7 / 10). Roadmap overrides PRD NFR. Use program-level setting.
4. **Results access matrix** — who sees what (configurable defaults): Instructor sees Instructor + Course Content; Coordinator sees Coordinator + Course Content; Program Director sees all.

For Phase 1: build threshold and Likert N as editable fields. Skip cover image/logo. Show access matrix as read-only informational table (configurable in Phase 2).

### Reminder cadence (D4)

Roadmap: "Set custom days OR repeat cadence — frequency: daily, weekly, biweekly, monthly, quarterly."

For Phase 1: keep as "N days before close" (our existing approach) but add a "repeat" option: send reminder every N days after first reminder until close.

```
[✓ Enable reminder]
First reminder: [3 ▾] days before close
Repeat every:   [—  ▾] (none / daily / every 3 days / weekly)
```

---

## 1. Quick Fixes (Category B — Model Consistency)

### B1. CreateTemplateSheet replacement

`pce-modals.tsx` has `CreateTemplateSheet` with 3 hardcoded checkboxes (Course Content, Faculty Performance, Course Director). These map to the old `TemplateSection` union type which is no longer the source of truth.

**Fix:** Remove `CreateTemplateSheet` from templates list. Replace "New Template" button with navigation to `/templates/new` (a new empty template in the editor, created via `createTemplate` with empty `templateSections: []`). The full editor is already built — no need for the sheet.

`createTemplate` action signature (already in pce-state): creates a new template, navigates to `/templates/[newId]`.

If `createTemplate` action doesn't already navigate, add a `onCreated: (id: string) => void` callback to the templates list page.

### B2. Survey detail page — update to new model

**File:** `app/(app)/surveys/[id]/page.tsx`

Changes:
- Replace `releaseSurvey(id)` call → `enableResults(id)`
- Button label: `"Share Results with Faculty"` (per Vishaka Apr 21)
- Section scores display: read from `template.templateSections` (new model) not old `template.sections`
- Status badge progression: `collecting` → `pending_review` → `released`
- Add "Moderate" tab when status = `pending_review` (see C4 below)

### B3. My Surveys — faculty view

**File:** `app/(app)/my-surveys/page.tsx`

Currently shows all surveys. Faculty should only see surveys where they are an instructor.

Fix: filter `surveys` to only those where `survey.instructors.some(i => i.id === currentUser.id)`.

Use `MOCK_CURRENT_USER` (role = 'admin' in mock — add a faculty user or check by role).

In the columns: remove admin-only actions (Close Survey, Send Reminder admin modal). Show a "View Results" link when `status === 'released'`.

---

## 2. Student Survey Experience (A1)

### 2.1 Entry Points

```
1. Email link → /student/surveys (survey home)
2. Student portal → Surveys tab in left nav
```

Survey home: lists all open course evaluations for the current student.

```
┌──────────────────────────────────────────────────────────────┐
│  Your Course Evaluations                                     │
│  Spring 2026 · Due Jun 13                                    │
├──────────────────────────────────────────────────────────────┤
│  ○  BIO 201  Cellular Biology                    [Start →]   │
│     Opens May 23 · Closes Jun 13                             │
├──────────────────────────────────────────────────────────────┤
│  ✓  NURS 310  Advanced Patient Care              Submitted   │
│     Thank you for your response                              │
├──────────────────────────────────────────────────────────────┤
│  ○  MED 410  Clinical Pharmacology               [Start →]   │
│     Draft saved                                              │
└──────────────────────────────────────────────────────────────┘
```

Each row:
- Circle = not started, check = submitted, pencil = draft
- Course code + name
- Open/close date range
- Action: Start / Continue / View (read-only after submit until close)
- Students CAN edit submitted responses until close date (Trey demo Apr 23)

### 2.2 Survey Page Layout

URL: `/student/surveys/[surveyId]`

Section-by-section. One section visible at a time.

```
┌──────────────────────────────────────────────────────────────┐
│  BIO 201 — Cellular Biology                                  │
│  ● ● ○ ○   Section 1 of 4                                   │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  Course Content                                              │
│  ──────────────────────────────────────────────────────────  │
│  Evaluating the course structure and materials.              │
│                                                              │
│  The course objectives were clearly stated.        *         │
│  ① ② ③ ④ ⑤                                                  │
│  Strongly disagree           Strongly agree                  │
│                                                              │
│  Course materials supported my learning.           *         │
│  ① ② ③ ④ ⑤                                                  │
│                                                              │
│  What would you change about this course?                    │
│  ┌──────────────────────────────────────────────────────┐   │
│  │                                                      │   │
│  │                                                      │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  ──────────────────────────────────────────────────────────  │
│  [Save draft]          [← Back]     [Continue →]            │
└──────────────────────────────────────────────────────────────┘
```

Key behaviors:
- Required questions (marked `*`) must be answered before Continue
- Likert: 5 numbered circles, anchor labels at ends
- Free text: Textarea, optional by default (per accreditation research — required open-text depresses submission rates)
- "Save draft": saves progress, student can return later
- "Back": goes to previous section (no data loss)
- "Continue": validates required fields, advances to next section

### 2.3 Instructor Sections — N Renders

If a course has 2 instructors, the Instructor section renders twice:

```
Section 3 of 4: Evaluating Dr. Sarah Chen — Course Instructor
──────────────────────────────────────────────────────────────
[questions for this instructor]

[Continue →]

Section 4 of 4: Evaluating Dr. James Park — Course Instructor
──────────────────────────────────────────────────────────────
[same question structure for this instructor]
```

Section header clearly states WHO is being evaluated and in what ROLE.
This was a major pain point in Trey's demo of Anthology — the role differentiation was unclear.

### 2.4 Submit → Thank-you Screen

After final section:

```
┌──────────────────────────────────────────────────────────────┐
│                                                              │
│                    ✓                                         │
│                                                              │
│         Thank you for your feedback                          │
│                                                              │
│   Your responses are anonymous. Your name will never         │
│   be linked to your answers.                                 │
│                                                              │
│   BIO 201 · Spring 2026                                      │
│                                                              │
│              [Back to surveys]                               │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

After submission, survey shows as "Submitted" in the home list.
Student CAN return and edit until close date (Trey Apr 23 confirmed anthology does this).

### 2.5 Files

- `apps/pce/student/app/(app)/surveys/page.tsx` — survey home list
- `apps/pce/student/app/(app)/surveys/[surveyId]/page.tsx` — section-by-section survey
- `apps/pce/student/components/likert-scale.tsx` — Likert 1-5 component (reusable)
- `apps/pce/student/lib/student-state.tsx` — student survey state (draft mode, responses)

---

## 3. Faculty Results View (A2)

### 3.1 Entry Point

My Surveys → click a survey with status `released` → Results tab

### 3.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│  BIO 201 — Cellular Biology                    [Download ↓]  │
│  Spring 2026 · 34 enrolled · 28 responses (82%)             │
├────────────────────┬─────────────────────────────────────────┤
│  [Results] [Comments]                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  RESPONSE RATE                                               │
│  [BulletGauge: 28/34, threshold=5]  28 of 34 · 82%          │
│                                                              │
│  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──      │
│                                                              │
│  SECTION SCORES                                              │
│                                                              │
│  Course Content                                              │
│  [SectionScoreStrip: 4.1]   4.1 / 5                         │
│  You  ████  4.1                                              │
│  Dept ████  3.9   School ████  3.8                           │
│                                                              │
│  Course Instructor — Dr. Sarah Chen                          │
│  [SectionScoreStrip: 4.4]   4.4 / 5                         │
│  You  ████  4.4                                              │
│  Dept ████  4.0   School ████  3.9                           │
│                                                              │
│  ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ── ──      │
│                                                              │
│  TREND — BIO 201 across semesters                            │
│  [MicroTrend sparkline: Spring24 · Spring25 · Spring26]      │
│  4.0  →  4.1  →  4.1                                        │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Comments tab:
```
┌──────────────────────────────────────────────────────────────┐
│  [Results] [Comments]                                        │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│  COURSE CONTENT  (2 responses)                               │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  What would you change about this course?            │   │
│  │  The pacing in the second half felt rushed.          │   │
│  └──────────────────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  What would you change about this course?            │   │
│  │  More worked examples in assessments.                │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
│  COURSE INSTRUCTOR  (2 responses)                            │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  What feedback do you have for the instructor?       │   │
│  │  Very approachable during office hours.              │   │
│  └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

Key design decisions:
- Flagged responses excluded from faculty view (per PRD — admin already flagged them in moderation)
- Faculty only sees sections attributed to their own role (Instructor sees Instructor + Course Content; Coordinator sees Coordinator + Course Content)
- Comparison values (Dept/School avg) are mock data — weighted by enrollment (Arvind May 13)
- Trend: uses `priorOfferings` array already in `PceSurvey` data model
- Download: generates a conceptual "Download PDF" button (no real PDF in Phase 1 — just shows alert)
- If responseCount < 5: show a suppression notice ("Results hidden — fewer than 5 responses received") instead of scores

### 3.3 Files

- `apps/pce/admin/app/(app)/surveys/[id]/results/page.tsx` — faculty results (or tab within survey detail)
- OR: add Results tab to `apps/pce/admin/app/(app)/surveys/[id]/page.tsx`

Decision: **Add Results tab to existing survey detail page** — faculty enters via My Surveys → survey detail → Results tab. Keeps navigation shallow.

---

## 4. Per-Course Drawer — Wizard Step 2 (C1)

When a course row is clicked in the distribution step (not the Fix badge — the whole row):

```
┌──────────────────────────────────────────────┐
│  BIO 201 — Cellular Biology           [✕]    │
│  Spring 2026 · 34 enrolled                   │
├─────────────┬─────────────┬──────────────────┤
│  Faculty    │  Students   │  Template        │
├─────────────┴─────────────┴──────────────────┤
│                                              │
│  Faculty tab:                                │
│  ┌─────────────────────────────────────────┐ │
│  │  ST  Dr. Sarah Chen      Course Coord   │ │
│  │  JP  Dr. James Park      Instructor     │ │
│  └─────────────────────────────────────────┘ │
│  [+ Add instructor]                          │
│                                              │
└──────────────────────────────────────────────┘
```

Students tab: enrollment count + cohort.
Template tab: show currently assigned template name; Select dropdown to change assignment.

---

## 5. Template PDF Import (C3)

Button in template editor header area (left panel, below course type dropdown):

```
[Import from PDF]
```

Click → Sheet from right:
```
Import questions from PDF
──────────────────────────────────────────────────────
Drag & drop or [Browse files]

Supports: PDF, Word (.docx)  Max: 10MB

[Cancel]   [Upload and parse]
```

After "upload" (mocked — no real parse):
- Show a 1.5s "Parsing…" spinner
- Then show proposed sections + questions:

```
Found 3 sections in your document

  ✓ Course Content    4 questions
  ✓ Instructor        6 questions
  ○ Lab Instructor    2 questions  ← not in Prism yet

[Add all to template]    [Review individually]
```

"Add all": calls `addTemplateSection` for each found section with its questions.

---

## 6. Template Duplicate (C2)

`templates/page.tsx` row action menu: "Duplicate" calls:
```typescript
createTemplate({
  name: `Copy of ${template.name}`,
  status: 'draft',
  templateSections: template.templateSections ?? [],
  courseType: template.courseType,
  surveyType: template.surveyType,
})
```
Then navigate to the new template's editor page.

---

## 7. Moderation Tab on Survey Detail (C4)

When a survey's status is `pending_review`, add a "Moderate" tab to the survey detail page.

The Moderate tab shows the same response cards + flag/unflag + threshold warning + "Share Results with Faculty" button as the global moderation page — but scoped to this one survey.

This is PRD Step 4's intended entry point: "Survey Home → select a closed survey → Moderate tab."

The global `/moderation` page (queue) stays as-is — it's a convenience aggregation view for admins who want to see all pending surveys in one place.

---

## 8. Settings Page Scaffold (A3)

Route: `/settings`

```
┌──────────────────────────────────────────────┐
│  [≡]  Settings                               │
├──────────────────────────────────────────────┤
│                                              │
│  COURSE EVALUATION                           │
│  ──────────────────────────────────────────  │
│                                              │
│  Likert scale                                │
│  1–5 scale · Fixed per PRD NFR              │
│  [i] The Likert scale is standardised at     │
│      1–5 across all course evaluations.      │
│      This ensures data is comparable across  │
│      semesters and faculty groups.           │
│                                              │
│  SURVEYS                                     │
│  ──────────────────────────────────────────  │
│  (placeholder for future settings)           │
│                                              │
└──────────────────────────────────────────────┘
```

Note: PRD NFR says Likert is NOT configurable (1–5 fixed). The May 14 Monil demo showed a configurable pointer — this was a prototype idea that the PRD NFR overrides. The settings page shows it as fixed with an explanatory note.

---

## 9. Execution Order (confirmed)

1. **Quick fixes** — B1 (CreateTemplateSheet), B2 (survey detail), B3 (My Surveys display)
2. **Student survey** — A1 (student app shell + section-by-section survey)
3. **Faculty results** — A2 (Results tab on survey detail + Comments tab)
4. **Wizard + template gaps** — C1 (per-course drawer), C2 (duplicate), C3 (PDF import), C4 (Moderate tab)
5. **Settings scaffold** — A3
