# Pending review

> Auto-populated 2026-08-17T12:17:03.988095+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `820580d821bf2e3f` → `3709da260df3fe7b`

```
# Changelog

## 2.1.233

- Added GitLab merge request URL support to the `--worktree` flag and the `claude agents` view (where MRs display as `!N`)
- Added an opt-in `forward_user_identity` apps gateway setting on Anthropic upstreams that sends the signed-in user's identity as headers, so a proxy behind the gateway can attribute spend per user
- Added opt-in memory cgroup support for Bash tool commands on Linux (`CLAUDE_CODE_TOOL_MEMORY_LIMIT`) so a runaway build can't stall the session
- Added `CLAUDE_CODE_WEBFETCH_CACHE_TTL_MS` environment variable to configure the WebFetch session URL cache TTL (default unchanged: 15 minutes)
- Fixed cloud sessions occasionally being marked as lost when the environment shut down while Claude was waiting on a permission prompt
- Fixed MCP v2 connections endlessly reopening the subscriptions/listen stream against servers that terminate long-held streams on a fixed timeout (e.g. serverless hosts)
- Fixed Notification hooks not firing for permission prompts when running under Claude Desktop or VS Code
- Fixed idle sessions on Linux sometimes keeping one CPU core at 100% when sandboxing is enabled
- Fixed bundled skill aliases like `/checkup` and `/review` reporting "Unknown command" in `-p` mode or with plugins/MCP loaded when a user or project skill shadows the bundled skill
- Fixed skill/command argument substitution to prevent argument values from being re-expanded as template markers
- Fixed Windows paths spelled with the NT `\??\` device prefix bypassing UNC path validation, closing an NTLM credential-leak vector
- Improved `claude self-hosted-runner` session start time: the session branch is now created without rewriting the working tree, and two server round trips no longer block the agent's launch
- Improved apps gateway error forwarding: 400/413 errors from Vertex, Foundry, and Claude Platform on AWS upstreams now carry the upstream's own message; fixes a bug with auto-compact on apps gateway
- Improved `claude plugin validate` to check a bare `.claude/skills` directory, reporting SKILL.md files whose frontmatter fails to parse
- Improved screen reader mode: the `/effort` selector renders as a numbered list with a typed-number prompt, and hint and dialog text is no longer clipped
- Improved print mode diagnostics: a `[claude-code:unrecognized_model]` line is written to stderr when a request goes out for a model ID Claude Code doesn't recognize; map it with `modelOverrides` to silence
- Changed the GitHub app setup tip to no longer appear in repositories whose origin remote is on gitlab.com or bitbucket.org; the enterprise marketplace tip now covers non-GitHub internal git hosts
- Todo/task-tracking tools (TaskCreate/Get/Update/List, TodoWrite) are no longer available on Opus 4.8, Sonnet 5, Fable 5, Mythos 5, and newer models; set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1` to bring them back
- Windows: fixed auto mode repeatedly stopping for manual approval on ordinary `cd <dir> && <command> > file` Bash commands (a 2.1.232 regression)
- Reverted the 2.1.232 Bash permission changes for Cygwin-style symlinks on Windows and for input redirections (`< file`); a narrower version will return in a later release

## 2.1.232

- Subagent forking is now on by default: a `subagent_type: "fork"` subagent inherits the full conversation and prompt cache, and non-teammate agent spawns in interactive sessions now run in the background by default
- Type `@` in the prompt to mention another Claude session by name; Claude then uses `SendMessage` to reach that session directly
- `SendMessage` now delivers to a bare name that exactly matches one live session, instead of asking to confirm with a ref first
- Interactive sessions on one machine now keep unique names: starting or renaming a session to a name another live session already uses gives it a `name-word-word` variant and tells you
- Added `/config` rows for "Dialog expiry" and "Messages from your other sessions" (cross-session inbound accept/hold/refuse)
- Added secret redaction for GitLab token families (`glrt-`, `gloas-`, `glptt-`, `glagent-`, `glimt-`, `glsoat-`, `glcbt-`, `glft-`, `glffct-`) and full redaction of routable `glpat-`/`gldt-` tokens; the `glab` CLI config store gets the same sandbox and credential-path protection as `gh`
- Added GitLab support to plugin marketplaces: bare `gitlab.com` repo URLs (including nested subgroups) now clone like `github.com` URLs, and clone auth-failure hints name your actual git host
- Settings: `additionalMarketplaces` and `allowedMarketplaces` are now accepted as friendlier aliases for `extraKnownMarketplaces` and `strictKnownMarketplaces`
- Enterprise policy: a url-typed `blockedMarketplaces` entry for a bare repo URL keeps blocking that URL when the CLI classifies it as a git clone
- Gateway: the `desktop:` overlay now accepts every released Desktop setting (was 11 hand-listed keys), validated at boot against Desktop's own schema; unknown or invalid keys fail boot
- Gateway: empty `managed.policies[].match.groups`/`admin.admin_groups` entries and malformed `email_domain` values (empty, or containing `@`, whitespace, or commas) now fail at boot instead of silently matching no one or granting admin access
- Fable 5 is offered as an advisor in `/advisor` again for organizations with Fable access, with usage-credits consent set up through `/model fable`
- Fixed a PowerShell permission bypass where variable-writing parameters could silently overwrite `$PSDefaultParameterValues` and redirect later commands' file access
- Fixed a Windows permission bypass where Git Bash followed Cygwin-style symlinks that path validation saw as regular files; writes through them now require permission approval
- Fixed nested git repositories inheriting trust from a parent directory; each repository now requires its own trust confirmation
- Fixed MCP connections hanging for the full 30-second connect timeout when a server fails to answer or sends a malformed reply to the protocol-version probe
- Fixed Remote Control sessions hosted by a bridge inside a cloud session inheriting that session's transcript or credentials
- Fixed Remote Control sessions started from Claude Desktop or an IDE appearing as a new claude.ai session each time the local session was resumed; they now reattach to the existing one
- Fixed Remote Control sessions appearing unreachable to newly attached clients while idle
- Fixed Remote Control bridge sessions not restoring conversation history when the session worker restarts
- Remote Control: resuming a conversation whose session was deleted from claude.ai or the app now starts a replacement instead of failing with a message about your login (regressed in v2.1.227)
- Fixed Cloud gateway `/login` exiting silently or leaving an unresponsive terminal after "Press Enter to continue" when managed settings failed to load; the reason is now shown
- Fixed voice mode on native builds getting stuck on "listening…" when the voice service rejected the connection; the rejection is now shown immediately
- Fixed mTLS client certificate rotation requiring a restart; Claude Code now reloads the rotated cert and key automatically on connection errors
- Fixed malformed AWS or Vertex region values being used to build request URLs; they now fall back to the default region
- Fixed stream idle timeout errors failing the request instead of recovering on Bedrock, Vertex, and gateway deployments
- Fixed content-sized overlays containing truncated text rendering one column too wide, and start-truncated text collapsing to an ellipsis
- Fixed a stray garbled character where a long shell-command or agent-description preview was cut off mid-emoji
- Fixed a startup race that could silently unregister a plugin marketplace due to concurrent writes to `known_marketplaces.json`
- Fixed `/update` and `/tui` refusing to restart while work that survives the relaunch was running
- Fixed usage-limit guidance suggesting unavailable slash commands in SDK and remote sessions
- Fixed the consent message for interactive `--advisor fable` launches, which told you to run `/model fable` in an interactive session that had just exited
- Improved fullscreen streaming: long sessions stay responsive because the whole conversation is no longer re-normalized on every update
- Improved the managed settings approval dialog: shows endpoint URLs, uses clearer wording for telemetry-only changes, skips routine OpenTelemetry options, and requires approval for server-managed sandbox binary overrides (`sandbox.bwrapPath`, `sandbox.socatPath`, `sandbox.ripgrep`)
- `/feedback` and `/bug` now open immediately when invoked while Claude is responding, instead of waiting for the turn to finish
- `/plugin install plugin@marketplace` now refreshes the marketplace first, so newly published plugins install without a manual marketplace update
- `/code-review` at high, xhigh, and max effort now runs in a background agent like the other levels
- Pasted and clipboard images are read without blocking the event loop
- Remote Control now keeps reconnecting for about 30 minutes after a network blip and no longer drops after a few blips spread across an hour
- Remote Control: resuming a conversation no longer silently takes Remote Control away from another Claude Code on the same machine that still has it; run `/remote-control` there to move it
- Updated agent panel: completed subagents hide immediately with a `/tasks` footer hint, and the "↓ N more" overflow indicator moved left for visibility
- Remote Control: the terminal now says whether a session was taken over by another device, ended from another app, or deleted, and stops suggesting a reconnect that would undo it
- Bash input redirections (`< file`) are now permission-checked like their argument spellings on all platforms
- Shortened the message shown when resuming a completed background agent
- Cowork sessions no longer inline external @-imports from user-scope memory files
- Hardened the auto-generated cross-session messaging socket directory on shared `/tmp`: a pre-planted symlink or another user's directory is now refused instead of used
- Hardened the Linux filesystem sandbox against a protected-path bypass
- Changed `sandbox.ripgrep` to be honored only from user, managed, and `--settings` settings; project settings can no longer override the sandbox's ripgrep binary
- Removed the startup tip suggesting you create custom subagents, and the matching nudge in the `/powerup` tour

## 2.1.231

- Fixed MCP OAuth sign-in failing with a redirect URI mismatch for servers that use a pre-registered OAuth client, such as Slack

## 2.1.229

- Documented `claude remote-control --continue` for resuming the most recent Remote Control session
- Added server-supplied Claude Code hook support for self-hosted runner sessions, matching managed-environment behavior
- Added SSE keepalive pings to gateway streaming responses during long thinking pauses, preventing idle-timeout disconnects on Vertex and Bedrock upstreams
- Added plugin marketplace `command` sources: a local command (e.g. an IDE) prints the plugin directory, which is re-resolved each session and applied without a restart; `mode: "link"` uses it in place
- `ListAgents` now marks disconnected Remote Control sessions as `offline` and labels your cloud sessions as `cloud`
- Fixed long responses partly disappearing while streaming and being printed twice in the terminal
- Fixed a crash to the error screen (including on `--resume` of the affected session) when a tool call had a non-string `glob`, `file_path`, or `command` value
- Fixed a RangeError crash when a progress bar or markdown table rendered in a very narrow terminal window (could also crash `claude --continue`/`--resume` at startup)
- Fixed a crash on Windows when a tool call or message referenced a file by an extended-length (`\\?\`) or UNC path
- Fixed auto mode failing on every tool call for users who disable the attribution header via `CLAUDE_CODE_ATTRIBUTION_HEADER` (direct Anthropic API connections)
- Fixed `/model` rejecting Sonnet/Opus 1M for claude.ai subscribers using a custom `ANTHROPIC_BASE_URL` gateway
- Fixed MCP OAuth with strict authorization servers by using `127.0.0.1` instead of `localhost` in the redirect URI
- Fixed Remote Control clients showing a stuck working spinner after a slash command typed in the laptop terminal
- Fixed the Claude Code Review workflow generated by `/install-github-app` completing without posting its review on the pull request
- Fixed multi-second UI stalls after editing a file with thousands of IDE diagnostics while the IDE extension is connected
- Fixed one-shot `claude plugin` commands leaving a stray liveness file that could prevent cleanup of outdated plugin versions
- Fixed dynamic workflows inside CPU-limited containers using the host machine's core count instead of the container's CPU limit
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `86108f6e40c6bfca` → `1b582d238219eae3`

```
# Changelog

## 0.3.233

- Notification hooks now fire for pending permission prompts on the SDK path, matching the interactive REPL behavior
- Todo/task-tracking tools (`TaskCreate`/`TaskGet`/`TaskUpdate`/`TaskList`, `TodoWrite`) are no longer in the default tool surface on Opus 4.8, Sonnet 5, Fable 5, Mythos 5, and newer models; name them in the `tools` option or reference them in `allowedTools` (or set `CLAUDE_CODE_ENABLE_TODO_TOOLS=1`) to keep them

## 0.3.232

- Subagent MCP `tool_result` frames whose result carries `_meta` now emit `tool_use_result` as `{ content, _meta }` (matching main-loop frames) instead of a bare value
- `/context` result messages now carry a structured `context_usage` payload (new `SDKContextUsage` type), so consumers can render the context-usage card without parsing the markdown table
- `vcs_state_changed` events now populate the `branch` field for push operations, sourced from the pushed ref

## 0.3.231

- Updated to parity with Claude Code v2.1.231

## 0.3.230

- Updated to parity with Claude Code v2.1.230

## 0.3.229

- Added `terminal_slash_commands` to the system init message so Remote Control clients can hide terminal-oriented commands
- Changed conversations whose messages alone exceed the API's 32 MB limit to end the turn with `terminal_reason` `"api_error"` instead of `"image_error"`; `StopFailure` `error_details` is `"request_body_over_limit: …"`

## 0.3.228

- Agent tool results (`AgentOutput`): `usage.output_tokens_details` is now carried through

## 0.3.227

- Updated to parity with Claude Code v2.1.227

## 0.3.226

- Updated to parity with Claude Code v2.1.226

## 0.3.225

- Fixed background subagents in headless/SDK sessions never resuming when a background shell command or Monitor they left running completed, so the subagent never saw the result

## 0.3.224

- Added `crossSessionInbound` and `dialogExpiry` settings: cross-session messages sent to a session running with bypassed permissions are held for your approval, and messages to other sessions auto-deliver
- Added `subkind: 'peer-send-message'` to the `task-notification` member of `SDKMessageOrigin`, marking a notification raised by a cross-session `SendMessage`
- Added `source: 'archive'` plugin config variant to `Settings`, with `url` and optional `sha256`, for installing plugins from a zip over HTTPS
- Added sandbox credential-masking fields to `Settings`: `decode: 'jwt'` with `maskClaims`, `extract`/`onExtractNoMatch` on `envVars`, and `awsPairs`/`sigv4` for AWS SigV4 re-signing
- Fixed long (>200 char) project paths resolving to another project's session directory under a shared sanitized prefix; session list/get/rename/tag/fork/delete and `/resume` no longer cross projects

## 0.3.223

- Added `resumeDropsTurn` option: with `resumeSessionAt`, declares the turn a truncating resume intends to drop; the CLI refuses the resume if anything else would be discarded
- Result messages for repeated 529 overload failures now include `api_error_status: 529`, so SDK consumers can detect overload terminations structurally instead of matching message text
- Bare headless (`-p` / SDK `query()` without `canUseTool`) now emits `system/permission_denied` stream events when a tool call is auto-denied
- Documented `usage` vs `modelUsage` on stream-json results: `usage` is main-loop-only and per-turn; `modelUsage` is cumulative, covers all query-pipeline calls, and is the field for cost accounting

## 0.3.222

- Fixed `query({ sessionStore, resume })` not carrying user `settings.json` (`apiKeyHelper`, `env`, `hooks`, `permissions`) into the resumed subprocess

## 0.3.221

- Improved `skills` option validation: malformed names (delimiters or control characters) and wildcard-form names are rejected with a clear error; use `skills: 'all'` to enable every skill
- Fixed external MCP servers passed via the `mcpServers` option not being connected before the first turn, which caused the model to emit tool calls as literal text

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
```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `0d33c517def847b8` → `937df913f714921e`

```
# Changelog

## 0.2.139

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.233

## 0.2.138

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.232

## 0.2.137

### New Features

- **`ConversationResetMessage` for conversation reset events**: The SDK now surfaces the CLI's `conversation_reset` frame as a `ConversationResetMessage` dataclass, letting applications detect when a `/clear` or other transcript-discarding flow resets the conversation mid-session. Includes `new_conversation_id`, `uuid`, and `session_id` fields. This widens the `Message` union — code that exhaustively matches with `assert_never` will need updating (#1196)
- **Message origin on `UserMessage` and `ResultMessage`**: New `origin: MessageOrigin | None` field on `UserMessage` and `ResultMessage` surfaces why a turn was initiated — distinguishing application-submitted prompts (`"human"`) from background-task notifications, scheduled triggers, peer messages, and other session-injected turns. New exported types: `MessageOrigin`, `MessageOriginKind`, `TaskNotificationOriginSubkind` (#1199)
- **`resume_session_at` / `resume_drops_turn` options for truncating resume**: `ClaudeAgentOptions` now supports `resume_session_at` (fork a session at an earlier transcript entry) and `resume_drops_turn` (validate that only entries from a specific turn are discarded). Enables safe rewind-to-before-last-prompt without silently dropping unobserved messages (#1198)

### Bug Fixes

- **Seed `settings.json` into temp config dir on `SessionStore` resume**: Resuming from a `SessionStore` now copies `settings.json` and `cowork_settings.json` into the temporary config directory, preserving `apiKeyHelper` auth, user hooks, env vars, and permissions. Previously, hosts authenticating solely via `apiKeyHelper` would fail with "Not logged in" on resume (#1197)
- **Improved error messages for failed resume**: When the CLI rejects a resume (e.g. nonexistent session or `resume_drops_turn` guard failure), pending control requests like `initialize()` now receive the actual error text instead of a generic "Command failed with exit code 1" (#1198)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.229

## 0.2.136

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.228

## 0.2.135

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.227

## 0.2.134

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.226

## 0.2.133

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.225

## 0.2.132

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.224

## 0.2.131

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.223

## 0.2.130

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.222

## 0.2.129

### Breaking Changes

- **Skill name validation in `ClaudeAgentOptions.skills`**: Skill names containing parentheses, commas, control characters, wildcards (`*`, `:*`), leading `/`, surrounding whitespace, or surrogate code points now raise `ValueError` at connect time. `skills=["plugin:*"]` and `skills=["*"]` should be replaced with `skills="all"` or a `Skill(...)` rule in `allowed_tools`. Names with leading whitespace or `/` previously built rules that could never match (silently disabling the skill) and now raise explicitly (#1145)

### Bug Fixes
```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
