# v2 traceability

Maps each v2 screen to the requirement IDs it will satisfy and to the new requirements it adds. Source of truth for IDs: `docs/source/requirements.extracted.txt`. Validate with `node .claude/hooks/check-req-ids.mjs`.

**How to read it.** "Requirement IDs" lists IDs the finished screen is meant to cover. "Coverage now" says how much exists today. "New requirements (status: proposed)" lists capabilities the prototype adds that no requirement states; each is `[PROPOSED]` and none is a requirement or a decided `OD-*`. The step list and IDs are generated from `admin/lib/v2/scenario.ts`, and a test (`tests/v2/scenario.test.ts`) fails if a step cites an ID that is not in the requirements file.

Coverage values: **None** (placeholder only), **Seed** (data for it exists in the store), **Built** (real screen, tested), **Verified** (axe, focus walk and screenshots pass).

## Foundation screens (Stage 0)

| Screen | Route | Requirement IDs satisfied | Coverage now | New requirements (status: proposed) |
|---|---|---|---|---|
| Scenario overview | `/v2` | none (navigation and demo data only) | Built, Verified | Scenario menu and Reset demo `[PROPOSED]` |
| Role home (x5) | `/v2/<role>` | none | Built, Verified | Role switcher `[PROPOSED]` |
| Shared store and seed | `lib/v2` | none directly; seeds data for AE-04 states, RV-03 versions, CM-03 mapping levels | Built | Shared mock store `[PROPOSED]` |

## Stage 1 screens (admin setup, built)

Status: **Built** (real screens, unit tests, Playwright flow `docs/v2/verify/stage1.e2e.mjs`). Not **Verified**: dark mode, forced colors, screen reader and visual-diff against localhost:4000 were not run.

| Screen | Route | Requirement IDs satisfied | New requirements (status: proposed) |
|---|---|---|---|
| Add skills: starter libraries | `/v2/admin/starter-library` (tab 1) | SL-01 (conflicts as written, see D2), IM-09, IM-10, IM-11, IM-12 (copy path) | Four specialty starter libraries, admin-copied and editable `[PROPOSED]` |
| Add skills: import from a file | `/v2/admin/starter-library` (tab 2) | IM-01, IM-02 (PDF and text exercised; Word and Excel go through the same extractor but are not driven in the demo), IM-03, IM-04, IM-05 (edit, rename, discard; merge, split and add are not built), IM-06 (skip or keep both; replace not offered), IM-07, IM-08, IM-09, IM-11, IM-13 | Rule-based proposal standing in for AI reading `[PROPOSED]`; proposal never sets a model (OD-12 untouched) |
| Your library (Edit, Configure) | `/v2/admin/starter-library` | IM-09, IM-10, IM-11 | Edit skill after copy `[PROPOSED]` |
| Configure wizard, steps 1 to 7 | `/v2/admin/configure-skill` | SC-01, SC-02 (model chosen explicitly once any model exists; binary pre-selected only for a skill with none, see D3), SC-03, SC-04, SC-08, SC-09, SC-10 (total number only; minimum at each level is not built), SC-11, SC-12, SC-15 (not built: self-evaluation and approval toggles), SC-16, SC-17, IM-14 (copy half) | Last-N window; distinct evaluators; minimum level; simulation cap and allow list; lab check-off and practice trials; evaluator credential, years and training; attempt limit, days between attempts, retake score cap, auto remediation; event-based re-validation with optional calendar expiry (off); overall supervision rating beside a checklist; live strength hint `[PROPOSED]` |
| Review and publish, step 8 | `/v2/admin/validate-publish` | SC-18, SC-19, IM-09 | Publish blocked until clean; issue links to the field `[PROPOSED]` |
| Map skills to NURS 350 | `/v2/admin/map-courses` | CM-01 (one offering), CM-03, CM-04, CM-05, CM-06 (level stored per course id), IM-09, SC-12 (in the coverage reading) | Coverage warnings: no mandatory skills, mandatory skill not in use, mandatory skill needing a setting the course lacks, mandatory skill with no qualified evaluator `[PROPOSED]` |

Scenario steps 2 and 3 cite SC-15; Stage 1 does not build it (see the Out of scope line of `V2-01b`). Steps 1 to 4 keep their planned IDs in `scenario.ts`; this table is the claim of coverage.

## Stage 2 screens (student mobile and offline, built)

Status: **Built** (real screens, unit tests in `tests/v2/student.test.ts`, `sync.test.ts`, `qr.test.ts`, Playwright flow `docs/v2/verify/stage2.e2e.mjs`, screenshots and axe in `docs/v2/screenshots`). Not **Verified**: dark mode, forced colors, screen reader, a real device and visual-diff against localhost:4000 were not run. Contracts: `V2-02a` to `V2-02d`.

| Screen | Route | Requirement IDs satisfied | New requirements (status: proposed) |
|---|---|---|---|
| Student home, what is left | `/v2/student` | ST-01 (mapped skills, mandatory, progress per skill against the published rule), SC-12 (lab and simulation never satisfy a named setting, stated on the card), AR-06 (awaiting approval excluded), IM-09 (skills not in use listed as not open, never offered) | Next best action; progress dots; prerequisite checklist on the card; "not open yet" list; mobile bottom navigation; always-visible sync strip `[PROPOSED]` |
| Log skills, 4 steps | `/v2/student/pick-and-rate` | ST-02 and CM-05 (an unmapped published skill can be logged), ST-04, ST-05, ST-06, ST-07, ST-10, ST-11 (where the skill has a scale; SC-15 toggle itself not built), ST-12 (one note per skill entry, an [INFER] reading), ST-13, SC-08 (the skill's own level names), SC-11 | Saved-first drafts (`logDraft`); prerequisite gating by lab check-off, practice trials and prerequisite skills; a lab or simulation entry is a practice trial that is not sent for sign-off `[PROPOSED]` |
| Ask for sign-off, 4 ways | `/v2/student/request-signoff` | ST-08 (roles by setting and by the skill; told why), ST-09 (pick from those on record; naming an unrecorded lab instructor is not built), ST-10, ST-13, EV-01 (every method reaches an evaluator with no account), EV-02, EV-05 (one request, several skills), AR-01 (a paper submission appears in the review queue), RV-05 (a request in flight cannot be sent again), SC-16 | QR code (real, scannable); hand over the phone (handover mode); one link to several qualified evaluators, first to finish completes it; photo of a signed paper form to review; offline-created request `[PROPOSED]` |
| Sync and offline, conflict | `/v2/student/offline-sync` | none (the requirements do not cover offline; ST-13 and RV-05 respected) | Offline queue with Queued, Synced, Failed, Conflict; retry one and all; conflict resolution (keep mine, keep theirs, keep both where valid); demo toggles for offline, signed out and update pending; no login loop and no update-required wall `[PROPOSED]` |
| Your record | `/v2/student/history` | SH-01 (attempts in order, by attempt number), SH-02 (explicit outcome, who it is with), SH-03 (the failed rule in plain words), SH-04 (counts), SH-05 (progress per named setting), SH-06 (every course; narrowing is stated, not built, because every v2 evaluation is NURS 350), SH-07 (partial: outcome, evaluator, setting and all versions; the store holds no evaluator responses) | Versions shown with what counted `[PROPOSED]` |

## Story steps (14)

Rows for steps 1 to 4 are built in Stage 1 and steps 5 to 7 in Stage 2 (tables above). The rest are placeholders until their stage. "Requirement IDs" is the plan, not a claim of coverage.

| # | Screen | Route | Requirement IDs (planned) | Coverage now | New requirements (status: proposed) |
|---|---|---|---|---|---|
| 1 | Copy a specialty starter library | `/v2/admin/starter-library` | SL-01, IM-01, IM-09, IM-10, IM-11, IM-14 | Built (IM-14 copy half is on step 2) | Specialty starter libraries `[PROPOSED]`; conflicts with SL-01 as written, see D2 |
| 2 | Configure IV catheter insertion | `/v2/admin/configure-skill` | SC-01, SC-02, SC-08, SC-10, SC-11, SC-12, SC-15, SC-16, SC-17 | Built (SC-15 not built) | Last-N achievement rule ("4 of last 5"); simulation share cap; prerequisites; evaluator qualification; failure path; event-based revalidation; binary as pre-selected model `[PROPOSED]` |
| 3 | Fix validation errors, then publish | `/v2/admin/validate-publish` | SC-18, SC-19, IM-09 | Built | none beyond the requirements |
| 4 | Map skills to NURS 350 | `/v2/admin/map-courses` | CM-01, CM-03, CM-04, CM-05, CM-06 | Built | Coverage warnings `[PROPOSED]` |
| 5 | See what is left, pick two skills and self-rate | `/v2/student/pick-and-rate` | ST-01, ST-04, ST-05, ST-06, ST-11, ST-12, ST-13 | Built (home is `/v2/student`) | Mobile bottom navigation; prerequisite gating; next best action `[PROPOSED]` |
| 6 | Ask for sign-off | `/v2/student/request-signoff` | ST-08, ST-09, ST-10, EV-01 | Built | QR sign-off; hand the phone to the evaluator; photo of a signed paper form that goes to review `[PROPOSED]` |
| 7 | Work offline and resolve a conflict | `/v2/student/offline-sync` | none | Built | Offline queue (Queued, Synced, Conflict); conflict resolution screen `[PROPOSED]` |
| 8 | Evaluate both skills in one pass | `/v2/preceptor/preceptor-evaluation` | EV-01, EV-03, EV-04, EV-05, EV-06, EV-07 | Seed | "Not yet, feedback only" outcome; confidential concern flag (faculty only); credential attestation `[PROPOSED]` |
| 9 | See the outcome, remediation and version history | `/v2/reviewer/outcome-remediation` | RV-03, SH-02, SH-03, AE-01, AE-03, AE-04 | Seed | Remediation plan on fail; reopen after sign-off with version history `[PROPOSED]`; remediation is outside section 14 of the requirements, see D2 |
| 10 | Clear the review queue | `/v2/reviewer/review-queue` | AR-01, AR-02, AR-03, AR-04, AR-05, AR-06, RV-02, RV-04 | Seed | Bulk approve; reassign a stalled request `[PROPOSED]` |
| 11 | Verify the program record | `/v2/director/director-verification` | AE-03, RP-07 | Seed | Program director verification `[PROPOSED]` |
| 12 | Read cohort reports | `/v2/admin/reports` | RP-01, RP-02, RP-03, RP-05, RP-06, RP-07, RP-10 | Seed | Cohort heatmap; behind expected pace; observations and distinct raters per skill with single-rater flag; rater comparison; simulation share; tamper-evident signed PDF per student or cohort `[PROPOSED]` |
| 13 | Share the verified record | `/v2/student/verified-record` | SH-01, SH-06, SH-07, RP-10 | Seed | Share as PDF or CLR 2.0 `[PROPOSED]` |
| 14 | Record a lab session for a group | `/v2/preceptor/lab-batch-grid` | EV-02, EV-05, SC-12, ST-05 | Seed | Lab batch grid (cells cycle Met, Not met, Not yet); absent student handling `[PROPOSED]`; see OD-19 |

## Requirements not yet planned in any v2 step

These are requirement IDs the v2 story does not exercise, so a reader does not assume the prototype covers them: SL-02 to SL-11 (library fields, categories, tags, settings, search), SC-05 to SC-07, SC-13, SC-14 (qualification rule detail, student fields, narrative feedback), CM-02, CM-07, CM-08, ST-02, ST-03, ST-07, RV-01, RV-05, RV-06, SH-04, SH-05, RP-04, RP-08, RP-09, RP-11, AE-02, AE-05 to AE-08. Coverage for these stays with the v1 build (`docs/strategy/04-requirements-traceability.md`).

## Update rule

When a stage lands, change "Coverage now" for its rows, re-run the ID validator, and add any new proposed capability to the "New requirements" column. Do not move a proposed item into the "Requirement IDs" column.
