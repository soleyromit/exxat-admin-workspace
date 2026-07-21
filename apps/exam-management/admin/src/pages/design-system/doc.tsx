import { Navigate, useParams } from "react-router-dom"

import {
  DesignSystemDocPage,
  DesignSystemNotFound,
} from "@/components/design-system/design-system-doc-page"
import { getDesignSystemEntry } from "@/lib/design-system/registry"

export default function DesignSystemDocRoute() {
  const { slug } = useParams<{ slug: string }>()
  const entry = getDesignSystemEntry(slug)

  if (!entry) {
    return <DesignSystemNotFound slug={slug ?? ""} />
  }

  if (entry.parentSlug) {
    return <Navigate to={`../${entry.parentSlug}#${entry.slug}`} replace />
  }

  return <DesignSystemDocPage entry={entry} />
}
