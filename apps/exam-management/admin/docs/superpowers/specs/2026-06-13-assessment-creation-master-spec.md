# Assessment Creation — Master Spec
**Exam Management | Admin**
Last updated: 2026-06-13
Status: READY FOR REVIEW — gates all implementation

> This document is the single source of truth for assessment creation. It resolves all conflicts across 7 decision files, 2 PRD versions, the June 4 Aarti Teams meeting, and 4 prior design specs. No implementation proceeds without this doc reviewed and approved.

---

## Sources read

| Source | Date | Weight |
|---|---|---|
| `decisions/f274ade0.md` — Base entities, roles, course page landing | May 8 | Aarti |
| `decisions/fb9e76c2.md` — AI gap analysis, labels, curricular loop | May 7 | Vishaka/Aarti |
| `decisions/b68ede99.md` — Assessment list org = completion, pop quiz, review soft gate | May 7 | Aarti |
| `decisions/4e1c850e.md` — Post-exam analytics, live monitoring, accommodations | May 8 | Aarti |
| `decisions/af529725.md` — Section model, two-persona model, review = assessment-level only | May 14 | Vishaka/Aarti |
| `decisions/66898189.md` — Offline download = P1 mandatory, accessibility, copy-from-previous | May 21 | Vishaka |
| `decisions/f59cfbe4.md` — QB = base course (non-negotiable), question versioning | May 19 | Vishaka |
| PRD v2 | June 4 | Vishaka/Nipun |
| `decisions/2026-06-04-aarti-teams.md` — 4-step lifecycle, Distribute, Stats, Monitoring, Review→Phase 2 | June 4 | Aarti |
| `specs/2026-06-04-assessment-creation-redesign.md` — 3-tab builder (Structure/Questions/Deliver) | June 4 | Romit |
| `specs/2026-06-01-assessment-creation-flow-design.md` — 3-panel Step 2, section/settings panel | June 1 | Romit |
| `specs/2026-06-05-add-questions-design.md` — Add questions flow (4 methods, runway) | June 5 | Romit |
| `docs/creation-flow-gap-analysis.md` — Taker → admin field gaps | June 4 | Romit |
| `docs/assessment-creation-v0-requirements.md` — Full V0 feature catalog | June 4 | Romit |

---

## Conflict resolutions

### 1. Review workflow — Phase 1 vs Phase 2

| Source | Says |
|---|---|
| af529725, b68ede99, 66898189 (May) | Review = Phase 1. Differentiator over ExamSoft. |
| PRD §4.6, v0-requirements.md §7 | Review = V0 |
| **2026-06-04-aarti-teams (June 4 — Aarti)** | **"Later we can build in review process because review is like a phase two process."** |

**Resolution: June 4 Aarti overrides. Review = Phase 2.**

- The review tab exists in the UI as a disabled "Phase 2" chip — visible but not actionable
- "Send for review" button is still available in the Distribute tab (soft gate, as always) — the WORKFLOW is Phase 2, but a basic "submit for review" action remains
- `v0-requirements.md` is now stale on this point; this doc supersedes it

---

### 2. Live monitoring — Phase 3 vs Phase 1

| Source | Says |
|---|---|
| b68ede99 (May 7, Aarti) | "We are not doing live proctoring today." |
| 66898189 (May 21) | "Live proctoring, monitored exams → Phase 3" |
| **2026-06-04-aarti-teams (June 4, Aarti)** | "I think it's more of like. Monitoring feature, basically, yeah." |
| **Romit (2026-06-13)** | **"Add monitoring feature."** |

**Resolution: Monitoring = Phase 1. Basic proctoring dashboard included.**

Scope: during-exam counts (started / submitted / not yet submitted) + issue flags (raised hand, technical issue) + proctor actions (end early, invalidate). This matches the PRD §4.7 basic proctoring scope.

---

### 3. Distribute tab vs Deliver inner tab

| Source | Says |
|---|---|
| 2026-06-04-redesign spec | "Deliver" = Tab 3 inside the builder: availability, security, tools, review workflow, publish |
| **2026-06-04-aarti-teams** | "Distribute" = outer lifecycle step: publish date, delivery window, enrolled students, QB associations |

**Resolution: Deliver (inner tab) is promoted to Distribute (outer lifecycle tab).**

- The builder inner tabs become: **Structure · Questions** only (no Deliver inner tab)
- All delivery configuration (dates, security, tools, audience, publish) moves to the outer Distribute tab
- Distribute tab additionally adds: enrolled students count, QB associations display

---

### 4. Builder architecture — June 1 spec vs June 4 redesign spec

| Source | Architecture |
|---|---|
| June 1 spec | 3-step wizard (Setup → Build[3-panel] → Review) |
| **June 4 redesign spec** | Modal (2 fields) → 3-tab workspace (Structure / Questions / Deliver) |

**Resolution: June 4 redesign spec wins (more recent, simpler, better UX).**

- No step numbers, no step headers
- Modal = name + type only (2 fields)
- Workspace tabs = Structure · Questions (Deliver promoted to outer Distribute)
- June 1 spec's right-panel patterns (health panel, settings panel, section settings panel) are preserved and integrated into the June 4 redesign architecture

---

## Resolved architecture

```
Course page → Assessments tab
  │
  └─ "+ New Assessment" button
        │
        ▼
┌─────────────────────────────────┐
│  New assessment  modal          │
│                                 │
│  [Exam]  [Quiz]                 │  type toggle
│  Name: ________________________ │  auto-focus
│  Course: AUTO-POPULATED         │  locked from course page
│                                 │
│  [Cancel]  [Create draft →]     │
└─────────────────────────────────┘
        │
        ▼
┌─────────────────────────────────────────────────────────────┐
│  ASSESSMENT DETAIL PAGE                                      │
│                                                             │
│  ← NURS 4210   Cardiovascular Pharm — Midterm      [···]    │
│                                                             │
│  [Edit]  [Review ⊘ Phase 2]  [Distribute]  [Stats]         │
│  └──────────────────────────────────────────────────────┘  │
│                                                             │
│  TAB CONTENT (see below)                                    │
└─────────────────────────────────────────────────────────────┘
```

### Tab 1 — Edit (inner tabs: Structure · Questions)

```
┌──────────────────────────────────────────────────────────────┐
│  [Structure]  [Questions]                   Health: 12 Q  ···  │
├──────────────────────────────────────────────────────────────┤
│  (Structure tab or Questions tab content)                    │
└──────────────────────────────────────────────────────────────┘
```

**Structure tab** — Defines the skeleton:
- Blueprint source (blank / copy past assessment / upload PDF·DOC·ExamSoft Excel)
- Sections list (add / rename / reorder / delete)
- Section: fill target, due date, assigned faculty, section instructions
- Optional metadata (description, topic weightage, collaborators) — collapsed

**Questions tab** — Add questions to sections:
- Full add-questions flow per June 5 spec (QB search, AI generate, write from scratch, PDF import, runway review)
- Health panel (right side): composition + Bloom's + topic coverage + flags
- Settings panel (⚙ icon): assessment-level config (isHighStakes, passingScore, allowComments, referenceMaterials, navigation rules, score display, tools)

---

### Tab 2 — Review ⊘ (Phase 2)

```
┌──────────────────────────────────────────────────────────────┐
│  Review & approval                                            │
│                                                              │
│  ─────────────────────────────────────────────────────────   │
│  This feature is coming in Phase 2.                          │
│  You can still send this for an informal review from         │
│  the Distribute tab.                                         │
│                                                              │
│  What's planned: 2-level formal approval workflow,           │
│  section-level partial submissions, reviewer comments,       │
│  dual-view student + proctor simulation.                     │
│  ─────────────────────────────────────────────────────────   │
└──────────────────────────────────────────────────────────────┘
```

---

### Tab 3 — Distribute

**Purpose:** Set when and how students receive and take the assessment.

```
┌─ Audience ────────────────────────────────────────────────┐
│  Students enrolled  [29]                                  │
│  [View enrolled students →]                               │
│                                                           │
│  Question banks linked  [2: Cardio · Pharm]               │
└───────────────────────────────────────────────────────────┘

┌─ Availability window ─────────────────────────────────────┐
│  Visible to students     [Jun 18, 2026]                   │
│  Students can enter      [Jun 20, 2026  ·  09:00]         │
│  Hard deadline           [Jun 20, 2026  ·  11:30]         │
│                                                           │
│  ▸ Download window (Exam type)                           │
│    Students can pre-download  [24] hours before           │
└───────────────────────────────────────────────────────────┘

┌─ Time limit ──────────────────────────────────────────────┐
│  ○ No limit   ● Timed   [90] minutes                      │
│  Warn at [5] min remaining                                │
└───────────────────────────────────────────────────────────┘

┌─ Security ────────────────────────────────────────────────┐
│  ○ Standard browser   ● Respondus lockdown                │
│  ▸ Passwords (Exam Start · Resume)                       │
└───────────────────────────────────────────────────────────┘

┌─ Digital tools ───────────────────────────────────────────┐
│  Calculator    [Off ▾]    Notes / Scratchpad  [On]        │
│  Highlighting  [On]       Copy / Paste        [Off]       │
└───────────────────────────────────────────────────────────┘

┌─ Review & publish ────────────────────────────────────────┐
│  Approval status:  [Draft]  [Send for informal review →]  │
│  (soft gate — you can publish without approval)           │
│                                                           │
│  [Preview as student]                    [Publish →]      │
└───────────────────────────────────────────────────────────┘
```

---

### Tab 4 — Stats

Three sub-views that automatically surface based on assessment state:

```
Assessment state: Before distribution
┌─ Not yet published ────────────────────────────────────────┐
│  Set publish date in Distribute to activate this tab.      │
└────────────────────────────────────────────────────────────┘

Assessment state: Live (window is open)
┌─ Monitoring ───────────────────────────────────────────────┐
│  18 enrolled  ·  16 started  ·  12 submitted  ·  4 active  │
│                                                            │
│  [Started] ████████████████░░  88%                         │
│  [Submitted] ████████████░░░░  67%                         │
│                                                            │
│  ─── Student status list ───────────────────────────────   │
│  Tanaka, Arjun      ● Active — 14:32 remaining             │
│  Okafor, Priya      ✓ Submitted — 10:14 ago                │
│  Chen, Marcus       ⚠ Flag — "Calculator not working"     │
│  Ramirez, Sofia     ○ Not started                          │
│                                                            │
│  ── Proctor actions ────────────────────────────────────   │
│  [End exam for student]  [Invalidate exam]  [Print backup] │
└────────────────────────────────────────────────────────────┘

Assessment state: Completed (window closed)
┌─ Results ──────────────────────────────────────────────────┐
│  Applicable: 18 students  ·  Completed: 16  ·  No-show: 2  │
│                                                            │
│  Score distribution (histogram)                            │
│  Mean: 74%  ·  Median: 76%  ·  Std dev: 11.4              │
│                                                            │
│  ── Per-question analysis ──────────────────────────────   │
│  [Difficulty mix] [Content area] [Bloom's] [PBI flags]    │
└────────────────────────────────────────────────────────────┘
```

---

## Assessment list (course page — Assessments tab)

Aarti June 4 directive for the list columns:

```
┌──────────────────┬──────────────────────┬────────┬───────┬────────────┬──────────┐
│ Assessment       │ Status               │ Scored │ Timed │ Applicable │ Complete │
├──────────────────┼──────────────────────┼────────┼───────┼────────────┼──────────┤
│ IM Midterm 2026  │ Published  Jun 20    │  ✓     │  ✓    │ 29         │ 28       │
│ Pop Quiz — Renal │ Not yet published    │  ✓     │  —    │ —          │ —        │
│ OSCE Mock        │ Published  Jun 14    │  —     │  ✓    │ 18         │ 16       │
└──────────────────┴──────────────────────┴────────┴───────┴────────────┴──────────┘
```

Status derivation (from Aarti):
- If publish date is set + date is past → "Published  {date}"
- If publish date is set + date is future → "Scheduled  {date}"
- If no publish date → "Not yet published"

Active-exam pie chart: if any assessment is currently live (window open), show a small ring chart next to its row — applicable vs submitted counts visualized.

---

## Complete feature catalog

### Phase 0 — Cohere delivery (now)

| # | Feature | Source |
|---|---|---|
| 1 | Modal: name + type (2 fields only) | June 4 redesign spec |
| 2 | Structure tab: blank start, section add/rename/delete | June 4 redesign spec |
| 3 | Questions tab: QB search (keyword), manual question creation (6 types) | June 1 spec |
| 4 | AI quiz & question generator — free-text prompt + PDF attach → Runway review | June 5 spec, PRD §4.3 |
| 5 | Health panel: question count, points total, Bloom's distribution | June 1 spec |
| 6 | Assessment detail page: 4 outer tabs (Edit / Review⊘ / Distribute / Stats) | June 4 Aarti |
| 7 | Assessment list: status, scored/timed chips, applicable/completed counts | June 4 Aarti |

### Phase 1 — January 2027 launch

#### 1. Entry & navigation
| # | Feature | Source | Build status |
|---|---|---|---|
| 1.1 | 4-tab assessment detail page (outer wrapper) | June 4 Aarti | ❌ |
| 1.2 | Assessment list: publish status column + date | June 4 Aarti | ❌ |
| 1.3 | Assessment list: scored + timed attribute chips | June 4 Aarti | ❌ |
| 1.4 | Assessment list: applicable + completed counts | June 4 Aarti | ❌ |
| 1.5 | Active-exam pie chart on list row | June 4 Aarti | ❌ |
| 1.6 | Pop quiz instant-start flow | b68ede99 | ❌ |

#### 2. Blueprint / entry modes
| # | Feature | Source | Build status |
|---|---|---|---|
| 2.1 | Copy from past assessment (section structure + questions) | f59cfbe4, 66898189 | ⚠️ stub only |
| 2.2 | Upload PDF/DOC/ExamSoft Excel as template | PRD §4.1, v0-requirements | ❌ |

#### 3. Structure tab
| # | Feature | Source | Build status |
|---|---|---|---|
| 3.1 | Section fill target (count or points) | creation-flow-gap-analysis, June 1 spec | ❌ |
| 3.2 | Section due date | creation-flow-gap-analysis | ❌ |
| 3.3 | Section instructions (shown to student at boundary) | creation-flow-gap-analysis | ❌ |
| 3.4 | Section assigned faculty (with notification) | af529725 | ⚠️ UI exists, no notification |
| 3.5 | Section pre-read document attachment (assessment + section level) | 66898189, PRD §4.4.5 | ❌ |
| 3.6 | Section progress chip (not started / in progress / complete) | June 1 spec | ⚠️ partial |

#### 4. Questions tab
| # | Feature | Source | Build status |
|---|---|---|---|
| 4.1 | QB search — semantic / natural language | June 5 spec, PRD §4.3 | ⚠️ keyword only |
| 4.2 | QB detail panel (right-edge sheet, all 6 type renderers) | June 5 spec | ❌ |
| 4.3 | AI generator → Runway review | June 5 spec | ⚠️ generator exists, no runway |
| 4.4 | PDF/DOC import → AI extraction → Runway review | June 5 spec | ❌ |
| 4.5 | Write from scratch — all 6 V0 types inline (no modal) | June 5 spec | ⚠️ modal exists |
| 4.6 | Local vs master question copy (edit in builder = local draft only) | f59cfbe4, June 5 spec | ❌ |
| 4.7 | Media attachment on questions: imageUrl, audioUrl, passageText, case-study tabs | creation-flow-gap-analysis (P1) | ❌ |
| 4.8 | Question media caption field | creation-flow-gap-analysis | ❌ |
| 4.9 | Outlier question flags (PBI < threshold inline warning) | PRD §4.2.1, June 1 spec | ❌ |

#### 5. Settings panel (⚙ icon in Questions tab)
| # | Feature | Source | Build status |
|---|---|---|---|
| 5.1 | `isHighStakes` toggle (hold results until faculty review) | creation-flow-gap-analysis | ❌ |
| 5.2 | `passingScore` (faculty-facing only, never shown to students) | creation-flow-gap-analysis | ❌ |
| 5.3 | `allowComments` toggle (per-question feedback box in taker) | creation-flow-gap-analysis | ❌ |
| 5.4 | `referenceMaterials[]` — global PDFs in exam toolbar | creation-flow-gap-analysis | ❌ |
| 5.5 | Backward nav toggle within section | PRD §4.4, June 1 spec | ❌ |
| 5.6 | Require answer before advancing | PRD §4.4 | ❌ |
| 5.7 | Question ordering: fixed / random within-section | PRD §4.4 | ⚠️ type exists, no UI |
| 5.8 | Score display config: raw / raw+% / scaled | PRD §4.4, June 1 spec | ❌ |
| 5.9 | Submit button visibility config | PRD §4.4, June 1 spec | ❌ |
| 5.10 | Warn at N minutes remaining | PRD §4.4, June 1 spec | ❌ |
| 5.11 | Pre-reads at assessment level | PRD §4.4.5 | ❌ |

#### 6. Distribute tab
| # | Feature | Source | Build status |
|---|---|---|---|
| 6.1 | Enrolled students count display | June 4 Aarti | ❌ |
| 6.2 | Linked QB associations display | June 4 Aarti | ❌ |
| 6.3 | Three-stage availability window (visible / openable / cutoff) | PRD §4.5, 66898189 | ⚠️ partial |
| 6.4 | Download window config (hours before openable) | 66898189 | ⚠️ field exists, UI incomplete |
| 6.5 | Assessment-level time limit | PRD §4.4 | ⚠️ field exists |
| 6.6 | Security mode: secure (Respondus) / standard browser | PRD §4.5 | ❌ |
| 6.7 | Exam start + resume passwords | PRD §4.5 | ⚠️ field exists, no UI |
| 6.8 | Digital tools (calculator, highlight, notes, copy/paste) | PRD §4.4.7 | ❌ |
| 6.9 | "Send for informal review" (soft gate) | af529725, b68ede99 | ✅ dialog exists |
| 6.10 | Preview as student (student simulation) | PRD §4.6 | ⚠️ partial |
| 6.11 | Publish action | — | ⚠️ partial |

#### 7. Stats tab — Monitoring (live)
| # | Feature | Source | Build status |
|---|---|---|---|
| 7.1 | Started / submitted / not-yet-submitted counts | June 4 Aarti, 4e1c850e | ❌ |
| 7.2 | Student status list (name, state, time remaining) | 4e1c850e | ❌ |
| 7.3 | Issue flag display (raised hand, technical issue) | 4e1c850e | ⚠️ partial |
| 7.4 | Proctor action: end exam early for student | PRD §4.7 | ❌ |
| 7.5 | Proctor action: invalidate exam for student | PRD §4.7 | ❌ |
| 7.6 | Print offline backup (questions + answer key for proctor) | PRD §4.7, f59cfbe4 | ❌ |

#### 8. Stats tab — Post-exam results
| # | Feature | Source | Build status |
|---|---|---|---|
| 8.1 | Applicable vs completed count | June 4 Aarti | ❌ |
| 8.2 | Score distribution (histogram) | 4e1c850e | ❌ |
| 8.3 | Per-question analysis: content area / Bloom's / PBI | 4e1c850e | ❌ |
| 8.4 | Content area coverage chart | 4e1c850e | ⚠️ pre-exam only |
| 8.5 | Bloom's taxonomy distribution (post-exam) | 4e1c850e | ⚠️ pre-exam only |

#### 9. Accessibility & delivery
| # | Feature | Source | Build status |
|---|---|---|---|
| 9.1 | Student download CTA (explicit action, not silent) | 66898189 | ❌ |
| 9.2 | 200% magnification support (admin screens) | 66898189 | ❌ (needs audit) |
| 9.3 | Dyslexic font toggle (taker only) | 66898189 | ❌ |
| 9.4 | Accommodation coordinator view (which students, what accommodations) | 4e1c850e | ❌ |

### Phase 2 — Post-launch

| Feature | Source |
|---|---|
| 2-level formal review workflow (Draft → In Review L1 → In Review L2 → Ready) | af529725; deferred June 4 Aarti |
| Section-level collaborator delegation (RBAC scoped) | af529725; deferred June 4 Aarti |
| Dual-view preview + proctor simulator | PRD §4.6 |
| Partial section review submission | PRD §4.6.1 |
| Post-exam regrading engine (invalidate, key correct, curving) | PRD §4.4.2 |
| Post-exam review window (student reviews answers under time limit) | PRD §4.4.1 |
| Drag & drop section/question reorder | PRD §4.3 |
| Section/question-level timers | PRD §4.4.4 (deprioritized June 3) |
| 400% magnification | 66898189 |
| AI Smart Question Replacement | PRD §6.B |
| Saved blueprint templates | PRD §4.1 |

---

## Implementation order (P0 + P1)

### Wave 1 — Assessment detail page outer structure (unblocks everything)

1. **Outer tab wrapper** — add `assessmentTab` state to `assessment-creation-app.tsx`: `edit | review | distribute | stats`. Render tab bar. Review tab = disabled chip. Routes: `?id=X&tab=edit|distribute|stats`
2. **Assessment list columns** — update `courses/[id]/tabs/assessments-tab.tsx` to show status, scored/timed chips, applicable/completed counts

### Wave 2 — Edit tab inner refactor

3. **Promote Deliver → Distribute** — remove "Deliver" inner tab from `assessment-builder.tsx`. Its content moves to Wave 3 Distribute tab. Inner tabs become: `structure | questions` only.
4. **Structure tab** — add fillTarget, dueDate, sectionInstructions to `AssessmentSection` type + section settings panel UI
5. **Questions tab** — integrate QB detail panel (right-edge Sheet), complete Runway review for AI + PDF import

### Wave 3 — Distribute tab

6. **Distribute tab component** — `screens/distribute-tab.tsx`: audience section (enrolled count, QB links) + availability window + time + security + tools + soft-gate publish
7. **Data model** — add all P1 fields to `AssessmentSettings` and `AssessmentSection` types

### Wave 4 — Stats tab

8. **Stats tab — monitoring** — `screens/stats-tab.tsx`: started/submitted/active counts + student status list + issue flags + proctor actions
9. **Stats tab — post-exam** — applicable/completed counts + score distribution + per-question analysis

### Wave 5 — Add questions completion

10. **Write from scratch inline** — replace modal with inline form in section (June 5 spec State 1C)
11. **KB search** — upgrade to semantic search; add QB detail panel (State 1A+)
12. **Media attachment** — add imageUrl/audioUrl/passageText/caseTabs fields to `QuestionDraft` + editor UI

### Wave 6 — Settings, accessibility

13. **Settings panel** (⚙ in Questions tab) — add isHighStakes, passingScore, allowComments, referenceMaterials, nav rules, score display
14. **Accessibility audit** — 200% magnification on all creation screens; accommodation coordinator view

---

## Data model — final resolved types

### `AssessmentSettings` additions (P1)

```ts
// P1 additions
randomizeOptions: boolean
downloadWindowHours: number
instructionsText: string
requireAcknowledgment: boolean
isHighStakes: boolean
passingScore: number | null          // faculty-facing only; never shown to students
allowComments: boolean
referenceMaterials: { name: string; url: string }[]
warnAtMinutesRemaining: number | null
warnOnBlankQuestion: boolean
backwardNavAllowed: boolean
requireAnswerBeforeAdvancing: boolean
questionOrdering: 'fixed' | 'random'
submitButtonVisibility: 'always' | 'after-viewing-all' | 'after-answering-all'
scoreDisplay: 'raw' | 'raw-and-percent' | 'scaled'
preReadDocuments: { name: string; url: string }[]
securityMode: 'secure' | 'standard'
examStartPassword: string | null
resumePassword: string | null

// P2 additions
reviewShowsCorrectAnswers: boolean
reviewSessionStart: string | null
reviewSessionEnd: string | null
```

### `AssessmentSection` additions (P1)

```ts
fillTarget: { type: 'count' | 'points'; value: number } | null
dueDate: string | null
instructions: string
preReadDocuments: { name: string; url: string }[]
```

### `QuestionDraft` additions (P1)

```ts
imageUrl: string | null
audioUrl: string | null
passageText: string | null
caption: string | null
caseTabs: { title: string; content: string }[] | null
required: boolean
```

### New: `AssessmentDistribution`

```ts
interface AssessmentDistribution {
  enrolledStudentCount: number
  linkedQuestionBankIds: string[]
  publishedAt: string | null           // drives status column in list
  visibleDate: string | null           // card appears on student dashboard
  openableDate: string | null          // student can enter placeholder screen
  cutoffDate: string | null            // hard submission deadline
}
```

### New: `AssessmentMonitoringSnapshot`

```ts
interface AssessmentMonitoringSnapshot {
  notStarted: number
  active: number
  submitted: number
  flags: { studentId: string; message: string; raisedAt: string }[]
}
```

---

## Open questions (must resolve before Wave 3–4 build)

| # | Question | Owner |
|---|---|---|
| 1 | Does "Send for informal review" live in Distribute tab or is it removed entirely for P1? | Aarti |
| 2 | Student download CTA: is this a student-facing feature (outside admin scope for this wave)? | Vishaka |
| 3 | Enrolled student count in Distribute: pulled from course offering roster? Confirm data source. | Darshan/Arun |
| 4 | QB associations in Distribute: is this the base course QB or the linked QBs from section assignments? | Vishaka |
| 5 | Stats pie chart on assessment list: design the ring chart before building | Romit |
| 6 | Assessment list: where does it live — course-offering tab or course base tab? | Romit |
| 7 | Copy-from-previous: when faculty assignments change year-over-year, auto-clear or prompt? | Vishaka |

---

## What this spec supersedes

| Old doc | Superseded by |
|---|---|
| `assessment-creation-v0-requirements.md` §7 (Review = V0) | This doc: Review = Phase 2 |
| `assessment-creation-v0-requirements.md` §7 (Monitoring = V1) | This doc: Monitoring = P1 |
| `specs/2026-06-04-assessment-creation-redesign.md` Tab 3 "Deliver" (inner tab) | This doc: Deliver promoted to outer Distribute tab |
| `specs/2026-06-01-assessment-creation-flow-design.md` Step 3 "Review" (publish in Step 3) | This doc: Distribute is the outer lifecycle tab that owns publish |
| `decisions/feature-registry.md` (last reviewed May 22) | Updated today (June 13) — feature-registry.md is live |

---

## DS conformance violations — full sweep 2026-06-13

Sweep ran across all 19 TSX files in `admin/components/assessment-creation/`. Status: **GREENLIGHT (static)** for DS token conformance, **NEEDS-MORE** for state coverage. Visual-diff against localhost:4000 NOT yet run.

### P0 — Fix before any further build (hardcoded colors)

| File | Line | Violation | Fix |
|---|---|---|---|
| `screens/status.tsx` | 740 | `background: 'white'` | `var(--background)` |
| `screens/status.tsx` | 156 | `color: 'white'` on lifecycle circles | `var(--primary-foreground)` |
| `screens/wizard.tsx` | 609 | `color: 'white'` | `var(--primary-foreground)` |
| `builder/ai-tools.tsx` | 172 | `color: 'white'` on step circles | `var(--primary-foreground)` |

### P1 — Required before ship

| File | Violation | Fix |
|---|---|---|
| `assessment-creation-app.tsx:199` | `text-[10px]` on Phase 2 badge — below 12px floor (**introduced in Wave 1**) | Remove size override; Badge default = 12px |
| `builder/question-item.tsx:58,71` | `fontSize: 11` — below 12px floor | `fontSize: 12` |
| `builder/ai-tools.tsx:173,268` | `fontSize: 11` — below 12px floor | `fontSize: 12` |
| `builder/ai-tools.tsx:66-67` | `var(--brand-rose-500)` — not a DS token | `var(--brand-color)` |
| `screens/leo-panel.tsx:122` | `var(--brand-rose-500)` — not a DS token | `var(--brand-color)` |
| `builder/overview-panel.tsx:28,66,82,86` | `var(--font-display)` — not in DS | `var(--font-heading)` |
| `screens/status.tsx:899` | `var(--font-display)` — not in DS | `var(--font-heading)` |
| `screens/leo-panel.tsx` | `var(--font-display)` — not in DS | `var(--font-heading)` |
| `screens/review-publish.tsx:436,636,745,1171,1300` | `var(--radius-full, 999px)` — non-existent DS token | `borderRadius: 9999` |
| `screens/review-publish.tsx` — all `<Button>` | Missing `type="button"` throughout | Add `type="button"` |
| `screens/status.tsx` — all `<Button>` | Missing `type="button"` throughout | Add `type="button"` |
| `screens/review-publish.tsx:409,685` | Button missing `variant` prop | Add `variant="outline"` or appropriate variant |
| `screens/status.tsx:341,343,629` | Button missing `variant` prop | Add `variant` per context |

### P1 — Critical WCAG / ARIA gaps

| File | Gap | Fix |
|---|---|---|
| `screens/review-publish.tsx` × 5 | Hand-rolled `<Callout>` — no `role="alert"`, no `aria-live` — screen readers cannot hear error/warning feedback | Replace all 5 with DS `<LocalBanner>` |
| `screens/status.tsx` | `ResultsExplorer` is a raw `<div>` overlay — no `role="dialog"`, no `aria-modal`, no focus trap | Wrap with DS `<Dialog>` |
| `screens/review-publish.tsx` | `ChangeComposer` textarea: no `aria-invalid`; send button not disabled when empty | Add `aria-invalid`, disable guard |
| `screens/review-publish.tsx:1280` | Grip handle `<div>` — no `tabIndex`, no keyboard handler, no focus ring | Add `tabIndex={0}` + `onKeyDown` |
| `screens/review-publish.tsx` | `ActorBar`: manual `opacity: 0.5` inline alongside `disabled` prop — double-stacks | Remove inline opacity; let DS `disabled` handle it |
| `screens/status.tsx:304` | `emptyState` passed as plain object, not `<EmptyState>` JSX node | Fix type: `<EmptyState icon="..." title="..." />` |
| `screens/status.tsx` | `RescheduleDialog` inputs missing `aria-invalid` + `FieldError` | Add both |
| `assessment-builder.tsx` | "Continue to Distribute" not disabled when `totalQuestions(sections) === 0` | Add validation gate |
| `screens/assessments-landing.tsx` | No loading skeleton, no error `LocalBanner` | Add both states |
| `assessment-creation-app.tsx` | No loading/error branch for async entry; `NotifyBanner` needs DS verification vs hand-rolled | Verify `primitives.tsx` NotifyBanner = DS `LocalBanner` |

### P2 — Polish (non-blocking)

| File | Issue |
|---|---|
| Multiple files | Raw `borderRadius` pixel values off DS scale (`16`, `18`) → `var(--radius-lg)` |
| `screens/review-publish.tsx` | `var(--shadow-lg, rgba(...))` fallback — remove the rgba fallback |
| `assessment-creation-app.tsx:193-206` | Outer tab `TabsTrigger` custom underline pattern — confirm against localhost:4000 visual-diff before shipping |

### Fix order

1. P0 hardcoded colors (4 lines — `status.tsx`, `wizard.tsx`, `ai-tools.tsx`)
2. Sub-12px fonts (`question-item.tsx`, `ai-tools.tsx`, `assessment-creation-app.tsx`)
3. Non-DS tokens (`brand-rose-500`, `font-display`, `radius-full`)
4. Missing `type="button"` + `variant` — bulk pass on `review-publish.tsx` + `status.tsx`
5. `Callout` → DS `LocalBanner` in `review-publish.tsx` (biggest ARIA risk)
6. `ResultsExplorer` → DS `Dialog` in `status.tsx`
7. Validation gate on builder's Distribute button
8. Visual-diff against localhost:4000 after all fixes

### What was NOT verified

- Runtime interactions (visual-diff.mjs against localhost:4000 not run — server state unknown)
- Axe-core scan not run
- `assessments-landing.tsx` loading/error states not confirmed in browser
