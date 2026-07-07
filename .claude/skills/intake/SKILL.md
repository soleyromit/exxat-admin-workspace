---
name: intake
description: Use when the user references a meeting/person, makes a decision, pastes a transcript, or proposes new terminology — captures living context (transcripts → inbox/ + Meetings/, decisions → Decisions/) into the Obsidian vault at ~/Documents/research-repos with confirm-before-write. INTAKE-001..004 in DESIGN.md §4.
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
| `intake:transcript-paste` | Pasted block matching `^\d{1,2}:\d{2}\s+\w+` (Granola format) | Save raw to vault `inbox/`; write distilled note to vault `Meetings/`; extract decisions + persona refs + glossary candidates; confirm each before writing |
| `intake:glossary-add` | "we call this X", "X means Y" (heuristic) | Propose glossary entry; confirm before writing |
| `intake:override` | "ignore this rule", "make an exception", "override DS-001", "don't apply VIZ-004 here" | Capture as **override ADR** (sub-type) + append to relevant pattern's `## Exceptions` section + add row to `docs/governance/exceptions.md` ledger. Confirm each artifact. Sunset criterion mandatory. |

## Active product resolution

Resolve before writing anything:

```
cwd = /Users/romitsoley/Work/apps/<product>/...   → product = <product>
cwd = /Users/romitsoley/Work/...                  → ask user: which product?
```

The resolved product becomes the `product:` frontmatter value and the vault subfolder (`Decisions/<product>/`). If no product context, use `product: all` and route decisions to `Decisions/` root; for meetings pick the closest existing topic folder under `Meetings/` (or create `Meetings/<topic>/`).

## Artifact paths — write to the Obsidian vault

Canonical destination is the vault at `/Users/romitsoley/Documents/research-repos`, NOT the workspace `docs/`. Follow the vault pipeline (`inbox/` = raw capture; distilled wiki notes in topic folders) and the vault note schema.

| Artifact | Vault path | Stage / schema |
|---|---|---|
| Raw pasted transcript | `inbox/<YYYY-MM-DD>-<slug>.md` | Raw capture stage — unverified, minimal frontmatter, never cited as authority |
| Distilled meeting note | `Meetings/<product-or-topic>/<YYYY-MM-DD>-<slug>.md` | Full vault schema, `type: meeting` |
| Decision / ADR | `Decisions/<product>/<YYYY-MM-DD>-<slug>.md` | Full vault schema, `type: decision`, `status: accepted \| provisional` |
| Glossary / terminology | `docs/content.md` (Glossary section) in the **workspace** — the vault has no glossary home; keep it here until one exists | Workspace content doc (unchanged) |
| Persona | `docs/content.md` / `apps/<product>/docs/personas.md` (workspace — vault has no persona home) | Workspace (unchanged) |

Filenames are dated slugs: `<YYYY-MM-DD>-<slug>.md`. **No `NNN-slug` ADR numbering** — the vault uses the date + a `status:` field instead of a sequence number. `Decisions/` has per-product subfolders (`Decisions/pce/`, `Decisions/exam-management/`, …); `Meetings/` has topic subfolders (`Meetings/post-course-evaluation/`, `Meetings/exxat-aarti/`, …). Pick the matching existing subfolder, or create one.

> **Harvest vs. direct intake.** Ideally distilled wiki notes (`Decisions/`, `Meetings/`, `Research/`) arrive via `/harvest` from a shipped `projects/` file — that is the vault's load-bearing rule (wiki notes harvested, never written raw). But **direct intake to the vault is acceptable for meetings and decisions captured live** (a transcript pasted now, a decision made in the moment): raw transcript lands in `inbox/`, and the distilled meeting/decision note lands in its topic folder with the full schema.

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
   Raw → inbox/2026-05-08-aarti-pce-review.md
   Distilled → Meetings/pce/2026-05-08-aarti-pce-review.md
   ```
4. Ask: "Save transcript + create decision notes (Y/n) / pick a subset?"
5. On confirmation: write the raw transcript to `inbox/`, write the distilled meeting note (full vault schema) to `Meetings/<product-or-topic>/`, then loop through decision notes (one confirmation each), then glossary (batch confirmation).

### `intake:adr-draft`

1. Identify the decision: 1 sentence summary + the alternatives that were rejected.
2. Draft a decision note with the full vault schema (`type: decision`, `status: accepted | provisional`, plus `product · source · date · tags · title · summary · relevance · value · theme`).
3. Show preview to user.
4. Ask: "Write decision note `<YYYY-MM-DD>-<slug>`: <title>? (Y/n / edit)"
5. On confirmation: write to `Decisions/<product>/<YYYY-MM-DD>-<slug>.md` (no ADR number — dated slug + `status:`). Link related notes with `[[name]]`.

Keep it light: status (`accepted` | `provisional` | `superseded`), context (1-2 paragraphs), decision (1 paragraph), consequences (3-5 bullets). Don't write 1000 words.

### `intake:glossary-add`

1. Extract: term + 1-line definition.
2. Locate active product `content.md` (or workspace).
3. If file doesn't exist, create with the standard headers (see `apps/pce/docs/content.md` as template).
4. Show entry preview.
5. Ask: "Add to glossary? (Y/n)"
6. On confirmation: insert alphabetically under `## Glossary`.

### `intake:override` (P5 — Designer override loop)

When the user says "ignore this rule" / "make an exception" / "override DS-001" / "don't apply VIZ-004 here":

1. **Identify the rule.** Extract the rule ID from the prompt (DS-NNN / A11Y-NNN / VIZ-NNN / CONTENT-NNN / INTAKE-NNN). If no ID, ask which rule. If user is overriding a *pattern* (not a rule), capture the pattern path instead.

2. **Get the scope.** Where does the override apply? File path, surface, persona, time-bounded? Ask if not stated:
   - File / directory scope (`apps/exam-management/admin/components/foo.tsx`, or `apps/<product>/admin/**`)
   - Persona scope (admin only? all?)
   - Time bound (Phase 1 only? until DS X ships? permanent?)

3. **Get the sunset criterion.** When does this override end?
   - "Until <DS feature> ships"
   - "Phase 1 only, revisit at Phase 2"
   - "Permanent — propose amendment to DESIGN.md §4"
   - "Single-use — this PR only"

4. **Get the rationale.** Why is the rule wrong here? In one sentence. This is the durable artifact.

5. **Draft three artifacts:**
   a. **Override ADR** (workspace-level by default): `docs/decisions/<NNN>-override-<rule>-<slug>.md` using `docs/decisions/_override-template.md`. Per-product overrides go to `apps/<product>/docs/decisions/`.
   b. **Pattern exception** appended to the relevant pattern file's `## Exceptions` section (or rule's section in DESIGN.md §4 if no pattern file).
   c. **Ledger row** in `docs/governance/exceptions.md` (table format).

6. **Show preview.** All three artifacts.

7. **Ask:** "Write override ADR + pattern exception + ledger row? (Y/n / edit)".

8. On confirmation: write all three, surface paths, return.

**If "permanent — propose DESIGN.md amendment":**
- The override ADR notes proposed amendment text.
- Add a follow-up task to update DESIGN.md §4 (don't auto-amend the spec — that's a load-bearing change requiring user signoff).

**Override does NOT get applied retroactively** — it scopes from now forward. Existing violations become technical debt, separately tracked.

**Anti-patterns:**
- Granting an override without a sunset criterion → tracked-but-permanent → equals an unwritten DESIGN.md amendment
- Granting an override without a rationale → can't judge if it should be lifted later
- Granting an override that's actually a DESIGN.md gap → propose amendment instead

## Frontmatter standard

Distilled vault notes (`Meetings/`, `Decisions/`) use the **vault note schema** (see `/Users/romitsoley/Documents/research-repos/CLAUDE.md`):

```yaml
---
type: meeting | decision                       # research on research-intake
product: pce | exam-management | patient-log | portal | all
source: <granola:<id> | paste | Romit directive | conversation>
date: YYYY-MM-DD
tags: [ ... ]
title: "..."
summary: "..."
relevance: [ ... ]
value: high | medium | low
theme: <theme>
status: accepted | provisional | superseded    # decisions; meetings may omit
---
```

Raw `inbox/` captures are minimal by design — enough to identify them (`type`, `date`, `source`, `title`) and nothing more; they are unverified and never cited as authority.

Glossary/persona entries written to the **workspace** `docs/content.md` keep the workspace content-doc conventions (they are not vault notes).

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

## Telemetry — record the invocation

Per `docs/telemetry/README.md`, emit a `skill.invocation` event when this skill runs. Append at the end of skill execution:

```bash
python3 -c "import sys; sys.path.insert(0, '/Users/romitsoley/Work/.claude/hooks'); \
  from _telemetry import emit; emit('skill.invocation', skill='intake', \
  action='<adr-draft|transcript-paste|granola-query|glossary-add|override>', \
  outcome='<completed|skipped|cancelled>')"
```

Skip on user-cancelled writes (`outcome='skipped'` or `'cancelled'`). The analyzer surfaces skill fire rates in `python3 scripts/telemetry-report.py`.
