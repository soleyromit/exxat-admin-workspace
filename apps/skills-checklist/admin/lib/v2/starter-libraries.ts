import type { Specialty } from "./types"

export interface StarterSkill {
  name: string
  category: string
  description: string
}

export interface StarterLibrary {
  specialty: Specialty
  label: string
  blurb: string
  skills: StarterSkill[]
}

/**
 * Sample starter lists. They are invented teaching content for the prototype, not clinical guidance, and nothing here is in the
 * program library until an administrator copies it. After copying, every skill is a normal program skill that can be edited.
 */
export const STARTER_LIBRARIES: StarterLibrary[] = [
  {
    specialty: "bsn-med-surg",
    label: "BSN medical-surgical",
    blurb: "Common bedside skills for a medical-surgical practicum.",
    skills: [
      { name: "Subcutaneous injection", category: "Medication", description: "Prepare and give a subcutaneous injection." },
      { name: "Intramuscular injection", category: "Medication", description: "Choose the site, prepare and give an intramuscular injection." },
      { name: "Tracheostomy suctioning", category: "Respiratory care", description: "Suction a tracheostomy using sterile technique." },
      { name: "Chest tube drainage care", category: "Respiratory care", description: "Monitor and document a chest drainage system." },
      { name: "Blood transfusion monitoring", category: "Medication", description: "Check, start and monitor a transfusion." },
      { name: "Wound irrigation", category: "Wound care", description: "Irrigate a wound and document its appearance." },
      { name: "Oral medication administration", category: "Medication", description: "Give oral medication using the rights of administration." },
      { name: "Vital signs and early warning score", category: "Assessment", description: "Take vital signs and score them." },
    ],
  },
  {
    specialty: "radiography",
    label: "Radiography",
    blurb: "Positioning, safety and mobile imaging skills.",
    skills: [
      { name: "Lower extremity positioning", category: "General radiography", description: "Position for knee, ankle and foot projections." },
      { name: "Abdomen radiograph positioning", category: "General radiography", description: "Position for supine and upright abdomen projections." },
      { name: "Cervical spine positioning", category: "General radiography", description: "Position for cervical spine series with trauma precautions." },
      { name: "Radiation dose documentation", category: "Radiation safety", description: "Record exposure factors and dose indicators." },
      { name: "Operating room C-arm use", category: "Mobile imaging", description: "Set up and operate a C-arm with the surgical team." },
      { name: "Patient shielding and dose records", category: "Radiation safety", description: "Shield the patient and record dose." },
    ],
  },
  {
    specialty: "surgical-tech",
    label: "Surgical technology",
    blurb: "Sterile technique and scrub role skills.",
    skills: [
      { name: "Back table setup", category: "Sterile technique", description: "Set up and organise the back table and Mayo stand." },
      { name: "Gloving another team member", category: "Sterile technique", description: "Open glove another team member without breaking sterility." },
      { name: "Suture preparation", category: "Scrub role", description: "Prepare and pass sutures and ties." },
      { name: "Surgical scrub and gowning", category: "Sterile technique", description: "Scrub, gown and glove." },
      { name: "Urinary catheter placement in surgery", category: "Perioperative care", description: "Place a urinary catheter under sterile conditions." },
      { name: "Endoscopic equipment handling", category: "Scrub role", description: "Assemble and handle a scope tower." },
    ],
  },
  {
    specialty: "paramedic",
    label: "Paramedic",
    blurb: "Field assessment and emergency care skills.",
    skills: [
      { name: "Cardiac arrest management", category: "Cardiac", description: "Lead compressions, airway and defibrillation roles." },
      { name: "Needle chest decompression", category: "Trauma", description: "Identify and perform needle decompression." },
      { name: "Rapid sequence airway preparation", category: "Airway", description: "Prepare drugs, equipment and monitoring." },
      { name: "Spinal motion restriction", category: "Trauma", description: "Apply spinal motion restriction." },
      { name: "Obstetric emergency delivery", category: "Operations", description: "Support an emergency field delivery." },
      { name: "Basic airway management", category: "Airway", description: "Open and maintain an airway with basic adjuncts." },
    ],
  },
]

export const STARTER_BY_SPECIALTY: Record<Specialty, StarterLibrary> = Object.fromEntries(STARTER_LIBRARIES.map((l) => [l.specialty, l])) as Record<Specialty, StarterLibrary>

export const SPECIALTY_LABEL: Record<Specialty, string> = Object.fromEntries(STARTER_LIBRARIES.map((l) => [l.specialty, l.label])) as Record<Specialty, string>
