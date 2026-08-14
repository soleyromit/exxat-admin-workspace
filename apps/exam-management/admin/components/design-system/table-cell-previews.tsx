"use client"

import * as React from "react"

import {
  AttachmentCountCell,
  BooleanToggleCell,
  CurrencyCell,
  ExternalLinkCell,
  NumericCell,
  PeopleAvatarRailCell,
  PillCell,
  ProgressCell,
  RatingCell,
  RelativeTimeCell,
  RowActionsCell,
  SignalBarsCell,
  TagListCell,
} from "@/components/data-views"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"

export function ProgressCellPreview() {
  const [progress, setProgress] = React.useState(42)
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-2">
        <Label id="ds-progress-slider-label" htmlFor="ds-progress-slider">
          Adjust value
        </Label>
        <Slider
          id="ds-progress-slider"
          aria-labelledby="ds-progress-slider-label"
          value={[progress]}
          onValueChange={(v) => setProgress(v[0] ?? 0)}
          max={100}
          step={1}
        />
      </div>
      <ProgressCell value={progress} max={100} label={`${progress}% complete`} />
    </div>
  )
}

export function CurrencyCellPreview() {
  return <CurrencyCell value={1240.5} />
}

export function NumericCellPreview() {
  return <NumericCell value={1284} />
}

export function RatingCellPreview() {
  return <RatingCell value={4.2} max={5} />
}

export function SignalBarsCellPreview() {
  return <SignalBarsCell level={3} max={4} tone="info" label="Strong signal" />
}

export function BooleanToggleCellPreview() {
  const [published, setPublished] = React.useState(true)
  return <BooleanToggleCell checked={published} onChange={setPublished} />
}

export function PillCellPreview() {
  return <PillCell label="Clinical" icon="fa-stethoscope" />
}

export function TagListCellPreview() {
  return <TagListCell tags={["Anatomy", "Pharmacology", "Ethics", "Skills"]} visibleMax={2} />
}

export function PeopleAvatarRailCellPreview() {
  return (
    <PeopleAvatarRailCell
      people={[
        { name: "Alex Chen", initials: "AC" },
        { name: "Jordan Lee", initials: "JL" },
        { name: "Sam Rivera", initials: "SR" },
        { name: "Pat Kim", initials: "PK" },
      ]}
    />
  )
}

export function ExternalLinkCellPreview() {
  return <ExternalLinkCell url="https://design.exxat.com/patterns" label="Design OS docs" />
}

export function RelativeTimeCellPreview() {
  return <RelativeTimeCell iso={new Date(Date.now() - 3_600_000 * 5).toISOString()} />
}

export function AttachmentCountCellPreview() {
  return <AttachmentCountCell count={3} />
}

export function RowActionsCellPreview() {
  return (
    <RowActionsCell
      row={{ id: "demo" }}
      actions={[
        { label: "Open", icon: "fa-arrow-up-right-from-square", onSelect: () => {} },
        { label: "Edit", icon: "fa-pen", onSelect: () => {} },
      ]}
    />
  )
}
