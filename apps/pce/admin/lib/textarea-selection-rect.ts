/**
 * Where a textarea's selection sits on screen.
 *
 * A textarea renders its text without exposing any DOM for it, so there is no
 * node to call `getBoundingClientRect` on. The standard answer is a mirror: a
 * div styled to lay the same string out the same way, with the selected span
 * wrapped in an element we can measure, then mapped back onto the real control.
 *
 * Used to anchor Leo to the span the user picked rather than to the field.
 *
 * @see components/leo-assist-field.tsx
 */

/**
 * Everything that can change where a glyph lands. Anything missing here shows
 * up as the anchor drifting a line or two away from the selection.
 */
const MIRRORED_PROPERTIES = [
  "border-bottom-width",
  "border-left-width",
  "border-right-width",
  "border-top-width",
  "font-family",
  "font-size",
  "font-stretch",
  "font-style",
  "font-variant",
  "font-weight",
  "letter-spacing",
  "line-height",
  "padding-bottom",
  "padding-left",
  "padding-right",
  "padding-top",
  "tab-size",
  "text-align",
  "text-indent",
  "text-transform",
  "white-space",
  "word-break",
  "word-spacing",
  "overflow-wrap",
] as const

/**
 * The viewport rect of the first line of `[start, end)`, or null when the
 * document is not available.
 *
 * First line rather than the union: a selection spanning six lines has a
 * bounding box the size of a paragraph, and anchoring to the middle of that
 * puts the affordance nowhere in particular. The first line is where the user's
 * eye already is.
 */
export function getTextareaSelectionRect(
  el: HTMLTextAreaElement,
  start: number,
  end: number,
): DOMRect | null {
  if (typeof document === "undefined") return null

  const style = window.getComputedStyle(el)
  const mirror = document.createElement("div")

  for (const property of MIRRORED_PROPERTIES) {
    mirror.style.setProperty(property, style.getPropertyValue(property))
  }

  // A scrollbar eats content width, and content width decides where every line
  // wraps. Measure it off the control rather than assuming a platform value.
  const scrollbar =
    el.offsetWidth -
    el.clientWidth -
    parseFloat(style.borderLeftWidth) -
    parseFloat(style.borderRightWidth)

  mirror.style.boxSizing = "border-box"
  mirror.style.width = `${el.offsetWidth - scrollbar}px`
  mirror.style.position = "absolute"
  mirror.style.top = "0"
  mirror.style.left = "-9999px"
  mirror.style.height = "auto"
  mirror.style.visibility = "hidden"
  mirror.style.pointerEvents = "none"

  const value = el.value
  const marker = document.createElement("span")
  // A collapsed range still needs a box to measure, so it gets a zero-width
  // space. The same character goes after the tail, because a value ending in a
  // newline otherwise leaves the mirror one line shorter than the control.
  marker.textContent = value.slice(start, end) || "\u200b"

  mirror.append(
    document.createTextNode(value.slice(0, start)),
    marker,
    document.createTextNode(`${value.slice(end)}\u200b`),
  )
  document.body.append(mirror)

  const mirrorBox = mirror.getBoundingClientRect()
  const line = marker.getClientRects()[0] ?? marker.getBoundingClientRect()
  const offsetLeft = line.left - mirrorBox.left
  const offsetTop = line.top - mirrorBox.top
  const { width, height } = line

  mirror.remove()

  const host = el.getBoundingClientRect()
  return new DOMRect(
    host.left + offsetLeft - el.scrollLeft,
    host.top + offsetTop - el.scrollTop,
    width,
    height,
  )
}
