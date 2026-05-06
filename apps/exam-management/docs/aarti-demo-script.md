# Aarti walkthrough — 6-minute click script

**Audience:** Aarti (CEO).
**Date:** 2026-05-07.
**Goal:** prove the four differentiators in one continuous click path — chair approval workflow, curricular assessment loop, embedded workflow intelligence, AI-assisted question creation. Live monitoring is a 30-second cameo at the end.

---

## Pre-flight

| Check | How |
|---|---|
| Dev server up on :3001 | `lsof -ti :3001` returns a PID |
| Browser tab on `http://localhost:3001/courses` | New incognito window — no leftover persona |
| Sidebar expanded (not collapsed) | ⌘B if it's collapsed |
| No DevTools open | Distracting |
| Persona dropdown empty / on Hannah Park | Top-right of header |

If anything's off, refresh once. Then close DevTools — the Tooltip on `<StubButton>` won't render correctly with the inspector forcing element states.

---

## The 6-minute path

### 0:00 — 0:30 · Anchor

**You see:** `/courses`. Hannah Park (admin) is signed in. KPI strip across the top: 3 active courses, 6 active offerings, 156 students, 12 assessments. Course cards listed.

**You say:**
> "Today I'm signed in as Hannah, the program admin. She manages all three pharmacy courses. Let me switch to a faculty member — Dr. Patel — and you'll see the entire app reshape."

### 0:30 — 1:00 · Persona switch (the punchline of unification)

**Click:** Persona switcher top-right → **Dr. James Patel**.

**You see:**
- Sidebar swaps to Patel's avatar
- "Faculty Mode" badge appears below the brand
- Page heading changes from "Courses" to "My Courses"
- Course list narrows to Patel's 3 courses (PHAR101, BIOL201 editor; SKEL101 viewer)
- Above the course grid, a new **Action Items** panel appears

**You say:**
> "One persona switch. The whole app reshapes around what Patel can see. Notice the Action Items panel — that's *workflow-first* design. The system is telling Patel what needs him today, not asking him to hunt."

### 1:00 — 1:30 · Action Items as workflow narrative

**You see (Action Items items, in this order):**
1. *1 assessment needs revision* (chair sent back asmt-phar101-003, Quiz 3: Drug Interactions)
2. *1 assessment is ready to publish* (asmt-001, Midterm Exam — chair approved)
3. *1 exam is live right now* (asmt-phar101-004, Practical Skills Check)
4. *1 assessment is ready to review* (asmt-phar101-005, submitted — curve & publish results)
5. *16 students are flagged at-risk* (across his three enrolled courses)
6. *2 curriculum objectives are untested*

(A 7th — "2 assessments are awaiting chair review" — is computed but trimmed by the panel's 6-item cap.)

**You say:**
> "Workflow narrative. Every item is a real action — chair-driven, student-driven, or curriculum-driven. We'll walk one end-to-end. Notice the order: revision needs Patel today, publish-ready and live both need a touch this week, and the longer-tail items sit below."

### 1:30 — 2:30 · Chair approval workflow (Aarti's #1 differentiator)

**Click:** "1 assessment needs revision" → **Review notes** link.

**Lands on:** `/assessments/asmt-phar101-003/review`.

**You see:**
- Breadcrumb: Courses › PHAR101 › Quiz 3: Drug Interactions › Chair review
- Workflow indicator: 7 steps · "Pending" highlighted in destructive red because chair returned with notes (changes-requested branches off Pending)
- Submission summary
- Left panel: 8 question rows with code, type, difficulty, Bloom level
- Right panel: Chair's note from Dr. Anita Rao —
  > "Difficulty mix is bottom-heavy (60% Easy). Please add 4 Hard questions on drug-interaction analysis before re-submission."
- "Address & resubmit" + "Edit in builder" buttons

**You say:**
> "Pre-publication chair approval. ExamSoft doesn't have this. The chair reviewed the draft, sent it back with specific notes, and Patel now has both the questions and the feedback in one view."

### 2:30 — 3:30 · Switch personas mid-flow to show the chair side

**Click:** Persona switcher → **Dr. Sarah Thompson** (Faculty Senior · Chair).

**You see (same URL — page contents reshape):**
- The previous chair note from *Dr. Anita Rao* still sits at the top of the right panel — historical context
- Below it, a new textarea appears for Thompson's note (chair revisits an in-revision draft)
- Two action buttons: **Approve** and **Request changes**
- Request changes is disabled until you type a note

**Type into the textarea:**
> "Difficulty mix now balanced. Approved."

**Click:** **Approve**.

**You see:**
- Workflow indicator advances: "Pending" → green check, "Approved" highlighted brand
- Status pill in header changes to "Approved"
- Reviewer notes pane now shows your fresh note attributed to *Dr. Sarah Thompson* with today's date — alongside Dr. Rao's earlier note

**You say:**
> "Same URL. Same data. Different persona — different actions. Trust level is encoded; senior trust gets approve authority. And the change persists across the app — watch."

### 3:30 — 4:00 · Show Patel sees the result

**Click:** Persona switcher → **Dr. James Patel**.

**Click:** Breadcrumb: Pharmacology I.

**You see (back on `/courses/course-phar101`):**
- Action Items panel: the *changes-requested* row is gone
- The *approved · ready to publish* row count went up by one
- Course header KPI counts reflect the shift (Pending review −1, Approved +1)

**You say:**
> "Patel sees the change live. Approve in one place, the entire faculty workspace reshapes — Action Items, course KPIs, the Assessments tab. That's the connected chain."

### 4:00 — 5:00 · The Curricular Matrix (Aarti's central differentiator)

**Scroll down** to the Curricular assessment matrix card. It has three tabs — each one shows a different link of Aarti's three-way chain.

#### Performance tab (default)

**You see:** A heatmap. Rows = PHAR101's 5 tested objectives, columns = the 7 PHAR101 assessments, cells = cohort performance %. Color tiers:
- Green = ≥ 80% healthy
- Blue = 70 – 79% on track
- Amber = 60 – 69% underperforming
- Red = < 60% critical
- Hatched grey = not tested in that assessment (coverage gap)

A "Cohort avg" footer row shows each assessment's overall cohort performance. Untested objectives sit in a dashed strip below the table.

**Hover any cell.** A light-background popover slides up with: full objective title, assessment name, big perf bar with % and tone label (Healthy / On track / Underperforming / Critical), and a 3-stat grid (Questions, Bloom, Last seen).

**You say:**
> "This is the chain. Every cell is one objective × one assessment × cohort performance. ExamSoft has the third column. ExamSoft does not have the connection. Hatched cells are coverage gaps — that objective wasn't tested in that exam — and faculty can see them at a glance."

#### Coverage tab

**Click:** *Coverage* tab.

**You see:** Same row order — each objective gets a stacked horizontal bar showing its question-bank composition by difficulty (Easy / Medium / Hard). The "Overall mix" bar at the top sums the cohort. Bar length scales with the number of questions tagged.

**You say:**
> "Coverage is the middle link. *Are the questions there?* The Bloom mix matters — Aarti's higher-order objectives like *Analyze drug interactions* should skew Hard. If they don't, that's a question-bank problem before it's a student problem."

#### Trend tab

**Click:** *Trend* tab.

**You see:** One row per objective with a sparkline walking left → right across the assessment timeline. The 70% passing line is dashed; each filled dot is an assessment, color-tiered by performance. Right edge shows the most recent value and the ± delta from the first assessment.

**You say:**
> "And this is the loop closing. Did the chair-approval workflow we just walked actually move the needle? Trend shows whether each objective is improving over successive assessments. *That* is the differentiator nobody else has."

**Click:** the *Analyze drug-drug interaction mechanisms* row (avg 64 — the underperforming objective). Routes to Students tab — the cohort weakest on this objective.

**Click:** Back. Scroll to the **Untested strip** below the tabs (1 objective: *Recognize black-box warning indications*) and click its name.

**You see:** AI Generate modal opens scoped to the untested objective, with difficulty + Bloom mix pickers ready.

**Click:** Cancel.

### 5:00 — 5:30 · Live monitor cameo

**Scroll back up** to Action Items.

**Click:** "1 assessment is live right now" → **Open live monitor**.

**Lands on:** `/assessments/asmt-phar101-004/monitor`.

**You see:**
- Live now status pill (pulsing)
- KPI strip: in-progress / submitted / completion% / not-started / flagged
- Completion donut
- Two-column: Student board + per-question response distribution heatmap
- Flagged-comments queue at the bottom

**You say:**
> "During the exam — completion in real time, per-question difficulty heatmap, flagged comments. Faculty sees what's happening *while* it's happening, not afterward."

### 5:30 — 6:00 · Wrap

**Click:** Persona switcher → **Hannah Park** (back to admin).

**You see:** App reshapes again — back to "Courses" heading, all 3 courses, no Action Items panel.

**You say:**
> "One signed-in admin. One signed-in faculty. Same URLs, same data — the system shapes itself to the person sitting in front of it. Chair approval, curricular loop, AI question creation, live monitoring — all four threads in five minutes."

---

## Risks & fallbacks

| If… | Then… |
|---|---|
| Tracer dots on the loop don't animate | Hard refresh once. SVG `animateMotion` sometimes drops on stale frame. |
| Persona switch leaves stale Action Items count | The panel re-runs `useMemo` on `faculty.id` — should be live. If stale, click anywhere else first. |
| Approve button doesn't advance the workflow | State is held in a session-scoped React context — a refresh resets it back to the seed. If it's broken, refresh once and walk Patel → Thompson again. |
| Matrix dot lands in the wrong quadrant | Mock data drives placement directly — if a dot looks wrong, check `lib/faculty-mock-data.ts` `assessmentsCovered` + `avgPerformance` for that objective. |
| Aarti clicks a button you didn't plan for | If it's tagged StubButton, she'll see a "Coming soon — post-demo" tooltip. Acknowledge and move on. |
| Browser-extension Grammarly etc. injects DOM | Demo in incognito to avoid. |

---

## Backup talking points (if Aarti pushes deeper)

| If she asks about… | Show… |
|---|---|
| Question authoring | `/question-bank` — same persona-aware folder access as the rest of the app |
| Cross-course competency | `/competency` — objective coverage matrix across all courses |
| Standalone vs Prism login | Mention that entry='standalone' state is wired in the session; a login-banner component exists; full standalone shell is post-demo |
| Accommodations | Course detail → Accommodations tab — read-only by design (Student Services owns) |
| Student-facing exam UI | Open `assessment-taker` on :5174 in another tab if pre-staged |

---

## Things deliberately not in the script

- The QB header dropdown is the same persona switcher — don't open it twice
- Workflow step indicator is on every assessment; only show full one in `/review`
- Decorative buttons (StubButton) — don't click them on purpose
- Don't refresh between the chair Approve and the back-to-Patel beat — context resets to the seed mock state

---

## After the demo

| Q | A |
|---|---|
| What did Aarti gravitate toward? | Note it — that's the next sprint |
| What did she ignore? | Cut or backlog |
| What did she ask "can it do X?" about? | Capture verbatim |
| Did she switch personas herself? | If yes, the unified switcher won. If no, drag her to it. |
