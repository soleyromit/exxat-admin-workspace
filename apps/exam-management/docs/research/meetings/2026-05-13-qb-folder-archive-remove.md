# Question Bank — Folder Structure, Archive, and Remove Actions
**Date:** May 13, 2026 · **Meeting ID:** 233ffd31 · **Participants:** Romit, Michelle/PM team

---

## Confirmed: Aggregation logic

- Clicking a course shell (e.g., Farm 101) = shows ALL questions from all nested subfolders (recursively)
- Clicking any subfolder = shows questions in that subfolder + all descendants
- This logic is already implemented and confirmed correct
- Future: if main page ever shows subfolder list, behavior can change to "only this folder's items"

## Confirmed: Cross-course navigation

- Questions tagged to multiple courses (Farm 101 + Bind 201): users with access to both can navigate between them
- Users WITHOUT course access: see the course name but clicking does nothing (no navigation into restricted areas)

## UX enhancements decided

- Pin functionality for shells/courses: ✅ already implemented
- Toast notifications for success/error states: ✅ already implemented (qb-sidebar.tsx showSidebarToast)
- Undo support via banner for destructive actions: ✅ already implemented (toast with undo action)

## Data model: Single master question entity

- "All Questions" = master repository, not physical folder copies
- Shells/subfolders act as references/tags to the single master question
- Edits to a linked question propagate to ALL linked locations (unless explicitly duplicated)
- Assessments store a SNAPSHOT of the question at creation time → later edits don't affect past assessments
- Remove/archive do NOT alter historical metrics or assessment data

## Question actions framework (design work needed)

### Archive (replaces permanent delete for saved questions)
- Once saved to system, permanent deletion is NOT allowed
- Archive = marks as not for future use; question gets "Archived" status badge
- Archived questions remain searchable in All Questions
- **DECISION PENDING:** Show archived at end of folder list vs. hide from folder view entirely

### Remove
- Unlinks question from the current folder only
- If linked elsewhere → remains visible in other locations
- If unlinked from all folders → exists in All Questions with no location
- **OPEN QUESTION:** Show "Untagged/No Location" list vs. require All Questions search?

### Copy/Link to folder
- Adds question to additional folders without removing from current
- Could be via "Copy to folder" action or inside Edit Question flow
- **TERMINOLOGY DECISION PENDING:** "Copy to folder" vs. "Duplicate" vs. "Use as template"

### Move to folder
- Remove from current + add to new (net effect: change location)

### Duplicate
- Creates a fully independent copy; edits do not affect original

## Permissions

- Remove = folder edit permission (not question-level permission)
- Anyone with add/remove rights on a folder can remove a question from it
- Question editing follows separate question-level permissions

## Analytics principles (team-aligned)

- Metrics aggregated at question level across all assessments
- Remove/archive actions do not alter historical metrics
- Data integrity maintained regardless of folder organization changes

## Open questions requiring design decision

1. Archived question display: end of folder list vs. completely hidden?
2. Untagged/no-location bucket: dedicated list vs. All Questions only?
3. Link-to-folder action placement: standalone action vs. inside Edit Question?
4. User education: terminology for Copy vs. Duplicate vs. Template
5. Assessment creator: de-prioritize archived questions in recommendations? (likely yes)

## Tasks created from this meeting
→ See T_ARCHIVE task in `_backlog.md`
