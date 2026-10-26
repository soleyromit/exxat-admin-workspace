import type { CSSProperties } from "react"

import { DS_DOC_BODY } from "@/lib/design-system/doc-typography"

/** Same bottom brand glow as `KeyMetrics` `variant="flat"`. */
const CATALOG_HERO_GLOW_STYLE: CSSProperties = {
  background: "var(--key-metrics-flat-band-radial)",
  boxShadow: "var(--key-metrics-flat-band-shadow)",
}

export function CatalogLandingHero() {
  return (
    <section
      aria-labelledby="catalog-landing-hero-title"
      className="relative -mx-4 border-b border-border sm:-mx-6"
      style={CATALOG_HERO_GLOW_STYLE}
    >
      <div className="mx-auto max-w-3xl px-4 py-[clamp(4rem,9vh,6.875rem)] sm:px-8">
        <p className="font-mono text-xs font-medium uppercase tracking-[0.18em] text-muted-foreground">
          <em className="font-semibold not-italic text-brand">Exxat</em> Design OS
        </p>

        <h1
          id="catalog-landing-hero-title"
          className="mt-7 font-heading text-[clamp(3rem,8vw,7.5rem)] font-[350] leading-[0.95] tracking-[-0.035em] text-foreground"
        >
          <span className="block">A design system,</span>
          <span className="block text-brand">
            <em className="font-light italic">that designs.</em>
          </span>
        </h1>

        <p className={`mt-8 max-w-[620px] text-base leading-normal sm:text-lg ${DS_DOC_BODY}`}>
          Speak in <em className="font-medium not-italic text-brand">outcomes.</em> The system asks
          the right questions and ships UX that respects users.
        </p>
      </div>
    </section>
  )
}
