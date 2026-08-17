/**
 * The case matrix for entering a product whose licensed programs are not the
 * ones you were just in.
 *
 * One rule holds all of it: the program never changes without an explicit press.
 * So each case here is really the same question asked of a different starting
 * state, and the assertion is always whether the product opened or asked.
 *
 * Read against `hooks/use-active-scope.ts`. Case labels match the enumeration in
 * `apps/web/docs/handoff/product-scope.md`.
 */

import { act, render } from "@testing-library/react"
import { beforeEach, describe, expect, it, vi } from "vitest"

import type { ActiveScope } from "@/hooks/use-active-scope"
import type { Product } from "@/contexts/product-context"

// The store's custom-product list is all this hook reads from it, and the real
// provider boots a tenant catalogue over `fetch` on mount.
vi.mock("@/stores/app-store", async () => {
  const actual =
    await vi.importActual<typeof import("@/stores/app-store")>("@/stores/app-store")
  return {
    ...actual,
    useAppStore: (selector: (s: { customProducts: []; activeCustomIndex: null }) => unknown) =>
      selector({ customProducts: [], activeCustomIndex: null }),
  }
})

/** Every program at Johns Hopkins, plus Mayo. No grant. */
const UNRESTRICTED: Product = "exxat-prism"
/** Johns Hopkins Nursing only. */
const ONE_PROGRAM: Product = "exxat-exam-management"
/** Johns Hopkins Nursing + Public Health, all of Mayo. */
const TWO_AT_JHU: Product = "exxat-compliance"

const JHU = { parent: "jhu", medicine: "som", nursing: "son", publicHealth: "sph" }

// The hook keeps one snapshot per storage key for the life of the tab, which is
// what stops two instances in the same document from drifting. Across tests that
// cache would carry the previous case's answer, so the module is rebuilt for each
// one. `login-session` comes from the same generation, or `setLoginSession` would
// be writing to a different copy than `isScopeFixed` reads.
let useActiveScope: typeof import("@/hooks/use-active-scope").useActiveScope
let setLoginSession: typeof import("@/lib/login-session").setLoginSession
let DEFAULT_LOGIN_SESSION: typeof import("@/lib/login-session").DEFAULT_LOGIN_SESSION

async function loadFreshModules() {
  vi.resetModules()
  ;({ useActiveScope } = await import("@/hooks/use-active-scope"))
  ;({ setLoginSession, DEFAULT_LOGIN_SESSION } = await import("@/lib/login-session"))
}

function scopeOf(product: Product): ActiveScope {
  let bag!: ActiveScope
  function Probe() {
    bag = useActiveScope(product)
    return null
  }
  render(<Probe />)
  return bag
}

function remember(key: string, parentId: string, childId: string) {
  window.localStorage.setItem(
    `exxat-ds:${key}`,
    JSON.stringify({ v: 1, d: { parentId, childId } }),
  )
}

/** What a press writes: this product's memory *and* the cross-product record. */
function chose(parentId: string, childId: string) {
  remember("scope-last:school", parentId, childId)
}

beforeEach(async () => {
  window.localStorage.clear()
  await loadFreshModules()
  setLoginSession({ ...DEFAULT_LOGIN_SESSION, role: "administrator" })
})

describe("a session that has never chosen a scope", () => {
  it("opens the workspace's own program rather than asking (nothing to change from)", () => {
    const scope = scopeOf(UNRESTRICTED)

    expect(scope.status).toBe("open")
    expect(scope.child?.id).toBe(JHU.medicine)
  })

  it("asks when the product does not serve that program, since the rest is a real choice", () => {
    const scope = scopeOf(TWO_AT_JHU)

    expect(scope.status).toBe("choose")
  })
})

describe("S5, the product remembers", () => {
  it("opens what it last showed when the program you left is also licensed here", () => {
    remember("compliance:scope", JHU.parent, JHU.publicHealth)
    chose(JHU.parent, JHU.nursing)

    const scope = scopeOf(TWO_AT_JHU)

    expect(scope.status).toBe("open")
    expect(scope.child?.id).toBe(JHU.publicHealth)
  })

  it("asks when the program you left is not licensed here, even if it remembers another", () => {
    // Medicine is what One last showed; Public Health is where the coordinator
    // is standing, and One does not serve it. Restoring Medicine would move them
    // without a press.
    remember("one-schools:scope", JHU.parent, JHU.medicine)
    chose(JHU.parent, JHU.publicHealth)

    const scope = scopeOf("exxat-one-schools")

    expect(scope.status).toBe("choose")
    expect(scope.parent).toBeNull()
    expect(scope.child).toBeNull()
  })
})

describe("S10, chosen next door and licensed here", () => {
  it("opens without asking, because the person already made that choice", () => {
    chose(JHU.parent, JHU.nursing)

    const scope = scopeOf(TWO_AT_JHU)

    expect(scope.status).toBe("open")
    expect(scope.child?.id).toBe(JHU.nursing)
  })

  it("writes it down as this product's own, so the two stop moving together", () => {
    chose(JHU.parent, JHU.nursing)

    scopeOf(TWO_AT_JHU)

    expect(window.localStorage.getItem("exxat-ds:compliance:scope")).toContain(JHU.nursing)
  })
})

describe("S3, one licensed program and it is not the one you left", () => {
  it("still asks, because that single option is a change", () => {
    chose(JHU.parent, JHU.medicine)

    const scope = scopeOf(ONE_PROGRAM)

    expect(scope.status).toBe("choose")
    expect(scope.config.parents).toHaveLength(1)
    expect(scope.config.childrenOf(scope.config.parents[0])).toHaveLength(1)
  })
})

describe("S7, the remembered program is no longer licensed", () => {
  it("asks rather than substituting one, and does not report a scope", () => {
    remember("compliance:scope", JHU.parent, JHU.medicine)

    const scope = scopeOf(TWO_AT_JHU)

    expect(scope.status).toBe("choose")
    expect(scope.parent).toBeNull()
    expect(scope.child).toBeNull()
  })
})

describe("S11, the school survives but the program does not", () => {
  it("leads with that school, so it does not have to be found again", () => {
    chose(JHU.parent, JHU.medicine)

    const scope = scopeOf(TWO_AT_JHU)

    expect(scope.suggestedParent?.id).toBe(JHU.parent)
  })
})

describe("S13, a school with nothing licensed under it", () => {
  it("is not offered, since picking it would land nowhere", () => {
    const scope = scopeOf(ONE_PROGRAM)

    expect(scope.config.parents.map(p => p.id)).toEqual([JHU.parent])
  })
})

describe("S18, a session that does not choose its own scope", () => {
  it("is never asked: a student gets their program", () => {
    setLoginSession({ ...DEFAULT_LOGIN_SESSION, role: "student" })
    chose(JHU.parent, JHU.nursing)

    const scope = scopeOf(UNRESTRICTED)

    expect(scope.status).toBe("open")
    expect(scope.child?.id).toBe(JHU.medicine)
  })

  it("S19: a product that does not serve their program is a dead end, not a list", () => {
    setLoginSession({ ...DEFAULT_LOGIN_SESSION, role: "student" })

    const scope = scopeOf(ONE_PROGRAM)

    expect(scope.status).toBe("none")
  })
})

describe("a press", () => {
  it("resolves the product and records the choice for the next one", () => {
    chose(JHU.parent, JHU.medicine)
    const scope = scopeOf(TWO_AT_JHU)
    const target = scope.config.childrenOf(scope.config.parents[0])[0]

    act(() => {
      scope.selectScope(scope.config.parents[0], target)
    })

    expect(scopeOf(TWO_AT_JHU).child?.id).toBe(target.id)
    expect(window.localStorage.getItem("exxat-ds:scope-last:school")).toContain(target.id)
  })

  // Personnel and the site-side Exxat One are the products scoped to brands and
  // sites: a roster of people at sites, which a program does not narrow.
  it.each(["exxat-personnel", "exxat-one-sites"] as const)(
    "S15: %s does not reach the other hierarchy, which has no program to carry",
    product => {
      chose(JHU.parent, JHU.nursing)

      const sites = scopeOf(product)

      expect(sites.config.family).toBe("site")
      expect(sites.status).toBe("open")
      expect(sites.child?.id).toBe("mgh-main")
    },
  )

  // The Exxat One in the switcher. Same hierarchy as Clinical Education, so the
  // program the coordinator was in reaches it.
  it("Exxat One is school side, so a program can carry into it", () => {
    chose(JHU.parent, JHU.nursing)

    const one = scopeOf("exxat-one-schools")

    expect(one.config.family).toBe("school")
    expect(one.status).toBe("open")
    expect(one.child?.id).toBe(JHU.nursing)
  })

  // Its grant keeps the workspace default, so the app most people open second
  // still does not rest on a question when nothing has been pressed.
  it("and does not ask when the program it carried is one it serves", () => {
    chose(JHU.parent, JHU.medicine)

    const one = scopeOf("exxat-one-schools")

    expect(one.status).toBe("open")
    expect(one.child?.id).toBe(JHU.medicine)
  })

  it("including on a first visit, where it opens the workspace's own program", () => {
    const one = scopeOf("exxat-one-schools")

    expect(one.status).toBe("open")
    expect(one.parent?.id).toBe(JHU.parent)
    expect(one.child?.id).toBe(JHU.medicine)
  })

  // The one program Exxat One does not serve, which is what makes the licence gap
  // reachable between the two apps a workspace actually switches between rather
  // than only via an add-on.
  it("asks when the program it carried is Public Health, which it does not serve", () => {
    chose(JHU.parent, JHU.publicHealth)

    const one = scopeOf("exxat-one-schools")

    expect(one.status).toBe("choose")
    expect(one.child).toBeNull()
  })
})
