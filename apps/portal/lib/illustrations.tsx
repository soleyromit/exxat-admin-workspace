/**
 * Per-product flat SVG illustrations.
 * Each is a 160×120 viewBox composed of geometric shapes themed to the product domain.
 * All shapes use `currentColor` so they inherit the product icon color.
 */

export function ExamIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Stacked answer sheets at angles */}
      <rect x="22" y="18" width="68" height="88" rx="5" fill="currentColor" opacity="0.12" transform="rotate(-10 56 62)" />
      <rect x="52" y="12" width="68" height="88" rx="5" fill="currentColor" opacity="0.18" transform="rotate(4 86 56)" />
      <rect x="42" y="16" width="68" height="88" rx="5" fill="currentColor" opacity="0.22" />
      {/* Ruled lines on the front sheet */}
      <rect x="58" y="38" width="40" height="3.5" rx="1.75" fill="currentColor" opacity="0.5" />
      <rect x="58" y="50" width="34" height="3.5" rx="1.75" fill="currentColor" opacity="0.5" />
      <rect x="58" y="62" width="38" height="3.5" rx="1.75" fill="currentColor" opacity="0.5" />
      <rect x="58" y="74" width="28" height="3.5" rx="1.75" fill="currentColor" opacity="0.5" />
      {/* Pencil shape */}
      <rect x="120" y="20" width="8" height="60" rx="3" fill="currentColor" opacity="0.3" transform="rotate(30 124 50)" />
      <polygon points="125,78 119,90 131,90" fill="currentColor" opacity="0.4" transform="rotate(30 125 84)" />
    </svg>
  )
}

export function PceIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* ECG monitor wave */}
      <polyline
        points="0,65 30,65 45,65 55,22 68,108 80,35 92,65 110,65 130,65 160,65"
        stroke="currentColor" strokeWidth="3.5" strokeLinejoin="round" opacity="0.55"
      />
      {/* Decorative circles (monitor frame + vitals) */}
      <circle cx="22" cy="28" r="16" stroke="currentColor" strokeWidth="2.5" opacity="0.2" />
      <circle cx="140" cy="90" r="22" stroke="currentColor" strokeWidth="2.5" opacity="0.15" />
      <circle cx="22" cy="28" r="6" fill="currentColor" opacity="0.18" />
    </svg>
  )
}

export function PatientLogIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Clipboard body */}
      <rect x="38" y="14" width="84" height="98" rx="7" fill="currentColor" opacity="0.18" />
      {/* Clipboard clip */}
      <rect x="62" y="8" width="36" height="16" rx="4" fill="currentColor" opacity="0.32" />
      {/* List items — bullet + line */}
      <circle cx="56" cy="46" r="3.5" fill="currentColor" opacity="0.55" />
      <rect x="66" y="43" width="42" height="6" rx="3" fill="currentColor" opacity="0.4" />
      <circle cx="56" cy="64" r="3.5" fill="currentColor" opacity="0.55" />
      <rect x="66" y="61" width="36" height="6" rx="3" fill="currentColor" opacity="0.4" />
      <circle cx="56" cy="82" r="3.5" fill="currentColor" opacity="0.55" />
      <rect x="66" y="79" width="44" height="6" rx="3" fill="currentColor" opacity="0.4" />
      <circle cx="56" cy="100" r="3.5" fill="currentColor" opacity="0.3" />
      <rect x="66" y="97" width="28" height="6" rx="3" fill="currentColor" opacity="0.25" />
    </svg>
  )
}

export function SkillsIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 3×2 grid of checkboxes */}
      {[18, 62, 106].map((x) =>
        [16, 64].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="36" height="36" rx="5" fill="currentColor" opacity="0.18" />
        ))
      )}
      {/* Checkmarks on some boxes */}
      <polyline points="24,34 32,42 48,26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points="68,34 76,42 92,26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points="24,82 32,90 48,74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
      {/* Partial checkmark on third box (in progress) */}
      <polyline points="112,34 120,42 136,26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
    </svg>
  )
}

export function LearningContractsIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* Document */}
      <rect x="28" y="8" width="88" height="104" rx="7" fill="currentColor" opacity="0.18" />
      {/* Folded corner */}
      <path d="M96 8 L116 28 L96 28 Z" fill="currentColor" opacity="0.28" />
      {/* Text lines */}
      <rect x="42" y="38" width="60" height="5" rx="2.5" fill="currentColor" opacity="0.45" />
      <rect x="42" y="52" width="52" height="5" rx="2.5" fill="currentColor" opacity="0.45" />
      <rect x="42" y="66" width="56" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
      {/* Signature wave */}
      <path d="M42 88 Q52 74 62 88 Q72 102 82 88 Q92 74 102 88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      {/* Seal dot */}
      <circle cx="118" cy="94" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="118" cy="94" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function FaasIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      {/* 3×2 form blocks — different widths suggesting form fields */}
      <rect x="12" y="12" width="60" height="30" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="82" y="12" width="66" height="30" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="12" y="52" width="136" height="30" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="12" y="92" width="40" height="20" rx="5" fill="currentColor" opacity="0.35" />
      <rect x="62" y="92" width="86" height="20" rx="5" fill="currentColor" opacity="0.15" />
      {/* Field label lines */}
      <rect x="20" y="20" width="28" height="4" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="90" y="20" width="36" height="4" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="20" y="60" width="50" height="4" rx="2" fill="currentColor" opacity="0.4" />
      {/* Submit button hint */}
      <rect x="14" y="94" width="36" height="16" rx="4" fill="currentColor" opacity="0.45" />
    </svg>
  )
}

export const ILLUSTRATIONS: Record<string, React.FC> = {
  em:   ExamIllustration,
  pce:  PceIllustration,
  pl:   PatientLogIllustration,
  sc:   SkillsIllustration,
  lc:   LearningContractsIllustration,
  faas: FaasIllustration,
}
