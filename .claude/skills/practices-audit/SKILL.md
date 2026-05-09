---
name: practices-audit
description: Use when the user asks "are we current with Claude practices", "audit Claude best practices", "what's new in Claude Code", or when SessionStart surfaces a staleness warning. Re-fetches authoritative sources, cross-checks via claude-code-guide subagent, surfaces deltas vs docs/governance/claude-practices.md, and proposes architecture updates.
---

# Practices Audit — Claude Code Best Practices

Refreshes `docs/governance/claude-practices.md` against current authoritative sources. Cadence: soft reminder at 30 days, pre-commit warning at 60 days, manual via this skill.

## When this skill fires

Triggers (UserPromptSubmit hook):
- "are we current", "audit Claude practices", "what's new in Claude Code", "check best practices"
- SessionStart staleness reminder ("practices audit overdue — N days since last")
- Pre-commit warning at 60 days

## Workflow

### 1. Read the current tracked state

Read `docs/governance/claude-practices.md` frontmatter:
- `last_full_audit` date
- `sources_consulted` list

If `last_full_audit` is < 14 days old, ask the user whether they really want to re-audit (cheap to do, but rarely changes anything that fast). Otherwise proceed.

### 2. Dispatch parallel research

In a single message, spawn TWO subagents:

**Agent A — `claude-code-guide`:**
> Audit `.claude/` setup against current Claude Code conventions. Check hooks (event names, matchers, JSON protocol), skills (frontmatter), subagents (path + frontmatter), slash commands, settings.json, memory. For each: confirmed-current vs definitely-behind vs uncertain. Cite URLs. <600 words.

**Agent B — `general-purpose`:**
> WebFetch / WebSearch authoritative Anthropic sources published since the previous audit date for new Claude Code features (hook events, skill conventions, subagent fields, slash command features, settings format, plugins, MCP, context engineering). Anchors: anthropic.com/engineering, code.claude.com/docs, platform.claude.com/docs. Cite URLs. <800 words.

### 3. Synthesize the gap report

For each finding, classify:
- **Confirmed current** — our state matches docs (no action)
- **Behind** — docs show a different shape; needs migration
- **New capability** — feature exists, we don't use it (assess: leverage or defer?)
- **Deferred** — consciously not adopted (justify in the row)
- **Uncertain** — sources unclear; flag for next audit

Produce a concise gap report (under 800 words). Show the user.

### 4. Propose architecture updates

For each "Behind" or "New capability" item where adoption is worth doing:
- One-line description
- Files affected
- Risk level
- Sequenced into commits (one per logical change)

**Confirm-before-write per INTAKE-002/003.** The user reviews the plan before any architecture change.

### 5. Update `claude-practices.md`

After (or alongside) the architecture changes:
- Bump `last_full_audit` to today
- Update individual rows' `last_verified` dates
- Add new rows for newly-adopted practices
- Update `Status` columns (deferred → current when shipped)
- Add new sources to `sources_consulted` if any

### 6. Telemetry

```bash
python3 -c "import sys; sys.path.insert(0, '/Users/romitsoley/Work/.claude/hooks'); \
  from _telemetry import emit; emit('skill.invocation', skill='practices-audit', \
  outcome='<completed|partial|cancelled>', findings_count=<N>)"
```

## Honest discipline

- **Don't fabricate URLs.** If WebFetch fails, say so. Don't make up "current" claims.
- **Don't over-recommend.** Many new features are deferred for good reasons (no current need). Adoption is opt-in, not automatic.
- **Cross-check disagreements.** When agent A says X and agent B says Y, flag the conflict and verify yourself before recommending.
- **Preserve the deferred reasoning.** When a row says "deferred (no current need)", that reason should outlast the current audit. If conditions change, update the row's reason — don't silently flip status.

## Output format

```
# Practices Audit — <date>

Last full audit: <prior date> (<N> days ago)
Sources re-fetched: <count>
Subagents spawned: 2 (claude-code-guide + general-purpose)

## Confirmed current (<count>)
- <bullet list>

## Behind / migration needed (<count>)
- <bullet> — files affected, risk

## New capabilities not adopted (<count>)
- <bullet> — leverage rec or deferred reason

## Uncertain (<count>)
- <bullet> — what to verify next time

## Proposed architecture commits
1. <commit summary> — files affected
2. ...

## Updated docs/governance/claude-practices.md rows
- Updated `last_full_audit: <today>`
- Per-row `last_verified` updated for: <list>
- New rows added: <list>

## Sources consulted
- <URL list>
```

## Skip the skill when

- The user says "skip the audit" or "don't audit"
- Audit ran < 14 days ago and user didn't explicitly request re-run
- We're in the middle of a non-architecture task and the audit would derail focus

## Why this skill exists

Claude practices evolve faster than my training cutoff. Without a recurring audit, the workspace silently falls behind. This skill is the recurring ritual — fetch, compare, surface, propose, update. The user retains approval authority over architecture changes.

This is the "automatic update" the user requested in 2026-05-09 conversation. Goes alongside `docs/governance/claude-practices.md` (the tracked checklist) and `scripts/practices-audit-staleness.py` (the cadence enforcer).
