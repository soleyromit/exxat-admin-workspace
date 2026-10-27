import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { act, render, waitFor } from "@testing-library/react"

const nav = vi.hoisted(() => ({ search: "variant=A&skill=sk-med-admin&step=model" }))
vi.mock("next/navigation", () => ({
  usePathname: () => "/lab/admin/configure-skill",
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), back: vi.fn(), forward: vi.fn(), prefetch: vi.fn() }),
  useSearchParams: () => new URLSearchParams(nav.search),
  redirect: vi.fn(),
  notFound: vi.fn(),
}))

import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { AdminConfigureSkillA } from "@/components/lab/screens/admin-configure-skill-a"
import { StickyFooter } from "@/components/lab/layout"
import { V2StoreProvider } from "@/lib/v2/react"
import { createV2Store } from "@/lib/v2/store"

if (!("scrollTo" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "scrollTo", { configurable: true, writable: true, value: vi.fn() })
}
if (!("scrollIntoView" in Element.prototype)) {
  Object.defineProperty(Element.prototype, "scrollIntoView", { configurable: true, writable: true, value: vi.fn() })
}

/**
 * One footer contract (Romit 2026-10-27: "Why is the Back button at a different position after every wizard step?"): Back's slot
 * is always the first child, then the summary or a spacer, the context line, the outline secondary, and the one filled primary
 * last. Nothing moves between steps.
 */

const footerOf = (root: HTMLElement) => root.querySelector<HTMLElement>('[data-region="footer"]')!
const buttonsIn = (el: HTMLElement) => [...el.querySelectorAll<HTMLElement>('[data-slot="button"]')].filter((b) => !b.closest("[data-rule-sentence]"))

function assertContract(footer: HTMLElement, expectBack: boolean) {
  const first = footer.firstElementChild as HTMLElement
  expect(first.hasAttribute("data-footer-back-slot")).toBe(true)
  expect(!!first.querySelector("[data-footer-back]")).toBe(expectBack)
  const actions = footer.querySelector<HTMLElement>("[data-footer-actions]")!
  const btns = buttonsIn(actions)
  // Primary is the last button and the only filled one; outline ones come before it.
  expect(btns.at(-1)!.getAttribute("data-variant")).toBe("default")
  expect(btns.slice(0, -1).every((b) => b.getAttribute("data-variant") === "outline")).toBe(true)
  expect(footer.querySelectorAll('[data-slot="button"][data-variant="default"]')).toHaveLength(1)
}

describe("StickyFooter contract", () => {
  it("keeps Back's slot first even without Back, and the primary last", () => {
    const { container: a } = render(<StickyFooter secondary={{ label: "Save draft" }} primary={{ label: "Next" }} />)
    assertContract(footerOf(a), false)
    const { container: b } = render(<StickyFooter back={{ onClick: () => {} }} summary="Get 3 evaluations rated Met." secondary={{ label: "Save draft" }} primary={{ label: "Next" }} />)
    assertContract(footerOf(b), true)
    // With a summary, Back stays at the left edge (it used to move beside the primary).
    expect(footerOf(b).firstElementChild!.textContent).toBe("Back")
  })

  it("spans the page gutter, is opaque, and sits above the content", () => {
    const { container } = render(<StickyFooter primary={{ label: "Next" }} />)
    const cls = footerOf(container).className
    expect(cls).toMatch(/\bsticky\b/)
    expect(cls).toMatch(/\bbottom-0\b/)
    expect(cls).toMatch(/\bbg-background\b/)
    expect(cls).toMatch(/\bborder-t\b/)
    expect(cls).toMatch(/\bz-20\b/)
    expect(cls).toMatch(/-mx-4/)
    expect(cls).toMatch(/md:-mx-6/)
  })
})

describe("Configure A: the same footer on every step", () => {
  for (const step of ["model", "outcomes", "rule", "signoff", "check"] as const) {
    it(`step ${step}: Back slot first, Save draft then the primary last`, async () => {
      nav.search = `variant=A&skill=sk-med-admin&step=${step}`
      let view: ReturnType<typeof render> | null = null
      await act(async () => {
        view = render(
          <V2StoreProvider store={createV2Store({ storage: null })}>
            <TooltipProvider>
              <AdminConfigureSkillA />
            </TooltipProvider>
          </V2StoreProvider>,
        )
      })
      const root = view!.container
      await waitFor(() => expect(root.querySelector('[data-region="footer"]')).not.toBeNull())
      await waitFor(() => expect(root.querySelector('nav[aria-label^="Wizard steps"] li[aria-current="step"]')?.textContent ?? "").not.toBe(""))
      const footer = footerOf(root)
      assertContract(footer, step !== "model")
      const labels = buttonsIn(footer.querySelector("[data-footer-actions]")!).map((b) => b.textContent)
      expect(labels[0]).toBe("Save draft")
      view!.unmount()
    })
  }
})
