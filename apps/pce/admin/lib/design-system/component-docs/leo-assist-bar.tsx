"use client"

import type { ComponentDocSpec } from "@/lib/design-system/component-doc-types"
import {
  LeoAssistBarCollapsedPreview,
  LeoAssistBarEmptyPreview,
  LeoAssistBarFieldInFormPreview,
  LeoAssistBarGroupPreview,
  LeoAssistBarPreview,
  LeoAssistBarThinkingPreview,
  LeoAssistFieldSelectionPreview,
  LeoAssistSelectionToolbarPreview,
} from "@/components/design-system/leo-assist-bar-previews"

function ex(
  section: Omit<ComponentDocSpec["sections"][number], "children" | "description">,
  children: React.ReactNode,
  description?: string,
) {
  return { ...section, children, description }
}

export const leoAssistBarComponentDoc: ComponentDocSpec = {
  slug: "leo-assist-bar",
  summary:
    "Leo attached to the field being edited. Drafts when the field is empty, rewrites when it has content, and keeps every Leo write undoable from the bar.",
  sections: [
    ex(
      { id: "empty", title: "Empty field" },
      <LeoAssistBarEmptyPreview />,
      "With nothing written, the overflow offers draft starters. Type into the field and the bar switches itself to rewrite.",
    ),
    ex(
      { id: "interactive", title: "Field with content" },
      <LeoAssistBarPreview />,
      "Polish and the other rewrites live under More. Run one and undo (then redo) appear after More, behind a rule.",
    ),
    ex(
      { id: "thinking", title: "Working" },
      <LeoAssistBarThinkingPreview />,
      "Send an instruction to watch the state run. The wash and working star play, the actions give way to Stop, and the form above locks so nothing is edited underneath the run, then everything returns to rest with the field rewritten. The run is stretched here so it can be followed start to finish.",
    ),
    ex(
      { id: "field-in-form", title: "One field inside a form" },
      <LeoAssistBarFieldInFormPreview />,
      "The bar belongs to the field it edits and sits directly under it. Its width is its own, so a narrow field does not squeeze the instruction. Run an action and the whole form locks, not just the field.",
    ),
    ex(
      { id: "group", title: "A group of fields" },
      <LeoAssistBarGroupPreview />,
      "One bar over a whole section, including the select, radio, and checkboxes. The host serialises the group into text and parses it back, so a single run can change prose and structured fields together and a single undo restores all of them.",
    ),
    ex(
      { id: "collapsed", title: "Collapsed" },
      <LeoAssistBarCollapsedPreview />,
      "A form with two fields shows two circles, not two bars. Each one is the pill at its own height, so opening widens it in place instead of swapping one control for another, and the caret lands in the instruction ready to type. Escape clears a half-typed instruction on the first press and closes the bar on the second, and Close does the same for a pointer.",
    ),
    ex(
      { id: "selection", title: "Scoped to a selection" },
      <LeoAssistFieldSelectionPreview />,
      "Select a phrase and a Leo chip appears beside it. Opening from there scopes the run to that span: the bar states how much text is in play, and the result is spliced back in place, leaving the rest of the paragraph byte for byte. Press ⌘⌥L to do the same from the keyboard. Undo still restores the whole field.",
    ),
    ex(
      { id: "selection-toolbar", title: "Selection toolbar" },
      <LeoAssistSelectionToolbarPreview />,
      "Select a phrase for the floating format toolbar. Ask Leo uses AskLeoButton with animatedStar and opens this Assist Bar scoped to that span. Host fields are Field + Textarea from the DS.",
    ),
  ],
  anatomy: [
    {
      part: "Leo pill",
      description:
        "AskLeoComposer in searchBarShellClassName. Carries the Leo mark, the instruction field, and the thinking wash. Dictation is off here; the instruction is a short phrase typed while already editing.",
    },
    {
      part: "Overflow",
      description:
        "All quick actions for the current content state (Polish, Shorten, and the rest), in a DropdownMenu after the instruction.",
    },
    {
      part: "History pair",
      description:
        "Two separate undo and redo buttons after the more menu, separated by a rule. They appear together after the first Leo write; the inactive side stays visible and disabled so the pair never reads as a toggle.",
    },
    {
      part: "Collapsed trigger",
      description:
        "The pill closed down to a circle: same 50px height, same radius, same border and surface, carrying the mark alone. Opening widens it into the bar and moves the caret into the instruction field.",
    },
    {
      part: "Scope chip",
      description:
        "One line of fact above the pill when Leo is narrowed to a selection: what is in scope and how many characters. Absent when Leo has the whole field.",
    },
    {
      part: "Selection chip",
      description:
        "Floating AskLeoButton raised beside a settled selection inside LeoAssistField. It opens the bar scoped to that span, and never takes focus, which would drop the selection that raised it.",
    },
    {
      part: "Selection toolbar",
      description:
        "Richer floating chrome on a settled selection (format, copy, Ask Leo). Ask Leo opens the Assist Bar with the same scope as the chip.",
    },
  ],
  api: [
    {
      prop: "text",
      type: "string",
      description:
        "The field content Leo reads and writes. Owned by the host, and its emptiness picks the content state.",
    },
    {
      prop: "onTextChange",
      type: "(next: string) => void",
      description: "Called for Leo writes and for undo and redo.",
    },
    {
      prop: "onRun",
      type: "(request: LeoAssistRequest) => Promise<string>",
      description:
        "Runs the request and resolves with the new field text. Reject to show an inline error and leave the field untouched.",
    },
    {
      prop: "actions",
      type: "readonly LeoAssistAction[]",
      description:
        "Offered once the field has content. All entries live in the overflow menu.",
    },
    {
      prop: "emptyActions",
      type: "readonly LeoAssistAction[]",
      description:
        "Offered while the field is empty. All entries live in the overflow menu.",
    },
    {
      prop: "examples",
      type: "readonly string[]",
      description: "Rotating example instructions for the filled state.",
    },
    {
      prop: "emptyExamples",
      type: "readonly string[]",
      description: "Rotating example instructions for the empty state.",
    },
    {
      prop: "onRunningChange",
      type: "(running: boolean) => void",
      description:
        "Fires when Leo starts and stops. Wrap the surrounding fields in a disabled fieldset with it, so nothing is edited underneath a run.",
    },
    {
      prop: "fieldLabel",
      type: "string",
      description:
        "Names the field in the input's accessible name, for hosts with several assist bars.",
    },
    {
      prop: "selection",
      type: "LeoAssistSelection | null",
      description:
        "Narrows Leo to a span of text. The run sees only that span and the bar splices the result back in, so a host never handles offsets. A collapsed range is ignored.",
    },
    {
      prop: "scopeLabel",
      type: "string",
      defaultValue: '"Selection"',
      description: "What the scope chip calls the narrowed span.",
    },
    {
      prop: "collapsible",
      type: "boolean",
      defaultValue: "false",
      description:
        "Renders a single Leo button until the user asks for the bar. Use it wherever a bar per field would be several bars at once.",
    },
    {
      prop: "open / onOpenChange",
      type: "boolean / (open: boolean) => void",
      description:
        "Controlled open state for the collapsible form. Leave unset and the bar owns it.",
    },
    {
      prop: "collapsedLabel",
      type: "string",
      defaultValue: '"Edit with Leo"',
      description:
        "Accessible name and tooltip for the collapsed circle. Say what Leo will do to this field, not what Leo is.",
    },
  ],
  ux: {
    job: "Write or change the text in front of me in one gesture, and get back to what it was just as fast.",
    principles: ["P3", "P5", "P6", "P7", "P9", "P12", "P15", "P16", "P20"],
    modernReferences: [
      "Notion AI inline (M5, M6, M12)",
      "Linear command AI (M2, M6)",
    ],
    whenToUse: [
      "Long-text fields where the user writes prose: descriptions, notes, question stems.",
      "When the likely edits are predictable enough to offer as overflow actions.",
    ],
    whenNotToUse: [
      "Finding records. Use ModeSwitchSearchBar or DedicatedSearchUrlComposer.",
      "Open-ended conversation across a whole page. Use Ask Leo.",
      "Fields under audit or approval, where a silent rewrite would break the record of who wrote what.",
    ],
  },
  guidelines: {
    do: [
      "Keep quick actions in the overflow so the instruction keeps its width. Undo and redo follow More once Leo has written.",
      "Give the empty state its own actions, so an untouched field offers a draft rather than a rewrite of nothing.",
      "Keep the host as the owner of text, so the field and the bar never disagree.",
      "Lock the surrounding fields from onRunningChange, so nothing is edited underneath a run in flight.",
      "For a group, serialise the fields into text and parse them back, so one undo restores the whole group. Include the structured fields, so a run can set a select or a checkbox alongside the prose.",
      "Leave actions off a mixed group. Across a select, a radio set, and two paragraphs there is no single likely edit worth offering.",
      "Reject onRun on failure. The bar leaves the field untouched and shows the error inline.",
      "Collapse the bar in any form with more than one assisted field. Two open bars read as two competing primary actions.",
      "Say what the collapsed trigger will do to this field. Write with Leo on an empty field, Edit with Leo on a written one. The circle carries no label, so that sentence lives in its accessible name and tooltip.",
      "Give the selection chip a keyboard equal. ⌘⌥L opens the bar on the current selection, so a chip raised by a drag is never the only way in.",
      "Give every action its own icon. In the overflow the glyph is read before the label, so two actions sharing one are two actions read twice.",
    ],
    dont: [
      "Do not confirm a write with a toast. Undo sits in the pill after More.",
      "Do not stretch the bar to the width of the field it edits. It carries its own width so a narrow field cannot squeeze the instruction.",
      "Do not track user typing in the undo stack. It tracks Leo only.",
      "Do not put a named quick action in the pill. Polish and the rest belong in More.",
      "Do not derive the content state from anything but text. A second source will drift.",
      "Do not raise the selection chip on every selectionchange. It waits for the drag to settle, or it chases the cursor across the sentence being selected.",
      "Do not let the selection chip take focus. Focus leaves the textarea, the highlight disappears, and the gesture undoes itself.",
      "Do not keep a scope across an edit. Once the user types, the offsets point at the wrong span, so the scope is dropped.",
    ],
  },
  extraImports: [
    { label: "LeoAssistAction", path: "@/components/leo-assist-bar" },
    { label: "LeoAssistRequest", path: "@/components/leo-assist-bar" },
    { label: "LeoAssistMode", path: "@/components/leo-assist-bar" },
    { label: "LeoAssistSelection", path: "@/components/leo-assist-bar" },
    { label: "LeoAssistField", path: "@/components/leo-assist-field" },
  ],
  relatedSlugs: ["ask-leo-composer", "mode-switch-search", "dedicated-search"],
}
