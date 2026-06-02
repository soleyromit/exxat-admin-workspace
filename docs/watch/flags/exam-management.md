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