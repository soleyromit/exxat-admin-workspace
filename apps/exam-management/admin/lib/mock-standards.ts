/**
 * Mock standards for NAPLEX and NCLEX blueprints.
 * Used for question → standard direct mapping (Phase 1 feature).
 * Decision source: fb9e76c2 — "We definitely want to give the ability for a user
 * to map the questions directly to the standards."
 */

export interface Standard {
  id: string
  code: string
  title: string
  framework: 'NAPLEX' | 'NCLEX' | 'NCCPA' | 'ACPE'
}

export const MOCK_STANDARDS: Standard[] = [
  { id: 'std-nap-1', code: 'Area 1', title: 'Obtain, interpret, or assess data', framework: 'NAPLEX' },
  { id: 'std-nap-2', code: 'Area 2', title: 'Identify drug characteristics', framework: 'NAPLEX' },
  { id: 'std-nap-3', code: 'Area 3', title: 'Develop or manage treatment plans', framework: 'NAPLEX' },
  { id: 'std-nap-4', code: 'Area 4', title: 'Perform calculations required for drug therapy', framework: 'NAPLEX' },
  { id: 'std-nap-5', code: 'Area 5', title: 'Compound, dispense, or administer drugs', framework: 'NAPLEX' },
  { id: 'std-nap-6', code: 'Area 6', title: 'Counsel patients or caregivers', framework: 'NAPLEX' },
  { id: 'std-nclex-1', code: 'Safety', title: 'Safety and infection control', framework: 'NCLEX' },
  { id: 'std-nclex-2', code: 'Pharm', title: 'Pharmacological and parenteral therapies', framework: 'NCLEX' },
  { id: 'std-nclex-3', code: 'Physio', title: 'Physiological adaptation', framework: 'NCLEX' },
  { id: 'std-nclex-4', code: 'Psych', title: 'Psychosocial integrity', framework: 'NCLEX' },
  { id: 'std-nclex-5', code: 'Health', title: 'Health promotion and maintenance', framework: 'NCLEX' },
]

/** Group standards by framework — used in UI pickers. */
export function groupedStandards(): Record<string, Standard[]> {
  return MOCK_STANDARDS.reduce<Record<string, Standard[]>>((acc, s) => {
    if (!acc[s.framework]) acc[s.framework] = []
    acc[s.framework].push(s)
    return acc
  }, {})
}
