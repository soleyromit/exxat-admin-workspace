/**
 * One link treatment for every lab screen (consistency audit item 7, density sweep 2026-10-26).
 * LINK_IN_TABLE: names inside tables and lists, underlined on hover (the row already says it is a record).
 * LINK: a standalone link in a sentence or card footer, always underlined (it must read as a link without hover).
 * NUM_LINK: a count or figure that opens the records behind it (quiet underline, darkens on hover).
 */
const FOCUS = "rounded-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
export const LINK_IN_TABLE = `${FOCUS} font-medium text-foreground underline-offset-2 hover:underline`
export const LINK = `${FOCUS} font-medium text-foreground underline underline-offset-2`
export const NUM_LINK = `${FOCUS} font-medium tabular-nums text-foreground underline decoration-border underline-offset-4 hover:decoration-foreground`
