"use client"

import { AiThinkingOverlay } from "@/components/ui/ai-thinking-surface"

/** Drifting dot cloud for `SystemBanner variant="promo"`. Decorative only — banner copy stays primary. */
export function PromoBannerDecorativeOverlay() {
  return (
    <AiThinkingOverlay
      active
      cloudCount={2}
      cloudRadius={340}
      gridSize={13}
      dotRadius={1.15}
      fillClassName="fill-brand/30 dark:fill-brand/38"
    />
  )
}
