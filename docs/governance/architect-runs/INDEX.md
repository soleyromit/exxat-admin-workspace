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
| _(none yet — first run is pending)_ |

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
