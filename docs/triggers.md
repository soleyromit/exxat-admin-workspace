# Triggers — Auto-firing skills, MCPs, and subagents

> Loaded at SessionStart. Re-evaluated on every UserPromptSubmit.
> DESIGN.md §5 references this file as canonical.
> Patterns are case-insensitive ECMAScript regex.

---

## 1. Pattern → Action map

### Design intent (highest priority)

| Match | Fires |
|---|---|
| `\b(design\|build\|create\|add)\s+(a\|an\|the)?\s*(new\s+)?(screen\|page\|view\|dashboard\|component\|feature\|flow)\b` | superpowers:brainstorming → mobbin search_screens → granola query (recent meetings) → frontend-design |
| `\b(redesign\|refactor\|rework\|polish\|improve\|tighten)\s+(this\|the\|that)\b` | frontend-design + superpowers:brainstorming |
| `\b(let'?s\s+(add\|build\|create\|design))\b` | superpowers:brainstorming |

### Design references

| Match | Fires |
|---|---|
| `figma\.com/(design\|board\|slides\|make)/` | claude_ai_Figma `get_design_context` (parse fileKey + nodeId) |
| `magicpatterns\.com/c/` | claude_ai_Magic_Patterns `read_artifact_files` |
| `notion\.so/` or `notion://` | claude_ai_Notion `read_resource` |
| `drive\.google\.com/` | claude_ai_Google_Drive `read_file_content` |

### Living context (intake)

| Match | Fires |
|---|---|
| `\b(meeting\|call\|spoke\|talked\|discussed)\s+(with\|to)\s+\w+\b` | granola `query_granola_meetings` (extract person + recent date range) |
| `\b(yesterday\|today\|this morning\|last week)('?s)?\s+(meeting\|call\|sync\|standup)\b` | granola `query_granola_meetings` |
| `\b(Aarti\|Nipun\|Himanshu)\s+(said\|wants\|decided\|asked)\b` | granola `query_granola_meetings` (filter by person) → intake |
| `\b(decided\|going with\|the answer is\|let'?s commit to\|final call)\b` | intake skill → ADR draft (`intake:adr-draft`) |
| `\b(we call (this\|it\|them)\|let'?s call (this\|it\|them)\|term for (this\|it\|them) is\|means)\b` | intake skill → glossary entry (`intake:glossary-add`) |
| Pasted text: 3+ lines matching `^\d{1,2}:\d{2}\s+\w+` AND prompt >10 lines total | intake skill — save raw → extract decisions/personas/glossary (`intake:transcript-paste`) |

### Library / framework references

| Match (when implementing, not just naming) | Fires |
|---|---|
| `\b(React\|Next\.?js\|Tailwind\|Recharts\|Radix\|shadcn\|TanStack\|Framer\|Zod\|Zustand\|Vercel AI SDK)\b` | context7 `resolve-library-id` → `query-docs` |

### Code-work patterns

| Match | Fires |
|---|---|
| Edit/Write to `apps/**/*.tsx` | PreToolUse: inject ds-check + react-best-practices reminders; block on rule violations (DS-001…010, A11Y-007, VIZ-001/003) |
| `\b(fix\|debug\|broken\|why is(n'?t)?\|not working\|throws?\|crashes?)\b` | superpowers:systematic-debugging |
| `\b(ship\|merge\|ready\|done\|complete\|PR\|pull request)\b` | superpowers:verification-before-completion → requesting-code-review |
| Request enumerates 3+ steps | superpowers:writing-plans → executing-plans |
| Request lists 2+ independent tasks | superpowers:dispatching-parallel-agents |

### DS profile switching

| Match | Fires |
|---|---|
| `\b(switch to\|moving to\|now (the )?)?student( app)?\b` | load `docs/foundations/ds-profiles/student.md` |
| `\b(switch to\|moving to\|now (the )?)?admin( app)?\b` | load `docs/foundations/ds-profiles/admin.md` |
| `\bstudentUX\b` or `@exxat/student` | load student profile |
| `\bExxat-DS\b` or `@exxat/ds` or `\btheme-(one\|prism)\b` | load admin profile |
| Working dir change to `apps/*/student/` | load student profile |
| Working dir change to `apps/*/admin/` | load admin profile |

### Variant generation (P4 — stochastic axis, wired 2026-05-08)

| Match | Fires |
|---|---|
| `\bdesign\s+\d+\s+(versions?\|variants?\|options\|alternatives)\b` | `/design-variants <N> <brief>` — `.claude/commands/design-variants.md` (spawn N parallel agents in worktrees per `docs/patterns/process/design-variants.md`) |
| `\b(show me \d+ (ways\|versions?\|variants?\|options)\|three options\|alternative approaches\|[2-5] (versions?\|variants?\|options))\b` | same — `/design-variants` |
| `/design-variants <N>` slash command | direct dispatch |

### Override / exception (P5 — wired 2026-05-08)

| Match | Fires |
|---|---|
| `\b(ignore (the\|this) rule\|make an exception\|override\s+(DS\|A11Y\|VIZ\|CONTENT\|INTAKE)-\d{3}\|don'?t apply\s+(DS\|A11Y\|VIZ\|CONTENT\|INTAKE)-\d{3}\|exception (here\|to))\b` | intake skill action `intake:override` — capture as override ADR (`docs/decisions/_override-template.md`) + pattern exception + ledger row in `docs/governance/exceptions.md` |
| `\b(DS\|A11Y\|VIZ\|CONTENT\|INTAKE)-\d{3}\b` | `rule:cite-and-surface` — read rule text from DESIGN.md §4; if user proposes override, route to `intake:override` |

---

## 2. Priority resolution

When multiple triggers match, fire in this order (high → low):

1. **DS profile switch** — changes context for everything downstream
2. **Living context (intake)** — capture before generating
3. **Design references** — load source material into context
4. **Design intent** — brainstorming, mobbin, frontend-design
5. **Library refs** — context7
6. **Code-work patterns** — verification, debugging, parallel
7. **Variant generation** — only after spec is loaded
8. **Override / exception** — last (modifies prior rules)

---

## 3. What does NOT auto-fire

Installed but not auto-triggered (use on demand):

- `vercel:*` (deploy, AI SDK, etc.) — current work is design prototypes, not deployment
- `next-forge` — workspace is custom Turborepo, not next-forge
- `Gmail` / `Google Calendar` / `Microsoft 365` — out of scope for design work
- `claude-api` skill — only when building Claude API features
- `claude-code-guide` subagent — only for Claude Code feature questions
- `claude-ai Granola` *write* operations — read-only by default

---

## 4. Update protocol

When a trigger over- or under-fires:
1. Update this file
2. Bump DESIGN.md §5 if structural
3. Add ADR in `docs/decisions/` if strategic

When a new MCP, skill, or subagent is added to the workspace:
1. Add to §1 if it should auto-fire
2. Add to §3 if it should not
3. Update DESIGN.md §5 summary

---

## 5. Hook implementation pointers

- **SessionStart hook** reads this file, builds an in-memory pattern → action map, emits a one-line summary as `<system-reminder>`.
- **UserPromptSubmit hook** runs the regex set against the prompt, prepends a `<system-reminder>` listing required actions for the turn.
- **PreToolUse hook** intercepts Edit/Write on `apps/**/*.tsx` and runs the DS conformance + a11y rule subset.

(Hook scripts live in `.claude/hooks/`. settings.json wiring follows in next P1 round, after exact hook syntax verification.)
