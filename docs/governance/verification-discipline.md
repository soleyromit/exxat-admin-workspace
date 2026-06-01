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

## The seven patterns I keep failing on

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

### Pattern G — Grep-verify every claimed change before declaring done (added 2026-05-22)

**What I do wrong:** Say "all changes are in" from session memory. Memory is wrong — linter rollbacks, edit failures, and context compression mean what I think I wrote may not be what's in the file.

**Real example (2026-05-22):** Romit asked "are these all implemented?" I had no idea without checking. The correct answer required spawning an Explore agent to grep-verify every file. Without that step I would have said "yes" when some items could have been missing.

**The fix — before typing "done", "all in", "implemented", or any completion claim:**

1. Spawn `Explore` agent with exact grep commands for each claimed change.
2. Report `PRESENT (file:line snippet)` or `MISSING (what was found instead)` per item.
3. Never claim done from session memory alone.
4. If any item is MISSING: fix it before claiming done.

### Pattern I — Evidence-required: no text assertions (added 2026-06-01)

**What I do wrong:** Claim "WCAG passes", "compliance-reviewer returned GREENLIGHT", "DS imports verified" as plain text without showing the actual evidence. Same session, same model marking its own work = hallucination risk.

**Real example (2026-06-01):** Romit: "Claude forgets WCAG, doesn't do proper visual review, and doesn't execute what it recognizes." Root cause: subagents were "run" in text only — no output was pasted, no grep was shown, no axe-core path was cited. The claim was the verification.

**The fix — every verification claim requires evidence:**

```
## Verification evidence
axe-core: /tmp/visual-check/<product>-<route>.axe.json — 0 violations
  OR: "not run — dev server not started"
DS imports: Button from '@exxatdesignux/ui' (file.tsx:2), DataTable (file.tsx:3)
grep banned patterns: 0 hits (command: grep -n "uppercase tracking-wide" <files>)
compliance-reviewer: [paste literal first line of verdict — GREENLIGHT or NEEDS-MORE: ...]
state-review: [paste literal first line]
verification-reviewer: [paste literal first line]
```

"I ran compliance-reviewer" with no output = Pattern I violation. Paste the verdict or it didn't happen.

### Pattern J — Pre-task state declaration (added 2026-06-01)

**What I do wrong:** Start editing a file without declaring what's currently in it. Result: hallucination about "what was there before", claiming to fix things that were already correct, or missing existing violations entirely.

**Real example (2026-06-01):** Romit: "Claude still doesn't do a good job analysing the old pages and updating/upgrading to new DS." Root cause: Claude begins writing new code without reading and declaring the pre-existing violations in the file. No anchor = no accountability.

**The fix — before touching any file, output:**

```
File: apps/<product>/admin/components/foo.tsx
Current DS violations: [raw <button> at line 23, hardcoded #3b82f6 at line 47]
Hand-rolled with DS equivalent: [<StatusPill> → StatusBadge, local data-table/ → DataTable]
WCAG issues (static read): [FA icon missing aria-hidden at line 31, no aria-label on icon-only Button at line 58]
```

If the file is new: state "new file — no pre-existing violations."
This runs BEFORE Gate 1. Not after. Not during. Before.

### Pattern H — Self-reflections must produce artifacts, not text (added 2026-05-22)

**What I do wrong:** Write "self-reflection" bullets at the end of responses that say "I should have done X" or "next time I will Y" — and then produce nothing. The bullet is discarded at context window end. The mistake repeats.

**Real example (2026-05-22):** Romit asked "are these self-reflection solved or are they just text?" Correct answer: they were just text. No memory was written, no rule was updated, no discipline log entry was added.

**The fix — every self-reflection bullet must immediately produce one of:**

| Bullet type | Required artifact |
|---|---|
| "I should have done X before writing Y" | New or updated rule in verification-discipline.md (this file) |
| "This mistake came from not reading Z" | Discipline log entry (table below) |
| "X still isn't fixed" | TaskCreate or memory entry tracking it |
| "This pattern will repeat across sessions" | `feedback` memory write to `/memory/` |
| "I should make X standard" | Update CLAUDE.md, design-review-protocol.md, or per-product CLAUDE.md |

If you cannot produce an artifact for a bullet, delete the bullet. No bullet without an artifact.

---

## When to apply

| Trigger | Patterns to check |
|---|---|
| I'm about to touch any file | **J** — pre-task state declaration first |
| I'm about to type "clean" or "passes" | A |
| I just fixed a bug Romit flagged | B |
| Romit asked me to do something "for X" where X is a set | C |
| I touched a DS component | D, B (other places with same component) |
| I'm about to claim a non-trivial change is done | E, A, **G**, **I** |
| I ran a subagent | **I** — paste literal verdict, not "I ran it" |
| Romit asks "did you also …" | C, B (I should have anticipated) |
| I added a page that fetches async, accepts form input, or renders a list | F |
| I write a self-reflection bullet | **H** — produce artifact immediately or delete the bullet |

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
| 2026-05-12 | Romit | B | Class-level confirmation: Pattern B is not occasional — Romit reports the same failure with Toggle (QB filter sheets fix not cascaded to other Toggle uses), Button, DataTable, "almost all components". A single discipline-log row per incident undersells it; the failure is structural. Closed 2026-05-12: `.claude/hooks/user-prompt-submit.py` `_cascade_check()` greps `apps/**/*.tsx` for `<ComponentName>` JSX usages when the prompt matches `fix\|redesign\|rework\|polish\|tighten\|improve <Noun>` OR `<Noun> (is broken\|looks wrong)` shapes. Injects a "[Cascade check (Pattern B) — `<Name>` is referenced in N file(s).]" block with file list (capped at 15) before triggers, forcing enumeration. Verified: prompt "fix the toggle" returns `<Toggle>` × 4 paths; "redesign Button" returns 80; "the DataTable is broken" returns 21; "what is the weather" is silent. |

### Bug closures — 2026-05-11

| Bug | Root cause | Fix | Verification |
|---|---|---|---|
| `aria-hidden-focus` on opened DropdownMenu (Bug 1) | Radix `MenuRootContent` (modal=true default) calls `hideOthers()` which sets `aria-hidden="true"` on every sibling of the portaled menu — including `[data-slot="sidebar-wrapper"]`. The kebab/column-options trigger inside that wrapper stays focusable, so axe `aria-hidden-focus` fires. | Added `modal={false}` to every `DropdownMenu` in PCE admin that lives inside the SidebarInset tree: `components/data-table/row-actions.tsx`, `components/data-table/index.tsx` (3 instances), `components/data-table/pagination.tsx`, `components/table-properties/drawer.tsx` (2 instances), `components/app-sidebar.tsx`, plus inline `RowActions` in `app/(app)/surveys/page.tsx`, `app/(app)/admin/standards/page.tsx`, `app/(app)/templates/page.tsx`, `app/(app)/admin/courses/page.tsx`, `app/(app)/admin/content-areas/page.tsx`, `app/(app)/admin/competencies/page.tsx`. Non-modal dropdowns skip `hideOthers` entirely. | `node tools/visual-check/interactions.mjs /surveys /admin/students /analytics /admin/accommodations /admin/courses /templates` → 0 serious violations across all `open-dropdown` states. Fixed 2026-05-11 by Claude. |
| `document-title` on mobile-viewport (Bug 2) | Not a runner timing issue. The runner's `command-palette` step (⌘K) opened `CommandPalette` which crashed with `TypeError: Cannot read properties of undefined (reading 'subscribe')` inside cmdk because DS `CommandDialog` renders `DialogPrimitive.Root` directly WITHOUT wrapping its children in cmdk's `Command` root. cmdk's `CommandInput`/`CommandList`/`CommandItem` all `useContext(CommandContext)` — without the `Command` provider, the context is undefined. The crash put Next.js into its dev error overlay (`<html id="__next_error__">`, no `lang`, no `<title>`), and the subsequent mobile-viewport screenshot captured that error state — hence the `document-title` / `html-has-lang` regression. | Wrapped `<CommandDialog>` children with `<Command>` in `apps/pce/admin/components/command-palette.tsx` (cmdk-root context provider). Imported `Command` alongside `CommandDialog` from `@exxat/ds/packages/ui/src`. | After fix, runner now captures `command-palette` state for every route (previously skipped because input never mounted), and `mobile-viewport` returns clean (`<html lang="en">` + `<title>PCE — Admin</title>` intact). Fixed 2026-05-11 by Claude. |
| `html-has-lang` on mobile-viewport (Bug 3) | Same root cause as Bug 2 (cmdk crash → Next.js error overlay). | Same fix as Bug 2 — `<Command>` wrapper in `command-palette.tsx`. | Same verification as Bug 2 — `/tmp/visual-check/interactions/surveys.mobile-viewport.axe.json` shows 0 serious violations after fix. Fixed 2026-05-11 by Claude. |
| TS error `onOpenAutoFocus` on `DropdownMenuContent` at `qb-table.tsx:2096` (Bug 4) | `@radix-ui/react-menu@2.1.16` moved `onOpenAutoFocus` into `MenuContentImplPrivateProps`, and `MenuRootContentTypeProps extends Omit<MenuContentImplProps, keyof MenuContentImplPrivateProps>` — so the prop is intentionally removed from the public type even though `MenuContentImpl` still wires it at runtime. The DS `DropdownMenuContent` spreads `...props` to `DropdownMenuPrimitive.Content`, so the callback DOES reach the FocusScope, but TS rightly complains about the prop being unknown. | Added a typed proxy `DropdownMenuContentEx` in `apps/exam-management/admin/app/(app)/question-bank/qb-table.tsx` (just below the imports) that re-types `DropdownMenuContent` to accept `onOpenAutoFocus`. Used the proxy for the column-header dropdown (lines 2113 + 2264). Runtime behavior unchanged — focus stays on the inline-filter search input when `hasInlineFilter` is true. | `cd apps/exam-management/admin && pnpm typecheck` exits clean. Fixed 2026-05-11 by Claude. |

| 2026-05-22 | Romit | D | Fixed "no main landmark" without reading DS SidebarInset source first. SidebarInset already renders as `<main>` — added a second `<main>` and created `landmark-no-duplicate-main` across every PCE page. Pattern D: import ≠ correct use. Fix: new `nested-main-landmark` BLOCK rule in `ds-adoption-audit.py`. |
| 2026-05-22 | Romit | G | Said "all changes are implemented" from session memory. Could not verify without spawning Explore agent. Fix: Pattern G added — grep-verify every claimed change before saying done. |
| 2026-05-22 | Romit | H | Wrote "self-reflection" bullets across multiple responses without producing any artifact (no memory write, no rule update, no discipline log entry). The bullets were discarded and the patterns repeated within the same session. Fix: Pattern H added — every bullet must immediately produce an artifact or be deleted. |
| 2026-05-22 | self-caught | D | Wrote SearchInput with `aria-expanded` + `aria-haspopup` without checking ARIA spec for which roles those attributes are valid on. The WAI-ARIA §6.6 / §6.23 tables are not consulted during component authoring. Fix: `aria-combobox-required` BLOCK rule in `ds-adoption-audit.py` catches this at commit time. |
| 2026-05-22 | self-caught | A | Claimed `compliance-reviewer` had verified WCAG when it had only done static code analysis — never opened a browser, never ran axe. Said "GREENLIGHT" when 10 blocking violations existed in the live app. Fix: design-review-protocol.md Gate 2 now requires `run.mjs` + `interactions.mjs` before compliance claim; `wcag-check.yml` runs on every PR and push. |
| 2026-06-01 | Romit | I | "Claude forgets WCAG, doesn't do proper visual review, doesn't execute what it recognizes." Root cause: subagents claimed in text without pasting literal output. No evidence block. Fix: Pattern I (evidence-required) added to verification-discipline.md + CLAUDE.md Gate 2 step 9 — paste literal subagent verdict or it didn't happen. |
| 2026-06-01 | Romit | J | "Claude doesn't do a good job analysing old pages and upgrading to new DS." Root cause: editing files without first declaring what violations exist in them. No pre-task anchor = no accountability for what was there before. Fix: Pattern J (pre-task state declaration) added + CLAUDE.md pre-task block before Gate 1. |
| 2026-06-01 | Romit | B | DS adoption not consistent across old pages — violations fixed in one place but not swept across all siblings. Root cause: Pattern B not enforced structurally. Fix: `/ds-sweep` skill created — systematic per-product backlog before any new work begins on a product. |

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
- **`architect` subagent** (`.claude/agents/architect.md`) reads the discipline log + audit hit counts + commit history at session-end and proposes structural responses (new audit rules, promotions, retirements, consolidations) in `docs/governance/architect-runs/YYYY-MM-DD-<slug>.md`. Closes the loop where new patterns surface via discipline-log entries but the rule SET stays static. Romit reviews + applies; the architect never commits.

---

## Correction Logging Protocol

When Romit points out a mistake in any session, do all three:

1. **Fix the mistake** (as always)
2. **Save a `feedback` memory entry** (as always)
3. **Append a `claude-correction` entry to `docs/watch/updates-log.json`:**

```json
{
  "id": "YYYY-MM-DD-{product}-corr-{seq}",
  "date": "YYYY-MM-DD",
  "product": "{affected product}",
  "type": "claude-correction",
  "title": "Wrong: {one-line description of what was wrong}",
  "what": "{what was wrong} → {what was fixed}",
  "why": "{root cause — e.g. 'did not read Table source before writing JSX'}",
  "source": "Romit (session correction)",
  "severity": null,
  "files": ["{affected files}"]
}
```

This makes every correction visible at:
- `__updates('corrections')` in browser DevTools console
- `localhost:3002/updates` filtered to `claude-correction` type
