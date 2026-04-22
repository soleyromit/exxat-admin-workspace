/**
 * True when focus is in a field where global shortcuts should not fire.
 */
export function isEditableTarget(target: EventTarget | null): boolean {
  const el = target as HTMLElement | null
  if (!el) return false
  if (el instanceof HTMLInputElement || el instanceof HTMLTextAreaElement || el instanceof HTMLSelectElement)
    return true
  return el.getAttribute?.("contenteditable") === "true"
}
