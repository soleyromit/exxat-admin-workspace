/**
 * Two doors on a product card, for the person who holds two identities.
 *
 * A student who also has a staff seat in the same program is looking at a fork
 * rather than a door, and the fork is asked here rather than at sign-in so it can
 * be answered again tomorrow. What has to hold: only a session that was granted
 * the pair sees it, only a school-scoped product offers it, and each door writes
 * the identity *before* it navigates, because the page it opens reads the role
 * while it renders.
 */

import { render, screen } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { MemoryRouter } from "react-router"
import { beforeEach, describe, expect, it, vi } from "vitest"

import { TooltipProvider } from "@/components/ui/tooltip"
import {
  DEFAULT_LOGIN_SESSION,
  getLoginSession,
  setLoginSession,
  type WorkspaceRole,
} from "@/lib/login-session"
import { buildProductHomeInventory, type ProductHomeCard } from "@/lib/product-home"
import { STUDENT_HOME_PATH } from "@/lib/student-shell"

import { OwnedProductTile } from "./product-home-parts"

const navigate = vi.fn()

vi.mock("react-router", async () => {
  const actual = await vi.importActual<typeof import("react-router")>("react-router")
  return { ...actual, useNavigate: () => navigate }
})

// Which product the shell has open is not what is under test, and the real
// provider boots a tenant catalogue over `fetch` on mount.
vi.mock("@/contexts/product-context", () => ({
  useProduct: () => ({ product: "exxat-prism" }),
}))

const BOTH: WorkspaceRole[] = ["student", "member"]

function signIn(opensAs: WorkspaceRole[], role: WorkspaceRole = "student") {
  setLoginSession({ ...DEFAULT_LOGIN_SESSION, role, opensAs })
}

function cardFor(product: string): ProductHomeCard {
  const card = buildProductHomeInventory([], []).owned.find(
    entry => entry.product === product,
  )
  if (!card) throw new Error(`${product} is not owned by this workspace`)
  return card
}

const onOpen = vi.fn()

function renderTile(card: ProductHomeCard) {
  return render(
    <MemoryRouter>
      <TooltipProvider>
        <ul>
          <OwnedProductTile card={card} onOpen={onOpen} />
        </ul>
      </TooltipProvider>
    </MemoryRouter>,
  )
}

describe("a card for someone holding two identities", () => {
  beforeEach(() => {
    window.localStorage.clear()
    navigate.mockClear()
    onOpen.mockClear()
  })

  it("offers a door per identity, each naming the product", () => {
    signIn(BOTH)
    renderTile(cardFor("exxat-prism"))

    expect(screen.queryByRole("button", { name: /^Open$/ })).not.toBeInTheDocument()
    // The product is in the accessible name, or a grid of these reads out as
    // several identical pairs of "Open as student".
    expect(
      screen.getByRole("button", { name: "Open as student in Clinical Education" }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole("button", { name: "Open as school in Clinical Education" }),
    ).toBeInTheDocument()
  })

  it("becomes a student and opens their own page, not the program's", async () => {
    const user = userEvent.setup()
    signIn(BOTH, "member")
    renderTile(cardFor("exxat-prism"))

    await user.click(screen.getByRole("button", { name: /open as student/i }))

    expect(getLoginSession().role).toBe("student")
    expect(navigate).toHaveBeenCalledWith(STUDENT_HOME_PATH)
    // The student home is a page of its own rather than the product dashboard.
    expect(onOpen).not.toHaveBeenCalled()
  })

  it("becomes staff and opens the product", async () => {
    const user = userEvent.setup()
    const card = cardFor("exxat-prism")
    signIn(BOTH)
    renderTile(card)

    await user.click(screen.getByRole("button", { name: /open as school/i }))

    expect(getLoginSession().role).toBe("member")
    expect(onOpen).toHaveBeenCalledWith(card)
    expect(navigate).not.toHaveBeenCalled()
  })

  // Taking a door is not spending it. Coming back to the products home and
  // opening as the other identity must not require signing out.
  it("keeps both doors after one has been taken", async () => {
    const user = userEvent.setup()
    signIn(BOTH)
    renderTile(cardFor("exxat-prism"))

    await user.click(screen.getByRole("button", { name: /open as school/i }))
    expect(getLoginSession().opensAs).toEqual(BOTH)
  })

  /**
   * "As a student" means a student of a program, so a site product has no student
   * view to open and its card keeps the one door every other card has.
   *
   * Personnel is the site-scoped product, and it is a Directory root rather than
   * an owned card, so the card here is an owned one wearing its product id. That
   * is the whole input to the branch under test: the tile asks
   * `isSchoolScopedProduct` and nothing else about the product.
   */
  it("keeps one door on a site product", () => {
    signIn(BOTH)
    renderTile({ ...cardFor("exxat-prism"), product: "exxat-personnel" })

    expect(screen.getByRole("button", { name: /^Open$/ })).toBeInTheDocument()
    expect(screen.queryByRole("button", { name: /open as/i })).not.toBeInTheDocument()
  })
})

describe("a card for someone holding one identity", () => {
  beforeEach(() => {
    window.localStorage.clear()
    onOpen.mockClear()
  })

  it.each<WorkspaceRole>(["administrator", "member", "student"])(
    "keeps a single Open for %s",
    role => {
      signIn([], role)
      renderTile(cardFor("exxat-prism"))

      expect(screen.getByRole("button", { name: /^Open$/ })).toBeInTheDocument()
      expect(screen.queryByRole("button", { name: /open as/i })).not.toBeInTheDocument()
    },
  )
})
