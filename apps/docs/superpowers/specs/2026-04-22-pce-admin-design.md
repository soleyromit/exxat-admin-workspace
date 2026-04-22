# PCE Admin — Design Spec
**Date:** 2026-04-22
**App:** `apps/pce/admin` · Package `@exxat/pce-admin` · Port 3005
**DS:** Admin DS (`@exxat/ds`) · Brand: Exxat Prism (theme-prism)
**Phase:** 1 — Program-level only. No site/rotation-level PCE.

---

## 1. What Is PCE

Post Course Evaluation. A structured survey distributed to students at the end of a course, covering two mandatory sections (Course Content + Faculty Performance per instructor) and one optional section (Course Director). Admin moderates before faculty can see results.

**6-step lifecycle:**
```
Template Setup → Survey Created → Collecting Responses → Pending Review → Released → Closed
```

**Two distribution entry points:**
1. PCE module → Surveys → Create (pick template + course)
2. Course Offering page → triggers PCE creation from default template (out of scope for Phase 1 build but nav must not conflict)

---

## 2. Personas & Role Access

| Role    | Can Access                                                     | Cannot Access           |
|---------|----------------------------------------------------------------|-------------------------|
| Admin   | Templates, Surveys, Moderation, Analytics                      | —                       |
| Faculty | My Surveys (assigned to them), Results (after admin releases)  | Templates, Moderation, Analytics |

Role is determined at layout — a single `role` flag in mock data drives nav + route guards.

---

## 3. Directory Structure

```
apps/pce/admin/
├── package.json                     name: @exxat/pce-admin, version: 0.1.0, port: 3005
├── next.config.ts                   @exxat/ds + @exxat/student webpack aliases
├── tailwind.config.ts               (if needed — mirrors exam-management pattern)
├── tsconfig.json                    extends ../../../../tsconfig.base.json
├── app/
│   ├── globals.css                  @import theme.css + DataTable tokens + PCE tokens
│   ├── layout.tsx                   <html class="theme-prism">, Typekit, FA, SidebarProvider
│   └── (app)/
│       ├── layout.tsx               AppSidebar + SidebarInset (role-aware)
│       ├── templates/
│       │   ├── page.tsx             Template list (admin only)
│       │   └── [id]/
│       │       └── page.tsx         Template detail / edit
│       ├── surveys/
│       │   ├── page.tsx             Surveys list (admin)
│       │   └── [id]/
│       │       ├── page.tsx         Survey detail
│       │       └── responses/
│       │           └── page.tsx     Aggregated response view
│       ├── moderation/
│       │   └── page.tsx             Pending review queue + release action
│       ├── analytics/
│       │   └── page.tsx             Program-level analytics
│       └── my-surveys/              Faculty-facing route group
│           ├── page.tsx             Faculty: my assigned surveys
│           └── [id]/
│               └── results/
│                   └── page.tsx     Faculty: released results
├── components/
│   ├── app-sidebar.tsx              Role-aware sidebar nav
│   └── pce/
│       ├── pce-badges.tsx           Status badge definitions
│       ├── pce-modals.tsx           Create survey, release confirmation, delete dialogs
│       ├── pce-state.tsx            Shared state / context
│       └── response-gauge.tsx       Donut/bar for response rate
└── lib/
    └── pce-mock-data.ts             All mock data + types
```

---

## 4. Navigation

### Admin sidebar
```
┌─────────────────────────┐
│  [Exxat Prism wordmark] │  ← collapsed: circular mark only (same pattern as exam-management)
├─────────────────────────┤
│  Templates              │  fa-light fa-rectangle-list
│  Surveys                │  fa-light fa-paper-plane
│  Review & Moderation  3 │  fa-light fa-shield-check  ← badge = pending count
│  Analytics              │  fa-light fa-chart-mixed
├─────────────────────────┤
│  [User avatar]  Name    │
└─────────────────────────┘
```

### Faculty sidebar
```
┌─────────────────────────┐
│  [Exxat Prism wordmark] │
├─────────────────────────┤
│  My Surveys             │  fa-light fa-paper-plane  → /my-surveys (all statuses)
│  Results                │  fa-light fa-chart-bar    → /my-surveys?filter=released (released only)
├─────────────────────────┤
│  [User avatar]  Name    │
└─────────────────────────┘
```
"Results" is a filtered view of My Surveys — same list page, pre-filtered to `status === 'released'`. No separate route needed.

---

## 5. Data Model (Mock)

```ts
type SurveyStatus = 'draft' | 'active' | 'collecting' | 'pending_review' | 'released' | 'closed'

type TemplateSection = 'course_content' | 'faculty_performance' | 'course_director'

interface PceTemplate {
  id: string
  name: string
  sections: TemplateSection[]          // course_content always present
  status: 'active' | 'draft'
  questionCount: number
  usedBySurveyCount: number
  lastModified: string
  createdBy: string
}

interface PceInstructor {
  id: string
  name: string
  role: 'primary' | 'guest'
  avatarInitials: string
}

interface PceSurvey {
  id: string
  courseCode: string
  courseName: string
  term: string
  templateId: string
  status: SurveyStatus
  instructors: PceInstructor[]
  responseRate: number                 // 0–100
  responseCount: number
  enrollmentCount: number
  deadline: string
  createdAt: string
  releasedAt?: string
  closedAt?: string
}

interface PceResponse {
  surveyId: string
  sectionScores: { section: TemplateSection; avg: number; count: number }[]
  comments: { section: TemplateSection; text: string; sentiment: 'positive' | 'neutral' | 'concern' }[]
}
```

---

## 6. Status Badge System

Defined in `components/pce/pce-badges.tsx`. Never inline status colors.

| Status          | Label            | Color        | Token reference                  |
|-----------------|------------------|--------------|----------------------------------|
| `draft`         | Draft            | amber        | `--qb-status-draft-*` tokens     |
| `active`        | Active           | brand        | `var(--brand-color)`             |
| `collecting`    | Collecting       | teal         | `var(--chart-2)`                 |
| `pending_review`| Pending Review   | amber/warning| `var(--chart-4)`                 |
| `released`      | Released         | green        | `--qb-status-saved-*` tokens     |
| `closed`        | Closed           | muted        | `var(--muted-foreground)`        |

---

## 7. Section Specs

### 7.1 Templates (admin)

**List page** — `/templates`

```
┌─ Templates ────────────────────────────────────────── [+ New Template] ─┐
│                                                                           │
│  Search templates…              [Status ▾]                               │
│                                                                           │
│ ┌───────────────────────────────────────────────────────────────────────┐│
│ │ Name              Sections          Questions  Used by  Last modified  ││
│ ├───────────────────────────────────────────────────────────────────────┤│
│ │ Standard PCE      CC · FP · CD      24         12       Apr 18        ││
│ │ Short Form PCE    CC · FP           16          4       Mar 02        ││
│ │ [Draft] Faculty…  CC · FP            8          0       Apr 22        ││
│ └───────────────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────────────┘
```

- `CC` = Course Content, `FP` = Faculty Performance, `CD` = Course Director (section abbreviation chips)
- Row hover: ⋯ menu (Edit, Duplicate, Archive) — same hover-overlay pattern as QB folders
- "Used by" is a link → filters Surveys list to that template
- **Empty state:**
  ```
  [icon: fa-light fa-rectangle-list]
  No templates yet
  Create a template to start distributing post course evaluations.
  [+ Create Template]
  ```

**Create / Edit — Sheet (right tray)**
```
┌── New Template ─────────────────── ✕ ──┐
│                                         │
│  Template name                          │
│  [_______________________________]      │
│                                         │
│  Description (optional)                 │
│  [_______________________________]      │
│                                         │
│  Sections                               │
│  ┌─────────────────────────────────┐    │
│  │ ✓  Course Content      required │    │
│  │ ✓  Faculty Performance          │    │
│  │ ○  Course Director              │    │
│  └─────────────────────────────────┘    │
│                                         │
│  Status   [Active ▾]                    │
│                                         │
│ ─────────────────────────────────────── │
│              [Cancel]  [Save Template]  │
└─────────────────────────────────────────┘
```

**Delete dialog** — only if `usedBySurveyCount === 0`:
```
Delete "Short Form PCE"?
This template is not used by any active surveys and will be permanently removed.
                          [Cancel]  [Delete]
```
If used by active surveys → show impact panel:
```
⚠ This template is used by 4 active surveys.
  Deleting it will not affect existing surveys, but you won't
  be able to create new surveys from it.
                          [Cancel]  [Delete anyway]
```

---

### 7.2 Surveys (admin)

**List page** — `/surveys`

```
┌─ Surveys ──────────────────────────── [+ Create Survey] ───────────────┐
│                                                                          │
│  Search…      [Term ▾]    [Status ▾]    [Instructor ▾]                  │
│                                                                          │
│ ┌──────────────────────────────────────────────────────────────────────┐│
│ │ Course              Instructor(s)   Status          Rate   Deadline  ││
│ ├──────────────────────────────────────────────────────────────────────┤│
│ │ BIO 201 · Spring 26 Dr. Patel       ● Pending Review 68%  Apr 30    ││
│ │ NURS 310 · Spring 26 Chen + 1       ● Collecting    42%   May 05    ││
│ │ MED 410 · Spring 26 Dr. Williams    ● Released      91%   Apr 15    ││
│ │ PHYS 101 · Fall 25  Dr. Kim         ● Closed        88%   Dec 10    ││
│ └──────────────────────────────────────────────────────────────────────┘│
└──────────────────────────────────────────────────────────────────────────┘
```

- Response rate shows as `68%` text + subtle inline bar (same pattern as QB difficulty bar)
- Multiple instructors shown as "Dr. Patel + 2" — hover tooltip lists all
- Row click → Survey detail
- Row ⋯ menu: View, Send Reminder, Close Survey (destructive)
- **Empty state (no surveys this term):**
  ```
  [icon: fa-light fa-paper-plane]
  No surveys for Spring 2026
  Switch terms or create a new survey from a template.
  [+ Create Survey]
  ```

**Create Survey — Sheet**
```
┌── Create Survey ────────────────── ✕ ──┐
│                                         │
│  Template                               │
│  [Standard PCE ▾]                       │
│                                         │
│  Course                                 │
│  [Search courses…]                      │
│                                         │
│  Term                                   │
│  [Spring 2026 ▾]                        │
│                                         │
│  Response deadline                      │
│  [Apr 30, 2026 📅]                      │
│                                         │
│  Instructors                            │
│  ● Dr. Anita Patel  (primary)           │
│  [+ Add guest lecturer]                 │
│                                         │
│ ─────────────────────────────────────── │
│            [Cancel]  [Create Survey]    │
└─────────────────────────────────────────┘
```

---

### 7.3 Survey Detail — `/surveys/[id]`

```
← Surveys   BIO 201 — Cellular Biology  Spring 2026
             ● Collecting                          [⋯]

┌── Overview ───────────────────────────────────────────────────────────┐
│                                                                        │
│  Response Rate          Deadline          Instructors                  │
│  ████████░░░░  68%      Apr 30, 2026      Dr. Patel (primary)         │
│  34 / 50                                  Dr. Chen (guest)            │
│                                                                        │
│                                   [Send Reminder]  [Close Survey]     │
└────────────────────────────────────────────────────────────────────────┘

┌── Sections ───────────────────────────────────────────────────────────┐
│  Course Content          34 responses                                  │
│  Faculty Performance     34 responses  · Dr. Patel · Dr. Chen         │
└────────────────────────────────────────────────────────────────────────┘

┌── Instructors ─────────────────────────────────────── [+ Add Guest] ──┐
│  Dr. Anita Patel    primary instructor                                 │
│  Dr. Kevin Chen     guest lecturer                    [Remove]         │
└────────────────────────────────────────────────────────────────────────┘
```

- [Send Reminder] → confirmation popover: "Send email reminder to 16 students who haven't responded?" → [Send]
- [Close Survey] → destructive confirmation dialog
- [+ Add Guest] → inline search + add sheet
- When status is `pending_review`: banner at top:
  ```
  ┌─ Review & Release ────────────────────────────────────────────────────┐
  │  ℹ  This survey has closed. Review responses and release to faculty.  │
  │                                            [Review & Release →]       │
  └───────────────────────────────────────────────────────────────────────┘
  ```

---

### 7.4 Moderation — `/moderation`

```
┌─ Review & Moderation ─────────────────────────────────────────────────┐
│                                                                         │
│  3 surveys pending review                                               │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Course              Closed       Responses  Instructors             ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ BIO 201  Spring 26  Apr 30       34/50      Dr. Patel               ││
│ │ NURS 310 Spring 26  May 05       21/30      Chen · Williams         ││
│ │ MED 101  Spring 26  Apr 22        8/10      Dr. Kim                 ││
│ └─────────────────────────────────────────────────────────────────────┘│
│                                               [Release All Selected]   │
└─────────────────────────────────────────────────────────────────────────┘
```

- Checkbox column for bulk release
- Row click → opens Release Sheet (see below)
- Bulk [Release All Selected] → single confirmation dialog

**Release Sheet (right tray):**
```
┌── Release to Faculty ──────────── ✕ ──┐
│  BIO 201 — Spring 2026                  │
│                                         │
│  ┌── Summary Preview ──────────────┐    │
│  │  Course Content     avg 4.1/5   │    │
│  │  Faculty Performance avg 4.3/5  │    │
│  │  34 responses · 68% rate        │    │
│  └────────────────────────────────┘    │
│                                         │
│  Once released, Dr. Patel and Dr. Chen  │
│  will be able to view these results.    │
│                                         │
│ ─────────────────────────────────────── │
│          [Cancel]  [Release to Faculty] │
└─────────────────────────────────────────┘
```

**Empty state (nothing pending):**
```
[icon: fa-light fa-shield-check  — large, brand color]

All caught up
No surveys are waiting for review.
When a survey closes, it will appear here before faculty can see results.
```

---

### 7.5 Analytics — `/analytics`

```
┌─ Analytics ─────────────────────── [Term: Spring 2026 ▾]  [↓ Export] ─┐
│                                                                          │
│  ┌── Response Rates ──────────────┐  ┌── Avg Scores by Section ──────┐ │
│  │  Overall: 74%                  │  │  Course Content     4.1 / 5   │ │
│  │  ████████████████░░░░  20 of 27│  │  Faculty Performance 4.3 / 5  │ │
│  │  surveys complete              │  │  Course Director    3.9 / 5   │ │
│  └────────────────────────────────┘  └───────────────────────────────┘ │
│                                                                          │
│  ┌── By Course ───────────────────────────────────────────────────────┐ │
│  │  Course         Instructor    Rate   CC    FP    CD                │ │
│  │  BIO 201        Dr. Patel     68%   4.1   4.3   —                 │ │
│  │  NURS 310       Dr. Chen      88%   4.5   4.2   4.0               │ │
│  │  MED 410        Dr. Williams  91%   3.8   4.6   —                 │ │
│  └────────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────────┘
```

**Empty state:**
```
[icon: fa-light fa-chart-mixed]
No analytics data for Spring 2026
Release surveys to faculty to see aggregated results here.
```

---

### 7.6 Faculty: My Surveys — `/my-surveys`

```
┌─ My Surveys ──────────────────────────────────────────────────────────┐
│                                                                         │
│  [Term: Spring 2026 ▾]                                                  │
│                                                                         │
│ ┌─────────────────────────────────────────────────────────────────────┐│
│ │ Course              Status          Rate    Results                 ││
│ ├─────────────────────────────────────────────────────────────────────┤│
│ │ BIO 201  Spring 26  ● Released      68%     [View Results →]        ││
│ │ NURS 310 Spring 26  ● Collecting    42%     Pending review  🔒      ││
│ │ MED 101  Fall 25    ● Released      91%     [View Results →]        ││
│ └─────────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────────┘
```

- "Pending review 🔒" is muted text, not a link — faculty cannot act on it
- No ⋯ menu, no create action — faculty is read-only
- **Empty state:**
  ```
  [icon: fa-light fa-paper-plane]
  No surveys assigned to you this term
  Contact your program administrator if you expected to see surveys here.
  ```

---

### 7.7 Faculty: Results — `/my-surveys/[id]/results`

**Released state:**
```
← My Surveys   BIO 201 — Cellular Biology  Spring 2026
                ● Released · Apr 30, 2026

┌── Course Content ─────────────────────────────────────────────────────┐
│  Overall avg  4.1 / 5                                                   │
│  ████████████████░░░  82%                                               │
│                                                                         │
│  Q1  The course objectives were clearly stated        4.3              │
│  Q2  Course materials supported my learning           4.0              │
│  Q3  The workload was appropriate                     3.9              │
└─────────────────────────────────────────────────────────────────────────┘

┌── Faculty Performance ────────────────────────────────────────────────┐
│  Overall avg  4.3 / 5                                                   │
│                                                                         │
│  Q1  The instructor was well-prepared                 4.5              │
│  Q2  The instructor encouraged participation          4.2              │
│                                                                         │
│  Comments (8)                                                           │
│  "Very organized and responsive to questions."                          │
│  "Could improve pacing in later sessions."                              │
└─────────────────────────────────────────────────────────────────────────┘
```

**Locked / pending state:**
```
[icon: fa-light fa-lock-keyhole — large, muted]

Results aren't available yet
The program administrator reviews all responses before
releasing them to instructors. You'll be notified by email
when your results are ready.
```

---

## 8. Shared Patterns

### Empty state anatomy
All empty states follow this structure:
```
[fa-light icon — 40px, muted-foreground color]
[Primary message — 1 sentence, sentence case]
[Supporting message — 1-2 sentences explaining why / what to do]
[CTA button — only if the user can act from this state]
```

### Moderation state machine
```
draft ──────────────→ active (send survey)
active ─────────────→ collecting (first response received)
collecting ──────────→ pending_review (deadline passed or manually closed)
pending_review ──────→ released (admin explicit action)
released ────────────→ closed (manual or auto after term end)
```

### Role guard
Single `MOCK_CURRENT_USER` in `pce-mock-data.ts` with `role: 'admin' | 'faculty'`. Layout reads this to:
- Show correct sidebar nav
- Guard route access (redirect faculty from `/templates`, `/moderation`, `/analytics`)

---

## 9. Setup Checklist

- [ ] `package.json` — name `@exxat/pce-admin`, port 3005
- [ ] `next.config.ts` — `@exxat/ds` + `@exxat/student` webpack aliases (same as exam-management)
- [ ] `tsconfig.json` — extends `../../../../tsconfig.base.json`
- [ ] `app/globals.css` — `@import '../../../../exxat-ds/packages/ui/src/theme.css'` + DataTable tokens + PCE-specific tokens
- [ ] `app/layout.tsx` — `<html class="theme-prism">`, Typekit link, Font Awesome script, `SidebarProvider`
- [ ] `app/(app)/layout.tsx` — `AppSidebar` + `SidebarInset`, role check
- [ ] `components/app-sidebar.tsx` — Prism logo (mark + wordmark), role-aware nav items
- [ ] `lib/pce-mock-data.ts` — types + seed data for all sections
- [ ] `components/pce/pce-badges.tsx` — `SurveyStatusBadge` component
- [ ] All route page files — with full UI, interactions, empty states

---

## 10. PCE-Specific CSS Tokens

Add to `app/globals.css` under `:root`. These are self-contained — PCE does not inherit from exam-management's globals.css.

```css
/* PCE status tokens — Draft (amber) */
--pce-status-draft-bg:         oklch(0.955 0.022 75);
--pce-status-draft-fg:         oklch(0.42 0.12 68);
--pce-status-draft-border:     oklch(0.82 0.08 72);

/* PCE status tokens — Collecting (teal) */
--pce-status-collecting-bg:    oklch(0.945 0.040 184);
--pce-status-collecting-fg:    oklch(0.28 0.12 184);
--pce-status-collecting-border:oklch(0.72 0.12 184);

/* PCE status tokens — Pending Review (amber, same as draft) */
--pce-status-pending-bg:       oklch(0.955 0.022 75);
--pce-status-pending-fg:       oklch(0.42 0.12 68);
--pce-status-pending-border:   oklch(0.82 0.08 72);

/* PCE status tokens — Released (green) */
--pce-status-released-bg:      oklch(0.945 0.040 155);
--pce-status-released-fg:      oklch(0.28 0.12 155);
--pce-status-released-border:  oklch(0.72 0.12 155);

/* Response rate bar */
--pce-rate-bar-fill:           var(--brand-color);
--pce-rate-bar-track:          var(--muted);

/* Results locked state */
--pce-locked-bg:               color-mix(in oklch, var(--muted) 40%, var(--background));
```
