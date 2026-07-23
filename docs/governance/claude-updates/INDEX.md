# Claude updates watch

> Tracks upstream Claude / Anthropic feature releases against our local architecture (subagents, hooks, audit rules, slash commands).
>
> Watch loop:
> 1. `scripts/claude-updates-watch.py` runs weekly (launchd) — fetches changelogs, diffs against `snapshot-current.json`, writes `pending-review.md` if anything changed.
> 2. SessionStart hook nags Romit if `pending-review.md` is non-empty.
> 3. Romit runs `/check-claude-updates` — spawns `.claude/agents/claude-updates-watcher.md` subagent.
> 4. Subagent reads `pending-review.md`, maps new features to our architecture, writes proposal `YYYY-MM-DD-<slug>.md` here.
> 5. Romit reviews + applies (or rejects).
>
> Mirrors the `architect` loop, but for *external* signals (Anthropic releases) instead of *internal* ones (discipline log).

## Watched sources

| Source | URL | Cadence |
|---|---|---|
| Claude Code CHANGELOG | https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md | weekly |
| Agent SDK (TypeScript) CHANGELOG | https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md | weekly |
| Claude Code docs changelog page | https://code.claude.com/docs/en/changelog | weekly |
| Claude Platform release notes | https://platform.claude.com/docs/en/release-notes/overview | weekly |
| Anthropic news (announcements) | https://www.anthropic.com/news | weekly |

## Status legend

- **PROPOSED** — written by the watcher subagent, not yet reviewed
- **ACCEPTED** — Romit marked accepted; changes shipped to our architecture
- **REJECTED** — explicitly turned down; the watcher must not re-propose for ≥30 days
- **DEFERRED** — feature not yet GA / out of scope for now; revisit on next watch

## Runs

| Date | Slug | Status | Summary |
|---|---|---|---|
| 2026-05-12 | baseline | PARTIAL | ADOPT-1 applied in reduced scope (SubagentStop → subagent-invocations.log wiring; OTEL env block deferred); ADOPT-2 NOT-APPLICABLE (local CLI schema rejects `args:`); ADOPT-3 DEFERRED (PostToolUse soft-rules risk dead-link-audit anti-pattern). Architect open Q #3 closes via the hook wiring. |
| 2026-05-12 | v2140 | ACCEPTED | ADOPT-1: remove `general-purpose` workaround in check-claude-updates.md + check-ds-updates.md — use `claude-updates-watcher` / `ds-updates-watcher` directly now that 2.1.140 resolves subagent_type case- and separator-insensitively. All 10 other 2.1.140 changes are bug fixes with no architectural relevance (SKIP/ALREADY-HAVE). ADOPT-2 (hook args:) remains NOT-APPLICABLE (2.1.140 doesn't close the validator gap). |
| 2026-06-01 | v2154-2157 | PROPOSED | ADOPT-1: add `reloadSkills: true` + `sessionTitle` to session-start.py (TS SDK 0.3.152); ADOPT-2: wire `OTEL_LOG_TOOL_DETAILS=1` env flag in settings.json (CC 2.1.157); ADOPT-3: document concurrent PreToolUse hook dispatch in pre-tool-use.py + exxat-brief-gate.mjs (Python SDK 0.2.82). Skills auto-load ALREADY-HAVE; 3 items DEFERRED (MessageDisplay, hook args:, /goal). |
| 2026-06-22 | v2178-2185 | ACCEPTED | ADOPT-1: `Tool(param:value)` model-gate — applied (`Agent(model:…)` allow gates in settings.json); ADOPT-2: `attribution.sessionUrl: false` — applied (root + all 8 per-app settings, 2026-07-07); ADOPT-3: destructive-git `permissions.deny` — applied (root + all 8 per-app settings, 2026-07-07). Reconciled 2026-07-07: verified all three present in `.claude/settings.json`. |
| 2026-07-06 | v2186-2201 | PARTIAL | ADOPT-1: `claude-sonnet-5*` added to model allow-list — APPLIED (root `.claude/settings.json:17` + all 8 per-app settings, 2026-07-07). ADOPT-3: `prompt_id` logged in `_telemetry.py` — APPLIED (2026-07-07, env-sourced, null-safe). ADOPT-2: Notification `agent_completed` → subagent-stop.py — HELD pending a live background-agent payload capture (parser must not be wired blind). ALREADY-HAVE: Explore now on opus (auto-upgrade). Watcher self-defects A (silent fetch skip) + B (launchd TLS) — both FIXED 2026-07-07 (see below). |

## How to enable the weekly auto-run

```bash
# Stage the plist (already in repo):
cp scripts/launchd/com.exxat.claude-updates.plist ~/Library/LaunchAgents/

# Load it (runs every Mon at 8:17am local):
launchctl load ~/Library/LaunchAgents/com.exxat.claude-updates.plist

# Verify:
launchctl list | grep com.exxat.claude-updates

# To unload (stop the cron):
launchctl unload ~/Library/LaunchAgents/com.exxat.claude-updates.plist
```

## How to invoke manually (no auto-run needed)

```bash
# From any Claude Code session:
/check-claude-updates

# Or from the shell directly:
python3 scripts/claude-updates-watch.py
# then in the next Claude session, the subagent will pick up pending-review.md
```

## Constitution (what the watcher must honor)

From `.claude/agents/claude-updates-watcher.md` §"Hard rules":
1. Cite the source URL + commit / release tag for every claim
2. Don't propose adopting a feature in research preview / private beta — only GA or public beta
3. Every proposal maps the upstream feature to an existing architecture component (subagent, audit rule, hook, slash command, or note "no analogue")
4. Skip proposals for cosmetic SDK updates (typing fixes, package version bumps) — only architectural changes
5. No file edits to product code — only governance/infra/docs proposals
