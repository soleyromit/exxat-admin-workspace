# Assessment Creation — V0 Requirements Reference
**Exam Management | Admin**
Last updated: 2026-06-04 | Source: PRD v2 + June 3 builder discussion

> **Scope:** 🟢 Exxat differentiators + 🟡 ExamSoft-parity features only.
> 🔴 Out-of-scope items (advanced proctoring, rubrics exam type, take-home, ExamNow, offline client) are explicitly excluded.
> Build status cross-referenced against `docs/decisions/feature-registry.md`.

---

## 1. Personas & Role Matrix

| Role | Creates Assessment | Authors Questions | Configures Delivery | Reviews/Approves | Publishes |
|---|---|---|---|---|---|
| Institute Admin | ✓ | ✓ | ✓ | ✓ | ✓ |
| Course Coordinator | ✓ | ✓ | ✓ | ✓ (owner) | ✓ |
| Course Instructor / TA | ✓ (low-stakes) | ✓ (their section) | ✗ | ✗ | ✗ |
| Chairperson | ✗ | ✗ | ✗ | ✓ (final) | ✗ |
| Student | — | — | — | — | — |

**Key constraint:** Instructors can author only their delegated section. Chairperson is read-only reviewer.

---

## 2. Assessment Lifecycle — State Machine

```
┌──────────────────────────────────────────────────────────────┐
│                     ASSESSMENT STATE MACHINE                  │
│                                                              │
│  [Planned/Scheduled] → [Draft] → [In Review] → [Ready]      │
│                           ↑           ↓            ↓         │
│                        (edit)    (rejected)   (published)    │
│                                                  ↓           │
│                                            [Completed]       │
│                                                  ↓           │
│                                            [Archived]        │
└──────────────────────────────────────────────────────────────┘
```

| State | Who can edit | Trigger |
|---|---|---|
| Planned/Scheduled | Coordinator, Admin | Added to course curriculum, not started |
| Draft | Owner + delegated instructors (section-scoped) | Blueprint created |
| In Review | Read-only (locked) | Owner submits for review |
| Ready | Owner, Admin (config only) | Chairperson approves |
| Completed | Admin only (post-exam adjustments) | All students submitted |
| Archived | Admin read-only | Manual archive |

**Section-level partial review:** An instructor can submit only their section for review without waiting for the full assessment.

---

## 3. User Journeys

### 3.1 Course Coordinator — Planned High-Stakes Exam

```
Course page
  └─ "+ New Assessment"
       └─ Step 1: Blueprint Setup
            ├─ Select type: Exam
            ├─ Name, course link, dates
            ├─ [Option A] Start from scratch → define sections manually
            ├─ [Option B] Upload past assessment (PDF/DOC/ExamSoft Excel)
            │     └─ System ingests: sections, Q-type distribution, difficulty
            ├─ Set topic weightage (e.g. 40% Cardio, 60% Physio)
            ├─ Assign sections to instructors (Collaborators)
            └─ Save → enters Draft
                  └─ Step 2: Question Builder
                        ├─ Add questions per section:
                        │     ├─ Search QB (semantic + filters)
                        │     ├─ Upload doc → AI review → add
                        │     └─ Manual create
                        ├─ View health panel (composition + psychometrics)
                        ├─ Flag outlier questions
                        ├─ AI: replace question with unused QB alternative
                        └─ Step 3: Configure + Publish
                              ├─ Delivery settings (dates, security, tools)
                              ├─ Accommodations
                              ├─ Send for Review (2-level)
                              └─ Publish → Ready
```

### 3.2 Course Instructor / TA — Low-Stakes Quiz

```
Course page
  └─ "+ New Assessment"
       └─ Step 1: Quick setup
            ├─ Type: Quiz
            ├─ Name + course auto-linked
            └─ Save → Draft
                  └─ Step 2: Add questions
                        ├─ AI Quiz Generator (topic/slide input → questions)
                        └─ Step 3: Publish directly (no review required)
```

### 3.3 Delegated Instructor — Section Authoring

```
Notification: "You've been assigned Section B of [Assessment Name]"
  └─ Open assessment → scoped to Section B only
       └─ Add questions (QB, manual, AI, doc upload)
            └─ Mark section ready
                 └─ Coordinator notified in real-time
```

### 3.4 Chairperson — Review & Approve

```
Notification: "[Assessment] submitted for review"
  └─ Open In Review assessment (read-only)
       ├─ Preview as student (simulation mode)
       ├─ View psychometric health panel
       └─ Approve or Reject (with comment)
            └─ Approved → Ready state
```

---

## 4. Feature Catalog

### 4.1 Blueprint Setup (Step 1) 🟢

**Entry point:** From course page (not standalone). Assessment is always linked to a course.

| Feature | Priority | Build Status |
|---|---|---|
| Assessment type selection (Exam / Quiz) | V0 | ⚠️ Partial — types exist, type-specific config not differentiated |
| Course association (single or multi-course) | V0 | ⚠️ Partial |
| Assessment name + basic metadata | V0 | ✅ |
| Start from scratch (manual sections) | V0 | ✅ |
| Blueprint from past assessment (upload PDF/DOC/ExamSoft Excel) | V0 | ⚠️ Section structure copy missing |
| Ingest from past assessment: sections, Q-type distribution, difficulty data | V0 | ❌ |
| Topic weightage definition (e.g. 40% Anatomy, 60% Physiology) | V0 | ❌ |
| Section-to-instructor delegation | V0 | ✅ |
| Add collaborators at blueprint stage | V0 | ✅ |
| Saved blueprints (reuse from scratch templates) | V1 | ❌ |
| Syllabus / reference doc upload | V0 | ❌ |
| Graded / Ungraded toggle | V0 | ⚠️ |

**June 3rd clarification:** Basic details required in Step 1 = type, name, course, dates. Optional details = topic weightage, collaborators, blueprint upload. These should be visually separated (required vs optional) to reduce friction for quick quiz creation.

---

### 4.2 Assessment Builder Overview Panel (Step 2) 🟢

Always-visible health panel showing live composition and psychometric quality.

| Metric | Source | Build Status |
|---|---|---|
| Total question count | Live calculation | ⚠️ Partial (health panel exists) |
| Total score | Live sum of point values | ⚠️ |
| Estimated completion time | Config time limits + historical avg | ❌ |
| Difficulty index | Historical QB data | ❌ |
| Upper 27% vs Lower 27% | Historical QB data | ❌ |
| Discrimination index | Historical QB data | ❌ |
| Avg point-biserial correlation | Historical QB data | ❌ |
| Outlier question flagging (inline) | Automated scan | ❌ |
| Bloom's taxonomy distribution | Question tags | ⚠️ Pre-exam only |
| Content area coverage | Question tags | ⚠️ Pre-exam only |

**Outlier flagging:** Any question with negative PBI, near-zero discrimination, or extreme difficulty is flagged inline in the question list with a warning chip. This is pre-exam psychometric control (complement to post-exam automated alerts).

---

### 4.3 Question Sourcing & Authoring (Step 2) 🟢

#### 4.3.1 V0 Question Types (exactly 6)
1. MCQ / MSQ (Multiple Choice / Multiple Select)
2. True / False
3. Fill in the Blank / Short Answer
4. Match the Following
5. Hotspot Image
6. Essay

#### 4.3.2 Sourcing Methods

| Method | Description | Build Status |
|---|---|---|
| QB Search (semantic) | Natural language + filter search (topic, Bloom's, difficulty) | ⚠️ Keyword only; no semantic |
| QB Search (filters) | Content area, difficulty, question type chips | ✅ |
| Manual creation | "+ New Question" inline within section | ✅ |
| AI Quiz Generator | Supply topic/slide/case → AI drafts structured questions → review → add | ❌ |
| Doc upload → AI edit | Upload PDF/DOC/slides → AI extracts/generates questions → faculty reviews → add | ❌ |

**Local vs Master copy:** Pulling a QB question into an assessment creates a pinned reference. Editing it inside the builder creates a local draft for this exam only — master copy in QB is untouched.

#### 4.3.3 Question View (June 3rd)
- **Question text is primary** — large, readable, full stem visible without expanding
- Metadata chips (difficulty, Bloom's, content area, PBI) shown below the stem
- Outlier flag chip shown inline if the question triggers any psychometric alert
- Edit / Replace / Remove actions on hover

#### 4.3.4 Question List View
- Scan mode for coordinators: see all questions across sections at a glance
- Columns: #, Question stem (truncated), Type, Points, Difficulty, PBI, Bloom's, Flag
- Sort + filter by flag status, content area, or type
- Bulk selection → move to section, bulk-set point value

#### 4.3.5 Reorganization
| Feature | Build Status |
|---|---|
| Drag sections to reorder | ❌ |
| Drag questions across sections | ❌ |
| Bulk select questions + move to section | ❌ |
| Bulk set point value | ❌ |

#### 4.3.6 AI Features
| Feature | Priority | Notes |
|---|---|---|
| AI Quiz & Question Generator | V0 core | High-impact Cohere demo. Input: topic/slide/clinical case → output: full quiz template |
| AI semantic QB search | V0 core | Natural language queries (e.g. "cardio pharmacology Bloom's recall") |
| Smart question replacement | V0 if capacity | AI swaps selected Q with unused equivalent from QB; faculty approves |
| AI tagger (auto metadata) | Deferred | Needs mature QB corpus first |

---

### 4.4 Assessment Configuration (Step 2 / Step 3) 🟡

#### 4.4.1 Question-Level Grading Rules

| Question Type | Config Options |
|---|---|
| MCQ | Option randomization, distractor locking, negative marking |
| MSQ | Option randomization, distractor locking, all-or-nothing, partial credit (additive/proportional), right-minus-wrong |
| Fill in the Blank | Exact match vs contains, case sensitivity, alt spellings |
| Match the Following | Partial credit per matched pair, extra distractors |
| Hotspot | Target area definition (circle/polygon), multiple hotspots, partial credit |
| Essay | Word limit, blind grading, rubric-based grading 🟢 (named criteria + per-criterion points) |

#### 4.4.2 Navigation & Progression Rules 🟡

| Rule | Scope | Build Status | Notes |
|---|---|---|---|
| Forward-only section navigation | Section | ⚠️ | No going back to prev section once advanced |
| Require answer to advance to next section | Section | ❌ | |
| Forced timer transition (timer expires → auto-advance) | Section | ❌ | |
| Block backward navigation within section | Section | ❌ | **NEW from June 3 changes** — toggle per section |
| Require answer to advance to next question | Assessment | ❌ | Global toggle |

**Timer scope (June 3rd change):** Section-level and question-level timers are deprioritized. V0 targets assessment-level timer only.

#### 4.4.3 Question Ordering 🟡
- Fixed order (default)
- Random order per student — randomization is within-section only (never cross-section)

#### 4.4.4 Time Settings
- Assessment-level time limit (V0 primary)
- Section-level (deprioritized per June 3rd — defer to V1)
- Question-level (deprioritized — defer to V1)
- Warning alarm at configurable threshold (default: 5 min remaining)

#### 4.4.5 Pre-reads & Attachments 🟢 (Exxat differentiator vs ExamSoft)

ExamSoft supports attachments at global assessment level only. Exxat supports 4 levels:

| Level | Pre-read timer | Early availability (days before) |
|---|---|---|
| Assessment | ✓ | ✓ (with email notification) |
| Section | ✓ | ✓ |
| Question Group | ✗ | ✗ |
| Question | ✗ | ✗ |

Attachment types: PDF, images, lab value tables, reference docs.

#### 4.4.6 Weightage & Grading
| Feature | Build Status |
|---|---|
| Total weightage (configurable) | ⚠️ |
| Section-wise distribution | ❌ |
| Question-wise distribution | ⚠️ |
| Bonus question designation | ❌ |
| Auto-scoring | ❌ |
| Blind scoring (hide student names) | ❌ |
| Student performance threshold flagging (teacher-facing only) | ❌ |

#### 4.4.7 Digital Tools (Hierarchical Override) 🟡

Control hierarchy: **Assessment level → Question level → Student/Accessibility level** (accessibility bypasses all restrictions)

| Tool | Options |
|---|---|
| Calculator | Off / Basic / Scientific |
| Text Highlight | On / Off |
| Notes / Scratchpad | On / Off |
| Allow feedback in notes | On / Off |
| Copy/Paste | On / Off |
| Warning alarms | Assessment-level + Section-level, configurable threshold |
| Spell Check (Essay) | On / Off |
| Find & Replace (Essay) | On / Off |

#### 4.4.8 Exam End Settings
| Feature | Build Status |
|---|---|
| Display results immediately vs. delayed | ❌ |
| Show raw score / percentage / both | ❌ |
| Allow early submission | ❌ |
| Post-submission rationale display | ❌ |

---

### 4.5 Post-Exam Review Engine (Config in Step 3) 🟡

Students review their exam under controlled conditions defined before publishing.

| Feature | Options |
|---|---|
| Access timing | Immediate / Scheduled (date+time) / Delayed (duration after submission) |
| Lockdown browser enforcement | On / Off (forces Respondus session for review) |
| Access password | Optional string |
| Time-limited session | Max duration in minutes |
| Show incorrect answers only | Toggle |
| Show rationale/correct answer | Toggle |

---

### 4.6 Post-Assessment Scoring & Regrading 🟡

Available in Completed state only. Every change triggers real-time async regrading + audit log entry.

| Feature | Description |
|---|---|
| Invalidate question | Award full credit to all students, regardless of answer |
| Discard question | Remove from denominator; subtract from total possible |
| Correct option override | Update answer key → auto-regrade all submissions |
| Accept multiple correct options | Add additional correct answers → auto-regrade |
| Points adjustment | Flat points add/subtract across cohort |
| Percentage curve | Set top score = 100%, or multiply avg by factor |
| Automated psychometric alerts | System flags questions with negative PBI, zero discrimination post-exam |
| Audit log | Every change: instructor ID + timestamp + rationale + before/after snapshot |

---

### 4.7 Delivery & Security (Step 3) 🟡

#### 4.7.1 Three-Stage Availability Window

```
[Visible Date]          [Openable Date]          [Cutoff Date]
     │                       │                        │
     ▼                       ▼                        ▼
Card appears           Student enters          Hard submission
on dashboard           placeholder screen      deadline
(pre-read available)   (exam data cached)      (auto-submit if active)
```

**Offline tolerance:** Exam data is cached when student enters placeholder screen. Once cached, exam can run offline. Internet required only for login + final submission.

**No downloadable file.** Caching is automatic, browser-managed. Pre-cache window is configurable (e.g. 1 hour before start time).

#### 4.7.2 Security Modes

| Mode | Behavior |
|---|---|
| Secure | Respondus lockdown browser enforced. Blocks other apps, VMs, screen capture. |
| Unsecure | Any standard browser. No lockdown. Start/Resume passwords still work. |

No intermediate "internet-blocked unsecure" mode. No device or IP restrictions in V0.

#### 4.7.3 Passwords
- **Exam Start password:** Cryptographic key to decrypt cached exam — required before timer begins
- **Resume password:** Required to re-enter after an authorized break

#### 4.7.4 Accommodations

| Type | Management |
|---|---|
| Permanent | Registered in student's global profile by institute admin |
| Temporary | Student requests via dashboard; admin approves |

Accommodation overrides all tool restrictions (calculator, extra time, text-to-speech, breaks).

---

### 4.8 Review & Publish Workflow (Step 3) 🟢

#### 4.8.1 2-Level Review State Machine

```
Draft
  └─ Owner submits → [In Review: Level 1 (Owner/Assessment Creator)]
                          └─ Approved → [In Review: Level 2 (Chairperson)]
                                            ├─ Approved → Ready
                                            └─ Rejected → Draft (with comment)
```

**Partial section review:** An instructor who owns only Section B can submit Section B for review independently. The overall assessment status can be "In Review (Partial)" while other sections remain in Draft.

#### 4.8.2 Dual-View Preview & Simulation 🟢 (available in Draft + In Review)

| View | What it shows |
|---|---|
| Student Simulation | Full exam as student sees it: navigation rules, tools, timers, question order |
| Proctor Simulator | Side-by-side dashboard showing proctor view as student actions play out |

#### 4.8.3 Collaborator Controls (live from builder)
- Add / remove collaborators at any time during Draft
- Section ownership visible in SectionsOutline
- Real-time section status: Not Started / In Progress / Ready / Submitted for Review

---

### 4.9 Proctoring Dashboard (Basic) 🟡

Live during exam administration. Scoped to basic issue management for V0.

| Feature | Description |
|---|---|
| Pre-exam cache verification | Confirm students have successfully cached exam data |
| Exam start monitoring | Real-time view of who has started |
| Issue alerts | Student raised hand / reported technical issue |
| End exam early | Proctor-initiated early submit for specific student |
| Invalidate exam | Remove student's exam from grading |
| Print for offline | Generate printable version + answer key for proctor if student's system fails |

---

## 5. System Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                      ASSESSMENT CREATION SYSTEM                      │
│                                                                     │
│  ┌──────────────┐   ┌──────────────────┐   ┌─────────────────────┐ │
│  │  Step 1      │   │  Step 2          │   │  Step 3             │ │
│  │  Blueprint   │   │  Builder         │   │  Config + Publish   │ │
│  │  Setup       │──▶│  (Questions)     │──▶│                     │ │
│  │              │   │                  │   │  Delivery settings  │ │
│  │  • Type      │   │  ┌────────────┐  │   │  Security mode      │ │
│  │  • Course    │   │  │ Sections   │  │   │  Accommodations     │ │
│  │  • Template  │   │  │ Outline    │  │   │  Tools config       │ │
│  │  • Topics    │   │  └────────────┘  │   │  Review window      │ │
│  │  • People    │   │  ┌────────────┐  │   │  Review workflow    │ │
│  │              │   │  │ Health     │  │   │  Publish            │ │
│  └──────────────┘   │  │ Panel      │  │   └─────────────────────┘ │
│                     │  └────────────┘  │                           │
│                     │  ┌────────────┐  │   ┌─────────────────────┐ │
│                     │  │ Question   │  │   │  POST-EXAM          │ │
│                     │  │ Editor     │  │   │                     │ │
│                     │  └────────────┘  │   │  Regrading engine   │ │
│                     └──────────────────┘   │  Psychometric alerts│ │
│                                            │  Audit log          │ │
│  ┌──────────────────────────────────────┐  │  Review window      │ │
│  │         QUESTION SOURCING            │  └─────────────────────┘ │
│  │  QB Search │ Manual │ AI Gen │ Upload│                          │
│  └──────────────────────────────────────┘                          │
│                                                                     │
│  ┌──────────────────────────────────────┐                          │
│  │         COLLABORATION LAYER          │                          │
│  │  Section ownership │ RBAC │ Notifs  │                          │
│  └──────────────────────────────────────┘                          │
└─────────────────────────────────────────────────────────────────────┘
```

### Data Model (key entities)

```
Assessment
  ├── type: Exam | Quiz
  ├── status: planned | draft | in_review | ready | completed | archived
  ├── course[] (multi-course association)
  ├── owner (Course Coordinator)
  ├── collaborators[] (instructor, section scoped)
  ├── sections[]
  │     ├── title, order, ownerInstructor
  │     ├── preread (text, attachment, timer, earlyAvailability)
  │     ├── settings (backNavBlocked, requireAnswer, randomize)
  │     ├── questions[] (local copy, pinned from QB master)
  │     │     ├── type, stem, options, points
  │     │     ├── gradingConfig (per question type)
  │     │     ├── toolOverrides (calculator, highlight)
  │     │     ├── attachments[]
  │     │     └── psychometrics (difficulty, PBI, discrimination — from QB history)
  │     └── status: not_started | in_progress | ready | submitted
  ├── config
  │     ├── timer (assessment-level only, V0)
  │     ├── security: secure | unsecure
  │     ├── passwords (start, resume)
  │     ├── tools (calculator, highlight, notes, copyPaste, alarms)
  │     ├── navigation (forwardOnly, requireAnswer, questionOrder)
  │     ├── breaks (maxBreaks, authorized)
  │     └── availability (visibleDate, openableDate, cutoffDate)
  ├── deliveryConfig
  │     ├── targetAudience (all | groups[])
  │     ├── accommodations[] (student-level overrides)
  │     └── earlySubmission: boolean
  ├── reviewConfig
  │     ├── timing: immediate | scheduled | delayed
  │     ├── lockdownBrowser: boolean
  │     ├── accessPassword: string
  │     ├── sessionDuration: minutes
  │     ├── incorrectOnly: boolean
  │     └── showRationale: boolean
  └── postExamConfig
        ├── showScore: raw | percent | both
        └── showResults: immediate | delayed
```

---

## 6. User Flows (Step by Step)

### Flow 1: Create from Past Assessment (Blueprint Recycling)

```
1. Course page → "+ New Assessment"
2. Step 1 opens
3. Select type: Exam
4. Enter name
5. Course auto-linked (entry via course)
6. Click "Use past assessment as template"
7. Search/select past assessment from course history
8. System ingests:
   a. Section names + order
   b. Question type distribution per section
   c. Historical difficulty per section
9. Preview ingested structure → confirm or edit
10. Set topic weightage (optional)
11. Assign sections to instructors (optional, can do later)
12. Save blueprint → enters Draft
13. Step 2: questions from ingested structure auto-populated as placeholders
14. Faculty reviews each placeholder → confirm, replace, or remove
    └── AI replacement: "Find unused equivalent" → approve AI suggestion
```

### Flow 2: AI Quiz Generator

```
1. Step 1: Quick quiz setup (name, course, Quiz type)
2. Step 2: Click "Generate with AI"
3. Input panel appears:
   ├── Topic (free text or syllabus section)
   ├── Source doc (upload slide deck / clinical case / PDF) [optional]
   ├── Question count target
   └── Question type mix (MCQ only, mixed)
4. AI generates draft questions
5. Review panel: faculty sees each question, edits stem/options, accepts/rejects
6. Accepted questions added to section
7. Continue to Step 3 → publish
```

### Flow 3: QB Search & Add

```
1. Step 2: Section → "Add from Question Bank"
2. QB search panel opens (semantic search bar + filters)
3. Search: "cardiovascular pharmacology recall level difficulty medium"
4. Results show: question stem preview, metadata chips, PBI, usage count
5. Select question(s) → "Add to Section"
6. Questions appear in section as pinned references (local copy)
7. Optional: inline edit → becomes local draft (master untouched)
```

### Flow 4: Review & Approval

```
1. Owner: Step 3 → "Send for Review"
2. Select reviewers (Level 1: self/co-owner, Level 2: Chairperson)
3. Assessment locks → In Review state
4. Reviewer notification sent
5. Reviewer opens assessment (read-only)
6. Reviewer can:
   a. Preview as student (simulation)
   b. View health panel (psychometrics)
   c. Add comments per question
7. Reviewer: Approve or Reject
   ├── Reject: owner notified, assessment back to Draft with comments
   └── Approve L1 → sent to L2 (Chairperson)
         └── Approve L2 → Ready state
8. Owner publishes from Ready (scheduled or immediate)
```

### Flow 5: Post-Exam Regrading

```
1. Assessment in Completed state
2. Instructor reviews automated psychometric alerts
3. Select flagged question
4. Choose action:
   ├── Invalidate (full credit to all)
   ├── Discard (remove from denominator)
   ├── Correct key (select new correct option)
   └── Accept additional options
5. Enter mandatory rationale note
6. Confirm → async regrading job triggered
7. All student scores recalculated
8. Audit log entry created (before/after snapshot)
9. LMS grade sync updated
```

---

## 7. Build Priority (V0 vs V1)

### V0 (Ship)
- Blueprint setup: scratch + past assessment upload + section ingestion
- Topic weightage definition
- Section-to-instructor delegation
- Health panel: composition metrics (count, score, time)
- QB search (upgrade to semantic)
- Manual question creation (all 6 types)
- AI Quiz Generator (Cohere demo — high priority)
- AI semantic QB search
- Assessment-level timer (deprioritize section/question timers)
- Section back-navigation block toggle (new from June 3)
- Pre-reads at assessment + section level
- Security modes (secure/unsecure) + start/resume passwords
- 3-stage availability window
- 2-level review workflow
- Student simulation preview
- Basic proctoring dashboard

### V1 (Next)
- Psychometric metrics in health panel (PBI, discrimination — needs QB history data)
- AI Smart Question Replacement
- Drag & drop reorganization
- Rubric-based essay grading
- Post-exam regrading engine
- Post-exam review window config
- Saved blueprint templates
- Collaborator controls (Q4 per June 3 discussion)
- Review workflow (Q4 per June 3 discussion)
- Section/question-level timers
- Grade curving engine

---

## 8. Open Decisions

| Decision | Status | Notes |
|---|---|---|
| Delivery pathway: Web/Respondus (Option 1) vs Installed Client (Option 2) | Pending tech alignment | Option 1 is PRD baseline |
| Confidence-based scoring | Open discussion | Pedagogical feature — needs stakeholder input |
| ExamSoft question import (browser plugin) | Exploring | Rated high value with metrics |
| Multi-assessment question fetch (e.g. MT1 + MT2 → Final) | Open | Mentioned in June 3 AI discussion |
| AI doc parsing for blueprint creation (PDF → sections) | Deferred | Phase 3 capability |

---

## 9. Cross-References

| Doc | Contents |
|---|---|
| `docs/decisions/feature-registry.md` | Live build status per feature |
| `docs/decisions/af529725.md` | Assessment builder: base entities, student experience, PRD workflow |
| `docs/decisions/f59cfbe4.md` | Assessment creation workflows + QB design |
| `docs/decisions/66898189.md` | PRD: accessibility, offline download, ExamSoft parity |
| `docs/decisions/b68ede99.md` | Assessment overview: completion status, pop quiz |
| `docs/assessment-taker-config-map.md` | What each admin config does to the student exam |
| `docs/creation-flow-gap-analysis.md` | Gap analysis: builder vs taker rendering |
