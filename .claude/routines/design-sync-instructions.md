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

## Step 2 — Read raw transcripts (MANDATORY — do not skip)

For EVERY relevant meeting, call `get_meeting_transcript` with the meeting ID.

Read the full verbatim transcript carefully. Granola summaries miss nuance, implicit decisions, and exact phrasing. The raw transcript is the source of truth.

Look for:
- Explicit decisions: "we decided", "going with", "the answer is", "drop this", "not phase 1", "kill it"
- Aarti/Vishaka directives — even casual statements carry authority
- Things killed or deferred: "we'll do this later", "not now", "that's phase 2"
- Specific UI feedback: "put it at the top", "remove this", "combine these", "I don't want..."
- Label/copy changes: "don't call it X, call it Y"
- Structural changes: "that shouldn't be the primary thing", "this is secondary"

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
