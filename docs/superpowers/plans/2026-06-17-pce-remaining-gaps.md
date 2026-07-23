# PCE Remaining Gaps — Jun 17 2026

Source: cross-transcript gap analysis (Monil Jun 16, Aarti Jun 10, Cadence May 28, May 19).

---

## ✅ Done this session

- Course multi-select → Push Survey (scoped activate wizard from Courses directory)
- Breadcrumb swap on activate wizard when entered via scoped flow
- Fixed all build errors (library stubs, `??` operator, `useSearchParams` null)

---

## Remaining build items (priority order)

### 1. Faculty profile with eval history
**Source:** Monil Jun 16 + Aarti Jun 10
**What:** Click a faculty row in the Faculty directory → open an in-product panel/page showing:
- Courses taught (per term)
- Evaluation result per course instance (response rate, status, release date)
**Currently:** Row click opens Prism in a new tab
**File to change:** `app/(app)/admin/faculty/page.tsx`
**Shape:** Sheet or route — Aarti said "via directory also", so a slide-over Sheet is likely right (keeps the list visible behind it)

---

### 2. Analytics within directory tabs
**Source:** Monil Jun 16 — "this same view she wants inside respective tabs also"
**What:** Embed the By Faculty / By Course analytics inline in the Faculty and Offerings directory pages respectively, not just a deep-link icon
**Currently:** There's a `fa-chart-mixed` icon per row that links to `/analytics?tab=...`. Aarti wants the chart view surfaced IN the directory page (e.g. a toggle or second tab "Analytics" at the top of the page)
**Files to change:**
- `app/(app)/admin/faculty/page.tsx` — add Analytics tab/toggle
- `app/(app)/admin/offerings/page.tsx` — add Analytics tab/toggle
**Shape:** Two-tab layout at page level: "Directory" | "Analytics" — Analytics tab renders the relevant section from `/analytics` inline

---

### 3. Project-level date editing for survey batches
**Source:** Cadence May 28 — "store the entire batch as a project; changing close date at parent level updates all"
**What:** When a term's evaluations are activated as a batch, allow editing open/close/release dates for ALL surveys in the batch at once from the Surveys list or Setup view
**Currently:** Each survey instance is standalone; no batch-level date editing exists
**Files to change:** TBD — likely a new sheet or inline edit on the Surveys list grouped by term
**Priority:** Lower than 1 and 2 for Thursday

---

### 4. Faculty benchmarking groups in Setup (lower priority — post-Thursday)
**Source:** Vishaka May 19
**What:** Configurable groupings for faculty comparison (department avg vs school avg) in the analytics view
**Currently:** Hardcoded in mock data on the analytics page
**File:** Likely a new section under `app/(app)/admin/setup/` page

---

## Not needed (already correct)
- Anonymous link in distribution → already removed ✅
- Report access in push wizard → already inert (empty `{}` in state only) ✅
- PDF upload in template creation → already top-level only ✅
- Moderation not in nav ✅
- Results release date required ✅
