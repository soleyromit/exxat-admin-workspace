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

  // ─── Exam states — studentUX-specific (no exxat-ds equivalent) ─────────────
  state: {
    // Answered question — green indicator
    answeredBg: '#DCFCE7',
    answeredBorder: '#4ADE80',
    answeredText: '#15803D',

    // Flagged question — amber indicator
    flaggedBg: '#FEF9C3',
    flaggedBorder: '#FACC15',
    flaggedText: '#92400E',

    // Required / unanswered warning (not destructive — informational)
    requiredBg: '#FFFFFF',
    requiredBorder: '#F87171',
    requiredShadow: 'rgba(254,226,226,1)',

    // Current active question in navigator — uses brand
    currentBg: 'var(--brand-color, #7C3AED)',
    currentText: 'var(--brand-foreground, #FFFFFF)'
  },

  // ─── Semantic — delegates to exxat-ds for error ─────────────────────────────
  semantic: {
    errorText: 'var(--destructive, #DC2626)',
    errorBg: '#FEF2F2',
    errorBorder: '#FECACA',
    errorDot: 'var(--destructive, #EF4444)',

    warningText: '#D97706',

    infoBg: '#EFF6FF', // blue-50
    infoIcon: '#3B82F6', // blue-500

    successBg: '#F0FDF4', // green-50
    successIcon: '#22C55E', // green-500

    amberBg: '#FFFBEB', // amber-50
    amberIcon: '#F59E0B', // amber-500

    purpleBg: '#FAF5FF', // purple-50
    purpleIcon: '#A855F7' // purple-500
  },

  // ─── Sidebar active strip ───────────────────────────────────────────────────
  sidebar: {
    activeBg: 'var(--brand-color-dark, #5B21B6)'     // exxat-ds brand dark
  },

  // ─── Exam accent (blue) ─────────────────────────────────────────────────────
  exam: {
    accent: '#2563EB', // blue-600 — current-question highlight, active icons
    accentHover: '#1D4ED8', // blue-700 — hover on accent elements
    accentLight: '#EFF6FF', // blue-50  — active tool background, tinted panels
    accentBorder: '#BFDBFE', // blue-200 — border on accent-tinted surfaces
    accentMid: '#3B82F6' // blue-500 — secondary accent uses
  },

  // ─── Calculator ─────────────────────────────────────────────────────────────
  calc: {
    displayBg: '#111827', // gray-900
    numBtn: '#FFFFFF',
    numBorder: '#E5E7EB',
    numText: '#1F2937',
    opBtn: '#F3F4F6',
    opBorder: '#E5E7EB',
    opText: '#374151',
    sciBtn: '#EFF6FF',
    sciBorder: '#BFDBFE',
    sciText: '#1D4ED8',
    equalBtn: 'var(--brand-color, #7C3AED)',
    equalHover: 'var(--brand-color-dark, #5B21B6)',
    headerBg: '#F9FAFB'
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