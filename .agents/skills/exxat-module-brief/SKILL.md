---
name: exxat-module-brief
description: >-
  Produce a comprehensive pre-design research brief for a new product module —
  pulls raw Granola transcripts, extracts architectural principles, maps DS
  components, runs Mobbin on key flows, derives nav delta, and documents build
  blockers. Output gates all subsequent exxat-senior-ux and exxat-design-contract
  work. Load when starting ANY new feature area or module on any Exxat product.
user-invocable: true
---

# Exxat Module Brief — upstream research gate

This skill runs BEFORE `exxat-senior-ux` and BEFORE any wireframe, mockup, or JSX.
It produces one mandatory artifact: a `YYYY-MM-DD-<module>-brief.md` file that
every subsequent design and implementation turn references.

## When to load

| Condition | Load? |
|---|---|
| Starting design work on a new module or feature area | **YES — always** |
| "What does Aarti/Vishaka/Monil want for X?" | **YES** |
| Baroda / client visit prep for a module | **YES** |
| "What's missing vs what's built for X?" | **YES** |
| Beginning a gap analysis against PRD or transcript decisions | **YES** |
| Single surface tweak, bug fix, token change | No — use `exxat-design-contract` |
| Surface already has a confirmed brief | No — skip to `exxat-senior-ux` |

## Relationship to other skills

```
exxat-module-brief  (this skill)
    ↓  produces: YYYY-MM-DD-<module>-brief.md
exxat-senior-ux     (per-surface brief — references the module brief)
    ↓  produces: confirmed design brief
exxat-design-contract  (DS component + WCAG contract before JSX)
    ↓  produces: typed component table + interaction states
Implementation (Sonnet)
```

---

## Hard gate

Your first message after loading this skill = the completed brief written to disk.
No `Edit`, `Write`, or code tools fire until the brief file exists and the user
has confirmed it. End every intermediate turn with:
**"Brief written to `<path>` — review or confirm."**

---

## The 7-step process

Run steps 1–4 before writing a single line of the brief. Steps 5–7 run in parallel
once the IA is confirmed.

### Step 1 — Memory scan

Read `MEMORY.md` and load any project/feedback memories relevant to:
- This product (`pce`, `exam-management`, `portal`, etc.)
- This module or stakeholder
- Prior transcript decisions on this topic

State at the top of your response which memories you found and whether they're
still load-bearing. Don't re-pull Granola for decisions already captured in memory.

### Step 2 — Granola discovery + raw transcript pull

**Discovery (find the right meetings):**
```
mcp__claude_ai_Granola__query_granola_meetings
  query: "[module name] [product name] [stakeholder name if known]"
```

Then `mcp__claude_ai_Granola__list_meetings` with `time_range: "last_30_days"` to
confirm recency and find the exact meeting IDs.

**Raw pull (never summarize — always get the transcript):**
```
mcp__claude_ai_Granola__get_meeting_transcript
  meeting_id: "<uuid>"
```

Pull every meeting that touches this module. If more than 5 exist, prioritize:
1. Most recent (highest recency = highest authority)
2. Meetings explicitly about this module
3. Meetings where a PM or stakeholder is summarizing a prior discussion to the designer

Per memory rule: `query_granola_meetings` is discovery only. `get_meeting_transcript`
is the source of truth. Never quote from the query result.

### Step 3 — Decision extraction

From the raw transcripts, extract **load-bearing decisions** — decisions that, if
contradicted by code, would cause a failed demo or stakeholder rejection.

Organize by category:
- **Terminology** — exact labels, button text, status copy (non-negotiable)
- **Scope** — what is Phase 1 vs Phase 2 vs out of scope
- **Architecture** — data ownership, source-of-truth rules, integration boundaries
- **UX flow** — wizard steps, entry points, exit points, confirmation patterns
- **Data model** — which fields exist, which are missing, which are computed
- **Email / notification** — template count, anchor dates, cadence
- **Personas** — who has access, what they can see vs edit

Flag any **contradictions** between transcript decisions and the current codebase.
These are the highest-priority build items.

### Step 4 — Architectural synthesis

Don't just list the decisions — find the **connecting principles**. Ask:
*"What single organizing idea makes most of these decisions obvious?"*

For each module, write 3–5 principles of the form:

```
Principle N — [Name]
[One sentence: the rule and why it exists]
[Diagram or example showing how it governs multiple downstream decisions]
```

Example (PCE course evaluation):
> **Principle 1 — Term is the organizing axis**
> Everything anchors to the term end date — reminder schedule, activation wizard,
> analytics entry points, Save≠Send semantics. If a decision seems arbitrary,
> check whether it follows from this rule.

These principles become `## 0. Architectural Principles` at the top of the brief.
They are the most reusable part — any future designer can understand the module's
logic from these without reading all 9 transcripts.

### Step 5 — DS component map

For every **new** surface in the module, run:
```bash
node tools/ds/source.mjs <ComponentName...>
```

Build a table: Surface → DS Component → IMPORT/VENDOR/HAND-ROLL verdict → notes.

Key things to check every time:
- Is there a `Stepper` component? (as of v0.6.28: NO — wizard nav must be custom)
- Is `ChartContainer` available for viz? (YES — wraps Recharts)
- Does `KeyMetrics` support the variant you need? (flat / card / compact)
- Does `StatusBadge` fit, or should you use `Badge`? (`StatusBadge` = Beta/New/Alpha only)
- Is there an `Accordion` for collapsible role variants? (YES)
- Does `SelectionTileGrid` fit tile-picker interactions? (YES — interaction="radio")

Always verify against `@exxatdesignux/ui` exports list, not memory.

### Step 6 — Mobbin reference screens

Run **3 searches minimum** — one per major flow type in the module.
Search for **job types**, not domain names.

```
mcp__mobbin__search_screens
  platform: "web"
  query: "[job type] — e.g. 'multi-step setup wizard with pre-filled defaults'"
  limit: 6
```

For each search, pick the **1–2 best matches** and explain why they're relevant.
Always cite the `mobbin_url` so the user can open them.

Good query patterns:
- Wizard with defaults → "multi-step setup wizard pre-filled defaults editable"
- Person-centric analytics → "profile analytics with activity history drill down"
- Template builder → "content template builder sections reorder drag"
- Notification schedule → "notification schedule setup recurring reminders"
- Directory read-only → "read-only entity list with stats and deep link"
- Evaluation card → "survey results per-question bar charts breakdown"

### Step 7 — Nav delta + CommandPalette + OPEN questions

**Nav delta:** For every new route, specify:
- Which existing nav cluster it joins
- Whether it's a new top-level item, sub-item, or tab on an existing page
- Whether the Activation flow should collapse the left nav (full-page wizard pattern)

**CommandPalette:** List every new navigable surface that needs registering in
`components/command-palette.tsx` (or product equivalent). Format:

| Label | Route | Group |
|---|---|---|
| Email Templates | `/admin/email-templates` | Setup |

**OPEN questions:** List only decisions that **block implementation**. Format:

| # | Question | Blocks |
|---|---|---|
| OPEN-1 | [question] | [what it gates] |

Maximum 7 open questions. If you have more, you haven't pulled enough transcripts.

---

## Output format — the brief file

Save to: `apps/<product>/docs/research/meetings/YYYY-MM-DD-<module>-brief.md`

Minimum required sections (add more as needed):

```
# <Module> — Design Brief
Date: YYYY-MM-DD · Source: Granola transcript IDs · Participants
Status: Master reference for [next milestone]

## 0. Architectural Principles
[3–5 principles with diagrams — the connecting spine]

## 1. Information Architecture
[Zone map over existing nav — ASCII diagram]

## 2. Entity Data Map
[Table: entity / eval-context fields PCE shows / source of truth / editable? / relationships]

## 3–N. Per-zone specs
[Setup / Activation / Analytics / etc. — ASCII wireframes per surface]

## N+1. State Coverage Map
[Table: screen → states required (loading / empty / error / saving / saved / etc.)]

## N+2. Open Questions & Assumptions

## N+3. Built vs. Needs Change vs. Net-New
[Table per feature]

## N+4. DS Component Map        ← from Step 5
## N+5. Mobbin Reference Screens ← from Step 6
## N+6. Nav Delta + CommandPalette + Build Blockers ← from Step 7
```

---

## Memory write (after brief is confirmed)

After the user confirms the brief, write or update these memory files:

1. `project_<product>_<module>_granola_decisions.md` — load-bearing decisions
   (type: project, description: "Do not re-pull — decisions captured here")

2. `project_<product>_<module>_gap_analysis.md` — Built/Partial/Missing/Contradicts
   per pillar, priority build order, key findings

3. Update `MEMORY.md` index with both entries

---

## Anti-patterns (never do these)

- Writing wireframes before pulling the raw transcript (`query_granola_meetings`
  is discovery only — never quote from it)
- Skipping Step 4 (synthesis) — a list of decisions without connecting principles
  means every subsequent designer re-derives the architecture from scratch
- Running DS source.mjs only for components you're uncertain about — run it for
  every new surface; your memory of what exists is stale
- Citing Mobbin screens without the `mobbin_url` — the user needs to be able to
  open them
- Adding OPEN questions for things already answered in transcripts — pull more
  transcripts before declaring something open
- Saving the brief inside `docs/superpowers/specs/` — research briefs live in
  `docs/research/meetings/`; specs live in `docs/superpowers/specs/`
