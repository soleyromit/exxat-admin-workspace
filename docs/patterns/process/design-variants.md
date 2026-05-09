# Design Variants — Stochastic Process Pattern

**Question answered:** How do we explore multiple valid design directions in parallel without losing the harness's scholastic guarantees?

**Pattern ID:** `PROCESS-001`
**Binds rules:** DESIGN.md §3 (stochastic axis), workspace ADRs that constrain what variants can do (DS rules, A11Y, VIZ, persona collapse, AI-first)

---

## When to use

The brief admits multiple valid framings AND the stakeholder is undecided between them. Examples:

- "Design the PCE faculty self-view" — could be data-dense (numbers + trends), narrative (your story for this term), or comparative (you vs cohort)
- "Design the Exam Mgmt assessment overview" — could be completion-status-driven (Aarti's call) OR workflow-driven (Vishaka's earlier framing) — though Aarti decided May 7
- "Design the module launcher tile" — could be metric-forward, brand-forward, or task-forward

If the answer is obvious, don't run variants. If the brief is vague, clarify first.

## When NOT to use

| Situation | Use instead |
|---|---|
| Architecture or data-model decision | ADR + writing-plans skill |
| Bug fix / regression | systematic-debugging skill |
| Pattern that's already documented | Just apply the pattern |
| Time pressure | Pick one direction; iterate later |
| Brief under 10 chars | Clarify the brief first |
| Working tree dirty | Commit / stash first |

## How variants stay grounded (the scholastic guarantee)

Every variant agent reads:

1. `/DESIGN.md` — workspace rules (DS / A11Y / VIZ / CONTENT / INTAKE)
2. `apps/<product>/DESIGN.md` — product L2 layer
3. `apps/<product>/docs/storytelling/vision.md` — stakeholder narrative
4. `apps/<product>/docs/storytelling/aarti-perspective.md` (if exists)
5. `docs/patterns/<relevant>/RUBRIC.md` — pattern conventions for the surface type
6. `docs/foundations/ds-profiles/<admin|student>.md` — DS profile

The agent's "direction" (minimal / data-dense / narrative / etc.) is a **stylistic** override; it does NOT override:
- DS rules (DS-001..010)
- A11Y rules (A11Y-001..008)
- VIZ rules (VIZ-001..005 — no progress bars, no red, frequency not %)
- Persona collapse (workspace ADR-004 — 3 tiers)
- Pulled-vs-AI distinction (workspace ADR-005)

A variant that violates a workspace rule should be flagged in its summary so the user can reject or fix.

## How variants diverge

The catalog of directions:

| Direction | What changes |
|---|---|
| `minimal` | Less chrome, more whitespace, fewer surfaces visible |
| `data-dense` | Smaller typography, more metrics per surface, denser tables |
| `narrative` | Question-first headlines, explanatory copy, story-driven layout |
| `mobile-first` | Touch targets ≥44px, single-column dominant, portrait orientation |
| `accessibility-emphasis` | Maximum contrast, redundant encoding, verbose ARIA |
| `ai-forward` | AI lane dominant; pulled lane secondary; trust affordances heavy |
| `pulled-data-forward` | AI lane minimal; computed metrics primary |

A direction is NOT a license to:
- Skip the DS
- Skip A11Y
- Override persona-tier rules
- Pre-tag user-authored content (workspace ADR-005)

## The mechanics (from `.claude/commands/design-variants.md`)

```
/design-variants 3 admin dashboard for PCE faculty self-view

→ Pre-flight: clean working tree? active product? DS profile?
→ Pick 3 directions: e.g., data-dense / narrative / minimal
→ Create 3 worktrees: variants/2026-05-08-faculty-self-view-1-data-dense, ...
→ Dispatch 3 Agent calls in parallel (single message, multiple tool uses)
→ Each agent: reads DESIGN.md + storytelling + patterns; generates code; commits to worktree
→ When all return: comparison table + per-variant summaries + next steps
```

## Variant comparison output

Each variant returns:

```
## Variant <i> — <direction>
Branch: variants/2026-05-08-faculty-self-view-1-data-dense
Path: ../<workspace-root>/.worktrees/variants/...
Files changed: 4
Key decisions:
- Side-by-side rating display: course rating + faculty rating in adjacent panels
- Comparative metric inline: "0.3 above average" rendered as small chip
- Trend chart spans 6 terms with sparkline + delta
Tradeoffs:
- + Maximum information at glance
- − Smaller typography may strain on tablet
Where this shines: power-user faculty checking on prep day
Where this struggles: faculty viewing on phone between meetings
```

The user reads all summaries, opens 1-2 worktrees in dev mode, picks a winner.

## Synthesis variant (advanced)

Sometimes the right answer pulls elements from multiple variants. After running the 3, the user can:

```bash
git checkout main
git checkout -b variants/synthesis
git checkout variants/...-1 -- apps/<product>/admin/dashboard/page.tsx
git checkout variants/...-2 -- apps/<product>/admin/dashboard/components/trend-chart.tsx
# manually merge / hand-tune
```

This is the deterministic axis taking over from stochastic.

## Cleanup

`/design-variants cleanup` lists current variant worktrees and offers per-worktree removal. Confirm each. Don't delete branches automatically (user might want to share or revisit).

## Verification before completion

After picking a winner:

1. Run `superpowers:verification-before-completion` skill
2. Run dev server in the chosen worktree
3. Test golden path + edge cases
4. Type-check + lint pass
5. Then merge

Per workspace's "verification before completion" rule.

## Anti-patterns (specific to design-variants)

- ❌ Running variants on a vague brief ("design something cool") — produces near-identical outputs
- ❌ Picking 3 minimalist directions — defeats divergence
- ❌ Spawning agents sequentially — defeats parallelism
- ❌ Variants that don't commit to their worktree — work gets lost
- ❌ Auto-merging "best" variant — designer owns the choice
- ❌ Skipping DESIGN.md / storytelling reads in agent prompts — variants drift from stakeholder vision
- ❌ Cleanup without confirmation
- ❌ Variants that violate workspace rules (DS / A11Y / VIZ) — flag in summary, don't ship

## Source provenance

This pattern is the realization of DESIGN.md §3's stochastic axis. Workflow validated against `superpowers:dispatching-parallel-agents` skill. The 7-meeting Aarti audit's parallel-agent dispatch (May 5–8 transcripts) is the proof-of-concept that parallel agents work end-to-end.
