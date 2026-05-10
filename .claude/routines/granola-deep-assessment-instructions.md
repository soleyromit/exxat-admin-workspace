# Granola Deep Assessment — Weekly Agent Instructions

**Owner:** Romit Soley (Product Designer II, Exxat)
**Triggered by:** `granola-deep-assessment` scheduled routine (weekly Monday 9am ET)
**Scope:** All 5 products — all Granola meetings from the past 7 days

---

## What you are doing

A thorough weekly audit of ALL Granola meetings from the past 7 days. You will:
1. Read every raw transcript in full
2. Run the mandatory 5-pass analysis protocol on each
3. Produce a structured assessment of every design change needed
4. Apply safe changes directly to screen files
5. Flag complex changes for Romit's review

This is NOT the daily sync (which is lightweight and reactive). This is a rigorous weekly audit that catches everything the daily sync might miss.

---

## Products in scope

| Product | Admin path | Student path |
|---|---|---|
| exam-management | apps/exam-management/admin/ | apps/exam-management/student/ |
| pce | apps/pce/admin/ | apps/pce/student/ |
| patient-log | apps/patient-log/admin/ | apps/patient-log/student/ |
| skills-checklist | apps/skills-checklist/admin/ | apps/skills-checklist/student/ |
| learning-contracts | apps/learning-contracts/admin/ | apps/learning-contracts/student/ |

---

## Step 1 — Collect all meetings from the past 7 days

Call `list_meetings` with `time_range: "last_week"`.
Also call `list_meetings` with `time_range: "this_week"`.
Deduplicate. Collect all meetings.

Apply the personal meeting filter:
- SKIP: personal/social (dinner, family, travel, doctor, fitness, non-Exxat)
- SKIP: no Exxat colleague in participants
- INCLUDE: any meeting with Aarti, Vishaka, Nipun, Himanshu, Vishal, Arun, or any Exxat colleague
- INCLUDE: any meeting title containing: exam, assessment, PCE, CFE, patient log, skills, learning contracts, question bank, design, product, feature, scope

---

## Step 2 — Read ALL transcripts in full (mandatory, no skipping)

For EVERY included meeting, call `get_meeting_transcript`. Read each transcript completely.

**CRITICAL: Do not skim. Do not stop after finding a few decisions. Read every sentence.**

---

## Step 3 — Five-pass analysis on EACH transcript

For each transcript, run all five passes. Log findings from every pass before moving on.

### Pass 1 — Physical layout
What is described about how the UI looks or where elements sit?
- Proportions: "three fourth", "small card", fractions, relative sizes
- Position: "at the top", "on the right", "not in the left menu"
- Interactions: "on hover", "click to see", "in a popup", "without expanding"
- Card sizing: ongoing vs completed card size differences

### Pass 2 — Scope changes
What changes the scope of an existing feature?
- Expansions: "not just X — any Y", "not just active — all", "the whole thing"
- Role gates: "faculty shouldn't see", "admin only", "read-only for faculty"
- LMS gating: "if LMS is on, disable these", "when integration is off, enable this"
- Audience restrictions: "course coordinator only", "not for instructor"
- Search scope: "search across both sections", "one filter spanning everything"

### Pass 3 — Missing data fields
What data does Aarti expect to see that isn't in the current design?
- "is that not a useful number?" → it should be visible
- "you should also show", "I would also want to know"
- "the count AND the average", "frequency AND correctness"
- "how many skipped, how many answered, how many got it right"
- Any metric mentioned as important that Romit hadn't designed yet

### Pass 4 — Killed / deferred
What must be removed or should not exist?
- "why do you care?" → that item is wrong for that role
- "that's phase 2", "not phase 1", "backlog it"
- "kill it", "scrap it", "I don't want 18 variations"
- "remove this", "that's not my primary concern"
- Features that were prototyped but explicitly rejected

### Pass 5 — Cross-reference against existing code
For each directive found:
- Find the affected screen file(s):
  ```
  find apps/<product>/admin/app -name "*.tsx"
  find apps/<product>/admin/components -name "*.tsx"
  ```
- Read the relevant file
- Check: is the directive already implemented?
- If yes: mark as done
- If no: record as a change needed with exact file path and what to change

---

## Step 4 — Structured assessment output

After all five passes on all transcripts, produce this structured document before making any changes:

```
## Weekly Design Assessment — <date range>

### Meetings analysed
- <title> | <date> | <granola_id> | <N directives found>

### Change inventory

#### WILL APPLY (safe, unambiguous)
| # | Directive | File | What changes | Source quote |
|---|---|---|---|---|
| 1 | ... | ... | ... | "exact words" |

#### NEEDS REVIEW (complex, needs Romit's judgment)
| # | Directive | Why flagged | Suggested approach |
|---|---|---|---|

#### ALREADY DONE (directive found, code already correct)
| # | Directive | File | Confirmed correct |
|---|---|---|---|

#### BLOCKED (needs PM/Vishaka alignment first)
| # | Directive | What's blocking |
|---|---|---|
```

---

## Step 5 — Apply safe changes

For every item in WILL APPLY:
- Read the full file
- Make the surgical change
- Do not refactor surrounding code
- Do not add explanatory comments
- Preserve existing imports and types

Safe changes include:
- Label/vocabulary changes ("Live" → "Ongoing")
- Removing killed features or nav items
- Reordering tabs or sections
- Moving UI elements (flags at top, not bottom)
- Role-gating nav items
- Adding missing data fields (frequency counts, avg correctness)
- Fixing scope (allow excluding ANY question, not just flagged)
- Layout proportion fixes (3/4 + 1/4 grid)
- Search spanning both sections

NOT safe (flag for review):
- New pages or major new components
- Changes requiring new TypeScript types or mock data
- Whole-screen restructuring
- Anything where Aarti said "align with PMs first"

---

## Step 6 — Update design docs

For each meeting with new undocumented decisions:
- Create meeting notes file at `apps/<product>/docs/research/meetings/YYYY-MM-DD-<slug>.md`
- Append new decisions to the summary doc
- Add new tasks to `_backlog.md` with priority P0/P1/P2

---

## Step 7 — Final output

```
## Weekly Assessment Complete — <date>

### Summary
- Meetings analysed: N
- Directives found: N
- Changes applied: N
- Flagged for review: N
- Already correct: N
- Blocked: N

### Changes applied
- <file> — <what changed> — drove by: "<quote>"

### Needs Romit's review
- <directive> — <file> — <suggested approach>

### Blocked (needs alignment)
- <directive> — <blocker>
```

---

## Absolute rules
- Never edit files in `exxat-ds/` or `studentUX/` (read-only submodules)
- Never commit — only edit files
- Only touch files inside `apps/` directory
- If a directive is ambiguous, flag it — don't guess
