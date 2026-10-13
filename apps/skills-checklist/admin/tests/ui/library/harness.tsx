import * as React from "react"
import { vi } from "vitest"
import { render } from "@testing-library/react"
import axe from "axe-core"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import type { Db } from "@/lib/domain/types"
import { ok } from "@/lib/store"
import { getRuntime } from "@/lib/store/react"

/** Mutable navigation state shared with the next/navigation mock (see each test file's vi.mock). */
export const nav = { path: "/skills/library", query: "", replace: vi.fn(), push: vi.fn() }

export const navigationMock = {
  usePathname: () => nav.path,
  useRouter: () => ({ push: nav.push, replace: nav.replace, back: vi.fn(), forward: vi.fn(), refresh: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.query),
  redirect: vi.fn(),
}

// The DS DataTable measures its parent's padding with getComputedStyle, which jsdom cannot do (it reports NaN px), so its
// "parent adds an inset" dev warning is noise here. Real browsers get the check; the tables pass edgeInset={false}.
const IGNORED = /\[Exxat DS\]\[DataTable\] Parent <\w+> adds/
for (const method of ["warn", "error"] as const) {
  const original = console[method].bind(console)
  console[method] = (...args: unknown[]) => {
    if (typeof args[0] === "string" && IGNORED.test(args[0])) return
    original(...args)
  }
}

export function resetWorld(path = "/skills/library", query = "") {
  getRuntime().reset()
  nav.path = path
  nav.query = query
  nav.replace.mockClear()
  nav.push.mockClear()
}

/** Edit the program database through the real runtime (the same path the UI uses). */
export function setDb(mutate: (db: Db) => Db) {
  const r = getRuntime().run((db) => ok(mutate(structuredClone(db)), undefined))
  if (!r.ok) throw new Error(r.error.message)
}

export const getDb = () => getRuntime().getDb()

export function renderLib(ui: React.ReactElement) {
  return render(
    <TooltipProvider>
      <main>
        <h1>Skills library</h1>
        {ui}
      </main>
    </TooltipProvider>,
  )
}

/** Render a page that brings its own h1 (the library page uses the DS PageHeader). */
export function renderPage(ui: React.ReactElement) {
  return render(
    <TooltipProvider>
      <main>{ui}</main>
    </TooltipProvider>,
  )
}

const noContrast = { rules: { "color-contrast": { enabled: false } } }
export async function axeViolations(container: HTMLElement) {
  // axe asks a canvas whether an icon font ligature is in use; jsdom has no canvas.
  HTMLCanvasElement.prototype.getContext = (() => null) as unknown as typeof HTMLCanvasElement.prototype.getContext
  return (await axe.run(container, noContrast)).violations
}

/** Filled primaries on the surface: Button variant "default" is the only one that carries the bg-primary token class. */
export function filledPrimaries(container: HTMLElement) {
  return [...container.querySelectorAll<HTMLElement>("button, a")].filter((el) => el.className.split(/\s+/).includes("bg-primary"))
}
