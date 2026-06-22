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

## 2026-06-17 — Flagged: PCE PRD — Monil Pokar (4 changes; 1 CLEAR change applied)

### CLEAR change applied — Course type taxonomy renamed: Didactic/Clinical → Practice/Classroom/Lab
**Changed text (before):** "Course type (Optional): i. Didactic, ii. Clinical"
**Changed text (after):** "Course type (Optional): i. Practice, ii. Classroom, iii. Lab"
**Code applied:**
- `apps/pce/admin/lib/pce-mock-data.ts`: type union updated to `'practice' | 'classroom' | 'lab'`; all `'didactic'` mock values → `'classroom'`; all `'clinical'` values → `'practice'`
- `apps/pce/admin/app/(app)/analytics/page.tsx`: `CourseTypeFilter` type updated; ToggleGroupItems now All / Classroom / Practice / Lab

---

### Flag 1 — §2 Key Decisions: Two new roadmap decisions added (non-functional)
**Changed text (before):** "6. What will not be covered in phase 1: Detailed scope here"
**Changed text (after):** Two new items prepended before the scope exclusion:
> 6. Focus on selling this module independently in Q2, 2027
> 7. No Student login till Q3, 2027 for this module

**Why flagged:** CLEAR product roadmap decisions. Non-functional (sales/commercialisation direction) → extracted to stakeholder-decisions.json as pce-decision-036 and pce-decision-037. No code action.
**Suggested action:** Informational. Confirm with Monil whether "selling independently in Q2 2027" means PCE will be priced separately from the Prism suite, and whether the student portal for CE is expected to be built in Q3 2027.

---

### Flag 2 — §4 Key User Flows: Full sidebar navigation structure now formally specified
**Changed text (before):** *(no sidebar taxonomy under §4)*
**Changed text (after):**
> Tabs: Surveys → Course Evaluations (Dashboard, Templates) + General Surveys (Dashboard, Templates) | Directory → Program Details (Academic Calendar, Term), Courses, Faculty and Staff, Students | Settings → Eval Window, Email templates, Reminder cadence, Rbac

**Why flagged:** CLEAR structural design spec now formally in the PRD. Matches the navigation discussed in Jun 9–10 transcripts. The sidebar structure is more detailed than what is currently implemented. No auto-applied (sidebar being rebuilt from spec).
**Suggested action:** When rebuilding `apps/pce/admin/components/app-sidebar.tsx`, use this taxonomy as the canonical nav structure. Settings sub-items (Eval Window, Email templates, Reminder cadence, RBAC) are new and not yet in the sidebar.

---

### Flag 3 — §4 Step 2: "Properties/Details" step marked "(removed)" from wizard
**Changed text (before):** "1. Properties/Details"
**Changed text (after):** "1. Properties/Details (removed)"
**Why flagged:** CLEAR wizard step removal. Step 2 wizard now starts at Scope/Courses (previously step 2). Wizard is not yet built — flag for when it is.
**Suggested action:** When building the Create Survey wizard, start at Scope/Courses as the first step. The wizard is now 3 steps: Scope/Courses → Survey Design → Communication (per-session PRD §4 and pce-decision-034 which removed Report Access).

---

### Flag 4 — Appendix B: New NIU→Anthology competitor case study added
**Changed text (before):** *(Appendix B had 2 articles)*
**Changed text (after):** New article added: "2/ How NIU switched from Blue to Anthology in 2026: NIU switches course evaluation platforms due to rising costs – Northern Star"
**Why flagged:** Informational competitor benchmark addition. No code action.
**Suggested action:** No action needed. This is market context for stakeholder presentations about PCE differentiation.

---

## 2026-06-11 — Flagged: PCE PRD — Monil Pokar (1 change)

### Flag 1 — §13a.1: CE/GS disambiguation element renamed from "survey switch in the user profile" to "navigation" (CLEAR — non-functional)
**Changed text (before):** "I have added a survey switch in the user profile to demonstrate the difference between CE and GS."
**Changed text (after):** "I have added a navigation to demonstrate the difference between CE and GS."
**Why flagged:** CLEAR rename of the CE/GS disambiguation UI element in Monil's design feedback note. Non-functional (§13 Feedback on Designs section) → flag only, no code auto-applied.
**Suggested action:** The prototype CE/GS switch has been redesigned from a profile-area switch to a "navigation" pattern. Confirm with Monil what "navigation" refers to — separate sidebar nav entries for CE vs General Surveys? A top-nav toggle? This determines the sidebar routing architecture between the two survey types in apps/pce/admin/components/app-sidebar.tsx.

---

## 2026-06-19 — Flagged: PCE PRD — Monil Pokar (6 new §13 items across 5 flags)

### Flag 1 — §13a items 6–9: Four open design questions added (AMBIGUOUS)
**Changed text (before):** *(§13a had 5 items)*
**Changed text (after):**
> 6. As a user I see a lot of tabs on the left side. Is there a better way to design the layout that reduces tabs/attention buttons so that User does not get cog load?
> 7. Do we not have a nav bar?
> 8. Can you also build the faculty persona experience as well?
> 9. What is the difference in Dashboard and Evaluations? Can we merge them?

**Why flagged:** AMBIGUOUS — all four are sentences ending in "?" inside the §13 design-feedback section. Item 6 revisits sidebar density (the §4 taxonomy has ~12 sidebar entries). Item 7 asks whether a top nav bar exists — this may conflict with the DS Sidebar-only layout. Item 8 requests the faculty-persona (Evaluated) experience — currently out of scope for the Phase 1 admin prototype. Item 9 asks about merging Dashboard and Evaluations — potentially collapsing two sidebar entries into one.
**Suggested action:** Review all four with Monil. (6) Confirm whether the current §4 sidebar taxonomy is final or needs pruning; (7) confirm whether a top-level nav bar is expected alongside the DS Sidebar; (8) clarify if faculty-persona view is Phase 1 or Phase 2; (9) confirm whether Dashboard and Evaluations should be merged before rebuilding sidebar in apps/pce/admin/components/app-sidebar.tsx.

---

### Flag 2 — §13b item 4: Shared templates screen question resolved (CLEAR — informational)
**Changed text (before):** *(§13b had 3 items)*
**Changed text (after):**
> 4. Are you recommeding we store PCE and general survey templates in one screen? (Done)

**Why flagged:** CLEAR — question is marked "(Done)", meaning the answer is confirmed. Implies PCE and General Survey templates are shown together on a shared screen (with filtering), rather than per-type separate routes. The §4 sidebar taxonomy lists separate "Templates" entries under each survey type — this (Done) note confirms the UI answer to that question has been designed.
**Suggested action:** When building the Templates page, confirm with Monil whether it's a single shared screen with a type filter (CE / General) or two separate routes. The (Done) suggests the prototype already answers this — check the Vercel prototype before building.

---

### Flag 3 — §13b item 5: Course type display label refinement (CLEAR)
**Changed text (before):** *(§13b had 3 items)*
**Changed text (after):**
> 5. Update the course type as classroom based, practice based, and Lab based

**Why flagged:** CLEAR directive. The 2026-06-17 run applied course type values as `'practice' | 'classroom' | 'lab'` in code (concise tokens). The PRD §4 Step 1 and §13b.5 both use the display labels "Classroom based, Practice Based, Lab based" (fuller form). The code values are correct but UI display labels in ToggleGroup, type selectors, and badge text may need the longer form.
**Suggested action:** Verify that apps/pce/admin/app/(app)/analytics/page.tsx ToggleGroupItems show "Classroom Based" / "Practice Based" / "Lab Based" (not just "Classroom" / "Practice" / "Lab"). Also ensure the template creation course-type selector uses the full labels when the template wizard is built.

---

### Flag 4 — §13c items 3–5: Survey wizard UX questions and directives (AMBIGUOUS + CLEAR)
**Changed text (before):** *(§13c had 2 items)*
**Changed text (after):**
> 3. There are two CTAs "Activate term" and "Push survey" I guess both doing the same thing. Do we need both?
> 4. Reflect the correct survey statuses in the mock data (refer Section 4 in this PRD)
> 5. Update the steps of a push survey flow as per section 4 – step 2 (updated post our discussion with Aarti)

**Why flagged:** Item 3 is AMBIGUOUS (sentence ending in "?"). Items 4 and 5 are CLEAR directives that were already applied/documented. Item 4: survey status labels updated in 2026-05-30 run (Scheduled/Live/Closed Pending Review/Closed Results Available). Item 5: wizard steps updated to 3-step flow per pce-decision-034 and the 2026-06-17 flag.
**Suggested action:** Item 3 — confirm with Monil whether "Activate term" and "Push survey" are separate actions (activate = enable a term for CE; push = distribute surveys to courses in that term) or redundant CTAs. If separate, both should remain; if redundant, remove one before building the wizard. Items 4 and 5 are already applied/documented — no new action required.

---

### Flag 5 — §13d (NEW SECTION): Setup sub-tabs formally specified (CLEAR — non-functional)
**Changed text (before):** *(§13d did not exist)*
**Changed text (after):**
> 13d. Setup
> Following sub tabs are relevant to us (remove the rest):
> a. Communication: Eval window (anchored around start/end date of term), Email template, Reminder template, Reminder cadence
> b. Evaluation rules: Likert N, Comment moderation (on/off), Threshold on responses to release results

**Why flagged:** CLEAR new spec for the Settings/Setup section. Two categories: Communication (4 items: Eval window anchored to term dates, Email template, Reminder template, Reminder cadence) and Evaluation rules (3 items: Likert N, Comment moderation toggle, Response threshold). "Remove the rest" signals the prototype has extra items outside this list. Note §4 sidebar taxonomy only listed: Eval Window, Email templates, Reminder cadence, Rbac — §13d expands this with Reminder template and Comment moderation while notably omitting RBAC from Setup (possibly moved elsewhere).
**Suggested action:** When building the Setup/Settings section: implement exactly these 7 sub-tab items under Communication and Evaluation rules. Remove any extra sub-tabs from the current prototype. Confirm with Monil whether RBAC (listed in §4 sidebar taxonomy under Settings) is still a Setup sub-tab or has moved.

---

### Flag 6 — §13e (NEW SECTION): Directory → Analytics deep-links required (CLEAR — non-functional)
**Changed text (before):** *(§13e did not exist)*
**Changed text (after):**
> 13e. Directory
> We need to connect each directory to its respective analytics page like
> a. Terms to be connected to "by term" view (refer product prototype for better visualization)

**Why flagged:** CLEAR navigation directive — each directory entry should deep-link to its corresponding analytics view. Specifically: the Terms directory page → "by term" analytics view (longitudinal analytics entry point 1, per pce-decision-024). The word "like" implies additional connections (Faculty → Faculty analytics, Courses → Course history analytics per pce-decision-025) are also expected but not enumerated.
**Suggested action:** When building the Directory → Program Details → Term page, add a row-level navigation action that opens the corresponding "by term" analytics view. Similarly anticipate Faculty directory → Faculty leaderboard analytics, Courses directory → Course history analytics. No code action now — flag for when directory pages are built.

---

## 2026-06-22 — Resolved: PCE PRD — Monil Pokar (7 §13 items marked Done)

Today's fresh PRD fetch shows the following items from prior flags now marked "(Done)". These are resolved and require no further action unless stated otherwise.

### Resolved 1 — §13a.6: Sidebar tab density concern (Done)
**Originally flagged:** 2026-06-19 — AMBIGUOUS ("As a user I see a lot of tabs on the left side. Is there a better way to design the layout that reduces tabs/attention buttons?")
**Resolution:** Marked "(Done)" in PRD. Sidebar density redesign resolved in the prototype. Before rebuilding `apps/pce/admin/components/app-sidebar.tsx`, confirm the final pruned sidebar taxonomy with Monil's prototype.

### Resolved 2 — §13a.8: Faculty persona experience (Done)
**Originally flagged:** 2026-06-19 — AMBIGUOUS ("Can you also build the faculty persona experience as well?")
**Resolution:** Marked "(Done)" in PRD. Scope decision for the faculty (Evaluated) persona experience has been resolved. Confirm with Monil whether faculty persona is in Phase 1 scope or deferred before building.

### Resolved 3 — §13a.9: Dashboard vs Evaluations merge (Done)
**Originally flagged:** 2026-06-19 — AMBIGUOUS ("What is the difference in Dashboard and Evaluations? Can we merge them?")
**Resolution:** Marked "(Done)" in PRD. The decision on whether to merge or keep Dashboard and Evaluations as separate sidebar entries has been made. Confirm current sidebar taxonomy from prototype before building.

### Resolved 4 — §13b.5: Course type display labels (Done)
**Originally flagged:** 2026-06-19 — CLEAR ("Update the course type as classroom based, practice based, and Lab based")
**Resolution:** Marked "(Done)" in PRD. Display labels applied. Verify `apps/pce/admin/app/(app)/analytics/page.tsx` ToggleGroupItems show "Classroom Based" / "Practice Based" / "Lab Based" (not just "Classroom" / "Practice" / "Lab"). Also verify template creation course-type selector when built.

### Resolved 5 — §13c.3: "Activate term" vs "Push survey" CTA redundancy (Done)
**Originally flagged:** 2026-06-19 — AMBIGUOUS ("There are two CTAs 'Activate term' and 'Push survey' I guess both doing the same thing. Do we need both?")
**Resolution:** Marked "(Done)" in PRD. The CTA decision has been made. Confirm with Monil which CTA(s) remain in the final wizard design (check the Vercel prototype) before building the push-survey wizard at `apps/pce/admin/app/(app)/surveys/push/`.

### Resolved 6 — §13c.4: Reflect correct survey statuses in mock data (Done)
**Originally flagged:** 2026-06-19 — CLEAR directive (status labels were already applied in the 2026-05-30 run).
**Resolution:** Marked "(Done)" in PRD. No further action required.

### Resolved 7 — §13c.5: Update push survey wizard steps per §4 (Done)
**Originally flagged:** 2026-06-19 — CLEAR directive (already applied via pce-decision-034 and the 2026-06-17 flag).
**Resolution:** Marked "(Done)" in PRD. No further action required.

---
