import { cn } from "@/lib/utils"

/** Mirrors `BUILDER_LIST_ROW` in `new-library-item-form.tsx`. */
export const EXAM_OPTION_ROW =
  "flex items-center gap-2 rounded-lg border border-border bg-muted/35 px-2.5 py-2 transition-colors"

export const EXAM_OPTION_INDEX_BASE =
  "inline-flex size-7 shrink-0 items-center justify-center rounded-md border text-xs font-semibold tabular-nums transition-colors"

export function examOptionIndexClass(selected: boolean, eliminated: boolean) {
  return cn(
    EXAM_OPTION_INDEX_BASE,
    eliminated && "border-border/70 bg-muted/50 text-muted-foreground line-through decoration-muted-foreground/80",
    !eliminated &&
      selected && [
        "border-brand-deep bg-brand-deep text-brand-foreground",
        "hc:border-foreground hc:bg-foreground hc:text-background",
        "forced-colors:border-[Highlight] forced-colors:bg-[Highlight] forced-colors:text-[HighlightText]",
      ],
    !eliminated && !selected && "border-border bg-muted text-foreground",
  )
}

export const EXAM_OPTION_LABEL_CLASS =
  "flex min-h-11 min-w-0 flex-1 items-center text-sm font-medium leading-snug"

export const EXAM_OPTION_LETTERS = ["A", "B", "C", "D", "E", "F", "G", "H"] as const
