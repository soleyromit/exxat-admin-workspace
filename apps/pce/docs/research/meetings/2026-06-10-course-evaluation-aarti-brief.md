# Course & Faculty Evaluation — Aarti Design Brief
**Date:** 2026-06-10 · **Source:** Granola transcript (raw) · Meeting ID `410d7c0e-439c-4a4c-9c42-190cbf476785`
**Participants:** Romit, Aarti (Adi)
**Context:** Baroda prep — new initiatives team visits week of Jun 22; one day dedicated to this module.
**Status:** Master reference for Jun 22 Baroda discussions. Use to map against codebase before that day.

---

## 0. Architectural Principles — How Aarti's Directives Connect

All of Aarti's requirements follow from one decision: **the term is the organizing axis** — the unit of activation, the unit of analytics, and the anchor for all time-based logic. Four principles flow from that:

### Principle 1 — Setup once, activate trivially

The Setup zone exists entirely to pre-build what term activation will consume. Every Setup entity is parameterized by the term end date:

```
AY + Term dates  →  Survey Templates  →  Email Templates  →  Reminder Schedule
       ↓                  ↓                   ↓                     ↓
   term end date      course type        {{daysRemaining}}     N days before term end
   (the anchor)       auto-assign       (dynamic, 1 template)  (not survey close date)
```

This is why reminders anchor to term end, not close date — the *term*, not the survey, is the unit.

### Principle 2 — Prism owns entities; PCE owns evaluation artifacts

The read-only directory rule is an architectural boundary, not a UI preference:

```
Prism (Angular)             PCE (React)
────────────────────        ─────────────────────────────────────
Students                    which courses they evaluated
Faculty                     avg rating + completion stats
Courses (master)            times offered + avg rating (cross-term)
Course Offerings            eval status, completion % per term
AY / Terms (shared)  ←→    dates + "enable for evaluation" toggle
```

The only write-back is AY/Terms — PCE edits the shared Prism dropdown so admins don't need two tabs for setup.

### Principle 3 — Three analytics entry points converge to one terminal card

By Term / By Faculty / By Course are three slices of the same data. They all drill to the same atomic record: **one course offering × one faculty**.

```
By Term   ──→  term stats    ──→  course grid   ──┐
By Faculty ──→  faculty stats ──→  offerings    ──→  Evaluation Card
By Course  ──→  cross-term   ──→  offering list ──┘  (courseOffering × faculty)
```

The three doors exist because different stakeholders ask different questions — but the terminal card is identical regardless of entry.

### Principle 4 — Activation is scheduling, not triggering (Save ≠ Send)

```
Admin activates a term  →  system stores a distribution schedule (SCHEDULED)
                                ↓  open date arrives
                           Initial email auto-fires
                                ↓  term end − N days
                           Reminder auto-fires  (one template, {{daysRemaining}} fills in)
                                ↓  close date arrives
                           Status → CLOSED  →  Evaluation Card unlocked
```

The current `pushSurveyBatch` breaks this by immediately setting status to `collecting` — it treats activation as a trigger rather than a schedule.

### How the four principles unify the full scope

```
SETUP (once per school / year)        ACTIVATION (per term, <5 min)
──────────────────────────────        ──────────────────────────────────────
AY + Term dates               →       Step 1: pick enabled term
Survey Templates (by type)    →       Step 2: courses auto-assign by type
Email Templates (×2, dynamic) →       Step 4: pre-filled, editable per-activation
Reminder Schedule             →       Step 3: dates calculated from term end anchor
                                      Step 5: Save & Schedule  (nothing fires yet)

ANALYTICS (after term closes)
────────────────────────────────────────────────────────────────────────────
By Term / By Faculty / By Course  →  Evaluation Card (same terminal, three entrances)
Ad-hoc Nudge available during COLLECTING state
```

**The four violations in the current build** (editable CRUD directories, close-date reminder anchor, two competing activation flows, immediate send on push) all contradict the same principle: Prism owns entities, term owns the timeline, Setup owns the defaults, Activation just picks and confirms.

---

> **Load-bearing constraint:** "Directory" in the transcript is *language*, not a new nav section.
> Entity list pages (Students, Faculty, Courses, Offerings) already exist in PCE nav — they need to become
> read-only with eval-context columns + Prism links. No new "Directory" top-level nav item.

---

## 1. Information Architecture

The module is three conceptual zones layered over **existing nav**. No new top-level section introduced.

```
PCE Admin (existing left nav)
│
├─ ENTITY LIST ZONE  ── (existing list routes — convert to read-only eval views)
│   ├─ Students         app/(app)/admin/students      [EXISTS · make read-only + eval cols + KPI + Prism link]
│   ├─ Faculty          app/(app)/admin/faculty       [EXISTS · add rating/completion stats + Prism link]
│   ├─ Course Master    app/(app)/admin/courses       [EXISTS · add type/times-offered/avg-rating + Prism]
│   └─ Course Offerings app/(app)/admin/offerings     [EXISTS · add eval status/completion + → Eval Card]
│
├─ SETUP ZONE  ── (existing Setup nav cluster — add eval-config surfaces)
│   ├─ Academic Years & Terms   app/(app)/admin/terms               [EXISTS · ADD dates + "Enable for evaluation" toggle]
│   ├─ Survey Templates         app/(app)/templates                 [EXISTS · faculty-role variants + upload mode]
│   ├─ Email Templates          app/(app)/admin/email-templates     [NET-NEW standalone · 2 templates]
│   ├─ Reminder Schedule        app/(app)/admin/reminder-schedule   [NET-NEW · anchor = TERM END date]
│   └─ Course-Type → Template map  (lives inside Survey Templates)  [EXISTS · keep]
│
├─ ACTIVATION  ── (the "get a term ready" workflow)
│   └─ Term Activation Wizard   app/(app)/admin/activate            [REBUILD · 5 steps, Save≠Send]
│       (replaces the two overlapping run-evaluation + push flows)
│
└─ REVIEW / ANALYTICS ZONE  ── 3 entry points, 1 shared terminal card
    ├─ By Term      app/(app)/analytics?by=term        [EXISTS · add row-level Nudge + drill to rebuilt Eval Card]
    ├─ By Faculty   app/(app)/analytics?by=faculty     [NET-NEW door]
    ├─ By Course    app/(app)/analytics?by=course      [NET-NEW cross-term door]
    └─ Evaluation Card  (shared terminal — reached from all 3 doors + Offerings row click)
        unique key = courseOffering × faculty × cohort  [REBUILD · per-question viz, multi-faculty]
```

**Leo + chat placement:** inherit existing PCE shell header — not a per-module placement decision. Finalize with Mondal before Jun 22.

---

## 2. Entity Data Map

Architectural rule (verbatim): *"the main data is in Prism… we're not making copies… just a simple list view… click → see the Prism profile."* PCE owns evaluation artifacts only.

| Entity | Eval-context fields PCE shows | Source of truth | Editable in PCE? | Relationships |
|---|---|---|---|---|
| **Student** | name, email, # courses enrolled, # evals completed, # evals pending, due-date of next pending | **Prism** (read) | No — view only; email used for distribution | enrolled-in → Course Offering (N:M) |
| **Faculty** | name, courses taught (this term), avg rating, avg completion % | **Prism** (read) | No | teaches → Course Offering (N:M); has role per offering |
| **Course (Master)** | name, course type, times offered, avg rating (cross-term) | **Prism** (read) | No | parent-of → Course Offering (1:N); type → Survey Template (default) |
| **Course Offering** | course, term, faculty list, enrolled count, eval status, completion % | Prism (registration) + **PCE** (eval status) | Eval status PCE-owned | instance-of Course; in Term; taught-by Faculty; targets Students |
| **Academic Year** | label, **start/end dates** (NEW), **enabled** toggle (NEW) | **Prism dropdown (shared)** — edited in-place | Yes — dates + enable (writes to same shared dropdown) | contains → Terms |
| **Term** | label, **start/end dates** (NEW), **enabled** toggle, term-end anchor | **Prism dropdown (shared)** | Yes — dates + enable | belongs-to Academic Year; anchors reminder dates |
| **Survey Template** | name, target audience, sections (course + per-faculty), faculty-role variants, mapped course-type(s) | **PCE-owned** | Yes | applied-to Course Offering via course type |
| **Email Template** | type (initial \| reminder), subject, body, dynamic vars | **PCE-owned** | Yes (exactly 2) | used by Distribution |
| **Reminder Schedule** | intervals (N days before TERM END), enabled | **PCE-owned** | Yes | anchored to Term.endDate |
| **Distribution** | term, course, template, openDate, closeDate, emailSendDate, reminder dates, status | **PCE-owned** | Yes (pre-send) | per Course Offering per Term |
| **Evaluation Response** | per-student answers, submitted-at | **PCE-owned** | No (read for analytics) | belongs-to Distribution |

**Hard rule:** all four entity pages open the full profile in **Prism in a new tab** (React ↔ Angular boundary).

---

## 3. Setup Section — Full Spec

Goal (verbatim): *"all of that is in the setup section… every time you are just using the default… literally a three-minute task."* Setup is authored once so activation is trivial.

### 3a. Academic Years & Terms — `admin/terms` (extend existing)

Constraint (verbatim): *"you're saving the data in the same dropdown… not recreating a new dropdown… giving them edit capabilities on your side."* Edits write to the shared Prism academic-year dropdown — not a PCE copy.

**New fields needed:** `Term.startDate`, `Term.endDate` (add if not present), `Term.enabledForEval: bool`, `AcademicYear.enabledForEval: bool`.

```
┌─ Setup ▸ Academic Years & Terms ────────────────────────────────────────┐
│  Only enabled years/terms appear in the Activation wizard + product      │
│  dropdowns. Set dates so reminder anchors can calculate.                 │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Academic Year 2026–27                            [ Enabled ●── ] │  │
│  │   Start  [ 2026-08-15 ]      End  [ 2027-05-30 ]                 │  │
│  │   Terms                                                          │  │
│  │   ┌──────────────────────────────────────────────────────────┐  │  │
│  │   │ Fall 2026   Start [2026-08-15] End [2026-12-15] [Enab ●─]│  │  │ ← End date
│  │   │ Spring 2027 Start [2027-01-10] End [2027-05-15] [Enab ─○]│  │  │   = reminder
│  │   └──────────────────────────────────────────────────────────┘  │  │   anchor
│  │   [ + Add term ]                                                 │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Academic Year 2025–26                                 [ Enabled ─○ ]   │
└────────────────────────────────────────────────────────────────────────┘
```

- Disabled years collapse out of the Activation term picker.
- Pre-purchase years (before client start year) default to disabled.

### 3b. Survey Templates — `app/(app)/templates` (extend)

**Creation modes: Build new (scratch) or Import from document.** "Copy existing" is not available for Course Evaluation templates — every template starts fresh or from an uploaded document.
> **Scope boundary:** "Copy existing" is removed for Course Evaluation only. The general Surveys module retains all three options (Build new / Copy existing / Import from document) — do not remove or restrict those.

Why harder than a regular survey (verbatim): *"first section is generic course-related… second section is related to faculty. You can have multiple faculty. You can have faculty roles… capture different data for guest lecturer versus main faculty versus assistants."*

**Section model:**
- **Section 1 — Course-level:** asked once per evaluation; about the course itself.
- **Section 2 — Per-faculty:** repeats for each faculty on the offering; question set varies by **faculty role variant** (main, guest, assistant, etc.).

```
┌─ Setup ▸ Survey Templates ▸ New ─────────────────────────────────────────┐
│  Template name   [ Standard Didactic Course Eval .................. ]    │
│  Target audience [ Students ▾ ]   (who fills this in)                    │
│  Applies to course type(s)  [ Didactic ✕ ] [ Lab ✕ ] [ + ]              │ ← drives auto-assign
│ ──────────────────────────────────────────────────────────────────────  │
│  SECTION 1 · Course (asked once)                                         │
│    1. The course objectives were clearly stated   ( 1–5 scale )   [ ⋮ ] │
│    2. Workload was appropriate                    ( 1–5 scale )   [ ⋮ ] │
│    [ + Add question ]                                                    │
│ ──────────────────────────────────────────────────────────────────────  │
│  SECTION 2 · Faculty (repeats per faculty on the offering)               │
│    Role variants — different questions per role:                         │
│    ┌──────────────────────────────────────────────────────────────┐    │
│    │ ▸ Main faculty        5 questions                    [edit]  │    │
│    │ ▸ Guest lecturer      2 questions                    [edit]  │    │
│    │ ▸ Teaching assistant  3 questions                    [edit]  │    │
│    │ [ + Add role variant ]                                        │    │
│    └──────────────────────────────────────────────────────────────┘    │
│    (When deployed: each faculty renders the variant matching their role. │
│     3 faculty on one offering = Section 2 repeats 3 times.)             │
│ ──────────────────────────────────────────────────────────────────────  │
│                                         [ Save draft ]  [ Save template ]│
└─────────────────────────────────────────────────────────────────────────┘
```

### 3c. Email Templates — `admin/email-templates` (NET-NEW standalone)

Currently lives inside the push wizard only (gap: PARTIAL). Promote to standalone, reusable Setup surface. Exactly **two** (verbatim): *"two email templates in the system. First initial email and reminder email. Year after year, keep using the same email template."*

```
┌─ Setup ▸ Email Templates ───────────────────────────────────────────────┐
│  [ Initial email ]   [ Reminder email ]                                  │
│ ──────────────────────────────────────────────────────────────────────  │
│  Subject  [ Your {{courseName}} evaluation is now open .............. ]  │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Hi {{studentFirstName}},                                          │  │
│  │                                                                   │  │
│  │ Please complete your evaluation for {{courseName}} taught by      │  │
│  │ {{facultyNames}}. It closes on {{closeDate}}.                     │  │
│  │                                                                   │  │
│  │            [ Open evaluation ]   ← required CTA link              │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Variables: {{studentFirstName}} {{courseName}} {{facultyNames}}         │
│             {{closeDate}} {{daysRemaining}}* (*reminder tab only)        │
│                                                           [ Save ]       │
└────────────────────────────────────────────────────────────────────────┘
```

**No student login/invitation** (verbatim): *"Students don't get invited. They don't get a login. They don't create their profile… we do want the student email addresses… a call to action in the email so they can click on it."*

Reminder template uses dynamic `{{daysRemaining}}` so **one template covers all reminder intervals** (verbatim): *"whether you do a reminder after 5, 10, 15 days, we don't need different templates… make the template dynamic."*

### 3d. Reminder Schedule — `admin/reminder-schedule` (NET-NEW)

**Critical fix:** today anchored to *survey close date*; transcript says **TERM END date**.
Verbatim: *"anchored on term end date. So fifteen days before the term end date, we are going this week's reminder."*

```
┌─ Setup ▸ Reminder Schedule (default) ────────────────────────────────────┐
│  All reminders anchor to the TERM END date (set per term in Setup).       │
│  Uses the single Reminder email template; {{daysRemaining}} fills in.     │
│                                                                            │
│  Anchor: ● Term end date     ( ) Survey close date  (legacy — fix this)   │
│                                                                            │
│  Send reminders:                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Reminder 1   [ 15 ] days before term end               [remove]  │   │
│  │ Reminder 2   [ 10 ] days before term end               [remove]  │   │
│  │ Reminder 3   [  5 ] days before term end               [remove]  │   │
│  │ [ + Add reminder ]                                               │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│  Preview for Fall 2026 (end Dec 15): Dec 1 · Dec 5 · Dec 10              │
│                                                           [ Save ]        │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 4. Term Activation Wizard — Full Journey

Replaces the two overlapping flows (`run-evaluation` + `push`). Target: **2–5 min** fully defaulted. **Save ≠ Send** — today's push flow immediately sets status to "collecting" (bug).

Verbatim: *"When you set it up, it doesn't mean you're sending the emails out to somebody… you're getting it ready… on that day of March 8, emails will automatically go out."*

### 4a. Linear flow

```
                              ┌──────── override at any step ──────────┐
                              ▼                                         │
[Start] → STEP 1 ──→ STEP 2 ──────→ STEP 3 ──────→ STEP 4 ──────→ STEP 5 → [Done]
           Select     Select          Review/edit     Review/edit    Save
           term       courses         dates           emails         (schedules;
           (enabled   (auto-template  (from term-end  (initial +     NO email
            only)      by type)        anchors)        reminder)      sent now)
```

### 4b. Per-step wireframes

**Step 1 — Select term (enabled terms only):**
```
┌─ Activate Evaluations · Step 1 of 5 ────────────────────────────────────┐
│  Which term are you setting up?                                          │
│   (•) Fall 2026     ( ) Spring 2027                                      │
│   (Only terms marked "Enable for evaluation" in Setup appear here.)      │
│   Term ends Dec 15, 2026 — reminders will anchor to this date.          │
│                                                      [ Cancel ] [ Next ] │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 2 — Select courses → auto-template by course type → override allowed:**
```
┌─ Activate Evaluations · Step 2 of 5 ────────────────────────────────────┐
│  Courses offered in Fall 2026            [ Select all ]   8 courses      │
│  ┌───────────────────────────────────────────────────────────────────┐  │
│  │ ☑ NUR 101  Anatomy I     Type: Didactic   → Standard Didactic  ▾  │  │ ← default
│  │ ☑ NUR 110  Skills Lab    Type: Lab        → Lab Eval            ▾  │  │   template
│  │ ☑ NUR 250  Clinical      Type: Clinical   → ⚠ no template   [pick]│  │   (editable
│  │ ☐ NUR 300  Seminar       Type: Seminar    → Seminar Eval       ▾  │  │    per row)
│  └───────────────────────────────────────────────────────────────────┘  │
│  Template defaults come from each course's type. Override any row.       │
│                                                  [ Back ]   [ Next ]     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 3 — Distribution dates (calculated from term-end anchors; editable):**
```
┌─ Activate Evaluations · Step 3 of 5 ────────────────────────────────────┐
│  Distribution dates  (calculated from term end Dec 15 — edit if needed)  │
│                                                                          │
│   Email goes out / Evaluation opens  [ Dec 8, 2026  ]  (term end − 7)   │
│   Evaluation closes                  [ Dec 15, 2026 ]                   │
│   Reminders (from your schedule):    Dec 1 · Dec 5 · Dec 10             │
│                                                                          │
│   ⚠ Date conflict: open date must be before close date                   │
│                                                                          │
│   Apply same dates to:  (•) All selected courses   ( ) Per course        │
│                                                  [ Back ]   [ Next ]     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 4 — Email templates (pre-filled from Setup defaults; editable for this activation only):**
```
┌─ Activate Evaluations · Step 4 of 5 ────────────────────────────────────┐
│  Emails that will be sent  (from your Setup defaults — edit if needed)   │
│                                                                          │
│   Initial email    "Your {{courseName}} evaluation is now open"  [Edit]  │
│   Reminder email   "Reminder: {{daysRemaining}} days left"       [Edit]  │
│                                                                          │
│   ⓘ Editing here affects this activation only — Setup templates unchanged│
│                                                  [ Back ]   [ Next ]     │
└─────────────────────────────────────────────────────────────────────────┘
```

**Step 5 — Review & Save (Save ≠ Send):**
```
┌─ Activate Evaluations · Step 5 of 5 — Review ───────────────────────────┐
│  Term        Fall 2026                                                   │
│  Courses     8 selected · 8 templates assigned                          │
│  Opens       Dec 8  ·  Closes Dec 15  ·  Reminders Dec 1 / Dec 5 / Dec 10│
│  Emails      Initial (Dec 8 auto-send) + 3 reminders (auto-send)        │
│                                                                          │
│  ⓘ Saving SCHEDULES everything. No email is sent right now.              │
│    The initial email sends automatically on Dec 8.                       │
│                                         [ Back ]   [ Save & schedule ]   │
└─────────────────────────────────────────────────────────────────────────┘
```

### 4c. Distribution state machine (per course per term)

```
  (not included in any activation)
        │  included in a saved activation (no conflict)
        ▼
  ┌───────────┐   missing template / date conflict   ┌─────────┐
  │ SCHEDULED │ ◀──────────────────────────────────  │ BLOCKED │
  └─────┬─────┘                                       └─────────┘
        │  open date reached → initial email auto-fires
        ▼
  ┌────────────┐   scheduled reminders auto-send
  │ COLLECTING │   + admin can trigger ad-hoc Nudge
  └─────┬──────┘
        │  close date reached
        ▼
  ┌────────┐
  │ CLOSED │ → analytics available on Evaluation Card
  └────────┘
```

---

## 5. Analytics — 3 Entry Points + Shared Evaluation Card

Verbatim: *"three ways of entering… by term, by faculty, by course… the only thing that changes is how you aggregate the data before… the final review screen is the same."*

### Entry 1 — By Term  `analytics?by=term`  [EXISTS — extend]

```
┌─ Analytics ▸ By Term ───────────────────────────────────────────────────┐
│  Term: [ Fall 2026 ▾ ]                                                   │
│  ┌─ KPIs (max 4) ──────────────────────────────────────────────────┐   │
│  │  Overall completion 62%  │  Responses 248  │  Courses 8  │  Pending 3 │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Courses in this term                                                    │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Course      Faculty      Enrolled  Completion    Status    Action │  │
│  │ NUR 101     Smith, Lee    40        85%           Collecting [Nudge]│ │ ← ad-hoc
│  │ NUR 250     Patel         18        22%           Collecting [Nudge]│ │   reminder
│  │ NUR 110     Gomez         35        90%           Closed    [View] │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Row click → Evaluation Card for that course offering.                   │
│  [Nudge] → sends manual reminder to non-responders (out-of-schedule).   │
└─────────────────────────────────────────────────────────────────────────┘
```

Verbatim: *"Do I want to send additional reminders? Do I want to nudge somebody?"*

### Entry 2 — By Faculty  `analytics?by=faculty`  [NET-NEW]

```
┌─ Analytics ▸ By Faculty ────────────────────────────────────────────────┐
│  Faculty: [ John Smith ▾ ]                                               │
│  ┌─ KPIs (max 4) ──────────────────────────────────────────────────┐   │
│  │  Courses taught 12  │  Avg rating 4.3  │  Avg completion 78%  │  Terms 5 │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Course offerings taught by John Smith                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Course    Term          Role          Enrolled  Rating  Completion│  │
│  │ NUR 101   Fall 2026     Main           40        4.4     85%      │  │
│  │ NUR 101   Spring 2026   Main           38        4.2     80%      │  │
│  │ NUR 305   Fall 2025     Guest lect.    22        4.5     71%      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Row click → Evaluation Card (that offering × Smith).                    │
└─────────────────────────────────────────────────────────────────────────┘
```

Verbatim: *"courses that faculty has taught… avg rating… avg completion rate."*
⚠ Rating viz: no red — use amber/orange for below-threshold (MEMORY: Aarti dislikes red in score viz).

### Entry 3 — By Course (cross-term)  `analytics?by=course`  [NET-NEW]

```
┌─ Analytics ▸ By Course ─────────────────────────────────────────────────┐
│  Course: [ NUR 101 — Anatomy I ▾ ]    Type: Didactic                    │
│  ┌─ KPIs (max 4) ──────────────────────────────────────────────────┐   │
│  │  Times offered 20  │  Avg rating 4.2  │  Avg completion 76%  │  Trend ↗ │
│  └──────────────────────────────────────────────────────────────────┘   │
│                                                                          │
│  Offerings (one row per term instance)                                   │
│  ┌──────────────────────────────────────────────────────────────────┐  │
│  │ Term          Faculty    Enrolled  Rating  Completion             │  │
│  │ Fall 2026     Smith       40        4.4     85%                   │  │
│  │ Spring 2026   Smith       38        4.2     80%                   │  │
│  │ Fall 2025     Lee         41        4.0     74%                   │  │
│  │  … 17 more …                                                      │  │
│  └──────────────────────────────────────────────────────────────────┘  │
│  Trend viz: slope/strip plot preferred (progress bars = last resort).    │
│  Row click → Evaluation Card.                                            │
└─────────────────────────────────────────────────────────────────────────┘
```

Verbatim: *"that course was offered 20 times… some stats around those 20 times… ability to click in on any one instance."*

### Evaluation Card — shared terminal view  [REBUILD]

Unique key (verbatim): *"this course was taught by this faculty, was taught to 20 students… the lowest element for us."* = **courseOffering × faculty × cohort**.

Currently: section-level scores only. Must rebuild to **per-question viz** with multi-faculty repeat.

```
┌─ Evaluation Card ───────────────────────────────────────────────────────┐
│  ‹ By Term  ›  Fall 2026  ›  NUR 101         (breadcrumb = drill source) │
│  NUR 101 · Anatomy I · Fall 2026 · John Smith (Main faculty)            │
│  Responses  34 / 40   (85%)                                             │
│ ─────────────────────────────────────────────────────────────────────── │
│  SECTION 1 · Course                                                      │
│   Q1  Objectives clearly stated (1–5)  ▁▂▅█▇   mean 4.4                 │ ← scale → bar
│   Q2  Workload appropriate (1–5)       ▁▃▆█▅   mean 4.1                 │
│   Q5  Would recommend? (Y/N)           Yes 88% │ No 12%                 │ ← MCQ → bar
│ ─────────────────────────────────────────────────────────────────────── │
│  SECTION 2 · Faculty — John Smith (Main)                                 │
│   Q1  Explains clearly (1–5)           ▂▃▅█▇   mean 4.5                 │
│   Q2  Net promoter score (0–10)        NPS +42                          │ ← rating → numeric
│   Q4  Open comment                     22 responses   [ View all ]      │ ← free-text → count
│ ─────────────────────────────────────────────────────────────────────── │
│  (Multi-faculty: Section 2 repeats per faculty, each with their role.)   │
└─────────────────────────────────────────────────────────────────────────┘
```

Viz mapping: `scale/MCQ → bar chart` · `rating/NPS → numeric summary` · `free-text → count + view-all drawer`. Viz-first, text annotates values. No red in rating display.

---

## 6. Entity List Pages (existing routes — make read-only + eval-context)

All four: **remove Add / Import / Edit / Delete**. Add top KPI strip (≤4). Add eval-context columns. Row → eval context detail + **"Open in Prism ↗"** (new tab, React↔Angular boundary).

### Students  `admin/students`

```
KPIs: Total 412  │  Completion rate 58%  │  Pending 173
┌─ Name ──── Email ──────── Enrolled ─ Completed ─ Pending ─ Next due ───┐
│  A. Khan   akhan@…         8           2           6        Dec 10      │
└────────────────────────────────────────────────────────────────────────┘
Row click → inline panel:
  "Enrolled in 8 courses · 2 evaluations completed · 6 pending"
  [ list of courses with per-course eval status ]
  [ Open in Prism ↗ ]
```
Verbatim: *"the student was part of eight courses but has only completed two evaluations."*

### Faculty  `admin/faculty`

KPI strip: faculty count · avg rating · avg completion rate.
Columns: name, courses taught (this term), avg rating, avg completion %.
Row → eval summary + [ Open in Prism ↗ ].
Note: today only has offering-count — needs rating and analytics stats added.

### Course Master  `admin/courses`

KPI strip: total courses · course types · avg rating.
Columns: name, course type, times offered, avg rating.
Row → cross-term history panel + [ Open in Prism ↗ ].
Note: currently has full CRUD — remove mutations.

### Course Offerings  `admin/offerings`

KPI strip: total offerings · collecting · closed · avg completion.
Columns: course, term, faculty, enrolled, eval status, completion %.
Row → **Evaluation Card** (not inline panel) + [ Open in Prism ↗ ].
Note: currently has full CRUD — remove mutations.

---

## 7. User Journeys (Program Administrator)

### Journey A — First-time setup (new school, year 1)

1. **Setup ▸ Academic Years & Terms** → enable 2026–27, enter year + term dates → toggle "Fall 2026" enabled.
2. **Setup ▸ Survey Templates** → "New template" → name it → set "Applies to: Didactic" → build Section 1 (course questions) → build Section 2 role variants (Main / Guest / Assistant). Save.
3. Repeat for each course type (Lab, Clinical, Seminar, etc.).
4. **Setup ▸ Email Templates** → write Initial email body + subject → switch to Reminder tab → write reminder body using `{{daysRemaining}}`. Save.
5. **Setup ▸ Reminder Schedule** → confirm anchor = Term end date → enter intervals (15/10/5 days before term end). Save.
6. **Activate** → Step 1: Fall 2026 → Step 2: select all courses (templates auto-fill by type) → Step 3: accept calculated dates → Step 4: accept email defaults → Step 5: **Save & schedule**.
7. Done. Nothing sent yet. Initial email auto-fires on the open date.

### Journey B — Annual repeat activation (year 2+, <5 min)

Setup defaults already exist.
1. **Setup ▸ Terms** → enable next term, confirm/add dates.
2. **Activate** → Step 1: pick new term → Step 2: select all courses (auto-fill) → Step 3: accept dates → Step 4: accept emails → Step 5: **Save & schedule**.
3. Done in under 5 minutes.

### Journey C — Faculty analytics review

Admin wants to see how Prof. Smith is rated across all their courses.
1. **Analytics ▸ By Faculty** → select "John Smith".
2. Read KPIs: 12 courses, 4.3 avg, 78% completion.
3. Scan offerings grid — spot a weak term (Fall 2025, 4.0).
4. Click that row → **Evaluation Card** (NUR 305 × Fall 2025 × Smith) → read per-question breakdown.
5. Back to grid, click another offering to compare.

### Journey D — Cross-term course analysis

Admin wants to see how NUR 101 has trended over 3 years.
1. **Analytics ▸ By Course** → select "NUR 101".
2. Read KPIs (20 offerings, trend ↗).
3. Scan slope/trend viz across 3 years.
4. Click a weaker term → **Evaluation Card** → identify specific questions dragging the score.

### Journey E — Ad-hoc nudge during active term

Admin sees low completion on NUR 250 in Fall 2026.
1. **Analytics ▸ By Term** → Fall 2026 → spot NUR 250 at 22%.
2. Click **[Nudge]** on that row.
3. Confirm: "Send reminder to 14 non-responders now?"
4. Confirm → reminder sent immediately (outside of scheduled cadence).

---

## 8. State Coverage Map

| Screen / Component | States required |
|---|---|
| Academic Years & Terms (Setup) | loading · empty (no years) · populated · saving · saved · date-invalid (end ≤ start) · error |
| Survey Template builder | new (mode-choice) · upload-parsing · scratch-editing · validation-error (empty section / no role variant) · saving · saved · error |
| Email Template editor | loading · editing · variable-invalid · saving · saved · error |
| Reminder Schedule | loading · default-loaded · interval-edit · invalid (≥ term length / negative) · saving · saved |
| Term Activation Wizard | empty-term (no enabled terms) · no-courses (term has 0 offerings) · template-missing (type unmapped) · dates-conflict (open ≥ close) · saving · saved · error |
| Distribution (per course) | scheduled · blocked · collecting · closed |
| By Term analytics | loading · empty (term not activated) · populated · filtered · nudge-sending · nudge-sent · error |
| By Faculty analytics | loading · empty (no offerings for faculty) · populated · filtered · error |
| By Course analytics | loading · single-offering (no trend possible) · multi-offering · error |
| Evaluation Card | loading · no-responses-yet · partial (collecting) · complete (closed) · single-faculty · multi-faculty · error |
| Students list | loading · empty · populated · filtered · row-panel-open |
| Faculty list | loading · empty · populated · filtered |
| Course Master list | loading · empty · populated · filtered |
| Course Offerings list | loading · empty · populated · filtered · not-yet-activated row |

---

## 9. Open Questions & Assumptions

### Open (need Aarti input before build)

- **OPEN-1** — Course type maps to >1 survey template: which is the default in Step 2 auto-assign?
- **OPEN-2** — Ad-hoc Nudge recipient scope: all non-responders for that course, or admin-selectable individual students?
- **OPEN-3** — Cohort definition for Evaluation Card key: enrolled students of that offering, or a specific sub-group?
- **OPEN-4** — Multi-faculty rating on grids: does "avg rating" for a course row blend all faculty ratings, or is it only shown at per-faculty level?
- **OPEN-5** — Reminder anchor migration: do existing distributions (anchored to survey-close) get migrated to term-end, or only new activations get the correct anchor?
- **OPEN-7** — Leo placement in these new surfaces: inherits shell header (assumed) or gets dedicated placement? Finalize with Mondal before Jun 22.

### Assumptions (validated by transcript or prior decisions)

- **ASSUME-1** — Leo + global search live in existing PCE shell header; not per-module placement.
- **ASSUME-2** — "Open in Prism" opens the entity's Prism profile by primary ID in a new tab; PCE holds only the Prism ID, no copied profile fields.
- **ASSUME-3** — Scale/MCQ → bar chart; rating/NPS → numeric summary; free-text → count + view-all drawer.
- **ASSUME-4** — Save & schedule is idempotent per term: re-running Activation for an already-activated term edits existing distributions rather than duplicating.
- **ASSUME-5** — Initial email send date = evaluation open date (transcript conflates "email goes out" with "evaluation opens up").
- **ASSUME-6** — Disabled academic years hidden from Activation term picker but still visible (greyed) in Setup for re-enabling.
- **ASSUME-7** — Faculty role variants (Main / Guest / Teaching Assistant) are template-level, not overridable per individual activation.

---

## 10. Built vs. Needs Change vs. Net-New

| Feature | Already built | Needs change | Net-new |
|---|---|---|---|
| Students list | Yes (editable CRUD) | Make read-only; add eval cols (enrolled/completed/pending/next-due); KPI strip; Prism row link | — |
| Faculty list | Yes (offering-count only) | Add avg rating + avg completion; KPI strip; make read-only; Prism link | — |
| Course Master list | Yes (full CRUD) | Add course-type / times-offered / avg-rating cols; make read-only; Prism link | — |
| Course Offerings list | Yes (full CRUD) | Add eval-status + completion %; make read-only; row → Eval Card; Prism link | — |
| Academic Years / Terms | Yes (CRUD + dates) | Add "Enable for evaluation" toggle; confirm dates field present; writes to shared Prism dropdown | — |
| Survey Templates (faculty sections) | courseType col + auto-assign works | Add faculty role variants in Section 2; upload-doc creation mode; target-audience field | Faculty role-variant structure |
| Email Templates | Inside push wizard only | — | Standalone Setup surface, 2 reusable templates, `{{daysRemaining}}` |
| Reminder Schedule | Anchored to close date (CONTRADICTS) | Re-anchor to **term end date** | Reminder Schedule Setup surface + multi-interval model |
| Setup-once defaults | Missing | — | Saved-defaults model tying template + emails + schedule per course type |
| Term Activation wizard | Two overlapping flows (run-eval + push) | Consolidate into single 5-step wizard; implement Save ≠ Send; anchor to term end | SCHEDULED status |
| Analytics By Term | Built | Wire row → rebuilt Eval Card; add row-level [Nudge] | — |
| Analytics By Faculty | Missing | — | New door + faculty KPIs + offerings grid |
| Analytics By Course (cross-term) | Missing | — | New door + cross-term KPIs + trend viz + offerings grid |
| Evaluation Card | Section-level scores only | Rebuild to per-question viz; multi-faculty repeat; breadcrumb drill source | — |
| Ad-hoc Nudge | Not present | — | Manual reminder action on By-Term grid |
| Course-type → template auto-assign | Built | Resolve OPEN-1 (>1 template per type) | — |

### Summary
**Net-new surfaces:** Email Templates (standalone), Reminder Schedule config, Setup-defaults model, Save≠Send / SCHEDULED state, By-Faculty analytics door, By-Course cross-term analytics door, faculty role-variant template structure, ad-hoc Nudge action.

**Changed (existing) surfaces:** 4 entity list pages (read-only + eval cols + KPI + Prism link), Academic Years/Terms (enable toggle), Survey Templates (faculty variants + upload mode), Term Activation wizard (2 flows → 1), Evaluation Card (section → per-question), By-Term analytics (row drill + nudge).

**Hard constraints:** No new "Directory" nav; Prism = read-only source of truth (new tab); exactly 2 email templates; reminders anchor to term end; Save schedules, never sends immediately; 2–5 min activation target; no student login; no red in rating viz; KPIs capped at 4.

---

## 11. DS Component Map

Sourced from `@exxatdesignux/ui@0.6.28` (`node tools/ds/source.mjs`). Generate against these types + `localhost:4000/library/<id>` — not from memory.

> **Key finding:** No `Stepper` component exists in the DS. `WizardNav` (`components/pce/wizard-nav.tsx`) stays custom. Everything else maps to DS imports.

| Surface | DS Component | Verdict | Notes |
|---|---|---|---|
| Entity list KPI strips (Students, Faculty, Courses, Offerings) | `KeyMetrics` variant="flat" | IMPORT | `metrics: MetricItem[]`; omit delta for most; max 4 items per brief constraint |
| Analytics KPI strips (By Term, By Faculty, By Course) | `KeyMetrics` variant="card" | IMPORT | Same component; use `trendPolarity` for completion rate (higher_is_better) |
| Analytics By Term / Faculty / Course switcher | `Tabs` variant="line" | IMPORT | Add `flex flex-col` to root; `TabsList` + `TabsContent` per door |
| Term Activation wizard step indicator | Custom `WizardNav` (already built) | KEEP CUSTOM | No DS Stepper — `components/pce/wizard-nav.tsx` is correct |
| Step 1 — term radio selection | `RadioGroup` + `RadioGroupItem` | IMPORT | One item per enabled term |
| Step 2 — per-row template override | `Select` + `SelectContent` + `SelectItem` | IMPORT | One Select per course offering row |
| Faculty role variants (template builder Section 2) | `Accordion` + `AccordionItem` + `AccordionTrigger` + `AccordionContent` | IMPORT | One AccordionItem per role variant (Main / Guest / Assistant); live: `localhost:4000/library/accordion` |
| Section drag-to-reorder (template builder) | `useDraggableList` hook | IMPORT | Already in DS; pairs with `DragHandleGripIcon` |
| Reminder interval rows | `InputGroup` + `InputGroupInput` + `InputGroupAddon` | IMPORT | "[ N ] days before term end" pattern |
| Email template editor (subject + body) | `Input` + `Textarea` | IMPORT | Standard DS form fields |
| Evaluation Card per-question bar charts | `ChartContainer` + `ChartConfig` + Recharts `BarChart` | IMPORT | `ChartContainer` wraps Recharts `ResponsiveContainer`; use `ChartConfig` for token-mapped bar colors; live: `localhost:4000/library/chart` |
| Evaluation Card free-text "View all" | `Sheet` (side) | IMPORT | Sheet from right; `SheetContent` + `SheetHeader` |
| Eval status column (SCHEDULED / COLLECTING / CLOSED / BLOCKED) | `Badge` | IMPORT | **Not** `StatusBadge` — that's Beta/New/Alpha only; use `Badge` with variant per status |
| Row detail panel on entity pages | `Sheet` | IMPORT | Side panel; "Open in Prism ↗" button inside footer |
| "Open in Prism ↗" action | `Button` variant="ghost" size="sm" | IMPORT | `aria-label="Open in Prism"` required; `target="_blank"` link |
| Ad-hoc Nudge confirmation | `AlertDialog` | IMPORT | Confirming action ("Send reminder to N non-responders?"); not `Dialog` |
| Setup-level empty states (no enabled terms, no templates) | `LocalBanner` | IMPORT | Warning variant with CTA link to Setup |

---

## 12. Mobbin Reference Screens

Searched Jun 12, 2026. Use these as layout + interaction references before drawing any wireframe.

### Term Activation wizard

**Best reference — [AWS Amplify: Create new app · App settings](https://mobbin.com/screens/4e197c45-1b5a-46e6-a886-ecc0ac8baaaf)**
Left vertical step list (check = complete, filled circle = current, number = future) + right content with auto-detected defaults + override fields. Direct match for "pre-filled defaults, admin can edit" pattern of Steps 3–4.

**Secondary — [Workable: Create onboarding workflow](https://mobbin.com/screens/072275d2-39b8-4bcb-bf34-cc5af3143747)**
Left step list + right content with card list + slide-out panel. Good model for Step 2 (course list with per-row template assignment + optional per-course drawer).

**Secondary — [Gorgias: Add articles using templates](https://mobbin.com/screens/00b90d78-3433-4fee-9992-1543330c13c0)**
Grouped checklist with "Next" flow inside a wizard step. Matches the "select all / deselect" course-picker pattern in Step 2.

### By-Faculty analytics

**Best reference — [Whop: User overview](https://mobbin.com/screens/35f39075-8bb9-4e71-a56c-abdc7a2bbace)**
Left profile sidebar with KPIs (Spent / Joined / MRR), right content with tabs (Summary / User logs) and DataTable. Very close to By-Faculty: left = faculty KPIs (courses taught / avg rating / avg completion), right = offerings DataTable.

**Secondary — [Amplitude: User profile insights](https://mobbin.com/screens/29fad030-c7c0-4f8f-b15d-e50c307bd9b2)**
KPIs strip + bar charts + tabular breakdown. Good reference for the aggregated-stats-before-drill pattern.

### Survey template builder

**Best reference — [Charma: Create Template](https://mobbin.com/screens/02d7709d-df33-423c-9acb-7c24a777bfcd)**
Section headers with "+ Add Topic" per section and "+ Add Section" at bottom. Drag handle on individual rows. Almost exactly the Section 1 (course) + Section 2 (per-faculty) two-tier model — use this as the layout reference for template builder.

**Secondary — [Workable: Create survey](https://mobbin.com/screens/7cb170fa-bd3a-48eb-aa2f-4e5a87e66e57)**
Left step nav + right question list with drag handles + "Add new question" inline. Good for the question-level interaction within a role variant.

---

## 13. Nav Delta + CommandPalette

### Current nav — source of truth (`lib/pce-nav.tsx`)

```
NAV_ADMIN (admin role)
├── Course Evaluation                          ← collapsible group
│   ├── Evaluations          /surveys
│   └── Templates            /templates
│
├── Programmatic Surveys                       ← collapsible group
│   ├── Surveys              /surveys/programmatic
│   └── Templates            /templates/programmatic
│
└── Setup                                      ← collapsible group (ALL entity + config mixed)
    ├── Students             /admin/students
    ├── Faculty              /admin/faculty
    ├── Courses              /admin/courses
    ├── Terms                /admin/terms
    ├── Offerings            /admin/offerings
    ├── Competencies         /admin/competencies
    ├── Content Areas        /admin/content-areas
    ├── Standards            /admin/standards
    ├── Assessment Types     /admin/assessment-types
    ├── Permissions          /admin/permissions
    └── Overview             /admin

⚠ Analytics: NOT in nav (route /analytics exists but is unreachable from sidebar)
⚠ Moderation: NOT in nav (route /moderation exists but unreachable)
⚠ Setup mixes entity management + eval config in one flat list — no separation
```

### Target nav — after Course & Faculty Evaluation module

```
NAV_ADMIN (target)
├── Course Evaluation                          ← collapsible group
│   ├── Evaluations          /surveys          [EXISTS]
│   ├── Activate             /admin/activate   [NET-NEW]
│   ├── Analytics            /analytics        [NET-NEW nav entry; Tabs inside]
│   │     By Term / By Faculty / By Course     [tabs on analytics page]
│   ├── Moderation           /moderation       [ADD to nav — route exists, was invisible]
│   └── Templates            /templates        [EXISTS — extend]
│
├── Programmatic Surveys                       ← unchanged
│   ├── Surveys              /surveys/programmatic
│   └── Templates            /templates/programmatic
│
└── Setup                                      ← split: Directories + Eval Config
    │
    ├── ── Directories (read-only) ──
    │   ├── Students         /admin/students   [EXISTS — make read-only + eval cols]
    │   ├── Faculty          /admin/faculty    [EXISTS — make read-only + rating stats]
    │   ├── Courses          /admin/courses    [EXISTS — make read-only + cross-term stats]
    │   └── Offerings        /admin/offerings  [EXISTS — make read-only + eval status]
    │
    ├── ── Eval Config ──
    │   ├── Academic Years & Terms  /admin/terms               [EXISTS — add enable toggle + dates]
    │   ├── Survey Templates        /templates                 [same route as CE > Templates]
    │   ├── Email Templates         /admin/email-templates     [NET-NEW]
    │   └── Reminder Schedule       /admin/reminder-schedule   [NET-NEW]
    │
    └── ── PCE-wide (unchanged) ──
        ├── Competencies     /admin/competencies
        ├── Content Areas    /admin/content-areas
        ├── Standards        /admin/standards
        ├── Assessment Types /admin/assessment-types
        ├── Permissions      /admin/permissions
        └── Overview         /admin
```

**Decision required (OPEN-8):** Does Analytics use `Tabs variant="line"` (one page, three tabs) or three separate nav sub-items? Recommend tabs — matches Aarti's "three entry points" framing, simpler nav. Flag for Mondal before build.

**Decision required (OPEN-9):** Should Setup split into visible sub-labels ("Directories" / "Eval Config" / "PCE-wide") in the sidebar, or stay flat with items reordered? Recommend sub-labels using `SidebarNavLabel` — the current flat list of 11 items is already unmanageable. Flag for Mondal.

### CommandPalette registrations (`components/command-palette.tsx`)

| Label | Route | Group |
|---|---|---|
| Activate Evaluations | `/admin/activate` | Course Evaluation |
| Analytics — By Faculty | `/analytics?by=faculty` | Course Evaluation |
| Analytics — By Course | `/analytics?by=course` | Course Evaluation |
| Moderation | `/moderation` | Course Evaluation |
| Email Templates | `/admin/email-templates` | Setup |
| Reminder Schedule | `/admin/reminder-schedule` | Setup |

### Build blockers — OPEN questions (pin before Baroda Jun 22)

| # | Question | Blocks |
|---|---|---|
| OPEN-1 | >1 template per course type: which is the default in Step 2 auto-assign? | Term Activation Step 2 logic |
| OPEN-7 | Leo/chat placement in new surfaces — inherit shell header or per-module? | Every new page shell |
| OPEN-8 | Analytics: Tabs on one page vs three separate nav sub-items? | Left nav + analytics route |
| OPEN-9 | Setup: sub-labels ("Directories" / "Eval Config") vs flat reordered list? | `lib/pce-nav.tsx` restructure |

---

## 14. End-to-end Functional Flow

This is the system lifecycle — what the platform does from school onboarding through analytics, mapped against time and persona. Different from §7 (task journeys). Use this to verify that every surface in the module connects to a real moment in the flow.

### Lifecycle diagram

```
TIME →    [Year start]      [Term prep]     [Open date]    [Collecting]   [Close date]  [Analytics]
           (once/year)       (< 5 min)       (auto)         (weeks)        (auto)        (ongoing)

──────────────────────────────────────────────────────────────────────────────────────────────────
ADMIN     Enable AY         Select term     —              Monitor %      —             By Term
ACTIONS   + Terms           Select courses                 completion     —             By Faculty
          Build Templates   Approve dates                  Ad-hoc Nudge   Release?      By Course
          Write Emails      Approve emails                 (optional)     → Moderation  → Eval Card
          Set Reminders     Save & Schedule
          (Setup zone)      (Activate wizard)
                ↓                 ↓
DATA       Defaults stored   Distribution   Initial email  Reminder       Responses     Aggregated
CREATED    in Setup          record         scheduled      emails fire    locked        per-question
           (reused every     SCHEDULED      (on open date) (N days        (read-only)   scores
            term)            status set     sent to all    before
                                            students       term end)
                ↓                 ↓               ↓              ↓              ↓
STUDENT    —                 —               Receives       Can edit       Cannot        —
ACTIONS                                     email CTA      submitted      edit
                                            → Survey HOME  responses      responses
                                            Fills sections
                                            (course +
                                             per-faculty)
                                            Submits
                ↓                 ↓               ↓              ↓              ↓
STATUS     —                 SCHEDULED       COLLECTING     COLLECTING     CLOSED        CLOSED
           (no distribution  (saved, not     (open date     (reminders     (close date   (Eval Card
            record yet)       sent)           reached)       auto-fire)     reached)      unlocked)
```

### Data dependencies between zones

```
SETUP outputs → ACTIVATION consumes
─────────────────────────────────────────────────────────────────
Term.endDate              → Step 3 date calculator (open = end−7, close = end+0)
Term.enabledForEval       → Step 1 term picker (only enabled terms appear)
Template.courseType       → Step 2 auto-assign (Didactic → Standard Didactic Eval)
EmailTemplate.initial     → Step 4 pre-fill (editable per activation)
EmailTemplate.reminder    → Step 4 pre-fill (editable per activation)
ReminderSchedule.intervals → Step 3 reminder preview (Dec 1 / Dec 5 / Dec 10)

ACTIVATION outputs → AUTO-FIRE consumes
─────────────────────────────────────────────────────────────────
Distribution.openDate     → trigger: fire initial email + set status COLLECTING
Distribution.closeDate    → trigger: set status CLOSED
ReminderSchedule × Term.endDate → trigger: fire reminder emails on calculated dates

COLLECTING state → ANALYTICS consumes
─────────────────────────────────────────────────────────────────
Response.submittedAt      → completion % shown in By Term during COLLECTING
Response.perQuestion      → Eval Card bar charts (only after CLOSED)
Faculty.courseOfferings   → By Faculty aggregation
Course.allOfferings       → By Course cross-term aggregation
```

### What each surface connects to in the flow

| Surface | Lifecycle moment | Input from | Output to |
|---|---|---|---|
| Academic Years & Terms | Year start (once) | Admin | Term.endDate → Activation |
| Survey Templates | Year start (once) | Admin | Template → Activation auto-assign |
| Email Templates | Year start (once) | Admin | Email body → Activation pre-fill |
| Reminder Schedule | Year start (once) | Admin | Intervals → Activation date preview |
| Term Activation wizard | Term prep (< 5 min) | Setup defaults | Distribution records (SCHEDULED) |
| Auto-fire (initial email) | Open date (auto) | Distribution.openDate | Student receives email CTA |
| Auto-fire (reminders) | N days before term end (auto) | ReminderSchedule × Term.endDate | Student receives reminder |
| Survey HOME (student) | Open → Close | Email CTA link | Student response records |
| By Term analytics | During COLLECTING + after CLOSE | Distribution + Responses | Admin sees % + Nudge |
| Ad-hoc Nudge | During COLLECTING | Admin action | Out-of-schedule reminder email |
| Moderation | After CLOSE | Open-text responses | Admin releases / flags |
| By Faculty analytics | After CLOSE | Faculty + Responses | Faculty performance view |
| By Course analytics | After CLOSE | Course history + Responses | Cross-term trend view |
| Evaluation Card | After CLOSE | One offering × one faculty | Per-question breakdown |
