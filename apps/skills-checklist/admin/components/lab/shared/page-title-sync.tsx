"use client"

/**
 * The browser tab reads the page's own name (Romit 2026-11-09: "change the Design lab title from the tab name to the actual page name"):
 * the page header's h1, kept in step as the page changes. Pages without an h1 keep the layout's title.
 */
import * as React from "react"

const FALLBACK = "Prism Skills Tracking"

export function PageTitleSync() {
  React.useEffect(() => {
    const apply = () => {
      const h1 = document.querySelector("main h1, h1")
      const text = h1?.textContent?.replace(/\s+/g, " ").trim()
      const next = text || FALLBACK
      if (document.title !== next) document.title = next
    }
    apply()
    const observer = new MutationObserver(apply)
    observer.observe(document.body, { childList: true, subtree: true, characterData: true })
    return () => observer.disconnect()
  }, [])
  return null
}
