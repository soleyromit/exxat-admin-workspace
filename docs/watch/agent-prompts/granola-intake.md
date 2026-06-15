# Granola Intake — Weekly Agent Prompt

You are the Granola intake agent. Run every Monday at 9am. Extract confirmed design decisions from recent meeting transcripts and update the stakeholder decision cache.

**Required connector:** Granola MCP (`mcp__claude_ai_Granola__*` tools)

## Step 1: Fetch recent meetings

Use `mcp__claude_ai_Granola__list_meetings` to get meetings from the past 7 days.

Filter to meetings relevant to Exxat products — look for meetings with titles or participants mentioning: PCE, Post Course Evaluation, Survey, Exam Management, Question Bank, Assessment, Aarti, Adi (= Aarti), Vishaka, Monil, Nipun.

## Step 2: Pull raw transcripts

For each relevant meeting, use `mcp__claude_ai_Granola__get_meeting_transcript` to get the raw transcript. Do NOT use `query_granola_meetings` summaries — always raw transcripts. Note: "Adi" in transcripts = Aarti Vaishnav.

## Step 3: Extract decisions from each transcript

For each transcript, look for:
1. **Direct directives from Aarti/Adi or Vishaka:** "I want...", "We should...", "Don't do X", "This should be Y"
2. **Confirmed scope decisions:** "Yes, let's scope it to...", "That's confirmed", "We agreed"
3. **Explicit rejections:** "No, we don't want...", "Remove that", "That's out of scope"

## Step 4: Cross-reference against existing decisions

Read `docs/watch/stakeholder-decisions.json`. For each transcript directive:

- If it confirms an existing decision: no action needed.
- If it's new: add a new DecisionEntry with `sourceType: "transcript"`, `source: "{Meeting title} transcript — {date}"`
- If it contradicts an existing decision: set old `status` to `"superseded"`, set `supersededBy` to new ID. Append to `docs/watch/flags/{product}.md`:
  ```
  ## DECISION CONFLICT — [date]
  **Old decision:** [text]
  **New directive from [speaker] in [meeting]:** [new text]
  **Action:** Review and confirm which applies.
  ```

## Step 5: Write updates and commit

- Write updated `docs/watch/stakeholder-decisions.json`
- Append `decision-extracted` entries to `docs/watch/updates-log.json`
- Commit:
  ```bash
  git add docs/watch/stakeholder-decisions.json docs/watch/updates-log.json docs/watch/flags/
  git commit -m "chore(decisions): weekly Granola intake — [N] new decisions, [N] conflicts flagged"
  ```

---

## Self-improvement loop

If any step fails or produces unexpected output:
1. Identify the exact failure (error message, wrong output, missing file)
2. Fix it inline to complete this run
3. Append to `## Known edge cases` below so it doesn't happen again

## Known edge cases
<!-- Agent appends failure fixes here -->

### Null transcript (2026-06-15)
Meeting "Meeting with Aarti on PCE, Exam Management" (Jun 13, id: ab7e2691-bfaa-4ace-ac8f-29fcb2a3daec) returned `"transcript": null`. This happens when Granola has note metadata but no recorded/processed transcript. Fix: skip silently, note in commit message as "1 meeting had no transcript."

### Transcript too large for inline return (2026-06-15)
Meeting "India discussion — Weekly Product Sync | New Initiatives (Prism)" (Jun 10, id: 4d1fa807-2bda-4a38-880e-15376e9810a7) was 159,934 chars — exceeded inline token limit. Granola tool saved it to a file path. Fix: use `python3 -c "content=open(path).read(); print(content[A:B])"` in 15,000-char chunks to read without stdout overflow.
