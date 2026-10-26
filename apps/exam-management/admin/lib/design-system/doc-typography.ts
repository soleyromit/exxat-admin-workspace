/**
 * Design-system doc typography — keeps prose at text-sm+, meta at text-xs floor (12px).
 *
 * Root cause note: `--text-xs` / `--text-2xs` are both 12px (see globals.css).
 * Using `text-xs` for descriptions is legal but wrong hierarchy — it reads as
 * “minimum legal size” instead of comfortable body copy.
 *
 * Skeleton doc pages (`buildSkeletonComponentDoc`, `ComponentDocDetails`) MUST
 * import from here — no raw Tailwind palette colors (`text-emerald-*`, etc.).
 */

/** Muted descriptions, helper paragraphs, list prose */
export const DS_DOC_BODY = "text-sm text-muted-foreground"

/** Section / example titles */
export const DS_DOC_SECTION_TITLE = "text-sm font-semibold text-foreground"

/** Subsection titles inside a doc block */
export const DS_DOC_SUBSECTION_TITLE = "text-sm font-medium text-foreground"

/** Monospace code — import paths, source paths (text-sm for readable code) */
export const DS_DOC_CODE = "font-mono text-sm text-muted-foreground"

/** API / anatomy monospace labels — text-sm (14px) for readable doc copy */
export const DS_DOC_CODE_LABEL = "font-mono text-sm font-medium text-foreground"

/** Guidelines list icon — do / success tone */
export const DS_DOC_GUIDELINE_DO_ICON = "text-chip-2"

/** Guidelines list icon — don't / destructive tone */
export const DS_DOC_GUIDELINE_DONT_ICON = "text-destructive"

/** Guideline row icon box — 12px floor */
export const DS_DOC_GUIDELINE_ICON = "text-xs"

/** API table — prop / code column */
export const DS_DOC_TABLE_CODE = "font-mono text-sm text-foreground"

/** API table — type / default columns */
export const DS_DOC_TABLE_META = "font-mono text-sm text-muted-foreground"

/** API table — description column */
export const DS_DOC_TABLE_BODY = "text-sm whitespace-normal text-muted-foreground"

/** API table — header cells (match body size; 12px floor) */
export const DS_DOC_TABLE_HEAD = "text-sm font-medium text-muted-foreground"

/** Inline emphasis inside muted body copy */
export const DS_DOC_BODY_EMPHASIS = "text-sm font-medium text-foreground"

/** Related cross-links */
export const DS_DOC_LINK = "text-sm font-medium text-primary hover:underline"
