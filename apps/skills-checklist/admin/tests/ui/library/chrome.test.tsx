import { Button } from "@exxatdesignux/ui"
import * as React from "react"
import { beforeEach, describe, expect, it, vi } from "vitest"
import { screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"

vi.mock("next/navigation", async () => (await import("./harness")).navigationMock)

import { LibraryPage, libraryTabHref, parseTab } from "@/components/library/library-page"
import {  useLibraryDialogs, useLibraryDialogState } from "@/components/library/dialog-bridge"
import { axeViolations, nav, renderPage, resetWorld } from "./harness"

beforeEach(() => resetWorld())

describe("library page: one page, six tabs (P-04, P-05)", () => {
  it("parses the tab from ?tab= and falls back to Skills; tab hrefs round-trip", () => {
    expect(parseTab(null)).toBe("skills")
    expect(parseTab("nonsense")).toBe("skills")
    for (const t of ["kits", "categories", "tags", "settings", "lab-instructors"]) expect(libraryTabHref(parseTab(t))).toBe(`/skills/library?tab=${t}`)
    expect(libraryTabHref("skills")).toBe("/skills/library")
  })

  it("renders one h1, six tabs, the selected tab from the URL, and no second tab's content", async () => {
    resetWorld("/skills/library", "tab=tags")
    const { container } = renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: "Where each tag reaches" })).toBeInTheDocument()
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
    expect(screen.getAllByRole("tab")).toHaveLength(6)
    expect(screen.getByRole("tab", { name: /^Tags \(/ })).toHaveAttribute("aria-selected", "true")
    expect(screen.queryByRole("searchbox", { name: "Search skills" })).toBeNull()
    expect(await axeViolations(container)).toEqual([])
  })

  it("Kits tab renders the HY-02 placeholder inside its panel, with no count", async () => {
    resetWorld("/skills/library", "tab=kits")
    renderPage(<LibraryPage />)
    expect(await screen.findByRole("heading", { level: 2, name: /Not built yet/ })).toBeInTheDocument()
    expect(screen.getByRole("tab", { name: "Kits" })).toHaveAttribute("aria-selected", "true")
    expect(screen.getAllByRole("heading", { level: 1 })).toHaveLength(1)
  })

  it("keyboard: arrow keys move along the tab row and open the tab (the page is one route; the URL follows)", async () => {
    const user = userEvent.setup()
    renderPage(<LibraryPage />)
    await screen.findByText("IV Insertion")
    await user.tab()
    expect(screen.getByRole("tab", { name: /^Skills \(/ })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: "Kits" })).toHaveFocus()
    await user.keyboard("{ArrowRight}")
    expect(screen.getByRole("tab", { name: /^Categories \(/ })).toHaveFocus()
    await user.keyboard("{Enter}")
    expect(nav.push).toHaveBeenCalledWith("/skills/library?tab=categories", { scroll: false })
  })
})

function Probe() {
  const dialogs = useLibraryDialogs()
  const state = useLibraryDialogState()
  return (
    <div>
      <Button type="button" variant="outline" size="sm" onClick={dialogs.openAddSkill}>add</Button>
      <Button type="button" variant="outline" size="sm" onClick={() => dialogs.openConfigure("sk-iv")}>configure</Button>
      <Button type="button" variant="outline" size="sm" onClick={dialogs.openImport}>import</Button>
      <Button type="button" variant="outline" size="sm" onClick={dialogs.close}>close</Button>
      <output>{`${state.dialog ?? "none"}|${state.skillId ?? ""}`}</output>
    </div>
  )
}

describe("dialog bridge: the URL contract with the Add skill / Configure / Import dialogs", () => {
  it("opens ?dialog=add | configure&skill= | import on the library page in place, keeping the other keys", async () => {
    resetWorld("/skills/library", "status=unconfigured&q=nas")
    const user = userEvent.setup()
    renderPage(<Probe />)
    await user.click(screen.getByText("add"))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?status=unconfigured&q=nas&dialog=add")
    await user.click(screen.getByText("configure"))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?status=unconfigured&q=nas&dialog=configure&skill=sk-iv")
    await user.click(screen.getByText("import"))
    expect(nav.push).toHaveBeenLastCalledWith("/skills/library?status=unconfigured&q=nas&dialog=import")
    await user.click(screen.getByText("close"))
    expect(nav.replace).toHaveBeenLastCalledWith("/skills/library?status=unconfigured&q=nas", { scroll: false })
  })

  it("reads the open dialog and skill from the URL", () => {
    resetWorld("/skills/library", "dialog=configure&skill=sk-wound")
    renderPage(<Probe />)
    expect(screen.getByRole("status")).toHaveTextContent("configure|sk-wound")
  })
})
