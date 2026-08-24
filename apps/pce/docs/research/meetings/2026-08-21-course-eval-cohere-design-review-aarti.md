# Course Eval Design Review — Aarti (Cohere Prep)

**Date:** 2026-08-21 (approx — Granola ID `87f007fe`)
**Participants:** Aarti (stakeholder), Romit (design)
**Context:** Walkthrough of course evaluation admin screens in preparation for the Cohere conference booth. Covers template management, sidebar nav, and product vocabulary.

---

## Key directives

### 1. Vocabulary — "course survey" not bare "course evaluation"

Aarti flagged that using "course evaluation" alone creates confusion because it sounds like a learning activity (e.g. evaluating a course outcome). The product should use:
- **"course survey"** when referring to the post-course instrument or the object being managed
- **"post-course evaluation"** is acceptable in longer-form descriptive copy where context is clear
- Do not use just "evaluation" in UI labels for the PCE object

> Aarti (verbatim): "can they work with each other to modify that to surveys and post course evaluations... surveys and core seals, I think. But when we just say course of valid confusion then it's learning activity."

**Applied 2026-08-24:**
- `surveys/page.tsx` LocalBanner: "course evaluation" → "course survey" (routine `granola-deep-assessment`)
- `templates/page.tsx` EmptyState: "post course evaluations" → "course surveys"

### 2. Template creation — hide "New Template" button; redirect to support

Aarti wants to control template creation centrally, at least in the near term. Admin users should not be able to create templates from the UI. Instead, they should be directed to contact support with their evaluation form (paper or PDF), and Exxat will create the template for them.

> Aarti: "hide the Add Template section… replace with instruction box that says if you want please reach out to support@exa.com... hide that Ad template button for now... with the paper or pdf form of your evaluation form"

**Applied 2026-08-24:**
- `templates/page.tsx` header: "New Template" button removed
- `templates/page.tsx` EmptyState: "Create Template" button removed; replaced with instruction directing users to `support@exxat.com` (see flag below)

**⚠️ Flag — email address ambiguity:** Transcript captured "support@exa.com" which appears to be speech shortening of "support@exxat.com". Applied as `support@exxat.com` (company domain). Confirm with Aarti if a different address (e.g. a dedicated intake alias) should be used here.

### 3. Sidebar — "Ask Leo", "directory", "settings", "get help" placement

Aarti indicated the sidebar items listed above will be finalized by a separate template-level decision for Prism. She explicitly said to ignore them for now in the course eval prototype.

> Aarti: "ignore that Ask Leo, directory, settings, get help in left sidebar... they will finalize a template that works"

**No code change.** Current sidebar (`app-sidebar.tsx`) shows: Templates, Surveys, Analytics, Setup (admin) / My Surveys, Results (faculty). Settings and Get Help remain in the footer nav — consistent with this directive.

### 4. App switcher — no Adobe-style navigation

From a separate call (Arun, `460905f3`): Arun explicitly ruled out an Adobe-style product/app switcher in the nav. Current structure is appropriate.

**No code change needed.**

---

## Not addressed / deferred

- Already-scheduled course filtering in push flow: Aarti did not provide updated guidance. See T206 (Vishaka Aug 18) and open backlog item for already-pushed course exclusion logic in `surveys/push/page.tsx`.
