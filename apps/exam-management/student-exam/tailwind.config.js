/**
 * Tailwind config — @exxat/exam-management-student
 *
 * Extends with studentUX token aliases that map to CSS custom properties.
 * exxat-ds globals (--background, --foreground, --brand-color, etc.) are
 * injected upstream; this config surfaces them as Tailwind utility classes
 * so components can use bg-surface-page, text-text-primary, etc.
 *
 * Font: exxat-ds uses Inter (sans) + ivypresto-text (heading).
 * Student exam keeps Source Sans 3 as heading fallback for lockdown contexts
 * where web fonts may be blocked.
 */
export default {
  content: [
    './index.html',
    './src/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // ── Brand — exxat-ds bridge ──────────────────────────────────────────
        brand: {
          primary:     'var(--brand-color)',
          hover:       'var(--brand-color-dark)',
          active:      'var(--brand-color-deep)',
          tint:        'var(--brand-tint)',
          'tint-light':'var(--brand-tint-light)',
          'tint-subtle':'var(--brand-tint-subtle)',
          foreground:  'var(--brand-foreground)',
        },
        // ── Surface ──────────────────────────────────────────────────────────
        surface: {
          page:   'var(--background)',
          white:  'var(--card)',
          subtle: 'var(--muted)',
          muted:  'var(--muted)',
        },
        // ── Text ─────────────────────────────────────────────────────────────
        text: {
          primary:     'var(--foreground)',
          secondary:   'var(--muted-foreground)',
          muted:       'var(--muted-foreground)',
          subtle:      'var(--muted-foreground)',
          placeholder: 'var(--muted-foreground)',
          inverse:     'var(--primary-foreground)',
        },
        // ── Border ───────────────────────────────────────────────────────────
        border: {
          default: 'var(--border)',
          medium:  'var(--border-control)',
          strong:  'var(--border-control-35)',
          focus:   'var(--ring)',
        },
        // ── Exam states — studentUX-specific ─────────────────────────────────
        state: {
          answered:        '#DCFCE7',
          'answered-border':'#4ADE80',
          'answered-text': '#15803D',
          flagged:         '#FEF9C3',
          'flagged-border':'#FACC15',
          'flagged-text':  '#92400E',
          current:         'var(--brand-color)',
        },
        // ── Exam accent (blue) — studentUX-specific ───────────────────────────
        exam: {
          accent:        '#2563EB',
          'accent-hover':'#1D4ED8',
          'accent-light':'#EFF6FF',
          'accent-border':'#BFDBFE',
        },
        // ── Semantic ─────────────────────────────────────────────────────────
        semantic: {
          error: 'var(--destructive)',
        },
      },
      fontFamily: {
        // exxat-ds primary — Inter
        sans:    ['Inter', 'ui-sans-serif', 'system-ui', 'sans-serif'],
        // Student exam heading — Source Sans 3 as lockdown-safe fallback
        heading: ['"Source Sans 3"', 'Inter', 'system-ui', 'sans-serif'],
      },
      borderRadius: {
        // exxat-ds uses --radius; mirror it
        ds: 'var(--radius, 0.5rem)',
      },
    },
  },
}
