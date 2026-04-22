import { logoUrl } from "./jobs-data";

/** Open: preferences submitted or not submitted */
export type WishlistOpenStatus = "preferences-submitted" | "preferences-not-submitted";

/** Closed: can view submission or cannot (due date closed, students placed) */
export type WishlistClosedStatus = "viewable" | "not-viewable";

export type WishlistItemStatus = WishlistOpenStatus | WishlistClosedStatus;

export interface WishlistItem {
  id: string;
  facilityName: string;
  facilityLogo?: string;
  location: string;
  specialty?: string;
  dateRange?: { start: Date; end: Date };
  dueDate?: Date;
  /** Open or Closed tab */
  tab: "open" | "closed";
  /** Status within the tab */
  status: WishlistItemStatus;
  /** Figma: program code + name (e.g. "PTP2 • PT Practice II (DPT 0762)") */
  programLabel?: string;
  /** Figma: rotation/experience title (e.g. "Advanced Clinical Experience Spring 2026") */
  rotationTitle?: string;
  /** Figma: days until closing (e.g. 13) */
  closingInDays?: number;
  /** Figma: preferences submitted count (when submitted) */
  preferencesSubmitted?: number;
  /** Figma: date preferences were submitted */
  preferencesSubmittedDate?: Date;
  /** Figma: preferences range when not submitted (e.g. "3-5 Preferences") */
  preferencesRange?: string;
}

export const wishlistItems: WishlistItem[] = [
  // ── Open: preferences not submitted — only this one "Closing Soon" (due in 3d) ─
  {
    id: "w1",
    facilityName: "Spring Clinical Rotation Fall 2025",
    facilityLogo: logoUrl("hopkinsmedicine.org"),
    location: "Baltimore, MD",
    specialty: "Pediatric Nursing",
    dateRange: { start: new Date("2026-01-15"), end: new Date("2026-03-15") },
    dueDate: (() => {
      const d = new Date();
      d.setDate(d.getDate() + 3);
      return d;
    })(),
    tab: "open",
    status: "preferences-not-submitted",
    programLabel: "PTP1 • PT Practice I (DPT 0761)",
    rotationTitle: "Spring Clinical Rotation Fall 2025",
  },
  {
    id: "w2",
    facilityName: "Stanford Medical Center",
    facilityLogo: logoUrl("stanford.edu"),
    location: "Palo Alto, CA",
    specialty: "Emergency Medicine",
    dateRange: { start: new Date("2026-04-20"), end: new Date("2026-05-15") },
    dueDate: new Date("2026-04-05"),
    tab: "open",
    status: "preferences-not-submitted",
    programLabel: "PTP3 • PT Practice III (DPT 0763)",
    rotationTitle: "Emergency Medicine Clinical Rotation",
  },
  // ── Open: preferences submitted (Figma: Submitted) ──────────────────────
  {
    id: "w3",
    facilityName: "Advanced Clinical Experience Spring 2026",
    facilityLogo: logoUrl("mayoclinic.org"),
    location: "Rochester, MN",
    specialty: "Internal Medicine",
    dateRange: { start: new Date("2026-01-15"), end: new Date("2026-03-15") },
    dueDate: new Date("2026-02-15"),
    tab: "open",
    status: "preferences-submitted",
    programLabel: "PTP2 • PT Practice II (DPT 0762)",
    rotationTitle: "Advanced Clinical Experience Spring 2026",
    preferencesSubmitted: 5,
    preferencesSubmittedDate: new Date("2026-02-20"),
  },
  {
    id: "w4",
    facilityName: "Kaiser Permanente — Oakland",
    facilityLogo: logoUrl("kaiserpermanente.org"),
    location: "Oakland, CA",
    specialty: "Family Medicine",
    dateRange: { start: new Date("2026-05-18"), end: new Date("2026-06-12") },
    dueDate: new Date("2026-05-01"),
    tab: "open",
    status: "preferences-submitted",
    programLabel: "PTP4 • PT Practice IV (DPT 0764)",
    rotationTitle: "Family Medicine Clinical Rotation",
    preferencesSubmitted: 3,
    preferencesSubmittedDate: new Date("2026-04-28"),
  },
  // ── Closed: viewable submission (Figma) ───────────────────────────────────
  {
    id: "w5",
    facilityName: "Memorial Hospital",
    facilityLogo: logoUrl("memorialhermann.org"),
    location: "Houston, TX",
    specialty: "General Surgery",
    dateRange: { start: new Date("2025-12-01"), end: new Date("2026-01-15") },
    dueDate: new Date("2025-11-20"),
    tab: "closed",
    status: "viewable",
    programLabel: "PTP5 • PT Practice V (DPT 0765)",
    rotationTitle: "General Surgery Clinical Rotation Fall 2025",
  },
  // ── Closed: not viewable (Figma) ──────────────────────────────────────────
  {
    id: "w6",
    facilityName: "Children's Medical Center",
    facilityLogo: logoUrl("childrens.com"),
    location: "Dallas, TX",
    specialty: "Pediatric Nursing",
    dateRange: { start: new Date("2025-10-01"), end: new Date("2025-11-30") },
    dueDate: new Date("2025-09-15"),
    tab: "closed",
    status: "not-viewable",
    programLabel: "PTP6 • PT Practice VI (DPT 0766)",
    rotationTitle: "Pediatric Nursing Clinical Rotation Fall 2025",
  },
  {
    id: "w7",
    facilityName: "Baylor Scott & White",
    facilityLogo: logoUrl("bswhealth.com"),
    location: "Temple, TX",
    specialty: "Oncology Nursing",
    dateRange: { start: new Date("2025-09-01"), end: new Date("2025-10-31") },
    dueDate: new Date("2025-08-20"),
    tab: "closed",
    status: "not-viewable",
    programLabel: "PTP7 • PT Practice VII (DPT 0767)",
    rotationTitle: "Oncology Nursing Clinical Rotation Fall 2025",
  },
];
