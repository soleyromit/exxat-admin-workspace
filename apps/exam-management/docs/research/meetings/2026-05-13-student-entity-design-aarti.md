# Student Module Design — Search, Landing Pages, and Entity Alignment
**Date:** May 13, 2026 · **Meeting ID:** 1073d454 · **Participants:** Romit, Aarti

---

## Design philosophy

- No left-hand menu navigation inside entity detail pages (use tabs, not nested menu)
- Student entity remains the SAME across modules — Prism and exam management share the same data; only the "lens" differs

## Student search landing page

- **Single Google-style search box** — NO separate first name / last name / email fields ✅ already implemented
- Recently used students concept: show recently accessed students on right side of grid (new feature, not yet built)
- Grid should have minimal, purposeful columns — just enough to identify the student:
  - Name, email, cohort, # courses registered, adviser, GPA, tags ✅ already in students-client.tsx

## Student detail view — exam management trim

- Overview tab: academic status, notes, flags/tags (NOT the preceptor profile)
- Courses tab: courses registered, completion status (ongoing vs done)
- Accommodations tab: exam-management-specific accommodations
- Link to "detailed profile" (Prism view) opens in new tab — acceptable for launch
- **NOT needed in exam management:**
  - Compliance
  - Learning activities / lab activity / timesheets
  - Intervention / communication
  - Competency dashboard (nice to have, post-launch)

## Faculty entity — exam management trim

- Course associations: **coordinator** vs **instructor** roles for each course (two tiles)
- Admin can go in and add/remove course access for each faculty
- When faculty logs in: sees "Courses I'm managing" + "Courses I'm contributing to"
- **NOT needed in exam management:**
  - Teaching / scholarship / service tabs
  - Placements
  - Compliance
  - Advisees / student-to-faculty mapping (not built in Phase 1)

## Entity design scope — all 8 pages Aarti wants

1. Student search landing
2. Student detail (tab view)
3. Faculty search landing
4. Faculty detail (tab view)
5. Course search landing
6. Course detail (tabs: overview, students, assessments, questions, accommodations)
7. Term list (simple grid + drawer, NO separate landing page needed)
8. Master course list (simple grid + drawer, NO separate landing page needed)
9. Course registration (select students + course offering OR select course + add students)

## LMS integration gate

- LMS integration ON → add/edit buttons disabled on all entity pages (LMS = source of truth)
- LMS integration OFF → manual add/bulk import enabled
- Canvas is the first and only LMS integration for launch

## Philosophy

- Do NOT show "all students ever" — filter by current/recent term
- Recently used concept on entity search pages = reduces navigation friction
- Same entity screens will be shared across exam management and course evaluation (adapt later if needed)
- Global search (one box) not tabular search (multiple filter boxes) — confirmed for all entity pages

## Accessibility / FERPA notes

- Academic standing: ADMIN only (FERPA). Never show to faculty.
- Course performance data: faculty who COORDINATE the course only (not instructors)
- Competency dashboard: not shown to lower-level admins or faculty
