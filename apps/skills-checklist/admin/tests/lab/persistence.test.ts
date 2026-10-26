import { afterEach, describe, expect, it, vi } from "vitest"
import { act, cleanup, render, screen } from "@testing-library/react"
import * as React from "react"
import { renderToString } from "react-dom/server"
import { CUSTOM_GROUPS_KEY, createSessionStore } from "@/components/lab/admin-a/session-store"
import { DEFAULT_TERMS, TERMS_KEY, forgetLoadedTerms, getTerms, loadStoredTerms, resetTerms, setTerms } from "@/lib/lab/terms"
import { customGroup, studentGroups } from "@/lib/lab/lists"
import { createSeed } from "@/lib/v2/seed"

/**
 * The program's noun and custom student groups survive reloads and tabs (localStorage, guarded), render the defaults on the server
 * (no hydration mismatch) and fall back to memory when storage is blocked.
 */

const blockLocalStorage = () => {
  Object.defineProperty(window, "localStorage", {
    configurable: true,
    get() {
      throw new DOMException("The operation is insecure.", "SecurityError")
    },
  })
}

afterEach(() => {
  cleanup()
  resetTerms()
  vi.restoreAllMocks()
})

describe("program noun", () => {
  it("round trip: saved, then read back after a reload", () => {
    setTerms({ skillNoun: "competency", skillNounPlural: "competencies" })
    expect(window.localStorage.getItem(TERMS_KEY)).toBe(JSON.stringify({ skillNoun: "competency", skillNounPlural: "competencies" }))
    forgetLoadedTerms()
    expect(getTerms()).toEqual(DEFAULT_TERMS)
    loadStoredTerms()
    expect(getTerms()).toEqual({ skillNoun: "competency", skillNounPlural: "competencies" })
  })

  it("follows a change made in another tab (storage event)", () => {
    forgetLoadedTerms()
    loadStoredTerms()
    window.localStorage.setItem(TERMS_KEY, JSON.stringify({ skillNoun: "EPA", skillNounPlural: "EPAs" }))
    act(() => {
      window.dispatchEvent(new StorageEvent("storage", { key: TERMS_KEY }))
    })
    expect(getTerms()).toEqual({ skillNoun: "EPA", skillNounPlural: "EPAs" })
  })

  it("blocked storage: the noun still changes for this page and nothing throws", () => {
    blockLocalStorage()
    expect(() => setTerms({ skillNoun: "procedure", skillNounPlural: "procedures" })).not.toThrow()
    expect(getTerms()).toEqual({ skillNoun: "procedure", skillNounPlural: "procedures" })
    forgetLoadedTerms()
    expect(() => loadStoredTerms()).not.toThrow()
    expect(getTerms()).toEqual(DEFAULT_TERMS)
  })
})

describe("custom student groups", () => {
  const rule = { graduationYear: 2027 }

  it("round trip across a reload, and the group reaches the scope bar's group list", () => {
    const g = customGroup("Graduating 2027", rule)
    const a = createSessionStore(CUSTOM_GROUPS_KEY, [] as Array<typeof g>, { persist: "local" })
    a.set((prev) => [...prev, g])
    expect(JSON.parse(window.localStorage.getItem(CUSTOM_GROUPS_KEY)!)).toEqual([g])
    // A reload is a new module instance reading the same storage.
    const b = createSessionStore(CUSTOM_GROUPS_KEY, [] as Array<typeof g>, { persist: "local" })
    expect(b.get()).toEqual([g])
    // studentGroups is what Lists and the scope bar build their Group options from.
    expect(studentGroups(createSeed(), b.get()).some((x) => x.id === g.id && x.label === "Graduating 2027")).toBe(true)
  })

  it("is shared with another tab through the storage event", () => {
    const g = customGroup("Fall entry", rule)
    const a = createSessionStore(CUSTOM_GROUPS_KEY, [] as Array<typeof g>, { persist: "local" })
    expect(a.get()).toEqual([])
    window.localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify([g]))
    window.dispatchEvent(new StorageEvent("storage", { key: CUSTOM_GROUPS_KEY }))
    expect(a.get()).toEqual([g])
  })

  it("blocked storage: groups still work in memory, nothing throws", () => {
    blockLocalStorage()
    const g = customGroup("Blocked", rule)
    const a = createSessionStore(CUSTOM_GROUPS_KEY, [] as Array<typeof g>, { persist: "local" })
    expect(() => a.set([g])).not.toThrow()
    expect(a.get()).toEqual([g])
  })

  it("server render shows the default (no hydration mismatch); the client then shows the stored value", () => {
    const g = customGroup("Stored", rule)
    window.localStorage.setItem(CUSTOM_GROUPS_KEY, JSON.stringify([g]))
    const st = createSessionStore(CUSTOM_GROUPS_KEY, [] as Array<typeof g>, { persist: "local" })
    function Count() {
      const v = st.use()
      return React.createElement("span", { "data-testid": "n" }, String(v.length))
    }
    // The server snapshot is the initial value.
    expect(renderToString(React.createElement(Count))).toContain(">0<")
    render(React.createElement(Count))
    expect(screen.getByTestId("n").textContent).toBe("1")
  })
})
