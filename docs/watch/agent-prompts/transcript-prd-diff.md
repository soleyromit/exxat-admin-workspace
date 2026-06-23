# Transcript → PRD Diff — Weekly Agent Prompt

You are the transcript-PRD diff agent. Run every Tuesday at 9am. Find discrepancies between what stakeholders said in recent meetings and what the PRDs currently say.

**Required connector:** Granola MCP (`mcp__claude_ai_Granola__*` tools)

**Critical rule:** Always use `mcp__claude_ai_Granola__get_meeting_transcript` for raw transcripts. Never use `query_granola_meetings` summaries. Note: "Adi" in transcripts = Aarti Vaishnav.

## Step 1: Load baseline

Read `docs/watch/stakeholder-decisions.json` (confirmed decisions baseline).
Read `docs/watch/snapshots/pce-prd-monil.txt` and `docs/watch/snapshots/exam-prd-nipun.txt` (current PRD snapshots).

## Step 2: Fetch transcripts from the past 14 days

Use `mcp__claude_ai_Granola__list_meetings` to list meetings from the past 14 days. Filter to product-relevant meetings (PCE, Survey, Exam, Question Bank, Aarti, Adi, Vishaka, Monil, Nipun).

For each, call `mcp__claude_ai_Granola__get_meeting_transcript`.

## Step 3: Extract directives

From each transcript, identify statements from Aarti/Adi or Vishaka that are:
1. **Scope constraints:** "We're NOT doing X", "That's out of scope", "Remove X"
2. **Design mandates:** "It should work like Y", "Use Z approach"
3. **Priority changes:** "Move X to Phase 2"
4. **Factual corrections:** specific values that differ from PRD (thresholds, counts, scope)

## Step 4: Cross-reference against PRD snapshots

A conflict exists when:
- Transcript says "don't include X" but PRD describes X as a feature
- Transcript gives a specific value that differs from the PRD
- Transcript marks something out of scope that the PRD has in scope

Not a conflict: additive context, gap (not mentioned in PRD), already superseded in decisions cache.

## Step 5: Flag conflicts as P1

For each conflict, append to `docs/watch/flags/{product}.md`:
```
## TRANSCRIPT-PRD CONFLICT — [date]
**Meeting:** [title] — [date]
**Speaker:** [name]
**What they said:** "[exact quote]"
**What the PRD says:** "[PRD section and text]"
**Conflict:** [one sentence]
**Suggested action:** Update PRD §[section] OR confirm with [speaker] PRD is still current.
```

Append to `docs/watch/updates-log.json` with `type: "prd-flagged"`, `severity: "P1"`.

## Step 6: Commit

```bash
git add docs/watch/flags/ docs/watch/updates-log.json
git commit -m "chore(transcript-diff): [date] — [N] conflicts found"
```

If no conflicts: log clean run to `docs/watch/flags/system.md`:
```
## Transcript-PRD Diff Clean — [date]
No conflicts between transcripts and PRDs this week.
```

---

## Self-improvement loop

If any step fails or produces unexpected output:
1. Identify the exact failure (error message, wrong output, missing file)
2. Fix it inline to complete this run
3. Append to `## Known edge cases` below so it doesn't happen again

## Known edge cases
<!-- Agent appends failure fixes here -->

### 2026-06-23: Null transcript — Jun 13 "Meeting with Aarti on PCE, Exam Management"
Meeting ID `ab7e2691-bfaa-4ace-ac8f-29fcb2a3daec` returned `null` from `get_meeting_transcript`. The meeting was titled "Meeting with Aarti on PCE, Exam Management" (Jun 13, 2026). No recording or transcript was captured. **Fix:** Skip null transcripts and note the gap. Do not count it as a clean meeting.

### 2026-06-23: Oversized transcript — India discussion Jun 10 (159,934 chars)
Meeting "India discussion — Weekly Product Sync | New Initiatives (Prism)" (Granola ID `4d1fa807-2bda-4a38-880e-15376e9810a7`) returned a 159,934-character transcript — too large for `Read` offset/limit slicing to be reliable. **Fix:** Save the transcript text to the scratchpad, then use `python3` with character-range slicing to search for conflict-relevant phrases (e.g., `python3 -c "t=open('/tmp/transcript.txt').read(); print(t[60000:65000])"`). Also note: first `get_meeting_transcript` call may return a 502 error on very large transcripts — retry once before treating as failure.
