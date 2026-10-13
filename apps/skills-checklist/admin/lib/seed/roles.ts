// OD-06 and OD-25 are OPEN. Roles and "which roles may sign off clinical vs lab evidence" are DATA.
// Seeded from the prototype (docs/build/contracts/S-13 §9): Clinical = Preceptor, Clinical faculty;
// Lab = Clinical faculty, Lab instructor. Sankalp has not confirmed this table [INFER].
import type { Role } from "@/lib/domain/types"
import type { RoleEvidenceMap } from "@/lib/engine"

export const ROLES: Role[] = [
  { id: "preceptor", label: "Preceptor" },
  { id: "clinical_faculty", label: "Clinical faculty" },
  { id: "lab_instructor", label: "Lab instructor" },
]

export const ROLE_EVIDENCE_MAP: RoleEvidenceMap = {
  preceptor: { clinical: true, lab: false },
  clinical_faculty: { clinical: true, lab: true },
  lab_instructor: { clinical: false, lab: true },
}
