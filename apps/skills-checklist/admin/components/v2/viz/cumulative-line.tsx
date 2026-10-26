"use client"
import * as React from "react"
import { Bar, BarChart, CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from "@exxatdesignux/ui/components/ui/chart"
import { plural } from "./tokens"

export type CumulativePoint = { /** Axis label, for example "Wk 3" or "Sep 2". */ week: string; /** Cumulative counted so far. */ counted: number; /** Cumulative expected by this week. */ pace: number }

export type CumulativeLineProps = {
  label: string
  data: CumulativePoint[]
  /** Noun for the caption, for example "evaluation". */
  unit?: string
  /** "auto" switches to weekly bars below 480 px. */
  variant?: "auto" | "line" | "bars"
  /** Overrides the generated caption. */
  caption?: string
  height?: number
  className?: string
}

const config: ChartConfig = {
  counted: { label: "Counted", color: "var(--chart-1)" },
  pace: { label: "Expected pace", color: "var(--muted-foreground)" },
  added: { label: "Counted that week", color: "var(--chart-1)" },
}

function useNarrow(ref: React.RefObject<HTMLElement | null>) {
  const [narrow, setNarrow] = React.useState(false)
  React.useEffect(() => {
    const el = ref.current
    if (!el || typeof ResizeObserver === "undefined") return
    const ro = new ResizeObserver(([e]) => setNarrow(e.contentRect.width > 0 && e.contentRect.width < 480))
    ro.observe(el)
    return () => ro.disconnect()
  }, [ref])
  return narrow
}

export function CumulativeLine({ label, data, unit = "item", variant = "auto", caption, height = 220, className }: CumulativeLineProps) {
  const ref = React.useRef<HTMLDivElement>(null)
  const narrow = useNarrow(ref)
  const bars = variant === "bars" || (variant === "auto" && narrow)
  const last = data[data.length - 1]
  const gap = last ? last.pace - last.counted : 0
  const text =
    caption ??
    (last
      ? gap > 0
        ? `${last.counted} counted, pace says ${last.pace} by now: ${gap} ${plural(gap, unit, unit + "s")} behind.`
        : `${last.counted} counted, pace says ${last.pace} by now: on pace.`
      : "No data yet.")
  const weekly = data.map((p, i) => ({ ...p, added: p.counted - (i ? data[i - 1].counted : 0) }))
  const common = { data: weekly, accessibilityLayer: true, margin: { top: 8, right: 12, bottom: 0, left: 0 } }
  const axes = (
    <>
      <CartesianGrid vertical={false} stroke="var(--border)" />
      <XAxis dataKey="week" tickLine={false} axisLine={false} tickMargin={8} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} interval="preserveStartEnd" />
      <YAxis tickLine={false} axisLine={false} width={32} allowDecimals={false} tick={{ fontSize: 12, fill: "var(--muted-foreground)" }} />
      <ChartTooltip content={<ChartTooltipContent />} />
    </>
  )
  return (
    <figure ref={ref} className={`flex flex-col gap-2 ${className ?? ""}`} data-viz="cumulative-line" data-variant={bars ? "bars" : "line"}>
      <figcaption className="text-sm text-foreground">{text}</figcaption>
      <div role="img" aria-label={`${label}. ${text}`}>
        <ChartContainer config={config} className="[&_.recharts-surface:focus-visible]:rounded-md [&_.recharts-surface:focus-visible]:outline-solid! [&_.recharts-surface:focus-visible]:outline-2! [&_.recharts-surface:focus-visible]:outline-offset-2! [&_.recharts-surface:focus-visible]:outline-ring!" style={{ height, width: "100%" }}>
          {bars ? (
            <BarChart {...common}>
              {axes}
              <Bar dataKey="added" fill="var(--color-added)" radius={[4, 4, 0, 0]} isAnimationActive={false} />
            </BarChart>
          ) : (
            <LineChart {...common}>
              {axes}
              <Line dataKey="pace" type="linear" stroke="var(--color-pace)" strokeWidth={2} strokeDasharray="6 4" dot={false} isAnimationActive={false} />
              <Line dataKey="counted" type="monotone" stroke="var(--color-counted)" strokeWidth={2} dot={{ r: 4, stroke: "var(--background)", strokeWidth: 2, fill: "var(--color-counted)" }} isAnimationActive={false} />
            </LineChart>
          )}
        </ChartContainer>
      </div>
      <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" aria-hidden="true">
        {bars ? (
          <li className="flex items-center gap-1.5"><span className="inline-block size-3 rounded-xs" style={{ background: "var(--chart-1)" }} />Counted that week</li>
        ) : (
          <>
            <li className="flex items-center gap-1.5"><span className="inline-block h-0.5 w-5" style={{ background: "var(--chart-1)" }} />Counted so far</li>
            <li className="flex items-center gap-1.5"><span className="inline-block w-5 border-t-2 border-dashed" style={{ borderColor: "var(--muted-foreground)" }} />Expected pace</li>
          </>
        )}
      </ul>
      <ul className="sr-only">
        {data.map((p) => (
          <li key={p.week}>{`${p.week}: ${p.counted} counted, pace ${p.pace}`}</li>
        ))}
      </ul>
    </figure>
  )
}
