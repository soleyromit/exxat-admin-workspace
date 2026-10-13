# 07 — Gaps, Contradictions, Prototype Defects, and the "Do Not Assume" List

## A. Prototype defects (observed; reproduce with the scripts)

| ID | Defect | Repro | Evidence | Severity | Why it matters |
|---|---|---|---|---|---|
| **DEFECT-01** | Stale evaluator kept after switching Clinical → Lab; confirmation labels a *preceptor* as "(clinical faculty)" | Student View → select Foley → Send for review → Lab / Simulation → fill date → Send request | Banner: "Sent 1 skill to A. Whitfield, RN (clinical faculty) for evaluation — lab / simulation." (`screens/22`) | High | Violates ST-08 (role constrained by setting); an invalid evaluator/role combination was sent |
| **DEFECT-02** | Confirmation omits clinical setting & location | Same flow, clinical | ST-13 requires confirmation of "in which setting and location" | Med | Student can't verify what was recorded |
| **DEFECT-03** | Admin "Return to preceptor" vs REQ "back for correction" and student "Revise and resend" | Review & Approve → Return | Banner: "Returned … to the preceptor" vs history: "please correct and resend" | High | Decides who owns the fix (OD-16) |
| **DEFECT-04** | Three skill states, not four; "Not met" merges no-evidence & failed | Overview By student; student drill "Not Started" | Footer: "Not met includes skills with no qualifying evidence yet" | High | AE-04/OD-03 |
| **DEFECT-05** | Evaluator is shown student's achievement status after submit | Preceptor Evaluation → submit | Table column "Progress / Status: 4 / 3 qualifying evaluations · Achieved" | Med | Data exposure; OD-17 |
| **DEFECT-06** | Evaluator page is rendered in the admin shell with full sidebar | Preceptor Evaluation | Sidebar visible | Low (demo device) | Real surface must be shell-free |
| **DEFECT-07** | Wound Care requires "1 in Inpatient · 1 in Emergency" but student card shows only "4 / 4 demonstrations · In Progress" (4/4 yet not Achieved, no reason) | Student View (Olivia Martin, NURS 350) | `screens/19` | Med | SH-05 and SH-03 absent: student cannot tell why 4/4 isn't achieved |
| **DEFECT-08** | Seed dates internally inconsistent (completion date after/before submission) | History drawer | Attempt 4: submitted 2026-07-04, completion 2026-04-07 | Low | Don't derive rules from them |
| **DEFECT-09** | Duplicate display names in Overview ("Owen Ashford" ×2) | Overview By student | `screens/01` | Low | Real tables need an identifier |

DEFECT-07 is a *good catch about the requirements as well*: "4/4 but not achieved" will be common and is exactly the SH-03/SH-05 moment.

## B. Contradictions between sources

| # | Sources | A says | B says | Resolution |
|---|---|---|---|---|
| C-1 | REQ SC-02 vs `[CALL 09-23]` | Model must be chosen, no default | Call (garbled transcript) describes a simpler met/unmet setup; implies met/unmet is the baseline | Follow REQ: no default model; *labels* default to Met/Unmet |
| C-2 | `[CALL 03-05]` vs REQ | Skills "not tied to specific placements or courses"; "student-initiated" | REQ keeps course mapping as expectation | Compatible: mapping ≠ eligibility `[CM-05]` |
| C-3 | `[CALL 09-23]` "mandatory or recommended" | Two sections *mandatory / recommended* | REQ: *mandatory / non-mandatory* | Use REQ terms; PROTO uses "Non-mandatory" |
| C-4 | `[CALL 09-23]` activation flow | Call: skills cannot be activated until configured, then activated | REQ: unconfigured cannot be mapped/submitted; no explicit activation | OD-15 |
| C-5 | `[CALL 09-23]` upload "AI scans" | AI interpretation | REQ IM-13: always human-confirmed, draft only | REQ governs. PROTO shows no AI badge; **do not claim AI accuracy in UI copy** |
| C-6 | `[CALL 09-23]`: skill configuration "will not vary from course to course" | Config is per skill | Consistent with REQ | — |
| C-7 | PROTO tabs vs REQ | Library has Categories/Tags/Settings/Lab Instructors tabs | REQ lists these as lists, no IA | PROTO IA is a suggestion |
| C-8 | `[CALL 09-23]` "frequency can be rotation or academic-year based" | Frequency scoped by time/rotation | REQ AE-03: criteria on the whole record | OD-22 |

## C. Gaps in the requirements doc (things a designer will hit)

| # | Gap | Impact | Action |
|---|---|---|---|
| G-1 | §15 "Sources and external context" is in the contents but missing from the body | Cannot cite accreditation sources | Ask Sankalp for the missing section; don't invent citations |
| G-2 | No success metrics, no personas named | Hard to prioritise | Use proposals in `01-problem-and-why.md §7` once agreed |
| G-3 | No requirement for batch evaluation (students × skills) though no source lists it as a requirement; `[INFER]` from nursing batch-sign-off practice, validate with Sarah | Nursing workflow gap | OD-19 |
| G-4 | No requirement for hierarchical skills | Programs with parent/sub-activities (Abdomen exam→10) `[CALL 03-05]` | OD-20 |
| G-5 | No delegator-link lifecycle (expiry/reuse/revoke/resend) | Stalled evidence | OD-18 |
| G-6 | Student drafts/auto-save unspecified | Persona risk | OD-14 |
| G-7 | Notifications explicitly out of scope, but SH-02 requires "waiting, identifying who" | Students need nudging; keep it in-product | Defer; design resend |
| G-8 | Roles/permissions for *admin* sub-roles (who may approve? configure?) | Governance | Ask; REQ says only "administrator" |
| G-9 | Audit trail of config changes not required | AE-02 re-applies rules; admins will want "who changed what" | Propose, don't build |
| G-10 | Cohort/group/term entities come from other Prism modules; REQ assumes them | Dependency | Verify with Curriculum/Courses data owners |
| G-11 | Accessibility, performance, localisation not mentioned | — | Use workspace defaults |
| G-12 | Competency boundary (OD-02) | Duplicates | Workshop with Vishaka + Sarah |

## D. Do-not-assume list (hard stops for any agent or designer)

1. Do **not** pre-fill or suggest a skills list, categories or a nursing taxonomy. `[SL-01]`
2. Do **not** default the evaluation model. `[SC-02]`
3. Do **not** let an unconfigured skill appear in a student's selector or a mapping list. `[IM-09]`
4. Do **not** edit a completed evaluation. `[RV-03]`
5. Do **not** let mapping restrict submission. `[CM-05]`
6. Do **not** give preceptors accounts or a login wall. `[EV-01]`
7. Do **not** let lab evidence satisfy a clinical setting minimum. `[SC-12]`
8. Do **not** imply Prism provides a skills library or accreditation-endorsed list. `[§1.7]`
9. Do **not** design remediation, notifications, expiry, patient-encounter linkage, or Evaluations migration. `[§14]`
10. Do **not** show scores/Likert by default (on the call: skills are typically not scored; score-based is "less commonly used"). `[CALL 09-23]`
11. Do **not** use red for score/rating viz (Aarti). `[memory]`
12. Do **not** build QR codes, heatmaps, preceptor-consistency reports, or learning-contract linkage in v1 — raised on calls, not in REQ.
13. Do **not** treat any count in `source/screens` as real data; they are generated.
14. Do **not** claim "matches the prototype" as acceptance. Acceptance = REQ coverage + DS conformance + states.

---

## E. Additions from the raw Granola review (2026-10-09)

Sources: `strategy/08-raw-granola-findings-oct-2026.md` and the three `research/meetings/2026-10-09-raw-review-*.md` files. Existing rows above are unchanged. Each new item names both sources. **"Needs Sankalp"** means the call belongs to the requirements owner; designers must not resolve it. Speaker attribution on these calls is weak ("Aarti, inferred").

### E1. New contradictions (continue C-1..C-8)

| # | Sources | A says | B says | Resolution | Needs Sankalp |
|---|---|---|---|---|---|
| C-9 | REQ 1.4 and README fact 3 vs `[CALL 10-08 Aarti]`, `[CALL 10-09]`, `[CALL 09-30..10-02 leaders]` | A skill is narrower than a competency and must not inherit competency scoring or reporting | Skills, competencies, EPAs, procedures and essentials are "one list"; "we just figure out ... How to extend? The competency." (Aarti inferred, moderate, hands it to Yash and says alignment is needed). Romit lists CLO/SLO and CASA inside the umbrella | REQ governs. Not a decision on the other side. Keep the nullable seam; do not rename nav or merge the model. OD-02, OD-28 | **Yes** (with Yash, Aarti) |
| C-10 | REQ section 14 (patient-encounter linkage out of scope) vs `[CALL 10-08 Aarti]` | Out of scope | "Or it is coming from a patient log." as an input source | Weak (one item in a list). Keep out of v1; ask whether this is the section 14 feature or something lighter. OD-31 | **Yes** |
| C-11 | REQ model (evidence = a student submission evaluated by an evaluator, RV, ST, EV) vs `[CALL 10-08 Aarti]` | Every achievement starts with a student send-for-review | Evidence can arrive from an assessment question, a whole assessment minimum score, a course grade or pass, an end-of-rotation form question, a standalone FAST form; sign-off may be "automatic". Moderate, described as how real programs work | REQ governs for v1. Docs previously missed this. Named seam only. OD-31, OD-37 | **Yes** |
| C-12 | REQ CM-05 (mapping is expectation, not eligibility) vs `[CALL 10-08 Aarti]` (internal tension in one call) | "every course can only have a soft mapping. Not a hard mapping." | "If you pass the course, you pass this competency." (KASA/SLP, nutrition) | Model course-pass as a skill-level auto-evidence rule, not a mapping property; mapping stays soft. OD-32 | **Yes** |
| C-13 | REQ SC-02 (four models, one chosen, no default) vs `[CALL 10-08 Aarti]` | Each skill uses one of the four models | Students-say-so-alone, PA "no concept of met requirements" (minimum procedure counts), 3 signatures from 3 distinct preceptors, "I observed 10, I assisted in 2, and I performed 5" | Partly covered by SC-10 (per-level minimums). Distinct-signer count and no-evaluator paths are not expressible. Treat as model-fit gap. OD-33, OD-37 | **Yes** |
| C-14 | brief-v2 and variant A / hybrid IA vs `[CALL 10-08 Aarti]` | Understand (Attainment) is a destination separate from Run (Reviews) | "My report should be my launch page." and no "separate place where they have to go to trigger" (firm, repeated) | Design conflict, not a REQ conflict. Variant structure must change or the trigger must live in Attainment rows. OD-29 | No (design), but confirm with Aarti |
| C-15 | `[CALL 10-09]` (Romit) vs `[CALL 09-23]`, `strategy/01` section 4, REQ section 14 | Existing FAST formats "going to be the same. It's just the landing page" | A standardised form generated from configuration; "we don't want schools to like have like a lot of different templates"; migration from Evaluations out of scope | Two incompatible readings of the form layer. Use `EvaluationConfig` for design; add an adapter point. OD-36 | **Yes** (with the FAST team) |
| C-16 | REQ SC-11, SC-12 and OD-22 vs `[CALL 10-08 Aarti]` | Per-setting minimums count only evidence from that setting; lab never satisfies a clinical minimum | "It doesn't matter whether they learn in classroom, labs, clinics." and rotation is "just FYI" on the main report | REQ governs. Headline report can hide the setting axis; rules cannot ignore it. Raise as a hard-stop pressure. OD-22, OD-25 | **Yes** |
| C-17 | `CLAUDE.md` and README (a product with Admin and Student apps) vs `[CALL 10-08 Vaibhav]`, `[CALL 10-08 Aarti]`, V3d | Standalone product, ports 3007 and 3008 | "an independent module but also integrated"; "Only part of student success"; modules independently sellable | Nothing in the REQ. Entitlement state and label are undefined. OD-34 | **Yes** |
| C-18 | `strategy/01` and OD-05 vs `[CALL 09-30..10-02 leaders]` | Learning Contracts ships "Ankit, Q4"; build Q1 | Social work learning contracts and the skills checklist are both Q1 candidates; "Q1, early Q1, late Q1." | Quarter system unclear. Verify. Also verify against the "some version by the last week of October" target (V2). OD-23 | **Yes** |
| C-19 | Workspace rule (no red for score or rating, Aarti) vs `[CALL 10-05]` | No red | Student 360 prototype: red for failing the accreditor requirement, orange for failing the program | Do not adopt red. Use non-red vocabulary. OD-27 | No |
| C-20 | README (nursing first, nothing nursing-specific) vs `[CALL 10-08 Vaibhav]` | Nursing first | Collaborators assume social work (learning contract) or nursing interchangeably | Confirm explicitly. OD-38 | Confirm |

### E2. New gaps (continue G-1..G-12)

| # | Gap | Impact | Action |
|---|---|---|---|
| G-13 | No program-level requirement object (for example a total of 100 skills, category quotas, accreditor level vs program level). Hours explicitly out | A candidate definition of "behind" and the student's "overall where do they stand" has no home | OD-30, OD-27 |
| G-14 | No account of advisors or a student-success timeline consuming the student-level report | Read-scope and FERPA question; also a consumer of the report contract | OD-25 note; ask Sankalp; no v1 feature |
| G-15 | No evidence-source attribute or per-evaluation record for automatic evidence | Ledger design (AE-01) assumes a human evaluation | OD-31 |
| G-16 | No "Skills not enabled for this program" state; no market label decision ("checkoff" vs "Skills Tracking") | Entitlement and copy | OD-34; glossary in `ux/09` |
| G-17 | Platform couples evaluations, logs and time off to a placement (workaround: a university site); placement edits can delete activities; "no placement" has no home | Unmapped lab and class evidence | Skills evidence must not hang off a placement lifecycle; ask Sankalp how lab evidence is located (REQ SL-08, ST-07 already cover instructor and setting) |
| G-18 | OD-05 has no merge story for student-typed evaluators | Duplicates | OD-05 evidence note |
| G-19 | Whether student-visible results need a publish step (competency has bulk publish) | Student visibility rule | Ask Sankalp |
| G-20 | Manual path with AI off is not specified for import and configure (AI is per-program opt-in) | IM-13 covers human confirmation, not an AI-off mode | OD-12 note; check `typesafe-import-design.md` |
| G-21 | Prism front end is Angular; the Next/React build is a design and behaviour reference only | Hand-off expectation | State in `build/01-build-plan.md` hand-off notes (not done here) |
| G-22 | No per-domain, per-university inventory of existing set-ups; Excel pending (I1, I2) | Any "common set-up" claim is unevidenced | Re-read `08` after the Excel lands; ask Ankit(a) for nutrition, PA, SLP, radiation therapy examples |
| G-23 | The Sep 22 "Meeting with Aarti" has no transcript in Granola (null); the Oct 5 interview was read only in parts | Possible decisions unseen | Ask Romit for any other record |

### E3. Do-not-assume additions (continue D.1..D.14)

15. Do **not** treat "one list" (skills, competencies, EPAs) as decided; build the seam only. `[OD-28]`
16. Do **not** build a program requirements, hours, or accreditation-form UI. `[OD-30, OD-35, §14]`
17. Do **not** let a course pass, a grade or an assessment score create a skill achievement in v1. `[OD-31, OD-32, CM-05]`
18. Do **not** merge the Attainment and Reviews destinations or split them further until OD-29 is answered; the student-level page must carry both counts and the review trigger.
19. Do **not** use red/orange accreditor-vs-program status (see C-19).
20. Do **not** quote any Oct 8-9 line to a named person except "Aarti, inferred" or "Romit"; Granola has no diarization.

### E4. Statements that could pressure a hard stop

Listed in full in `strategy/08` section 15: "enabled by default" (SL-01), "students saying is enough" (SC-02), course-pass grants (CM-05, IM-09), preceptor edits of prefilled answers and grade changes (RV-03), "it doesn't matter where they learn it" (SC-12), patient log, hours, FARMS form, advisor interventions and the platform reminder engine (section 14). All hard stops stand.
