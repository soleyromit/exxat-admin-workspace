export interface ExamQuestion {
  id: string
  text: string
  type: 'mcq' | 'true-false' | 'short-answer'
  options?: string[]
  correctIndex?: number
  correctAnswer?: boolean
}

export const MOCK_EXAM_QUESTIONS: ExamQuestion[] = [
  { id: 'eq1', text: 'What is the primary function of the mitral valve?', type: 'mcq', options: ['Prevents backflow from left ventricle to left atrium', 'Prevents backflow from right ventricle to right atrium', 'Regulates blood flow from aorta', 'Controls pulmonary circulation'], correctIndex: 0 },
  { id: 'eq2', text: 'The aorta is the largest artery in the body.', type: 'true-false', correctAnswer: true },
  { id: 'eq3', text: 'What is the normal resting heart rate range for adults?', type: 'mcq', options: ['40–60 bpm', '60–100 bpm', '100–120 bpm', '120–140 bpm'], correctIndex: 1 },
  { id: 'eq4', text: 'Systole refers to the relaxation phase of the cardiac cycle.', type: 'true-false', correctAnswer: false },
  { id: 'eq5', text: 'Name the four chambers of the heart.', type: 'short-answer' },
]
