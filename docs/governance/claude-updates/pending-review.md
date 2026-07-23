# Pending review

> Auto-populated 2026-07-20T12:30:07.636005+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `a000df2de5d9eb13` → `4c241900d74ff08c`

```
# Changelog

## 2.1.215

- Claude no longer runs the `/verify` and `/code-review` skills on its own; invoke them with `/verify` or `/code-review` when you want them

## 2.1.214

- Fixed single-segment `dir/**` allow rules like `Edit(src/**)` auto-approving writes to nested `dir/` directories anywhere in the tree instead of only `<cwd>/dir`
- Fixed a permission-check bypass affecting commands run in Windows PowerShell 5.1 sessions
- Fixed Bash permission checks to fail closed on file-descriptor redirect forms that bash parses differently than the permission analyzer
- Fixed Bash permission checks misjudging very long commands — commands over 10,000 characters now always prompt instead of running automatically
- Fixed Bash permission checks treating zsh variable subscripts and modifiers in `[[ ]]` comparisons as inert text — these commands now prompt for approval
- Fixed Bash permission checks to no longer auto-approve certain `help` and `man` commands that could run unsafe options, command substitutions, or backslash paths
- Fixed permission prompts on remote sessions that could proceed before the local confirmation dialog
- Added the EndConversation tool: Claude can end sessions with highly abusive users or jailbreak attempts, as on claude.ai since 2025 — see https://www.anthropic.com/research/end-subset-conversations
- Added a periodic progress heartbeat for long-running tool calls that previously went silent
- Added an ISO `modified` timestamp to memory file frontmatter
- Added `message.uuid`, `client_request_id`, and `tool_source` attributes to OpenTelemetry log events for message-level correlation and tool provenance
- Added `CLAUDE_CODE_OTEL_CONTENT_MAX_LENGTH` to configure the 60 KB truncation limit on OpenTelemetry content attributes
- Added reasoning effort to the `subagentStatusLine` payload, so custom agent rows can render model and effort
- Added permission prompts for `docker` commands (including the Podman `docker` shim) carrying daemon-redirect flags (`--url`, `--connection`, `--identity`, and Podman's remote mode) that previously ran without one
- Fixed a crash when a GrowthBook feature evaluates to null, and a bug where a malformed flag payload could wipe the cached feature flags
- Fixed Bash tool killing the Claude session when a `pkill -f` pattern accidentally matched the CLI's own process (Linux)
- Fixed unbounded memory growth when `--settings` points at a device file or multi-GB file; oversized (>2 MiB) settings files now fail at startup with a clear error
- Fixed streaming turns failing with "Socket is closed" behind corporate proxies on Windows
- Fixed stream-json output truncation at exit for slow-reading SDK/pipeline consumers; the exit drain now scales with queued bytes instead of a flat 2s cap
- Fixed scheduled tasks refusing their own configured prompt as untrusted input — the fired prompt is now delivered as the session's assigned task
- Fixed PowerShell tool commands hanging until timeout when a child process waited on standard input (Windows)
- Fixed Python scripts under the PowerShell tool crashing with UnicodeDecodeError when reading non-UTF-8 data from standard input (Windows)
- Fixed Python scripts run via the PowerShell tool crashing with UnicodeEncodeError on non-ASCII output, and PowerShell 7 error messages containing raw ANSI escape sequences (Windows)
- Fixed the PowerShell tool reporting `where.exe`, `fc.exe`, and `diff.exe` as errors when they return a valid negative answer (Windows)
- Fixed `>` and `>>` under the PowerShell tool on Windows PowerShell 5.1 writing UTF-16LE files that other tools couldn't read as UTF-8
- Fixed a displaced background daemon deleting its successor's control socket on shutdown, which made the next client kill the healthy replacement daemon
- Fixed background sessions parked with `←` or `/background` and left idle keeping the background daemon and a worker process alive indefinitely
- Fixed completed background sessions being impossible to remove via `claude rm` or the agent view once the background service had gone idle
- Fixed background sessions dispatched from a non-git folder being impossible to delete from the agents view
- Fixed reopening a stopped background session failing to restore its saved conversation when an unreadable folder exists in the session store
- Fixed the Remote Control "session ready" push notification firing for sessions where Remote Control was not explicitly enabled
- Fixed `/install-github-app` and the `/mcp` settings menu being blocked in agent-view sessions — they're now refused only in background sessions with no terminal attached
- Fixed plugins enabled via the `--settings` CLI flag not loading (regression since v2.1.181)
- Fixed feature flags going stale in long-running sessions after the OAuth token rotates
- Fixed `/ultrareview` refusing to run in repos with no merge base — it now offers to review all tracked files
- Fixed `claude update` and `claude doctor` hanging silently, and the `/status` System diagnostics section going blank, when a shell-config path is a directory
- Fixed memory frontmatter values being silently truncated at an inline `#` when memory files are saved
- Fixed session cost and token telemetry double-counting on streams that emit multiple cumulative `message_delta` frames
- Fixed a spurious "check your network" warning that appeared while the advisor was thinking
- Fixed hooks with exit code 2 not blocking as documented when the hook's stdout JSON fails schema validation
- Fixed OTel log events emitted outside the turn's async context missing the interaction span's trace context
- Fixed MCP transient errors during prompts/resources refresh clearing the server's slash commands and resources
- Improved the `claude rc` workspace-trust error in the home directory to say trust there is never saved and to suggest running from a project directory
- Changed single-segment `dir/**` hook `if:` conditions to match only `<cwd>/dir`; write `**/dir/**` for any-depth matching. `deny`/`ask` permission rules keep their any-depth match.
- Changed `file` commands using `-m`/`--magic-file` or `-f`/`--files-from` to require permission instead of being auto-allowed as read-only
- Changed keep-alive connection pooling to disable after a stale-connection error, so retries open a fresh socket
- Changed SessionStart hooks to report source `"fork"` when a session begins as a fork instead of `"resume"`

## 2.1.212

- `/fork` now copies your conversation into a new background session (its own row in `claude agents`) while you keep working; the in-session subagent it used to launch is now `/subtask`
- Added `claude auto-mode reset` to restore the default auto-mode configuration, with a confirmation prompt (pass `--yes` to skip)
- Added a session-wide limit on WebSearch tool calls (default 200, tunable via `CLAUDE_CODE_MAX_WEB_SEARCHES_PER_SESSION`) to stop runaway search loops
- Added a per-session cap on subagent spawns (default 200, override with `CLAUDE_CODE_MAX_SUBAGENTS_PER_SESSION`) to stop runaway delegation loops; `/clear` resets the budget
- MCP tool calls running longer than 2 minutes now move to the background automatically so the session stays usable; configure the threshold or disable with `CLAUDE_CODE_MCP_AUTO_BACKGROUND_MS`
- Typing `/resume` in the agent view now opens a picker of past sessions — including sessions deleted from the list — and resumes your pick as a background session
- Fixed plan mode auto-running file-modifying Bash commands (e.g. `touch`, `rm`) without a permission prompt or SDK `canUseTool` callback
- Fixed worktree creation following a repository-committed symlink at `.claude/worktrees`, which could create files outside the repository
- Fixed a `continue:false` hook's halt being dropped when the tool fails or completes mid-stream, and hook infrastructure errors being misreported as user rejections
- Fixed SIGTERM during a running Bash tool orphaning the command's process tree in print/SDK mode; the CLI now aborts the turn, kills the tree, and exits 143
- Fixed `/background` and `claude --bg` failing with "EUNKNOWN: unknown error, uv_spawn" on Windows when Group Policy blocks PowerShell 5.1; the daemon now prefers PowerShell 7
- Fixed shell mode (`!`) not executing commands containing file paths while the path autocomplete popup was open
- Fixed auto-mode denial notifications rendering broken characters when a long denial reason was truncated mid-emoji
- Fixed Ctrl+J not inserting a newline in the agent view dispatch input on terminals with extended key reporting, and surfaced the newline shortcut in the `?` help overlay
- Fixed `/ultrareview` rejecting PR references like `#123`, `PR 123`, and pasted PR URLs; error hints now name the command you actually typed
- Fixed `/ultrareview <branch>` not fetching the branch from origin when it exists remotely; it now suggests the closest branch name on typos
- Fixed `/ultrareview` skipping the billing confirmation in a new conversation after `/clear`
- Fixed `/ultrareview`'s "not a git repository" error on Claude Desktop now suggesting the project's repository folder instead of terminal commands
- Fixed hosted (host-managed) sessions failing at startup when repository settings configured mTLS certs, extra CA bundles, or OAuth scopes; these transport settings are now ignored with a warning
- Fixed a spurious "File has not been read yet" error when editing a file that had been read with offset/limit before resuming a session
- Fixed `ExitWorktree` failing with "no active EnterWorktree session" after resuming a session with `--continue`/`--resume` in print/SDK mode
- Fixed the workflow agent grid staying empty for Remote Control clients that join a session mid-run
- Fixed streaming-mode control requests being marked complete before their handler finished, which could lose the request on session restart
- Fixed background sessions created with `/fork` losing their live-parent protection after a state write failure
- Fixed reopening a stopped background session from the agent view failing silently — it now resumes the session, or shows why it can't and lets you force a restart
- Fixed agent teams: a stopping teammate could send the leader duplicate idle notifications when team initialization re-ran within a session
- Fixed the plan-approval dialog footer splitting "ctrl+g to edit in <editor>" apart when the file path is long
- Fixed the welcome banner keeping its old panel widths after a combined width+height terminal resize in fullscreen mode
- Fixed diff previews losing their line numbers and +/- markers in narrow layouts
- Fixed @-mentions attaching nothing after a partial file read, plugin uninstall targeting the wrong marketplace, and false "Command timed out" on exit code 143
- Fixed OpenTelemetry HTTP exports being rejected with 411/400 by Azure Monitor and other endpoints that don't accept chunked transfer encoding
- Fixed OTLP event log records missing `trace_id`/`span_id` when `TRACEPARENT` is set in SDK/headless mode
- Fixed conversations with many images incorrectly failing with "Request too large" errors, and improved the error message to explain the actual cause
- Fixed web search and web fetch returning "API Error" text as search results or page content when the API was overloaded
- Improved web search and web fetch reliability by retrying 529 errors and rate-limited requests with bounded backoff
- Improved prompt caching: the mid-conversation system block now works behind LLM gateways and custom base URLs (Bedrock, Vertex, 1P)
- Improved background agent attach: cold-attaching now instantly shows the formatted transcript while the session boots, instead of a blank wait
- Reduced token usage in inter-agent messaging: `SendMessage` bodies are no longer duplicated into replayed history and tool results
- Changed `/fork` to name the copy after your prompt when the session has no title, so the row is recognizable in the agent view
- Changed bare `/btw` to reopen the side-question panel on your most recent exchange so you can browse earlier answers
- Changed the `←` footer hint to pulse `N done` for a moment when a background agent finishes while nothing needs your input
- Deprecated the Task tool's `mode` parameter (now ignored); subagents inherit the parent session's permission mode by default
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `78f72e2284ab2b9a` → `43ed53519e9db096`

```
# Changelog

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
```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `d52597bc8ec9471e` → `0542290d33e433f4`

```
# Changelog

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

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.210

## 0.2.118

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.209

## 0.2.117

### Bug Fixes

- **Escaped untrusted fields in Slack issue notification workflow**: Fixed the Slack notification workflow to properly escape issue titles and usernames using `jq` instead of bash substitution, preventing malformed JSON payloads and mrkdwn injection from specially crafted issue titles (#1116)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.208

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

```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
