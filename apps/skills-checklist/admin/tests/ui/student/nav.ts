// Shared next/navigation mock for the student UI tests. Each test file registers it with:
//   vi.mock("next/navigation", async () => (await import("./nav")).navigationMock)
import { vi } from "vitest"

export const nav = {
  params: new URLSearchParams(),
  pathname: "/",
  push: vi.fn(),
  replace: vi.fn(),
  refresh: vi.fn(),
}

export const navigationMock = {
  usePathname: () => nav.pathname,
  useRouter: () => ({ push: nav.push, replace: nav.replace, refresh: nav.refresh, back: vi.fn(), forward: vi.fn() }),
  useSearchParams: () => nav.params,
  redirect: vi.fn(),
}

export function resetNav(path = "/", search = "") {
  nav.pathname = path
  nav.params = new URLSearchParams(search)
  nav.push.mockReset()
  nav.replace.mockReset()
  nav.refresh.mockReset()
}
