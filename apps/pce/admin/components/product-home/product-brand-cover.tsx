"use client"

/**
 * Cover art for a product card / marketing hero.
 *
 * Deliberately *not* a shrunken UI screenshot. App-directory guidance is
 * consistent that screenshots fail the squint test at card scale — they
 * degrade into grey smudges, because they were drawn to be read at full width.
 * What survives is a near-solid field with one recognisable element, so that
 * is what this is: the product's own brand colour behind the glyph for the job
 * it does. Not the Exxat mark — every product shares that, so nine cards of it
 * differentiate nothing.
 *
 * Real screenshots earn their place on the marketing page, at full size and
 * captioned, where the detail is legible.
 *
 * The tint is mixed from `card.brandColor` rather than `bg-brand`, because the
 * home shows several products while only one of them owns the active theme.
 */

import { cn } from "@/lib/utils"

export function ProductBrandCover({
  icon,
  brandColor,
  muted = false,
  className,
  markClassName = "text-4xl",
}: {
  /** Font Awesome class for the product's glyph. */
  icon: string
  brandColor: string
  /** Drop the colour for products the workspace does not have. */
  muted?: boolean
  className?: string
  markClassName?: string
}) {
  const tint = muted
    ? undefined
    : {
        // Two stops of the same hue rather than a rainbow gradient — enough
        // separation to read as deliberate, flat enough to keep the mark the
        // only thing competing for attention.
        //
        // Mixed toward `transparent`, not toward a surface token. Mixing into
        // `--card` interpolates *hue* as well as lightness, and since `--card`
        // is a pink-tinted white every product's tint came out pink — One's
        // lavender arrived on screen at hue 344. Fading to transparent keeps
        // the hue exact and lets the card underneath handle light vs dark.
        backgroundImage: `linear-gradient(135deg,
          oklch(from ${brandColor} l c h / 22%) 0%,
          oklch(from ${brandColor} l c h / 7%) 100%)`,
      }

  return (
    <div
      aria-hidden
      style={tint}
      className={cn(
        "relative flex items-center justify-center overflow-hidden",
        muted && "bg-muted/50",
        className,
      )}
    >
      <i
        className={cn(
          icon,
          // The glyph inherits the brand hue rather than repeating it as a
          // fill, so the cover stays one colour idea instead of two.
          "text-(--product-glyph)",
          markClassName,
          muted && "opacity-50 grayscale",
        )}
        style={{ "--product-glyph": brandColor } as React.CSSProperties}
      />
    </div>
  )
}
