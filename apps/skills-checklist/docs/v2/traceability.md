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

## Story steps (14)

All rows are placeholders until their stage. "Requirement IDs" is the plan, not a claim of coverage.

| # | Screen | Route | Requirement IDs (planned) | Coverage now | New requirements (status: proposed) |
|---|---|---|---|---|---|
| 1 | Copy a specialty starter library | `/v2/admin/starter-library` | SL-01, IM-01, IM-09, IM-10, IM-11, IM-14 | Seed | Specialty starter libraries `[PROPOSED]`; conflicts with SL-01 as written, see D2 |
| 2 | Configure IV catheter insertion | `/v2/admin/configure-skill` | SC-01, SC-02, SC-08, SC-10, SC-11, SC-12, SC-15, SC-16, SC-17 | Seed | Last-N achievement rule ("4 of last 5"); simulation share cap; prerequisites; evaluator qualification; failure path; event-based revalidation; binary as pre-selected model `[PROPOSED]` |
| 3 | Fix validation errors, then publish | `/v2/admin/validate-publish` | SC-18, SC-19, IM-09 | Seed | none beyond the requirements |
| 4 | Map skills to NURS 350 | `/v2/admin/map-courses` | CM-01, CM-03, CM-04, CM-05, CM-06 | Seed | Coverage warnings `[PROPOSED]` |
| 5 | See what is left, pick two skills and self-rate | `/v2/student/pick-and-rate` | ST-01, ST-04, ST-05, ST-06, ST-11, ST-12, ST-13 | Seed | Mobile bottom navigation `[PROPOSED]` |
| 6 | Ask for sign-off | `/v2/student/request-signoff` | ST-08, ST-09, ST-10, EV-01 | Seed | QR sign-off; hand the phone to the evaluator; photo of a signed paper form that goes to review `[PROPOSED]` |
| 7 | Work offline and resolve a conflict | `/v2/student/offline-sync` | none | Seed | Offline queue (Queued, Synced, Conflict); conflict resolution screen `[PROPOSED]` |
| 8 | Evaluate both skills in one pass | `/v2/preceptor/preceptor-evaluation` | EV-01, EV-03, EV-04, EV-05, EV-06, EV-07 | Seed | "Not yet, feedback only" outcome; confidential concern flag (faculty only); credential attestation `[PROPOSED]` |
| 9 | See the outcome, remediation and version history | `/v2/reviewer/outcome-remediation` | RV-03, SH-02, SH-03, AE-01, AE-03, AE-04 | Seed | Remediation plan on fail; reopen after sign-off with version history `[PROPOSED]`; remediation is outside section 14 of the requirements, see D2 |
| 10 | Clear the review queue | `/v2/reviewer/review-queue` | AR-01, AR-02, AR-03, AR-04, AR-05, AR-06, RV-02, RV-04 | Seed | Bulk approve; reassign a stalled request `[PROPOSED]` |
| 11 | Verify the program record | `/v2/director/director-verification` | AE-03, RP-07 | Seed | Program director verification `[PROPOSED]` |
| 12 | Read cohort reports | `/v2/admin/reports` | RP-01, RP-02, RP-03, RP-05, RP-06, RP-07, RP-10 | Seed | Cohort heatmap; behind expected pace; observations and distinct raters per skill with single-rater flag; rater comparison; simulation share; tamper-evident signed PDF per student or cohort `[PROPOSED]` |
| 13 | Share the verified record | `/v2/student/verified-record` | SH-01, SH-06, SH-07, RP-10 | Seed | Share as PDF or CLR 2.0 `[PROPOSED]` |
| 14 | Record a lab session for a group | `/v2/preceptor/lab-batch-grid` | EV-02, EV-05, SC-12, ST-05 | Seed | Lab batch grid (cells cycle Met, Not met, Not yet); absent student handling `[PROPOSED]`; see OD-19 |

## Requirements not yet planned in any v2 step

These are requirement IDs the v2 story does not exercise, so a reader does not assume the prototype covers them: SL-02 to SL-11 (library fields, categories, tags, settings, search), IM-02 to IM-08 and IM-12, IM-13 (import review detail), SC-03 to SC-07, SC-09, SC-13, SC-14 (model details), CM-02, CM-07, CM-08, ST-02, ST-03, ST-07, RV-01, RV-05, RV-06, SH-04, SH-05, RP-04, RP-08, RP-09, RP-11, AE-02, AE-05 to AE-08. Coverage for these stays with the v1 build (`docs/strategy/04-requirements-traceability.md`).

## Update rule

When a stage lands, change "Coverage now" for its rows, re-run the ID validator, and add any new proposed capability to the "New requirements" column. Do not move a proposed item into the "Requirement IDs" column.
