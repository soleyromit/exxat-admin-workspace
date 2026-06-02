"use client"

// ─────────────────────────────────────────────────────────────────────────────
// table-properties types — re-exported from @exxatdesignux/ui
//
// Migrated from vendored types.ts per docs/governance/ds-adoption.md.
// Product-specific constants (FILTER_FIELDS, COLUMNS) kept here; shared types
// come from the DS package.
// ─────────────────────────────────────────────────────────────────────────────

export type {
  FilterOperator,
  FilterFieldDef,
  ActiveFilter,
  SortRule,
  ColDef,
  ConditionalRule,
} from '@exxatdesignux/ui'

export {
  OPERATOR_LABELS,
  RULE_COLORS,
} from '@exxatdesignux/ui'

// ─────────────────────────────────────────────────────────────────────────────
// Product-specific field list (Patient Log placements)
// ─────────────────────────────────────────────────────────────────────────────

import type { FilterFieldDef } from '@exxatdesignux/ui'

/** Default filter field list for the patient-log placement table. */
export const FILTER_FIELDS: FilterFieldDef[] = [
  { key: "student",    label: "Student",    icon: "fa-user",      type: "text", operators: ["contains", "not_contains"] },
  {
    key: "specialization", label: "Specialization", icon: "fa-stethoscope", type: "select",
    operators: ["is", "is_not"],
    options: [
      { value: "Adult Health",      label: "Adult Health"      },
      { value: "Orthopedics",       label: "Orthopedics"       },
      { value: "Hand Therapy",      label: "Hand Therapy"      },
      { value: "Critical Care",     label: "Critical Care"     },
      { value: "Behavioral Health", label: "Behavioral Health" },
      { value: "Sports Rehab",      label: "Sports Rehab"      },
      { value: "Pediatrics",        label: "Pediatrics"        },
      { value: "Neuro",             label: "Neuro"             },
      { value: "Family Practice",   label: "Family Practice"   },
      { value: "Neuro Rehab",       label: "Neuro Rehab"       },
      { value: "Youth Services",    label: "Youth Services"    },
      { value: "Emergency",         label: "Emergency"         },
      { value: "Acute Care",        label: "Acute Care"        },
      { value: "Women's Health",    label: "Women's Health"    },
    ],
  },
  { key: "site",       label: "Site",       icon: "fa-hospital",  type: "text", operators: ["contains", "not_contains"] },
  {
    key: "status", label: "Status", icon: "fa-circle-dot", type: "select",
    operators: ["is", "is_not"],
    options: [
      { value: "confirmed",    label: "Confirmed"    },
      { value: "pending",      label: "Pending"      },
      { value: "under-review", label: "Under Review" },
      { value: "rejected",     label: "Rejected"     },
      { value: "completed",    label: "Completed"    },
    ],
  },
  { key: "start",      label: "Start Date", icon: "fa-calendar",  type: "date", operators: ["is", "is_not"] },
  { key: "supervisor", label: "Supervisor", icon: "fa-user-tie",  type: "text", operators: ["contains", "not_contains"] },
]

// ─────────────────────────────────────────────────────────────────────────────
// Column definitions — shared with drawer
// ─────────────────────────────────────────────────────────────────────────────

import type { ColDef } from '@exxatdesignux/ui'

export const COLUMNS: ColDef[] = [
  { key: "select",     label: "",            sortable: false, minWidth: 40  },
  { key: "student",    label: "Student",     sortable: true,  minWidth: 180, sortKey: "student"  },
  { key: "specialization", label: "Specialization", sortable: true,  minWidth: 100, sortKey: "specialization"  },
  { key: "site",       label: "Site",        sortable: true,  minWidth: 100, sortKey: "site"     },
  { key: "status",     label: "Status",      sortable: true,  minWidth: 110, sortKey: "status"   },
  { key: "start",      label: "Start Date",  sortable: true,  minWidth: 110, sortKey: "start"    },
  { key: "duration",   label: "Duration",    sortable: false, minWidth: 80                        },
  { key: "supervisor", label: "Supervisor",  sortable: false, minWidth: 100                       },
  { key: "actions",    label: "",            sortable: false, minWidth: 88  },
]
