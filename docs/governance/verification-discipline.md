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

When you (Romit) catch me again, append a row. The goal is the table shrinking over time.

---

## What this is NOT

- A guarantee I'll always follow it. It's a discipline; I'll still slip. The infra around it (`verification-reviewer` subagent, audit script, registry) is the backstop.
- A replacement for your eye on visual / semantic / stakeholder questions. Those require human judgment. The discipline reduces the *frequency* of having to call them out.

---

## Where this gets enforced

- **Workspace CLAUDE.md §8** references this file and lists the 5 patterns as absolute rules.
- **`verification-reviewer` subagent** is the post-claim audit. Spawn it when I'm about to declare a non-trivial change done.
- **Pre-commit hook** runs `ds-adoption-audit.py` — catches one slice of Pattern D (Card-imposter, raw-table, organism-collision).
- **Component depth audits** (`docs/governance/component-depth-audits/`) are the durable record of Pattern C + D applied per component.
- **`docs/governance/blind-spots.md`** row #13 tracks this verification-discipline gap as a meta-bug class.
