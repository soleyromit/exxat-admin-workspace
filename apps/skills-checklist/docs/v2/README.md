# Connected prototype v2 (Skills Checklist, Prism)

**Status:** Stage 0 foundation, Stage 1 (admin setup, steps 1 to 4), Stage 2 (student mobile and offline, steps 5 to 7, plus the student home `/v2/student` and `/v2/student/history`), Stage 3 (preceptor, outcomes, remediation, versions, steps 8 and 9) and Stage 4 (review queue and director verification, steps 10 and 11) and Stage 5 (cohort reports with signed PDF, the student's verified record, the lab batch grid, steps 12 to 14) built. All 14 steps are real screens.
**Branch:** `feat/skills-checklist-v2` · **Admin app:** `apps/skills-checklist/admin` · **Port:** 3007 · **URL:** `http://localhost:3007/v2`
**Tags used in these docs:** `[REQ xx-nn]` requirement (only IDs in `docs/source/requirements.extracted.txt`), `[OD-n]` open decision (never treated as decided), `[PROPOSED]` a capability this prototype adds beyond the requirements, `[INFER]` my inference.

## What this is

One clickable prototype where every screen reads and writes the same mock data, so the story carries from the first admin step to the last student step. It is a design and review tool. It is not a build of the requirements document and decides nothing.

## Scenario (one shared store)

Harbor University BSN, course NURS 350 Clinical Practicum, Fall 2026, cohort BSN 2027.

| Person | Role in the story |
|---|---|
| Maya Ferreira | Student, on a phone |
| J. Delgado, RN | Preceptor, no account |
| R. Whitmore | Lab instructor, no account (uses the Preceptor role in the switcher) |
| A. Ross | Program administrator |
| L. Haddad | Clinical coordinator, reviewer (sample name) |
| Dr. K. Brennan | Program director (sample name) |
| Eleven other students | Cohort history: passes, fails, not yets, one remediation in progress, one stalled request |

The seed holds 31 skills across four specialty libraries (BSN medical-surgical, radiography, surgical technology, paramedic), evaluations with versions, a submission queue, a sync queue (queued, synced, conflict), a confidential concern, one remediation plan and an audit log.

## The 14 story steps

Defined in `admin/lib/v2/scenario.ts`, each with a route, requirement IDs and a starting-condition check.

| # | Role | Step | Route | Built in |
|---|---|---|---|---|
| 1 | Admin | Copy a specialty starter library | `/v2/admin/starter-library` | Stage 1 (built) |
| 2 | Admin | Configure IV catheter insertion | `/v2/admin/configure-skill` | Stage 1 (built) |
| 3 | Admin | Fix validation errors, then publish | `/v2/admin/validate-publish` | Stage 1 (built) |
| 4 | Admin | Map skills to NURS 350 | `/v2/admin/map-courses` | Stage 1 (built) |
| 5 | Student | See what is left, pick two skills and self-rate | `/v2/student/pick-and-rate` | Stage 2 (built) |
| 6 | Student | Ask for sign-off (QR, hand over phone, link, photo of paper form) | `/v2/student/request-signoff` | Stage 2 (built) |
| 7 | Student | Work offline and resolve a conflict | `/v2/student/offline-sync` | Stage 2 (built) |
| 8 | Preceptor | Evaluate both skills in one pass | `/v2/preceptor/preceptor-evaluation` | Stage 3 (built) |
| 9 | Reviewer | See the outcome, remediation and version history | `/v2/reviewer/outcome-remediation` | Stage 3 (built) |
| 10 | Reviewer | Clear the review queue | `/v2/reviewer/review-queue` | Stage 4 (built) |
| 11 | Director | Verify the program record | `/v2/director/director-verification` | Stage 4 (built) |
| 12 | Admin | Read cohort reports | `/v2/admin/reports` | Stage 5 (built) |
| 13 | Student | Share the verified record | `/v2/student/verified-record` | Stage 5 (built) |
| 14 | Preceptor | Record a lab session for a group | `/v2/preceptor/lab-batch-grid` | Stage 5 (built) |

Stage numbers are my build plan `[INFER]`, not a commitment.

## Stage 0: what exists

- **Shell:** route group `app/(v2)/` with `V2ShellFrame` (DS `SidebarShell`, `AppSidebar`, `SidebarInset`, utility bar). It reuses the shared shell pieces (`ProductSwitcher`, Search, Notifications, Help, Ask Leo) and adds a role switcher and a Scenario menu. No chrome is hand-built.
- **Role switcher** (utility bar): Administrator, Student (mobile), Preceptor, Reviewer, Program director. The role is read from the URL, so deep links and the back button work.
- **Scenario menu** (utility bar): jumps to each of the 14 steps, shows which are marked reviewed, and has **Reset demo**, which restores the seed after a confirmation.
- **Store:** `admin/lib/v2/` (`types.ts`, `seed.ts`, `store.ts`, `react.tsx`, `selectors.ts`, `roles.ts`, `scenario.ts`). React context plus `useSyncExternalStore`, persisted to `localStorage` under `skills-checklist:v2:store`, with every storage call guarded. The server and first client render use the seed, then the saved state loads after mount, so the store itself does not cause a server and client mismatch. A rare dev-server hydration warning on the review queue (Radix Tabs ids) was seen and is not explained; see section G of `decisions-and-open-questions.md`.
- **Placeholder step pages:** each shows the step title, who acts, requirement IDs, a live starting-condition check and live store counters. The one working control, **Mark step as reviewed**, writes to the store and the audit log, which proves state carries between pages and survives a reload.
- **Tests:** `admin/tests/v2` (21 tests): seed integrity, reset, persistence round trip, corrupt or blocked storage, pure transitions, scenario routes, requirement IDs that exist, starting conditions that hold on the seed.

## Stage 1: what exists

- **Add skills** (`/v2/admin/starter-library`): copy a specialty starter library through a review sheet, or upload a PDF or text checklist and review proposed skills beside the source lines they came from. Nothing is created until one confirm. New skills are unconfigured. The library table shows where each skill came from, its status, Edit and Configure.
- **Configure wizard** (`/v2/admin/configure-skill`, `/v2/admin/validate-publish`): 8 steps (model, achievement, simulation, prerequisites, qualified evaluators, failure path, re-validation, review and publish). The draft is in the store. Publishing is blocked until every issue is fixed, and each issue links to its field. Add `?skill=<id>` to configure another skill.
- **Mapping** (`/v2/admin/map-courses`): mandatory, optional, not expected or not mapped per skill, with coverage warnings. Unconfigured skills are blocked with a reason.
- **Tests:** `admin/tests/v2/{rules,coverage,import,admin-actions}.test.ts` plus the Stage 0 files.
- **Flow script:** `docs/v2/verify/stage1.e2e.mjs` drives import, confirm, configure, a blocked and fixed publish, mapping, reload and Reset demo.

## Stage 3: what exists

- **Preceptor evaluation** (`/v2/preceptor/preceptor-evaluation?request=<id>`): no account. One card per requested skill with the program's levels, questions, optional overall rating, an outcome (Met, Not met, Not yet with feedback only) and feedback; a confidential concern flag; a credential attestation; one submit. Unqualified or unnamed evaluators are blocked with the reason and what to do. A completed request opens read-only.
- **Outcomes** (`/v2/reviewer/outcome-remediation`, `/v2/admin/outcomes`): evaluations, remediation plans, staff-only concerns.
- **Remediation plan** (`.../remediation/<id>`, staff and student views) and **evaluation versions** (`.../evaluation/<id>`, staff and student views, reopen and confirm).
- **Tests:** `tests/v2/preceptor.test.ts`, `outcomes.test.ts`. **Flow script:** `docs/v2/verify/stage3.e2e.mjs`.

## Stage 4: what exists

- **Review queue** (`/v2/reviewer/review-queue`, `/v2/admin/review-queue`): tabs Awaiting, Stalled and Returned over the DS DataTable. Awaiting lists evaluations held for approval and photos of signed paper forms with student, skills, evaluator and role, status, setting, location, course, source and date. A visible checkbox bar selects several; "Approve N submissions" opens a confirm that names the count and, before the click, any item that is blocked and why (the rest still go through, and the result banner repeats it). Stalled rows have "Reassign request" (qualified people only, reason optional, audit entry). Returned lists what is out with a student and the reason they read.
- **Review item** (`.../review-queue/<id>`): facts, the photo placeholder (file name and size, no image), the paper-form entry (who signed, setting, the same outcome rules as the evaluator form, source recorded as paper form), the student's self-rating beside every evaluator response with agreed, differed or not comparable, earlier attempts, an optional note, "Approve and count" and "Return to student" (a reason is required).
- **Student side of a return:** the reason in the reviewer's words and what to do next on the home screen, the request list and the record; "Send it again" or "Send the corrected photo for review" continues the same record with a revision count.
- **Director verification** (`/v2/director/director-verification`, `/v2/<role>/verification/<student>`): a list of every student with status, then one record with the evidence by mandatory skill, blockers, the gaps, a confirmation and "Verify <name>'s record as version n". Versions are append-only; reopening a verified evaluation marks the record "Changed since verified" and the next verification is a new version. The student's record shows who verified it and when; `verificationRows` in `lib/v2/verification.ts` is the report data Stage 5 reads.
- **Tests:** `tests/v2/queue.test.ts`, `verification.test.ts`. **Flow script:** `docs/v2/verify/stage4.e2e.mjs`. Contracts `V2-04a`, `V2-04b`.

## Stage 5: what exists

- **Cohort reports** (`/v2/admin/reports`, `/v2/director/reports`): summary figures, filters (category, setting, named clinical setting, mandatory only) with removable chips and an explanation when a pair cannot match (RP-09), then five views. **Heatmap**: students by skills as a real table, a four-step sequential brand scale, a symbol and words in every cell, no red. **Behind pace**: students short of the evaluations the mandatory rules ask for by now (a prototype assumption, stated on the page). **Skills and raters**: observations, distinct evaluators, a "One evaluator" flag, simulation share. **Rater comparison**: met rate and the gap to all evaluators, with a small-numbers mark. **Student table**: every cell in words, the accessible alternative to the heatmap. A name opens the student's evidence. On a phone the views are a Select, not tabs.
- **Signed PDF** (below the views): a PDF for the cohort or one student that records the filters that produced it. A built-in checker rebuilds the file from the content it carries, compares every byte and checks a SHA-256 hash and an HMAC signature. **What the signature proves:** the file has not changed since it was signed here. **It does not prove who made it:** the key is a demo key that ships with the page. It is a prototype of the experience, not a security control.
- **Share your verified record** (`/v2/student/verified-record`, linked from Your record): what the program director verified, what is left out and why, then a signed PDF and a CLR 2.0 JSON file (unsigned, stated). Only verified, unchanged evidence is included. Not verified, or Changed since verified, turns sharing off with the reason.
- **Lab batch grid** (`/v2/preceptor/lab-batch-grid`, as R. Whitmore): students down, skills across, each cell cycles Met, Not met, Not yet, Not recorded; Absent per student; Set column to Met; a confirm that repeats the counts; one save per batch. Results are lab (or simulation) evidence with no clinical setting, so they never count toward a clinical-setting minimum, and they reach progress and reports at once.
- **Tests:** `tests/v2/reports.test.ts`, `pdf.test.ts`, `record.test.ts`, `lab.test.ts`. **Flow script:** `docs/v2/verify/stage5.e2e.mjs`. Contracts `V2-05a`, `V2-05b`, `V2-05c`.

## How to run

**One command:**

```bash
/Users/romitsoley/Work/apps/skills-checklist/run-v2.sh
```

It installs dependencies if `node_modules` is missing, starts the dev server on port 3007, waits until the app answers, and prints `Ready: http://localhost:3007/v2`. Open that address: the scenario starts at the overview, and the Scenario menu in the top bar jumps to each of the 14 steps and has **Reset demo**. Press Ctrl+C to stop. The script refuses to start if port 3007 is already taken, and says which process holds it. It runs `pnpm dev` in `admin/` (the workspace rule: `pnpm --filter` does not work from the repo root).

Needs: Node 22, pnpm 10. The icon and font kits load from the web; offline, icons are missing but every screen still works.

Checks:

```bash
cd admin
npx tsc --noEmit                      # types
npx vitest run tests/v2               # store and scenario tests
node ../.claude/hooks/check-req-ids.mjs   # every requirement ID in docs exists
node ../docs/v2/verify/shoot.mjs      # needs the dev server on 3007; includes the dialog, sheet, menu and wizard-step states
node ../docs/v2/verify/stage1.e2e.mjs # the Stage 1 flow, needs the dev server on 3007
node ../docs/v2/verify/stage3.e2e.mjs # the Stage 3 flow, needs the dev server on 3007
node ../docs/v2/verify/stage4.e2e.mjs # the Stage 4 flow, needs the dev server on 3007
node ../docs/v2/verify/stage5.e2e.mjs # the Stage 5 flow (needs pdftotext from poppler for the independent PDF read)
```

`docs/v2/verify/shoot.mjs [routes...]` takes screenshots at 1440x900 and 390x844 into `docs/v2/screenshots/<route-slug>-{desktop,phone}.png`, runs axe-core (WCAG 2.0 and 2.1, A and AA) through `@axe-core/playwright`, walks the page with the Tab key until focus completes a full cycle to check for a visible focus indicator and keyboard traps, repeats everything for named interaction states (sheet, dialog, menu, wizard step), records uncaught page errors, and writes `docs/v2/screenshots/report.json`. It freezes transitions before axe. Playwright is loaded from `tools/visual-check`, not installed in the app.

## Rules every stage follows

- Built on `@exxatdesignux/ui` 1.6.5. `studentUX` and `exxat-ds` are read-only references.
- DS `Button` with explicit variant and size, no raw `<button>` or `<table>`, only `var(--token)` colours, `LocalBanner` for feedback (never toast), FA icons `aria-hidden`, `aria-label` on icon-only buttons.
- Sentence case, plain words, no em dashes, errors say what happened and how to fix it, buttons name what they do.
- No red in rating or status visuals. Amber, neutral and brand only. Destructive styling only for a true destructive action.
- `[PROPOSED]` and `[INFER]` labels live in docs, never in the UI.
- A missing DS component goes in `new-components-needed.md` and is composed from DS primitives.
- Hard stops still hold except where `decisions-and-open-questions.md` records a v2-only scope change: completed evaluations are immutable (edit after sign-off reopens and adds a version), preceptors have no login, lab never satisfies a clinical-setting minimum, mapping is not eligibility.

## Files

- `new-components-needed.md`, `traceability.md`, `decisions-and-open-questions.md` (this folder)
- Contract: `docs/build/contracts/V2-00-foundation.md`
- Verification: `docs/v2/verify/shoot.mjs`, output in `docs/v2/screenshots/`
