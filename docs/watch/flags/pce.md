# PRD Watch Flags — PCE

Ambiguous PRD deltas and system notices. Append-only. Agent writes, Romit resolves.

---

## 2026-05-19 — First snapshot taken: PCE PRD — Monil Pokar
First snapshot taken for PCE PRD — Monil Pokar — no diff applied. Next run will detect real changes.

---

## 2026-05-23 — Flagged: PCE PRD — Monil Pokar (4 changes)

### Flag 1 — New section: "Limitation of Current Survey Capability (Exxat Surveys)"
**Changed text (before):** *(section did not exist)*
**Changed text (after):**
> Limitation of Current Survey Capability (Exxat Surveys)
> 1. Per course distribution only, no bulk push available
> 2. Auto-render sections based on the count of subjects
> 3. Access control for analytics – within the form

**Why flagged:** Non-functional / context addition — explains why the PCE redesign is needed. No code change applied (informational). Documents existing survey limitations as rationale.
**Suggested action:** No action required. Useful context for conversations with Vishakha / Monil about what the redesign must fix.

---

### Flag 2 — Distribute Survey wizard steps now explicitly defined
**Changed text (before):** *(Step 2 — Distribute Survey jumped directly to bullet flow description)*
**Changed text (after):**
> "End to End" Distribute Survey will have following steps:
> 1. Properties/Details
> 2. Distribution
> 3. Survey Design
> 4. Communication
> 5. Report Access

**Why flagged:** CLEAR design decision — the distribute survey wizard is now confirmed as a 5-step wizard. This may require a stepper component in the PCE admin app if/when the Distribute Survey page is built.
**Suggested action:** When building the Distribute Survey wizard, implement a 5-step stepper (Properties/Details → Distribution → Survey Design → Communication → Report Access). No code exists to update yet.

---

### Flag 3 — Shared Platform Architecture section added under Analytics
**Changed text (before):** *(Step 5 Analytics ended at "PRD for PCE Analytics: PRD-Analytics-PCE")*
**Changed text (after):**
> Shared Platform Architecture (Between PCE and General Surveys)
> 1. Survey type
> 2. Template engine
> 3. Distribution engine
> 4. Analytics foundation

**Why flagged:** AMBIGUOUS — this is a design-in-progress architectural note. No specifics on what "shared" means technically. Could have implications for how PCE and General Surveys share data models in code.
**Suggested action:** Ask Monil in next call: does "shared platform architecture" mean PCE and General Surveys will use the same database tables / APIs, or just the same UI patterns? This impacts whether `surveys` and `pce` are separate apps or merged.

---

### Flag 4 — Dependency renamed and risk text simplified
**Changed text (before):**
> SIS/course roster integration | Engineering | Surveys cannot auto-trigger; manual workaround required for Phase 1

**Changed text (after):**
> SIS/ LMS | Engineering | Survey distribution cannot be automated

**Why flagged:** CLEAR — dependency scope broadened from "SIS/course roster" to "SIS/LMS". Risk text simplified. This suggests the dependency is now understood to encompass the full LMS integration, not just roster data.
**Suggested action:** No code change. Confirm with Darshan/engineering whether LMS integration is in scope for Phase 1 or remains a Phase 2 blocker.
