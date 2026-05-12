# DS updates watch (Tier 2 of swap-ready architecture)

> Tracks the two DS submodules (`exxat-ds/`, `studentUX/`) for changes that affect product code: component exports added/removed, tokens added/removed, theme selectors added (e.g., a new `.theme-x` variant or a new HC mode).
>
> Sibling to `docs/governance/claude-updates/` — same propose-don't-apply contract, different signal source.
>
> Watch loop:
> 1. `scripts/ds-update-watch.py` runs on every session start (cheap — diffs JSON snapshots). Also runnable manually after `git submodule update --remote --merge`.
> 2. SessionStart hook auto-invokes the watcher subagent if `pending-review.md` is non-empty.
> 3. The `ds-updates-watcher` subagent reads pending-review, maps deltas to product code (greps for removed token names + removed component imports), writes proposal MD: "DS shipped X — adopt as Y / grep showed N affected files".
> 4. Romit reviews + applies (or rejects).

## Why this exists (the swap-ready story)

Today products import from `@exxat/ds/packages/ui/src` and `@exxat/student/...` via webpack aliases hard-coded in each `next.config.ts`. A DS swap means breaking those links. To get to *"I can switch DS any time, audited every step"*, three tiers are needed:

| Tier | Status | What it does |
|---|---|---|
| **1. DS contract** | Planned | An `@active-ds` indirection alias + contract doc describing required tokens / required component slots. Discovered empirically from Tier 2's diffs. |
| **2. DS-update watcher (this)** | **Shipped 2026-05-12** | Continuous sync — every submodule update produces a proposal MD. The diffs feed Tier 1's contract surface. |
| **3. Per-theme verification** | Planned | Extends `visual-review` to capture every route × every active theme × interaction states. Static audits run per-theme. Before-and-after gating around DS swaps. |

Tier 2 first because the diffs *show* what the contract needs to be.

## Watched sources

| Source | Path | What we extract |
|---|---|---|
| Admin DS exports | `exxat-ds/packages/ui/src/index.ts` | `export * from "./components/ui/<name>"` lines |
| Admin DS theme | `exxat-ds/packages/ui/src/theme.css` | `--token-name` declarations, grouped by selector (`:root`, `.dark`, `.theme-one`, `@media (prefers-contrast: more)`, `@media (forced-colors: active)`, …) |
| Student DS — ui primitives | `studentUX/src/components/ui/*.tsx` | filenames |
| Student DS — shared composites | `studentUX/src/components/shared/*.tsx` | filenames |
| Student DS theme | `studentUX/src/styles/globals.css` | same `--token-name` extraction |

## Status legend

- **PROPOSED** — written by the watcher subagent, not yet reviewed
- **ACCEPTED** — Romit marked accepted; changes shipped to product code
- **REJECTED** — explicitly turned down; the watcher must not re-propose for ≥30 days
- **PARTIAL** — some proposals accepted, others rejected

## Runs

| Date | Slug | Status | Summary |
|---|---|---|---|
| _(none yet — first run is pending)_ | | | |

## How to invoke

```bash
# Manual:
python3 scripts/ds-update-watch.py
# Or in any Claude Code session:
/check-ds-updates
```

The watcher runs automatically on every session start via `.claude/hooks/session-start.py`. Auto-invocation kicks in only if `pending-review.md` shows actual deltas — no nag when the DS is steady.

## Constitution (what the subagent must honor)

From `.claude/agents/ds-updates-watcher.md` §"Hard rules":
1. Cite source file:line + change type (added/removed/renamed-candidate) for every claim
2. For every REMOVED token or component, grep product code for usages and list affected files — never propose removal without consumer-side impact analysis
3. For every ADDED token or component, propose where in product code it should land (or note "no current use case")
4. RENAMED is a heuristic (same value, different name — or same selector, different name) — flag as "RENAME-CANDIDATE", never as fact
5. No product-code edits — only governance/infra/docs proposals
6. Skip whitespace-only or value-tweak token changes unless contrast might shift below WCAG threshold
