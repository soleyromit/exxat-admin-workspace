"use client"

/**
 * `/home` → last preferred layout URL (`/home/storefront` etc.).
 *
 * Each home approach is its own link; the bare `/home` path only remembers
 * which one you used last so post-login and "All products" keep working.
 */

import { Navigate } from "react-router"

import { homeVariantPath, useHomeVariant } from "@/hooks/use-home-variant"

export default function ProductHomeIndexRedirect() {
  const variant = useHomeVariant()
  return <Navigate to={homeVariantPath(variant)} replace />
}
