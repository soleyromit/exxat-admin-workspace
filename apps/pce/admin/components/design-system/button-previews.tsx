"use client"

import * as React from "react"
import { Link } from "react-router-dom"

import { Button } from "@/components/ui/button"
import { ButtonGroup } from "@/components/ui/button-group"
import { ButtonSegmentedControl } from "@/components/ui/button-segmented-control"
import { Toggle } from "@/components/ui/toggle"
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group"

const VARIANTS = [
  { variant: "default" as const, label: "Default" },
  { variant: "outline" as const, label: "Outline" },
  { variant: "secondary" as const, label: "Secondary" },
  { variant: "ghost" as const, label: "Ghost" },
  { variant: "destructive" as const, label: "Destructive" },
  { variant: "link" as const, label: "Link" },
]

export function ButtonVariantsPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      {VARIANTS.map(({ variant, label }) => (
        <Button key={variant} type="button" variant={variant}>
          {label}
        </Button>
      ))}
    </div>
  )
}

export function ButtonSizesPreview() {
  return (
    <div className="flex flex-col items-start gap-6 sm:flex-row sm:flex-wrap">
      {(
        [
          { size: "xs" as const, iconSize: "icon-xs" as const, label: "Extra Small" },
          { size: "sm" as const, iconSize: "icon-sm" as const, label: "Small" },
          { size: "default" as const, iconSize: "icon" as const, label: "Default" },
          { size: "lg" as const, iconSize: "icon-lg" as const, label: "Large" },
        ] as const
      ).map(({ size, iconSize, label }) => (
        <div key={size} className="flex items-start gap-2">
          <Button type="button" size={size} variant="outline">
            {label}
          </Button>
          <Button type="button" size={iconSize} variant="outline" aria-label="Submit">
            <i className="fa-light fa-arrow-up-right" aria-hidden="true" />
          </Button>
        </div>
      ))}
    </div>
  )
}

export function ButtonIconPreview() {
  return (
    <div className="flex flex-wrap items-center gap-4">
      <div className="flex items-center gap-2">
        <Button type="button" variant="ghost" size="sm">
          Ghost label
        </Button>
        <Button type="button" variant="ghost" size="icon-sm" aria-label="Refresh">
          <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
        </Button>
      </div>
      <Button type="button" variant="outline" size="icon" aria-label="Refresh outline">
        <i className="fa-light fa-arrows-rotate" aria-hidden="true" />
      </Button>
    </div>
  )
}

/** Toolbar ghost icon — filter bars, search chrome, breadcrumb utility menus. */
export function ButtonGhostIconToolbarPreview() {
  return (
    <div className="flex w-fit items-center gap-0.5 rounded-lg border border-border bg-muted/30 p-1">
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Search">
        <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label="Filter">
        <i className="fa-light fa-sliders" aria-hidden="true" />
      </Button>
      <Button type="button" size="icon-sm" variant="ghost" aria-label="More options">
        <i className="fa-light fa-ellipsis" aria-hidden="true" />
      </Button>
    </div>
  )
}

export function ButtonWithIconPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" size="sm">
        <i className="fa-light fa-code-branch" data-icon="inline-start" aria-hidden="true" />
        New branch
      </Button>
      <Button type="button" variant="outline" size="sm">
        Continue
        <i className="fa-light fa-arrow-right" data-icon="inline-end" aria-hidden="true" />
      </Button>
    </div>
  )
}

export function ButtonLoadingPreview() {
  return (
    <div className="flex flex-wrap gap-2">
      <Button type="button" variant="outline" disabled>
        <i
          className="fa-light fa-spinner-third fa-spin"
          data-icon="inline-start"
          aria-hidden="true"
        />
        Generating
      </Button>
      <Button type="button" variant="secondary" disabled>
        Downloading
        <i
          className="fa-light fa-spinner-third fa-spin"
          data-icon="inline-end"
          aria-hidden="true"
        />
      </Button>
    </div>
  )
}

export function ButtonGroupPreview() {
  return (
    <ButtonGroup aria-label="Text alignment">
      <Button type="button" size="sm" variant="outline">
        Left
      </Button>
      <Button type="button" size="sm" variant="outline">
        Center
      </Button>
      <Button type="button" size="sm" variant="outline">
        Right
      </Button>
    </ButtonGroup>
  )
}

export function ButtonGroupSegmentedPreview() {
  const [mode, setMode] = React.useState<"list" | "grid" | "board">("list")
  return (
    <ButtonSegmentedControl
      aria-label="View mode"
      value={mode}
      onValueChange={setMode}
      iconOnly
      options={[
        { value: "list", label: "List", icon: "fa-light fa-list" },
        { value: "grid", label: "Grid", icon: "fa-light fa-grid-2" },
        { value: "board", label: "Board", icon: "fa-light fa-columns-3" },
      ]}
    />
  )
}

export function TogglePreview() {
  const [pressed, setPressed] = React.useState(false)
  return (
    <Toggle pressed={pressed} onPressedChange={setPressed} aria-label="Toggle bold">
      <i className="fa-light fa-bold" aria-hidden="true" />
    </Toggle>
  )
}

export function ToggleGroupPreview() {
  const [alignment, setAlignment] = React.useState("left")
  return (
    <ToggleGroup
      type="single"
      value={alignment}
      onValueChange={(value) => value && setAlignment(value)}
      aria-label="Text alignment"
    >
      <ToggleGroupItem value="left" aria-label="Align left">
        <i className="fa-light fa-align-left" aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="center" aria-label="Align center">
        <i className="fa-light fa-align-center" aria-hidden="true" />
      </ToggleGroupItem>
      <ToggleGroupItem value="right" aria-label="Align right">
        <i className="fa-light fa-align-right" aria-hidden="true" />
      </ToggleGroupItem>
    </ToggleGroup>
  )
}

export function ButtonAsChildPreview() {
  return (
    <Button type="button" asChild>
      <Link to="#">Login</Link>
    </Button>
  )
}
