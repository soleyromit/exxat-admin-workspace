"use client"

export { getPageScrollElement, bindVerticalScrollListeners as bindPageScrollListeners } from "@exxatdesignux/ui/lib/page-scroll-port"

import * as React from "react"
import { getPageScrollElement } from "@exxatdesignux/ui/lib/page-scroll-port"

/** True when the page scrollport has scrolled — drives `SiteHeader` elevation. */
export function useScrollStuck(): boolean {
  const [isStuck, setIsStuck] = React.useState(false)

  React.useEffect(() => {
    const read = () => {
      const scrollRoot = getPageScrollElement()
      setIsStuck(window.scrollY > 0 || (scrollRoot?.scrollTop ?? 0) > 0)
    }

    read()
    window.addEventListener("scroll", read, { passive: true })
    window.addEventListener("resize", read, { passive: true })

    const scrollRoot = getPageScrollElement()
    scrollRoot?.addEventListener("scroll", read, { passive: true })

    return () => {
      window.removeEventListener("scroll", read)
      window.removeEventListener("resize", read)
      scrollRoot?.removeEventListener("scroll", read)
    }
  }, [])

  return isStuck
}
