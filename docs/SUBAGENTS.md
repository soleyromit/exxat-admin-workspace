# Subagent Registry

> When to spawn a subagent vs do work inline. Subagents protect the main context window — but they cost a round-trip and lose conversation context. Pick deliberately.
>
> Loaded on demand by UserPromptSubmit hook when prompt suggests parallelizable or context-heavy work.

## The decision

**Default: do it inline.** Spawn a subagent only when one of these is true:

1. **Context budget concern** — the work would consume > ~5K tokens of unrelated tool output that would crowd out your task context. (Searching a large codebase, reading many similar files.)
2. **Parallelizable independence** — the work has 2+ independent legs that don't need each other's results. (Design variants, parallel research questions.)
3. **Specialized prompt template needed** — the work needs a multi-step methodology that's been codified into the agent type's prompt. (code-reviewer applies a checklist; Plan agent enforces architectural-decision discipline.)
4. **Risk isolation** — the work could leave the workspace in a bad state and you want a worktree. (Use `isolation: "worktree"`.)

If none of those apply, **inline is faster, cheaper, and lower-latency.**

## The registry

| Agent type | When to spawn | Example trigger | When NOT to spawn |
|---|---|---|---|
| **`Explore`** | Read-only search across a large codebase, especially when grep/find won't suffice or when 2+ different naming conventions need checking | "Where is permission logic implemented?" "Find all uses of `useTableState`" across many files | A single file path is known — use Read directly. A specific symbol — use grep via Bash. |
| **`general-purpose`** | Open-ended research that may span multiple read+web+file ops; multi-step task delegation when scope is unclear | "Audit this branch for ship-readiness" "Compare our DataTable to TanStack Table's API" | Question has a well-defined answer (use Explore). Action is straightforward (just do it). |
| **`Plan`** | Designing implementation strategy for a non-trivial change; want a step-by-step plan with architectural tradeoffs surfaced before execution | "How should I restructure the QB folder hierarchy?" "What's the right way to introduce per-product theme overrides?" | Already have a clear plan. Quick fix. |
| **`superpowers:code-reviewer`** | After completing a major feature step; want independent review against the original plan and coding standards | "I've finished the assessment-builder client refactor — review against my plan" "Review the compact-recovery hook against the spec" | Mid-implementation. Style nits. |
| **`claude-code-guide`** | Questions about Claude Code itself (hooks, slash commands, MCP, settings, IDE integrations), Claude Agent SDK, or Claude API | "Can hooks use environment variables?" "How do I write a SubagentStop hook?" | General coding questions. Specific to this workspace's hooks (we have those documented locally). |
| **`statusline-setup`** | One-shot configuration of Claude Code status line | (rare; user request only) | Anything else. |
| **`vercel:*`** | Vercel-specific work (deployment, AI architecture, performance) | "Help me set up Vercel preview deploys" | We're not yet deployed to Vercel. Skip until needed. |

## Parallelism — when to dispatch multiple in one message

Dispatch independent agents **in parallel** (multiple Agent calls in one message) when:

- Audits across products: "Audit each of the 5 products' storytelling files" → 5 parallel Explore agents
- Cross-corpus research: "What does Aarti, Vishaka, and the rr-insights all say about X?" → 3 parallel general-purpose agents (Granola + storytelling + research)
- Design variants: "Design 3 versions of the question navigator" → 3 parallel general-purpose agents in worktrees
- Comparison work: "Compare our DataTable to TanStack and AG-Grid" → 2 parallel Explore agents

**Don't parallelize** when an agent's output informs another's input — those must be sequential.

## Isolation modes

| Mode | When to use |
|---|---|
| (none) | Default. Agent operates on the current tree. |
| `isolation: "worktree"` | Stochastic variants where you want to keep all branches alive simultaneously. Or any work that could leave the tree in a confusing state. Auto-cleaned if no changes. |

## Prompt-writing for subagents

The agent **does not see this conversation**. Brief it like a smart colleague who just walked into the room.

DO:
- State what you're trying to accomplish AND why
- Include exact file paths, line numbers, what to change
- Provide context the agent needs to make judgment calls
- Cap response length when raw output would bloat context: "Report in under 200 words"

DON'T:
- Write "based on your findings, fix the bug" — pushes synthesis onto the agent
- Use shorthand from this conversation (the agent has no shared history)
- Send a multi-step prescription when the premise might be wrong — let the agent investigate

## Cost discipline

Subagents are not free. Each one consumes its own context window and tool budget. Track:

- **Telemetry event:** `subagent.spawn` (emitted in future P5 hook work)
- **Watch out for:** "let me spawn an agent for this" reflexively when inline work would suffice
- **Sign of overuse:** > 3 subagents in a single prompt for non-parallelizable work

## Subagent vs Skill

Both are reusable units, but they're different:

| | Subagent | Skill |
|---|---|---|
| Invocation | Agent tool call | Skill tool call (in-conversation) |
| Context | Fresh window, no conversation history | Same conversation, full history |
| Use for | Encapsulated work that doesn't need to remember prior steps | Codified workflows that operate on current context (intake, ds-component-check) |
| State | Returns one message back to parent | Continues in-line |

If you find yourself writing a long Skill with many "if user did X" branches, it might want to be a subagent. If you find yourself writing repetitive subagent prompts, the prompt template wants to be a Skill.

## Workspace-defined subagents

| Agent | Path | When to spawn | When NOT |
|---|---|---|---|
| `research-cross-corpus` | `.claude/agents/research-cross-corpus.md` | "What does the research / Aarti / Vishaka / rr-insights say about X" — synthesis across 2+ corpora (storytelling + ADRs + insights + competitor intel) | Single-corpus reads (just Read directly). Recommendation requests (this agent reports evidence, doesn't recommend). |

## Adding a new subagent type

If we add more (e.g., `design-variants`, `granola-summarizer`), they live in `.claude/agents/<name>.md` per Claude Code convention. Update this registry with:

- New row in the "Workspace-defined subagents" table above
- When-to-spawn / when-NOT examples
- Link to the agent's prompt template

## Maintenance

- When you find yourself wishing for a subagent that doesn't exist, propose adding it to `.claude/agents/`.
- When a `general-purpose` prompt is repeated 3+ times across sessions, that's a candidate to formalize as a custom agent type.
- When a subagent type is consistently misused (over- or under-spawned), update the "When NOT to spawn" column with the lesson.

## Why this registry exists

Subagents are powerful but easy to overuse. Without a registry, the choice between "inline vs subagent" gets re-derived every time, badly. With one, the heuristic is checked against documented criteria. Saves context, time, and money.

This is sibling to `docs/governance/context-architecture.md` (3-ring model): subagents are a Ring-3-ish mechanism — they protect the main context by encapsulating Ring 2 work into a reusable unit.
