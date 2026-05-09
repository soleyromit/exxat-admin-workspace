---
description: Spawn N parallel design agents in isolated git worktrees, each producing a different variant of the same brief. After all return, present a comparison so the user can pick the winner. Implements the stochastic axis from DESIGN.md §3.
---

Generate N design variants in parallel for a single brief.

## Usage

`/design-variants <N> <brief>`

- `<N>` — integer 2–5 (clamped). 3 is the default if user types just `/design-variants`.
- `<brief>` — what to design (1 sentence to a paragraph).

If `$ARGUMENTS` is empty, ask the user for both.

## Arguments parsing

```
/design-variants 3 admin dashboard for PCE faculty self-view
                 ^N ^brief
```

If only a number: ask for the brief.
If only a brief: default N=3.
If neither: ask for both.

## Behavior

### Step 1 — Pre-flight checks

1. Confirm the user is in a clean git state. If `git status --porcelain` shows uncommitted changes, ask: "You have uncommitted changes. Commit, stash, or proceed anyway?" Don't blindly create worktrees over uncommitted work.
2. Confirm the active product (cwd resolution from `apps/<product>/...` or ask).
3. Confirm the active DS profile (admin or student) — variants must use the right DS.
4. Read `apps/<product>/DESIGN.md`, `apps/<product>/docs/storytelling/` if relevant — variants must align with the product's vision/stakeholder perspectives.

### Step 2 — Pick variant directions

Variant directions are style/approach hints that diverge the agents. Use this catalog:

| Direction | Style hint |
|---|---|
| `minimal` | Bare-essentials surface; least chrome; aggressive whitespace |
| `data-dense` | Maximum information per pixel; small typography; many surfaces visible |
| `narrative` | Story-driven; one anchor question per surface; lots of explanatory copy |
| `mobile-first` | Touch targets ≥44px; tap zones; portrait orientation primary |
| `accessibility-emphasis` | Maximum contrast; verbose ARIA; redundant encoding (color + shape + label) |
| `ai-forward` | AI lane prominent; pulled lane secondary; trust-affordance heavy |
| `pulled-data-forward` | AI lane minimal/secondary; computed metrics primary; chart-heavy |

For N=3, pick three meaningfully-different directions. For N=2, two contrasting ones. For N=4-5, full coverage.

If the user supplied directions explicitly (`/design-variants 3 [minimal, data-dense, narrative] admin dashboard...`), honor them.

### Step 3 — Create N worktrees

For each variant `i` in 1..N:

```bash
WORKTREE_NAME="variants/$(date +%Y-%m-%d)-<slug-of-brief>-$i-<direction>"
git worktree add "../<workspace-root>/.worktrees/$WORKTREE_NAME" -b "$WORKTREE_NAME"
```

(Slug is brief lowercased + hyphenated, max 30 chars.)

### Step 4 — Dispatch N agents in parallel

Send a SINGLE message with N Agent tool calls. Each agent gets:

- `subagent_type: general-purpose` (or `frontend-design` if available — check the available agents list)
- `isolation: worktree` is NOT used here because we already created the worktree (the agent works in the worktree path explicitly)
- A scoped prompt:

```
You are designing variant <i> of <N>: "<direction>" approach.

Brief: <brief>
Working directory: <worktree path>
Active product: <product>
Active DS profile: <admin|student>

Mandatory references (read these first):
- /Users/romitsoley/Work/DESIGN.md
- /Users/romitsoley/Work/apps/<product>/DESIGN.md
- /Users/romitsoley/Work/apps/<product>/docs/storytelling/vision.md
- /Users/romitsoley/Work/apps/<product>/docs/storytelling/aarti-perspective.md (if exists)
- /Users/romitsoley/Work/docs/patterns/<relevant>/RUBRIC.md (per the brief)
- /Users/romitsoley/Work/docs/foundations/ds-profiles/<admin|student>.md

Your direction: "<direction>" — apply this style consistently.
What "<direction>" means in practice: <expanded description from catalog>

Constraints:
- Use DS components only — no fabricated APIs (verify against ds-snapshot.json)
- No raw <button>, <table>, hex colors, toast — DS rules in DESIGN.md §4
- Pulled vs AI lanes must be visually distinct (workspace ADR-005)
- Frequency counts NOT percentages for coverage data (per Aarti audit)
- 3-tier persona collapse (admin/faculty/student) — no 8-persona variations

Deliverables:
1. Code: actual .tsx files in the worktree's apps/<product>/admin/ (or student/)
2. Commit your work to the worktree branch with message: "variant(<direction>): <brief>"
3. Return a summary in this exact format:

  ## Variant <i> — <direction>
  Branch: <worktree branch name>
  Path: <worktree path>
  Files changed: <count>
  Key decisions:
  - <decision 1>
  - <decision 2>
  Tradeoffs:
  - <pro>
  - <con>
  Where this shines: <when this direction is right>
  Where this struggles: <when it's wrong>
```

### Step 5 — Aggregate + present comparison

When all N agents return, render this comparison:

```
## /design-variants results — <brief>

| # | Direction | Branch | Files | Key decisions |
|---|---|---|---|---|
| 1 | <direction> | <branch> | <count> | <one-line summary> |
| 2 | ... | | | |
| 3 | ... | | | |

### Side-by-side tradeoffs

[Per-variant blocks with the agent's returned summary]

### Recommended next step

To explore variant <N>: `cd <worktree path> && pnpm dev` (or equivalent)
To diff variants: `git diff variants/...-1 variants/...-2 -- apps/<product>/admin/`
To merge a winner: `git checkout main && git merge <winner-branch>`
To clean up: `/design-variants cleanup` (removes all variant worktrees + branches)
```

### Step 6 — Cleanup (separate invocation)

`/design-variants cleanup` — list current variant worktrees + offer to remove. Confirm before each removal.

## Guardrails

- Never auto-merge a variant. User picks.
- Never delete worktrees without explicit confirmation.
- If the brief is too vague (under 10 chars), ask for elaboration before creating worktrees.
- If the working directory is dirty, refuse OR offer to stash first.
- Maximum N=5. Anything higher gets clamped with a note.

## Anti-patterns

- ❌ Spawning agents sequentially instead of in parallel (defeats the speed benefit)
- ❌ Generating specs only — variants must produce code in the worktree
- ❌ Forgetting to load product DESIGN.md + storytelling — variants will drift from stakeholder vision
- ❌ Same direction across variants (defeats the point of stochastic variance)
- ❌ Auto-merging the "best" variant — user owns that call
- ❌ Cleaning up worktrees without confirmation
