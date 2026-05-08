# Master-List Admin

**Question answered:** What's the uniform shape of an admin screen that owns one of the 11 program-level master entities?

**Pattern ID:** `ADMIN-001`
**Binds rules:** workspace ADR-001 (program-level entity universe), ADR-002 (LMS-first default)

---

## When to use

Any admin screen that owns a program-level master entity. There are 11 of them per workspace DESIGN.md §11. They MUST share the same shape so admins learn once, apply everywhere.

The 11 entities:

| # | Entity | Notes |
|---|---|---|
| 1 | Master courses | Catalog of courses the program offers |
| 2 | Terms | Master list of academic terms |
| 3 | Course offerings | Master course × term × faculty assignment |
| 4 | Students | Synced from LMS or imported |
| 5 | Faculty | Synced from LMS or imported |
| 6 | Permissions / role assignments | Per faculty: which capabilities granted |
| 7 | Content areas | Topic taxonomy |
| 8 | Competencies | Outcome capability taxonomy |
| 9 | Standards | Accreditation requirements |
| 10 | Accommodations (master list) | Per ADR-006 — shared across products |
| 11 | Assessment types | pop quiz / timed / take-home / open-book / proctored |

## The shape

```
┌─ Admin > Master courses                                                    ┐
│                                                                             │
│  Search [____________]   Filters [▼]   [+ Add course]   [Import CSV] [⋮]   │
│  ┊                                       ↑                                  │
│  ┊                                       Hidden if LMS-on (ADR-002)         │
│  ──────────────────────────────────────────────────────────────────         │
│  Code     Name                          Department        Status      ⋯    │
│  ──────────────────────────────────────────────────────────────────         │
│  PHARM101 Pharmacology I                Pharmacy          Active     [⋯]   │
│  PHARM201 Pharmacology II               Pharmacy          Active     [⋯]   │
│  ANAT201  Anatomy                       Foundations       Inactive   [⋯]   │
│                                                                             │
│  Showing 24 of 24 courses     [LMS sync indicator: "Last synced 4m ago ●"] │
└─────────────────────────────────────────────────────────────────────────────┘
```

| Element | Spec |
|---|---|
| Header path | "Admin > <Entity name>" — establishes scope |
| Search | DS `Input` with `InputGroupAddon` icon |
| Filters | DS `FilterBar` with entity-relevant filters (status, department, etc.) |
| Add CTA | DS `Button variant="default"` — **disabled when LMS-on**, with tooltip "Managed by your LMS" |
| Import CSV | Always available (admin can import even with LMS-on for one-off cases) |
| List | DS `Table` (admin) or `DataTable` for sortable/groupable scenarios |
| Per-row actions | DS `DropdownMenu` (⋯) with Edit, View history, Archive (never Delete — soft-delete only for audit trail) |
| LMS sync indicator | Bottom of list when LMS-on; shows last successful sync time |

## LMS-on vs LMS-off behavior (ADR-002)

| Element | LMS-on | LMS-off |
|---|---|---|
| "+ Add" button | Disabled + tooltip "Managed by your LMS" | Enabled |
| Edit per-row | Limited to non-LMS fields (e.g., custom tags) | Full edit |
| Delete | Disabled (LMS owns lifecycle) | Soft-delete |
| Import CSV | Available (one-off addition outside LMS) | Available |
| LMS sync indicator | Visible at bottom | Hidden |
| "Last synced" | Pulled from school config | N/A |

## Audit trail

Every change to a master entity records:
- Who changed it (user ID)
- When (timestamp)
- What changed (field-level diff)
- Why (optional comment field)

Surfaced via per-row "View history" in the dropdown menu. NOT via a separate audit screen — context matters; history lives where the entity lives.

## Bulk actions

DS `FloatingActionBar` appears when 2+ rows selected. Standard bulk actions per entity:

| Entity | Bulk actions |
|---|---|
| Master courses | Archive, Export selection, Tag |
| Terms | Archive |
| Course offerings | Reassign faculty, Archive, Export selection |
| Students | Tag, Export selection |
| Faculty | Assign role, Tag, Export selection |
| Permissions | Bulk grant/revoke (role-templated) |
| Content areas | Merge, Tag, Export |
| Competencies | Tag, Export |
| Standards | Tag, Export |
| Accommodations (master) | Archive, Export |
| Assessment types | Archive |

## A11y notes

- Use DS `Table` (admin) or `DataTable` — never raw `<table>` (DS-004)
- Search input has `aria-label` if no visible label
- `+ Add` button when disabled has `aria-disabled="true"` AND tooltip explaining why
- Bulk-select checkbox column: select-all uses `aria-label="Select all"` and supports indeterminate state
- Per-row actions menu: `aria-label="Actions for <entity name>"`

## Code recipe — admin profile

```tsx
'use client'
import {
  Table, TableHeader, TableBody, TableRow, TableHead, TableCell,
  Button, Input, InputGroup, InputGroupAddon,
  DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem,
  Tooltip, TooltipTrigger, TooltipContent,
} from '@exxat/ds/packages/ui/src'

type MasterEntityRow = { id: string; code: string; name: string; status: 'Active' | 'Inactive' }

export function MasterCoursesAdmin({
  rows, lmsEnabled, onAdd, onImport,
}: {
  rows: MasterEntityRow[]
  lmsEnabled: boolean
  onAdd: () => void
  onImport: () => void
}) {
  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2">
        <InputGroup className="flex-1 max-w-sm">
          <Input placeholder="Search courses…" aria-label="Search courses" />
          <InputGroupAddon align="end">
            <i className="fa-light fa-magnifying-glass text-muted-foreground" aria-hidden="true" />
          </InputGroupAddon>
        </InputGroup>

        {lmsEnabled ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <Button variant="default" disabled aria-disabled="true">
                <i className="fa-light fa-plus" aria-hidden="true" />
                Add course
              </Button>
            </TooltipTrigger>
            <TooltipContent>Managed by your LMS</TooltipContent>
          </Tooltip>
        ) : (
          <Button variant="default" onClick={onAdd}>
            <i className="fa-light fa-plus" aria-hidden="true" />
            Add course
          </Button>
        )}

        <Button variant="outline" onClick={onImport}>
          <i className="fa-light fa-arrow-up-from-bracket" aria-hidden="true" />
          Import CSV
        </Button>
      </div>

      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Code</TableHead>
            <TableHead>Name</TableHead>
            <TableHead>Status</TableHead>
            <TableHead className="w-12" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row) => (
            <TableRow key={row.id}>
              <TableCell className="font-mono text-xs">{row.code}</TableCell>
              <TableCell>{row.name}</TableCell>
              <TableCell>{row.status}</TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon-sm" aria-label={`Actions for ${row.name}`}>
                      <i className="fa-regular fa-ellipsis" aria-hidden="true" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-44">
                    <DropdownMenuItem>Edit</DropdownMenuItem>
                    <DropdownMenuItem>View history</DropdownMenuItem>
                    <DropdownMenuItem variant="destructive">Archive</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      {lmsEnabled && (
        <p className="text-xs text-muted-foreground text-right">
          Last synced 4m ago ●
        </p>
      )}
    </div>
  )
}
```

## Anti-patterns

- ❌ Per-product master-list admin (e.g., Exam Mgmt has its own "Add Course" screen) — duplicates ADR-001 ownership
- ❌ Different shape per entity — confuses admins; uniform shape is the value
- ❌ Hard-delete (vs archive) — accreditation requires audit trail (ADR-006 + general L4 quality)
- ❌ Hidden LMS-off state — alienates current 95% of customers
- ❌ "+ Add" enabled when LMS-on — breaks the LMS contract
- ❌ History lives on a separate audit screen — context matters; history is per-entity-per-row
