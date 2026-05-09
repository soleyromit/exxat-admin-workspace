---
name: research-intake
description: Use when the user pastes a research insight, quote, theme cluster, or persona observation from rr-insights or any research source. Saves raw insight to apps/<product>/docs/research/insights/, extracts ADR-worthy decisions, persona updates, and glossary candidates with confirm-before-write. Sibling to the Granola intake skill — same Ring 3 distillation pattern (workspace context-architecture doc §3).
---

# Research Intake — rr-insights Distillation

Routes signals from research repositories (rr-insights, research interviews, customer survey output, ethnography notes) into durable workspace artifacts. Sibling to the Granola intake skill (`.claude/skills/intake/SKILL.md`) — same Ring 3 distillation pattern.

Every write requires user confirmation per INTAKE-002 / INTAKE-003.

---

## When this skill fires

The user-prompt-submit hook surfaces these action IDs:

| Action ID | Trigger | This skill's response |
|---|---|---|
| `intake:research-insight` | "from rr-insights", "insight:", "research finding", quote-with-attribution patterns like `[P5]`, `[Faculty 3]`, `"..." — Participant 7` | Save insight to research/insights/, extract decisions + persona refs + glossary candidates |
| `intake:research-theme` | "theme:", "students consistently say", "across N interviews", thematic cluster notation | Same as insight; tag as theme-level (cross-participant) |
| `intake:persona-quote` | "Aarti said", "Vishaka believes", quote attributed to a known stakeholder | Route to existing storytelling perspective files (see Granola intake) |

If the trigger is ambiguous, ask the user which type before extracting.

## Active product resolution

Same as Granola intake. Resolve from cwd:

```
cwd = /Users/romitsoley/Work/apps/<product>/...   → product = <product>
cwd = /Users/romitsoley/Work/...                  → ask user: which product?
```

If no product context, save to workspace-level `docs/research/insights/`.

## Artifact paths

| Artifact | Per-product path | Workspace fallback |
|---|---|---|
| Raw insight | `apps/<product>/docs/research/insights/<YYYY-MM-DD>-<slug>.md` | `docs/research/insights/<YYYY-MM-DD>-<slug>.md` |
| Theme | `apps/<product>/docs/research/insights/themes/<slug>.md` | (workspace level rare) |
| ADR (when an insight implies a decision) | `apps/<product>/docs/decisions/<NNN>-<slug>.md` | `docs/decisions/<NNN>-<slug>.md` |
| Glossary entry | `apps/<product>/docs/content.md` | `docs/content.md` |
| Persona update | `apps/<product>/docs/personas.md` or `docs/storytelling/<persona>.md` | (no workspace personas) |

## Per-action playbooks

### `intake:research-insight`

User has pasted a single insight. Format varies:
- Short claim + reasoning: "Faculty rarely review point-biserial because they don't trust the metric — 4 of 5 interviewees mentioned this"
- Quote with attribution: `"I never look at point-biserial. I just look at how many got it right." — Faculty 4, P3 study`
- Tagged research card: "Insight #42 / Theme: Item-quality friction / Source: 5 interviews / ..."

Steps:

1. **Identify the format.** Quote? Claim? Card? Note the source attribution if present.
2. **Extract structured fields:**
   - Title (1-line summary)
   - Source (study name, participant ID, date if known)
   - Strength (n=? interviews; or "single observation")
   - Themes referenced (if any)
   - Personas referenced (if any)
3. **Show extraction summary:**
   ```
   Insight: "Faculty don't trust point-biserial as a metric"
   Source: 4 of 5 interviews in P3 study
   Themes: Item-quality friction
   Personas: Course Coordinator (faculty)
   ADR candidate?: yes — implies design choice (don't surface r_pb without explainer)
   Glossary candidates: (none new)
   Will save to: apps/exam-management/docs/research/insights/2026-05-09-faculty-pb-distrust.md
   ```
4. **Ask:** "Save insight + draft ADR + update persona? (Y/n / pick subset)"
5. On confirm: write artifacts; surface paths.

### `intake:research-theme`

Theme = cross-participant observation, e.g., "Students consistently mention pacing in the second half of clinical pharmacology courses (8 of 12 interviews)."

Steps:

1. Detect theme markers ("consistently", "across N interviews", "majority of participants", thematic cluster names).
2. Extract: theme name, supporting quote count, sample quotes (1-3), implications.
3. Show preview.
4. Ask to save + extract action items (themes often imply design tasks).
5. On confirm: write to `themes/<slug>.md` AND optionally append a "Themes" section to relevant per-product DESIGN.md or storytelling file.

### `intake:persona-quote`

Already handled by the Granola intake's `granola-query-by-person` flow. If this fires alongside research-intake, route to that playbook. Don't duplicate.

## Frontmatter standard for insight files

```yaml
---
type: research-insight
date: YYYY-MM-DD
product: <product> | workspace
source: rr-insights | interview | ethnography | survey | customer-call
study: <study name or ID>
participants: [P3, P5, ...]   # IDs only — protect PII
strength: <"4 of 5" | "single" | "n=12">
themes: [theme1, theme2]
personas_referenced: [Course Coordinator, Faculty (Edit)]
status: New | Distilled | Superseded
session: <claude-session-id>
---
```

PII rule: participant IDs only. No names, no emails, no identifying details — even if the source has them. The workspace doesn't need them; recovering from a leak is impossible.

## Cross-skill handoff

| Insight content | Skill that handles |
|---|---|
| Decision implied | This skill drafts; hands the ADR step to Granola-intake's `adr-draft` playbook |
| New term | Granola-intake `glossary-add` playbook |
| Persona behavior | Append to `apps/<product>/docs/personas.md` or storytelling/<persona>-perspective.md |
| Pattern reference | If insight maps to a documented pattern, link the pattern path in the insight file |

Never reimplement playbooks the Granola intake already has. Call them.

## Confirm-before-write — non-negotiable

Same as Granola intake. User confirms each artifact write. Bypassing = INTAKE-002/003 violation.

## What to extract carefully (and what not to)

| Extract | Don't extract |
|---|---|
| Patterns / behaviors users described | Specific user identities (PII) |
| Pain points and their frequency | Direct quotes if they identify a person |
| Decisions implied by N+ interviews | One-off comments without supporting count |
| Terminology users introduced | Internal jargon Romit+team made up |
| Comparative observations (vs ExamSoft, vs current state) | Speculative claims ("they probably want…") |

When in doubt: save the raw, skip the extract, let user mark up later.

## Telemetry

Per `docs/telemetry/README.md`, emit a `skill.invocation` event:

```bash
python3 -c "import sys; sys.path.insert(0, '/Users/romitsoley/Work/.claude/hooks'); \
  from _telemetry import emit; emit('skill.invocation', skill='research-intake', \
  action='<insight|theme|persona-quote>', outcome='<completed|skipped|cancelled>')"
```

## Skip the skill when

- The user is referencing an existing insight already saved (just read the file)
- The "insight" is a one-off opinion without research backing
- The content is a Granola transcript (use the Granola intake skill instead)
- The user explicitly says "don't save" / "skip intake"

## Output to the conversation

After writing, surface:
- Path(s) created
- ADR number assigned (if any)
- Persona file updated (if any)
- Glossary terms added (if any)

Then return control. Don't narrate the intake further.

## Why this skill exists

Per `docs/governance/context-architecture.md` §6 Tier 1, the rr-insights intake skill is the highest-leverage gap-closer in the workspace's context architecture. It mirrors what the Granola intake already does for meetings — distilling Ring 2 (external corpus) into Ring 1 (workspace canonical artifacts) — but adapted for the research-repo shape.

Once exercised on real rr-insights paste, this skill validates whether the research-repo workflow integrates cleanly with the workspace's storytelling layer (L7) without needing a full rr-insights MCP. If usage shows the gap, an MCP becomes the next investment.
