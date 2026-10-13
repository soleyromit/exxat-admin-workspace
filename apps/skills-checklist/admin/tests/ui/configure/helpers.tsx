import * as React from "react"
import { render, screen, within } from "@testing-library/react"
import userEvent from "@testing-library/user-event"
import { vi } from "vitest"
import { TooltipProvider } from "@exxatdesignux/ui/components/ui/tooltip"
import { AddSkillDialog, ConfigureWizardDialog, type WizardSaved } from "@/components/configure"
import type { Db, Id } from "@/lib/domain/types"
import { createSkill } from "@/lib/store"
import { getRuntime } from "@/lib/store/react"
import { router } from "./router"

export { router } from "./router"

// jsdom gaps that Radix Select and cmdk need (pointer capture, scrollIntoView).
if (typeof Element !== "undefined") {
  const proto = Element.prototype as unknown as Record<string, unknown>
  proto.hasPointerCapture ??= () => false
  proto.setPointerCapture ??= () => undefined
  proto.releasePointerCapture ??= () => undefined
  proto.scrollIntoView ??= () => undefined
  // The DS WizardNav measures and scrolls its step list.
  proto.scrollTo ??= () => undefined
  proto.scrollBy ??= () => undefined
}

export function resetStore() {
  window.localStorage.clear()
  getRuntime().reset()
  router.push.mockClear()
  router.replace.mockClear()
}

export const dbNow = (): Db => getRuntime().getDb()
export const setup = () => userEvent.setup()
export type User = ReturnType<typeof setup>

/** Create an unconfigured skill through the same store action the Add skill dialog uses. */
export function createBlank(name = "Sample skill"): Id {
  const r = getRuntime().run((db, ctx) => createSkill(db, { name, description: "", categoryId: null, tagIds: [] }, ctx))
  if (!r.ok) throw new Error(r.error.message)
  return r.value.skillId
}

export interface WizardHarness {
  onOpenChange: ReturnType<typeof vi.fn>
  onSaved: ReturnType<typeof vi.fn<(s: WizardSaved) => void>>
}

export function renderWizard(skillId: Id | null, initialStep?: 1 | 2 | 3): WizardHarness {
  const onOpenChange = vi.fn()
  const onSaved = vi.fn<(s: WizardSaved) => void>()
  render(
    <TooltipProvider>
      <ConfigureWizardDialog open skillId={skillId} initialStep={initialStep} onOpenChange={onOpenChange} onSaved={onSaved} />
    </TooltipProvider>,
  )
  return { onOpenChange, onSaved }
}

export function renderAdd() {
  const onOpenChange = vi.fn()
  const onConfigure = vi.fn()
  const onAdded = vi.fn()
  render(
    <TooltipProvider>
      <AddSkillDialog open onOpenChange={onOpenChange} onConfigure={onConfigure} onAdded={onAdded} />
    </TooltipProvider>,
  )
  return { onOpenChange, onConfigure, onAdded }
}

/** The wizard dialog (after the store has loaded). */
export const ready = () => screen.findByRole("dialog", { name: /Edit skill/ })
export const dlg = () => within(screen.getByTestId("configure-wizard"))
export const stepText = () => screen.getByText(/^Step \d of 3/).textContent
export const body = () => within(screen.getByTestId("wizard-body"))

export const next = (user: User) => user.click(screen.getByRole("button", { name: "Continue" }))
export const back = (user: User) => user.click(screen.getByRole("button", { name: "Back" }))
export const save = (user: User) => user.click(screen.getByRole("button", { name: "Save skill" }))
export async function toStep(user: User, n: 1 | 2 | 3) {
  for (let i = 0; i < n - 1; i++) await next(user)
}

export async function pickModel(user: User, title: RegExp | string) {
  await user.click(screen.getByRole("radio", { name: title }))
}

/** Type into a labelled input, replacing the current value. */
export async function typeInto(user: User, el: HTMLElement, text: string) {
  await user.clear(el)
  if (text) await user.type(el, text)
}

/** Choose an option in a DS Select (Radix) by the trigger's accessible name. */
export async function chooseOption(user: User, trigger: HTMLElement, option: string | RegExp) {
  await user.click(trigger)
  await user.click(await screen.findByRole("option", { name: option }))
}

/** A valid binary configuration reached through the UI (step 2), leaving the wizard on step 2. */
export async function fillBinary(user: User) {
  await toStep(user, 2)
  await pickModel(user, /Overall Binary/)
  await user.click(screen.getByRole("button", { name: "Met / Unmet" }))
}

/** A question model with `n` questions that all have text. */
export async function fillQuestions(user: User, n = 3) {
  await toStep(user, 2)
  await pickModel(user, /Question-Level/)
  for (let i = 0; i < n; i++) await user.click(document.getElementById("cfg-add-question") as HTMLElement)
  for (let i = 0; i < n; i++) await typeInto(user, document.getElementById(`cfg-question-${i}`) as HTMLElement, `Question text ${i + 1}`)
}

/** Three demonstration levels. */
export async function fillLevels(user: User, names = ["Observed", "With Assistance", "Independent"]) {
  await toStep(user, 2)
  await pickModel(user, /Demonstration-Level/)
  for (let i = 0; i < names.length; i++) await user.click(document.getElementById("cfg-add-level") as HTMLElement)
  for (let i = 0; i < names.length; i++) await typeInto(user, document.getElementById(`cfg-level-${i}`) as HTMLElement, names[i])
}
