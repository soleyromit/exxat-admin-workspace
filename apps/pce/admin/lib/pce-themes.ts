// AI theme extraction over open-text evaluation responses — mock keyword
// heuristics standing in for the AI service (workspace ADR-005: "AI is good at
// finding themes and grouping the information by themes").
//
// Single source of truth. Previously duplicated inline in
// app/(app)/surveys/[id]/page.tsx and app/(app)/my-surveys/[id]/results/page.tsx.

export type ThemeSentiment = 'positive' | 'neutral' | 'concern'

export interface ThemeComment {
  text: string
  sentiment?: ThemeSentiment
}

export interface ThemeRow {
  label: string
  sentiment: ThemeSentiment
  occurrences: number
}

/** Term-level aggregate: a theme plus WHICH courses it appeared in — claims
 *  without nouns aren't actionable ("2 courses mentioned pacing" → which two?). */
export interface TermThemeRow extends ThemeRow {
  courseCount: number
  courseCodes: string[]
}

export const THEME_PATTERNS: { label: string; keywords: string[] }[] = [
  { label: 'Pacing',             keywords: ['pacing', 'pace', 'fast', 'rushed', 'slow'] },
  { label: 'Faculty engagement', keywords: ['engaging', 'communicat', 'helpful', 'responsive', 'organized', 'approachable'] },
  { label: 'Course materials',   keywords: ['material', 'resource', 'lab', 'structure', 'reading'] },
  { label: 'Assessment quality', keywords: ['assessment', 'exam', 'quiz', 'example', 'worked', 'difficulty'] },
  { label: 'Office hours',       keywords: ['office hours', 'available', 'accessible'] },
]

function dominantSentiment(hasConcern: boolean, hasPositive: boolean): ThemeSentiment {
  return hasConcern ? 'concern' : hasPositive ? 'positive' : 'neutral'
}

/** Themes across one survey's comments (the Evaluation Card / results level). */
export function deriveThemes(comments: ThemeComment[]): ThemeRow[] {
  return THEME_PATTERNS.flatMap(theme => {
    const matched = comments.filter(c =>
      theme.keywords.some(kw => c.text.toLowerCase().includes(kw)),
    )
    if (matched.length === 0) return []
    return [{
      label: theme.label,
      sentiment: dominantSentiment(
        matched.some(c => c.sentiment === 'concern'),
        matched.some(c => c.sentiment === 'positive'),
      ),
      occurrences: matched.length,
    }]
  })
}

/**
 * Cross-course themes for a term (the aggregation level above the Evaluation
 * Card). Input is one {courseCode, comments} entry per course; output carries
 * courseCodes so the UI can name the courses behind each claim. Concerns sort
 * first, then by reach (courseCount), then by volume.
 */
export function deriveTermThemes(
  courses: { code: string; comments: ThemeComment[] }[],
): TermThemeRow[] {
  return THEME_PATTERNS.flatMap(theme => {
    let occurrences = 0
    const courseCodes: string[] = []
    let hasConcern = false
    let hasPositive = false
    for (const { code, comments } of courses) {
      const matched = comments.filter(c =>
        theme.keywords.some(kw => c.text.toLowerCase().includes(kw)),
      )
      if (matched.length === 0) continue
      courseCodes.push(code)
      occurrences += matched.length
      hasConcern = hasConcern || matched.some(c => c.sentiment === 'concern')
      hasPositive = hasPositive || matched.some(c => c.sentiment === 'positive')
    }
    if (occurrences === 0) return []
    return [{
      label: theme.label,
      sentiment: dominantSentiment(hasConcern, hasPositive),
      occurrences,
      courseCount: courseCodes.length,
      courseCodes,
    }]
  }).sort((a, b) =>
    Number(b.sentiment === 'concern') - Number(a.sentiment === 'concern') ||
    b.courseCount - a.courseCount ||
    b.occurrences - a.occurrences,
  )
}
