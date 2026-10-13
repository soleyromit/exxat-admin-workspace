import {
  EXXAT_COMPLIANCE_BRAND,
  EXXAT_CURRICULUM_MAPPING_BRAND,
  EXXAT_EXAM_MANAGEMENT_BRAND,
  EXXAT_ONE_SCHOOLS_BRAND,
  EXXAT_PRISM_BRAND,
  EXXAT_SURVEYS_BRAND,
  type ProductBrandConfig,
} from "@exxatdesignux/product-framework"

/**
 * The product switcher rows, in the order shipped Exxat products list them (apps/pce/admin product switcher;
 * starter lib/product-switcher-catalog.ts BUILTIN_SWITCHER_PRODUCTS). Skills tracking is a Prism module
 * (REQ title: "Prism, Skills Tracking Module"), so the active product here is Clinical Education, the product whose
 * lock-up carries the Prism "E" mark. Other products are listed because the DS switcher lists them, but they are not
 * part of this prototype, so they are shown unavailable instead of linking nowhere. OD-P1 (standalone app or a
 * section of Prism) stays open: when it is decided the rows below become real links.
 */
export interface SwitcherProduct {
  id: string
  label: string
  /** Font Awesome glyph used on the menu row, as in the shipped switcher. */
  icon: string
  brand: ProductBrandConfig
  current?: boolean
}

export const PRODUCTS: SwitcherProduct[] = [
  { id: "exxat-prism", label: "Clinical Education", icon: "stethoscope", brand: EXXAT_PRISM_BRAND, current: true },
  { id: "exxat-one-schools", label: "Exxat One", icon: "1", brand: EXXAT_ONE_SCHOOLS_BRAND },
  { id: "exxat-curriculum-mapping", label: "Curriculum Mapping", icon: "book-open", brand: EXXAT_CURRICULUM_MAPPING_BRAND },
  { id: "exxat-compliance", label: "Compliance", icon: "shield-check", brand: EXXAT_COMPLIANCE_BRAND },
  { id: "exxat-surveys", label: "Surveys", icon: "chart-simple", brand: EXXAT_SURVEYS_BRAND },
  { id: "exxat-exam-management", label: "Exam Management", icon: "clipboard-list-check", brand: EXXAT_EXAM_MANAGEMENT_BRAND },
]

export const CURRENT_PRODUCT = PRODUCTS[0]
