/**
 * Product cover art for "More from Exxat" shelf cards and the featured banner.
 *
 * Mini product UI vignettes — each scene shows the job the product does, in
 * that product's brand colour (`--brand-color` set by the host card).
 *
 *   - one 240×132 canvas so every cover crops the same
 *   - soft brand wash + window chrome for depth, unless a host that still
 *     lights the surface itself passes `litByHost` (shelf cards no longer do)
 *   - structure in `currentColor`, one clear brand focal
 *   - no hex — only `currentColor` and `brand` token classes
 */

import { createContext, useContext } from "react"

import type { Product } from "@/contexts/product-context"

/**
 * Whether the drawing lights itself.
 *
 * The scenes were written for a host that supplies a flat fill, so each one
 * carries its own brand haze. A host that lights the whole card instead — the
 * shelf card's radial glow — then has two light sources, and the haze is a solid
 * circle at 12%, so its edge shows against a smooth falloff and the card looks
 * like it has a smudge on it. Such a host turns the haze off and keeps one.
 */
const LitByHost = createContext(false)

function IllustrationFrame({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 240 132"
      className="h-full w-full max-h-[10rem] text-foreground/50"
      fill="none"
      strokeWidth={1.35}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

/** Soft brand atmosphere — two depths, never multi-hue chart fills. */
function Atmosphere({
  cx = 188,
  cy = 28,
  r = 56,
}: {
  cx?: number
  cy?: number
  r?: number
}) {
  if (useContext(LitByHost)) return null

  return (
    <>
      <circle cx={cx} cy={cy} r={r} className="fill-brand/12" />
      <circle cx={cx - 36} cy={cy + 28} r={r * 0.42} className="fill-brand/7" />
    </>
  )
}

/** Floating window chrome shared by denser scenes. */
function WindowChrome({
  x,
  y,
  w,
  h,
  rx = 12,
}: {
  x: number
  y: number
  w: number
  h: number
  rx?: number
}) {
  return (
    <>
      <rect
        x={x}
        y={y}
        width={w}
        height={h}
        rx={rx}
        className="fill-background stroke-current"
      />
      <path
        d={`M${x} ${y + 18}h${w}`}
        stroke="currentColor"
        className="opacity-40"
      />
      <circle cx={x + 12} cy={y + 9} r={2.5} className="fill-foreground/25" />
      <circle cx={x + 22} cy={y + 9} r={2.5} className="fill-foreground/20" />
      <circle cx={x + 32} cy={y + 9} r={2.5} className="fill-foreground/15" />
    </>
  )
}

/** One course fanned into competencies — one already assessed. */
function CurriculumMappingArt() {
  return (
    <IllustrationFrame>
      <Atmosphere />
      <WindowChrome x={10} y={14} w={96} h={104} rx={14} />
      <rect x={22} y={40} width={72} height={8} rx={3} className="fill-foreground/10" />
      <rect x={22} y={56} width={56} height={8} rx={3} className="fill-foreground/8" />
      <rect x={22} y={72} width={64} height={8} rx={3} className="fill-foreground/8" />
      <rect x={22} y={88} width={40} height={8} rx={3} className="fill-brand/25" />
      <path
        d="M106 52C124 44 132 30 152 28"
        stroke="currentColor"
        strokeDasharray="3 4"
        className="opacity-55"
      />
      <path d="M106 70h46" stroke="currentColor" strokeDasharray="3 4" className="opacity-55" />
      <path
        d="M106 88C124 96 132 108 152 110"
        stroke="currentColor"
        strokeDasharray="3 4"
        className="opacity-55"
      />
      <rect x={152} y={16} width={78} height={28} rx={8} className="fill-foreground/5 stroke-current" />
      <path d="M164 30h42" stroke="currentColor" />
      <rect
        x={152}
        y={52}
        width={78}
        height={28}
        rx={8}
        className="fill-brand/16 stroke-brand"
      />
      <path d="M164 66l5 5 12-13" className="stroke-brand" strokeWidth={2} />
      <path d="M186 66h28" className="stroke-brand/50" />
      <rect x={152} y={88} width={78} height={28} rx={8} className="fill-foreground/5 stroke-current" />
      <path d="M164 102h36" stroke="currentColor" />
    </IllustrationFrame>
  )
}

/** Requirements cleared before the floor — one still open. */
function ComplianceArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={48} cy={36} r={50} />
      <path
        d="M52 18l30 11v28c0 22-15 36-30 42-15-6-30-20-30-42V29z"
        className="fill-brand/14 stroke-brand"
      />
      <path d="M40 58l9 9 18-22" className="stroke-brand" strokeWidth={2.1} />
      <WindowChrome x={104} y={20} w={124} h={92} rx={14} />
      <circle cx={126} cy={48} r={8} className="fill-brand/14 stroke-brand" />
      <path d="M122 48l3 3 7-8" className="stroke-brand" />
      <path d="M142 48h66" stroke="currentColor" />
      <circle cx={126} cy={72} r={8} className="fill-foreground/6 stroke-current" />
      <path d="M122 72l3 3 7-8" stroke="currentColor" />
      <path d="M142 72h54" stroke="currentColor" />
      <circle cx={126} cy={96} r={8} stroke="currentColor" strokeDasharray="3 3" />
      <path d="M142 96h46" stroke="currentColor" strokeDasharray="3 4" />
    </IllustrationFrame>
  )
}

/** A response on a scale, becoming a distribution you can read. */
function SurveysArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={196} cy={24} r={48} />
      <WindowChrome x={12} y={16} w={108} h={100} rx={14} />
      <path d="M28 42h72" stroke="currentColor" />
      <circle cx={36} cy={66} r={8} className="fill-foreground/6 stroke-current" />
      <circle cx={58} cy={66} r={8} className="fill-foreground/6 stroke-current" />
      <circle cx={80} cy={66} r={8} className="fill-brand/22 stroke-brand" strokeWidth={2} />
      <circle cx={102} cy={66} r={8} className="fill-foreground/6 stroke-current" />
      <path d="M28 90h52" stroke="currentColor" className="opacity-50" />
      <path d="M138 112h88" stroke="currentColor" className="opacity-45" />
      <rect x={144} y={78} width={18} height={34} rx={4} className="fill-foreground/8 stroke-current" />
      <rect x={170} y={58} width={18} height={54} rx={4} className="fill-foreground/8 stroke-current" />
      <rect
        x={196}
        y={34}
        width={18}
        height={78}
        rx={4}
        className="fill-brand/20 stroke-brand"
      />
      <circle cx={205} cy={28} r={5} className="fill-brand stroke-brand" />
    </IllustrationFrame>
  )
}

/** Practical exam: questions authored, scored, sat against the clock. */
function ExamManagementArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={44} cy={96} r={44} />
      <WindowChrome x={12} y={12} w={128} h={108} rx={14} />
      <rect x={26} y={38} width={100} height={10} rx={3} className="fill-foreground/10" />
      <rect x={26} y={56} width={100} height={10} rx={3} className="fill-foreground/8" />
      <rect x={26} y={74} width={62} height={10} rx={3} className="fill-foreground/8" />
      <circle cx={112} cy={98} r={14} className="fill-brand/18 stroke-brand" />
      <path d="M106 98l5 5 11-13" className="stroke-brand" strokeWidth={2} />
      <circle cx={190} cy={66} r={34} className="fill-brand/10 stroke-brand" />
      <circle cx={190} cy={66} r={26} stroke="currentColor" />
      <path d="M190 46v22l14 9" className="stroke-brand" strokeWidth={2} />
      <circle cx={190} cy={66} r={3.5} className="fill-brand stroke-brand" />
    </IllustrationFrame>
  )
}

/** Evidence assembled into the self-study. */
function AccreditationArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={188} cy={78} r={50} />
      <rect
        x={18}
        y={40}
        width={62}
        height={76}
        rx={10}
        className="fill-foreground/4 stroke-current"
      />
      <rect
        x={36}
        y={26}
        width={62}
        height={76}
        rx={10}
        className="fill-foreground/5 stroke-current"
      />
      <rect
        x={54}
        y={12}
        width={62}
        height={76}
        rx={10}
        className="fill-background stroke-current"
      />
      <path d="M68 32h34M68 46h34M68 60h22" stroke="currentColor" />
      <path
        d="M116 52c24 4 30-4 44-6"
        stroke="currentColor"
        strokeDasharray="3 4"
        className="opacity-55"
      />
      <circle cx={186} cy={52} r={28} className="fill-brand/16 stroke-brand" />
      <path
        d="M186 32l7 13h15l-12 10 5 15-15-9-15 9 5-15-12-10h15z"
        className="fill-brand/28 stroke-brand"
      />
    </IllustrationFrame>
  )
}

/** One student's trajectory against the outcome the program aims at. */
function StudentSuccessArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={36} cy={28} r={46} />
      <WindowChrome x={14} y={14} w={212} h={104} rx={16} />
      <path d="M36 96V40h176" stroke="currentColor" className="opacity-40" />
      <path d="M36 64h176" stroke="currentColor" strokeDasharray="3 5" className="opacity-30" />
      <path
        d="M48 88c20-7 32-2 48 2 18 5 32-12 50-26 16-12 32-18 52-22"
        className="stroke-brand"
        strokeWidth={2.25}
      />
      <circle cx={96} cy={88} r={5} className="fill-foreground/10 stroke-current" />
      <circle cx={146} cy={64} r={5} className="fill-foreground/10 stroke-current" />
      <circle cx={198} cy={42} r={9} className="fill-brand/22 stroke-brand" strokeWidth={2} />
      <path d="M198 51v37" className="stroke-brand/35" strokeDasharray="3 4" />
    </IllustrationFrame>
  )
}

/** Clinical Education — today's attention list beside a KPI. */
function PrismArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={200} cy={30} r={52} />
      <WindowChrome x={12} y={12} w={216} h={108} rx={14} />
      <rect
        x={24}
        y={38}
        width={72}
        height={68}
        rx={10}
        className="fill-brand/14 stroke-brand"
      />
      <path d="M36 54h48M36 68h36M36 82h40" className="stroke-brand/55" />
      <rect x={108} y={40} width={108} height={18} rx={6} className="fill-foreground/6 stroke-current" />
      <rect x={108} y={66} width={108} height={18} rx={6} className="fill-foreground/5 stroke-current" />
      <rect
        x={108}
        y={92}
        width={108}
        height={18}
        rx={6}
        className="fill-brand/12 stroke-brand"
      />
    </IllustrationFrame>
  )
}

/** Availability rows filling up. True from either side of the handshake, so both
 *  Exxat One ids share it. */
function ExxatOneArt() {
  return (
    <IllustrationFrame>
      <Atmosphere cx={40} cy={88} r={48} />
      <WindowChrome x={14} y={14} w={212} h={104} rx={14} />
      <rect x={28} y={40} width={44} height={10} rx={3} className="fill-foreground/10" />
      <rect x={28} y={58} width={184} height={10} rx={5} className="fill-foreground/8" />
      <rect x={28} y={58} width={120} height={10} rx={5} className="fill-brand/35" />
      <rect x={28} y={78} width={184} height={10} rx={5} className="fill-foreground/8" />
      <rect x={28} y={78} width={72} height={10} rx={5} className="fill-brand/25" />
      <rect x={28} y={98} width={184} height={10} rx={5} className="fill-foreground/8" />
      <rect x={28} y={98} width={156} height={10} rx={5} className="fill-brand/40" />
    </IllustrationFrame>
  )
}

/** Fallback: a workspace of records, with one surfaced. */
function GenericArt() {
  return (
    <IllustrationFrame>
      <Atmosphere />
      <WindowChrome x={14} y={16} w={212} h={100} rx={14} />
      <rect
        x={28}
        y={40}
        width={88}
        height={28}
        rx={8}
        className="fill-foreground/6 stroke-current"
      />
      <path d="M40 54h56" stroke="currentColor" />
      <rect
        x={28}
        y={76}
        width={88}
        height={28}
        rx={8}
        className="fill-foreground/5 stroke-current"
      />
      <path d="M40 90h40" stroke="currentColor" />
      <rect
        x={132}
        y={40}
        width={80}
        height={64}
        rx={12}
        className="fill-brand/16 stroke-brand"
      />
      <path d="M148 62h48M148 78h34" className="stroke-brand/55" />
    </IllustrationFrame>
  )
}

const PRODUCT_ART: Partial<Record<Product, () => React.JSX.Element>> = {
  "exxat-prism": PrismArt,
  "exxat-one-schools": ExxatOneArt,
  "exxat-one-sites": ExxatOneArt,
  "exxat-curriculum-mapping": CurriculumMappingArt,
  "exxat-compliance": ComplianceArt,
  "exxat-surveys": SurveysArt,
  "exxat-exam-management": ExamManagementArt,
  "exxat-accreditation": AccreditationArt,
  "exxat-student-success": StudentSuccessArt,
}

export function ProductIllustration({
  product,
  /** Set by a host that lights the surface itself. See `LitByHost`. */
  litByHost = false,
}: {
  product: Product
  litByHost?: boolean
}) {
  const Art = PRODUCT_ART[product] ?? GenericArt
  return (
    <LitByHost.Provider value={litByHost}>
      <Art />
    </LitByHost.Provider>
  )
}
