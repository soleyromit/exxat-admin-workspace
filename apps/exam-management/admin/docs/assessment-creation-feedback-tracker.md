# Assessment Creation — Design Feedback Tracker
> Updated live during sessions. Read this file to restore context after compaction.
> Modeled after `qb-feedback-tracker.md`.

## Source: Aarti — Jun 4, 2026 (Meeting Recording: "Meeting with Romit Soley-20260604_141749")

---

## Item 1 — New modules must coexist with Prism, not be a separate island
**Status: DESIGN PRINCIPLE — ongoing**
Aarti's directive: New EM/PCE modules cannot be a copy-paste of Prism, but also cannot be so different that they look like they came from a different company. The goal is to break Prism through new design principles, not ignore it.
- Himanshu must be aligned and sign off before any new design philosophy is finalized
- Both systems (old Prism modules + new React modules) must coexist during transition
- Account system, Leo/chat, resource center must carry over — cannot reinvent them
**Action needed:** Schedule alignment session with Himanshu on any design decisions that deviate from current Prism patterns.

---

## Item 2 — Two design tracks: Big Picture vs Phase 1 Cleaned-Up
**Status: ACKNOWLEDGED — needs process**
Aarti explicitly said she is OK with big picture thinking happening. Two parallel outputs:
1. **Big picture / concept version** — everything is possible, all phases shown, kept internally
2. **Phase 1 cleaned-up version** — only P1 features, deletions documented, shareable with product team

> "You can share both — this is the big picture thinking we are doing and then for phase one we can only focus on these things."

**Action needed:** For every new screen, produce both tracks. Big picture Figma (all phases) + Phase 1 Figma (remove phase 2+ buttons, mark deferred).

---

## Item 3 — Assessment list columns: status + publish date + attribute chips
**Status: DONE (feature-registry ✅)**
Aarti confirmed the assessment list row must show:
- Assessment name
- **Attribute chips:** "Scored" and "Timed" (minimum; can think of more)
- **Status:** Published (with date shown inline) OR Not Yet Published (with publish action CTA)
- **Applicable count** + **Completed count** (two separate numbers)

File: `admin/app/(app)/courses/offerings/[id]/course-offering-detail-client.tsx` — assessments tab

---

## Item 4 — Active exam pie chart strip on assessment list
**Status: DONE (feature-registry ✅ — 2026-06-15)**
When exams are actively running, show a strip of ring charts on the assessment list — one per live exam showing applicable vs completed.
File: `assessments-landing.tsx` — `ActiveExamsStrip`

---

## Item 5 — 4-step assessment lifecycle: Create → Review → Distribute → Stats
**Status: DONE (feature-registry ✅)**
Aarti confirmed 4 steps:
1. **Create / Edit** — "Create" label becomes "Edit" once the assessment exists
2. **Review** — Phase 2, hide for now (disabled tab with badge)
3. **Distribute / Publish** — when/how students access it (see Item 6)
4. **Stats / Analytics** — applicable vs completed + monitoring (see Item 8)

File: `components/assessment-creation/assessment-creation-app.tsx`

---

## Item 6 — Distribute / Publish step: access window + delivery options
**Status: DONE (feature-registry ✅ for basic; gaps remain)**
Aarti's exact directive: The distribute/publish step must answer:
- **When** are students able to access it (publish date, open window, cutoff)
- **How** — online / offline / timed / take-home
- **Time window** — how much time do they have
- Phase 1 options only; document Phase 2+ options separately (see Item 2)

What's still missing per registry:
- ❌ Target audience / student group selector (shows count but no selector)
- ❌ Download window UI (field exists, UI incomplete)
- ❌ Offline tolerance architecture

---

## Item 7 — Distribution dashboard inside assessment: enrolled students + QB associations
**Status: DONE (feature-registry ✅)**
Aarti said: distribution section should show which students are enrolled + which question banks are associated. Keep this inside the assessment workflow (not just at course level).
> "I have an idea about distribution of the assessment — which students are enrolled, which question banks have been associated."

File: `components/assessment-creation/distribute-tab.tsx`

---

## Item 8 — Stats step: applicable vs completed + monitoring during live exam
**Status: DONE (basic); monitoring PARTIAL**
Aarti confirmed two modes in Stats:
1. **Results view** — applicable to X students, Y completed
2. **Monitoring / proctoring view** — during live exam: who started, who submitted, who has not yet submitted

> "18 students have started the exam, 16 have submitted, 2 have not yet submitted."

For monitoring, also show:
- Download / technical issues raised during exam
- Aarti's framing: "Managing it, proctoring it can be a section."

Missing:
- ⚠️ Issue flags during live exam (partial — feature-registry says 7.3 partial)
- ❌ Proctor action: end exam early (7.4)
- ❌ Proctor action: invalidate exam (7.5)

---

## Item 9 — Difficulty distribution stats panel: always visible, side preferred
**Status: NOT DONE**
Aarti said she likes the idea of the difficulty/Bloom's stats panel always showing. Preferred position: side panel rather than bottom (bottom loses real estate as questions are added).
> "I don't really care whether we do that in the bottom or on the side if we can accommodate it on the side, that's great."

**Action needed:** Move the health/stats panel to a persistent side rail in the builder, not a bottom drawer.

---

## Item 10 — Section faculty assignment = Phase 2 (hide button)
**Status: DONE (feature-registry 🔜)**
Aarti explicitly said: "Can you hide that right now? Because for the immediate rollout, we won't be able to accommodate that."
> "Create a version that is for phase one — keep this as your [big picture]. A cleaned up version."

File: `components/assessment-creation/builder/structure-tab.tsx` — section owner/assignment UI

---

## Item 11 — Bulk point assignment = include in big picture, Phase 1 TBD
**Status: CONCEPTUAL — not built**
Aarti acknowledged the concept of bulk-setting points across multiple questions at once. Include in big picture design; product team will decide P1 inclusion.

---

## Item 12 — Passing score threshold = include
**Status: PARTIAL (feature-registry — field exists, no UI)**
Aarti saw the passing score threshold concept and did not object. Keep in design.
Missing: ❌ `passingScore` UI (creation-flow-gap-analysis P1 item)

---

## Item 13 — Super admin only for Phase 1 rollout (no role differentiation)
**Status: DESIGN PRINCIPLE**
> "I'm aligned on the fact that even though we may think we have 5 different variations of admin, today we just want to worry about the super admin role."
Role-based access control (coordinator vs instructor sub-roles) = Phase 2+.

---

## Item 14 — Module must function independently (no "go to Prism to do X")
**Status: DESIGN PRINCIPLE**
> "I am not going to be in the situation, oh, you go to Prism, import the students, then you come here."
All base entities (students, courses, faculty) must be editable/accessible within EM directly. They still save to the same student entity, but navigation cannot bounce between modules.

---

## Pending decisions / blockers
- [ ] Item 1: Schedule Himanshu alignment session on design coexistence strategy
- [ ] Item 2: Produce big-picture + Phase 1 parallel Figma tracks for assessment creation
- [ ] Item 9: Move health/stats panel to persistent side rail (not bottom drawer) in builder
- [ ] Item 6: Student group selector for distribute step
- [ ] Item 8: Complete monitoring — issue flags, proctor actions (end/invalidate)

---

## Things discussed as Phase 2+ (do not build now)
- Section-level faculty assignment (Item 10)
- Review step in 4-step lifecycle
- Role-based access (coordinator vs instructor)
- Offline download / browser cache architecture
- Post-exam review engine (access window, lockdown)

---

*Last updated: 2026-06-17 · Source: Jun 4 Aarti recording transcript*

---

## Source: Vishal + Monil + Romit — Jun 9, 2026 ("Exam Management Sync up")

---

## Item 15 — Course offering landing page = top priority
**Status: NOT DONE — PRIORITY**
Vishal confirmed: course offering list view + course offering detail page are the most critical unfinished surfaces before assessment work can be handed to dev.
> "What is missing has been the landing page. When user clicks on exam management, what do they see?"

Landing page = list of course offerings, default filtered to **Ongoing**. Tabs: Ongoing / Upcoming / Completed / All.
**Action needed:** Finalize course offering list view design and share with Vishal.

---

## Item 16 — Course offering list: columns and filters
**Status: NOT DONE**
Confirmed columns (from Vishal + Aarti alignment):
- Course name + number (searchable across all columns)
- Academic year, Term, Cohort
- Start date / End date
- Faculty / Course coordinator (use Prism terminology — not "primary faculty")
- Student count
- Status
- **LMS chip** — visual indicator if the offering is integrated with LMS

Filters: same filter UX as Prism (filter icon, add-filter pattern — do not invent a new pattern).
Card view = deprioritized; list view only for now.

---

## Item 17 — Add Offering → navigate to Prism base, don't rebuild
**Status: DESIGN PRINCIPLE**
> "Add offering should invoke Prism-based component — we should not rebuild those screens."

When no courses exist: show empty state with CTA that navigates to Prism base setup (academic year → terms → courses → offerings). Do not recreate those fields inside EM.
Setup tab in EM sidebar = also navigates to Prism base, not a standalone EM screen.

---

## Item 18 — Course offering detail: confirmed tab structure
**Status: PARTIAL — tabs exist but not all built**
Tabs confirmed in order:
1. **Assessments** (default landing) — the meat of the product
2. **Overview** — high-level stats and performance for the course
3. **Students** — enrolled students, read-only registration info (no performance data — FERPA)
4. **Faculty** — faculty associated with the course
5. **Content / Resources** — course content
6. **Question Bank** — link/shortcut to the QB for this course

Deferred:
- **Mapping** — Phase 2
- **Accommodations** — placeholder, build when feature is ready

**Action needed:** Verify all 6 tabs are wired in `course-offering-detail-client.tsx`.

---

## Item 19 — Student tab: no performance data (FERPA)
**Status: DESIGN PRINCIPLE**
> "Performance information — they're consciously not showing it under students because of FERPA. Not every faculty associated with a course gets to see student performance."

Student tab = registration only (name, enrollment status, section). No scores, no completion rates inline.

---

## Item 20 — ExamSoft parity is the baseline benchmark
**Status: DESIGN PRINCIPLE — ongoing**
Vishal's directive: ExamSoft has 20 years of UX iteration. Every deviation (adding or removing a capability) needs a documented rationale.
> "If we are not showing total points, or upper and lower 27% discrimination index — it should not be because we didn't think about it."

**Action needed:** For every assessment config field we omit vs ExamSoft, add a one-line rationale to the feature registry notes column.

---

## Item 21 — Assessment list columns inside a course (ExamSoft reference)
**Status: PARTIAL**
From ExamSoft review during Jun 9 sync:
- Assessment name
- Type (quiz / exam / midterm — if config options differ by type, collect it; otherwise reconsider)
- Status: posted / draft / archived
- Schedule / dates
- Download count / upload count (not needed — we are not doing offline download in P1)

Filter: "show archived assessments" toggle.
KPI above list: total assessments, N in draft, N posted, N completed.

---

## Source: Kunal — Jun 6, 2026 ("Question bank design — filters, AI generation, and answer rationale")

---

## Item 22 — QB filters must match Prism UX exactly
**Status: NOT DONE**
Kunal's directive: QB filter pattern must be the same as Prism's filter UX — same icon, same layout, same interaction. Users coming from Prism should not have to relearn filtering.
> "Same thing as we provide in Prism. It will also be continuous to the Prism experience."

Three filter entry points confirmed (as already designed):
1. Column-level filter (search + group by)
2. Inline add-filter chip row
3. Filter icon in toolbar

**Action needed:** Do a side-by-side check of QB filter UI vs current Prism filter panel and align any deviations.

---

## Item 23 — Answer rationale field on every question
**Status: NOT DONE**
Kunal raised this twice. Every question needs an "Answer Rationale" field — explaining why the correct answer is correct.
> "Not just 'answer' — rename to 'Answer Rationale'. I'll show you what that means when I show you the assessment stuff."

**Action needed:** Add `answerRationale` field to question editor for all question types. Label = "Answer Rationale" not "Answer".

---

## Item 24 — Draggable column divider on QB left panel
**Status: NOT DONE**
Kunal: when a course name is long, the left panel gets cramped. The divider between the sidebar tree and the question table should be draggable.
> "You should be able to drag that vertical line."

**Action needed:** Make the QB sidebar/table split resizable via drag.

---

## Item 25 — "Empty courses" filter in QB
**Status: NOT DONE**
Kunal: admins need a way to see which courses have zero questions tagged to them.
> "If I'm an administrator coming in and I want to find out — show me all of the courses which have zero questions tagged to them."

Also: a "Not Assigned" virtual folder in the sidebar — questions that exist in the bank but haven't been assigned to any course/subfolder.

**Action needed:** Add "Empty courses" filter to QB. Add "Not Assigned" virtual node to sidebar tree.

---

## Item 26 — Question performance stats on question detail
**Status: PARTIAL (feature-registry)**
Kunal confirmed what should show on the question detail panel:
- **Version history** — per version: which course used it, average score
- **Usage count** — how many times this question has been used (e.g., "35 times")
- **Last used** — date of last use
- **PBI / discrimination** — "more psychometric aspects will be added later, not right now"

**Action needed:** Verify version history + usage count are in the question detail panel. PBI = Phase 2.

---

## Item 27 — Tooltip / info icons on question config fields
**Status: NOT DONE**
Kunal: complex fields (like numeric tolerance, answer rationale, scoring options) should have info icon tooltips explaining how to use them. Especially important for fields like "Tolerance" on numeric questions.
> "Use tooltips across. People can hover and see what they should do."

**Action needed:** Add `title` or DS Tooltip to all non-obvious question config fields.

---

## Item 28 — AI question generation = Phase 2+
**Status: CONFIRMED DEFER**
Kunal and Romit aligned: AI generation of questions from topics/slides is a future phase. The Ask Leo button can remain as a placeholder, but full AI generation end-to-end is not Phase 1.
> "We haven't reached that point yet — that's phase two or phase three."

However: the UI/UX for AI generation should be designed at the big-picture level (per Item 2 — two-track approach). What the product team picks up and when is their decision.

---

## Item 29 — QB review workflow = not built yet (future)
**Status: CONFIRMED NOT BUILT**
Kunal noted: questions currently have no review/approval workflow. Once built, it will involve stakeholder assignment and back-and-forth communication. Not a P1 item.
> "We don't have a review workflow — once that is there, it will work like compliance stuff."

---

## Pending decisions / blockers (all sources)
- [ ] Item 1: Himanshu alignment session on design coexistence strategy
- [ ] Item 2: Produce big-picture + Phase 1 parallel Figma tracks for assessment creation
- [ ] Item 9: Move health/stats panel to persistent side rail in builder
- [ ] Item 15: Finalize course offering list view — share with Vishal
- [ ] Item 22: Side-by-side QB filter vs Prism filter audit
- [ ] Item 23: Add Answer Rationale field to question editor (all question types)
- [ ] Item 24: Draggable QB sidebar divider
- [ ] Item 25: "Empty courses" filter + "Not Assigned" virtual node in QB
- [ ] Item 6: Student group selector for distribute step
- [ ] Item 8: Complete monitoring — issue flags, proctor actions (end/invalidate)
- [ ] Item 20: Document ExamSoft deviation rationale for each omitted feature

---

*Last updated: 2026-06-17 · Sources: Jun 4 Aarti recording · Jun 9 Vishal+Monil sync · Jun 6 Kunal QB session*
