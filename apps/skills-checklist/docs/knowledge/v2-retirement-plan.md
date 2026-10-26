# v2 retirement plan (proposal, nothing executed)

**Status:** plan only, written 2026-10-26. No file has been deleted or moved. Removal waits for Romit's go-ahead (ledger D-X24, D-X26).
**Paths** are relative to `apps/skills-checklist/admin/` unless they start with `docs/`.
**How the inventory was made:** `find` over `app/(v2)`, `components/v2`, `lib/v2`, `tests/v2`, `docs/v2`; an import-graph walk from every non-v2 file (`app/` outside `(v2)`, `components/` outside `v2`, `lib/` outside `v2`) through `@/` and relative imports, to find what the lab and the rest of the app still reach. Counts are from the working tree on branch `feat/skills-checklist-v2-scale`.

## 1. Inventory

| Area | Files | Role after retirement |
|---|---|---|
| `app/(v2)` (routes) | 12 (`layout.tsx` + 11 pages) | Delete |
| `components/v2` | 62 (15 top level, admin 11, director 1, outcomes 5, preceptor 3, reports 4, review 2, student 12, viz 9) | Delete, except `v2-grid.tsx` (move, see 3) |
| `lib/v2` | 46 `.ts`/`.tsx` (+ `hgtc-library.json`) | Keep 31 (shared data layer); 15 are reachable only from v2 UI (see 2.2) |
| `tests/v2` | 40 | Keep the data-layer tests (about 30); delete or port the UI tests (see 4) |
| `docs/v2` | 352 files (335 screenshots, 4 audits, 9 verify scripts, README, decisions, traceability, new-components) | Archive, do not delete the audits |

### 1.1 Every v2 route and its lab equivalent

| v2 route (`app/(v2)/v2/...`) | What it renders | Lab equivalent (`/lab/...`) |
|---|---|---|
| `page.tsx` (`/v2`) | Walkthrough step list | `/lab` (index; present mode `/lab?present=1`) |
| `[role]/page.tsx` admin | Admin home | `admin/dashboard` (variants A to F) |
| `[role]/page.tsx` reviewer | Reviewer home | `reviewer/approvals` (landing, ledger D-L4) |
| `[role]/page.tsx` director | Director home | `director/dashboard` |
| `[role]/page.tsx` preceptor | Preceptor inbox | `evaluator/invitation-email` (no app chrome, evaluators have no login) |
| `[role]/page.tsx` student | Student home | `student/home` ("My progress") |
| `[role]/[slug]` starter-library | Starter libraries | `admin/starter-library` (labelled as editable starting points, D-X5) |
| `[role]/[slug]` configure-skill | Configure wizard | `admin/skills-library`, `admin/add-skill`, `admin/configure-skill` |
| `[role]/[slug]` validate-publish | Review and publish | `admin/configure-skill` (Check step), `admin/rule-change-impact` |
| `[role]/[slug]` map-courses | Course mapping | `admin/course-mapping`, `admin/lists-cohorts` |
| `[role]/[slug]` pick-and-rate | Log skills | `student/log-skill` |
| `[role]/[slug]` request-signoff | Requests | `student/request-signoff`, `student/my-requests`, `student/fix-returned` |
| `[role]/[slug]` offline-sync | Sync page | `student/offline-sync` |
| `[role]/[slug]` preceptor-evaluation | Evaluation form | `evaluator/evaluation-form`, `evaluator/submitted`, `evaluator/expired` |
| `[role]/[slug]` outcome-remediation | Outcomes and remediation | None by decision (D-X5: remediation out of scope); evaluation history is in `reviewer/student-record` |
| `[role]/[slug]` review-queue, admin review-queue | Review queue | `reviewer/approvals`, `admin/approvals` |
| `[role]/review-queue/[id]` | Review item | `reviewer/review-item` |
| `[role]/[slug]` director-verification, `[role]/verification`, `[role]/verification/[studentId]`, `[role]/director-verification/[studentId]` | Verification list and record | `director/dashboard` (worklist), `director/verification-detail` |
| `[role]/[slug]` reports, director reports | Reports | `admin/attainment`, `admin/export`, `director/reports`, `director/attainment` |
| `[role]/[slug]` verified-record | Share verified record | `student/record`, `student/share-record` |
| `[role]/[slug]` lab-batch-grid | Lab batch grid | `lab-instructor/lab-batch-grid` |
| `[role]/outcomes` | Outcomes list | `reviewer/students`, `reviewer/student-record` |
| `[role]/evaluation/[id]` | One evaluation with "Reopen to edit" | `reviewer/student-record` (versions shown); no reopen (D-X1) |
| `[role]/remediation/[id]` | Remediation plan | None (D-X5) |
| `student/history` | Student history | `student/record` |

## 2. What is shared and must stay

### 2.1 `lib/v2`: the data layer (keep; rename later, not now)

31 of 46 modules are reached from non-v2 code. The lab imports these directly (count of importing lab files): `format` 54, `types` 51, `labels` 20, `seed-core` 17, `react` 17, `evidence-index` 15, `student` 9, `population` 7, `reports` 6, `filters` 5, `queue` 4, `approvals` 4, `admin-actions` 4, `status-pill` 2, `seed` 2, `preceptor` 2, `hgtc-library` 2, `config` 2, and 1 each for `verification`, `sync`, `store`, `starter-libraries`, `rules`, `qr`, `placements`, `lab`, `generate`, `facts`, `coverage`; the rest (`generate-ref`, `pools`, `outcomes`) are reached through these.

Groups to keep: types; seed and generation (`seed`, `seed-core`, `generate`, `generate-ref`, `pools`, `hgtc-library.json`); population and facts (`population`, `filters`, `facts`, `placements`, `coverage`); approvals and queue (`approvals`, `queue`, `review` is v2-only, see 2.2); labels and format (`labels`, `format`, `status-pill`); evidence index; the store (`store`, `react`, `admin-actions`, `sync`); student and preceptor engines (`student`, `preceptor`, `outcomes` for evaluation versions); `qr`.

A rename (`lib/v2` to `lib/data`) is worth doing only after the deletions, as its own commit: 112 lab files and about 30 tests import `@/lib/v2/...`, so a rename touches about 150 files with no behaviour change. Keep `SEED_VERSION` and the pinned fingerprint as they are through the rename.

### 2.2 `lib/v2` modules reached only from v2 UI (15)

`download`, `home`, `import`, `link-to`, `page-context`, `paths`, `pdf`, `queue-viz`, `record`, `report-docs`, `review`, `roles`, `scenario`, `selectors`, `student-viz`.

Not all can go with the UI:
- `selectors` and `home` are imported by the core data tests (`tests/v2/consistency.test.ts`, `dataset-invariants.test.ts`, `store.test.ts`, `queue.test.ts`, `admin-actions.test.ts`, `verification.test.ts`). Port those assertions to `facts()` first, then delete.
- `pdf` (signed PDF) and `record` (verified record content) have no lab caller yet, but the lab's `student/share-record` and `director/reports` describe a signed PDF. Keep both until those screens either adopt them or decide against a PDF (OD-10 area).
- `report-docs` is tested in `tests/v2/reports.test.ts`; keep with `pdf`.
- `import` is the v2 import parser; the lab has its own `lib/lab/import.ts`. Delete with the v2 UI after checking `tests/v2/import.test.ts` holds nothing the lab import lacks (OD-12 "never proposes a model or criteria" must stay tested somewhere).

### 2.3 `components/v2`

- `components/v2/v2-grid.tsx` is the only `components/v2` file the lab imports (`components/lab/lab-index.tsx`). Move it to `components/lab/` (or replace with a DS grid) before deleting the folder.
- `components/v2/viz/**` (9 files) is **not** imported by any lab file: the lab has its own `components/lab/viz.tsx` and `viz-tokens.css`. Only v2 pages and `tests/v2/viz.test.tsx` use it. It can go with the v2 UI. (Earlier notes said the lab used it; the import graph says otherwise.) The DS gate now scans it anyway (`scripts/lab-ds-gate-lib.mjs` `checkShared`), so while it exists it stays clean.

## 3. What can be deleted

- `app/(v2)/**` (12 files).
- `components/v2/**` except `v2-grid.tsx` (61 files).
- v2-only UI tests: `tests/v2/filter-bar.test.tsx`, `nav.test.ts`, `scale-render.test.tsx`, `viz.test.tsx`, `link-to.test.ts`, `scenario.test.ts`, `queue-viz.test.ts`, `student-viz.test.ts`, `home.test.ts` (after porting its invariants), `pdf.test.ts` and `reports.test.ts` only if `pdf`/`report-docs` go.
- The 15 v2-only `lib/v2` modules of 2.2, in the order and with the conditions given there.
- `docs/v2/screenshots/**` (335 images) and `docs/v2/verify/**` (Playwright scripts against `/v2` routes). Keep `docs/v2/audit/T1..T4` and `decisions-and-open-questions.md`: the brief, the glossary and the ledger cite them as `[AUDIT Tn]`. Move them to `docs/knowledge/sources/v2-audit/` if `docs/v2` itself goes.

## 4. Safe order of removal (run the checks after every step)

Checks after each step: `npx tsc --noEmit`; `npx vitest run`; `node scripts/lab-ds-gate.mjs` (and `--write` if the generated file changes); `node scripts/lab-nav-crawl.mjs`; `node tests/lab/consistency.mjs http://localhost:3017`; `node scripts/lab-present-check.mjs`; `grep -rn "@/components/v2\|/v2/" app components lib` must list only what the step still allows. Restart the dev server with `rm -rf .next` after a route deletion.

1. **Move `v2-grid.tsx`** into `components/lab/` and update `lab-index.tsx`. Checks: tsc, vitest, `/lab` renders.
2. **Port data invariants off v2-only modules**: rewrite the `selectors`/`home` assertions in the core tests against `facts()` (same numbers). Checks: vitest; the counts in `docs/knowledge/dataset-spec.md` 12 still hold.
3. **Delete `app/(v2)`** (routes go first, so nothing renders v2 pages). Checks: tsc (expect errors only in v2-only tests), nav crawl (no lab link points at `/v2`), `rm -rf .next`.
4. **Delete the v2 UI tests** listed in 3. Checks: vitest.
5. **Delete `components/v2`** (all but the moved grid). Checks: tsc, vitest, DS gate (`checkShared` then scans nothing under `components/v2/viz`; drop that dir from `SHARED_SCAN_DIRS`).
6. **Delete the v2-only `lib/v2` modules** of 2.2 that have no remaining importer (`download`, `link-to`, `page-context`, `paths`, `queue-viz`, `roles`, `scenario`, `student-viz`, `review`, `home`, `selectors`), keeping `pdf`, `record`, `report-docs` and `import` until their decisions. Checks: tsc, vitest, consistency, facts registry unchanged (`tests/v2/realistic-data.test.ts`).
7. **Archive `docs/v2`** as in 3. Checks: grep the knowledge folder for broken `docs/v2/...` links.
8. **Optional rename** `lib/v2` to `lib/data` (one mechanical commit). Checks: all of the above.

## 5. Risks

| Risk | Why | Mitigation |
|---|---|---|
| Hidden importer | A v1 file under `components/` or `app/(shell)` imports a v2 helper indirectly | Re-run the import-graph walk before steps 3, 5, 6 |
| Lost invariants | `consistency.test.ts` and `dataset-invariants.test.ts` reach `selectors`/`home`; deleting them silently drops checks | Step 2 before step 6 |
| Seed fingerprint drift | Moving a seed module or a pool changes nothing but a careless edit re-pins `PINNED` | Never re-pin during removal; a pin change means data changed |
| Stored state | The store keys stored diffs by `SEED_VERSION`; a rename that changes the seed resets every viewer's local edits | Do not bump `SEED_VERSION` in the removal commits |
| Decisions still open | Reopen (D-X1) and remediation (D-X5) are delegated defaults, reversible; deleting their only implementation makes reversal a rebuild | Romit confirms D-X1 and D-X5 before step 3 |
| PDF and verified record | `pdf.ts`, `record.ts` have no lab caller yet | Keep until share-record and reports decide (OD-10 area) |
| Audit citations | Brief, glossary and ledger cite `docs/v2/audit` | Move, do not delete, and update links |
| Next build cache | Deleted routes linger in `.next` | `rm -rf .next` after step 3 |

## 6. Git note

Nothing is committed yet: the worktree holds all of this work (the lab, the shared data layer changes and these docs) on branch `feat/skills-checklist-v2-scale`, uncommitted on top of `fcea7597`. Recommend committing in logical chunks before any removal, so each deletion step is its own reviewable, revertible commit: (1) shared data layer (`lib/v2`) changes; (2) the lab (`lib/lab`, `components/lab`, `app/(lab)`); (3) tests and scripts; (4) docs and knowledge. Then one commit per removal step above. Main needs Himanshu's review before merge.
