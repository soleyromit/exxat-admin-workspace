/**
 * Per-product hero vignettes — miniature product-UI mockups, not clip-art.
 * Pattern reference: Asana workflow gallery / Stripe checkout preview (Mobbin).
 *
 * Grammar shared by every vignette:
 *  - a `var(--card)` mini window with a `var(--border)` hairline + soft shadow,
 *    showing a believable slice of the product's real UI as skeleton shapes;
 *  - accents in `currentColor` (the product hue set by the gradient wrapper),
 *    neutrals in `var(--muted-foreground)` washes — theme-aware, no literals;
 *  - 320×200 viewBox, default (meet) scaling — each consumer positions the art
 *    with an explicit wrapper box (often bottom-cropped, "window rising" style),
 *    so the vignette never letterboxes or over-zooms.
 */

const NEUTRAL = 'var(--muted-foreground)'
const SURFACE = 'var(--card)'
const HAIRLINE = 'var(--border)'

/** Soft drop shadow behind a window rect (SVG has no box-shadow). */
function WindowShadow({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <rect x={x - 3} y={y + 4} width={w + 6} height={h} rx="12" fill="currentColor" opacity="0.10" />
      <rect x={x - 7} y={y + 9} width={w + 14} height={h} rx="14" fill="currentColor" opacity="0.05" />
    </>
  )
}

function Window({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  return (
    <>
      <WindowShadow x={x} y={y} w={w} h={h} />
      <rect x={x} y={y} width={w} height={h} rx="10" fill={SURFACE} stroke={HAIRLINE} strokeWidth="1" />
    </>
  )
}

/** Exam Management — a question card mid-answer: options, one selected, score chip. */
export function ExamIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Window x={78} y={34} w={164} h={148} />
      {/* Question stem */}
      <rect x={94} y={52} width={110} height={7} rx="3.5" fill={NEUTRAL} opacity="0.45" />
      <rect x={94} y={65} width={78} height={7} rx="3.5" fill={NEUTRAL} opacity="0.28" />
      {/* Option rows — 2nd selected */}
      <circle cx={101} cy={94} r="6" stroke={NEUTRAL} strokeWidth="2" opacity="0.35" />
      <rect x={114} y={90} width={92} height={7} rx="3.5" fill={NEUTRAL} opacity="0.22" />
      <circle cx={101} cy={120} r="6.5" fill="currentColor" opacity="0.9" />
      <circle cx={101} cy={120} r="2.5" fill={SURFACE} />
      <rect x={114} y={116} width={104} height={7} rx="3.5" fill="currentColor" opacity="0.55" />
      <rect x={114} y={116} width={104} height={7} rx="3.5" fill={NEUTRAL} opacity="0.12" />
      <circle cx={101} cy={146} r="6" stroke={NEUTRAL} strokeWidth="2" opacity="0.35" />
      <rect x={114} y={142} width={72} height={7} rx="3.5" fill={NEUTRAL} opacity="0.22" />
      {/* Floating score chip overlapping the window's top-right corner */}
      <g>
        <rect x={206} y={22} width={52} height={26} rx="13" fill="currentColor" opacity="0.95" />
        <path d="M 220 35 L 226 41 L 240 28" stroke={SURFACE} strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round" fill="none" />
      </g>
    </svg>
  )
}

/** Surveys & Course Evaluations — response bars filling in, respondent dots. */
export function PceIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Window x={74} y={36} w={172} h={144} />
      {/* Card title */}
      <rect x={90} y={52} width={84} height={7} rx="3.5" fill={NEUTRAL} opacity="0.45" />
      {/* Response bars: label + track + accent fill */}
      {[
        { y: 76, fill: 118 },
        { y: 102, fill: 88 },
        { y: 128, fill: 132 },
        { y: 154, fill: 56 },
      ].map((bar) => (
        <g key={bar.y}>
          <rect x={90} y={bar.y - 8} width={34} height={6} rx="3" fill={NEUTRAL} opacity="0.28" />
          <rect x={90} y={bar.y + 2} width={140} height="9" rx="4.5" fill={NEUTRAL} opacity="0.12" />
          <rect x={90} y={bar.y + 2} width={bar.fill} height="9" rx="4.5" fill="currentColor" opacity="0.65" />
        </g>
      ))}
      {/* Floating respondent chip */}
      <g>
        <rect x={214} y={24} width={58} height={26} rx="13" fill={SURFACE} stroke={HAIRLINE} strokeWidth="1" />
        <circle cx={230} cy={37} r="6" fill="currentColor" opacity="0.75" />
        <circle cx={240} cy={37} r="6" fill="currentColor" opacity="0.45" />
        <circle cx={250} cy={37} r="6" fill="currentColor" opacity="0.25" />
      </g>
    </svg>
  )
}

/** Clinical & Experiential Education — rotation roster: site chips, dates, status. */
export function ClinicalIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Window x={72} y={34} w={176} h={150} />
      {/* Header */}
      <rect x={88} y={50} width={92} height={7} rx="3.5" fill={NEUTRAL} opacity="0.45" />
      {/* Rotation rows: site chip + student line + status dot */}
      {[
        { y: 74, chip: 0.75, line: 74, status: 0.9 },
        { y: 104, chip: 0.5, line: 90, status: 0.9 },
        { y: 134, chip: 0.3, line: 62, status: 0.3 },
      ].map((row) => (
        <g key={row.y}>
          <rect x={88} y={row.y} width={42} height={18} rx="6" fill="currentColor" opacity={row.chip * 0.35} />
          <circle cx={99} cy={row.y + 9} r="3.5" fill="currentColor" opacity={row.chip} />
          <rect x={140} y={row.y + 5.5} width={row.line} height={7} rx="3.5" fill={NEUTRAL} opacity="0.25" />
          <circle cx={230} cy={row.y + 9} r="5" fill="currentColor" opacity={row.status * 0.7} />
        </g>
      ))}
      {/* Row separators */}
      <rect x={88} y={97} width={144} height="1" fill={HAIRLINE} />
      <rect x={88} y={127} width={144} height="1" fill={HAIRLINE} />
      {/* Floating map-pin chip — placement identity */}
      <g>
        <rect x={216} y={22} width={44} height={30} rx="13" fill="currentColor" opacity="0.95" />
        <path d="M 238 45 L 232.5 34 A 7.5 7.5 0 1 1 243.5 34 Z" fill={SURFACE} />
        <circle cx={238} cy={32.5} r="3" fill="currentColor" opacity="0.95" />
      </g>
    </svg>
  )
}

/** Curriculum Mapping — course × competency alignment matrix with coverage fills. */
export function CurriculumIllustration() {
  const filled: Array<[number, number, number]> = [
    [0, 0, 0.7], [2, 0, 0.35], [1, 1, 0.7], [3, 1, 0.5], [0, 2, 0.35], [2, 2, 0.7], [4, 2, 0.5], [1, 3, 0.5], [4, 0, 0.5],
  ]
  const cell = (c: number, r: number) => ({ x: 118 + c * 26, y: 66 + r * 26 })
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Window x={74} y={34} w={172} h={150} />
      {/* Row labels (courses) */}
      {[0, 1, 2, 3].map((r) => (
        <rect key={r} x={88} y={72 + r * 26} width={22} height={6} rx="3" fill={NEUTRAL} opacity="0.3" />
      ))}
      {/* Column header ticks (competencies) */}
      {[0, 1, 2, 3, 4].map((c) => (
        <rect key={c} x={124 + c * 26} y={50} width={12} height={6} rx="3" fill={NEUTRAL} opacity="0.3" />
      ))}
      {/* Matrix cells */}
      {[0, 1, 2, 3].map((r) =>
        [0, 1, 2, 3, 4].map((c) => (
          <rect
            key={`${r}-${c}`}
            x={cell(c, r).x}
            y={cell(c, r).y}
            width={20}
            height={20}
            rx="5"
            fill={NEUTRAL}
            opacity="0.08"
          />
        )),
      )}
      {filled.map(([c, r, o]) => (
        <rect key={`f${c}-${r}`} x={cell(c, r).x} y={cell(c, r).y} width={20} height={20} rx="5" fill="currentColor" opacity={o} />
      ))}
    </svg>
  )
}

/** Compliance Management — requirement checklist: cleared checks, one pending. */
export function ComplianceIllustration() {
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Window x={76} y={34} w={168} h={150} />
      <rect x={92} y={50} width={88} height={7} rx="3.5" fill={NEUTRAL} opacity="0.45" />
      {/* Checklist rows */}
      {[
        { y: 80, w: 88, done: true },
        { y: 110, w: 104, done: true },
        { y: 140, w: 70, done: false },
      ].map((row) => (
        <g key={row.y}>
          {row.done ? (
            <>
              <circle cx={102} cy={row.y} r="8.5" fill="currentColor" opacity="0.85" />
              <path
                d={`M ${97.5} ${row.y} L ${100.5} ${row.y + 3} L ${106.5} ${row.y - 3.5}`}
                stroke={SURFACE}
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                fill="none"
              />
            </>
          ) : (
            <circle cx={102} cy={row.y} r="8" stroke={NEUTRAL} strokeWidth="2" opacity="0.35" />
          )}
          <rect x={120} y={row.y - 3.5} width={row.w} height={7} rx="3.5" fill={NEUTRAL} opacity={row.done ? 0.25 : 0.18} />
        </g>
      ))}
      {/* Floating shield chip */}
      <g>
        <rect x={208} y={22} width={48} height={28} rx="13" fill="currentColor" opacity="0.95" />
        <path
          d="M 232 28 L 241 30.5 L 241 37 C 241 41.5 237.5 44.5 232 46 C 226.5 44.5 223 41.5 223 37 L 223 30.5 Z"
          fill={SURFACE}
        />
      </g>
    </svg>
  )
}

/** Accreditation Management — readiness ring + evidence rows. */
export function AccreditationIllustration() {
  // r=26 → circumference ≈ 163.4; show ~72% readiness
  const C = 2 * Math.PI * 26
  return (
    <svg viewBox="0 0 320 200" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <Window x={72} y={34} w={176} h={150} />
      {/* Readiness ring */}
      <circle cx={118} cy={94} r="26" stroke={NEUTRAL} strokeWidth="9" opacity="0.15" fill="none" />
      <circle
        cx={118}
        cy={94}
        r="26"
        stroke="currentColor"
        strokeWidth="9"
        strokeLinecap="round"
        fill="none"
        strokeDasharray={`${C * 0.72} ${C}`}
        transform="rotate(-90 118 94)"
        opacity="0.85"
      />
      <rect x={104} y={132} width={28} height={6} rx="3" fill={NEUTRAL} opacity="0.3" />
      {/* Evidence rows: doc glyph + line + linked check */}
      {[
        { y: 66, w: 56, done: 0.85 },
        { y: 94, w: 68, done: 0.85 },
        { y: 122, w: 48, done: 0.3 },
      ].map((row) => (
        <g key={row.y}>
          <rect x={162} y={row.y - 8} width={13} height={16} rx="3" fill="currentColor" opacity="0.3" />
          <rect x={182} y={row.y - 3.5} width={row.w} height={7} rx="3.5" fill={NEUTRAL} opacity="0.25" />
          <circle cx={236} cy={row.y} r="4.5" fill="currentColor" opacity={row.done * 0.8} />
        </g>
      ))}
    </svg>
  )
}

/* ── Legacy flat illustrations (unused by current PRODUCTS colorKeys) ─────── */

export function PatientLogIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="38" y="14" width="84" height="98" rx="7" fill="currentColor" opacity="0.18" />
      <rect x="62" y="8" width="36" height="16" rx="4" fill="currentColor" opacity="0.32" />
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
      {[18, 62, 106].map((x) =>
        [16, 64].map((y) => (
          <rect key={`${x}-${y}`} x={x} y={y} width="36" height="36" rx="5" fill="currentColor" opacity="0.18" />
        ))
      )}
      <polyline points="24,34 32,42 48,26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points="68,34 76,42 92,26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.6" />
      <polyline points="24,82 32,90 48,74" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.45" />
      <polyline points="112,34 120,42 136,26" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" opacity="0.25" />
    </svg>
  )
}

export function LearningContractsIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="28" y="8" width="88" height="104" rx="7" fill="currentColor" opacity="0.18" />
      <path d="M96 8 L116 28 L96 28 Z" fill="currentColor" opacity="0.28" />
      <rect x="42" y="38" width="60" height="5" rx="2.5" fill="currentColor" opacity="0.45" />
      <rect x="42" y="52" width="52" height="5" rx="2.5" fill="currentColor" opacity="0.45" />
      <rect x="42" y="66" width="56" height="5" rx="2.5" fill="currentColor" opacity="0.35" />
      <path d="M42 88 Q52 74 62 88 Q72 102 82 88 Q92 74 102 88" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" opacity="0.6" />
      <circle cx="118" cy="94" r="10" stroke="currentColor" strokeWidth="2" opacity="0.3" />
      <circle cx="118" cy="94" r="4" fill="currentColor" opacity="0.3" />
    </svg>
  )
}

export function FaasIllustration() {
  return (
    <svg viewBox="0 0 160 120" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
      <rect x="12" y="12" width="60" height="30" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="82" y="12" width="66" height="30" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="12" y="52" width="136" height="30" rx="5" fill="currentColor" opacity="0.2" />
      <rect x="12" y="92" width="40" height="20" rx="5" fill="currentColor" opacity="0.35" />
      <rect x="62" y="92" width="86" height="20" rx="5" fill="currentColor" opacity="0.15" />
      <rect x="20" y="20" width="28" height="4" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="90" y="20" width="36" height="4" rx="2" fill="currentColor" opacity="0.4" />
      <rect x="20" y="60" width="50" height="4" rx="2" fill="currentColor" opacity="0.4" />
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
  cee:  ClinicalIllustration,
  cm:   CurriculumIllustration,
  cmp:  ComplianceIllustration,
  am:   AccreditationIllustration,
}
