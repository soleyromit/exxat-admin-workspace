/* Exxat Exam Management — Assessment Creation sample data + helpers.
   Faithful TypeScript port of the Claude Design data.jsx + helpers.jsx.
   Subject: Cardiovascular Pharmacology (MED-201, Year 2).
   Avatar identity colors converted hex → oklch (no hardcoded hex). */

// ───────────────────────── types ─────────────────────────
export type FacultyId = 'schen' | 'okafor' | 'nair' | 'reyes' | 'ta'
export interface Faculty { id: FacultyId; name: string; initials: string; role: string; color: string }

export type LifecycleState = 'planned' | 'draft' | 'review' | 'ready' | 'completed' | 'archived'
export type ReviewStatus = 'not-started' | 'in-progress' | 'submitted' | 'approved' | 'changes'
export type QTypeKey = 'mcq' | 'msq' | 'tf' | 'fitb' | 'match' | 'hotspot' | 'essay'
export type Difficulty = 'Easy' | 'Medium' | 'Hard'
export type QSource = 'manual' | 'bank' | 'ai' | 'copied'

export interface Psy { p: number; disc: number; pbi: number }
export interface QOption { text: string; correct: boolean }
export interface QPair { left: string; right: string }
export interface Grading {
  randomize?: boolean; lockLast?: boolean; negative?: boolean
  scoring?: string; match?: string; caseSensitive?: boolean; alts?: string
  partialPerPair?: boolean; extraDistractors?: boolean
  regions?: number; partial?: boolean
  wordLimit?: number; blindGrading?: boolean
  rubric?: { criterion: string; points: number }[]
}
export interface Question {
  id: string; type: QTypeKey; points: number; bonus: boolean
  topic: string; bloom: string; difficulty: Difficulty; source: QSource
  stem: string
  options?: QOption[]; answers?: string[]; pairs?: QPair[]; distractors?: string[]
  psy?: Psy; flagged?: { reason: string } | null
  grading?: Grading
}
export interface Section {
  id: string; name: string; owner: FacultyId
  reviewStatus: ReviewStatus; timeLimit: number; preRead: boolean
  questions: Question[]
}
export interface Assessment {
  id: string; name: string; course: string; type: 'Exam' | 'Quiz' | 'Assignment'
  state: LifecycleState; questions: number; points: number
  owner: FacultyId; collaborators: FacultyId[]; due: string; updated: string
  security: 'Secure' | 'Unsecure'; graded: boolean
}
export interface PastAssessment {
  id: string; name: string; course: string; sections: number; questions: number
  points: number; avgDiff: number; cohort: string; admins: number
  recommended: boolean; mix: Record<string, number>
}
export interface BankQuestion {
  id: string; type: QTypeKey; stem: string; topic: string; bloom: string
  difficulty: Difficulty; used: boolean; p: number; disc: number; pbi: number
}
export interface BuilderMeta {
  id: string; name: string; course: string; type: 'Exam' | 'Quiz' | 'Assignment'; graded: boolean
  intent?: string; audience?: string; owner: FacultyId; collaborators: FacultyId[]
  security: 'Secure' | 'Unsecure'; state: LifecycleState
}
export interface GeneratedQuestion {
  id: string; type: QTypeKey; points: number; difficulty: Difficulty
  bloom: string; topic: string; stem: string; options: QOption[]
}

// ───────────────────────── faculty ─────────────────────────
export const FACULTY: Record<FacultyId, Faculty> = {
  schen:  { id: 'schen',  name: 'Dr. Sarah Chen',   initials: 'SC', role: 'Course Coordinator', color: 'oklch(0.83 0.08 250)' },
  okafor: { id: 'okafor', name: 'Dr. James Okafor', initials: 'JO', role: 'Course Instructor',  color: 'oklch(0.70 0.17 354)' },
  nair:   { id: 'nair',   name: 'Dr. Priya Nair',   initials: 'PN', role: 'Course Instructor',  color: 'oklch(0.89 0.08 95)' },
  reyes:  { id: 'reyes',  name: 'Dr. Elena Reyes',  initials: 'ER', role: 'Chairperson',        color: 'oklch(0.76 0.11 300)' },
  ta:     { id: 'ta',     name: 'Marcus Webb',      initials: 'MW', role: 'Teaching Assistant', color: 'oklch(0.86 0.08 160)' },
}

// ───────────────────────── lifecycle ─────────────────────────
export const STATES: Record<LifecycleState, { label: string; chip: string }> = {
  planned:   { label: 'Planned',   chip: 'pending' },
  draft:     { label: 'Draft',     chip: 'pending' },
  review:    { label: 'In Review', chip: 'review'  },
  ready:     { label: 'Ready',     chip: 'active'  },
  completed: { label: 'Completed', chip: 'active'  },
  archived:  { label: 'Archived',  chip: 'muted'   },
}

export const QTYPE: Record<QTypeKey, { label: string; short: string; icon: string }> = {
  mcq:     { label: 'Multiple Choice',     short: 'MCQ',     icon: 'circle-dot' },
  msq:     { label: 'Multiple Select',     short: 'MSQ',     icon: 'square-check' },
  tf:      { label: 'True / False',        short: 'T/F',     icon: 'toggle-on' },
  fitb:    { label: 'Fill in the Blank',   short: 'FITB',    icon: 'i-cursor' },
  match:   { label: 'Match the Following', short: 'Match',   icon: 'right-left' },
  hotspot: { label: 'Hotspot Image',       short: 'Hotspot', icon: 'location-crosshairs' },
  essay:   { label: 'Essay',               short: 'Essay',   icon: 'pen-line' },
}

export function qIcon(type: QTypeKey | string): string {
  return ({ mcq: 'circle-dot', msq: 'square-check', tf: 'toggle-on', fitb: 'i-cursor', match: 'right-left', hotspot: 'location-crosshairs', essay: 'pen-line' } as Record<string, string>)[type] || 'circle'
}

// ───────────────────────── assessment list ─────────────────────────
export const ASSESSMENTS: Assessment[] = [
  { id: 'a1', name: 'Cardiovascular Pharmacology — Midterm', course: 'MED-201', type: 'Exam', state: 'draft', questions: 24, points: 100, owner: 'schen', collaborators: ['okafor', 'nair', 'ta'], due: '10/24/2026 09:00 AM EST', updated: 'now', security: 'Secure', graded: true },
  { id: 'a2', name: 'Antihypertensives — Weekly Quiz 4', course: 'MED-201', type: 'Quiz', state: 'ready', questions: 10, points: 20, owner: 'okafor', collaborators: [], due: '10/15/2026 11:59 PM EST', updated: '10/12/2026 03:21 PM EST', security: 'Unsecure', graded: false },
  { id: 'a3', name: 'Heart Failure Management — Remedial', course: 'MED-201', type: 'Quiz', state: 'planned', questions: 0, points: 0, owner: 'nair', collaborators: [], due: '11/02/2026 09:00 AM EST', updated: '10/10/2026 10:00 AM EST', security: 'Secure', graded: true },
  { id: 'a4', name: 'ECG Interpretation — Unit Exam', course: 'MED-201', type: 'Exam', state: 'review', questions: 30, points: 120, owner: 'okafor', collaborators: ['schen'], due: '10/28/2026 09:00 AM EST', updated: '10/13/2026 08:45 AM EST', security: 'Secure', graded: true },
  { id: 'a5', name: 'Anticoagulation Therapy — Final', course: 'MED-301', type: 'Exam', state: 'completed', questions: 40, points: 150, owner: 'schen', collaborators: ['nair', 'okafor'], due: '05/12/2026 09:00 AM EST', updated: '05/14/2026 02:00 PM EST', security: 'Secure', graded: true },
  { id: 'a6', name: 'Diuretics & Electrolytes — Midterm', course: 'MED-201', type: 'Exam', state: 'completed', questions: 28, points: 100, owner: 'schen', collaborators: ['nair'], due: '03/03/2026 09:00 AM EST', updated: '03/05/2026 11:00 AM EST', security: 'Secure', graded: true },
  { id: 'a7', name: 'Lipid-Lowering Agents — Spring Final', course: 'MED-201', type: 'Exam', state: 'archived', questions: 35, points: 120, owner: 'okafor', collaborators: ['schen', 'nair'], due: '05/20/2025 09:00 AM EST', updated: '06/01/2025 09:00 AM EST', security: 'Secure', graded: true },
]

// ───────────────────────── recyclable past assessments ─────────────────────────
export const PAST_ASSESSMENTS: PastAssessment[] = [
  { id: 'p1', name: 'Cardiovascular Pharmacology — Midterm (Fall 2025)', course: 'MED-201', sections: 3, questions: 26, points: 100, avgDiff: 0.64, cohort: 'Year 2 · Fall 2025', admins: 1, recommended: true, mix: { MCQ: 14, MSQ: 4, 'T/F': 3, Match: 2, Essay: 2, FITB: 1 } },
  { id: 'p2', name: 'Diuretics & Electrolytes — Midterm (Spring 2026)', course: 'MED-201', sections: 2, questions: 28, points: 100, avgDiff: 0.71, cohort: 'Year 2 · Spring 2026', admins: 1, recommended: false, mix: { MCQ: 18, MSQ: 3, 'T/F': 4, Match: 1, Essay: 2 } },
  { id: 'p3', name: 'Cardiovascular Pharmacology — Midterm (Fall 2024)', course: 'MED-201', sections: 3, questions: 24, points: 100, avgDiff: 0.58, cohort: 'Year 2 · Fall 2024', admins: 2, recommended: false, mix: { MCQ: 15, MSQ: 3, 'T/F': 2, Match: 2, Essay: 2 } },
]

// ───────────────────────── question bank (semantic search) ─────────────────────────
export const QUESTION_BANK: BankQuestion[] = [
  { id: 'qb1', type: 'mcq', stem: 'A patient on lisinopril develops a persistent dry cough. Which mediator is most responsible?', topic: 'ACE Inhibitors', bloom: 'Understand', difficulty: 'Medium', used: false, p: 0.68, disc: 0.41, pbi: 0.39 },
  { id: 'qb2', type: 'msq', stem: 'Select ALL beta-blockers that are cardioselective (β1-selective) at standard doses.', topic: 'Beta Blockers', bloom: 'Remember', difficulty: 'Medium', used: false, p: 0.55, disc: 0.46, pbi: 0.44 },
  { id: 'qb3', type: 'mcq', stem: 'Which calcium channel blocker is most likely to cause reflex tachycardia?', topic: 'Calcium Channel Blockers', bloom: 'Apply', difficulty: 'Hard', used: false, p: 0.47, disc: 0.38, pbi: 0.35 },
  { id: 'qb4', type: 'tf', stem: 'Spironolactone is a potassium-sparing diuretic that antagonizes aldosterone receptors.', topic: 'Diuretics', bloom: 'Remember', difficulty: 'Easy', used: true, p: 0.86, disc: 0.22, pbi: 0.25 },
  { id: 'qb5', type: 'mcq', stem: 'A patient with HFrEF is started on sacubitril/valsartan. What is the mechanism of the sacubitril component?', topic: 'Heart Failure', bloom: 'Understand', difficulty: 'Hard', used: false, p: 0.42, disc: 0.49, pbi: 0.47 },
  { id: 'qb6', type: 'match', stem: 'Match each antiarrhythmic to its Vaughan-Williams class.', topic: 'Antiarrhythmics', bloom: 'Remember', difficulty: 'Medium', used: false, p: 0.61, disc: 0.40, pbi: 0.38 },
  { id: 'qb7', type: 'mcq', stem: 'Which statin carries the highest risk of drug–drug interaction via CYP3A4?', topic: 'Lipid Management', bloom: 'Apply', difficulty: 'Medium', used: false, p: 0.59, disc: 0.43, pbi: 0.40 },
  { id: 'qb8', type: 'fitb', stem: 'The target INR range for a patient with a mechanical mitral valve on warfarin is ______ to ______.', topic: 'Anticoagulation', bloom: 'Remember', difficulty: 'Medium', used: false, p: 0.64, disc: 0.37, pbi: 0.34 },
  { id: 'qb9', type: 'mcq', stem: 'Loop diuretics exert their effect primarily on which segment of the nephron?', topic: 'Diuretics', bloom: 'Remember', difficulty: 'Easy', used: true, p: 0.81, disc: 0.29, pbi: 0.31 },
  { id: 'qb10', type: 'essay', stem: 'Compare the renal and hemodynamic effects of ACE inhibitors versus ARBs in a patient with diabetic nephropathy.', topic: 'ACE Inhibitors', bloom: 'Analyze', difficulty: 'Hard', used: false, p: 0.51, disc: 0.45, pbi: 0.42 },
  { id: 'qb11', type: 'mcq', stem: 'Digoxin toxicity is potentiated by which electrolyte abnormality?', topic: 'Heart Failure', bloom: 'Understand', difficulty: 'Medium', used: false, p: 0.63, disc: 0.42, pbi: 0.39 },
  { id: 'qb12', type: 'msq', stem: 'Select ALL agents that prolong the QT interval and require ECG monitoring.', topic: 'Antiarrhythmics', bloom: 'Apply', difficulty: 'Hard', used: false, p: 0.44, disc: 0.48, pbi: 0.45 },
]

// ───────────────────────── active assessment (a1) sections ─────────────────────────
export const SECTIONS: Section[] = [
  {
    id: 'secA', name: 'Section A — Antihypertensives & Diuretics', owner: 'schen',
    reviewStatus: 'in-progress', timeLimit: 30, preRead: true,
    questions: [
      { id: 'q1', type: 'mcq', points: 4, bonus: false, topic: 'ACE Inhibitors', bloom: 'Understand', difficulty: 'Medium', source: 'bank', stem: 'A 58-year-old man with hypertension and diabetes is started on an ACE inhibitor. Which of the following best explains its renoprotective effect?', options: [{ text: 'Dilation of the efferent arteriole, reducing intraglomerular pressure', correct: true }, { text: 'Constriction of the afferent arteriole, increasing filtration', correct: false }, { text: 'Direct inhibition of mesangial cell proliferation', correct: false }, { text: 'Increased aldosterone secretion promoting sodium retention', correct: false }], psy: { p: 0.66, disc: 0.42, pbi: 0.39 }, flagged: null, grading: { randomize: true, lockLast: false, negative: false } },
      { id: 'q2', type: 'msq', points: 5, bonus: false, topic: 'Beta Blockers', bloom: 'Remember', difficulty: 'Medium', source: 'bank', stem: 'Select ALL of the following beta-blockers that are considered cardioselective (β1-selective) at standard therapeutic doses.', options: [{ text: 'Metoprolol', correct: true }, { text: 'Atenolol', correct: true }, { text: 'Bisoprolol', correct: true }, { text: 'Propranolol', correct: false }, { text: 'Carvedilol', correct: false }], psy: { p: 0.54, disc: 0.46, pbi: 0.44 }, flagged: null, grading: { randomize: true, lockLast: false, scoring: 'partial-proportional' } },
      { id: 'q3', type: 'tf', points: 2, bonus: false, topic: 'Diuretics', bloom: 'Remember', difficulty: 'Easy', source: 'bank', stem: 'Thiazide diuretics act on the distal convoluted tubule and can cause hypercalcemia.', options: [{ text: 'True', correct: true }, { text: 'False', correct: false }], psy: { p: 0.83, disc: 0.18, pbi: -0.06 }, flagged: { reason: 'Negative point-biserial — high scorers are missing this item. Review wording or key.' }, grading: {} },
      { id: 'q4', type: 'fitb', points: 3, bonus: false, topic: 'Diuretics', bloom: 'Remember', difficulty: 'Medium', source: 'manual', stem: 'Loop diuretics such as furosemide inhibit the ______ cotransporter in the thick ascending limb of the loop of Henle.', answers: ['Na-K-2Cl', 'NKCC2', 'sodium-potassium-chloride'], psy: { p: 0.61, disc: 0.36, pbi: 0.33 }, flagged: null, grading: { match: 'contains', caseSensitive: false } },
      { id: 'q5', type: 'hotspot', points: 4, bonus: false, topic: 'Cardiac Anatomy', bloom: 'Apply', difficulty: 'Medium', source: 'ai', stem: 'On the diagram of the nephron, identify the primary site of action of loop diuretics.', psy: { p: 0.58, disc: 0.40, pbi: 0.37 }, flagged: null, grading: { regions: 1, partial: false } },
    ],
  },
  {
    id: 'secB', name: 'Section B — Antiarrhythmics & Heart Failure', owner: 'okafor',
    reviewStatus: 'submitted', timeLimit: 35, preRead: false,
    questions: [
      { id: 'q6', type: 'mcq', points: 4, bonus: false, topic: 'Antiarrhythmics', bloom: 'Apply', difficulty: 'Hard', source: 'bank', stem: 'A patient with atrial fibrillation and structural heart disease requires rhythm control. Which antiarrhythmic is contraindicated due to its proarrhythmic risk in this setting?', options: [{ text: 'Flecainide (Class IC)', correct: true }, { text: 'Amiodarone (Class III)', correct: false }, { text: 'Sotalol (Class III)', correct: false }, { text: 'Dofetilide (Class III)', correct: false }], psy: { p: 0.45, disc: 0.49, pbi: 0.47 }, flagged: null, grading: { randomize: true, lockLast: false, negative: true } },
      { id: 'q7', type: 'match', points: 6, bonus: false, topic: 'Antiarrhythmics', bloom: 'Remember', difficulty: 'Medium', source: 'bank', stem: 'Match each antiarrhythmic agent to its Vaughan-Williams classification.', pairs: [{ left: 'Lidocaine', right: 'Class IB' }, { left: 'Amiodarone', right: 'Class III' }, { left: 'Verapamil', right: 'Class IV' }, { left: 'Propranolol', right: 'Class II' }], distractors: ['Class IA'], psy: { p: 0.60, disc: 0.41, pbi: 0.38 }, flagged: null, grading: { partialPerPair: true, extraDistractors: true } },
      { id: 'q8', type: 'mcq', points: 4, bonus: false, topic: 'Heart Failure', bloom: 'Understand', difficulty: 'Hard', source: 'bank', stem: 'In a patient with HFrEF started on sacubitril/valsartan, what is the mechanism of the sacubitril component?', options: [{ text: 'Inhibits neprilysin, increasing natriuretic peptide levels', correct: true }, { text: 'Blocks the angiotensin II receptor', correct: false }, { text: 'Inhibits the funny current (If) in the SA node', correct: false }, { text: 'Antagonizes mineralocorticoid receptors', correct: false }], psy: { p: 0.41, disc: 0.51, pbi: 0.48 }, flagged: null, grading: { randomize: true, lockLast: false, negative: false } },
      { id: 'q9', type: 'mcq', points: 4, bonus: false, topic: 'Heart Failure', bloom: 'Understand', difficulty: 'Medium', source: 'ai', stem: 'Digoxin toxicity is most dangerously potentiated by which of the following electrolyte abnormalities?', options: [{ text: 'Hypokalemia', correct: true }, { text: 'Hyperkalemia', correct: false }, { text: 'Hypernatremia', correct: false }, { text: 'Hypermagnesemia', correct: false }], psy: { p: 0.92, disc: 0.09, pbi: 0.04 }, flagged: { reason: 'Near-zero discrimination and very high success rate — item may be too easy to differentiate students.' }, grading: { randomize: true, lockLast: false, negative: false } },
      { id: 'q10', type: 'essay', points: 8, bonus: false, topic: 'Heart Failure', bloom: 'Analyze', difficulty: 'Hard', source: 'manual', stem: 'A 72-year-old with HFrEF (EF 28%) remains symptomatic on an ACE inhibitor, beta-blocker, and loop diuretic. Outline your next pharmacologic steps and justify each choice with its mechanism and expected mortality benefit.', psy: { p: 0.49, disc: 0.44, pbi: 0.41 }, flagged: null, grading: { wordLimit: 400, blindGrading: true, rubric: [{ criterion: 'Identifies appropriate add-on therapy (MRA / SGLT2i / ARNI)', points: 3 }, { criterion: 'Correct mechanism of action for each agent', points: 3 }, { criterion: 'Cites mortality/morbidity evidence', points: 2 }] } },
    ],
  },
  {
    id: 'secC', name: 'Section C — Anticoagulation & Lipids', owner: 'nair',
    reviewStatus: 'not-started', timeLimit: 25, preRead: false,
    questions: [
      { id: 'q11', type: 'mcq', points: 4, bonus: false, topic: 'Anticoagulation', bloom: 'Apply', difficulty: 'Medium', source: 'bank', stem: 'A patient on warfarin needs an urgent reversal before emergency surgery. Which agent provides the most rapid and complete reversal?', options: [{ text: '4-factor prothrombin complex concentrate (PCC)', correct: true }, { text: 'Vitamin K (oral)', correct: false }, { text: 'Fresh frozen plasma', correct: false }, { text: 'Protamine sulfate', correct: false }], psy: { p: 0.57, disc: 0.43, pbi: 0.40 }, flagged: null, grading: { randomize: true, lockLast: true, negative: false } },
      { id: 'q12', type: 'fitb', points: 3, bonus: false, topic: 'Anticoagulation', bloom: 'Remember', difficulty: 'Medium', source: 'bank', stem: 'The target INR range for a patient with a mechanical mitral valve on warfarin is ______ to ______.', answers: ['2.5', '3.5'], psy: { p: 0.63, disc: 0.37, pbi: 0.34 }, flagged: null, grading: { match: 'exact', caseSensitive: false } },
      { id: 'q13', type: 'mcq', points: 4, bonus: true, topic: 'Lipid Management', bloom: 'Apply', difficulty: 'Hard', source: 'ai', stem: 'A patient on simvastatin is prescribed clarithromycin. Which interaction mechanism most increases the risk of rhabdomyolysis?', options: [{ text: 'CYP3A4 inhibition increasing statin plasma levels', correct: true }, { text: 'Induction of P-glycoprotein efflux', correct: false }, { text: 'Competitive renal tubular secretion', correct: false }, { text: 'Displacement from albumin binding sites', correct: false }], psy: { p: 0.52, disc: 0.45, pbi: 0.42 }, flagged: null, grading: { randomize: true, lockLast: false, negative: false } },
    ],
  },
]

// ───────────────────────── psychometric helpers ─────────────────────────
export interface PsyAgg { p: number; disc: number; pbi: number; upper: number; lower: number; covered: number }
export function aggregatePsy(questions: Question[]): PsyAgg {
  const withPsy = questions.filter(q => q.psy)
  const n = withPsy.length || 1
  const avg = (k: keyof Psy) => withPsy.reduce((s, q) => s + (q.psy ? q.psy[k] : 0), 0) / n
  const p = avg('p'), disc = avg('disc'), pbi = avg('pbi')
  const upper = Math.min(0.99, p + disc * 0.55)
  const lower = Math.max(0.05, p - disc * 0.55)
  return { p, disc, pbi, upper, lower, covered: withPsy.length }
}
export const fmtPct = (x: number) => Math.round(x * 100) + '%'
export const fmt2 = (x: number) => x.toFixed(2)
export const pbiColor = (v: number) => (v < 0.1 ? 'var(--destructive)' : v < 0.25 ? 'var(--chart-4)' : 'var(--chart-2)')
export const discColor = (v: number) => (v < 0.15 ? 'var(--destructive)' : v < 0.3 ? 'var(--chart-4)' : 'var(--chart-2)')
export const diffColor = (p: number) => (p > 0.9 || p < 0.3 ? 'var(--chart-4)' : 'var(--chart-2)')

export const totalQuestions = (sections: Section[]) => sections.reduce((s, sec) => s + sec.questions.length, 0)
export const totalPoints = (sections: Section[]) => sections.reduce((s, sec) => s + sec.questions.reduce((a, q) => a + (q.bonus ? 0 : q.points), 0), 0)
export function estTime(sections: Section[]): number {
  const per: Record<string, number> = { mcq: 1.2, msq: 1.6, tf: 0.6, fitb: 1.0, match: 2.0, hotspot: 1.5, essay: 8 }
  let m = 0
  sections.forEach(sec => sec.questions.forEach(q => { m += per[q.type] || 1.5 }))
  return Math.round(m)
}
export function flaggedCount(sections: Section[]): number {
  let c = 0
  sections.forEach(sec => sec.questions.forEach(q => { if (q.flagged) c++ }))
  return c
}

// Build a believable section/question set for any assessment in the list.
// a1 uses the hand-authored SECTIONS; others are generated from the bank.
export function sectionsForAssessment(a?: Assessment): Section[] {
  if (!a) return JSON.parse(JSON.stringify(SECTIONS))
  if (a.id === 'a1') return JSON.parse(JSON.stringify(SECTIONS))
  if (a.state === 'planned' || !a.questions) return []
  const owners: FacultyId[] = [a.owner, ...(a.collaborators || []), a.owner]
  const byTopic: Record<string, BankQuestion[]> = {}
  QUESTION_BANK.forEach(q => { (byTopic[q.topic] = byTopic[q.topic] || []).push(q) })
  const topics = Object.keys(byTopic)
  const nSec = Math.max(2, Math.min(3, Math.round(a.questions / 12)))
  const perSec = Math.ceil(a.questions / nSec)
  let made = 0
  const secs: Section[] = []
  for (let s = 0; s < nSec; s++) {
    const topic = topics[s % topics.length]
    const qs: Question[] = []
    for (let i = 0; i < perSec && made < a.questions; i++, made++) {
      const src = byTopic[topic][i % byTopic[topic].length]
      const flagged = (made === 2 && (a.id === 'a4' || a.id === 'a5')) ? { reason: 'Negative point-biserial — review wording or key.' } : null
      qs.push({
        id: `${a.id}q${made}`, type: src.type, points: src.type === 'essay' ? 8 : src.type === 'tf' ? 2 : 4,
        bonus: false, topic: src.topic, bloom: src.bloom, difficulty: src.difficulty,
        source: (['bank', 'manual', 'ai'] as QSource[])[made % 3], stem: src.stem,
        options: (src.type === 'mcq' || src.type === 'tf') ? [{ text: 'Correct option', correct: true }, { text: 'Distractor A', correct: false }, { text: 'Distractor B', correct: false }, { text: 'Distractor C', correct: false }] : (src.type === 'msq' ? [{ text: 'Correct A', correct: true }, { text: 'Correct B', correct: true }, { text: 'Distractor', correct: false }] : undefined),
        psy: flagged ? { p: 0.84, disc: 0.12, pbi: -0.05 } : { p: src.p, disc: src.disc, pbi: src.pbi },
        flagged, grading: { randomize: true },
      })
    }
    secs.push({ id: `${a.id}sec${s}`, name: `Section ${String.fromCharCode(65 + s)} — ${topic}`, owner: owners[s % owners.length] || a.owner, reviewStatus: a.state === 'review' ? (s === 0 ? 'submitted' : 'in-progress') : a.state === 'completed' ? 'approved' : 'in-progress', timeLimit: 25 + s * 5, preRead: s === 0, questions: qs })
  }
  return secs
}
