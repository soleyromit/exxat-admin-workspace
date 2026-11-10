# Pending review

> Auto-populated 2026-11-09T13:17:05.495581+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `107645b8364dd080` → `7c124cc46a362ab8`

```
# Changelog

## 2.1.319

- Changed auto mode with telemetry or feature flags off, including behind LLM gateways: calls the server can't check are asked about or denied, with no fallback to the built-in classifier; set `CLAUDE_CODE_AUTO_MODE_SERVER=0` to keep using it (Bedrock, Vertex and Foundry are unchanged)
- Changed auto mode behind an LLM gateway: `CLAUDE_CODE_AUTO_MODE_SERVER=1` turns on the server-side check even with `CLAUDE_CODE_DISABLE_EXPERIMENTAL_BETAS` set; if managed settings set the latter, they must set the `1` too
- Added support for MCP tasks in the terminal: when an MCP server runs a tool call as a task, Claude Code moves it to the background right away and tells Claude the result when it finishes
- Added the `CLAUDE_CODE_DISABLE_MCP_TASK_BACKGROUND` environment variable to make Claude Code wait for an MCP task inside its tool call instead of moving it to the background right away
- Added `permissions.denyInsteadOfPrompting` setting: a tool call that would wait on a permission prompt is denied and the turn continues, in terminal sessions, subagents and teammates
- Added `/claude-api latency-optimize` to find where your Claude API code makes people wait and try faster settings against your eval
- Added the `CLAUDE_CODE_DISABLE_FEATURE_FLAGS` environment variable, which stops feature-flag fetching without turning off telemetry; every flag then uses its built-in default
- Added spend for today, this week and this month to `/usage` for developers behind a Claude apps gateway who have no spend limit, when the gateway runs this version or later
- Added `admin.pooled_conflict_rule` and `admin.pooled_priority_order` to the Claude apps gateway, to set which pooled group budget pays first for a developer in several groups
- Added an optional `login_notice` setting to the Claude apps gateway that shows an operator-defined message on the gateway's browser verification page and on Claude Code's sign-in screen
- Added `CLAUDE_GATEWAY_LOG_FORMAT=json` to the Claude apps gateway: operational log lines become JSON with `severity`, `time` and `message`, for log collectors that read the level from a field
- Added a Claude apps gateway boot warning for a case where another policy's `availableModels` also allows a custom model id that one policy lists by name
- Added start-up warnings to the Claude apps gateway for policies with no `desktopHome` that rely on `coworkTabEnabled: false` or `chatSessionRetentionDays`, ahead of Claude Desktop's November 10 change
- Added a warning when your claude.ai login ends and Claude Code continues on the sign-in from `ant auth login`, which bills usage to your Claude Console organization
- Added a line at startup naming the Claude Console organization that is billed in a case where Claude Code uses the sign-in from `ant auth login`
- Added an "Earlier in this session" row to `/tasks` that lists finished subagents, so you can reopen one and message it even after it leaves the list or you restart
- Added a note to `/loop` confirmations in cloud sessions that a timer stops with its container, with an offer of a loop that survives
- Fixed MCP servers on the older handshake failing to connect, or returning empty results, because Claude Code declared an extension that it only uses with newer servers
- Fixed a long-running MCP tool call on a claude.ai connector sometimes never reporting its result after `--resume`
- Fixed a session's diff failing to load on claude.ai and the mobile apps when the folder Claude Code runs in has a file or folder named `HEAD`
- Fixed `/diff` showing "Diff unavailable" when a git repository has a file or folder named `HEAD` at its top level
- Fixed the `/diff` pane opening blank in sessions where 64 or more turns edited files
- Fixed slash commands typed after a leading space, tab or newline being sent to Claude as plain text instead of running
- Fixed a request that kept failing with a 401 refreshing your login on every retry and causing 401s in your other sessions
- Fixed `/context` sending its full visual grid to Claude on every later turn; Claude now reads only the table
- Fixed `claude -p` exiting 0 in auto mode when its actions were refused because no safety check was available: text and JSON output now exit 1
- Fixed a case where Claude Code listed every project file at start on Linux for projects on a network file system (NFS, SMB, Lustre and similar)
- Fixed a case where auto mode was wrongly refused when a client sent a model change and a request for auto mode back to back
- Fixed `/status` showing "Auto mode server: Enabled" when the server-side review isn't reaching the session, for example behind an LLM gateway that drops it
- Fixed Claude-drafted feedback, surveys and `/feedback` continuing to appear after the server refused feedback for your organization
- Fixed Claude drafting feedback on third-party gateways, where it can't be sent
- Fixed auto mode refusing actions without saying why when permission rules or `autoMode` settings are very large: it now explains and, unless `autoMode` deny rules are set, asks you in the terminal
- Fixed a case where Bash deny and ask rules missed commands written with quoted words
- Fixed subagent hand-back reports showing an internal marker and provenance note when expanded outside verbose mode
- Fixed `claude -p --resume` with a prompt losing a deferred tool call when its MCP server is missing: the run now exits 1, keeps the call and refuses later input
- Fixed a case where text was dropped from informational messages sent to SDK clients
- Fixed a case where Agent SDK hosts got a generic exit-code error instead of a failed run's own error message when the disk was full
- Fixed `CLAUDE_CODE_RESUME_INTERRUPTED_TURN` re-running a turn that was interrupted in plan mode when the session resumes in another permission mode
- Fixed edits to a settings file being ignored when made within a few seconds of Claude Code writing that file
- Fixed a config file left at the legacy name hiding your setup with no warning: Claude Code now says on stderr when a home holds two config files, and which is in use
- Fixed `~/.claude.json`, settings and edited files ending up empty or cut off when the disk fills during a save in a read-only folder or to a bind-mounted file (one session saving at a time)
- Fixed Write ending the turn as a refusal when it couldn't read the file to overwrite
- Fixed background Bash commands that finish almost instantly losing their output while being reported as completed
- Fixed the Bash tool's diff of changed files missing a file that the command wrote just before it ended
- Fixed a mistyped model name, such as `opus-5-5`, telling you to update Claude Code instead of suggesting the model you meant
- Fixed a case where `NotebookEdit` changed the wrong cell when the notebook changed while a permission prompt was open
- Fixed a ~0.5s hang after pressing Enter on the `/login` success screen: the dialog now dismisses immediately and the post-login refresh runs in the background
- Fixed Ctrl+G not opening the external editor while typing an "Other" answer to a question in screen reader mode
- Fixed Monitor's WebSocket watch failing with "could not resolve" behind a proxy when `CLAUDE_CODE_PROXY_RESOLVES_HOSTS` is set and the machine has no DNS of its own
- Fixed `claude plugin eval` warnings suggesting `max: 0` for a tool that must not be called, which could never pass
- Fixed background plugin auto-update not installing a dependency added by the updated plugin version
- Fixed Cmd+click not opening links in Ghostty over tmux in sessions opened from the agents view
- Fixed a mod's hot reload in `.claude/skills` missing a file that was deleted just after it appeared, and missing its return
- Fixed `/rewind` failing with "No files were restored" when restoring code to a checkpoint from before `/branch`
- Fixed the `/claude-api` skill saying Console web settings don't apply to Managed Agents sessions, and tightened its credential and permission examples
- Fixed needless permission prompts for read-only commands wrapped in a plain `timeout DURATION`, such as `timeout 30 rg foo`
- Fixed WebFetch describing claude.ai shared-chat links as empty pages; it now says shared chats can't be read and to paste the conversation instead
- Fixed Artifact database calls being re-sent to artifacts without a database; errors now say whether republishing helps
- Fixed a case where artifact database reads that save to a folder (`out_dir`) were refused
- Fixed detailed beta tracing not presenting `CLAUDE_CODE_CLIENT_CERT` to collectors that require a client certificate
- Fixed the OpenTelemetry `claude_code.session.count` metric counting Agent SDK `prewarm()` processes that were never claimed; a pre-started process now counts once, when it is claimed
- Fixed `/clear` killing running commands of background agents, teammates and workflows that keep running, and foreground subagents of background agents and teammates
- Fixed a terminal whose Claude apps gateway sign-in had expired sending telemetry and managed-settings requests that the gateway refused and logged as `invalid_token`
- Fixed the agents view appearing to send a reply to a background session waiting on a permission prompt; the reply now stays in the box with a hint to open the session and answer
- Fixed agent view removing a draft saved by another agent view in the same directory when exiting
- Fixed a case where agent view came back with another agent view's input text after restarting itself for an update
- Fixed the agents view preview cutting off long commands, results and status lines without an ellipsis, and dropping `**`, backticks and tags from commands waiting for approval
- Fixed Claude in Chrome reporting the extension as not connected when the connection dropped mid-action; Claude now checks the page before repeating an action that may have run
- Fixed Remote Control sessions still showing "Limit reached" on other devices after a usage limit was lifted outside the session
- Fixed the file card sometimes missing in the Claude iOS app when Claude sent a single file
- Fixed self-hosted runner sessions failing with no explanation when the server keeps refusing to renew model access: the runner now retries sooner and posts a warning in the session
- Fixed `/permissions` in cloud sessions replying only that it isn't available; it now says where the session's rules live and how to change them
- Fixed cloud sessions losing session-scoped deny and ask permission rules, such as those a PermissionRequest hook adds, when the session moves to a new worker
- Fixed mod hot-reloading turning off for the session when you typed three messages instead of answering its question in a cloud session
- Fixed background tasks that keep running after `/clear` disappearing from the task list in Claude Code on the web until another task started or ended
- Fixed hidden commands appearing in the slash command menu of cloud sessions on mobile and web
- Fixed a case where `/rewind` could restore or delete a file through a directory symlink
- Fixed a case where a `sed` command could skip the permission check in accept-edits and auto mode
- Fixed a case where `CLAUDE_CODE_AUTO_MODE_SERVER=1` in managed settings was ignored behind an LLM gateway when the gateway's URL is set only there and server-managed settings can't be fetched
- Fixed a Bash permission bypass where a crafted environment prefix could hide part of a command from permission checks
- Fixed a case where deny and ask rules, hook matchers and `disallowedTools` entries written with a claude.ai connector's terminal name (`mcp__claude_ai_Slack`) were ignored in Claude Desktop (takes effect once Claude Desktop includes this version)
- Fixed a sandbox escape when creating a worktree
- Fixed self-hosted runners: `--trust-workspace false` now also stops hooks in the repository's settings files and skills from running
- Fixed a case where idle background sessions started through a shell-exported LLM gateway left the gateway after an update
- Fixed help links in `/status` and the auto mode billing notice opening only part of the address when they wrap
- Fixed a case where certificate errors behind a TLS-inspecting proxy persisted when `CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC` was set. With it set, Claude Code now makes a TLS handshake with the configured API host after a certificate failure, through your http:// proxy if one is set; it sends no API request
- Fixed `claude remote-control` exiting silently with status 0 when a first-run question gets no answer (scripts, services, batch jobs, Ctrl+C); it now says why and exits 1
- Fixed `claude remote-control` ignoring a piped `y` that has no newline after it at the first-run question; it now counts as a yes
- Fixed `/rename` reporting plain success when the new name could not be saved to the session transcript; it now warns that the new name may not last
- Fixed `${CLAUDE_PLUGIN_ROOT}` not being substituted in a plugin-provided `subagentStatusLine` command, which can now reference the plugin's own scripts
- Fixed `claude plugin update` and `/plugin` "Update now" not installing dependencies added by the new plugin version
- Fixed subagents being told after compaction to expect a completion notice for background agents they neither started nor took over
- Fixed a case where a background agent's later report was lost silently: the notification now says it was refused and how to ask for it
- Improved config saves on Windows: Claude Code waits longer for a file another program has open, so a kill during a save is less likely to leave `~/.claude.json` empty
- Improved Claude in Chrome after a brief disconnect: it waits up to 6 seconds for the session's own browser to return before picking another
- Improved Claude in Chrome: `javascript_tool` results of up to 60,000 characters now stay in the conversation instead of being saved to a file
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `7e534c9009b67144` → `462dd97caf179d45`

```
# Changelog

## 0.3.319

- Added MCP task support in SDK sessions (not on Bedrock, Vertex or Foundry): with `CLAUDE_AUTO_BACKGROUND_TASKS=1` and streaming input, an MCP task runs in the background with `task_type` `"mcp_task"`
- Fixed the OpenTelemetry `claude_code.session.count` metric counting `prewarm()` processes that were never claimed; a pre-started process now counts once, when `SpareProcess.claim()` succeeds
- Fixed `session_writes_lost` listing the wrong session in `transcript_session_ids` after `/clear` in a session resumed from a transcript file outside the projects folder
- Improved `deleteSession()` to reject with `ENOTEMPTY` if the session's folder could not be fully deleted
- Changed `session_writes_lost` to be sent only when the CLI exits 0; a run that ends on an error result now gets only the stderr line
- Updated to parity with Claude Code v2.1.319

## 0.3.318

- Added an optional `credential_expires_at` field to result messages: when the stored claude.ai sign-in in use ends
- Added the `config_file_invalid` startup failure reason, reported when a configuration file read at startup isn't valid JSON
- Fixed the interrupt response missing a message held behind a model change: it is now listed, cancelled with `cancel_queued`, and stopped at start-up as a queued message is
- Changed `agentProgressSummaries`: while the subagent waits for a response on a likely-cold prompt cache, a summary can wait up to 5 minutes, and is not sent if the subagent ends first
- Changed `status` in `PushNotificationInput` to optional
- Updated to parity with Claude Code v2.1.318

## 0.3.317

- Added `onFailure` to hook matchers: with `"block"`, a hook that throws or returns invalid output blocks the action
- Added a warning message in the stream when a hook callback fails
- Added a `session_writes_lost` system message, sent after the last result when a full disk or disk quota kept the CLI from saving the session transcript or ~/.claude.json
- Added `initialize_not_first` to `startup_failure_reason`, for a `--await-initialize` launch whose first stdin line is not the initialize request
- Added `task.description` to the TaskCreate tool's `tool_use_result`: the description the task was created with
- Added `lossy` to `readFile()` utf-8 answers: `true` when decoding replaced bytes that are not valid UTF-8
- Removed the `file_unchanged` variant of `FileReadOutput` in `sdk-tools.d.ts`; a repeated Read now returns the file content
- Fixed `setMcpServers` closing a folder's `.mcp.json` and local-scope MCP servers in sessions started with `prewarm()` and bound with `SpareProcess.claim()`
- Updated to parity with Claude Code v2.1.317

## 0.3.316

- Added `permissions.blockReadsExemptPaths` to the `Settings` type: paths, read only from `--settings` and settings the host sends, that `blockReadsOutsideWorkingDirectories` lets through without making them working directories
- Updated to parity with Claude Code v2.1.316

## 0.3.315

- Updated to parity with Claude Code v2.1.315

## 0.3.314

- Added `sandbox_required_unavailable` to `startup_failure_reason`, for the result Claude Code writes when a required sandbox cannot run
- Added `permissions.blockWritesOutsideWorkingDirectories` to the `Settings` type
- Added `prewarm()` (alpha) to the `@anthropic-ai/claude-agent-sdk/core` entry point
- Fixed a settings file left out of `settingSources` still supplying some settings, such as auto mode rules and saved permission consents
- Updated to parity with Claude Code v2.1.314

## 0.3.313

- Updated to parity with Claude Code v2.1.313

## 0.3.312

- Added `autoMode`, `skipAutoPermissionPrompt`, `useAutoModeDuringPlan` and `permissions.disableAutoMode` to the `Settings` type
- Added `unanswered` (`skipped`, `replied_in_chat` or `dismissed`) to AskUserQuestion answers' per-question `annotations`; send it only when `system/init` lists the `ask_user_question_unanswered_v1` capability
- Fixed `resolveSettings()` returning mistyped managed auto-mode settings, such as `permissions.disableAutoMode: true`, as written instead of reading them as the CLI does; a user or project settings file whose auto-mode keys hold an invalid value is now skipped, as in the CLI
- Updated to parity with Claude Code v2.1.312

## 0.3.311

- Added `cacheCreationEphemeral5mInputTokens` and `cacheCreationEphemeral1hInputTokens` to `ModelUsage`, splitting `cacheCreationInputTokens` by cache lifetime
- Changed background start-up work to wait until the first model request is sent, for about 10 seconds at most, when the first message arrives during start-up
- Changed the minimum supported Node.js version from 18.0.0 to 18.14.0
- Updated to parity with Claude Code v2.1.311

## 0.3.310

- Updated to parity with Claude Code v2.1.310

## 0.3.309

- Fixed host-supplied `managedSettings` dropping `disableAllHooks`, `disableSkillShellExecution` and empty `allowedHttpHookUrls` / `httpHookAllowedEnvVars` lists
- Changed `extractFromBunfs()` to extract the embedded CLI into its own per-user temp directory (`claude-agent-sdk-<uid>`, or `claude-agent-sdk` on Windows) instead of Claude Code's temp root
- Changed `extractFromBunfs()` to reuse an already-extracted file only when its bytes match the embedded binary, replacing it otherwise
- Updated to parity with Claude Code v2.1.309

## 0.3.308

```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `61dca0bff713bc9d` → `ace5bc8fe96e2dba`

```
# Changelog

## 0.2.178

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.318

## 0.2.177

### New Features

- **`on_failure` option for `HookMatcher`**: Control what happens when a hook callback fails. Set `on_failure="block"` to block the action when a callback raises, returns `None`, or returns a value the CLI rejects. Defaults to `"continue"` (treat failure as no decision). Requires a CLI version that supports this option; connecting to an older CLI with `on_failure="block"` raises `CLIConnectionError` (#1460)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.317
- Tests: e2e tests now accept either `Bash` or `PowerShell` tool in shell-dependent tests, fixing intermittent failures on Windows (#1467)

## 0.2.176

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.316

## 0.2.175

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.314
- CI: raised PyPI project size limit guard from 50 GiB to 150 GiB to match the new quota granted by PyPI (#1455)

## 0.2.174

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.310

## 0.2.173

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.309

## 0.2.172

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.308

## 0.2.171

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.307

## 0.2.170

### Bug Fixes

- **Fixed parallel tool calls missing from session messages**: `get_session_messages` and `get_session_messages_from_store` now return every tool call and result from turns that ran tools in parallel. Previously only one branch of the forked transcript was followed, dropping some calls and results (#1422)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.306
- CI: release uploads to PyPI now use trusted publishing (GitHub OIDC) instead of a long-lived API token (#1418)

## 0.2.169

### Documentation

- Clarified that `include_hook_events` does not suppress `SessionStart` and `Setup` hook events, which the CLI emits regardless of the setting (#1336)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.305
- CI: hash-pinned the release build tools (`build`, `twine`, `wheel`, `hatchling`) so a tampered or unexpected download stops the job (#1415)

## 0.2.168

```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
