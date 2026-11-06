"use client"

/**
 * "3 selected", first in the DS selection bar's action slot (map D1, D1b). The DS bar prints its count in a red chip with no prop to change it, which reads as an error on its near-black
 * slab. app/globals.css hides that chip and its divider where this is present, so the count is in the slab's own ink. The bar itself stays the DS bar on every page.
 */
export function BulkCount({ n }: { n: number }) {
  return <span className="shrink-0 whitespace-nowrap pe-2 text-sm font-medium tabular-nums" data-bulk-selected>{`${n.toLocaleString("en-US")} selected`}</span>
}
