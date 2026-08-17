"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  AttachmentBasicPreview,
  AttachmentDocumentImagePreview,
  AttachmentGroupPreview,
  AttachmentImagePreview,
  AttachmentSizesPreview,
  AttachmentStatesPreview,
  AttachmentTriggerPreview,
} from "@/components/design-system/attachment-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

export const attachmentComponentDoc: ComponentDocSpec = {
  slug: "attachment",
  summary:
    "App-wide file or image chip for composers, forms, threads, and upload lists — media (icon or image), name, metadata, upload state, and actions. Ported from shadcn Attachment; Font Awesome icons; Exxat semantic tokens.",
  sections: [
    ex(
      { id: "basic", title: "Basic" },
      <AttachmentBasicPreview />,
      "Icon media, title, description, and a remove action.",
    ),
    ex(
      { id: "states", title: "States" },
      <AttachmentStatesPreview />,
      "idle, uploading, processing, error, and done. Uploading and processing shimmer the title; error uses destructive treatment with failure copy in the description.",
    ),
    ex(
      { id: "image", title: "Image" },
      <AttachmentImagePreview />,
      "Photos and screenshots — AttachmentMedia variant=\"image\" with vertical orientation.",
    ),
    ex(
      { id: "document-image", title: "Document image" },
      <AttachmentDocumentImagePreview />,
      "PDFs and office docs can use the same image media kind for page thumbnails — vertical cards or horizontal chips (including uploading).",
    ),
    ex(
      { id: "sizes", title: "Sizes" },
      <AttachmentSizesPreview />,
      "default, sm, and xs.",
    ),
    ex(
      { id: "group", title: "Group" },
      <AttachmentGroupPreview />,
      "Horizontally scrollable, snapping row with an edge fade.",
    ),
    ex(
      { id: "trigger", title: "Trigger" },
      <AttachmentTriggerPreview />,
      "Full-card AttachmentTrigger opens a dialog while actions stay separately clickable.",
    ),
  ],
  anatomy: [
    { part: "Attachment", description: "Root chip — state, size, orientation." },
    { part: "AttachmentMedia", description: "Icon or image preview slot (photos and document thumbnails)." },
    { part: "AttachmentContent", description: "Wraps title and description." },
    { part: "AttachmentTitle", description: "File name; shimmers while uploading or processing." },
    { part: "AttachmentDescription", description: "Type, size, or status copy (required for error meaning beyond color)." },
    { part: "AttachmentActions / AttachmentAction", description: "Trailing icon buttons (remove, copy)." },
    { part: "AttachmentTrigger", description: "Full-card hit target behind actions." },
    { part: "AttachmentGroup", description: "Scrollable snapping row of attachments." },
  ],
  features: [
    {
      group: "Upload lifecycle",
      icon: "fa-cloud-arrow-up",
      items: [
        { part: "idle", description: "Dashed border. Selected, not yet uploading." },
        { part: "uploading / processing", description: "Title shimmer; spinner or image thumb in media." },
        { part: "error", description: "Destructive border and description; keep the failure reason in text." },
        { part: "done", description: "Default solid chip for a finished upload." },
      ],
    },
    {
      group: "Media kinds",
      icon: "fa-image",
      items: [
        { part: "icon", description: "FA file-type glyph for generic documents and code." },
        { part: "image", description: "Raster preview for photos and document page thumbnails." },
      ],
    },
    {
      group: "Layout",
      icon: "fa-table-columns",
      items: [
        { part: "Horizontal", description: "Media beside content (composer and form chips)." },
        { part: "Vertical", description: "Media above content (gallery and doc thumbnails)." },
        { part: "Group", description: "Snap scroll row with edge fade." },
      ],
    },
  ],
  api: [
    {
      prop: "state",
      type: '"idle" | "uploading" | "processing" | "error" | "done"',
      defaultValue: '"done"',
      description: "Upload lifecycle. Drives border, shimmer, and error chrome.",
    },
    {
      prop: "size",
      type: '"default" | "sm" | "xs"',
      defaultValue: '"default"',
      description: "Chip density. Size scale applies to horizontal icon chips; vertical image media stays full-width.",
    },
    {
      prop: "orientation",
      type: '"horizontal" | "vertical"',
      defaultValue: '"horizontal"',
      description: "Media beside or above content.",
    },
    {
      prop: "AttachmentMedia.variant",
      type: '"icon" | "image"',
      defaultValue: '"icon"',
      description: "Icon slot vs image preview (photos or document thumbnails).",
    },
    {
      prop: "AttachmentAction.size",
      type: "Button size",
      defaultValue: '"icon-xs"',
      description: "Defaults to icon-xs; pass aria-label for icon-only actions.",
    },
  ],
  ux: {
    job: "Show what is attached and whether upload succeeded so the user can remove, retry, or open the file without leaving the current surface.",
    budgets: [
      { label: "Chip width", value: "fit · max full", rationale: "Truncate long names; keep the row scannable." },
      { label: "States", value: "5", rationale: "idle → uploading → processing → done | error covers the upload lifecycle." },
      { label: "Group", value: "scroll snap", rationale: "Many files stay in one row without wrapping the host layout." },
    ],
    principles: ["P3", "P5", "P6", "P8"],
    modernReferences: [
      "ChatGPT attachment chips (M1, M7)",
      "Linear file attachments on issues (M1, M4)",
      "Slack message file cards (M4, M11)",
    ],
    whenToUse: [
      "Ask Leo, search, or form composers with file attachments.",
      "Message thread file cards.",
      "Upload queues with progress and error retry.",
      "Document pickers that show PDF or office page thumbnails.",
    ],
    whenNotToUse: [
      "Full document preview — use a dialog, sheet, or route.",
      "Folder browsers — use HubTable or a file picker dialog.",
      "Permanent storage inventory — use a list hub.",
    ],
  },
  guidelines: {
    do: [
      "Label every icon-only AttachmentAction with aria-label including the file name.",
      "Put failure reasons in AttachmentDescription (not color alone).",
      "Use AttachmentGroup for multiple chips in a composer or form.",
      "Use variant=\"image\" for both photos and document page thumbnails.",
      "Keep AttachmentTrigger behind actions so remove stays independently clickable.",
      "Use semantic tokens (bg-card, border-border, text-muted-foreground, destructive).",
    ],
    dont: [
      "Treat Attachment as Ask Leo-only — it is app-wide.",
      "Use Lucide icons — Font Awesome Pro only.",
      "Invent hex or slate/zinc utility colors for the chip chrome.",
      "Nest interactive controls inside AttachmentTitle.",
      "Use a lone hyphen for missing metadata — omit the description or write None.",
    ],
  },
  accessibility: [
    {
      principle: "operable",
      criterion: "2.1.1",
      criterionTitle: "Keyboard",
      level: "A",
      guidance: "Actions and trigger are separately focusable. Presentational groups may use tabIndex={0} with role=group and aria-label for arrow scrolling.",
    },
    {
      principle: "perceivable",
      criterion: "1.3.3",
      criterionTitle: "Sensory Characteristics",
      level: "A",
      guidance: "Error state must include text in AttachmentDescription; do not rely on destructive color alone.",
    },
    {
      principle: "robust",
      criterion: "4.1.2",
      criterionTitle: "Name, Role, Value",
      level: "A",
      guidance: "Icon-only AttachmentAction and AttachmentTrigger require aria-label.",
    },
  ],
  relatedSlugs: ["button", "dialog", "input", "message", "ask-leo-button", "ask-leo-composer"],
}
