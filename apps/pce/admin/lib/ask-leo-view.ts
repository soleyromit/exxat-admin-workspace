/**
 * Ask Leo view modes + floating-window geometry aliases.
 *
 * Geometry lives in `@exxatdesignux/ui` (`floating-window`). This module keeps
 * Ask Leo dock keys and thin aliases so existing imports keep working.
 *
 * @see components/ask-leo-window.tsx
 * @see @exxatdesignux/ui/components/floating-window
 */

import {
  FLOATING_WINDOW_CORNERS,
  FLOATING_WINDOW_DEFAULT_HEIGHT,
  FLOATING_WINDOW_DEFAULT_WIDTH,
  FLOATING_WINDOW_INSET,
  FLOATING_WINDOW_MIN_HEIGHT,
  FLOATING_WINDOW_MIN_WIDTH,
  FLOATING_WINDOW_NUDGE,
  FLOATING_WINDOW_NUDGE_COARSE,
  clampFloatingWindowRect,
  defaultFloatingWindowRect,
  moveFloatingWindowRect,
  nudgeFloatingWindowSize,
  resizeFloatingWindowRect,
  snapFloatingWindowRect,
  snapFloatingWindowToNextCorner,
  type FloatingWindowCorner,
  type FloatingWindowRect,
  type FloatingWindowResizeHandle,
  type FloatingWindowViewport,
} from "@exxatdesignux/ui/components/floating-window"

/** Where the conversation renders. Full screen is a route, so it is not here. */
export type AskLeoDock = "panel" | "window"

/**
 * Shell-global, not product-namespaced: Leo is shell chrome, and a coordinator
 * who prefers a window in one product prefers it in all of them. Same reasoning
 * as `shell:ask-leo-panel-width`.
 */
export const ASK_LEO_DOCK_KEY = "shell:ask-leo-dock"
export const ASK_LEO_WINDOW_RECT_KEY = "shell:ask-leo-window-rect"

export type AskLeoWindowRect = FloatingWindowRect
export type AskLeoViewport = FloatingWindowViewport
export type AskLeoWindowResizeHandle = FloatingWindowResizeHandle
export type AskLeoWindowCorner = FloatingWindowCorner

export const ASK_LEO_WINDOW_MIN_WIDTH = FLOATING_WINDOW_MIN_WIDTH
export const ASK_LEO_WINDOW_MIN_HEIGHT = FLOATING_WINDOW_MIN_HEIGHT
export const ASK_LEO_WINDOW_DEFAULT_WIDTH = FLOATING_WINDOW_DEFAULT_WIDTH
export const ASK_LEO_WINDOW_DEFAULT_HEIGHT = FLOATING_WINDOW_DEFAULT_HEIGHT
export const ASK_LEO_WINDOW_INSET = FLOATING_WINDOW_INSET
export const ASK_LEO_WINDOW_NUDGE = FLOATING_WINDOW_NUDGE
export const ASK_LEO_WINDOW_NUDGE_COARSE = FLOATING_WINDOW_NUDGE_COARSE
export const ASK_LEO_WINDOW_CORNERS = FLOATING_WINDOW_CORNERS

export function defaultAskLeoWindowRect(viewport: AskLeoViewport): AskLeoWindowRect {
  return defaultFloatingWindowRect(viewport, {
    width: ASK_LEO_WINDOW_DEFAULT_WIDTH,
    height: ASK_LEO_WINDOW_DEFAULT_HEIGHT,
    anchor: "bottom-right",
  })
}

export function clampAskLeoWindowRect(
  rect: AskLeoWindowRect,
  viewport: AskLeoViewport,
): AskLeoWindowRect {
  return clampFloatingWindowRect(rect, viewport)
}

export function moveAskLeoWindowRect(
  rect: AskLeoWindowRect,
  dx: number,
  dy: number,
  viewport: AskLeoViewport,
): AskLeoWindowRect {
  return moveFloatingWindowRect(rect, dx, dy, viewport)
}

export function resizeAskLeoWindowRect(
  start: AskLeoWindowRect,
  handle: AskLeoWindowResizeHandle,
  dx: number,
  dy: number,
  viewport: AskLeoViewport,
): AskLeoWindowRect {
  return resizeFloatingWindowRect(start, handle, dx, dy, viewport)
}

export function snapAskLeoWindowRect(
  rect: AskLeoWindowRect,
  corner: AskLeoWindowCorner,
  viewport: AskLeoViewport,
): AskLeoWindowRect {
  return snapFloatingWindowRect(rect, corner, viewport)
}

export function snapAskLeoWindowToNextCorner(
  rect: AskLeoWindowRect,
  viewport: AskLeoViewport,
): AskLeoWindowRect {
  return snapFloatingWindowToNextCorner(rect, viewport)
}

export function nudgeAskLeoWindowSize(
  rect: AskLeoWindowRect,
  dx: number,
  dy: number,
  viewport: AskLeoViewport,
): AskLeoWindowRect {
  return nudgeFloatingWindowSize(rect, dx, dy, viewport)
}
