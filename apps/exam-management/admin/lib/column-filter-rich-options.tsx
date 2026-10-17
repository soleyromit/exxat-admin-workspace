"use client"

/**
 * Rich filter option nodes for column `filter.options[].node` — pairs with
 * `ColumnDef.cellKind` presets in `@exxatdesignux/ui/lib/column-filter`.
 */

import * as React from "react"

import { ProgressCell, RatingCell, SignalBarsCell } from "@/components/data-views"

export function ratingFilterOptions(max = 5) {
  return Array.from({ length: max }, (_, i) => {
    const value = i + 1
    return {
      value: String(value),
      label: value === 1 ? "1 star" : `${value} stars`,
      node: <RatingCell value={value} max={max} />,
    }
  })
}

export function libraryDifficultyFilterOptions() {
  return [
    { value: "easy", label: "Low", node: <SignalBarsCell level={1} tone="info" label="Low" /> },
    { value: "medium", label: "Normal", node: <SignalBarsCell level={2} tone="info" label="Normal" /> },
    { value: "hard", label: "High", node: <SignalBarsCell level={3} tone="info" label="High" /> },
  ]
}

export function signalBarsFilterOptions() {
  return [
    {
      value: "1",
      label: "Low",
      node: <SignalBarsCell level={1} tone="info" label="Low" />,
    },
    {
      value: "2",
      label: "Normal",
      node: <SignalBarsCell level={2} tone="info" label="Normal" />,
    },
    {
      value: "3",
      label: "High",
      node: <SignalBarsCell level={3} tone="info" label="High" />,
    },
  ]
}

export function progressFilterBucketOptions() {
  return [
    { value: "0", label: "0%", node: <ProgressCell value={0} /> },
    { value: "25", label: "25%", node: <ProgressCell value={25} /> },
    { value: "50", label: "50%", node: <ProgressCell value={50} /> },
    { value: "75", label: "75%", node: <ProgressCell value={75} /> },
    { value: "100", label: "100%", node: <ProgressCell value={100} /> },
  ]
}
