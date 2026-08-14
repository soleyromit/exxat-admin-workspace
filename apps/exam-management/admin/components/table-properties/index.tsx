'use client'

/**
 * table-properties — thin re-export wrapper.
 *
 * @exxatdesignux/ui now exports TablePropertiesDrawer directly.
 * This index re-exports it so existing consumers import from
 * '@/components/table-properties' without import path changes.
 *
 * Local types.ts is retained for product-specific filter/sort/column
 * definitions that are not yet part of the DS TablePropertiesDrawer API.
 */

export { TablePropertiesDrawer } from '@exxatdesignux/ui'
export type { TablePropertiesDrawerProps } from '@exxatdesignux/ui'
export * from './types'
