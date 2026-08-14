"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  AccordionPreview,
  CollapsiblePreview,
  SeparatorPreview,
} from "@/components/design-system/layout-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

export const accordionComponentDoc: ComponentDocSpec = {
  slug: "accordion",
  summary: "Accordion and Collapsible expand/collapse — prefer for long settings sections.",
  sections: [
    ex({ id: "accordion", title: "Accordion" }, <AccordionPreview />),
    ex({ id: "collapsible", title: "Collapsible" }, <CollapsiblePreview />),
  ],
  relatedSlugs: ["card", "separator"],
}

export const separatorComponentDoc: ComponentDocSpec = {
  slug: "separator",
  summary: "Divider between sections — horizontal or vertical.",
  sections: [ex({ id: "default", title: "Separator" }, <SeparatorPreview />)],
  relatedSlugs: ["accordion", "card"],
}
