# Course Eval Sync Up — Vishal

**Date:** 2026-08-25
**Participants:** Vishal (product), Romit (design)
**Granola ID:** `fb6bd7f5`
**Context:** Weekly course eval sync. Walked through dashboard card structure (2 vs. 3 cards), per-status survey actions, analytics scope, faculty role column, and which analytics features to remove before Cohere.

---

## Key directives

### 1. Dashboard: remove "Upcoming" card — show only Last + Current

Vishal clarified the dashboard should show only two term cards: Last term and Current term. The Upcoming/future card is not required.

> Vishal (verbatim): "Maybe we don't need three. Right. So we always have two cards. One last term and one current term. That's about it. Upcoming probably is not required."

**⚠️ ALIGNMENT NEEDED — conflicts T46 and T212.** T203 (Aarti Aug 17) ordered Current → Upcoming → Last with 3 cards. T212 specs the Upcoming/future card with its data model. Vishal now says drop Upcoming entirely. Do NOT change any dashboard code until Romit aligns this with Aarti. Added as T224.

### 2. Survey actions per status

Per-status action set in the survey list / detail:

- **Scheduled:** two direct actions visible — "Edit survey" + "Preview survey"
- **Live / Ongoing:** primary action = "Remind" (prominence); additional actions inside three-dot menu: "Edit survey", "Preview form", "View results"

> Vishal directed this during the survey distribution table walkthrough.

**No code change yet.** RowActions in `surveys/page.tsx` does not yet implement this per-status action differentiation. Added as T225.

### 3. Remove global course-offering status from detail page header

When the course offering detail page is built (multi-survey architecture), the global status chip in the header should be removed — multiple surveys under one offering means a single status is misleading.

> Vishal: "So then at the global level we can remove it because it's a it sounds that it's going to be confusing"

**No code change yet** — course offering detail page with multi-survey layout is not yet built. Added as T226 as a forward-looking constraint.

### 4. Faculty role column in survey / evaluation table

The survey distribution table does not currently show the faculty's role (e.g. primary instructor, guest lecturer, adjunct). Vishal flagged this as a missing data point.

> Vishal: "Where are we capturing the role faculty role of that person?"

**No code change yet.** The current `surveys/page.tsx` DataTable shows instructor name only (with a +N overflow tooltip). Role column to be added when table columns are revisited. Added as T227.

### 5. Raw responses → reports section only (not inline in analytics)

Raw response data (individual response records) should be downloadable from a Reports section, not displayed inline within the analytics views. This is scope-reducing — analytics surfaces aggregate data only.

**No code change.** Raw responses are not currently displayed anywhere in the analytics page. Added as T228 to prevent inline raw-response UX from being added.

### 6. Kill: weekly trend (response trend week-on-week)

Aarti confirmed she does not want a week-on-week response trend chart. This feature is explicitly removed from scope.

> Vishal relayed Aarti's position: "she was saying that they don't care"

**No code change needed.** Weekly trend chart does not exist in `analytics/page.tsx`. Added as T229 as a "do not build" guard.

### 7. Kill: responses by role section

A "responses by role" breakdown (e.g. how many course coordinators vs. faculty vs. students responded) is not needed and should not be built.

> Vishal: "responses by role course coordinator four not needed we will not have the spec down at all"

**No code change needed.** This section does not exist in current code. Added as T230 as a "do not build" guard.

---

## Not addressed / deferred

- Already-scheduled course filtering in push flow (T196): not discussed in this session — see T196 open backlog.
- T209 (column order conflict) / T216 (past-terms table vs. button): not resolved this session.
