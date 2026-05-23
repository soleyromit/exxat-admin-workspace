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
