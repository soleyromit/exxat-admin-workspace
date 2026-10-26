# V2 Admin Dashboard (scenario step 1, route /v2/admin)

**Status:** Amends `V2-CONSISTENCY-cross-page-patterns.md` sections 3 and 7 for the admin Dashboard only, on Romit's direction (the page read as "disconnected": plain text rows beside buttons, and charts, status and cards not from the DS). Tags: `[REQ]`, `[OD-n]`, `[PROPOSED]`, `[INFER]`, `[ROMIT]`.

```
Surface:              Admin Dashboard (renamed from Home on the user's direction; route /v2/admin unchanged). Route /v2/admin (App Router, v2 shell). A dashboard: a KPI strip, two charts, then two
                      linked lists ("Set up", "Needs attention").                                  Wave: V2 Stage 1 (revision)
Persona(s) & role:    A. Ross (program administrator). Desktop first, readable at 390 px.
Scope / data seen:    Program-scope counts and names: skills and their setup state, the approval queue, cohort pace by
                      student name and weakest mandatory skills. Confidential concerns are never read (D23 unchanged: no
                      concerns tile, no concern count anywhere on the Dashboard).
Job-to-be-done:       Open the module and know in one glance whether the library is ready for students, what is waiting on me,
                      and which student or skill is behind, then go straight to the real screen that fixes it.
Why -> So what:       [REQ IM-09] an unconfigured skill cannot be mapped or submitted against, so setup is the first blocker for
                      every student. [REQ AR-01..03] a request waiting for approval delays a student's counted progress.
                      [REQ RP-02, RP-03] a student or skill falling behind is the early warning the program acts on. A row
                      that only states a number leaves the admin to hunt for the item; every row therefore names the skill or
                      student, shows its state as a status, and links to it.
Requirements:         SL-01 (no shipped skills: empty state "Nothing is waiting"/setup copy), IM-09 (unconfigured skills cannot
                      be mapped), IM-10 (skill status Not configured, Configured not in use, In use), CM-03 and CM-05 (mapping
                      is an expectation, coverage warnings are warnings not eligibility), AR-01..AR-03 (approval queue),
                      RP-02 and RP-03 (students behind, weakest skills), AE-01 (counted evidence only; awaiting approval is
                      excluded from pace).
Open decisions hit:   OD-27 (definition of "behind") stays a [PROPOSED] pace clock already used by Reports; the tile reads the
                      same number as Reports. D23 (concerns visibility) untouched. No OD is treated as decided.
Out of scope:         REQ section 14: remediation (no plan count, no plan row, no link to a plan), notifications, expiry.
                      Confidential-concerns count. Trend over time (no delta on any tile). Export.
[PROPOSED]:           The four-tile strip; the "Library setup" stacked bar; row ordering by what blocks students first.
Prototype reference:  Prototype has an Overview, not a Dashboard [PROTO]; this page is a v2 construct [INFER].
Pattern:              PageFrame (title "Dashboard", subtitle contextLine) -> KeyMetrics strip -> two ChartCards side by side from
                      1024 px (stacked below) -> "Set up" Card list -> "Needs attention" Card list.
DS mapping:           PageFrame/PageSection (components/skills/page-header) IMPORT. KeyMetrics + MetricItem
                      (@exxatdesignux/ui/components/ui/key-metrics), variant="cards" size="sm" showHeader={false}
                      metricsSingleRow IMPORT. ChartCard (components/chart-card, vendored from the DS charts-overview) with
                      StackedBar and BulletMeter (viz wrappers of the DS chart primitive, Recharts via ChartContainer) VENDOR
                      as already in repo. Card IMPORT. StatusPill (components/v2/status-pill, DS StatusBadge) for every row
                      state. Button asChild + next/link, explicit variant and size, IMPORT. LoadingBlocks for loading.
KPI tiles (4):        Skills in use "12" desc "of 31"; Waiting for approval, desc "1 stalled" only when stalled > 0 (no alert: the DS warning alert
                      text fails axe contrast, so no tile uses `alert`); Students behind pace, trendPolarity lower_is_better, desc "of 12"; Coverage
                      warnings, lower_is_better, desc = course code. delta "" and trend "neutral" on every tile.
Charts:               (1) "Library setup": one StackedBar, In use / Configured, not in use / Not configured, plus a
                      BulletMeter "Mapped to {course}" (in-use skills in the course). (2) "Weakest mandatory skills": one
                      StackedBar per skill (Achieved / In progress / Not met yet / Not started), weakest first, max 5, each
                      skill name a link to Reports. Every chart has a text equivalent (aria-label summary from the viz,
                      counts in the legend). No red; "Not met yet" is the warning tone with a texture-free amber fill and the
                      legend word.
Rows (lists):         Row = StatusPill + skill or student name as a link to its real route + one detail line + ONE
                      Button (variant outline, size sm; the first row of the whole page region may be default). Priority,
                      blocking first.
  Set up / Needs attention: exact rows in "Row specification" below.
```

## Row specification

Set up (each kind capped at 2 rows; the rest collapse into one overflow link such as "and 14 more skills to configure"). Order, blocking first:

| # | Row | Pill | Name links to | Detail | Action (Button outline sm) |
|---|---|---|---|---|---|
| 1 | Unconfigured skill (IM-09: blocks mapping and submission) | skill / not-configured | `/v2/admin/configure-skill?skill={id}` | "Cannot be mapped or submitted against yet" | Configure |
| 2 | Configured, not in use | skill / configured | `/v2/admin/validate-publish?skill={id}` | "Ready to review" | Review and publish |
| 3 | In use, not in {course} (CM-05: warning, not a gate) | skill / in-use | `/v2/admin/map-courses` | "Not mapped to {course}" | Open Courses |
| 4 | Coverage warning (one row per warning, text from `coverageWarnings`) | verify / changed re-labelled "Coverage gap" | skill route if the warning names a skill, else `/v2/admin/map-courses` | warning message | Open Courses |

Needs attention (max 3 approvals, 3 behind, 3 records, then "and N more" link), blocking first:

| # | Row | Pill | Name links to | Detail | Action |
|---|---|---|---|---|---|
| 1 | Stalled request | attempt / waiting, label "Stalled, N days" | `/v2/admin/review-queue` | evaluator held up | Open Review and approve |
| 2 | Awaiting approval | queue / ready or blocked (as the queue says) | `/v2/admin/review-queue/{key}` | student, skill | Review |
| 3 | Student behind pace | cell / attempted, label "N short" | `/v2/admin/verification/{studentId}` | "N evaluations short of pace" | Open record |
| 4 | Record changed since verified | verify / changed | `/v2/admin/verification/{studentId}` | "Changed since verified" | Open record |

Remediation plans are NOT listed (REQ section 14).

## States

- **Loading (L):** before `useV2Hydrated`, `PageFrame title="Dashboard"` with `LoadingBlocks label="Loading dashboard"`. No tiles with zeros.
- **Empty (E):** Set up complete: one Card with "Every skill is configured, in use and in {course}." Needs attention clear: "Nothing is waiting." Weakest skills with no mandatory skills in use: "No mandatory skills in use yet." Zero students behind: tile reads 0, no row.
- **Error (Er):** the Dashboard reads local demo state and cannot fail a request. A corrupt or missing store falls back to the seed (store.ts); no error surface is added [INFER]. If a selector throws, the Next error boundary of the v2 layout applies.
- **Partial:** a section with no rows is omitted rather than shown empty, except the two named empty sentences above.

## Edge cases

- Coverage-gap pill: StatusPill takes only kinds in `lib/v2/status-pill.ts`; the coverage row uses `kind="verify" value="changed"` with a `label` of "Coverage gap" (warning tone, triangle icon from the table). No new pill kind is invented.
- The "Waiting for approval" tile counts approvals only (`queueItems`); stalled requests are a separate row and, when present, the tile description reads "1 stalled".
- A student behind pace links to their record, a route that exists for admin.
- Names are plain text where the target does not exist (never a dead link).

## A11y

One h1 (PageFrame). ChartCard titles are h2, "Set up" and "Needs attention" are h2 (PageSection). Each list is a `ul` with `li` rows. Links have visible focus (`focus-visible:ring-2 ring-ring`). A row's button has a name that includes the target ("Configure Sterile dressing change") via `aria-label` because several identical "Configure" buttons are on the page. State is never colour alone (pill word + icon). Charts: role img with a spoken summary, legend in words, no red. KPI strip wrapped in `<section aria-label="Home summary">`. Font sizes 12 px minimum; tokens only; no em dashes in copy; FA icons `aria-hidden`. Reflows at 390 px with no horizontal page scroll; the action button wraps under the text.

## Copy

Tiles: "Skills in use", "Waiting for approval", "Students behind pace", "Coverage warnings". Section titles: "Library setup", "Weakest mandatory skills", "Set up", "Needs attention". Buttons: "Configure", "Review and publish", "Open Courses", "Review", "Open record", "Open Review and approve", "Open Reports".

## Acceptance tests

- `tests/v2/home.test.ts`: `homeKpis` (in use of total, waiting, behind of students, warnings, stalled) equals hand counts from the seed; `setupRows` is priority ordered (unconfigured first), capped at 6 with an overflow count, and every row has an href; `attentionRows` never contains a remediation row and equals `queueItems`/`behindPace`/changed-records counts; no row exposes a concern.
- `tests/v2/kpi.test.ts`: the admin Dashboard joins the allowed strip files and passes the same anatomy checks (variant, size, single row, 3 to 4 tiles, empty deltas, at most one non-danger alert).
- Browser: `docs/v2/verify/stage1..5.e2e.mjs` and `alignment.e2e.mjs` 0 fails, `shoot.mjs /v2/admin` axe 0, every href on the page returns 200, `visual-diff.mjs` when the catalog on :4000 is up.
- Grep: `components/v2/admin/admin-home.tsx` imports `key-metrics`, contains no `remediation` (case-insensitive), no hex or rgb.

## Risks / unknowns

- This contract overrides the CONSISTENCY table row "Admin Home: no strip" on Romit's request; the "worklist" argument (a strip repeats rows as bare counts) is answered by tiles that carry a different job (scan) from rows (act). [ROMIT]
- "Behind pace" depends on the proposed pace clock (OD-27 open); it is the same figure Reports shows.
