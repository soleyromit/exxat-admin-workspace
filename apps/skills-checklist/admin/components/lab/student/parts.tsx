"use client"

/**
 * Small pieces every student screen shares: the state glyph and label (glyph + word + colour, never colour alone), overlays
 * (waiting, returned) as DS StatusBadge, rule parts as fractions, the required-skills ring, the "Show as table" disclosure
 * and the link style for numbers. Colours: neutral and brand tint for progress, one amber for shortfall (viz-tokens.css).
 */
import * as React from "react"
import { LabLink as Link } from "@/components/lab/lab-bar/lab-link"
import { Button } from "@exxatdesignux/ui/components/ui/button"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@exxatdesignux/ui/components/ui/collapsible"
import { StatusBadge } from "@exxatdesignux/ui/components/ui/status-badge"
import { cn } from "@exxatdesignux/ui/lib/utils"
import { VIZ } from "@/components/lab/viz"
import { TYPE } from "@/components/lab/type-scale"
import { ageLabel, type Part, type SkillRecord, type SkillState } from "@/lib/lab/student"
import { RECORD_STATE_META, STUDENT_STATE_LABEL, type RecordStateKey } from "@/lib/v2/labels"

/** Link treatments come from the one shared module (consistency audit item 7). */
export { NUM_LINK, LINK_IN_TABLE } from "@/components/lab/link-styles"

/** Student engine state key to the shared label map key ("dnq" is "unqualified" there). */
export const stateKey = (s: SkillState): RecordStateKey => (s === "dnq" ? "unqualified" : s)
/** The student's word for a state (lib/v2/labels.ts STUDENT_STATE_LABEL): "Did not count", never the staff "Evidence does not qualify". */
export const stateWord = (s: SkillState): string => STUDENT_STATE_LABEL[stateKey(s)]

const COLOR: Record<SkillState, string> = {
  achieved: "var(--foreground)",
  progress: "var(--muted-foreground)",
  dnq: VIZ.behindInk,
  none: "var(--muted-foreground)",
}

/**
 * The state glyph (icon from RECORD_STATE_META). Decorative: never render it without its word beside it (StateLabel, the
 * legends and the picker all pair it with the word), so state is never carried by the glyph alone.
 */
export function StateGlyph({ state, className }: { state: SkillState; className?: string }) {
  return <i className={cn("fa-solid", RECORD_STATE_META[stateKey(state)].icon, "shrink-0 text-sm", className)} style={{ color: COLOR[state] }} aria-hidden="true" />
}

/** "In progress (2 of 3)" with its glyph. The word carries the state; the glyph and colour repeat it. */
export function StateLabel({ record, className }: { record: Pick<SkillRecord, "state" | "label">; className?: string }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 text-sm", record.state === "dnq" ? "font-medium" : "", className)} style={record.state === "dnq" ? { color: VIZ.behindInk } : undefined} data-viz-label>
      <StateGlyph state={record.state} />
      {record.label}
    </span>
  )
}

/** Overlay chips: waiting (neutral clock) and returned (amber). Never a state of their own. */
export function Overlay({ record }: { record: Pick<SkillRecord, "waiting" | "returned"> }) {
  if (record.returned) return <StatusBadge label="Returned" tone="warning" icon="fa-rotate-left" size="sm" />
  if (!record.waiting) return null
  const w = record.waiting
  const label = w.kind === "approval" ? `Awaiting approval, ${ageLabel(w.days)}` : w.kind === "device" ? "Not sent yet" : `Waiting ${ageLabel(w.days)}`
  return <StatusBadge label={label} tone="neutral" icon="fa-clock" size="sm" />
}

/** Rule parts as fractions, for example "Evaluations 2 of 3 · Inpatient 0 of 1". Met parts read quiet, unmet parts bold. */
export function Parts({ parts, className }: { parts: Part[]; className?: string }) {
  return (
    <ul className={cn("flex flex-wrap gap-x-4 gap-y-1 text-sm", className)} aria-label="Parts of the rule">
      {parts.map((p) => (
        <li key={p.label} className="inline-flex items-baseline gap-1.5">
          <span className="text-muted-foreground">{p.label}</span>
          <span className={cn("tabular-nums", p.met ? "text-muted-foreground" : "font-semibold text-foreground")}>
            {p.have} of {p.need}
          </span>
          {p.met ? <i className="fa-solid fa-check text-xs" style={{ color: "var(--foreground)" }} role="img" aria-label="met" /> : null}
        </li>
      ))}
    </ul>
  )
}

/**
 * Required ring: one segment per required skill, filled by the share of its evaluations counted. Achieved segments are brand,
 * part-done ones show their share, a segment whose evidence does not qualify is outlined amber. The centre names the count.
 * Above 30 required skills it draws one continuous arc (segments would be thinner than a pixel at 96 px).
 */
export function RequiredRing({ records, size = 112, label }: { records: Array<Pick<SkillRecord, "state" | "counted" | "need" | "name">>; size?: number; label: string }) {
  const n = records.length
  const r = size / 2 - 7
  const c = size / 2
  const achieved = records.filter((x) => x.state === "achieved").length
  const arc = (from: number, to: number) => {
    const a0 = (from - 0.25) * 2 * Math.PI
    const a1 = (to - 0.25) * 2 * Math.PI
    const large = to - from > 0.5 ? 1 : 0
    return `M ${c + r * Math.cos(a0)} ${c + r * Math.sin(a0)} A ${r} ${r} 0 ${large} 1 ${c + r * Math.cos(a1)} ${c + r * Math.sin(a1)}`
  }
  const gap = n > 1 && n <= 30 ? 0.012 : 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img" aria-label={label} className="shrink-0" data-chart="ring">
      <circle cx={c} cy={c} r={r} fill="none" stroke={VIZ.track} strokeWidth={8} />
      {n === 0 ? null : n > 30 ? (
        achieved > 0 ? <path d={arc(0, Math.min(0.9999, achieved / n))} fill="none" stroke="var(--foreground)" strokeWidth={8} strokeLinecap="butt" /> : null
      ) : (
        records.map((x, i) => {
          const from = i / n + gap / 2
          const to = (i + 1) / n - gap / 2
          const share = x.need ? Math.min(1, x.counted / x.need) : 0
          if (x.state === "dnq") return <path key={i} d={arc(from, to)} fill="none" stroke={VIZ.behind} strokeWidth={8} strokeDasharray="3 2" />
          if (share <= 0) return null
          return <path key={i} d={arc(from, from + (to - from) * share)} fill="none" stroke={x.state === "achieved" ? "var(--foreground)" : "var(--border-control-3)"} strokeWidth={8} />
        })
      )}
      <text x={c} y={c - 2} textAnchor="middle" className="fill-foreground" style={{ fontSize: size * 0.24, fontWeight: 600 }}>
        {achieved}
      </text>
      <text x={c} y={c + size * 0.16} textAnchor="middle" className="fill-muted-foreground" style={{ fontSize: 12 }}>
        {/* Leading space so the ring's text reads "2 of 15" to assistive tech (it collapses visually in SVG). */}
        {` of ${n}`}
      </text>
    </svg>
  )
}

export function RingLegend() {
  return (
    <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-label="Legend">
      {(["achieved", "progress", "dnq", "none"] as const).map((k) => (
        <li key={k} className="inline-flex items-center gap-1"><StateGlyph state={k} className="text-xs" />{stateWord(k)}</li>
      ))}
    </ul>
  )
}

/**
 * SVG text scales with its viewBox, so at 375 a 12 px label drew at 8 px. This returns the font size, in viewBox units, that
 * renders at `px` CSS pixels for the element's real width (never below the 12 px floor).
 */
export function useSvgFont(viewBoxWidth: number, px = 12): [React.RefObject<SVGSVGElement | null>, number] {
  const ref = React.useRef<SVGSVGElement | null>(null)
  const [size, setSize] = React.useState(px)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const update = () => {
      const w = el.getBoundingClientRect().width
      if (w > 0) setSize(Math.max(px, (px * viewBoxWidth) / w))
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(el)
    return () => ro.disconnect()
  }, [viewBoxWidth, px])
  return [ref, size]
}

export function ShowAsTable({ label, children }: { label: string; children: React.ReactNode }) {
  const [open, setOpen] = React.useState(false)
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="flex flex-col gap-2">
      <CollapsibleTrigger asChild>
        <Button type="button" variant="ghost" size="sm" className="self-start" aria-expanded={open}>
          <i className={`fa-light ${open ? "fa-chevron-down" : "fa-chevron-right"}`} aria-hidden="true" />
          {open ? "Hide table" : "Show as table"}
        </Button>
      </CollapsibleTrigger>
      <CollapsibleContent>
        <div className="max-h-80 overflow-y-auto rounded-sm outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-ring" role="region" aria-label={label} tabIndex={0}>
          {children}
        </div>
      </CollapsibleContent>
    </Collapsible>
  )
}

/** A figure that is a link to where it is acted on. */
export function FigureLink({ href, value, label, amber = false }: { href: string; value: number; label: string; amber?: boolean }) {
  return (
    <Link href={href} className="group flex flex-col gap-0.5 rounded-md outline-none focus-visible:ring-2 focus-visible:ring-ring" data-figure="kpi" data-figure-label={label} data-figure-value={value}>
      <span className={cn(TYPE.figure, "text-foreground group-hover:underline group-hover:underline-offset-4")} style={amber && value > 0 ? { color: VIZ.behindInk } : undefined}>
        {value}
      </span>
      <span className="text-xs text-muted-foreground">{label}</span>
    </Link>
  )
}

export function SectionTitle({ children, count, id }: { children: React.ReactNode; count?: number; id?: string }) {
  return (
    <h2 id={id} className={cn("flex items-baseline gap-2", TYPE.section)}>
      {children}
      {count !== undefined ? <span className="text-xs font-normal tabular-nums text-muted-foreground">{count}</span> : null}
    </h2>
  )
}
