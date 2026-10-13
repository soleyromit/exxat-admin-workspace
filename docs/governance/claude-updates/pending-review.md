# Pending review

> Auto-populated 2026-10-05T12:17:01.494567+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `54ad047868ac051d` → `c3b0831a2102d8d4`

```
# Changelog

## 2.1.289

- Fixed a deny or ask rule on a nested part of a compound shell command not holding over a user-installed mod's approval on managed machines
- Fixed the terminal freezing on short code blocks with many unclosed `<script>` tags or deeply nested `${` substitutions
- Fixed `Read` deny rules not applying to files @-mentioned, changed, or selected in the IDE through a symlink
- [VSCode] Reverted a 2.1.288 change to `claude auth status` that may have made sign-outs more frequent
- Improved how quickly large files open in a plugin code pane by laying the highlighted view out once at its final width
- Fixed `plugin list`, `plugin eval` and `plugin update` showing a stale copy of a plugin installed from a local folder marketplace, and hot reload for a symlinked `--plugin-dir`
- Fixed installed mods not loading in the first session after an upgrade
- Fixed a plugin's rows above the prompt showing a stale row while the Background tasks dialog was open in fullscreen
- Fixed plugin panes drawing nothing when a link used a localhost address, an `@` in its path, an uppercase host or a `file:` path
- Fixed a user-installed plugin being able to rewrite the descriptions of an organization-managed MCP server's sign-in tools
- Fixed a freeze or forced quit at launch when a plugin drew a Box with a border style the terminal does not know
- Fixed supervised and background sessions ending when a plugin's on-screen handler threw asynchronously
- Fixed sessions ending with an interface error when a plugin region with no height kept growing
- Fixed Bash deny and ask rules missing a command behind an environment variable prefix with an expanded value (e.g. `TZ="$HOME" rm -rf build`) when the sandbox auto-allows commands
- Fixed a Bash deny or ask rule being skipped under sandbox auto-allow when a bare variable assignment came before the command
- Fixed `claude plugin validate` skipping the plugin when the folder also holds a marketplace manifest
- Added `agent.spawn` for teammates, one agent id across plugin hook events, and idle and waiting states in `$.agent.list()`
- Fixed sessions ending with "unrecoverable interface error" when a value a mod's `ui.render` hook wrote made a row throw while drawn; the engine now draws its own row instead
- Fixed text with a tab, a stray escape and a C1 control, or a short text with a tab and CRLF line endings, drawing over the rows below it
- Fixed right-aligned content in a mod's pane or band drawing under the close mark or `[-]`, which now also keep one column in from the terminal's edge
- Fixed a mod's `Client` that fails while drawn taking down everything the mod drew around it; it now fails alone and raises `ui.fault`
- Fixed `claude plugin validate` failing an Anthropic marketplace's own plugin and listing a clean `plugin.json` in `--json`
- Fixed a mod's band that fails to draw briefly telling the cards under it to step aside
- Fixed a failed plugin component showing `Error` or nothing as its reason when the failure carried no message
- Improved the line a mod's author sees when its band or pane fails to draw: it names the mod and says nothing was drawn
- Fixed published artifact pages freezing or crashing the reader's browser tab on short code blocks with many unclosed `<script>` tags
- Fixed a mod's Client region staying failed for the whole session after the terminal threw while drawing it

## 2.1.288

- Added `$.ui.selection()` for mods: returns the text you last selected in fullscreen mode and, when the selection lies within one transcript row, that row
- Added a built-in `gh api` to cloud sessions whose image has no GitHub CLI, and fixed the built-in sending control characters from file names, jq filters or GitHub errors to the terminal
- Added recovery for a prompt cleared with Ctrl+C: pressing Up on the empty prompt brings the draft back, including pasted text and images
- Added a re-authenticate prompt when an MCP server asks for more OAuth scope during a tool call
- Added `--max-findings <n>|all` to /code-review to report more or fewer findings than the usual limit; the choice is reused until you pass `--max-findings default`
- Added Ctrl+F to find a session by name and Alt+↑/↓ to jump between groups in the agents view; both, and rename, can be rebound in keybindings.json
- Added a screen reader mode announcement of the new permission mode when you approve a plan, including with Shift+Tab
- Fixed mid-response API timeouts failing the turn: non-interactive sessions and subagents now continue from the partial response, and thinking-only responses are retried
- Fixed long conversations failing with "Prompt is too long" instead of auto-compacting when the last reply reported zero token usage
- Fixed `--resume` sometimes dropping files and other context that a compaction had just restored
- Fixed a resumed session sometimes not saving the last response of a turn, so that the next `--resume` showed the prompt unanswered
- Fixed resume occasionally loading a transcript cut short when the same session rewrote the file during the load
- Fixed resuming a conversation started on 2.1.286 or earlier dropping the model's earlier thinking
- Fixed session titles, memory recall and prompt hooks failing on Mantle or behind gateways that reject structured outputs; added `CLAUDE_CODE_DISABLE_STRUCTURED_OUTPUTS` to turn structured outputs off
- Fixed auto mode denials pointing Claude at a Bash permission rule when the blocked tool was not Bash
- Fixed auto mode on Bedrock and Mantle switching to the local classifier for the rest of the session after a request to an older model, such as a WebFetch summary or a `sonnet` subagent
- Fixed cloud sessions that restarted on a newly picked model replying with that model after the server refused it
- Fixed Cowork cloud sessions staying marked as waiting for input after a WebFetch permission prompt for an unapproved URL went unanswered for five minutes
- Fixed prompt suggestions not appearing on a phone that joins a Cowork cloud session started on another device
- Fixed a mod's button sometimes running a different button's action when pressed on a view drawn before Claude Code restarted
- Fixed a plugin's pane showing nothing when one `Code` element held a diff that does not parse; it now draws as plain code
- Fixed plugin LSP servers receiving literal `${user_config.*}` and `${CLAUDE_PLUGIN_ROOT}` placeholders in `initializationOptions` and `settings` instead of substituted values or manifest defaults
- Fixed a plugin's `tool.call` hook making Bash fail and file searches read the wrong folder in subagents that run in a worktree
- Fixed `git-subdir` plugin installs failing, or caching an incomplete plugin, on older git (before 2.39, e.g. Ubuntu 22.04's 2.34)
- Fixed plugins loaded with `--plugin-dir` not showing "Configure options" in `/plugin`
- Fixed background sessions ending when a plugin was reloaded or disabled while one of its timers or reads was still running
- Fixed sandboxed heredocs with an unquoted delimiter (`python3 <<EOF`) asking for approval on every run under sandbox auto-allow when the body holds only plain text and simple `$VAR` references
- Fixed Bash tool permission check to prompt before a `BASHPID` assignment whose value the shell would evaluate as arithmetic, instead of allowing it silently
- Fixed fullscreen sessions exiting with "unrecoverable interface error" when opening the background tasks dialog while a plugin or mod showed rows above the prompt
- Fixed Claude reporting a message to another session as delivered when that session held it: the notice now says it wasn't delivered and names the session, and in SDK sessions Claude can now learn of it mid-turn
- Fixed OpenTelemetry `claude_code.tool.blocked_on_user` spans reporting `unknown` source or decision in `-p` and SDK sessions and for PreToolUse hook approvals
- Fixed permission asks that ended unanswered, in `-p` or on an interrupted turn, emitting no `tool_decision` event
- Fixed Edit and Retry in Cowork cloud sessions refusing a message sent before `/compact` even though its history was still saved
- Fixed unattended sessions (`CLAUDE_CODE_RETRY_WATCHDOG`) retrying for hours after a very long response stream failed; Claude Code now streams again, and gives up after three timeouts
- Fixed `/login` reporting "Login successful" when credentials could not be saved to secure storage; it now shows the failure, and offers a retry when the new login didn't take effect (anthropics/claude-code#73861)
- Fixed a Stop during Bedrock credential lookup sometimes moving the session to a fallback model instead of ending the request
- Fixed a second `gcpAuthRefresh`/`awsAuthRefresh` browser sign-in opening when a laptop wakes from sleep while another Claude Code process is signing in
- Fixed agent teams: a plugin-defined agent spawned by name now runs with its own prompt, tools, disallowedTools and effort instead of the defaults
- Fixed headless (`-p` / SDK) sessions occasionally ignoring SIGTERM when a supervisor such as `timeout` or systemd sends SIGCONT alongside it
- Fixed restarted cloud sessions restoring a model that the organization's enforced model list refuses
- Fixed MCP tool calls sometimes running twice when a remote server's result was over 16 MB or could not be parsed
- Fixed subagents in Claude Desktop's Code tab getting none of the tools of a user-configured MCP server named `memory`
- Fixed Claude in Chrome asking before every screenshot and page read on a site you allowed when auto mode is unavailable (such as with `disableAutoMode` or an older model); typing, navigation and JavaScript still ask
- Fixed `claude plugin install` failing for GitHub-source plugins on macOS and Linux machines with no GitHub SSH key: the clone now falls back to HTTPS and prints a notice
- Fixed `sandbox.credentials.files` entries on git config files not taking effect while `permissions.blockReadsOutsideWorkingDirectories` is on
- Fixed Claude leaving out your organization's design systems when starting slides or a design with the Artifact tool on Team and Enterprise plans or machines with managed settings
- Fixed the keyboard not working on Windows after Claude Code restarts itself (first sign-in to a Claude apps gateway, provider setup, `/tui`)
- Fixed a stall when launching an agent whose `tools:` lists very many `Agent(...)` entries
- Fixed sessions on Claude 3 Opus and Claude 3 Sonnet failing on every turn after a whole PDF entered the conversation
- Fixed the npm auto-updater reporting success when the platform-native binary failed to download and only the placeholder `claude` stub was installed
- Fixed Remote Control cleanup archiving a session that is still connected or was just re-attached by another Claude Code process
- Fixed `owner/repo` plugin marketplaces showing only the second attempt's error when both the SSH and HTTPS fetch fail; both errors are now shown, with the transport tried first on top
- Fixed path-scoped `.claude/rules` and nested CLAUDE.md files not loading when Write or Edit creates or changes a file in their scope (previously only Read loaded them)
- Fixed a dangerous `rm` (such as one on `/` or the home directory) inside a `bash -c` or `sh -c` script running without a prompt in bypassPermissions mode or under a shell allow rule (anthropics/claude-code#96300)
- Fixed LSP tool calls hanging indefinitely when a language server uses dynamic capability registration or stops responding; requests now time out after 60s (per-server `requestTimeout`)
- Fixed `idle_prompt` notification hooks firing while background agents are still running (anthropics/claude-code#93672)
- Fixed PreToolUse and PermissionRequest hooks being skipped when matching them failed or the tool's input could not be serialized to JSON; the call is now blocked
- Fixed the first request in a fresh environment or after a model switch using the built-in output limit and auto-compact window, not the server's; that request may now wait up to 1.5 seconds
- Fixed the "What should Claude do instead?" hint showing on the Interrupted row after sending queued messages with ctrl+enter
- Fixed `/login` in a `--bare` session running a sign-in the session never reads, which could replace your saved login; it now says which credentials work
- Fixed the InstructionsLoaded hook omitting agent_id and agent_type when a subagent's file access loads a rule or nested CLAUDE.md; rules and nested CLAUDE.md files loaded on file access now also report effort
- Fixed the Agent tool in `claude mcp serve` always reporting no available agents and rejecting every subagent_type
- Fixed the terminal cursor not following the typed text in the fullscreen transcript viewer's search and in `/theme`'s custom color search
- Fixed `/permissions` in screen reader mode: typing a rule's number now picks it instead of opening the search box
- Improved auto mode: when a conversation grows too long for the client-side safety classifier to review, it is now compacted instead of prompting for, or failing, every tool call
- Improved screen reader mode: short announcements, such as a deleted word, now stay on screen until your next key press or until something above them on screen changes
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `9d46ff24dc9ebd11` → `1e0ab10adf1e80e3`

```
# Changelog

## 0.3.289

- Updated to parity with Claude Code v2.1.289

## 0.3.288

- Updated to parity with Claude Code v2.1.288

## 0.3.287

- Added optional remote-session latency fields (`first_text_post_queue_wait_ms`, `first_text_post_queued_behind`) to the success result message
- Fixed `includePartialMessages` streams sending a cut-short reply's `message_stop` late or never, so apps could show the reply as still in progress
- Fixed the error for a revoked claude.ai login, which now reads "Failed to authenticate: OAuth token revoked" instead of a generic or "does not have access" message
- Fixed a tool call to an in-process MCP server being left waiting after `toggleMcpServer()` disabled the server or `setMcpServers()` removed it
- Fixed `commands_changed` arriving before `init`, or twice, at session start: the `initialize` response now includes commands registered at startup
- Changed `tool_use_result` for a WebFetch or WebSearch call that steps aside for a priority "now" message to `{ detachedToolCall: true }`; the result follows in a later turn
- Changed `tool_use_result` for MCP tools: `structuredContent` over 1,048,576 JSON characters is left off and `structuredContentOmitted: true` set, except for SDK-server and MCP Apps tools
- Updated to parity with Claude Code v2.1.287

## 0.3.286

- Added the initialize response field `sdk_mcp_manifests_parked` and the `system/init` capabilities `sdk_mcp_manifests` and `sdk_mcp_tools_list_changed`
- Fixed foreground subagents sometimes not receiving the task-tracking tools listed in `tools` or `allowedTools`
- Fixed an SDK MCP server listing no tools when one tool's schema cannot be converted to JSON Schema; that tool is now left out with a warning naming it
- Fixed `toggleMcpServer()` not disconnecting, and failing to re-enable, an in-process MCP server created with `createSdkMcpServer()`, except one named `claude-in-chrome`
- Changed a person's priority `now` message to move running shell commands, agents and MCP calls to the background and join the running turn instead of stopping it
- Changed the TypeScript Agent SDK to leave an omitted `permissionMode` to Claude Code, so a settings `defaultMode` now applies and, on third-party providers or with telemetry off, the session starts in auto mode like `claude -p`; pass `permissionMode: 'default'` for manual approvals
- Updated to parity with Claude Code v2.1.286

## 0.3.285

- Added an optional `read.title` (the artifact's stored title) to the Artifact tool's structured read result
- Added `provider_not_allowed` to `startup_failure_reason` and `allowedProviders` to the `Settings` type
- Fixed sessions with `CLAUDE_CODE_FORK_SUBAGENT=1`: a subagent's own Agent call now runs in the foreground, so the subagent gets the child's result
- Fixed `getSessionMessages()` leaving out a message sent while Claude was working when the process stopped before the reply, or when another prompt followed it with no reply in between
- Fixed `toggleMcpServer(name, false)` leaving the connection open for a server that had not yet connected when the session started, or whose config was edited after it connected
- Fixed `rewind_conversation` leaving a backgrounded MCP tool call running after the message that started it was removed
- Changed Bash/PowerShell `timeout` to bound a `run_in_background` command (was ignored; default 30 min, max 2 h); the `stopped` task notification for a stop at that limit says why
- Changed `getSubagentMessages()` to also return the messages a subagent read while it ran, such as a message sent to it; `offset` and `limit` count these rows
- Updated to parity with Claude Code v2.1.285

## 0.3.284

- Added a renamed skill's directory name to its `SlashCommand` `aliases` when the name is plain and Claude Code ships no command by that name
- Added `applied.ultracodeAvailable` and `applied.ultracodeRequested` to `getSettings()`: whether this session can run Ultracode, and whether it is requested, independent of whether it is in effect
- Fixed `forkSession()` copies reading back the wrong history when cut at a progress row or fork briefing after a rewind, or when the session was compacted with some messages kept
- Fixed `getSessionMessages()` leaving out messages from other agents, sessions and channels that the CLI transcript shows
- Fixed `{ decision: 'block' }` returned by Elicitation and ElicitationResult hook callbacks being ignored; it now declines the MCP elicitation
- Fixed `query()` closing stdin before a follow-up turn woken by a finished background agent, which failed that turn's hooks, `canUseTool` and SDK MCP calls with "Stream closed"
- Changed the first turn to still wait up to 2s for connecting MCP servers named in `allowedTools` or by an `mcp_tool` hook, even with `CLAUDE_CODE_MCP_STARTUP_WAIT_MS` set to `0`
- Changed `applyFlagSettings({ ultracode: true })` to keep the current effort level instead of switching to `xhigh`; an `effortLevel` that changes the level without `ultracode` turns Ultracode off
- Updated to parity with Claude Code v2.1.284

## 0.3.283

- Added `plugin_errors` to the `SDKSystemMessage` type (`system/init`), including `path` for a `--plugin-dir` entry that did not load
- Fixed `getSessionMessages()` returning, and `forkSession()` copying, a rewound-away branch when the newest branch ends at a meta row or a local command's rows
- Changed stream-json output to include warnings and notices raised during a turn as `system/informational` messages; it previously dropped them
- Changed the `set_max_thinking_tokens` control request: omitting `max_thinking_tokens` now leaves the session's thinking budget unchanged; send `null` to reset it to the session default
- Updated to parity with Claude Code v2.1.283

## 0.3.282

- Added support for `strictKnownMarketplaces` and `blockedMarketplaces` in host-supplied `managedSettings`: the allowlist applies only where admin policy sets none; the blocklist adds to the admin's
- Added `@anthropic-ai/claude-agent-sdk/core`, a smaller entry point for apps that bundle the SDK (query, MCP tool helpers, session mutations, `resolveSettings`); it uses your installed zod and MCP SDK
- Added `prewarm()` and `SpareProcess.claim()` (alpha): start a Claude Code process before its session is known and bind it to a folder and its per-session options later
- Fixed `readMcpResource()` relaying content `_meta` keys under the CLI-reserved `com.anthropic/` prefix; they are now dropped, as for tool results
- Updated to parity with Claude Code v2.1.282

## 0.3.281

- Added optional `trigger`, `user_message_uuid` and `timestamp` fields to the `conversation_reset` message so clients can tell what reset the conversation, match a /clear to its message, and show when the reset happened
- Fixed permission and dialog callbacks still being invoked for requests that arrived after `close()`
- Fixed control requests issued after a query closed hanging or leaking, and permission prompts that could not be cancelled after a cancelled request was redelivered
- Fixed `session_state_changed` staying at `requires_action` after an overlapping permission prompt and sandbox network-access prompt were both answered
- Improved SDK package size and load time: `sdk.mjs` no longer bundles unused dependencies (1.47 MB → 0.97 MB)
- Improved startup time for `query()` sessions with in-process MCP servers (`createSdkMcpServer`) by running their handshake inside the SDK; `initialize` may now wait up to 250 ms for them
- Improved SDK session start-up: the CLI now answers the host's initialize request before starting its background start-up work
```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `61945c3453ed0bd5` → `662928ff6ef999d2`

```
# Changelog

## 0.2.163

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.286
- CI: pinned the model for issue triage to fix failures caused by the CLI's new default model (#1328)

## 0.2.162

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.285

## 0.2.161

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.284

## 0.2.160

### Bug Fixes

- **Fixed follow-up turns failing after background subagents**: When using `query()` with hooks, `can_use_tool`, or SDK MCP servers, stdin was closed too early if a subagent finished just before the turn's result arrived. Follow-up turns would then fail with "Stream closed" and the model would report the tool as refused. The SDK now listens for the CLI's `session_state_changed` messages and keeps stdin open until the CLI reports `idle`, matching the TypeScript SDK's behavior. A bounded wait ceiling (configurable via `CLAUDE_CODE_PRINT_BG_WAIT_CEILING_MS`, default 10 minutes) prevents indefinite hangs. Older CLIs without state events fall back to the previous close-at-first-result behavior. (#1190, #1279)

### Documentation

- Aligned docstrings with the code and fixed docstring formatting (#1293)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.283
- CI: skip wheels over PyPI's per-file limit instead of failing the release (#1309)

## 0.2.159

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.281
- Pinned default model for e2e tests to `claude-opus-5` to work around CI failures with the CLI's new default model (#1287)

## 0.2.158

### New Features

- **`verbatim_prompts` option**: Added `ClaudeAgentOptions.verbatim_prompts` (default `False`). When `True`, user messages are delivered to the CLI exactly as written — no `@path` file expansion and no slash-command dispatch. This prevents untrusted text inlined into prompts from triggering unintended file reads or command execution. Works with `query()`, `ClaudeSDKClient.connect()`, and `ClaudeSDKClient.query()` for both string and async-iterable prompts. Requires CLI 2.1.248+; a warning is logged on older CLIs. (#1269)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.280
- CI improvements: recompressed wheels and raised the PyPI pre-flight threshold (#1283)

## 0.2.156

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.276

## 0.2.155

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.275

## 0.2.154

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.274

## 0.2.153

### New Features

- **`snapshot` option for system prompts**: Added a `snapshot` field to `SystemPromptPreset` and a new `SystemPromptCustom` typed dict. When `snapshot` is True, the session keeps the system prompt recorded on its first request, improving prompt-caching behavior across resumed sessions. When False, the prompt is rebuilt on every request, useful for iterating on `append` text. Requires CLI 2.1.257+ (#1268)

### Internal/Other Changes

```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
