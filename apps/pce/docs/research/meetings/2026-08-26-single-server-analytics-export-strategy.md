# Single Server Analytics — UI Design and Export Strategy

**Date:** 2026-08-26
**Participants:** Aarti (Adi), Vishal, Romit
**Granola ID:** `9dcd7804`
**Context:** Review of single-survey (single course offering) analytics page design. Focus on action row, section distribution tile, faculty selection UX, export strategy, and qualitative feedback show/hide. Section distribution layout (accordion vs. waterfall/column) flagged for Friday review with David and Vishaka.

---

## Key directives

### 1. Remove "preview form" from action row

The action row on the single-survey analytics page must NOT include "preview form."

> "Preview form is not required"

**No code change yet.** Single-survey analytics page not yet in codebase. Apply when page is built. Added as T249.

### 2. Primary action = context-dependent

Primary action is determined by survey state:
- Results available → "View longitudinal insights" (primary)
- Needs publishing → "Publish to faculty" (primary)
- All other actions are secondary (three-dots dropdown or outline buttons)

> Implied by overall action hierarchy discussion

Added as T250.

### 3. Remove "All rated questions" subtext from response card

The response count card should not show "All rated questions" as a subtext.

> "228 ratings. All rated questions. I think this is not required"

Added as T251.

### 4. Section sort order = template order

Sections in the analytics view must appear in the same order as they were defined in the template — NOT sorted by gap or score.

> "Order of the section should be same as how they created in the template"

Added as T252.

### 5. Remove "Number of ratings" count from section distribution tile

The section distribution tile must not show a "Number of ratings" count label.

> "Number of ratings is not required"

Added as T253.

### 6. Remove "middle 50" / range display

"Middle 50" and range visualization must be removed. Median is sufficient.

> "Median, middle 50, I think both of these are same... We don't need it"

Added as T254.

### 7. Remove "response" subtext from distribution section

"Response" as a standalone subtext within the distribution section is not required.

> "Response also is not required"

Added as T255.

### 8. Section tile — four data points only

Each section distribution tile shows exactly four data points:
1. My average
2. Program average
3. Median
4. Rating distribution (bar/histogram)

Nothing else.

> "My average. Then my prob's average. Median and rating distribution. That's it."

Added as T256.

### 9. Faculty selection = single select only

Faculty selector on the analytics page is single-select. One faculty at a time.

> "One faculty at a time. Single select."

Added as T257.

### 10. Faculty display — chips when 2+, name when single

When 2 or more faculties are available for a course, display them as chips for quick switching. When only one faculty, show just the name inline.

> "Should we give faculty as a chip here, all faculty? Names? So that I can just quickly flip between"

**DESIGN-REVIEW:** Exact chip vs. inline name interaction needs visual spec before coding. Added as T258.

### 11. Course content section shown in faculty view

Faculty view should also show the "Course content" section, not just faculty performance.

> "Should we be showing course content here again? Yeah, we should."

Added as T259.

### 12. PDF export action on course analytics page

A PDF export action button should be present on the course analytics page. Exports the full feedback page as PDF.

> "There should be some action here to export. The course feedback page. And that should export the page as PDF"

**NEW FEATURE — NEEDS REVIEW.** Requires new export mechanism. Added as T260.

### 13. Qualitative feedback — hide/show toggle per response (deferred)

Individual qualitative responses should have a visibility toggle (visible to faculty vs. hidden). This redesign is deferred until Monal's work on qualitative feedback lands.

> Not yet specced — wait for Monal's parallel workstream

Added as T261 — DEFERRED.

---

## Section distribution design decision (flagged for review)

Two competing layouts were on the table at this meeting:
- Accordion layout (Romit's design)
- Waterfall / column view (Vishal's suggestion from a Kaplan reference)

Decision deferred to Friday session with David and Vishaka. See `2026-08-27-course-eval-sync-up.md` → T239.

---

## Killed / deferred items from this meeting

| Decision | Reason |
|---|---|
| "Preview form" action | Not required on analytics action row |
| "All rated questions" subtext | Not required |
| "Number of ratings" count on section tile | Not required |
| "Middle 50" / range display | Redundant with median; remove |
| "Response" subtext on distribution | Not required |
| Section sort by gap/score | Always use template order |
| Multi-select faculty | Single select only |
