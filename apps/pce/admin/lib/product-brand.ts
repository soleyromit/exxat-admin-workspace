/** Shim — re-exports brand registry helpers from `@exxatdesignux/product-framework`. */

/**
 * PCE's brand color — matches the DS workspace's own "Exxat PCE" tenant
 * (`localhost:4000/pce`, tenant id `tenant-pce`). Violet/blue, not the
 * Prism pink `theme-prism` previously borrowed here. Re-add this constant
 * whenever a DS package sync regenerates this shim from the framework
 * registry — the registry has no PCE-specific entry, so the sync script
 * silently drops this local addition (last happened 2026-08-17).
 */
export const PCE_BRAND_COLOR = "oklch(63.27% 0.1040 286.29)"

export {
  EXXAT_CORPORATE_BRAND,
  EXXAT_ACCREDITATION_BRAND,
  EXXAT_EXAM_MANAGEMENT_BRAND,
  EXXAT_STUDENT_SUCCESS_BRAND,
  EXXAT_SURVEYS_BRAND,
  EXXAT_COMPLIANCE_BRAND,
  EXXAT_CURRICULUM_MAPPING_BRAND,
  EXXAT_ONE_SITES_BRAND,
  EXXAT_PRISM_BRAND,
  EXXAT_ADMIN_BRAND,
  EXXAT_PEOPLE_BRAND,
  EXXAT_COURSES_BRAND,
  EXXAT_PERSONNEL_BRAND,
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
