import { describe, expect, it, vi, beforeEach, afterEach } from "vitest"
import { act, renderHook } from "@testing-library/react"

import { useOneShotIntro } from "./use-one-shot-intro"

/**
 * The interesting behaviour here is the ending, not the starting: whatever is
 * gated on the intro being over has to become reachable even when the animation
 * that would normally end it never runs.
 */
describe("useOneShotIntro", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts active so the mount animation has something to hang off", () => {
    const { result } = renderHook(() => useOneShotIntro())
    expect(result.current.active).toBe(true)
  })

  it("ends when the animation reports it finished", () => {
    const { result } = renderHook(() => useOneShotIntro())

    act(() => {
      result.current.end()
    })

    expect(result.current.active).toBe(false)
  })

  it("ends on its own when no animation ever runs", () => {
    // Reduced motion, forced colors, or a background tab at mount: nothing will
    // ever call `end`, and without the ceiling the intro would never finish.
    const { result } = renderHook(() => useOneShotIntro())

    act(() => {
      vi.advanceTimersByTime(2400)
    })

    expect(result.current.active).toBe(false)
  })

  it("leaves a running animation alone until its ceiling", () => {
    const { result } = renderHook(() => useOneShotIntro())

    act(() => {
      vi.advanceTimersByTime(1600)
    })

    expect(result.current.active).toBe(true)
  })

  it("stays ended — it is an arrival, not a cycle", () => {
    const { result } = renderHook(() => useOneShotIntro())

    act(() => {
      result.current.end()
    })
    act(() => {
      vi.advanceTimersByTime(10_000)
    })

    expect(result.current.active).toBe(false)
  })

  it("drops its timer on unmount", () => {
    const clear = vi.spyOn(window, "clearTimeout")
    const { unmount } = renderHook(() => useOneShotIntro())

    unmount()

    expect(clear).toHaveBeenCalled()
    clear.mockRestore()
  })
})
