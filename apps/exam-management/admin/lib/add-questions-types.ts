import type { QType, QDiff } from './qb-types'

export type AddMode =
  | 'resting'
  | 'qb'         // State 1A — QB search active
  | 'ai'         // State 1B — AI mode
  | 'write'      // State 1C — Write from scratch form
  | 'pdf'        // State 1D — PDF drop zone
  | 'generating' // State 2  — AI generating
  | 'extracting' // State 2D — PDF extracting
  | 'runway'     // State 3  — Runway review

export interface GeneratedQuestion {
  id: string
  type: QType
  difficulty: QDiff
  stemText: string
  options?: {
    key: string
    text: string
    isCorrect: boolean
    isSuggestedCorrect?: boolean // AI's recommendation, shown with "✓ suggested" label
  }[]
  matchPairs?: { left: string; right: string }[]
  modelAnswer?: string     // Fill-in-Blank / Short Answer
  wordLimitMin?: number    // Essay
  wordLimitMax?: number    // Essay
  rubric?: { criterion: string; points: number }[]
  source: 'ai' | 'pdf'
}
