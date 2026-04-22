import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { devLog } from "./dev-log"

describe("devLog", () => {
  const originalEnv = process.env.NODE_ENV

  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
    process.env.NODE_ENV = originalEnv
  })

  it("logs in development", () => {
    process.env.NODE_ENV = "development"
    devLog("hello", 1)
    expect(console.log).toHaveBeenCalledWith("hello", 1)
  })

  it("does not log in production", () => {
    process.env.NODE_ENV = "production"
    devLog("silent")
    expect(console.log).not.toHaveBeenCalled()
  })
})
