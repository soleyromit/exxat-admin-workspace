/**
 * EXXAT EXAM MANAGEMENT — STUDENT UX DESIGN TOKENS
 *
 * Bridge layer: studentUX token system → Exxat DS (exxat-ds) CSS custom props.
 *
 * Rules:
 *  - Where exxat-ds defines the intent, delegate with var(--ds-token, fallback).
 *  - Exam-specific states (answered/flagged/current), accessibility modes,
 *    calculator chrome, and exam-accent blue are studentUX-owned — kept as-is.
 *  - Never hardcode hex values in component files — use this map or CSS vars.
 *
 * exxat-ds variable reference (globals.css):
 *   --background            Page/app background
 *   --foreground            Primary text
 *   --card                  Card/panel surface
 *   --primary               Brand primary (Exxat One lavender)
 *   --primary-foreground    Text on primary bg
 *   --muted                 Muted surface (hover, chips)
 *   --muted-foreground      Text on muted surface
 *   --border                Default border
 *   --border-control        Input/control border
 *   --ring                  Focus ring
 *   --destructive           Error / destructive color
 *   --brand-color           Exxat One brand (lavender)
 *   --brand-color-dark      Darker brand shade
 *   --brand-color-deep      Deepest brand shade
 *   --brand-tint            Light brand tint
 *   --brand-tint-light      Lightest brand tint
 *   --brand-tint-subtle     Subtle brand tint
 *   --brand-foreground      Text on brand surfaces
 */

export const tokens = {
  // ─── Brand — delegates to exxat-ds ──────────────────────────────────────────
  brand: {
    primary: 'var(--brand-color, #7C3AED)',           // exxat-ds lavender
    primaryHover: 'var(--brand-color-dark, #5B21B6)',
    primaryActive: 'var(--brand-color-deep, #3B0764)',
    primaryBg: 'var(--brand-tint-light, #F5F3FF)',
    primaryBorder: 'var(--brand-tint, #EDE9FE)',
    primaryMid: 'var(--brand-color, #7C3AED)',
    primaryMidBg: 'var(--brand-tint-subtle, #DDD6FE)'
  },

  // ─── Surface — delegates to exxat-ds ────────────────────────────────────────
  surface: {
    page: 'var(--background, #F8FAFC)',               // exxat-ds --background
    white: 'var(--card, #FFFFFF)',                    // exxat-ds --card
    subtle: 'var(--muted, #F1F5F9)',                  // exxat-ds --muted
    muted: 'var(--muted, #F8FAFC)',
    overlay: 'rgba(0,0,0,0.30)'
  },

  // ─── Text — delegates to exxat-ds ───────────────────────────────────────────
  text: {
    primary: 'var(--foreground, #0F172A)',             // exxat-ds --foreground
    secondary: 'var(--muted-foreground, #334155)',     // exxat-ds --muted-foreground
    muted: 'var(--muted-foreground, #475569)',
    subtle: 'var(--muted-foreground, #64748B)',
    placeholder: 'var(--muted-foreground, #9CA3AF)',
    inverse: 'var(--primary-foreground, #FFFFFF)',     // exxat-ds --primary-foreground
    timer: 'var(--muted-foreground, #334155)'
  },

  // ─── Border — delegates to exxat-ds ─────────────────────────────────────────
  border: {
    default: 'var(--border, #E2E8F0)',                // exxat-ds --border
    medium: 'var(--border-control, #CBD5E1)',          // exxat-ds --border-control
    strong: 'var(--border-control-35, #94A3B8)',
    focus: 'var(--ring, #A78BFA)'                     // exxat-ds --ring (lavender)
  },

  // ─── Exam states — now resolve through DS chart palette via index.css
  // tokens (see --state-answered-* etc.). All chart-* tokens are pre-tuned
  // for AA contrast + auto-adapt under .dark.
  state: {
    // Answered question — chart-2 (teal/green) family
    answeredBg:     'var(--state-answered-bg)',
    answeredBorder: 'var(--state-answered-border)',
    answeredText:   'var(--state-answered-text)',

    // Flagged question — chart-4 (amber) family
    flaggedBg:     'var(--state-flagged-bg)',
    flaggedBorder: 'var(--state-flagged-border)',
    flaggedText:   'var(--state-flagged-text)',

    // Required / unanswered warning (informational, not destructive)
    requiredBg:     'var(--required-bg)',
    requiredBorder: 'var(--required-border)',
    requiredShadow: 'var(--required-bg)',

    // Current active question in navigator — uses brand
    currentBg:   'var(--brand-color)',
    currentText: 'var(--brand-foreground)'
  },

  // ─── Semantic — Aarti's no-red rule applied: errors map to chart-5 orange.
  // Reserve --destructive only for true delete/destructive confirmations.
  semantic: {
    errorText:   'var(--state-error-text-dark)',
    errorBg:     'var(--state-error-bg-soft)',
    errorBorder: 'var(--state-error-border-soft)',
    errorDot:    'var(--state-error-accent)',

    warningText: 'var(--state-warning-dark)',

    infoBg:   'var(--state-info-blue-bg)',
    infoIcon: 'var(--state-info-blue-mid)',

    successBg:   'var(--state-success-bg)',
    successIcon: 'var(--state-success-text)',

    amberBg:   'var(--state-warning-bg)',
    amberIcon: 'var(--state-warning-text)',

    // Purple (low-priority info badge) — maps to brand for theme cohesion
    purpleBg:   'color-mix(in oklch, var(--brand-color) 8%, var(--background))',
    purpleIcon: 'var(--brand-color)'
  },

  // ─── Sidebar active strip ───────────────────────────────────────────────────
  sidebar: {
    activeBg: 'var(--brand-color-dark)'              // exxat-ds brand dark
  },

  // ─── Exam accent — maps to DS chart-1 (indigo)
  exam: {
    accent:       'var(--exam-accent)',
    accentHover:  'var(--exam-accent-hover)',
    accentLight:  'var(--exam-accent-light)',
    accentBorder: 'var(--exam-accent-border)',
    accentMid:    'var(--exam-accent-mid)'
  },

  // ─── Calculator — neutral grey via zero-chroma color-mix
  // (--foreground and --background both have chroma 0, so the mix is
  // guaranteed hue-neutral under any theme).
  calc: {
    displayBg: 'var(--calc-display-bg)',
    numBtn:    'var(--background)',
    numBorder: 'var(--border)',
    numText:   'var(--foreground)',
    opBtn:     'color-mix(in oklch, var(--foreground) 4%, var(--background))',
    opBorder:  'var(--border)',
    opText:    'color-mix(in oklch, var(--foreground) 75%, var(--background))',
    sciBtn:    'var(--exam-accent-light)',
    sciBorder: 'var(--exam-accent-border)',
    sciText:   'var(--exam-accent-hover)',
    equalBtn:  'var(--brand-color)',
    equalHover:'var(--brand-color-dark)',
    headerBg:  'color-mix(in oklch, var(--foreground) 3%, var(--background))'
  }
} as const;

/**
 * CSS custom property map — mirrors tokens above.
 * Injected into :root in index.css.
 * Reference in Tailwind via `var(--token-name)`.
 */
export const cssVars = `
  /* Brand */
  --brand-primary:        ${tokens.brand.primary};
  --brand-primary-hover:  ${tokens.brand.primaryHover};
  --brand-primary-active: ${tokens.brand.primaryActive};
  --brand-primary-bg:     ${tokens.brand.primaryBg};
  --brand-primary-border: ${tokens.brand.primaryBorder};
  --brand-primary-mid:    ${tokens.brand.primaryMid};
  --brand-primary-mid-bg: ${tokens.brand.primaryMidBg};

  /* Surface */
  --surface-page:    ${tokens.surface.page};
  --surface-white:   ${tokens.surface.white};
  --surface-subtle:  ${tokens.surface.subtle};
  --surface-muted:   ${tokens.surface.muted};

  /* Text */
  --text-primary:     ${tokens.text.primary};
  --text-secondary:   ${tokens.text.secondary};
  --text-muted:       ${tokens.text.muted};
  --text-subtle:      ${tokens.text.subtle};
  --text-placeholder: ${tokens.text.placeholder};
  --text-inverse:     ${tokens.text.inverse};

  /* Border */
  --border-default: ${tokens.border.default};
  --border-medium:  ${tokens.border.medium};
  --border-focus:   ${tokens.border.focus};

  /* State */
  --state-answered-bg:     ${tokens.state.answeredBg};
  --state-answered-border: ${tokens.state.answeredBorder};
  --state-answered-text:   ${tokens.state.answeredText};
  --state-flagged-bg:      ${tokens.state.flaggedBg};
  --state-flagged-border:  ${tokens.state.flaggedBorder};
  --state-flagged-text:    ${tokens.state.flaggedText};
  --state-current-bg:      ${tokens.state.currentBg};

  /* Exam accent */
  --exam-accent:        ${tokens.exam.accent};
  --exam-accent-hover:  ${tokens.exam.accentHover};
  --exam-accent-light:  ${tokens.exam.accentLight};
  --exam-accent-border: ${tokens.exam.accentBorder};
  --exam-accent-mid:    ${tokens.exam.accentMid};

  /* Semantic */
  --semantic-error-text:   ${tokens.semantic.errorText};
  --semantic-error-bg:     ${tokens.semantic.errorBg};
  --semantic-error-border: ${tokens.semantic.errorBorder};
  --semantic-error-dot:    ${tokens.semantic.errorDot};
`;