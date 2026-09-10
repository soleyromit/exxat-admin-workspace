/**
 * PCE's brand color — matches the DS workspace's own "Exxat PCE" tenant
 * (`localhost:4000/pce`, tenant id `tenant-pce`). Violet/blue, not the
 * Prism pink `theme-prism` previously borrowed here.
 *
 * Lives in this app-owned file, not `lib/product-brand.ts` — that file is a
 * re-export shim `exxat-ui upgrade` regenerates from the framework's brand
 * registry on every `pnpm install` anywhere in the monorepo (not just when
 * upgrading PCE itself). The registry has no PCE-specific entry, so anything
 * hand-added there gets silently dropped — this happened three times on
 * 2026-08-21 alone. This filename isn't part of the package's generated-
 * starter manifest, so the CLI has no reason to ever touch it.
 */
export const PCE_BRAND_COLOR = "oklch(63.27% 0.1040 286.29)"
