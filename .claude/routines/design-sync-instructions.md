# Design Sync — Daily Agent Instructions

**Owner:** Romit Soley (Product Designer II, Exxat)
**Triggered by:** `design-granola-daily-sync` scheduled routine (daily 9am ET)

---

## What you are doing

Pulling raw Granola meeting transcripts from the last 24 hours, analysing them carefully, and applying the design decisions they contain — to the documentation AND to the actual screen files across all 5 Exxat products.

---

## Products in scope

| Product | Admin path | Student path |
|---|---|---|
| exam-management | apps/exam-management/admin/ | apps/exam-management/student/ |
| pce | apps/pce/admin/ | apps/pce/student/ |
| patient-log | apps/patient-log/admin/ | apps/patient-log/student/ |
| skills-checklist | apps/skills-checklist/admin/ | apps/skills-checklist/student/ |
| learning-contracts | apps/learning-contracts/admin/ | apps/learning-contracts/student/ |

Each product may have design docs at `apps/<product>/docs/`.

---

## Step 1 — Find relevant meetings

Call `list_meetings` with `time_range: "this_week"`. Identify meetings from the last 24 hours.
Also call `query_granola_meetings` with: `"exam management PCE CFE design decisions Aarti Vishaka scope features"`.
Also try: `"patient log skills checklist learning contracts design decisions"`.

### Inclusion filter — process ONLY meetings that meet ALL of these:

| Signal | Examples |
|---|---|
| Work participants present | Aarti, Vishaka, Nipun, Himanshu, Vishal, Arun, any Exxat colleague |
| Product or design topic | exam management, PCE, CFE, patient log, skills checklist, learning contracts, question bank, assessment, competency, accommodations, UI, UX, screen, design, product, feature, scope, roadmap |
| Decision or directive language | "we decided", "going with", "drop this", "not phase 1", "kill it", "I want", "should be", "don't do", "remove", "add", "change" |

### Exclusion filter — SKIP any meeting that looks like:

- Personal / social (dinner, coffee, gym, travel, family, personal errands)
- Non-Exxat work (freelance projects, interviews, external client calls unrelated to Exxat)
- Internal admin only (HR, payroll, expense reports, IT support)
- Title contains: "1:1 personal", "doctor", "dentist", "lunch", "dinner", "birthday", "family", "flight", "hotel"
- No Exxat colleague appears as a participant

**When in doubt, skip it.** Only process meetings you are confident are Exxat product design sessions.

Relevant meetings are those that touch: product design, UX decisions, feature scope, screen feedback, stakeholder directives (Aarti, Vishaka, Nipun), assessment types, UI patterns.

---

## Step 2 — Read raw transcripts LINE BY LINE (MANDATORY — do not skip, do not skim)

For EVERY relevant meeting, call `get_meeting_transcript` with the meeting ID.

**Read the ENTIRE transcript word by word. Do not summarise while reading. Do not stop at the first decision. Every sentence is a potential directive.**

The raw transcript is the source of truth. Granola summaries, query results, and prior meeting notes are NOT substitutes — they miss nuance, implicit decisions, layout proportions, and role-specific rules.

### What to extract — go through this checklist for every transcript:

**Headline decisions** (most obvious — you will catch these)
- "we decided", "going with", "the answer is", "drop this", "not phase 1", "kill it"
- Label/vocabulary changes: "don't call it X, call it Y"

**Role-specific visibility** (easy to miss — check every screen mentioned)
- Does the directive apply to admin only? Faculty only? Both?
- "faculty shouldn't see", "only admin can", "as a faculty, I don't need to see"
- Nav items, buttons, and sections may need to be hidden per role

**Layout and proportion** (easy to miss — listen for numbers and spatial language)
- "three fourth of the screen", "put it on the right", "small card", "bigger card"
- "put it at the top", "move it below", "this is primary", "this is secondary"

**Scope of existing features** (easy to miss — directives that EXPAND what's already built)
- "not just flagged items — any question", "not just active courses — all courses"
- "one search across both", "the whole thing, not just part of it"
- Watch for: "any", "all", "not just", "everything" as scope expansion signals

**Missing data fields** (easy to miss — Aarti mentions data she expects to see)
- "I would also want to know...", "is that not a useful number?", "you should also show..."
- "the frequency AND the average", "the count AND the correctness"

**Corrections to existing designs** (easy to miss — feedback on Romit's screens)
- Romit demos something → Aarti says "that's not right", "that's wrong", "change this"
- These are direct screen corrections, not just abstract decisions

**Things explicitly killed** (must track — not just deferred)
- "I don't want that", "remove this", "that's not the primary thing"
- "Why do you care? It's not relevant to you" → that feature/nav item needs to be removed for that role

### Five mandatory reading passes — do ALL of them, in order:

**Pass 1 — Physical layout**
Anything describing how the UI looks or where an element sits:
- Proportions: "three fourth of the screen", "small card", "put it on the right"
- Position: "put it at the top", "not on the left menu", "move it below"
- Interactions: "on hover", "click somewhere to see it", "in a popup"

**Pass 2 — Scope changes**
Directives that expand or contract the scope of an existing feature:
- Expansions: "not just flagged items — any question", "not just active — all courses"
- Contractions: "faculty shouldn't see the global list", "admin only", "read-only for faculty"
- LMS gating: "if LMS is on, disable these controls"
- Audience: "course coordinator only", "this is not for the instructor"

**Pass 3 — Missing data fields**
Data Aarti expects to see that isn't in the current design. Listen for:
- "is that not a useful number?" → it should be shown
- "I would also want to know", "you should also show"
- "the count AND the average", "the frequency AND the correctness"
- "how many skipped, how many answered" → multiple fields per row expected

**Pass 4 — Killed / deferred**
Features, sections, or nav items that should be removed. These are said conversationally:
- "why do you care?" → that item should not exist for that person
- "that's phase 2", "not phase 1", "backlog"
- "kill it", "scrap it", "I don't want 18 variations of this"
- "remove this", "I don't want that there"

**Pass 5 — Cross-reference against existing code**
After extracting all directives, READ the actual screen file and verify each one:
- Does the feature Aarti killed still exist in the code?
- Does the role restriction actually gate the UI element?
- Does the data field actually render in the component?
- Is the layout proportion reflected in the grid/flex template?

This pass prevents the most common failure: documenting a directive without verifying the code reflects it.

### After all five passes:
1. List every directive found — even small ones
2. For each: which screen? Which role? What specifically changes in the code?
3. Only then move to Step 3

---

## Step 3 — Check what's already documented

For each product with new content:
- Read `apps/<product>/docs/*decisions-summary*.md` (the master decisions log)
- Read `apps/<product>/docs/workflows/_backlog.md`
- List `apps/<product>/docs/research/meetings/` directory

Do not duplicate decisions already captured. Only add what is genuinely new.

---

## Step 4 — Update design docs

For each new meeting with undocumented decisions:

**a) Create meeting notes file**
Path: `apps/<product>/docs/research/meetings/YYYY-MM-DD-<slug>.md`
Frontmatter:
```
---
type: meeting
date: YYYY-MM-DD
product: <product>
participants: [names from transcript]
source: granola
granola_id: <meeting-uuid>
---
```
Body: topics covered, decisions table (D1, D2... with product + ADR column), verbatim Aarti/Vishaka quotes (exact words), design tasks generated.

**b) Append to summary doc**
Add new subsections (§5.19, §5.20 etc.) to the relevant section. Use the existing style — see the file for formatting conventions.

**c) Update backlog**
Add new design tasks to `_backlog.md` using the existing table format. Priority: P0 (foundational/blocker), P1 (core feature), P2 (enhancement).

---

## Step 5 — Apply changes to screen files

For each decision extracted, find the affected screen file(s):

```bash
find apps/<product>/admin/app -name "*.tsx"
find apps/<product>/admin/components -name "*.tsx"
```

Read the full file before editing. Apply safe changes. Flag complex ones.

### APPLY directly (safe — unambiguous directives):

- **Label/copy changes** — e.g. "Live" → "Ongoing", drop "live" vocabulary
- **Remove killed features** — if Aarti explicitly said "not phase 1" or "kill this", remove the button/component. Read the exact quote to confirm.
- **Tab/section reorder** — per explicit directive
- **Remove chart+numbers redundancy** — if Aarti said "you need one or the other", pick the richer one and remove the other
- **Move a UI element** — e.g. "put flags at the top" → move the flagged comments section above the student board
- **Remove point-biserial scatter plots** — always, until further notice
- **Remove "Assign practice" / practice-related buttons** — not Phase 1
- **Status label corrections** — "Live now" → "Ongoing", etc.
- **Remove dead imports** — if you remove a component, remove its import

### FLAG but do not apply (add to backlog as DESIGN-REVIEW task):

- New page or major new component needed
- Changes requiring new mock data structures or TypeScript types
- Structural rearchitecture of a whole screen
- Anything Aarti qualified: "align with PMs first", "pending Vishaka", "we need to discuss"

### Edit rules:
- Read the full file first
- Surgical edits only — change what the decision requires, nothing else
- No comments explaining the change
- Preserve existing imports and types
- If unsure → add to backlog, don't apply

---

## Step 6 — New pages

If a decision implies a page that doesn't exist, check `apps/<product>/admin/app/(app)/`. If the route is missing, add a `NEW PAGE NEEDED` task to `_backlog.md`. Do NOT create the file — new pages need Romit's design direction.

---

## Step 7 — Output summary

Always end with:

```
## Daily Design Sync — <date>

### Meetings processed
- <title> (<granola_id>) — <product> — <N decisions from raw transcript>

### Docs updated
- <file> — <what changed>

### Screen files changed
- <file path> — <what changed> — drove by: "<verbatim quote from transcript>"

### Flagged for human review
- <decision> — <why not applied> — backlog task added

### New pages needed
- <description> — <product> — <priority>

### Nothing to do
(if no new meetings in last 24 hours)
```

---

## Key design rules (apply when editing screens)

- **Status labels:** never "Live" — always "Ongoing"
- **Assessment overview:** primary org = completion status (Ongoing / Scheduled / Not yet scheduled / Completed). Approval workflow is a secondary side widget only.
- **Live monitor:** student-centric (Not Started → In Progress → Submitted). No chart+numbers redundancy. Flags at top.
- **Per-question analysis:** no point-biserial scatter. 3-tier difficulty only (Easy/Medium/Hard). Green = correct answer, single accent for distractors.
- **Coverage stats:** frequency counts ("8 of 20") — never percentages
- **Practice questions:** not Phase 1 — remove any Assign Practice buttons
- **Approval:** secondary widget, never hard-blocks administer, never the primary org axis
- **No red** (`--destructive`, hue ~25) in score/rating/performance viz — use amber/orange for below-threshold
- **Admin DS:** import from `@exxat/ds/packages/ui/src`. Never raw `<button>` element.
- **Icons:** Font Awesome Pro only. `aria-hidden="true"` on all decorative icons.

---

## Absolute rules

- NEVER edit files in `exxat-ds/` or `studentUX/` — read-only submodules
- NEVER commit — only edit files
- Only touch files inside `apps/` directory
- If unsure whether a change is safe → add to backlog, do not apply
