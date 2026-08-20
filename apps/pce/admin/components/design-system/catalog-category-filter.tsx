"use client"

import { FilterChipGroup } from "@/components/ui/filter-chip-group"

export interface CatalogCategoryFilterOption<T extends string = string> {
  value: T
  label: string
  count: number
  icon?: string
}

export interface CatalogCategoryFilterProps<T extends string = string> {
  value: T
  onValueChange: (value: T) => void
  options: readonly CatalogCategoryFilterOption<T>[]
  "aria-label"?: string
  className?: string
}

/** Design OS Catalog tier filter — `FilterChipGroup` brand variant with counts. */
export function CatalogCategoryFilter<T extends string>({
  value,
  onValueChange,
  options,
  "aria-label": ariaLabel = "Filter Design OS Catalog by category",
  className,
}: CatalogCategoryFilterProps<T>) {
  return (
    <FilterChipGroup
      value={value}
      onValueChange={onValueChange}
      options={options}
      variant="brand"
      size="default"
      aria-label={ariaLabel}
      className={className}
    />
  )
}
