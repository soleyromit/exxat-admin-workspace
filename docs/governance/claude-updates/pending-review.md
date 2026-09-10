# Pending review

> Auto-populated 2026-09-07T12:20:02.323784+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `14eceeda4cb6cbf6` → `e2b544b137bbac77`

```
# Changelog

## 2.1.263

- Bug fixes and reliability improvements

## 2.1.261

- Added an "Organization policy" line to `/status` and `claude doctor` that says why your organization's policy could not be loaded, such as a proxy not passing the endpoint through
- Added `bashOutputMaxChars` and `taskOutputMaxChars` settings to raise how much command and background-task output Claude receives inline before it is saved to a file, up to 128K characters
- Added `--append-subagent-system-prompt-file` to read the subagent system prompt from a file, for prompts too large to pass on the command line
- Added `/skill-doctor` to show which loaded skills go unused and what they cost in context, so you can prune them
- Fixed typed or pasted characters occasionally landing out of order or being dropped during fast input or key repeat
- Fixed `/add-dir <subdirectory>` printing a false "couldn't be resolved" error when the working directory is on a `/net` automount
- Fixed the Bedrock setup wizard hanging when AWS or an AWS credential helper never responds (it now times out with a clear error), and its model checks failing behind a TLS-inspecting proxy
- Fixed cloud sessions discarding a plugin synced from claude.ai when managed settings force-enable it in `enabledPlugins`, then falling back to a marketplace clone that could fail
- Fixed being unable to delete the character immediately before an inline `[Image #N]` chip in the prompt input
- Fixed resuming a session losing hook output and other context around parallel tool calls, which changed the resumed request
- Fixed Remote Control showing a stale permission mode when a phone, browser, or claude.ai app attaches to a terminal session or after the mode changes in the terminal
- Fixed Remote Control sessions showing as still working (stuck spinner and Stop button) after stopping a turn from a connected phone or browser, or after a local slash command like `/clear`
- Fixed SDK and cloud sessions ignoring a Stop or interrupt sent just after the first prompt, before the turn had started; the turn now stops instead of running to completion
- Fixed Remote Control uploading a session pulled with `/teleport` into the connected session, which appeared appended to the original on phone and web
- Fixed Remote Control's inbound event stream failing behind TLS-inspecting corporate proxies on native Windows
- Fixed Remote Control sessions showing the default effort level on claude.ai when the effort comes from settings
- Fixed `gcpAuthRefresh` opening a browser at startup when the Google credential check was slow, even though the credential was still valid
- Fixed claude.ai connectors staying absent for the whole session when the startup connector fetch timed out — the CLI now retries in the background
- Fixed sustained high CPU usage when a background agent could not be resumed and its wake-up was retried in a tight loop
- Fixed feature flags gated to a newer version occasionally applying to an older Claude Code version running on the same machine
- Fixed `/usage` and the VS Code usage panel dropping a model-specific weekly limit row when the usage endpoint is rate limited or when opened right after startup
- Fixed `claude -p --resume <file>` adopting a malformed session ID recorded in the transcript; it now resumes under a fresh session ID instead
- Fixed the terminal progress indicator (iTerm2, Ghostty, ConEmu) showing the session as finished while a background workflow or agent was still running
- Fixed a rare layout glitch where a box could render with the wrong height after its container switched between row and column direction
- Fixed Claude apps gateway client IP when a trusted proxy appends a port to `X-Forwarded-For`; with an access list set, an unreadable entry now gets 403
- Fixed Claude apps gateway telling Claude Desktop to export OpenTelemetry as JSON even when the terminal CLI uses protobuf, so protobuf-only collectors rejected Desktop's data
- Fixed Desktop and web showing a session as busy while it only watches an artifact for updates
- Fixed Claude in Chrome `file_upload` failing with "paths: expected array, received undefined" in local Cowork sessions run from the Claude Desktop app
- Fixed `SendMessage` to an offline Remote Control session on another machine reading as delivered; the result now says delivery is queued until that machine reconnects
- Fixed plugin install hints from CLIs run in background Bash commands: they are now detected, and the raw `<claude-code-hint>` tag no longer leaks into the conversation
- Fixed in-process agent-team teammates re-sending their first-turn tool and skill announcements on the second turn, which changed the request prefix and missed the prompt cache
- Improved the `/model` picker and the VS Code model pill to show a model's name instead of its raw Bedrock, Vertex AI, or LLM gateway ID when Claude Code recognizes it
- Improved startup on Google Vertex AI when `GOOGLE_APPLICATION_CREDENTIALS` is set: API client creation no longer re-runs Google Cloud project discovery or spawns extra `gcloud` processes
- Improved streaming performance: already-rendered blocks are no longer re-checked by layout on each update
- Improved the dangerous-`rm` safety prompt to also catch `rm -rf` on positional parameters and inside double-quoted `sh -c` scripts
- Improved handling when the API sends no response headers: the retry now waits up to `API_TIMEOUT_MS` (10 minutes by default) instead of another 3 minutes, and the messages say what to change
- Changed a Claude apps gateway 403 on the managed settings load (at startup or after `/login`) to say Claude Code may not be enabled for the organization, instead of advising a new sign-in
- Changed machines whose managed settings pin `forceLoginMethod: "gateway"` to ignore a leftover API key or claude.ai login and ask for `/login`; Bedrock, Vertex AI, and Foundry sessions are unaffected
- Changed auto mode to treat a link that packs content into a public diagram renderer's URL as an upload to that site: no longer auto-approved unless you asked for it
- Changed the prompt's word-editing keys to match Bash: Ctrl+W deletes back to whitespace, Alt+F and Alt+D stop at word end, punctuation separates words; `keybindingFlavor` no longer has any effect
- Changed `/context` token counting to use a local estimate when the token-counting API is unavailable, instead of extra small-model requests
- [VSCode] Added a "Build a custom style" walkthrough to the Output styles menu that writes a custom output style file and lists it right away
- [VSCode] Added an Add server form and a Remove action to the MCP servers dialog, so MCP servers can be added and removed without leaving the IDE
- [VSCode] Added a hollow ring in the session list for sessions open in a terminal, another VS Code window, or Claude Desktop, so they no longer look closed
- [VSCode] Added a fold button to permission and question prompts so the conversation behind them can be read without dismissing them; the space beside the prompt now scrolls the conversation
- [VSCode] Added "Archive session" to the session list's right-click menu and gave Unarchive its own icon
- [VSCode] Fixed a session teleported from Claude Code on the web treating a question that was cut off when the cloud session shut down as declined
- [VSCode] Fixed the session tab's Rename box opening empty for a tab restored with the window; it now starts with the current name
- [VSCode] Fixed collapsed sections in the session list panel briefly showing expanded each time the panel loaded
- [VSCode] Fixed Focus view showing a tool call as still running after Claude had moved on, such as while a question waited for your answer
- [VSCode] Fixed the session list's active-row highlight going stale when an unfocused Claude tab's session ID is corrected
- [VSCode] Fixed Cmd/Ctrl+Shift+T reopen and deep-link opens placing the Claude tab outside the Claude editor group when a Claude tab has focus
- [VSCode] Fixed the session tab's "Add to group" putting a session opened from Claude Code on the Web in two groups; it now moves the entry the session list shows
- [VSCode] Fixed the model picker showing models an organization has since disabled until the window was reloaded twice
- [VSCode] Fixed a tab opened from the session list jumping back to that session, and a tab opened from a Web session restarting its teleport or staying empty, after VS Code reloads the tab's view
- [VSCode] Fixed `/btw` side-question history from earlier sessions being overwritten when a question is asked right after a window reload or while a settings file has errors
- [VSCode] Fixed the pending question card not reappearing after the Claude panel reloads when signed in with a Claude.ai or Console account
- [VSCode] Fixed claude.ai-only features staying visible in a window's other Claude panels after one panel picked up a third-party provider from a settings file
- [VSCode] Fixed the sign-in screen appearing despite the Disable Login Prompt setting when Claude Code reports no login or a request fails for lack of one
- [VSCode] Fixed the next queued permission prompt keeping text typed on the previous prompt and accepting an immediate second click
- [VSCode] Fixed install-plugin links opening the Claude sidebar without the install dialog in a window where only the session list had been shown
- [VSCode] Fixed the sidebar usage meter staying empty on a new window until the Account & usage dialog was opened, and a 0% usage limit being left out of the meter
- [VSCode] Fixed "Start new session in this group" losing the group after New conversation, and a missing unread dot for a session that finished before the sidebar's unread list loaded
- [VSCode] Fixed the editor tab badge showing unread during a running turn or missing on a tab opened from the session list, and "Add Session Tab to Group" doing nothing for an archived session
- [VSCode] Fixed "Enable Remote Control for all sessions" so flipping it also applies right away to sessions open in other VS Code windows
- [VSCode] Fixed the session list's Open filter for sessions continued from claude.ai whose tab was still recorded under the web session, and labeled the filter menu's sections for screen readers
- [VSCode] Changed the model picker to one flat list of every model, with rows kept for older model spellings listed last

## 2.1.260

- Added a diff panel that opens beside the conversation in fullscreen mode and shows your uncommitted changes as Claude edits; toggle it with `/diff`
- Added a likely cause for prompt-cache misses (e.g. tool definitions or system prompt changed, idle past the TTL) to `/cost` and the status line's `prompt_cache` field
- Added `/reload-plugins` to headless sessions, so it appears in the Claude Code Desktop and SDK command lists
- Added a text form of `/advisor` (`/advisor`, `/advisor <model>`, `/advisor off`) for the desktop app, Remote Control, and other headless (`-p`/Agent SDK) sessions
- Added `oidc.scope_on_refresh` to the Claude apps gateway for IdPs that return an id_token on refresh only when asked for `openid` again
- Added Claude apps gateway support for newer Claude Desktop keys in `desktop` policy blocks, including `userPluginMarketplacesEnabled` and `userPluginUploadsEnabled`
- Fixed `Edit`/`Write`/`Read` permission rules whose path contains parentheses being dropped as invalid or ignored by the Bash sandbox, which left "read-only" folders writable
- Fixed one file permission rule with an uncompilable pattern (e.g. an unclosed `[`) making every file edit fail with `Invalid regular expression`; such a deny rule now guards the literal path it spells
- Fixed Bash permission checks auto-approving zsh commands that hide a command substitution in a REPORTTIME, REPORTMEMORY or DIRSTACKSIZE assignment; these now prompt for approval
- Fixed Bedrock model discovery, token counting and AWS SSO/STS credential calls failing with "unable to get local issuer certificate" when the corporate root CA is only in the OS certificate store
- Fixed `permissions.blockReadsOutsideWorkingDirectories` on macOS hiding the user's git config from sandboxed git and hiding a worktree-isolated sub-agent's own checkout
- Fixed managed settings not loading for claude.ai Enterprise/Team users who also had a leftover API key from an earlier `/login`
- Fixed `/status` listing a signed-in claude.ai account and a configured API key as if both were in effect; the credential not in use is now marked
- Fixed managed `skillOverrides` entries keyed on a bundled skill's alias (e.g. `checkup` for `/doctor`) not applying, and `Skill(name)` deny rules not covering a nested skill listed as `<dir>:name`
- Fixed `model: fable` agents ignoring the `[1m]` tag on an `ANTHROPIC_DEFAULT_FABLE_MODEL` pin and silently running with a 200K context window
- Fixed the `/model` picker not showing Fable 5.1 for organizations that can use it, which was only accepted when typed as `/model claude-fable-5-1`
- Fixed prompt caching on Claude Fable 5.1 not covering the context attached after tool results, so it was re-sent as uncached input on every tool-call turn
- Fixed model switching staying blocked for the rest of the session after a plugin hook load failure; each switch now re-checks and the refusal names the cause
- Fixed model switching being blocked for the session when an organization-managed plugin's marketplace could not be loaded
- Fixed SDK-provided MCP servers (e.g. Desktop connectors) sometimes missing from the first turn and only appearing on the next one
- Fixed Claude in Chrome tools failing with "Not connected" mid-task in cloud-hosted claude.ai sessions when a connector was added or removed
- Fixed flags, joined emoji and accented letters splitting across wrapped lines, and stale text staying on screen when a flag or joined emoji falls in the terminal's last two columns (now shown as `…`)
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `3d65f3a5eaea1266` → `b92fd4b97b0947b9`

```
# Changelog

## 0.3.263

- Updated to parity with Claude Code v2.1.263

## 0.3.262

- Updated to parity with Claude Code v2.1.262

## 0.3.261

- Added `pluginDelivery: 'initialize'` to send `plugins` over stdin so the launch command line no longer grows with the plugin count (fixes Windows start failures with many plugins)
- Fixed `query()` throwing "Object not disposable" in runtimes without a native `Symbol.dispose`, such as Node ≤22 `vm` contexts (Jest's `node` environment, vitest `vmThreads`/`vmForks`) and Node <18.18
- Updated to parity with Claude Code v2.1.261

## 0.3.260

- Added optional `user_message_uuid` to `thinking_tokens` system messages, linking thinking progress to the user message that triggered the turn
- Added optional `first_content_frame_ms`, `first_stream_post_ms`, `first_stream_post_ack_ms` and `first_stream_post_wall_ms` fields to the success result message for remote-session latency breakdowns
- Fixed `managedSettings` `disableAutoMode: "disable"` (either spelling) being dropped by the restrictive-only filter instead of turning auto mode off for the spawned session
- Fixed `rewindFiles()` reporting success when no files could be restored (for example when checkpoint backups are missing); it now fails
- Changed `error_max_structured_output_retries` results to append the last StructuredOutput tool error; validation errors now name the offending key, allowed values, and actual length or count
- Changed `rate_limit_event` to also re-emit during an exceeded window on repeat 429s (about once per 30 seconds per limit window), so stream consumers can refresh stale rate-limit state
- Updated to parity with Claude Code v2.1.260

## 0.3.259

- Added `user_message_uuids` beside `user_message_uuid` on a turn's first reply frame and result: every user message the turn answered, so a reply to several merged messages can be matched to each
- Added `permissionPrompts: 'none'` option to auto-deny permission prompts in sessions with nobody to answer them, without disabling auto mode's classifier
- Updated to parity with Claude Code v2.1.259

## 0.3.258

- Updated to parity with Claude Code v2.1.258

## 0.3.257

- Added `thinkingTokens` to `ModelUsage` (a subset of `outputTokens`), and fixed result-message `usage.output_tokens_details.thinking_tokens` reporting 0 instead of the session's real count
- Added `tool_use_result.resourceLinks` on user messages carrying MCP tool results: the `resource_link` blocks the tool returned, so hosts can render returned files without parsing the result text
- Added optional `resource_links` to `task_notification` for an auto-backgrounded MCP tool call that completed, listing the files it returned by reference; join to the call via `tool_use_id`
- Fixed `mcp_reconnect` and `mcp_toggle` acting on a same-named `.mcp.json` / `~/.claude.json` server instead of the `--mcp-config` or `mcp_set_servers` one
- Fixed `mcp_toggle` disable also removing the tools of a sibling MCP server whose name extends the disabled one's (disabling `foo` dropped `foo__bar`'s tools)
- Changed `mcp_set_servers` to also list a server whose connection attempt throws under `added` (with a `failed` row in `mcp_status`), not only under `errors`
- Changed Agent tool calls to emit the periodic `tool_progress` heartbeat (`heartbeat: true`) like other long tools; heartbeat frames never clear a `subagent_retry` indicator
- Fixed the browser SDK bundle (`@anthropic-ai/claude-agent-sdk/browser`) never streaming any messages on engines without native `Symbol.dispose` (Safari/iOS, Firefox ESR, older Chromium)
- Fixed a background Bash task that is still running when a stream-json session ends right after an interrupt (stdin closed) never receiving its final `task_notification`
- Fixed `-p` giving up on a long-running background subagent without actually stopping it, so `background_tasks_changed` kept listing it and events for it arrived after its `stopped` notification
- Added `detail` option to `Query.getContextUsage()`: `'summary'` answers from the last response's usage and local estimates without per-category token-count API calls (default `'full'`)
- Updated to parity with Claude Code v2.1.257

## 0.3.256

- Updated to parity with Claude Code v2.1.256

## 0.3.255

- Updated to parity with Claude Code v2.1.255

## 0.3.254

- Updated to parity with Claude Code v2.1.254

## 0.3.253

- Updated to parity with Claude Code v2.1.253

## 0.3.252

- Updated to parity with Claude Code v2.1.252

## 0.3.251

- Updated to parity with Claude Code v2.1.251

## 0.3.250

- Updated to parity with Claude Code v2.1.250

## 0.3.249
```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `831bcea5b7cd94f4` → `3a95dce6f78c2ca5`

```
# Changelog

## 0.2.152

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.259

## 0.2.151

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.258

## 0.2.150

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.257

## 0.2.149

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.252

## 0.2.148

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.251

## 0.2.147

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.250

## 0.2.146

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.248

## 0.2.145

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.247

## 0.2.144

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.246

## 0.2.143

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.238

## 0.2.142

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.237

## 0.2.141

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.236

## 0.2.140

### New Features

- **MCP 2.x support for in-process SDK MCP servers**: The SDK now supports `mcp` 2.x alongside 1.x (dependency widened to `mcp>=1.23.0,<3.0.0`). In-process servers are served over mcp's own in-memory transport instead of hand-rolled JSON-RPC dispatch, so hand-built `mcp.server.Server` instances now work at full fidelity — resources, prompts, and all result content types reach the CLI verbatim. Tool cancellation on interrupt is supported on mcp 2.x. `claude_agent_sdk.ToolAnnotations` accepts both camelCase and snake_case hint names on every mcp version (#1218)
- **`forward_subagent_text` option**: New `forward_subagent_text` boolean on `ClaudeAgentOptions` forwards a subagent's text and thinking blocks as messages in the stream, so consumers can render the full nested transcript. Matches the TypeScript SDK's `forwardSubagentText` (#1206)
```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
