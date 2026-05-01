export type QuestionType =
'mcq' |
'image-mcq' |
'video-mcq' |
'audio' |
'checkbox' |
'case-study' |
'fill-blank' |
'highlight' |
'cross-out' |
'matching' |
'anatomy' |
'short-answer' |
'dropdown' |
'table' |
'combined' |
'pdf' |
'essay' |
'word-highlight' |
'passage' |
'chart';

export interface Question {
  id: number;
  text: string;
  type: QuestionType;
  points: number;
  required: boolean;

  // Media
  imageUrl?: string;
  videoUrl?: string;
  audioUrl?: string;
  pdfUrl?: string;

  // Caption for media (audio, video, chart)
  caption?: string;

  // Options for mcq, checkbox, cross-out, dropdown, chart
  options?: string[];

  // Image URLs for each option (parallel to options array)
  optionImages?: string[];

  // For short-answer & essay
  maxChars?: number;
  essayPrompt?: string;
  essayMinWords?: number;
  essayMaxWords?: number;
  essayPages?: number;

  // For case-study
  tabs?: {title: string;content: string[];}[];

  // For fill-blank
  passageTemplate?: string;
  blanks?: Record<string, string[]>;

  // For highlight & word-highlight
  sentenceGroups?: string[];
  wordHighlightPassage?: string;

  // For passage
  passageText?: string;

  // For matching
  matchPairs?: {left: string;rightOptions: string[];}[];

  // For anatomy
  diagramUrl?: string;
  hotspots?: {id: string;x: number;y: number;label: string;}[];

  // For table
  tableData?: {headers: string[];rows: string[][];};

  // For chart
  chartData?: {
    title: string;
    caption: string;
    xLabels: string[];
    series: {name: string;values: number[];color: string;}[];
  };
}

export const questions: Question[] = [
{
  id: 1,
  text: 'Which of the following symptoms is most commonly associated with myocardial infarction?',
  type: 'mcq',
  options: ['Chest pain', 'Skin rash', 'Hearing loss', 'Blurred vision'],
  points: 5,
  required: true
},
{
  id: 2,
  text: 'Select all medications that are classified as beta-blockers.',
  type: 'checkbox',
  options: [
  'Metoprolol',
  'Lisinopril',
  'Atenolol',
  'Amlodipine',
  'Propranolol'],

  points: 10,
  required: true
},
{
  id: 3,
  text: 'Identify the abnormality in the provided chest X-ray.',
  type: 'image-mcq',
  imageUrl:
  'https://images.unsplash.com/photo-1559757175-5700dde675bc?w=800&q=80',
  options: [
  'Pneumothorax',
  'Pleural effusion',
  'Normal anatomy',
  'Cardiomegaly'],

  points: 10,
  required: true
},
{
  id: 4,
  text: 'Review the clinical notes and identify the most likely diagnosis.',
  type: 'case-study',
  tabs: [
  {
    title: 'HPI',
    content: [
    'A 45-year-old male presents to the ED with a 2-day history of severe, sharp chest pain.',
    'Pain worsens with deep inspiration and improves when leaning forward.']

  },
  {
    title: 'Vitals & Labs',
    content: [
    'BP: 120/80 mmHg, HR: 95 bpm, RR: 18 breaths/min, Temp: 38.2°C (100.8°F).',
    'Troponin I: 0.02 ng/mL (Normal). WBC: 12,000/mcL.']

  },
  {
    title: 'Imaging',
    content: [
    'ECG reveals diffuse ST-segment elevation and PR-segment depression in multiple leads.',
    'CXR is unremarkable.']

  }],

  options: [
  'Acute pericarditis',
  'Myocardial infarction',
  'Pulmonary embolism',
  'Aortic dissection'],

  points: 15,
  required: true
},
{
  id: 5,
  text: 'Complete the physiological pathway:',
  type: 'fill-blank',
  passageTemplate:
  'In the RAAS system, renin converts angiotensinogen into {{blank1}}, which is then converted to {{blank2}} by ACE primarily in the lungs.',
  blanks: {
    blank1: ['Angiotensin I', 'Aldosterone', 'Bradykinin'],
    blank2: ['Angiotensin II', 'Angiotensin III', 'Renin']
  },
  points: 10,
  required: true
},
{
  id: 6,
  text: 'Click to highlight the sentence that indicates a contraindication for administering a beta-blocker.',
  type: 'highlight',
  sentenceGroups: [
  'The patient is a 62-year-old female with a history of hypertension and type 2 diabetes.',
  'She currently takes lisinopril and metformin.',
  'She has a documented history of severe, uncontrolled asthma with frequent exacerbations.',
  'Her current blood pressure is 150/95 mmHg and heart rate is 88 bpm.'],

  points: 10,
  required: false
},
{
  id: 7,
  text: 'Which of the following is NOT a symptom of hyperthyroidism? (Use the cross-out tool to eliminate incorrect options)',
  type: 'cross-out',
  options: [
  'Weight loss',
  'Heat intolerance',
  'Bradycardia',
  'Palpitations',
  'Tremor'],

  points: 5,
  required: true
},
{
  id: 8,
  text: 'Match the cranial nerve to its primary function.',
  type: 'matching',
  matchPairs: [
  {
    left: 'CN I (Olfactory)',
    rightOptions: ['Smell', 'Vision', 'Eye movement', 'Facial sensation']
  },
  {
    left: 'CN II (Optic)',
    rightOptions: ['Smell', 'Vision', 'Eye movement', 'Facial sensation']
  },
  {
    left: 'CN VII (Facial)',
    rightOptions: [
    'Facial expression',
    'Hearing',
    'Swallowing',
    'Tongue movement']

  }],

  points: 12,
  required: true
},
{
  id: 9,
  text: 'Select the hotspot corresponding to the Mitral Valve.',
  type: 'anatomy',
  diagramUrl: "/heart_anatomy_placeholder.svg",

  hotspots: [
  { id: 'aortic', x: 45, y: 30, label: 'Aortic Valve' },
  { id: 'pulmonary', x: 55, y: 35, label: 'Pulmonary Valve' },
  { id: 'tricuspid', x: 40, y: 60, label: 'Tricuspid Valve' },
  { id: 'mitral', x: 65, y: 55, label: 'Mitral Valve' }],

  points: 10,
  required: true
},
{
  id: 10,
  text: 'Explain the physiological impact of dehydration on the kidneys. (You may use dictation)',
  type: 'short-answer',
  points: 15,
  required: true,
  maxChars: 2000
},
{
  id: 11,
  text: 'Choose the correct normal adult respiratory rate range.',
  type: 'dropdown',
  options: [
  '8-12 breaths/min',
  '12-20 breaths/min',
  '20-30 breaths/min',
  '30-40 breaths/min'],

  points: 3,
  required: true
},
{
  id: 12,
  text: 'Based on the lab results table below, what is the most likely diagnosis?',
  type: 'table',
  tableData: {
    headers: ['Test', 'Patient Result', 'Reference Range'],
    rows: [
    ['Hemoglobin', '9.2 g/dL', '13.5 - 17.5 g/dL'],
    ['MCV', '72 fL', '80 - 100 fL'],
    ['Ferritin', '8 ng/mL', '20 - 250 ng/mL']]

  },
  options: [
  'Macrocytic anemia',
  'Iron deficiency anemia',
  'Hemolytic anemia',
  'Aplastic anemia'],

  points: 10,
  required: true
},
{
  id: 13,
  text: 'Listen to the heart sounds. What murmur is present?',
  type: 'audio',
  audioUrl: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
  caption:
  'Audio recording of cardiac auscultation at the left sternal border, 2nd intercostal space.',
  options: [
  'Aortic stenosis',
  'Mitral regurgitation',
  'Mitral stenosis',
  'Aortic regurgitation'],

  points: 10,
  required: false
},
{
  id: 14,
  text: 'Watch the gait assessment video. What type of gait is demonstrated?',
  type: 'video-mcq',
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  caption:
  'Video demonstrating a patient walking with characteristic gait abnormality during neurological assessment.',
  options: ['Parkinsonian', 'Hemiplegic', 'Ataxic', 'Diplegic'],
  points: 10,
  required: true
},
{
  id: 15,
  text: 'Review the patient image and select the correct dermatological term for this lesion.',
  type: 'combined',
  imageUrl:
  'https://images.unsplash.com/photo-1579684385127-1ef15d508118?w=800&q=80',
  options: ['Macule', 'Papule', 'Vesicle', 'Plaque'],
  points: 5,
  required: true
},
{
  id: 16,
  text: 'Review the attached clinical guidelines PDF. According to page 2, what is the first-line treatment for uncomplicated UTI?',
  type: 'pdf',
  pdfUrl: 'https://www.africau.edu/images/default/sample.pdf',
  options: ['Ciprofloxacin', 'Nitrofurantoin', 'Amoxicillin', 'Azithromycin'],
  points: 10,
  required: true
},
{
  id: 17,
  text: 'Write a comprehensive care plan for a patient presenting with acute exacerbation of COPD.',
  type: 'essay',
  essayPrompt:
  'Include assessment findings, pharmacological interventions, oxygen therapy parameters, and discharge education criteria.',
  essayMinWords: 200,
  essayMaxWords: 1000,
  essayPages: 2,
  points: 25,
  required: true
},
{
  id: 18,
  text: 'Click to highlight all the pathological findings in the following radiology report.',
  type: 'word-highlight',
  wordHighlightPassage:
  'The lungs are clear without focal consolidation, pleural effusion, or pneumothorax. However, there is a 2cm spiculated nodule in the right upper lobe. The cardiac silhouette is mildly enlarged. The osseous structures are unremarkable.',
  points: 10,
  required: true
},
{
  id: 19,
  text: 'Review the patient presentation and select the most appropriate next step in management.',
  type: 'case-study',
  imageUrl:
  'https://images.unsplash.com/photo-1584515933487-779824d29309?w=800&q=80',
  tabs: [
  {
    title: 'History',
    content: [
    '32-year-old female presents with acute onset right lower quadrant abdominal pain.',
    'Associated with nausea and one episode of vomiting.']

  },
  {
    title: 'Physical Exam',
    content: [
    "Tenderness to palpation at McBurney's point.",
    "Positive Rovsing's sign.",
    'Guarding present.']

  }],

  options: [
  'Discharge with pain medication',
  'Schedule outpatient ultrasound',
  'Immediate surgical consult',
  'Start oral antibiotics'],

  points: 15,
  required: true
},
{
  id: 20,
  text: 'Watch the clinical examination video. Which cranial nerve is being tested?',
  type: 'video-mcq',
  videoUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
  caption:
  'Video of a clinician performing a cranial nerve examination on a standardized patient.',
  options: [
  'CN III (Oculomotor)',
  'CN V (Trigeminal)',
  'CN VII (Facial)',
  'CN IX (Glossopharyngeal)'],

  points: 10,
  required: true
},
{
  id: 21,
  text: 'Interpret the following arterial blood gas (ABG) results.',
  type: 'table',
  tableData: {
    headers: ['Parameter', 'Result', 'Normal Range'],
    rows: [
    ['pH', '7.28', '7.35 - 7.45'],
    ['PaCO2', '55 mmHg', '35 - 45 mmHg'],
    ['HCO3-', '25 mEq/L', '22 - 26 mEq/L']]

  },
  options: [
  'Respiratory Acidosis',
  'Metabolic Acidosis',
  'Respiratory Alkalosis',
  'Metabolic Alkalosis'],

  points: 10,
  required: true
},
{
  id: 22,
  text: 'Read the passage regarding diabetes management and answer the question below.',
  type: 'passage',
  passageText:
  'Type 2 diabetes management typically begins with lifestyle modifications including diet and exercise. If glycemic targets are not met, Metformin is widely considered the first-line pharmacological agent due to its efficacy, safety profile, and cardiovascular benefits. It works primarily by decreasing hepatic glucose production and increasing insulin sensitivity. Contraindications include severe renal impairment (eGFR < 30 mL/min/1.73 m2).',
  options: [
  'Increases pancreatic insulin secretion',
  'Decreases hepatic glucose production',
  'Inhibits carbohydrate absorption in the gut',
  'Increases renal glucose excretion'],

  points: 10,
  required: true
},
{
  id: 23,
  text: 'Identify the structure indicated by the arrow in this MRI scan.',
  type: 'image-mcq',
  imageUrl:
  'https://images.unsplash.com/photo-1530497610245-94d3c16cda28?w=800&q=80',
  options: ['Corpus Callosum', 'Thalamus', 'Cerebellum', 'Pons'],
  points: 10,
  required: true
},
{
  id: 24,
  text: 'Select all potential adverse effects associated with ACE inhibitors.',
  type: 'checkbox',
  options: [
  'Dry cough',
  'Hypokalemia',
  'Hyperkalemia',
  'Angioedema',
  'Bradycardia'],

  points: 10,
  required: true
},
{
  id: 25,
  text: 'Complete the coagulation cascade pathway:',
  type: 'fill-blank',
  passageTemplate:
  'The intrinsic pathway is initiated by factor XII, while the extrinsic pathway is initiated by {{blank1}}. Both pathways converge at the activation of factor {{blank2}} to form the common pathway.',
  blanks: {
    blank1: ['Tissue Factor', 'Thrombin', 'Fibrinogen'],
    blank2: ['X', 'VIII', 'V']
  },
  points: 10,
  required: true
},
{
  id: 26,
  text: 'Match the antibiotic class to its mechanism of action.',
  type: 'matching',
  matchPairs: [
  {
    left: 'Penicillins',
    rightOptions: [
    'Cell wall synthesis inhibitor',
    'Protein synthesis inhibitor',
    'DNA gyrase inhibitor']

  },
  {
    left: 'Macrolides',
    rightOptions: [
    'Cell wall synthesis inhibitor',
    'Protein synthesis inhibitor',
    'DNA gyrase inhibitor']

  },
  {
    left: 'Fluoroquinolones',
    rightOptions: [
    'Cell wall synthesis inhibitor',
    'Protein synthesis inhibitor',
    'DNA gyrase inhibitor']

  }],

  points: 12,
  required: true
},
{
  id: 27,
  text: 'Highlight the subjective data in this nursing note.',
  type: 'highlight',
  sentenceGroups: [
  'Patient states, "My stomach hurts really bad."',
  'Abdomen is distended and firm to palpation.',
  'Bowel sounds are absent in all four quadrants.',
  'Patient rates pain as 8/10 on the numeric scale.'],

  points: 10,
  required: true
},
{
  id: 28,
  text: 'Describe the pathophysiology of asthma exacerbation.',
  type: 'short-answer',
  maxChars: 1000,
  points: 15,
  required: true
},
{
  id: 29,
  text: 'Cross out the diagnoses that are LEAST likely for a patient presenting with acute unilateral facial paralysis and no other neurological deficits.',
  type: 'cross-out',
  options: [
  "Bell's Palsy",
  'Ischemic Stroke',
  'Lyme Disease',
  'Brain Tumor',
  'Herpes Zoster Oticus'],

  points: 5,
  required: true
},
{
  id: 30,
  text: 'Select the appropriate triage category for a patient with a sprained ankle and stable vitals.',
  type: 'dropdown',
  options: [
  'Resuscitation (Level 1)',
  'Emergent (Level 2)',
  'Urgent (Level 3)',
  'Non-urgent (Level 4/5)'],

  points: 5,
  required: true
},
{
  id: 31,
  text: 'Based on the patient vital signs trend chart below, at what time point did the patient likely develop sepsis?',
  type: 'chart',
  chartData: {
    title: 'Patient Vital Signs Over 24 Hours',
    caption:
    'Chart showing heart rate (HR), systolic blood pressure (SBP), and temperature trends over a 24-hour monitoring period. HR rises sharply from 88 bpm at 0h to 128 bpm at 12h. SBP drops from 120 mmHg at 0h to 85 mmHg at 12h. Temperature increases from 37.0°C at 0h to 39.8°C at 12h, then plateaus.',
    xLabels: ['0h', '4h', '8h', '12h', '16h', '20h', '24h'],
    series: [
    {
      name: 'Heart Rate (bpm)',
      values: [88, 92, 105, 128, 130, 125, 118],
      color: '#EF4444'
    },
    {
      name: 'SBP (mmHg)',
      values: [120, 118, 105, 85, 82, 88, 95],
      color: '#3B82F6'
    },
    {
      name: 'Temp (°C × 10)',
      values: [370, 374, 382, 398, 399, 395, 388],
      color: '#F59E0B'
    }]

  },
  options: ['At 4 hours', 'At 8 hours', 'At 12 hours', 'At 20 hours'],
  points: 15,
  required: true
},
{
  id: 22,
  text: 'Which of the following ECG strips shows atrial fibrillation?',
  type: 'mcq',
  options: [
  'Normal sinus rhythm',
  'Atrial fibrillation',
  'Ventricular tachycardia',
  'Second-degree AV block'],

  optionImages: [
  'https://images.unsplash.com/photo-1576091160550-2173dba999ef?w=400&q=80',
  'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=400&q=80',
  'https://images.unsplash.com/photo-1530497610245-b1bba79de1f2?w=400&q=80',
  'https://images.unsplash.com/photo-1551076805-e1869033e561?w=400&q=80'],

  points: 10,
  required: true
}];