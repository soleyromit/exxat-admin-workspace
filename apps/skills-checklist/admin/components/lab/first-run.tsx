"use client"

/**
 * The first time a setup screen has nothing on it: a drawing of what will be here, what to do, and the ways to do it.
 * Only the three places setup starts from use it: the library, the skill lists page and a new list. A search or filter
 * that finds nothing stays EmptyBlock, since there the drawing would only decorate a dead end.
 *
 * The drawings follow the DS product-illustration language: one canvas, structure in currentColor, one brand focal, a
 * soft brand wash, tokens only, so they follow the theme and dark mode.
 */
import * as React from "react"
import { TYPE } from "@/components/lab/type-scale"

function Canvas({ children }: { children: React.ReactNode }) {
  return (
    <svg viewBox="0 0 240 132" className="h-auto w-full max-w-60 text-foreground/50" fill="none" strokeWidth={1.35} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      <circle cx={120} cy={66} r={60} className="fill-brand/10" />
      <circle cx={186} cy={34} r={22} className="fill-brand/7" />
      {children}
    </svg>
  )
}

/** A row of a list: a mark and a name. */
function Row({ x, y, w, done = false }: { x: number; y: number; w: number; done?: boolean }) {
  return (
    <>
      <circle cx={x + 6} cy={y} r={5} stroke="currentColor" className={done ? "fill-brand/15 stroke-brand" : undefined} />
      {done ? <path d={`M${x + 3.6} ${y}l1.7 1.8 3.1-3.4`} className="stroke-brand" /> : null}
      <path d={`M${x + 18} ${y}h${w}`} stroke="currentColor" />
    </>
  )
}

/** A list filling up: two skills on it, the next one arriving from the side. */
function NewListScene() {
  return (
    <Canvas>
      <rect x={62} y={18} width={116} height={96} rx={8} stroke="currentColor" className="fill-background" />
      <path d="M76 34h44" stroke="currentColor" strokeWidth={2.4} />
      <Row x={76} y={52} w={62} done />
      <Row x={76} y={72} w={48} done />
      <rect x={76} y={85} width={88} height={18} rx={4} strokeDasharray="3 3" stroke="currentColor" />
      <rect x={146} y={70} width={68} height={26} rx={6} className="fill-background stroke-brand" />
      <path d="M156 83h26" className="stroke-brand" />
      <circle cx={214} cy={70} r={9} className="fill-brand" />
      <path d="M214 66v8M210 70h8" className="stroke-background" />
    </Canvas>
  )
}

/** A list and the students it reaches. */
function ListsScene() {
  return (
    <Canvas>
      <rect x={34} y={30} width={92} height={80} rx={8} stroke="currentColor" className="fill-background" transform="rotate(-4 80 70)" />
      <rect x={42} y={24} width={92} height={80} rx={8} stroke="currentColor" className="fill-background" />
      <path d="M54 40h38" stroke="currentColor" strokeWidth={2.4} />
      <Row x={54} y={58} w={44} done />
      <Row x={54} y={76} w={34} done />
      <path d="M134 64h22" className="stroke-brand" strokeDasharray="3 3" />
      <path d="M152 60l4 4-4 4" className="stroke-brand" />
      <circle cx={178} cy={50} r={11} stroke="currentColor" className="fill-background" />
      <circle cx={196} cy={66} r={11} stroke="currentColor" className="fill-background" />
      <circle cx={174} cy={78} r={13} className="fill-brand" />
      <circle cx={174} cy={74} r={4} className="fill-background" />
      <path d="M167 86a7 7 0 0 1 14 0" className="stroke-background" />
    </Canvas>
  )
}

/** A library: skills as cards, one being added. */
function LibraryScene() {
  const cards: [number, number][] = [[52, 26], [122, 26], [52, 74]]
  return (
    <Canvas>
      {cards.map(([x, y]) => (
        <g key={`${x}-${y}`}>
          <rect x={x} y={y} width={62} height={40} rx={6} stroke="currentColor" className="fill-background" />
          <path d={`M${x + 10} ${y + 15}h34M${x + 10} ${y + 26}h20`} stroke="currentColor" />
        </g>
      ))}
      <rect x={122} y={74} width={62} height={40} rx={6} strokeDasharray="3 3" className="fill-background stroke-brand" />
      <circle cx={153} cy={94} r={9} className="fill-brand" />
      <path d="M153 90v8M149 94h8" className="stroke-background" />
    </Canvas>
  )
}

/** A list and the courses that expect it. */
function CoursesScene() {
  return (
    <Canvas>
      <rect x={40} y={30} width={76} height={72} rx={8} stroke="currentColor" className="fill-background" />
      <path d="M52 46h32" stroke="currentColor" strokeWidth={2.4} />
      <Row x={52} y={64} w={30} done />
      <Row x={52} y={82} w={22} done />
      <path d="M116 66C132 66 132 34 150 34M116 66h34M116 66C132 66 132 98 150 98" className="stroke-brand" strokeDasharray="3 3" />
      <rect x={150} y={22} width={50} height={24} rx={6} stroke="currentColor" className="fill-background" />
      <rect x={150} y={54} width={50} height={24} rx={6} className="fill-brand stroke-brand" />
      <rect x={150} y={86} width={50} height={24} rx={6} stroke="currentColor" className="fill-background" />
      <path d="M160 34h28M160 98h28" stroke="currentColor" />
      <path d="M160 66h28" className="stroke-background" />
    </Canvas>
  )
}

/** Settings: the controls on one side, the rule they add up to on the other. */
function SettingsScene() {
  return (
    <Canvas>
      <rect x={36} y={26} width={84} height={80} rx={8} stroke="currentColor" className="fill-background" />
      <path d="M50 46h56M50 66h56M50 86h56" stroke="currentColor" />
      <circle cx={88} cy={46} r={6} className="fill-brand" />
      <circle cx={62} cy={66} r={6} stroke="currentColor" className="fill-background" />
      <circle cx={94} cy={86} r={6} stroke="currentColor" className="fill-background" />
      <path d="M120 66h22" className="stroke-brand" strokeDasharray="3 3" />
      <path d="M138 62l4 4-4 4" className="stroke-brand" />
      <rect x={146} y={40} width={58} height={52} rx={8} className="fill-background stroke-brand" />
      <circle cx={175} cy={60} r={9} className="fill-brand" />
      <path d="M170.5 60l3.2 3.4 5.8-6.4" className="stroke-background" />
      <path d="M160 79h30" className="stroke-brand" />
    </Canvas>
  )
}

/** A file of any shape becoming a clean list. */
function UploadScene() {
  return (
    <Canvas>
      <path d="M44 22h40l18 18v70H44z" stroke="currentColor" className="fill-background" />
      <path d="M84 22v18h18" stroke="currentColor" />
      <path d="M56 56h34M56 70h26M56 84h30" stroke="currentColor" />
      <path d="M108 66h20" className="stroke-brand" strokeDasharray="3 3" />
      <path d="M124 62l4 4-4 4" className="stroke-brand" />
      <rect x={134} y={28} width={70} height={76} rx={8} className="fill-background stroke-brand" />
      <Row x={144} y={48} w={32} done />
      <Row x={144} y={66} w={24} done />
      <Row x={144} y={84} w={28} done />
    </Canvas>
  )
}

const SCENES = { newList: NewListScene, lists: ListsScene, library: LibraryScene, courses: CoursesScene, settings: SettingsScene, upload: UploadScene }

/** The drawing alone, where a host lays out its own words (a drop target). */
export function SceneArt({ scene, className }: { scene: keyof typeof SCENES; className?: string }) {
  const Scene = SCENES[scene]
  return <span className={className}><Scene /></span>
}

/** A section's title with its icon: the same tile the DS record detail uses, so a panel can be scanned by shape. */
export function SectionTitle({ icon, id, children, className, as: Heading = "h3" }: { icon: string; id?: string; children: React.ReactNode; className?: string; as?: "h2" | "h3" }) {
  return (
    <span className="flex min-w-0 items-center gap-2">
      <span className="flex size-7 shrink-0 items-center justify-center rounded-md bg-brand-tint text-brand"><i className={`fa-light ${icon} text-xs`} aria-hidden="true" /></span>
      <Heading id={id} className={className}>{children}</Heading>
    </span>
  )
}

/** The same idea inside a section, for a next step in a panel: a small drawing, one line, the action. */
export function SetupPrompt({ scene, text, action, ...rest }: { scene: keyof typeof SCENES; text: React.ReactNode; action?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const Scene = SCENES[scene]
  return (
    <div {...rest} className="flex flex-wrap items-center gap-3 rounded-[var(--radius)] border border-border p-3">
      <span className="w-20 shrink-0 [&_*]:[vector-effect:non-scaling-stroke]"><Scene /></span>
      <div className="flex min-w-48 flex-1 flex-col items-start gap-2">
        <div className="text-sm text-muted-foreground">{text}</div>
        {action}
      </div>
    </div>
  )
}

export function FirstRun({ scene, title, body, actions, error, ...rest }: { scene: keyof typeof SCENES; title: string; body: string; actions: React.ReactNode; /** Shown under the actions, for a step that cannot go on yet. */ error?: React.ReactNode } & React.HTMLAttributes<HTMLDivElement>) {
  const Scene = SCENES[scene]
  return (
    <div {...rest} className="flex flex-col items-center gap-1 rounded-lg border border-border px-4 py-6 text-center" data-region="empty">
      <Scene />
      <h2 className={`${TYPE.card} mt-3`}>{title}</h2>
      <p className="max-w-prose text-sm text-muted-foreground">{body}</p>
      <div className="mt-3 flex flex-wrap items-center justify-center gap-2">{actions}</div>
      {error ? <div className="mt-2">{error}</div> : null}
    </div>
  )
}
