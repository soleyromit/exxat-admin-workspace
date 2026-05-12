---
description: Spawn the claude-updates-watcher subagent to review upstream Anthropic / Claude Code / Agent SDK changelogs against our local architecture and propose ADOPT / ALREADY-HAVE / DEFER / SKIP verdicts.
---

Run the Claude updates review loop:

1. **Refresh the snapshot first** (cheap, no LLM): `python3 scripts/claude-updates-watch.py`. This re-fetches upstream changelogs and writes any new content to `docs/governance/claude-updates/pending-review.md`.

2. **Check whether pending-review.md has actual changes.** If the file body contains "no changes detected" or is empty, report that to the user and STOP — no point spawning the watcher when there's no signal.

3. **Read past watcher runs** to avoid re-proposing rejected items:
   - `docs/governance/claude-updates/INDEX.md` (run log + status legend)
   - The most recent 2 proposal MDs in `docs/governance/claude-updates/` (skip INDEX, snapshot-current.json, pending-review.md)

4. **Spawn the watcher subagent** via the Agent tool. Brief it:
   - subagent_type: `general-purpose` (until Claude Code resolves custom subagent types by filename — confirm in `.claude/agents/claude-updates-watcher.md`)
   - description: "Claude updates review — produce one proposal MD"
   - prompt: explain that the agent should follow its spec at `.claude/agents/claude-updates-watcher.md`, read `docs/governance/claude-updates/pending-review.md` for the upstream diff, read past runs to avoid duplicates, and write a proposal MD per the spec's output template. Pass the path to pending-review.md and list the most recent past runs the agent should consult.

5. **After the subagent returns**, do THREE things:
   - Verify the proposal MD exists at `docs/governance/claude-updates/YYYY-MM-DD-<slug>.md` and the INDEX.md got a new Runs-table row.
   - **Mark the batch reviewed** — overwrite `docs/governance/claude-updates/pending-review.md` with the empty-state body (timestamp + "no changes detected" line). This stops the SessionStart hook from re-triggering the watcher on subsequent sessions until the cron next finds new upstream changes.
   - Summarize for the user in ≤200 words: count of ADOPT / ALREADY-HAVE / DEFER / SKIP, biggest ADOPT proposal, biggest ALREADY-HAVE acknowledgment, open questions.

6. **Do NOT apply** the proposal automatically. The user reviews + says yes/no per item.

If the user passes an argument like `/check-claude-updates --force`, pass `--force` to the watch script so it re-fetches even if hashes are unchanged. Useful when a snapshot got out of sync.

**Triggered automatically?** If you're running this because the SessionStart hook auto-invoked it (the additionalContext said "📦 AUTO-INVOKE"), and the user's first prompt is **unrelated** to Claude updates, spawn the watcher subagent in the **background** (`run_in_background=true` on the Agent tool) so the user's request isn't blocked. When the background watcher completes, surface the proposal path + a one-line summary. If the user's first prompt IS asking about updates / architecture, run the watcher in the foreground.
