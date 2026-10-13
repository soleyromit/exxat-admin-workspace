import { vi } from "vitest"

/** One router double for every wizard test file. Kept in its own module so the vi.mock factory never imports the dialogs. */
export const router = { push: vi.fn(), replace: vi.fn(), back: vi.fn(), refresh: vi.fn(), prefetch: vi.fn(), forward: vi.fn() }
