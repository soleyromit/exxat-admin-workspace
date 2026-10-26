# Build notes, B4: lab frame, flows, option sets, lab bar (Phase 1)

**Written:** 2026-10-26. **Spec:** `03-lab-architecture.md` sections 2 to 5. **Consulted:** `../../00-design-brief.md`, `../../glossary.md`, `../../02-decisions-ledger.md`, `01-layout-patterns.md`, `README.md`, `../lab-README.md`.
**Phase 1 boundary:** `lib/lab/screens.json`, `components/lab/screens/index.ts` and every screen file were not touched (builders B1 to B3 own them now). Phase 2 does the registry restructure (`scenarios`, `labNotes`, `pageType`, new variant `file` fields), maps set letters to the builders' variants, and removes the pending list in `tests/lab/flows.test.ts`.

## What exists now

| Piece | Path | Notes |
|---|---|---|
| Flows data | `admin/lib/lab/flows.json` | 10 flows covering all 6 personas, each step pointing at a registered screen, set to variant letter per step, per-set params for the publish step |
| Resolvers | `admin/lib/lab/flows.ts` | `resolveStep(flow, step, set)` with fallbacks (set, then recommended set, then the screen's recommended variant); `neighbours`, `flowHref` (carries `skill stu course term cohort group basis` only), `flowsForScreen` (screen URL to flow step; publish only matches when its params are in the URL) |
| Lab bar | `admin/components/lab/lab-bar/*` | `LabBar`, `PersonaSwitcher` (moved from `lab-frame.tsx`, re-exported there), `useLabBar`, scenarios and `LAB_EVENTS`, `useLabEvent` |
| Frame | `admin/components/lab/lab-frame.tsx` | `LabFrame({ persona, bar, title, navPersona })`; the utility bar lost the "Design lab" badge and persona switcher; light frame = sticky lab bar + plain "Prism" header |
| DS list | `admin/components/lab/ds-used-panel.tsx` | `DsUsedList` (content) and `dsUsedCount`; `DsUsedPanel` kept for stray imports, no longer rendered under pages |
| Routes | `app/(lab)/lab/flow/[flow]/[step]/page.tsx` (new), `app/(lab)/lab/[persona]/[screen]/page.tsx` (lab bar instead of variant bar and DS panel; `/lab/admin/import` alias redirects with its query), `app/(lab)/lab/page.tsx` (Suspense for the index tabs) |
| Index | `admin/components/lab/lab-index.tsx` | Tabs "By flow" (default) and "By persona" (`?view=persona`) |
| Scripts | `admin/scripts/lab-route-smoke.mjs`, `admin/scripts/lab-chrome-gate.mjs` | Smoke: every screen variant URL and every flow step and set returns 200 with the lab bar in the HTML. Chrome gate: the DS gate's violation rules on the lab chrome files |
| Tests | `admin/tests/lab/flows.test.ts`, `admin/tests/lab/lab-bar.test.tsx` | 15 + 11 tests |

## Lab bar behaviour

- One 40 px row, `role="region"` "Design lab controls", `data-lab-chrome`. In the staff shell it sits inside `SidebarInset` above `data-page-scroll`, so it never scrolls and never enters page content.
- Layout follows the bar's own width (container queries), because the sidebar eats part of the viewport: 72 rem and up shows step names and the set as a `ViewSegmentedControl`; 64 to 72 rem uses icon previous and next and a set menu; below 64 rem one "Lab" menu holds persona, flow, set, scenario, the question and components, with the set menu visible from 32 rem and previous and next on the right. At 1440 with the sidebar open the bar is wide; at 1024 it is narrow.
- Set switch on a flow step writes `?set=` and keeps the step; the last set per flow persists in `localStorage` `lab:set:{flow}` (try/catch) and is restored when a flow URL has no `set`.
- Off a flow (for example starter library) the control lists variants exactly like the old variant bar and writes `?variant=`.
- On a screen URL that maps to a flow step, the journey shows and its links go to the flow route.
- Scenario menu: screens.json `scenarios` when present, else the fallback table in `lab-bar/scenarios.ts` (configure, import, library, add, admin dashboard, copied from spec 5.2). A params scenario replaces only the params of its own group, so record and scope params survive. Events: `lab:reset`, and `lab:scenario` with the scenario as `detail`.
- Info tooltip: set summary, the variant question, "Recommended", and any `labNotes`.
- Components: `Sheet` right `md`, title "Design system components on this page"; focus returns to the visible trigger on close.

## Decisions I made (reversible, flag to Romit)

1. Side steps (`side: true`, `after`) for offline sync, reviewer students, director attainment and evaluator expired. Their set mappings are `[INFER]`: 1 = A, 2 = B, 3 = A or C where the screen has C. The spec lists them only as side steps.
2. The lab instructor flow ends on `evaluator/submitted`; the frame follows the screen's persona (both light), the bar names the lab instructor.
3. `/lab` "By flow" lays each flow out as rows = steps, columns = sets (one table per flow) instead of one matrix with rows = flows and columns = steps; flows have 2 to 6 steps, and per-flow tables read better at 375. Each flow also has "Walk it in Set 1, Set 2, Set 3" links to step 1.
4. Persona switch on a flow page lands on that persona's first flow at step 1; elsewhere on the persona's landing screen.
5. Flow route: an explicit `?variant=` wins over the set (course mapping A sets `variant=B` itself when a skill is passed).

## Known gaps

- The sidebar row does not highlight on `/lab/flow/...` (AppSidebar matches by path). The breadcrumb names the persona and screen through frame context.
- In-page demo controls still exist in screens (configure "Scenario" button, evaluator "Lab state" select, library and import sample controls). Removing them is the builders' work and the evaluator follow-up in spec 5.3.
- Route smoke checks the HTTP status and the server-rendered bar, not client runtime errors.
- `tests/lab/registry.test.ts` and `density-budget.mjs` changes (pageType, wizard budget) wait for Phase 2 with the screens.json restructure.

(Phase 1 gaps above are closed by Phase 2 below, except the route smoke caveat.)

# Phase 2 (2026-10-26): links follow the set, lab bar redesign, present mode

## Why
Romit: "variants and nav inside the variants aren't matching". In-page links hard-coded variant letters (configure `?variant=A`, library `?variant=C`, dashboard drills `variant: "C"`/`"E"`, director worklist `"C"`), and the attainment page used `set` for its own Required set switch, so a click inside option set 2 or 3 landed in another design.

## What changed
| Piece | Path | Notes |
|---|---|---|
| Set-aware link builder | `admin/lib/lab/links.ts` | `labHref(screen, params, ctx)`, `rewriteLabUrl`, `activeSetFor` (URL set, then inverse mapping, then session `lab:set`, then recommended), `navHref` (sidebar rows open their flow), `variantFor`, `lettersOutsideSets`, `variantCounts`. Never emits a variant letter except a self link on a variant outside the sets |
| Page context and sinks | `admin/components/lab/lab-bar/page-context.tsx`, `lab-link.tsx` (LabLink, useLabRouter), `lab-banner.tsx`, `lab-key-metrics.tsx` | 84 lab files import `LabLink as Link`; 17 import the LocalBanner wrapper; 5 the KeyMetrics wrapper; 9 router.push sites use `useLabRouter`. A query-only href (`?skill=x`) keeps the set and scope |
| Letters removed | 26 call sites (see the lint) | `tests/lab/links.test.ts` fails on any `/lab/<persona>/<screen>?variant=`, `variant=[A-F]` or `variant: "X"` outside lab-bar, flows.ts, links.ts, screens.ts |
| Shared drills | `admin/components/lab/screens/shared-drills.tsx` | The list behind a figure renders in every dashboard variant (`?list=records` pipeline list, `?list=holders` evaluator lists, director `?list/skill/status` worklist), so figure links need no letter |
| Cross-set content fixes | course mapping A focuses `?skill=` instead of switching to B; library "Configure together" only in a configure variant that `accepts` `skills` (C), else "Configure the first of n" in the set's own design (`library/configure-many.ts`); "Add several by name" opens the import step; admin approvals B lost its link to the A triage list; reviewer approvals A lost the aging link to C; student progress no longer links A/B to C or C to B's `#map` | |
| Param rename | `REQUIRED_SET_PARAM` `set` to `required` (`lib/lab/attainment.ts`, glossary, consistency.mjs) | `set` is the option set |
| Registry | `lib/lab/screens.json` | `pageType` on every variant; `scenarios` on 31 screens; `labNotes` for add a skill and the evaluator form; configure C `accepts: ["skills"]` |
| Flows | `lib/lab/flows.json` | Set up skills: Library > Add > Configure > Impact and publish > Assign to cohort or group (lists-cohorts 1A 2B 3B) > Map; Import is a side step after Add tagged "Later" (granola items 6, 8). Short labels for the narrow bar. Coherence: admin approvals set 2 renamed "Rules first"; my progress set 2 record = A (by skill) |
| Lab bar redesign | `components/lab/lab-bar/lab-bar.tsx` | Three clusters (context, journey, options); short persona name; current step in medium weight, "Step n of m" and dots from 72 rem; set as segmented numbers with the active named; "+n" more variants; icon buttons for scenario, question, components; container-query layouts at 72, 48 and 40 rem; 44 px targets and a 44 px row below 40 rem |
| Outside the sets | lab bar "Variant D (outside the sets)" and "+3" menu; `/lab` lists "Outside the sets" per flow and "n in the sets, m more" per screen | Sankalp's 6 versus 3 |
| Sidebar | `components/lab/lab-frame.tsx` | Rows link to their flow (`/lab/flow/<flow>`, new redirect route), so every step highlights the row by path; urls are bare because the DS compares the whole url; `SidebarCarry` adds the set and scope at click time |
| Present mode | `lib/lab/present.ts`, `components/lab/lab-bar/present.tsx`, `/lab` | `present=1` (URL, carried by every link) plus session. Recommended variant only (routes ignore set and variant), no lab bar (only "Screens" and "Exit present mode"), breadcrumb shows the screen title only, `/lab` shows the 10 marquee screens and reporting as "Not ready" |
| Evaluator in-page lab controls | `components/lab/evaluator/lab-controls.tsx` | Render nothing; their states moved to the Scenario menu |
| Reset | `use-library.tsx`, `use-evaluator.tsx` | Listen for `lab:reset` |
| Noun refresh | `lab-frame.tsx` (useTerms in the nav memo, `TermsBoundary` keyed on the noun), settings naming keeps its confirmation across the re-render | `scripts/lab-terms-check.mjs` |
| Density | `tests/lab/density-budget.mjs`, `strategy/07` | A tab list is ONE control; dashboard B and C exceptions removed (both pass); MODAL RULE: only the modal surface counts when the page is inert; pageType read from the registry |
| Scripts | `scripts/lab-nav-crawl.mjs`, `lab-bar-shots.mjs`, `lab-terms-check.mjs`, `lab-chrome-gate.mjs` | The crawl judges every link on every flow step in every set, clicks sidebar rows for real, and checks the sidebar is identical on every page of a persona and the journey identical across sets |

## Still inconsistent, and why
- Links inside closed menus, sheets and dialogs are not in the DOM during the crawl; they use the same LabLink, but are not crawled.
- Admin dashboard A charts 6 of 3: the thinner lab chrome exposes 88 px of the second tile row (it was 3 of 3 with the old bar). Page design, not chrome.
- Admin add a skill A controls 13 of 8: its sheet is a non-modal FloatingSheetPanel, so the modal rule does not apply; making it modal is a screen decision (U2's file).
- Evaluator form A at 1440: 4 of 3 regions, because two skill cards fit; it was already failing (5 of 3) before.
- The terms boundary re-renders every screen on a noun change, which resets unsaved page state (the naming confirmation is carried across).
