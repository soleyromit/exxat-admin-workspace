# Pending review

> Auto-populated 2026-07-13T12:17:05.336087+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `13d45c66a3a1b068` → `a000df2de5d9eb13`

```
# Changelog

## 2.1.207

- Auto mode is now available without `CLAUDE_CODE_ENABLE_AUTO_MODE` opt-in on Bedrock, Vertex AI, and Foundry; disable via `disableAutoMode` in settings
- Fixed the terminal freezing and keystrokes lagging while streaming responses containing very long lists, tables, paragraphs, or code blocks
- Fixed remote managed settings from a non-interactive run (`claude -p`, the SDK) being permanently recorded as consented without ever showing the security consent dialog
- Fixed spurious prompt-injection warnings triggered by benign system-generated conversation updates
- Fixed the auto-updater overwriting a custom launcher script or symlink at `~/.local/bin/claude` on every release; `/doctor` now reports an externally managed launcher
- Fixed compound commands with `cd` prompting for permission when the only output redirect was to `/dev/null`
- Fixed the transcript jumping above the start of the answer when a response finishes streaming
- Fixed `extensions.worktreeConfig` being left in the repo's `.git/config` (breaking go-git tools like `tea`) after the last `worktree.sparsePaths` worktree was removed
- Fixed malformed bracket patterns in rules globs, skill paths, `.ignore`, and `.worktreeinclude` breaking file reads, file suggestions, and worktree creation
- Fixed a crash loop in agent teams where a malformed teammate mailbox message caused repeated errors every second until the mailbox file was manually deleted
- Fixed background sessions auto-named by accepting a plan not showing that name on their agent-view row
- Fixed background sessions that entered a git worktree resuming blank after a cold reopen from the agent list
- Fixed Remote Control task status updates being lost when the connection recovered from a network interruption or credential refresh
- Fixed Remote Control sessions hosted by the desktop app not showing background agent and workflow progress on mobile and web
- Fixed Deep research runs labeling every Fetch-phase agent "unknown" — chips now show the source hostname
- Fixed Bedrock repeatedly requesting fresh AWS SSO credentials from IAM Identity Center on every API request
- Improved agent view: pasting the same text again now expands the collapsed `[Pasted text #N]` placeholder instead of adding a second one
- Improved agent view: blocked session peeks now lead with the question and show a worded staleness clock (`waiting 3m`) instead of the same timestamp twice
- Changed Bedrock, Vertex, and Claude Platform on AWS to default to Claude Opus 4.8
- Changed auto mode to no longer read `autoMode` from `.claude/settings.local.json` (repo-resident); use `~/.claude/settings.json` instead
- Fixed an indefinite hang on Windows when AWS credential resolution stalls (e.g. a stuck `credential_process`): the 60-second stall guard now fires instead of waiting forever.
- Plugin hooks/monitors/MCP headersHelper: `${user_config.*}` in shell-form commands is now rejected (shell-injection fix). Hooks: use exec form (`args` array) or `$CLAUDE_PLUGIN_OPTION_<KEY>`; monitors and headersHelper: read the value inside the script (config file or the server's `env` block).
- Plugin option values (`pluginConfigs`) are no longer read from project-level `.claude/settings.json`; only user, `--settings`, and managed settings are honored
- Fixed `/usage-credits` amount inputs silently stripping malformed values (e.g. a pasted timestamp) to digits; malformed amounts are now rejected with an error, and amounts over $1,000 require a typed confirmation

## 2.1.206

- Added directory path suggestions to `/cd`, matching `/add-dir` behavior
- Added a `/doctor` check that proposes trimming checked-in `CLAUDE.md` files by cutting content Claude could derive from the codebase
- `/commit-push-pr` now auto-allows `git push` to the repo's configured push remote (`remote.pushDefault`, or the sole remote when only one is configured) in addition to `origin`
- Gateway: `/login` now supports Anthropic-operated public gateway endpoints
- `EnterWorktree` now asks for confirmation before entering a git worktree outside the project's `.claude/worktrees/` directory
- Background agents now upgrade to a new version in the background right after a Claude Code update, instead of paying a slow stale-session upgrade when you attach
- Fixed an expired login failing every model with a misleading "There's an issue with the selected model" error instead of prompting to run `/login`
- Fixed `claude --resume` and `--continue` not responding to keyboard input on startup
- Fixed MCP servers configured via `--mcp-config` or `.mcp.json` ignoring a per-server `request_timeout_ms`, which caused long-running MCP tool calls to time out at the 60s default in fresh sessions
- Fixed `CLAUDE_CODE_EXTRA_BODY` being silently ignored by `claude agents` / `--bg` background workers; the shell-exported override now follows the dispatching session
- Fixed OAuth MCP servers requiring manual re-authentication after a single failed token refresh
- Fixed `--permission-prompt-tool` pointing at an MCP server crashing with "MCP tool not found" on cold start before the server finishes connecting
- Fixed `/model` picker rows printing a price for a different model than the row named, and stopped quoting first-party list prices on providers that don't bill them
- Fixed server-provided model rows being misplaced in the `/model` picker when an entitlement or allowlist restriction drops the row they were positioned against
- Fixed desktop sessions getting stuck showing "running" after a slash command was sent mid-turn
- Fixed keyboard input being ignored in the agents view when a setup prompt appeared before a bare `claude --resume` on Windows
- Fixed `claude rm` leaving the removed job in the daemon roster, causing the row to reappear in `claude agents`
- Fixed `/remote-control` showing "Unknown command" when logged out — it now explains how to sign in
- Fixed left arrow not stepping back out of a phase or agent in the workflow detail view
- Fixed `/status` listing the same broken-install warning twice
- Fixed false "disused plugin" tips and skewed disuse telemetry for LSP plugins
- Fixed `/doctor`'s update check to compare Homebrew installs against their cask's channel instead of the settings channel
- Fixed the fullscreen jump-to-bottom pill suggesting Ctrl+End on macOS, not showing rebound chords, and wrapping over the transcript
- Bedrock: fixed a multi-minute startup hang when using an `awsCredentialExport` helper on networks with restricted egress
- Improved `/code-review` findings quality on claude-opus-4-8 across all effort levels
- Improved agents view: status column now uses full terminal width instead of truncating at 64 characters
- Changed agents view: Ctrl+X now permanently removes a completed session, and sessions no longer render twice; deleted background jobs stay deleted

## 2.1.205

- Added an auto mode rule that blocks tampering with session transcript files
- Fixed `--json-schema` silently producing unstructured output when the schema was invalid, and schemas using the `format` keyword being rejected
- Fixed a message sent while Claude was working being silently lost when the turn ended at the `--max-turns` limit
- Fixed Windows worktree removal deleting files outside the worktree when an NTFS junction or directory symlink existed inside it
- Fixed background agents staying shown as "failed" or "completed" in the agent list after being resumed with `SendMessage`
- Fixed background jobs flipping from "needs input" back to "working" in the agent list when the agent's turn contained no readable text
- Fixed `claude attach` erroring when a background agent was mid-upgrade restart instead of waiting for it to come back
- Fixed session-to-PR linking missing a PR created in a Bash call whose output exceeded the 30K inline limit
- Fixed `claude mcp add-from-claude-desktop` getting stuck when a server name contains unsupported characters; invalid names are now reported and remaining servers still import
- Fixed a plugin LSP server that fails to initialize preventing a valid LSP server from another plugin handling the same file extension
- Fixed a Windows crash when the directory Claude was launched from is deleted, locked, or unmounted while a command is running
- Fixed a crash when a file watcher was closed while a directory scan was still in flight
- Fixed project verify skills being rewritten on every session instead of only when a documented command changed
- Fixed the agent view rendering one line too high and clipping its header when the job list slightly overflowed the screen
- Fixed background tasks in the web and mobile Remote Control panels showing stale "Running" status by forwarding full task state on every membership change
- Improved auto mode to ask before running `rm -rf` on a variable it can't resolve from context
- Auto-update binary downloads now stream to disk instead of buffering in memory, cutting the updater's peak memory usage by roughly 400 MB
- Background task notifications now explicitly state that no human input has occurred, preventing fabricated in-transcript approvals from being acted on
- Improved agent view: sessions that edit, merge, comment on, or push to an existing PR now link it in `claude agents`
- Improved agent view: rows now show a colored state word and a classifier-written headline instead of raw tool call text, and the peek opens with full status including the exact ask for blocked sessions
- `/doctor` is now a full setup checkup that can diagnose and fix issues; `/checkup` is its alias
- Reserved the "Claude Browser" MCP server name (alongside "Claude Preview") ahead of the Claude Desktop pane rename; user-configured MCP servers can no longer register under either name
- Fixed Cowork VM-mode local-agent sessions failing to start with "Not logged in · Please run /login" on CLI 2.1.203+

## 2.1.204

- Fixed hook events not streaming during SessionStart hooks in headless sessions, which could cause remote workers to be idle-reaped mid-hook

## 2.1.203

- Added a warning when your login is about to expire, so you can re-authenticate before background sessions are interrupted
- Added a grey ⏸ badge to the footer when in manual permission mode, making the active mode always visible
- Added the session's additional working directories to MCP `roots/list`, with `notifications/roots/list_changed` sent when the set changes
- Fixed opening or switching background agent sessions on macOS stalling for 15–20 seconds due to a false low-memory detection (regression in 2.1.196)
- Fixed background sessions becoming permanently unresponsive to attach, replies, and stop when the daemon's session token went stale — the session now recovers automatically
- Fixed returning to `claude agents` silently stopping running subagents and re-running the prompt from scratch — their work now carries over
- Fixed a memory and per-turn CPU regression in interactive sessions: the context-usage indicator no longer re-analyzes the entire transcript after every turn
- Fixed background agents inheriting a stale `PATH` from the daemon instead of the dispatching shell, causing missing tools on Windows
- Fixed background and agent-view sessions dropping a shell-exported `ANTHROPIC_BASE_URL`, which sent API keys to the default endpoint and failed with 401
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `4dbfb9d87eb3119d` → `78f72e2284ab2b9a`

```
# Changelog

## 0.3.207

- Fixed `canUseTool` returning `{behavior: 'allow'}` without `updatedInput` being rejected as a deny with a raw ZodError message; the tool now runs with the original input per the documented contract
- The Agent tool's structured result now has a published SDK type (`AgentToolCompletedOutput`) that matches the emitted object exactly

## 0.3.206

- Added `command_lifecycle` frames to stream-json and SDK sessions, reporting each uuid-stamped message's terminal state (`queued`/`started`/`completed`/`cancelled`/`discarded`); zero-API results no longer report stale `duration_api_ms`

## 0.3.205

- Interrupt control responses now include `still_queued` (UUIDs of queued async messages that will still run), `Query.interrupt()` returns the typed receipt, and `system/init` advertises an `interrupt_receipt_v1` capability for feature detection
- Added structured `name` and `body` fields to peer-message session events, exposing the sender display name and decoded message body

## 0.3.204

- Added `terminal_reason` values `tool_deferred_unavailable` (deferred tool resume found the tool gone — previously an `is_error` result with no reason, read as a clean completion by lifecycle sweeps) and `turn_setup_failed` (the turn-input builder threw before the turn started). Both classify as dead turns, so commands consumed by them report `command_lifecycle` state `cancelled`
- Fixed the post-merge cancel backstop cancelling every member of a coalesced prompt batch when a cancel named only one: uncancelled siblings now re-merge and run (previously they were reported `cancelled` — on remote transports that acknowledged them as processed, silently dropping messages nobody cancelled)
- Added `terminal_reason` values `api_error`, `malformed_tool_use_exhausted`, `budget_exhausted`, and `structured_output_retry_exhausted`. Turns that die on an exhausted-API-retry or malformed-tool-use give-up previously reported `completed`; budget and structured-output exhaustion results previously omitted `terminal_reason`. Commands consumed by such turns now report `command_lifecycle` state `cancelled` instead of `completed` (dup-over-loss)
- Updated to parity with Claude Code v2.1.204

## 0.3.203

- Added a `background_tasks_changed` system message with the full set of live background tasks on every membership change, so consumers can track background activity as a level instead of pairing `task_started`/`task_notification` edges
- Fixed stable releases shipping a `sdk.d.ts` with unresolved type references that broke consumer typechecking with `skipLibCheck` disabled

## 0.3.202

- Added `parent_agent_id` field to subagent session messages for building depth-2+ agent trees from disk-persisted metadata
- Fixed `apply_flag_settings` with a non-object settings value crashing the session instead of returning a control error

## 0.3.201

- Updated to parity with Claude Code v2.1.201

## 0.3.200

- Added `'manual'` as an accepted alias for the `'default'` permission mode in SDK inputs
- Fixed `onSetPermissionMode` callback not firing for SDK-hosted Remote Control sessions
- Fixed `set_model` control request accepting unrecognized model strings; invalid models are now rejected before latching

## 0.3.199

- Added `requestId` to `canUseTool` callback options for correlating out-of-band permission responses, and support for returning `null` to suppress the SDK's automatic control response
- Added `blocked` field to `workflow_agent` progress events indicating when an agent was blocked by the auto-mode safety classifier
- Added `mode:"mask"` and per-credential `injectHosts` to `sandbox.credentials` settings types for injecting masked credentials into sandboxed commands

## 0.3.198

- Added a runtime warning when `canUseTool` is configured alongside `allowedTools` or `bypassPermissions`, which shadow the callback
- Added per-server `request_timeout_ms` option to `mcp_set_servers` control request
- Fixed `SDKUserMessage.isSynthetic` not being mapped to `isMeta` on ingestion, which could cause synthetic messages to be treated as real user messages
- Fixed workflow progress events silently dropping earliest agents from the list while the phase counter remained correct

## 0.3.197

- Updated to parity with Claude Code v2.1.197

## 0.3.196

- Added `prompt_id` field to hook input payloads for correlating hook events with OpenTelemetry prompt-level events
- Fixed control protocol deduplication dropping tool-use IDs after 1000 resolutions, which could cause duplicate `tool_result` deliveries in long-running sessions

## 0.3.195

- Added `Query.reinitialize()` to re-send the initialize control request and redeliver pending permission/dialog prompts after a transport gap
- Fixed `commands_changed` event not being emitted for synced skills when the skill list resolves before the change-detector subscribes

## 0.3.194

- Updated to parity with Claude Code v2.1.194

## 0.3.193

- Added `promptSuggestions` option to Browser SDK `query()` to opt the remote CLI into emitting follow-up suggestions
- Fixed brief console window flashes on Windows when spawning CLI subprocesses

## 0.3.192
```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `67cb61e7f3dd0164` → `d52597bc8ec9471e`

```
# Changelog

## 0.2.116

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.207
- Fixed CI workspace trust so Claude Code honors project-scoped permission grants in checkout directories (#1085)

## 0.2.115

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.206

## 0.2.114

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.205

## 0.2.113

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.204

## 0.2.112

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.203

## 0.2.111

### Bug Fixes

- **Zombie CLI subprocess prevention**: Shielded subprocess cleanup from asyncio cancellation so `SIGTERM`/`SIGKILL` teardown always runs, preventing orphaned `claude` child processes when the parent task is cancelled (#1082)
- **Silent whitespace loss on large NDJSON lines**: Fixed the NDJSON parser silently dropping whitespace when a single line exceeded the 64 KiB stream buffer, which could corrupt tool output or assistant message content (#1083)
- **TypeError on non-dict message content**: Fixed an uncaught `TypeError` when the CLI emits a message whose `content` field is a plain string or other non-dict value instead of the expected list of content blocks (#1058)
- **`can_use_tool` shadowed by `allowed_tools`**: Added a runtime warning when a `can_use_tool` callback is registered alongside `allowed_tools` or `bypassPermissions`, which silently prevents the callback from ever firing (#1081)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.202
- Fixed e2e stderr test flakiness by running the query from a clean working directory (#1084)

## 0.2.110

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.191

## 0.2.109

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.190

## 0.2.108

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.187

## 0.2.107

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.186

## 0.2.106

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.185

## 0.2.105

### Internal/Other Changes
```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
