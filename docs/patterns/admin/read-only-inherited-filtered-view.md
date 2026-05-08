# Read-Only Inherited Filtered View

**Question answered:** How does a non-admin persona (faculty / module surface) display a master entity they can't modify?

**Pattern ID:** `ADMIN-002`
**Binds rules:** workspace ADR-001 (entities owned by Admin), ADR-006 (accommodations shared module)

---

## When to use

Any time a Faculty / Student / module surface needs to show entities owned by the Admin tier. The classic example: faculty viewing accommodations on a course roster.

Pattern guarantees:

1. The persona sees only what's relevant to their scope (filtered view)
2. The persona cannot create / edit / delete the master entity
3. The provenance is clear ("This is managed by the school admin — contact them to change.")

## Examples

| Surface | Inherited entity | Filter |
|---|---|---|
| Faculty roster (Exam Mgmt) | Accommodations | Students enrolled in this course offering |
| Faculty course detail (Exam Mgmt) | Standards / competencies | Mapped to this course |
| PCE faculty self-view | Faculty profile | Self only |
| PCE admin course detail | Course offering | Single offering |
| Patient Log encounter list (TBD) | Students | Enrolled in user's preceptored cohort |

## The shape

For row-level inherited data (e.g., accommodations on a roster):

```
┌─ Course roster: PHARM 101 — Spring 2026 ──────────────────┐
│                                                            │
│  Name             Email                       Accommodations│
│  ──────────────────────────────────────────────            │
│  Alice Chen       alice@school.edu          [+10] [Reader] │
│  Bob Patel        bob@school.edu                            │
│  Carlos Diaz      carlos@school.edu         [+10]           │
│                                                            │
│  ⓘ Accommodations are managed by your program admin.       │
│    Contact them to add or modify.                          │
└────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Inline badges per row | DS `Badge variant="secondary"` with accommodation code (e.g., `[+10]` for "+10% time"); compact, hover for full name |
| Empty state per row | Just whitespace — don't render "no accommodations" text per row |
| Footer note | "Managed by program admin" — single line below table; tells faculty where authority lives |
| Click on badge | Opens DS `Tooltip` or `Popover` with full description + documentation link if uploaded |
| Faculty cannot CRUD | No "Add accommodation" button anywhere on faculty surfaces |

## For full-screen inherited views (e.g., faculty seeing standards mapped to course)

```
┌─ PHARM 101 > Standards mapped ─────────────────────────────┐
│                                                             │
│  Standard                  Mapped objectives                │
│  ─────────────────────     ─────────────────────            │
│  Patient Care              4 objectives                     │
│  Pharmacology              5 objectives                     │
│  Communication             3 objectives                     │
│  Professionalism           6 objectives                     │
│                                                             │
│  ⓘ Standards are defined by your program admin.             │
│    To add or modify, contact <admin name / role>.           │
└─────────────────────────────────────────────────────────────┘
```

Same principles: visible, filtered, no CRUD, attributed.

## A11y notes

- Inline badges: each badge is a `<button>` (DS `Badge` wrapping a Button) with `aria-label` describing the accommodation in full
- Footer note: visible AND in `aria-describedby` of the table caption
- No CRUD = no edit/delete affordances visible (users with screen readers don't get spurious buttons announced)

## Code recipe — admin profile

```tsx
'use client'
import {
  Badge, Tooltip, TooltipTrigger, TooltipContent,
  Table, TableHeader, TableRow, TableHead, TableCell, TableBody,
} from '@exxat/ds/packages/ui/src'

type Accommodation = { id: string; code: string; name: string; documentationUrl?: string }
type Student = { id: string; name: string; email: string; accommodations: Accommodation[] }

export function CourseRosterWithAccommodations({ students }: { students: Student[] }) {
  return (
    <div className="space-y-2">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Name</TableHead>
            <TableHead>Email</TableHead>
            <TableHead>Accommodations</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {students.map((s) => (
            <TableRow key={s.id}>
              <TableCell>{s.name}</TableCell>
              <TableCell className="text-muted-foreground">{s.email}</TableCell>
              <TableCell>
                <div className="flex flex-wrap gap-1">
                  {s.accommodations.map((acc) => (
                    <Tooltip key={acc.id}>
                      <TooltipTrigger asChild>
                        <Badge
                          variant="secondary"
                          className="font-mono text-[10px]"
                          aria-label={`Accommodation: ${acc.name}`}
                        >
                          {acc.code}
                        </Badge>
                      </TooltipTrigger>
                      <TooltipContent>
                        <div className="text-xs"><strong>{acc.name}</strong></div>
                        {acc.documentationUrl && (
                          <div className="text-xs text-muted-foreground">
                            Documentation on file
                          </div>
                        )}
                      </TooltipContent>
                    </Tooltip>
                  ))}
                </div>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <p className="text-xs text-muted-foreground">
        <i className="fa-light fa-circle-info mr-1" aria-hidden="true" />
        Accommodations are managed by your program admin. Contact them to add or modify.
      </p>
    </div>
  )
}
```

## Anti-patterns

- ❌ "Add accommodation" button on faculty surface — wrong authority (ADR-006)
- ❌ Edit / delete affordances on inherited badges — same
- ❌ "No accommodations" text per row when most students have none — clutter; whitespace is enough
- ❌ Hiding the inherited view because it's read-only ("faculty doesn't need to know") — they need to know to plan their exam
- ❌ Footer note absent — faculty needs to know where authority lives, otherwise they think the system is broken
- ❌ Badge color = severity ("red for serious accommodations") — accommodations aren't ranked; treat all the same
