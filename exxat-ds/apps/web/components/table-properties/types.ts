"use client"

// ─────────────────────────────────────────────────────────────────────────────
// Shared types for table-properties components
// ─────────────────────────────────────────────────────────────────────────────

export type FilterOperator = "is" | "is_not" | "contains" | "not_contains"

export interface FilterFieldDef {
  key: string
  label: string
  icon: string
  type: "select" | "text" | "date"
  operators: FilterOperator[]
  /** Select options, or for `date` fields used by conditional rules (exact row strings). */
  options?: { value: string; label: string }[]
}

export interface ActiveFilter {
  id: string
  fieldKey: string
  operator: FilterOperator
  values: string[]
}

export interface SortRule {
  id: string
  fieldKey: string
  direction: "asc" | "desc"
}

export const OPERATOR_LABELS: Record<FilterOperator, string> = {
  is: "is", is_not: "is not", contains: "contains", not_contains: "does not contain",
}

/** Default filter field list (placement table uses column-derived defs via `filterFields` prop). */
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

// Column definitions — shared with drawer
export interface ColDef {
  key: string
  label: string
  sortable: boolean
  sortKey?: string
  minWidth: number
}

// ─────────────────────────────────────────────────────────────────────────────
// Conditional formatting rules
// ─────────────────────────────────────────────────────────────────────────────

export interface ConditionalRule {
  id: string
  /** Column key to evaluate */
  fieldKey: string
  operator: FilterOperator
  /** Selected option values (select) or text (single entry) when operator needs values */
  values: string[]
  /** Resolved CSS background color string */
  bgColor: string
}

/** Predefined palette for conditional rule backgrounds */
export const RULE_COLORS: { name: string; bg: string }[] = [
  { name: "Green",  bg: "var(--conditional-rule-green)" },
  { name: "Yellow", bg: "var(--conditional-rule-yellow)" },
  { name: "Blue",   bg: "var(--conditional-rule-blue)" },
  { name: "Red",    bg: "var(--conditional-rule-red)" },
  { name: "Purple", bg: "var(--conditional-rule-purple)" },
  { name: "Orange", bg: "var(--conditional-rule-orange)" },
]

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
