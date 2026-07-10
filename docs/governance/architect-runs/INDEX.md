# Architect runs

> Index of `architect` subagent proposal runs. Each file in this directory is one proposal session.
>
> Run the architect with: `Spawn .claude/agents/architect.md with input from scripts/architect-input.py`.
> Input bundler: `python3 scripts/architect-input.py --out /tmp/architect.json`.
>
> Status legend:
> - **PROPOSED** — written by the architect, not yet reviewed
> - **ACCEPTED** — Romit (or parent agent) marked it as accepted; changes shipped
> - **REJECTED** — explicitly turned down; the architect must not re-propose the same item ≥3 rejected times
> - **PARTIAL** — some proposals accepted, others rejected
>
> When you accept/reject a proposal, edit the run's MD inline (add a "Decision: …" line under each PROPOSED-* block).

## Runs

| Date | Slug | Status | Summary |
|---|---|---|---|
| 2026-05-11 | baseline | PARTIAL | Promoted 3 rules to block (datatable-no-empty-state, dialog-no-error-feedback, opacity-60-on-text-parent); consolidated Card-masquerade rules; demoted dead-link-audit from pre-commit. Deferred: async-fetch-no-skeleton + clickable-without-focus-ring promotion, subagent-telemetry wrapper. Open: Pattern A pre-tool-use hook (out of architect scope). |
| 2026-06-03 | ds-component-truth | PROPOSED | Proposed 3 new hooks (DS-CSS-001 pre-tool CSS gate, DS-CSS-002 post-tool CSS regression guard, DS-CMP-001 component truth emit on import); demoted mandatory ds-product-compatibility.md read at Gate 1. Awaiting Romit review. |
| 2026-06-09 | workspace-architecture-review | PROPOSED | Proposed: vercel-install-footgun-guard (EM+portal missing --ignore-scripts), raw-html-button promote to block (31 hits spike from builder rebuild), per-product CLAUDE.md Pattern A-L sync (all 3 products cite only A-F). Promoted async-fetch-no-skeleton to block (30 days at 0 hits). Identified: discipline log silent since 2026-06-01 (Pattern H risk). |

## How to invoke

```bash
# Step 1: bundle inputs
python3 scripts/architect-input.py --out /tmp/architect.json

# Step 2: invoke the architect subagent in the parent conversation
# (Pass the JSON path as the agent's input)
```

The architect reads:
- `git log` since the last entry in this INDEX
- `docs/governance/verification-discipline.md` discipline log
- `docs/governance/blind-spots.md` rows
- `scripts/ds-adoption-audit.py --json` current hit counts
- `docs/governance/subagent-invocations.log` (telemetry, may be empty)
- Past architect runs in this directory (so it doesn't re-propose rejected items)

The architect writes one proposal MD per run: `YYYY-MM-DD-<slug>.md`. The slug is short ("rule-promotion-sweep", "subagent-consolidation", etc.).

## Constitution (what the architect must honor)

From `.claude/agents/architect.md` §"Hard rules":
1. Evidence ≥2 occurrences before proposing
2. Max 3 new rules per run
3. Retire/consolidate is unlimited (counter-pressure against bloat)
4. Every NEW must come with a retire/consolidate candidate
5. Cite file:line + ISO-date for every claim
6. Honor self-retire (3 rejections → never propose again)
7. No product-code edits — only governance/infra/docs proposals
