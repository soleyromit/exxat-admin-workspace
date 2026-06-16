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

---

## 2026-05-30 — Flagged: PCE PRD — Monil Pokar (2 changes)

### Flag 1 — New Section 13 "Feedback on Designs" added with open questions
**Changed text (before):** *(section did not exist)*
**Changed text (after):**
> 13a. General Layout
> 1. How are we going to position both the survey types: Course Evaluations and Other General Surveys. Suggestion is to have separate entry points
> 2. Current side bar lists the journey of a survey. Moderation can be a captured as a part of survey status within the survey master list
> 3. Need to create separate view for Course Evaluation and Other General Surveys to show the list of surveys (Done, refer point 1)
> 13b. Create Template
> 1. In question design, as discussed, we will be using our current FAAS UI so try to design the subject addition outside of FAAS, as we have control over subject assignment step.
> 13c. Create Surveys *(empty)*

**Why flagged:** AMBIGUOUS — contains open design questions (item 1 "How are we going to position…?"), in-progress notes, and partially answered items. Section 13a item 2 suggests moving Moderation out of the sidebar into survey status — this has layout implications for `app-sidebar.tsx` and the moderation route. Section 13b item 1 confirms FAAS UI is used for question design, constraining the template builder scope.
**Suggested action:** Review with Monil: (1) Is the sidebar "journey" layout being replaced by a status-based master list view? If yes, the sidebar nav structure needs to change. (2) Confirm the FAAS UI constraint for question creation is still current — this affects whether a new question builder UI is in scope.

---

### Flag 2 — Wizard Step 2 renamed from "Distribute Survey" to "Create Survey"; step 2 substep renamed "Distribution" → "Scope/Courses"
**Changed text (before):**
> Step 2 — Distribute Survey
> 1. Properties/Details 2. Distribution 3. Survey Design 4. Communication 5. Report Access

**Changed text (after):**
> Step 2 — Create Survey
> 1. Properties/Details 2. Scope/Courses 3. Survey Design 4. Communication (newly added) 5. Report Access (newly added)

**Why flagged:** CLEAR rename — the section heading and wizard step label changed. The existing code already uses "Create Survey" terminology (CreateSurveySheet component, /surveys/push route) so no code change was needed. The wizard substep 2 changed from "Distribution" to "Scope/Courses" — when the full wizard is built, use "Scope/Courses" as the tab label for step 2.
**Suggested action:** When building the push-survey wizard at /surveys/push, label the second step "Scope/Courses" (not "Distribution"). Communication and Report Access are now confirmed as added steps (steps 4 and 5).

---

## 2026-05-31 — Flagged: PCE PRD — Monil Pokar (3 changes)

### Flag 1 — Template Creation step order changed: name/description now before course type
**Changed text (before):**
> •   User selects Course type: Didactic or Clinical (optional)
> •   User gives the template a name and optional description

**Changed text (after):**
> •   User gives the template a name and optional description
> •   User selects Course type: Didactic or Clinical (optional)

**Why flagged:** CLEAR UX reorder — the template creation wizard now collects name/description first, then course type (Didactic/Clinical). No template creation wizard code exists yet in the PCE app.
**Suggested action:** When building the template creation wizard, put name/description input as the first field and course type selector as the second.

---

### Flag 2 — Shared Platform Architecture: concrete capability list replaced by external doc placeholder
**Changed text (before):**
> Shared Platform Architecture (Between PCE and General Surveys)
> 1. Survey type
> 2. Template engine
> 3. Distribution engine
> 4. Analytics foundation

**Changed text (after):**
> 5. Shared Platform Architecture (Between PCE and General Surveys)
> Shared Capabilties - PCE and Gen Surveys

**Why flagged:** AMBIGUOUS — the 4-item concrete capability list has been removed and replaced with what appears to be a link or embedded diagram placeholder ("Shared Capabilties - PCE and Gen Surveys"). The architectural detail is no longer visible in the PRD text extraction.
**Suggested action:** Ask Monil for the "Shared Capabilities" document/diagram. Does the shared architecture still include Survey type, Template engine, Distribution engine, and Analytics foundation? Confirm whether these represent shared DB Tables/APIs or just conceptual modules — this affects whether PCE and General Surveys can share a codebase.

---

### Flag 3 — User Stories table: "Results Review" and "Longitudinal Insights" rows merged into "Analytics"
**Changed text (before):**
> Distribute Survey | US - Push Survey - Course Evaluation.docx | Admin
> Results Review | Faculty
> Longitudinal Insights | Faculty

**Changed text (after):**
> Distribute Survey | US - Create Survey - Course Evaluation.docx | Admin
> Analytics | Faculty

**Why flagged:** CLEAR — two separate faculty-facing user story rows ("Results Review" and "Longitudinal Insights") were consolidated into a single "Analytics" row. The linked distribute-survey user story document was also renamed to "US-Create Survey".
**Suggested action:** No code change needed. When building analytics views, reference the consolidated "Analytics" user story (not separate per-survey and longitudinal stories). The linked US document name confirms the rename to "Create Survey" flow.

---

## 2026-06-02 — Flagged: PCE PRD — Monil Pokar (4 changes)

### Flag 1 — Key Product Decision 2: PRISM dependency sub-bullets added (AMBIGUOUS)
**Changed text (before):** "Semester (Term + Academic Year), start date, end date and Course offerings (courseID, Course Name, Term, Academic Year) must be created in PRISM to enable CE distribution."
**Changed text (after):** Same, plus new sub-bullets:
> a. Dependency on availability of course offerings in PRISM - base
> b. This will not work for schools that don't have term and course data in PRISM. They need to add the data in PRISM to run CE distribution

**Why flagged:** Contains "Dependency on" — AMBIGUOUS. Sub-bullet b reveals a scope limitation: CE distribution is blocked for schools that haven't imported term and course data into Prism. No manual fallback path is defined for Phase 1.
**Suggested action:** Confirm with Monil whether a manual data-entry path is planned for Phase 1 for schools without Prism course data, or if CE is Prism-only. This affects the onboarding strategy for non-Prism clients.

---

### Flag 2 — Flow 2b: Entire new "AI Native / Run Evaluation" flow added
**Changed text (before):** *(section did not exist)*
**Changed text (after):** New section — Flow 2b — Distribute Survey (AI Native / Run Evaluation): Admin receives an email at start of academic calendar, lands on Run Evaluation page, selects chips (Term | AY | Program), clicks "Run Audit", an AI agent panel (Leo) scans courses and flags issues one by one, presents a pre-filled survey window for confirmation, surfaces course tiles with Ready/Fix status badges, Push Surveys button activates with shimmer only when all conditions met.

**Why flagged:** Major new feature section with significant UX scope — includes AI agent (Leo) with animated orb, scan-message animation, shimmer button, and conditional course tile states. Non-functional scope addition → no code action applied. This may supersede or complement the previously confirmed 5-step wizard (Flow 2a).
**Suggested action:** Review with Monil — is Flow 2b the primary distribute-survey flow for Phase 1, or an alternate path alongside the 5-step wizard? If Flow 2b is the primary path, the stepper-based wizard design from earlier PRD iterations may be replaced by this AI-native audit interface.

---

### Flag 3 — Step 3: Instructor section renders per instructor count
**Changed text (before):** "Survey renders one section at a time (Subject: Course Content, Instructor, Course Coordinator)"
**Changed text (after):** Same, plus "The Instructor section will render for number of Instructor in the course"

**Why flagged:** CLEAR behavioral clarification — if a course has 2 instructors, the Instructor section renders twice (once per instructor). Non-functional → no code action applied.
**Suggested action:** When building the student survey form (apps/pce/student/), ensure the Instructor section is repeated N times based on the instructor count from the course offering. Confirm with Monil the section title pattern when N > 1 (e.g., "Instructor 1", "Instructor 2" or instructor name as label).

---

### Flag 4 — Step 3: Submitted surveys remain visible to students in Submitted state
**Changed text (before):** "Once submitted, the survey moves to submitted state"
**Changed text (after):** "Once submitted, the survey moves to submitted state. The survey with Submitted state will also be shown"

**Why flagged:** CLEAR behavioral addition — submitted surveys remain visible to students (in a Submitted state) rather than disappearing from the student portal after submission. Student-facing display change.
**Suggested action:** When building apps/pce/student/, show submitted surveys with a Submitted status badge in the student's survey list. Confirm with Monil whether students see submission timestamp or just the Submitted label.

---

## 2026-06-09 — Flagged: PCE PRD — Monil Pokar (6 new §13 design feedback items)

### Flag 1 — §13a.4: "Move the search bar to the top" (CLEAR — non-functional)
**Changed text (before):** *(§13a had 3 items only)*
**Changed text (after):**
> 4. Move the search bar to the top

**Why flagged:** CLEAR UX directive from Monil's design review. Affects search bar placement on the surveys master list page. Non-functional feedback → no code auto-applied.
**Suggested action:** When refining the surveys list page (apps/pce/admin/app/(app)/surveys/page.tsx), move the search bar above the table/filter controls to the top of the content area. Confirm with Monil the exact target position (above filter chips? above the entire toolbar?).

---

### Flag 2 — §13a.5: "User profile position question" (AMBIGUOUS — contains "?")
**Changed text (before):** *(§13a had 3 items only)*
**Changed text (after):**
> 5. The user profile is supposed to be on the top right, any reason on why are we moving it to left bottom?

**Why flagged:** Contains "?" inside design feedback section — AMBIGUOUS. Monil is questioning the current placement of the user profile (avatar/name) which appears at the bottom-left of the sidebar. This is the default DS Sidebar footer slot.
**Suggested action:** Confirm with Monil: does he want the user profile badge moved to the SiteHeader top-right? The DS Sidebar component has a dedicated footer slot for user info — moving it to the header is an architectural change. Clarify before acting.

---

### Flag 3 — §13b.1: "No copy option for templates" (CLEAR scope restriction)
**Changed text (before):** *(§13b had 1 item — FAAS UI confirmation)*
**Changed text (after):**
> 1. Do-not give option for user to copy existing template. They can just create template from scratch in course Evaluation

**Why flagged:** CLEAR product scope decision — template creation in PCE should not include a "duplicate/copy template" option. Users must start from scratch each time. No template creation UI exists yet in the PCE app, so no code change to apply now.
**Suggested action:** When building the Template Creation page (apps/pce/admin/app/(app)/templates/), do NOT include a copy/duplicate action in the template list row actions or toolbar. Only "New Template" from scratch. This is consistent with Phase 1 scope.

---

### Flag 4 — §13b.3: "Add course type as an input" (CLEAR — confirms §4 requirement)
**Changed text (before):** *(§13b had 1 item only)*
**Changed text (after):**
> 3. Add course type as an input

**Why flagged:** CLEAR design review confirmation. §4 already specifies "User selects Course type: Didactic or Clinical (optional)" as the second step of Template Creation. Monil is confirming this input must appear in the template builder design.
**Suggested action:** No new action — §4 already mandates course type. When building Template Creation, ensure the course type (Didactic / Clinical) selector is explicitly visible in the design, not hidden behind an advanced options toggle.

---

### Flag 5 — §13c.1: "Survey wizard steps should be horizontal" (CLEAR UX direction)
**Changed text (before):** *(§13c was empty in prior snapshot)*
**Changed text (after):**
> 1. Wouldn't the steps of a push survey look good if they are horizontal. With this, user gets more real estate on the screen

**Why flagged:** CLEAR UX layout direction from Monil — the Create Survey wizard stepper should use a horizontal layout rather than a vertical/left-rail approach. Wizard is not yet built in the PCE app.
**Suggested action:** When building the Create Survey wizard at apps/pce/admin/app/(app)/surveys/push/, use a horizontal stepper (5 steps: Properties/Details → Scope/Courses → Survey Design → Communication → Report Access). A full-width horizontal stepper maximises vertical screen real estate. Use DS Stepper component with horizontal orientation.

---

### Flag 6 — §13c.2: "No Report Access step for Course Evaluation" (AMBIGUOUS — contradicts §4)
**Changed text (before):** *(§13c was empty in prior snapshot)*
**Changed text (after):**
> 2. For now, we donot need "Report Access" step for course Evaluation

**Why flagged:** AMBIGUOUS scope conflict. §4 of the same PRD still formally lists 5 wizard steps including "5. Report Access (newly added)". §13c.2 now says Report Access is not needed for CE. These two sections directly contradict each other. The phrase "For now, we do not need" follows the "will not be covered" AMBIGUOUS pattern.
**Suggested action:** Clarify with Monil which is correct — should the Create Survey wizard have 4 steps (drop Report Access) or 5 steps (keep Report Access as listed in §4)? If Report Access is dropped for CE but kept for General Surveys, the wizard step count will differ between survey types. This is a significant wizard architecture decision — resolve before building.

---

## DECISION CONFLICT — 2026-06-09
**Old decision:** pce-decision-014 (superseded) — "Three creation paths: import an existing evaluation document (PDF/Word) via AI parsing, build manually question by question, or (future) pick from question bank."
**New directive from Monil Pokar in PCE PRD §13b.1 (Jun 9, 2026):** "Do-not give option for user to copy existing template. They can just create template from scratch in course Evaluation." → No copy-existing path.
**Conflicting directive from Vishaka Bhavsar in Post-Course Survey Cadence Meeting BiWeekly (Jun 9, 2026):** Vishaka confirmed "copy existing" as a valid top-level path alongside "build new": "If they are copying from existing the survey already exists in exact prism, and they are just making a copy, giving it a new name and new metadata." — Copy-existing path confirmed.
**Action:** Monil (PRD §13b.1) says no copy. Vishaka (BiWeekly, same day) says copy is valid. These two contradict. Confirm with Adi/Monil which applies before building the template creation screen. Until resolved, pce-decision-028 documents only the undisputed parts (Build new sub-options; document import at top level).

---

## 2026-06-09 — RESOLUTION: PRD §13c.2 ambiguity (Report Access step) resolved
**Flagged on:** 2026-06-09 — §13c.2: "For now, we donot need Report Access step for course Evaluation" contradicted §4 which listed Report Access as step 5.
**Resolution (Jun 9, 2026, Post-Course Survey Cadence Meeting BiWeekly):** Vishaka Bhavsar confirmed removal of the Report Access screen: "will remove this report access." This is now pce-decision-034. The §4 wizard step list should be treated as 4 steps for CE (drop Report Access). The §4 step count will need updating in the PRD.
**Status:** RESOLVED — pce-decision-034 is the authoritative decision.

---

## 2026-06-11 — Flagged: PCE PRD — Monil Pokar (1 change)

### Flag 1 — §13a.1: CE/GS disambiguation element renamed from "survey switch in the user profile" to "navigation" (CLEAR — non-functional)
**Changed text (before):** "I have added a survey switch in the user profile to demonstrate the difference between CE and GS."
**Changed text (after):** "I have added a navigation to demonstrate the difference between CE and GS."
**Why flagged:** CLEAR rename of the CE/GS disambiguation UI element in Monil's design feedback note. Non-functional (§13 Feedback on Designs section) → flag only, no code auto-applied.
**Suggested action:** The prototype CE/GS switch has been redesigned from a profile-area switch to a "navigation" pattern. Confirm with Monil what "navigation" refers to — separate sidebar nav entries for CE vs General Surveys? A top-nav toggle? This determines the sidebar routing architecture between the two survey types in apps/pce/admin/components/app-sidebar.tsx.

---

## 2026-06-16 — Flagged: PCE PRD — Monil Pokar (4 changes)

### Flag 1 — §2 Key Product Decision #5: Course type options changed from Didactic/Clinical to Practice/Classroom/Lab (AMBIGUOUS — conflicts with existing decisions)
**Changed text (before):**
> b. Course type (Optional)
>    i. Didactic
>    ii. Clinical

**Changed text (after):**
> b. Course type (Optional)
>    i. Practice
>    ii. Classroom
>    iii. Lab

**Why flagged:** AMBIGUOUS — this is a fundamental taxonomy change. "Didactic" and "Clinical" are health-education standard terms referenced throughout existing confirmed decisions: pce-decision-002 ("For Clinical Course, preceptor and site evaluations stay within learning activities"), pce-decision-008 ("Course type (optional — Didactic or Clinical)"), and pce-decision-016 ("If a template has a course type (Didactic or Clinical) assigned, it auto-assigns…"). The new values (Practice / Classroom / Lab) are structurally and semantically different. This could be an early draft update or an intentional rethink of the taxonomy. Code impact: `apps/pce/admin/app/(app)/analytics/page.tsx` lines 508–509 hardcode "didactic" and "clinical" as toggle values — these would need updating. No auto-apply until confirmed.
**Suggested action:** Confirm with Monil whether Course type values are being replaced entirely (Practice/Classroom/Lab supersede Didactic/Clinical) or if this is a draft change. If confirmed: (1) Update analytics page toggle from 2 options to 3; (2) Update pce-decision-008 and pce-decision-016 to reflect new taxonomy; (3) Clarify what "Clinical Course" means in pce-decision-002 under the new taxonomy.

---

### Flag 2 — §2 Key Product Decisions: Two new scope decisions added (#6 and #7)
**Changed text (before):** *(only decisions 1–5 + "What will not be covered" existed)*
**Changed text (after):**
> 6. Focus on selling this module independently in Q2, 2027
> 7. No Student login till Q3, 2027 for this module

**Why flagged:** CLEAR new scope decisions. Decision #6 sets a commercial milestone (independent selling of CE module in Q2 2027). Decision #7 formally defers any student-facing login/portal for CE to Q3 2027 — this is consistent with pce-decision-021 (email-only distribution, no student auth for CE participation) but adds a timeline. Extracted as pce-decision-036 and pce-decision-037 in stakeholder-decisions.json.
**Suggested action:** No immediate code action. Note: decision #7 confirms student app (apps/pce/student/) is not prioritized until Q3 2027. Romit should ensure the current student app scaffold is not blocking admin-side CE work.

---

### Flag 3 — New "General Layout: Entry point and Side bar tabs" section added to §4 Key User Flows (CLEAR — new navigation spec)
**Changed text (before):** *(Status of a Survey table was followed directly by Step 1 — Template Creation)*
**Changed text (after):**
> General Layout: Entry point and Side bar tabs
> • Tabs:
>     Surveys
>       Course Evaluations — Dashboard, Templates
>       General Surveys — Dashboard, Templates
>     Directory
>       Program Details, Academic Calendar, Term, Courses, Faculty and Staff, Students, Settings
>       Eval Window — Email templates, Reminder cadence, Rbac

**Why flagged:** CLEAR — this is the first explicit sidebar navigation specification in the PCE PRD, defining two top-level sections (Surveys + Directory) with sub-items. The Directory section includes: Program Details, Academic Calendar, Term, Courses, Faculty and Staff, Students, Settings, and an Eval Window sub-section. This confirms and expands on pce-decision-020 (directory pages view-only). The sidebar structure in apps/pce/admin/components/app-sidebar.tsx should eventually reflect this structure.
**Suggested action:** When building or refining the PCE admin sidebar, use this as the canonical navigation spec. The "Eval Window" group (Email templates, Reminder cadence, RBAC) is new — not currently in the sidebar. Confirm with Monil whether "RBAC" under Eval Window is a new settings page or existing.

---

### Flag 4 — §13 Design Feedback: Multiple items resolved with "(Done)" annotations (informational)
**Changed text (before):** Various §13a, §13b, §13c items had no resolution status.
**Changed text (after):** All previously open §13 design feedback items are now annotated:
- §13a.2: "(Done)" — Moderation moved to survey status
- §13a.4: "(Done)" — Search bar moved to top
- §13a.5: "(Since we are referring to new DS, therefore, the user profile remains at the bottom)" — DS sidebar footer placement confirmed, not moving to top-right
- §13b.1: "(Done)" — No copy template option
- §13b.2: "(Done)" — FAAS UI for question design, subject assignment outside FAAS
- §13b.3: "(Done)" — Course type added as input
- §13c.1: "(Done)" — Horizontal survey wizard steps
- §13c.2: "(Done)" — No Report Access step (consistent with pce-decision-034)

**Why flagged:** CLEAR informational — all §13 design review items from Monil's prototype review have been resolved. The user profile position question (§13a.5) is now definitively answered: it stays at the bottom-left (DS sidebar footer slot) per the new DS convention. This closes the ambiguity flagged on 2026-06-09 (Flag 2).
**Suggested action:** No code action. The user profile position is confirmed bottom-left — do not move it to top-right. All other Done items are already reflected in the codebase or are pre-built guidance.

---
