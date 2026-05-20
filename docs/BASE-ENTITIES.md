# BASE-ENTITIES.md — Cross-Product Entity Spec
# Source of truth for Student, Faculty, Course Offering, Term, Master Course
# Read this before building any entity list or detail page in any product.

---

## What are base entities?

Base entities are the foundational data objects that every Exxat product builds on. They are not product-specific — the same Student record, the same Faculty record, the same Course Offering exists across Exam Management, PCE, Patient Log, Skills Checklist, Learning Contracts. The difference between products is **which tabs and columns** are surfaced, not the underlying data model.

Aarti's principle (May 13 raw transcript):
> "The student entity remains the same. If you change here, it shows there. If you change there, it shows here. So the data is the same. But lab activity is not important in exam context. Compliance is not."

This means: **design the shell once, configure per product.**

---

## The five base entities (Phase 1)

| Entity | List page | Detail page | Notes |
|---|---|---|---|
| **Student** | Search + grid | Tabs (product-configured) | Same record across all products |
| **Faculty** | Search + grid | Tabs (product-configured) | Same record across all products |
| **Course Offering** | Grid (tabs: All/Completed/Ongoing/Upcoming) | Tabs (product-configured) | Term-specific instance of a Master Course |
| **Term** | Grid + drawer | No separate detail page | Fall/Spring/Summer, start/end dates |
| **Master Course** | Grid + drawer | No separate detail page | Course library; auto-generates QB shell in Exam Mgmt |

Course Registration is a relationship (Student ↔ Course Offering), not its own entity page.
Accommodations are a per-student attribute surfaced in the student detail page, not their own entity.

---

## Design pattern — every base entity follows this

### List page
```
[Search — single Google-style input, searches ALL attributes]
[Optional: Recently viewed / pinned items on right]
[Grid — minimal columns to uniquely identify the record]
[Filter chips — Status, Cohort, etc. — kept minimal]
[Bulk actions — Export, Bulk Email (where applicable)]
```

### Detail page
```
[Header strip — identity fields, status badge, key metadata]
[Tab bar — tabs are PRODUCT-CONFIGURED (see per-product table below)]
[Tab content — varies by tab]
[Action buttons top-right — product-specific CTAs]
[Fallback link — "View full profile in Prism →" (opens new tab) until full redesign ships]
```

**Tab configurability rule:** The tab shell is identical. Products include or exclude tabs via config, never by rebuilding the shell.

---

## DS Table usage contract (read before building any entity table)

Source: `exxat-ds/packages/ui/src/components/ui/table.tsx`

**`Table` already wraps internally in `<div class="relative w-full overflow-x-auto">`.**
Never add an extra `<div className="overflow-x-auto">` around `<Table>` — this creates a double scroll container.

Correct pattern for a bordered entity table:
```tsx
<div className="rounded-xl border border-border bg-card overflow-hidden">
  <Table>
    <TableHeader>
      {/* Header row — suppress DS hover by overriding to same bg */}
      <TableRow className="bg-muted/30 hover:bg-muted/30">
        <TableHead>Column</TableHead>  {/* scope="col" is already the DS default */}
      </TableRow>
    </TableHeader>
    <TableBody>
      <TableRow>  {/* DS provides hover:bg-interactive-hover-subtle + transition-colors */}
        <TableCell>data</TableCell>
      </TableRow>
    </TableBody>
  </Table>
</div>
```

**`TableRow` baked-in classes:** `border-b transition-colors hover:bg-interactive-hover-subtle data-[state=selected]:bg-interactive-hover`
- Do NOT add `transition-colors` in className — it is already present
- Do NOT add `hover:bg-muted/40` or similar — it creates a specificity conflict. Accept the DS hover token or suppress with `hover:bg-transparent` for non-interactive rows
- Do NOT use `role="link"` on a `<TableRow>` — it replaces the native `row` role. For keyboard-navigable rows: `tabIndex={0}` + `onKeyDown` for Enter/Space + `aria-label`. Role stays as implicit `row`.

**`TableHead`:** Already defaults `scope="col"`. Do not pass it explicitly.

**`TableCell`:** Already has `p-2 align-middle whitespace-nowrap`. Override padding with className as needed.

**Student list — NO filter controls** (Aarti May 13): "I don't want filters and grid and everything. Needs to be a single line like Google search." Only a search `<InputGroup>` is allowed. No `<Select>` dropdowns for status/cohort. Cohort is searchable via the text input.

---

## Student entity

### Universal fields (always present regardless of product)

**List columns (always):**
- Student name (linked to detail)
- Main email
- Cohort
- Status badge (Active / Inactive)

**List columns (product-adds, see table below):**
- # Courses registered in
- Adviser
- Cumulative GPA
- Annotation tags from Prism

**Detail header (always):**
- Full name, Student ID
- Cohort + Program
- Academic standing badge (Good Standing / Needs Attention / At Risk)
- Adviser name

### Tab variations by product

| Tab | Exam Management | PCE | Patient Log | Skills Checklist |
|---|---|---|---|---|
| Overview (standing, annotations, active interventions, docs) | ✓ PRIMARY | ✓ | ✓ | ✓ |
| Courses (registered courses + completion status) | ✓ | ✓ | — | — |
| Assessments (exam scores, competency strengths/weaknesses) | ✓ PRIMARY | — | — | — |
| Placements | — | ✓ | ✓ | — |
| Patient Log | — | — | ✓ PRIMARY | — |
| Skills / Competencies | — | ✓ | ✓ | ✓ PRIMARY |
| Accommodations | ✓ (admin view) | — | — | — |
| Documents | ✓ | ✓ | ✓ | ✓ |
| Full Prism profile link | ✓ fallback | ✓ fallback | ✓ fallback | ✓ fallback |

### What NOT to show in Exam Management (Aarti + Vishaka, May 13/14 raw transcripts)
- Overall GPA / full course grade history → stays in LMS
- Lab activity, timesheets, patient logs → PCE/Patient Log only
- Full compliance history → Prism only
- Full communication history → Prism only
- Preceptor-facing detailed bio → Prism only
- Faculty-to-student advising associations → not needed in exam management

### Accommodations (Exam Management — Vishaka, May 14)
Surfaced on the student detail page for admin/coordinator. Per course:
- Which students have accommodations
- What accommodations (Phase 1: extra time, higher font size only)
- Third accommodation (separate room) cannot be managed in-product

---

## Faculty entity

### Universal fields

**List columns (always):**
- Name (linked to detail)
- Email
- Status
- Administrative Position
- Faculty Rank

**List columns (product-adds):**
- Faculty/Staff type
- Courses assigned (count)
- Last Updated

**Detail header (always):**
- Full name, Faculty ID
- Administrative Position + Faculty Rank
- Status

### Tab variations by product

| Tab | Exam Management | PCE | Course Evaluation |
|---|---|---|---|
| Profile (basic info, contact, CV) | ✓ | ✓ | ✓ |
| Teaching (courses assigned) | ✓ | ✓ | ✓ |
| Assessments (assessments created/managed) | ✓ PRIMARY | — | — |
| Evaluations (ratings, trends across courses) | — | — | ✓ PRIMARY |
| Scholarship | — | ✓ | — |
| Service | — | ✓ | — |
| Students (associated students) | — | ✓ | — |
| Placements | — | ✓ | — |

---

## Course Offering entity

### Universal fields

**List columns (always):**
- Course number + name (linked to detail)
- Academic Year
- Term
- Cohort
- Start / End Date
- Registered Students (count)

**List columns (product-adds):**
- Professional Year
- Faculty/Staff assigned
- Status badge (Ongoing / Completed / Upcoming)

**Detail header (always):**
- Course number + name
- Academic Year | Professional Year | Term | Cohort | Registered students count

### Tab variations by product

| Tab | Exam Management | PCE | Course Evaluation |
|---|---|---|---|
| Assessments | ✓ PRIMARY (landing tab) | — | — |
| Course Details (credits, hours, nature, type) | ✓ secondary | ✓ | ✓ |
| Students (registered students) | ✓ | ✓ | ✓ |
| Faculty | ✓ | ✓ | ✓ |
| Measures / Objectives | ✓ (mapping) | ✓ | — |
| Evaluations | — | — | ✓ PRIMARY |
| Resources | ✓ | ✓ | — |
| Placements | — | ✓ | — |
| Announcements | — | ✓ | — |

**Landing tab rule:** In Exam Management, landing tab = Assessments. In PCE, landing tab = Overview. In Course Evaluation, landing tab = Evaluations. Never assume the landing tab — it is product-configured.

---

## Term entity

Simple grid + drawer. No standalone detail page.

**Grid columns:** Term name/label, Academic Year, Start Date, End Date, Status
**Drawer fields:** All of the above + notes
**LMS behaviour:** If Canvas integration active → fields pre-populated and locked

---

## Master Course entity (Course Catalog / Course Library)

Simple grid + drawer. No standalone detail page.

**Grid columns:** Course number, Course name, Credits, Type (Core/Elective), Departments
**Drawer fields:** All course details + description + prerequisites
**Exam Management behaviour:** Creating a course offering from a master course auto-generates a Question Bank shell with the same name

---

## Code architecture principle

Each product builds its own entity page files (Next.js route per product). They are NOT shared at the code level — the workspace doesn't have a shared entity package today. They ARE aligned at the pattern/spec level via this document.

When building any entity page:
1. Read the universal fields section above
2. Apply the product's tab variation from the table above
3. Follow the list/detail shell pattern
4. Use DS `DataTable` for list, DS `Tabs` for detail, DS `Badge` for status

When a new product needs an entity page, copy the Exam Management implementation as the baseline and add/remove tabs per the variation table.

---

## File locations (canonical implementations — build here first)

| Entity | Exam Management path |
|---|---|
| Student list | `apps/exam-management/admin/app/(app)/students/page.tsx` |
| Student detail | `apps/exam-management/admin/app/(app)/students/[id]/page.tsx` |
| Faculty list | `apps/exam-management/admin/app/(app)/faculty/page.tsx` |
| Faculty detail | `apps/exam-management/admin/app/(app)/faculty/[id]/page.tsx` |
| Course Offerings list | `apps/exam-management/admin/app/(app)/courses/page.tsx` |
| Course Offering detail | `apps/exam-management/admin/app/(app)/courses/[id]/page.tsx` |
| Terms | `apps/exam-management/admin/app/(app)/terms/page.tsx` |
| Master Courses | `apps/exam-management/admin/app/(app)/course-catalog/page.tsx` |

---

## Sources

- Aarti, May 13 2026 — "Student module design — search, landing pages, and entity alignment" (raw Granola transcript)
- Aarti + Vishaka + Romit, May 8 2026 — "Exam management and course evaluation — curriculum mapping, base entities, and product alignment" (raw Granola transcript)
- Vishaka, May 14 2026 — "Assessment builder — base entities, student experience, and PRD workflow" (raw Granola transcript)
