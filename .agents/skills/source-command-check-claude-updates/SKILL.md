---
name: "source-command-check-claude-updates"
description: "Spawn the Codex-updates-watcher subagent to review upstream Anthropic / Codex / Agent SDK changelogs against our local architecture and propose ADOPT / ALREADY-HAVE / DEFER / SKIP verdicts."
---

# source-command-check-claude-updates

Use this skill when the user asks to run the migrated source command `check-claude-updates`.

## Command Template

Run the Codex updates review loop:

1. **Refresh the snapshot first** (cheap, no LLM): `python3 scripts/Codex-updates-watch.py`. This re-fetches upstream changelogs and writes any new content to `docs/governance/Codex-updates/pending-review.md`.

2. **Check whether pending-review.md has actual changes.** If the file body contains "no changes detected" or is empty, report that to the user and STOP — no point spawning the watcher when there's no signal.

3. **Read past watcher runs** to avoid re-proposing rejected items:
   - `docs/governance/Codex-updates/INDEX.md` (run log + status legend)
   - The most recent 2 proposal MDs in `docs/governance/Codex-updates/` (skip INDEX, snapshot-current.json, pending-review.md)

4. **Spawn the watcher subagent** via the Agent tool. Brief it:
   - subagent_type: `Codex-updates-watcher`
   - description: "Codex updates review — produce one proposal MD"
   - prompt: explain that the agent should follow its spec at `.Codex/agents/Codex-updates-watcher.md`, read `docs/governance/Codex-updates/pending-review.md` for the upstream diff, read past runs to avoid duplicates, and write a proposal MD per the spec's output template. Pass the path to pending-review.md and list the most recent past runs the agent should consult.

5. **After the subagent returns**, do THREE things:
   - Verify the proposal MD exists at `docs/governance/Codex-updates/YYYY-MM-DD-<slug>.md` and the INDEX.md got a new Runs-table row.
   - **Mark the batch reviewed** — overwrite `docs/governance/Codex-updates/pending-review.md` with the empty-state body (timestamp + "no changes detected" line). This stops the SessionStart hook from re-triggering the watcher on subsequent sessions until the cron next finds new upstream changes.
   - Summarize for the user in ≤200 words: count of ADOPT / ALREADY-HAVE / DEFER / SKIP, biggest ADOPT proposal, biggest ALREADY-HAVE acknowledgment, open questions.

6. **Do NOT apply** the proposal automatically. The user reviews + says yes/no per item.

If the user passes an argument like `/check-Codex-updates --force`, pass `--force` to the watch script so it re-fetches even if hashes are unchanged. Useful when a snapshot got out of sync.

**Triggered automatically?** If you're running this because the SessionStart hook auto-invoked it (the additionalContext said "📦 AUTO-INVOKE"), and the user's first prompt is **unrelated** to Codex updates, spawn the watcher subagent in the **background** (`run_in_background=true` on the Agent tool) so the user's request isn't blocked. When the background watcher completes, surface the proposal path + a one-line summary. If the user's first prompt IS asking about updates / architecture, run the watcher in the foreground.
