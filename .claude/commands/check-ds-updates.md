---
description: Spawn the ds-updates-watcher subagent to review Admin and Student DS submodule deltas (components added/removed, tokens added/removed/changed) and propose ADOPT / MIGRATE / DROP / WATCH verdicts against product code.
---

Run the DS updates review loop:

1. **Refresh the snapshot first** (cheap, no LLM): `python3 scripts/ds-update-watch.py`. This re-parses both DS submodules and writes any deltas to `docs/governance/ds-updates/pending-review.md`.

2. **Check whether pending-review.md has actual changes.** If the file body contains "no DS deltas detected" or is empty, report that to the user and STOP — no point spawning the watcher when there's no signal.

3. **Read past watcher runs** to avoid re-proposing rejected items:
   - `docs/governance/ds-updates/INDEX.md` (run log + status legend)
   - The most recent 2 proposal MDs in `docs/governance/ds-updates/` (skip INDEX, snapshot-current.json, pending-review.md)

4. **Spawn the watcher subagent** via the Agent tool. Brief it:
   - subagent_type: `ds-updates-watcher`
   - description: "DS updates review — produce one proposal MD"
   - prompt: explain that the agent should follow its spec at `.claude/agents/ds-updates-watcher.md`, read `docs/governance/ds-updates/pending-review.md` for the deltas, read past runs to avoid duplicates, and write a proposal MD per the spec's output template. Pass the path to pending-review.md and list the most recent past runs the agent should consult. Tell it to grep consumer code (`apps/*/admin/**` for Admin DS deltas, `apps/*/student/**` for Student DS deltas) before proposing any MIGRATE or DROP.

5. **After the subagent returns**, do THREE things:
   - Verify the proposal MD exists at `docs/governance/ds-updates/YYYY-MM-DD-<slug>.md` and the INDEX.md got a new Runs-table row.
   - **Mark the batch reviewed** — overwrite `docs/governance/ds-updates/pending-review.md` with the empty-state body. This stops the SessionStart hook from re-triggering on subsequent sessions until the next submodule update or manual `--force` run.
   - Summarize for the user in ≤200 words: count of ADOPT / MIGRATE / DROP / WATCH, biggest MIGRATE, biggest ADOPT, open questions.

6. **Do NOT apply** the proposal automatically. The user reviews + says yes/no per item.

If the user passes `/check-ds-updates --force`, pass `--force` to the watch script so it re-renders pending-review.md even if no deltas. Useful right after `git submodule update --remote --merge` when you want to inspect the current state regardless.

**Triggered automatically?** If you're running this because the SessionStart hook auto-invoked it (the additionalContext said "🎨 DS-UPDATE AUTO-INVOKE"), and the user's first prompt is **unrelated** to DS work, spawn the watcher subagent in the **background** (`run_in_background=true` on the Agent tool) so the user's request isn't blocked. When the background watcher completes, surface the proposal path + a one-line summary.
