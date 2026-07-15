"use client"

import * as React from "react"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import { LeoThreadMessages } from "@/components/leo-thread-messages"
import type { LeoThreadMessage } from "@/lib/use-leo-thread"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, description, children }
}

const SAMPLE_MESSAGES: LeoThreadMessage[] = [
  { id: "1", role: "user", content: "Which students are at risk this week?" },
  {
    id: "2",
    role: "assistant",
    content:
      "Three students have overdue compliance items before placement start. Open the Library hub filtered to non-compliant to review.",
  },
]

export const messageComponentDoc: ComponentDocSpec = {
  slug: "message",
  summary:
    "Ask Leo transcript primitives — Message (turn layout), Bubble (user/assistant chrome), Marker (thinking status), MessageScroller (auto-scroll viewport). Compose via LeoThreadMessages in product surfaces.",
  extraImports: [
    { label: "LeoThreadMessages", path: "@/components/leo-thread-messages" },
    { label: "AskLeoSidebar", path: "@/components/ask-leo-sidebar" },
    { label: "Bubble", path: "@exxatdesignux/ui/components/ui/bubble" },
    { label: "Marker", path: "@exxatdesignux/ui/components/ui/marker" },
    { label: "MessageScroller", path: "@exxatdesignux/ui/components/ui/message-scroller" },
  ],
  sections: [
    ex(
      { id: "thread", title: "Thread transcript" },
      <div className="h-[280px] rounded-lg border border-border bg-background">
        <LeoThreadMessages messages={SAMPLE_MESSAGES} ariaLabel="Leo thread preview" />
      </div>,
      "User turns align end with primary Bubble; assistant uses ghost Bubble; pending uses Marker + shimmer.",
    ),
  ],
  anatomy: [
    { part: "Message", description: "Turn row — MessageAvatar + MessageContent; align start | end." },
    { part: "Bubble", description: "variant default (user) | ghost (assistant)." },
    { part: "Marker", description: "role=\"status\" thinking row — FA spinner + shimmer label." },
    { part: "MessageScroller", description: "Viewport + stick-to-bottom on new messages." },
    { part: "LeoThreadMessages", description: "Product wrapper wiring avatars, bubbles, and scroller." },
  ],
  ux: {
    job: "Render multi-turn AI chat with consistent DS tokens — not bespoke div stacks per surface.",
    whenToUse: [
      "Ask Leo sidebar and landing thread.",
      "Any in-product Leo Q&A transcript.",
    ],
    whenNotToUse: [
      "Chart plot insights — use ChartLeoPlotInsightOverlay.",
      "System banners or inline alerts — use Banner.",
    ],
    modernReferences: ["ChatGPT thread layout", "Linear AI side panel"],
  },
  guidelines: {
    do: [
      "Reuse LeoThreadMessages for sidebar + landing — one transcript implementation.",
      "User bubbles: Bubble variant=\"default\"; assistant: variant=\"ghost\".",
      "Thinking state: Marker role=\"status\" + shimmer; not a toast.",
    ],
    dont: [
      "Do not fork scroll logic — MessageScroller owns stick-to-bottom.",
      "Do not use Lucide — Font Awesome only per exxat-fontawesome-icons.",
    ],
  },
}
