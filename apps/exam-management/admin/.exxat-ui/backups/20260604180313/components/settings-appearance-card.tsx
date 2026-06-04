"use client"

import * as React from "react"
import { useTheme } from "next-themes"
import {
  FieldGroup,
  SelectionTileGrid,
  useAppTheme,
  type Brand,
  type TextSizePreference,
} from "@exxatdesignux/ui"
import type { SelectionTileOption } from "@exxatdesignux/ui"
import { SettingsFormRow } from "@/components/settings-form-row"
import { cn } from "@/lib/utils"

// Vendored from @exxatdesignux/ui — vendored from DS web app: settings-appearance-card.tsx
// (2026-05-12). Slimmed: dropped Dashboard layout + Chart style sections
// (those depend on product-shell-specific contexts; can be added per product
// when needed). Kept: Theme (light/dark/system), Contrast (system/normal/high),
// Text size (compact/default/large), Brand (one/prism).

/** Illustrative split sidebars when "system" shows light+dark (tokens follow active brand hue). */
const SPLIT_SIDEBAR: Record<Brand, { light: string; dark: string }> = {
  one: { light: "oklch(0.935 0.024 286.1)", dark: "oklch(0.38 0.09 286.1)" },
  prism: { light: "oklch(0.96 0.04 342)", dark: "oklch(0.4 0.14 342)" },
}

const THEME_SVG_CLASS = "h-12 w-auto max-w-[9rem] shrink-0"

const CHROME_LIGHT = {
  shell: "oklch(1 0 0)",
  shellStroke: "oklch(0.90 0.003 270)",
  headerBar: "oklch(0.93 0.004 270)",
  content: "oklch(0.96 0.004 270)",
} as const

const CHROME_DARK = {
  shell: "oklch(0.12 0.01 270)",
  shellStroke: "oklch(0.38 0.02 270)",
  headerBar: "oklch(0.22 0.02 270)",
  content: "oklch(0.17 0.015 270)",
} as const

const HC_STROKE = "oklch(0.18 0 0)"

function ThemeModeSvg({ mode, brand }: { mode: "system" | "light" | "dark"; brand: Brand }) {
  const split = SPLIT_SIDEBAR[brand]
  if (mode === "light") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.light} />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill={CHROME_LIGHT.headerBar} />
        <rect x="19" y="14" width="34" height="14" rx="2" fill={CHROME_LIGHT.content} />
      </svg>
    )
  }
  if (mode === "dark") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_DARK.shell} stroke={CHROME_DARK.shellStroke} />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.dark} />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill={CHROME_DARK.headerBar} />
        <rect x="19" y="14" width="34" height="14" rx="2" fill={CHROME_DARK.content} />
      </svg>
    )
  }
  // system — split: left half light, right half dark
  return (
    <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="26" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} />
      <rect x="3" y="3" width="10" height="26" rx="1.5" fill={split.light} />
      <rect x="15" y="6" width="10" height="4" rx="0.75" fill={CHROME_LIGHT.headerBar} />
      <rect x="15" y="13" width="10" height="14" rx="1.5" fill={CHROME_LIGHT.content} />
      <rect x="28.5" y="0.5" width="27" height="31" rx="4" fill={CHROME_DARK.shell} stroke={CHROME_DARK.shellStroke} />
      <rect x="31" y="3" width="10" height="26" rx="1.5" fill={split.dark} />
      <rect x="43" y="6" width="10" height="4" rx="0.75" fill={CHROME_DARK.headerBar} />
      <rect x="43" y="13" width="10" height="14" rx="1.5" fill={CHROME_DARK.content} />
    </svg>
  )
}

function ContrastPrefSvg({ pref, brand }: { pref: "system" | "normal" | "high"; brand: Brand }) {
  const split = SPLIT_SIDEBAR[brand]
  if (pref === "normal") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} strokeWidth="1" />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.light} />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill={CHROME_LIGHT.headerBar} />
        <rect x="19" y="14" width="34" height="14" rx="2" fill={CHROME_LIGHT.content} />
      </svg>
    )
  }
  if (pref === "high") {
    return (
      <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
        <rect x="0.5" y="0.5" width="55" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={HC_STROKE} strokeWidth="2" />
        <rect x="3" y="3" width="13" height="26" rx="2" fill={split.light} stroke={HC_STROKE} strokeWidth="1.5" />
        <rect x="19" y="6" width="34" height="4.5" rx="1" fill="oklch(0.35 0.02 270)" opacity="0.35" />
        <rect x="19" y="14" width="34" height="14" rx="2" fill="oklch(0.35 0.02 270)" opacity="0.22" />
      </svg>
    )
  }
  return (
    <svg className={THEME_SVG_CLASS} viewBox="0 0 56 32" fill="none" aria-hidden="true">
      <rect x="0.5" y="0.5" width="26" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={CHROME_LIGHT.shellStroke} strokeWidth="1" />
      <rect x="3" y="3" width="10" height="26" rx="1.5" fill={split.light} />
      <rect x="15" y="6" width="10" height="4" rx="0.75" fill={CHROME_LIGHT.headerBar} />
      <rect x="15" y="13" width="10" height="14" rx="1.5" fill={CHROME_LIGHT.content} />
      <rect x="28.5" y="0.5" width="27" height="31" rx="4" fill={CHROME_LIGHT.shell} stroke={HC_STROKE} strokeWidth="2" />
      <rect x="31" y="3" width="10" height="26" rx="1.5" fill={split.light} stroke={HC_STROKE} strokeWidth="1.5" />
      <rect x="43" y="6" width="10" height="4" rx="0.75" fill="oklch(0.35 0.02 270)" opacity="0.35" />
      <rect x="43" y="13" width="10" height="14" rx="1.5" fill="oklch(0.35 0.02 270)" opacity="0.22" />
    </svg>
  )
}

const BRAND_TILES: readonly SelectionTileOption<"one" | "prism">[] = [
  {
    value: "one",
    label: "One",
    leading: (
      <span
        className="size-10 shrink-0 rounded-full bg-[var(--brand-preview-one)] ring-1 ring-inset ring-border/60"
        aria-hidden="true"
      />
    ),
  },
  {
    value: "prism",
    label: "Prism",
    leading: (
      <span
        className="size-10 shrink-0 rounded-full bg-[var(--brand-preview-prism)] ring-1 ring-inset ring-border/60"
        aria-hidden="true"
      />
    ),
  },
]

const THEME_CHOICE_LABEL: Record<"system" | "light" | "dark", string> = {
  system: "System default",
  light: "Light",
  dark: "Dark",
}

const TEXT_SIZE_LABEL: Record<TextSizePreference, string> = {
  compact: "Tiny",
  default: "Default",
  large: "Large",
}

export function SettingsAppearanceCard() {
  const { theme, setTheme } = useTheme()
  const { contrastPref, setContrast, textSizePref, setTextSize, mounted } = useAppTheme()

  const safeTheme = mounted ? ((theme ?? "system") as "system" | "light" | "dark") : "system"
  const safeBrand: Brand = "prism"
  const safeContrast = mounted ? contrastPref : "system"
  const safeTextSize = mounted ? textSizePref : "default"

  const themeTiles = React.useMemo(
    () =>
      (["system", "light", "dark"] as const).map((m) => ({
        value: m,
        label: THEME_CHOICE_LABEL[m],
        leading: <ThemeModeSvg mode={m} brand={safeBrand} />,
      })),
    [safeBrand],
  )

  const contrastTiles = React.useMemo(
    () =>
      (["system", "normal", "high"] as const).map((p) => ({
        value: p,
        label: p === "system" ? "System" : p === "normal" ? "Normal" : "High",
        leading: <ContrastPrefSvg pref={p} brand={safeBrand} />,
      })),
    [safeBrand],
  )

  const textSizeTiles = React.useMemo(
    () =>
      (["compact", "default", "large"] as const).map((v) => ({
        value: v,
        label: TEXT_SIZE_LABEL[v],
        leading: (
          <span
            className={cn(
              "font-semibold leading-none text-foreground",
              v === "compact" && "text-xs",
              v === "default" && "text-sm",
              v === "large" && "text-base",
            )}
            aria-hidden
          >
            Aa
          </span>
        ),
      })),
    [],
  )

  return (
    <section id="appearance" className="scroll-mt-20">
      <header className="mb-8 space-y-1">
        <h2 className="text-lg font-semibold text-foreground">Appearance &amp; display</h2>
        <p className="text-sm text-muted-foreground">Saved in this browser.</p>
      </header>
      <div>
        {!mounted ? (
          <p className="text-sm text-muted-foreground">Loading theme…</p>
        ) : (
          <FieldGroup className="gap-8">
            <SettingsFormRow label="Theme" description="Light, dark, or match your OS.">
              <SelectionTileGrid<"system" | "light" | "dark">
                className="w-full"
                options={themeTiles}
                columns={3}
                value={safeTheme}
                onValueChange={(v) => setTheme(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow label="Contrast">
              <SelectionTileGrid<"system" | "normal" | "high">
                className="w-full"
                options={contrastTiles}
                columns={3}
                value={(safeContrast === "windows" ? "high" : safeContrast) as "system" | "normal" | "high"}
                onValueChange={(v) => setContrast(v)}
                interaction="button"
              />
            </SettingsFormRow>

            <SettingsFormRow
              label="Text size"
              description="Scales UI text from the root. Tiny still enforces an 11px floor for labels."
            >
              <SelectionTileGrid<TextSizePreference>
                className="w-full"
                options={textSizeTiles}
                columns={3}
                value={safeTextSize}
                onValueChange={(v) => setTextSize(v)}
                interaction="button"
              />
            </SettingsFormRow>

          </FieldGroup>
        )}
      </div>
    </section>
  )
}
