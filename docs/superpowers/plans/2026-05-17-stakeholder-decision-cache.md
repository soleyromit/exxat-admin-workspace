# Stakeholder Decision Cache Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Extract and persist confirmed design decisions from PRDs and Granola transcripts into `docs/watch/stakeholder-decisions.json` so I can answer "what did Aarti confirm about X?" without re-reading transcripts or PRDs every session.

**Architecture:** The PRD watcher agent gains a new step: after syncing a PRD, it extracts decision statements from "Key Decisions" sections and numbered decision lists, saving them to `stakeholder-decisions.json`. A companion Granola step extracts directives from recent meeting transcripts. Both write the same schema. The Doc Watcher UI `/updates` page already surfaces `decision-extracted` entries via the existing updates feed.

**Tech Stack:** Markdown/JSON (agent prompt modification), existing `docs/watch/` data layer.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `docs/watch/stakeholder-decisions.json` | Create | Persistent decision cache — agent writes, never hand-edited |
| `docs/watch/agent-prompts/prd-watcher.md` | Modify | Add Step 6: extract decisions after each PRD sync |
| `docs/watch/agent-prompts/granola-intake.md` | Create | New weekly agent: pull recent Granola transcripts, extract decisions |
| `tools/doc-watcher/lib/types.ts` | Modify | Add `DecisionEntry` and `DecisionCache` types |

---

### Task 1: Add DecisionEntry type to shared types

**Files:**
- Modify: `tools/doc-watcher/lib/types.ts`

- [ ] **Step 1: Read the current types file**

```bash
tail -20 /Users/romitsoley/Work/tools/doc-watcher/lib/types.ts
```

- [ ] **Step 2: Append the new types** at the end of `types.ts`:

```typescript
// Stakeholder decision cache types
export type DecisionStatus = 'confirmed' | 'superseded' | 'under-review'
export type DecisionSourceType = 'prd' | 'transcript' | 'meeting-notes'

export interface DecisionEntry {
  id: string              // "{product}-decision-{seq}" e.g. "pce-decision-001"
  product: string
  text: string            // The exact decision statement
  stakeholder: string     // Who confirmed it: "Aarti", "Vishaka", "Monil", etc.
  source: string          // Human-readable source: "PCE PRD §2 Key Product Decisions"
  sourceType: DecisionSourceType
  date: string            // ISO date when extracted / confirmed
  status: DecisionStatus
  supersededBy?: string   // ID of the decision that replaces this one
}

export interface DecisionCache {
  lastUpdated: string
  decisions: DecisionEntry[]
}
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/romitsoley/Work add tools/doc-watcher/lib/types.ts
git -C /Users/romitsoley/Work commit -m "feat(types): add DecisionEntry + DecisionCache types for stakeholder decision cache"
```

---

### Task 2: Create the initial stakeholder-decisions.json

**Files:**
- Create: `docs/watch/stakeholder-decisions.json`

Seed with decisions already confirmed from this session's PRD reading.

- [ ] **Step 1: Create the file** with decisions extracted from Monil's PCE PRD (already read):

```json
{
  "lastUpdated": "2026-05-17",
  "decisions": [
    {
      "id": "pce-decision-001",
      "product": "pce",
      "text": "Scope is at the program level; not at tenant-level.",
      "stakeholder": "Monil Pokar",
      "source": "PCE PRD §2 Key Product Decisions #1",
      "sourceType": "prd",
      "date": "2026-05-17",
      "status": "confirmed"
    },
    {
      "id": "pce-decision-002",
      "product": "pce",
      "text": "For Clinical Course, preceptor and site evaluations stay within learning activities — CE for clinical courses focuses only on course content/structure, the course coordinator (DCE), and Course Instructor.",
      "stakeholder": "Monil Pokar",
      "source": "PCE PRD §2 Key Product Decisions #3",
      "sourceType": "prd",
      "date": "2026-05-17",
      "status": "confirmed"
    },
    {
      "id": "pce-decision-003",
      "product": "pce",
      "text": "Survey responses are anonymous: no student identifier is attached to the submitted response.",
      "stakeholder": "Monil Pokar",
      "source": "PCE PRD §4.3 Step 3 — Response Collection",
      "sourceType": "prd",
      "date": "2026-05-17",
      "status": "confirmed"
    },
    {
      "id": "pce-decision-004",
      "product": "pce",
      "text": "Minimum response threshold is 5 — results for any course suppressed until minimum 5 responses received.",
      "stakeholder": "Monil Pokar",
      "source": "PCE PRD §9 Non-Functional Requirements",
      "sourceType": "prd",
      "date": "2026-05-17",
      "status": "confirmed"
    },
    {
      "id": "pce-decision-005",
      "product": "pce",
      "text": "1–5 Likert scale enforced as standard across all evaluations. Not a configurable option at faculty or program level.",
      "stakeholder": "Monil Pokar",
      "source": "PCE PRD §9 Non-Functional Requirements",
      "sourceType": "prd",
      "date": "2026-05-17",
      "status": "confirmed"
    },
    {
      "id": "pce-decision-006",
      "product": "pce",
      "text": "Evaluation data retained for minimum 7 years to support longitudinal accreditation evidence.",
      "stakeholder": "Monil Pokar",
      "source": "PCE PRD §9 Non-Functional Requirements",
      "sourceType": "prd",
      "date": "2026-05-17",
      "status": "confirmed"
    }
  ]
}
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/stakeholder-decisions.json
git -C /Users/romitsoley/Work commit -m "feat(decisions): seed stakeholder-decisions.json with PCE PRD confirmed decisions"
```

---

### Task 3: Extend PRD watcher to extract decisions

**Files:**
- Modify: `docs/watch/agent-prompts/prd-watcher.md`

- [ ] **Step 1: Read the current prd-watcher.md**

```bash
cat /Users/romitsoley/Work/docs/watch/agent-prompts/prd-watcher.md
```

- [ ] **Step 2: Append a new Step 6 to the agent prompt** (after the existing Step 5: Commit):

```markdown
## Step 6: Extract decisions from each synced PRD

For each PRD that was successfully synced (not just bootstrapped), read its content and extract decision statements:

**What counts as a decision:**
1. Any numbered item inside a section titled "Key Decisions", "Key Product Decisions", "Product Decisions", or "Scope Decisions"
2. Any statement starting with "We will", "We won't", "Scope is", "This will not"
3. Any sentence directly attributing a decision to a named stakeholder: "Aarti: ...", "Vishaka: ...", "[Name] confirmed:"

**For each extracted decision:**
1. Read `docs/watch/stakeholder-decisions.json`
2. Check if a decision with the same text (or very similar meaning) already exists
3. If it's genuinely new: append a new `DecisionEntry` with:
   - `id`: `{product}-decision-{next_seq}` (increment from highest existing seq)
   - `product`: the product this PRD belongs to
   - `text`: the exact decision statement (clean up formatting artifacts)
   - `stakeholder`: the PM/owner named in the PRD header (e.g., "Monil Pokar" for PCE PRD)
   - `source`: `"{PRD label} §{section}"`
   - `sourceType`: `"prd"`
   - `date`: today's date
   - `status`: `"confirmed"`
4. If an existing decision is contradicted by the new PRD content: set the old decision's `status` to `"superseded"` and set `supersededBy` to the new decision's ID
5. Append a `decision-extracted` entry to `docs/watch/updates-log.json` for each new or superseded decision

**Write updated `stakeholder-decisions.json`** after processing all PRDs.

Note: Do not extract items from sections marked "In Progress", "TBD", or "Open Questions" — those are not confirmed decisions.
```

- [ ] **Step 3: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/agent-prompts/prd-watcher.md
git -C /Users/romitsoley/Work commit -m "feat(prd-watcher): add Step 6 — extract confirmed decisions from synced PRDs"
```

---

### Task 4: Create Granola intake agent for transcript decisions

**Files:**
- Create: `docs/watch/agent-prompts/granola-intake.md`

- [ ] **Step 1: Write the agent prompt**

```markdown
# Granola Intake — Weekly Agent Prompt

You are the Granola intake agent. Run every Monday at 9am (after the compliance sweep). Extract confirmed design decisions from recent meeting transcripts and update the stakeholder decision cache.

**Required connector:** Granola MCP (`mcp__claude_ai_Granola__*` tools)

## Step 1: Fetch recent meetings

Use `mcp__claude_ai_Granola__list_meetings` to get meetings from the past 7 days.

Filter to meetings relevant to Exxat products — look for meetings with titles or participants mentioning:
- PCE, Post Course Evaluation, Survey
- Exam Management, Question Bank, Assessment
- Aarti, Adi (= Aarti), Vishaka, Monil, Nipun

## Step 2: Pull transcripts for relevant meetings

For each relevant meeting, use `mcp__claude_ai_Granola__get_meeting_transcript` to get the raw transcript. Do NOT use `query_granola_meetings` summaries — always raw transcripts.

Note: "Adi" in transcripts = Aarti Vaishnav. Both names are used interchangeably.

## Step 3: Extract decisions from each transcript

For each transcript, look for:
1. **Direct directives from Aarti/Adi or Vishaka:** Statements like "I want...", "We should...", "Let's make sure...", "Don't do X", "This should be Y"
2. **Confirmed scope decisions:** "Yes, let's scope it to...", "That's confirmed", "We agreed"
3. **Explicit rejections:** "No, we don't want...", "Remove that", "That's out of scope"

For each extracted directive:
- Note the speaker (Aarti/Vishaka/Monil/etc.)
- Note the product it applies to (PCE/exam-management)
- Note the timestamp in the transcript
- Extract the exact statement (clean of filler words)

## Step 4: Cross-reference against existing decisions

Read `docs/watch/stakeholder-decisions.json`. For each transcript directive:

**If it confirms an existing decision:** no action needed (it's already there).

**If it's new:** add a new `DecisionEntry`:
- `id`: `{product}-decision-{next_seq}`
- `text`: the cleaned directive
- `stakeholder`: the speaker's name
- `source`: `"{Meeting title} transcript — {date}"`
- `sourceType`: `"transcript"`
- `date`: meeting date
- `status`: `"confirmed"`

**If it contradicts an existing decision:** set existing `status` to `"superseded"`, set `supersededBy` to new decision ID. Append to `docs/watch/flags/{product}.md`:
```
## DECISION CONFLICT — [date]
**Old decision:** [text of old decision]
**New directive from [speaker] in [meeting]:** [new text]
**Action:** Review and confirm which applies.
```

## Step 5: Write updates

- Write updated `docs/watch/stakeholder-decisions.json`
- Append `decision-extracted` entries to `docs/watch/updates-log.json`
- Commit if anything changed:
  ```bash
  git add docs/watch/stakeholder-decisions.json docs/watch/updates-log.json docs/watch/flags/
  git commit -m "chore(decisions): weekly Granola intake — [N] new decisions, [N] conflicts flagged"
  ```
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/agent-prompts/granola-intake.md
git -C /Users/romitsoley/Work commit -m "feat(watch): add granola-intake agent prompt — weekly transcript decision extraction"
```

---

### Task 5: Schedule the Granola intake agent

- [ ] **Step 1: Create the scheduled routine** using `/schedule` or `RemoteTrigger`:

- **Name:** `granola-intake-weekly`
- **Schedule:** `0 13 * * 1` (Monday at 9am EDT = 13:00 UTC)
- **Prompt:** "Read `docs/watch/agent-prompts/granola-intake.md` in this repository and execute every step exactly as written."
- **MCP connector required:** Granola (`connector_uuid: a3bb8013-6b86-4dcc-b22a-d67d3a74b552`)

- [ ] **Step 2: Verify**

```
/schedule list
```

Confirm `granola-intake-weekly` appears with cron `0 13 * * 1` and Granola connector attached.

---

**Plan 2 complete.** Stakeholder decisions are extracted automatically from PRDs and Granola transcripts, stored in a queryable JSON, and surfaced via `__updates('decisions')` in DevTools and the Doc Watcher UI.
