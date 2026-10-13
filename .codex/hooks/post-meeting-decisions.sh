#!/bin/bash
# Triggered manually or by system cron after a Granola meeting.
# Opens Claude Code in the exam-management workspace and runs the decision-file update prompt.
#
# Setup: Add to crontab —
#   47 8 * * 1-5 /Users/romitsoley/Work/.claude/hooks/post-meeting-decisions.sh >> /tmp/decisions-cron.log 2>&1

PROMPT="Daily decision-file update for all products. Do the following:

1. Call list_meetings with time_range=custom, yesterday to today.
2. Classify each meeting: exam-management (exam/assessment/question bank/QB/ExamSoft), pce (PCE/course evaluation/survey), portal (portal/notification/LTI/Canvas).
3. For each relevant meeting: get_meeting_transcript (full UUID), read ALL content, create docs/decisions/<id>.md using _template.md. Required sections: User Flows, Design Decisions, Review Workflows, Scope Constraints, Data/Entity Rules, Open Questions, Implementation Gaps. Every bullet needs an exact source quote.
4. Update feature-registry.md for affected products.
5. Add full UUID to meeting list in product CLAUDE.md.
6. Report what was created/updated.

Protocol: /Users/romitsoley/Work/docs/decisions-protocol.md"

claude --print "$PROMPT" --cwd /Users/romitsoley/Work/apps/exam-management
