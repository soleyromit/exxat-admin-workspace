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

## 2026-06-13 — Flagged: Exam Mgmt Roadmap — Nipun (1 change)

### Flag 1 — "POC" and "POC Completed" status annotations added to roadmap project status rows (CLEAR — new status type, no BUILD-STATUS mapping)
**Changed text (before):** `9-Jun  9-Jun  9-Jun  19-Jun  19-Jun  19-Jun  19-Jun  19-Jun  19-Jun  31-Jul  19-Jun`
**Changed text (after):** `9-Jun  9-Jun   POC  9-Jun   POC  19-Jun   POC Completed  19-Jun  19-Jun  19-Jun  19-Jun  19-Jun  31-Jul`

**Why flagged:** CLEAR — "POC" and "POC Completed" are new status values not previously seen in Nipun's Excel. These don't map to any standard step-7b BUILD-STATUS values (Completed / In Progress / Initial Prototyping / Not Started / TBD). The extracted Excel text format doesn't allow clear mapping of which features these statuses apply to.
**Suggested action:** Ask Nipun which features have POC / POC Completed status, and how these map to BUILD-STATUS labels. "POC Completed" likely signals engineering feasibility has been validated and design handoff is imminent — it may warrant a new 🔵 Initial Prototyping or 🟡 In Progress entry in BUILD-STATUS depending on the feature. Also check whether these apply to Course Offering sub-capabilities (most recently entering engineering).

---