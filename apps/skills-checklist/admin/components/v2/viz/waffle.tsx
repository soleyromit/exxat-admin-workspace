import * as React from "react"
import { TONE_COLOR, hatch, plural } from "./tokens"

export type WaffleSquareState = "counted" | "pending" | "remaining"
export type WaffleSquare = { state: WaffleSquareState; label?: string }

export type WaffleProps = {
  /** What one square is, for example "mandatory skill". */
  unit: string
  total?: number
  counted?: number
  pending?: number
  /** Alternative to counts: one entry per square, each with its own accessible name. */
  squares?: WaffleSquare[]
  /** Sizes of consecutive runs of squares (for example one run per skill). Each run ends with a wider gap. Must add up to the number of squares. */
  groups?: number[]
  /** Extra space after each group in px. Default 10. */
  groupGap?: number
  /** Custom words per state for the accessible names and the legend, for example { counted: "Met" }. */
  stateWords?: Partial<Record<WaffleSquareState, string>>
  /** Square edge in px. Min 8. Default 16. */
  size?: number
  /** Visible count label. Default is built from the counts. */
  countLabel?: string
  className?: string
}

const WORD: Record<WaffleSquareState, string> = { counted: "counted", pending: "waiting for review", remaining: "still to do" }

export function Waffle({ unit, total, counted = 0, pending = 0, squares, size = 16, countLabel, groups, groupGap = 10, stateWords, className }: WaffleProps) {
  const sq: WaffleSquare[] =
    squares ??
    Array.from({ length: total ?? counted + pending }, (_, i) => ({ state: i < counted ? "counted" : i < counted + pending ? "pending" : "remaining" }) as WaffleSquare)
  const word = (s: WaffleSquareState) => stateWords?.[s] ?? WORD[s]
  const groupEnds = React.useMemo(() => {
    const ends = new Set<number>()
    if (groups && groups.reduce((a, b) => a + b, 0) === sq.length) {
      let at = 0
      for (const g of groups) { at += g; ends.add(at - 1) }
      ends.delete(sq.length - 1)
    }
    return ends
  }, [groups, sq.length])
  const n = (s: WaffleSquareState) => sq.filter((x) => x.state === s).length
  const c = n("counted"), p = n("pending"), r = n("remaining")
  const summary = `${c} of ${sq.length} ${plural(sq.length, unit, unit + "s")} ${word("counted")}, ${p} ${word("pending")}, ${r} ${word("remaining")}`
  const edge = Math.max(8, size)
  const mark = (s: WaffleSquareState): React.CSSProperties =>
    s === "counted"
      ? { background: TONE_COLOR.magnitude, border: `1px solid ${TONE_COLOR.magnitude}` }
      : s === "pending"
        ? { background: "var(--background)", border: `1px solid ${TONE_COLOR.magnitude}`, ...hatch(TONE_COLOR.magnitude) }
        : { background: "var(--background)", border: "1px solid var(--border-control-35)" }
  const perSquare = squares !== undefined
  return (
    <div className={`flex flex-col gap-2 ${className ?? ""}`} data-viz="waffle">
      {perSquare ? (
        <ul className="flex flex-wrap gap-1 gap-y-1.5" aria-label={summary}>
          {sq.map((x, i) => (
            <li key={i} className="rounded-xs" style={{ width: edge, height: edge, ...mark(x.state), marginRight: groupEnds.has(i) ? groupGap : undefined }} data-square={x.state} data-group-end={groupEnds.has(i) ? "true" : undefined}>
              <span className="sr-only">{`${x.label ?? `${unit} ${i + 1}`}: ${word(x.state)}`}</span>
            </li>
          ))}
        </ul>
      ) : (
        <div className="flex flex-wrap gap-1" role="img" aria-label={summary}>
          {sq.map((x, i) => (
            <span key={i} className="rounded-xs" style={{ width: edge, height: edge, ...mark(x.state) }} data-square={x.state} />
          ))}
        </div>
      )}
      <p className="flex flex-wrap gap-x-3 gap-y-1 text-sm text-muted-foreground">
        {countLabel ? (
          <span className="text-foreground">{countLabel}</span>
        ) : (
          <>
            <span className="text-foreground"><span className="font-medium tabular-nums">{c}</span> of {sq.length} counted</span>
            {p > 0 ? <span><i className="fa-light fa-clock mr-1" aria-hidden="true" /><span className="tabular-nums">{p}</span> waiting</span> : null}
            {r > 0 ? <span className="tabular-nums">{r} to go</span> : null}
          </>
        )}
      </p>
      <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground" aria-hidden="true">
        {(["counted", "pending", "remaining"] as WaffleSquareState[]).map((s) => (
          <li key={s} className="flex items-center gap-1.5">
            <span className="inline-block size-3 rounded-xs" style={mark(s)} />
            {word(s).replace(/^./, (ch) => ch.toUpperCase())}
          </li>
        ))}
      </ul>
    </div>
  )
}
