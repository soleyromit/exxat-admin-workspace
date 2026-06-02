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