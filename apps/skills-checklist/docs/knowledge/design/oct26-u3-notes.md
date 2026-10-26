# Oct 26 updates, builder U3 (items 8 to 11)

Source: `granola-2026-10-26-updates.md` items 8 to 11 `[CALL 10-26]`; ledger D-X12 ("Required this term" is mandatory only). Existing screens and variants updated; no new screen or variant. Nothing here decides an `OD-*`.

| # | Screen and variant | What changed |
|---|---|---|
| 8 | Course mapping A (offering pane) | One line under the heading: "Skills for {cohort} already apply through {list}. Levels here are overrides." No list yet: "No list is assigned to {cohort} yet. Assign one". |
| 8 | Course mapping B (skill pane) | Same line, generic: "Skills assigned to a cohort in Lists already apply to its offerings. Levels here are overrides." |
| 8 | Lists and cohorts A/B | Stay the place where a list is assigned to cohorts and groups; custom groups now appear as rows. Flow order (Assign before Map) belongs to B4 (flows), not changed here. |
| 9 | Course mapping A/B level control | DS Select with four values: Mandatory, Recommended, Optional, Not mapped; glyph per level (filled, centre dot, dashed, dash), never colour alone. Offering pane shows mandatory, recommended and optional counts (they add to mapped). Bulk bar and Show filter have all levels. |
| 9 | Student screens (data) | "Likely here" and the placement-ending nudge read mandatory and recommended only; Optional stays submittable. Skill detail says "Recommended this term" (one-line edit in `components/lab/student/skill-detail.tsx`). |
| 10 | Scope bar (all pages that use it) | Group no longer needs a cohort; list = program groups of every cohort, tracks, custom groups (sample plus any made this session). With a cohort, they intersect. |
| 10 | Lists B | "Create a group" (outline Button) opens a dialog: name, Category, Enrolled in, Graduates in, live count with the cohorts it spans. The group joins the grid and the scope bar. Quiet "Open question" Badge with a Tip: how a cross-year group maps to offerings is still open (Vishakha, Oct 27). |
| 11 | Course mapping A/B, scope bar Course, dashboards | Clinical only by default: outline Badge "Clinical only" plus "9 of 22 offerings" and an "Include didactic" link on mapping; the scope bar Course select reads "Course Clinical only" with "Include didactic" as its last option (URL `incl=didactic`). Population defaults to clinical courses; figures identical (didactic courses carry no mandatory skill). |

Density: Course mapping A lost the N-13 "Show them" link to stay within 6 controls (the Coverage view sits beside it in the toolbar); B keeps it.

Open, not decided: clinical only versus didactic too (Arthi, Thursday); non-lockstep mapping of custom groups (Vishakha, Oct 27). Both are visible as defaults or seams, not decisions.

Shots: `lab-shots/u3-*.png` (1440, `term=Fall 2026`).
