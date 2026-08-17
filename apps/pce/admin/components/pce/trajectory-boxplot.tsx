'use client'

// ============================================================================
// TrajectoryBoxplot — shared standing-per-term boxplot (extracted from
// /my-dashboard round 15; three use sites: my-dashboard, faculty profile,
// course offering profile — P8 satisfied).
//
// Vocabulary = the DS boxplot (Chart → Statistical → Boxplot), the same
// language as the results-page scale plots: brand middle-50% box (real
// interpolated quartiles), brand median line, neutral whisker + end caps for
// the full range. Sentiment lives ONLY on the entity dot/value — teal at or
// above the cohort median, amber below. Every term column is a click-popover
// (keyboard-reachable) opening a "Where you sat" strip plot — the term's
// cohort scores as neutral ticks with the entity dot among them — plus the
// definition-row stats. Hover-only tooltips are banned on plots (Romit
// 2026-07-19).
// ============================================================================

import { Popover, PopoverContent, PopoverTrigger } from '@exxatdesignux/ui'

export interface TrajectoryDatum {
  term: string
  min: number
  range: number
  median: number
  /** Middle 50% of the cohort distribution — the boxplot's box. */
  p25: number
  p75: number
  /** Every cohort score that term — the popover's strip plot. */
  scores: number[]
  /** The entity's own value that term (null = no offering). */
  value: number | null
}

/** Linear-interpolated quantile over a sorted ascending list. */
export function quantileSorted(sorted: number[], q: number): number {
  if (sorted.length === 0) return 0
  const idx = (sorted.length - 1) * q
  const lo = Math.floor(idx)
  const hi = Math.ceil(idx)
  return sorted[lo] + (sorted[hi] - sorted[lo]) * (idx - lo)
}

/** One term's datum from the cohort's raw scores + the entity's own value. */
export function buildTrajectoryDatum(term: string, scores: number[], value: number | null): TrajectoryDatum {
  const sorted = [...scores].sort((a, b) => a - b)
  const min = sorted[0] ?? 0
  const max = sorted[sorted.length - 1] ?? 0
  return {
    term,
    min: +min.toFixed(2),
    range: +(max - min).toFixed(2),
    median: +quantileSorted(sorted, 0.5).toFixed(2),
    p25: +quantileSorted(sorted, 0.25).toFixed(2),
    p75: +quantileSorted(sorted, 0.75).toFixed(2),
    scores: sorted.map((s) => +s.toFixed(2)),
    value: value != null ? +value.toFixed(2) : null,
  }
}

export function TrajectoryBoxplot({
  data,
  valueLabel,
  cohortNoun,
}: {
  data: TrajectoryDatum[]
  /** Popover stat-row label for the entity: "You" / "This course" / "This faculty". */
  valueLabel: string
  /** Popover header noun: "faculty" / "courses" → "N faculty evaluated this term". */
  cohortNoun: string
}) {
  const pos = (v: number) => (Math.min(5, Math.max(3, v)) - 3) / 2
  const n = data.length
  const points = data
    .map((d, i) => (d.value != null ? `${((i + 0.5) / n) * 100},${(1 - pos(d.value)) * 100}` : null))
    .filter(Boolean)
    .join(' ')
  return (
    <div className="w-full">
      <span className="sr-only">
        {`${valueLabel} per term inside the full ${cohortNoun} range. ${data
          .filter((d) => d.value != null)
          .map((d) => `${d.term}: ${valueLabel} ${d.value!.toFixed(2)}, median ${d.median.toFixed(2)}`)
          .join('; ')}.`}
      </span>
      <div className="flex gap-3">
        {/* Printed axis — 3.0–5.0 window */}
        <div className="relative h-60 w-7 shrink-0 text-xs text-muted-foreground tabular-nums" aria-hidden="true">
          {[5, 4.5, 4, 3.5, 3].map((v) => (
            <span key={v} className="absolute right-0 -translate-y-1/2" style={{ top: `${(1 - pos(v)) * 100}%` }}>
              {v.toFixed(1)}
            </span>
          ))}
        </div>
        <div className="relative h-60 flex-1">
          {[5, 4.5, 4, 3.5, 3].map((v) => (
            <div
              key={v}
              aria-hidden="true"
              className="absolute inset-x-0 border-t border-dashed border-border"
              style={{ top: `${(1 - pos(v)) * 100}%` }}
            />
          ))}
          {/* Hairline trajectory between the entity dots — neutral, not a signal */}
          <svg className="absolute inset-0 h-full w-full" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">
            <polyline
              points={points}
              fill="none"
              stroke="var(--muted-foreground)"
              strokeWidth="1.5"
              strokeOpacity="0.35"
              vectorEffect="non-scaling-stroke"
            />
          </svg>
          <div className="absolute inset-0 flex">
            {data.map((d) => {
              const below = d.value != null && d.value < d.median - 0.005
              const gap = d.value != null ? d.value - d.median : null
              return (
                <div key={d.term} className="relative flex-1">
                  {/* Whisker — full range, neutral hairline + end caps */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 w-px -translate-x-1/2"
                    style={{
                      bottom: `${pos(d.min) * 100}%`,
                      height: `${(pos(d.min + d.range) - pos(d.min)) * 100}%`,
                      background: 'var(--muted-foreground)',
                      opacity: 0.6,
                    }}
                  />
                  {[d.min, d.min + d.range].map((v, i) => (
                    <div
                      key={i}
                      aria-hidden="true"
                      className="absolute left-1/2 h-px w-2.5 -translate-x-1/2"
                      style={{ top: `${(1 - pos(v)) * 100}%`, background: 'var(--muted-foreground)', opacity: 0.6 }}
                    />
                  ))}
                  {/* Box — middle 50%, brand per the DS boxplot spec */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 w-4 -translate-x-1/2 rounded-[3px]"
                    style={{
                      bottom: `${pos(d.p25) * 100}%`,
                      height: `${Math.max(2, (pos(d.p75) - pos(d.p25)) * 100)}%`,
                      background: 'var(--brand-color)',
                      opacity: 0.42,
                    }}
                  />
                  {/* Median — brand line */}
                  <div
                    aria-hidden="true"
                    className="absolute left-1/2 h-0.5 w-5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                    style={{ top: `${(1 - pos(d.median)) * 100}%`, background: 'var(--brand-color)' }}
                  />
                  {/* Entity dot + value — teal at/above median, amber below */}
                  {d.value != null && (
                    <>
                      <div
                        aria-hidden="true"
                        className="absolute left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-card"
                        style={{
                          top: `${(1 - pos(d.value)) * 100}%`,
                          background: below ? 'var(--chip-4)' : 'var(--chart-2)',
                        }}
                      />
                      <span
                        aria-hidden="true"
                        className="absolute left-1/2 -translate-x-1/2 whitespace-nowrap rounded-sm bg-card/85 px-0.5 text-xs font-medium tabular-nums"
                        style={{
                          top: `calc(${(1 - pos(d.value)) * 100}% - 22px)`,
                          color: below ? 'var(--chip-4)' : 'var(--foreground)',
                        }}
                      >
                        {d.value.toFixed(2)}
                      </span>
                    </>
                  )}
                  {/* Whole-column click target → sectioned stat popover */}
                  <Popover>
                    <PopoverTrigger
                      aria-label={`${d.term} — ${valueLabel} vs the ${cohortNoun} range, details`}
                      className="absolute inset-y-0 left-1/2 w-10 -translate-x-1/2 cursor-pointer rounded-sm focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
                    />
                    <PopoverContent className="w-72 p-0" side="top" align="center" sideOffset={6}>
                      <div className="flex flex-col">
                        <div className="border-b border-border px-3 py-2">
                          <p className="text-sm font-semibold">{d.term}</p>
                          <p className="text-xs text-muted-foreground">
                            {d.scores.length} {cohortNoun} evaluated this term
                          </p>
                        </div>
                        {/* Where you sat — the term's cohort scores as a strip
                            plot; the entity dot is the only colored mark. */}
                        <div className="border-b border-border px-3 py-2">
                          <p className="mb-1.5 text-xs text-muted-foreground">Where {valueLabel.toLowerCase()} sat</p>
                          <div className="relative h-7" aria-hidden="true">
                            <div className="absolute inset-x-0 top-1/2 h-px bg-border" />
                            {d.scores.map((s, i) => (
                              <span
                                key={i}
                                className="absolute top-1/2 h-2.5 w-px -translate-x-1/2 -translate-y-1/2"
                                style={{ left: `${pos(s) * 100}%`, background: 'var(--muted-foreground)', opacity: 0.5 }}
                              />
                            ))}
                            <span
                              className="absolute top-1/2 h-3.5 w-0.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
                              style={{ left: `${pos(d.median) * 100}%`, background: 'var(--brand-color)' }}
                            />
                            {d.value != null && (
                              <span
                                className="absolute top-1/2 size-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ring-2 ring-[var(--popover)]"
                                style={{
                                  left: `${pos(d.value) * 100}%`,
                                  background: below ? 'var(--chip-4)' : 'var(--chart-2)',
                                }}
                              />
                            )}
                          </div>
                          <div className="flex justify-between text-xs tabular-nums text-muted-foreground" aria-hidden="true">
                            <span>3.0</span>
                            <span>5.0</span>
                          </div>
                        </div>
                        <div className="flex flex-col gap-1.5 px-3 py-2">
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">{valueLabel}</span>
                            <span className="text-right text-xs tabular-nums">
                              {d.value != null ? d.value.toFixed(2) : '— (no offering this term)'}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Median</span>
                            <span className="text-right text-xs tabular-nums">{d.median.toFixed(2)}</span>
                          </div>
                          {gap != null && (
                            <div className="flex items-baseline justify-between gap-4">
                              <span className="text-xs text-muted-foreground">vs median</span>
                              <span
                                className="text-right text-xs font-medium tabular-nums"
                                style={{
                                  color:
                                    Math.abs(gap) <= 0.005
                                      ? 'var(--muted-foreground)'
                                      : below
                                        ? 'var(--chip-4)'
                                        : 'var(--chart-2)',
                                }}
                              >
                                {Math.abs(gap) <= 0.005 ? 'At median' : `${gap > 0 ? '+' : '−'}${Math.abs(gap).toFixed(2)}`}
                              </span>
                            </div>
                          )}
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Middle 50%</span>
                            <span className="text-right text-xs tabular-nums">
                              {d.p25.toFixed(2)}–{d.p75.toFixed(2)}
                            </span>
                          </div>
                          <div className="flex items-baseline justify-between gap-4">
                            <span className="text-xs text-muted-foreground">Full range</span>
                            <span className="text-right text-xs tabular-nums">
                              {d.min.toFixed(2)}–{(d.min + d.range).toFixed(2)}
                            </span>
                          </div>
                        </div>
                      </div>
                    </PopoverContent>
                  </Popover>
                </div>
              )
            })}
          </div>
        </div>
      </div>
      {/* Term labels */}
      <div className="ms-10 flex" aria-hidden="true">
        {data.map((d) => (
          <span key={d.term} className="flex-1 pt-2 text-center text-xs text-muted-foreground">
            {d.term}
          </span>
        ))}
      </div>
    </div>
  )
}
