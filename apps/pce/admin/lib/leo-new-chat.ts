"use client"

/**
 * "New chat" for Leo — one event, every shell.
 *
 * Thread state deliberately lives inside whichever shell owns the conversation
 * (`AskLeoThreadBody` for the panel and window, `LeoLandingClient` for full
 * screen), so a header button cannot call `reset()` directly. A DOM event is the
 * cheap way across that boundary: the shell that is mounted hears it, and the
 * ones that are not have nothing to clear anyway.
 *
 * Lifted out of `leo-landing-client.tsx` when the panel and window grew their
 * own New chat buttons — importing it from there pulled the whole landing canvas
 * into the app-shell chunk.
 *
 * @see components/ask-leo-thread-body.tsx — panel + window listener
 * @see components/leo-landing-client.tsx — full-screen listener
 */

import * as React from "react"

const LEO_NEW_CHAT_EVENT = "exxat:leo:new-chat"

export function dispatchLeoNewChat() {
  if (typeof window === "undefined") return
  window.dispatchEvent(new CustomEvent(LEO_NEW_CHAT_EVENT))
}

/**
 * Run `onNewChat` whenever something asks for a fresh thread. The handler is
 * held in a ref so a shell can pass an inline closure without re-subscribing on
 * every keystroke in its composer.
 */
export function useLeoNewChat(onNewChat: () => void) {
  const handlerRef = React.useRef(onNewChat)
  React.useEffect(() => {
    handlerRef.current = onNewChat
  })

  React.useEffect(() => {
    const listener = () => handlerRef.current()
    window.addEventListener(LEO_NEW_CHAT_EVENT, listener)
    return () => window.removeEventListener(LEO_NEW_CHAT_EVENT, listener)
  }, [])
}
