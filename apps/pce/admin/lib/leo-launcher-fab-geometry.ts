/**
 * Corner FAB geometry — drag + keyboard nudge (FloatingWindow move parity).
 *
 * Offsets are inset from the host's inline-end / block-end edges (logical),
 * so RTL keeps the FAB in the same visual corner.
 */

export const LEO_FAB_OFFSET_STORAGE_KEY = "shell:leo-launcher-fab:offset"

/** Default inset-inline-end (`end-6` minus shell gutter math in LeoLauncherFab). */
export const LEO_FAB_DEFAULT_END = 24
/** Default inset-block-end (`bottom-4`). */
export const LEO_FAB_DEFAULT_BOTTOM = 16

export const LEO_FAB_SIZE = 56
/** Gap between FAB and the marketing invite card. */
export const LEO_FAB_INVITE_GAP = 12
/** Max invite width (18.5rem). */
export const LEO_FAB_INVITE_MAX_WIDTH = 296
/** Fallback invite height before measure. */
export const LEO_FAB_INVITE_EST_HEIGHT = 72
/** Viewport gutter kept around the invite card. */
export const LEO_FAB_INVITE_GUTTER = 8

/** Matches FloatingWindow fine nudge. */
export const LEO_FAB_NUDGE = 16
/** Matches FloatingWindow Shift nudge. */
export const LEO_FAB_NUDGE_COARSE = 48

export type LeoFabOffset = {
  end: number
  bottom: number
}

export const LEO_FAB_DEFAULT_OFFSET: LeoFabOffset = {
  end: LEO_FAB_DEFAULT_END,
  bottom: LEO_FAB_DEFAULT_BOTTOM,
}

export function clampLeoFabOffset(
  offset: LeoFabOffset,
  host: { width: number; height: number },
): LeoFabOffset {
  const gutter = 8
  const maxEnd = Math.max(gutter, host.width - LEO_FAB_SIZE - gutter)
  const maxBottom = Math.max(gutter, host.height - LEO_FAB_SIZE - gutter)
  return {
    end: Math.round(Math.min(Math.max(offset.end, gutter), maxEnd)),
    bottom: Math.round(Math.min(Math.max(offset.bottom, gutter), maxBottom)),
  }
}

/**
 * Arrow keys nudge the FAB. Shift = coarse. Home resets to the default corner.
 * Returns null when the key is not a nudge chord.
 */
export function leoFabOffsetFromKeyboard(
  offset: LeoFabOffset,
  key: string,
  shiftKey: boolean,
  host: { width: number; height: number },
): LeoFabOffset | null {
  if (key === "Home") {
    return clampLeoFabOffset(LEO_FAB_DEFAULT_OFFSET, host)
  }
  const step = shiftKey ? LEO_FAB_NUDGE_COARSE : LEO_FAB_NUDGE
  // Logical: ArrowRight moves toward inline-start (away from end), so end inset grows.
  const axis: Record<string, Pick<LeoFabOffset, "end" | "bottom">> = {
    ArrowUp: { end: 0, bottom: step },
    ArrowDown: { end: 0, bottom: -step },
    ArrowLeft: { end: step, bottom: 0 },
    ArrowRight: { end: -step, bottom: 0 },
  }
  const delta = axis[key]
  if (!delta) return null
  return clampLeoFabOffset(
    {
      end: offset.end + delta.end,
      bottom: offset.bottom + delta.bottom,
    },
    host,
  )
}

/**
 * Pointer drag delta in viewport pixels → new FAB inset.
 * LTR: drag right shrinks `end`. RTL: drag right grows `end` (inline-end is left).
 * Drag up grows `bottom`.
 */
export function leoFabOffsetFromPointerDelta(
  start: LeoFabOffset,
  dx: number,
  dy: number,
  host: { width: number; height: number },
  rtl: boolean,
): LeoFabOffset {
  return clampLeoFabOffset(
    {
      end: start.end + (rtl ? dx : -dx),
      bottom: start.bottom - dy,
    },
    host,
  )
}

export type LeoFabInvitePlacement = LeoFabOffset & {
  /** When false, the card sits below the FAB (not enough room above). */
  placeAbove: boolean
  /** Resolved card width for the host. */
  width: number
}

/**
 * Keep the suggestion card inside the host. Prefer aligning to the FAB's
 * inline-end and sitting above it; clamp or flip below when near edges.
 */
export function clampLeoFabInvitePlacement(
  fab: LeoFabOffset,
  host: { width: number; height: number },
  invite: { width?: number; height?: number } = {},
): LeoFabInvitePlacement {
  const gutter = LEO_FAB_INVITE_GUTTER
  const width = Math.min(
    invite.width ?? LEO_FAB_INVITE_MAX_WIDTH,
    Math.max(gutter * 2, host.width - gutter * 2),
  )
  const height = invite.height ?? LEO_FAB_INVITE_EST_HEIGHT

  const fabClamped = clampLeoFabOffset(fab, host)
  const maxEnd = Math.max(gutter, host.width - width - gutter)
  const end = Math.round(Math.min(Math.max(fabClamped.end, gutter), maxEnd))

  const aboveBottom = fabClamped.bottom + LEO_FAB_SIZE + LEO_FAB_INVITE_GAP
  const fitsAbove = aboveBottom + height <= host.height - gutter
  if (fitsAbove) {
    return { end, bottom: aboveBottom, placeAbove: true, width }
  }

  const belowBottom = fabClamped.bottom - height - LEO_FAB_INVITE_GAP
  const bottom = Math.round(
    Math.min(
      Math.max(belowBottom, gutter),
      Math.max(gutter, host.height - height - gutter),
    ),
  )
  return { end, bottom, placeAbove: false, width }
}
