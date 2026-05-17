# Meeting Transcript → PRD Diff Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Catch "Aarti said X in a meeting but the PRD still says Y" discrepancies automatically — the error class that caused the cohort filter incident (filter built, then removed after two verification cycles).

**Architecture:** A new weekly scheduled agent reads recent Granola meeting transcripts via the Granola MCP, extracts stakeholder directives (especially from Aarti/Adi and Vishaka), and cross-references them against the current PRD snapshots. When a transcript directive contradicts a PRD statement, it flags to `docs/watch/flags/<product>.md` as a `prd-flagged` entry of sub-type `transcript-conflict`. This agent runs after the Granola intake agent (Tuesday 9am EDT) so it works with an up-to-date decision cache.

**Tech Stack:** Claude Code scheduled routine, Granola MCP, existing `docs/watch/` data layer.

---

## File Map

| File | Action | Responsibility |
|---|---|---|
| `docs/watch/agent-prompts/transcript-prd-diff.md` | Create | Scheduled agent prompt |
| `docs/watch/flags/pce.md` | Runtime write | Agent appends conflicts found |
| `docs/watch/flags/exam-management.md` | Runtime write | Agent appends conflicts found |
| `docs/watch/updates-log.json` | Runtime write | Agent appends `prd-flagged` entries |

---

### Task 1: Create the transcript-prd-diff agent prompt

**Files:**
- Create: `docs/watch/agent-prompts/transcript-prd-diff.md`

- [ ] **Step 1: Write the agent prompt**

```markdown
# Transcript → PRD Diff — Weekly Agent Prompt

You are the transcript-PRD diff agent. Run every Tuesday at 9am (after Granola intake on Monday). Your job is to find discrepancies between what stakeholders said in recent meetings and what the PRDs currently say.

**Required connector:** Granola MCP (`mcp__claude_ai_Granola__*` tools)

**Critical rule:** Always use `mcp__claude_ai_Granola__get_meeting_transcript` for raw transcripts. Never use `query_granola_meetings` summaries as the source of truth — they compress and reframe what was actually said. Note: "Adi" in transcripts = Aarti Vaishnav.

## Step 1: Load the current decision cache

Read `docs/watch/stakeholder-decisions.json`. This is your baseline of confirmed decisions.

Read `docs/watch/snapshots/pce-prd-monil.txt` and `docs/watch/snapshots/exam-prd-nipun.txt` — these are the current PRD snapshots to compare against.

## Step 2: Fetch transcripts from the past 14 days

Use `mcp__claude_ai_Granola__list_meetings` to list meetings from the past 14 days.

Filter to meetings where the title or participants suggest product discussion:
- Title contains: PCE, Survey, Evaluation, Exam, Question Bank, Assessment, Roadmap, Product
- Participants include: Aarti, Adi, Vishaka, Monil, Nipun, David Stocker

For each matching meeting, call `mcp__claude_ai_Granola__get_meeting_transcript` to get the raw content.

## Step 3: Extract directives from each transcript

For each transcript, identify statements from Aarti/Adi or Vishaka that are:
1. **Scope constraints:** "We're NOT doing X", "That's out of scope", "Remove X"
2. **Design mandates:** "It should work like Y", "Use Z approach", "I want to see..."
3. **Priority changes:** "X is more important than Y", "Move X to Phase 2"
4. **Factual corrections:** "No, the data lives in LMS not in Prism", "The minimum is N not M"

For each directive found, record:
- Speaker name
- Product affected (PCE / exam-management / both)
- The exact statement (verbatim from transcript)
- Timestamp in transcript
- Meeting title and date

## Step 4: Cross-reference each directive against PRD snapshots

For each extracted directive, search the relevant PRD snapshot for contradicting or conflicting statements.

**A conflict exists when:**
- The transcript says "don't include X" but the PRD describes X as a feature
- The transcript gives a specific value (threshold, count, scope) that differs from the PRD
- The transcript says "use approach A" but the PRD describes approach B
- The transcript marks something out of scope that the PRD has in scope

**Not a conflict:**
- The transcript adds context not in the PRD (additive, not contradicting)
- The transcript discusses something the PRD doesn't mention yet (a gap, not a conflict)
- The transcript references something already in the decision cache as `"superseded"`

## Step 5: For each conflict found, write to the flags file

Append to `docs/watch/flags/{product}.md`:

```
## TRANSCRIPT-PRD CONFLICT — [date]
**Meeting:** [meeting title] — [meeting date]
**Speaker:** [Aarti/Vishaka/etc.]
**What they said:** "[exact quote from transcript]"
**What the PRD says:** "[relevant PRD section and text]"
**Conflict:** [one sentence describing the discrepancy]
**Suggested action:** Update PRD §[section] to match the directive, OR confirm with [speaker] that PRD is still current.
```

Also append to `docs/watch/updates-log.json`:
```json
{
  "id": "[date]-[product]-conflict-[seq]",
  "date": "[today]",
  "product": "[product]",
  "type": "prd-flagged",
  "title": "Transcript conflict: [short description]",
  "what": "[what the transcript said vs what the PRD says]",
  "why": "Directive from [speaker] in [meeting] contradicts PRD §[section]",
  "source": "[meeting title] transcript — [date]",
  "severity": "P1",
  "files": []
}
```

Mark severity P1 — a stakeholder directive that contradicts the PRD is the highest-priority design alignment issue.

## Step 6: Write summary

If conflicts were found, also update `docs/watch/digest-latest.md` by appending:
```
## Transcript-PRD Conflicts Found — [date]
[N] conflicts detected. Check docs/watch/flags/ for details.
```

## Step 7: Commit if anything changed

```bash
git add docs/watch/flags/ docs/watch/updates-log.json docs/watch/digest-latest.md
git commit -m "chore(transcript-diff): [date] — [N] conflicts found between transcripts and PRDs"
```

If no conflicts: log a clean run to `docs/watch/flags/system.md`:
```
## Transcript-PRD Diff Clean — [date]
No conflicts between transcripts and PRDs detected this week.
```
```

- [ ] **Step 2: Commit**

```bash
git -C /Users/romitsoley/Work add docs/watch/agent-prompts/transcript-prd-diff.md
git -C /Users/romitsoley/Work commit -m "feat(watch): add transcript-prd-diff agent prompt — catches Aarti directive vs PRD conflicts"
```

---

### Task 2: Schedule the transcript-prd-diff agent

- [ ] **Step 1: Create the scheduled routine** using `/schedule` or `RemoteTrigger`:

- **Name:** `transcript-prd-diff-weekly`
- **Schedule:** `0 13 * * 2` (Tuesday at 9am EDT = 13:00 UTC — runs day after Granola intake)
- **Prompt:** "Read `docs/watch/agent-prompts/transcript-prd-diff.md` in this repository and execute every step exactly as written."
- **MCP connector required:** Granola (`connector_uuid: a3bb8013-6b86-4dcc-b22a-d67d3a74b552`)

- [ ] **Step 2: Verify**

```
/schedule list
```

Confirm `transcript-prd-diff-weekly` appears with cron `0 13 * * 2` and Granola connector attached.

---

**Plan 3 complete.** Transcript-PRD conflicts are automatically detected weekly and surfaced as P1 flags in the watch system — with the exact quote from the transcript and the contradicting PRD text side by side.
