# 03 Lab architecture: flows, option sets, a slim lab bar, and the build split

**Written:** 2026-10-26. **Status:** build spec for the lab frame and registry; no app code changed by this doc. Read with `01-layout-patterns.md` and `02-skill-setup-content-and-ui-strategy.md`.
**Code read:** `admin/components/lab/lab-frame.tsx`, `variant-bar.tsx`, `ds-used-panel.tsx`, `configure/shell.tsx`, `app/(lab)/lab/[persona]/[screen]/page.tsx`, `lib/lab/screens.json` (38 screens, 91 variants), `components/skills/page-header.tsx`, `tests/lab/density-budget.mjs`.

---

## 1. What is wrong with the lab today

| Problem | Evidence | Consequence |
|---|---|---|
| Variants are per screen (A/B/C) with independent ideas | `screens.json`: library A table, B tree, C board; import A wizard, B two panes; configure A wizard, B one page, C sentence. Nothing links library B to import B to configure B | A reviewer cannot walk Library > Add > Import > Configure > Publish > Map in one consistent design; each hop resets to the recommended A |
| Lab chrome competes with the product | `variant-bar.tsx:27-29` prints "Tests: {question}" as a full-width line; `page.tsx:25-28` renders the DS components panel under every screen; `configure/shell.tsx:39` puts a dashed demo toolbar inside the page; the utility bar carries a "Design lab" badge and the persona switcher | Romit reads lab notes as product copy; the panel occupies the place of the next region |
| No journey navigation | Only the sidebar and breadcrumbs; no previous or next step | The flow exists only in docs |
| `/lab` is a matrix by persona only | `lab-index.tsx` | No way to start "the import journey" |

---

## 2. Concepts

| Concept | Definition | Example |
|---|---|---|
| **Flow** | An ordered list of steps a persona walks to finish one job. Each step points at an existing lab screen | `set-up-skills`: Library, Add a skill, Import, Configure, Impact and publish, Map to courses |
| **Option set** | One coherent design direction applied to every step of a flow. Each step maps the set to one variant letter of its screen. A step may share a variant across sets when only one design exists | Set 1 "Guided": table, side sheet, wizards. Set 2 "One page": tree, inline row, single pages. Set 3 "Many at once": board, paste several, two panes, sentence applied to many |
| **Journey bar** | Previous and next step of the current flow with their names, inside the lab bar | `‹ Add a skill   Import (3 of 6)   Configure ›` |
| **Lab bar** | The only lab chrome: one 40 px row under the utility bar holding persona, flow and journey, option set, scenario menu, the variant's question (tooltip) and the DS components drawer | section 4 |
| **Scenario** | A named demo state for a screen (sample rule change, unconfigured skill, large file, loading, empty, error, reset) chosen from the lab bar, never from page content | `?change=sample`, `?state=large` |

---

## 3. Option sets for every flow

### 3.1 Set up skills (admin), the flow this pass redesigns

| Step | Screen | Set 1 Guided (recommended) | Set 2 One page | Set 3 Many at once |
|---|---|---|---|---|
| 1 Library | admin/skills-library | A table with status tabs (rebuilt, 02 section 5) | B category tree with peek panel (rebuilt) | C setup board (cleaned) |
| 2 Add a skill | admin/add-skill | A short side sheet (rebuilt, 02 section 6) | B inline row in a category (cleaned) | **C paste several (new)** |
| 3 Import | admin/import-ai-review | A four-step wizard (rebuilt, 02 section 3) | **C one page, one decision at a time (new)** | B file beside the list (rebuilt) |
| 4 Configure | admin/configure-skill | A five-step wizard, rule in the footer (rebuilt, 02 section 4) | B collapsing section cards (rebuilt) | C sentence applied to many (rebuilt) |
| 5 Impact and publish | admin/configure-skill (`?step=check`) | A, step 5 | B, section 5 (`?section=check`) | C, impact dialog (`?impact=open`) |
| 6 Map to courses | admin/course-mapping | A offering first | B skill first | A offering first |

`admin/rule-change-impact` A and B and `admin/starter-library` A and B stay registered screens outside the flow: rule impact A's content becomes configure step 5; B's people-first list becomes the "Show the {n} students" content. Starting points are reachable from the library overflow menu (SL-01 conflict, D-X5).

### 3.2 Other flows (same mechanism; variant letters are the existing ones)

| Flow (persona) | Steps (screen slugs) | Set 1 | Set 2 | Set 3 |
|---|---|---|---|---|
| Ask for evaluation (student) | Log (`log-skill`) > Send for evaluation (`request-signoff`) > My requests (`my-requests`) > Fix returned (`fix-returned`) | "Guided": A, A, A (by evaluator), A (guided column) | "Situational": B (shift log), B (situation first), B (by status), B (before and after) | n/a |
| My progress (student) | My progress (`home`) > Skill detail (`skill-detail`) > Record (`record`) > Share record (`share-record`); Offline and sync as a side step | "Next actions": A, A, A, A | "Map": B, B, B, B | "Timeline": C, A, B, A |
| Clear approvals (reviewer) | Approvals (`reviewer/approvals`) > Review item (`review-item`) > Student record (`student-record`); Students as a side step | "Table and pages": A, A (compare), A (tabs) | "Split view": B, C (decision first), B | "Batch by reason": C, C, B |
| Confirm readiness (director) | Dashboard (`director/dashboard`) > Verification (`verification-detail`) > Reports (`reports`); Attainment as a side step | "Pipeline": A, A, A | "Blockers": B, B, B | "Worklist": C, A, B |
| Sign skills (evaluator, no login) | Email (`invitation-email`) > Form (`evaluation-form`) > Submitted (`submitted`), with Expired (`expired`) as the error branch | "One page": A, A, A, A | "Stepper": B, B, B, B | "Fast batch": C, C, C, C |
| Record a lab session (lab instructor) | Lab batch grid (`lab-batch-grid`) > Submitted (evaluator `submitted`) | "Grid": A, A | "Roll call": B, B | n/a |
| Watch the cohort (admin) | Dashboard (`admin/dashboard`) > Drill list (`dashboard-drill`) > Attainment (`attainment`) > Export (`export`) | "Status board": A, A, A, A | "Exceptions": B, B, B, B | "Narrative": F, A, B, A |
| Keep the library right (admin) | Library (`skills-library`) > Deactivate or replace (`retire-deactivate`) > Lists and cohorts (`lists-cohorts`) > Settings (`settings`) > Evaluator directory (`evaluator-directory`) | "Pages": A, A, A, A, A | "In place": B, B, B, B, B | n/a |
| Admin approvals (admin) | Approvals (`admin/approvals`) > Review item (`reviewer/review-item`) | A, A | B, C | n/a |

Admin dashboard variants C, D, E stay reachable as screen variants (section 4.3) and through the screen URL; they are not forced into a set.

---

## 4. Lab bar build spec (replaces `variant-bar.tsx`; owner builder 4)

### 4.1 Anatomy at 1440

```
utility bar (product only): [≡] Clinical Education v   Design lab > Administrator > Import skills
lab bar, 40 px, data-lab-chrome:
[Administrator v] | [Set up skills v]  ‹ Add a skill   Import · 3 of 6   Configure ›  |  Set [1 Guided][2 One page][3 Many at once]  |  [Scenario v] (i) [Components 38]
```

| Slot | DS component and props | Behaviour | Copy |
|---|---|---|---|
| Container | `div role="region" aria-label="Design lab controls" data-lab-chrome` `className="flex h-10 items-center gap-3 border-b border-border bg-background px-4 md:px-6 text-xs"`; rendered by `LabFrame` above the scrollport content (not inside the page) | Sticky with the utility bar (`sticky top-0 z-20`) so it never scrolls into the page | n/a |
| Persona | Move `PersonaSwitcher` (`lab-frame.tsx:62-87`) from the utility bar into this slot, unchanged API, `Button variant="ghost" size="sm"` | Switch persona lands on that persona's first flow step if a flow is active for that persona, else its landing screen | "View as {persona}" in the accessible name |
| Flow menu | `DropdownMenu` trigger `Button variant="ghost" size="sm"` showing the flow title; content: `DropdownMenuRadioGroup` of flows for the current persona, separator, "All screens" (opens `/lab`) | Choosing a flow opens its step 1 with the current set (or the flow's recommended set) | Flow titles from `flows.json` |
| Journey | Two `Button variant="ghost" size="sm"` links: "‹ {previous step label}" and "{next step label} ›" (chevrons are `fa-light fa-chevron-left/right` `aria-hidden`, allowed because these are navigation, not action CTAs; `aria-label="Previous step: Add a skill"`); between them the current step label and "3 of 6" in `text-muted-foreground tabular-nums`. Hidden when the screen is not in a flow | Links carry `set` and context params `skill`, `stu`, `course` (whitelist) | n/a |
| Option set | `ViewSegmentedControl` (DS) `aria-label="Option set"`, options from the flow's `sets` (`1 Guided`, `2 One page`, `3 Many at once`); when off-flow, the same control lists the screen's variants exactly like today's `VariantBar` (`Variant A`...) | Writes `?set=` (flow route) or `?variant=` (screen route); persists the last set per flow in `localStorage` key `lab:set:{flowId}` (wrapped in try/catch) | A set whose variant for this step is not built shows ", planned" |
| Scenario | `DropdownMenu` trigger `Button variant="ghost" size="sm"` "Scenario"; entries from the screen's `scenarios` in `screens.json` (section 5.2), grouped "States" (loading, empty, error, large) and "Data" (sample rule change, unconfigured skill, sample file); last item "Reset edits" dispatches `window.dispatchEvent(new CustomEvent("lab:reset"))` | Items set URL params with `router.replace`; the reset event is handled by screen hooks (`use-configure.tsx`, `use-import-session.ts`, library overlay) | Item labels as in 5.2 |
| Question | `Tooltip` on `Button variant="ghost" size="icon-sm" aria-label="What this option tests"` with `fa-light fa-circle-info` | Tooltip content (max 320 px): the variant's `question`; a second line "Recommended" when it is the recommended set or variant; a third line for any open decision note from `labNotes` (for example "Open decision: how evidence already held is treated") | Replaces the "Tests:" sentence and the in-page "Decision pending" pills |
| Components | `Button variant="ghost" size="sm"` "Components" + plain count; opens `Sheet` (`side="right" size="md"`, title "Design system components on this page", description "{n} components, from the gate scan.") whose body is the list now rendered by `DsUsedPanel` (refactor to `DsUsedList` content component) | The panel no longer renders under the page | n/a |
| Sample data | The "Sample data" pill leaves page headers; the lab bar shows nothing extra because the whole lab is sample data (state it once in the `/lab` index intro) | n/a | n/a |

### 4.2 Responsive

| Width | Behaviour |
|---|---|
| 1280 and up | One row as drawn |
| 768 to 1279 | Journey step names hide; prev and next become `size="icon-sm"` buttons with the labels in `Tooltip` and `aria-label`; set labels shorten to "1", "2", "3" with full names in each option's `aria-label` |
| Below 768 | One `DropdownMenu` "Lab" (`Button variant="outline" size="sm"`) holds persona, flow, set, scenario and components; prev and next icon buttons stay visible on the right |

### 4.3 Acceptance checks for the lab bar

1. Exactly one lab row; height 40 px at 1440; no text line "Tests:" anywhere.
2. No `[data-lab-chrome]` element inside `main` page content except the lab bar and its sheet.
3. On a flow step, switching the set keeps the step and changes the variant; next and previous keep the set and `skill`.
4. Every URL in `screens.json` still renders (route test, section 5.4).
5. The density script keeps excluding `[data-lab-chrome]`.
6. Keyboard: the bar is one tab stop group in reading order (persona, flow, prev, next, set, scenario, info, components); Escape closes menus and the sheet; focus returns to the trigger.

---

## 5. Registry and URL scheme

### 5.1 URLs

| URL | Renders | Status |
|---|---|---|
| `/lab` | Index with two tabs: **By flow** (default: rows = flows, columns = steps, each cell shows set chips 1 2 3 linking to `/lab/flow/{flow}/{step}?set=n`; planned cells muted) and **By persona** (today's matrix) | changed |
| `/lab/flow/{flowId}/{stepId}?set=1&skill=...` | New route `app/(lab)/lab/flow/[flow]/[step]/page.tsx`: resolves the step's `screen` and `variants[set]`, renders `LabFrame` (persona from the flow) + `LabBar` + the variant component, passing extra step params (for example `step=check`) by merging them into the URL with `redirect` only when absent | new |
| `/lab/{persona}/{screen}?variant=X` | Unchanged renderer. The lab bar looks up `flows.json` for a step whose screen and variant match and, when found, shows the journey and the set; otherwise it shows variant mode | kept, no redirect |
| `/lab/admin/import` | Alias to `/lab/admin/import-ai-review` (the import doc's preferred slug) via a `redirects()` entry in `next.config` or a tiny page that calls `redirect()`; owner builder 4 | new alias |

No existing link breaks: screen URLs keep working, and `variant` letters keep their meaning (rebuilt variants keep their letters).

### 5.2 Files

`lib/lab/flows.json` (new, builder 4):

```json
{
  "flows": [
    {
      "id": "set-up-skills",
      "title": "Set up skills",
      "persona": "admin",
      "recommendedSet": "1",
      "sets": [
        { "id": "1", "label": "Guided", "summary": "Table, side sheet, step-by-step wizards" },
        { "id": "2", "label": "One page", "summary": "Category tree, inline add, single pages that fold as you finish" },
        { "id": "3", "label": "Many at once", "summary": "Setup board, paste several, file beside the list, one rule for many" }
      ],
      "steps": [
        { "id": "library", "label": "Library", "screen": "admin/skills-library", "variants": { "1": "A", "2": "B", "3": "C" } },
        { "id": "add", "label": "Add a skill", "screen": "admin/add-skill", "variants": { "1": "A", "2": "B", "3": "C" } },
        { "id": "import", "label": "Import", "screen": "admin/import-ai-review", "variants": { "1": "A", "2": "C", "3": "B" } },
        { "id": "configure", "label": "Configure", "screen": "admin/configure-skill", "variants": { "1": "A", "2": "B", "3": "C" } },
        { "id": "publish", "label": "Impact and publish", "screen": "admin/configure-skill", "variants": { "1": "A", "2": "B", "3": "C" }, "params": { "1": { "step": "check", "change": "sample" }, "2": { "section": "check", "change": "sample" }, "3": { "impact": "open", "change": "sample" } } },
        { "id": "map", "label": "Map to courses", "screen": "admin/course-mapping", "variants": { "1": "A", "2": "B", "3": "A" } }
      ]
    }
  ]
}
```

`lib/lab/flows.ts` (new): types `FlowDef`, `FlowStep`, `OptionSet`; `findFlow(id)`, `stepOf(flow, stepId)`, `flowsForScreen(persona, slug, variant)` returning `{flow, step, set}[]`, `flowHref(flowId, stepId, set, carry)`, `neighbours(flow, stepId)`. Unit tests in `tests/lab/flows.test.ts`: every step's screen exists in `screens.json`; every mapped variant exists; every flow has 2 or more sets; `flowsForScreen` round-trips.

`lib/lab/screens.json` additions (builder 4 writes them; builders 1 and 3 add the files):

| Screen | Change | New JSON |
|---|---|---|
| admin/import-ai-review | tier 2 to 1; add C; update A, B questions | A `"question": "Four steps, one job each: does Upload, Review, Fix, Confirm with the drop as the hero and only the lines that need a decision get a 154-line import created safely?"` · B `"question": "File beside the list: is checking the original next to only the lines that need a decision faster than steps?"` · C `{ "id": "C", "question": "One page, one decision at a time: does a single page that becomes a decision queue after the drop reach Create faster than steps?", "file": "components/lab/screens/admin-import-c.tsx", "pageType": "wizard" }` |
| admin/add-skill | tier 2 to 1; add C; update A | A `"question": "Short side sheet: do name, category and description, with configure offered after adding, get a skill in without losing the library?"` · C `{ "id": "C", "question": "Paste several: is pasting 5 to 30 names into the import review faster than adding one at a time?", "file": "components/lab/screens/admin-add-skill-c.tsx", "pageType": "split" }` |
| admin/configure-skill | update questions | A `"Five steps, rule in the footer: do Model, Outcomes, Rule, Evidence and sign-off, Check and publish in one 720 px column, with the live rule always in view, get a skill configured right first time?"` · B `"One page of sections that fold to a summary: is it faster for an expert re-configuring a skill?"` · C `"Rule as a sentence, applied to many: does it get 16 unconfigured skills live fastest?"` |
| admin/skills-library | update A, B questions | A `"Table with status tabs: can a coordinator find and bulk-configure 178 skills from one grouped table?"` · B `"Category tree with a peek panel: do the program's own categories with roll-ups make setup progress easier to work through?"` |
| every variant | add `"pageType"` (`list`, `wizard`, `form`, `detail`, `split`, `dashboard`, `evaluator`, `student`) so the density script and `data-page-type` read one source | n/a |
| screens with demo controls | add `"scenarios"`: `[{ "group": "Data", "label": "Load a sample rule change", "params": { "change": "sample" } }, { "group": "Data", "label": "Open an unconfigured skill", "params": { "skill": "sk-pressure-injury" } }, { "group": "States", "label": "Loading", "params": { "state": "loading" } }, { "group": "Data", "label": "Reset edits", "event": "lab:reset" }]` (configure); import: `Use the sample file` (`state=review`), `Use the large sample` (`state=large`), `Failed read` (`state=failed`), `All clear` (`state=clear`), `Done` (`state=done`), `Empty` (`state=empty`); library and add: `Loading`, `Empty`, `Error` | n/a |
| screens with lab notes | add `"labNotes"`: configure `["Open decision: how evidence already held is treated"]`, starter-library `["Conflicts with the rule that Prism ships no skills; kept as an editable starting point"]`, add-skill `["Category versus section and group is open"]` | n/a |

`components/lab/screens/index.ts`: register `admin/import-ai-review/C` and `admin/add-skill/C` (builder 4, in the wire-up commit after builders 1 and 3 merge).

### 5.3 Current screens and variants to flow steps and sets (migration, minimal churn)

No file is renamed and no letter changes meaning. Rebuilt variants keep their letters; two letters are new (import C, add-skill C).

| Current screen / variant | Flow / step | Set(s) | Action |
|---|---|---|---|
| admin/skills-library A, B, C | set-up-skills / library; keep-library-right / library | 1, 2, 3 | Rebuild A, B; clean C |
| admin/add-skill A, B (+ C new) | set-up-skills / add | 1, 2 (3 new) | Rebuild A; clean B; build C |
| admin/import-ai-review A, B (+ C new) | set-up-skills / import | 1, 3 (2 new) | Rebuild A, B; build C |
| admin/configure-skill A, B, C | set-up-skills / configure, publish | 1, 2, 3 | Rebuild all |
| admin/rule-change-impact A, B | none (folded into configure step 5) | n/a | Keep registered; remove its in-page demo bar (builder 2) |
| admin/starter-library A, B | none (library overflow) | n/a | Keep; move "Decision pending" to labNotes |
| admin/course-mapping A, B | set-up-skills / map | 1 and 3 = A, 2 = B | Accept `?skill=` (later) |
| admin/dashboard A to F, dashboard-drill A, B, attainment A, B, export A, B | watch-the-cohort | per 3.2 | Registry only |
| admin/retire-deactivate, lists-cohorts, settings, evaluator-directory A, B | keep-library-right | 1 = A, 2 = B | Registry only |
| admin/approvals A, B | admin-approvals | 1 = A, 2 = B | Registry only |
| student/* (9 screens, 19 variants) | ask-for-evaluation, my-progress | per 3.2; offline-sync A, B as side steps of my-progress | Registry only |
| evaluator/* (4 screens, 12 variants) | sign-skills | 1 = A, 2 = B, 3 = C | Registry only; move `components/lab/evaluator/lab-controls.tsx` content to scenarios (follow-up, not in the 4 builders) |
| lab-instructor/lab-batch-grid A, B | record-a-lab-session | 1 = A, 2 = B | Registry only |
| reviewer/* (4 screens, 11 variants) | clear-approvals | per 3.2 | Registry only |
| director/* (4 screens, 9 variants) | confirm-readiness | per 3.2 | Registry only |

### 5.4 Tests builder 4 adds or updates

- `tests/lab/flows.test.ts` (new): integrity checks in 5.2.
- `tests/lab/registry.test.ts`: tier rule (1 = three variants) passes with import and add-skill at tier 1; every variant has `pageType`.
- `tests/lab/density-budget.mjs`: read `pageType` from `screens.json` instead of the local `PAGE_TYPE` map, and add the `wizard` budget from `01` section 3.
- A route smoke script (Playwright, `scripts/lab-route-smoke.mjs`): for every screen URL and every flow step and set, status 200 and a `main h1` present.

---

## 6. Shared layout primitives builder 4 ships first (APIs other builders code against)

Location `admin/components/lab/layout/`. All DS-only; no hex; `'use client'` where interactive.

```ts
// sticky-footer.tsx
export function StickyFooter(props: {
  back?: { label?: string; onClick: () => void }          // outline, size default; label default "Back"
  context?: React.ReactNode                                 // text-sm muted, 10 words or fewer, aria-live="polite"
  primary?: { label: string; onClick?: () => void; href?: string; disabled?: boolean; loading?: boolean }
  secondary?: { label: string; onClick?: () => void; href?: string } // outline, rare
  summary?: React.ReactNode                                 // left slot used by configure for the rule sentence (replaces back position; back moves next to primary)
}): JSX.Element
// renders <div data-region="footer" className="sticky bottom-0 z-10 flex min-h-16 items-center gap-3 border-t border-border bg-background py-3"> inside the page column

// wizard-page.tsx
export function WizardPage(props: {
  title: React.ReactNode; subtitle?: React.ReactNode; actions?: React.ReactNode
  width?: "wizard" | "form"                                 // 960 or 720
  steps: WizardStep[]; current: number; linear?: boolean; onStepClick?: (i: number) => void
  banner?: React.ReactNode                                  // LocalBanner slot under the stepper
  footer: React.ReactNode                                   // a <StickyFooter/>
  children: React.ReactNode                                 // WizardPanel per step
}): JSX.Element
// renders PageFrame(width) > Wizard(orientation="horizontal", variant="compact") > WizardNav (data-region="stepper")
//   + WizardProgress className="sr-only" aria-live + banner + WizardContent(data-region="panel") + footer
// root carries data-page-type="wizard" (or "form")

// form-page.tsx
export function FormPage(props: { title; subtitle?; actions?; footer?: React.ReactNode; children }): JSX.Element // PageFrame width="form", data-page-type="form"
```

`components/skills/page-header.tsx` (additive): `PageFrameWidth` gains `"form"` (`max-w-[45rem]`) and `"wizard"` (`max-w-[60rem]`); `subtitle` type widens from `string` to `React.ReactNode` (PageHeader already accepts a node). v2 callers are unaffected.

---

## 7. Work breakdown: four parallel builders, disjoint file sets

Start after the current cleanup worker finishes (it is editing `components/lab`, `lib/lab` and `tests`). Every builder reads the standing brief, `01`, `02` (their section) and this section, runs `node scripts/lab-ds-gate.mjs` and `npx vitest run tests/lab`, pastes the density line for each variant at 1440 x 900, and screenshots 1440, 1024, 375.

| Builder | Owns (only these files) | Builds | Depends on |
|---|---|---|---|
| **B4 Lab frame and journey** | `components/lab/lab-frame.tsx`, `variant-bar.tsx` (becomes a thin re-export of `LabBar` for any stray import), new `lab-bar.tsx`, `journey-bar.tsx`, `scenario-menu.tsx`, `ds-used-panel.tsx` (split into `DsUsedList` + sheet), `lab-index.tsx`, new `components/lab/layout/*`, `components/skills/page-header.tsx` (additive only), `app/(lab)/lab/[persona]/[screen]/page.tsx`, new `app/(lab)/lab/flow/[flow]/[step]/page.tsx`, the `/lab/admin/import` alias, `lib/lab/screens.json`, `lib/lab/screens.ts`, new `lib/lab/flows.json`, `lib/lab/flows.ts`, `components/lab/screens/index.ts`, `lib/lab/ds-used.generated.json` (via the gate), `scripts/lab-ds-gate.mjs`, `scripts/lab-gen-registry.mjs`, `tests/lab/registry.test.ts`, new `tests/lab/flows.test.ts`, `tests/lab/density-budget.mjs`, new `scripts/lab-route-smoke.mjs` | Sections 4 to 6 of this doc. Commit 1 (first, within the first hour): layout primitives and PageFrame widths, so B1 to B3 can import them. Commit 2: lab bar, journey, scenario menu, drawer, flows, registry entries (new variants without `file`, so they render "Planned"). Commit 3 (after B1 to B3 merge): wire-up: `file` fields, `index.ts` registrations, gate `--write`, density run over all setup variants | none |
| **B1 Import** | `components/lab/screens/admin-import-a.tsx`, `admin-import-b.tsx`, new `admin-import-c.tsx`, `components/lab/import/import-parts.tsx`, `use-import-session.ts`, `sample-badge.tsx` (remove from headers), new `components/lab/import/dropzone.tsx`, `fix-list.tsx`, `decision-card.tsx`, `lib/lab/import.ts`, `tests/lab/import.test.ts` | 02 section 3 (sets 1, 2, 3). Support `?source=paste` reading `sessionStorage["lab:import:paste"]` (text and category) so add-skill C can hand off without sharing components. Listen for `lab:reset`. Do not touch `starter-copy.tsx` | B4 commit 1 |
| **B2 Configure and publish** | `components/lab/screens/admin-configure-skill-a.tsx`, `-b.tsx`, `-c.tsx`, `admin-rule-impact-a.tsx`, `admin-rule-impact-b.tsx` (remove in-page demo bar only), `components/lab/configure/*` (`shell.tsx` loses the demo bar; `live-panel.tsx` becomes the footer summary; `impact.tsx` serves step 5 and the set 3 dialog), `lib/lab/configure.ts` (five-entry `SECTIONS`), `tests/lab/configure.test.ts` | 02 section 4 (sets 1, 2, 3, step 5). Accept `?step=check`, `?section=check`, `?impact=open`, `?skills=a,b,c`. Listen for `lab:reset` | B4 commit 1 |
| **B3 Library and add** | `components/lab/screens/admin-skills-library-a.tsx`, `-b.tsx`, `-c.tsx`, `admin-add-skill-a.tsx`, `admin-add-skill-b.tsx`, new `admin-add-skill-c.tsx`, `components/lab/library/*`, `lib/lab/library.ts`, `tests/lab/library.test.ts` | 02 sections 5 and 6. Add-skill C writes `sessionStorage["lab:import:paste"]` and routes to `/lab/admin/import-ai-review?variant=A&source=paste&step=fix`. Library bulk "Configure together" routes to configure C with `?skills=` | B4 commit 1 |

**Merge order:** B4 commit 1 > B4 commit 2 > B1, B2, B3 in any order (no shared files) > B4 commit 3 (wire-up, gate `--write`, density and route smoke over every setup variant) > Gate 2 reviewers (`ds-conformance-reviewer`, `state-review`, `verification-reviewer`) on the whole set.

**Known cross-builder contracts** (the only coupling): the `StickyFooter`, `WizardPage`, `FormPage` APIs (section 6); the `lab:reset` window event; the `lab:import:paste` sessionStorage key `{ text: string; category?: string }`; the URL params listed per builder; registry entries written by B4 from the JSON in section 5.2.
