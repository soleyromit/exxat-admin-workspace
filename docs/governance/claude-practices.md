---
last_full_audit: 2026-05-09
audit_method: WebFetch (anthropic.com + code.claude.com + platform.claude.com + claude.com/plugins) + claude-code-guide subagent + design-specific subagent cross-check
sources_consulted:
  - https://code.claude.com/docs/en/hooks
  - https://code.claude.com/docs/en/sub-agents
  - https://code.claude.com/docs/en/skills
  - https://code.claude.com/docs/en/slash-commands
  - https://code.claude.com/docs/en/settings
  - https://code.claude.com/docs/en/memory
  - https://code.claude.com/docs/en/plugin-marketplaces
  - https://code.claude.com/docs/en/best-practices
  - https://platform.claude.com/docs/en/agents-and-tools/agent-skills/overview
  - https://platform.claude.com/cookbook/coding-prompting-for-frontend-aesthetics
  - https://www.anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills
  - https://www.anthropic.com/engineering/effective-context-engineering-for-ai-agents
  - https://www.anthropic.com/engineering/effective-harnesses-for-long-running-agents
  - https://www.anthropic.com/news/enabling-claude-code-to-work-more-autonomously
  - https://www.anthropic.com/news/claude-design-anthropic-labs
  - https://www.anthropic.com/news/claude-for-creative-work
  - https://claude.com/blog/build-artifacts
  - https://claude.com/plugins/design
  - https://claude.com/plugins/frontend-design
  - https://claude.com/plugins/figma
  - https://github.com/anthropics/skills
  - https://platform.claude.com/docs/en/release-notes/overview
---

# Claude Code Practices — Tracked Checklist

> Source-of-truth for which Claude Code best practices we audit our workspace against. Each row has a `last_verified` date. The `practices-audit` skill re-checks all sources and updates dates. Pre-commit and SessionStart hooks warn when `last_full_audit` is stale.
>
> **Cadence:** soft reminder at 30 days · pre-commit warning at 60 days. Manual re-audit via the `practices-audit` skill.

## Schema

| Field | Meaning |
|---|---|
| Category | Hooks · Skills · Subagents · Slash commands · Settings · Memory · MCP · Context engineering · Plugin packaging |
| Practice | The specific practice or convention |
| Our state | What we have today (or `not adopted`) |
| Status | `current` (matches docs) · `partial` (some adoption) · `behind` (docs show different) · `deferred` (consciously skipped) · `uncertain` (need verification) |
| Last verified | ISO date when this row was checked against source |
| Source | URL of the authoritative doc |

## Hooks

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| `SessionStart` event with `startup\|resume\|clear\|compact` matchers | ✅ wired | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `UserPromptSubmit` event | ✅ wired | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `PreToolUse` event with tool-name matcher | ✅ wired (`Edit\|Write\|MultiEdit`) | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `PreCompact` event — control what's preserved before summary | ✅ shipped (commit pending in this audit cycle) | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `PostCompact` (or SessionStart matcher=compact) for recovery | ✅ wired (matcher=compact branch) | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `FileChanged` event for registry watching | ✅ shipped (commit pending) — replaced our mtime-in-UserPromptSubmit hack | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `SubagentStop` event for telemetry | ✅ shipped (commit pending) | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| `Stop` event | not adopted | deferred | 2026-05-09 | code.claude.com/docs/en/hooks |
| `PostToolUse` event | not adopted | deferred (we use PreToolUse for blocking; PostToolUse would be additive but not load-bearing) | 2026-05-09 | code.claude.com/docs/en/hooks |
| `PostToolUseFailure` event | not adopted | deferred (would be useful for telemetry of hook failures; revisit if we hit reliability issues) | 2026-05-09 | code.claude.com/docs/en/hooks |
| `Notification` event | not adopted | deferred (no current notification flow) | 2026-05-09 | code.claude.com/docs/en/hooks |
| `InstructionsLoaded` / `ConfigChange` / `CwdChanged` | not adopted | deferred (specialty events; no current need) | 2026-05-09 | code.claude.com/docs/en/hooks |
| `Elicitation` / `ElicitationResult` / `TeammateIdle` / `UserPromptExpansion` | not adopted | deferred (specialty events) | 2026-05-09 | code.claude.com/docs/en/hooks |
| `WorktreeCreate` / `WorktreeRemove` | not adopted | deferred (revisit when we use worktrees more) | 2026-05-09 | code.claude.com/docs/en/hooks |
| `PermissionRequest` / `PermissionDenied` | not adopted | deferred (no current permission UX) | 2026-05-09 | code.claude.com/docs/en/hooks |
| Hook handler types beyond `command`: `http`, `mcp_tool`, `prompt`, `agent` | not adopted | deferred (all our hooks are command-type Python) | 2026-05-09 | code.claude.com/docs/en/hooks |
| Hook fields: `if`, `async`, `asyncRewake`, `once`, `statusMessage`, `shell` | not adopted | deferred (revisit if specific need surfaces) | 2026-05-09 | code.claude.com/docs/en/hooks |

## Skills

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| Filename `SKILL.md` (uppercase) | ✅ all 3 skills | current | 2026-05-09 | platform.claude.com/docs/en/agents-and-tools/agent-skills/overview |
| Frontmatter required: `name` (≤64 chars, lowercase+digits+hyphens) | ✅ | current | 2026-05-09 | (same) |
| Frontmatter required: `description` (≤1024 chars) | ✅ | current | 2026-05-09 | (same) |
| Project location `.claude/skills/<name>/SKILL.md` | ✅ | current | 2026-05-09 | (same) |
| Anthropic explicitly discourages extra frontmatter beyond minimum | ✅ aligned (we don't add extras) | current | 2026-05-09 | platform.claude.com/docs (skills overview) |
| Optional `argument-hint` for autocomplete | not adopted | deferred (no skill currently takes positional args) | 2026-05-09 | code.claude.com/docs/en/skills |
| Optional `allowed-tools` for tool pre-approval | not adopted | deferred (PreToolUse hook handles enforcement) | 2026-05-09 | code.claude.com/docs/en/skills |
| Three-level progressive disclosure (metadata → SKILL.md → bundled resources) | partial — we have SKILL.md but no bundled resources | current | 2026-05-09 | anthropic.com/engineering/equipping-agents-for-the-real-world-with-agent-skills |

## Subagents

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| Path `.claude/agents/<name>.md` | ✅ research-cross-corpus | current | 2026-05-09 | code.claude.com/docs/en/sub-agents |
| Frontmatter `name` + `description` required | ✅ | current | 2026-05-09 | (same) |
| Frontmatter `tools` allowlist | ✅ | current | 2026-05-09 | (same) |
| Frontmatter `disallowedTools` blocklist | ✅ shipped (commit pending) — research-cross-corpus blocks Edit/Write/NotebookEdit | current | 2026-05-09 | (same) |
| Frontmatter `isolation: worktree` | ✅ shipped (commit pending) | current | 2026-05-09 | (same) |
| Frontmatter `effort` (low\|medium\|high\|xhigh\|max) | ✅ shipped (commit pending) — research-cross-corpus uses `medium` | current | 2026-05-09 | (same) |
| Frontmatter `model`, `permissionMode`, `maxTurns` | not adopted | deferred (defaults are fine) | 2026-05-09 | (same) |
| Frontmatter `skills` (preload skills into agent context) | not adopted | deferred (would be useful for agents that need Granola intake; revisit when relevant) | 2026-05-09 | (same) |
| Frontmatter `mcpServers`, `hooks`, `memory`, `background`, `color`, `initialPrompt` | not adopted | deferred | 2026-05-09 | (same) |
| Subagents loaded at session start; restart needed when files edited directly | known | current | 2026-05-09 | code.claude.com/docs/en/sub-agents |

## Slash commands

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| Custom commands have been merged into skills — `/X` works whether at `.claude/commands/X.md` or `.claude/skills/X/SKILL.md` | partially aligned — we still have ds-check + design-variants as commands | partial | 2026-05-09 | code.claude.com/docs/en/skills (commands→skills migration note) |
| Migration: prefer skills going forward | ✅ shipped (commit pending — migrate ds-check + design-variants) | current | 2026-05-09 | (same) |
| Frontmatter `argument-hint`, `description`, `model`, `allowed-tools` | not adopted on remaining commands (will move to skills) | deferred | 2026-05-09 | code.claude.com/docs/en/slash-commands |

## Settings

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| `.claude/settings.json` is the canonical project settings file | ✅ | current | 2026-05-09 | code.claude.com/docs/en/settings |
| Three settings tiers: `~/.claude/settings.json` (user), `.claude/settings.json` (project, committed), `.claude/settings.local.json` (project, gitignored) | partial — only project-level adopted | current | 2026-05-09 | (same) |
| `permissions.allow` list | ✅ | current | 2026-05-09 | (same) |
| Hooks shape: `"<EVENT>": [{ "matcher": "...", "hooks": [{type, command, timeout}] }]` | ✅ matches docs | current | 2026-05-09 | code.claude.com/docs/en/hooks |

## Memory

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| Auto-memory at `~/.claude/projects/<encoded-project-path>/memory/` | ✅ | current | 2026-05-09 | code.claude.com/docs/en/memory |
| `MEMORY.md` index + per-entry files | ✅ 9 entries, indexed | current | 2026-05-09 | (same) |
| Frontmatter per-entry: `name`, `description`, `type` | ✅ | current | 2026-05-09 | (same) |
| Memory types: user / feedback / project / reference | ✅ all 4 used | current | 2026-05-09 | (same) |

## MCP

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| MCP servers via Claude plugins | ✅ Granola, Figma, Mobbin, Magic Patterns, Gmail, Calendar, Notion, Microsoft 365, etc. | current | 2026-05-09 | (plugin manifests) |
| Custom MCP server for rr-insights | not adopted | deferred (Tier 3 of context-architecture roadmap; only worth building when usage shows the gap) | 2026-05-09 | docs/governance/context-architecture.md §6 Tier 3 |

## Context engineering

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| Just-in-time retrieval (lazy-load reference content) | ✅ DS reference lazy-loaded; cross-corpus subagent for Ring 2 distillation | current | 2026-05-09 | anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| Structured note-taking files (NOTES.md, claude-progress.txt) for long-running work | not adopted | deferred (we use TaskCreate for in-conversation tracking; persistent notes via memory) | 2026-05-09 | anthropic.com/engineering/effective-context-engineering-for-ai-agents |
| Sub-agent fan-out for cross-corpus / parallel work | ✅ documented in SUBAGENTS.md; research-cross-corpus shipped | current | 2026-05-09 | (same) |
| Initializer-agent + coding-agent split (long-running harness pattern) | not adopted | deferred (we don't run long autonomous sessions) | 2026-05-09 | anthropic.com/engineering/effective-harnesses-for-long-running-agents |
| Compaction control (PreCompact + post-recovery) | ✅ shipped (commit pending) | current | 2026-05-09 | code.claude.com/docs/en/hooks |
| Automatic prompt caching (Feb 2026 — single `cache_control` field, system auto-advances cache point) | ✅ used implicitly (we don't manage cache manually; smaller CLAUDE.md = better auto-cache behavior) | current | 2026-05-09 | platform.claude.com/docs/en/release-notes |

## Plugin packaging

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| `marketplace.json` for sharing skills/hooks/subagents | not adopted | deferred (workspace is single-team; revisit if we want to share) | 2026-05-09 | code.claude.com/docs/en/plugin-marketplaces |
| Plugin subagents cannot use `hooks`/`mcpServers`/`permissionMode` (security) | known — not relevant since we don't ship as plugin | n/a | 2026-05-09 | (same) |

## Product design with Claude

| Practice | Our state | Status | Last verified | Source |
|---|---|---|---|---|
| **Anthropic-Verified `design` plugin** scope (design critique, UX writing, a11y audits, research synthesis) | partial — we have `intake`/`research-intake` covering research synthesis; design-critique mirrored as workspace skill (commit pending) | partial | 2026-05-09 | claude.com/plugins/design |
| **Anthropic-Verified `frontend-design` plugin** (BOLD aesthetic, anti-generic, vary fonts) | ⚠ **anti-adopted** — directly fights our DS discipline. Hostile to enterprise token-locked DS. Documented in `.claude/skills/README.md` to prevent future installation | n/a | 2026-05-09 | claude.com/plugins/frontend-design + github.com/anthropics/skills (frontend-design SKILL.md) |
| **Anthropic-Verified `figma` plugin** (`/implement-design`, `/create-design-system-rules`, `/code-connect-components`) | partial — Figma MCP active via plugin; slash commands available but not formally adopted into workflow | partial | 2026-05-09 | claude.com/plugins/figma |
| `/create-design-system-rules` for DS rule generation | not adopted | deferred (we already have DESIGN.md §4 with 43 rules; revisit only if we want to diff against an auto-generated baseline) | 2026-05-09 | (same) |
| **Claude Design** (Anthropic Labs canvas+chat product, Apr 2026) — DS ingestion, sliders, web-capture, Canva/PDF/PPTX/HTML export | not adopted | deferred (separate Anthropic product, not a Claude Code skill — worth user trial; would complement the workspace, not replace it) | 2026-05-09 | anthropic.com/news/claude-design-anthropic-labs |
| **Claude Artifacts** (canvas in claude.ai for React/HTML/Tailwind generation) | not adopted | deferred (overlaps Claude Code's tsx generation; uses different DS than ours) | 2026-05-09 | claude.com/blog/build-artifacts |
| **Magic Patterns MCP** workflow | adopted — MCP wired via plugin | current | 2026-05-09 | (third-party; no Anthropic-published guidance) |
| **Mobbin MCP** workflow | adopted — MCP wired via plugin | current | 2026-05-09 | (third-party; no Anthropic-published guidance) |
| Stochastic design (parallel agents per variant in worktrees) | ✅ `design-variants` skill — Anthropic publishes the mechanism (multi-Claude parallelism via worktrees) but no design-specific guidance; our skill is a novel application | current (novel application of published primitive) | 2026-05-09 | code.claude.com/docs/en/best-practices (multi-agent + worktrees sections) |
| **Verify-UI-changes-visually pattern** (paste screenshot → Claude screenshot result → list diffs → fix) | not adopted as formal step in `/design-variants` | deferred (would tighten variant convergence; revisit if variants drift visually from intent) | 2026-05-09 | code.claude.com/docs/en/best-practices |
| DS enforcement (token discipline, component-from-DS-only, no-raw-HTML rules) | ✅ workspace-novel — Anthropic doesn't ship a DS-discipline pattern; ours (DESIGN.md §4 + `ds-check` + `ds-component-check` + PreToolUse blocking) fills the gap | current (workspace-original) | 2026-05-09 | (none — workspace authored) |
| Research-to-design intake (transcripts → ADRs → personas → glossary) | ✅ workspace-novel — Anthropic's `design` plugin lists "research synthesis" as a use case but doesn't publish patterns; ours (`intake` + `research-intake` skills) is more thorough | current (workspace-original) | 2026-05-09 | (`design` plugin scope claim only) |

### Visualization anti-patterns (banned by VIZ-011)

Per the May 9 viz audit (Tufte / Few / Knaflic / Schwabish / FT canon). These don't appear in our work — adding here so they DON'T silently re-introduce themselves.

| Anti-pattern | Why banned | Source |
|---|---|---|
| Gauges / dials / speedometers | "Inefficient use of space, mimic dashboards in cars not screens" | Few, *Information Dashboard Design* |
| Donut / pie with >5 slices | Eye can't accurately compare angles beyond a few wedges | Cleveland 1985 perception experiments |
| Exploded pies | Adds chartjunk without information | Tufte, *VDQI* |
| 3D anything (3D bars, 3D pies, isometric charts) | Distorts perceived magnitudes | Tufte, *VDQI* |
| Dual y-axis line charts | Always misleading; readers infer correlation that may not exist | Schwabish, *Better Data Visualizations* |
| Stacked bars with >4 stacks | Becomes unreadable; only the bottom stack has a true zero baseline | Schwabish |
| Bar chart with non-zero baseline | Distorts magnitudes; only line/dot can do this honestly | Tufte, *VDQI* |
| Legend when direct labels fit | Forced eye traversal; direct-label is faster | Knaflic, *Storytelling with Data* |
| Rainbow / jet colormap for ordered data | Hue is categorical, not ordered — use sequential lightness | Borland 2007 |
| Red for "low score" | VIZ-004 — Aarti's directive across all score/rating viz | Workspace memory |
| Toast/Sonner for analytics drill-downs | DS rule — use inline expansion | DESIGN.md DS-008 |
| Animations longer than 300ms on data updates | DS-009 — purposeful motion only | Workspace memory |
| Chart without title + takeaway sentence | VIZ-008 — annotation IS the chart | Knaflic |
| Progress bars for anything that isn't 0→100% in-flight | VIZ-001 | Workspace memory |

### Visualization upgrades shipped (2026-05-09 audit)

5 new patterns + 6 new rules adopted from the audit:

| Pattern | Pattern ID | Rule | Status |
|---|---|---|---|
| Slope graph (paired) | VIZ-PATTERN-004 | VIZ-006 | ✅ shipped |
| Cleveland dot plot | VIZ-PATTERN-005 | (no new rule — replaces sorted-bar default) | ✅ shipped |
| Small multiples panel | VIZ-PATTERN-006 | VIZ-007 | ✅ shipped |
| Calendar heatmap | VIZ-PATTERN-007 | VIZ-008 | ✅ shipped |
| Progression Sankey | VIZ-PATTERN-008 | VIZ-009 | ✅ shipped |
| (no new pattern — rule only) | — | VIZ-010 (single-metric cards include trajectory) | ✅ shipped |
| (banned chart types) | — | VIZ-011 | ✅ shipped |

Component upgrades (key-metrics.tsx, trend-sparkline.tsx, ai-insight-card.tsx) deferred to course-evaluation design pass — patterns get exercised naturally there.

### Superpowers skills (locally installed, opt-in adoption)

These ship with the superpowers plugin (already cached at `~/.claude/plugins/cache/claude-plugins-official/superpowers/`). Adopt opt-in only — don't auto-load.

| Skill | Status | Reasoning |
|---|---|---|
| `brainstorming` | not adopted (recommended) | Matches Romit's "execute after clear recommendation" discipline; pairs with intake. Adopt when next ambiguous design brief lands. |
| `verification-before-completion` | not adopted (recommended) | Cheap guardrail; complements `ds-check`. Adopt as a wrap around design-output claims. |
| `writing-plans` + `subagent-driven-development` | not adopted (when-relevant) | Useful pair for multi-screen prototypes. Adopt at next 5+ screen build. |
| `frontend-design` | ⚠ **anti-adopted** | Tells Claude to avoid Inter, use Playfair, vary aesthetics, use bold asymmetric layouts. Directly violates our DS rules (R1-R12). Never invoke for Exxat work. |
| `test-driven-development` | skipped | Wrong discipline for design prototyping (TDD is for production code, not stakeholder mockups). |
| `dispatching-parallel-agents`, `using-git-worktrees` | skipped (subsumed) | Specialized in `design-variants` already; generic versions add noise. |
| `requesting-code-review` / `receiving-code-review` | deferred | Could be repurposed as "self-review before sending to Himanshu" pass. Low priority. |
| `systematic-debugging`, `finishing-a-development-branch`, `writing-skills` | deferred | Tuned for engineers; not your primary mode. |

## Why this file exists

Claude practices evolve faster than my training cutoff. Without a tracked checklist with `last_verified` dates per row, the workspace silently falls behind. This file is the source-of-truth for "what does current best practice look like" per category.

The `practices-audit` skill (`.claude/skills/practices-audit/SKILL.md`) refreshes this file by re-fetching the source URLs and cross-checking via `claude-code-guide`. After it runs, the `last_full_audit` date and per-row `last_verified` dates update.

`scripts/practices-audit-staleness.py` flags when the audit is overdue. SessionStart surfaces the warning. Pre-commit warns (does not block) at 60 days.
