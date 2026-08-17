/**
 * Presence is what stops Leo's hero star from animating over an idle panel, so
 * the rules worth pinning are the ones a regression would quietly undo: hover in
 * and out, typing keeping it awake, the settle after the last keystroke, and
 * working overriding all of it.
 */

import { act, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest"

import { LEO_TYPING_SETTLE_MS, useLeoPresence } from "./use-leo-presence"

function Panel({ working = false }: { working?: boolean }) {
  const { present, presenceHandlers } = useLeoPresence(working)
  return (
    <div data-testid="panel" {...presenceHandlers}>
      <span data-testid="present">{present ? "alive" : "still"}</span>
      <input aria-label="Ask Leo" />
    </div>
  )
}

const present = () => screen.getByTestId("present").textContent
const panel = () => screen.getByTestId("panel")

describe("useLeoPresence", () => {
  beforeEach(() => {
    vi.useFakeTimers()
  })
  afterEach(() => {
    vi.useRealTimers()
  })

  it("starts still, so an untouched panel animates nothing", () => {
    render(<Panel />)
    expect(present()).toBe("still")
  })

  it("wakes while the pointer is over the panel and settles when it leaves", () => {
    render(<Panel />)
    // React derives enter and leave from pointerover / pointerout, so those are
    // the events a real pointer would deliver.
    fireEvent.pointerOver(panel())
    expect(present()).toBe("alive")

    fireEvent.pointerOut(panel(), { relatedTarget: document.body })
    expect(present()).toBe("still")
  })

  it("stays awake through a typing pause, then settles", () => {
    render(<Panel />)
    const field = screen.getByLabelText("Ask Leo")

    act(() => {
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "a", bubbles: true }))
    })
    expect(present()).toBe("alive")

    act(() => {
      vi.advanceTimersByTime(LEO_TYPING_SETTLE_MS - 500)
    })
    expect(present()).toBe("alive")

    act(() => {
      field.dispatchEvent(new KeyboardEvent("keydown", { key: "b", bubbles: true }))
      vi.advanceTimersByTime(LEO_TYPING_SETTLE_MS - 500)
    })
    expect(present()).toBe("alive")

    act(() => {
      vi.advanceTimersByTime(600)
    })
    expect(present()).toBe("still")
  })

  it("is alive whenever Leo is working, untouched", () => {
    render(<Panel working />)
    expect(present()).toBe("alive")
  })
})
