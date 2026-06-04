"use client"

import { DefaultProductRedirect as PackageDefaultProductRedirect } from "@exxatdesignux/ui/components/shell"

/**
 * Cold-start `/` → tenant default product dashboard. Wraps the framework's
 * redirect with the template's default loading fallback.
 */
export function DefaultProductRedirect() {
  return <PackageDefaultProductRedirect loadingFallback={null} />
}
