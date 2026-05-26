import type { FolderNode, Question, Persona, Course, CourseOffering, Assessment } from './qb-types'

// ─── Folders (flattened — no offering nodes) ─────────────────────────────────

export const MOCK_QB_FOLDERS: FolderNode[] = [
  { id: 'phar101', name: 'PHAR101 Question Bank (QB)', parentId: null, count: 74, isCourse: true, collaborators: ['persona-thompson', 'persona-chen', 'persona-patel'] },
  { id: 'biol201', name: 'BIOL201 Question Bank (QB)', parentId: null, count: 58, isCourse: true, collaborators: ['persona-thompson', 'persona-chen'] },
  { id: 'skel101', name: 'SKEL101 Question Bank (QB)', parentId: null, count: 45, isCourse: true, collaborators: ['persona-thompson', 'persona-kim'] },

  // PHAR101 folders (directly under course)
  { id: 'phar101-antibiotics', name: 'Antibiotics & Antimicrobials', parentId: 'phar101', count: 18 },
  { id: 'phar101-analgesics',  name: 'Analgesics & Pain Management', parentId: 'phar101', count: 22 },
  { id: 'phar101-cardio',      name: 'Cardiovascular Drugs',         parentId: 'phar101', count: 18 },
  { id: 'phar101-cns',         name: 'CNS & Psychotropics',          parentId: 'phar101', count: 16, isPrivateSpace: true, collaborators: ['persona-chen'] },

  // BIOL201 folders
  { id: 'biol201-membrane',    name: 'Membrane Transport',  parentId: 'biol201', count: 13 },
  { id: 'biol201-mitosis',     name: 'Mitosis & Meiosis',   parentId: 'biol201', count: 13 },
  { id: 'biol201-mendelian',   name: 'Mendelian Genetics',  parentId: 'biol201', count: 16 },
  { id: 'biol201-molecular',   name: 'Molecular Biology',   parentId: 'biol201', count: 16, isPrivateSpace: true, collaborators: ['persona-thompson'] },

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

  // ── Additional course QBs ──────────────────────────────────────────────────

  // ANAT301 — Human Anatomy
  { id: 'anat301', name: 'ANAT301 Question Bank (QB)', parentId: null, count: 62, isCourse: true, collaborators: ['persona-thompson', 'persona-kim'] },
  { id: 'anat301-musculo',    name: 'Musculoskeletal System',   parentId: 'anat301', count: 18 },
  { id: 'anat301-neuro',      name: 'Neuroanatomy',             parentId: 'anat301', count: 14 },
  { id: 'anat301-cardio',     name: 'Cardiovascular Anatomy',   parentId: 'anat301', count: 12 },
  { id: 'anat301-gi',         name: 'GI & Abdominal Anatomy',   parentId: 'anat301', count: 10 },
  { id: 'anat301-head-neck',  name: 'Head & Neck',              parentId: 'anat301', count: 8 },
  { id: 'anat301-musculo-upper', name: 'Upper Limb',            parentId: 'anat301-musculo', count: 9 },
  { id: 'anat301-musculo-lower', name: 'Lower Limb',            parentId: 'anat301-musculo', count: 9 },

  // PHYS202 — Human Physiology
  { id: 'phys202', name: 'PHYS202 Question Bank (QB)', parentId: null, count: 55, isCourse: true, collaborators: ['persona-chen', 'persona-patel'] },
  { id: 'phys202-cardiac',    name: 'Cardiac Physiology',       parentId: 'phys202', count: 15 },
  { id: 'phys202-renal',      name: 'Renal Physiology',         parentId: 'phys202', count: 13 },
  { id: 'phys202-resp',       name: 'Respiratory Physiology',   parentId: 'phys202', count: 12 },
  { id: 'phys202-endo',       name: 'Endocrine Physiology',     parentId: 'phys202', count: 15 },
  { id: 'phys202-cardiac-ep', name: 'Electrophysiology',        parentId: 'phys202-cardiac', count: 7 },
  { id: 'phys202-cardiac-co', name: 'Cardiac Output & Preload', parentId: 'phys202-cardiac', count: 8 },

  // MICR301 — Microbiology & Immunology
  { id: 'micr301', name: 'MICR301 Question Bank (QB)', parentId: null, count: 48, isCourse: true, collaborators: ['persona-thompson', 'persona-chen'] },
  { id: 'micr301-bacteria',   name: 'Bacteriology',             parentId: 'micr301', count: 16 },
  { id: 'micr301-virology',   name: 'Virology',                 parentId: 'micr301', count: 14 },
  { id: 'micr301-immuno',     name: 'Immunology',               parentId: 'micr301', count: 12 },
  { id: 'micr301-mycology',   name: 'Mycology & Parasitology',  parentId: 'micr301', count: 6 },
  { id: 'micr301-bacteria-gpos', name: 'Gram-Positive Bacteria', parentId: 'micr301-bacteria', count: 8 },
  { id: 'micr301-bacteria-gneg', name: 'Gram-Negative Bacteria', parentId: 'micr301-bacteria', count: 8 },

  // CLIN401 — Clinical Assessment Skills
  { id: 'clin401', name: 'CLIN401 Question Bank (QB)', parentId: null, count: 39, isCourse: true, collaborators: ['persona-patel', 'persona-kim'] },
  { id: 'clin401-hx',         name: 'History Taking',           parentId: 'clin401', count: 10 },
  { id: 'clin401-exam',       name: 'Physical Examination',     parentId: 'clin401', count: 14 },
  { id: 'clin401-dx',         name: 'Diagnostic Reasoning',     parentId: 'clin401', count: 15 },
  { id: 'clin401-exam-cardio',name: 'Cardiovascular Exam',      parentId: 'clin401-exam', count: 6 },
  { id: 'clin401-exam-resp',  name: 'Respiratory Exam',         parentId: 'clin401-exam', count: 8 },

  // NURS210 — Nursing Assessment
  { id: 'nurs210', name: 'NURS210 Question Bank (QB)', parentId: null, count: 34, isCourse: true, collaborators: ['persona-thompson'] },
  { id: 'nurs210-assessment', name: 'Patient Assessment',       parentId: 'nurs210', count: 12 },
  { id: 'nurs210-pharm',      name: 'Pharmacology for Nurses',  parentId: 'nurs210', count: 10 },
  { id: 'nurs210-ethics',     name: 'Ethics & Legal',           parentId: 'nurs210', count: 7 },
  { id: 'nurs210-safety',     name: 'Patient Safety',           parentId: 'nurs210', count: 5 },
]

// ─── Questions ───────────────────────────────────────────────────────────────

export const MOCK_QB_QUESTIONS: Question[] = [
  {
    id: 'q-001', code: 'PH-ANT-001', version: 3, age: '8 months',
    title: 'Which beta-lactam antibiotic is most appropriate for a patient with penicillin allergy requiring coverage against Streptococcus pneumoniae?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    extraFolders: [{ folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport' }],
    tags: ['beta-lactam', 'allergy', 'streptococcus'], usage: 14, pbis: 0.41, pbisDir: 'up',
    creator: 'persona-admin', lastEditedBy: 'persona-chen',
    usedInSections: ['Midterm 2024', 'Final 2023'], pinned: true,
    layout: 'split' as const,
    stemText: 'A 68-year-old patient with reduced ejection fraction heart failure is started on metoprolol succinate. Which of the following best explains the long-term benefit of beta-blocker therapy in this condition?',
    options: [
      { key: 'A', text: 'Increased heart rate improves cardiac output', isCorrect: false, rationale: 'Beta-blockers reduce heart rate — the opposite effect. Increased HR worsens myocardial oxygen demand in heart failure.' },
      { key: 'B', text: 'Reverse remodeling reduces ventricular wall stress over time', isCorrect: true, rationaleAuthor: 'Dr. Sarah Chen', rationale: 'Chronic sympathetic blockade reduces myocardial oxygen demand and enables reverse remodeling — the ventricle decreases in volume and improves ejection fraction over 3–6 months. This is the mechanism behind improved survival in HFrEF.' },
      { key: 'C', text: 'Direct inotropic effect augments stroke volume', isCorrect: false, rationale: 'Beta-blockers are negative inotropes acutely. Long-term benefit is through neurohormonal blockade — a common misconception.' },
      { key: 'D', text: 'Peripheral vasodilation reduces afterload acutely', isCorrect: false, rationale: 'Afterload reduction is the mechanism of ACEi/ARBs. Some vasodilation occurs with carvedilol but it is not the primary or general mechanism.' },
    ],
    correctness: 71,
    avgTimeSeconds: 102,
    pValue: 0.71,
    totalAttempts: 186,
    optionDistribution: [
      { key: 'A', count: 11 },
      { key: 'B', count: 132 },
      { key: 'C', count: 29 },
      { key: 'D', count: 14 },
    ],
    versionHistory: [
      {
        version: 3,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2026-05-14',
        changes: ['Expanded rationale for option B — added reverse remodeling timeline detail', 'Added distractor rationales for A, C, D'],
        usedInAssessments: ['Cardiology Midterm — Spring 2026', 'Heart Failure Module Quiz'],
      },
      {
        version: 2,
        modifiedBy: 'Dr. James Wu',
        date: '2026-03-02',
        changes: ['Added option D (vasodilation distractor)', 'Reworded stem: "long-term benefit" clarified'],
        usedInAssessments: ['USMLE Step 1 Prep Bank'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2026-01-09',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Pharmacology Final — Fall 2025'],
      },
    ],
    collaborators: [
      { personaId: 'p1', role: 'owner' as const },
      { personaId: 'p2', role: 'edit' as const },
      { personaId: 'p3', role: 'view' as const },
      { personaId: 'p4', role: 'view' as const },
    ],
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
    creator: 'persona-admin', lastEditedBy: 'persona-admin',
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
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: [],
  },
  {
    id: 'q-006', code: 'PH-CV-001', version: 2, age: '6 months',
    title: 'Which class of antihypertensive agents is contraindicated in bilateral renal artery stenosis?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    extraFolders: [
      { folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials' },
      { folder: 'skel101-shoulder',    folderPath: 'SKEL101 QB / Shoulder Complex' },
    ],
    tags: ['hypertension', 'ACE-inhibitor', 'contraindication'], usage: 11, pbis: 0.37, pbisDir: 'up',
    creator: 'persona-admin', lastEditedBy: 'persona-admin',
    usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-007', code: 'PH-CV-002', version: 1, age: '5 months',
    title: 'Explain the Frank-Starling mechanism and its relevance to digoxin therapy in heart failure.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['heart-failure', 'digoxin', 'frank-starling'], usage: 3, pbis: 0.18, pbisDir: 'down',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 2'],
    layout: 'stacked' as const,
    stemText: 'Discuss the role of the renin-angiotensin-aldosterone system (RAAS) in the progression of heart failure. Include key mediators, their pathophysiological effects, and how current pharmacological interventions target this system.',
    minWordCount: 300,
    rubric: [
      { criterion: 'Identifies key RAAS mediators (renin, angiotensin II, aldosterone, ACE)', points: 3 },
      { criterion: 'Explains pathophysiological effects on preload, afterload, fibrosis, remodeling', points: 3 },
      { criterion: 'Describes ACEi/ARB/ARNi mechanism and clinical evidence', points: 2 },
      { criterion: 'Clarity, organization, appropriate medical terminology', points: 2 },
    ],
    correctness: null,
    avgTimeSeconds: 1110,
    totalAttempts: 42,
    versionHistory: [
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2026-04-01',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cardiology Final — Spring 2026', 'Clinical Reasoning Exam'],
      },
    ],
    collaborators: [
      { personaId: 'p1', role: 'owner' as const },
      { personaId: 'p3', role: 'view' as const },
    ],
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
    id: 'q-020', code: 'PH-CNS-002', version: 1, age: '5 days',
    title: 'Draft: Compare the receptor binding profiles of first- vs second-generation antipsychotics in relation to extrapyramidal side effects.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['antipsychotics', 'EPS', 'receptor'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: [],
  },
  {
    id: 'q-021', code: 'SK-EL-001', version: 1, age: '2 days',
    title: 'Draft: Describe the biomechanical forces acting on the ulnar collateral ligament during overhead throwing activities.',
    type: 'Fill blank', status: 'Draft', difficulty: 'Medium', blooms: 'Understand',
    folder: 'skel101-elbow', folderPath: 'SKEL101 QB / Elbow & Forearm',
    tags: ['UCL', 'elbow', 'throwing'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: [],
  },
  {
    id: 'q-008', code: 'BI-MEM-001', version: 5, age: '2 years',
    title: 'Which transport mechanism requires the direct hydrolysis of ATP to move substances against their concentration gradient?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    extraFolders: [{ folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs' }],
    tags: ['active-transport', 'ATP', 'gradient'], usage: 31, pbis: 0.52, pbisDir: 'flat',
    creator: 'persona-admin', lastEditedBy: 'persona-chen',
    usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 1'],
  },
  {
    id: 'q-009', code: 'BI-MIT-001', version: 2, age: '10 months',
    title: 'During which phase of meiosis does crossing over primarily occur, and what is its genetic significance?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'biol201-mitosis', folderPath: 'BIOL201 QB / Mitosis & Meiosis',
    extraFolders: [
      { folder: 'biol201-molecular', folderPath: 'BIOL201 QB / Molecular Biology' },
      { folder: 'biol201-mendelian', folderPath: 'BIOL201 QB / Mendelian Genetics' },
    ],
    tags: ['meiosis', 'crossing-over', 'genetics'], usage: 7, pbis: 0.33, pbisDir: 'up',
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: ['Quiz 2'],
  },
  {
    id: 'q-010', code: 'SK-SH-001', version: 3, age: '1 year',
    title: 'Identify the primary stabilizers of the glenohumeral joint and their functional roles during overhead activities.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    extraFolders: [{ folder: 'skel101-cervical', folderPath: 'SKEL101 QB / Cervical Spine' }],
    tags: ['glenohumeral', 'rotator-cuff', 'stabilization'], usage: 19, pbis: 0.44, pbisDir: 'flat',
    creator: 'persona-admin', lastEditedBy: 'persona-admin',
    usedInSections: ['Midterm 2024', 'Final 2023'], favorited: true,
  },
  // ── BIOL201 – Membrane Transport ──────────────────────────────────────────
  {
    id: 'q-011', code: 'BI-MEM-002', version: 2, age: '18 months',
    title: 'Describe the sodium-potassium pump and explain how it maintains the resting membrane potential.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Easy', blooms: 'Understand',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    tags: ['Na-K-pump', 'resting-potential', 'active-transport'], usage: 24, pbis: 0.51, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 1', 'Midterm 2024'],
  },
  {
    id: 'q-012', code: 'BI-MEM-003', version: 1, age: '6 months',
    title: 'Compare facilitated diffusion and active transport in terms of energy requirements and directionality.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Analyze',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    tags: ['facilitated-diffusion', 'active-transport', 'comparison'], usage: 8, pbis: 0.39, pbisDir: 'up',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 1'],
  },
  {
    id: 'q-013', code: 'BI-MEM-004', version: 1, age: '2 months',
    title: 'Match each membrane transport protein to its primary substrate and transport mechanism.',
    type: 'Matching', status: 'Draft', difficulty: 'Hard', blooms: 'Apply',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    tags: ['transport-proteins', 'channels', 'carriers'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  // ── BIOL201 – Mitosis & Meiosis ───────────────────────────────────────────
  {
    id: 'q-014', code: 'BI-MIT-002', version: 3, age: '14 months',
    title: 'Arrange the stages of mitosis in order and describe the key events occurring at each checkpoint.',
    type: 'Ordering', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'biol201-mitosis', folderPath: 'BIOL201 QB / Mitosis & Meiosis',
    tags: ['mitosis', 'cell-cycle', 'checkpoints'], usage: 28, pbis: 0.56, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Quiz 2', 'Midterm 2024'],
  },
  {
    id: 'q-015', code: 'BI-MIT-003', version: 2, age: '9 months',
    title: 'Nondisjunction during meiosis II in an otherwise normal cell produces which combination of gametes?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'biol201-mitosis', folderPath: 'BIOL201 QB / Mitosis & Meiosis',
    tags: ['nondisjunction', 'meiosis-II', 'gametes'], usage: 11, pbis: 0.28, pbisDir: 'down',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Final 2023'],
  },
  // ── BIOL201 – Mendelian Genetics ──────────────────────────────────────────
  {
    id: 'q-022', code: 'BI-GEN-001', version: 4, age: '2 years',
    title: 'In a dihybrid cross between two heterozygous parents, what is the expected phenotypic ratio of offspring?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Apply',
    folder: 'biol201-mendelian', folderPath: 'BIOL201 QB / Mendelian Genetics',
    tags: ['dihybrid', 'phenotype-ratio', 'mendel'], usage: 35, pbis: 0.62, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 3', 'Midterm 2024', 'Final 2023'],
  },
  {
    id: 'q-023', code: 'BI-GEN-002', version: 2, age: '11 months',
    title: 'Explain how incomplete dominance differs from codominance using the ABO blood type system as an example.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'biol201-mendelian', folderPath: 'BIOL201 QB / Mendelian Genetics',
    tags: ['incomplete-dominance', 'codominance', 'ABO'], usage: 16, pbis: 0.45, pbisDir: 'up',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 3'],
  },
  {
    id: 'q-024', code: 'BI-GEN-003', version: 1, age: '3 months',
    title: 'Construct a pedigree analysis for an autosomal recessive trait and calculate carrier probability for each unaffected individual.',
    type: 'Fill blank', status: 'Draft', difficulty: 'Hard', blooms: 'Create',
    folder: 'biol201-mendelian', folderPath: 'BIOL201 QB / Mendelian Genetics',
    tags: ['pedigree', 'autosomal-recessive', 'carrier'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-patel', lastEditedBy: 'persona-patel', usedInSections: [],
  },
  // ── BIOL201 – Molecular Biology ───────────────────────────────────────────
  {
    id: 'q-025', code: 'BI-MOL-001', version: 3, age: '16 months',
    title: 'Which enzyme is responsible for unwinding the DNA double helix ahead of the replication fork?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'biol201-molecular', folderPath: 'BIOL201 QB / Molecular Biology',
    tags: ['replication', 'helicase', 'DNA'], usage: 29, pbis: 0.58, pbisDir: 'flat',
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: ['Quiz 4', 'Final 2023'],
  },
  {
    id: 'q-026', code: 'BI-MOL-002', version: 2, age: '8 months',
    title: 'Compare the roles of DNA polymerase I and III in prokaryotic DNA replication.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Analyze',
    folder: 'biol201-molecular', folderPath: 'BIOL201 QB / Molecular Biology',
    tags: ['DNA-polymerase', 'replication', 'prokaryote'], usage: 13, pbis: 0.42, pbisDir: 'up',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 4'],
  },
  // ── SKEL101 – Shoulder Complex ────────────────────────────────────────────
  {
    id: 'q-027', code: 'SK-SH-002', version: 2, age: '8 months',
    title: 'Which rotator cuff muscle is most commonly involved in impingement syndrome, and what anatomical factors predispose it?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    tags: ['impingement', 'supraspinatus', 'rotator-cuff'], usage: 15, pbis: 0.38, pbisDir: 'flat',
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-028', code: 'SK-SH-003', version: 1, age: '4 months',
    title: 'Arrange the scapular stabilizing muscles in order of their activation sequence during arm elevation.',
    type: 'Ordering', status: 'Draft', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    tags: ['scapula', 'stabilizers', 'elevation'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: [],
  },
  // ── SKEL101 – Cervical Spine ──────────────────────────────────────────────
  {
    id: 'q-029', code: 'SK-CV-001', version: 2, age: '10 months',
    title: 'Identify the dermatomes affected by C5-C6 nerve root compression and their clinical presentation.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'skel101-cervical', folderPath: 'SKEL101 QB / Cervical Spine',
    tags: ['dermatome', 'nerve-root', 'cervical'], usage: 21, pbis: 0.47, pbisDir: 'up',
    creator: 'persona-admin', lastEditedBy: 'persona-kim', usedInSections: ['Final 2023', 'Midterm 2024'],
  },
  {
    id: 'q-030', code: 'SK-CV-002', version: 1, age: '5 months',
    title: 'Describe the Upper Crossed Syndrome postural pattern and its implications for cervical spine loading.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Create',
    folder: 'skel101-cervical', folderPath: 'SKEL101 QB / Cervical Spine',
    tags: ['upper-crossed', 'posture', 'cervical-loading'], usage: 6, pbis: 0.22, pbisDir: 'down',
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: ['Quiz 2'],
  },
  {
    id: 'q-031', code: 'SK-CV-003', version: 1, age: '1 month',
    title: 'Match each cervical special test (Spurling, Distraction, ULTT) to its target structure and positive finding criteria.',
    type: 'Matching', status: 'Draft', difficulty: 'Medium', blooms: 'Apply',
    folder: 'skel101-cervical', folderPath: 'SKEL101 QB / Cervical Spine',
    tags: ['special-tests', 'cervical', 'neurological'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: [],
  },
  // ── SKEL101 – Lumbar Spine ────────────────────────────────────────────────
  {
    id: 'q-032', code: 'SK-LM-001', version: 3, age: '1.5 years',
    title: 'Which lumbar stabilization muscles are targeted in a transverse abdominis activation exercise, and how is activation verified clinically?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'skel101-lumbar', folderPath: 'SKEL101 QB / Lumbar Spine',
    tags: ['transverse-abdominis', 'lumbar-stability', 'activation'], usage: 18, pbis: 0.49, pbisDir: 'flat',
    creator: 'persona-admin', lastEditedBy: 'persona-kim', usedInSections: ['Quiz 3', 'Final 2023'],
  },
  {
    id: 'q-033', code: 'SK-LM-002', version: 2, age: '7 months',
    title: 'Evaluate the evidence for McKenzie method versus stabilization exercises for chronic non-specific low back pain.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'skel101-lumbar', folderPath: 'SKEL101 QB / Lumbar Spine',
    tags: ['McKenzie', 'stabilization', 'evidence-based'], usage: 4, pbis: 0.19, pbisDir: 'down',
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: ['Final 2023'],
  },
  // ── PHAR101 – additional ──────────────────────────────────────────────────
  {
    id: 'q-034', code: 'PH-ANT-004', version: 1, age: '6 weeks',
    title: 'Rank the following beta-lactam antibiotics by their beta-lactamase stability: amoxicillin, piperacillin, imipenem, cephalexin.',
    type: 'Ordering', status: 'Draft', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['beta-lactamase', 'stability', 'ordering'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  {
    id: 'q-035', code: 'PH-CV-004', version: 2, age: '5 months',
    title: 'Match each antiarrhythmic drug class to its primary ion channel target and representative agent.',
    type: 'Matching', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['antiarrhythmic', 'ion-channel', 'Vaughan-Williams'], usage: 9, pbis: 0.36, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-patel', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-036', code: 'PH-CNS-003', version: 1, age: '2 months',
    title: 'A patient stabilized on lithium develops coarse tremor, confusion, and polyuria. Identify the likely diagnosis and immediate management.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['lithium-toxicity', 'tremor', 'management'], usage: 7, pbis: 0.31, pbisDir: 'up',
    creator: 'persona-chen', lastEditedBy: 'persona-thompson', usedInSections: ['Final 2023'],
  },
  {
    id: 'q-cns-archived-001', code: 'PH-CNS-004', version: 2, age: '5 months',
    title: 'Compare the pharmacokinetic profiles of haloperidol versus risperidone in elderly patients with dementia-related psychosis.',
    type: 'MCQ', status: 'Archived', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['haloperidol', 'risperidone', 'elderly', 'pharmacokinetics'], usage: 3, pbis: 0.22, pbisDir: 'down',
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: ['Midterm 2024'],
  },

  // ── Deep subfolder questions — depth 2: Gram-Positive Organisms ──
  {
    id: 'q-gpos-001', code: 'PH-GPO-001', version: 2, age: '6 months',
    title: 'Which cell wall component distinguishes Gram-positive organisms from Gram-negative bacteria on Gram staining?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'phar101-abx-gram-pos', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms',
    tags: ['gram-stain', 'cell-wall', 'peptidoglycan'], usage: 18, pbis: 0.44, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-gpos-002', code: 'PH-GPO-002', version: 1, age: '4 months',
    title: 'A culture returns Gram-positive cocci in clusters. Rank the following empirical antibiotics by spectrum against this organism: vancomycin, nafcillin, clindamycin.',
    type: 'Ordering', status: 'Saved', difficulty: 'Medium', blooms: 'Analyze',
    folder: 'phar101-abx-gram-pos', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms',
    tags: ['spectrum', 'gram-positive', 'cocci'], usage: 11, pbis: 0.38, pbisDir: 'up',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Final 2024'],
  },
  {
    id: 'q-gpos-003', code: 'PH-GPO-003', version: 3, age: '1 year',
    title: 'Teichoic acids in Gram-positive cell walls serve which primary immunological function?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Understand',
    folder: 'phar101-abx-gram-pos', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms',
    tags: ['teichoic-acid', 'immunology', 'virulence'], usage: 5, pbis: 0.27, pbisDir: 'down',
    creator: 'persona-patel', lastEditedBy: 'persona-thompson', usedInSections: [],
  },

  // ── depth 3: Staphylococcus Coverage ──
  {
    id: 'q-staph-001', code: 'PH-STA-001', version: 2, age: '8 months',
    title: 'A patient with a deep skin abscess has MSSA on culture. Which antibiotic provides the most appropriate definitive oral step-down therapy?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-abx-gpos-staph', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage',
    tags: ['MSSA', 'step-down', 'oral-therapy'], usage: 14, pbis: 0.42, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-patel', usedInSections: ['Midterm 2024', 'Final 2023'],
  },
  {
    id: 'q-staph-002', code: 'PH-STA-002', version: 1, age: '3 months',
    title: 'Compare the mechanisms of action of cefazolin vs. vancomycin against Staphylococcus aureus. Under what clinical scenario would you prefer one over the other?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-abx-gpos-staph', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage',
    tags: ['cefazolin', 'vancomycin', 'mechanism'], usage: 6, pbis: 0.33, pbisDir: 'flat',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },

  // ── depth 3: Streptococcus Coverage ──
  {
    id: 'q-strep-001', code: 'PH-STR-001', version: 2, age: '5 months',
    title: 'Which penicillin derivative provides the best coverage for Group A Streptococcus pharyngitis, and what is the recommended duration?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'phar101-abx-gpos-strep', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Streptococcus Coverage',
    tags: ['GAS', 'pharyngitis', 'penicillin'], usage: 20, pbis: 0.51, pbisDir: 'up',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-strep-002', code: 'PH-STR-002', version: 1, age: '7 months',
    title: 'A patient with penicillin allergy (anaphylaxis) requires treatment for streptococcal endocarditis. Select the most appropriate alternative regimen.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Apply',
    folder: 'phar101-abx-gpos-strep', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Streptococcus Coverage',
    tags: ['endocarditis', 'penicillin-allergy', 'alternative'], usage: 8, pbis: 0.35, pbisDir: 'down',
    creator: 'persona-patel', lastEditedBy: 'persona-chen', usedInSections: ['Final 2024'],
  },

  // ── depth 4: MRSA Protocols ──
  {
    id: 'q-mrsa-001', code: 'PH-MRS-001', version: 3, age: '10 months',
    title: 'A patient with hospital-acquired pneumonia has MRSA confirmed on BAL culture. Trough vancomycin is 12 mg/L. What is the next best step in optimizing therapy?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-abx-mrsa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols',
    tags: ['vancomycin', 'TDM', 'AUC-guided'], usage: 9, pbis: 0.29, pbisDir: 'up',
    creator: 'persona-chen', lastEditedBy: 'persona-patel', usedInSections: ['Final 2024'],
  },
  {
    id: 'q-mrsa-002', code: 'PH-MRS-002', version: 2, age: '4 months',
    title: 'Daptomycin is considered for MRSA bacteremia. Identify the condition in which daptomycin is contraindicated despite MRSA sensitivity.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-abx-mrsa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols',
    tags: ['daptomycin', 'contraindication', 'pneumonia'], usage: 12, pbis: 0.45, pbisDir: 'flat',
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Midterm 2024'],
  },

  // ── depth 4: MSSA Protocols ──
  {
    id: 'q-mssa-001', code: 'PH-MSA-001', version: 1, age: '6 months',
    title: 'For MSSA bacteremia, nafcillin is preferred over vancomycin. Explain the pharmacodynamic rationale for this preference.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'phar101-abx-mssa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MSSA Protocols',
    tags: ['nafcillin', 'bactericidal', 'beta-lactam-preference'], usage: 7, pbis: 0.38, pbisDir: 'up',
    creator: 'persona-patel', lastEditedBy: 'persona-patel', usedInSections: [],
  },
  {
    id: 'q-mssa-002', code: 'PH-MSA-002', version: 2, age: '9 months',
    title: 'A patient on nafcillin for MSSA endocarditis develops new-onset eosinophilia and rising creatinine on day 10. What is the most likely cause and how should therapy change?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-abx-mssa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MSSA Protocols',
    tags: ['nafcillin', 'nephrotoxicity', 'interstitial-nephritis'], usage: 4, pbis: 0.22, pbisDir: 'down',
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Final 2023'],
  },

  // ── depth 5: Combination Therapy (deepest level — demonstrates the UX issue) ──
  {
    id: 'q-combo-001', code: 'PH-CMB-001', version: 1, age: '2 months',
    title: 'A patient with persistent MRSA bacteremia on vancomycin monotherapy has rising MIC at 1.5 mg/L. Which combination regimen has evidence for use in refractory MRSA bacteremia?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-abx-mrsa-combo', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols / Combination Therapy',
    tags: ['refractory-MRSA', 'combination', 'vancomycin-MIC'], usage: 3, pbis: 0.19, pbisDir: 'down',
    creator: 'persona-thompson', lastEditedBy: 'persona-patel', usedInSections: ['Final 2024'],
    layout: 'stacked' as const,
    stemText: 'What is the approximate resting membrane potential of a typical ventricular cardiac myocyte at rest?',
    options: [
      { key: 'A', text: '−40 mV', isCorrect: false, rationale: '−40 mV is the threshold potential for action potential firing in SA node pacemaker cells, not the resting potential of ventricular myocytes.' },
      { key: 'B', text: '−90 mV', isCorrect: true, rationaleAuthor: 'Dr. James Wu', rationale: 'Ventricular myocytes have a resting potential of approximately −90 mV, maintained primarily by high K⁺ permeability through inward rectifier K⁺ channels (IK1).' },
      { key: 'C', text: '−70 mV', isCorrect: false, rationale: '−70 mV is the resting potential of neurons — a common neuroscience/cardiology confusion.' },
      { key: 'D', text: '−55 mV', isCorrect: false, rationale: 'Near the action potential threshold in neurons; does not represent the resting state of any cardiac cell type.' },
    ],
    correctness: 91,
    avgTimeSeconds: 24,
    pValue: 0.91,
    totalAttempts: 186,
    optionDistribution: [
      { key: 'A', count: 4 },
      { key: 'B', count: 170 },
      { key: 'C', count: 10 },
      { key: 'D', count: 2 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. James Wu',
        date: '2026-02-20',
        changes: ['Added "at rest" to stem for clarity', 'Added rationale for option B'],
        usedInAssessments: ['Cardiology Midterm — Spring 2026'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-11-14',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Heart Failure Quiz — Fall 2025'],
      },
    ],
    collaborators: [
      { personaId: 'p2', role: 'owner' as const },
      { personaId: 'p1', role: 'edit' as const },
    ],
  },
  {
    id: 'q-combo-002', code: 'PH-CMB-002', version: 1, age: '1 month',
    title: 'Outline the synergistic mechanism when rifampin is added to vancomycin for prosthetic valve MRSA endocarditis, and identify the major risk of this combination.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-abx-mrsa-combo', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols / Combination Therapy',
    tags: ['rifampin', 'synergy', 'biofilm', 'drug-interaction'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },
  // Untagged question — demonstrates ADR-003 "All Questions" location anchor
  {
    id: 'q-untagged-001', code: 'UNTAGGED-001', version: 1, age: '2 days',
    title: 'Draft: Compare the adverse effect profiles of first-generation vs atypical antipsychotics with respect to metabolic syndrome risk.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Analyze',
    folder: '', folderPath: '',
    tags: ['antipsychotics', 'metabolic', 'adverse-effects'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: [],
  },
]

// ─── Personas ────────────────────────────────────────────────────────────────
// Derived from the unified persona registry. Keep `id` lookups working for
// creator/lastEditedBy/collaborator references; display name/initials/role
// flow from one source of truth.
import { PERSONAS as GLOBAL_PERSONAS } from './personas'

export const MOCK_QB_PERSONAS: Persona[] = GLOBAL_PERSONAS.map(g => ({
  id:         g.id,
  name:       `${g.title} ${g.name}`.trim(),
  initials:   g.initials,
  role:       g.qbRole,
  color:      g.color,
  trustLevel: g.trustLevel,
}))

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
  { id: 'asmt-001', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Midterm Exam',  questionCount: 40, diffDistribution: { Easy: 10, Medium: 20, Hard: 10 }, durationMinutes: 90  },
  { id: 'asmt-002', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Final Exam',   questionCount: 60, diffDistribution: { Easy: 15, Medium: 25, Hard: 20 }, durationMinutes: 150 },
  { id: 'asmt-003', courseId: 'course-biol201', offeringId: 'offering-biol201-f25', title: 'Unit 1 Quiz',  questionCount: 20, diffDistribution: { Easy: 8,  Medium: 8,  Hard: 4  }, durationMinutes: 30  },
  // Previous-term assessments (Spring 2025) — used as copy sources in the Create Assessment modal
  { id: 'asmt-004', courseId: 'course-phar101', offeringId: 'offering-phar101-sp25', title: 'Midterm 1 — Spring 2025',      questionCount: 42, diffDistribution: { Easy: 12, Medium: 22, Hard: 8  }, durationMinutes: 90  },
  { id: 'asmt-005', courseId: 'course-phar101', offeringId: 'offering-phar101-sp25', title: 'Final Exam — Spring 2025',      questionCount: 58, diffDistribution: { Easy: 14, Medium: 26, Hard: 18 }, durationMinutes: 150 },
  { id: 'asmt-006', courseId: 'course-biol201', offeringId: 'offering-biol201-sp25', title: 'Midterm — Spring 2025',         questionCount: 35, diffDistribution: { Easy: 10, Medium: 18, Hard: 7  }, durationMinutes: 75  },
  { id: 'asmt-007', courseId: 'course-biol201', offeringId: 'offering-biol201-sp25', title: 'Lab Practical — Spring 2025',   questionCount: 25, diffDistribution: { Easy: 5,  Medium: 12, Hard: 8  }, durationMinutes: 45  },
]

// ─── Health flag helpers ──────────────────────────────────────────────────────

export const MOCK_POOR_PBIS_QUESTION_IDS = new Set([
  // Seeded IDs that simulate questions with low point-biserial
  'phar101-q006', 'phar101-q014', 'biol201-q003',
])

export const MOCK_MISSING_RATIONALE_QUESTION_IDS = new Set([
  'phar101-q008', 'phar101-q012', 'phar101-q019',
])

/** Returns health flags for a given set of selected question IDs */
export function computeHealthFlags(questionIds: string[]): import('./qb-types').QuestionHealthFlag[] {
  const flags: import('./qb-types').QuestionHealthFlag[] = []
  for (const qId of questionIds) {
    if (MOCK_MISSING_RATIONALE_QUESTION_IDS.has(qId)) {
      flags.push({ type: 'missing-rationale', questionId: qId })
    }
    if (MOCK_POOR_PBIS_QUESTION_IDS.has(qId)) {
      const q = MOCK_QB_QUESTIONS.find(q => q.id === qId)
      flags.push({ type: 'poor-pbis', questionId: qId, pbis: q?.pbis ?? 0.08 })
    }
  }
  return flags
}

// Mock previous-term assessments for "copy from previous" modal
// (these already exist — add pbisWarning field)
export const MOCK_COPY_SOURCES = [
  {
    id: 'asmt-004',
    courseId: 'course-phar101',
    title: 'Midterm 1 — Spring 2025',
    questionCount: 42,
    durationMinutes: 90,
    poorPbisCount: 3,    // used to show warning in copy modal
    sections: [
      { id: 'sec-sp25-1', title: "Dr. Mehra's Section", questionIds: [] },
      { id: 'sec-sp25-2', title: "Dr. Purani's Section", questionIds: [] },
    ],
  },
  {
    id: 'asmt-005',
    courseId: 'course-phar101',
    title: 'Final Exam — Spring 2025',
    questionCount: 58,
    durationMinutes: 150,
    poorPbisCount: 0,
    sections: [],
  },
]
