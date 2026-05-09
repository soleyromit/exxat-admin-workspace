# Admin Pattern Rubric

> Binds workspace ADR-001 (program-level entity universe), ADR-002 (LMS-first), ADR-006 (accommodations shared module).
> Admin surfaces own the master lists. They are the slowest-changing, highest-leverage screens in the system.

---

## The three admin shapes

| Shape | Purpose | Pattern |
|---|---|---|
| **Master-list admin** | CRUD for one of the 11 program-level entities | (P3) `master-list-admin.md` |
| **Read-only inherited filtered view** | Faculty / module sees a filtered subset of an admin-owned list | (P3) `read-only-inherited-filtered-view.md` |
| **Permission / role assignment** | Admin grants capability per faculty/role | (P4) `role-permission-matrix.md` |

---

## Master-list discipline

11 program-level entities (per workspace DESIGN.md §11): courses, terms, course offerings, students, faculty, permissions, content areas, competencies, standards, accommodations, assessment types.

| Rule | Why |
|---|---|
| Same screen shape for every master-list — list + filter + create/edit + bulk action | User learns once, applies everywhere |
| LMS-on state shows read-only + sync indicator (ADR-002) | Manual entry is the exception |
| LMS-off state shows full CRUD | Some customers will stay manual |
| Bulk import via file upload always available | Migration + non-LMS bulk |
| Audit trail on every master-list change | Accreditation defensibility |

---

## Inherited views

Faculty / module surfaces never CREATE master entities; they consume them, filtered to their scope. The pattern: `read-only-inherited-filtered-view.md`. Examples:

- Accommodations on a course roster (faculty sees badges per student, no ability to apply)
- Course offerings on faculty home (faculty sees their assigned offerings, can't add)
- Standards on a course-mapping screen (faculty sees standards mapped to their course, can't define new ones)

---

## Anti-patterns

- ❌ Per-product master-list admin — duplicates ADR-001 ownership
- ❌ Faculty CRUD on admin entities (e.g., "Add accommodation" button on faculty roster) — wrong authority (ADR-006)
- ❌ Hiding LMS-off state — alienates current 95% of customers
- ❌ Admin-only screens that don't surface "who changed this when" — accreditation requires audit trail
- ❌ Free-form role labels with free-form capability sets — semantics must stay fixed even if labels rename (ADR-004)

## Pattern catalogue (this folder)

P3 (this round):
- `master-list-admin.md` — uniform shape for the 11 entities (ADR-001)
- `read-only-inherited-filtered-view.md` — faculty consumption of admin entities (ADR-006)

P4+ (later): `role-permission-matrix.md`, `bulk-import-upload.md`, `audit-trail-export.md`
