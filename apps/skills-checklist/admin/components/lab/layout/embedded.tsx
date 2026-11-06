"use client"

/**
 * A hub page body rendered as one step of a focus workflow (Set up skills, D-L44, Proposed). The wizard owns the h1, the step
 * heading and the footer, so PageFrame and FormPage drop their own PageHeader inside it: one design per job, no fork.
 *
 * - `actions`: "keep" shows the page's own header actions as a right-aligned row above the body (the library's Add a skill,
 *   New skill list); "drop" hides them (links that would leave the workflow, or a Save the wizard's Next replaces).
 * - `registerPrimary`: a page whose header Save is dropped hands its save to the wizard, which runs it from Next.
 */
import * as React from "react"

export interface EmbeddedStep {
  actions: "keep" | "drop"
  /** `run` returns true when the save needs more from the admin (validation errors or its confirm dialog), false when nothing changed. */
  registerPrimary?: (run: (() => boolean) | null) => void
  /** The step heading row: kept actions are drawn there, opposite the step name, instead of on a row of their own. */
  actionsTarget?: HTMLElement | null
}

const EmbeddedContext = React.createContext<EmbeddedStep | null>(null)

export function EmbeddedStepProvider({ value, children }: { value: EmbeddedStep; children: React.ReactNode }) {
  return <EmbeddedContext.Provider value={value}>{children}</EmbeddedContext.Provider>
}

/** Null on a normal page; the step's settings inside the Set up skills workflow. */
export const useEmbeddedStep = (): EmbeddedStep | null => React.useContext(EmbeddedContext)
