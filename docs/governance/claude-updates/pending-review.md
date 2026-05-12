# Pending review

> Auto-populated 2026-05-12T09:11:52.011831+00:00 by `scripts/claude-updates-watch.py`.
> 3 of 3 sources changed since last check.
> The `claude-updates-watcher` subagent reads this file when invoked.

## Changed sources

### Claude Code CHANGELOG (anthropics/claude-code)

- **URL**: https://raw.githubusercontent.com/anthropics/claude-code/main/CHANGELOG.md
- **Hash**: `(first time)` → `e171590696ac0eb8`

```
# Changelog

## 2.1.139

- Added agent view (Research Preview): a single list of every Claude Code session — running, blocked on you, or done. Run `claude agents` to get started. See https://code.claude.com/docs/en/agent-view
- Added `/goal` command: set a completion condition and Claude keeps working across turns until it's met. Works in interactive, `-p`, and Remote Control. Shows live elapsed/turns/tokens as an overlay panel
- Added `/scroll-speed` command to tune mouse wheel scroll speed with a live preview
- Added `claude plugin details <name>` to show a plugin's component inventory and projected per-session token cost
- Added transcript view navigation: `?` for keyboard shortcuts, `{`/`}` to jump between user prompts, `v` to toggle shortcut panel
- Added hook `args: string[]` field (exec form) that spawns the command directly without a shell, so path placeholders never need quoting
- Added hook `continueOnBlock` config option for `PostToolUse` — set to `true` to feed the hook's rejection reason back to Claude and continue the turn
- MCP stdio servers now receive `CLAUDE_PROJECT_DIR` in their environment, matching hooks. Plugin configs can reference `${CLAUDE_PROJECT_DIR}` in commands
- Compaction prompt now asks the model to preserve sensitive user instructions
- `/mcp` Reconnect now picks up `.mcp.json` edits without a restart, and shows the HTTP status and URL when reconnecting fails
- `/context all` per-skill token estimates now account for the model's tokenizer and show rounded values
- `claude plugin install <name>@<marketplace>` now auto-refreshes the marketplace and retries before reporting a plugin as not found
- `/plugin` installed-plugin details now show hook event names and MCP server names cleanly
- `/context` now shows the providing plugin's name for plugin-sourced skills
- Remote MCP server reconnect retry on transient failures is now enabled for all users
- API requests from subagents now carry `x-claude-code-agent-id` / `x-claude-code-parent-agent-id` headers, and `claude_code.llm_request` OTEL spans include `agent_id` / `parent_agent_id` attributes
- Remote Control, `/schedule`, claude.ai MCP connectors, and notification preferences are now disabled when `ANTHROPIC_API_KEY` / `apiKeyHelper` / `ANTHROPIC_AUTH_TOKEN` is set, even if a Claude.ai login also exists. Unset the API key to use these features
- Fixed a deadlock where expired credentials and the `forceRemoteSettingsRefresh` policy setting blocked `claude auth login`/`logout`/`status` with no way to recover
- Fixed `autoAllowBashIfSandboxed` not auto-approving commands with shell expansions like `$VAR` and `$(cmd)`
- Fixed a bug where a hook writing to the terminal could corrupt an on-screen interactive prompt; hooks now run without terminal access
- Fixed unbounded memory growth when an HTTP/SSE MCP server streams non-protocol data — response bodies now capped at 16 MB per SSE frame
- Fixed `Skill(name *)` permission rules — the wildcard form now works as a prefix match, matching `Bash(ls *)` behavior
- Fixed settings hot-reload not detecting edits to symlinked `~/.claude/settings.json`
- Fixed plugin details failing to load when the marketplace key differs from the manifest name
- Fixed `/model` picker "Default" row not reflecting `ANTHROPIC_DEFAULT_OPUS_MODEL`/`ANTHROPIC_DEFAULT_SONNET_MODEL` overrides
- Fixed spurious "stream idle timeout" 5 minutes after a response completed, caused by the watchdog timer not being cleared on stream cancellation
- Fixed silent `exit 1` when 10+ MCP servers are configured and the cache directory is unwritable — the error message now includes the underlying cause
- Fixed a typing cursor blinking on tab names, list pointers, and select rows in dialogs
- Fixed transcript view letter shortcuts not working after mouse click
- Fixed Bash-mode up-arrow history repeating the first entry and clobbering the in-progress draft
- Fixed pasting or dropping multiple images only inserting the last one
- Fixed hyperlinks using unreadable dark navy on dark themes — they now adapt to the active theme
- Fixed model picker showing a redundant "Current model" row for third-party users whose model is set to the `opus` alias
- Fixed legacy Opus picker entry on PAYG 3P providers resolving to the same model as the default entry
- Fixed mouse wheel scrolling speed in Cursor and VS Code 1.92–1.104; the trackpad now scrolls at a steady rate and the mouse wheel keeps ~3 lines per notch
- Fixed scroll behavior in Windows Terminal and VS Code when attached to background sessions
- Fixed MCP resources from disconnected servers lingering in `@server:` autocomplete
- Fixed two-file diff snippets over-reporting the number of truncated lines by one
- Fixed Grep results not relativizing Windows drive-letter paths and count mode reporting wrong totals for single-file paths
- Fixed border-embedded text overflowing on CJK/emoji due to visual cell width miscalculation
- Fixed fuzzy-match highlighting splitting emoji and astral-plane characters mid-pair
- Fixed skill argument names containing regex metacharacters breaking argument substitution
- Fixed ProgressBar rendering a full block for an almost-full fractional cell
- Fixed task polling and `fs.watch` being resurrected when the last subscriber leaves while a fetch is in flight
- Fixed plugin dependency resolution leaving a stale count when the manifest name differs from the source identifier
- Fixed Insights Time-of-Day chart skewing when a session has an unparseable timestamp
- Fixed keybindings using only the cmd/super/win modifier being flagged as unparseable
- Fixed `claude_code.active_time.total` OpenTelemetry metric not being emitted in `--print` mode
- Fixed `claude plugin update` not preserving cross-plugin symlinks inside a marketplace
- [VSCode] Press Cmd/Ctrl+Shift+T to reopen the most recently closed session tab, configurable via `claudeCode.enableReopenClosedSessionShortcut`

## 2.1.138

- Internal fixes

## 2.1.137

- [VSCode] Fixed extension failing to activate on Windows

## 2.1.136

- Added `CLAUDE_CODE_ENABLE_FEEDBACK_SURVEY_FOR_OTEL` to re-enable the session quality survey for enterprises capturing responses through OpenTelemetry
- Added `settings.autoMode.hard_deny` for auto mode classifier rules that block unconditionally regardless of user intent or allow exceptions
- Fixed MCP servers configured in `.mcp.json`, plugins, and claude.ai connectors silently disappearing after `/clear` in the VS Code extension, JetBrains plugin, and Agent SDK
- Fixed a rare login loop where a concurrent credential write could overwrite a freshly-rotated OAuth token and force re-login
- Fixed MCP OAuth refresh tokens being lost when multiple servers refresh concurrently — users with several remote MCP servers should no longer need daily re-authentication
- Fixed an API error (400) when extended thinking emitted a redacted thinking block after a tool call
- Fixed `--resume` / `--continue` not finding sessions when the project path contains underscores
- Fixed plan mode not blocking file writes when a matching `Edit(...)` allow rule exists
- WSL2: image paste from Windows clipboard now works via a PowerShell fallback when xclip/wl-paste cannot read image data
- Fixed plugin `Stop`/`UserPromptSubmit` hooks failing when cache cleanup deletes a version still in use by a running session
- Improved visual consistency across slash command dialogs: standardized footer hints, dialog spacing, and arrow-key styling, and the dialog frame now appears immediately during loading instead of popping in after
- Fixed colors appearing at wrong positions in bash command output and markdown code blocks
- Fixed ReasonML diffs rendering corrupted "undefined" text artifacts at word-diff boundaries
- Fixed worktree exit dialog warning about uncommitted files in the wrong directory after worktree removal
- Fixed `@` file picker not matching files created mid-session in small non-git directories
- Fixed `@`-mention file picker not finding files in directories with more than 100 entries
- Fixed failed tool calls not being click-to-expand in fullscreen mode when their output was truncated
- Fixed Backspace and Ctrl+Backspace getting swapped after using Ctrl+G to open an external editor on terminals with persistent extended-key modes
- Fixed `/usage` weekly reset showing time of day instead of the calendar date
- Fixed welcome banner ellipsis causing column overflow on CJK terminals
- Fixed `/insights` crash when session history contains tool calls with malformed input fields
- Fixed a renderer crash when a tool's collapsibility classification changes mid-session
- Fixed a `skills` entry in `plugin.json` hiding the plugin's default `skills/` directory, and listing a file path now shows an error instead of failing silently
- Fixed IDE shell-integration lock files not respecting `CLAUDE_CONFIG_DIR`
- Fixed trailing whitespace in copied terminal output during streaming
- Fixed plugin uninstall and enable/disable not matching slugs case-insensitively
- Fixed tool error truncation marker showing a negative count for surrogate-pair strings
- Fixed env vars from `CLAUDE_ENV_FILE` SessionStart hooks going stale after `/resume` or `/clear`
- Fixed `/branch` saving a multi-line session title when given a pasted multi-line name
- Fixed a stray leading space on the second line of wrapped text at the column boundary
- Fixed Esc not dismissing dialogs in `/install-github-app`, `/desktop`, `/resume`, and `/web-setup`
- Fixed `/doctor` MCP schema errors not naming the missing field or showing the source file path
- Fixed Bash permission prompts showing an internal parser diagnostic instead of a user-readable explanation
- Fixed plugin slash commands with spaces (e.g. `/myplugin review`) not resolving to their namespaced form
- Fixed `AskUserQuestion` discarding multi-select answers when supplied as an array
```

### Agent SDK TypeScript CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-typescript/main/CHANGELOG.md
- **Hash**: `(first time)` → `1b4cdfb61b110194`

```
# Changelog

## 0.2.139

- Updated to parity with Claude Code v2.1.139

## 0.2.138

- Updated to parity with Claude Code v2.1.138

## 0.2.137

- Updated to parity with Claude Code v2.1.137

## 0.2.136

- Added `resolveSettings()` (alpha) to inspect effective merged settings without spawning the Claude CLI; reads MDM (plist/HKLM/HKCU) for parity with CLI startup
- Deprecated `TodoWrite` tool — future versions will switch to Task tools (`TaskCreate`, `TaskGet`, `TaskUpdate`, `TaskList`)

## 0.2.135

- Updated to parity with Claude Code v2.1.135

## 0.2.134

- Updated to parity with Claude Code v2.1.134

## 0.2.133

- Deprecated the unstable V2 session API (`unstable_v2_createSession` / `unstable_v2_resumeSession` / `unstable_v2_prompt`) — use `query()` instead
- Deprecated passing `'Skill'` in `allowedTools` — use the `skills` option instead
- Updated to parity with Claude Code v2.1.133

## 0.2.132

- Documented `applyFlagSettings()` in the TypeScript Agent SDK reference and added support for `null` on top-level keys to clear flag-settings overrides
- Updated to parity with Claude Code v2.1.132

## 0.2.131

- Updated to parity with Claude Code v2.1.131

## 0.2.130

- Updated to parity with Claude Code v2.1.130

## 0.2.129

- Updated to parity with Claude Code v2.1.129

## 0.2.128

- Updated to parity with Claude Code v2.1.128

## 0.2.127

- Updated to parity with Claude Code v2.1.127

## 0.2.126

- Added `origin` to result messages (`SDKResultSuccess` / `SDKResultError`) — forwards the triggering message's `SDKMessageOrigin` so consumers can distinguish user-prompted results from `task-notification` followups

## 0.2.125

- Updated to parity with Claude Code v2.1.125

## 0.2.124

- Updated to parity with Claude Code v2.1.124

## 0.2.123

- Updated to parity with Claude Code v2.1.123

## 0.2.122

- Updated to parity with Claude Code v2.1.122

## 0.2.121

```

### Agent SDK Python CHANGELOG

- **URL**: https://raw.githubusercontent.com/anthropics/claude-agent-sdk-python/main/CHANGELOG.md
- **Hash**: `(first time)` → `62ea1d7dae4ed6e8`

```
# Changelog

## 0.1.81

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.139

## 0.1.80

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.138

## 0.1.79

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.137

## 0.1.78

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.136

## 0.1.77

### Bug Fixes

- **Actionable error messages after error results**: Replaced the generic `Command failed with exit code 1` exception raised after an error result with one carrying the result's actual error text (e.g. "Reached maximum number of turns"), matching the TypeScript SDK behavior (#918)

### Documentation

- Deprecated `"Skill"` in `allowed_tools` in favor of the `skills` option on `ClaudeAgentOptions`, which provides more granular control over available skills (#924)

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.133

## 0.1.76

### New Features

- **API error status on result messages**: Added `api_error_status: int | None` to `ResultMessage`, surfacing the HTTP status code (e.g. 429, 500, 529) from failing API calls. This provides a safe-to-log field for classifying API failures when `is_error=True` (#923)

### Bug Fixes

- **Permission suggestions deserialization**: Fixed `ToolPermissionContext.suggestions` containing raw dicts instead of `PermissionUpdate` instances. Added `PermissionUpdate.from_dict()` so suggestions from `can_use_tool` callbacks can be inspected and echoed back in `PermissionResultAllow(updated_permissions=...)` without `AttributeError` (#920)

### Internal/Other Changes

- Pinned third-party GitHub Actions to immutable commit SHAs (#919)
- Updated bundled Claude CLI to version 2.1.132

## 0.1.75

### Internal/Other Changes

- Updated bundled Claude CLI to version 2.1.131

## 0.1.74

### New Features

- **Hook event streaming**: Added `include_hook_events` option to `ClaudeAgentOptions`. When set, hook events (PreToolUse, PostToolUse, Stop, etc.) are emitted by the CLI and yielded from the message stream as `HookEventMessage`, matching the TypeScript SDK's `includeHookEvents` (#917)
- **Defer hook decision**: Added support for the `"defer"` hook decision in `PreToolUseHookSpecificOutput.permissionDecision` and new `DeferredToolUse` dataclass on `ResultMessage.deferred_tool_use`, bringing parity with the TypeScript SDK's deferred tool use round trip (#865)
- **Strict MCP config**: Added `strict_mcp_config` option to `ClaudeAgentOptions`. When `True`, the CLI only uses MCP servers passed via `mcp_servers`, ignoring project, user, and global MCP configurations for fully deterministic server sets (#915)
- **Permission context enrichment**: Added `decision_reason`, `blocked_path`, `title`, `display_name`, and `description` fields to `ToolPermissionContext`, enabling richer permission prompts in `can_use_tool` callbacks (#909)
- **`updatedToolOutput` for post-tool hooks**: Added `updatedToolOutput` to `PostToolUseHookSpecificOutput` for replacing any tool's output before it reaches the model, not just MCP tools (#911)
- **`xhigh` effort level**: Added `"xhigh"` to the `effort` Literal on `ClaudeAgentOptions` and `AgentDefinition`, an Opus 4.7-specific level that falls back to `high` on other models (#914)
- **Subprocess cleanup on parent exit**: Registered an atexit handler to terminate live CLI subprocesses when the parent process exits, preventing orphaned `claude` processes from leaking (#916)

### Bug Fixes

- **ResourceWarning on disconnect**: Fixed `ResourceWarning: Unclosed <MemoryObjectReceiveStream>` emitted on `ClaudeSDKClient` disconnect and `query()` cleanup by closing the receive stream at the consumer boundary (#908)
- **Session `created_at` timestamp**: Fixed `list_sessions()` returning `created_at=None` for sessions whose first JSONL record lacks a `timestamp` field by scanning the full head buffer instead of only the first line (#907)

### Documentation

```

---

**Next step**: run `/check-claude-updates` in Claude Code, OR spawn `.claude/agents/claude-updates-watcher.md` directly. The subagent maps the changes above to our architecture and writes a proposal MD in this directory.
