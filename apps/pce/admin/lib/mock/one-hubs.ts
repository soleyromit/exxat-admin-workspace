/**
 * Mock rows for the Exxat One hubs — two on the Sites side, two on the Schools
 * side.
 *
 * These four surfaces were `_product-shell-placeholder` scaffolds until now,
 * which meant Exxat One had no real screen anywhere in the app. Building them
 * on the standard `ListPageTemplate` + `HubTable` stack gives the products
 * something a coordinator can actually use, and gives the marketing pages under
 * `/home` honest screenshots instead of illustrations.
 *
 * Data is deliberately small and hand-written rather than generated: twelve
 * legible rows read better in a screenshot than a hundred synthetic ones, and
 * the totals across the four sets stay internally consistent (the same brands,
 * sites, and programs recur, so the products look like one system).
 */

import type { MetricItem } from "@/components/key-metrics"

/* ── Shared vocabulary ────────────────────────────────────────────────────── */

/** The clinical partner brands both sides of Exxat One share. */
export const ONE_BRANDS = [
  "Mercy Health",
  "Northside Regional",
  "Lakeshore Rehabilitation",
  "St. Anne's",
] as const

export type OneClearanceState = "cleared" | "action-needed" | "in-review"

export const ONE_CLEARANCE_LABEL: Record<OneClearanceState, string> = {
  cleared: "Cleared",
  "action-needed": "Action needed",
  "in-review": "In review",
}

export type OneRequestState = "pending" | "accepted" | "declined" | "draft"

export const ONE_REQUEST_LABEL: Record<OneRequestState, string> = {
  pending: "Pending",
  accepted: "Accepted",
  declined: "Declined",
  draft: "Draft",
}

/* ── One — Sites · Locations ──────────────────────────────────────────────── */

export interface OneLocation extends Record<string, unknown> {
  id: string
  locationCode: string
  name: string
  brand: string
  city: string
  specialty: string
  capacity: number
  placed: number
  clearance: OneClearanceState
  coordinator: string
  coordinatorEmail: string
}

export const ONE_LOCATIONS: OneLocation[] = [
  {
    id: "loc-01",
    locationCode: "LOC-1042",
    name: "Mercy Health — Downtown Campus",
    brand: "Mercy Health",
    city: "Baltimore, MD",
    specialty: "Acute care",
    capacity: 12,
    placed: 11,
    clearance: "cleared",
    coordinator: "Dana Whitfield",
    coordinatorEmail: "dana.whitfield@mercyhealth.org",
  },
  {
    id: "loc-02",
    locationCode: "LOC-1043",
    name: "Mercy Health — Westside Clinic",
    brand: "Mercy Health",
    city: "Baltimore, MD",
    specialty: "Outpatient",
    capacity: 8,
    placed: 5,
    clearance: "action-needed",
    coordinator: "Dana Whitfield",
    coordinatorEmail: "dana.whitfield@mercyhealth.org",
  },
  {
    id: "loc-03",
    locationCode: "LOC-2210",
    name: "Northside Regional — Main Hospital",
    brand: "Northside Regional",
    city: "Towson, MD",
    specialty: "Acute care",
    capacity: 16,
    placed: 16,
    clearance: "cleared",
    coordinator: "Marcus Ellery",
    coordinatorEmail: "m.ellery@northsideregional.org",
  },
  {
    id: "loc-04",
    locationCode: "LOC-2214",
    name: "Northside Regional — Pediatrics",
    brand: "Northside Regional",
    city: "Towson, MD",
    specialty: "Pediatrics",
    capacity: 6,
    placed: 4,
    clearance: "in-review",
    coordinator: "Marcus Ellery",
    coordinatorEmail: "m.ellery@northsideregional.org",
  },
  {
    id: "loc-05",
    locationCode: "LOC-3301",
    name: "Lakeshore Rehabilitation — North",
    brand: "Lakeshore Rehabilitation",
    city: "Annapolis, MD",
    specialty: "Inpatient rehab",
    capacity: 10,
    placed: 7,
    clearance: "action-needed",
    coordinator: "Priya Raman",
    coordinatorEmail: "praman@lakeshorerehab.org",
  },
  {
    id: "loc-06",
    locationCode: "LOC-3305",
    name: "Lakeshore Rehabilitation — Bayview",
    brand: "Lakeshore Rehabilitation",
    city: "Annapolis, MD",
    specialty: "Outpatient",
    capacity: 9,
    placed: 9,
    clearance: "cleared",
    coordinator: "Priya Raman",
    coordinatorEmail: "praman@lakeshorerehab.org",
  },
  {
    id: "loc-07",
    locationCode: "LOC-4110",
    name: "St. Anne's — Surgical Center",
    brand: "St. Anne's",
    city: "Columbia, MD",
    specialty: "Acute care",
    capacity: 7,
    placed: 3,
    clearance: "in-review",
    coordinator: "Owen Brady",
    coordinatorEmail: "obrady@stannes.org",
  },
  {
    id: "loc-08",
    locationCode: "LOC-4115",
    name: "St. Anne's — Community Health",
    brand: "St. Anne's",
    city: "Columbia, MD",
    specialty: "Primary care",
    capacity: 14,
    placed: 12,
    clearance: "cleared",
    coordinator: "Owen Brady",
    coordinatorEmail: "obrady@stannes.org",
  },
  {
    id: "loc-09",
    locationCode: "LOC-2218",
    name: "Northside Regional — Neuro Unit",
    brand: "Northside Regional",
    city: "Towson, MD",
    specialty: "Neurology",
    capacity: 5,
    placed: 2,
    clearance: "action-needed",
    coordinator: "Marcus Ellery",
    coordinatorEmail: "m.ellery@northsideregional.org",
  },
  {
    id: "loc-10",
    locationCode: "LOC-1049",
    name: "Mercy Health — Sports Medicine",
    brand: "Mercy Health",
    city: "Baltimore, MD",
    specialty: "Sports medicine",
    capacity: 6,
    placed: 6,
    clearance: "cleared",
    coordinator: "Dana Whitfield",
    coordinatorEmail: "dana.whitfield@mercyhealth.org",
  },
  {
    id: "loc-11",
    locationCode: "LOC-3309",
    name: "Lakeshore Rehabilitation — Pediatrics",
    brand: "Lakeshore Rehabilitation",
    city: "Annapolis, MD",
    specialty: "Pediatrics",
    capacity: 4,
    placed: 1,
    clearance: "in-review",
    coordinator: "Priya Raman",
    coordinatorEmail: "praman@lakeshorerehab.org",
  },
  {
    id: "loc-12",
    locationCode: "LOC-4121",
    name: "St. Anne's — Cardiac Rehab",
    brand: "St. Anne's",
    city: "Columbia, MD",
    specialty: "Cardiology",
    capacity: 8,
    placed: 8,
    clearance: "cleared",
    coordinator: "Owen Brady",
    coordinatorEmail: "obrady@stannes.org",
  },
]

export function oneLocationsKpi(rows: OneLocation[]): MetricItem[] {
  const capacity = rows.reduce((sum, r) => sum + r.capacity, 0)
  const placed = rows.reduce((sum, r) => sum + r.placed, 0)
  const needsAction = rows.filter(r => r.clearance === "action-needed").length

  return [
    {
      id: "locations",
      label: "Locations",
      value: rows.length,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
    },
    {
      id: "seats",
      label: "Seats filled",
      value: `${placed}/${capacity}`,
      delta: "",
      trend: "neutral",
      description: "Across every brand",
    },
    {
      id: "action",
      label: "Action needed",
      value: needsAction,
      delta: needsAction > 0 ? `+${needsAction}` : "",
      trend: needsAction > 0 ? "up" : "neutral",
      trendPolarity: "lower_is_better",
    },
    {
      id: "brands",
      label: "Partner brands",
      value: new Set(rows.map(r => r.brand)).size,
      delta: "",
      trend: "neutral",
    },
  ]
}

/* ── One — Sites · Slot requests ──────────────────────────────────────────── */

export interface OneSlotRequest extends Record<string, unknown> {
  id: string
  requestCode: string
  school: string
  program: string
  location: string
  rotation: string
  seats: number
  startsOn: string
  state: OneRequestState
  requestedBy: string
  requestedByEmail: string
}

export const ONE_SLOT_REQUESTS: OneSlotRequest[] = [
  {
    id: "req-01",
    requestCode: "REQ-8801",
    school: "Johns Hopkins University",
    program: "Doctor of Physical Therapy",
    location: "Mercy Health — Downtown Campus",
    rotation: "Acute care I",
    seats: 4,
    startsOn: "2026-09-08",
    state: "pending",
    requestedBy: "Alex Morgan",
    requestedByEmail: "alex.morgan@jhu.edu",
  },
  {
    id: "req-02",
    requestCode: "REQ-8802",
    school: "University of Maryland",
    program: "Occupational Therapy",
    location: "Northside Regional — Main Hospital",
    rotation: "Inpatient rehab",
    seats: 2,
    startsOn: "2026-09-15",
    state: "accepted",
    requestedBy: "Renée Alvarez",
    requestedByEmail: "ralvarez@umaryland.edu",
  },
  {
    id: "req-03",
    requestCode: "REQ-8803",
    school: "Towson University",
    program: "Speech-Language Pathology",
    location: "Northside Regional — Pediatrics",
    rotation: "Pediatric outpatient",
    seats: 3,
    startsOn: "2026-10-06",
    state: "pending",
    requestedBy: "Samuel Okafor",
    requestedByEmail: "sokafor@towson.edu",
  },
  {
    id: "req-04",
    requestCode: "REQ-8804",
    school: "Johns Hopkins University",
    program: "Physician Assistant",
    location: "St. Anne's — Surgical Center",
    rotation: "Surgical rotation",
    seats: 2,
    startsOn: "2026-09-22",
    state: "declined",
    requestedBy: "Alex Morgan",
    requestedByEmail: "alex.morgan@jhu.edu",
  },
  {
    id: "req-05",
    requestCode: "REQ-8805",
    school: "Loyola University",
    program: "Doctor of Physical Therapy",
    location: "Lakeshore Rehabilitation — North",
    rotation: "Inpatient rehab",
    seats: 5,
    startsOn: "2026-10-13",
    state: "pending",
    requestedBy: "Hannah Liu",
    requestedByEmail: "hliu@loyola.edu",
  },
  {
    id: "req-06",
    requestCode: "REQ-8806",
    school: "University of Maryland",
    program: "Nursing",
    location: "Mercy Health — Westside Clinic",
    rotation: "Community health",
    seats: 6,
    startsOn: "2026-09-01",
    state: "accepted",
    requestedBy: "Renée Alvarez",
    requestedByEmail: "ralvarez@umaryland.edu",
  },
  {
    id: "req-07",
    requestCode: "REQ-8807",
    school: "Towson University",
    program: "Athletic Training",
    location: "Mercy Health — Sports Medicine",
    rotation: "Sports medicine",
    seats: 3,
    startsOn: "2026-11-03",
    state: "draft",
    requestedBy: "Samuel Okafor",
    requestedByEmail: "sokafor@towson.edu",
  },
  {
    id: "req-08",
    requestCode: "REQ-8808",
    school: "Loyola University",
    program: "Occupational Therapy",
    location: "Lakeshore Rehabilitation — Bayview",
    rotation: "Outpatient",
    seats: 2,
    startsOn: "2026-10-20",
    state: "accepted",
    requestedBy: "Hannah Liu",
    requestedByEmail: "hliu@loyola.edu",
  },
  {
    id: "req-09",
    requestCode: "REQ-8809",
    school: "Johns Hopkins University",
    program: "Doctor of Physical Therapy",
    location: "St. Anne's — Cardiac Rehab",
    rotation: "Cardiopulmonary",
    seats: 4,
    startsOn: "2026-11-10",
    state: "pending",
    requestedBy: "Alex Morgan",
    requestedByEmail: "alex.morgan@jhu.edu",
  },
  {
    id: "req-10",
    requestCode: "REQ-8810",
    school: "University of Maryland",
    program: "Speech-Language Pathology",
    location: "Lakeshore Rehabilitation — Pediatrics",
    rotation: "Pediatric outpatient",
    seats: 2,
    startsOn: "2026-09-29",
    state: "pending",
    requestedBy: "Renée Alvarez",
    requestedByEmail: "ralvarez@umaryland.edu",
  },
]

export function oneSlotRequestsKpi(rows: OneSlotRequest[]): MetricItem[] {
  const pending = rows.filter(r => r.state === "pending").length
  const accepted = rows.filter(r => r.state === "accepted").length
  const seats = rows.reduce((sum, r) => sum + r.seats, 0)

  return [
    {
      id: "pending",
      label: "Awaiting your response",
      value: pending,
      delta: "",
      trend: "neutral",
      metricVariant: "hero",
    },
    {
      id: "accepted",
      label: "Accepted",
      value: accepted,
      delta: "",
      trend: "neutral",
    },
    {
      id: "seats",
      label: "Seats requested",
      value: seats,
      delta: "",
      trend: "neutral",
      description: "Across all open requests",
    },
    {
      id: "schools",
      label: "Schools",
      value: new Set(rows.map(r => r.school)).size,
      delta: "",
      trend: "neutral",
    },
  ]
}

/* ── One — Schools · Explore & apply ──────────────────────────────────────── */

