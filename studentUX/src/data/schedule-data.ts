import { logoUrl } from "./jobs-data";

export type ScheduleItemStatus =
  | "payment-pending"
  | "overdue"
  | "action-needed"
  | "compliant"
  | "not-started";

export type ScheduleItemBoard = "upcoming" | "in-process" | "completed";

export interface ScheduleItem {
  id: string;
  facilityName: string;
  facilityLogo?: string;
  location: string;
  specialty?: string;
  dateRange?: { start: Date; end: Date };
  amount?: number;
  status: ScheduleItemStatus;
  overdueDays?: number;
  dueDate?: Date;
  showChatIcon?: boolean;
  showProfileIcon?: boolean;
  /** When > 0, shows dot on message icon (unread messages) */
  unreadMessageCount?: number;
  /** When true, has updates (new requirements, site changes, etc.) — shows dot on bell icon */
  hasUpdates?: boolean;
  /** Preview text for updates popover (e.g. "New requirements added: Immunization records") */
  updatePreview?: string;
  /** Preview text for messages popover (e.g. "Site coordinator: Please confirm your availability") */
  messagePreview?: string;
  actionType?: "pay-unlock" | "complete-requirements" | "employee-verification" | "none";
  /** Site coordinator email for employee verification flow */
  siteEmail?: string;
  board: ScheduleItemBoard;
  /** When set, this item is part of a payment group — single payment unlocks all items in the group */
  paymentGroupId?: string;
  /** When true, pay-unlock card shows Employee verification section inside */
  requiresEmployeeVerification?: boolean;
}

/** Groups an array of ScheduleItems by their board field. */
export function groupByBoard(items: ScheduleItem[]): Record<ScheduleItemBoard, ScheduleItem[]> {
  const map: Record<ScheduleItemBoard, ScheduleItem[]> = {
    upcoming: [],
    "in-process": [],
    completed: [],
  };
  items.forEach((item) => map[item.board].push(item));
  return map;
}

/** Board item: either a single ScheduleItem or a payment group (multiple items, single unlock) */
export type BoardItem =
  | { type: "single"; item: ScheduleItem }
  | { type: "payment-group"; items: ScheduleItem[]; amount: number };

/** Converts board items into BoardItem[] — groups by paymentGroupId, singles stay as single */
export function toBoardItems(items: ScheduleItem[]): BoardItem[] {
  const groups = new Map<string, ScheduleItem[]>();
  const singles: ScheduleItem[] = [];

  for (const item of items) {
    if (item.paymentGroupId) {
      const arr = groups.get(item.paymentGroupId) ?? [];
      arr.push(item);
      groups.set(item.paymentGroupId, arr);
    } else {
      singles.push(item);
    }
  }

  const result: BoardItem[] = [];
  for (const item of singles) {
    result.push({ type: "single", item });
  }
  for (const [, groupItems] of groups) {
    const amount = groupItems.find((i) => i.amount != null)?.amount ?? 0;
    result.push({ type: "payment-group", items: groupItems, amount });
  }
  return result;
}

export const scheduleItems: ScheduleItem[] = [
  // ── Upcoming ──────────────────────────────────────────────────────────
  {
    id: "s1",
    facilityName: "Johns Hopkins Hospital",
    facilityLogo: logoUrl("hopkinsmedicine.org"),
    location: "Baltimore, MD",
    specialty: "Pediatric Nursing",
    dateRange: { start: new Date("2026-04-06"), end: new Date("2026-05-01") },
    dueDate: new Date("2026-03-12"),
    status: "not-started",
    actionType: "complete-requirements",
    board: "upcoming",
    hasUpdates: true,
    updatePreview: "New requirements added: Immunization records, Background check.",
  },
  {
    id: "s2",
    facilityName: "Stanford Medical Center",
    facilityLogo: logoUrl("stanford.edu"),
    location: "Palo Alto, CA",
    specialty: "Emergency Medicine",
    dateRange: { start: new Date("2026-04-20"), end: new Date("2026-05-15") },
    dueDate: new Date("2026-04-10"),
    status: "action-needed",
    showChatIcon: true,
    unreadMessageCount: 2,
    messagePreview: "Site coordinator: Please confirm your availability for the orientation week.",
    actionType: "complete-requirements",
    board: "upcoming",
  },
  {
    id: "s3",
    facilityName: "Cleveland Clinic",
    facilityLogo: logoUrl("clevelandclinic.org"),
    location: "Cleveland, OH",
    specialty: "Cardiac Rehab",
    dateRange: { start: new Date("2026-05-04"), end: new Date("2026-05-29") },
    dueDate: new Date("2026-03-05"),
    status: "payment-pending",
    amount: 35,
    overdueDays: 4,
    actionType: "pay-unlock",
    board: "upcoming",
  },
  {
    id: "s4",
    facilityName: "Kaiser Permanente — Oakland",
    facilityLogo: logoUrl("kaiserpermanente.org"),
    location: "Oakland, CA",
    specialty: "Family Medicine",
    dateRange: { start: new Date("2026-05-18"), end: new Date("2026-06-12") },
    dueDate: new Date("2026-05-01"),
    status: "not-started",
    actionType: "complete-requirements",
    board: "upcoming",
  },
  /* Multi-unlock: single payment unlocks 3 sites (stacked cards) */
  {
    id: "s4a",
    facilityName: "Memorial Hospital",
    facilityLogo: logoUrl("memorialhermann.org"),
    location: "Houston, TX",
    specialty: "General Surgery",
    dateRange: { start: new Date("2026-05-11"), end: new Date("2026-06-05") },
    dueDate: new Date("2026-04-25"),
    status: "payment-pending",
    amount: 75,
    actionType: "pay-unlock",
    board: "upcoming",
    paymentGroupId: "pg-multi",
  },
  {
    id: "s4b",
    facilityName: "Children's Medical Center",
    facilityLogo: logoUrl("childrens.com"),
    location: "Dallas, TX",
    specialty: "Pediatrics",
    dateRange: { start: new Date("2026-05-25"), end: new Date("2026-06-19") },
    dueDate: new Date("2026-04-25"),
    status: "payment-pending",
    actionType: "pay-unlock",
    board: "upcoming",
    paymentGroupId: "pg-multi",
  },
  {
    id: "s4c",
    facilityName: "Baylor Scott & White",
    facilityLogo: logoUrl("bswhealth.com"),
    location: "Temple, TX",
    specialty: "Internal Medicine",
    dateRange: { start: new Date("2026-06-08"), end: new Date("2026-07-03") },
    dueDate: new Date("2026-04-25"),
    status: "payment-pending",
    actionType: "pay-unlock",
    board: "upcoming",
    paymentGroupId: "pg-multi",
  },
  /* Pay-unlock card with Employee verification section inside */
  {
    id: "s4e",
    facilityName: "Methodist Dallas Medical Center",
    facilityLogo: logoUrl("methodisthealthsystem.org"),
    location: "Dallas, TX",
    specialty: "General Surgery",
    dateRange: { start: new Date("2026-06-22"), end: new Date("2026-07-17") },
    dueDate: new Date("2026-05-28"),
    status: "payment-pending",
    amount: 45,
    actionType: "pay-unlock",
    board: "upcoming",
    requiresEmployeeVerification: true,
    siteEmail: "placement@methodisthealthsystem.org",
  },

  // ── In-Process ────────────────────────────────────────────────────────
  {
    id: "s5",
    facilityName: "Mayo Clinic",
    facilityLogo: logoUrl("mayoclinic.org"),
    location: "Rochester, MN",
    specialty: "Internal Medicine",
    dateRange: { start: new Date("2026-02-23"), end: new Date("2026-03-20") },
    dueDate: new Date("2026-03-10"),
    status: "action-needed",
    showChatIcon: true,
    showProfileIcon: true,
    unreadMessageCount: 1,
    hasUpdates: true,
    updatePreview: "Site requested updated licensure documentation.",
    messagePreview: "Preceptor: Your schedule has been confirmed for March.",
    actionType: "complete-requirements",
    board: "in-process",
  },
  {
    id: "s6",
    facilityName: "Mount Sinai Hospital",
    facilityLogo: logoUrl("mountsinai.org"),
    location: "New York, NY",
    specialty: "Oncology Nursing",
    dateRange: { start: new Date("2026-03-02"), end: new Date("2026-03-27") },
    dueDate: new Date("2026-03-15"),
    status: "compliant",
    showChatIcon: true,
    actionType: "none",
    board: "in-process",
  },
  {
    id: "s7",
    facilityName: "Emory University Hospital",
    facilityLogo: logoUrl("emoryhealthcare.org"),
    location: "Atlanta, GA",
    specialty: "Labor & Delivery",
    dateRange: { start: new Date("2026-03-09"), end: new Date("2026-04-03") },
    dueDate: new Date("2026-03-20"),
    status: "action-needed",
    showChatIcon: true,
    actionType: "complete-requirements",
    board: "in-process",
  },

  // ── Completed ─────────────────────────────────────────────────────────
  {
    id: "s8",
    facilityName: "Mass General Hospital",
    facilityLogo: logoUrl("massgeneral.org"),
    location: "Boston, MA",
    specialty: "Radiology",
    dateRange: { start: new Date("2026-01-12"), end: new Date("2026-02-06") },
    dueDate: new Date("2026-02-06"),
    status: "compliant",
    actionType: "none",
    board: "completed",
  },
  {
    id: "s9",
    facilityName: "UCSF Medical Center",
    facilityLogo: logoUrl("ucsf.edu"),
    location: "San Francisco, CA",
    specialty: "Psych Nursing",
    dateRange: { start: new Date("2026-01-26"), end: new Date("2026-02-20") },
    dueDate: new Date("2026-02-20"),
    status: "compliant",
    actionType: "none",
    board: "completed",
  },
  {
    id: "s10",
    facilityName: "Northwestern Memorial Hospital",
    facilityLogo: logoUrl("nm.org"),
    location: "Chicago, IL",
    specialty: "Surgical Nursing",
    dateRange: { start: new Date("2026-02-02"), end: new Date("2026-02-27") },
    dueDate: new Date("2026-02-27"),
    status: "compliant",
    actionType: "none",
    board: "completed",
  },
  {
    id: "s11",
    facilityName: "Cedars-Sinai Medical Center",
    facilityLogo: logoUrl("cedars-sinai.org"),
    location: "Los Angeles, CA",
    specialty: "Critical Care",
    dateRange: { start: new Date("2026-02-09"), end: new Date("2026-03-06") },
    dueDate: new Date("2026-03-06"),
    status: "compliant",
    actionType: "none",
    board: "completed",
  },
];
