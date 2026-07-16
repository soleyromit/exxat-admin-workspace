/**
 * The sentiment vocabulary, once.
 *
 * Three files carried their own copy of this palette (student-voice.tsx, term-themes-insight.tsx,
 * and now the voice explorer) — three chances for one of them to drift red. Centralised so the
 * VIZ-004 rule ("never red in score/sentiment viz — concern is amber") has exactly one home.
 *
 * "Constructive", not "negative": these are comments about people's colleagues.
 */
import type { ThemeSentiment } from '@/lib/pce-themes'

export const SENTIMENT_COLOR: Record<ThemeSentiment, string> = {
  positive: 'var(--chart-2)',
  concern: 'var(--chart-4)',
  neutral: 'var(--muted-foreground)',
}

export const SENTIMENT_LABEL: Record<ThemeSentiment, string> = {
  positive: 'Positive',
  concern: 'Constructive',
  neutral: 'Neutral',
}
