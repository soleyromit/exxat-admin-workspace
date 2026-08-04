# Pending review

> Auto-populated 2026-07-27T12:20:18.371810+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `4c241900d74ff08c` → `9e4ad11b0443ad9d`

```
# Changelog

## 2.1.220

- Bug fixes and reliability improvements

## 2.1.219

- Added Claude Opus 5 (`claude-opus-5`), now the default Opus model — 1M context, fast mode at $10/$50 per Mtok
- Added `sandbox.network.strictAllowlist` setting to deny non-allowlisted hosts for sandboxed commands without prompting
- Added `DirectoryAdded` hook that fires after `/add-dir` or the SDK `register_repo_root` control request registers a new working directory mid-session
- Added `mcp_server_errors` to the headless stream-json init event, listing `--mcp-config` entries skipped by config validation; terminal runs print a startup warning
- Added the `workflowSizeGuideline` settings key so the advisory Dynamic workflow size guideline can be set from any settings file; the `/config` row is hidden while one does
- Added nested subagent forwarding in stream-json: subagents spawned at depth-2+ now appear when `--forward-subagent-text` is set, keyed by their spawning Agent `tool_use` id
- Fixed `claude -p` text output dropping the answer already produced when a turn dies on a mid-stream API error
- Added HTTP status and error text to `claude mcp list` and `/mcp` when a server fails to connect, and a warning for MCP config values with hidden leading or trailing whitespace
- Fixed the Fable model row showing "Requires usage credits" for plans that include it, when a stale cache had baked the label in
- Fixed the `/model` picker showing the merged Opus row as plain "Opus" instead of "Opus (1M context)"
- Fixed copy-on-select inside GNU screen printing base64 into the terminal instead of copying the selection
- Fixed Remote Control clients keeping a stale fast-mode status after a model switch, reconnect, or failed org check
- Fixed `CLAUDE_CODE_GIT_BASH_PATH` on Windows exiting or being used as bash when the path isn't a bash/sh binary; it's now ignored with a warning
- Fixed Vim mode: pressing ← on an empty prompt now returns to the agent view from NORMAL mode, not just INSERT
- Fixed screen-reader mode rewriting the entire input line on every keystroke instead of echoing only the typed character
- Improved the "Remote Control is only available via api.anthropic.com" error to name the specific setting that caused it
- Improved `claude --teleport` to show which repo your current checkout points at when it doesn't match the session's repo
- Changed dynamic workflows to default to a medium size guideline (aim for fewer than 15 agents); pick another size or unrestricted with Dynamic workflow size in `/config`
- Changed managed MCP allowlist/denylist `${VAR}` entries to resolve from the startup environment and managed-settings env instead of settings-file env
- Changed the `/model` picker to highlight only the newest model's name, so the highlight marks the new release rather than an arbitrary subset of the list
- Added the current default workflow size to the running-workflow status line, with a pointer to `/config` for changing it
- Removed Opus 4.7 from fast mode; `/fast` now applies to Opus 5 and Opus 4.8
- Updated the claude-api skill to default to Claude Opus 5, with a migration path from Opus 4.8
- Subagents can now spawn nested subagents up to depth 3 by default (was 1); set CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH=1 to disable nesting

## 2.1.218

- Changed `/code-review` to run as a background subagent, so review work no longer fills your conversation and keeps stacked slash commands as its review target
- Added screen-reader announcements of deleted text for word and line deletions (`Option+Delete`, `Ctrl+W`, `Cmd+Backspace`, `Ctrl+U`, `Ctrl+K`) in `--ax-screen-reader` mode
- Fixed Windows paths with `\u`-prefixed segments (like `C:\Users\unicorn`) being corrupted into CJK characters in tool inputs, which made those files inaccessible
- Fixed the left arrow key discarding the conversation with no undo: presses right after editing now ask to confirm, and Esc in the agent view returns to the conversation it backgrounded
- Fixed multi-line paste collapsing into one line with `j` in place of newlines in terminals that encode pasted newlines as Ctrl+J
- Fixed `/context` reporting stale pre-compact token usage after compacting from the message picker
- Fixed `/ultrareview` failing on descriptive arguments like "review my auth changes" — they now run a review of your current branch with the text applied as a note to the findings
- Fixed `/code-review ultra` silently running a local review in non-interactive sessions — it now launches the cloud review
- Fixed gateway spend metering to price Bedrock application-inference-profile ARNs and other config-mapped upstream model IDs at the configured model's rates
- Fixed mojibake when a long IDE selection was truncated mid-emoji, and a case where a tool executor error could be silently dropped
- Fixed an engine teardown race that could start and abandon a phantom turn, and made input pushed after close consistently rejected
- Fixed spurious "[Request interrupted by user]" messages after interrupted tool calls, and an unpaired `tool_use` block left in the transcript when a tool aborted mid-response
- Fixed VoiceOver reading "new line" instead of echoing the typed space at the end of the input in `--ax-screen-reader` mode
- Fixed plugin and settings panels not moving the terminal cursor to the focused row, so screen readers and magnifiers can follow arrow-key navigation
- Fixed crashes (maximum call stack exceeded) when a deeply nested watched directory tree was deleted or moved, and when rendering deeply nested UI trees
- Fixed pull request events occasionally being lost when a session exited immediately after creating or linking a PR
- Fixed the Bedrock setup wizard failing profile verification for assume-role profiles in partitioned AWS regions and on proxy-only networks
- Fixed rare negative or incorrect turn duration measurements after a system clock adjustment by timing turns with a monotonic clock
- Fixed the "N MCP servers need authentication" startup notice over-counting claude.ai connectors that aren't connected in claude.ai
- Fixed prompt history entries being dropped or duplicated when history writes raced or failed
- Fixed a retry loop that re-sent identical doomed requests after a context-overflow error with a large thinking budget; `Ctrl+B` backgrounding now applies the same background-shell caps as other paths
- Fixed agent frontmatter hooks running from untrusted folders: hooks now require the agent file's own folder to have accepted workspace trust
- Fixed fork-session lineage being lost after compaction in headless and SDK sessions
- Fixed a resumed session failing every turn, or crashing on resume, when its history held a malformed delta attachment
- Improved `/ultrareview` error feedback so Claude can correct an invalid argument instead of retrying it unchanged
- Improved auto mode: the dangerous-rm, background-`&`, and suspicious-Windows-path checks no longer open permission dialogs; the auto-mode classifier adjudicates them instead
- Improved sandbox command restrictions for IDE interactions
- Improved trust dialogs to name the repository root the grant covers
- Changed `/deep-research` to start only when invoked manually; Claude no longer launches it on its own
- Changed plan mode with auto to no longer prompt for Bash commands the static analyzer can't prove read-only; the auto-mode classifier judges them instead
- Added an announcement when fast mode changes as a result of switching models via `/config model=<x>` or Remote Control
- Changed server-managed settings so benign feature and cost toggles no longer trigger the settings-approval prompt
- Changed agent markdown files to reject agent names containing `:`, which is reserved for plugin namespacing
- Changed skills with `context: fork` to run in the background by default; opt out per skill with `background: false`
- Added `yes`/`no`/`on`/`off`/`1`/`0` (case-insensitive) as accepted values for skill and plugin frontmatter booleans, alongside `true`/`false`
- Fixed remote sessions continuing to send heartbeats after their worker was replaced, which left long-lived desktop and IDE processes retrying a rejected request every few seconds forever

## 2.1.217

- Added emoji shortcode autocomplete in the prompt input: type `:heart:` to insert ❤️, or `:hea` for suggestions — disable with the `emojiCompletionEnabled` setting
- Added warnings when transcript writes are failing (e.g. disk full) or when session saving is off due to an inherited environment variable, instead of losing transcripts silently
- Fixed a memory leak where truncated MCP tool outputs kept the full untruncated result in memory for the rest of the session
- Fixed Windows auto-update failures that could leave `claude.exe` missing; failed updates now restore the preserved executable automatically
- Fixed background session isolation not canonicalizing symlinked working directories, which could let sessions escape their workspace folder
- Fixed auto-compact never triggering for Claude Opus 4.8 on Bedrock and `/compact` failing once over the limit
- Fixed corporate mTLS, TLS-verify, OAuth scope, and proxy settings being ignored in Claude Desktop sessions
- Fixed screen reader mode's startup announcement being cut off by the first prompt render, and the thinking status row re-rendering every few seconds to update elapsed time and token counts
- Fixed managed settings that set `OTEL_EXPORTER_OTLP_ENDPOINT` not governing all signals — lower-scope signal-specific overrides no longer redirect telemetry away from the managed endpoint
- Fixed `--resume`/`--continue` and `/resume` failing with a TypeError when a transcript has a malformed attachment entry
- Fixed Remote Control sessions not showing a pending permission prompt or dialog to viewers that connected after it appeared
- Fixed background shells sometimes becoming impossible to stop after a session is sent to the background (`/background` or `←`) or when the session exits on a heavily loaded machine, most visible on Windows
- Fixed a `CLAUDE.md` or `SKILL.md` paths frontmatter value with many brace groups OOM-killing or stalling the CLI at startup — brace expansion is now budget-bounded
- Fixed the transcript preview sitting flush against the input area when attaching to a starting background session; it now leaves the same one-line gap as the live layout, so the transcript no longer shifts when the session takes over
- Improved footer PR badge links to be clickable hyperlinks even when terminal support can't be detected (e.g. over ssh/tmux); set `FORCE_HYPERLINK=0` to opt out
- Changed the login-expiry warning to appear 3 days before expiry instead of 5
- Capped the frontend-design plugin suggestion tip at 3 lifetime impressions instead of repeating indefinitely
- Added a cap on concurrently-running subagents (default 20, override with `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`) so one message can't fan out unbounded background agents
- Changed subagents to no longer spawn nested subagents by default; set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to allow deeper nesting
- Fixed `--max-budget-usd` not stopping background subagents: once the cap is reached, new spawns are denied and running background agents are halted

## 2.1.216

- Added `sandbox.filesystem.disabled` setting to skip filesystem isolation while keeping network egress control
- Fixed a slowdown in long sessions where message normalization cost grew quadratically with the number of turns, causing multi-second stalls and slow resumes
- Fixed auto mode denying commands with "HTTP 401" classifier errors after the OAuth token expired or rotated mid-session
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `43ed53519e9db096` → `d1c387b8e19e09d2`

```
# Changelog

## 0.3.220

- Updated to parity with Claude Code v2.1.220

## 0.3.219

- Added opt-in `cancel_queued` to the interrupt control request (capability `interrupt_cancel_queued_v1`): cancels queued and pending-dispatch messages alongside the abort
- Added `fast_mode_disabled_reason` to result and init messages so SDK hosts can explain why fast mode is off
- Added `DirectoryAdded` lifecycle hook event to the control protocol, fired when a new working directory is registered mid-session
- Fixed the initialize response reporting `fast_mode_state` from the spawn-time model after a model switch
- Added `sandbox.network.strictAllowlist` to SDK settings types for deterministically denying non-allowlisted hosts in sandboxed commands
- Added `workflowSizeGuideline` to SDK settings types for setting the advisory dynamic-workflow size guideline

## 0.3.218

- `SkillToolOutput` now reports `background: true` when a forked skill was dispatched as a detached background agent
- Fixed the result event's `api_error_status` reporting null for rate-limit and overloaded errors delivered mid-stream; it now reports 429/529
- Added `canonicalModel` and `provider` to each `modelUsage` entry in result messages so downstream billing can look up the correct rate table for `costUSD`

## 0.3.217

- Changed subagents to no longer spawn nested subagents by default (depth cap lowered from 5 to 1); set `CLAUDE_CODE_MAX_SUBAGENT_SPAWN_DEPTH` to allow deeper nesting
- Added a cap on concurrently-running subagents (default 20, override with `CLAUDE_CODE_MAX_CONCURRENT_SUBAGENTS`)
- Fixed Remote Control sessions not re-sending pending permission prompts to clients that connect after the prompt appeared

## 0.3.216

- Added optional `skippedLinks` count to `rewindFiles` responses for paths the rewind safety guards refused to restore or delete
- Added `tool_result_meta` sidecar to user messages (`non_execution_kind`, `user_feedback`) so consumers can classify denied, interrupted, or cancelled tool calls without string-matching result prose
- Added optional `user_message_uuid` and `request_sent_wall_ms` fields to the success result message for cross-host request-latency correlation

## 0.3.215

- Updated to parity with Claude Code v2.1.215

## 0.3.214

- `set_permission_mode` now rejects unrecognized permission modes with an error instead of silently adopting them; the `'manual'` alias is accepted at every ingress
- Added optional `subkind: 'scheduled-trigger'` to the `task-notification` member of `SDKMessageOrigin`, marking deliveries that are the fired prompt of a user-configured scheduled task
- `applyFlagSettings({effortLevel})` now accepts `'max'` in its TypeScript type (runtime already supported it)
- Assistant messages truncated by `interrupt()` now carry `aborted: true`, so consumers can distinguish a mid-stream partial from a completed message
- Added optional `subagent_type` and `subagent_retry` fields to `tool_progress` messages so clients can show a subagent waiting out an API rate-limit retry
- The `system/init` message's `plugins` entries and the `reload_plugins` response now include each plugin's manifest `version`
- SessionStart hooks now report source `"fork"` instead of `"resume"` when the session begins as a fork

## 0.3.213

- Updated to parity with Claude Code v2.1.213

## 0.3.212

- Fixed dash-leading `resumeSessionAt` and `sessionId` values being passed to the CLI as separate argv tokens; both now use equals-form (`--flag=value`)
- Agent tool output now includes the resolved model when a mid-turn model swap changed the subagent's model

## 0.3.211

- Fixed `--replay-user-messages` with `--include-partial-messages` emitting the turn-start user replay after the first content block instead of before the turn's content events
- Added `SDKAssistantMessage.timestamp` (ISO-8601) to the live stream, matching `SDKUserMessage`; older emitters omit it, consumers should fall back to receive time
- Added rate-limit message prefix buckets (`USAGE_LIMIT_ERROR_PREFIXES` and siblings) as `@alpha` exports for classifying rate-limit messages without hand-mirrored lists
- Improved process-exit errors to include the CLI's stderr output, so a failed child reports its actual cause instead of only an exit code

## 0.3.210

- Added `timedOutAfterMs` to `BashToolOutput`, set when a command is auto-backgrounded on timeout

## 0.3.209

- Updated to parity with Claude Code v2.1.209

## 0.3.208

- Fixed a caller abort during a pending SDK hook callback being converted into hook success, which let PreToolUse-gated tools execute after the abort
- Fixed a per-query resource leak in the SDK's process tracking when spawning the CLI fails (nonexistent or inaccessible executable path)
- Fixed an SDK `UserPromptSubmit` hook callback exceeding its timeout killing the entire query with an empty error; it now blocks the prompt with a clear timeout message and the session continues
- Fixed `extraArgs` values that look like flags (e.g. `resume: '--version'`) being parsed as their own CLI flags; dash-leading values are now bound with equals-form argv
- Fixed an abort-listener leak: streaming queries sharing one `AbortController` no longer accumulate `abort` listeners on its signal after each completed query
- Fixed `createSdkMcpServer` docs pointing at a nonexistent env var; the MCP tool-call timeout knob is `MCP_TOOL_TIMEOUT`
- Fixed an uncaught exception when writing to stdin after the Claude Code subprocess has exited
```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `0542290d33e433f4` → `e53ce0c6c5507009`

```
# Changelog

## 0.2.128

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.220

## 0.2.127

### Bug Fixes

- **Fixed premature stdin closure when background tasks are in flight**: `query()` no longer closes stdin on the first `result` frame when background tasks (e.g. `run_in_background: true` subagents) are still running. Previously, closing stdin too early caused SDK-MCP tool calls from background tasks to fail with `"Stream closed"` and silently bypassed PreToolUse hooks. Stdin now stays open until all in-flight tasks complete and the final result frame arrives (#1103)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.219

## 0.2.126

### New Features

- **`terminal_reason` on ResultMessage**: `ResultMessage.terminal_reason` now surfaces why the query loop ended (`"completed"`, `"max_turns"`, `"aborted_streaming"`, `"aborted_tools"`, etc.). A value of `"aborted_streaming"` or `"aborted_tools"` means the turn was cancelled via `ClaudeSDKClient.interrupt()`. Mirrors the TypeScript SDK's `SDKResultMessage.terminal_reason` (#1142)
- **Typed `model_usage` on ResultMessage**: `ResultMessage.model_usage` is now typed as `dict[str, ModelUsage]` instead of `dict[str, Any]`, with a new `ModelUsage` TypedDict that mirrors the TypeScript SDK's shape. Includes optional `canonicalModel` and `provider` fields for stable model identification across provider-specific aliases (#1143)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.218

## 0.2.125

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.217

## 0.2.124

### Bug Fixes

- **Refused batch script CLI spawning on Windows**: Blocked spawning `.bat`/`.cmd` CLI scripts (including npm's `claude.cmd` shim) on Windows to prevent command injection via cmd.exe metacharacter re-parsing (BatBadBut / CVE-2024-27980 class). Windows users relying on the npm shim should switch to the native installer, an explicit `claude.exe` path, or a platform wheel that bundles the CLI (#1127)
- **Windows cmd.exe metacharacter rejection**: `resume` and `session_id` values containing cmd.exe metacharacters (`& | < > ^ % ! "`) or newlines now raise `ValueError` on Windows, preventing injection even if a cmd.exe hop is reintroduced. POSIX behavior is unchanged (#1127)
- **Dash-prefixed `extra_args` value binding**: `extra_args` now uses `--flag=value` form when the value starts with `-`, preventing a dash-leading value from being misinterpreted as a separate CLI flag (#1127)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.216

## 0.2.123

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.215

## 0.2.122

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.214

## 0.2.121

### Bug Fixes

- **Fixed argv flag injection via `resume` and `session_id` options**: `--resume` and `--session-id` are now passed as single `=`-joined argv tokens (e.g. `--resume=<value>`) so that a dash-prefixed value is never misinterpreted as an independent CLI flag (#1123)

### Internal/Other Changes

- **Hardened build scripts against command injection via `CLAUDE_CLI_VERSION`**: Added version validation (`_cli_version_validation.py`) and eliminated shell interpolation in `download_cli.py` and `update_cli_version.py` so that a malformed version string cannot inject shell or Python code during builds (#1117)
- CI now lints and typechecks `scripts/` alongside `src/` and `tests/`
- CI CLI install steps now fail properly when `curl` errors (added `shell: bash` for `pipefail`)
- Updated bundled Claude CLI to version 2.1.212

## 0.2.120

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.211

## 0.2.119

```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
