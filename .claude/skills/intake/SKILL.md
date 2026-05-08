---
name: intake
description: Use when the user references a meeting/person, makes a decision, pastes a transcript, or proposes new terminology — captures living context (transcripts, ADRs, glossary, personas) under apps/<product>/docs/ with confirm-before-write. INTAKE-001..004 in DESIGN.md §4.
---

# Intake — Living Context Capture

Routes signals from conversation into durable artifacts. Every write requires user confirmation.

## When this skill fires

The user-prompt-submit hook surfaces these action IDs from `docs/triggers.md`:

| Action ID | Trigger | This skill's response |
|---|---|---|
| `intake:granola-query` | "meeting with X", "yesterday's call" | Pull recent meetings via Granola MCP, list 3 candidates, ask user which (or none) |
| `intake:granola-query-by-person` | "Aarti said", "Nipun decided" | Pull meetings filtered by person + last 14 days; same confirm flow |
| `intake:adr-draft` | "decided", "going with", "the answer is" | Draft ADR; show preview; write only on confirmation |
| `intake:transcript-paste` | Pasted block matching `^\d{1,2}:\d{2}\s+\w+` (Granola format) | Save raw to research/meetings/; extract decisions + persona refs + glossary candidates; confirm each before writing |
| `intake:glossary-add` | "we call this X", "X means Y" (heuristic) | Propose glossary entry; confirm before writing |

## Active product resolution

Resolve before writing anything:

```
cwd = /Users/romitsoley/Work/apps/<product>/...   → product = <product>
cwd = /Users/romitsoley/Work/...                  → ask user: which product?
```

If no product context, save to workspace-level `docs/research/meetings/` (cross-product) and `docs/decisions/` (workspace ADR).

## Artifact paths

| Artifact | Per-product path | Workspace fallback |
|---|---|---|
| Meeting transcript | `apps/<product>/docs/research/meetings/<YYYY-MM-DD>-<slug>.md` | `docs/research/meetings/<YYYY-MM-DD>-<slug>.md` |
| ADR | `apps/<product>/docs/decisions/<NNN>-<slug>.md` | `docs/decisions/<NNN>-<slug>.md` |
| Glossary entry | `apps/<product>/docs/content.md` (Glossary section) | `docs/content.md` |
| Persona | `apps/<product>/docs/personas.md` | (no workspace personas) |

ADR numbering: scan target dir, take max + 1, three-digit zero-padded. First ADR is `000-record-architecture-decisions.md`.

## Per-action playbooks

### `intake:granola-query` and `intake:granola-query-by-person`

1. Extract person name(s) and date hints from the prompt.
2. Call `mcp__claude_ai_Granola__query_granola_meetings` with:
   - `query`: the topic the user just referenced
   - `participants`: extracted names (if any)
   - `days_back`: 14 default, 30 if they said "last month", 7 if "this week"
3. List up to 3 hits with title + date + 1-line summary.
4. Ask: "Pull transcript for [N]? (or 'skip')"
5. On confirmation: `mcp__claude_ai_Granola__get_meeting_transcript`, then go to **transcript-paste** flow below.

### `intake:transcript-paste`

Either user pasted a transcript directly, or step 5 above produced one.

1. Detect format: Granola if first non-empty line matches `^\d{1,2}:\d{2}\s+\w+`, else generic.
2. Extract:
   - **Title** — from first heading or filename hint
   - **Date** — from filename, frontmatter, or `today's date` from MEMORY.md
   - **Participants** — speaker labels at line start
   - **Decisions** — segments containing trigger phrases (`decided`, `going with`, `the answer is`, `let's commit to`, `final call`)
   - **Glossary candidates** — capitalized 2-3 word phrases used >2x; user-defined terms ("we call this X")
   - **Persona references** — role + behavior pairings ("the coordinator wants…", "PD's first task is…")
3. Show extraction summary as a table:
   ```
   Decisions found: 2
   Glossary candidates: 3 (Cohort drift, Min-N suppression, Grade lock window)
   Persona refs: 1 (PD)
   Will save to: apps/pce/docs/research/meetings/2026-05-08-aarti-pce-review.md
   ```
4. Ask: "Save transcript + create ADRs (Y/n) / pick a subset?"
5. On confirmation: write transcript file, then loop through ADRs (one confirmation each), then glossary (batch confirmation).

### `intake:adr-draft`

1. Identify the decision: 1 sentence summary + the alternatives that were rejected.
2. Draft using `docs/decisions/_template.md`.
3. Show preview to user.
4. Ask: "Write ADR-<NNN>: <title>? (Y/n / edit)"
5. On confirmation: write file. Append to `docs/decisions/README.md` index.

ADR is light: status (Proposed | Accepted | Superseded), context (1-2 paragraphs), decision (1 paragraph), consequences (3-5 bullets). Don't write 1000 words.

### `intake:glossary-add`

1. Extract: term + 1-line definition.
2. Locate active product `content.md` (or workspace).
3. If file doesn't exist, create with the standard headers (see `apps/pce/docs/content.md` as template).
4. Show entry preview.
5. Ask: "Add to glossary? (Y/n)"
6. On confirmation: insert alphabetically under `## Glossary`.

## Frontmatter standard

All intake-written docs use this frontmatter:

```yaml
---
type: meeting | decision | glossary-update | persona
date: YYYY-MM-DD
product: <product> | workspace
participants: [name, ...]   # meetings only
status: Proposed | Accepted | Superseded   # ADRs only
source: granola | paste | conversation
session: <claude-session-id>
---
```

## Confirm-before-write — non-negotiable

Never write without explicit user confirmation. The user types one of:
- `y` / `yes` / `ok` / `go` / `do it` → proceed
- `n` / `no` / `skip` / `cancel` → stop
- Anything else → treat as edit instructions, redraft, ask again

INTAKE-002 and INTAKE-003 in DESIGN.md require confirmation. Bypassing this is a rule violation.

## Skip the skill when

- The user is asking a question about an existing artifact (just read it)
- The "decision" is trivial ("decided to use a button" — not durable)
- The transcript fragment is <5 lines (not enough signal)
- The user explicitly says "don't save this" / "skip intake"

## Output to the conversation

After writing, surface:
- Path(s) created or updated
- ADR number assigned (if any)
- Glossary terms added (if any)

Then return control to the original task. Do not narrate the intake further.
