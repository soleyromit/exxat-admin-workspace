# `.claude/` — Workspace Claude Code Layout

> Index of what lives where in this directory. Every file here participates in the Design Intelligence Harness (see `docs/governance/context-architecture.md` for the design rationale).

## Layout

```
.claude/
├── README.md              ← this file
├── settings.json          ← hook + matcher wiring
├── hooks/                 ← Python hooks fired by Claude Code events
│   ├── _registries.py     ← shared: tracks registry mtimes
│   ├── _telemetry.py      ← shared: emits JSONL events
│   ├── session-start.py   ← SessionStart (startup|resume|clear|compact)
│   ├── user-prompt-submit.py  ← UserPromptSubmit (regex triggers + freshness)
│   └── pre-tool-use.py    ← PreToolUse (DS conformance enforcement)
├── skills/                ← invocable capabilities (Skill tool)
│   ├── intake/SKILL.md            ← Granola transcript distillation
│   ├── research-intake/SKILL.md   ← rr-insights distillation
│   └── ds-component-check/SKILL.md ← verify component before use
├── agents/                ← workspace-defined subagent types
│   └── research-cross-corpus.md   ← multi-corpus synthesis
└── commands/              ← slash commands (.md = markdown prompt)
    ├── design-variants.md
    ├── ds-check.md
    └── intake.md
```

## What fires when

| Event | Matcher | Hook |
|---|---|---|
| Session opens | `startup` | `session-start.py` (lighter output) |
| Session resumes | `resume` | `session-start.py` |
| `/clear` | `clear` | `session-start.py` |
| Post `/compact` | `compact` | `session-start.py` (POST-COMPACT RECOVERY: registries + ADRs + digest) |
| User submits a prompt | (always) | `user-prompt-submit.py` (regex trigger map + registry-freshness) |
| Edit/Write tool call | `Edit\|Write\|MultiEdit` | `pre-tool-use.py` (DS-001..011 + A11Y enforcement) |

## Adding things

### New hook
1. Add `.claude/hooks/<name>.py` (or `_<helper>.py` for shared modules)
2. Wire in `.claude/settings.json` under the right event
3. Run `python3 scripts/architecture-audit.py` to verify

### New skill
1. Add `.claude/skills/<name>/SKILL.md` with frontmatter `name:` + `description:`
2. Reference any new triggers in `.claude/hooks/user-prompt-submit.py` + `docs/triggers.md`
3. Run `python3 scripts/architecture-audit.py` to verify frontmatter

### New custom agent
1. Add `.claude/agents/<name>.md` with frontmatter `name:` + `description:` + `tools:`
2. Add row to `docs/SUBAGENTS.md` under "Workspace-defined subagents"
3. Run `python3 scripts/architecture-audit.py` to verify frontmatter

### New slash command
1. Add `.claude/commands/<name>.md` (markdown body becomes the prompt)
2. The command auto-registers — invoke with `/<name>` in a session

## Validation

The 3 audits run **automatically on every `git commit`** via a pre-commit
hook. After a fresh clone, run once:

```bash
bash scripts/install-hooks.sh
```

This symlinks `.git/hooks/pre-commit` → `scripts/git-hooks/pre-commit`.
That hook:

1. `architecture-audit --strict` — BLOCKS the commit if hooks/skills/
   agents/registries/CLAUDE.md doc-map have wiring gaps
2. `backlink-audit --strict` — BLOCKS if ADRs/perspectives/patterns are
   missing citations
3. `staleness-check` — WARNS only (informational; not blocking)
4. `generate-digest` — refreshes `docs/digest/latest.md` and stages it
   into the commit you're making

Total runtime: ~3-5 seconds. Bypass with `git commit --no-verify` if
you genuinely need to (e.g., emergency fix; consider it a debt).

You can still run the audits manually any time:

```bash
python3 scripts/architecture-audit.py
python3 scripts/backlink-audit.py
python3 scripts/staleness-check.py
python3 scripts/generate-digest.py
```

## See also

- `CLAUDE.md` §10 — Workspace Doc Map
- `docs/governance/context-architecture.md` — 3-ring context model
- `docs/triggers.md` — UserPromptSubmit trigger registry
- `docs/SUBAGENTS.md` — when to spawn subagents
- `docs/digest/latest.md` — workspace state snapshot
