import * as React from "react"
import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: vi.fn(), replace: vi.fn(), prefetch: vi.fn(), back: vi.fn(), forward: vi.fn(), refresh: vi.fn() }),
  usePathname: () => "/lab/admin/skills-library",
  useSearchParams: () => new URLSearchParams(),
}))

import { DEFAULT_TERMS, TERMS_KEY, aNoun, capitalize, getTerms, loadStoredTerms, resetTerms, setTerms, skillNoun, skillNounPlural } from "@/lib/lab/terms"
import { PERSONA_BY_ID } from "@/lib/lab/personas"
import { SCOPE_SECTIONS, SETTINGS_SECTIONS, scopeSection, sectionLabel } from "@/lib/lab/settings"
import { LibraryFrame } from "@/components/lab/library/library-chrome"
import type { LibraryApi } from "@/components/lab/library/use-library"

/**
 * The program's noun (CALL 10-26 item 7): the program names the thing students get signed off on, and every screen that
 * reads skillNoun() / skillNounPlural() follows it, including the library title and the admin nav row. There is no Settings UI
 * for it (Romit 2026-10-27: "naming can be changed in the backend, so we need to remove this tab for now"; D-L25): the noun is
 * set through the terms API or its stored value, as these tests do.
 */

afterEach(() => {
  cleanup()
  resetTerms()
  window.sessionStorage.clear()
})

const navRow = (persona: "admin" | "student", key: string) => PERSONA_BY_ID[persona].nav!().find((r) => r.key === key)!.title

const fakeApi = { hydrated: true, demo: "loading", rows: [], counts: { all: 0, notConfigured: 0, configured: 0, published: 0, inactive: 0 }, banner: null, setBanner: () => {} } as unknown as LibraryApi

describe("Settings sections and the program's noun", () => {
  it("Settings has Clinical settings and Evaluators, no Naming; Categories and tags is its own page (D-L21, D-L24, D-L25)", () => {
    expect(SETTINGS_SECTIONS).toEqual(["categories", "tags", "settings", "instructors", "evaluators"])
    // D-L24: Evaluators (every person who signs, lab instructors included) replaces the Lab instructors list.
    expect(SCOPE_SECTIONS.program).toEqual(["settings", "evaluators"])
    expect(scopeSection("program", "instructors")).toBe("evaluators")
    expect(sectionLabel("evaluators")).toBe("Evaluators")
    expect(SCOPE_SECTIONS.vocabulary).toEqual(["categories", "tags"])
    // Each page shows only its own sections: a foreign, removed or missing section falls back to the page's first.
    expect(scopeSection("program", null)).toBe("settings")
    expect(scopeSection("program", "categories")).toBe("settings")
    expect(scopeSection("program", "naming")).toBe("settings")
    expect(scopeSection("vocabulary", null)).toBe("categories")
    expect(scopeSection("vocabulary", "tags")).toBe("tags")
    expect(scopeSection("vocabulary", "instructors")).toBe("categories")
    expect(scopeSection("vocabulary", "evaluators")).toBe("categories")
  })

  it("changing the noun changes the admin nav row; the student nav has no noun row (D-L10)", () => {
    expect(navRow("admin", "skills")).toBe("Skills")
    setTerms({ skillNoun: "competency", skillNounPlural: "competencies" })
    expect(navRow("admin", "skills")).toBe("Competencies")
    expect(navRow("student", "requests")).toBe("My requests")
    resetTerms()
    expect(navRow("admin", "skills")).toBe("Skills")
  })

  it("changing the noun changes the library title, live, without a reload", () => {
    render(React.createElement(LibraryFrame, { api: fakeApi, onAdd: () => {} } as React.ComponentProps<typeof LibraryFrame>, null))
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("Skills")
    act(() => setTerms({ skillNoun: "EPA", skillNounPlural: "EPAs" }))
    expect(screen.getByRole("heading", { level: 1 }).textContent).toContain("EPAs")
    expect(screen.getByRole("button", { name: "Add an EPA" })).toBeTruthy()
  })

  it("picks a or an from the program's noun", () => {
    expect(aNoun("skill")).toBe("a skill")
    expect(aNoun("competency")).toBe("a competency")
    expect(aNoun("EPA")).toBe("an EPA")
    expect(aNoun("outcome")).toBe("an outcome")
    expect(aNoun("unit")).toBe("a unit")
  })

  it("keeps the noun in localStorage (every tab, across reloads) and reads it back after a reload", () => {
    setTerms({ skillNoun: "competency", skillNounPlural: "competencies" })
    expect(JSON.parse(window.localStorage.getItem(TERMS_KEY)!)).toEqual({ skillNoun: "competency", skillNounPlural: "competencies" })
    // Back to the default noun clears the stored value.
    resetTerms()
    expect(window.localStorage.getItem(TERMS_KEY)).toBeNull()
    expect(getTerms()).toEqual(DEFAULT_TERMS)
  })

  it("loads a stored noun once and falls back to the default for blank parts", async () => {
    vi.resetModules()
    window.localStorage.setItem(TERMS_KEY, JSON.stringify({ skillNoun: "procedure", skillNounPlural: " " }))
    const fresh = await import("@/lib/lab/terms")
    expect(fresh.skillNoun()).toBe("skill")
    fresh.loadStoredTerms()
    expect([fresh.skillNoun(), fresh.skillNounPlural()]).toEqual(["procedure", "skills"])
    expect(capitalize(skillNounPlural())).toBe("Skills")
    expect(skillNoun()).toBe("skill")
    void loadStoredTerms
  })
})
