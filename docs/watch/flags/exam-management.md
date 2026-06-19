# PRD Watch Flags — Exam Management

Ambiguous PRD deltas and system notices. Append-only. Agent writes, Romit resolves.

---

## 2026-05-19 — First snapshot taken: Exam Mgmt Roadmap — Nipun (Excel manifest)
First snapshot taken for Exam Mgmt Roadmap — Nipun (Excel manifest) — no diff applied. Next run will detect real changes.

## 2026-05-19 — First snapshot taken: Assessment Builder PRD — Nipun
First snapshot taken for Assessment Builder PRD — Nipun — no diff applied. Next run will detect real changes.

## 2026-05-19 — First snapshot taken: Roadmap-Exam-Management
First snapshot taken for Roadmap-Exam-Management — no diff applied. Next run will detect real changes.

---

## 2026-05-23 — Flagged: Exam Mgmt Roadmap — Nipun (5 changes)

### Flag 1 — Two new features added to roadmap (applied to BUILD-STATUS)
**Changed text (before):** *(rows did not exist)*
**Changed text (after):**
> Setup - Logo, LMS integration, RBAC, Import Courses — In Progress, ETA 27-May, Initial Prototyping (Design)
> Base entities - Faculty, Students — In Progress

**Why flagged:** CLEAR additions — two new work items appeared in Nipun's Excel. Status applied to BUILD-STATUS.md. These items likely represent foundational setup work that was previously untracked.
**Suggested action:** Check with Nipun whether "Setup" and "Base entities" are separate features needing their own admin pages, or backend-only work. If they need UI, confirm scope before building.

---

### Flag 2 — "Question bank on screen analytics" removed from Excel roadmap
**Changed text (before):** `Question bank on screen analytics | Question Bank | TBD`
**Changed text (after):** *(row no longer present in Excel)*

**Why flagged:** CLEAR removal — this item was previously listed as TBD and now appears removed entirely from Nipun's Excel. It was never added to BUILD-STATUS (was TBD → skipped).
**Suggested action:** Confirm with Nipun whether this feature was descoped, deferred to Phase 2, or simply renamed. If descoped, remove from any internal roadmap references.

---

### Flag 3 — Assessment Distribution ETA now 27-May
**Changed text (before):** `Assessment Distribution | Assessment | In Progress` (no ETA)
**Changed text (after):** `Assessment Distribution | In Progress | 27-May | Initial Prototyping (Design)`

**Why flagged:** CLEAR — a concrete ETA of 27-May 2026 has been set for Assessment Distribution design readiness.
**Suggested action:** Assessment Distribution design should be ready by 27-May. If Romit is the design owner, confirm whether the admin distribute-assessment flow needs to be built before that date.

---

### Flag 4 — Question Import category changed: Onboarding → Question Bank
**Changed text (before):** `Question import (examsoft and other tools) | Onboarding`
**Changed text (after):** `Question import (examsoft and other tools) | Question Bank`

**Why flagged:** CLEAR category rename — Question Import is now classified under "Question Bank" rather than "Onboarding" in Nipun's tracker. This suggests Question Import is considered part of the QB feature set, not a one-time onboarding flow.
**Suggested action:** If the Question Import UI lives in the Question Bank section (not a separate onboarding wizard), confirm placement with Nipun before building the import UI.

---

### Flag 5 — "Stakeholder Alignment" column added to Excel tracker
**Changed text (before):** *(column did not exist; tracker used only Requirements Finalization)*
**Changed text (after):** `Stakeholder Allignment` column added; "Question creation (Manual & AI)" has "Alignment Points" marked

**Why flagged:** AMBIGUOUS — a new stakeholder alignment tracking column appeared. "Alignment Points" is listed for Question Creation, suggesting there may be open alignment gaps.
**Suggested action:** Ask Nipun what "Alignment Points" means for Question Creation — are there stakeholder disagreements or open decisions blocking finalisation?

---

## 2026-05-31 — Flagged: Exam Mgmt Roadmap — Nipun (1 change)

### Flag 1 — Excel columns restructured: "Requirement Readiness" removed; "Product", "QA/UAT", "Release" columns added
**Changed text (before):**
> Requirement Readiness
> In progress

**Changed text (after):**
> Product
> QA/UAT   Release

**Why flagged:** AMBIGUOUS — the Excel tracker now shows three new column headers (Product, QA/UAT, Release) where "Requirement Readiness" previously appeared. No feature status values changed (Manage Question Bank = ✅ Aligned, all others = Review Pending or In Progress). The new columns appear to be empty/unpopulated for all features.
**Suggested action:** Ask Nipun what the "Product", "QA/UAT", and "Release" columns track. If they represent new pipeline stages, consider whether BUILD-STATUS.md should be extended to track QA and release readiness separately from design/engineering readiness.

---

## 2026-06-02 — Flagged: Exam Mgmt Roadmap — Nipun (2 changes)

### Flag 1 — Business alignment confirmed for Assessment Creation & Distribution and In Assessment Experience
**Changed text (before):**
> Assessment Creation & Distribution | 🟡 Review Pending (Business)
> In Assessment Experience | 🟡 Review Pending (Business)

**Changed text (after):**
> Assessment Creation & Distribution | ✅ Aligned (Business)
> In Assessment Experience | ✅ Aligned (Business)

**Why flagged:** CLEAR — both features now have confirmed business alignment (stakeholders signed off). Requirements also moved to Done for both features. Does not change BUILD-STATUS feature status (still In Progress — engineering not complete). Step 7b mapping does not apply to "Aligned" values.
**Suggested action:** Informational. Engineering can proceed on these two features without further business alignment reviews.

---

### Flag 2 — In Assessment Experience engineering blocked; 15th June delivery targets added
**Changed text (before):** *(no delivery dates or blocking status in prior Excel snapshot)*
**Changed text (after):**
> In Assessment Experience: Design 🟡 In Progress (3rd June Delivery), Engineering 🔴 Blocked
> Comment: "In assessment experience partially complete. To continue on 4th June post design unblock"
> Assessment Creation & Distribution: Comment: "🟡 Refinements + Product is providing UX fixes for this — 15th June Delivery"
> Manage Question Bank: QA Comment: "🟢 15th June Delivery"

**Why flagged:** CLEAR — In Assessment Experience engineering is 🔴 Blocked, awaiting design unblock by 4th June. 15th June is the delivery target for both QB (QA complete) and Assessment Creation & Distribution. No BUILD-STATUS feature statuses changed (no step 7b mapping match), but the blocking status is an urgent signal.
**Suggested action:** If Romit owns the In Assessment Experience design, check what design asset is blocking engineering and prioritize its delivery by 4th June. The 15th June target is 13 days away — confirm whether Assessment Creation & Distribution design refinements are complete or need input.

---

## 2026-06-05 — Flagged: Exam Mgmt Roadmap — Nipun (4 changes)

### Flag 1 — New Capability/User Story table added with P0/P1/P2 breakdown (AMBIGUOUS)
**Changed text (before):** *(section did not exist — Excel previously started with "Project Status | Exam Management")*
**Changed text (after):**
> Capability   User story   Priority   Status   Owner
> Manage Question Bank   Completed   Nipun
> Course Offering — 7 sub-capabilities, all "In Review" (P0-Cohere, Vishal)
> In Assessment Experience: Exam initiation "To be picked", Test taking experience "Completed", Post exam "To be picked"
> Assessment Creation & Distribution — sub-items defined; Smart search "In Progress" (Bhargav)
> Question Creation, Import, Grading sub-items defined (P0/P1)
> Question Tagging: 🟡 In Progress (P1-Jan 20, Vishal)

**Why flagged:** AMBIGUOUS — brand new sheet/section in the Excel with detailed capability breakdown and P0/P1/P2 priorities. Course Offering sub-capabilities all show "In Review" — imminent grooming. Exam initiation and post-exam completion are "To be picked" despite In Assessment Experience being ✅ Aligned at business level.
**Suggested action:** Review with Nipun — does this replace the old Project Status grid or complement it? Confirm P0/P1 cutoffs match the current phase 1 plan. The 7 Course Offering sub-items all being "In Review" suggests grooming is imminent — confirm Romit has design coverage for all 7.

---

### Flag 2 — Open Questions section: 8 questions with 04-Jun-26 target dates (all past due as of today)
**Changed text (before):** *(section did not exist)*
**Changed text (after):**
> 1. Are the User roles defined in the code? → Engg (Darshan)
> 2. Do we have to build a review flow? (Graded, ungraded and graded low weightage) → CX
> 3. Are accommodations at exam level or course level or student level → CX
> 4. Who decides the publishing date? → CX
> 5. Who can see student performance for assessment / course? (Creator, coordinator, TA — note: "Admin gives access to performance") → CX
> 6. What is the role capability of Teaching assistant → CX
> 7. When should we show the list of planned exams to students (status & date) → CX
> 8. Should student experience cater for external hardware attachments → CX
> All targeted for resolution 04-Jun-26 (yesterday).

**Why flagged:** AMBIGUOUS — 8 open questions with target dates that have now passed. Questions 3 (accommodations scope) and 5 (student performance visibility) have FERPA-adjacent implications — student performance access control touches FERPA §99.31. These were open with Vishakha and Darshan.
**Suggested action:** Check with Nipun/Darshan whether these were resolved in a June 4th meeting. Questions 3 and 5 have design implications — get answers before building student experience pages. If unresolved, escalate to Vishakha.

---

### Flag 3 — AI-Assisted Blueprint Creation added to 2027 roadmap (CLEAR)
**Changed text (before):**
> 2027: 1) transmit grades back to LMS   1) advanced question level metrics   1) Offline exam taking

**Changed text (after):**
> 2027: 1) transmit grades back to LMS   1) Advanced question level metrics   AI-Assisted Blueprint Creation   1) Offline exam taking

**Why flagged:** CLEAR — "AI-Assisted Blueprint Creation" is a new 2027 feature not in the prior snapshot. Not yet tracked in BUILD-STATUS (2027 scope). "Blueprint" likely refers to AI-generated assessment plans aligned to Bloom's taxonomy distribution across a full course.
**Suggested action:** No code action. Note as a 2027 AI feature concept — relevant when designing the assessment builder's blueprint/distribution chart (the Mark Distribution Card in the Assessment Builder PRD). Worth capturing in future roadmap discussions with Nipun.

---

### Flag 4 — Course Offering Engineering: Not Started → In Development by Darshan (12-Jun target); Design: In Refinement by Romit
**Changed text (before):**
> Course Offering Perspective | Design: 🟡 In Review (May 20 wireframes v1) | Engineering: ⚪ Not Started

**Changed text (after):**
> Course Offering | Design: In Refinement (Romit) | Engineering: In Development (Darshan) | Target: 12-Jun (both)

**Why flagged:** CLEAR status change — Course Offering engineering has begun (In Development, Darshan, target 12-Jun). Design is now In Refinement by Romit. The 7 Course Offering sub-capabilities (list view, detail, assessment plan, course content, students, QB, faculty) are all In Review — imminent design finalization needed.
**Suggested action:** If Romit's design is "In Refinement", confirm refinement items are resolved before 12-Jun. Check what design assets Darshan needs for the 7 sub-capability pages — all are P0-Cohere. BUILD-STATUS already shows Course Offering as 🟡 In Progress — no status change, but the 12-Jun engineering target is new.

---

## 2026-06-17 — Flagged: Exam Mgmt Roadmap — Nipun (5 changes; 1 CLEAR BUILD-STATUS applied)

### CLEAR change applied — In Assessment Experience: all 3 P0-Cohere sub-items now Completed → 🟢 Shipped
**Changed text (before):**
> Exam initiation - soft download, landing page, test taking setup | P0-Cohere | To be picked | Bhargav
> Post exam completion - results, assessments page | P0-Cohere | To be picked | Bhargav

**Changed text (after):**
> Exam initiation - soft download, landing page, test taking setup | P0-Cohere | Completed | Bhargav
> Post exam completion - results, assessments page | P0-Cohere | Completed | Bhargav

**Why flagged:** CLEAR — all 3 P0-Cohere sub-items under "In Assessment Experience" are now Completed (test taking was already Completed in last snapshot). Step 7b mapping: "Completed" → 🟢 Shipped. BUILD-STATUS.md updated: "In Assessment Experience (Student)" changed from 🟡 In Progress to 🟢 Shipped.

---

### Flag 1 — Course Offering: 2 sub-capabilities removed; target date updated to 16-Jun
**Changed text (before):**
> View and manage assessment plan for a course offering | P0-Cohere | In Review | Vishal
> View and manage course content for a course offering | P0-Cohere | In Review | Vishal

**Changed text (after):** Both rows are no longer present. Target date for Course Offering engineering changed from 12-Jun to 16-Jun.

**Why flagged:** AMBIGUOUS — two Course Offering sub-capabilities removed. May represent scope change (deferred), rename, or merger into Base Entities. The 12-Jun target also slipped to 16-Jun. No BUILD-STATUS change (still 🟡 In Progress).
**Suggested action:** Confirm with Nipun/Vishal whether "assessment plan" and "course content" sub-pages are deferred, renamed, or absorbed into the Base Entities framework. Engineering target slipped 4 days — check if design refinements caused the delay.

---

### Flag 2 — New "Base Entities" section added: Students, Faculty, Settings-RBAC (In Progress)
**Changed text (before):** *(section did not exist)*
**Changed text (after):**
> Base Entities | Students entity | P0-Cohere | In Progress | Vishal
> Base Entities | Faculty entity | P0-Cohere | In Progress | Vishal
> Base Entities | Settings - RBAC | P0-Cohere | To be picked | Vishal

**Why flagged:** AMBIGUOUS — new top-level section "Base Entities" appeared in the capability table. Students and Faculty entities are In Progress. This may clarify where assessment plan/course content sub-items went (absorbed into base entity pages). RBAC is now tracked explicitly as a P0 item.
**Suggested action:** Confirm with Nipun whether Base Entities represents new standalone pages (students list, faculty list) or backend-only data setup. If UI pages are needed, these are P0-Cohere and Vishal is the owner.

---

### Flag 3 — Multiple Question Creation and Assessment Creation items now have explicit statuses
**Changed text (before):** *(most items in these sections had blank status)*
**Changed text (after):**
> Manual question creation | P0-Cohere | In Refinement | Nipun
> Question flagging and refinement using AI | P0-Cohere | Completed | Nipun
> AI question variant creation | P0-Cohere | Completed | Nipun
> Import via human readable document | P0-Cohere | In Refinement | Nipun
> Import via test banks | P0-Cohere | To be picked | Nipun
> Examsoft specific import | P1-Jan 20 | To be picked | Nipun
> Manual assessment creation | P0-Cohere | In Review | Nipun
> In assessment configurations (assessment + question level) | P0-Cohere | In Review | Nipun
> Import and edit an assessment file using AI | P0-Cohere | In Review | Nipun
> Review & collaborator, and user roles | P1-Jan 20 | In Review | Nipun

**Why flagged:** CLEAR status fills — many capabilities that previously had blank status now show In Refinement, Completed, or In Review. Step 7b mapping for top-level BUILD-STATUS features: "Question Creation" still shows mixed statuses — manual is In Refinement, AI flagging/variant Completed. No BUILD-STATUS change to "Question Creation (Manual & AI)" (stays 🟡 In Progress).
**Suggested action:** Informational. Question Tagging/Import stays 🟡 In Progress. Assessment Creation is moving toward review/complete on multiple sub-items. No action needed on BUILD-STATUS this run.

---

### Flag 4 — New June 23-25 EM Solution Review sessions and P0/P1/P2 milestone dates added
**Changed text (before):** *(no solution review sessions or milestone target dates)*
**Changed text (after):**
> June 23 (Morning): EM Solution Review — In Assessments (student), Base entities & settings, Assessments creation & distribution
> June 23 (Evening): EM Solution Review — Assessments creation & distribution, Question creation + import
> June 24: EM Brainstorming — Accreditation (Submissions, Strategic alignment), Certification (Collaborative assessments, Strategic alignment), Rubrics, RBAC
> June 25: EM Project Planning — Buffer for parking lot items
> P0 - Cohere: 15-Sep 2026 | P1 - Beta: 19-Dec 2026 | P2 - GA Launch: 20-Sep (2027 implied)

**Why flagged:** AMBIGUOUS — major planning sessions are 6 days away (June 23-25). Solution review sessions cover all key P0-Cohere features. Milestone dates are now explicit: P0 Cohere = 15-Sep, P1 Beta = 19-Dec. The GA Launch date of 20-Sep is ambiguous (2026 or 2027?).
**Suggested action:** Romit should prepare all In Assessment, Base Entities, Assessment Creation & Distribution, and Question Creation designs for review by June 23. These sessions are 6 days out. Confirm GA Launch 20-Sep is 2027, not 2026.

---

### Flag 5 — "Laura → Kim" stakeholder name change in beta/consultant list
**Changed text (before):** "Laura" (first entry in stakeholder table)
**Changed text (after):** "Laura --> Kim"
**Why flagged:** CLEAR stakeholder change — "Laura" has transitioned to "Kim" on the beta account team. Informational only.
**Suggested action:** No action. Update internal contacts if you communicate with beta schools directly.

---

## 2026-06-19 — Flagged: Exam Mgmt Roadmap — Nipun (4 changes)

### Flag 1 — Base Entities: status In Progress → In Review; row names expanded (CLEAR)
**Changed text (before):**
> Students entity | P0-Cohere | In Progress | Vishal
> Faculty entity | P0-Cohere | In Progress | Vishal

**Changed text (after):**
> Students entity - list and details view | P0-Cohere | In Review | Vishal
> Faculty entity - list and details view | P0-Cohere | In Review | Vishal
> (Development column: Dev Ready | Darshan | start 18-Jun)

**Why flagged:** CLEAR — both Base Entities capabilities advanced from "In Progress" to "In Review". Row names now explicitly confirm a list view AND a details/profile view are required per entity. Development status shows "Dev Ready" (Darshan), start date 18-Jun — meaning Darshan may already be unblocked and waiting on final design sign-off.
**Suggested action:** Confirm Base Entities design is submitted for review. If Romit owns any Base Entities design assets, ensure they are finalized — Darshan's 18-Jun dev start has passed and the status shows "Dev Ready" meaning dev is ready to proceed once design is confirmed.

---

### Flag 2 — EM POC Demo added to June 23 calendar: 5 items in scope (CLEAR — URGENT)
**Changed text (before):** *(June 23 only listed EM Solution Review sessions — Morning and Evening)*
**Changed text (after):**
> EM POC Demo
> Question bank
> In assessment experience
> Course list view
> Question variant and distractor using AI
> RBAC - role and scope based

**Why flagged:** CLEAR — an "EM POC Demo" section was added alongside the June 23 Solution Reviews. It covers 5 scope items: Question bank, In assessment experience, Course list view, Question variant and distractor using AI, and RBAC. This is 4 days from today (2026-06-19).
**Suggested action:** URGENT. Confirm with Nipun: (1) Is the POC Demo a separate event on June 23 or part of the Solution Review block? (2) Is Romit/the prototype expected to be used for this demo? (3) Are all 5 features runnable in the current apps/exam-management/ prototype? Specifically: Question bank ✅ (shipped), In assessment experience ✅ (shipped), Course list view — confirm at /courses/, Question variant+distractor via AI — confirm in QB AI flow, RBAC — confirm whether a role-switching prototype exists. Prepare all 5 for June 23.

---

### Flag 3 — Course Offering design: "In Refinement Romit/Vishal" → "In Review Vishal" (CLEAR)
**Changed text (before):**
> Course Offering | Design: In Refinement | Romit / Vishal | Target: 16-Jun

**Changed text (after):**
> Course Offering | Design: In Review | Vishal | Start: 20-May | Target: 16-Jun

**Why flagged:** CLEAR — Course Offering design moved from "In Refinement" to "In Review". Romit is no longer listed as design co-owner for this phase — only Vishal appears as the current reviewer. This signals the refinement iteration is complete and the design is in Vishal's review queue.
**Suggested action:** Confirm all 5 remaining Course Offering sub-capabilities (list view, detail, students, question bank, faculty tabs) are finalized and submitted to Vishal. Engineering (Darshan) has 18-Jun as dev start date for some rows — if review raises further changes, turnaround needs to be fast to avoid blocking dev.

---

### Flag 4 — Release target dates updated: TBD → 3rd July (×6) and 20-Jul (×3) (CLEAR)
**Changed text (before):**
> Release Target: 17th June, 18th June, TBD, TBD, TBD (3 TBD entries)

**Changed text (after):**
> Release Target: 17th June, 18th June, 3rd July ×6, 20-Jul ×3

**Why flagged:** CLEAR — all previously TBD release targets are now set. Six capabilities target 3rd July; three additional capabilities target 20-Jul. This is the first time a complete release date picture exists for the P0-Cohere scope. Step 7b mapping: no BUILD-STATUS feature status changes (no "Completed" rows this run) — only last-updated date bumped.
**Suggested action:** Informational. 3rd July = primary Cohere delivery target for Course Offering and Base Entities. 20-Jul = secondary wave (likely Assessment Creation & Distribution and Question Creation sub-items). No BUILD-STATUS change required — step 7b mapping does not include "In Review" or "Dev Ready" statuses.

---
