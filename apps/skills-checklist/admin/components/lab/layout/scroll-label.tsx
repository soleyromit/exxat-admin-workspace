"use client"

/**
 * Names the scroll viewport of the DS DataTable(s) inside it. The DS DataTable renders its ScrollRegion with the fixed name
 * "Table data" and exposes no prop for it, so two tables on one page give two regions with one name (axe landmark-unique,
 * DS review 2026-10-30 S8). This sets the label on the DS-rendered element; it does not restyle or replace anything, and the
 * wrapper is display: contents so layout is unchanged. Remove when the DS DataTable takes a scrollLabel prop.
 */
import * as React from "react"

export function ScrollLabel({ label, children }: { label: string; children: React.ReactNode }) {
  const ref = React.useRef<HTMLDivElement>(null)
  React.useEffect(() => {
    const el = ref.current
    if (!el) return
    const apply = () => el.querySelectorAll('[data-slot="scroll-region"]').forEach((n) => {
      if (n.getAttribute("aria-label") !== label) n.setAttribute("aria-label", label)
    })
    apply()
    const mo = new MutationObserver(apply)
    mo.observe(el, { childList: true, subtree: true })
    return () => mo.disconnect()
  }, [label])
  return <div ref={ref} className="contents" data-scroll-label={label}>{children}</div>
}
