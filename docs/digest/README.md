# Workspace Digest

Auto-generated snapshot of every load-bearing artifact across the workspace. Loaded by the SessionStart hook on `compact` matcher so post-compaction recovery has a current snapshot without re-reading every file.

## Files

- `latest.md` — current digest. Always reflects the most recent generation. **Tracked in git.**
- `<YYYY-MM-DD>.md` — date-stamped digest. Generated alongside `latest.md`. **Gitignored** to avoid commit churn — regenerate from current workspace state with `python3 scripts/generate-digest.py`.

## Regenerate

```bash
python3 scripts/generate-digest.py
```

Idempotent — overwrites the day's file. Includes:
- All workspace + per-product ADRs (id, title, status, date)
- All storytelling perspective files (product, persona, last-updated)
- All patterns by category
- Cross-product signals (S-NN + W-NN watchlist)
- Competitor anchors (#<product-id>)
- Subagent registry rows + workspace-defined custom agents
- Active overrides

## When to regenerate

- After adding a new ADR / perspective / pattern
- Before a long session, so SessionStart loads a current snapshot
- Weekly, as a hygiene step (not yet automated)

## Why latest is git-tracked

So a fresh checkout has a usable digest immediately, without requiring a script run. The `latest.md` is a small file (~1KB) and reflects the workspace state at last commit — that's exactly what a fresh contributor needs.

## See also

- `scripts/generate-digest.py` — generator
- `docs/governance/context-architecture.md` §6 Tier 2 #5 — design rationale
- `.claude/hooks/session-start.py` — consumer
