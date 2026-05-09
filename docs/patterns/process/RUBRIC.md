# Process Pattern Rubric

> Workspace-level process patterns — how design + engineering work happens, not the artifacts produced.
> Binds DESIGN.md §3 (three axes: Scholastic / Deterministic / Stochastic).

---

## The three process axes (from DESIGN.md)

| Axis | What it is | Pattern |
|---|---|---|
| **Scholastic** | Rules in agent-readable spec, enforceable via hooks | DESIGN.md + L0–L7 layers + `.claude/hooks/` |
| **Deterministic** | Designer-as-final-authority; the file IS the work | Romit in editor / browser / Magic Patterns / Figma |
| **Stochastic** | Agent emits variance per session; parallel exploration | (P3) `design-variants.md` — `/design-variants <N>` |

This rubric covers stochastic process patterns. Deterministic is humans-doing-work (no pattern needed). Scholastic is everywhere else in `docs/`.

---

## When stochastic variance is the right tool

| Situation | Use stochastic? |
|---|---|
| You have one clear answer in mind already | ❌ No — just build it |
| Multiple valid directions with real tradeoffs | ✅ Yes — generate variants, compare |
| Stakeholder is undecided between 2-3 directions | ✅ Yes — generate, present, let stakeholder choose |
| Brief is vague | ❌ No — clarify first; vague briefs produce identical variants |
| Time pressure (need to ship today) | ❌ No — variant generation has overhead |
| Architecture or data-model decisions | ❌ No — these need ADRs, not variants |
| UI/visual/IA decisions where multiple framings are valid | ✅ Yes — natural fit |

## How variants compose (5 directions catalog)

The variant catalog lives in `.claude/commands/design-variants.md`. Recap:

| Direction | When it shines | When it struggles |
|---|---|---|
| `minimal` | Clear primary action; faculty-during-exam UX; mobile | Information-dense admin work |
| `data-dense` | Admin analytics; comparison views; power-user tooling | Mobile; first-time users |
| `narrative` | Onboarding; complex concepts; reports | Operational dashboards |
| `mobile-first` | Student surfaces; field clinical use | Multi-pane admin work |
| `accessibility-emphasis` | Public-facing; regulatory contexts | Aesthetic-led marketing |
| `ai-forward` | New AI features; trust-building surfaces | Established workflows |
| `pulled-data-forward` | Trusted analytics; legacy migration | New AI-driven products |

Pick directions that **meaningfully diverge** for the brief. Three minimal/minimal/minimal variants is wasted dispatch.

## Decision flow

```
Should I run /design-variants?
├─ Brief clear and >10 chars?           → continue
├─ Multiple valid directions?            → continue
├─ Working tree clean?                   → continue (or stash)
├─ Active product + DS profile resolved? → continue
└─ Run /design-variants <N> <brief>
```

```
What do I do with N variants?
├─ Run dev server in each worktree → preview side-by-side
├─ Diff with git diff variants/...-1 variants/...-2 -- apps/<product>/...
├─ Pick a winner → merge OR pull elements into a synthesis variant
└─ Clean up unwanted worktrees with /design-variants cleanup
```

## Anti-patterns

- ❌ Generating variants when the answer is obvious — wastes time
- ❌ Same direction across variants — produces near-identical outputs
- ❌ Generating without reading product DESIGN.md + storytelling — variants drift from stakeholder vision
- ❌ Auto-merging "the best" variant — designer owns that call
- ❌ Variants that produce specs only (not code) — defeats the purpose; you can't preview text
- ❌ Forgetting to commit each variant to its worktree branch — work gets lost
- ❌ Running with uncommitted changes on main — corrupts the comparison baseline
- ❌ Cleaning up worktrees without confirmation — destroys explorations the user might still want

## Pattern catalogue (this folder)

P3 (this round):
- (RUBRIC only)

P4 (this work):
- `design-variants.md` — the canonical process pattern

P5+ (later):
- `synthesis-variant.md` — combining elements from multiple variants
- `variant-review-checklist.md` — what to look for when comparing
