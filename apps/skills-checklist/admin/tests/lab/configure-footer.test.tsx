import * as React from "react"
import { describe, expect, it, vi } from "vitest"
import { act, fireEvent, render, waitFor } from "@testing-library/react"

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

describe("Change one skill (Configure A, 2026-11-02): one page, one Save", () => {
  it("shows the four sections and a footer with Save as its only action", async () => {
    nav.search = "variant=A&skill=sk-med-admin"
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
    await waitFor(() => expect(root.querySelector("[data-one-skill]")).not.toBeNull())
    const titles = [...root.querySelectorAll("[data-one-skill] h2")].map((h) => h.textContent?.replace(/^\d+/, ""))
    expect(titles).toEqual(["How skills are judged", "What counts as achieved", "How many evaluations", "Who signs"])
    // Nothing to save on arrival, so no footer; a change brings the one Save.
    expect(root.querySelector('[data-region="footer"]')).toBeNull()
    await act(async () => { fireEvent.change(document.getElementById("cfg-need")!, { target: { value: "5" } }) })
    await waitFor(() => expect(root.querySelector('[data-region="footer"]')).not.toBeNull())
    const footer = root.querySelector('[data-region="footer"]')!
    expect(buttonsIn(footer as HTMLElement).map((b) => b.textContent)).toEqual(["Save"])
    view!.unmount()
  })
})
