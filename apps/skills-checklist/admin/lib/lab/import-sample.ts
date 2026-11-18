/**
 * The lab's sample upload (D-ADD1117-x, Decided, Romit 2026-11-17: demo mode). In the lab, real file parsing is off: dropping or
 * choosing any file shows this sample, under its own name, never the uploaded file's name or content. Fictional, realistic:
 * 24 skills under four headings (Neurological is new to the program), one of them a library twin (Basic airway management) to show
 * the duplicate choice (D-ADD1117-z: a plain list, no triage cases).
 */
export const SAMPLE_FILE = "sample-nursing-skills.xlsx"

export const SAMPLE_TEXT = [
  "AIRWAY",
  "Basic airway management",
  "Suctioning, oral",
  "Tracheostomy suction and care",
  "Oxygen therapy via nasal cannula",
  "Incentive spirometry teaching",
  "Peak flow measurement",
  "CARDIAC",
  "Apical pulse assessment",
  "Peripheral pulse assessment",
  "Capillary refill check",
  "Cardiac monitor alarm response",
  "Orthostatic blood pressure",
  "Telemetry lead placement",
  "MEDICATION",
  "Insulin administration, subcutaneous",
  "IV piggyback setup",
  "Medication reconciliation",
  "Controlled substance count",
  "Intramuscular injection, ventrogluteal",
  "Enteral tube medication administration",
  "NEUROLOGICAL",
  "Glasgow Coma Scale scoring",
  "Pupil response check",
  "Seizure precautions setup",
  "Stroke scale screening",
  "Spinal precautions log roll",
  "Pain assessment using the FLACC scale",
].join("\n")
