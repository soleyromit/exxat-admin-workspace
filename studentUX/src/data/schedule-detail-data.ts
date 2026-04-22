import type { ScheduleItem } from "./schedule-data";

export interface ScheduleRequirement {
  id: string;
  name: string;
  dueDate: string;
  status: "Get Started" | "Pending review" | "Approved" | "Need attention";
  required?: boolean;
}

export interface ScheduleDetail extends ScheduleItem {
  availabilityName?: string;
  address?: string;
  /** Map embed: lat/lng for address (e.g. Baltimore 39.29, -76.61) */
  addressLat?: number;
  addressLng?: number;
  /** Department/location: "Emergency Department" */
  department?: string;
  /** Department detail: "ED Resus Bay" */
  departmentDetail?: string;
  shift?: string;
  /** Days of week: M Tu W Th F Sa Su - selected = active */
  shiftDaysArray?: { label: string; active: boolean }[];
  /** Shift type and time: "7:00 am – 3:00 pm" */
  shiftTime?: string;
  /** Preceptor/doctor name */
  preceptorName?: string;
  /** Preceptor title: "Clinical Instructor · Emergency Medicine" */
  preceptorTitle?: string;
  /** Preceptor email */
  preceptorEmail?: string;
  onboardingRequirements: ScheduleRequirement[];
  ongoingRequirements: ScheduleRequirement[];
  offboardingRequirements: ScheduleRequirement[];
  progressApproved: number;
  progressPendingReview: number;
  progressNeedAttention: number;
}

const ONBOARDING_REQUIREMENTS: ScheduleRequirement[] = [
  { id: "r1", name: "Background Check", dueDate: "12/12/2026", status: "Get Started" },
  { id: "r2", name: "Clinic Dress Code Attestation", dueDate: "12/12/2026", status: "Get Started" },
  { id: "r3", name: "MMR", dueDate: "12/12/2026", status: "Get Started", required: true },
  { id: "r4", name: "Covid Policy Attestation", dueDate: "12/12/2026", status: "Get Started", required: true },
  { id: "r5", name: "Student Handbook Attestation", dueDate: "12/12/2026", status: "Get Started" },
  { id: "r6", name: "Photo Release Form", dueDate: "12/12/2026", status: "Get Started" },
  { id: "r7", name: "Harassment Attestation", dueDate: "12/12/2026", status: "Get Started" },
  { id: "r8", name: "Confidentiality Agreement Attestation", dueDate: "12/12/2026", status: "Get Started", required: true },
  { id: "r9", name: "CPR/BLS Certification", dueDate: "12/12/2026", status: "Pending review" },
  { id: "r10", name: "HIPAA Training", dueDate: "12/12/2026", status: "Approved" },
  { id: "r11", name: "Immunization Records", dueDate: "12/12/2026", status: "Need attention" },
  { id: "r12", name: "TB Test Results", dueDate: "12/12/2026", status: "Get Started" },
];

/** Surveys and compliance — extra requirements during rotation (in-process) */
const ONGOING_SURVEY_COMPLIANCE: ScheduleRequirement[] = [
  { id: "og1", name: "Mid-Rotation Site Survey", dueDate: "03/15/2026", status: "Get Started", required: true },
  { id: "og2", name: "Preceptor Evaluation", dueDate: "03/18/2026", status: "Pending review" },
  { id: "og3", name: "Clinical Hours Log", dueDate: "03/20/2026", status: "Approved" },
  { id: "og4", name: "Safety Compliance Checklist", dueDate: "03/22/2026", status: "Need attention", required: true },
  { id: "og5", name: "Patient Care Reflection", dueDate: "03/25/2026", status: "Get Started" },
  { id: "og6", name: "HIPAA Re-verification", dueDate: "03/28/2026", status: "Get Started" },
];

/** Offboarding formalities — requirements when rotation completes */
const OFFBOARDING_REQUIREMENTS: ScheduleRequirement[] = [
  { id: "ob1", name: "Final Site Evaluation", dueDate: "02/06/2026", status: "Approved", required: true },
  { id: "ob2", name: "Exit Interview Form", dueDate: "02/06/2026", status: "Approved", required: true },
  { id: "ob3", name: "Clinical Hours Verification", dueDate: "02/06/2026", status: "Approved" },
  { id: "ob4", name: "Certificate of Completion Request", dueDate: "02/10/2026", status: "Pending review" },
  { id: "ob5", name: "Preceptor Thank-You & Feedback", dueDate: "02/08/2026", status: "Approved" },
  { id: "ob6", name: "Site Badge Return Confirmation", dueDate: "02/06/2026", status: "Approved" },
];

export function getScheduleDetail(item: ScheduleItem): ScheduleDetail {
  const approved = item.board === "upcoming" ? 1 : item.board === "in-process" ? 4 : 12;
  const pending = item.board === "upcoming" ? 1 : item.board === "in-process" ? 2 : 0;
  const needAttention = item.board === "upcoming" ? 9 : item.board === "in-process" ? 2 : 0;

  const facilityLocation = item.location?.split(",")[0] ?? "Baltimore";
  return {
    ...item,
    availabilityName: `${facilityLocation}-Drayer PT 2024-2025`,
    address: `1234 Maple Avenue, ${item.location}`,
    addressLat: 39.29,
    addressLng: -76.61,
    department: item.specialty ?? "Emergency Department",
    departmentDetail: "ED Resus Bay",
    shift: "Day Shift",
    shiftDaysArray: [
      { label: "M", active: true },
      { label: "T", active: true },
      { label: "W", active: true },
      { label: "Th", active: true },
      { label: "F", active: true },
      { label: "Sa", active: false },
      { label: "Su", active: false },
    ],
    shiftTime: "7:00 am – 3:00 pm",
    preceptorName: "Dr. James Okafor",
    preceptorTitle: "Clinical Instructor · Emergency Medicine",
    preceptorEmail: "j.okafor@stmichaels.ca",
    onboardingRequirements: item.board === "completed"
      ? ONBOARDING_REQUIREMENTS.map((r) => ({ ...r, status: "Approved" as const }))
      : ONBOARDING_REQUIREMENTS,
    ongoingRequirements: item.board === "in-process" ? ONGOING_SURVEY_COMPLIANCE : [],
    offboardingRequirements: item.board === "completed" ? OFFBOARDING_REQUIREMENTS : [],
    progressApproved: approved,
    progressPendingReview: pending,
    progressNeedAttention: needAttention,
  };
}
