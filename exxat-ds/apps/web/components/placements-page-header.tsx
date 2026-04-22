"use client"

import * as React from "react"
import { Button } from "@/components/ui/button"
import { Kbd, KbdGroup } from "@/components/ui/kbd"
import { PageHeader } from "@/components/page-header"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  Shortcut,
} from "@/components/ui/dropdown-menu"
import { Tip } from "@/components/ui/tip"
import { useAltKeyLabel, useModKeyLabel } from "@/hooks/use-mod-key-label"
import { isEditableTarget } from "@/lib/editable-target"

export interface PlacementsPageHeaderProps {
  /** Shown under the page title */
  subtitle?: string
  onNewPlacement: () => void
  onExport: () => void
  showMetrics: boolean
  onToggleMetrics: () => void
  /** When false, “Placements” + subtitle are hidden visually (Display options). */
  showTitleBlock?: boolean
  className?: string
}

/**
 * Placements list shell header — title, primary CTA, overflow menu (export, metrics).
 * Reusable for any placements route that needs the same chrome.
 */
export function PlacementsPageHeader({
  subtitle = "24 records · Last updated now",
  onNewPlacement,
  onExport,
  showMetrics,
  onToggleMetrics,
  showTitleBlock = true,
  className,
}: PlacementsPageHeaderProps) {
  const mod = useModKeyLabel()
  const alt = useAltKeyLabel()
  const [moreOpen, setMoreOpen] = React.useState(false)

  /** ⌘⌥N / Ctrl+Alt+N — avoids ⌘⇧N / Ctrl+Shift+N (private/incognito windows). */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || (!e.metaKey && !e.ctrlKey)) return
      if (e.key.toLowerCase() !== "n") return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      onNewPlacement()
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [onNewPlacement])

  /** ⌘⌥M / Ctrl+Alt+M — avoids ⌘⇧O / Ctrl+Shift+O (bookmark manager in Chromium). */
  React.useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (!e.altKey || (!e.metaKey && !e.ctrlKey)) return
      if (e.key.toLowerCase() !== "m") return
      if (isEditableTarget(e.target)) return
      e.preventDefault()
      setMoreOpen(o => !o)
    }
    document.addEventListener("keydown", onKey)
    return () => document.removeEventListener("keydown", onKey)
  }, [])

  return (
    <>
      <Shortcut keys="⌘⇧E" onInvoke={onExport} />
      <Shortcut keys="⌘⌥H" onInvoke={onToggleMetrics} />
    <PageHeader
      title="Placements"
      subtitle={subtitle}
      className={className}
      showTitleBlock={showTitleBlock}
      actions={
        <div className="flex items-center gap-2" role="group" aria-label="Placement actions">
          <Tip
            side="bottom"
            label={
              <>
                <span>New placement</span>
                <KbdGroup>
                  <Kbd>{mod}</Kbd>
                  <Kbd>{alt}</Kbd>
                  <Kbd>N</Kbd>
                </KbdGroup>
              </>
            }
          >
            <Button size="lg" onClick={onNewPlacement}>
              <i className="fa-light fa-plus" aria-hidden="true" />
              New placement
            </Button>
          </Tip>
          <DropdownMenu open={moreOpen} onOpenChange={setMoreOpen}>
            <Tip
              side="bottom"
              label={
                <>
                  <span>More actions</span>
                  <KbdGroup>
                    <Kbd>{mod}</Kbd>
                    <Kbd>{alt}</Kbd>
                    <Kbd>M</Kbd>
                  </KbdGroup>
                </>
              }
            >
              <DropdownMenuTrigger asChild>
                <Button
                  size="lg"
                  variant="outline"
                  className="aspect-square px-0"
                  aria-label="More actions"
                >
                  <i className="fa-light fa-ellipsis text-base" aria-hidden="true" />
                </Button>
              </DropdownMenuTrigger>
            </Tip>
            <DropdownMenuContent align="end" className="w-52">
              <DropdownMenuItem shortcut="⌘⇧E" onSelect={onExport}>
                <i className="fa-light fa-arrow-down-to-line" aria-hidden="true" />
                Export
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem shortcut="⌘⌥H" onSelect={onToggleMetrics}>
                <i
                  className={`fa-light ${showMetrics ? "fa-eye-slash" : "fa-eye"}`}
                  aria-hidden="true"
                />
                {showMetrics ? "Hide metric section" : "Show metric section"}
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      }
    />
    </>
  )
}

