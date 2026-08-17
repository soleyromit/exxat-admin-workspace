/** Shim — re-exports brand registry helpers from `@exxatdesignux/product-framework`. */

/**
 * PCE's brand color — matches the DS workspace's own "Exxat PCE" tenant
 * (`localhost:4000/pce`, tenant id `tenant-pce`). Violet/blue, not the
 * Prism pink `theme-prism` previously borrowed here.
 */
export const PCE_BRAND_COLOR = "oklch(63.27% 0.1040 286.29)"

export {
  EXXAT_ONE_SCHOOLS_BRAND,
  EXXAT_ONE_SITES_BRAND,
  EXXAT_PRISM_BRAND,
  applyBrandColorOverride,
  brandForProduct,
  brandPreviewPanelSurfaces,
  customProductBrandConfig,
  defineProductBrand,
  getProductBrand,
  listProductBrands,
  productBrandLabel,
  registerProductBrand,
  type ProductBrandConfig,
} from "@exxatdesignux/product-framework"
