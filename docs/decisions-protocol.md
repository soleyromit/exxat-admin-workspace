# Decision Files Protocol — All Products

## Directory structure

Each product has its own decisions directory:

```
apps/exam-management/admin/docs/decisions/
apps/pce/admin/docs/decisions/
apps/portal/admin/docs/decisions/
```

Each directory contains:
- `_template.md` — extraction template
- `<meeting-id>.md` — one file per relevant meeting (full UUID)
- `feature-registry.md` — status table for every feature

## Product-to-keyword mapping (for meeting classification)

| Product | Keywords in meeting title |
|---|---|
| exam-management | exam, assessment, question bank, QB, live monitor, ExamSoft |
| pce | PCE, course evaluation, survey, template, moderation, CE, post-course |
| portal | portal, notification, compliance, LTI, Canvas, integration |

## What goes in a decision file

See `_template.md` in each product's decisions directory. Required sections:
- User Flows (with exact quotes)
- Design Decisions (with exact quotes + rationale)
- Review & Approval Workflows
- Scope Constraints (IN / DEFERRED / OUT with quotes)
- Data / Entity Rules
- Open Questions
- Implementation Gaps (❌ vs. current code)

## Rules

1. **Source quotes are mandatory.** No bullet without a quote.
2. **Implementation gaps must be checked against actual code**, not assumed. Open the file, grep for the feature.
3. **feature-registry.md is the daily status board.** ✅ = built, ⚠️ = partial, ❌ = missing, 🔜 = phase 2+.
4. **Never write an implementation plan** without reading all relevant decision files and the feature registry first.
5. **New meeting → new decision file within the same session.** Don't defer.

## Automation

A daily cron runs every morning at 8:47am to:
1. List meetings from the last 24 hours via `list_meetings`
2. Classify each meeting by product (keyword matching)
3. Pull raw transcript via `get_meeting_transcript` for each relevant meeting
4. Create `docs/decisions/<meeting-id>.md` using the template
5. Update `feature-registry.md` with any new or changed features
6. Report what was created/updated
