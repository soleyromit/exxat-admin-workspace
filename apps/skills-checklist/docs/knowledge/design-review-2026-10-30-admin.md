# Admin design review: Skills Checklist lab (2026-10-30)

Reviewer: skills-ux-critic, read-only. This report was saved by the coordinator.

- **Scope:** the recommended variant (A) of every admin screen, at 1440 x 900, first viewport.
- **Screenshots:** `design/review-shots/admin/`.
- **Verdict:** NEEDS-MORE.

## Top 10 issues

1. **Configure step 1 is 65% empty.** Four judging-type cards sit in the top ~200 px and the Preview column holds one sentence. This fails D-L5/D-X30 on the most-seen step.
2. **Dashboard ranked cards handle ties inconsistently.** "Skills holding students back" states ties in words. "Sections furthest behind" has three sections at 58, marks only IV Therapy and never states the tie.
3. **Attainment heat matrix uses brand-rose tints.** "Half or more" and "All achieved" are hard to tell apart, and there is no anchor for "where is this cohort worst".
4. **Status columns where every value is the same.** Drill ("Behind the term clock"), Categories and tags ("Active"), Settings ("Active").
5. **Filters work three different ways.** Dashboard and Reports use a popover in the header. The drill uses an inline chip. Course mapping uses five bare Selects.
6. **Dashboard "Awaiting approval 35" is captioned "41 evaluations".** The headline tile shows two numbers that disagree.
7. **Drill title "123 students in scope" comes from the figure "28 behind",** yet every row says "Behind". The list length must equal the figure it came from.
8. **Dashboard has no hierarchy step.** Group header and card title have the same weight. The KPI tiles are low contrast with unreadable sparklines, so nothing reads as primary.
9. **Rule-change impact leaves the lower 40% of the page empty,** and the before/after table floats mid-page.
10. **Skills library "How it's judged" is cut off** ("Approved or not appro…").

## Cross-screen patterns

- **P1: wizard and detail pages with empty viewports** (configure step 1, rule impact, assign). Fill the Preview column with real content on every step, and lay short forms out in a two-column band.
- **P2: inconsistent filter entry point.** Standardise on the DS Filters popover with a count and removable chips, in the toolbar of what it filters. Course mapping and the drill must use the same control.
- **P3: constant status columns.** Make status a filter or a group boundary, or drop it until a row differs.
- **P4: tie and highlight discipline.** Every ranked chart gets one highlight, and ties are stated in words.
- **P5: dashboard needs a two-tier type hierarchy.** Separate group header, card title and card subtitle clearly. Keep the serif H1.
- **P6: peer cards need one header anatomy.** Control in the header, or subtitle in the header, the same way on every peer card.
- **P7: Approvals count on the icon rail.** On Skills-panel pages the rail collapses to icons (D-X33, kept). Keep the Approvals count there as a badge or tooltip.

## Per screen

| Screen | Issues | What good looks like |
|---|---|---|
| Dashboard | No focal point (low-contrast KPIs, tiny sparklines); the 35 vs 41 collision; untied 58s; mismatched card headers | One hero figure the eye hits first, legible glyphs, ties stated, one highlight per chart |
| Dashboard drill | Title and figure length mismatch; constant status column; Search and Filters split across the row | Title names the figure ("28 students behind the term clock"); condition shown as a chip; columns that differentiate rows |
| Skills library | "How it's judged" cut off; sort control duplicates the grouping; bare evaluation counts compete with the skill name | No clipped attributes; every column varies; one primary action |
| Add a skill | Strong. Nit: no scrim behind the sheet | As is |
| Import | Three names for one screen (H1 "Bulk upload", crumb "Import and review", step "Import"); right third is empty | One title; a persistent "what you'll create" summary beside the list |
| Configure | **Blocker:** 65% empty step 1 | Form on the left and a live, populated preview on the right on every step |
| Rule impact | Dead lower 40%; table floats | Before/after table as the hero; rule sentences as a supporting column |
| Course mapping | "Required" pill and "Mandatory" select side by side with no label distinguishing them (D-X12); raw Select filter row | One Filters control; the two meanings of "required" separated |
| Groups of skills | "What this does" panel far from the checkboxes it explains; management mixed with assignment | Lists table to manage; when a list opens, its assignment checklist with the panel beside it |
| Assign | Opens with an extra "group or individual" decision (D-L6 says one job); empty bottom | One question: "Which students use this list?" |
| Categories and tags | Constant Active column; "Actions" header label | Status shown only when inactive |
| Settings | Constant Active column (empty lower half is acceptable) | As is, minus the column |
| Reports (attainment) | Rose heat scale; three control rows before the data; blank cell vs "0/1" undefined | One toolbar row; neutral or non-brand sequential tiers; worst area first; every cell state defined |
| Export | Strong. Nit: "As of" time (defensible) | As is |
| Approvals | Strong. Nits: clock glyph appears on some rows only; ragged action column | Ageing shown as a scale |
