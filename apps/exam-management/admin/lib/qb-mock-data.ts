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
    discriminationIndex: 0.45,
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
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-thompson', role: 'edit' as const },
      { personaId: 'persona-chen', role: 'view' as const },
      { personaId: 'persona-patel', role: 'view' as const },
    ],
  },
  {
    id: 'q-002', code: 'PH-ANT-002', version: 1, age: '2 months',
    title: 'Identify the mechanism by which methicillin-resistant Staphylococcus aureus (MRSA) evades beta-lactam antibiotics.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['MRSA', 'resistance', 'beta-lactam'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
    layout: 'stacked' as const,
    stemText: 'A 52-year-old patient is admitted with a wound infection that fails to improve on nafcillin. Blood cultures return positive for Staphylococcus aureus with reported methicillin resistance. Which of the following best explains the primary mechanism of resistance in MRSA?',
    options: [
      { key: 'A', text: 'Production of PBP2a (mecA-encoded), an altered penicillin-binding protein with low beta-lactam affinity', isCorrect: true, rationaleAuthor: 'Dr. S. Chen', rationale: 'MRSA acquires the mecA gene encoding PBP2a, which has dramatically reduced affinity for all beta-lactams including methicillin. Transpeptidase function is preserved via PBP2a, bypassing the drug target entirely — true target alteration.' },
      { key: 'B', text: 'Overexpression of efflux pumps (MexAB-OprM) that actively expel beta-lactam molecules', isCorrect: false, rationale: 'MexAB-OprM efflux is primarily a Pseudomonas aeruginosa resistance mechanism. MRSA does not rely significantly on efflux for beta-lactam resistance — mecA target alteration is the dominant mechanism.' },
      { key: 'C', text: 'Inducible beta-lactamase production that hydrolyzes the beta-lactam ring before it can bind PBP', isCorrect: false, rationale: 'Beta-lactamase (blaZ) does exist in some S. aureus, but it does not explain MRSA-level resistance. Beta-lactamase-stable drugs like nafcillin overcome this. MRSA resistance is mecA-mediated, not blaZ-mediated.' },
      { key: 'D', text: 'Loss of outer membrane porin channels preventing beta-lactam entry into the bacterial cell', isCorrect: false, rationale: 'Porin loss is a gram-negative resistance strategy (e.g., Klebsiella, Pseudomonas). Gram-positive organisms like S. aureus lack an outer membrane, so porin-based exclusion is mechanistically impossible.' },
    ],
    correctness: 61,
    avgTimeSeconds: 108,
    totalAttempts: 0,
    optionDistribution: [],
    versionHistory: [
      { version: 1, modifiedBy: 'Dr. S. Chen', date: '2026-03-15', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-chen', role: 'owner' as const }],
  },
  {
    id: 'q-003', code: 'PH-ANT-003', version: 2, age: '1 year',
    title: 'Arrange the following antibiotics in order of increasing spectrum: Amoxicillin, Vancomycin, Ciprofloxacin, Azithromycin.',
    type: 'Ordering', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['spectrum', 'ordering', 'gram-coverage'], usage: 9, pbis: 0.29, pbisDir: 'down',
    discriminationIndex: 0.28,
    creator: 'persona-admin', lastEditedBy: 'persona-admin',
    usedInSections: ['Final 2023'], favorited: true,
    layout: 'stacked' as const,
    stemText: 'Arrange the following antibiotics in order of increasing spectrum of antibacterial coverage (narrowest → broadest):',
    // For Ordering: options represent items in CORRECT sequence order. key = position label.
    options: [
      { key: '1', text: 'Vancomycin', isCorrect: true, rationale: 'Narrowest — gram-positive only (including MRSA). No gram-negative activity. Used for resistant gram-positive organisms when beta-lactams fail.' },
      { key: '2', text: 'Amoxicillin', isCorrect: true, rationale: 'Narrow but covers gram-positive cocci + some gram-negative rods (H. influenzae, E. coli sensitive strains). Common confusion: broader than Vancomycin on gram-negatives.' },
      { key: '3', text: 'Azithromycin', isCorrect: true, rationale: 'Broader gram-positive + strong atypical coverage (Mycoplasma, Legionella, Chlamydia). Also covers some gram-negatives. Common distractor: students place this before Amoxicillin.' },
      { key: '4', text: 'Ciprofloxacin', isCorrect: true, rationale: 'Broadest — strong gram-negative including Pseudomonas, moderate gram-positive, intracellular pathogens. Fluoroquinolone with the widest clinical spectrum of the four.' },
    ],
    correctness: 68,
    avgTimeSeconds: 95,
    totalAttempts: 185,
    versionHistory: [
      { version: 2, modifiedBy: 'Dr. James Wu', date: '2026-03-10', changes: ['Added individual rationale for each position to help students understand the reasoning'], usedInAssessments: ['Final 2023', 'Midterm 2024'] },
      { version: 1, modifiedBy: 'Dr. James Wu', date: '2025-09-01', isOriginal: true, changes: [], usedInAssessments: ['Final 2022'] },
    ],
    collaborators: [{ personaId: 'persona-admin', role: 'owner' as const }, { personaId: 'persona-thompson', role: 'edit' as const }],
  },
  {
    id: 'q-004', code: 'PH-ANA-001', version: 4, age: '14 months',
    title: 'A patient on chronic NSAID therapy presents with epigastric pain. Which concomitant medication is most appropriate?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Apply',
    folder: 'phar101-analgesics', folderPath: 'PHAR101 QB / Analgesics & Pain Management',
    tags: ['NSAID', 'GI-protection', 'PPI'], usage: 22, pbis: 0.48, pbisDir: 'flat',
    discriminationIndex: 0.52,
    creator: 'persona-thompson', lastEditedBy: 'persona-patel',
    usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 3'], pinned: true,
    layout: 'stacked' as const,
    stemText: 'A 55-year-old patient on chronic NSAID therapy for osteoarthritis presents with epigastric pain and nausea. Upper endoscopy shows superficial gastric erosions. Which concomitant medication is most appropriate to add?',
    options: [
      { key: 'A', text: 'Omeprazole (PPI)', isCorrect: true, rationaleAuthor: 'Dr. R. Thompson', rationale: 'PPIs are first-line for NSAID-induced gastropathy. They suppress gastric acid by irreversibly inhibiting H⁺/K⁺-ATPase, significantly reducing erosion risk and promoting mucosal healing.' },
      { key: 'B', text: 'Sucralfate', isCorrect: false, rationale: 'Sucralfate provides mucosal coating but does not reduce acid secretion. It is less effective than PPIs for NSAID-associated mucosal injury and lacks the prophylactic evidence base.' },
      { key: 'C', text: 'Antacids (aluminum hydroxide)', isCorrect: false, rationale: 'Antacids neutralize acid transiently but do not heal erosions or prevent recurrence. Insufficient for active NSAID-induced disease — only appropriate for symptomatic relief.' },
      { key: 'D', text: 'Misoprostol', isCorrect: false, rationale: 'Prostaglandin analogue with proven mucosal protection, but poor tolerability (diarrhea, cramping) makes it second-line. PPIs are preferred unless the patient is pregnant (misoprostol is used in obstetrics).' },
    ],
    correctness: 82,
    avgTimeSeconds: 58,
    totalAttempts: 412,
    versionHistory: [
      { version: 4, modifiedBy: 'Dr. M. Patel', date: '2026-01-15', changes: ['Added distractor rationales for B, C, D; expanded clinical context in stem'], usedInAssessments: ['Midterm 2024', 'Final 2023'] },
      { version: 3, modifiedBy: 'Dr. M. Patel', date: '2025-06-01', changes: ['Revised stem for clarity'], usedInAssessments: ['Midterm 2023'] },
      { version: 2, modifiedBy: 'Dr. R. Thompson', date: '2024-09-01', changes: ['Added option D (Misoprostol)'], usedInAssessments: [] },
      { version: 1, modifiedBy: 'Dr. R. Thompson', date: '2024-01-01', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-thompson', role: 'owner' as const }, { personaId: 'persona-chen', role: 'edit' as const }],
  },
  {
    id: 'q-005', code: 'PH-ANA-002', version: 1, age: '3 weeks',
    title: 'Match each opioid analgesic to its primary receptor subtype and clinical indication.',
    type: 'Matching', status: 'Draft', difficulty: 'Medium', blooms: 'Remember',
    folder: 'phar101-analgesics', folderPath: 'PHAR101 QB / Analgesics & Pain Management',
    tags: ['opioids', 'receptor', 'matching'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: [],
    layout: 'stacked' as const,
    stemText: 'Match each opioid analgesic (left) to its primary receptor subtype and principal clinical indication (right):',
    // For Matching: options = left-side prompts. key = prompt label, text = correct right-side match, rationale = explanation.
    options: [
      { key: 'A', text: 'Morphine → μ (mu) agonist → Acute severe pain (post-surgical, cancer)', isCorrect: true, rationale: 'Morphine is the prototypical full μ-agonist. Strong analgesic for acute severe pain. Ceiling effect absent — dose titration limited only by side effects (respiratory depression, constipation).' },
      { key: 'B', text: 'Buprenorphine → μ partial agonist / κ antagonist → Opioid use disorder, chronic pain', isCorrect: true, rationale: 'Partial agonist with high μ-receptor affinity — displaces full agonists. Used for OUD (Suboxone = buprenorphine + naloxone). Ceiling on respiratory depression makes it safer in overdose.' },
      { key: 'C', text: 'Tramadol → μ agonist + SNRI activity → Moderate chronic pain', isCorrect: true, rationale: 'Dual mechanism: weak μ-agonism + inhibits serotonin/norepinephrine reuptake. Lower abuse potential than morphine. Risk: serotonin syndrome when combined with SSRIs/MAOIs.' },
      { key: 'D', text: 'Nalbuphine → κ agonist / μ antagonist → Moderate pain, pruritus reversal', isCorrect: true, rationale: 'Mixed agonist-antagonist. κ activation provides analgesia; μ-blockade reverses μ-mediated respiratory depression and pruritus (e.g., epidural opioid side effects) without completely reversing analgesia.' },
    ],
    correctness: null,
    avgTimeSeconds: null,
    totalAttempts: 0,
    versionHistory: [
      { version: 1, modifiedBy: 'Dr. Admin', date: '2026-05-01', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-admin', role: 'owner' as const }],
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
    discriminationIndex: 0.32,
    creator: 'persona-admin', lastEditedBy: 'persona-admin',
    usedInSections: ['Midterm 2024'],
    layout: 'stacked' as const,
    stemText: 'A 67-year-old patient with hypertension and known bilateral renal artery stenosis presents for medication review. Her current regimen includes amlodipine 10 mg and hydrochlorothiazide 25 mg. Which of the following antihypertensive classes should be specifically avoided in this patient?',
    options: [
      { key: 'A', text: 'ACE inhibitors (e.g., lisinopril)', isCorrect: true, rationaleAuthor: 'Dr. Admin', rationale: 'ACE inhibitors — and ARBs — are contraindicated in bilateral renal artery stenosis. Both kidneys rely on angiotensin II to maintain efferent arteriolar tone and glomerular filtration pressure. Blocking angiotensin II drops GFR precipitously, causing acute kidney injury. This is a high-yield contraindication.' },
      { key: 'B', text: 'Dihydropyridine calcium channel blockers (e.g., amlodipine)', isCorrect: false, rationale: 'Calcium channel blockers are safe and commonly used in bilateral renal artery stenosis. They reduce peripheral vascular resistance without affecting the renin-angiotensin system, so they do not precipitate the AKI seen with ACE inhibitors.' },
      { key: 'C', text: 'Thiazide diuretics (e.g., hydrochlorothiazide)', isCorrect: false, rationale: 'Thiazides are generally safe in bilateral renal artery stenosis, though efficacy may be reduced in advanced renal insufficiency (eGFR < 30). They do not block the angiotensin II-dependent GFR preservation mechanism.' },
      { key: 'D', text: 'Beta-blockers (e.g., metoprolol)', isCorrect: false, rationale: 'Beta-blockers reduce renin secretion (via β1 blockade) and are appropriate in bilateral renal artery stenosis. They do not cause the acute efferent arteriolar vasodilation that leads to GFR collapse seen with ACE inhibitors.' },
    ],
    correctness: 74,
    avgTimeSeconds: 72,
    totalAttempts: 312,
    optionDistribution: [
      { key: 'A', count: 231 },
      { key: 'B', count: 34 },
      { key: 'C', count: 29 },
      { key: 'D', count: 18 },
    ],
    versionHistory: [
      { version: 2, modifiedBy: 'Dr. Admin', date: '2025-11-20', changes: ['Expanded clinical stem with patient context; added distractor rationales'], usedInAssessments: ['Midterm 2024'] },
      { version: 1, modifiedBy: 'Dr. Admin', date: '2025-06-01', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-admin', role: 'owner' as const }, { personaId: 'persona-patel', role: 'edit' as const }],
  },
  {
    id: 'q-007', code: 'PH-CV-002', version: 2, age: '5 months',
    title: 'Explain the Frank-Starling mechanism and its relevance to digoxin therapy in heart failure.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['heart-failure', 'digoxin', 'frank-starling'], usage: 3, pbis: 0.18, pbisDir: 'down',
    discriminationIndex: 0.17,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 2'],
    layout: 'stacked' as const,
    stemText: 'Explain the Frank-Starling mechanism and its clinical relevance to digoxin therapy in a patient with systolic heart failure and atrial fibrillation. In your response, describe the physiological basis, how digoxin modulates ventricular function, and why rate control matters in this context.',
    minWordCount: 300,
    rubric: [
      { criterion: 'Explains Frank-Starling mechanism (preload → stroke volume relationship)', points: 3 },
      { criterion: 'Describes digoxin mechanism: Na/K-ATPase inhibition → increased inotropy', points: 3 },
      { criterion: 'Addresses rate control in atrial fibrillation and its hemodynamic benefit', points: 2 },
      { criterion: 'Clarity, appropriate physiology/pharmacology terminology', points: 2 },
    ],
    correctness: null,
    avgTimeSeconds: 1110,
    totalAttempts: 42,
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Data quality fix',
        date: '2026-05-26',
        changes: ['Corrected stemText and rubric to match actual topic: Frank-Starling mechanism + digoxin therapy'],
        usedInAssessments: ['Cardiology Final — Spring 2026', 'Clinical Reasoning Exam'],
      },
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
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-chen', role: 'view' as const },
    ],
  },
  {
    id: 'q-018', code: 'PH-CV-003', version: 1, age: '1 month',
    title: 'Evaluate the pharmacokinetics of novel GLP-1 receptor agonists in patients with type 2 diabetes and concurrent renal impairment.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['GLP-1', 'pharmacokinetics', 'diabetes'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
    layout: 'stacked' as const,
    stemText: 'A 72-year-old patient with type 2 diabetes (HbA1c 9.2%) and stage 3b CKD (eGFR 32 mL/min) is being evaluated for GLP-1 receptor agonist therapy. Which of the following statements best describes the pharmacokinetic considerations for GLP-1 agonists in this patient?',
    options: [
      { key: 'A', text: 'Semaglutide requires significant dose reduction in moderate CKD because it is primarily eliminated renally via glomerular filtration', isCorrect: false, rationale: 'Incorrect. Semaglutide is primarily metabolized by proteolysis, not renal excretion. Clinical data show no clinically meaningful difference in exposure across renal function stages, including ESRD, making dose adjustment unnecessary.' },
      { key: 'B', text: 'GLP-1 agonists as a class are contraindicated when eGFR falls below 45 mL/min due to accumulation risk', isCorrect: false, rationale: 'This statement incorrectly generalizes across a heterogeneous drug class. Semaglutide is approved without renal dosing restrictions; exenatide (immediate-release) should be avoided below eGFR 30. Class-level contraindication does not apply.' },
      { key: 'C', text: 'Longer-acting agents like once-weekly semaglutide have similar pharmacokinetic profiles in CKD patients versus those with normal renal function, requiring no dose adjustment', isCorrect: true, rationaleAuthor: 'Dr. S. Chen', rationale: 'Semaglutide undergoes proteolytic degradation with small peptide fragments excreted renally. Phase 3 data in patients with severe CKD (including ESRD) showed no clinically significant difference in exposure. FDA label does not require renal dose adjustment for semaglutide.' },
      { key: 'D', text: 'All GLP-1 agonists carry equivalent risk of worsening acute kidney injury due to reduced renal perfusion from GI-mediated volume depletion', isCorrect: false, rationale: 'While GI side effects (nausea, vomiting, diarrhea) can cause dehydration and theoretically reduce renal perfusion, the cardiovascular outcome trials (SUSTAIN, LEADER) showed either neutral or protective renal effects for semaglutide and liraglutide. Blanket "equivalent risk" is not supported.' },
    ],
    correctness: null,
    avgTimeSeconds: null,
    totalAttempts: 0,
    versionHistory: [
      { version: 1, modifiedBy: 'Dr. S. Chen', date: '2026-04-28', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-chen', role: 'owner' as const }],
  },
  {
    id: 'q-019', code: 'PH-CNS-001', version: 1, age: '3 weeks',
    title: 'Design a treatment algorithm for a patient presenting with first-episode psychosis.',
    type: 'Fill blank', status: 'Draft', difficulty: 'Hard', blooms: 'Create',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['psychosis', 'treatment-algorithm'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
    layout: 'stacked' as const,
    stemText: 'A 22-year-old male is brought to the emergency department by his family after a 3-week history of increasingly disorganized speech, auditory hallucinations, and social withdrawal. He has no prior psychiatric history, denies substance use, and medical workup is unremarkable. Design a pharmacological treatment algorithm for this first-episode psychosis, addressing agent selection, dosing rationale, monitoring parameters, and criteria for treatment response at 6 weeks.',
    minWordCount: 400,
    rubric: [
      { criterion: 'Appropriate antipsychotic selection (atypical preferred, named agent with rationale)', points: 3 },
      { criterion: 'Starting dose, titration strategy, and rationale for low-dose initiation in first episode', points: 3 },
      { criterion: 'Monitoring plan: EPS, metabolic panel, prolactin, QTc — frequency specified', points: 2 },
      { criterion: 'Defines response criteria (≥20–50% symptom reduction on validated scale) and timeline', points: 2 },
    ],
    correctness: null,
    avgTimeSeconds: null,
    totalAttempts: 0,
    versionHistory: [
      { version: 1, modifiedBy: 'Dr. S. Chen', date: '2026-05-06', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-chen', role: 'owner' as const }],
  },
  {
    id: 'q-020', code: 'PH-CNS-002', version: 1, age: '5 days',
    title: 'Draft: Compare the receptor binding profiles of first- vs second-generation antipsychotics in relation to extrapyramidal side effects.',
    type: 'MCQ', status: 'Draft', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['antipsychotics', 'EPS', 'receptor'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: [],
    layout: 'stacked' as const,
    stemText: 'A patient on haloperidol develops acute dystonia on day 2 of treatment. His treatment is changed to quetiapine without recurrence. Which of the following best explains the lower risk of extrapyramidal side effects (EPS) with second-generation antipsychotics compared to first-generation agents?',
    options: [
      { key: 'A', text: 'Second-generation antipsychotics have lower overall CNS penetration, reducing nigrostriatal D2 receptor blockade', isCorrect: false, rationale: 'SGAs penetrate the CNS effectively — many have high lipophilicity. The difference is not overall penetration but regional receptor binding selectivity and the ratio of D2 to serotonin 5-HT2A blockade.' },
      { key: 'B', text: 'They preferentially bind limbic over striatal D2 receptors, reducing nigrostriatal motor pathway blockade', isCorrect: false, rationale: 'Limbic selectivity is partially true for some agents but is not the primary explanation for the reduced EPS. The dominant pharmacological explanation is the concurrent 5-HT2A antagonism, which modulates dopamine release in the striatum.' },
      { key: 'C', text: 'Concurrent 5-HT2A antagonism increases dopamine release in the nigrostriatal pathway, attenuating D2 blockade-induced EPS', isCorrect: true, rationaleAuthor: 'Dr. R. Thompson', rationale: '5-HT2A receptors on nigrostriatal dopaminergic neurons inhibit dopamine release. Blocking 5-HT2A disinhibits dopamine release in the striatum, partially counteracting D2 antagonism. This preserves motor function while maintaining antipsychotic efficacy. This is the core pharmacological rationale for the SGA EPS advantage.' },
      { key: 'D', text: 'They act as partial agonists at D2 receptors rather than full antagonists, allowing residual dopaminergic tone', isCorrect: false, rationale: 'Partial D2 agonism is specific to aripiprazole and brexpiprazole — not a class-wide property of SGAs. Quetiapine, olanzapine, and risperidone are D2 antagonists. The partial agonist mechanism does contribute to low EPS for aripiprazole specifically, but is not the explanation for the class difference.' },
    ],
    correctness: null,
    avgTimeSeconds: null,
    totalAttempts: 0,
    versionHistory: [
      { version: 1, modifiedBy: 'Dr. R. Thompson', date: '2026-05-22', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-thompson', role: 'owner' as const }],
  },
  {
    id: 'q-021', code: 'SK-EL-001', version: 1, age: '2 days',
    title: 'Draft: Describe the biomechanical forces acting on the ulnar collateral ligament during overhead throwing activities.',
    type: 'Fill blank', status: 'Draft', difficulty: 'Medium', blooms: 'Understand',
    folder: 'skel101-elbow', folderPath: 'SKEL101 QB / Elbow & Forearm',
    tags: ['UCL', 'elbow', 'throwing'], usage: 0, pbis: null, pbisDir: null,
    creator: 'persona-kim', lastEditedBy: 'persona-kim', usedInSections: [],
    layout: 'stacked' as const,
    stemText: 'Describe the biomechanical forces acting on the anterior bundle of the ulnar collateral ligament (UCL) during the late cocking and acceleration phases of overhead throwing. In your response, explain the valgus stress mechanism, the role of the flexor-pronator mass as a dynamic stabilizer, and the clinical consequence of chronic repetitive loading in overhead athletes.',
    minWordCount: 250,
    rubric: [
      { criterion: 'Accurately describes valgus torque at the medial elbow during late cocking (peak valgus stress phase)', points: 3 },
      { criterion: 'Explains flexor-pronator mass co-contraction as a secondary stabilizer reducing UCL load', points: 2 },
      { criterion: 'Links repetitive micro-trauma to progressive UCL attenuation and eventual partial/complete tear', points: 2 },
      { criterion: 'Uses appropriate biomechanical and anatomical terminology throughout', points: 1 },
    ],
    correctness: null,
    avgTimeSeconds: null,
    totalAttempts: 0,
    versionHistory: [
      { version: 1, modifiedBy: 'Dr. M. Kim', date: '2026-05-25', isOriginal: true, changes: [], usedInAssessments: [] },
    ],
    collaborators: [{ personaId: 'persona-kim', role: 'owner' as const }],
  },
  {
    id: 'q-008', code: 'BI-MEM-001', version: 5, age: '2 years',
    title: 'Which transport mechanism requires the direct hydrolysis of ATP to move substances against their concentration gradient?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    extraFolders: [{ folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs' }],
    tags: ['active-transport', 'ATP', 'gradient'], usage: 31, pbis: 0.52, pbisDir: 'flat',
    discriminationIndex: 0.48,
    creator: 'persona-admin', lastEditedBy: 'persona-chen',
    usedInSections: ['Midterm 2024', 'Final 2023', 'Quiz 1'],
    correctness: 84, avgTimeSeconds: 58, pValue: 0.84, totalAttempts: 248,
    stemText: 'Which transport mechanism requires the direct hydrolysis of ATP to move Na⁺ and K⁺ against their concentration gradients across the plasma membrane?',
    options: [
      { key: 'A', text: 'Facilitated diffusion via channel proteins', isCorrect: false, rationale: 'Facilitated diffusion moves solutes down their concentration gradient — no ATP required. Channel proteins create a hydrophilic pore but do not actively pump ions.' },
      { key: 'B', text: 'Primary active transport (Na⁺/K⁺-ATPase)', isCorrect: true, rationaleAuthor: 'Dr. Sarah Chen', rationale: 'The Na⁺/K⁺-ATPase directly hydrolyzes ATP to export 3 Na⁺ and import 2 K⁺ per cycle, maintaining the electrochemical gradient essential for neuronal function and cell volume regulation.' },
      { key: 'C', text: 'Secondary active transport (Na⁺-glucose symport)', isCorrect: false, rationale: 'Secondary active transport couples solute movement to the Na⁺ gradient established by the Na⁺/K⁺-ATPase — it exploits ATP indirectly, not directly.' },
      { key: 'D', text: 'Simple diffusion through lipid bilayer', isCorrect: false, rationale: 'Simple diffusion is a passive, ATP-independent process. Only small, nonpolar molecules cross the bilayer this way.' },
    ],
    optionDistribution: [
      { key: 'A', count: 18 },
      { key: 'B', count: 209 },
      { key: 'C', count: 15 },
      { key: 'D', count: 6 },
    ],
    versionHistory: [
      {
        version: 5,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2026-04-15',
        changes: ['Replaced generic stem with Na⁺/K⁺-ATPase specific context', 'Added rationaleAuthor attribution to option B'],
        usedInAssessments: ['Membrane Physiology Final — Spring 2026', 'Cell Biology Midterm 2026'],
      },
      {
        version: 4,
        modifiedBy: 'Dr. James Thompson',
        date: '2025-11-08',
        changes: ['Added option D (simple diffusion) as fourth distractor', 'Updated option C rationale for clarity'],
        usedInAssessments: ['Cell Biology Midterm 2025', 'USMLE Step 1 Prep Bank'],
      },
      {
        version: 3,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-06-20',
        changes: ['Rewrote all distractor rationales with mechanistic explanations'],
        usedInAssessments: ['Quiz 1 — Fall 2025'],
      },
      {
        version: 2,
        modifiedBy: 'Dr. James Thompson',
        date: '2025-01-14',
        changes: ['Added option C (secondary active transport) to increase difficulty', 'Reworded stem for specificity'],
        usedInAssessments: ['Membrane Transport Quiz — Spring 2025'],
      },
      {
        version: 1,
        modifiedBy: 'Prof. Admin',
        date: '2024-05-01',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Midterm 2024'],
      },
    ],
    collaborators: [
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-thompson', role: 'edit' as const },
      { personaId: 'persona-chen', role: 'edit' as const },
    ],
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
    discriminationIndex: 0.38,
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: ['Quiz 2'],
    correctness: 59, avgTimeSeconds: 94, pValue: 0.59, totalAttempts: 62,
    stemText: 'During which phase of meiosis does crossing over (homologous recombination) primarily occur, and what is the primary consequence for genetic diversity?',
    options: [
      { key: 'A', text: 'Prophase I — increases genetic variation by exchanging homologous segments', isCorrect: true, rationaleAuthor: 'Prof. Admin', rationale: 'Crossing over occurs during Prophase I at the chiasma between non-sister chromatids of homologous chromosome pairs, creating new allele combinations on each chromosome and increasing genetic diversity among gametes.' },
      { key: 'B', text: 'Metaphase II — random assortment of chromatids', isCorrect: false, rationale: 'Metaphase II involves alignment of chromosomes at the metaphase plate, but crossing over has already occurred. Random assortment occurs at Metaphase I, not II.' },
      { key: 'C', text: 'Anaphase I — separation of homologs reduces diversity', isCorrect: false, rationale: 'Anaphase I separates homologous chromosomes to opposite poles but does not produce crossing over. The crossing over that creates diversity already occurred in Prophase I.' },
      { key: 'D', text: 'Telophase II — recombination completes as nuclear envelopes reform', isCorrect: false, rationale: 'Telophase II is the final stage — cells are already haploid and recombination cannot occur here. Nuclear envelope reformation simply finalizes the division.' },
    ],
    optionDistribution: [
      { key: 'A', count: 37 },
      { key: 'B', count: 14 },
      { key: 'C', count: 8 },
      { key: 'D', count: 3 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Prof. Admin',
        date: '2025-10-30',
        changes: ['Added distractor rationales for B, C, D', 'Clarified "homologous recombination" in stem'],
        usedInAssessments: ['Genetics Quiz 2 — Spring 2026'],
      },
      {
        version: 1,
        modifiedBy: 'Prof. Admin',
        date: '2025-07-12',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cell Biology Quiz 2 — Fall 2025'],
      },
    ],
    collaborators: [
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-patel', role: 'view' as const },
    ],
  },
  {
    id: 'q-010', code: 'SK-SH-001', version: 3, age: '1 year',
    title: 'Identify the primary stabilizers of the glenohumeral joint and their functional roles during overhead activities.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    extraFolders: [{ folder: 'skel101-cervical', folderPath: 'SKEL101 QB / Cervical Spine' }],
    tags: ['glenohumeral', 'rotator-cuff', 'stabilization'], usage: 19, pbis: 0.44, pbisDir: 'flat',
    discriminationIndex: 0.41,
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
    discriminationIndex: 0.49,
    creator: 'persona-thompson', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 1', 'Midterm 2024'],
  },
  {
    id: 'q-012', code: 'BI-MEM-003', version: 1, age: '6 months',
    title: 'Compare facilitated diffusion and active transport in terms of energy requirements and directionality.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Analyze',
    folder: 'biol201-membrane', folderPath: 'BIOL201 QB / Membrane Transport',
    tags: ['facilitated-diffusion', 'active-transport', 'comparison'], usage: 8, pbis: 0.39, pbisDir: 'up',
    discriminationIndex: 0.35,
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
    discriminationIndex: 0.53,
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Quiz 2', 'Midterm 2024'],
    correctness: 79, avgTimeSeconds: 72, pValue: 0.79, totalAttempts: 196,
    stemText: 'Arrange the following stages of mitosis in their correct order, from the onset of cell division to the completion of cytokinesis.',
    options: [
      { key: '1', text: 'Prophase — chromatin condenses into visible chromosomes; spindle begins forming', isCorrect: true, rationale: 'Prophase is the first stage of mitosis. The nuclear envelope begins to break down and the mitotic spindle starts to assemble from centrosomes that have already duplicated in S phase.' },
      { key: '2', text: 'Metaphase — chromosomes align at the metaphase plate; checkpoint verifies spindle attachment', isCorrect: true, rationale: 'During metaphase, chromosomes line up at the cell equator. The spindle assembly checkpoint (SAC) ensures every kinetochore is attached to spindle fibers before anaphase is permitted.' },
      { key: '3', text: 'Anaphase — sister chromatids separate; pulled to opposite poles by shortening spindle fibers', isCorrect: true, rationale: 'Cohesins holding sister chromatids together are cleaved by separase (activated by APC/C). Kinetochore and polar microtubules shorten and lengthen respectively to move chromosomes to poles.' },
      { key: '4', text: 'Telophase — nuclear envelopes reform around each chromosome set; chromosomes decondense', isCorrect: true, rationale: 'Telophase reverses prophase: spindle disassembles, nuclear envelopes re-form from ER membranes, and chromosomes begin to decondense. Cytokinesis typically overlaps with late telophase.' },
      { key: '5', text: 'Cytokinesis — cleavage furrow (animals) or cell plate (plants) divides cytoplasm into two daughter cells', isCorrect: true, rationale: 'Cytokinesis completes physical cell division. In animal cells, an actin-myosin ring constricts inward. In plant cells, vesicles from the Golgi fuse to form a cell plate that expands outward.' },
    ],
    versionHistory: [
      {
        version: 3,
        modifiedBy: 'Dr. James Thompson',
        date: '2026-01-14',
        changes: ['Added checkpoint and molecular detail to each stage rationale', 'Expanded Anaphase option with cohesin/separase mechanism'],
        usedInAssessments: ['Cell Biology Midterm 2026', 'Mitosis Module Quiz'],
      },
      {
        version: 2,
        modifiedBy: 'Dr. James Thompson',
        date: '2025-08-20',
        changes: ['Added cytokinesis as 5th stage (was 4 stages)', 'Added plant vs animal comparison in cytokinesis rationale'],
        usedInAssessments: ['Quiz 2 — Fall 2025', 'Midterm 2024'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. James Thompson',
        date: '2025-02-28',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cell Biology Quiz 2 — Spring 2025'],
      },
    ],
    collaborators: [
      { personaId: 'persona-thompson', role: 'owner' as const },
      { personaId: 'persona-admin', role: 'view' as const },
    ],
  },
  {
    id: 'q-015', code: 'BI-MIT-003', version: 2, age: '9 months',
    title: 'Nondisjunction during meiosis II in an otherwise normal cell produces which combination of gametes?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'biol201-mitosis', folderPath: 'BIOL201 QB / Mitosis & Meiosis',
    tags: ['nondisjunction', 'meiosis-II', 'gametes'], usage: 11, pbis: 0.28, pbisDir: 'down',
    discriminationIndex: 0.26,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Final 2023'],
    correctness: 44, avgTimeSeconds: 135, pValue: 0.44, totalAttempts: 89,
    stemText: 'An otherwise normal human cell undergoes nondisjunction specifically during meiosis II in one secondary oocyte. What combination of gametes results from this cell and its counterpart?',
    options: [
      { key: 'A', text: '2 normal, 1 nullisomic, 1 disomic — from the unaffected secondary oocyte', isCorrect: true, rationaleAuthor: 'Dr. Sarah Chen', rationale: 'Meiosis II nondisjunction in one secondary oocyte produces one disomic gamete (n+1) and one nullisomic gamete (n−1) from that cell. The sister secondary oocyte proceeds normally, producing two haploid (n) gametes. Combined: 2 normal + 1 disomic + 1 nullisomic.' },
      { key: 'B', text: '4 aneuploid gametes (2 disomic, 2 nullisomic)', isCorrect: false, rationale: 'This would occur if nondisjunction happened in BOTH secondary oocytes during meiosis II. The question specifies only ONE secondary oocyte is affected — the other proceeds normally, producing two normal gametes.' },
      { key: 'C', text: '2 disomic, 2 nullisomic — from nondisjunction in meiosis I', isCorrect: false, rationale: 'If nondisjunction occurred in meiosis I (failure of homologs to separate), BOTH resulting secondary oocytes would be abnormal, ultimately yielding 2 disomic and 2 nullisomic gametes. The question specifies meiosis II nondisjunction.' },
      { key: 'D', text: '3 normal, 1 trisomic', isCorrect: false, rationale: 'A trisomic gamete (n+1) cannot exist alone without a corresponding nullisomic (n−1) from the same nondisjunction event. This answer does not correctly account for the chromosome distribution from nondisjunction in meiosis II.' },
    ],
    optionDistribution: [
      { key: 'A', count: 39 },
      { key: 'B', count: 28 },
      { key: 'C', count: 16 },
      { key: 'D', count: 6 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-11-18',
        changes: ['Added rationaleAuthor to correct option', 'Rewrote distractor C to address meiosis I vs II confusion explicitly'],
        usedInAssessments: ['Genetics Final — Spring 2026'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-08-05',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cell Biology Final 2023'],
      },
    ],
    collaborators: [
      { personaId: 'persona-chen', role: 'owner' as const },
      { personaId: 'persona-thompson', role: 'edit' as const },
    ],
  },
  // ── BIOL201 – Mendelian Genetics ──────────────────────────────────────────
  {
    id: 'q-022', code: 'BI-GEN-001', version: 4, age: '2 years',
    title: 'In a dihybrid cross between two heterozygous parents, what is the expected phenotypic ratio of offspring?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Apply',
    folder: 'biol201-mendelian', folderPath: 'BIOL201 QB / Mendelian Genetics',
    tags: ['dihybrid', 'phenotype-ratio', 'mendel'], usage: 35, pbis: 0.62, pbisDir: 'flat',
    discriminationIndex: 0.58,
    creator: 'persona-thompson', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 3', 'Midterm 2024', 'Final 2023'],
    correctness: 88, avgTimeSeconds: 45, pValue: 0.88, totalAttempts: 312,
    stemText: 'Two heterozygous parents (AaBb × AaBb) with independently assorting genes are crossed. What is the expected phenotypic ratio among offspring?',
    options: [
      { key: 'A', text: '9:3:3:1', isCorrect: true, rationaleAuthor: 'Dr. James Thompson', rationale: 'For a dihybrid cross AaBb × AaBb with independent assortment, Mendel\'s law predicts 9 (A_B_) : 3 (A_bb) : 3 (aaB_) : 1 (aabb). This 9:3:3:1 ratio is the hallmark of two independently assorting gene pairs.' },
      { key: 'B', text: '1:2:1', isCorrect: false, rationale: 'A 1:2:1 phenotypic ratio describes a monohybrid cross with incomplete dominance (e.g., Aa × Aa where Aa has a distinct phenotype). For a standard dihybrid cross with full dominance, the ratio is 9:3:3:1.' },
      { key: 'C', text: '3:1', isCorrect: false, rationale: 'A 3:1 ratio is the phenotypic outcome of a monohybrid cross (Aa × Aa) — one gene, two alleles. When two genes are involved with independent assortment, the ratio expands to 9:3:3:1.' },
      { key: 'D', text: '1:1:1:1', isCorrect: false, rationale: 'A 1:1:1:1 ratio results from a test cross of a dihybrid (AaBb × aabb), not from crossing two heterozygous parents. The question specifies both parents are heterozygous (AaBb × AaBb).' },
    ],
    optionDistribution: [
      { key: 'A', count: 274 },
      { key: 'B', count: 19 },
      { key: 'C', count: 14 },
      { key: 'D', count: 5 },
    ],
    versionHistory: [
      {
        version: 4,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2026-02-10',
        changes: ['Added distractor rationales for B, C, D with mechanism explanation', 'Clarified "independently assorting" in stem'],
        usedInAssessments: ['Genetics Midterm — Spring 2026', 'Mendelian Genetics Module Quiz'],
      },
      {
        version: 3,
        modifiedBy: 'Dr. James Thompson',
        date: '2025-09-05',
        changes: ['Rewrote stem to specify AaBb notation explicitly', 'Added rationaleAuthor for option A'],
        usedInAssessments: ['Quiz 3 — Fall 2025', 'Final 2023'],
      },
      {
        version: 2,
        modifiedBy: 'Dr. James Thompson',
        date: '2025-01-20',
        changes: ['Replaced distractor B (was "2:1:1") with "1:2:1" to test incomplete dominance confusion'],
        usedInAssessments: ['Midterm 2024'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. James Thompson',
        date: '2024-03-15',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cell Biology Final 2024'],
      },
    ],
    collaborators: [
      { personaId: 'persona-thompson', role: 'owner' as const },
      { personaId: 'persona-chen', role: 'edit' as const },
      { personaId: 'persona-admin', role: 'view' as const },
    ],
  },
  {
    id: 'q-023', code: 'BI-GEN-002', version: 2, age: '11 months',
    title: 'Explain how incomplete dominance differs from codominance using the ABO blood type system as an example.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'biol201-mendelian', folderPath: 'BIOL201 QB / Mendelian Genetics',
    tags: ['incomplete-dominance', 'codominance', 'ABO'], usage: 16, pbis: 0.45, pbisDir: 'up',
    discriminationIndex: 0.43,
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
    discriminationIndex: 0.55,
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: ['Quiz 4', 'Final 2023'],
    correctness: 91, avgTimeSeconds: 38, pValue: 0.91, totalAttempts: 224,
    stemText: 'During prokaryotic DNA replication, which enzyme breaks the hydrogen bonds between base pairs to unwind the double helix ahead of the replication fork?',
    options: [
      { key: 'A', text: 'Helicase', isCorrect: true, rationaleAuthor: 'Prof. Admin', rationale: 'DNA helicase uses ATP hydrolysis to break hydrogen bonds between complementary base pairs, unwinding the double helix and generating the single-stranded template ahead of the replication fork. Topoisomerase relieves the supercoiling tension created downstream.' },
      { key: 'B', text: 'Primase', isCorrect: false, rationale: 'Primase synthesizes the short RNA primer that provides a free 3′-OH end for DNA polymerase III to extend — it does not unwind the helix. Primers are later removed by DNA polymerase I.' },
      { key: 'C', text: 'DNA ligase', isCorrect: false, rationale: 'DNA ligase joins Okazaki fragments on the lagging strand by sealing the nick between adjacent fragments — a joining function, not a helix-unwinding function.' },
      { key: 'D', text: 'DNA polymerase III', isCorrect: false, rationale: 'DNA polymerase III synthesizes the new strand in the 5′→3′ direction by adding dNTPs to the primer — it does not unwind the template. It requires an unwound single-stranded template to function.' },
    ],
    optionDistribution: [
      { key: 'A', count: 204 },
      { key: 'B', count: 12 },
      { key: 'C', count: 5 },
      { key: 'D', count: 3 },
    ],
    versionHistory: [
      {
        version: 3,
        modifiedBy: 'Prof. Admin',
        date: '2025-12-03',
        changes: ['Added rationaleAuthor to option A', 'Expanded all distractor rationales with enzymatic mechanism detail'],
        usedInAssessments: ['Molecular Biology Final — Spring 2026'],
      },
      {
        version: 2,
        modifiedBy: 'Prof. Admin',
        date: '2025-05-18',
        changes: ['Added topoisomerase aside in option A rationale', 'Reordered distractors for better difficulty gradient'],
        usedInAssessments: ['Quiz 4 — Fall 2025', 'Final 2023'],
      },
      {
        version: 1,
        modifiedBy: 'Prof. Admin',
        date: '2024-09-10',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cell Biology Final 2024'],
      },
    ],
    collaborators: [
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-thompson', role: 'view' as const },
    ],
  },
  {
    id: 'q-026', code: 'BI-MOL-002', version: 2, age: '8 months',
    title: 'Compare the roles of DNA polymerase I and III in prokaryotic DNA replication.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Analyze',
    folder: 'biol201-molecular', folderPath: 'BIOL201 QB / Molecular Biology',
    tags: ['DNA-polymerase', 'replication', 'prokaryote'], usage: 13, pbis: 0.42, pbisDir: 'up',
    discriminationIndex: 0.40,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Quiz 4'],
    correctness: 67, avgTimeSeconds: 88, pValue: 0.67, totalAttempts: 104,
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2026-01-22',
        changes: ['Added comparison table format to stem', 'Introduced distractor C (DNA pol III removes primers — common misconception)'],
        usedInAssessments: ['Molecular Biology Quiz 4 — Spring 2026'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-09-30',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cell Biology Quiz 4 — Fall 2025'],
      },
    ],
    collaborators: [
      { personaId: 'persona-chen', role: 'owner' as const },
      { personaId: 'persona-admin', role: 'view' as const },
    ],
  },
  // ── SKEL101 – Shoulder Complex ────────────────────────────────────────────
  {
    id: 'q-027', code: 'SK-SH-002', version: 2, age: '8 months',
    title: 'Which rotator cuff muscle is most commonly involved in impingement syndrome, and what anatomical factors predispose it?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'skel101-shoulder', folderPath: 'SKEL101 QB / Shoulder Complex',
    tags: ['impingement', 'supraspinatus', 'rotator-cuff'], usage: 15, pbis: 0.38, pbisDir: 'flat',
    discriminationIndex: 0.33,
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
    discriminationIndex: 0.44,
    creator: 'persona-admin', lastEditedBy: 'persona-kim', usedInSections: ['Final 2023', 'Midterm 2024'],
  },
  {
    id: 'q-030', code: 'SK-CV-002', version: 1, age: '5 months',
    title: 'Describe the Upper Crossed Syndrome postural pattern and its implications for cervical spine loading.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Create',
    folder: 'skel101-cervical', folderPath: 'SKEL101 QB / Cervical Spine',
    tags: ['upper-crossed', 'posture', 'cervical-loading'], usage: 6, pbis: 0.22, pbisDir: 'down',
    discriminationIndex: 0.19,
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
    discriminationIndex: 0.46,
    creator: 'persona-admin', lastEditedBy: 'persona-kim', usedInSections: ['Quiz 3', 'Final 2023'],
  },
  {
    id: 'q-033', code: 'SK-LM-002', version: 2, age: '7 months',
    title: 'Evaluate the evidence for McKenzie method versus stabilization exercises for chronic non-specific low back pain.',
    type: 'Fill blank', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'skel101-lumbar', folderPath: 'SKEL101 QB / Lumbar Spine',
    tags: ['McKenzie', 'stabilization', 'evidence-based'], usage: 4, pbis: 0.19, pbisDir: 'down',
    discriminationIndex: 0.08,
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
    discriminationIndex: 0.31,
    creator: 'persona-thompson', lastEditedBy: 'persona-patel', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-036', code: 'PH-CNS-003', version: 1, age: '2 months',
    title: 'A patient stabilized on lithium develops coarse tremor, confusion, and polyuria. Identify the likely diagnosis and immediate management.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['lithium-toxicity', 'tremor', 'management'], usage: 7, pbis: 0.31, pbisDir: 'up',
    discriminationIndex: 0.36,
    creator: 'persona-chen', lastEditedBy: 'persona-thompson', usedInSections: ['Final 2023'],
  },
  {
    id: 'q-cns-archived-001', code: 'PH-CNS-004', version: 2, age: '5 months',
    title: 'Compare the pharmacokinetic profiles of haloperidol versus risperidone in elderly patients with dementia-related psychosis.',
    type: 'MCQ', status: 'Archived', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-cns', folderPath: 'PHAR101 QB / CNS & Psychotropics',
    tags: ['haloperidol', 'risperidone', 'elderly', 'pharmacokinetics'], usage: 3, pbis: 0.22, pbisDir: 'down',
    discriminationIndex: 0.06,
    creator: 'persona-admin', lastEditedBy: 'persona-admin', usedInSections: ['Midterm 2024'],
  },

  // ── Deep subfolder questions — depth 2: Gram-Positive Organisms ──
  {
    id: 'q-gpos-001', code: 'PH-GPO-001', version: 2, age: '6 months',
    title: 'Which cell wall component distinguishes Gram-positive organisms from Gram-negative bacteria on Gram staining?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'phar101-abx-gram-pos', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms',
    tags: ['gram-stain', 'cell-wall', 'peptidoglycan'], usage: 18, pbis: 0.44, pbisDir: 'flat',
    discriminationIndex: 0.42,
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-gpos-002', code: 'PH-GPO-002', version: 1, age: '4 months',
    title: 'A culture returns Gram-positive cocci in clusters. Rank the following empirical antibiotics by spectrum against this organism: vancomycin, nafcillin, clindamycin.',
    type: 'Ordering', status: 'Saved', difficulty: 'Medium', blooms: 'Analyze',
    folder: 'phar101-abx-gram-pos', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms',
    tags: ['spectrum', 'gram-positive', 'cocci'], usage: 11, pbis: 0.38, pbisDir: 'up',
    discriminationIndex: 0.34,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Final 2024'],
  },
  {
    id: 'q-gpos-003', code: 'PH-GPO-003', version: 3, age: '1 year',
    title: 'Teichoic acids in Gram-positive cell walls serve which primary immunological function?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Understand',
    folder: 'phar101-abx-gram-pos', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms',
    tags: ['teichoic-acid', 'immunology', 'virulence'], usage: 5, pbis: 0.27, pbisDir: 'down',
    discriminationIndex: 0.24,
    creator: 'persona-patel', lastEditedBy: 'persona-thompson', usedInSections: [],
  },

  // ── depth 3: Staphylococcus Coverage ──
  {
    id: 'q-staph-001', code: 'PH-STA-001', version: 2, age: '8 months',
    title: 'A patient with a deep skin abscess has MSSA on culture. Which antibiotic provides the most appropriate definitive oral step-down therapy?',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-abx-gpos-staph', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage',
    tags: ['MSSA', 'step-down', 'oral-therapy'], usage: 14, pbis: 0.42, pbisDir: 'up',
    discriminationIndex: 0.40,
    creator: 'persona-thompson', lastEditedBy: 'persona-patel', usedInSections: ['Midterm 2024', 'Final 2023'],
  },
  {
    id: 'q-staph-002', code: 'PH-STA-002', version: 1, age: '3 months',
    title: 'Compare the mechanisms of action of cefazolin vs. vancomycin against Staphylococcus aureus. Under what clinical scenario would you prefer one over the other?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-abx-gpos-staph', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage',
    tags: ['cefazolin', 'vancomycin', 'mechanism'], usage: 6, pbis: 0.33, pbisDir: 'flat',
    discriminationIndex: 0.37,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: [],
  },

  // ── depth 3: Streptococcus Coverage ──
  {
    id: 'q-strep-001', code: 'PH-STR-001', version: 2, age: '5 months',
    title: 'Which penicillin derivative provides the best coverage for Group A Streptococcus pharyngitis, and what is the recommended duration?',
    type: 'MCQ', status: 'Saved', difficulty: 'Easy', blooms: 'Remember',
    folder: 'phar101-abx-gpos-strep', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Streptococcus Coverage',
    tags: ['GAS', 'pharyngitis', 'penicillin'], usage: 20, pbis: 0.51, pbisDir: 'up',
    discriminationIndex: 0.48,
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Midterm 2024'],
  },
  {
    id: 'q-strep-002', code: 'PH-STR-002', version: 1, age: '7 months',
    title: 'A patient with penicillin allergy (anaphylaxis) requires treatment for streptococcal endocarditis. Select the most appropriate alternative regimen.',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Apply',
    folder: 'phar101-abx-gpos-strep', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Streptococcus Coverage',
    tags: ['endocarditis', 'penicillin-allergy', 'alternative'], usage: 8, pbis: 0.35, pbisDir: 'down',
    discriminationIndex: 0.30,
    creator: 'persona-patel', lastEditedBy: 'persona-chen', usedInSections: ['Final 2024'],
  },

  // ── depth 4: MRSA Protocols ──
  {
    id: 'q-mrsa-001', code: 'PH-MRS-001', version: 3, age: '10 months',
    title: 'A patient with hospital-acquired pneumonia has MRSA confirmed on BAL culture. Trough vancomycin is 12 mg/L. What is the next best step in optimizing therapy?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-abx-mrsa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols',
    tags: ['vancomycin', 'TDM', 'AUC-guided'], usage: 9, pbis: 0.29, pbisDir: 'up',
    discriminationIndex: 0.07,
    creator: 'persona-chen', lastEditedBy: 'persona-patel', usedInSections: ['Final 2024'],
  },
  {
    id: 'q-mrsa-002', code: 'PH-MRS-002', version: 2, age: '4 months',
    title: 'Daptomycin is considered for MRSA bacteremia. Identify the condition in which daptomycin is contraindicated despite MRSA sensitivity.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Apply',
    folder: 'phar101-abx-mrsa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols',
    tags: ['daptomycin', 'contraindication', 'pneumonia'], usage: 12, pbis: 0.45, pbisDir: 'flat',
    discriminationIndex: 0.44,
    creator: 'persona-thompson', lastEditedBy: 'persona-thompson', usedInSections: ['Midterm 2024'],
  },

  // ── depth 4: MSSA Protocols ──
  {
    id: 'q-mssa-001', code: 'PH-MSA-001', version: 1, age: '6 months',
    title: 'For MSSA bacteremia, nafcillin is preferred over vancomycin. Explain the pharmacodynamic rationale for this preference.',
    type: 'MCQ', status: 'Saved', difficulty: 'Medium', blooms: 'Understand',
    folder: 'phar101-abx-mssa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MSSA Protocols',
    tags: ['nafcillin', 'bactericidal', 'beta-lactam-preference'], usage: 7, pbis: 0.38, pbisDir: 'up',
    discriminationIndex: 0.35,
    creator: 'persona-patel', lastEditedBy: 'persona-patel', usedInSections: [],
  },
  {
    id: 'q-mssa-002', code: 'PH-MSA-002', version: 2, age: '9 months',
    title: 'A patient on nafcillin for MSSA endocarditis develops new-onset eosinophilia and rising creatinine on day 10. What is the most likely cause and how should therapy change?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Analyze',
    folder: 'phar101-abx-mssa', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MSSA Protocols',
    tags: ['nafcillin', 'nephrotoxicity', 'interstitial-nephritis'], usage: 4, pbis: 0.22, pbisDir: 'down',
    discriminationIndex: 0.09,
    creator: 'persona-chen', lastEditedBy: 'persona-chen', usedInSections: ['Final 2023'],
  },

  // ── depth 5: Combination Therapy (deepest level — demonstrates the UX issue) ──
  {
    id: 'q-combo-001', code: 'PH-CMB-001', version: 2, age: '2 months',
    title: 'A patient with persistent MRSA bacteremia on vancomycin monotherapy has rising MIC at 1.5 mg/L. Which combination regimen has evidence for use in refractory MRSA bacteremia?',
    type: 'MCQ', status: 'Saved', difficulty: 'Hard', blooms: 'Evaluate',
    folder: 'phar101-abx-mrsa-combo', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials / Gram-Positive Organisms / Staphylococcus Coverage / MRSA Protocols / Combination Therapy',
    tags: ['refractory-MRSA', 'combination', 'vancomycin-MIC'], usage: 3, pbis: 0.19, pbisDir: 'down',
    discriminationIndex: 0.05,
    creator: 'persona-thompson', lastEditedBy: 'persona-patel', usedInSections: ['Final 2024'],
    layout: 'stacked' as const,
    stemText: 'A 54-year-old patient with refractory MRSA bacteremia is failing vancomycin monotherapy (trough 18 mcg/mL). Which combination regimen has the strongest evidence for salvage therapy?',
    options: [
      { key: 'A', text: 'Vancomycin + rifampin', isCorrect: false, rationale: 'Rifampin adds pharmacokinetic complexity and potential antagonism; not supported by clinical trial data as superior salvage therapy for MRSA bacteremia.' },
      { key: 'B', text: 'Daptomycin + beta-lactam (e.g., cefazolin)', isCorrect: true, rationaleAuthor: 'Dr. James Wu', rationale: 'Daptomycin combined with an anti-staphylococcal beta-lactam demonstrates synergistic activity against MRSA in clinical studies. The beta-lactam disrupts cell wall integrity, enhancing daptomycin binding. Strongest evidence for salvage after vancomycin failure.' },
      { key: 'C', text: 'Linezolid monotherapy', isCorrect: false, rationale: 'Linezolid is bacteriostatic — appropriate for ABSSSI and pneumonia but not the preferred agent for bacteremia where bactericidal activity is required.' },
      { key: 'D', text: 'Trimethoprim-sulfamethoxazole + vancomycin', isCorrect: false, rationale: 'TMP-SMX has activity against MRSA in skin infections but lacks sufficient evidence in bacteremia; not a standard salvage combination.' },
    ],
    correctness: 91,
    avgTimeSeconds: 24,
    pValue: 0.91,
    totalAttempts: 186,
    optionDistribution: [
      { key: 'A', count: 18 },
      { key: 'B', count: 24 },
      { key: 'C', count: 80 },
      { key: 'D', count: 64 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Data quality fix',
        date: '2026-05-26',
        changes: ['Corrected stemText and options to match actual topic: MRSA salvage combination therapy (was: cardiac membrane potential)', 'Updated optionDistribution to reflect new topic'],
        usedInAssessments: ['Final 2024'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Thompson',
        date: '2026-03-14',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Final 2024'],
      },
    ],
    collaborators: [
      { personaId: 'persona-thompson', role: 'owner' as const },
      { personaId: 'persona-admin', role: 'edit' as const },
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
  // ── Essay ────────────────────────────────────────────────────────────────────
  {
    id: 'q-essay-001',
    code: 'PHAR-ESS-001',
    version: 2,
    age: '8 months',
    title: 'A patient with chronic kidney disease (stage 3) is prescribed metformin for new-onset type 2 diabetes. Evaluate the appropriateness of this decision and outline the monitoring parameters required.',
    type: 'Essay' as const,
    status: 'Saved' as const,
    difficulty: 'Hard' as const,
    blooms: 'Evaluate' as const,
    folder: 'phar101-cardio',
    folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['diabetes', 'CKD', 'metformin', 'monitoring'],
    usage: 31,
    pbis: 0.38,
    pbisDir: 'up' as const,
    discriminationIndex: 0.34,
    creator: 'persona-chen',
    lastEditedBy: 'persona-chen',
    stemText: 'A 62-year-old male with chronic kidney disease (eGFR 42 mL/min/1.73m²) presents with a new diagnosis of type 2 diabetes. His endocrinologist initiates metformin 500 mg twice daily. Evaluate the appropriateness of this prescribing decision and describe the monitoring plan you would implement.',
    layout: 'stacked' as const,
    minWordCount: 150,
    correctness: null,
    avgTimeSeconds: 540,
    pValue: null,
    totalAttempts: 31,
    rubric: [
      { criterion: 'Correctly identifies that metformin is relatively contraindicated at eGFR < 45 and provides clinical rationale', points: 10 },
      { criterion: 'Discusses lactic acidosis risk and mechanism in CKD patients', points: 8 },
      { criterion: 'Proposes appropriate alternative agents (e.g., DPP-4 inhibitors, GLP-1 agonists with dose adjustment) with justification', points: 8 },
      { criterion: 'Outlines complete monitoring parameters: eGFR frequency, lactic acid, HbA1c targets in CKD', points: 9 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-12-10',
        isOriginal: false,
        changes: ['Updated eGFR threshold from <30 to <45 per 2024 ADA guidelines', 'Added GLP-1 agonist as preferred alternative'],
        usedInAssessments: ['PHAR101 Midterm 2025'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Chen',
        date: '2025-04-18',
        isOriginal: true,
        changes: ['Initial question creation'],
        usedInAssessments: [],
      },
    ],
    collaborators: [
      { personaId: 'persona-chen', role: 'owner' as const },
      { personaId: 'persona-admin', role: 'view' as const },
    ],
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

  // ── True/False ──────────────────────────────────────────────────────────────
  {
    id: 'q-tf-001', code: 'PH-ANT-TF-001', version: 2, age: '5 months',
    title: 'Vancomycin is the drug of choice for methicillin-sensitive Staphylococcus aureus (MSSA) bacteremia.',
    type: 'True/False' as const, status: 'Saved' as const, difficulty: 'Easy' as const, blooms: 'Remember' as const,
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['MSSA', 'vancomycin', 'bacteremia'], usage: 18, pbis: 0.53, pbisDir: 'flat' as const,
    discriminationIndex: 0.50,
    creator: 'persona-thompson', lastEditedBy: 'persona-chen',
    usedInSections: ['Midterm 2024'],
    stemText: 'Vancomycin is the drug of choice for methicillin-sensitive Staphylococcus aureus (MSSA) bacteremia.',
    options: [
      { key: 'T', text: 'True', isCorrect: false, rationale: 'Vancomycin is inferior to beta-lactams for MSSA bacteremia. It is reserved for MRSA or documented beta-lactam allergy due to lower bactericidal efficacy and higher treatment failure rates.' },
      { key: 'F', text: 'False', isCorrect: true, rationaleAuthor: 'Dr. Sarah Thompson', rationale: 'FALSE — Beta-lactams (nafcillin, oxacillin, or cefazolin) are preferred for MSSA bacteremia. Vancomycin has lower bactericidal activity against MSSA and is associated with significantly higher treatment failure rates. Guideline recommendation: use the most active beta-lactam to which the organism is susceptible.' },
    ],
    correctness: 74,
    avgTimeSeconds: 42,
    pValue: 0.74,
    totalAttempts: 312,
    optionDistribution: [
      { key: 'T', count: 81 },
      { key: 'F', count: 231 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. Steven Chen',
        date: '2026-04-10',
        changes: ['Added detailed distractor rationale for "True" — emphasizes clinical failure data and guideline reference'],
        usedInAssessments: ['Midterm 2024', 'ID Module Quiz'],
      },
      {
        version: 1,
        modifiedBy: 'Dr. Sarah Thompson',
        date: '2026-01-15',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Quiz 2 — Fall 2025'],
      },
    ],
    collaborators: [
      { personaId: 'persona-thompson', role: 'owner' as const },
      { personaId: 'persona-chen', role: 'edit' as const },
    ],
  },
  // ── MSQ (Multiple Select) ───────────────────────────────────────────────────
  {
    id: 'q-msq-001', code: 'PH-CV-MSQ-001', version: 2, age: '4 months',
    title: 'Which of the following are known cardioprotective mechanisms of ACE inhibitors in heart failure with reduced ejection fraction (HFrEF)? Select ALL that apply.',
    type: 'MSQ' as const, status: 'Saved' as const, difficulty: 'Hard' as const, blooms: 'Analyze' as const,
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['ACE-inhibitor', 'HFrEF', 'cardioprotection', 'MSQ'], usage: 11, pbis: 0.38, pbisDir: 'up' as const,
    discriminationIndex: 0.33,
    creator: 'persona-admin', lastEditedBy: 'persona-thompson',
    usedInSections: ['Final 2023'],
    stemText: 'A 62-year-old patient with HFrEF (EF 30%) is started on lisinopril. Which of the following are established cardioprotective mechanisms of ACE inhibitor therapy in this condition? Select ALL that apply.',
    options: [
      { key: 'A', text: 'Reduction in afterload via vasodilation (decreased angiotensin II-mediated vasoconstriction)', isCorrect: true, rationaleAuthor: 'Dr. Sarah Thompson', rationale: 'CORRECT — ACE inhibitors block conversion of angiotensin I → II, reducing systemic vascular resistance and afterload. This decreases wall stress and myocardial oxygen demand.' },
      { key: 'B', text: 'Prevention of aldosterone-mediated sodium and water retention, reducing preload', isCorrect: true, rationale: 'CORRECT — By suppressing angiotensin II, ACE inhibitors reduce aldosterone secretion, limiting sodium/water retention. Lower preload decreases ventricular filling pressures and congestion.' },
      { key: 'C', text: 'Increased heart rate to compensate for reduced stroke volume', isCorrect: false, rationale: 'INCORRECT — ACE inhibitors do not increase heart rate. Compensatory tachycardia is a feature of untreated heart failure driven by sympathetic activation. ACE inhibitors attenuate neurohormonal activation.' },
      { key: 'D', text: 'Attenuation of cardiac remodeling (reduced ventricular hypertrophy and fibrosis)', isCorrect: true, rationale: 'CORRECT — Angiotensin II promotes myocardial fibrosis and hypertrophy. ACE inhibitors reduce these pro-fibrotic effects, enabling reverse remodeling over months of therapy.' },
      { key: 'E', text: 'Bradykinin accumulation contributing to vasodilation and anti-fibrotic effects', isCorrect: true, rationale: 'CORRECT — ACE also degrades bradykinin; ACE inhibition raises bradykinin levels. Bradykinin promotes vasodilation via NO/PGI₂ and has anti-fibrotic effects — a mechanistic advantage over ARBs which do not raise bradykinin.' },
    ],
    correctness: 44,
    avgTimeSeconds: 148,
    pValue: 0.44,
    totalAttempts: 203,
    optionDistribution: [
      { key: 'A', count: 178 },
      { key: 'B', count: 141 },
      { key: 'C', count: 67 },
      { key: 'D', count: 122 },
      { key: 'E', count: 89 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. Sarah Thompson',
        date: '2026-04-18',
        changes: ['Added option E (bradykinin mechanism)', 'Expanded rationales to distinguish ACE inhibitors from ARBs'],
        usedInAssessments: ['Cardiovascular Pharmacology Final'],
      },
      {
        version: 1,
        modifiedBy: 'Ms. Hannah Park',
        date: '2026-02-10',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Final 2023'],
      },
    ],
    collaborators: [
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-thompson', role: 'edit' as const },
      { personaId: 'persona-chen', role: 'view' as const },
    ],
  },
  // ── Short Answer ────────────────────────────────────────────────────────────
  {
    id: 'q-sa-001', code: 'PH-CV-SA-001', version: 1, age: '3 months',
    title: "Name the three components of Virchow's triad and briefly explain how each contributes to venous thromboembolism.",
    type: 'Short Answer' as const, status: 'Saved' as const, difficulty: 'Medium' as const, blooms: 'Understand' as const,
    folder: 'phar101-cardio', folderPath: 'PHAR101 QB / Cardiovascular Drugs',
    tags: ['Virchow', 'VTE', 'thrombosis'], usage: 12, pbis: null, pbisDir: null,
    creator: 'persona-chen', lastEditedBy: 'persona-chen',
    usedInSections: ['Quiz 2'],
    stemText: "Name the three components of Virchow's triad and briefly explain how each contributes to venous thromboembolism (VTE).",
    minWordCount: 80,
    options: [
      { key: '1', text: 'Stasis / venous stasis', isCorrect: true, rationale: 'Reduced blood flow allows coagulation factors to accumulate locally. Common in prolonged immobility, post-operative states, or heart failure with reduced ejection fraction.' },
      { key: '2', text: 'Endothelial injury / vessel wall damage', isCorrect: true, rationale: 'Disruption of the vascular endothelium exposes subendothelial collagen, triggering platelet adhesion and the coagulation cascade. Caused by trauma, surgery, or catheter insertion.' },
      { key: '3', text: 'Hypercoagulability / thrombophilia', isCorrect: true, rationale: 'An imbalance toward coagulation — inherited (Factor V Leiden, Protein C/S deficiency) or acquired (malignancy, OCP use, antiphospholipid syndrome).' },
    ],
    rubric: [
      { criterion: "Correctly names all three components of Virchow's triad", points: 3 },
      { criterion: "Explains each component's mechanism with a clinical example", points: 3 },
      { criterion: 'Uses appropriate physiological/pharmacological terminology', points: 1 },
    ],
    correctness: null,
    avgTimeSeconds: 240,
    totalAttempts: 87,
    versionHistory: [
      {
        version: 1,
        modifiedBy: 'Dr. Steven Chen',
        date: '2026-03-05',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Cardiology Quiz 2'],
      },
    ],
    collaborators: [
      { personaId: 'persona-chen', role: 'owner' as const },
      { personaId: 'persona-patel', role: 'view' as const },
    ],
  },
  // ── Extended Matching ───────────────────────────────────────────────────────
  {
    id: 'q-em-001', code: 'PH-ANT-EM-001', version: 2, age: '7 months',
    title: 'Extended matching: Select the most appropriate antibiotic for each clinical scenario.',
    type: 'Extended Matching' as const, status: 'Saved' as const, difficulty: 'Hard' as const, blooms: 'Apply' as const,
    folder: 'phar101-antibiotics', folderPath: 'PHAR101 QB / Antibiotics & Antimicrobials',
    tags: ['antibiotic-selection', 'clinical-reasoning', 'extended-matching'], usage: 6, pbis: 0.34, pbisDir: 'up' as const,
    discriminationIndex: 0.29,
    creator: 'persona-admin', lastEditedBy: 'persona-thompson',
    usedInSections: ['Final 2023'],
    stemText: 'For each clinical scenario below, select the SINGLE most appropriate antibiotic from the option list. Each option may be used once, more than once, or not at all.',
    extendedMatchingPool: [
      { key: 'A', text: 'Vancomycin' },
      { key: 'B', text: 'Cefazolin' },
      { key: 'C', text: 'Piperacillin-tazobactam' },
      { key: 'D', text: 'Azithromycin' },
      { key: 'E', text: 'Metronidazole' },
      { key: 'F', text: 'Ciprofloxacin' },
      { key: 'G', text: 'Trimethoprim-sulfamethoxazole' },
      { key: 'H', text: 'Daptomycin' },
    ],
    options: [
      { key: '1', text: 'A 35-year-old with community-acquired MSSA skin abscess requiring IV therapy. No drug allergies.', isCorrect: true, rationale: 'B (Cefazolin) — first-line beta-lactam for MSSA. Superior efficacy over vancomycin for susceptible organisms. Anti-staphylococcal beta-lactams are guideline-preferred.' },
      { key: '2', text: 'A 70-year-old ICU patient with hospital-acquired pneumonia. MRSA detected on respiratory BAL culture.', isCorrect: true, rationale: 'A (Vancomycin) — standard of care for MRSA pneumonia. Dose by AUC/MIC-guided TDM. Linezolid is an alternative but not listed.' },
      { key: '3', text: 'A 50-year-old post-bowel perforation with polymicrobial intra-abdominal infection. Coverage needed for gram-negatives and anaerobes.', isCorrect: true, rationale: 'C (Piperacillin-tazobactam) — broad-spectrum beta-lactam/BLI covering gram-negatives, gram-positives, and anaerobes. First-line for moderate-severe intra-abdominal sepsis.' },
      { key: '4', text: 'A 28-year-old with gradual-onset atypical community-acquired pneumonia (walking pneumonia, no consolidation on X-ray).', isCorrect: true, rationale: 'D (Azithromycin) — macrolide effective against Mycoplasma pneumoniae and Chlamydophila pneumoniae, the most common atypical pathogens. Oral convenience and good coverage profile.' },
    ],
    correctness: 58,
    avgTimeSeconds: 185,
    pValue: 0.58,
    totalAttempts: 94,
    optionDistribution: [
      { key: 'Q1-B', count: 54 },
      { key: 'Q2-A', count: 61 },
      { key: 'Q3-C', count: 49 },
      { key: 'Q4-D', count: 57 },
    ],
    versionHistory: [
      {
        version: 2,
        modifiedBy: 'Dr. Sarah Thompson',
        date: '2026-04-22',
        changes: ['Added stem 4 (atypical pneumonia)', 'Expanded rationale for all stems with distractor guidance'],
        usedInAssessments: ['Final 2023', 'Infectious Disease Module Exam'],
      },
      {
        version: 1,
        modifiedBy: 'Ms. Hannah Park',
        date: '2026-01-28',
        isOriginal: true,
        changes: [],
        usedInAssessments: ['Final 2023'],
      },
    ],
    collaborators: [
      { personaId: 'persona-admin', role: 'owner' as const },
      { personaId: 'persona-thompson', role: 'edit' as const },
      { personaId: 'persona-chen', role: 'view' as const },
    ],
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
  { id: 'asmt-001', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Cardiovascular & Renal Pharmacology Midterm', questionCount: 40, diffDistribution: { Easy: 10, Medium: 20, Hard: 10 }, durationMinutes: 90  },
  { id: 'asmt-002', courseId: 'course-phar101', offeringId: 'offering-phar101-f25', title: 'Pharmacology I — Comprehensive Final',          questionCount: 60, diffDistribution: { Easy: 15, Medium: 25, Hard: 20 }, durationMinutes: 150 },
  { id: 'asmt-003', courseId: 'course-biol201', offeringId: 'offering-biol201-f25', title: 'Cell Membrane & Transport Quiz',                 questionCount: 20, diffDistribution: { Easy: 8,  Medium: 8,  Hard: 4  }, durationMinutes: 30  },
  // Previous-term assessments (Spring 2025) — used as copy sources in the Create Assessment modal
  { id: 'asmt-004', courseId: 'course-phar101', offeringId: 'offering-phar101-sp25', title: 'ANS & Cardiovascular Drugs Midterm — Sp 2025',  questionCount: 42, diffDistribution: { Easy: 12, Medium: 22, Hard: 8  }, durationMinutes: 90  },
  { id: 'asmt-005', courseId: 'course-phar101', offeringId: 'offering-phar101-sp25', title: 'Pharmacology I Final — Sp 2025',                questionCount: 58, diffDistribution: { Easy: 14, Medium: 26, Hard: 18 }, durationMinutes: 150 },
  { id: 'asmt-006', courseId: 'course-biol201', offeringId: 'offering-biol201-sp25', title: 'Genetics & Cell Division Midterm — Sp 2025',    questionCount: 35, diffDistribution: { Easy: 10, Medium: 18, Hard: 7  }, durationMinutes: 75  },
  { id: 'asmt-007', courseId: 'course-biol201', offeringId: 'offering-biol201-sp25', title: 'Cell Biology Lab Practical — Sp 2025',          questionCount: 25, diffDistribution: { Easy: 5,  Medium: 12, Hard: 8  }, durationMinutes: 45  },
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

// ─── Search utility ──────────────────────────────────────────────────────────

export function searchQBQuestions(query: string, limit = 6): Question[] {
  const q = query.trim().toLowerCase()
  if (!q) return []
  return MOCK_QB_QUESTIONS.filter(question =>
    question.title.toLowerCase().includes(q) ||
    (question.stemText ?? '').toLowerCase().includes(q) ||
    question.tags.some(tag => tag.toLowerCase().includes(q)) ||
    question.folder.toLowerCase().includes(q)
  ).slice(0, limit)
}
