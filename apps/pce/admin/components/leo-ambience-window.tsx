"use client"

/**
 * Leo ambience settings — floating window via shared `FloatingWindow`.
 * Apply-on-change; prefs live in `LeoAmbienceProvider`.
 * Free-drag (no corner snap). Tabs: Ask Leo panel | Leo search bar | Motion.
 */

import * as React from "react"

import { useLeoAmbience } from "@/components/leo-ambience-context"
import { Button } from "@/components/ui/button"
import {
  FloatingWindow,
  defaultFloatingWindowRect,
  type FloatingWindowRect,
  type FloatingWindowViewport,
} from "@/components/ui/floating-window"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsListScrollRegion,
  TabsTrigger,
  TabsTriggerIcon,
  TabsTriggerLabel,
} from "@/components/ui/tabs"
import { ToggleSwitch } from "@/components/ui/toggle-switch"
import {
  ToggleGroup,
  ToggleGroupItem,
} from "@/components/ui/toggle-group"
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip"
import {
  LEO_AMBIENCE_DEFAULTS,
  LEO_AMBIENCE_WINDOW_RECT_KEY,
  LEO_SEARCH_BAR_OFFSET_MAX,
  clampSearchBarOffset,
  type LeoBlobAnimationSpeed,
  type LeoBlobIntensity,
  type LeoComposerVeil,
  type LeoSearchBarWashMode,
  type LeoThinkingAnimationStyle,
} from "@/lib/leo-ambience"
import { usePersistedState } from "@exxatdesignux/ui/lib/persisted-state"
import { cn } from "@/lib/utils"

const SETTINGS_DEFAULT_WIDTH = 380
const SETTINGS_DEFAULT_HEIGHT = 640

function defaultSettingsRect(viewport: FloatingWindowViewport): FloatingWindowRect {
  return defaultFloatingWindowRect(viewport, {
    width: SETTINGS_DEFAULT_WIDTH,
    height: SETTINGS_DEFAULT_HEIGHT,
    anchor: "center-right",
  })
}

function SettingRow({
  label,
  htmlFor,
  children,
}: {
  label: string
  htmlFor?: string
  children: React.ReactNode
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border/60 py-3 last:border-b-0">
      <Label htmlFor={htmlFor} className="text-sm font-medium text-foreground">
        {label}
      </Label>
      <div className="shrink-0">{children}</div>
    </div>
  )
}

/** Free 2D offset pad — no snap; maps pointer to ±LEO_SEARCH_BAR_OFFSET_MAX. */
function SearchBarOffsetPad({
  offsetX,
  offsetY,
  disabled,
  onChange,
}: {
  offsetX: number
  offsetY: number
  disabled?: boolean
  onChange: (x: number, y: number) => void
}) {
  const padRef = React.useRef<HTMLDivElement>(null)
  const draggingRef = React.useRef(false)

  const applyFromClient = React.useCallback(
    (clientX: number, clientY: number) => {
      const el = padRef.current
      if (!el) return
      const rect = el.getBoundingClientRect()
      const nx = (clientX - rect.left) / rect.width
      const ny = (clientY - rect.top) / rect.height
      const x = clampSearchBarOffset((nx * 2 - 1) * LEO_SEARCH_BAR_OFFSET_MAX)
      const y = clampSearchBarOffset((ny * 2 - 1) * LEO_SEARCH_BAR_OFFSET_MAX)
      onChange(x, y)
    },
    [onChange],
  )

  const onPointerDown = (event: React.PointerEvent) => {
    if (disabled || event.button !== 0) return
    event.preventDefault()
    event.stopPropagation()
    draggingRef.current = true
    event.currentTarget.setPointerCapture(event.pointerId)
    applyFromClient(event.clientX, event.clientY)
  }

  const onPointerMove = (event: React.PointerEvent) => {
    if (!draggingRef.current) return
    event.stopPropagation()
    applyFromClient(event.clientX, event.clientY)
  }

  const endDrag = (event: React.PointerEvent) => {
    if (!draggingRef.current) return
    draggingRef.current = false
    try {
      event.currentTarget.releasePointerCapture(event.pointerId)
    } catch {
      /* already released */
    }
  }

  const leftPct = ((offsetX / LEO_SEARCH_BAR_OFFSET_MAX + 1) / 2) * 100
  const topPct = ((offsetY / LEO_SEARCH_BAR_OFFSET_MAX + 1) / 2) * 100

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border-b border-border/60 py-3",
        disabled && "opacity-50",
      )}
    >
      <div className="flex items-center justify-between gap-2">
        <Label className="text-sm font-medium">Placement</Label>
        <Button
          type="button"
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-xs"
          disabled={disabled || (offsetX === 0 && offsetY === 0)}
          onClick={() => onChange(0, 0)}
        >
          Center
        </Button>
      </div>
      <div
        ref={padRef}
        role="slider"
        tabIndex={disabled ? -1 : 0}
        aria-label="Search bar wash placement"
        aria-valuemin={-LEO_SEARCH_BAR_OFFSET_MAX}
        aria-valuemax={LEO_SEARCH_BAR_OFFSET_MAX}
        aria-valuenow={offsetX}
        aria-valuetext={`${offsetX}px horizontal, ${offsetY}px vertical`}
        aria-disabled={disabled || undefined}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={endDrag}
        onPointerCancel={endDrag}
        onKeyDown={(event) => {
          if (disabled) return
          const step = event.shiftKey ? 12 : 4
          let x = offsetX
          let y = offsetY
          if (event.key === "ArrowLeft") x -= step
          else if (event.key === "ArrowRight") x += step
          else if (event.key === "ArrowUp") y -= step
          else if (event.key === "ArrowDown") y += step
          else return
          event.preventDefault()
          onChange(clampSearchBarOffset(x), clampSearchBarOffset(y))
        }}
        className={cn(
          "relative aspect-square w-full touch-none rounded-xl border border-border bg-muted/40",
          disabled ? "cursor-not-allowed" : "cursor-crosshair",
        )}
      >
        <div
          className="pointer-events-none absolute inset-[18%] rounded-full border border-dashed border-border/80"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-1/2 top-0 h-full w-px -translate-x-1/2 bg-border/70"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute left-0 top-1/2 h-px w-full -translate-y-1/2 bg-border/70"
          aria-hidden
        />
        <div
          className="pointer-events-none absolute size-3.5 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-background bg-brand shadow-sm"
          style={{ left: `${leftPct}%`, top: `${topPct}%` }}
          aria-hidden
        />
      </div>
      <div className="flex justify-between text-[0.7rem] tabular-nums text-muted-foreground">
        <span>
          X {offsetX > 0 ? "+" : ""}
          {offsetX}px
        </span>
        <span>
          Y {offsetY > 0 ? "+" : ""}
          {offsetY}px
        </span>
      </div>
    </div>
  )
}

/** Icons so the row can shed labels before it sheds whole tabs — this window is resizable to nothing. */
const AMBIENCE_TABS = [
  { value: "panel", label: "Ask Leo panel", icon: "fa-sidebar-flip" },
  { value: "search", label: "Leo search bar", icon: "fa-magnifying-glass" },
  { value: "motion", label: "Motion", icon: "fa-waveform-lines" },
] as const

function AmbienceSettingsForm() {
  const {
    prefs,
    patchPrefs,
    resetPrefs,
    previewThinking,
    setPreviewThinking,
  } = useLeoAmbience()

  const washEnabled = prefs.thinkingBlob
  const isPulse = prefs.thinkingAnimationStyle === "pulse"

  return (
    <Tabs
      defaultValue="panel"
      className="flex min-h-0 flex-1 flex-col gap-0 overflow-hidden px-4 pb-4"
    >
      {/* Floating window the user can resize down to nothing. */}
      <TabsListScrollRegion ariaLabel="Ambience settings" className="shrink-0">
        <TabsList variant="line" className="w-full shrink-0 justify-start">
          {AMBIENCE_TABS.map(tab => (
            <TabsTrigger key={tab.value} value={tab.value}>
              <TabsTriggerIcon>
                <i className={cn("fa-light", tab.icon)} aria-hidden="true" />
              </TabsTriggerIcon>
              <TabsTriggerLabel>{tab.label}</TabsTriggerLabel>
            </TabsTrigger>
          ))}
        </TabsList>
      </TabsListScrollRegion>

      <TabsContent
        value="panel"
        className="mt-0 min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <SettingRow label="Idle dots" htmlFor="leo-idle-dots">
          <ToggleSwitch
            id="leo-idle-dots"
            checked={prefs.idleDots}
            onChange={(idleDots) => patchPrefs({ idleDots })}
          />
        </SettingRow>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !prefs.idleDots && "opacity-50",
          )}
        >
          <Label htmlFor="leo-idle-density" className="text-sm font-medium">
            Dot density
          </Label>
          <Slider
            id="leo-idle-density"
            min={0.5}
            max={3}
            step={0.05}
            value={[prefs.idleDensity]}
            disabled={!prefs.idleDots}
            aria-label="Idle dot density"
            onValueChange={(v) => patchPrefs({ idleDensity: v[0] ?? prefs.idleDensity })}
          />
          <div className="flex justify-between text-[0.7rem] text-muted-foreground">
            <span>Sparse</span>
            <span className="tabular-nums">{prefs.idleDensity.toFixed(2)}</span>
            <span>Dense</span>
          </div>
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !prefs.idleDots && "opacity-50",
          )}
        >
          <Label htmlFor="leo-idle-glow" className="text-sm font-medium">
            Spotlight size
          </Label>
          <Slider
            id="leo-idle-glow"
            min={80}
            max={320}
            step={8}
            value={[prefs.idleGlowRadius]}
            disabled={!prefs.idleDots}
            aria-label="Idle spotlight radius"
            onValueChange={(v) =>
              patchPrefs({ idleGlowRadius: v[0] ?? prefs.idleGlowRadius })
            }
          />
          <div className="flex justify-between text-[0.7rem] text-muted-foreground">
            <span>Tight</span>
            <span className="tabular-nums">{prefs.idleGlowRadius}px</span>
            <span>Wide</span>
          </div>
        </div>

        <SettingRow label="Thinking wash" htmlFor="leo-thinking-blob">
          <ToggleSwitch
            id="leo-thinking-blob"
            checked={prefs.thinkingBlob}
            onChange={(thinkingBlob) => patchPrefs({ thinkingBlob })}
          />
        </SettingRow>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !washEnabled && "opacity-50",
          )}
        >
          <Label className="text-sm font-medium">Thinking style</Label>
          <ToggleGroup
            type="single"
            value={prefs.thinkingAnimationStyle}
            disabled={!washEnabled}
            onValueChange={(v) => {
              if (!v) return
              patchPrefs({
                thinkingAnimationStyle: v as LeoThinkingAnimationStyle,
              })
            }}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="blobs" aria-label="Blob wash thinking">
              Blobs
            </ToggleGroupItem>
            <ToggleGroupItem value="pulse" aria-label="Pulse border thinking">
              Pulse
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !washEnabled && "opacity-50",
          )}
        >
          <Label htmlFor="leo-blob-opacity" className="text-sm font-medium">
            {isPulse ? "Pulse strength" : "Wash opacity"}
          </Label>
          <Slider
            id="leo-blob-opacity"
            min={0.05}
            max={1}
            step={0.01}
            value={[prefs.thinkingBlobOpacity]}
            disabled={!washEnabled}
            aria-label={isPulse ? "Pulse strength" : "Thinking wash opacity"}
            onValueChange={(v) =>
              patchPrefs({
                thinkingBlobOpacity: v[0] ?? prefs.thinkingBlobOpacity,
              })
            }
          />
          <div className="flex justify-between text-[0.7rem] text-muted-foreground">
            <span>Faint</span>
            <span className="tabular-nums">
              {Math.round(prefs.thinkingBlobOpacity * 100)}%
            </span>
            <span>Strong</span>
          </div>
        </div>

        {!isPulse ? (
          <div
            className={cn(
              "flex flex-col gap-2 border-b border-border/60 py-3",
              !washEnabled && "opacity-50",
            )}
          >
            <Label className="text-sm font-medium">Blob intensity</Label>
            <ToggleGroup
              type="single"
              value={prefs.thinkingBlobIntensity}
              disabled={!washEnabled}
              onValueChange={(v) => {
                if (!v) return
                patchPrefs({ thinkingBlobIntensity: v as LeoBlobIntensity })
              }}
              variant="outline"
              size="sm"
              className="justify-start"
            >
              <ToggleGroupItem value="low" aria-label="Low intensity">
                Low
              </ToggleGroupItem>
              <ToggleGroupItem value="normal" aria-label="Normal intensity">
                Normal
              </ToggleGroupItem>
              <ToggleGroupItem value="high" aria-label="High intensity">
                High
              </ToggleGroupItem>
            </ToggleGroup>
          </div>
        ) : null}

        <SettingRow label="Thinking cursor dots" htmlFor="leo-thinking-dots">
          <ToggleSwitch
            id="leo-thinking-dots"
            checked={prefs.thinkingOverlayDots}
            onChange={(thinkingOverlayDots) => patchPrefs({ thinkingOverlayDots })}
          />
        </SettingRow>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !prefs.thinkingOverlayDots && "opacity-50",
          )}
        >
          <Label htmlFor="leo-thinking-dots-opacity" className="text-sm font-medium">
            Thinking dot opacity
          </Label>
          <Slider
            id="leo-thinking-dots-opacity"
            min={0.05}
            max={1}
            step={0.01}
            value={[prefs.thinkingOverlayDotsOpacity]}
            disabled={!prefs.thinkingOverlayDots}
            aria-label="Thinking overlay dot opacity"
            onValueChange={(v) =>
              patchPrefs({
                thinkingOverlayDotsOpacity:
                  v[0] ?? prefs.thinkingOverlayDotsOpacity,
              })
            }
          />
          <div className="flex justify-between text-[0.7rem] text-muted-foreground">
            <span>Faint</span>
            <span className="tabular-nums">
              {Math.round(prefs.thinkingOverlayDotsOpacity * 100)}%
            </span>
            <span>Strong</span>
          </div>
        </div>

        <div className="flex flex-col gap-2 border-b border-border/60 py-3">
          <Label className="text-sm font-medium">Composer veil</Label>
          <ToggleGroup
            type="single"
            value={prefs.composerVeil}
            onValueChange={(v) => {
              if (!v) return
              patchPrefs({ composerVeil: v as LeoComposerVeil })
            }}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="off" aria-label="Veil off">
              Off
            </ToggleGroupItem>
            <ToggleGroupItem value="soft" aria-label="Soft veil">
              Soft
            </ToggleGroupItem>
            <ToggleGroupItem value="strong" aria-label="Strong veil">
              Strong
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
      </TabsContent>

      <TabsContent
        value="search"
        className="mt-0 min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <SettingRow label="Search bar wash" htmlFor="leo-search-bar-wash">
          <ToggleSwitch
            id="leo-search-bar-wash"
            checked={prefs.searchBarWash}
            onChange={(searchBarWash) => patchPrefs({ searchBarWash })}
          />
        </SettingRow>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !prefs.searchBarWash && "opacity-50",
          )}
        >
          <Label className="text-sm font-medium">Wash mode</Label>
          <ToggleGroup
            type="single"
            value={prefs.searchBarWashMode}
            disabled={!prefs.searchBarWash}
            onValueChange={(v) => {
              if (!v) return
              patchPrefs({ searchBarWashMode: v as LeoSearchBarWashMode })
            }}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="inside" aria-label="Wash inside the pill">
              Inside
            </ToggleGroupItem>
            <ToggleGroupItem value="outside" aria-label="Wash outside the pill">
              Outside
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <SearchBarOffsetPad
          offsetX={prefs.searchBarOffsetX}
          offsetY={prefs.searchBarOffsetY}
          disabled={!prefs.searchBarWash}
          onChange={(searchBarOffsetX, searchBarOffsetY) =>
            patchPrefs({ searchBarOffsetX, searchBarOffsetY })
          }
        />

        <div className={cn(!prefs.searchBarWash && "pointer-events-none opacity-50")}>
          <SettingRow label="Search bar sheen" htmlFor="leo-search-bar-sheen">
            <ToggleSwitch
              id="leo-search-bar-sheen"
              checked={prefs.searchBarSheen}
              onChange={(searchBarSheen) => {
                if (!prefs.searchBarWash) return
                patchPrefs({ searchBarSheen })
              }}
            />
          </SettingRow>
        </div>

        <div className={cn(!prefs.searchBarWash && "pointer-events-none opacity-50")}>
          <SettingRow label="Search bar dots" htmlFor="leo-search-bar-dots">
            <ToggleSwitch
              id="leo-search-bar-dots"
              checked={prefs.searchBarDots}
              onChange={(searchBarDots) => {
                if (!prefs.searchBarWash) return
                patchPrefs({ searchBarDots })
              }}
            />
          </SettingRow>
        </div>

        <p className="py-3 text-[0.7rem] text-muted-foreground">
          Double-click the Leo search bar to open this window. Preview thinking
          on the Motion tab shows the wash while you tune placement.
        </p>
      </TabsContent>

      <TabsContent
        value="motion"
        className="mt-0 min-h-0 flex-1 overflow-y-auto focus-visible:outline-none"
      >
        <SettingRow label="Preview thinking" htmlFor="leo-preview-thinking">
          <ToggleSwitch
            id="leo-preview-thinking"
            checked={previewThinking}
            onChange={setPreviewThinking}
          />
        </SettingRow>

        <SettingRow label="Animations" htmlFor="leo-blob-animations">
          <ToggleSwitch
            id="leo-blob-animations"
            checked={prefs.blobAnimations}
            onChange={(blobAnimations) => patchPrefs({ blobAnimations })}
          />
        </SettingRow>

        <div
          className={cn(
            "flex flex-col gap-2 border-b border-border/60 py-3",
            !prefs.blobAnimations && "opacity-50",
          )}
        >
          <Label className="text-sm font-medium">Animation speed</Label>
          <ToggleGroup
            type="single"
            value={prefs.blobAnimationSpeed}
            disabled={!prefs.blobAnimations}
            onValueChange={(v) => {
              if (!v) return
              patchPrefs({ blobAnimationSpeed: v as LeoBlobAnimationSpeed })
            }}
            variant="outline"
            size="sm"
            className="justify-start"
          >
            <ToggleGroupItem value="slow" aria-label="Slow animation">
              Slow
            </ToggleGroupItem>
            <ToggleGroupItem value="normal" aria-label="Normal animation">
              Normal
            </ToggleGroupItem>
            <ToggleGroupItem value="fast" aria-label="Fast animation">
              Fast
            </ToggleGroupItem>
          </ToggleGroup>
        </div>

        <p className="border-b border-border/60 py-3 text-[0.7rem] text-muted-foreground">
          Speed drives blob drift, pulse breathe, and thinking cursor waves.
          Search bar wash uses the same speed. Thinking style lives on Ask Leo
          panel; search bar stays on bar blobs.
        </p>

        <div className="pt-3">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="w-full"
            onClick={resetPrefs}
          >
            Reset to defaults
          </Button>
          <p className="mt-2 text-center text-[0.7rem] text-muted-foreground">
            Defaults: {LEO_AMBIENCE_DEFAULTS.thinkingAnimationStyle}, density{" "}
            {LEO_AMBIENCE_DEFAULTS.idleDensity}, wash{" "}
            {Math.round(LEO_AMBIENCE_DEFAULTS.thinkingBlobOpacity * 100)}%,{" "}
            {LEO_AMBIENCE_DEFAULTS.blobAnimationSpeed}
          </p>
        </div>
      </TabsContent>
    </Tabs>
  )
}

export function LeoAmbienceWindow() {
  const { settingsOpen, setSettingsOpen } = useLeoAmbience()
  const [storedRect, setStoredRect] = usePersistedState<FloatingWindowRect | null>(
    LEO_AMBIENCE_WINDOW_RECT_KEY,
    null,
  )

  const close = React.useCallback(() => setSettingsOpen(false), [setSettingsOpen])

  return (
    <FloatingWindow
      open={settingsOpen}
      rect={storedRect}
      onRectChange={setStoredRect}
      defaultRect={defaultSettingsRect}
      aria-label="Leo appearance settings"
      dataSlot="leo-ambience-window"
      className="bg-background/90"
      cornerSnap={false}
      gripAriaLabel="Drag to move settings. Arrow keys nudge, Alt with arrow keys resizes."
      gripTooltip="Drag to move · arrows nudge · Alt + arrows resize"
      onEscape={close}
      title={
        <h2 className="font-heading m-0 truncate text-base font-semibold leading-tight tracking-tight text-foreground">
          Leo appearance
        </h2>
      }
      toolbar={
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="button"
              variant="ghost"
              size="icon-sm"
              onClick={close}
              className="icon-button-chrome size-8 hover:bg-sidebar-accent"
              aria-label="Close Leo appearance settings"
            >
              <i className="fa-light fa-xmark text-xs" aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent side="bottom" className="text-xs">
            Close
          </TooltipContent>
        </Tooltip>
      }
    >
      <AmbienceSettingsForm />
    </FloatingWindow>
  )
}

/*
 * There is deliberately no header gear here. Appearance is reached by
 * double-clicking an Ask Leo header, or by the Appearance item in
 * `AskLeoViewToggle` (the keyboard route). A third entry point in the header
 * would spend a toolbar slot on a preference the reader opens once.
 */