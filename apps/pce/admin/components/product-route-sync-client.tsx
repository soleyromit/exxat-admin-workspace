'use client'

import dynamic from 'next/dynamic'

const ProductRouteSyncInner = dynamic(
  () => import('@/contexts/product-route-sync').then(m => ({ default: m.ProductRouteSync })),
  { ssr: false }
)

export function ProductRouteSyncClient() {
  return <ProductRouteSyncInner />
}
