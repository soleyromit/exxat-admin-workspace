# Verification Discipline

> The set of self-checks I (Claude) should run *before* declaring something
> done, clean, or complete — so Romit doesn't have to keep asking.
>
> Distilled 2026-05-11 from a session in which Romit had to repeatedly point
> out scope and coverage gaps after I claimed success. Each pattern below
> is a real exchange that should not have happened. The fix is to bake the
> check into my own workflow.
>
> Referenced by:
> - Workspace `CLAUDE.md` §8 (absolute rules)
> - `.claude/agents/verification-reviewer.md` (post-claim audit subagent)
> - `docs/governance/blind-spots.md` row #13 (this pattern as a tracked gap)

---

## The five patterns I keep failing on

### Pattern A — "Clean" ≠ "fine"

**What I do wrong:** Declare a result "clean" when only the narrow checks I ran are clean, without telling you what wasn't checked.

**Real example (2026-05-11):** I said "PCE admin: 0 block / 0 warn, audit clean" after the bulk DataTable migration. You replied with a screenshot of the NURS 210 ReleaseSheet showing "No responses yet" alongside a 73% / 22-of-30 gauge — a semantic conflict + Card-imposter div + footer convention problem the audit can't see.

**The fix — before declaring "clean" or "passes":**

1. State explicitly *what* was checked. List the rules / scripts / tools applied.
2. State *what wasn't* checked. Use this default list:
   - **Visual rendering** — Did I open the page in a browser? If no, say "not visually verified."
   - **Semantic conflicts** — Does the data being displayed match the labels around it? Audit doesn't see this.
   - **Cross-page consistency** — Does this change diverge from how sister pages handle the same shape?
   - **Stakeholder fit** — Does this match the product's experience-principles / Aarti or Vishaka quotes / latest ADR?
3. Pick one phrase: "passes the X rules I ran" or "narrowly clean against the regex set" — never just "clean".

### Pattern B — Fix this everywhere, not just where shown

**What I do wrong:** When you flag a bug, I fix the specific case shown and stop. The same bug shape elsewhere stays.

**Real example (2026-05-11):** You flagged the share-with-faculty sheet's Card-imposter div. I fixed `pce-modals.tsx:453` (ReleaseSheet). The audit then found 4 more Card-imposters in PCE I hadn't checked.

**The fix — when a bug is reported:**

1. Identify the *class* of bug (Card-imposter div, missing aria-invalid, wrong status variant, etc.) — not the specific instance.
2. Search the workspace for siblings. Use grep with the regex that would catch the class.
3. Enumerate ALL hits before fixing any.
4. Report the full count to you, then either:
   - Fix them all in one pass (if the fix is mechanical)
   - Ask which to prioritize (if judgment calls vary)
5. After fixing, run the audit to confirm count drops.

### Pattern C — Enumerate scope first

**What I do wrong:** Take "audit the other components" as "do a few representative ones" instead of all of them.

**Real example (2026-05-11):** You asked me to audit other components after DataTable. I did 6. You pointed out: "I think there are 30 components." You were right; I'd undercounted.

**The fix — for any multi-target task:**

1. Enumerate the full set explicitly *before* starting work. Count.
2. State the count in my first response so you can correct if I'm wrong.
3. Track per-target progress (in TodoWrite, in a doc, or in the response itself).
4. If I'm going to do a subset, say which subset and why explicitly — never silently truncate.

### Pattern D — Compare to canonical, not just check imports

**What I do wrong:** Verify a component's *presence* (does it import the right symbol?) instead of its *use* (does it match the canonical's feature surface, slot composition, variant choice?).

**Real example (2026-05-11):** The PCE pages imported DS `Card`, but used it as a bare container with raw `<div>` children. My audit said "Card is imported." Your KpiButton in analytics imports DS Card but reinvents card chrome with overrides. The depth audits caught what the shallow import-check missed.

**The fix — for any DS-touching change:**

1. Don't trust "X is imported" as evidence of correct adoption.
2. For each DS component used, check whether the slot composition matches the canonical demo at `localhost:4000/library/<id>`.
3. Surface deviations from canonical patterns — even when imports look right.
4. Use the `ds-adoption-reviewer` subagent before introducing new component files.
5. The `card-imposter-div` and `eyebrow-paragraph-outside-card` audit rules catch a slice of this; the rest needs the subagent or a human eye.

### Pattern E — Adversarially review my own recent changes

**What I do wrong:** Don't re-audit my own changes with fresh eyes. Trust that "typecheck passes + dev server compiles" means it's correct.

**Real example (2026-05-11):** I added a LocalBanner to `surveys/[id]/responses/page.tsx`. The Dialog+Banner+Badge audit agent later flagged that the banner's title was doing double duty (full sentence as title + footnote as body — breaks DS hierarchy). I would have shipped that bug; the independent agent caught it.

**The fix — after I make a non-trivial change:**

1. Don't claim done immediately. Either:
   - Spawn `verification-reviewer` subagent to re-audit, OR
   - Re-read my own change with the question "what would an adversarial reviewer say?"
2. Specifically check: does the change match how exam-mgmt (sister product) handles the same shape? Does it match the DS library demo?
3. When you (Romit) catch a bug in my recent change, treat it as evidence the verification step was skipped — add it to the discipline log.

### Pattern F — State coverage (added 2026-05-11)

**What I do wrong:** Verify the default render and claim "done" without checking empty / loading / error / disabled / focus states.

**Real example (2026-05-11):** Across this session I shipped multiple admin list pages where DataTable's default render looked great with seeded mock data, but visiting the same route with `data={[]}` showed the wrong message ("No results match your filters" instead of a first-run empty state with icon + heading + CTA). The static audit's first version had no rule for it — `<DataTable>` was technically "correctly imported" so adoption looked clean. Same pattern for opacity-60-on-text-parent (WCAG fix applied in one place after Romit pointed it out — the audit then found four more siblings), clickable divs without focus rings (qb-table.tsx hot spots), and Dialog forms missing `aria-invalid` despite having validation logic.

**The fix — when adding a page that renders data, form, or list:**

1. Enumerate the seven required states (loading / empty / error / validation / submission / disabled / focus) BEFORE claiming done. Use the table in `docs/patterns/admin/state-coverage.md` §"The seven required states."
2. For each DS component on the page, look up its required-state row in `docs/governance/component-state-catalog.md` and verify the file handles each REQUIRED state.
3. Run the audit and filter for state-coverage rules:
   ```bash
   python3 scripts/ds-adoption-audit.py 2>&1 | grep -E "datatable-no-empty-state|dialog-no-error-feedback|opacity-60-on-text-parent|clickable-without-focus-ring|async-fetch-no-skeleton"
   ```
4. Spawn the `state-review` subagent (`.claude/agents/state-review.md`) for the touched files. It applies the catalog's per-component required-state matrix and returns GREENLIGHT or NEEDS-MORE per file.
5. When you (Romit) catch a state-coverage miss in my recent change, treat it as evidence Pattern F was skipped — add it to the discipline log.

Static enforcement: five audit rules surface the regex-able slice (see `docs/governance/ds-adoption.md` → "State-coverage requirements"). The subagent goes deeper for non-regex-able cases.

---

## When to apply

| Trigger | Patterns to check |
|---|---|
| I'm about to type "clean" or "passes" | A |
| I just fixed a bug Romit flagged | B |
| Romit asked me to do something "for X" where X is a set | C |
| I touched a DS component | D, B (other places with same component) |
| I'm about to claim a non-trivial change is done | E, A |
| Romit asks "did you also …" | C, B (I should have anticipated) |
| I added a page that fetches async, accepts form input, or renders a list | F |

---

## The discipline log

Track each time I get caught skipping a check. Pattern frequency reveals which one I'm worst at.

| Date | Caught by | Pattern | Specific miss |
|---|---|---|---|
| 2026-05-11 | Romit | A | NURS 210 ReleaseSheet semantic conflict — audit was narrowly clean, visual was broken |
| 2026-05-11 | Romit | B | Fixed /surveys but not the 13 other raw-table pages |
| 2026-05-11 | Romit | C | Audited 6 components, said "covered"; actual set is 30 |
| 2026-05-11 | Dialog+Banner+Badge agent | E | My recent LocalBanner in responses/page.tsx had title doing double duty |
| 2026-05-11 | CoachMark+Command agent | D | I'd have recommended CoachMark for onboarding without checking that products' principles docs explicitly forbid welcome-tour overlays |
| 2026-05-11 | state-coverage audit | F | Shipped admin list pages with DataTable + no `emptyState` prop — the 0-row render fell back to "No results match your filters" instead of a first-run empty state. Caught by `datatable-no-empty-state` audit rule across exam-management `/access`, `/private`, etc. |
| 2026-05-11 | state-coverage audit | F | Shipped Cards with `opacity-60` containing `text-muted-foreground` children — drops contrast below WCAG 4.5:1. Caught by `opacity-60-on-text-parent` audit rule (2 hits in exam-management as of audit landing). |
| 2026-05-11 | state-coverage audit | F | Shipped clickable `<div>`s with `onClick` + `cursor-pointer` but no `focus-visible:ring` — keyboard users have no focus indicator. Caught by `clickable-without-focus-ring` audit rule (3 hits in exam-management qb-table + assessments-tab). |
| 2026-05-11 | Romit | A | Claimed agents "checked every page from localhost:4000 + every state + every interaction" when they had only HTTP-fetched static HTML + read demo source + run axe on default-state screenshots. Interaction states (hover, focus, open-dialog, validation-error, submission feedback, theme switch, responsive) were never exercised. The catalog agent itself flagged Calendar `mode="single"` only, 20 components missing from library-catalog.ts, and 6 placeholder-only previews — implicit evidence the interactive layer wasn't walked — but my reply elided that. Closing the gap requires Playwright interaction tests (tracked: `tools/visual-check/interactions.mjs`, separate session). Closed 2026-05-11: `tools/visual-check/interactions.mjs` drives 12 interaction states per route (default, focus walks on button/input/select/dropdown, open-dialog, dialog-validation, open-sheet, open-dropdown, command-palette, mobile-viewport, theme-toggle); `visual-review` subagent consumes the captures and renders a consolidated GREENLIGHT/NEEDS-MORE verdict that considers default + interaction states together. First run against PCE admin `/surveys` + `/admin/students` + `/admin/terms` + `/analytics` surfaced 7 nodes of `aria-hidden-focus` (open-dropdown) + 3 routes × `document-title` + 3 routes × `html-has-lang` (mobile-viewport) — none caught by the default-state runner. |

### Bug closures — 2026-05-11

| Bug | Root cause | Fix | Verification |
|---|---|---|---|
| `aria-hidden-focus` on opened DropdownMenu (Bug 1) | Radix `MenuRootContent` (modal=true default) calls `hideOthers()` which sets `aria-hidden="true"` on every sibling of the portaled menu — including `[data-slot="sidebar-wrapper"]`. The kebab/column-options trigger inside that wrapper stays focusable, so axe `aria-hidden-focus` fires. | Added `modal={false}` to every `DropdownMenu` in PCE admin that lives inside the SidebarInset tree: `components/data-table/row-actions.tsx`, `components/data-table/index.tsx` (3 instances), `components/data-table/pagination.tsx`, `components/table-properties/drawer.tsx` (2 instances), `components/app-sidebar.tsx`, plus inline `RowActions` in `app/(app)/surveys/page.tsx`, `app/(app)/admin/standards/page.tsx`, `app/(app)/templates/page.tsx`, `app/(app)/admin/courses/page.tsx`, `app/(app)/admin/content-areas/page.tsx`, `app/(app)/admin/competencies/page.tsx`. Non-modal dropdowns skip `hideOthers` entirely. | `node tools/visual-check/interactions.mjs /surveys /admin/students /analytics /admin/accommodations /admin/courses /templates` → 0 serious violations across all `open-dropdown` states. Fixed 2026-05-11 by Claude. |
| `document-title` on mobile-viewport (Bug 2) | Not a runner timing issue. The runner's `command-palette` step (⌘K) opened `CommandPalette` which crashed with `TypeError: Cannot read properties of undefined (reading 'subscribe')` inside cmdk because DS `CommandDialog` renders `DialogPrimitive.Root` directly WITHOUT wrapping its children in cmdk's `Command` root. cmdk's `CommandInput`/`CommandList`/`CommandItem` all `useContext(CommandContext)` — without the `Command` provider, the context is undefined. The crash put Next.js into its dev error overlay (`<html id="__next_error__">`, no `lang`, no `<title>`), and the subsequent mobile-viewport screenshot captured that error state — hence the `document-title` / `html-has-lang` regression. | Wrapped `<CommandDialog>` children with `<Command>` in `apps/pce/admin/components/command-palette.tsx` (cmdk-root context provider). Imported `Command` alongside `CommandDialog` from `@exxat/ds/packages/ui/src`. | After fix, runner now captures `command-palette` state for every route (previously skipped because input never mounted), and `mobile-viewport` returns clean (`<html lang="en">` + `<title>PCE — Admin</title>` intact). Fixed 2026-05-11 by Claude. |
| `html-has-lang` on mobile-viewport (Bug 3) | Same root cause as Bug 2 (cmdk crash → Next.js error overlay). | Same fix as Bug 2 — `<Command>` wrapper in `command-palette.tsx`. | Same verification as Bug 2 — `/tmp/visual-check/interactions/surveys.mobile-viewport.axe.json` shows 0 serious violations after fix. Fixed 2026-05-11 by Claude. |
| TS error `onOpenAutoFocus` on `DropdownMenuContent` at `qb-table.tsx:2096` (Bug 4) | `@radix-ui/react-menu@2.1.16` moved `onOpenAutoFocus` into `MenuContentImplPrivateProps`, and `MenuRootContentTypeProps extends Omit<MenuContentImplProps, keyof MenuContentImplPrivateProps>` — so the prop is intentionally removed from the public type even though `MenuContentImpl` still wires it at runtime. The DS `DropdownMenuContent` spreads `...props` to `DropdownMenuPrimitive.Content`, so the callback DOES reach the FocusScope, but TS rightly complains about the prop being unknown. | Added a typed proxy `DropdownMenuContentEx` in `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` (just below the imports) that re-types `DropdownMenuContent` to accept `onOpenAutoFocus`. Used the proxy for the column-header dropdown (lines 2113 + 2264). Runtime behavior unchanged — focus stays on the inline-filter search input when `hasInlineFilter` is true. | `cd apps/exam-management/admin && pnpm typecheck` exits clean. Fixed 2026-05-11 by Claude. |

When you (Romit) catch me again, append a row. The goal is the table shrinking over time.

---

## What this is NOT

- A guarantee I'll always follow it. It's a discipline; I'll still slip. The infra around it (`verification-reviewer` subagent, audit script, registry) is the backstop.
- A replacement for your eye on visual / semantic / stakeholder questions. Those require human judgment. The discipline reduces the *frequency* of having to call them out.

---

## Where this gets enforced

- **Workspace CLAUDE.md §8** references this file and lists the 6 patterns (A-F) as absolute rules.
- **`verification-reviewer` subagent** is the post-claim audit. Spawn it when I'm about to declare a non-trivial change done.
- **`state-review` subagent** is the state-coverage gate (Pattern F). Spawn it after touching any page that fetches async data, accepts form input, or renders a list/grid.
- **Pre-commit hook** runs `ds-adoption-audit.py` — catches one slice of Pattern D (Card-imposter, raw-table, organism-collision) AND the regex-able slice of Pattern F (datatable-no-empty-state, dialog-no-error-feedback, opacity-60-on-text-parent, clickable-without-focus-ring, async-fetch-no-skeleton).
- **Component depth audits** (`docs/governance/component-depth-audits/`) are the durable record of Pattern C + D applied per component.
- **Component state catalog** (`docs/governance/component-state-catalog.md`) is the durable record of Pattern F — required-state matrix per DS component.
- **`docs/patterns/admin/state-coverage.md`** (ADMIN-004) is the prescriptive doc for Pattern F — what each state should look like with canonical file:line citations.
- **`docs/governance/blind-spots.md`** row #13 tracks the verification-discipline meta-bug; row #14 tracks the state-coverage class specifically.
