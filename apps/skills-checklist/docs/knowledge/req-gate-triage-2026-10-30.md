# Req-Gate Triage -- 2026-10-30

Run: node scripts/lab-req-gate.mjs --report --json=/tmp/reqgate.json --workers=3
Server: http://localhost:3017
Duration: 391 s, 329 automated checks, 4 manual
check-req-ids hook: OK -- 1 file(s), all requirement IDs resolve.

---

## Summary counts

STALE-CHECK: 41 -- Feature present; selector wrong (copy rename, hidden element, stale count, wrong variant target)
SETUP: 59 -- Feature present; gate needs non-default param or interaction
MOVED: 11 -- Feature moved to a different screen or view
LOST: 0 -- No regressions confirmed lost
PROVISIONAL: 2 -- Attainment screens being edited by another worker
Total MET FAIL: 113

MET: 66 pass / 113 fail
PARTIAL: 65 pass / 50 fail
MISSING: 11 pass / 15 fail
SEAM: 0 pass / 3 fail
VARIANT-GAP: 2 pass / 4 fail

Gap rows now passing: 78 (sample below, all genuine).

---

## LOST list

None. Every feature that failed MET was traced to a present implementation; the selector, params or setup step was wrong, not the feature.

---

## STALE-CHECK (41 rows)

Selector no longer matches the rendered element, but the feature is in the code.

AR-02 reviewer/review-item A,B,C: reviewer/parts.tsx:125 -- {differ?"Differs":"Agrees"} renders only when agreement==="differed" | Fix: add params:{item:"sub-09"} (Jordan Okafor sub-09 has mismatched self-rating/evaluator answer)

CM-05 student/log-skill A,B + request-signoff B: SkillPicker count is rows.length from openToLog() which excludes inactive | Fix: change /Search 147/ to /Search d+/

CM-06 admin/course-mapping A: mapping-parts.tsx:470 -- [data-region=skill] only in SkillPanel (variant B); A uses OfferingPanel ([data-region=offering]) | Fix: change to locator("[data-region=offering] [role=combobox]")

EV-07 evaluator/submitted B,C: outcome-variants.tsx:73 -- text is "Awaits program approval" not "Waits for program approval" | Fix: change selector to /Awaits program approval/

IM-12 admin/add-skill A: library-chrome.tsx:98 -- button "Add a skill" is aria-hidden=true when startAdding=true opens SkillSheet | Fix: add allowHidden:true to hint

RP-08 admin/dashboard A-F + attainment A,B (8 rows): dashboard/scope-bar.tsx -- [data-recount] renders only after a scope filter is applied | Fix: add setup step to apply a scope filter first

RP-09 admin/dashboard A-F (6 rows): /does not offer/ renders only for an impossible scope combination | Fix: add params for an impossible filter combo

RV-02 student/fix-returned A,B: student/fix.tsx:248 -- title is "Your revision N" | Fix: change selector to /Your revision d+/

RV-03 student/fix-returned A,B: student/fix.tsx:50 -- text is "attempt N-1 stays in My evaluations." (lowercase, number is prev attempt) | Fix: change /Attempt 2 stays/ to /attempt d+ stays/i; add params:{skill:dnq-skill-id}

RV-05 student/my-requests A,B: screens/student-requests-a.tsx:54 -- default tab is "returned" (Maya has sub-maya-2 returned); waiting tab hidden | Fix: add params:{show:"waiting"}

SH-01 student/skill-detail B: skill-detail.tsx:127 -- AttemptLedger renders {a.n}="1" not "Attempt 1" (no word prefix in ledger) | Fix: for B use getByRole("cell",{name:"1"})

SH-02 student/skill-detail B: same -- ledger shows "Waiting" and date in separate cells; no single "Waiting. Sent" string | Fix: split into separate selectors for B

ST-02 student/log-skill A,B: same as CM-05 | Fix: same

ST-04 student/request-signoff A,B: student2/request-parts.tsx:265 -- SectionTitle renders count; sentence "2 skills in one request." removed | Fix: target the SectionTitle count span

ST-10 student/log-skill A: field hint text "Enter the unit." removed in anatomy cleanup 2026-10-30 | Fix: replace with getByLabel(/Unit/)

ST-11 student/log-skill A,B: "Rate yourself" heading removed in anatomy cleanup 2026-10-30 | Fix: replace with locator("[data-self-eval]")

ST-12 student/fix-returned A,B: "Kept apart from the evaluator" description removed | Fix: replace with locator("[data-narrative-note]")

---

## SETUP (59 rows)

Feature renders only after a URL param, wizard step, or user interaction. Gate runs freshPage (no localStorage).

EV-05 evaluator/evaluation-form C: feedback Textarea is inside a Sheet drawer; needs row click | Fix: add setup:["clickFirstRow"]

EV-06 evaluator/evaluation-form B: Submit button only when step===last (review step); default is step 0 | Fix: add params:{step:"review"} or setup step

IM-01/IM-13 admin/import-ai-review A,B,C (6 rows): Create button appears only on Review step | Fix: add params:{state:"review"}

IM-02 admin/import-ai-review C: "PDF, Word or Excel" only on Upload step | Fix: add params:{state:"upload"}

IM-03 admin/import-ai-review A,B,C: "Any layout, no template" on Upload step | Fix: add params:{state:"upload"}

IM-06 admin/import-ai-review A,B,C: [data-fix-group=duplicate-library] on Fix step | Fix: add params:{state:"fix"}

IM-07 admin/import-ai-review A,B,C: [data-category-list] on Review step | Fix: add params:{state:"review"}

IM-08 admin/import-ai-review A,B,C: [data-fix-group=unread] on Fix step | Fix: add params:{state:"fix"}

IM-09 admin/import-ai-review A,B,C + skills-library C (4 rows): [data-confirm-panel] on Confirm step | Fix: add params:{state:"confirm"}

IM-11 admin/import-ai-review A,B + skills-library A,B,C (5 rows): Import name field on Confirm step | Fix: add params:{state:"confirm"}

IM-14 admin/configure-skill A,B,C + skills-library A,B,C (6 rows): "Copy from another" is a DropdownMenu item; menu must be open | Fix: add setup:["openMoreMenu"]

SH-03 student/skill-detail A,B: skill-detail.tsx:154 -- WhyNotCounted only when record.failed exists; Maya default skill has no failed record | Fix: add params:{skill:dnq-skill-id}

SL-02 admin/retire-deactivate B: "Why change?" inside FloatingSheetPanelContent; panel must be opened | Fix: add setup:["openRetirePanel"]

SL-03 admin/import-ai-review A,B,C: [data-category-list][data-category-picker] on Review step | Fix: add params:{state:"review"}

SL-04 admin/import-ai-review A,B,C: [data-tags-picker] inside category list on Review step | Fix: add params:{state:"review"}

SL-05 admin/add-skill A,B,C + import A,B,C + library A,B,C (9 rows): [data-create-category]/[data-create-tag] appear only after typing in picker | Fix: add setup:["typeInCategoryPicker"]

SL-08 admin/settings A,B (4 rows): "Add an evaluator" inside Evaluators section; needs scroll or section nav | Fix: add setup:["scrollToEvaluators"]

SL-11 admin/retire-deactivate B: "Why change?" same as SL-02 -- inside retire panel | Fix: add setup:["openRetirePanel"]

---

## MOVED (11 rows)

Feature location changed; old selector can never match on this screen.

IM-10 admin/skills-library A,B,C: library-chrome.tsx:219-223 -- LibraryBanner removed 2026-10-28 | New location: configure/check.tsx:507 -- "Configure N next" link on configure receipt only

REQ 1.6 admin/skills-library C: Library C defaults to board; status tabs only appear at ?view=list | Fix: add params:{view:"list"} or cover on A/B

SL-04 admin/categories-tags B: admin-categories-tags-b.tsx:10 -- B uses SettingsMasterDetail; Tags is a list entry not a tab | Fix: new selector targeting the left-panel list item

SL-04 admin/skills-library C: Library C board view; [data-row-tags] only on table rows (list view) | Fix: add params:{view:"list"}

SL-07 admin/settings B: admin-settings-b.tsx -- B uses SettingsMasterDetail; "Clinical settings" is a left-panel entry not a tab | Fix: new selector targeting the master-detail list entry

SL-10 admin/skills-library A,B: Library A and B are table-only; no board columns exist | Fix: move [data-board-column] check to C only

SL-10 admin/skills-library C: Selector for C variant targets getByRole(tab,Inactive); C defaults to board (tabs only on list view) | Fix: add params:{view:"list"}

SL-11 admin/skills-library C: same as REQ 1.6 C -- board view, no tabs | Fix: add params:{view:"list"}

---

## PROVISIONAL (2 rows)

Attainment screens being edited by another worker; results may change.

RP-04 admin/attainment A,B: getByText(/Tags overlap/) -- not in DOM | Note: re-run after attainment worker lands

---

## Gap-row sample verification (15 of 78)

All 15 sampled rows confirmed genuine via source code tracing. No false positives found.

CM-02 admin/course-mapping B VARIANT-GAP [data-region=skill]: mapping-parts.tsx:470 -- SkillPanel renders data-region=skill PASS genuine
AR-03 reviewer/review-item A PARTIAL locator(table).first(): Review-item A renders a comparison table PASS genuine
RP-01 director/reports A PARTIAL /Filters/ button: FilterBar present on reports page PASS genuine
RP-01 director/attainment B PARTIAL /Filters/ button: same PASS genuine
RP-01 admin/dashboard-drill B PARTIAL /Filters/ button: Drill-down inherits FilterBar PASS genuine
EV-04 evaluator/evaluation-form B PARTIAL [data-user-content]: fields.tsx:69 -- StudentContext renders data-user-content PASS genuine
CM-01 admin/course-mapping B PARTIAL [data-region=skill]: same as CM-02 PASS genuine
ST-05 student/request-signoff A PARTIAL getByLabel(At): clinical setting field labelled "At" in request form PASS genuine
AR-04 reviewer/review-item B PARTIAL getByRole(button,Approve): DecisionFooter renders Approve button PASS genuine
SH-07 student/skill-detail A MISSING getByText(Attempt 1): skill-detail.tsx:89 -- "Attempt N" in AttemptTimeline PASS genuine
AR-03 reviewer/review-item B PARTIAL locator(table).first(): Review-item B comparison table PASS genuine
ST-12 student/offline-sync A PARTIAL getByText(Keep both): offline sync conflict resolution UI PASS genuine
ST-05 student/request-signoff B PARTIAL getByLabel(At): same as A PASS genuine
RP-01 admin/dashboard-drill A PARTIAL /Filters/ button: same FilterBar PASS genuine
RP-01 admin/export B PARTIAL /Filters/ button: Export page has FilterBar PASS genuine

---

## Fix priority (by impact)

1. Import wizard state params (SETUP -- 30 rows in one batch): add params:{state:"review"|"fix"|"confirm"|"upload"} for all admin/import-ai-review rows in req-gate-hints.json. Covers IM-01,02,03,06,07,08,09,11,13,SL-03,SL-04.

2. Dashboard scope filter (STALE -- 14 rows): RP-08 (8) and RP-09 (6) need a setup step that applies a scope filter before asserting [data-recount] or does not offer.

3. Library board/list view (MOVED -- 5 rows): SL-10 A,B (remove board check), SL-10 C + REQ 1.6 C + SL-11 lib-C (add params:{view:"list"}).

4. IM-10 library banner removed (MOVED -- 3 rows): update check to target configure-receipt screen instead of skills-library.

5. Copy renames (STALE -- approx 20 rows): AR-02 item param, CM-05/ST-02 count regex, RV-02 title regex, RV-03 regex+case+params, ST-04 SectionTitle selector, ST-10/ST-11/ST-12 removed hint text.

6. Dropdown and panel SETUP: IM-14 (6), SL-05 (9), SL-02+SL-11 retire panel (2), SL-08 evaluators (4).

---

Written by req-gate-triage subagent, 2026-10-30. Attainment findings marked PROVISIONAL pending worker edits.
