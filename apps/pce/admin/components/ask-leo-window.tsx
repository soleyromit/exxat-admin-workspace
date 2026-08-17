"use client"

/**
 * AskLeoWindow — Leo as a floating, movable, resizable window.
 *
 * Composes the shared `FloatingWindow` primitive with Ask Leo identity,
 * toolbar, and thread body. Geometry helpers live in `lib/ask-leo-view.ts`
 * (aliases of `@exxatdesignux/ui` floating-window maths).
 *
 * @see components/ui/floating-window.tsx — shared chrome + gestures
 * @see components/ask-leo-sidebar.tsx — the docked shell
 */

import * as React from "react"

import { AskLeoShortcutKbds, useAskLeo } from "@/components/ask-leo-context"
import { Button } from "@/components/ui/button"
import {
  AskLeoIdentity,
  AskLeoNewChatButton,
  AskLeoThreadBody,
} from "@/components/ask-leo-thread-body"
import { AskLeoViewToggle } from "@/components/ask-leo-view-toggle"
import { useLeoAmbience } from "@/components/leo-ambience-context"
import {
  FloatingWindow,
  type FloatingWindowRect,
} from "@/components/ui/floating-window"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  ASK_LEO_WINDOW_RECT_KEY,
  defaultAskLeoWindowRect,
} from "@/lib/ask-leo-view"
import { focusAskLeoLauncher, focusAskLeoSurface } from "@/lib/ask-leo-focus"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"

export function AskLeoWindow() {
  const { setOpen, setMinimized, minimized } = useAskLeo()
  const { setSettingsOpen } = useLeoAmbience()
  const [storedRect, setStoredRect] = usePersistedState<FloatingWindowRect | null>(
    ASK_LEO_WINDOW_RECT_KEY,
    null,
  )

  const resetRect = React.useCallback(() => {
    setStoredRect(
      defaultAskLeoWindowRect({
        width: typeof window !== "undefined" ? window.innerWidth : 1280,
        height: typeof window !== "undefined" ? window.innerHeight : 800,
      }),
    )
  }, [setStoredRect])

  const close = React.useCallback(() => {
    setOpen(false)
    focusAskLeoLauncher()
  }, [setOpen])

  const minimize = React.useCallback(() => {
    setMinimized(true)
    focusAskLeoLauncher()
  }, [setMinimized])

  // Pointer shortcut for the header. The keyboard route is Appearance in
  // `AskLeoViewToggle`.
  const openAmbienceSettings = React.useCallback(() => {
    setSettingsOpen(true)
  }, [setSettingsOpen])

  const wasMinimizedRef = React.useRef(minimized)
  React.useEffect(() => {
    const wasMinimized = wasMinimizedRef.current
    wasMinimizedRef.current = minimized
    if (minimized || !wasMinimized) return
    focusAskLeoSurface()
  }, [minimized])

  return (
    <FloatingWindow
      hidden={minimized}
      rect={storedRect}
      onRectChange={setStoredRect}
      defaultRect={defaultAskLeoWindowRect}
      aria-label="Ask Leo, AI assistant"
      dataSlot="ask-leo-window"
      gripAriaLabel="Move Ask Leo window to the next corner. Arrow keys move it, Alt with arrow keys resizes it."
      onEscape={close}
      style={
        {
          "--leo-thread-surface": "var(--background)",
        } as React.CSSProperties
      }
      title={<AskLeoIdentity />}
      onTitleDoubleClick={openAmbienceSettings}
      toolbar={
        <>
          <AskLeoNewChatButton />
          <AskLeoViewToggle onResetWindow={resetRect} />
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={minimize}
                className="icon-button-chrome size-8 hover:bg-sidebar-accent"
                aria-label="Minimize Ask Leo"
              >
                <i className="fa-light fa-minus text-xs" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="bottom" className="max-w-xs text-xs">
              Minimize. Keeps this conversation.
            </TooltipContent>
          </Tooltip>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                onClick={close}
                className="icon-button-chrome size-8 hover:bg-sidebar-accent"
                aria-label="Close Ask Leo"
              >
                <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
              </Button>
            </TooltipTrigger>
            <TooltipContent
              side="bottom"
              className="flex max-w-xs flex-wrap items-center gap-1.5 text-xs"
            >
              <span>Close Ask Leo</span>
              <AskLeoShortcutKbds />
            </TooltipContent>
          </Tooltip>
        </>
      }
    >
      <AskLeoThreadBody />
    </FloatingWindow>
  )
}
