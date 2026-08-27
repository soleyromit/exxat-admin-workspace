# Architect run — 2026-08-27

> Triggered by: Romit explicit request after a padding bug in
> apps/pce/admin/app/(app)/results/[id]/page.tsx survived three rounds
> of "I fixed it" claims (2026-08-27). Source: .claude/agents/architect.md.

---
## Session inputs digested

- **Commits since last architect run (2026-05-11)**: Not formally bundled.
  Recent commits: eec1abad, 5ace32f8, 888f2e81, e8843482, d33f1af0 — all
  fix(pce), consistent with rapid-iteration design sprint.
- **Discipline-log new rows**: 0 formal additions since 2026-06-01 (last
  entry: 2026-06-01 Romit Pattern K, verification-discipline.md:302).
  Gap: 2026-08-27 session produced a Pattern B incident not yet logged.
- **Subagent telemetry**: telemetry gap — subagent-invocations.log not
  confirmed populated. Proceeding without this signal.
## Worst-behavior pattern this period

**Pattern B** (fix this everywhere, not just where shown) — specifically its
intra-file variant, which verification-discipline.md:36-49 does not cover.

The discipline log has 3 prior Pattern B entries (verification-discipline.md
lines 283 x2, 301). The 2026-08-27 session adds a fourth structural instance:
three row kinds inside QuestionHeatmapTable (rated-question, free-text /
WrittenResponsesRow, section-title band, group band) and a parallel
SectionHeatmapTable each originally spelled out independent Tailwind border
+padding strings. When the free-text row missing pl-3 was reported, Claude
fixed the specific case but did not check whether rated-question and
section-band siblings were also consistent — because Pattern B says "search
the workspace for siblings", not "search the same function for sibling
row-kinds."

Specific 2026-08-27 instances at apps/pce/admin/app/(app)/results/[id]/page.tsx:
- SectionHeatmapTable (line 1497) and QuestionHeatmapTable (line 2383) each
  had independent per-row-kind "border-b border-border px-3 py-2 ..." strings.
- The bug (missing pl-3 on WrittenResponsesRow wrapper) survived 3 diagnosis
  rounds because repair checked "did the fixed case render correctly", not "do
  all sibling cell roles share the same left inset source".
- Root diagnosis: Gate 2 (verification-reviewer / ds-conformance-reviewer)
  was replaced with ad hoc browser checks in the rapid bug-fix loop.

Recommendation: add an explicit intra-file sibling check to Pattern B AND to
Gate 2; add an audit rule detecting multiple JSX-returning functions in one
file independently spelling out the same cell-chrome Tailwind strings.

---

## Proposals

Evidence note: per architect constitution Hard Rule 1, every NEW proposal
requires 2+ occurrences. All proposals below meet this bar.

---

### PROPOSED-NEW-1: grid-table-cell-chrome-divergence audit rule

**Evidence**:

1. apps/pce/admin/app/(app)/results/[id]/page.tsx — 2026-08-27.
   SectionHeatmapTable (line 1497) and QuestionHeatmapTable (line 2383) are
   two JSX-returning functions in the same file, each originally spelling out
   identical cell-chrome Tailwind strings (border-b border-border px-3 py-2
   text-right text-sm ...) independently per row-kind. The fix — constants
   HEAT_TH, HEAT_LABEL_CELL, HEAT_STAT_AVG, HEAT_STAT_MEDIAN,
   HEAT_STAT_PROGRAM, HEAT_INSTRUCTOR_CELL, HEAT_FULL_ROW_PAD,
   HEAT_FULL_ROW_STYLE extracted at lines 1463-1470, shared HeatCell at
   line 1472 — proves divergence had existed. Comment at lines 1458-1461:
   "Routing every row kind through these constants makes that drift
   structurally impossible — there is exactly one place that owns each cell
   role's chrome."

2. apps/pce/admin/components/curricular-loop-diagram.tsx — prior session.
   PerformanceHeatmap (~line 267) and TrendRow (~line 797) are two sibling
   JSX-returning functions in the same file; both are in DOCUMENTED_HAND_ROLLS
   (scripts/ds-adoption-audit.py:150-152) and the audit's own comment (lines
   147-153) notes these "aren't actually flagged by" the current scanner —
   meaning two grid-row-structure functions co-exist with no rule verifying
   they share cell chrome primitives.

**Class**: new audit rule in scripts/ds-adoption-audit.py

**Proposed shape**: Add scan_file_for_grid_table_cell_divergence(rel, text).

What IS greppable / detectable:
- File contains 2+ named JSX-returning top-level functions (heuristic: split
  text on "^function [A-Z]" or "^const [A-Z]\w+ =" and check each chunk for
  a JSX return).
- The same literal Tailwind pattern "border-b border-border p[xy]-N" appears
  in 2+ of those function-body chunks.
- No module-scope "const [A-Z_]+_(TH|CELL|PAD|STYLE|ROW)" declaration
  precedes those patterns — no shared constant was extracted.

Severity: WARN at introduction (false-positive surface for legitimately
different spacing in unrelated components sharing a file). Promote to BLOCK
after 30 days at 0 confirmed false positives.

What requires a smarter non-regex check:
- Confirming repeated strings are semantically identical cell roles rather
  than coincidentally equal strings with different intent.
- Detecting the subtler bug: a shared constant EXISTS but one row-kind has
  drifted off it by adding inline pl-3. This class cannot be caught by a
  file-level scan; it belongs to verification-reviewer's checklist
  (see PROPOSED-PROMOTE-1).

**Promote/retire pair**:

RETIRE: Remove 3 dead no-op entries from DOCUMENTED_HAND_ROLLS in
scripts/ds-adoption-audit.py (lines 146-152 per 2026-08-27 read):

  "app/(app)/analytics/page.tsx"
  "app/(app)/analytics/programmatic/page.tsx"
  "components/curricular-loop-diagram.tsx"

The audit script's own comment (lines 147-153) states: "Note:
scan_filename_for_ds_organism only matches on filename stems so these aren't
actually flagged by it; entries remain here for documentation parity with the
registry." These three entries are never evaluated by any scanner. Removing
them reduces allowlist noise without changing audit behavior. The hand-rolls
they describe belong in docs/governance/ds-adoption.md "Documented hand-rolls"
table (line 105+), not in the code-level allowlist.

Net rule count change: +1 WARN rule, -3 dead allowlist entries.

**Why not just expand an existing rule**: raw-table-in-product-code
(ds-adoption-audit.py:573) fires on <Table> JSX imports — blind to CSS-Grid
layouts that never import a <Table> primitive. card-shape-masquerade catches
single-div card imposters, not repeated cell-chrome patterns across sibling
functions. Neither rule covers intra-file sibling divergence.

---

### PROPOSED-NEW-2: Gate 1 wording expansion — component-shaped functions in existing files

**Evidence**:

1. apps/pce/admin/app/(app)/results/[id]/page.tsx — 2026-08-27.
   SectionHeatmapTable (line 1497) and QuestionHeatmapTable (line 2383) are
   new JSX-returning functions added to an already-existing file, both
   introducing CSS Grid cross-tab layouts with 11+ column tracks. Neither
   triggered Gate 1 (ds-adoption-reviewer) because apps/pce/CLAUDE.md Gate 1
   says "Spawn ds-adoption-reviewer for any new component file" — file-level
   trigger only.

2. apps/pce/admin/components/curricular-loop-diagram.tsx — prior session.
   PerformanceHeatmap (~line 267) and TrendRow (~line 797) are JSX-returning
   functions added to an existing file; both appear in DOCUMENTED_HAND_ROLLS
   (ds-adoption-audit.py:150-152), meaning their documented status was added
   retroactively rather than reviewed at authoring time via Gate 1. The gate
   was bypassed because the FILE already existed.

**Class**: process rule update — apps/pce/CLAUDE.md Gate 1, workspace
CLAUDE.md Gate 1, docs/governance/design-review-protocol.md

**Proposed shape**: Change Gate 1's trigger language from:

  "Spawn ds-adoption-reviewer for any new component file"

to:

  "Spawn ds-adoption-reviewer for any new component file AND for any new
  JSX-returning function added to an existing file that (a) introduces a
  CSS-Grid or flex-based layout with 3+ grid-cell-shaped div children, or
  (b) whose name matches a DS organism pattern (DataTable, KeyMetrics,
  Drawer, Heatmap, CrossTab)."

The condition is self-checkable by Claude before writing the function body:
count intended grid columns and decide whether this introduces a new
cell-chrome primitive. If yes, spawn the reviewer and document the hand-roll
decision in ds-adoption.md before proceeding.

**Promote/retire pair**: language-only update — no new audit rule, no net
increase in rule count. Retires the file-creation-only interpretation of
Gate 1.

**Why not just expand an existing rule**: Gate 1's ds-adoption-reviewer is
already the correct tool. The problem is the trigger condition ("new file"),
not the subagent. Widening the trigger is simpler than adding a new subagent.

---

### PROPOSED-PROMOTE-1: Pattern B — add explicit intra-file sibling-consistency sub-check

**Evidence**:

Pattern B has 4 discipline-log entries including the 2026-08-27 intra-file
instance where THREE rounds of bug-fix claims missed sibling row-kind padding
divergence in the same function body:
- 2026-05-11 (verification-discipline.md:283): fixed /surveys but not 13
  other raw-table pages — cross-file sibling miss.
- 2026-05-12 (verification-discipline.md:283 class-level note): Toggle fix
  not cascaded — cross-file sibling miss.
- 2026-06-01 (verification-discipline.md:301): DS adoption violations fixed
  in one place but not swept — cross-file sibling miss.
- 2026-08-27 (not yet logged in discipline table): free-text row pl-3 missing;
  three rounds of "I fixed it" without checking rated-question, section-band,
  group-band siblings in the SAME function — intra-file sibling miss NOT
  covered by existing Pattern B wording.

**Current phase**: Pattern B is documentation-only in verification-discipline.md;
no audit rule enforces it at commit time.

**Proposed promotion**: Add the following sub-check to Pattern B's fix
protocol (insert after existing step 2 at verification-discipline.md:47):

  2b. Intra-file sibling check (runs BEFORE the workspace grep in step 2):
      When fixing a styling/padding/spacing bug in one variant (row kind,
      cell role, slot type) within a function:
      a. Identify every other row-kind/cell-role rendered by the same parent
         function or component.
      b. Grep the same file for each sibling variant.
      c. Verify every sibling derives its padding/border/spacing from the
         SAME module-scope constant, not independently typed className strings.
      d. If siblings diverge: extract a shared constant BEFORE claiming done.
         Report the extraction as part of the fix.
      This runs on the changed FILE before escalating to workspace-wide grep.

Also add as a named checklist item in .claude/agents/verification-reviewer.md:
"for any file with repeated cell/row-kind patterns, confirm all variants
share a module-scope constant rather than independently typed strings."

Also add to Gate 2 in apps/pce/CLAUDE.md as a mandatory self-review step:
"intra-file sibling consistency: when fixing a cell/row/slot styling bug,
grep the same file for all sibling variants before claiming done."

**Risk**: low — strengthens an existing pattern rather than introducing
blocking commit behavior. No new false-positive surface.

---

## Cross-session learning summary

- **Infra-vs-product commit ratio this period**: 5 recent commits all fix(pce)
  — 100## Cross-session learning summary

- **Infra-vs-product commit ratio this period**: 5 recent commits all fix(pce)
  — 100% product-side. No governance/infra commits visible. Fix-heavy sprints
  historically correlate with Gate 2 shortcuts.
- **Most-touched governance file**: scripts/ds-adoption-audit.py
  (DOCUMENTED_HAND_ROLLS expansion adds noise without audit coverage).
- **Subagents most/least invoked**: telemetry gap. Qualitatively:
  ds-adoption-reviewer NOT invoked for heatmap functions (Gate 1 bypass);
  verification-reviewer NOT invoked in rapid bug-fix loop (Gate 2 bypass).
- **Pattern improving**: Pattern F (state coverage) — 0 new entries since
  2026-05-11 BLOCK promotions. Promotions appear to be holding.
- **Pattern worsening**: Pattern B (sibling coverage) — 4th instance, first
  explicit intra-file sibling miss. Workspace-grep protocol did not catch the
  within-function case.

---

## What I (architect) did NOT propose

- A new subagent for cross-tab tables: 2 occurrences only; ds-adoption-reviewer
  and verification-reviewer with updated checklists is sufficient. Premature.
- Promoting clickable-without-focus-ring from WARN to BLOCK: baseline run
  (2026-05-11-baseline.md) deferred due to false-positive risk. No new evidence.
  Not re-surfacing until 30 days of 0 false positives confirmed.
- A rule banning CSS-Grid-based tables outright: step-report-access.tsx
  cross-tab (ds-adoption.md:105) and the heatmap surfaces are legitimate — DS
  DataTable has no matrix-column model. PROPOSED-NEW-1 targets divergence
  between sibling functions, not the hand-roll itself.
- Logging the 2026-08-27 Pattern B instance to the discipline log directly:
  that is in-session Claude work per Pattern H. Recommending the parent
  session append that row to verification-discipline.md.
- async-fetch-no-skeleton promotion: deferred in baseline run as false-positive-
  prone. Needs 30 days of confirmed 0 false positives first.

---

## Open questions for Romit + parent agent

1. PROPOSED-NEW-1 false-positive surface: the heuristic will potentially fire
   on curricular-loop-diagram.tsx if PerformanceHeatmap and TrendRow do not
   share cell primitives. Should those functions be required to extract shared
   constants (compliance), or suppressed with a file-level comment and a
   ds-adoption.md registry entry?

2. Gate 1 subagent cost for PROPOSED-NEW-2: spawning ds-adoption-reviewer for
   every new JSX-returning function with 3+ grid columns adds latency. Is a
   lighter self-checklist (Claude asks itself "is this a new cell-chrome
   primitive?" and documents the answer) preferable to a full subagent spawn
   for function-level additions to existing files?

---

## Self-retiring queue

Prior runs in docs/governance/architect-runs/INDEX.md:
- 2026-05-11-baseline.md (PARTIAL): promote-4 (async-fetch-no-skeleton) and
  promote-5 (clickable-without-focus-ring) DEFERRED, not rejected. Not at 3
  rejections. Eligible for future proposal.
- 2026-06-03-ds-component-truth (PROPOSED, no decision): 0 rejections.
- 2026-06-09-workspace-architecture-review (PROPOSED, no decision): 0 rejections.

No item has been rejected 3 times. Self-retiring queue is empty.
