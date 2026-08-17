"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  Marker,
  MarkerContent,
  MarkerIcon,
} from "@/components/ui/marker"
import { LeoIcon } from "@/components/ui/leo-icon"
import { Button } from "@/components/ui/button"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

function MarkerStack({ children }: { children: React.ReactNode }) {
  return <div className="flex w-full max-w-md flex-col gap-3">{children}</div>
}

export const markerComponentDoc: ComponentDocSpec = {
  slug: "marker",
  summary:
    "Inline conversation marker for status, system notes, bordered rows, and labeled separators. Ported from shadcn Marker; Font Awesome icons; Exxat semantic tokens. Compose with Message in a thread.",
  extraImports: [
    { label: "Marker", path: "@exxatdesignux/ui/components/marker" },
    { label: "Message", path: "@exxatdesignux/ui/components/message" },
  ],
  sections: [
    ex(
      { id: "basic", title: "Basic" },
      <MarkerStack>
        <Marker>
          <MarkerIcon>
            <i className="fa-light fa-code-branch" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Switched to a new branch</MarkerContent>
        </Marker>
        <Marker role="status">
          <MarkerIcon>
            <LeoIcon variant="ambient" size="xs" state="working" />
          </MarkerIcon>
          <MarkerContent className="shimmer font-medium">Thinking…</MarkerContent>
        </Marker>
        <Marker>
          <MarkerContent>Conversation compacted</MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
      </MarkerStack>,
      "Icon + content composition. Decorative icons stay aria-hidden; content carries the meaning.",
    ),
    ex(
      { id: "variants", title: "Variants" },
      <MarkerStack>
        <Marker>
          <MarkerContent>A default marker for inline notes.</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>A separator marker</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerContent>A border marker for row boundaries.</MarkerContent>
        </Marker>
      </MarkerStack>,
      "default (inline), separator (centered label with dividers), border (bottom rule under the row).",
    ),
    ex(
      { id: "status", title: "Status" },
      <MarkerStack>
        <Marker role="status">
          <MarkerIcon>
            <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Compacting conversation</MarkerContent>
        </Marker>
        <Marker role="status">
          <MarkerIcon>
            <i className="fa-light fa-spinner-third fa-spin" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Running tests</MarkerContent>
        </Marker>
      </MarkerStack>,
      "Set role=\"status\" for streaming or in-progress markers so assistive tech announces updates.",
    ),
    ex(
      { id: "shimmer", title: "Shimmer" },
      <MarkerStack>
        <Marker role="status">
          <MarkerContent className="shimmer font-medium">Thinking…</MarkerContent>
        </Marker>
        <Marker role="status">
          <MarkerContent className="shimmer font-medium">Reading 4 files</MarkerContent>
        </Marker>
      </MarkerStack>,
      "Add the shimmer utility on MarkerContent for streaming text. Do not use a toast for thinking state.",
    ),
    ex(
      { id: "separator", title: "Separator" },
      <MarkerStack>
        <Marker variant="separator">
          <MarkerContent>Today</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Worked for 42s</MarkerContent>
        </Marker>
        <Marker variant="separator">
          <MarkerContent>Conversation compacted</MarkerContent>
        </Marker>
      </MarkerStack>,
      "Labeled dividers for dates or section breaks. Do not add role=\"separator\" when the label is meaningful text.",
    ),
    ex(
      { id: "border", title: "Border" },
      <MarkerStack>
        <Marker variant="border">
          <MarkerIcon>
            <i className="fa-light fa-code-branch" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Switched to release-candidate</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Reviewed 8 related files</MarkerContent>
        </Marker>
        <Marker variant="border">
          <MarkerIcon>
            <i className="fa-light fa-file-lines" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Opened implementation notes</MarkerContent>
        </Marker>
      </MarkerStack>,
      "Same alignment as default, with a bottom border separating the next row.",
    ),
    ex(
      { id: "with-icon", title: "With icon" },
      <MarkerStack>
        <Marker>
          <MarkerIcon>
            <i className="fa-light fa-code-branch" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Switched to a new branch</MarkerContent>
        </Marker>
        <Marker>
          <MarkerIcon>
            <i className="fa-light fa-magnifying-glass" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Explored 4 files</MarkerContent>
        </Marker>
        <Marker className="flex-col items-start gap-1">
          <MarkerIcon>
            <i className="fa-light fa-book-open" aria-hidden="true" />
          </MarkerIcon>
          <MarkerContent>Syncing completed</MarkerContent>
        </Marker>
      </MarkerStack>,
      "MarkerIcon is decorative. Use flex-col on Marker to stack the icon above the content.",
    ),
    ex(
      { id: "links", title: "Links and buttons" },
      <MarkerStack>
        <Marker asChild>
          <a href="#">
            <MarkerIcon>
              <i className="fa-light fa-code-branch" aria-hidden="true" />
            </MarkerIcon>
            <MarkerContent>View the pull request</MarkerContent>
          </a>
        </Marker>
        <Marker asChild>
          <Button type="button" variant="ghost" className="h-auto justify-start p-0 font-normal">
            <MarkerIcon>
              <i className="fa-light fa-rotate-left" aria-hidden="true" />
            </MarkerIcon>
            <MarkerContent>Revert this change</MarkerContent>
          </Button>
        </Marker>
      </MarkerStack>,
      "asChild renders a real link or button so the marker stays focusable with the correct role.",
    ),
  ],
  anatomy: [
    { part: "Marker", description: "Root — variant default | border | separator; optional asChild." },
    { part: "MarkerIcon", description: "Decorative icon slot (aria-hidden)." },
    { part: "MarkerContent", description: "Visible label; add shimmer for streaming status." },
  ],
  features: [
    {
      group: "Layouts",
      icon: "fa-minus",
      items: [
        { part: "default", description: "Inline status, notes, and actions." },
        { part: "border", description: "Default alignment plus a bottom border." },
        { part: "separator", description: "Centered label with divider lines on each side." },
      ],
    },
    {
      group: "Conversation",
      icon: "fa-comments",
      items: [
        {
          part: "Status",
          description: "role=\"status\" for thinking / tool progress announcements.",
        },
        {
          part: "Shimmer",
          description: "shimmer class on MarkerContent for streaming text.",
        },
        {
          part: "asChild",
          description: "Polymorphic root for link and button markers.",
        },
      ],
    },
  ],
  api: [
    {
      prop: "variant",
      type: '"default" | "border" | "separator"',
      defaultValue: '"default"',
      description: "Marker layout.",
    },
    {
      prop: "asChild",
      type: "boolean",
      defaultValue: "false",
      description: "Render as the child element (link or button).",
    },
    {
      prop: "role",
      type: "string",
      description: "Forwarded. Use \"status\" for streaming progress markers.",
    },
    {
      prop: "MarkerIcon",
      type: "slot",
      description: "Decorative; aria-hidden. Provide aria-label on Marker if icon-only.",
    },
    {
      prop: "MarkerContent",
      type: "slot",
      description: "Accessible label text. Supports shimmer utility class.",
    },
  ],
  ux: {
    job: "Announce system notes, progress, and section breaks inside a conversation without stealing focus from the transcript.",
    whenToUse: [
      "Thinking / streaming status in Ask Leo.",
      "Tool progress rows (explored files, compacted conversation).",
      "Date or section separators in a long thread.",
    ],
    whenNotToUse: [
      "Page-level alerts — use Banner.",
      "Transient snackbars — never toast.",
      "Primary chat turns — use Message + Bubble.",
    ],
    modernReferences: [
      "shadcn Marker (default / border / separator)",
      "ChatGPT system notes",
      "Cursor agent status rows",
    ],
    principles: ["P5", "P6", "P8"],
  },
  guidelines: {
    do: [
      "Compose MarkerIcon + MarkerContent; keep icons decorative.",
      "Use role=\"status\" for thinking and in-progress markers.",
      "Use separator for labeled dividers without role=\"separator\".",
      "Pair with MessageScrollerItem when the marker is a transcript row.",
    ],
    dont: [
      "Do not use Lucide — Font Awesome only.",
      "Do not put role=\"separator\" on a labeled divider (label would not be announced).",
      "Do not use toast / Sonner for thinking state.",
    ],
  },
  relatedSlugs: ["message", "ask-leo-composer", "attachment", "message-scroller"],
}
