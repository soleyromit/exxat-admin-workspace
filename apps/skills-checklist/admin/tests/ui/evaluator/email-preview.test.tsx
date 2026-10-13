import * as React from "react"
import { beforeEach, describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import axe from "axe-core"
import { EmailPreview } from "@/components/evaluator/email-preview"
import { SK, addRequest, noContrast, resetStore } from "./helpers"

beforeEach(() => resetStore())

describe("S-18 dev preview page", () => {
  it("renders subject, recipient, plain text and a sandboxed HTML frame for a sample link, and sends nothing", async () => {
    addRequest({ skillIds: [SK.iv, SK.foley], token: "tok-preview-1", evaluatorName: "A. Whitfield, RN" })
    render(<EmailPreview />)
    expect(await screen.findByRole("heading", { level: 1, name: "Evaluation request email" })).toBeInTheDocument()
    expect(screen.getByText(/Nothing is sent/)).toBeInTheDocument()
    expect(screen.getByRole("heading", { level: 2, name: "Plain text part" })).toBeInTheDocument()
    const frame = screen.getByTitle("HTML part of the email") as HTMLIFrameElement
    expect(frame.getAttribute("sandbox")).toBe("")
    expect(frame.getAttribute("srcdoc")).toContain("Open evaluation")
    expect(screen.getByText("(sender address set by the platform owner)", { exact: false })).toBeInTheDocument()
  })

  it("has no accessibility violations", async () => {
    addRequest({ skillIds: [SK.dressing], token: "tok-preview-2" })
    const { container } = render(<EmailPreview />)
    await screen.findByRole("heading", { level: 1 })
    // jsdom cannot message into an iframe, so the sandboxed email frame is excluded here; the HTML part is covered by email.test.ts
    expect((await axe.run({ include: [container], exclude: [["iframe"]] }, noContrast)).violations).toEqual([])
  })
})
