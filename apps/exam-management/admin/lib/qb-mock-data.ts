import type { FolderNode, Question, Persona, Course, CourseOffering, Assessment } from './qb-types'

// ─── Folders (flattened — no offering nodes) ─────────────────────────────────

export const MOCK_QB_FOLDERS: FolderNode[] = [
  { id: 'phar101', name: 'PHAR101 Question Bank (QB)', parentId: null, count: 74, isCourse: true, collaborators: ['persona-thompson', 'persona-chen', 'persona-patel'] },
  { id: 'biol201', name: 'BIOL201 Question Bank (QB)', parentId: null, count: 58, isCourse: true, collaborators: ['persona-thompson', 'persona-chen'] },
  { id: 'skel101', name: 'SKEL101 Question Bank (QB)', parentId: null, count: 45, isCourse: true, collaborators: ['persona-thompson'] },

  // PHAR101 folders (directly under course)
  { id: 'phar101-antibiotics', name: 'Antibiotics & Antimicrobials', parentId: 'phar101', count: 18 },
  { id: 'phar101-analgesics',  name: 'Analgesics & Pain Management', parentId: 'phar101', count: 22 },
  { id: 'phar101-cardio',      name: 'Cardiovascular Drugs',         parentId: 'phar101', count: 18 },
  { id: 'phar101-cns',         name: 'CNS & Psychotropics',          parentId: 'phar101', count: 16 },

  // BIOL201 folders
  { id: 'biol201-membrane',    name: 'Membrane Transport',  parentId: 'biol201', count: 13 },
  { id: 'biol201-mitosis',     name: 'Mitosis & Meiosis',   parentId: 'biol201', count: 13 },
  { id: 'biol201-mendelian',   name: 'Mendelian Genetics',  parentId: 'biol201', count: 16 },
  { id: 'biol201-molecular',   name: 'Molecular Biology',   parentId: 'biol201', count: 16 },

  // SKEL101 folders
  { id: 'skel101-shoulder',    name: 'Shoulder Complex', parentId: 'skel101', count: 11 },
  { id: 'skel101-elbow',       name: 'Elbow & Forearm',  parentId: 'skel101', count: 11 },
  { id: 'skel101-cervical',    name: 'Cervical Spine',   parentId: 'skel101', count: 13 },
  { id: 'skel101-lumbar',      name: 'Lumbar Spine',     parentId: 'skel101', count: 10 },

  // ── PHAR101 depth-2 subfolders (under Antibiotics & Antimicrobials) ──
  { id: 'phar101-abx-gram-pos',   name: 'Gram-Positive Organisms',     parentId: 'phar101-antibiotics', count: 8 },
  { id: 'phar101-abx-gram-neg',   name: 'Gram-Negative Organisms',     parentId: 'phar101-antibiotics', count: 7 },
  { id: 'phar101-abx-resistant',  name: 'Resistant Organisms',         parentId: 'phar101-antibiotics', count: 3 },

  // ── PHAR101 depth-3 subfolders ──
  { id: 'phar101-abx-gpos-staph', name: 'Staphylococcus Coverage',     parentId: 'phar101-abx-gram-pos', count: 4 },
  { id: 'phar101-abx-gpos-strep', name: 'Streptococcus Coverage',      parentId: 'phar101-abx-gram-pos', count: 4 },

  // ── PHAR101 depth-4 subfolders ──
  { id: 'phar101-abx-mrsa',       name: 'MRSA Protocols',              parentId: 'phar101-abx-gpos-staph', count: 2 },
  { id: 'phar101-abx-mssa',       name: 'MSSA Protocols',              parentId: 'phar101-abx-gpos-staph', count: 2 },

  // ── PHAR101 depth-5 subfolder ──
  { id: 'phar101-abx-mrsa-combo', name: 'Combination Therapy',         parentId: 'phar101-abx-mrsa', count: 1 },
]

// ─── Questions ───────────────────────────────────────────────────────────────

export const MOCK_QB_QUESTIONS: Question[] = [
  {
    id: 'q-001', code: 'PH-ANT-001', version: 3, age: '8 months',
    title: 'Which beta-lactam antibiotic is most appropriate for a patient with penicillin allergy requiring coverage against Streptococcus pneumoniae?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['beta-lactam', 'allergy', 'streptococcus'], usage: 14, pbis: 0.41, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-chen',
    usedInSections: ['Midterm 2024', 'Final 2023'], pinned: true,
  },
  {
    id: 'q-002', code: 'PH-ANT-002', version: 1, age: '2 months',
    title: 'Identify the mechanism by which methicillin-resistant Staphylococcus aureus (MRSA) evades beta-lactam antibiotics.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['MRSA', 'resistance', 'beta-lactam'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-003', code: 'PH-ANT-003', version: 2, age: '1 year',
    title: 'Arrange the following antibiotics in order of increasing spectrum: Amoxicillin, Vancomycin, Ciprofloxacin, Azithromycin.',
    type: 'Ordering', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['spectrum', 'ordering', 'gram-coverage'], usage: 9, pbis: 0.29, pbisDir: 'down',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson',
    usedInSections: ['Final 2023'], favorited: true,
  },
  {
    id: 'q-004', code: 'PH-ANA-001', version: 4, age: '14 months',
    title: 'A patient on chronic NSAID therapy presents with epigastric pain. Which concomitant medication is most appropriate?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Apply',
    folder: 'phar101-analgesics', folderPath: 'PHAR101 QB / Analgesics & Pain Management',
    tags: ['NSAID', 'GI-protection', 'PPI'], usage: 22, pbis: 0.48, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-patel',
    usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 3'], pinned: true,
  },
  {
    id: 'q-005', code: 'PH-ANA-002', version: 1, age: '3 weeks',
    title: 'Match each opioid analgesic to its primary receptor subtype and clinical indication.',
    type: 'Matching', status: 'Draft', difficulty: 'Medium', blooms: 'Remember',
    folder: 'phar101-analgesics', folderPath: 'PHAR101 QB / Analgesics & Pain Management',
    tags: ['opioids', 'receptor', 'matching'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-patel', lastEditedBy: 'persona-patel', usedInSections: [],
  },
  {
    id: 'q-006', code: 'PH-CV-001', version: 2, age: '6 months',
    title: 'Which class of antihypertensive agents is contraindicated in bilateral renal artery stenosis?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['hypertension', 'ACE-inhibitor', 'contraindication'], usage: 11, pbis: 0.37, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson',
    usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-007', code: 'PH-CV-002', version: 1, age: '5 months',
    title: 'Explain the Frank-Starling mechanism and its relevance to digoxin therapy in heart failure.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['heart-failure', 'digoxin', 'frank-starling'], usage: 3, pbis: 0.18, pbisDir: 'down',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 2'],
  },
  {
    id: 'q-018', code: 'PH-CV-003', version: 1, age: '1 month',
    title: 'Evaluate the pharmacokinetics of novel GLP-1 receptor agonists in patients with type 2 diabetes and concurrent renal impairment.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['GLP-1', 'pharmacokinetics', 'diabetes'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-019', code: 'PH-CNS-001', version: 1, age: '3 weeks',
    title: 'Design a treatment algorithm for a patient presenting with first-episode psychosis.',
    type: 'Fill blank', status: 'Draft', difficulty: 'Hard', blooms: 'Create',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['psychosis', 'treatment-algorithm'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-008', code: 'BI-MEM-001', version: 5, age: '2 years',
    title: 'Which transport mechanism requires the direct hydrolysis of ATP to move substances against their concentration gradient?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    tags: ['active-transport', 'ATP', 'gradient'], usage: 31, pbis: 0.52, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-chen', usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 1'],
  },
  {
    id: 'q-009', code: 'BI-MIT-001', version: 2, age: '10 months',
    title: 'During which phase of meiosis does crossing over primarily occur, and what is its genetic significance?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'biol201-mitosis', folderPath: 'BIOL201 QB / Mitosis & Meiosis',
    tags: ['meiosis', 'crossing-over', 'genetics'], usage: 7, pbis: 0.33, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Quiz 2'],
  },
  {
    id: 'q-010', code: 'SK-SH-001', version: 3, age: '1 year',
    title: 'Identify the primary stabilizers of the glenohumeral joint and their functional roles during overhead activities.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    tags: ['glenohumeral', 'rotator-cuff', 'stabilization'], usage: 19, pbis: 0.44, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson',
    usedInSections: ['Midterm 2024', 'Final 2023'], favorited: true,
  },
]

// ─── Personas ────────────────────────────────────────────────────────────────

export const MOCK_QB_PERSONAS: Persona[] = [
  { id: 'persona-thompson', name: 'Dr. Thompson', initials: 'DT', role: 'Admin',   color: 'var(--brand-color)',      trustLevel: 'senior' },
  { id: 'persona-chen',     name: 'Dr. Chen',     initials: 'SC', role: 'Admin',   color: 'var(--chart-1)',          trustLevel: 'mid' },
  { id: 'persona-patel',    name: 'Dr. Patel',    initials: 'JP', role: 'Faculty', color: 'var(--chart-2)',          trustLevel: 'junior', assignedFolders: ['phar101', 'biol201'] },
  { id: 'persona-kim',      name: 'Dr. Kim',      initials: 'MK', role: 'Faculty', color: 'var(--chart-4)',          assignedFolders: [] },
]

// ─── Courses ─────────────────────────────────────────────────────────────────

export const mockCourses: Course[] = [
  { id: 'course-phar101', code: 'PHAR101', name: 'Pharmacology I',    questionBankFolderId: 'phar101' },
  { id: 'course-biol201', code: 'BIOL201', name: 'Cell Biology',      questionBankFolderId: 'biol201' },
  { id: 'course-skel101', code: 'SKEL101', name: 'Skeletal Anatomy',  questionBankFolderId: 'skel101' },
]

export const mockCourseOfferings: CourseOffering[] = [
  { id: 'offering-phar101-f25', courseId: 'course-phar101', semester: 'Fall 2025',   studentCount: 48 },
  { id: 'offering-phar101-s26', courseId: 'course-phar101', semester: 'Spring 2026', studentCount: 52 },
  { id: 'offering-biol201-f25', courseId: 'course-biol201', semester: 'Fall 2025',   studentCount: 36 },
  { id: 'offering-biol201-s26', courseId: 'course-biol201', semester: 'Spring 2026', studentCount: 41 },
  { id: 'offering-skel101-f25', courseId: 'course-skel101', semester: 'Fall 2025',   studentCount: 28 },
]

export const mockAssessments: Assessment[] = [
  { id: 'asmt-001', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Midterm Exam',  questionCount: 40, diffDistribution: { Easy: 10, Medium: 20, Hard: 10 } },
  { id: 'asmt-002', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Final Exam',   questionCount: 60, diffDistribution: { Easy: 15, Medium: 25, Hard: 20 } },
  { id: 'asmt-003', courseId: 'course-biol201', offeringId: 'offering-biol201-f25', title: 'Unit 1 Quiz',  questionCount: 20, diffDistribution: { Easy: 8,  Medium: 8,  Hard: 4  } },
]
