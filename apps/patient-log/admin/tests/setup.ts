import "@testing-library/jest-dom/vitest"
import { cleanup } from "@testing-library/react"
import { afterEach, beforeEach, vi } from "vitest"

// Node 25 exposes its own experimental `localStorage` global, and with no
// `--localstorage-file` behind it that global is an empty object which shadows
// jsdom's working implementation. Every `getItem` call then throws, and because
// `persisted-state` swallows storage errors by design, anything persisted looked
// like it had simply never been written — silently, and only on newer Node.
//
// Install a real in-memory Storage so persistence behaves the same whatever Node
// the suite runs on.
class MemoryStorage implements Storage {
  #entries = new Map<string, string>()

  get length() {
    return this.#entries.size
  }
  key(index: number) {
    return Array.from(this.#entries.keys())[index] ?? null
  }
  getItem(key: string) {
    return this.#entries.has(key) ? this.#entries.get(key)! : null
  }
  setItem(key: string, value: string) {
    this.#entries.set(key, String(value))
  }
  removeItem(key: string) {
    this.#entries.delete(key)
  }
  clear() {
    this.#entries.clear()
  }
}

function installStorage(name: "localStorage" | "sessionStorage") {
  const storage = new MemoryStorage()
  for (const target of [window, globalThis]) {
    Object.defineProperty(target, name, {
      configurable: true,
      writable: true,
      value: storage,
    })
  }
}

// Once at import, before any test file's imports run, and again per test. The
// per-test call is the isolation; this one is for modules that resolve storage
// while being imported. `app-store` is one: zustand's persist middleware reads
// the global as the store is created, so a store imported before the first
// `beforeEach` would hold Node's broken object for the whole file and every write
// through it would throw `setItem is not a function`.
installStorage("localStorage")
installStorage("sessionStorage")

beforeEach(() => {
  installStorage("localStorage")
  installStorage("sessionStorage")
})

// Testing Library only auto-registers its cleanup when vitest runs with
// `globals: true`. This config does not, so unmount between tests explicitly —
// otherwise every render stacks up in document.body and singular queries like
// getByRole start failing on the second open surface.
afterEach(() => {
  cleanup()
})

// jsdom does not implement window.matchMedia — stub it for tests that use
// useTableState (which calls useSyncExternalStore with a matchMedia listener)
Object.defineProperty(window, "matchMedia", {
  writable: true,
  value: (query: string) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  }),
})

// jsdom does not implement ResizeObserver — stub it for components that use
// Radix UI primitives (Sheet, Tooltip, etc.) which call it internally.
globalThis.ResizeObserver = class {
  observe = vi.fn()
  unobserve = vi.fn()
  disconnect = vi.fn()
}

// jsdom implements no part of the Pointer Capture API and no scrolling. Radix
// Select calls both while opening, and the throw lands in an event handler rather
// than the test, so it surfaces as an unhandled error and a menu that never
// opened instead of a readable failure.
for (const method of [
  "hasPointerCapture",
  "setPointerCapture",
  "releasePointerCapture",
  "scrollIntoView",
] as const) {
  if (method in Element.prototype) continue
  Object.defineProperty(Element.prototype, method, {
    configurable: true,
    writable: true,
    value: method === "hasPointerCapture" ? () => false : vi.fn(),
  })
}
