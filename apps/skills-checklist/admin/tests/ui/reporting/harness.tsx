import * as React from "react"
import { render, screen } from "@testing-library/react"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import axe from "axe-core"
import { expect } from "vitest"
import { OverviewView, type OverviewViewProps } from "@/components/reporting/overview-view"
import { EMPTY_PARAMS, type OverviewParams } from "@/components/reporting/report-params"
import type { Db, SkillStatusDisplay } from "@/lib/domain/types"
import { buildSeed } from "@/lib/seed"

export const db0 = (): Db => buildSeed()

export interface HarnessProps extends Partial<Pick<OverviewViewProps, "status" | "onRetry" | "now" | "onExported">> {
  db?: Db
  display?: SkillStatusDisplay
  initial?: Partial<OverviewParams>
  /** Receives every params change, so tests can assert what the URL would hold. */
  onChange?: (p: OverviewParams, mode?: "push" | "replace") => void
}

/** Holds the URL state the connected page keeps in the address bar, so the whole surface can be exercised without a router. */
export function Harness({ db = db0(), display = "four", initial, onChange, ...rest }: HarnessProps) {
  const [params, setParams] = React.useState<OverviewParams>({ ...EMPTY_PARAMS, ...initial, filters: { ...(initial?.filters ?? {}) } })
  return (
    <TooltipProvider>
      <main>
      <OverviewView
        db={db}
        display={display}
        params={params}
        onParams={(n, m) => {
          setParams(n)
          onChange?.(n, m)
        }}
        {...rest}
      />
      </main>
    </TooltipProvider>
  )
}

export const renderOverview = (p: HarnessProps = {}) => render(<Harness {...p} />)

// color-contrast cannot be computed in jsdom. landmark-unique: the DS KeyMetrics renders its desktop and compact layouts
// both into the DOM (CSS hides one in a browser, jsdom has no CSS), so two `Key Metrics` sections exist only here; the real
// browser run in the report checks it with axe against the live page.
const noContrast = { rules: { "color-contrast": { enabled: false }, "landmark-unique": { enabled: false } } }
/** jsdom cannot compute colour contrast, so that rule is off (stated in the report). Everything else must be clean. */
export async function expectNoAxeViolations(el: HTMLElement = document.body) {
  const r = await axe.run(el, noContrast)
  expect(r.violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.html.slice(0, 120)).join(" | ")}`)).toEqual([])
}

/** The table row for a named student (the first row whose link button name starts with the name). */
export const rowOf = (screen: typeof import("@testing-library/react").screen, name: string): HTMLElement => {
  const btn = screen.getAllByRole("button", { name: new RegExp(`^${name}`) })[0]
  return btn.closest("tr") as HTMLElement
}

/** Minimal RFC 4180 parser for the generated CSV (the test must not trust the generator's own escaping). */
export function parseCsv(csv: string): { header: string[]; columns: string[]; rows: string[][] } {
  const header: string[] = []
  const all = csv.split("\n")
  let i = 0
  while (i < all.length && all[i].startsWith("# ")) header.push(all[i++].slice(2))
  if (all[i] === "") i++
  const records: string[][] = []
  let field = ""
  let rec: string[] = []
  let q = false
  const text = all.slice(i).join("\n")
  for (let k = 0; k < text.length; k++) {
    const ch = text[k]
    if (q) {
      if (ch === '"' && text[k + 1] === '"') {
        field += '"'
        k++
      } else if (ch === '"') q = false
      else field += ch
    } else if (ch === '"') q = true
    else if (ch === ",") {
      rec.push(field)
      field = ""
    } else if (ch === "\n") {
      rec.push(field)
      records.push(rec)
      rec = []
      field = ""
    } else field += ch
  }
  if (field !== "" || rec.length) {
    rec.push(field)
    records.push(rec)
  }
  return { header, columns: records[0] ?? [], rows: records.slice(1) }
}

export const headerTexts = (): string[] => screen.getAllByRole("columnheader").map((h) => h.textContent ?? "")
export const hasHeader = (name: string, opts: { hidden?: boolean } = {}): boolean => screen.queryAllByRole("columnheader", opts).some((h) => h.textContent === name)

/** Open the Filters panel (prototype P-01) if it is closed. */
export async function openFilters(user: ReturnType<typeof import("@testing-library/user-event").default.setup>) {
  const btn = screen.getByRole("button", { name: /^Filters/ })
  if (btn.getAttribute("aria-expanded") !== "true") await user.click(btn)
}

/** Choose one option in a labelled select of the Filters panel. Radix Select under jsdom is driven with the keyboard. */
export async function pickFilter(user: ReturnType<typeof import("@testing-library/user-event").default.setup>, dimension: string, value: string) {
  await openFilters(user)
  const trigger = screen.getByRole("combobox", { name: dimension })
  trigger.focus()
  await user.keyboard("{Enter}")
  const option = await screen.findByRole("option", { name: value })
  await user.click(option)
}
