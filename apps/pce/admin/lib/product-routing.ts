/** Shim — re-exports product-routing helpers from `@exxatdesignux/product-framework`. */

export {
  RESERVED_PRODUCT_ROOT_SEGMENTS,
  customProductSlugFromSuffix,
  customSuffixCollidesWithBuiltInProduct,
  isBuiltInProductSlug,
  isReservedProductRootSegment,
  productRouteSlug,
  resolveProductFromPath,
  validateCustomProductSuffix,
  type ResolvedProductRoute,
} from "@exxatdesignux/product-framework"
