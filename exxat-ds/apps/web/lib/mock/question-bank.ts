/**
 * Mock question bank items — replace with API in production.
 */

export type QuestionBankStatus = "published" | "draft" | "in_review"
export type QuestionBankType = "multiple_choice" | "true_false" | "short_answer"
export type QuestionBankDifficulty = "easy" | "medium" | "hard"

export interface QuestionBankItem extends Record<string, unknown> {
  id: string
  /** Short preview / stem */
  stem: string
  topic: string
  type: QuestionBankType
  difficulty: QuestionBankDifficulty
  status: QuestionBankStatus
  author: string
  updatedAt: string
}

export const QUESTION_BANK_ITEMS: QuestionBankItem[] = [
  {
    id: "q1",
    stem: "Which nerve roots contribute to the brachial plexus?",
    topic: "Anatomy",
    type: "multiple_choice",
    difficulty: "medium",
    status: "published",
    author: "Dr. Chen",
    updatedAt: "2026-03-28",
  },
  {
    id: "q2",
    stem: "Document baseline vitals before administering contrast.",
    topic: "Clinical skills",
    type: "true_false",
    difficulty: "easy",
    status: "published",
    author: "Jordan Lee",
    updatedAt: "2026-03-27",
  },
  {
    id: "q3",
    stem: "List three red flags for cauda equina syndrome.",
    topic: "Neurology",
    type: "short_answer",
    difficulty: "hard",
    status: "in_review",
    author: "Alex Rivera",
    updatedAt: "2026-03-26",
  },
  {
    id: "q4",
    stem: "HIPAA permits disclosure to family without consent when…",
    topic: "Ethics & law",
    type: "multiple_choice",
    difficulty: "medium",
    status: "draft",
    author: "Sam Patel",
    updatedAt: "2026-03-25",
  },
  {
    id: "q5",
    stem: "Calculate BMI given height and weight (metric).",
    topic: "Assessment",
    type: "short_answer",
    difficulty: "easy",
    status: "published",
    author: "Dr. Chen",
    updatedAt: "2026-03-24",
  },
  {
    id: "q6",
    stem: "Sterile field must be prepared before which step?",
    topic: "Infection control",
    type: "multiple_choice",
    difficulty: "medium",
    status: "published",
    author: "Morgan Lee",
    updatedAt: "2026-03-23",
  },
  {
    id: "q7",
    stem: "SOAP note: subjective section documents patient-reported data only.",
    topic: "Documentation",
    type: "true_false",
    difficulty: "easy",
    status: "draft",
    author: "Casey Nguyen",
    updatedAt: "2026-03-22",
  },
  {
    id: "q8",
    stem: "Contrast MRI safety screening includes renal function when…",
    topic: "Radiology",
    type: "multiple_choice",
    difficulty: "hard",
    status: "in_review",
    author: "Riley Johnson",
    updatedAt: "2026-03-21",
  },
  {
    id: "q9",
    stem: "Therapeutic communication: reflect feelings before offering solutions.",
    topic: "Communication",
    type: "true_false",
    difficulty: "medium",
    status: "published",
    author: "Quinn Martinez",
    updatedAt: "2026-03-20",
  },
  {
    id: "q10",
    stem: "Pediatric dose calculation uses body surface area when…",
    topic: "Pharmacology",
    type: "short_answer",
    difficulty: "hard",
    status: "published",
    author: "Dr. Chen",
    updatedAt: "2026-03-19",
  },
  {
    id: "q11",
    stem: "Fall risk assessment should be repeated after medication changes.",
    topic: "Safety",
    type: "true_false",
    difficulty: "easy",
    status: "draft",
    author: "Taylor Brooks",
    updatedAt: "2026-03-18",
  },
  {
    id: "q12",
    stem: "Describe hand hygiene moments (WHO five moments).",
    topic: "Infection control",
    type: "short_answer",
    difficulty: "medium",
    status: "in_review",
    author: "Jordan Lee",
    updatedAt: "2026-03-17",
  },
]
